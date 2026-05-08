import { useMutation } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { getBackendUrl } from "../../api/client";
import { createImportDatasetMutationOptions } from "../../api/dataset";
import { useDatasetStore } from "../../store/datasetStore";
import { ImportForm } from "../import/ImportForm";
import { Button } from "../ui/button";
import { CardDescription } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export type AppView = "import" | "classification" | "hyperplane";

type LayoutProps = {
  children: ReactNode;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
};

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const backendUrl = useMemo(() => getBackendUrl(), []);
  const state = useDatasetStore((store) => store.importForm);
  const setPreview = useDatasetStore((store) => store.setPreview);
  const setDatasetId = useDatasetStore((store) => store.setDatasetId);

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

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-card/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-8xl flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between md:px-12">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold md:text-3xl">
              Decision Support Studio
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onViewChange("import")}
              variant={currentView !== "import" ? "ghost" : "default"}
            >
              Import Data
            </Button>
            <Button
              onClick={() => onViewChange("classification")}
              variant={currentView !== "classification" ? "ghost" : "default"}
            >
              Classification
            </Button>
            <Button
              onClick={() => onViewChange("hyperplane")}
              variant={currentView !== "hyperplane" ? "ghost" : "default"}
            >
              Hyperplane Classifier
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CardDescription className="text-sm">
              Upload a dataset to refresh the preview.
            </CardDescription>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Import dataset</Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[420px]">
                <ImportForm
                  backendUrl={backendUrl}
                  isSubmitting={importMutation.isPending}
                  onSubmit={() => importMutation.mutate()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
