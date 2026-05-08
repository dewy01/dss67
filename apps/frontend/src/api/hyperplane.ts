import type {
  DownloadResponse,
  HyperplaneRequest,
  HyperplaneResponse,
} from "../types/hyperplane";
import { getBackendUrl } from "./client";

const backendUrl = getBackendUrl();

export function createHyperplaneClassifyMutationOptions() {
  return {
    mutationFn: async (data: HyperplaneRequest) => {
      const response = await fetch(`${backendUrl}/hyperplane/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to classify with hyperplanes");
      }

      return (await response.json()) as HyperplaneResponse;
    },
  };
}

export function createDownloadTransformedDataMutationOptions() {
  return {
    mutationFn: async (data: HyperplaneRequest) => {
      const response = await fetch(`${backendUrl}/hyperplane/download-csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to download transformed data");
      }

      return (await response.json()) as DownloadResponse;
    },
  };
}
