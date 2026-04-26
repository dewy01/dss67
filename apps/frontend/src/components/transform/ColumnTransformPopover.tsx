import { useState } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export type ColumnTransformHandlers = {
  onEncode: (column: string, mode: "alphabetical" | "appearance") => void;
  onDiscretize: (column: string, bins: number) => void;
  onNormalize: (column: string) => void;
  onRescale: (column: string, a: number, b: number) => void;
  onExtremes: (column: string, percent: number) => void;
};

type ColumnTransformPopoverProps = ColumnTransformHandlers & {
  column: string;
  disabled: boolean;
};

export function ColumnTransformPopover({
  column,
  disabled,
  onEncode,
  onDiscretize,
  onNormalize,
  onRescale,
  onExtremes,
}: ColumnTransformPopoverProps) {
  const [encodeMode, setEncodeMode] = useState<"alphabetical" | "appearance">(
    "alphabetical",
  );
  const [bins, setBins] = useState(5);
  const [rescaleA, setRescaleA] = useState(0);
  const [rescaleB, setRescaleB] = useState(1);
  const [extremesPercent, setExtremesPercent] = useState(5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          {column}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Column
            </p>
            <p className="text-sm font-semibold text-card-foreground">
              {column}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Encode categorical</label>
            <div className="flex gap-2">
              <select
                className="flex h-9 w-full rounded-md border border-border bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={encodeMode}
                onChange={(event) =>
                  setEncodeMode(
                    event.target.value as "alphabetical" | "appearance",
                  )
                }
              >
                <option value="alphabetical">Alphabetical</option>
                <option value="appearance">Appearance</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEncode(column, encodeMode)}
              >
                Encode
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Discretize</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={bins}
                onChange={(event) => setBins(Number(event.target.value))}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDiscretize(column, bins)}
              >
                Apply
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Normalize (z-score)</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNormalize(column)}
            >
              Normalize
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Rescale range</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={rescaleA}
                onChange={(event) => setRescaleA(Number(event.target.value))}
              />
              <Input
                type="number"
                value={rescaleB}
                onChange={(event) => setRescaleB(Number(event.target.value))}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onRescale(column, rescaleA, rescaleB)}
            >
              Rescale
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Extremes %</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={50}
                value={extremesPercent}
                onChange={(event) =>
                  setExtremesPercent(Number(event.target.value))
                }
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExtremes(column, extremesPercent)}
              >
                Mark
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
