import { fmtTonnes } from "../format";
import { sgdM } from "../domain";

export default function LeverSlider({
  label,
  note,
  value,
  abatement,
  cost,
  onChange,
}: {
  label: string;
  note: string;
  value: number; // 0..1
  abatement?: number;
  cost?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-text1">{label}</h3>
        <span className="tabular text-2xl font-extrabold text-brand">
          {Math.round(value * 100)}%
        </span>
      </div>
      <p className="mt-1 text-sm text-text2">{note}</p>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-4 w-full"
      />

      <div className="mt-3 flex justify-between text-sm">
        <span className="text-text2">
          {abatement !== undefined ? (
            <>
              −<span className="tabular font-semibold text-text1">{fmtTonnes(abatement)}</span>{" "}
              tCO2e/yr
            </>
          ) : (
            "—"
          )}
        </span>
        <span className="text-text2">
          {cost !== undefined ? (
            <span className="tabular font-semibold text-text1">{sgdM(cost)}</span>
          ) : (
            "—"
          )}
        </span>
      </div>
    </div>
  );
}
