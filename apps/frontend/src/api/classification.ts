import type {
  ClassificationRequest,
  ClassificationResponse,
  QualityAssessmentRequest,
  QualityAssessmentResult,
} from "../types/classification";
import { getBackendUrl } from "./client";

const backendUrl = getBackendUrl();

export function createQualityAssessmentMutationOptions() {
  return {
    mutationFn: async (data: QualityAssessmentRequest) => {
      const response = await fetch(
        `${backendUrl}/classification/assess-quality`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to assess classification quality");
      }

      return (await response.json()) as QualityAssessmentResult[];
    },
  };
}

export function createClassifyObjectMutationOptions() {
  return {
    mutationFn: async (data: ClassificationRequest) => {
      const response = await fetch(`${backendUrl}/classification/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to classify object");
      }

      return (await response.json()) as ClassificationResponse;
    },
  };
}
