import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Github, Twitter, BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-6 lg:py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-display font-bold gradient-text">Bull</span>
            <span className="text-muted-foreground/50">v2</span>
          </div>
          <nav className="flex items-center gap-6 text-sm" aria-label="Footer navigation">
            <Link href="/method" className="text-muted-foreground hover:text-foreground transition-colors">
              Method
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
            <BookOpen className="h-5 w-5 text-muted-foreground/50" aria-hidden="true" />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Educational purposes only. Not investment advice. Data from Yahoo Finance & Screener.in.
        </p>
      </div>
    </footer>
  );
}