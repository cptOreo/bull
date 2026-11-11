"use client";

import * as React from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ChatProvider } from "@/components/providers/chat-provider";
import { BullProvider } from "@/state/use-bull";
import { Toaster } from "@/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryProvider>
        <ChatProvider>
          <BullProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </BullProvider>
        </ChatProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}