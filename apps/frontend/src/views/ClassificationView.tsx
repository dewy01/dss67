import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  createClassifyObjectMutationOptions,
  createQualityAssessmentMutationOptions,
} from "../api/classification";
import { ClassificationResults } from "../components/classification/ClassificationResults";
import { MethodConfig } from "../components/classification/MethodConfig";
import { QualityResults } from "../components/classification/QualityResults";
import { ImportError } from "../components/import/ImportError";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useI18n } from "../i18n/I18nProvider";
import { useDatasetStore } from "../store/datasetStore";
import type {
  ClassificationMethod,
  ClassificationParams,
  ClassificationResponse,
  QualityAssessmentResult,
} from "../types/classification";

type ClassificationMode = "quality" | "classify";

export function ClassificationView() {
  const { t } = useI18n();
  const [mode, setMode] = useState<ClassificationMode>("quality");
  const [classColumnIndex, setClassColumnIndex] = useState<number>(0);
  const [selectedMethods, setSelectedMethods] = useState<
    ClassificationMethod[]
  >(["knn"]);
  const [methodParams, setMethodParams] = useState<
    Record<ClassificationMethod, ClassificationParams>
  >({
    knn: { k: 3 },
    "naive-bayes": { smoothing: 1 },
    "decision-tree": { maxDepth: 5, minSamples: 1 },
    svm: { kernel: "rbf", C: 1, gamma: 0.1 },
    "random-forest": { nEstimators: 10, maxDepth: 10 },
  });
  const [newObject, setNewObject] = useState<string>("");
  const [classificationResults, setClassificationResults] =
    useState<ClassificationResponse | null>(null);
  const [qualityResults, setQualityResults] = useState<
    QualityAssessmentResult[]
  >([]);

  const preview = useDatasetStore((store) => store.preview);
  const datasetId = useDatasetStore((store) => store.datasetId);

  const qualityMutation = useMutation({
    ...createQualityAssessmentMutationOptions(),
    onSuccess: (data) => setQualityResults(data),
  });

  const classifyMutation = useMutation({
    ...createClassifyObjectMutationOptions(),
    onSuccess: (data) => setClassificationResults(data),
  });

  const hasDataset = Boolean(datasetId && preview);
  const availableMethods: ClassificationMethod[] = [
    "knn",
    "naive-bayes",
    "decision-tree",
    "svm",
    "random-forest",
  ];

  const handleAddMethod = () => {
    const nextMethod = availableMethods.find(
      (m) => !selectedMethods.includes(m),
    );
    if (nextMethod) {
      setSelectedMethods([...selectedMethods, nextMethod]);
    }
  };

  const handleRemoveMethod = (method: ClassificationMethod) => {
    if (selectedMethods.length > 1) {
      setSelectedMethods(selectedMethods.filter((m) => m !== method));
    }
  };

  const handleParamChange = (
    method: ClassificationMethod,
    params: ClassificationParams,
  ) => {
    setMethodParams((prev) => ({
      ...prev,
      [method]: params,
    }));
  };

  const handleAssessQuality = () => {
    if (!datasetId) return;

    qualityMutation.mutate({
      datasetId,
      classColumnIndex,
      methods: selectedMethods.map((method) => ({
        method,
        params: methodParams[method],
      })),
    });
  };

  const handleClassify = () => {
    if (!datasetId || !newObject) return;

    const parts = newObject.split(/[;,\s\t]+/).filter((p) => p.trim());
    const objectValues = parts.map((part) => {
      const num = parseFloat(part);
      return Number.isFinite(num) ? num : part;
    });

    classifyMutation.mutate({
      datasetId,
      classColumnIndex,
      newObject: objectValues,
      methods: selectedMethods.map((method) => ({
        method,
        params: methodParams[method],
      })),
    });
  };

  if (!hasDataset) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-center">
        <ImportError message={t("import.datasetRequired")} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-12">
      <Card>
        <CardHeader>
          <CardTitle>{t("classification.title")}</CardTitle>
          <CardDescription>{t("classification.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => setMode("quality")}
                variant={mode === "quality" ? "default" : "outline"}
              >
                {t("classification.mode.quality")}
              </Button>
              <Button
                onClick={() => setMode("classify")}
                variant={mode === "classify" ? "default" : "outline"}
              >
                {t("classification.mode.classify")}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("classification.classColumn")}
              </label>
              <select
                value={classColumnIndex}
                onChange={(e) => setClassColumnIndex(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
              >
                {preview?.columns.map((col, idx) => (
                  <option key={idx} value={idx}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {t("classification.methods")}
          </h2>

          <Button
            onClick={handleAddMethod}
            variant="outline"
            size="sm"
            disabled={selectedMethods.length >= availableMethods.length}
          >
            {t("classification.addMethod")}
          </Button>
        </div>

        <div className="space-y-4">
          {selectedMethods.map((method) => (
            <MethodConfig
              key={method}
              method={method}
              onParamsChange={(params) => handleParamChange(method, params)}
              canRemove={selectedMethods.length > 1}
              onRemove={() => handleRemoveMethod(method)}
            />
          ))}
        </div>
      </div>

      {mode === "quality" && (
        <div className="space-y-4">
          <Button
            onClick={handleAssessQuality}
            disabled={qualityMutation.isPending}
            className="w-full"
          >
            {qualityMutation.isPending
              ? t("classification.assessing")
              : t("classification.assessButton")}
          </Button>

          {qualityMutation.isError && (
            <ImportError message={(qualityMutation.error as Error).message} />
          )}

          <QualityResults
            results={qualityResults}
            isLoading={qualityMutation.isPending}
          />
        </div>
      )}

      {mode === "classify" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("classification.newObjectTitle")}</CardTitle>
              <CardDescription>
                {t("classification.newObjectDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={newObject}
                onChange={(e) => setNewObject(e.target.value)}
                placeholder={t("classification.newObjectPlaceholder")}
                className="flex min-h-24 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
              />
              <Button
                onClick={handleClassify}
                disabled={classifyMutation.isPending || !newObject}
                className="w-full"
              >
                {classifyMutation.isPending
                  ? t("classification.classifying")
                  : t("classification.classifyButton")}
              </Button>
            </CardContent>
          </Card>

          {classifyMutation.isError && (
            <ImportError message={(classifyMutation.error as Error).message} />
          )}

          {classificationResults && (
            <ClassificationResults
              response={classificationResults}
              isLoading={classifyMutation.isPending}
            />
          )}
        </div>
      )}
    </div>
  );
}
