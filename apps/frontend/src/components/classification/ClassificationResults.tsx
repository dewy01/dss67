import { useI18n } from "../../i18n/I18nProvider";
import type { TranslationKey } from "../../i18n/translations";
import type { ClassificationResponse } from "../../types/classification";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type ClassificationResultsProps = {
  response: ClassificationResponse;
  isLoading: boolean;
};

export function ClassificationResults({
  response,
  isLoading,
}: ClassificationResultsProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {t("results.loading")}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response) {
    return null;
  }

  const voteEntries = Object.entries(response.voteDistribution).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="space-y-4">
      <Card className="border-2 border-green-500 dark:border-green-600">
        <CardHeader>
          <CardTitle className="text-green-600 dark:text-green-400">
            {t("results.finalTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="mb-2 text-sm text-muted-foreground">
              {t("results.predictedClass")}
            </div>
            <div className="text-4xl font-bold">{response.votedClass}</div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="text-sm font-medium">
              {t("results.voteDistribution")}
            </div>
            {voteEntries.map(([classValue, votes]) => (
              <div
                key={classValue}
                className="flex items-center justify-between"
              >
                <span className="text-sm">{classValue}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${
                          (votes / response.methodResults.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {votes}/{response.methodResults.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("results.individualTitle")}</CardTitle>
          <CardDescription>
            {t("results.individualDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {response.methodResults.map((result) => (
              <div
                key={result.method}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <div className="font-medium">
                    {getMethodLabel(result.method, t)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("results.predicted")}{" "}
                    <span className="font-semibold">
                      {result.predictedClass}
                    </span>
                  </div>
                </div>
                {result.confidence !== undefined && (
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {(result.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("results.confidence")}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getMethodLabel(
  method: string,
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
