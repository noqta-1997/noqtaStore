"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { LogoMark } from "@/components/layout/logo-mark";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

/** How long "signed out" stays on screen before the page moves on. */
const DONE_MS = 900;

const RING_SIZE = 160;
const RING_RADIUS = 72;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/*
 * Kept beside the overlay so it stays one file, as the splash does. React 19
 * hoists a `<style>` with `href` and `precedence` into <head> once. Motion
 * that runs on its own sits behind `prefers-reduced-motion: no-preference`.
 */
const keyframes = `
@keyframes noqta-signout-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes noqta-signout-rise {
  from { opacity: 0; transform: scale(0.85) translateY(10px); }
  to { opacity: 1; transform: none; }
}
@keyframes noqta-signout-spin {
  to { transform: rotate(360deg); }
}
@keyframes noqta-signout-pop {
  0% { opacity: 0; transform: scale(0.4); }
  70% { opacity: 1; transform: scale(1.15); }
  100% { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: no-preference) {
  [data-signout="in"] { animation: noqta-signout-in 200ms ease-out both; }
  [data-signout="rise"] { animation: noqta-signout-rise 450ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
  [data-signout="spin"] { animation: noqta-signout-spin 900ms linear infinite; }
  [data-signout="pop"] { animation: noqta-signout-pop 400ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
}
`;

/**
 * Signs the reader out with a cover that says so: the mark inside a turning
 * arc and "جارٍ تسجيل الخروج…" while Supabase ends the session, then a full
 * ring, a tick and "تم تسجيل الخروج" for a moment before the page moves on.
 *
 * The three buttons that sign out — the header menu, the mobile drawer and
 * the admin top bar — share it. Each renders the returned `overlay` and calls
 * `signOut`; `signingOut` covers the whole run, navigation included.
 *
 * The navigation runs in a transition so the cover stays up until the next
 * page has landed, rather than lifting onto the signed-in page it is leaving.
 * It is portalled to <body>: the header it is rendered from is a containing
 * block for fixed children, and the drawer sits in a portal of its own.
 */
export function useSignOut(destination: string, onSignedOut?: () => void) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "pending" | "done">("idle");
  const [navigating, startNavigation] = useTransition();

  const signOut = async () => {
    setPhase("pending");
    await createClient().auth.signOut();
    setPhase("done");
    await new Promise((resolve) => setTimeout(resolve, DONE_MS));
    onSignedOut?.();
    startNavigation(() => {
      router.replace(destination);
      router.refresh();
    });
    setPhase("idle");
  };

  const signingOut = phase !== "idle" || navigating;
  const overlay = signingOut
    ? createPortal(<SignOutOverlay done={phase === "done" || navigating} />, document.body)
    : null;

  return { signOut, signingOut, overlay };
}

function SignOutOverlay({ done }: { done: boolean }) {
  return (
    <div
      data-signout="in"
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-surface/90 backdrop-blur-sm"
    >
      <style href="noqta-signout" precedence="default">
        {keyframes}
      </style>

      <div data-signout="rise" className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="absolute inset-0"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--line)"
            strokeWidth={4}
          />
          {/* A quarter arc that turns while the session ends, then closes
              into a full ring once it has. */}
          <g data-signout={done ? undefined : "spin"} style={{ transformOrigin: "center" }}>
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={done ? "var(--success)" : "var(--primary-container)"}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={done ? 0 : RING_LENGTH * 0.75}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              style={{ transition: "stroke-dashoffset 400ms ease-out, stroke 400ms ease-out" }}
            />
          </g>
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <LogoMark size={72} />
        </div>

        {done ? (
          <span
            data-signout="pop"
            className="absolute bottom-2 end-2 flex size-9 items-center justify-center rounded-full bg-success text-on-success shadow-md"
          >
            <Check aria-hidden className="size-5" strokeWidth={2.5} />
          </span>
        ) : null}
      </div>

      <div data-signout="rise" className="text-center">
        <p className="font-display text-headline-md text-on-surface">
          {done ? "تم تسجيل الخروج" : "جارٍ تسجيل الخروج…"}
        </p>
        <p className={cn("mt-1 text-body-md text-muted", !done && "invisible")}>نراك قريباً</p>
      </div>
    </div>
  );
}
