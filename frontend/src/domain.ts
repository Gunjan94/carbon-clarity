// Presentation layer — enterprise sustainability reporting context (Singapore).
//
// The backend emissions engine + scenario engine stay the source of truth. This
// module adds the corporate "system-of-record" chrome a real sustainability /
// finance team works inside: the reporting entity, the disclosure register
// (past reporting cycles + framework submission status), and SGD formatting.
// Everything here is static narrative context or deterministic — no randomness.

export const COMPANY = "Meridian Industries";
export const HQ = "Singapore";
export const FY = "FY2025";
export const REPORTING_PERIOD = "2025-Q1";

// SG-HQ manufacturer reporting under SGX climate-disclosure rules.
export const ENTITY = {
  name: COMPANY,
  hq: HQ,
  revenue: "S$4.1B", // ~US$3B brief figure, expressed in SGD
  listing: "SGX-listed",
  sites: 200,
  countries: 15,
  targetPct: 40,
  targetYear: 2030,
  baseYear: 2019,
  budgetSGD: 13_500_000, // ~US$10M expressed SGD for the cockpit
};

// ---------------------------------------------------------------------------
// Currency — brief frames budgets in USD; we present in SGD for the SG board.
// Backend still computes in its native units; we convert at display time.
// ---------------------------------------------------------------------------
const USD_TO_SGD = 1.35;

export const sgd = (usd: number, decimals = 0): string =>
  "S$" +
  (usd * USD_TO_SGD).toLocaleString("en-SG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** SGD in millions, e.g. "S$9.4M". */
export const sgdM = (usd: number): string => {
  const m = (usd * USD_TO_SGD) / 1_000_000;
  return `S$${m.toFixed(m >= 10 ? 1 : 2)}M`;
};

export const tonnes = (n: number): string => Math.round(n).toLocaleString("en-SG");

// ---------------------------------------------------------------------------
// Reporting & disclosure register — the "system of record" / audit trail.
// Shows the manual, multi-framework reporting burden CarbonClarity replaces,
// and ties each disclosure to a status a board/auditor recognises.
// ---------------------------------------------------------------------------
export type DisclosureStatus = "Filed" | "In review" | "Draft" | "Assured";

export interface Disclosure {
  framework: string;
  scope: string;
  period: string;
  status: DisclosureStatus;
  filed: string; // date or "—"
  effort: string; // legacy manual effort
  note?: string;
}

// Hand-authored to read like a real disclosure log. The "effort" column is the
// before-state the prototype compresses (weeks of spreadsheets → seconds).
export const DISCLOSURES: Disclosure[] = [
  {
    framework: "GHG Protocol — Corporate Standard",
    scope: "Scope 1 + 2 (location & market)",
    period: "2024 FY",
    status: "Assured",
    filed: "28 Mar 2025",
    effort: "~3 weeks, 4 analysts",
    note: "Third-party limited assurance obtained.",
  },
  {
    framework: "SGX Sustainability Report",
    scope: "Scope 1 + 2 + material Scope 3",
    period: "2024 FY",
    status: "Filed",
    filed: "31 Mar 2025",
    effort: "~2 weeks reconciliation",
  },
  {
    framework: "GRI 305 — Emissions",
    scope: "305-1 / 305-2 / 305-3",
    period: "2024 FY",
    status: "Filed",
    filed: "31 Mar 2025",
    effort: "Re-keyed from GHG workbook",
  },
  {
    framework: "ESRS E1 — Climate change",
    scope: "Gross Scopes 1–3 + targets",
    period: "2025 H1",
    status: "In review",
    filed: "—",
    effort: "In progress — multi-country FX reconciliation",
  },
  {
    framework: "IFRS S2 / ISSB",
    scope: "Climate financial disclosure",
    period: "2025 FY",
    status: "Draft",
    filed: "—",
    effort: "Not started — data gaps across regions",
  },
];

export const statusColor = (s: DisclosureStatus): "brand" | "warn" | "target" | "text2" => {
  switch (s) {
    case "Assured":
      return "brand";
    case "Filed":
      return "brand";
    case "In review":
      return "warn";
    case "Draft":
      return "target";
    default:
      return "text2";
  }
};

// ---------------------------------------------------------------------------
// Reporting periods for the period switcher (entity switcher equivalent).
// The backend currently serves 2025-Q1; other periods reuse it (clearly the
// "current" cycle is live, priors are from the register) — kept honest in UI.
// ---------------------------------------------------------------------------
export const PERIODS = [
  { id: "2025-Q1", label: "FY2025 Q1", live: true },
  { id: "2024-Q4", label: "FY2024 Q4", live: false },
  { id: "2024-Q3", label: "FY2024 Q3", live: false },
];
