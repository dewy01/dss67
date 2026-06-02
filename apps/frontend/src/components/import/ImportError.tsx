import { useI18n } from "../../i18n/I18nProvider";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function ImportError({ message }: { message: string }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("import.error")}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}
