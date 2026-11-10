"use client";

import React from "react";
import Link from "next/link";
import { useBull } from "@/lib/state/use-bull";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";

export function Footer() {
  const { locale } = useBull();
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/80 text-xs text-zinc-500 dark:text-zinc-400 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-sm">
                Bull
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                v0.1.0 · Capstone
              </span>
            </div>
            <p className="text-xs text-zinc-500 max-w-md">
              {copy.disclaimers.educationNote}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              {copy.nav.chat}
            </Link>
            <Link href="/shortlist" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              {copy.nav.shortlist}
            </Link>
            <Link href="/compare" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              {copy.nav.compare}
            </Link>
            <Link href="/academy" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              {copy.nav.academy}
            </Link>
            <Link href="/method" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              {copy.nav.method}
            </Link>
            <Link href="/progress" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              {copy.nav.progress}
            </Link>
          </div>
        </div>

        {/* SEBI Notice Callout */}
        <div className="p-3.5 rounded-lg border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
          <span className="font-semibold">{copy.disclaimers.sebiNotice}</span>{" "}
          <span>{copy.disclaimers.generalDisclaimer}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-400">
          <p>© 2026 Bull · Applied Financial Literacy & Stock Learning Studio</p>
          <p className="font-mono">Live Quotes via Yahoo Finance · NSE, BSE & Global Equities</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
