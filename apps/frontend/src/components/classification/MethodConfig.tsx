import { useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import type { TranslationKey } from "../../i18n/translations";
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
  canRemove: boolean;
  onRemove: () => void;
};

export function MethodConfig({
  method,
  onParamsChange,
  canRemove,
  onRemove,
}: MethodConfigProps) {
  const { t } = useI18n();
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
            <CardTitle className="text-lg">
              {getMethodLabel(method, t)}
            </CardTitle>
            <CardDescription>{getMethodDescription(method, t)}</CardDescription>
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
          {canRemove && (
            <Button onClick={onRemove} variant="outline" className="flex-1">
              {t("method.remove")}
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
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t("method.knn.neighbors")}
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
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t("method.nb.smoothing")}
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
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t("method.dt.maxDepth")}
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
        {t("method.dt.minSamples")}
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
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t("method.svm.kernel")}
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
          <option value="linear">{t("method.svm.linear")}</option>
          <option value="rbf">RBF</option>
          <option value="poly">{t("method.svm.poly")}</option>
        </select>
      </label>
      <label className="text-sm font-medium">
        {t("method.svm.c")}
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
          {t("method.svm.gamma")}
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
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t("method.rf.trees")}
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
        {t("method.rf.maxDepth")}
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

function getMethodLabel(
  method: ClassificationMethod,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  switch (method) {
    case "knn":
      return t("method.label.knn");
    case "naive-bayes":
      return t("method.label.naive-bayes");
    case "decision-tree":
      return t("method.label.decision-tree");
    case "svm":
      return t("method.label.svm");
    case "random-forest":
      return t("method.label.random-forest");
    default:
      return method;
  }
}

function getMethodDescription(
  method: ClassificationMethod,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string {
  switch (method) {
    case "knn":
      return t("method.desc.knn");
    case "naive-bayes":
      return t("method.desc.naive-bayes");
    case "decision-tree":
      return t("method.desc.decision-tree");
    case "svm":
      return t("method.desc.svm");
    case "random-forest":
      return t("method.desc.random-forest");
    default:
      return "";
  }
}
