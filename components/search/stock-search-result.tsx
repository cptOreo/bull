"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/formatters";
import { ChevronRight, Building2 } from "lucide-react";
import { useStock } from "@/hooks/use-stock";

interface StockSearchResultProps {
  stock: {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
    price?: number;
    change?: number;
    changePercent?: number;
    currency?: string;
  };
}

export function StockSearchResult({ stock }: StockSearchResultProps) {
  const { data: liveData } = useStock(stock.symbol);
  const displayStock = liveData || stock;
  const isPositive = (displayStock.changePercent ?? 0) >= 0;
  const symbol = "ticker" in displayStock ? displayStock.ticker : displayStock.symbol;
  const exchange = "exchange" in displayStock ? displayStock.exchange : "NSE";
  const cleanSymbol = symbol.replace(".NS", "").replace(".BO", "");

  return (
    <Link
      href={`/stock/${cleanSymbol}`}
      className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors group"
      onClick={(e) => { e.preventDefault(); window.location.href = `/stock/${cleanSymbol}`; }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold truncate">{cleanSymbol}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{exchange}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{displayStock.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 ml-4 shrink-0">
        {displayStock.price != null && (
          <div className="text-right">
            <p className="font-mono font-medium tabular-nums">
              {displayStock.currency === "INR" ? "₹" : "$"}{formatPrice(displayStock.price)}
            </p>
            <p className={cn("text-xs font-mono tabular-nums", isPositive ? "text-positive" : "text-negative")}>
              {isPositive ? "+" : ""}{displayStock.changePercent?.toFixed(2)}%
            </p>
          </div>
        )}
        <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
}