"use client";

import Image from "next/image";
import { useRef, type PointerEvent } from "react";

import logoWhite from "../../../public/images/logoNM.png";

/** How far the mark leans at the panel's edge, in degrees. */
const MAX_TILT = 10;

/**
 * The sign-in page's brand panel, with the mark leaning towards the pointer.
 *
 * It is its own client island so `AuthShell` and the page stay Server
 * Components. The tilt is written straight to the element's style inside a
 * frame callback rather than kept in state, so moving the mouse never
 * re-renders anything. Leaving the panel lets the mark settle back flat.
 *
 * Under `prefers-reduced-motion` the mark does not move at all.
 */
export function AuthAside({ name }: { name: string }) {
  const markRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  const tilt = (x: number, y: number) => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const mark = markRef.current;
      if (!mark) return;
      mark.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg)`;
    });
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;

    tilt(x * 2 * MAX_TILT, -y * 2 * MAX_TILT);
  };

  return (
    <section
      onPointerMove={onPointerMove}
      onPointerLeave={() => tilt(0, 0)}
      className="relative isolate hidden items-center justify-center overflow-hidden rounded-xl p-10 lg:flex"
      style={{
        backgroundImage: [
          "radial-gradient(60% 50% at 70% 28%, rgb(255 255 255 / 0.38), transparent 70%)",
          "radial-gradient(50% 45% at 15% 85%, rgb(255 255 255 / 0.22), transparent 70%)",
          "linear-gradient(160deg, var(--colorBrandBackground3Static) 0%, var(--colorBrandBackgroundStatic) 45%, var(--colorBrandBackground4Static) 100%)",
        ].join(", "),
      }}
    >
      <div
        ref={markRef}
        style={{
          transition: "transform var(--durationSlow) var(--curveDecelerateMid)",
          willChange: "transform",
        }}
      >
        <Image
          src={logoWhite}
          alt={name}
          priority
          sizes="360px"
          className="h-64 w-auto object-contain"
        />
      </div>
    </section>
  );
}
