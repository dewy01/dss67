import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getBackendUrl } from "../api/client";
import { createImportDatasetMutationOptions } from "../api/dataset";
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

  const backendUrl = useMemo(() => getBackendUrl(), []);

  const importMutation = useMutation(
    createImportDatasetMutationOptions({
      file: state.file,
      sourceType: state.sourceType,
      hasHeader: state.hasHeader,
      delimiter: state.delimiter,
      commentPrefix: state.commentPrefix,
      sheetName: state.sheetName,
      maxPreviewRows: 50,
    }),
  );

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

        {importMutation.data ? (
          <ImportPreview data={importMutation.data} />
        ) : null}
      </div>
    </div>
  );
}
