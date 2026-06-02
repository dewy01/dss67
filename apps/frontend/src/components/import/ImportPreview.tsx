import type { ImportResponse } from "../../api/dataset";
import { useI18n } from "../../i18n/I18nProvider";
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
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("import.previewTitle")}</CardTitle>
        <CardDescription>
          {t("import.rows")}: {data.rowCount} · {t("import.columns")}:{" "}
          {data.columnCount}
          {data.delimiter
            ? ` · ${t("import.delimiter")}: ${data.delimiter}`
            : ""}
          {data.sheet ? ` · ${t("import.sheetName")}: ${data.sheet}` : ""}
          {data.datasetId
            ? ` · ${t("import.datasetId")}: ${data.datasetId}`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="min-w-full text-left text-sm">
              <thead className=" sticky top-0 z-10 bg-background border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
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
                    {row.map((cell, cellIndex) => {
                      const columnName = data.columns[cellIndex];
                      const isLow = Boolean(
                        data.extremes?.lowest?.[columnName]?.includes(rowIndex),
                      );
                      const isHigh = Boolean(
                        data.extremes?.highest?.[columnName]?.includes(
                          rowIndex,
                        ),
                      );

                      let cellClass = "px-3 py-2";
                      if (isLow) {
                        cellClass +=
                          " font-semibold text-amber-700 bg-amber-50";
                      }
                      if (isHigh) {
                        cellClass += " font-semibold text-rose-700 bg-rose-50";
                      }

                      return (
                        <td
                          key={`cell-${rowIndex}-${cellIndex}`}
                          className={cellClass}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
      {data.extremes ? (
        <CardContent className="pt-0 text-xs text-muted-foreground">
          {t("import.extremes", {
            percent: data.extremes.percent,
            lowest: Object.keys(data.extremes.lowest).length,
            highest: Object.keys(data.extremes.highest).length,
          })}
        </CardContent>
      ) : null}
    </Card>
  );
}
