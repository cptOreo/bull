"use client";

import * as React from "react";
import { useUI } from "@/lib/state/use-ui";

export interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: "light" | "dark" | "system";
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const { theme, setTheme } = useUI();

  React.useEffect(() => {
    if (!theme && defaultTheme) {
      setTheme(defaultTheme);
    }
  }, [theme, defaultTheme, setTheme]);

  React.useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return <>{children}</>;
}
