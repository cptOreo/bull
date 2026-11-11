"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { ResponsiveContainer } from "recharts";

interface ChartWrapperProps {
  children: React.ReactNode;
  className?: string;
  height?: number | string;
  width?: number | string;
}

export function ChartWrapper({ children, className, height = 300, width = "100%" }: ChartWrapperProps) {
  return (
    <div className={cn("w-full", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}