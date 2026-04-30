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
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Assessing classification quality using leave-one-out
            cross-validation...
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
        <CardTitle>Classification Quality Assessment</CardTitle>
        <CardDescription>
          Results from leave-one-out cross-validation
        </CardDescription>
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
                  {getMethodLabel(result.method)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {result.correctCount} / {result.totalCount} correctly
                  classified
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {(result.accuracy * 100).toFixed(1)}%
                </div>
                {result.accuracy === bestAccuracy && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Best
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

function getMethodLabel(method: string): string {
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
