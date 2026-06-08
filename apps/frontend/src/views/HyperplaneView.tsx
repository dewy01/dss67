import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  createDownloadTransformedDataMutationOptions,
  createHyperplaneClassifyMutationOptions,
} from "../api/hyperplane";
import { HyperplanePartitionPlot } from "../components/hyperplane/HyperplanePartitionPlot";
import { ImportError } from "../components/import/ImportError";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useI18n } from "../i18n/I18nProvider";
import { useDatasetStore } from "../store/datasetStore";
import type { HyperplaneResponse } from "../types/hyperplane";

export function HyperplaneView() {
  const { t } = useI18n();
  const [classColumnIndex, setClassColumnIndex] = useState<number>(0);
  const [maxIterations, setMaxIterations] = useState<number>(400);
  const [minSeparation, setMinSeparation] = useState<number>(0.0);
  const [results, setResults] = useState<HyperplaneResponse | null>(null);

  const preview = useDatasetStore((store) => store.preview);
  const datasetId = useDatasetStore((store) => store.datasetId);

  const classifyMutation = useMutation({
    ...createHyperplaneClassifyMutationOptions(),
    onSuccess: (data) => setResults(data),
  });

  const downloadMutation = useMutation({
    ...createDownloadTransformedDataMutationOptions(),
    onSuccess: (data) => {
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        `data:text/csv;charset=utf-8,${encodeURIComponent(data.csv_data)}`,
      );
      element.setAttribute("download", data.filename);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
  });

  const hasDataset = Boolean(datasetId && preview);

  const handleClassify = () => {
    if (!datasetId) return;

    classifyMutation.mutate({
      datasetId,
      classColumnIndex,
      maxIterations,
      minSeparation,
    });
  };

  const handleDownload = () => {
    if (!datasetId) return;

    downloadMutation.mutate({
      datasetId,
      classColumnIndex,
      maxIterations,
      minSeparation,
    });
  };

  if (!hasDataset) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-center">
        <ImportError message={t("import.datasetRequired")} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-12">
      <Card>
        <CardHeader>
          <CardTitle>{t("hyperplane.title")}</CardTitle>
          <CardDescription>{t("hyperplane.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("classification.classColumn")}
            </label>
            <select
              value={classColumnIndex}
              onChange={(e) => setClassColumnIndex(parseInt(e.target.value))}
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
            >
              {preview?.columns.map((col, idx) => (
                <option key={idx} value={idx}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("hyperplane.maxHyperplanes", { count: maxIterations })}
            </label>
            <input
              type="range"
              min="1"
              max="400"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("hyperplane.minSeparation", {
                value: minSeparation.toFixed(2),
              })}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={minSeparation}
              onChange={(e) => setMinSeparation(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {/* {t("hyperplane.minSeparationHint")} */}
            </p>
          </div>

          <Button
            onClick={handleClassify}
            disabled={classifyMutation.isPending}
            className="w-full"
          >
            {classifyMutation.isPending
              ? t("hyperplane.classifying")
              : t("hyperplane.run")}
          </Button>
        </CardContent>
      </Card>

      {classifyMutation.isError && (
        <ImportError message={(classifyMutation.error as Error).message} />
      )}

      {results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("hyperplane.resultsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("partition.totalCuts")}
                  </p>
                  <p className="text-2xl font-bold">{results.totalCuts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("partition.separatedPoints")}
                  </p>
                  <p className="text-2xl font-bold">
                    {results.totalSeparatedPoints}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("hyperplane.linearSeparability")}
                  </p>
                  <p className="text-2xl font-bold">
                    {results.linearSeparability.is_separable
                      ? t("hyperplane.yes")
                      : t("hyperplane.no")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("hyperplane.svmAccuracy")}
                  </p>
                  <p className="text-2xl font-bold">
                    {(results.linearSeparability.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {/* {t("hyperplane.method")} */}
                  </p>
                  {/* <p className="text-sm">{results.linearSeparability.method}</p> */}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("partition.axisSummary")}</CardTitle>
              <CardDescription>{t("partition.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        {t("partition.axis")}
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        {t("partition.cuts")}
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        {t("partition.separatedPoints")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.axisStatistics.map((item) => (
                      <tr key={item.axis} className="border-t border-border">
                        <td className="px-3 py-2">{item.axis_name}</td>
                        <td className="px-3 py-2 font-medium">{item.cuts}</td>
                        <td className="px-3 py-2">{item.separated_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {results.cutHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("partition.cutHistory")}</CardTitle>
                <CardDescription>{t("partition.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.cutHistory.map((cut) => (
                    <div
                      key={cut.step}
                      className="rounded border border-border bg-muted/50 p-3 text-sm"
                    >
                      <div className="font-medium">
                        {`${t("partition.step")} ${cut.step}: ${cut.axis_name} ${cut.direction === "positive" ? ">=" : "<"} ${cut.threshold.toFixed(4)}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("partition.separatedOf", {
                          separated: cut.separated_points,
                          remaining: cut.remaining_points,
                          percent: (cut.separated_ratio * 100).toFixed(1),
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {results.hyperplanes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("hyperplane.separatingTitle")}</CardTitle>
                <CardDescription>
                  {t("hyperplane.separatingDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.hyperplanes.map((hp, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-border bg-muted/50 p-3 text-sm"
                    >
                      <p className="font-mono">
                        Hyperplane {idx + 1}: {hp.axis_name}{" "}
                        {hp.direction === "positive" ? "≥" : "<"}{" "}
                        {hp.threshold.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("hyperplane.axisDirection", {
                          axis: hp.axis,
                          direction: hp.direction,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("hyperplane.transformedTitle")}</CardTitle>
              <CardDescription>
                {t("hyperplane.transformedRows", {
                  rows: results.transformedData.length,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="border-r border-border px-3 py-2 text-left font-medium">
                        {t("hyperplane.binaryVector")}
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        {t("hyperplane.originalClass")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.transformedData.slice(0, 20).map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-border hover:bg-muted/50"
                      >
                        <td className="border-r border-border px-3 py-2 font-mono text-xs">
                          {row[0]}
                        </td>
                        <td className="px-3 py-2">{row[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.transformedData.length > 20 && (
                  <div className="bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">
                    {t("partition.showing", {
                      rows: results.transformedData.length,
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleDownload}
            disabled={downloadMutation.isPending}
            variant="outline"
            className="w-full"
          >
            {downloadMutation.isPending
              ? t("hyperplane.generatingCsv")
              : t("hyperplane.downloadCsv")}
          </Button>

          {downloadMutation.isError && (
            <ImportError message={(downloadMutation.error as Error).message} />
          )}

          {preview?.columns.length && preview?.columns.length >= 2 && (
            <HyperplanePartitionPlot
              columns={preview?.columns ?? []}
              rows={preview?.rows ?? []}
              classColumnIndex={classColumnIndex}
              results={results}
            />
          )}
        </>
      )}
    </div>
  );
}
