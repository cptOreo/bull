import type { IndexSeries, Sector, Stock } from "@/lib/data/schema";
import type { ChartPoint, ChartSegment, MetricSet, MetricValues, Ref } from "@/lib/engine/types";
import { istDate, round1 } from "@/lib/engine/format";
import { createDataRef, createDerivedRef } from "@/lib/engine/refs";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function daysBetween(asOf: string, now: string): number {
  if (!asOf) return Number.POSITIVE_INFINITY;
  const from = Date.parse(`${asOf.slice(0, 10)}T00:00:00+05:30`);
  const to = Date.parse(`${istDate(now)}T00:00:00+05:30`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

export function deriveMetrics(
  stock: Stock,
  sector: Sector,
  index: IndexSeries,
  now: string,
): MetricSet {
  const recentPoints = stock.recentPrices?.value?.points ?? [];
  const monthlyPoints = stock.prices?.value?.points ?? [];
  const indexPoints = index.prices?.value?.points ?? [];

  // Expiry detection (§10.7)
  const isTailExpired = daysBetween(stock.recentPrices?.asOf ?? "", now) > 30;
  const isMonthlyExpired = daysBetween(stock.prices?.asOf ?? "", now) > 75;

  // Latest close resolution
  let latestClose = 0;
  let closeAsOf = stock.recentPrices?.asOf ?? "";
  let closeSource = stock.recentPrices?.source ?? "";

  if (!isTailExpired && recentPoints.length > 0) {
    latestClose = recentPoints[recentPoints.length - 1].close;
    closeAsOf = stock.recentPrices.asOf;
    closeSource = stock.recentPrices.source;
  } else if (monthlyPoints.length > 0) {
    latestClose = monthlyPoints[monthlyPoints.length - 1].close;
    closeAsOf = stock.prices.asOf;
    closeSource = stock.prices.source;
  }

  // One session move
  let oneSessionMovePct = 0;
  if (recentPoints.length >= 2) {
    const latest = recentPoints[recentPoints.length - 1].close;
    const prev = recentPoints[recentPoints.length - 2].close;
    if (prev > 0) {
      oneSessionMovePct = round1(((latest - prev) / prev) * 100);
    }
  }

  // Financials
  const annual = stock.financials?.annual?.value ?? [];
  const latestAnnual = annual.length > 0 ? annual[annual.length - 1] : null;
  const firstAnnual = annual.length > 0 ? annual[0] : null;

  const shareCountCr: number | null =
    (latestAnnual?.sharesOutstandingCr != null && latestAnnual.sharesOutstandingCr > 0)
      ? latestAnnual.sharesOutstandingCr
      : ((stock as unknown as { shareCountCr?: { value: number } }).shareCountCr?.value ?? null);

  const marketCapCr: number | null =
    (stock as unknown as { marketCapCr?: { value: number } }).marketCapCr?.value != null
      ? (stock as unknown as { marketCapCr?: { value: number } }).marketCapCr!.value
      : (shareCountCr != null && latestClose > 0 ? round1(latestClose * shareCountCr) : null);

  // Valuation metrics
  let pe: number | null = null;
  if (latestAnnual && latestAnnual.epsInr > 0 && latestClose > 0) {
    pe = round2(latestClose / latestAnnual.epsInr);
  }

  let pb: number | null = null;
  if (latestAnnual && latestAnnual.netWorthCr > 0 && latestClose > 0) {
    if ((stock as unknown as { marketCapCr?: { value: number } }).marketCapCr?.value != null) {
      pb = round2((stock as unknown as { marketCapCr?: { value: number } }).marketCapCr!.value / latestAnnual.netWorthCr);
    } else if (shareCountCr != null) {
      pb = round2((latestClose * shareCountCr) / latestAnnual.netWorthCr);
    }
  }

  let dividendYieldPct: number | null = null;
  if (latestAnnual && latestAnnual.dpsInr != null && latestClose > 0) {
    dividendYieldPct = round2((latestAnnual.dpsInr / latestClose) * 100);
  }

  // Quality & margin metrics
  let roePct: number | null = null;
  if (latestAnnual && latestAnnual.netWorthCr > 0) {
    roePct = round1((latestAnnual.patCr / latestAnnual.netWorthCr) * 100);
  }

  let rocePct: number | null = null;
  if (stock.sectorModel !== "financial" && latestAnnual) {
    const capitalEmployed = latestAnnual.netWorthCr + latestAnnual.totalDebtCr;
    if (capitalEmployed > 0) {
      rocePct = round1((latestAnnual.ebitCr / capitalEmployed) * 100);
    }
  }

  let operatingMarginPct: number | null = null;
  if (latestAnnual && latestAnnual.revenueCr > 0) {
    operatingMarginPct = round1((latestAnnual.ebitdaCr / latestAnnual.revenueCr) * 100);
  }

  // Stability & leverage metrics
  let debtToEquity: number | null = null;
  if (stock.sectorModel !== "financial" && latestAnnual && latestAnnual.netWorthCr > 0) {
    debtToEquity = round2(latestAnnual.totalDebtCr / latestAnnual.netWorthCr);
  }

  let interestCoverTimes: number | null = null;
  if (stock.sectorModel !== "financial" && latestAnnual) {
    const expense = latestAnnual.interestExpenseCr;
    if (expense != null && expense > 0) {
      interestCoverTimes = round1(latestAnnual.ebitCr / expense);
    }
  }

  // CAGR metrics
  let revenueCagrPct: number | null = null;
  if (annual.length >= 2 && firstAnnual && latestAnnual) {
    const n = annual.length - 1;
    if (firstAnnual.revenueCr > 0 && latestAnnual.revenueCr > 0) {
      revenueCagrPct = round1(((latestAnnual.revenueCr / firstAnnual.revenueCr) ** (1 / n) - 1) * 100);
    }
  }

  let patCagrPct: number | null = null;
  if (annual.length >= 2 && firstAnnual && latestAnnual) {
    const n = annual.length - 1;
    if (firstAnnual.patCr > 0 && latestAnnual.patCr > 0) {
      patCagrPct = round1(((latestAnnual.patCr / firstAnnual.patCr) ** (1 / n) - 1) * 100);
    }
  }

  // Dividends count
  const yearsWithDividend = annual.filter((y) => y.dpsInr > 0).length;

  // Series metrics
  let volatilityPct: number | null = null;
  if (monthlyPoints.length >= 3) {
    const returns: number[] = [];
    for (let i = 1; i < monthlyPoints.length; i++) {
      const prev = monthlyPoints[i - 1].close;
      const curr = monthlyPoints[i].close;
      if (prev > 0) {
        returns.push((curr - prev) / prev);
      }
    }
    if (returns.length >= 2) {
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance =
        returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
      const sampleStdDev = Math.sqrt(variance);
      volatilityPct = round1(sampleStdDev * Math.sqrt(12) * 100);
    }
  }

  let maxDrawdownPct: number | null = null;
  if (monthlyPoints.length > 0) {
    let peak = monthlyPoints[0].close;
    let maxDd = 0;
    for (const pt of monthlyPoints) {
      if (pt.close > peak) {
        peak = pt.close;
      }
      if (peak > 0) {
        const dd = (pt.close - peak) / peak;
        if (dd < maxDd) {
          maxDd = dd;
        }
      }
    }
    maxDrawdownPct = round1(maxDd * 100);
  }

  let fiveYearReturnPct = 0;
  if (monthlyPoints.length >= 2) {
    const first = monthlyPoints[0].close;
    const last = monthlyPoints[monthlyPoints.length - 1].close;
    if (first > 0) {
      fiveYearReturnPct = round1(((last - first) / first) * 100);
    }
  }

  let indexReturnPct = 0;
  if (indexPoints.length >= 2) {
    const first = indexPoints[0].close;
    const last = indexPoints[indexPoints.length - 1].close;
    if (first > 0) {
      indexReturnPct = round1(((last - first) / first) * 100);
    }
  }

  // Sector relative ratios
  let peSectorRatio: number | null = null;
  if (pe != null && sector.medianPe?.value != null && sector.medianPe.value > 0) {
    peSectorRatio = round2(pe / sector.medianPe.value);
  }

  let pbSectorRatio: number | null = null;
  if (pb != null && sector.medianPb?.value != null && sector.medianPb.value > 0) {
    pbSectorRatio = round2(pb / sector.medianPb.value);
  }

  // Percentiles
  let pePercentile: number | null = null;
  let pbPercentile: number | null = null;

  if (monthlyPoints.length > 0 && annual.length > 0) {
    const sortedAnnuals = [...annual].sort((a, b) => {
      const dateA = a.periodEnd ?? (a as unknown as { yearEnd?: string }).yearEnd ?? "";
      const dateB = b.periodEnd ?? (b as unknown as { yearEnd?: string }).yearEnd ?? "";
      return dateA.localeCompare(dateB);
    });

    const histPes: number[] = [];
    const histPbs: number[] = [];

    for (const pt of monthlyPoints) {
      let trailing = sortedAnnuals[0];
      for (const yr of sortedAnnuals) {
        const yrDate = yr.periodEnd ?? (yr as unknown as { yearEnd?: string }).yearEnd ?? "";
        if (yrDate <= pt.date) {
          trailing = yr;
        } else {
          break;
        }
      }

      if (trailing) {
        if (trailing.epsInr > 0) {
          histPes.push(pt.close / trailing.epsInr);
        }
        const shares =
          (stock as unknown as { shareCountCr?: { value: number } }).shareCountCr?.value ??
          trailing.sharesOutstandingCr;
        if (shares != null && trailing.netWorthCr > 0) {
          histPbs.push((pt.close * shares) / trailing.netWorthCr);
        }
      }
    }

    if (pe != null && histPes.length > 0) {
      const count = histPes.filter((val) => val <= pe).length;
      pePercentile = round1((count / histPes.length) * 100);
    }

    if (pb != null && histPbs.length > 0) {
      const count = histPbs.filter((val) => val <= pb).length;
      pbPercentile = round1((count / histPbs.length) * 100);
    }
  }

  // Chart segments
  const chartSegments: ChartSegment[] = [];
  if (monthlyPoints.length > 0 && indexPoints.length > 0) {
    const stockBase = monthlyPoints[0].close;
    const indexBase = indexPoints[0].close;

    const indexByDate = new Map<string, number>();
    for (const pt of indexPoints) {
      indexByDate.set(pt.date, pt.close);
    }

    const allPoints: ChartPoint[] = monthlyPoints.map((pt, idx) => {
      const stockIndexed = stockBase > 0 ? round1((pt.close / stockBase) * 100) : 100;
      const indexClose =
        indexByDate.get(pt.date) ?? indexPoints[Math.min(idx, indexPoints.length - 1)].close;
      const indexIndexed = indexBase > 0 ? round1((indexClose / indexBase) * 100) : 100;
      return {
        date: pt.date,
        stockIndexed,
        indexIndexed,
      };
    });

    const cas = stock.corporateActions ?? [];
    const minDate = allPoints[0].date;
    const maxDate = allPoints[allPoints.length - 1].date;

    const windowCas = cas
      .filter((ca) => ca.effectiveDate > minDate && ca.effectiveDate <= maxDate)
      .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));

    if (windowCas.length === 0) {
      chartSegments.push({ points: allPoints });
    } else {
      let currentSegmentPoints: ChartPoint[] = [];
      let caIdx = 0;
      let nextCa: (typeof windowCas)[number] | undefined = windowCas[0];

      for (const pt of allPoints) {
        if (nextCa && pt.date >= nextCa.effectiveDate) {
          if (currentSegmentPoints.length > 0) {
            chartSegments.push({
              points: currentSegmentPoints,
              corporateActionLabel:
                chartSegments.length === 0 ? undefined : windowCas[caIdx - 1]?.description,
            });
          }
          currentSegmentPoints = [pt];
          caIdx++;
          nextCa = windowCas[caIdx];
        } else {
          currentSegmentPoints.push(pt);
        }
      }

      if (currentSegmentPoints.length > 0) {
        chartSegments.push({
          points: currentSegmentPoints,
          corporateActionLabel: windowCas[caIdx - 1]?.description,
        });
      }
    }
  }

  // Refs collection
  const refs: Record<string, Ref> = {};
  const ticker = stock.ticker;
  const annualAsOf = stock.financials?.annual?.asOf ?? "";
  const annualSource = stock.financials?.annual?.source ?? "";

  // Data refs
  if (latestClose > 0) {
    const ref = createDataRef(`${ticker}:close`, latestClose, "price", closeAsOf, closeSource);
    refs[ref.id] = ref;
    refs["latestClose"] = ref;
  }

  if (latestAnnual) {
    if (latestAnnual.epsInr != null) {
      const ref = createDataRef(`${ticker}:eps`, latestAnnual.epsInr, "price", annualAsOf, annualSource);
      refs[ref.id] = ref;
      refs["eps"] = ref;
    }
    if (latestAnnual.dpsInr != null) {
      const ref = createDataRef(`${ticker}:dps`, latestAnnual.dpsInr, "price", annualAsOf, annualSource);
      refs[ref.id] = ref;
      refs["dps"] = ref;
    }
    if (latestAnnual.revenueCr != null) {
      const ref = createDataRef(`${ticker}:revenue`, latestAnnual.revenueCr, "crore", annualAsOf, annualSource);
      refs[ref.id] = ref;
      refs["revenue"] = ref;
    }
    if (latestAnnual.ebitdaCr != null) {
      const ref = createDataRef(`${ticker}:ebitda`, latestAnnual.ebitdaCr, "crore", annualAsOf, annualSource);
      refs[ref.id] = ref;
      refs["ebitda"] = ref;
    }
    if (latestAnnual.ebitCr != null) {
      const ref = createDataRef(`${ticker}:ebit`, latestAnnual.ebitCr, "crore", annualAsOf, annualSource);
      refs[ref.id] = ref;
      refs["ebit"] = ref;
    }
    if (latestAnnual.patCr != null) {
      const ref = createDataRef(`${ticker}:pat`, latestAnnual.patCr, "crore", annualAsOf, annualSource);
      refs[ref.id] = ref;
      refs["pat"] = ref;
    }
    if (latestAnnual.netWorthCr != null) {
      const ref = createDataRef(`${ticker}:netWorth`, latestAnnual.netWorthCr, "crore", annualAsOf, annualSource);
      refs[ref.id] = ref;
      refs["netWorth"] = ref;
    }
    if (latestAnnual.totalDebtCr != null) {
      const ref = createDataRef(`${ticker}:totalDebt`, latestAnnual.totalDebtCr, "crore", annualAsOf, annualSource);
      refs[ref.id] = ref;
      refs["totalDebt"] = ref;
    }
    if (latestAnnual.interestExpenseCr != null) {
      const ref = createDataRef(`${ticker}:interestExpense`, latestAnnual.interestExpenseCr, "crore", annualAsOf, annualSource);
      refs[ref.id] = ref;
      refs["interestExpense"] = ref;
    }
    if (shareCountCr != null) {
      const ref = createDataRef(`${ticker}:sharesOutstanding`, shareCountCr, "crore", annualAsOf, annualSource);
      refs[ref.id] = ref;
      refs["sharesOutstanding"] = ref;
    }
  }

  // Sector median refs
  if (sector.medianPe?.value != null) {
    const ref = createDataRef(`${sector.id}:medianPe`, sector.medianPe.value, "ratio", sector.medianPe.asOf, sector.medianPe.source);
    refs[ref.id] = ref;
  }
  if (sector.medianPb?.value != null) {
    const ref = createDataRef(`${sector.id}:medianPb`, sector.medianPb.value, "ratio", sector.medianPb.asOf, sector.medianPb.source);
    refs[ref.id] = ref;
  }

  // Derived refs
  if (marketCapCr != null) {
    const ref = createDerivedRef(`${ticker}:marketCap`, marketCapCr, "crore", "close * sharesOutstanding", [
      `${ticker}:close`,
      `${ticker}:sharesOutstanding`,
    ]);
    refs[ref.id] = ref;
    refs["marketCap"] = ref;
  }

  if (oneSessionMovePct != null) {
    const ref = createDerivedRef(
      `${ticker}:oneSessionMove`,
      oneSessionMovePct,
      "percent",
      "((latestClose - prevClose) / prevClose) * 100",
      [`${ticker}:close`],
    );
    refs[ref.id] = ref;
    refs["oneSessionMove"] = ref;
  }

  if (pe != null) {
    const ref = createDerivedRef(`${ticker}:pe`, pe, "ratio", "close / eps", [`${ticker}:close`, `${ticker}:eps`]);
    refs[ref.id] = ref;
    refs["pe"] = ref;
  }

  if (pb != null) {
    const ref = createDerivedRef(`${ticker}:pb`, pb, "ratio", "marketCap / netWorth", [`${ticker}:marketCap`, `${ticker}:netWorth`]);
    refs[ref.id] = ref;
    refs["pb"] = ref;
  }

  if (dividendYieldPct != null) {
    const ref = createDerivedRef(`${ticker}:dividendYield`, dividendYieldPct, "percent", "(dps / close) * 100", [
      `${ticker}:dps`,
      `${ticker}:close`,
    ]);
    refs[ref.id] = ref;
    refs["dividendYield"] = ref;
  }

  if (roePct != null) {
    const ref = createDerivedRef(`${ticker}:roe`, roePct, "percent", "(pat / netWorth) * 100", [`${ticker}:pat`, `${ticker}:netWorth`]);
    refs[ref.id] = ref;
    refs["roe"] = ref;
  }

  if (rocePct != null) {
    const ref = createDerivedRef(`${ticker}:roce`, rocePct, "percent", "(ebit / (netWorth + totalDebt)) * 100", [
      `${ticker}:ebit`,
      `${ticker}:netWorth`,
      `${ticker}:totalDebt`,
    ]);
    refs[ref.id] = ref;
    refs["roce"] = ref;
  }

  if (operatingMarginPct != null) {
    const ref = createDerivedRef(`${ticker}:operatingMargin`, operatingMarginPct, "percent", "(ebitda / revenue) * 100", [
      `${ticker}:ebitda`,
      `${ticker}:revenue`,
    ]);
    refs[ref.id] = ref;
    refs["operatingMargin"] = ref;
  }

  if (debtToEquity != null) {
    const ref = createDerivedRef(`${ticker}:debtToEquity`, debtToEquity, "ratio", "totalDebt / netWorth", [
      `${ticker}:totalDebt`,
      `${ticker}:netWorth`,
    ]);
    refs[ref.id] = ref;
    refs["debtToEquity"] = ref;
  }

  if (interestCoverTimes != null) {
    const ref = createDerivedRef(`${ticker}:interestCover`, interestCoverTimes, "times", "ebit / interestExpense", [
      `${ticker}:ebit`,
      `${ticker}:interestExpense`,
    ]);
    refs[ref.id] = ref;
    refs["interestCover"] = ref;
  }

  if (revenueCagrPct != null) {
    const ref = createDerivedRef(
      `${ticker}:revenueCagr`,
      revenueCagrPct,
      "percent",
      "((revenueLatest / revenueFirst) ** (1/4) - 1) * 100",
      [`${ticker}:revenue`],
    );
    refs[ref.id] = ref;
    refs["revenueCagr"] = ref;
  }

  if (patCagrPct != null) {
    const ref = createDerivedRef(
      `${ticker}:patCagr`,
      patCagrPct,
      "percent",
      "((patLatest / patFirst) ** (1/4) - 1) * 100",
      [`${ticker}:pat`],
    );
    refs[ref.id] = ref;
    refs["patCagr"] = ref;
  }

  if (volatilityPct != null) {
    const ref = createDerivedRef(`${ticker}:volatility`, volatilityPct, "percent", "stddev(monthlyReturns) * sqrt(12) * 100", []);
    refs[ref.id] = ref;
    refs["volatility"] = ref;
  }

  if (maxDrawdownPct != null) {
    const ref = createDerivedRef(`${ticker}:maxDrawdown`, maxDrawdownPct, "percent", "min((close - peak) / peak) * 100", []);
    refs[ref.id] = ref;
    refs["maxDrawdown"] = ref;
  }

  if (peSectorRatio != null) {
    const ref = createDerivedRef(`${ticker}:peSectorRatio`, peSectorRatio, "ratio", "pe / sectorMedianPe", [
      `${ticker}:pe`,
      `${sector.id}:medianPe`,
    ]);
    refs[ref.id] = ref;
    refs["peSectorRatio"] = ref;
  }

  if (pbSectorRatio != null) {
    const ref = createDerivedRef(`${ticker}:pbSectorRatio`, pbSectorRatio, "ratio", "pb / sectorMedianPb", [
      `${ticker}:pb`,
      `${sector.id}:medianPb`,
    ]);
    refs[ref.id] = ref;
    refs["pbSectorRatio"] = ref;
  }

  // asOf dates map
  const asOfDates: Record<string, string> = {
    latestClose: closeAsOf,
    recentPrices: stock.recentPrices?.asOf ?? "",
    prices: stock.prices?.asOf ?? "",
    financials: annualAsOf,
    pe: closeAsOf,
    pb: closeAsOf,
    dividendYield: closeAsOf,
    roe: annualAsOf,
    roce: annualAsOf,
    operatingMargin: annualAsOf,
    debtToEquity: annualAsOf,
    interestCover: annualAsOf,
    revenueCagr: annualAsOf,
    patCagr: annualAsOf,
    sector: sector.medianPe?.asOf ?? "",
    index: index.prices?.asOf ?? "",
  };

  const values: MetricValues = {
    pe,
    pb,
    dividendYieldPct,
    roePct,
    rocePct,
    operatingMarginPct,
    debtToEquity,
    interestCoverTimes,
    revenueCagrPct,
    patCagrPct,
    volatilityPct,
    maxDrawdownPct,
    pePercentile,
    pbPercentile,
    peSectorRatio,
    pbSectorRatio,
    yearsWithDividend,
    latestClose,
    oneSessionMovePct,
    fiveYearReturnPct,
    indexReturnPct,
  };

  return {
    ticker: stock.ticker,
    name: stock.name,
    sectorId: stock.sectorId,
    sectorName: sector.name,
    sectorModel: stock.sectorModel,
    values,
    refs,
    chartSegments,
    asOfDates,
    isTailExpired,
    isMonthlyExpired,
  };
}
