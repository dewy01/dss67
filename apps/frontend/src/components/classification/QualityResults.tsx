import { useI18n } from "../../i18n/I18nProvider";
import type { TranslationKey } from "../../i18n/translations";
import type { QualityAssessmentResult } from "../../types/classification";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type QualityResultsProps = {
  results: QualityAssessmentResult[];
  isLoading: boolean;
};

export function QualityResults({ results, isLoading }: QualityResultsProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {t("quality.loading")}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results.length) {
    return null;
  }

  const sortedResults = [...results].sort((a, b) => b.accuracy - a.accuracy);
  const bestAccuracy = sortedResults[0]?.accuracy || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("quality.title")}</CardTitle>
        <CardDescription>{t("quality.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedResults.map((result) => (
            <div
              key={result.method}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex-1">
                <div className="font-medium">
                  {getMethodLabel(result.method, t)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("quality.correctlyClassified", {
                    correct: result.correctCount,
                    total: result.totalCount,
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {(result.accuracy * 100).toFixed(1)}%
                </div>
                {result.accuracy === bestAccuracy && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {t("quality.best")}
                  </div>
                )}
              </div>
              <div className="ml-4 h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${result.accuracy * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
