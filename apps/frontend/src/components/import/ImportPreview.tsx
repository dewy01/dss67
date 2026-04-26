import type { ImportResponse } from "../../api/dataset";
import {
  ColumnTransformPopover,
  type ColumnTransformHandlers,
} from "../transform/ColumnTransformPopover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type ImportPreviewProps = ColumnTransformHandlers & {
  data: ImportResponse;
  transformsDisabled: boolean;
};

export function ImportPreview({
  data,
  transformsDisabled,
  onEncode,
  onDiscretize,
  onNormalize,
  onRescale,
  onExtremes,
}: ImportPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          {data.rowCount} rows · {data.columnCount} columns
          {data.delimiter ? ` · delimiter ${data.delimiter}` : ""}
          {data.sheet ? ` · sheet ${data.sheet}` : ""}
          {data.datasetId ? ` · id ${data.datasetId}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {data.columns.map((column) => (
                  <th key={column} className="px-3 py-2 font-medium">
                    <ColumnTransformPopover
                      column={column}
                      disabled={transformsDisabled}
                      onEncode={onEncode}
                      onDiscretize={onDiscretize}
                      onNormalize={onNormalize}
                      onRescale={onRescale}
                      onExtremes={onExtremes}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  className="border-b border-border/70"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className="px-3 py-2"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      {data.extremes ? (
        <CardContent className="pt-0 text-xs text-muted-foreground">
          Extremes {data.extremes.percent}% — lowest:{" "}
          {Object.keys(data.extremes.lowest).length}, highest:{" "}
          {Object.keys(data.extremes.highest).length}
        </CardContent>
      ) : null}
    </Card>
  );
}
