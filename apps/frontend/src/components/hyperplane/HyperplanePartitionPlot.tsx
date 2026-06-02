import Plotly from "plotly.js-dist-min";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import type { HyperplaneResponse } from "../../types/hyperplane";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type PlotlyTrace = Parameters<typeof Plotly.newPlot>[1][number];
type PlotlyLayout = NonNullable<Parameters<typeof Plotly.newPlot>[2]>;
type PlotShape = NonNullable<PlotlyLayout["shapes"]>[number];
type PlotAnnotation = NonNullable<PlotlyLayout["annotations"]>[number];
type PlotArtifacts = {
  traces: PlotlyTrace[];
  shapes: PlotShape[];
  annotations: PlotAnnotation[];
};

const parseNumber = (value: unknown) => {
  if (value === null || value === undefined) return Number.NaN;
  if (typeof value === "number")
    return Number.isFinite(value) ? value : Number.NaN;
  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) return Number.NaN;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const isNumericColumn = (rows: string[][], index: number) => {
  for (const row of rows) {
    if (Number.isNaN(parseNumber(row[index]))) {
      return false;
    }
  }
  return true;
};

type HyperplanePartitionPlotProps = {
  columns: string[];
  rows: string[][];
  classColumnIndex: number;
  results: HyperplaneResponse;
};

export function HyperplanePartitionPlot({
  columns,
  rows,
  classColumnIndex,
  results,
}: HyperplanePartitionPlotProps) {
  const { t } = useI18n();
  const plotRef = useRef<HTMLDivElement>(null);
  const numericColumns = useMemo(
    () =>
      columns.filter(
        (_, index) =>
          index !== classColumnIndex && isNumericColumn(rows, index),
      ),
    [classColumnIndex, columns, rows],
  );

  const [xColumn, setXColumn] = useState(numericColumns[0] ?? "");
  const [yColumn, setYColumn] = useState(
    numericColumns[1] ?? numericColumns[0] ?? "",
  );

  const safeXColumn = numericColumns.includes(xColumn)
    ? xColumn
    : (numericColumns[0] ?? "");
  const safeYColumn =
    numericColumns.includes(yColumn) && yColumn !== safeXColumn
      ? yColumn
      : (numericColumns[1] ?? safeXColumn);

  const plotData = useMemo(() => {
    const xIndex = columns.indexOf(safeXColumn);
    const yIndex = columns.indexOf(safeYColumn);
    if (xIndex < 0 || yIndex < 0 || xIndex === yIndex) {
      return {
        traces: [],
        shapes: [],
        annotations: [],
      } satisfies PlotArtifacts;
    }

    const points = rows
      .map((row, idx) => ({
        idx,
        x: parseNumber(row[xIndex]),
        y: parseNumber(row[yIndex]),
        classLabel: String(row[classColumnIndex] ?? ""),
        binary: results.binaryMapping[String(idx)] ?? "0",
      }))
      .filter((point) => !Number.isNaN(point.x) && !Number.isNaN(point.y));

    const groups: Record<string, typeof points> = {};
    for (const point of points) {
      const key = point.classLabel || "0";
      if (!groups[key]) groups[key] = [];
      groups[key].push(point);
    }

    const palette = [
      "#ef4444",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#14b8a6",
      "#ec4899",
      "#64748b",
    ];
    const traces: PlotlyTrace[] = Object.entries(groups).map(
      ([binary, group], index) => ({
        type: "scatter",
        mode: "markers",
        name: binary || "0",
        x: group.map((point) => point.x),
        y: group.map((point) => point.y),
        text: group.map(
          (point) =>
            `${t("partition.binaryLabel")}: ${point.binary}<br>${t("partition.classLabel")}: ${point.classLabel}`,
        ),
        hovertemplate: "%{text}<br>X=%{x}<br>Y=%{y}<extra></extra>",
        marker: {
          size: 10,
          color: palette[index % palette.length],
          line: { width: 1, color: "white" },
        },
      }),
    );

    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const xPad = (xMax - xMin || 1) * 0.08;
    const yPad = (yMax - yMin || 1) * 0.08;

    const shapes: PlotShape[] = [];
    const annotations: PlotAnnotation[] = [];

    results.hyperplanes.forEach((hyperplane, index) => {
      const lineColor =
        hyperplane.direction === "positive" ? "#111827" : "#6b7280";
      if (hyperplane.axis_name === safeXColumn) {
        shapes.push({
          type: "line",
          x0: hyperplane.threshold,
          x1: hyperplane.threshold,
          y0: yMin - yPad,
          y1: yMax + yPad,
          line: { color: lineColor, width: 2 },
        } satisfies PlotShape);
      }
      if (hyperplane.axis_name === safeYColumn) {
        shapes.push({
          type: "line",
          x0: xMin - xPad,
          x1: xMax + xPad,
          y0: hyperplane.threshold,
          y1: hyperplane.threshold,
          line: { color: lineColor, width: 2 },
        } satisfies PlotShape);
      }
      annotations.push({
        x: xMin + xPad,
        y: yMax + yPad - index * (yPad * 0.6),
        text: `${index + 1}. ${hyperplane.axis_name} ${hyperplane.direction === "positive" ? ">=" : "<"} ${hyperplane.threshold.toFixed(3)}`,
        showarrow: false,
        xanchor: "left",
        font: { size: 11, color: lineColor },
      } satisfies PlotAnnotation);
    });

    return { traces, shapes, annotations } satisfies PlotArtifacts;
  }, [
    classColumnIndex,
    columns,
    rows,
    results.binaryMapping,
    results.hyperplanes,
    safeXColumn,
    safeYColumn,
    t,
  ]);

  useEffect(() => {
    if (!plotRef.current || plotData.traces.length === 0) return;

    const layout: PlotlyLayout = {
      autosize: true,
      height: 560,
      margin: { l: 55, r: 25, t: 20, b: 55 },
      hovermode: "closest",
      legend: { orientation: "h", y: -0.18, x: 0 },
      xaxis: { title: { text: safeXColumn }, zeroline: false },
      yaxis: { title: { text: safeYColumn }, zeroline: false },
      shapes: plotData.shapes,
      annotations: plotData.annotations,
    };

    Plotly.newPlot(plotRef.current, plotData.traces, layout, {
      responsive: true,
      displayModeBar: false,
    });
  }, [plotData, safeXColumn, safeYColumn]);

  if (numericColumns.length < 2) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("partition.title")}</CardTitle>
        <CardDescription>{t("partition.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("partition.xAxis")}
            </label>
            <select
              value={safeXColumn}
              onChange={(event) => setXColumn(event.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
            >
              {numericColumns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("partition.yAxis")}
            </label>
            <select
              value={safeYColumn}
              onChange={(event) => setYColumn(event.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
            >
              {numericColumns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div ref={plotRef} className="min-h-[560px]" />
      </CardContent>
    </Card>
  );
}
