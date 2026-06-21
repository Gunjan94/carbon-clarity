import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from "recharts";
import type { ScenarioResult } from "../api";
import { fmtTonnes } from "../format";
import { chart } from "../theme";

export default function TrajectoryChart({ s }: { s: ScenarioResult }) {
  const c = chart;
  // Distinct amber for the target reference line so it never blends with the
  // teal trajectory (legible on both light and dark canvases).
  const TARGET = "#E8833A";
  // merge trajectory + target line onto a single year axis
  const targetByYear: Record<number, number> = {};
  const slope =
    (s.target_line[1].tco2e - s.target_line[0].tco2e) /
    (s.target_line[1].year - s.target_line[0].year);
  s.trajectory.forEach((p) => {
    targetByYear[p.year] =
      s.target_line[0].tco2e + slope * (p.year - s.target_line[0].year);
  });

  const data = s.trajectory.map((p) => ({
    year: p.year,
    trajectory: p.tco2e,
    target: Math.round(targetByYear[p.year]),
  }));

  const last = s.trajectory[s.trajectory.length - 1];

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 8 }}>
          <defs>
            <linearGradient id="trajFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.brand} stopOpacity={0.9} />
              <stop offset="100%" stopColor={c.brand} stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.line} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            stroke={c.text2}
            tick={{ fontSize: 16, fill: c.text2 }}
            tickLine={false}
          />
          <YAxis
            stroke={c.text2}
            tick={{ fontSize: 14, fill: c.text2 }}
            tickLine={false}
            width={64}
            domain={[0, "dataMax + 800"]}
            tickFormatter={(v) => fmtTonnes(v as number)}
          />
          <Tooltip
            contentStyle={{
              background: c.panel,
              border: `1px solid ${c.line}`,
              borderRadius: 12,
              color: c.text1,
            }}
            formatter={(v: number, name: string) => [
              `${fmtTonnes(v)} tCO2e`,
              name === "trajectory" ? "Your trajectory" : "40%-by-2030 target",
            ]}
            labelStyle={{ color: c.text2 }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) =>
              value === "trajectory" ? (
                <span style={{ color: c.text1 }}>Your trajectory</span>
              ) : (
                <span style={{ color: TARGET }}>40%-by-2030 target</span>
              )
            }
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke={TARGET}
            strokeWidth={3}
            strokeDasharray="8 6"
            dot={false}
            isAnimationActive={false}
            name="target"
          />
          <Line
            type="monotone"
            dataKey="trajectory"
            stroke="url(#trajFill)"
            strokeWidth={4}
            dot={{ r: 4, fill: c.brand, stroke: c.panel, strokeWidth: 2 }}
            activeDot={{ r: 7 }}
            animationDuration={350}
            name="trajectory"
          />
          <ReferenceDot
            x={last.year}
            y={last.tco2e}
            r={7}
            fill={s.hits_target ? c.brand : c.danger}
            stroke={c.panel}
            strokeWidth={3}
            isFront
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
