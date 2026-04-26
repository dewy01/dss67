from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Any
from uuid import uuid4


@dataclass
class Dataset:
    dataset_id: str
    columns: list[str]
    rows: list[list[Any]]


class DatasetStore:
    def __init__(self) -> None:
        self._items: dict[str, Dataset] = {}
        self._lock = Lock()

    def create(self, columns: list[str], rows: list[list[Any]]) -> Dataset:
        dataset_id = uuid4().hex
        dataset = Dataset(dataset_id=dataset_id, columns=columns, rows=rows)
        with self._lock:
            self._items[dataset_id] = dataset
        return dataset

    def get(self, dataset_id: str) -> Dataset | None:
        with self._lock:
            return self._items.get(dataset_id)

    def update(self, dataset_id: str, rows: list[list[Any]]) -> Dataset | None:
        with self._lock:
            dataset = self._items.get(dataset_id)
            if not dataset:
                return None
            dataset.rows = rows
            return dataset


data_store = DatasetStore()
