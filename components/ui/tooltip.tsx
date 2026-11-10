import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useId,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  tooltipId: string;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip compound components must be rendered inside a <Tooltip> component.");
  }
  return context;
}

export interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

export interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

export function Tooltip({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  delayDuration = 150,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (nextOpen) {
      if (delayDuration > 0) {
        timerRef.current = setTimeout(() => {
          if (!isControlled) setUncontrolledOpen(true);
          onOpenChange?.(true);
        }, delayDuration);
      } else {
        if (!isControlled) setUncontrolledOpen(true);
        onOpenChange?.(true);
      }
    } else {
      if (!isControlled) setUncontrolledOpen(false);
      onOpenChange?.(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <TooltipContext.Provider value={{ open, setOpen, tooltipId }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export const TooltipTrigger = React.forwardRef<HTMLElement, TooltipTriggerProps>(
  ({ className, children, onMouseEnter, onMouseLeave, onFocus, onBlur, onKeyDown, ...props }, ref) => {
    const { setOpen, tooltipId, open } = useTooltipContext();

    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={(e) => {
          onMouseEnter?.(e);
          setOpen(true);
        }}
        onMouseLeave={(e) => {
          onMouseLeave?.(e);
          setOpen(false);
        }}
        onFocus={(e) => {
          onFocus?.(e);
          setOpen(true);
        }}
        onBlur={(e) => {
          onBlur?.(e);
          setOpen(false);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.key === "Escape") setOpen(false);
        }}
        className={cn("inline-flex items-center", className)}
        tabIndex={0}
        {...props}
      >
        {children}
      </span>
    );
  }
);
TooltipTrigger.displayName = "TooltipTrigger";

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right";
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = "top", children, ...props }, ref) => {
    const { open, tooltipId } = useTooltipContext();

    if (!open) return null;

    const sideClasses = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
      left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
      right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
    }[side];

    return (
      <div
        ref={ref}
        role="tooltip"
        id={tooltipId}
        className={cn(
          "absolute z-50 whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-mono font-medium text-zinc-50 shadow-md dark:bg-zinc-100 dark:text-zinc-900",
          "animate-in fade-in-0 zoom-in-95 pointer-events-none",
          sideClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = "TooltipContent";
