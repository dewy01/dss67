import { useMutation } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { getBackendUrl } from "../../api/client";
import { createImportDatasetMutationOptions } from "../../api/dataset";
import { useI18n } from "../../i18n/I18nProvider";
import { useDatasetStore } from "../../store/datasetStore";
import { ImportForm } from "../import/ImportForm";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export type AppView = "import" | "classification" | "hyperplane";

type LayoutProps = {
  children: ReactNode;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
};

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const { language, setLanguage, t } = useI18n();
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
              {t("nav.title")}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onViewChange("import")}
              variant={currentView !== "import" ? "ghost" : "default"}
            >
              {t("nav.importData")}
            </Button>
            <Button
              onClick={() => onViewChange("classification")}
              variant={currentView !== "classification" ? "ghost" : "default"}
            >
              {t("nav.classification")}
            </Button>
            <Button
              onClick={() => onViewChange("hyperplane")}
              variant={currentView !== "hyperplane" ? "ghost" : "default"}
            >
              {t("nav.hyperplane")}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">
                {t("nav.language")}
              </label>
              <select
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value as "en" | "pl")
                }
                className="h-9 rounded-md border border-border bg-transparent px-2 text-sm"
              >
                <option value="en">{t("lang.en")}</option>
                <option value="pl">{t("lang.pl")}</option>
              </select>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">{t("nav.importDataset")}</Button>
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
