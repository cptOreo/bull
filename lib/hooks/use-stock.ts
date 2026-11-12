import { useQuery } from "@tanstack/react-query";
import { getStockSnapshot, getPriceHistory, searchStocks, LiveStockSnapshot } from "@/data/yahoo-client";
import { transformPriceHistory, mergeSnapshots, type PriceSeries } from "@/data/transformers";
import { cacheStockQuote, getCachedStockQuote, cacheStockHistory, getCachedStockHistory } from "@/data/indexed-db";

interface UseStockOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useStock(symbol: string | undefined, options: UseStockOptions = {}) {
  const { enabled = true, staleTime = 30000 } = options;

  return useQuery({
    queryKey: ["stock", symbol?.toUpperCase()],
    queryFn: async () => {
      if (!symbol) throw new Error("No symbol provided");
      
      const upperSymbol = symbol.toUpperCase();
      
      // Check cache first
      const cached = await getCachedStockQuote(upperSymbol, staleTime);
      const primary: LiveStockSnapshot | null = cached ? JSON.parse(JSON.stringify(cached)) : null;

      // Fetch fresh data
      const fresh = await getStockSnapshot(upperSymbol);
      
      // Merge with cached fallback
      const merged = mergeSnapshots(fresh, primary);
      
      if (merged) {
        await cacheStockQuote(upperSymbol, merged);
      }
      
      return merged;
    },
    enabled: enabled && !!symbol,
    staleTime,
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
}

export function useStockHistory(
  symbol: string | undefined,
  range: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max" = "1y",
  interval: "1m" | "5m" | "15m" | "30m" | "60m" | "1d" | "1wk" | "1mo" = "1d",
  options: UseStockOptions = {}
) {
  const { enabled = true, staleTime = 300000 } = options; // 5 min for history

  return useQuery<PriceSeries | null>({
    queryKey: ["stock", "history", symbol?.toUpperCase(), range, interval],
    queryFn: async (): Promise<PriceSeries | null> => {
      if (!symbol) throw new Error("No symbol provided");
      
      const upperSymbol = symbol.toUpperCase();
      
      const cached = await getCachedStockHistory(upperSymbol, range, interval, staleTime);
      if (cached) return cached;

      const history = await getPriceHistory(upperSymbol, range, interval);
      if (!history) return null;

      const transformed = transformPriceHistory(
        history.timestamps,
        history.closes,
        history.highs,
        history.lows,
        history.volumes,
        interval
      );

      await cacheStockHistory(upperSymbol, range, interval, transformed);
      return transformed;
    },
    enabled: enabled && !!symbol,
    staleTime,
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function useStockSearch(query: string, options: UseStockOptions = {}) {
  const { enabled = true, staleTime = 300000 } = options;

  return useQuery({
    queryKey: ["stock", "search", query.toLowerCase()],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      return searchStocks(query);
    },
    enabled: enabled && query.length >= 2,
    staleTime,
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}