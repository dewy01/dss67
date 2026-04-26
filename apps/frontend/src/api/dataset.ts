import { apiFetch } from "./client";

export type ImportResponse = {
  datasetId?: string;
  columns: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
  delimiter?: string;
  sheet?: string;
  mappings?: Record<string, Record<string, number>>;
  extremes?: {
    percent: number;
    lowest: Record<string, number[]>;
    highest: Record<string, number[]>;
  };
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

export type TransformColumns = {
  datasetId: string;
  columns?: string[];
};

export type EncodeParams = TransformColumns & {
  mode: "alphabetical" | "appearance";
};

export type DiscretizeParams = TransformColumns & {
  bins: number;
};

export type NormalizeParams = TransformColumns;

export type RescaleParams = TransformColumns & {
  a: number;
  b: number;
};

export type ExtremesParams = TransformColumns & {
  percent: number;
  maxPreviewRows?: number;
};

export function createEncodeMutationOptions() {
  return {
    mutationFn: (params: EncodeParams) =>
      apiFetch<ImportResponse>(`/dataset/${params.datasetId}/encode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: params.mode,
          columns: params.columns,
        }),
      }),
  };
}

export function createDiscretizeMutationOptions() {
  return {
    mutationFn: (params: DiscretizeParams) =>
      apiFetch<ImportResponse>(`/dataset/${params.datasetId}/discretize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bins: params.bins,
          columns: params.columns,
        }),
      }),
  };
}

export function createNormalizeMutationOptions() {
  return {
    mutationFn: (params: NormalizeParams) =>
      apiFetch<ImportResponse>(`/dataset/${params.datasetId}/normalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: params.columns,
        }),
      }),
  };
}

export function createRescaleMutationOptions() {
  return {
    mutationFn: (params: RescaleParams) =>
      apiFetch<ImportResponse>(`/dataset/${params.datasetId}/rescale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          a: params.a,
          b: params.b,
          columns: params.columns,
        }),
      }),
  };
}

export function createExtremesMutationOptions() {
  return {
    mutationFn: (params: ExtremesParams) =>
      apiFetch<ImportResponse>(`/dataset/${params.datasetId}/extremes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          percent: params.percent,
          max_preview_rows: params.maxPreviewRows ?? 50,
          columns: params.columns,
        }),
      }),
  };
}

export function createDatasetPreviewQueryOptions(
  datasetId: string,
  maxPreviewRows = 50,
) {
  return {
    queryKey: ["dataset", datasetId, "preview", maxPreviewRows],
    queryFn: () =>
      apiFetch<ImportResponse>(
        `/dataset/${datasetId}/preview?max_preview_rows=${maxPreviewRows}`,
      ),
    enabled: Boolean(datasetId),
  };
}
