// Design tokens + light/dark theming for CarbonClarity.
//
// Single source of truth = PALETTES. applyTheme() writes them onto <html> as CSS
// variables — consumed by Tailwind utilities (bg-panel, text-text1, …) via
// tailwind.config.js, by index.css (body gradient, slider), and read live by the
// Recharts components through the `chart` Proxy (which can't use Tailwind classes
// because Recharts wants raw color strings). One toggle + a React re-render
// repaints the whole app, charts included.

export type Mode = "light" | "dark";

const PALETTES: Record<Mode, Record<string, string>> = {
  dark: {
    ink: "#0a0f1c",
    panel: "#111827",
    panel2: "#1a2234",
    line: "#243049",
    brand: "#12b886",
    brandDim: "#0c7a5a",
    warn: "#f59f00",
    danger: "#fa5252",
    target: "#7c8db5",
    text1: "#e8edf6",
    text2: "#9aa7c0",
  },
  light: {
    ink: "#F4F7FB", // page canvas
    panel: "#FFFFFF", // card surface
    panel2: "#EDF2F9", // secondary surface
    line: "#D5DEEC", // borders
    brand: "#0E9E76", // green, darkened for contrast on white
    brandDim: "#0c7a5a",
    warn: "#B7791F",
    danger: "#DC2626",
    target: "#5C6B8A",
    text1: "#0E1A30", // primary text (navy)
    text2: "#566179", // secondary text
  },
};

// Chart-series colours that must read well in both modes (pie slices etc.).
const FUEL_SERIES: Record<Mode, string[]> = {
  dark: ["#12b886", "#3bc9db", "#f59f00", "#7c8db5", "#fa5252"],
  light: ["#0E9E76", "#0E7490", "#B7791F", "#5C6B8A", "#DC2626"],
};

const EXTRAS: Record<Mode, Record<string, string>> = {
  dark: {
    "--bg-grad-a": "rgba(18,184,134,0.10)",
    "--bg-grad-b": "rgba(124,141,181,0.08)",
    "--bg-base": "#0a0f1c",
    "--header-bg": "rgba(10,15,28,0.8)",
    "--thumb-ring": "rgba(18,184,134,0.25)",
    "--card-shadow": "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 28px rgba(0,0,0,0.35)",
  },
  light: {
    "--bg-grad-a": "rgba(14,158,118,0.10)",
    "--bg-grad-b": "rgba(92,107,138,0.08)",
    "--bg-base": "#F4F7FB",
    "--header-bg": "rgba(244,247,251,0.85)",
    "--thumb-ring": "rgba(14,158,118,0.22)",
    "--card-shadow": "0 1px 2px rgba(16,24,48,0.05), 0 10px 24px rgba(16,24,48,0.08)",
  },
};

const STORAGE_KEY = "cc-theme";
const DEFAULT_MODE: Mode = "light";

let _mode: Mode = readInitial();

function readInitial(): Mode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_MODE;
}

function toRgbChannels(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function applyTheme(mode: Mode): void {
  _mode = mode;
  const root = document.documentElement;
  const p = PALETTES[mode];
  for (const k in p) {
    root.style.setProperty(`--${k}`, p[k]);
    root.style.setProperty(`--${k}-rgb`, toRgbChannels(p[k]));
  }
  const ex = EXTRAS[mode];
  for (const k in ex) root.style.setProperty(k, ex[k]);
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export const getMode = (): Mode => _mode;
export const toggleMode = (): Mode => {
  const next: Mode = _mode === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
};

// Live colour object for Recharts (reads the CURRENT palette on each render).
export const chart = new Proxy({} as Record<string, string>, {
  get: (_t, key: string) => PALETTES[_mode][key],
});

export const fuelSeries = (): string[] => FUEL_SERIES[_mode];

applyTheme(_mode);
