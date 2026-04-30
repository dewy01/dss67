"""
Classification engine implementing 5 different classification methods:
1. k-Nearest Neighbors (kNN)
2. Naive Bayes
3. Decision Tree
4. Support Vector Machine (SVM)
5. Random Forest
"""

from typing import List, Tuple, Dict, Any, Union
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import LeaveOneOut
from app.helpers.dataset_store import data_store


class ClassificationEngine:
    """Main classification engine supporting multiple algorithms."""

    def __init__(self, dataset_id: str, class_column_index: int):
        self.dataset_id = dataset_id
        self.class_column_index = class_column_index
        self.dataset = None
        self.X = None
        self.y = None
        self._load_dataset()

    def _load_dataset(self):
        """Load dataset and separate features from target."""
        self.dataset = data_store.get(self.dataset_id)
        if not self.dataset:
            raise ValueError(f"Dataset {self.dataset_id} not found")

        data = self.dataset.rows
        
        if not data:
            raise ValueError("Dataset is empty")

        data_array = self._parse_data_array(data)
        
        if self.class_column_index == -1:
            self.class_column_index = len(data_array[0]) - 1
        
        self.X = np.delete(data_array, self.class_column_index, axis=1)
        self.y = data_array[:, self.class_column_index].astype(str)

    def _parse_data_array(self, data: List[List[str]]) -> np.ndarray:
        """Convert string data to numpy array with numeric and string handling."""
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

    def _prepare_data_for_sklearn(
        self, X: np.ndarray, y: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for sklearn models: encode strings to numeric."""
        X_processed = np.zeros((X.shape[0], X.shape[1]))
        
        for col_idx in range(X.shape[1]):
            col = X[:, col_idx]
            try:
                X_processed[:, col_idx] = col.astype(float)
            except (ValueError, TypeError):
                unique_values = np.unique(col)
                encoding = {val: idx for idx, val in enumerate(unique_values)}
                X_processed[:, col_idx] = np.array([encoding[val] for val in col])
        
        unique_classes = np.unique(y)
        class_encoding = {cls: idx for idx, cls in enumerate(unique_classes)}
        self.class_encoding = class_encoding
        self.class_decoding = {idx: cls for cls, idx in class_encoding.items()}
        
        y_encoded = np.array([class_encoding[cls] for cls in y])
        
        return X_processed, y_encoded

    def assess_quality(self, method: str, params: Dict[str, Any]) -> Tuple[float, int, int]:
        """
        Assess classification quality using leave-one-out cross-validation.
        
        Returns: (accuracy, correct_count, total_count)
        """
        X_processed, y_encoded = self._prepare_data_for_sklearn(self.X, self.y)
        
        clf = self._create_classifier(method, params)
        
        loo = LeaveOneOut()
        correct_count = 0
        total_count = len(X_processed)
        
        for train_index, test_index in loo.split(X_processed):
            X_train, X_test = X_processed[train_index], X_processed[test_index]
            y_train, y_test = y_encoded[train_index], y_encoded[test_index]
            
            try:
                clf.fit(X_train, y_train)
                prediction = clf.predict(X_test)[0]
                if prediction == y_test[0]:
                    correct_count += 1
            except Exception:
                pass
        
        accuracy = correct_count / total_count if total_count > 0 else 0
        return accuracy, correct_count, total_count

    def classify(
        self, new_object: List[Union[str, float, int]], method: str, params: Dict[str, Any]
    ) -> Tuple[str, float]:
        """
        Classify a new object.
        
        Returns: (predicted_class, confidence)
        """
        new_object_array = np.array([self._convert_value(v) for v in new_object], dtype=object)
        new_object_array = new_object_array.reshape(1, -1)
        
        X_processed, y_encoded = self._prepare_data_for_sklearn(self.X, self.y)
        
        new_object_processed = np.zeros((1, X_processed.shape[1]))
        for col_idx in range(X_processed.shape[1]):
            if col_idx < len(new_object_array[0]):
                val = new_object_array[0, col_idx]
                try:
                    new_object_processed[0, col_idx] = float(val)
                except (ValueError, TypeError):
                    unique_values = np.unique(self.X[:, col_idx])
                    encoding = {v: i for i, v in enumerate(unique_values)}
                    new_object_processed[0, col_idx] = encoding.get(val, 0)
        
        clf = self._create_classifier(method, params)
        clf.fit(X_processed, y_encoded)
        
        prediction = clf.predict(new_object_processed)[0]
        
        confidence = 0.0
        if hasattr(clf, "predict_proba"):
            try:
                proba = clf.predict_proba(new_object_processed)[0]
                confidence = float(np.max(proba))
            except Exception:
                confidence = 1.0
        else:
            confidence = 1.0
        
        predicted_class = self.class_decoding.get(prediction, str(prediction))
        
        return predicted_class, confidence

    def _create_classifier(self, method: str, params: Dict[str, Any]):
        """Create a classifier instance based on method and parameters."""
        if method == "knn":
            return KNeighborsClassifier(
                n_neighbors=params.get("k", 3)
            )
        elif method == "naive-bayes":
            return GaussianNB(
                var_smoothing=params.get("smoothing", 1e-9)
            )
        elif method == "decision-tree":
            return DecisionTreeClassifier(
                max_depth=params.get("maxDepth", 5),
                min_samples_leaf=params.get("minSamples", 1),
                random_state=42
            )
        elif method == "svm":
            return SVC(
                kernel=params.get("kernel", "rbf"),
                C=params.get("C", 1),
                gamma=params.get("gamma", "scale"),
                probability=True,
                random_state=42
            )
        elif method == "random-forest":
            return RandomForestClassifier(
                n_estimators=params.get("nEstimators", 10),
                max_depth=params.get("maxDepth", 10),
                random_state=42
            )
        else:
            raise ValueError(f"Unknown classification method: {method}")

    def _convert_value(self, value: Union[str, float, int]) -> Union[str, float]:
        """Convert value to appropriate type."""
        if isinstance(value, (int, float)):
            return value
        
        if isinstance(value, str):
            try:
                return float(value)
            except ValueError:
                return value
        
        return value
