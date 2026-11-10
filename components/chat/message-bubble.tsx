import React from "react";
import { cn } from "@/lib/utils";
import type {
  Block,
  Locale,
  Option,
  ProfileField,
  ShortlistCard,
  DetailSection,
  ComparisonRow,
  NewsItemView,
} from "@/lib/engine/types";
import { snapshot } from "@/lib/data/snapshot";
import { formatPrice, formatSignedPercent } from "@/lib/engine/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DataBadge } from "@/components/ui/data-badge";
import { EducationNote } from "@/components/ui/education-note";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";
import { StockSnapshotCard } from "./stock-snapshot-card";

export interface MessageBubbleProps {
  sender: "user" | "assistant";
  text?: string;
  blocks?: Block[];
  followUps?: string[];
  timestamp?: string;
  locale?: Locale;
  onSelectOption?: (value: string) => void;
  onSelectIntakeOption?: (field: ProfileField, value: string) => void;
  className?: string;
}

export function BullEmblem() {
  return (
    <div
      aria-label="Bull Assistant"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
      >
        {/* Geometric minimalist bull horns & head */}
        <path d="M4.5 4.5c1.5 2 3.5 3.5 6 3.5h3c2.5 0 4.5-1.5 6-3.5.5-.6 1.5-.2 1.5.6v2.4c0 3-2 5.5-5 6v2c0 2.2-1.8 4-4 4s-4-1.8-4-4v-2c-3-.5-5-3-5-6V5.1c0-.8 1-1.2 1.5-.6z" />
      </svg>
    </div>
  );
}

export function UserAvatar() {
  return (
    <div
      aria-label="User"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-200 font-mono text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    >
      U
    </div>
  );
}

// -------------------------------------------------------------
// Polymorphic Block Renderers
// -------------------------------------------------------------

function TextBlock({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line space-y-2">
      {text}
    </div>
  );
}

function ShortlistBlock({
  cards,
  thinFit,
  diversityNote,
  howChosen,
  locale,
}: {
  cards: ShortlistCard[];
  thinFit: boolean;
  diversityNote?: string;
  howChosen?: { weights: Record<string, number>; anchorsSummary: string; sectorCap: number; threshold: number };
  locale: Locale;
}) {
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  return (
    <div className="w-full space-y-4">
      {thinFit && (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
          {copy.shortlist.thinFitBanner}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-1">
        {cards.map((card, index) => (
          <Card key={card.ticker} className="overflow-hidden border-zinc-200/90 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 font-mono text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {index + 1}
                    </span>
                    <span className="font-mono text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                      {card.ticker}
                    </span>
                    <Badge variant="outline" className="text-[11px]">
                      {card.sectorName}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{card.name}</p>
                </div>
                <DataBadge asOf={card.asOf} sourceLabel={card.sourceLabel} />
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
              {card.businessDescription && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {card.businessDescription}
                </p>
              )}

              {card.reasons && card.reasons.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Key Reasons
                  </p>
                  <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                    {card.reasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {card.riskSentence && (
                <div className="rounded-md border border-amber-200/60 bg-amber-50/50 px-2.5 py-1.5 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                  <span className="font-medium">Risk note: </span>
                  {card.riskSentence}
                </div>
              )}

              {card.factorBars && card.factorBars.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {copy.shortlist.factorBarsTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {card.factorBars.map((fb) => (
                      <div key={fb.factor} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500 capitalize">{fb.label || fb.factor}</span>
                          <span className="font-mono font-medium">{Math.round(fb.score)}</span>
                        </div>
                        <Progress value={fb.score} max={100} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {diversityNote && (
        <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">
            {copy.shortlist.diversityNoteTitle}
          </p>
          <p>{diversityNote}</p>
        </div>
      )}

      {howChosen && (
        <details className="rounded-lg border border-zinc-200/80 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <summary className="font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none hover:text-zinc-950 dark:hover:text-zinc-100">
            {copy.shortlist.howChosenTitle}
          </summary>
          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-zinc-600 dark:text-zinc-400">
            <p>{copy.shortlist.howChosenIntro}</p>
            <p>{copy.shortlist.sectorCapNote}</p>
            {howChosen.anchorsSummary && <p className="font-mono">{howChosen.anchorsSummary}</p>}
          </div>
        </details>
      )}
    </div>
  );
}

function StockDetailBlock({
  ticker,
  sections,
  locale,
}: {
  ticker: string;
  sections: DetailSection[];
  locale: Locale;
}) {
  const stock = snapshot.stocks.find((s) => s.ticker === ticker);
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  const points = stock?.recentPrices?.value?.points ?? [];
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;
  const prevPoint = points.length > 1 ? points[points.length - 2] : null;

  const latestClose = latestPoint ? latestPoint.close : null;
  const movePct =
    latestPoint && prevPoint && prevPoint.close > 0
      ? ((latestPoint.close - prevPoint.close) / prevPoint.close) * 100
      : null;

  return (
    <Card className="w-full overflow-hidden border-zinc-200/90 dark:border-zinc-800">
      <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                {ticker}
              </span>
              {stock?.sectorId && (
                <Badge variant="secondary" className="uppercase text-[11px]">
                  {stock.sectorId}
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {stock?.name || ticker}
            </p>
          </div>

          {latestClose !== null && (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="font-mono text-lg font-bold tabular-nums text-zinc-950 dark:text-zinc-50">
                  ₹{formatPrice(latestClose)}
                </span>
                {movePct !== null && (
                  <Badge
                    variant={movePct >= 0 ? "success" : "destructive"}
                    className="text-[11px] font-mono"
                  >
                    {formatSignedPercent(movePct)}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">
                {copy.stockDetail.latestCloseLabel} · {stock?.recentPrices.asOf}
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {stock?.businessSummary && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {stock.businessSummary.value}
          </p>
        )}

        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {section.title}
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {section.rows.map((row, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-2.5 dark:border-zinc-800 dark:bg-zinc-850/50"
                >
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{row.label}</p>
                  <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {row.value}
                  </p>
                  {row.note && (
                    <p className="mt-0.5 text-[10px] text-zinc-400 truncate">{row.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ComparisonBlock({
  tickers,
  rows,
  locale,
}: {
  tickers: [string, string];
  rows: ComparisonRow[];
  locale: Locale;
}) {
  const [tickerA, tickerB] = tickers;
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  return (
    <Card className="w-full overflow-hidden border-zinc-200/90 dark:border-zinc-800">
      <CardHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="grid grid-cols-3 items-center text-xs font-semibold">
          <span className="text-zinc-500">{copy.compare.title}</span>
          <span className="text-center font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {tickerA}
          </span>
          <span className="text-center font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {tickerB}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-3 items-center p-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <span className="font-medium text-zinc-600 dark:text-zinc-400 truncate">
                {row.label}
              </span>
              <span className="text-center font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {row.stockAValue}
              </span>
              <span className="text-center font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {row.stockBValue}
              </span>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-zinc-100 bg-zinc-50/40 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
          {copy.compare.noWinnerNotice}
        </div>
      </CardContent>
    </Card>
  );
}

function NewsBlock({ items }: { items: NewsItemView[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full space-y-2.5">
      {items.map((item, idx) => (
        <Card key={idx} className="p-3.5 border-zinc-200/90 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                {item.kind}
              </Badge>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.sourceName}</span>
            </div>
            <span className="font-mono">{item.publishedAt}</span>
          </div>

          <h4 className="mt-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:underline hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                {item.headline} ↗
              </a>
            ) : (
              item.headline
            )}
          </h4>

          {item.summary && (
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {item.summary}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function BoundaryBlock({
  topic,
  explanation,
}: {
  topic: "advice" | "concentration" | "injection" | "universe";
  explanation: string;
}) {
  const topicTitles: Record<string, string> = {
    advice: "Investment Advice Boundary",
    concentration: "Concentration Risk Boundary",
    injection: "Prompt Injection Boundary",
    universe: "Universe Scope Boundary",
  };

  return (
    <Card className="w-full border-amber-200/90 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20">
      <CardHeader className="p-3.5 pb-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <CardTitle className="text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
            {topicTitles[topic] || "Topic Boundary"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3.5 pt-1 space-y-2 text-xs text-amber-900/90 dark:text-amber-200/90">
        <p className="leading-relaxed">{explanation}</p>
        <div className="rounded-md border border-amber-200/60 bg-white/60 p-2 text-[11px] text-zinc-600 dark:border-amber-900/40 dark:bg-zinc-900/40 dark:text-zinc-400">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Covered in-universe alternatives: </span>
          TCS, INFY, HDFCBANK, ICICIBANK, RELIANCE, ITC, LT, BHARTIARTL, HINDUNILVR, KOTAKBANK, SBIN, AXISBANK.
        </div>
      </CardContent>
    </Card>
  );
}

function LimitationsBlock({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <Card className="w-full border-zinc-200/90 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/30">
      <CardHeader className="p-3.5 pb-1">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Important Limitations & Assumptions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3.5 pt-1 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        <ul className="list-disc pl-4 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
        <p className="pt-1.5 text-[10px] text-zinc-400 font-mono">
          Snapshot frozen for academic research. Not for execution or live trading.
        </p>
      </CardContent>
    </Card>
  );
}

function CoverageMissBlock({ name, reason }: { name: string; reason: string | null }) {
  return (
    <Card className="w-full border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader className="p-3.5 pb-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-zinc-600 dark:text-zinc-400">
            Off-Universe
          </Badge>
          <CardTitle className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {name} is not covered in Bull v0
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3.5 pt-1 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
        <p className="leading-relaxed">
          {reason ||
            "Bull v0 focuses exclusively on an educational sample of 12 constituent companies from the Nifty 50."}
        </p>
        <div className="rounded-md bg-zinc-50 p-2.5 text-[11px] text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
          Try asking about covered companies: <span className="font-mono font-medium">TCS, INFY, HDFCBANK, RELIANCE, ITC</span>.
        </div>
      </CardContent>
    </Card>
  );
}

function IntakeQuestionBlock({
  field,
  question,
  options,
  onSelectIntakeOption,
}: {
  field: ProfileField;
  question: string;
  options: Option[];
  onSelectIntakeOption?: (field: ProfileField, value: string) => void;
}) {
  return (
    <div className="w-full space-y-2.5">
      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelectIntakeOption?.(field, opt.value)}
            className={cn(
              "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs transition-all",
              "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950",
              "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600",
              "active:scale-[0.98] cursor-pointer"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoicesBlock({
  question,
  options,
  onSelectOption,
}: {
  question: string;
  options: Option[];
  onSelectOption?: (value: string) => void;
}) {
  return (
    <div className="w-full space-y-2.5">
      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelectOption?.(opt.value)}
            className={cn(
              "rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs transition-all",
              "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950",
              "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600",
              "active:scale-[0.98] cursor-pointer"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileSummaryBlock({
  profile,
  assumed,
}: {
  profile: Record<string, string>;
  assumed: ProfileField[];
}) {
  return (
    <Card className="w-full border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Active Investor Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(profile).map(([key, val]) => {
            const isAssumed = assumed.includes(key as ProfileField);
            return (
              <Badge
                key={key}
                variant={isAssumed ? "outline" : "secondary"}
                className="text-[11px] capitalize"
              >
                <span className="text-zinc-400 lowercase">{key}:</span> {val}
                {isAssumed && <span className="text-[10px] opacity-75 font-normal">(assumed)</span>}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------
// Message Bubble Component
// -------------------------------------------------------------

export function MessageBubble({
  sender,
  text,
  blocks = [],
  followUps,
  timestamp,
  locale = "en",
  onSelectOption,
  onSelectIntakeOption,
  className,
}: MessageBubbleProps) {
  const isUser = sender === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3 py-2.5",
        isUser ? "flex-row-reverse justify-start" : "flex-row justify-start",
        className
      )}
    >
      {/* Avatar or Emblem */}
      {isUser ? <UserAvatar /> : <BullEmblem />}

      {/* Bubble Container */}
      <div
        className={cn(
          "flex flex-col space-y-2 max-w-[85%] sm:max-w-[75%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* User simple text bubble: crisp dark/light stone pill */}
        {isUser && text && (
          <div className="rounded-2xl rounded-tr-xs bg-stone-900 px-4 py-2.5 text-sm font-normal text-stone-50 shadow-xs dark:bg-stone-100 dark:text-stone-900">
            {text}
          </div>
        )}

        {/* Assistant content */}
        {!isUser && (
          <div className="w-full space-y-3">
            {text && <TextBlock text={text} />}

            {blocks &&
              blocks.map((block, index) => {
                switch (block.type) {
                  case "text":
                    return <TextBlock key={index} text={block.text} />;
                  case "shortlist":
                    return (
                      <ShortlistBlock
                        key={index}
                        cards={block.cards}
                        thinFit={block.thinFit}
                        diversityNote={block.diversityNote}
                        howChosen={block.howChosen}
                        locale={locale}
                      />
                    );
                  case "stock_detail":
                    return (
                      <StockDetailBlock
                        key={index}
                        ticker={block.ticker}
                        sections={block.sections}
                        locale={locale}
                      />
                    );
                  case "stock_snapshot":
                    return (
                      <StockSnapshotCard
                        key={index}
                        snapshot={block.snapshot}
                      />
                    );
                  case "comparison":
                    return (
                      <ComparisonBlock
                        key={index}
                        tickers={block.tickers}
                        rows={block.rows}
                        locale={locale}
                      />
                    );
                  case "news":
                    return <NewsBlock key={index} items={block.items} />;
                  case "boundary":
                    return (
                      <BoundaryBlock
                        key={index}
                        topic={block.topic}
                        explanation={block.explanation}
                      />
                    );
                  case "education_note":
                    return <EducationNote key={index} text={block.text} locale={locale} />;
                  case "limitations":
                    return <LimitationsBlock key={index} items={block.items} />;
                  case "coverage_miss":
                    return (
                      <CoverageMissBlock
                        key={index}
                        name={block.name}
                        reason={block.reason}
                      />
                    );
                  case "intake_question":
                    return (
                      <IntakeQuestionBlock
                        key={index}
                        field={block.field}
                        question={block.question}
                        options={block.options}
                        onSelectIntakeOption={onSelectIntakeOption}
                      />
                    );
                  case "choices":
                    return (
                      <ChoicesBlock
                        key={index}
                        question={block.question}
                        options={block.options}
                        onSelectOption={onSelectOption}
                      />
                    );
                  case "profile_summary":
                    return (
                      <ProfileSummaryBlock
                        key={index}
                        profile={block.profile as unknown as Record<string, string>}
                        assumed={block.assumed}
                      />
                    );
                  default:
                    return null;
                }
              })}

            {/* Dynamic Follow-up Suggestion Chips */}
            {followUps && followUps.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2" aria-label="Follow-up suggestions">
                {followUps.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectOption?.(chip)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50/90 px-3 py-1.5 text-xs font-medium text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-100 hover:text-stone-950 active:scale-95 dark:border-stone-700 dark:bg-stone-850 dark:text-stone-200 dark:hover:border-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-50 cursor-pointer shadow-2xs"
                  >
                    <span>{chip}</span>
                    <span className="text-stone-400 dark:text-stone-500 text-[11px]" aria-hidden="true">
                      →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {timestamp && (
          <span className="font-mono text-[10px] text-zinc-400">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
