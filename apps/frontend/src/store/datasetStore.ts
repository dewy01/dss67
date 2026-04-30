import { create } from "zustand";

import type { ImportResponse } from "../api/dataset";
import type { ImportFormState } from "../components/import/ImportForm";

const initialFormState: ImportFormState = {
  file: null,
  sourceType: "text",
  hasHeader: false,
  delimiter: "auto",
  commentPrefix: "#",
  sheetName: "",
};

type DatasetState = {
  importForm: ImportFormState;
  preview: ImportResponse | null;
  datasetId: string | null;
  setImportForm: (next: ImportFormState) => void;
  setPreview: (next: ImportResponse | null) => void;
  setDatasetId: (next: string | null) => void;
  resetImportForm: () => void;
};

export const useDatasetStore = create<DatasetState>((set) => ({
  importForm: initialFormState,
  preview: null,
  datasetId: null,
  setImportForm: (next) => set({ importForm: next }),
  setPreview: (next) => set({ preview: next }),
  setDatasetId: (next) => set({ datasetId: next }),
  resetImportForm: () => set({ importForm: initialFormState }),
}));
