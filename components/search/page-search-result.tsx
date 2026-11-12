"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PageSearchResultProps {
  page: { href: string; label: string; desc: string; icon: React.ComponentType<{ className?: string }> };
}

export function PageSearchResult({ page }: PageSearchResultProps) {
  return (
    <Link href={page.href} className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors group">
      <page.icon className="h-6 w-6 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{page.label}</p>
        <p className="text-sm text-muted-foreground truncate">{page.desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-foreground" />
    </Link>
  );
}