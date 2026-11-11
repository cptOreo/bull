"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, ChevronUp, Loader2, CheckCircle, AlertCircle, Terminal } from "lucide-react";
import { formatPrice, formatPercent, formatRatio, formatCrore } from "@/lib/utils/formatters";

interface ToolInvocationProps {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
  id: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

function formatResult(result: unknown): React.ReactNode {
  if (!result) return <span className="text-muted-foreground">No result</span>;
  
  if (typeof result === "string") {
    return <pre className="text-xs font-mono text-sm p-2 bg-muted rounded">{result}</pre>;
  }
  
  if (typeof result === "object" && result !== null) {
    // Check for error
    if ("error" in result) {
      return (
        <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-rose-600 dark:text-rose-400 text-xs font-mono p-2">
          Error: {String(result.error)}
        </div>
      );
    }
    
    // Format as pretty JSON
    try {
      const jsonStr = JSON.stringify(result, null, 2);
      return (
        <pre className="text-xs font-mono text-sm p-2 bg-muted rounded overflow-x-auto max-h-64 overflow-y-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      );
    } catch {
      return <pre className="text-xs font-mono text-sm p-2 bg-muted rounded">{String(result)}</pre>;
    }
  }
  
  return <pre className="text-xs font-mono text-sm p-2 bg-muted rounded">{String(result)}</pre>;
}

function formatArgs(args: Record<string, unknown>): React.ReactNode {
  if (!args || Object.keys(args).length === 0) {
    return <span className="text-muted-foreground text-xs">(no arguments)</span>;
  }
  
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {Object.entries(args).map(([key, value]) => (
        <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-muted rounded font-mono">
          <span className="font-medium text-muted-foreground">{key}:</span>
          <span className="font-mono text-primary">{typeof value === "string" && value.length > 30 ? value.slice(0, 30) + "..." : String(value)}</span>
        </span>
      ))}
    </div>
  );
}

export function ToolInvocation({ 
  name, 
  args, 
  result, 
  id, 
  isExpanded = false, 
  onToggle 
}: ToolInvocationProps) {
  const [isOpen, setIsOpen] = React.useState(isExpanded);
  
  const status = result && typeof result === "object" && "error" in result ? "error" : "success";
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-3 rounded-lg border border-border/50 overflow-hidden"
    >
      <button
        onClick={() => { onToggle?.(); setIsOpen(!isOpen); }}
        className={cn(
          "w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors",
          "rounded-t-lg"
        )}
        aria-expanded={isOpen}
        aria-controls={`tool-${id}`}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium text-primary">{name}</span>
          <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted text-muted-foreground">
            {status === "error" ? "Error" : "Done"}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <motion.span
            initial={{ rotate: 0 }}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </motion.span>
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`tool-${id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border/50 bg-muted/30"
          >
            <div className="p-3 space-y-3 border-t border-border/50">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Arguments</p>
                {formatArgs(args)}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-muted-foreground">Result</p>
                  <span className={cn(
                    "px-1.5 py-0.5 text-[10px] font-mono rounded",
                    result && typeof result === "object" && "error" in result
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  )}>
                    {result && typeof result === "object" && "error" in result ? "Error" : "Success"}
                  </span>
                </div>
                <div className="bg-muted/50 rounded p-2 max-h-64 overflow-auto">
                  {formatResult(result)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}