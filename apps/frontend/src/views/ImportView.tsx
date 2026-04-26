import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getBackendUrl } from "../api/client";
import {
  createDiscretizeMutationOptions,
  createEncodeMutationOptions,
  createExtremesMutationOptions,
  createImportDatasetMutationOptions,
  createNormalizeMutationOptions,
  createRescaleMutationOptions,
  type ImportResponse,
} from "../api/dataset";
import { ImportError } from "../components/import/ImportError";
import {
  ImportForm,
  type ImportFormState,
} from "../components/import/ImportForm";
import { ImportPreview } from "../components/import/ImportPreview";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const initialState: ImportFormState = {
  file: null,
  sourceType: "text",
  hasHeader: false,
  delimiter: "auto",
  commentPrefix: "#",
  sheetName: "",
};

export function ImportView() {
  const [state, setState] = useState<ImportFormState>(initialState);
  const [preview, setPreview] = useState<ImportResponse | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);

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
    <div className="min-h-screen px-6 py-10 md:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">
            Module 1 · Data Ingestion
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Decision Support Studio
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            Upload a raw text dataset and preview the parsed output. Supported
            separators: space, tab, or semicolon. Lines starting with a comment
            marker are ignored.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Import dataset</CardTitle>
            <CardDescription>
              Files are processed by the FastAPI backend and returned as a
              preview table.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <ImportForm
              state={state}
              backendUrl={backendUrl}
              isSubmitting={importMutation.isPending}
              onSubmit={() => importMutation.mutate()}
              onChange={setState}
            />
          </div>
        </Card>

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
        ) : null}
      </div>
    </div>
  );
}
