"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { useMediaQuery, useReducedMotion } from "./useReducedMotion";

const INCLINACAO_MAX = 6;

export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const ponteiroFino = useMediaQuery("(pointer: fine)");
  const reduzido = useReducedMotion();
  const ligado = ponteiroFino && !reduzido;

  function mover(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--y", `${y}px`);
    const rotY = (x / r.width - 0.5) * 2 * INCLINACAO_MAX;
    const rotX = -(y / r.height - 0.5) * 2 * INCLINACAO_MAX;
    el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
  }

  function sair() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      data-tilt={ligado ? "on" : "off"}
      onMouseMove={ligado ? mover : undefined}
      onMouseLeave={ligado ? sair : undefined}
      className={`group relative overflow-hidden transition-transform duration-200 ease-out ${className}`}
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
