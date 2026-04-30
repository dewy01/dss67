import { useDatasetStore } from "../../store/datasetStore";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export type ImportFormState = {
  file: File | null;
  sourceType: "text" | "excel";
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

export function ImportForm({
  backendUrl,
  isSubmitting,
  onSubmit,
}: ImportFormProps) {
  const state = useDatasetStore((store) => store.importForm);
  const setState = useDatasetStore((store) => store.setImportForm);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-2">
          <label className="text-sm font-medium">Dataset file</label>
          <Input
            type="file"
            accept={
              state.sourceType === "text" ? ".txt,.data,.csv" : ".xlsx,.xls"
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
          <label className="text-sm font-medium">Source type</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={state.sourceType}
            onChange={(event) => {
              const next = event.target.value as "text" | "excel";
              setState({
                ...state,
                sourceType: next,
                hasHeader: next === "excel" ? true : state.hasHeader,
              });
            }}
          >
            <option value="text">Text</option>
            <option value="excel">Excel</option>
          </select>
        </div>
      </div>

      {state.sourceType === "text" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Delimiter</label>
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
              <option value="auto">Auto detect</option>
              <option value=" ">Space</option>
              <option value="\t">Tab</option>
              <option value=";">Semicolon</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Comment prefix</label>
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
            <label className="text-sm font-medium">Sheet name</label>
            <Input
              value={state.sheetName}
              onChange={(event) =>
                setState({
                  ...state,
                  sheetName: event.target.value,
                })
              }
              placeholder="Leave blank for default sheet"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Header row</label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Excel assumes the first row is a header.
            </div>
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
          File contains header row
        </label>
        <div className="space-y-2" />
      </div>

      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-muted-foreground">
          Backend: {backendUrl}
        </div>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Importing..." : "Import and preview"}
        </Button>
      </div>
    </div>
  );
}
