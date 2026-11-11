"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { StockHeader } from "@/components/stock/stock-header";
import { StockTabs } from "@/components/stock/stock-tabs";
import { PriceChart } from "@/components/stock/price-chart";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useStock, useStockHistory } from "@/hooks/use-stock";
import { Skeleton } from "@/ui/skeleton";

export default function StockPage() {
  const params = useParams();
  const ticker = (params.ticker as string)?.toUpperCase();
  const symbol = ticker?.includes(".") ? ticker : `${ticker}.NS`;

  const { data: stock, isLoading, error } = useStock(symbol, { enabled: !!ticker });
  const { data: priceHistory } = useStockHistory(symbol, "5y", "1d", { enabled: !!ticker });

  if (isLoading) return <StockSkeleton />;
  if (error || !stock) return notFound();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-1">
      <div className="flex-1 lg:pr-8 pb-8 lg:pb-0 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 lg:px-6 py-6 space-y-8">
          <StockHeader stock={stock} />
          <PriceChart data={priceHistory?.daily || []} ticker={stock.ticker} currency={stock.currency} />
          <StockTabs stock={stock} />
        </div>
      </div>
      <aside className="hidden lg:block w-96 border-l glass dark:glass-dark">
        <ChatPanel defaultMode="tutor" context={{ stock: stock.ticker, page: "stock" }} />
      </aside>
    </motion.div>
  );
}

function StockSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 lg:px-6 py-6 space-y-8">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}