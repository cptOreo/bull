"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface MasteryRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  level?: number; // 1-5
  className?: string;
}

const LEVEL_COLORS = [
  "var(--color-muted-foreground)", // 0 - locked
  "var(--color-info)",             // 1 - novice
  "var(--color-primary)",          // 2 - apprentice
  "var(--color-accent)",           // 3 - competent
  "var(--color-positive)",         // 4 - proficient
  "var(--color-attention)",        // 5 - expert
];

export function MasteryRing({ progress, size = 48, strokeWidth = 4, showLabel = true, level = 0, className }: MasteryRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);
  const color = LEVEL_COLORS[Math.min(level, 5)];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="text-muted/20"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className={cn("transition-all duration-1000", progress === 100 && "animate-pulse")}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
      {showLabel && (
        <span className={cn("absolute text-[10px] font-mono font-bold", progress > 50 ? "text-primary-foreground" : "text-muted-foreground")}>
          {progress === 100 ? "✓" : `${Math.round(progress)}%`}
        </span>
      )}
    </div>
  );
}