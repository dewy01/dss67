import { useState } from "react";
import type {
  ClassificationMethod,
  ClassificationParams,
  DecisionTreeParams,
  KNNParams,
  NaiveBayesParams,
  RandomForestParams,
  SVMParams,
} from "../../types/classification";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type MethodConfigProps = {
  method: ClassificationMethod;
  onParamsChange: (params: ClassificationParams) => void;
  onAdd: () => void;
  canRemove: boolean;
  onRemove: () => void;
};

export function MethodConfig({
  method,
  onParamsChange,
  onAdd,
  canRemove,
  onRemove,
}: MethodConfigProps) {
  const [params, setParams] = useState<ClassificationParams>(
    getDefaultParams(method),
  );

  const handleParamChange = (newParams: ClassificationParams) => {
    setParams(newParams);
    onParamsChange(newParams);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{getMethodLabel(method)}</CardTitle>
            <CardDescription>{getMethodDescription(method)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {method === "knn" && (
          <KNNParamsInput
            params={params as KNNParams}
            onChange={handleParamChange}
          />
        )}
        {method === "naive-bayes" && (
          <NaiveBayesParamsInput
            params={params as NaiveBayesParams}
            onChange={handleParamChange}
          />
        )}
        {method === "decision-tree" && (
          <DecisionTreeParamsInput
            params={params as DecisionTreeParams}
            onChange={handleParamChange}
          />
        )}
        {method === "svm" && (
          <SVMParamsInput
            params={params as SVMParams}
            onChange={handleParamChange}
          />
        )}
        {method === "random-forest" && (
          <RandomForestParamsInput
            params={params as RandomForestParams}
            onChange={handleParamChange}
          />
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={onAdd} variant="outline" className="flex-1">
            Add Another Method
          </Button>
          {canRemove && (
            <Button onClick={onRemove} variant="ghost" className="flex-1">
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function KNNParamsInput({
  params,
  onChange,
}: {
  params: KNNParams;
  onChange: (p: KNNParams) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Number of Neighbors (k)
        <input
          type="number"
          min="1"
          max="50"
          value={params.k}
          onChange={(e) => onChange({ k: parseInt(e.target.value) || 1 })}
          className="mt-1 flex h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
        />
      </label>
    </div>
  );
}

function NaiveBayesParamsInput({
  params,
  onChange,
}: {
  params: NaiveBayesParams;
  onChange: (p: NaiveBayesParams) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Laplace Smoothing Factor
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={params.smoothing}
          onChange={(e) =>
            onChange({ smoothing: parseFloat(e.target.value) || 0 })
          }
          className="mt-1 flex h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
        />
      </label>
    </div>
  );
}

function DecisionTreeParamsInput({
  params,
  onChange,
}: {
  params: DecisionTreeParams;
  onChange: (p: DecisionTreeParams) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Max Depth
        <input
          type="number"
          min="1"
          max="50"
          value={params.maxDepth}
          onChange={(e) =>
            onChange({
              ...params,
              maxDepth: parseInt(e.target.value) || 5,
            })
          }
          className="mt-1 flex h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
        />
      </label>
      <label className="text-sm font-medium">
        Min Samples per Leaf
        <input
          type="number"
          min="1"
          max="20"
          value={params.minSamples}
          onChange={(e) =>
            onChange({
              ...params,
              minSamples: parseInt(e.target.value) || 1,
            })
          }
          className="mt-1 flex h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
        />
      </label>
    </div>
  );
}

function SVMParamsInput({
  params,
  onChange,
}: {
  params: SVMParams;
  onChange: (p: SVMParams) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Kernel
        <select
          value={params.kernel}
          onChange={(e) =>
            onChange({
              ...params,
              kernel: e.target.value as "linear" | "rbf" | "poly",
            })
          }
          className="mt-1 flex h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
        >
          <option value="linear">Linear</option>
          <option value="rbf">RBF</option>
          <option value="poly">Polynomial</option>
        </select>
      </label>
      <label className="text-sm font-medium">
        Regularization Parameter (C)
        <input
          type="number"
          min="0.01"
          max="100"
          step="0.1"
          value={params.C}
          onChange={(e) =>
            onChange({ ...params, C: parseFloat(e.target.value) || 1 })
          }
          className="mt-1 flex h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
        />
      </label>
      {params.kernel === "rbf" && (
        <label className="text-sm font-medium">
          Gamma
          <input
            type="number"
            min="0.001"
            max="1"
            step="0.001"
            value={params.gamma || 0.1}
            onChange={(e) =>
              onChange({
                ...params,
                gamma: parseFloat(e.target.value) || 0.1,
              })
            }
            className="mt-1 flex h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          />
        </label>
      )}
    </div>
  );
}

function RandomForestParamsInput({
  params,
  onChange,
}: {
  params: RandomForestParams;
  onChange: (p: RandomForestParams) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Number of Trees
        <input
          type="number"
          min="1"
          max="200"
          value={params.nEstimators}
          onChange={(e) =>
            onChange({
              ...params,
              nEstimators: parseInt(e.target.value) || 10,
            })
          }
          className="mt-1 flex h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
        />
      </label>
      <label className="text-sm font-medium">
        Max Depth per Tree
        <input
          type="number"
          min="1"
          max="50"
          value={params.maxDepth}
          onChange={(e) =>
            onChange({
              ...params,
              maxDepth: parseInt(e.target.value) || 10,
            })
          }
          className="mt-1 flex h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
        />
      </label>
    </div>
  );
}

function getDefaultParams(method: ClassificationMethod): ClassificationParams {
  switch (method) {
    case "knn":
      return { k: 3 };
    case "naive-bayes":
      return { smoothing: 1 };
    case "decision-tree":
      return { maxDepth: 5, minSamples: 1 };
    case "svm":
      return { kernel: "rbf", C: 1, gamma: 0.1 };
    case "random-forest":
      return { nEstimators: 10, maxDepth: 10 };
    default:
      return { k: 3 };
  }
}

function getMethodLabel(method: ClassificationMethod): string {
  switch (method) {
    case "knn":
      return "k-Nearest Neighbors";
    case "naive-bayes":
      return "Naive Bayes";
    case "decision-tree":
      return "Decision Tree";
    case "svm":
      return "Support Vector Machine";
    case "random-forest":
      return "Random Forest";
    default:
      return method;
  }
}

function getMethodDescription(method: ClassificationMethod): string {
  switch (method) {
    case "knn":
      return "Instance-based learning algorithm that classifies based on nearest neighbors";
    case "naive-bayes":
      return "Probabilistic classifier based on Bayes' theorem";
    case "decision-tree":
      return "Tree-based model that learns decision rules from data";
    case "svm":
      return "Finds optimal hyperplane that maximizes margin between classes";
    case "random-forest":
      return "Ensemble method combining multiple decision trees";
    default:
      return "";
  }
}
