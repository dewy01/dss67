from __future__ import annotations

from typing import Iterable


def _pick_delimiter(line: str) -> str:
    candidates = [
        (";", ";"),
        ("\t", "\t"),
        (" ", "whitespace"),
    ]
    best = (0, "whitespace")
    for token, label in candidates:
        count = line.count(token)
        if count > best[0]:
            best = (count, label)
    return best[1]


def _split_line(line: str, delimiter: str) -> list[str]:
    if delimiter == "whitespace":
        return [part for part in line.split()]
    return [part.strip() for part in line.split(delimiter)]


def _filtered_lines(text: str, comment_prefix: str) -> list[str]:
    lines: list[str] = []
    for raw in text.splitlines():
        if not raw.strip():
            continue
        if raw.lstrip().startswith(comment_prefix):
            continue
        lines.append(raw.rstrip("\n"))
    return lines


def _normalize_row(row: Iterable[str], width: int) -> list[str]:
    normalized = list(row)
    if len(normalized) < width:
        normalized.extend([""] * (width - len(normalized)))
    return normalized[:width]


def parse_text_dataset(
    *,
    text: str,
    delimiter: str,
    has_header: bool,
    comment_prefix: str,
) -> tuple[list[str], list[list[str]], str]:
    lines = _filtered_lines(text, comment_prefix)
    if not lines:
        return [], [], delimiter

    resolved_delimiter = delimiter
    if delimiter == "auto":
        resolved_delimiter = _pick_delimiter(lines[0])

    header: list[str] | None = None
    data_start = 0
    if has_header:
        header = _split_line(lines[0], resolved_delimiter)
        data_start = 1

    sample_line = lines[data_start] if data_start < len(lines) else lines[0]
    first_row = _split_line(sample_line, resolved_delimiter)
    column_count = len(header) if header else len(first_row)

    rows: list[list[str]] = []
    for raw in lines[data_start:]:
        row = _split_line(raw, resolved_delimiter)
        rows.append(_normalize_row(row, column_count))

    if not header:
        header = [f"col_{i + 1}" for i in range(column_count)]

    return header, rows, resolved_delimiter
