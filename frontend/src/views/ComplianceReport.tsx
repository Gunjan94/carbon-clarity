import { useEffect, useState } from "react";
import { getPortfolio, type PortfolioResult } from "../api";
import { fmtTonnes } from "../format";
import { DisclosureRegister } from "../components/DisclosureRegister";

export default function ComplianceReport() {
  const [p, setP] = useState<PortfolioResult | null>(null);

  useEffect(() => {
    getPortfolio().then(setP);
  }, []);

  if (!p) return <div className="p-10 text-text2">Loading…</div>;

  const total = p.scope1_2_total_tco2e + p.scope3_estimated_tco2e;

  const rows = [
    { code: "GHG-S1", item: "Scope 1 — Direct combustion (stationary + mobile)", basis: "—", v: p.scope1_tco2e },
    { code: "GHG-S2-L", item: "Scope 2 — Purchased electricity (location-based)", basis: "Grid average", v: p.scope2_location_tco2e },
    { code: "GHG-S2-M", item: "Scope 2 — Purchased electricity (market-based)", basis: "RECs + residual mix", v: p.scope2_market_tco2e },
    { code: "GHG-S3", item: "Scope 3 — Value chain (estimated, spend-based)", basis: "Estimated", v: p.scope3_estimated_tco2e },
  ];

  const gri = [
    { code: "GRI 305-1", label: "Direct (Scope 1) GHG emissions", v: p.scope1_tco2e },
    { code: "GRI 305-2", label: "Energy indirect (Scope 2) GHG emissions", v: p.scope2_market_tco2e },
    { code: "GRI 305-3", label: "Other indirect (Scope 3) GHG emissions (estimated)", v: p.scope3_estimated_tco2e },
    { code: "ESRS E1-6", label: "Gross Scopes 1, 2, 3 and total GHG emissions", v: total },
  ];

  return (
    <div className="space-y-6">
      {/* before/after banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand/40 bg-brand/10 p-6">
        <div>
          <div className="text-sm uppercase tracking-wide text-text2">Before / After</div>
          <div className="mt-1 text-2xl font-extrabold text-text1">
            <span className="text-text2 line-through decoration-danger/70">~3 weeks per cycle</span>{" "}
            <span className="text-brand">→ generated in ~1.2 s</span>
          </div>
          <div className="text-sm text-text2">
            200 buildings × 15 countries · location- and market-based · multi-framework — from one engine
          </div>
        </div>
        <button className="rounded-xl border border-line bg-panel px-5 py-3 font-semibold text-text1 hover:bg-panel2">
          Export report
        </button>
      </div>

      {/* GHG Protocol table */}
      <div className="rounded-2xl border border-line bg-panel p-6">
        <h3 className="text-lg font-bold text-text1">GHG Protocol — Corporate Standard</h3>
        <p className="text-sm text-text2">Reporting period 2025-Q1 · all figures computed from raw activity rows</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left">
            <thead className="bg-panel2 text-sm text-text2">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Line item</th>
                <th className="px-4 py-3">Basis</th>
                <th className="px-4 py-3 text-right">tCO2e</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {rows.map((r) => (
                <tr key={r.code} className="border-t border-line">
                  <td className="px-4 py-3 text-text2">{r.code}</td>
                  <td className="px-4 py-3 text-text1">{r.item}</td>
                  <td className="px-4 py-3 text-text2">{r.basis}</td>
                  <td className="px-4 py-3 text-right text-lg font-semibold text-text1">{fmtTonnes(r.v)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-brand/40 bg-panel2">
                <td className="px-4 py-3 font-bold text-brand">TOTAL</td>
                <td className="px-4 py-3 font-bold text-text1">Reported Scope 1+2 (market-based)</td>
                <td className="px-4 py-3 text-text2">—</td>
                <td className="px-4 py-3 text-right text-xl font-extrabold text-brand">
                  {fmtTonnes(p.scope1_2_total_tco2e)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* GRI / ESRS line items */}
      <div className="rounded-2xl border border-line bg-panel p-6">
        <h3 className="text-lg font-bold text-text1">GRI 305 / ESRS E1 — line items</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {gri.map((g) => (
            <div key={g.code} className="flex items-center justify-between rounded-xl bg-panel2 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-text2">{g.code}</div>
                <div className="text-sm text-text1">{g.label}</div>
              </div>
              <div className="tabular text-xl font-bold text-text1">{fmtTonnes(g.v)}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-text2">
          Scope 3 is an estimate (spend-based intensity), labeled as such per the brief. Emission factors
          are illustrative sample values; the calculation methodology is real. Synthetic data only.
        </p>
      </div>

      {/* Disclosure & assurance register — the system-of-record / audit trail */}
      <DisclosureRegister />
    </div>
  );
}
