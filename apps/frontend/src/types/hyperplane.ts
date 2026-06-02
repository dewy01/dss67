export type HyperplaneRequest = {
  datasetId: string;
  classColumnIndex: number;
  maxIterations: number;
  minSeparation: number;
};

export type Hyperplane = {
  axis: number;
  threshold: number;
  direction: "positive" | "negative";
  axis_name: string;
};

export type LinearSeparability = {
  is_separable: boolean;
  method: string;
  accuracy: number;
  error?: string;
};

export type HyperplaneResponse = {
  transformedData: Array<[string, string]>;
  hyperplanes: Hyperplane[];
  binaryMapping: Record<string, string>;
  regionClasses: Record<string, string>;
  linearSeparability: LinearSeparability;
  nHyperplanes: number;
  totalCuts: number;
  totalSeparatedPoints: number;
  axisStatistics: Array<{
    axis: number;
    axis_name: string;
    cuts: number;
    separated_points: number;
  }>;
  cutHistory: Array<{
    step: number;
    axis: number;
    axis_name: string;
    threshold: number;
    direction: "positive" | "negative";
    separated_points: number;
    remaining_points: number;
    separated_ratio: number;
  }>;
};

export type DownloadResponse = {
  csv_data: string;
  filename: string;
};
