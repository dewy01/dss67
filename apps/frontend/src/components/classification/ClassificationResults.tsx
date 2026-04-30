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
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Classifying object...
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
            Final Classification (Ensemble Vote)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="mb-2 text-sm text-muted-foreground">
              Predicted Class:
            </div>
            <div className="text-4xl font-bold">{response.votedClass}</div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="text-sm font-medium">Vote Distribution:</div>
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
          <CardTitle>Individual Classifier Results</CardTitle>
          <CardDescription>
            Predictions from each classification method
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
                    {getMethodLabel(result.method)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Predicted:{" "}
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
                      confidence
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
