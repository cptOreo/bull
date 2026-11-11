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

export function formatPrice(value: number): string {
  return indianGroup(value, 2);
}

export function formatCrore(value: number): string {
  return indianGroup(value, 0);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatRatio(value: number): string {
  return value.toFixed(2);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateLong(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}