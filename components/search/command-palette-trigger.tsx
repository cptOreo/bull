"use client";

import * as React from "react";
import { Button } from "@/ui/button";
import { Command, Search } from "lucide-react";
import { useCommandPalette } from "@/hooks/use-command-palette";

export function CommandPaletteTrigger() {
  const { setOpen } = useCommandPalette();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 px-3 py-1.5"
      onClick={() => setOpen(true)}
      aria-label="Open command palette (⌘K)"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded">
        ⌘K
      </kbd>
    </Button>
  );
}