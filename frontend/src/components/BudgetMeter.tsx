import { sgdM } from "../domain";
import { chart } from "../theme";

export default function BudgetMeter({
  budget,
  committed,
  remaining,
  over,
}: {
  budget: number;
  committed: number;
  remaining: number;
  over: boolean;
}) {
  const pct = Math.min(100, (committed / budget) * 100);
  const fill = over ? chart.danger : pct > 85 ? chart.warn : chart.brand;

  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text2">
          Capital Budget
        </h3>
        <span className="text-sm text-text2">{sgdM(budget)} / 3 yrs</span>
      </div>

      <div className="mt-4">
        <div className="tabular text-4xl font-extrabold" style={{ color: fill }}>
          {sgdM(committed)}
        </div>
        <div className="text-sm text-text2">committed</div>
      </div>

      <div className="relative mt-4 h-5 w-full overflow-hidden rounded-full bg-panel2">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className={over ? "font-semibold text-danger" : "text-text2"}>
          {over ? "OVER BUDGET" : "Remaining"}
        </span>
        <span
          className={`tabular font-semibold ${over ? "text-danger" : "text-text1"}`}
        >
          {sgdM(remaining)}
        </span>
      </div>
    </div>
  );
}
