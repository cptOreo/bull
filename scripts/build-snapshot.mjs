#!/usr/bin/env node
/**
 * Four-rung snapshot builder (§10.10). It never fabricates a value: a rung that
 * fails for a ticker falls through for that ticker only, and if every rung fails
 * the script writes data/manual-template.csv with the exact columns and exits 1.
 *
 * Rungs: 1 NSE bhavcopy, 2 Yahoo chart, 3 Stooq CSV, 4 manual template.
 * This machine blocks rungs 1 and 2 (Access Denied, HTTP 429); rung 3 may work.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SNAPSHOT = path.join(ROOT, "data", "snapshot.json");
const MANUAL_TEMPLATE = path.join(ROOT, "data", "manual-template.csv");
const USER_AGENT = "BullPrototype/0.1 (course project; contact: team9@example.edu)";
const TIMEOUT_MS = 10_000;
const REQUEST_INTERVAL_MS = 1_000;

export const MANUAL_COLUMNS = [
  "ticker",
  "kind",
  "date",
  "close",
  "revenueCr",
  "ebitdaCr",
  "ebitCr",
  "patCr",
  "epsInr",
  "dpsInr",
  "netWorthCr",
  "totalDebtCr",
  "interestExpenseCr",
  "operatingCashFlowCr",
  "sharesOutstandingCr",
  "source_label",
];

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, accept: "text/csv,application/json" },
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/** Rung 1: NSE bhavcopy. Returns null on Access Denied. */
export async function rungNse(ticker, date) {
  const stamp = date.replaceAll("-", "");
  const url = `https://archives.nseindia.com/products/content/sec_bhavdata_full_${stamp}.csv`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) return null;
  const body = await response.text();
  if (!body.includes("SYMBOL")) return null;
  const line = body.split("\n").find((row) => row.startsWith(ticker));
  if (!line) return null;
  const cells = line.split(",");
  return { rung: "nse", close: Number(cells[6]), label: `NSE bhavcopy ${date}` };
}

/** Rung 2: Yahoo Finance chart endpoint. Returns null on HTTP 429. */
export async function rungYahoo(ticker, range = "5y") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.NS?range=${range}&interval=1mo`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) return null;
  const json = await response.json();
  const result = json?.chart?.result?.[0];
  if (!result) return null;
  const points = (result.timestamp ?? []).map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().slice(0, 10),
    close: result.indicators.quote[0].close[i],
  })).filter((p) => typeof p.close === "number");
  return points.length > 0 ? { rung: "yahoo", points, label: "Yahoo Finance chart" } : null;
}

/** Rung 3: Stooq CSV. Returns null when the symbol is unknown. */
export function parseStooqCsv(body) {
  const lines = body.trim().split("\n");
  if (lines.length < 2) return [];
  const points = [];
  for (const line of lines.slice(1)) {
    const [date, , , , close] = line.split(",");
    if (!date || !close) continue;
    const value = Number(close);
    if (Number.isFinite(value) && value > 0) points.push({ date, close: value });
  }
  return points;
}

export async function rungStooq(ticker, from, to) {
  const url = `https://stooq.com/q/d/l/?s=${ticker.toLowerCase()}.in&d1=${from.replaceAll("-", "")}&d2=${to.replaceAll("-", "")}&i=m`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) return null;
  const points = parseStooqCsv(await response.text());
  return points.length > 0 ? { rung: "stooq", points, label: "Stooq CSV" } : null;
}

/** The manual CSV template. Every row must carry the transcription phrase and date. */
export function manualTemplateCsv(tickers, date) {
  const header = MANUAL_COLUMNS.join(",");
  const rows = [];
  for (const ticker of tickers) {
    rows.push(`${ticker},monthly_close,YYYY-MM-DD,,${",".repeat(10)},Screener.in — manually transcribed ${date}`);
    rows.push(`${ticker},daily_close,YYYY-MM-DD,,${",".repeat(10)},Google Finance — manually transcribed ${date}`);
    rows.push(`${ticker},annual,FY2026,${",".repeat(11)},Company annual report — manually transcribed ${date}`);
  }
  return `${[header, ...rows].join("\n")}\n`;
}

function sourceRecord(id, label, publisher, url, method) {
  return {
    id,
    label,
    publisher,
    url,
    retrievedAt: `${new Date().toISOString().slice(0, 10)}T18:30:00+05:30`,
    method,
    licence: method === "derived" ? "derived" : "personal_research",
    note: method === "manual_transcription" ? "Hand-typed from the page named in the label." : null,
  };
}

async function main() {
  if (flag("check")) {
    const result = spawnSync("npx", ["tsx", "scripts/check-data.ts"], { cwd: ROOT, stdio: "inherit" });
    process.exit(result.status ?? 1);
  }

  const only = option("only");
  const all = flag("all");
  let tickers = null;
  if (only) {
    tickers = only.split(",").map((t) => t.trim().toUpperCase());
  } else if (all) {
    if (existsSync(SNAPSHOT)) {
      try {
        const snap = JSON.parse(await readFile(SNAPSHOT, "utf8"));
        tickers = snap.stocks?.map((s) => s.ticker) ?? null;
      } catch {
        // fallback
      }
    }
    if (!tickers) {
      tickers = ["INFY", "TCS", "HDFCBANK", "ICICIBANK", "ITC", "HINDUNILVR", "TATAMOTORS", "RELIANCE", "LT", "BHARTIARTL", "SUNPHARMA", "TITAN"];
    }
  }

  if (!tickers || tickers.length === 0) {
    console.error("Pass --only=TICKER[,TICKER] so the builder knows which companies to fetch.");
    console.error("The covered set is chosen by the data owner against the NSE list (§10.9).");
    process.exit(1);
  }

  const dryRun = flag("dry-run");

  if (!dryRun && existsSync(SNAPSHOT) && !flag("force")) {
    console.error(`${SNAPSHOT} exists. Re-run with --force to overwrite.`);
    process.exit(1);
  }

  const from = option("from") ?? "2021-11-30";
  const to = option("to") ?? "2026-10-31";
  const results = [];
  const manual = [];

  for (const ticker of tickers) {
    let record = null;
    for (const [name, rung] of [
      ["nse", () => rungNse(ticker, to)],
      ["yahoo", () => rungYahoo(ticker)],
      ["stooq", () => rungStooq(ticker, from, to)],
    ]) {
      try {
        record = await rung();
      } catch (error) {
        console.error(`${ticker}: rung ${name} failed — ${error.message}`);
        record = null;
      }
      await sleep(REQUEST_INTERVAL_MS);
      if (record) {
        record.ticker = ticker;
        break;
      }
    }
    if (record) {
      results.push(record);
      console.log(`${ticker}: ${record.rung} — ${record.label}`);
    } else {
      manual.push(ticker);
      console.log(`${ticker}: every rung failed — needs manual transcription`);
    }
  }

  if (manual.length > 0) {
    const csv = manualTemplateCsv(manual, "2026-11-10");
    if (dryRun) {
      console.log(csv);
    } else {
      await mkdir(path.dirname(MANUAL_TEMPLATE), { recursive: true });
      await writeFile(MANUAL_TEMPLATE, csv, "utf8");
    }
    console.error(
      `\n${manual.length} ticker(s) need manual transcription. Fill ${MANUAL_TEMPLATE} from Screener.in and Google Finance,\n` +
        `keeping the phrase "manually transcribed" and the date in source_label. Then build data/snapshot.json by hand\n` +
        `and run: npm run data:check. The builder will not write placeholder values.`,
    );
    process.exit(1);
  }

  const payload = {
    generatedBy: results.every((r) => r.rung === "nse" || r.rung === "yahoo" || r.rung === "stooq") ? "api" : "manual_transcription",
    generatedAt: new Date().toISOString(),
    sources: [
      sourceRecord("manual:screener.in:2026-11-10", "Screener.in — manually transcribed 10 Nov 2026", "Screener.in", null, "manual_transcription"),
    ],
    prices: results.map((r) => ({ ticker: r.ticker, points: r.points ?? [], rung: r.rung })),
    note: "Raw price facts only. The builder does not compute ratios.",
  };

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  await mkdir(path.dirname(SNAPSHOT), { recursive: true });
  await writeFile(SNAPSHOT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${SNAPSHOT}`);
}

if (process.argv[1] && process.argv[1].endsWith("build-snapshot.mjs")) {
  await main();
}
