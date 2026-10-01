"use client";

import { useEffect, useRef, useState } from "react";

import { LogoMark } from "@/components/layout/logo-mark";
import { cn } from "@/lib/utils";

/** How long the count from 1 to 100 takes, and the reveal that follows it. */
const COUNT_MS = 2400;
const LEAVE_MS = 700;

/* The progress ring around the mark. */
const RING_SIZE = 240;
const RING_RADIUS = 108;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/*
 * The motion lives here rather than in globals.css so the splash stays one
 * file. React 19 hoists a `<style>` with `href` and `precedence` into <head>
 * and writes it once. Everything that moves on its own sits behind
 * `prefers-reduced-motion: no-preference`.
 */
const keyframes = `
@keyframes noqta-splash-enter {
  from { opacity: 0; transform: scale(0.8) translateY(12px); }
  to { opacity: 1; transform: none; }
}
@keyframes noqta-splash-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes noqta-splash-spin {
  to { transform: rotate(360deg); }
}
@keyframes noqta-splash-glow {
  0%, 100% { opacity: 0.45; transform: scale(0.92); }
  50% { opacity: 0.9; transform: scale(1.08); }
}
@media (prefers-reduced-motion: no-preference) {
  [data-splash="enter"] { animation: noqta-splash-enter 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
  [data-splash="breathe"] { animation: noqta-splash-breathe 1.8s ease-in-out infinite; }
  [data-splash="spin"] { animation: noqta-splash-spin 10s linear infinite; }
  [data-splash="glow"] { animation: noqta-splash-glow 2.4s ease-in-out infinite; }
}
`;

/**
 * The cover shown on every full load of the site: the mark in the middle, a
 * ring that fills around it and a count from 1 to 100 beneath it, then a
 * circular reveal into the page.
 *
 * It answers the reader while it runs: the mark tilts toward the pointer, and
 * a click, a tap or any key skips straight to the reveal.
 *
 * It is rendered on the server so it is on screen from the first paint rather
 * than appearing over a page the reader has already seen. The mark is
 * `LogoMark`, which lets CSS pick `logo.png` or `logoNM.png` for the theme, so
 * the right artwork is painted first time with no flash.
 *
 * It lives in the root layout, which stays mounted across client navigations,
 * so moving between pages does not run it again; only a full load does.
 *
 * Skipped under automation (`navigator.webdriver`), where it would cover the
 * pages the Playwright suites click and photograph. Without JavaScript nothing
 * would ever lift it, so a `<noscript>` rule hides it outright.
 */
export function SplashScreen() {
  const [count, setCount] = useState(1);
  const [phase, setPhase] = useState<"counting" | "leaving" | "gone">("counting");
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let leave: ReturnType<typeof setTimeout> | undefined;
    let start: number | undefined;
    let left = false;

    const finish = () => {
      if (left) return;
      left = true;
      cancelAnimationFrame(frame);
      setCount(100);
      setPhase("leaving");
      leave = setTimeout(() => setPhase("gone"), LEAVE_MS);
    };

    const tick = (now: number) => {
      if (navigator.webdriver) {
        setPhase("gone");
        return;
      }
      start ??= now;
      const progress = Math.min((now - start) / COUNT_MS, 1);
      /* Ease out, so the last numbers slow into 100 rather than snap to it. */
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.max(1, Math.round(eased * 100)));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    /* The mark leans toward the pointer, up to 14 degrees each way. */
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onMove = (event: PointerEvent) => {
      const node = tiltRef.current;
      if (!node || still) return;
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      node.style.setProperty("--tilt-x", `${(-y * 28).toFixed(2)}deg`);
      node.style.setProperty("--tilt-y", `${(x * 28).toFixed(2)}deg`);
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", finish);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(leave);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
    };
  }, []);

  if (phase === "gone") return null;

  const leaving = phase === "leaving";

  return (
    <div
      id="noqta-splash"
      aria-hidden
      className={cn(
        "fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-8 bg-surface",
        leaving && "pointer-events-none",
      )}
      style={{
        clipPath: leaving ? "circle(0% at 50% 50%)" : "circle(150% at 50% 50%)",
        transition: `clip-path ${LEAVE_MS}ms cubic-bezier(0.7, 0, 0.3, 1)`,
      }}
    >
      <noscript>
        <style>{"#noqta-splash{display:none}"}</style>
      </noscript>
      <style href="noqta-splash" precedence="default">
        {keyframes}
      </style>

      <div data-splash="enter" className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        {/* A soft halo that swells and settles behind the mark. */}
        <div
          data-splash="glow"
          className="absolute inset-6 rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--primary-container) 35%, transparent), transparent 70%)",
          }}
        />

        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="absolute inset-0"
        >
          {/* A dotted orbit turning slowly outside the ring. */}
          <g data-splash="spin" style={{ transformOrigin: "center" }}>
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS + 9}
              fill="none"
              stroke="var(--outline-variant)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="1 11"
            />
          </g>
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--line)"
            strokeWidth={4}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--primary-container)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - count / 100)}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </svg>

        <div
          ref={tiltRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `perspective(700px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) scale(${leaving ? 1.15 : 1})`,
            transition: "transform 250ms ease-out",
          }}
        >
          <div data-splash="breathe">
            <LogoMark size={110} />
          </div>
        </div>
      </div>

      <div data-splash="enter" dir="ltr" className="flex items-baseline gap-1 text-on-surface">
        <span data-numeric className="font-display text-headline-xl">
          {count}
        </span>
        <span className="text-muted">%</span>
      </div>
    </div>
  );
}
