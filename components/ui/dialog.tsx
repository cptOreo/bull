import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useId,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog compound components must be rendered inside a <Dialog> component.");
  }
  return context;
}

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <DialogContext.Provider
      value={{
        open,
        onOpenChange: handleOpenChange,
        titleId,
        descriptionId,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();

    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        onClick={(e) => {
          onClick?.(e);
          onOpenChange(true);
        }}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DialogTrigger.displayName = "DialogTrigger";

export interface DialogPortalProps {
  children: React.ReactNode;
}

export function DialogPortal({ children }: DialogPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

export type DialogOverlayProps = React.HTMLAttributes<HTMLDivElement>;

export const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();

    return (
      <div
        ref={ref}
        onClick={(e) => {
          onClick?.(e);
          onOpenChange(false);
        }}
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in",
          className
        )}
        {...props}
      />
    );
  }
);
DialogOverlay.displayName = "DialogOverlay";

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, showCloseButton = true, ...props }, ref) => {
    const { open, onOpenChange, titleId, descriptionId } = useDialogContext();
    const contentRef = useRef<HTMLDivElement | null>(null);

    // ESC key listener & focus trap
    useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onOpenChange(false);
          return;
        }

        if (e.key === "Tab" && contentRef.current) {
          const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    // Initial focus on mount
    useEffect(() => {
      if (open && contentRef.current) {
        const focusable = contentRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }
    }, [open]);

    if (!open) return null;

    return (
      <DialogPortal>
        <DialogOverlay />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            ref={(node) => {
              contentRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className={cn(
              "relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
              "animate-in zoom-in-95 duration-200",
              className
            )}
            {...props}
          >
            {children}
            {showCloseButton && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close dialog"
                className="absolute top-4 right-4 rounded-md p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-left mb-4", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { titleId } = useDialogContext();
    return (
      <h2
        ref={ref}
        id={titleId}
        className={cn("text-lg font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-100", className)}
        {...props}
      />
    );
  }
);
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { descriptionId } = useDialogContext();
    return (
      <p
        ref={ref}
        id={descriptionId}
        className={cn("text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed", className)}
        {...props}
      />
    );
  }
);
DialogDescription.displayName = "DialogDescription";

export const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onClick?.(e);
          onOpenChange(false);
        }}
        className={className}
        {...props}
      />
    );
  }
);
DialogClose.displayName = "DialogClose";
