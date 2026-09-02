"use client";

import {
  Toast,
  ToastBody,
  ToastTitle,
  Toaster,
  useId,
  useToastController,
} from "@fluentui/react-components";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

export type ToastTone = "success" | "error" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  dismissLabel: string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Fluent's intents, under the tone names the 14 call sites already use. */
const intents = {
  success: "success",
  error: "error",
  info: "info",
} as const;

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
 * Fluent's Toaster behind the same `useToast()` the app already calls.
 *
 * The hand-rolled stack kept its own array, its own timers and its own
 * `aria-live` region. Fluent brings a queue that pauses on hover and on window
 * blur, keyboard dismissal, and a politeness setting that follows the intent —
 * none of which the previous version had. Because the hook's signature is
 * unchanged, all fourteen callers are untouched.
 */
export function ToastProvider({ dismissLabel, children }: ToastProviderProps) {
  const toasterId = useId("noqta-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const toast = useCallback(
    ({ title, description, tone = "success" }: ToastOptions) => {
      dispatchToast(
        <Toast>
          <ToastTitle>{title}</ToastTitle>
          {description ? <ToastBody>{description}</ToastBody> : null}
        </Toast>,
        { intent: intents[tone], timeout: 4000 },
      );
    },
    [dispatchToast],
  );

  const value = useMemo(() => ({ toast, dismissLabel }), [toast, dismissLabel]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasterId={toasterId} position="bottom-end" pauseOnHover pauseOnWindowBlur />
    </ToastContext.Provider>
  );
}
