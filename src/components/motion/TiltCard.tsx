"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { useMediaQuery, useReducedMotion } from "./useReducedMotion";

// Card com uma luz âmbar que segue o mouse. O card em si fica parado.
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const ponteiroFino = useMediaQuery("(pointer: fine)");
  const reduzido = useReducedMotion();
  const ligado = ponteiroFino && !reduzido;

  function mover(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      data-tilt={ligado ? "on" : "off"}
      onMouseMove={ligado ? mover : undefined}
      className={`group relative overflow-hidden ${className}`}
    >
      {ligado && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(260px circle at var(--x, 50%) var(--y, 50%), rgb(245 179 1 / 0.18), transparent 60%)",
          }}
        />
      )}
      <div className="relative h-full">{children}</div>
    </div>
  );
}
