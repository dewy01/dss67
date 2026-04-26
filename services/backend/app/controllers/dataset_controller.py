from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..services.dataset_preview import build_preview
from ..services.excel_parser import parse_excel_dataset
from ..services.text_parser import parse_text_dataset

router = APIRouter(prefix="/dataset", tags=["dataset"])


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

    preview = build_preview(
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

    preview = build_preview(
        columns=columns,
        rows=rows,
        max_preview_rows=max_preview_rows,
    )
    preview["sheet"] = resolved_sheet
    return preview
