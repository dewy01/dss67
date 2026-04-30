import { ImportForm } from "../import/ImportForm";
import { Button } from "../ui/button";
import { CardDescription } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export type AppNavbarProps = {
  backendUrl: string;
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function AppNavbar({
  backendUrl,
  isSubmitting,
  onSubmit,
}: AppNavbarProps) {
  return (
    <div className="sticky top-0 z-40 border-b border-border/60 bg-card/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-12">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold md:text-3xl">
            Decision Support Studio
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CardDescription className="text-sm">
            Upload a dataset to refresh the preview.
          </CardDescription>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Import dataset</Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[420px]">
              <ImportForm
                backendUrl={backendUrl}
                isSubmitting={isSubmitting}
                onSubmit={onSubmit}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
