import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";

import { getBackendUrl } from "../api/client";
import {
  createDiscretizeMutationOptions,
  createEncodeMutationOptions,
  createExtremesMutationOptions,
  createImportDatasetMutationOptions,
  createNormalizeMutationOptions,
  createRescaleMutationOptions,
} from "../api/dataset";
import { ImportError } from "../components/import/ImportError";
import { ImportPreview } from "../components/import/ImportPreview";
import { AppNavbar } from "../components/layout/AppNavbar";
import { ScatterPlotPanel } from "../components/plots/ScatterPlotPanel";
import { useDatasetStore } from "../store/datasetStore";

export function ImportView() {
  const state = useDatasetStore((store) => store.importForm);
  const preview = useDatasetStore((store) => store.preview);
  const datasetId = useDatasetStore((store) => store.datasetId);
  const setPreview = useDatasetStore((store) => store.setPreview);
  const setDatasetId = useDatasetStore((store) => store.setDatasetId);

  const backendUrl = useMemo(() => getBackendUrl(), []);

  const importMutation = useMutation({
    ...createImportDatasetMutationOptions({
      file: state.file,
      sourceType: state.sourceType,
      hasHeader: state.hasHeader,
      delimiter: state.delimiter,
      commentPrefix: state.commentPrefix,
      sheetName: state.sheetName,
      maxPreviewRows: 50,
    }),
    onSuccess: (data) => {
      setPreview(data);
      setDatasetId(data.datasetId ?? null);
    },
  });

  const encodeMutation = useMutation({
    ...createEncodeMutationOptions(),
    onSuccess: (data) => setPreview(data),
  });

  const discretizeMutation = useMutation({
    ...createDiscretizeMutationOptions(),
    onSuccess: (data) => setPreview(data),
  });

  const normalizeMutation = useMutation({
    ...createNormalizeMutationOptions(),
    onSuccess: (data) => setPreview(data),
  });

  const rescaleMutation = useMutation({
    ...createRescaleMutationOptions(),
    onSuccess: (data) => setPreview(data),
  });

  const extremesMutation = useMutation({
    ...createExtremesMutationOptions(),
    onSuccess: (data) => setPreview(data),
  });

  const hasDataset = Boolean(datasetId);

  return (
    <div className="min-h-screen">
      <AppNavbar
        backendUrl={backendUrl}
        isSubmitting={importMutation.isPending}
        onSubmit={() => importMutation.mutate()}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-12">
        {importMutation.isError ? (
          <ImportError message={(importMutation.error as Error).message} />
        ) : null}
        {encodeMutation.isError ? (
          <ImportError message={(encodeMutation.error as Error).message} />
        ) : null}
        {discretizeMutation.isError ? (
          <ImportError message={(discretizeMutation.error as Error).message} />
        ) : null}
        {normalizeMutation.isError ? (
          <ImportError message={(normalizeMutation.error as Error).message} />
        ) : null}
        {rescaleMutation.isError ? (
          <ImportError message={(rescaleMutation.error as Error).message} />
        ) : null}
        {extremesMutation.isError ? (
          <ImportError message={(extremesMutation.error as Error).message} />
        ) : null}

        {preview ? (
          <>
            <ImportPreview
              data={preview}
              transformsDisabled={!hasDataset}
              onEncode={(column, mode) =>
                encodeMutation.mutate({
                  datasetId: datasetId ?? "",
                  columns: [column],
                  mode,
                })
              }
              onDiscretize={(column, bins) =>
                discretizeMutation.mutate({
                  datasetId: datasetId ?? "",
                  columns: [column],
                  bins,
                })
              }
              onNormalize={(column) =>
                normalizeMutation.mutate({
                  datasetId: datasetId ?? "",
                  columns: [column],
                })
              }
              onRescale={(column, a, b) =>
                rescaleMutation.mutate({
                  datasetId: datasetId ?? "",
                  columns: [column],
                  a,
                  b,
                })
              }
              onExtremes={(column, percent) =>
                extremesMutation.mutate({
                  datasetId: datasetId ?? "",
                  columns: [column],
                  percent,
                  maxPreviewRows: 50,
                })
              }
            />

            <ScatterPlotPanel columns={preview.columns} rows={preview.rows} />
          </>
        ) : null}
      </div>
    </div>
  );
}
