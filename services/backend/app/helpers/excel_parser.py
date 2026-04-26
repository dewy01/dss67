from __future__ import annotations

from io import BytesIO
from typing import Any

import pandas as pd


def parse_excel_dataset(
    *,
    content: bytes,
    sheet_name: str | None,
    has_header: bool,
) -> tuple[list[str], list[list[str]], str]:
    header = 0 if has_header else None
    df = pd.read_excel(BytesIO(content), sheet_name=sheet_name, header=header)

    if not has_header:
        df.columns = [f"col_{i + 1}" for i in range(len(df.columns))]

    rows: list[list[str]] = []
    for row in df.itertuples(index=False, name=None):
        rows.append(["" if _is_nan(cell) else str(cell) for cell in row])

    resolved_sheet = sheet_name or "default"
    return list(df.columns), rows, resolved_sheet


def _is_nan(value: Any) -> bool:
    return value is None or (isinstance(value, float) and pd.isna(value))
