import React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-zinc-900 text-zinc-50 shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 border border-transparent",
  secondary:
    "bg-zinc-100 text-zinc-900 shadow-xs hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/60",
  outline:
    "border border-zinc-200 bg-white text-zinc-900 shadow-xs hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
  ghost:
    "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
  destructive:
    "bg-rose-600 text-white shadow-xs hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 border border-transparent",
  link:
    "text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100 p-0 h-auto font-medium",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1.5",
  md: "h-9 px-4 py-2 text-sm rounded-lg gap-2",
  lg: "h-11 px-6 text-base rounded-lg gap-2.5",
  icon: "h-9 w-9 p-0 rounded-lg justify-center",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", disabled, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium select-none cursor-pointer",
          "transition-all duration-150 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 focus-visible:ring-offset-1",
          "active:scale-[0.98]",
          "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
