"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/ui/button";
import { RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <RefreshCw className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-display font-bold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          We encountered an unexpected error. Please try refreshing the page or go back home.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={reset} className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="text-left max-w-md mx-auto text-sm">
            <summary className="cursor-pointer text-muted-foreground">Error details</summary>
            <pre className="mt-2 p-4 rounded bg-muted overflow-auto text-xs">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}