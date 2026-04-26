import { apiFetch } from "./client";

export type ImportResponse = {
  columns: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
  delimiter?: string;
  sheet?: string;
};

export type ImportParams = {
  file: File | null;
  sourceType: "text" | "excel";
  hasHeader: boolean;
  delimiter: string;
  commentPrefix: string;
  sheetName: string;
  maxPreviewRows?: number;
};

export function createImportDatasetMutationOptions(params: ImportParams) {
  return {
    mutationFn: async (): Promise<ImportResponse> => {
      if (!params.file) {
        throw new Error("Select a file first");
      }

      const formData = new FormData();
      formData.append("file", params.file);
      formData.append("has_header", String(params.hasHeader));
      formData.append("max_preview_rows", String(params.maxPreviewRows ?? 50));

      let endpoint = "/dataset/import-text";
      if (params.sourceType === "text") {
        formData.append("delimiter", params.delimiter);
        formData.append("comment_prefix", params.commentPrefix.trim() || "#");
      } else {
        endpoint = "/dataset/import-excel";
        if (params.sheetName.trim()) {
          formData.append("sheet_name", params.sheetName.trim());
        }
      }

      return apiFetch<ImportResponse>(endpoint, {
        method: "POST",
        body: formData,
      });
    },
  };
}
