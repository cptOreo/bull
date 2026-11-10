const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/** Indian digit grouping: 1,23,45,678. `dp` fixed decimals, default 0. */
export function indianGroup(value: number, dp = 0): string {
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(dp);
  const dot = fixed.indexOf(".");
  const intPart = dot === -1 ? fixed : fixed.slice(0, dot);
  const decPart = dot === -1 ? "" : fixed.slice(dot + 1);
  const last3 = intPart.slice(-3);
  let rest = intPart.slice(0, -3);
  const groups: string[] = [];
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) groups.unshift(rest);
  const body = groups.length > 0 ? `${groups.join(",")},${last3}` : last3;
  return `${negative ? "-" : ""}${body}${decPart ? `.${decPart}` : ""}`;
}

/** Percentages: one decimal, §9.3. */
export function formatPercent(value: number, dp = 1): string {
  return `${value.toFixed(dp)}%`;
}

/** Signed percentage for one-session moves: "+1.2%" / "-1.0%". */
export function formatSignedPercent(value: number, dp = 1): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(dp)}%`;
}

/** Ratios: two decimals, §9.3. */
export function formatRatio(value: number, dp = 2): string {
  return value.toFixed(dp);
}

/** Times interest earned: one decimal with a trailing x. */
export function formatTimes(value: number, dp = 1): string {
  return `${value.toFixed(dp)}x`;
}

/** Crore values: Indian grouping, no decimals, §9.3. */
export function formatCrore(value: number): string {
  return indianGroup(value, 0);
}

/** Prices: two decimals with Indian grouping, §9.3. */
export function formatPrice(value: number): string {
  return indianGroup(value, 2);
}

/** "09 Nov 2026" from an ISO date or timestamp. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return `${String(day).padStart(2, "0")} ${MONTHS_SHORT[month - 1]} ${year}`;
}

/** "31 October 2026" — used inside narrative templates. */
export function formatDateLong(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return `${day} ${MONTHS_LONG[month - 1]} ${year}`;
}

const IST_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The IST calendar date (YYYY-MM-DD) for any ISO instant, §8.9. */
export function istDate(iso: string): string {
  return IST_DATE.format(new Date(iso));
}

/** Round to one decimal, the engine's standard for sub-scores and percentages. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Round to three decimals, used for displayed weights, §7.6. */
export function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
