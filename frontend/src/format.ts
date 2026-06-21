export const fmtTonnes = (n: number) =>
  Math.round(n).toLocaleString("en-US");

export const fmtUSD = (n: number) => {
  const m = n / 1_000_000;
  return `$${m.toFixed(m >= 10 ? 1 : 2)}M`;
};

export const fmtUSDfull = (n: number) =>
  `$${Math.round(n).toLocaleString("en-US")}`;

export const fmtPct = (n: number, dp = 1) => `${(n * 100).toFixed(dp)}%`;
