"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { ExternalLink, FileText, Globe, Clock } from "lucide-react";

interface Citation {
  id: number;
  source: string;
  date?: string;
  url?: string;
  title?: string;
  type?: "yahoo" | "screener" | "snapshot" | "filing" | "news";
}

interface CitationTooltipProps {
  citation: Citation;
  children: React.ReactNode;
}

const typeStyles = {
  yahoo: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  screener: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  snapshot: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  filing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  news: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const typeIcons = {
  yahoo: <Globe className="h-3 w-3" />,
  screener: <FileText className="h-3 w-3" />,
  snapshot: <Globe className="h-3 w-3" />,
  filing: <FileText className="h-3 w-3" />,
  news: <Globe className="h-3 w-3" />,
};

export function CitationTooltip({ citation, children }: CitationTooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
          contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-0.5"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {children}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-zinc-50 shadow-lg border border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="flex items-start gap-2">
              <div className={cn("h-6 w-6 rounded flex items-center justify-center shrink-0", typeStyles[citation.type || "yahoo"])}>
                {typeIcons[citation.type || "yahoo"]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs">{citation.source}</div>
                <div className="text-zinc-300 dark:text-zinc-300">{citation.title || "Source details"}</div>
              </div>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InlineCitationProps {
  citations: Citation[];
  text: string;
}

export function InlineCitations({ citations, text }: InlineCitationProps) {
  if (!citations.length) return <span>{text}</span>;

  return (
    <span className="relative">
      {text}
      <span className="ml-1 flex items-center gap-1">
        {citations.map((citation, i) => (
          <CitationTooltip key={i} citation={citation}>
            <sup className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary text-[10px] font-mono font-semibold hover:bg-primary/20 transition-colors cursor-help" title={`${citation.source} - ${citation.date ? new Date(citation.date).toLocaleDateString() : "No date"}`}>
              {i + 1}
            </sup>
          </CitationTooltip>
        ))}
      </span>
    </span>
  );
}

interface CitationListProps {
  citations: Citation[];
  title?: string;
}

export function CitationList({ citations, title = "Sources" }: CitationListProps) {
  if (!citations.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/50">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        {title}
        <span className="px-2 py-0.5 text-[10px] font-mono bg-muted rounded text-muted-foreground">
          {citations.length}
        </span>
      </h4>
      <div className="space-y-2">
        {citations.map((citation, i) => (
          <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono text-muted-foreground shrink-0">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{citation.source}</span>
                  {citation.type && (
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-mono", typeStyles[citation.type])}>
                      {citation.type.toUpperCase()}
                    </span>
                  )}
                </div>
                {citation.title && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{citation.title}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  {citation.date && (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>{new Date(citation.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </>
                  )}
                  {citation.url && (
                    <a href={citation.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                      <ExternalLink className="h-3 w-3" />
                      <span>View Source</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}