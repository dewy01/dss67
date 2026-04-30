export type ClassificationMethod =
  | "knn"
  | "naive-bayes"
  | "decision-tree"
  | "svm"
  | "random-forest";

export interface KNNParams {
  k: number;
}

export interface NaiveBayesParams {
  smoothing: number;
}

export interface DecisionTreeParams {
  maxDepth: number;
  minSamples: number;
}

export interface SVMParams {
  kernel: "linear" | "rbf" | "poly";
  C: number;
  gamma?: number;
}

export interface RandomForestParams {
  nEstimators: number;
  maxDepth: number;
}

export type ClassificationParams =
  | KNNParams
  | NaiveBayesParams
  | DecisionTreeParams
  | SVMParams
  | RandomForestParams;

export interface QualityAssessmentRequest {
  datasetId: string;
  classColumnIndex: number;
  methods: Array<{
    method: ClassificationMethod;
    params: ClassificationParams;
  }>;
}

export interface QualityAssessmentResult {
  method: ClassificationMethod;
  accuracy: number;
  correctCount: number;
  totalCount: number;
}

export interface ClassificationRequest {
  datasetId: string;
  classColumnIndex: number;
  newObject: (string | number)[];
  methods: Array<{
    method: ClassificationMethod;
    params: ClassificationParams;
  }>;
}

export interface MethodClassificationResult {
  method: ClassificationMethod;
  predictedClass: string;
  confidence?: number;
}

export interface ClassificationResponse {
  methodResults: MethodClassificationResult[];
  votedClass: string;
  voteDistribution: Record<string, number>;
}
