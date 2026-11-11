import type { LiveStockSnapshot } from "./yahoo-client";
export interface PricePoint {
  date: string;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface PriceSeries {
  monthly: PricePoint[];
  daily: PricePoint[];
  intraday: PricePoint[];
}

export function transformPriceHistory(
  timestamps: number[],
  closes: number[],
  highs: number[],
  lows: number[],
  volumes: number[],
  interval: "1m" | "5m" | "15m" | "30m" | "60m" | "1d" | "1wk" | "1mo" | string = "1d"
): PriceSeries {
  const points: PricePoint[] = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split("T")[0],
      close: closes[i],
      high: highs[i] ?? closes[i],
      low: lows[i] ?? closes[i],
      volume: volumes[i] ?? 0,
    }))
    .filter((p) => p.close != null && p.close > 0);

  const isIntraday = ["1m", "5m", "15m", "30m", "60m"].includes(interval);

  let monthlyPoints = points;
  if (interval === "1d" && points.length > 60) {
    monthlyPoints = resampleToMonthly(points);
  }

  return {
    monthly: monthlyPoints.slice(-60),
    daily: isIntraday ? [] : points.slice(-252),
    intraday: isIntraday ? points : [],
  };
}

function resampleToMonthly(dailyPoints: PricePoint[]): PricePoint[] {
  const monthlyMap = new Map<string, PricePoint[]>();

  for (const point of dailyPoints) {
    const monthKey = point.date.slice(0, 7);
    if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, []);
    monthlyMap.get(monthKey)!.push(point);
  }

  return Array.from(monthlyMap.entries())
    .map(([month, points]) => {
      const lastPoint = points[points.length - 1];
      return {
        date: `${month}-${new Date(lastPoint.date).getDate().toString().padStart(2, "0")}`,
        close: lastPoint.close,
        high: Math.max(...points.map((p) => p.high)),
        low: Math.min(...points.map((p) => p.low)),
        volume: points.reduce((sum, p) => sum + p.volume, 0),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function mergeSnapshots(
  primary: LiveStockSnapshot | null,
  fallback: LiveStockSnapshot | null
): LiveStockSnapshot | null {
  if (!primary) return fallback;
  if (!fallback) return primary;

  return {
    ...primary,
    peRatio: primary.peRatio ?? fallback.peRatio,
    pbRatio: primary.pbRatio ?? fallback.pbRatio,
    dividendYield: primary.dividendYield ?? fallback.dividendYield,
    roe: primary.roe ?? fallback.roe,
    roce: primary.roce ?? fallback.roce,
    debtToEquity: primary.debtToEquity ?? fallback.debtToEquity,
    operatingMargin: primary.operatingMargin ?? fallback.operatingMargin,
    netMargin: primary.netMargin ?? fallback.netMargin,
    sector: primary.sector ?? fallback.sector,
    industry: primary.industry ?? fallback.industry,
    summary: primary.summary ?? fallback.summary,
    strengths: primary.strengths.length > 0 ? primary.strengths : fallback.strengths,
    watchouts: primary.watchouts.length > 0 ? primary.watchouts : fallback.watchouts,
  };
}