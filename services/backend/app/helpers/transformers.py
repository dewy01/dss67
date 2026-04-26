from __future__ import annotations

from collections import defaultdict
from typing import Any


def _as_float(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if value is None:
        return None
    text = str(value).strip()
    if text == "":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def detect_numeric_columns(rows: list[list[Any]], columns: list[str]) -> list[int]:
    numeric_indices: list[int] = []
    for idx, _ in enumerate(columns):
        is_numeric = True
        for row in rows:
            value = row[idx] if idx < len(row) else None
            if _as_float(value) is None:
                is_numeric = False
                break
        if is_numeric:
            numeric_indices.append(idx)
    return numeric_indices


def encode_categorical(
    rows: list[list[Any]],
    columns: list[str],
    mode: str,
    column_indices: list[int],
) -> tuple[list[list[Any]], dict[str, dict[str, int]]]:
    mappings: dict[str, dict[str, int]] = {}
    updated_rows = [list(row) for row in rows]

    for idx in column_indices:
        values = [str(row[idx]) if idx < len(row) else "" for row in rows]
        if mode == "alphabetical":
            unique = sorted({value for value in values})
        else:
            seen: list[str] = []
            for value in values:
                if value not in seen:
                    seen.append(value)
            unique = seen

        mapping = {value: i + 1 for i, value in enumerate(unique)}
        mappings[columns[idx]] = mapping
        for row in updated_rows:
            row[idx] = mapping.get(str(row[idx]), 0)

    return updated_rows, mappings


def discretize_numeric(
    rows: list[list[Any]],
    columns: list[str],
    bins: int,
    column_indices: list[int],
) -> list[list[Any]]:
    if bins < 1:
        raise ValueError("Bins must be >= 1")

    updated_rows = [list(row) for row in rows]

    for idx in column_indices:
        values = [_as_float(row[idx]) for row in rows]
        numeric_values = [v for v in values if v is not None]
        if not numeric_values:
            continue
        min_val = min(numeric_values)
        max_val = max(numeric_values)
        if min_val == max_val:
            for row in updated_rows:
                row[idx] = 1
            continue

        width = (max_val - min_val) / bins
        for row, value in zip(updated_rows, values):
            if value is None:
                row[idx] = 0
                continue
            if value == max_val:
                row[idx] = bins
                continue
            bucket = int((value - min_val) / width) + 1
            row[idx] = max(1, min(bins, bucket))

    return updated_rows


def normalize_zscore(
    rows: list[list[Any]],
    columns: list[str],
    column_indices: list[int],
) -> list[list[Any]]:
    updated_rows = [list(row) for row in rows]

    for idx in column_indices:
        values = [_as_float(row[idx]) for row in rows]
        numeric_values = [v for v in values if v is not None]
        if not numeric_values:
            continue
        mean = sum(numeric_values) / len(numeric_values)
        variance = sum((v - mean) ** 2 for v in numeric_values) / len(numeric_values)
        std = variance ** 0.5
        for row, value in zip(updated_rows, values):
            if value is None:
                row[idx] = 0
            elif std == 0:
                row[idx] = 0
            else:
                row[idx] = (value - mean) / std

    return updated_rows


def rescale_range(
    rows: list[list[Any]],
    columns: list[str],
    column_indices: list[int],
    a: float,
    b: float,
) -> list[list[Any]]:
    updated_rows = [list(row) for row in rows]

    for idx in column_indices:
        values = [_as_float(row[idx]) for row in rows]
        numeric_values = [v for v in values if v is not None]
        if not numeric_values:
            continue
        min_val = min(numeric_values)
        max_val = max(numeric_values)
        if min_val == max_val:
            for row in updated_rows:
                row[idx] = a
            continue

        scale = (b - a) / (max_val - min_val)
        for row, value in zip(updated_rows, values):
            if value is None:
                row[idx] = a
            else:
                row[idx] = a + (value - min_val) * scale

    return updated_rows


def extremes_percent(
    rows: list[list[Any]],
    columns: list[str],
    column_indices: list[int],
    percent: float,
) -> dict[str, dict[str, list[int]]]:
    if percent <= 0:
        return {"lowest": {}, "highest": {}}

    result_low: dict[str, list[int]] = defaultdict(list)
    result_high: dict[str, list[int]] = defaultdict(list)

    for idx in column_indices:
        values = [(row_index, _as_float(row[idx])) for row_index, row in enumerate(rows)]
        numeric_values = [(i, v) for i, v in values if v is not None]
        if not numeric_values:
            continue
        numeric_values.sort(key=lambda pair: pair[1])
        count = max(1, int(len(numeric_values) * (percent / 100.0)))

        lowest = numeric_values[:count]
        highest = numeric_values[-count:]

        column_name = columns[idx]
        result_low[column_name] = [i for i, _ in lowest]
        result_high[column_name] = [i for i, _ in highest]

    return {
        "lowest": dict(result_low),
        "highest": dict(result_high),
    }
