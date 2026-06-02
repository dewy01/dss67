import { useI18n } from "../../i18n/I18nProvider";
import { useDatasetStore } from "../../store/datasetStore";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export type ImportFormState = {
  file: File | null;
  sourceType: "text" | "csv" | "excel";
  hasHeader: boolean;
  delimiter: string;
  commentPrefix: string;
  sheetName: string;
};

type ImportFormProps = {
  backendUrl: string;
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function ImportForm({ isSubmitting, onSubmit }: ImportFormProps) {
  const { t } = useI18n();
  const state = useDatasetStore((store) => store.importForm);
  const setState = useDatasetStore((store) => store.setImportForm);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("import.file")}</label>
          <Input
            type="file"
            accept={
              state.sourceType === "excel"
                ? ".xlsx,.xls"
                : state.sourceType === "csv"
                  ? ".csv"
                  : ".txt,.data,.csv"
            }
            onChange={(event) =>
              setState({
                ...state,
                file: event.target.files?.[0] ?? null,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("import.sourceType")}
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={state.sourceType}
            onChange={(event) => {
              const next = event.target.value as "text" | "csv" | "excel";
              setState({
                ...state,
                sourceType: next,
                delimiter:
                  next === "csv"
                    ? ","
                    : next === "excel"
                      ? state.delimiter
                      : state.delimiter,
                hasHeader: next === "excel" ? true : state.hasHeader,
              });
            }}
          >
            <option value="text">{t("import.source.text")}</option>
            <option value="csv">{t("import.source.csv")}</option>
            <option value="excel">{t("import.source.excel")}</option>
          </select>
        </div>
      </div>

      {state.sourceType === "excel" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("import.sheetName")}
            </label>
            <Input
              value={state.sheetName}
              onChange={(event) =>
                setState({
                  ...state,
                  sheetName: event.target.value,
                })
              }
              placeholder={t("import.sheetPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("import.headerRow")}
            </label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {t("import.excelHeaderHint")}
            </div>
          </div>
        </div>
      ) : state.sourceType === "csv" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("import.delimiter")}
            </label>
            <div className="flex h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
              {t("import.csvDelimiterHint")}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("import.commentPrefix")}
            </label>
            <Input
              value={state.commentPrefix}
              onChange={(event) =>
                setState({
                  ...state,
                  commentPrefix: event.target.value,
                })
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("import.delimiter")}
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={state.delimiter}
              onChange={(event) =>
                setState({
                  ...state,
                  delimiter: event.target.value,
                })
              }
            >
              <option value="auto">{t("import.delimiter.auto")}</option>
              <option value=" ">{t("import.delimiter.space")}</option>
              <option value="\t">{t("import.delimiter.tab")}</option>
              <option value=";">{t("import.delimiter.semicolon")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("import.commentPrefix")}
            </label>
            <Input
              value={state.commentPrefix}
              onChange={(event) =>
                setState({
                  ...state,
                  commentPrefix: event.target.value,
                })
              }
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            checked={state.hasHeader}
            onChange={(event) =>
              setState({
                ...state,
                hasHeader: event.target.checked,
              })
            }
          />
          {t("import.hasHeader")}
        </label>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? t("import.importing") : t("import.importAndPreview")}
        </Button>
      </div>

      {/* <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-muted-foreground">
          {t("import.backend")}: {backendUrl}
        </div>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? t("import.importing") : t("import.importAndPreview")}
        </Button>
      </div> */}
    </div>
  );
}
