import { readFile } from "node:fs/promises";
import path from "node:path";
import { snapshotSchema } from "../lib/data/schema";

type Report = {
  ok: boolean;
  lines: string[];
};

async function readSnapshot(file: string): Promise<unknown> {
  const text = await readFile(file, "utf8");
  return JSON.parse(text) as unknown;
}

function coverageLines(snap: ReturnType<typeof snapshotSchema.parse>): string[] {
  const sectorCounts = new Map<string, number>();
  for (const stock of snap.stocks) {
    sectorCounts.set(stock.sectorId, (sectorCounts.get(stock.sectorId) ?? 0) + 1);
  }
  const bySector = [...sectorCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => `${id} ${count}`)
    .join(", ");

  const monthlyCounts = [...new Set(snap.stocks.map((s) => s.prices.value?.points.length ?? 0))];
  const dailyCounts = [...new Set(snap.stocks.map((s) => s.recentPrices.value?.points.length ?? 0))];
  const yearCounts = [...new Set(snap.stocks.map((s) => s.financials.annual.value?.length ?? 0))];
  const newsByTicker = new Map<string, number>();
  for (const item of snap.news) {
    if (!item.ticker) continue;
    newsByTicker.set(item.ticker, (newsByTicker.get(item.ticker) ?? 0) + 1);
  }
  const thinnestStockNews = Math.min(...snap.stocks.map((s) => newsByTicker.get(s.ticker) ?? 0));

  return [
    `Stocks: ${snap.stocks.length} | Sectors: ${sectorCounts.size} | News: ${snap.news.length} | Exclusions: ${snap.exclusions.length}`,
    `Sector distribution: ${bySector}`,
    `Monthly points per stock: ${monthlyCounts.join("/")} | Recent points per stock: ${dailyCounts.join("/")}`,
    `Financial years per stock: ${yearCounts.join("/")} | Fewest news items for a stock: ${thinnestStockNews}`,
    `Corporate actions: ${snap.stocks.reduce((n, s) => n + s.corporateActions.length, 0)}`,
    `Index points: ${snap.index.prices.value?.points.length ?? 0}`,
  ];
}

export async function checkSnapshot(file: string): Promise<Report> {
  let raw: unknown;
  try {
    raw = await readSnapshot(file);
  } catch (error) {
    return { ok: false, lines: [`Cannot read ${file}: ${(error as Error).message}`] };
  }

  const parsed = snapshotSchema.safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.slice(0, 40).map((issue) => {
      const where = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${where}: ${issue.message}`;
    });
    const total = parsed.error.issues.length;
    if (total > 40) lines.push(`… and ${total - 40} more issues`);
    return { ok: false, lines: [`${file}: ${total} validation issue(s)`, ...lines] };
  }

  return {
    ok: true,
    lines: [`Snapshot ${parsed.data.snapshotId} — valid`, ...coverageLines(parsed.data)],
  };
}

async function main() {
  const file = process.argv[2] ?? path.join("data", "snapshot.json");
  const report = await checkSnapshot(file);
  for (const line of report.lines) {
    if (report.ok) console.log(line);
    else console.error(line);
  }
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] && process.argv[1].endsWith("check-data.ts")) {
  void main();
}
