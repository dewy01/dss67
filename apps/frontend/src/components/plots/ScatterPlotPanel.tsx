import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

import Plotly from "plotly.js-dist-min";

type PlotlyTrace = Parameters<typeof Plotly.newPlot>[1][number];
type PlotlyLayout = Parameters<typeof Plotly.newPlot>[2];

const markerSymbols = [
  "circle",
  "square",
  "diamond",
  "cross",
  "x",
  "triangle-up",
  "triangle-down",
  "star",
  "hexagon",
  "pentagon",
];

type ScatterPlotPanelProps = {
  columns: string[];
  rows: string[][];
};

type PlotMode = "2d" | "3d";

type PlotState = {
  mode: PlotMode;
  xColumn: string;
  yColumn: string;
  zColumn: string;
  classColumn: string;
  useClassStyle: boolean;
};

const parseNumber = (value: unknown) => {
  if (value === null || value === undefined) {
    return Number.NaN;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }
  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) {
    return Number.NaN;
  }
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

export function ScatterPlotPanel({ columns, rows }: ScatterPlotPanelProps) {
  const plotRef = useRef<HTMLDivElement>(null);

  const numericColumns = useMemo(
    () => columns.filter((_, index) => isNumericColumn(rows, index)),
    [columns, rows],
  );

  const [state, setState] = useState<PlotState>({
    mode: "2d",
    xColumn: numericColumns[0] ?? "",
    yColumn: numericColumns[1] ?? numericColumns[0] ?? "",
    zColumn: numericColumns[2] ?? "",
    classColumn: "",
    useClassStyle: false,
  });

  const safeAxes = useMemo(() => {
    const pick = (preferred: string, fallback: string) =>
      columns.includes(preferred) ? preferred : fallback;

    const fallbackX = numericColumns[0] ?? "";
    const fallbackY = numericColumns[1] ?? fallbackX;
    const fallbackZ = numericColumns[2] ?? fallbackY;

    const xColumn = pick(state.xColumn, fallbackX);
    const yColumn = pick(state.yColumn, fallbackY);

    let zColumn = pick(state.zColumn, fallbackZ);
    if (zColumn === xColumn || zColumn === yColumn) {
      zColumn = fallbackZ;
    }

    const classColumn = columns.includes(state.classColumn)
      ? state.classColumn
      : "";

    return { xColumn, yColumn, zColumn, classColumn };
  }, [columns, numericColumns, state]);

  const traces = useMemo(() => {
    const xIndex = columns.indexOf(safeAxes.xColumn);
    const yIndex = columns.indexOf(safeAxes.yColumn);
    const zIndex = columns.indexOf(safeAxes.zColumn);
    const classIndex = columns.includes(state.classColumn)
      ? columns.indexOf(state.classColumn)
      : -1;

    if (xIndex < 0 || yIndex < 0) return [];

    const points = rows
      .map((row) => {
        const x = parseNumber(row[xIndex]);
        const y = parseNumber(row[yIndex]);

        const z =
          state.mode === "3d" && zIndex >= 0 ? parseNumber(row[zIndex]) : null;

        return {
          x,
          y,
          z,
          cls: classIndex >= 0 ? String(row[classIndex]) : "",
        };
      })
      .filter((p) => !Number.isNaN(p.x) && !Number.isNaN(p.y))
      .filter((p) =>
        state.mode === "3d" ? p.z !== null && !Number.isNaN(p.z) : true,
      );

    if (!points.length) return [];

    const colorPalette = [
      "#1f77b4",
      "#ff7f0e",
      "#2ca02c",
      "#d62728",
      "#9467bd",
      "#8c564b",
      "#e377c2",
      "#7f7f7f",
      "#bcbd22",
      "#17becf",
    ];

    const buildTrace = (
      group: typeof points,
      name?: string,
      colorIdx?: number,
    ): PlotlyTrace => {
      const base: PlotlyTrace = {
        type: state.mode === "3d" ? "scatter3d" : "scatter",
        mode: "markers",
        name,
        x: group.map((p) => p.x),
        y: group.map((p) => p.y),
        marker: {
          size: 6,
          opacity: name ? 0.85 : 0.8,
        },
      };

      if (name && colorIdx !== undefined) {
        if (base.marker?.color)
          Object.assign(
            base.marker?.color,
            colorPalette[colorIdx % colorPalette.length],
          );
        if (base.marker?.symbol)
          Object.assign(
            base.marker?.symbol,
            markerSymbols[colorIdx % markerSymbols.length],
          );
        if (base.marker?.line)
          Object.assign(base.marker?.line, { width: 1, color: "white" });
      }

      if (state.mode === "3d") {
        base.z = group.map((p) => p.z);
      }

      return base;
    };

    if (!state.useClassStyle || classIndex < 0) {
      return [buildTrace(points)];
    }

    const groups: Record<string, typeof points> = {};

    for (const p of points) {
      const key = p.cls || "(empty)";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }

    return Object.entries(groups)
      .sort((a, b) => {
        const numA = parseFloat(a[0]);
        const numB = parseFloat(b[0]);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return numA - numB;
        }
        return a[0].localeCompare(b[0]);
      })
      .map(([label, group], idx) => buildTrace(group, label, idx));
  }, [
    columns,
    safeAxes.xColumn,
    safeAxes.yColumn,
    safeAxes.zColumn,
    state.classColumn,
    state.useClassStyle,
    state.mode,
    rows,
  ]);

  useEffect(() => {
    if (!plotRef.current) return;

    const layout: PlotlyLayout = {
      autosize: true,
      margin: { l: 40, r: 20, t: 20, b: 40 },
      height: state.mode === "3d" ? 500 : 400,
      legend: {
        orientation: "h",
        y: -0.15,
        x: 0,
      },
      hovermode: "closest",
    };

    if (state.mode === "3d") {
      layout.scene = {
        aspectmode: "cube",
        xaxis: { showaxeslabels: true },
        yaxis: { showaxeslabels: true },
        zaxis: { showaxeslabels: true },
      };
    } else {
      layout.xaxis = {};
      layout.yaxis = {};
    }

    Plotly.newPlot(plotRef.current, traces.length > 0 ? traces : [], layout, {
      responsive: true,
      displayModeBar: false,
    });
  }, [traces, state.mode, safeAxes]);

  const hasTraces = traces.length > 0;
  const hasNumericColumns = numericColumns.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scatter plots</CardTitle>
        <CardDescription>
          Plot two or three variables. Optionally color and mark points by a
          class column.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mode</label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={state.mode}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  mode: event.target.value as PlotMode,
                }))
              }
            >
              <option value="2d">2D</option>
              <option value="3d">3D</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">X axis</label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
              value={safeAxes.xColumn}
              onChange={(event) =>
                setState((prev) => ({ ...prev, xColumn: event.target.value }))
              }
            >
              {numericColumns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Y axis</label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
              value={safeAxes.yColumn}
              onChange={(event) =>
                setState((prev) => ({ ...prev, yColumn: event.target.value }))
              }
            >
              {numericColumns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>
        </div>

        {state.mode === "3d" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Z axis</label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
              value={safeAxes.zColumn}
              onChange={(event) =>
                setState((prev) => ({ ...prev, zColumn: event.target.value }))
              }
            >
              {numericColumns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Class column (optional)
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
              value={safeAxes.classColumn}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  classColumn: event.target.value,
                }))
              }
            >
              <option value="">None</option>
              {columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              checked={state.useClassStyle}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  useClassStyle: event.target.checked,
                }))
              }
            />
            Color/marker by class
          </label>
        </div>

        <div
          className="relative rounded-lg border border-border bg-card/60 p-3"
          style={{ minHeight: state.mode === "3d" ? "520px" : "420px" }}
        >
          <div
            ref={plotRef}
            style={{
              width: "100%",
              height: state.mode === "3d" ? "500px" : "400px",
            }}
          />
          {!hasTraces ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              {hasNumericColumns
                ? "No numeric data for the selected axes."
                : "No numeric columns available for plotting."}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
