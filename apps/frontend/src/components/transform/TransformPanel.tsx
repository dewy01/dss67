import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";

export type TransformState = {
  columnsInput: string;
  encodeMode: "alphabetical" | "appearance";
  bins: number;
  rescaleA: number;
  rescaleB: number;
  extremesPercent: number;
};

type TransformPanelProps = {
  disabled: boolean;
  state: TransformState;
  onChange: (next: TransformState) => void;
  onEncode: () => void;
  onDiscretize: () => void;
  onNormalize: () => void;
  onRescale: () => void;
  onExtremes: () => void;
};

export function TransformPanel({
  disabled,
  state,
  onChange,
  onEncode,
  onDiscretize,
  onNormalize,
  onRescale,
  onExtremes,
}: TransformPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transforms</CardTitle>
        <CardDescription>
          Apply operations to the active dataset. Leave columns blank to use the
          default column set.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Columns (comma separated)
          </label>
          <Input
            value={state.columnsInput}
            onChange={(event) =>
              onChange({
                ...state,
                columnsInput: event.target.value,
              })
            }
            placeholder="col_1, col_2"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Encode categorical</label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={state.encodeMode}
              onChange={(event) =>
                onChange({
                  ...state,
                  encodeMode: event.target.value as
                    | "alphabetical"
                    | "appearance",
                })
              }
            >
              <option value="alphabetical">Alphabetical order</option>
              <option value="appearance">Order of appearance</option>
            </select>
            <Button onClick={onEncode} disabled={disabled} variant="outline">
              Encode
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Discretize (bins)</label>
            <Input
              type="number"
              min={1}
              value={state.bins}
              onChange={(event) =>
                onChange({
                  ...state,
                  bins: Number(event.target.value),
                })
              }
            />
            <Button
              onClick={onDiscretize}
              disabled={disabled}
              variant="outline"
            >
              Discretize
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Normalize (z-score)</label>
            <Button onClick={onNormalize} disabled={disabled} variant="outline">
              Normalize
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rescale range</label>
            <div className="flex gap-3">
              <Input
                type="number"
                value={state.rescaleA}
                onChange={(event) =>
                  onChange({
                    ...state,
                    rescaleA: Number(event.target.value),
                  })
                }
                placeholder="a"
              />
              <Input
                type="number"
                value={state.rescaleB}
                onChange={(event) =>
                  onChange({
                    ...state,
                    rescaleB: Number(event.target.value),
                  })
                }
                placeholder="b"
              />
            </div>
            <Button onClick={onRescale} disabled={disabled} variant="outline">
              Rescale
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Extremes percent</label>
            <Input
              type="number"
              min={1}
              max={50}
              value={state.extremesPercent}
              onChange={(event) =>
                onChange({
                  ...state,
                  extremesPercent: Number(event.target.value),
                })
              }
            />
            <Button onClick={onExtremes} disabled={disabled} variant="outline">
              Mark extremes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
