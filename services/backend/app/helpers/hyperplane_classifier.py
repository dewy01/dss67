"""
Axis-aligned hyperplane classifier - recursive space partitioning algorithm.
Finds separating hyperplanes parallel to coordinate axes, transforms data to binary vector space.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np


@dataclass
class Hyperplane:
    """Represents an axis-aligned hyperplane."""
    axis: int  # Which axis (column index)
    threshold: float  # The threshold value
    direction: str  # "positive" or "negative" - which side gets 1 in binary vector


@dataclass
class RegionInfo:
    """Information about a region after partitioning."""
    binary_vector: Tuple[int, ...]  # Binary representation of the region
    class_label: str  # Most common class in this region
    indices: List[int]  # Original indices of points in this region


class HyperplaneClassifier:
    """Axis-aligned hyperplane classifier for space partitioning and binary encoding."""

    def __init__(self, dataset_id: str, class_column_index: int):
        self.dataset_id = dataset_id
        self.class_column_index = class_column_index
        self.dataset = None
        self.X = None
        self.y = None
        self.hyperplanes: List[Hyperplane] = []
        self.binary_mapping: Dict[int, Tuple[int, ...]] = {}  # Original index -> binary vector
        self.region_classes: Dict[Tuple[int, ...], str] = {}  # Binary vector -> class
        self.axis_cut_counts: Dict[int, int] = {}
        self.axis_separated_points: Dict[int, int] = {}
        self.cut_history: List[Dict[str, Any]] = []
        self._load_dataset()

    def _load_dataset(self):
        """Load and prepare dataset."""
        from app.helpers.dataset_store import data_store
        
        self.dataset = data_store.get(self.dataset_id)
        if not self.dataset:
            raise ValueError(f"Dataset {self.dataset_id} not found")

        data = self.dataset.rows
        if not data:
            raise ValueError("Dataset is empty")

        # Convert to numpy array
        data_array = self._parse_data_array(data)

        # Separate features and target
        if self.class_column_index == -1:
            self.class_column_index = len(data_array[0]) - 1

        self.X = np.delete(data_array, self.class_column_index, axis=1).astype(float)
        self.y = data_array[:, self.class_column_index].astype(str)

    def _parse_data_array(self, data: List[List[str]]) -> np.ndarray:
        """Convert string data to numpy array."""
        parsed_data = []
        for row in data:
            parsed_row = []
            for value in row:
                try:
                    parsed_row.append(float(value))
                except (ValueError, TypeError):
                    parsed_row.append(value)
            parsed_data.append(parsed_row)
        return np.array(parsed_data, dtype=object)

    def classify(self, max_iterations: int = 100, min_separation: float = 0.1) -> Dict[str, Any]:
        """
        Recursively partition space using axis-aligned hyperplanes.
        
        Args:
            max_iterations: Maximum number of hyperplanes to find
            min_separation: Minimum fraction of points to separate (0.0-1.0)
        
        Returns:
            Dictionary with results: transformed_data, hyperplanes, separability
        """
        n_samples = len(self.X)
        remaining_indices = set(range(n_samples))
        self.hyperplanes = []
        self.binary_mapping = {i: tuple() for i in range(n_samples)}
        self.axis_cut_counts = {axis: 0 for axis in range(self.X.shape[1])}
        self.axis_separated_points = {axis: 0 for axis in range(self.X.shape[1])}
        self.cut_history = []

        iteration = 0
        while remaining_indices and iteration < max_iterations:
            iteration += 1
            best_hyperplane, separated_indices = self._find_best_hyperplane(remaining_indices)

            if best_hyperplane is None or len(separated_indices) < max(1, int(len(remaining_indices) * min_separation)):
                break

            separated_count = len(separated_indices)
            separated_ratio = separated_count / len(remaining_indices)
            axis = best_hyperplane.axis
            self.axis_cut_counts[axis] += 1
            self.axis_separated_points[axis] += separated_count
            self.cut_history.append(
                {
                    "step": iteration,
                    "axis": int(axis),
                    "axis_name": self.dataset.columns[axis] if axis < len(self.dataset.columns) else f"attr_{axis}",
                    "threshold": float(best_hyperplane.threshold),
                    "direction": best_hyperplane.direction,
                    "separated_points": separated_count,
                    "remaining_points": len(remaining_indices),
                    "separated_ratio": float(separated_ratio),
                }
            )

            # Extend the binary vector for every point so all vectors keep the same length.
            separated_set = set(separated_indices)
            for idx in range(n_samples):
                current_vector = self.binary_mapping[idx]
                self.binary_mapping[idx] = current_vector + (1 if idx in separated_set else 0,)

            self.hyperplanes.append(best_hyperplane)
            remaining_indices -= separated_indices

        # Assign the dominant class for every binary region.
        region_label_counts: Dict[Tuple[int, ...], Dict[str, int]] = {}
        for idx, binary_vec in self.binary_mapping.items():
            labels = region_label_counts.setdefault(binary_vec, {})
            label = str(self.y[idx])
            labels[label] = labels.get(label, 0) + 1

        for binary_vec, labels in region_label_counts.items():
            self.region_classes[binary_vec] = max(labels.items(), key=lambda item: (item[1], item[0]))[0]

        # Build transformed dataset
        transformed_data = self._build_transformed_data()
        linear_separability = self._check_linear_separability()
        axis_statistics = [
            {
                "axis": int(axis),
                "axis_name": self.dataset.columns[axis] if axis < len(self.dataset.columns) else f"attr_{axis}",
                "cuts": int(self.axis_cut_counts.get(axis, 0)),
                "separated_points": int(self.axis_separated_points.get(axis, 0)),
            }
            for axis in range(self.X.shape[1])
        ]

        return {
            "transformed_data": transformed_data,
            "hyperplanes": [self._hyperplane_to_dict(h) for h in self.hyperplanes],
            "binary_mapping": self.binary_mapping,
            "region_classes": self.region_classes,
            "linear_separability": linear_separability,
            "n_hyperplanes": len(self.hyperplanes),
            "total_cuts": len(self.hyperplanes),
            "total_separated_points": int(sum(self.axis_separated_points.values())),
            "axis_statistics": axis_statistics,
            "cut_history": self.cut_history,
        }

    def _find_best_hyperplane(self, remaining_indices: Set[int]) -> Tuple[Optional[Hyperplane], Set[int]]:
        """
        Find the best axis-aligned hyperplane that separates one class from others.
        Prefer pure cuts first, then fall back to the best mixed cut if needed.
        """
        best_hyperplane = None
        best_separated = set()
        best_score = (-1, -1, -1.0, -1)
        fallback_hyperplane = None
        fallback_separated = set()
        fallback_score = (-1, -1.0, -1)

        remaining_list = list(remaining_indices)
        if len(remaining_list) == 0:
            return None, set()

        # Try each axis (feature)
        for axis in range(self.X.shape[1]):
            feature_values = self.X[remaining_list, axis]

            # Try multiple thresholds
            unique_vals = np.unique(feature_values)
            thresholds = []

            # Add midpoints between consecutive values
            if len(unique_vals) > 1:
                for i in range(len(unique_vals) - 1):
                    thresholds.append((unique_vals[i] + unique_vals[i + 1]) / 2)

            # Also try values just below/above unique values
            thresholds.extend(unique_vals.tolist())

            for threshold in thresholds:
                for direction, mask in (
                    ("positive", feature_values >= threshold),
                    ("negative", feature_values < threshold),
                ):
                    separated_indices = set(np.array(remaining_list)[mask])

                    if len(separated_indices) == 0 or len(separated_indices) == len(remaining_list):
                        continue

                    # Calculate purity: how homogeneous is the separated region
                    separated_classes = [self.y[idx] for idx in separated_indices]
                    class_counts = {}
                    for cls in separated_classes:
                        class_counts[cls] = class_counts.get(cls, 0) + 1

                    max_count = max(class_counts.values())
                    purity = max_count / len(separated_indices)

                    # Prefer perfectly pure cuts first; if none exist, keep the best fallback.
                    if purity == 1.0:
                        score = (len(separated_indices), max_count, purity, -axis)
                        if score > best_score:
                            best_score = score
                            best_hyperplane = Hyperplane(axis=axis, threshold=threshold, direction=direction)
                            best_separated = separated_indices
                    else:
                        score = (max_count, purity, len(separated_indices))
                        if score > fallback_score:
                            fallback_score = score
                            fallback_hyperplane = Hyperplane(axis=axis, threshold=threshold, direction=direction)
                            fallback_separated = separated_indices

        if best_hyperplane is not None:
            return best_hyperplane, best_separated

        return fallback_hyperplane, fallback_separated

    def _build_transformed_data(self) -> List[List[Any]]:
        """Build dataset with binary vectors instead of original features."""
        result = []

        for idx in range(len(self.X)):
            binary_vec = self.binary_mapping[idx]
            binary_str = self._binary_vector_to_string(binary_vec)
            result.append([binary_str, str(self.y[idx])])

        return result

    def _check_linear_separability(self) -> Dict[str, Any]:
        """
        Check if transformed data (binary vectors) is linearly separable.
        Uses a simple approach: try to fit a linear classifier and check accuracy.
        """
        try:
            from sklearn.preprocessing import LabelEncoder
            from sklearn.svm import LinearSVC

            # Encode binary vectors to numeric space
            binary_vecs = np.array([
                np.array(list(v)) if v else np.array([0]) for v in self.binary_mapping.values()
            ])
            y_encoded = LabelEncoder().fit_transform(self.y)

            if len(np.unique(y_encoded)) < 2:
                return {"is_separable": True, "method": "single_class", "accuracy": 1.0}

            # Try linear SVM
            try:
                clf = LinearSVC(max_iter=10000, dual=False, random_state=42)
                clf.fit(binary_vecs, y_encoded)
                accuracy = clf.score(binary_vecs, y_encoded)
                return {
                    "is_separable": accuracy == 1.0,
                    "method": "linear_svm",
                    "accuracy": float(accuracy),
                }
            except Exception:
                # Fallback: check if any single binary position can separate classes
                for col_idx in range(binary_vecs.shape[1]):
                    col = binary_vecs[:, col_idx]
                    if len(np.unique(col)) > 1:
                        return {
                            "is_separable": True,
                            "method": "feature_exists",
                            "accuracy": 0.5,
                        }
                return {
                    "is_separable": False,
                    "method": "none",
                    "accuracy": 0.0,
                }

        except Exception as e:
            return {
                "is_separable": False,
                "method": "error",
                "error": str(e),
            }

    def _hyperplane_to_dict(self, hyperplane: Hyperplane) -> Dict[str, Any]:
        """Convert hyperplane to dictionary for serialization."""
        return {
            "axis": int(hyperplane.axis),
            "threshold": float(hyperplane.threshold),
            "direction": hyperplane.direction,
            "axis_name": self.dataset.columns[hyperplane.axis] if hyperplane.axis < len(self.dataset.columns) else f"attr_{hyperplane.axis}",
        }

    def _binary_vector_to_string(self, binary_vec: Tuple[int, ...]) -> str:
        """Convert a binary vector tuple to a stable string representation."""
        return "".join(map(str, binary_vec)) if binary_vec else "0"

    def get_transformed_csv_data(self) -> str:
        """Generate CSV string of transformed data."""
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(["binary_vector", "original_class"])

        # Data rows
        for idx in range(len(self.X)):
            binary_vec = self.binary_mapping[idx]
            binary_str = self._binary_vector_to_string(binary_vec)
            writer.writerow([binary_str, str(self.y[idx])])

        return output.getvalue()
