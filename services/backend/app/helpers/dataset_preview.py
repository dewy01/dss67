from __future__ import annotations

from typing import Iterable


def build_preview(
    *,
    dataset_id: str | None = None,
    columns: list[str],
    rows: Iterable[Iterable[str]],
    max_preview_rows: int | None = None,
) -> dict:
    full_rows = [list(row) for row in rows]
    preview_rows = full_rows if max_preview_rows is None else full_rows[:max_preview_rows]

    preview: dict = {
        "datasetId": dataset_id,
        "columns": columns,
        "rows": preview_rows,
        "rowCount": len(full_rows),
        "columnCount": len(columns),
    }
    return preview
