import { DISCLOSURES, statusColor, type Disclosure } from "../domain";
import { chart } from "../theme";

/**
 * Disclosure & assurance register — the corporate system-of-record / audit trail.
 * Pitch hook: this is the manual, multi-framework reporting burden (weeks of
 * spreadsheets per cycle, re-keyed across frameworks, assured by auditors) that
 * CarbonClarity collapses into one engine. Each row ties a framework to a real
 * board/auditor-recognised status and its legacy effort.
 */
export function DisclosureRegister() {
  return (
    <div className="rounded-2xl border border-line bg-panel p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold text-text1">Disclosure &amp; assurance register</h3>
        <span className="text-xs uppercase tracking-wide text-text2">system of record</span>
      </div>
      <p className="mt-1 text-sm text-text2">
        Every framework this entity reports against, with its filing status and the legacy effort it
        took. CarbonClarity produces all of these from one calculation run.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel2 text-text2">
            <tr>
              <th className="px-4 py-3">Framework</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Legacy effort</th>
            </tr>
          </thead>
          <tbody>
            {DISCLOSURES.map((d) => (
              <Row key={d.framework + d.period} d={d} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-text2">
        Legacy effort is the manual workload before CarbonClarity (illustrative). Status reflects a
        typical SGX-listed reporting calendar. Synthetic data only.
      </p>
    </div>
  );
}

function Row({ d }: { d: Disclosure }) {
  const color = chart[statusColor(d.status)]; // live palette colour
  return (
    <tr className="border-t border-line align-top">
      <td className="px-4 py-3 font-medium text-text1">{d.framework}</td>
      <td className="px-4 py-3 text-text2">{d.scope}</td>
      <td className="px-4 py-3 text-text2">{d.period}</td>
      <td className="px-4 py-3">
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ background: `${color}26`, color }}
        >
          {d.status}
        </span>
        {d.filed !== "—" && <div className="mt-1 text-xs text-text2">{d.filed}</div>}
      </td>
      <td className="px-4 py-3 text-text2">
        {d.effort}
        {d.note && <div className="mt-1 text-xs italic text-text2/80">{d.note}</div>}
      </td>
    </tr>
  );
}
