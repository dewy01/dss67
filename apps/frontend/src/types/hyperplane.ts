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
};

export type DownloadResponse = {
  csv_data: string;
  filename: string;
};
