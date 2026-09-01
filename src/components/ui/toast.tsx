"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface ToastEntry extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  dismissLabel: string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 4000;

const tones: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: "bg-success text-white" },
  error: { icon: AlertTriangle, className: "bg-error text-white" },
  info: {
    icon: Info,
    className: "bg-primary-container text-on-primary-container",
  },
};

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }

  return context.toast;
}

interface ToastProviderProps {
  dismissLabel: string;
  children: ReactNode;
}

/**
 * Minimal toast stack. Notifications are transient UI feedback only —
 * nothing here talks to a server.
 */
export function ToastProvider({ dismissLabel, children }: ToastProviderProps) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = (nextId.current += 1);
      setEntries((current) => [...current.slice(-2), { ...options, id }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismissLabel }), [toast, dismissLabel]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        role="region"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:end-6 sm:bottom-6 sm:items-end"
      >
        {entries.map((entry) => {
          const tone = tones[entry.tone ?? "success"];
          const Icon = tone.icon;

          return (
            <div
              key={entry.id}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 border-2 border-line bg-card p-3 shadow-hard"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center border border-line",
                  tone.className,
                )}
              >
                <Icon aria-hidden className="size-4" strokeWidth={2} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-body-md font-semibold text-on-surface">
                  {entry.title}
                </p>
                {entry.description ? (
                  <p className="text-label-md text-muted">{entry.description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => dismiss(entry.id)}
                aria-label={dismissLabel}
                className="shrink-0 border border-transparent p-1 text-muted transition-colors hover:border-line hover:text-on-surface"
              >
                <X aria-hidden className="size-4" strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
