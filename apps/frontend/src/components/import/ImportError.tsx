import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function ImportError({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import error</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}
