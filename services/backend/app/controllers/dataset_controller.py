from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from ..helpers.dataset_preview import build_preview
from ..helpers.dataset_store import data_store
from ..helpers.excel_parser import parse_excel_dataset
from ..helpers.text_parser import parse_text_dataset
from ..helpers.transformers import (detect_numeric_columns, discretize_numeric,
                                    encode_categorical, extremes_percent,
                                    normalize_zscore, rescale_range)

router = APIRouter(prefix="/dataset", tags=["dataset"])


class ColumnSelection(BaseModel):
    columns: list[str] | None = None


class EncodeRequest(ColumnSelection):
    mode: str = "alphabetical"


class DiscretizeRequest(ColumnSelection):
    bins: int = 5


class NormalizeRequest(ColumnSelection):
    pass


class RescaleRequest(ColumnSelection):
    a: float = 0.0
    b: float = 1.0


class ExtremesRequest(ColumnSelection):
    percent: float = 5.0
    max_preview_rows: int = 50


@router.post("/import-text")
async def import_text_dataset(
    file: UploadFile = File(...),
    delimiter: str = Form("auto"),
    has_header: bool = Form(False),
    comment_prefix: str = Form("#"),
    max_preview_rows: int = Form(50),
) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="File is required")

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("utf-8", errors="replace")

    columns, rows, resolved_delimiter = parse_text_dataset(
        text=text,
        delimiter=delimiter,
        has_header=has_header,
        comment_prefix=comment_prefix,
    )

    dataset = data_store.create(columns=columns, rows=rows)

    preview = build_preview(
        dataset_id=dataset.dataset_id,
        columns=columns,
        rows=rows,
        max_preview_rows=max_preview_rows,
    )
    preview["delimiter"] = resolved_delimiter
    return preview


@router.post("/import-excel")
async def import_excel_dataset(
    file: UploadFile = File(...),
    sheet_name: str | None = Form(None),
    has_header: bool = Form(True),
    max_preview_rows: int = Form(50),
) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="File is required")

    content = await file.read()
    columns, rows, resolved_sheet = parse_excel_dataset(
        content=content,
        sheet_name=sheet_name,
        has_header=has_header,
    )

    dataset = data_store.create(columns=columns, rows=rows)

    preview = build_preview(
        dataset_id=dataset.dataset_id,
        columns=columns,
        rows=rows,
        max_preview_rows=max_preview_rows,
    )
    preview["sheet"] = resolved_sheet
    return preview


@router.get("/{dataset_id}/preview")
def get_preview(dataset_id: str, max_preview_rows: int = 50) -> dict:
    dataset = data_store.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return build_preview(
        dataset_id=dataset.dataset_id,
        columns=dataset.columns,
        rows=dataset.rows,
        max_preview_rows=max_preview_rows,
    )


@router.post("/{dataset_id}/encode")
def encode_dataset(dataset_id: str, request: EncodeRequest) -> dict:
    dataset = data_store.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    selected = _resolve_columns(
        columns=dataset.columns,
        rows=dataset.rows,
        selection=request.columns,
        numeric_only=False,
    )
    rows, mappings = encode_categorical(
        rows=dataset.rows,
        columns=dataset.columns,
        mode=request.mode,
        column_indices=selected,
    )
    data_store.update(dataset_id, rows)

    preview = build_preview(
        dataset_id=dataset_id,
        columns=dataset.columns,
        rows=rows,
        max_preview_rows=50,
    )
    preview["mappings"] = mappings
    return preview


@router.post("/{dataset_id}/discretize")
def discretize_dataset(dataset_id: str, request: DiscretizeRequest) -> dict:
    dataset = data_store.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    selected = _resolve_columns(
        columns=dataset.columns,
        rows=dataset.rows,
        selection=request.columns,
        numeric_only=True,
    )
    rows = discretize_numeric(
        rows=dataset.rows,
        columns=dataset.columns,
        bins=request.bins,
        column_indices=selected,
    )
    data_store.update(dataset_id, rows)

    return build_preview(
        dataset_id=dataset_id,
        columns=dataset.columns,
        rows=rows,
        max_preview_rows=50,
    )


@router.post("/{dataset_id}/normalize")
def normalize_dataset(dataset_id: str, request: NormalizeRequest) -> dict:
    dataset = data_store.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    selected = _resolve_columns(
        columns=dataset.columns,
        rows=dataset.rows,
        selection=request.columns,
        numeric_only=True,
    )
    rows = normalize_zscore(
        rows=dataset.rows,
        columns=dataset.columns,
        column_indices=selected,
    )
    data_store.update(dataset_id, rows)

    return build_preview(
        dataset_id=dataset_id,
        columns=dataset.columns,
        rows=rows,
        max_preview_rows=50,
    )


@router.post("/{dataset_id}/rescale")
def rescale_dataset(dataset_id: str, request: RescaleRequest) -> dict:
    dataset = data_store.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    selected = _resolve_columns(
        columns=dataset.columns,
        rows=dataset.rows,
        selection=request.columns,
        numeric_only=True,
    )
    rows = rescale_range(
        rows=dataset.rows,
        columns=dataset.columns,
        column_indices=selected,
        a=request.a,
        b=request.b,
    )
    data_store.update(dataset_id, rows)

    return build_preview(
        dataset_id=dataset_id,
        columns=dataset.columns,
        rows=rows,
        max_preview_rows=50,
    )


@router.post("/{dataset_id}/extremes")
def extremes_dataset(dataset_id: str, request: ExtremesRequest) -> dict:
    dataset = data_store.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    selected = _resolve_columns(
        columns=dataset.columns,
        rows=dataset.rows,
        selection=request.columns,
        numeric_only=True,
    )
    extremes = extremes_percent(
        rows=dataset.rows,
        columns=dataset.columns,
        column_indices=selected,
        percent=request.percent,
    )

    preview = build_preview(
        dataset_id=dataset_id,
        columns=dataset.columns,
        rows=dataset.rows,
        max_preview_rows=request.max_preview_rows,
    )
    preview["extremes"] = {
        "percent": request.percent,
        **extremes,
    }
    return preview


def _resolve_columns(
    *,
    columns: list[str],
    rows: list[list[object]],
    selection: list[str] | None,
    numeric_only: bool,
) -> list[int]:
    if selection:
        indices: list[int] = []
        for name in selection:
            if name in columns:
                indices.append(columns.index(name))
        return indices

    numeric_indices = detect_numeric_columns(rows, columns)
    if numeric_only:
        return numeric_indices

    return [idx for idx in range(len(columns)) if idx not in numeric_indices]
