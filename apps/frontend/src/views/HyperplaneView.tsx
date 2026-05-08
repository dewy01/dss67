import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  createDownloadTransformedDataMutationOptions,
  createHyperplaneClassifyMutationOptions,
} from "../api/hyperplane";
import { ImportError } from "../components/import/ImportError";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useDatasetStore } from "../store/datasetStore";
import type { HyperplaneResponse } from "../types/hyperplane";

export function HyperplaneView() {
  const [classColumnIndex, setClassColumnIndex] = useState<number>(0);
  const [maxIterations, setMaxIterations] = useState<number>(100);
  const [minSeparation, setMinSeparation] = useState<number>(0.1);
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
        <ImportError message="Please import a dataset first" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-12">
      <Card>
        <CardHeader>
          <CardTitle>Hyperplane Classifier - Space Partitioning</CardTitle>
          <CardDescription>
            Find axis-aligned separating hyperplanes and transform data to
            binary vector space
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Class Column (Decision Attribute)
            </label>
            <select
              value={classColumnIndex}
              onChange={(e) => setClassColumnIndex(parseInt(e.target.value))}
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
            >
              {preview?.columns.map((col, idx) => (
                <option key={idx} value={idx}>
                  {col} (index {idx})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Maximum Hyperplanes: {maxIterations}
            </label>
            <input
              type="range"
              min="1"
              max="200"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Minimum Separation: {minSeparation.toFixed(2)}
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
              Minimum fraction of points to separate in each iteration
            </p>
          </div>

          <Button
            onClick={handleClassify}
            disabled={classifyMutation.isPending}
            className="w-full"
          >
            {classifyMutation.isPending
              ? "Classifying..."
              : "Find Hyperplanes & Transform Data"}
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
              <CardTitle>Partitioning Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Hyperplanes Found
                  </p>
                  <p className="text-2xl font-bold">{results.nHyperplanes}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Linear Separability
                  </p>
                  <p className="text-2xl font-bold">
                    {results.linearSeparability.is_separable ? "✓ Yes" : "✗ No"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SVM Accuracy</p>
                  <p className="text-2xl font-bold">
                    {(results.linearSeparability.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="text-sm">{results.linearSeparability.method}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {results.hyperplanes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Separating Hyperplanes</CardTitle>
                <CardDescription>
                  Axis-aligned hyperplanes found in order
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
                        Hyperplane {idx + 1}: {hp.axis_name} ≥{" "}
                        {hp.threshold.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Axis {hp.axis}, direction: {hp.direction}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Transformed Dataset (Binary Vectors)</CardTitle>
              <CardDescription>
                {results.transformedData.length} rows transformed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="border-r border-border px-3 py-2 text-left font-medium">
                        Binary Vector
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Original Class
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
                    Showing 20 of {results.transformedData.length} rows
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
              ? "Generating CSV..."
              : "Download Transformed Data as CSV"}
          </Button>

          {downloadMutation.isError && (
            <ImportError message={(downloadMutation.error as Error).message} />
          )}
        </>
      )}
    </div>
  );
}
