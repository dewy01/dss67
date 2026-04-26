from __future__ import annotations

from typing import Iterable


def build_preview(
    *,
    columns: list[str],
    rows: Iterable[Iterable[str]],
    max_preview_rows: int,
) -> dict:
    full_rows = [list(row) for row in rows]
    preview = full_rows[:max_preview_rows]

    return {
        "columns": columns,
        "rows": preview,
        "rowCount": len(full_rows),
        "columnCount": len(columns),
    }
