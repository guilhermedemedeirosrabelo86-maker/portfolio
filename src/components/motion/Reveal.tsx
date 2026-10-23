"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { useReducedMotion } from "./useReducedMotion";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
};

// O conteúdo começa visível (sem JS, sem IntersectionObserver ou com movimento
// reduzido nada fica escondido). Só depois de montar ele é escondido e animado.
export function Reveal({ children, delay = 0, as: Tag = "div", className = "" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduzido = useReducedMotion();
  const [animar, setAnimar] = useState(false);
  const [visto, setVisto] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (reduzido || !el || typeof window.IntersectionObserver === "undefined") return;
    setAnimar(true);
    const observer = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisto(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduzido]);

  const revelado = !animar || visto;

  return (
    <Tag
      ref={ref}
      data-revealed={revelado ? "true" : "false"}
      style={animar ? { transitionDelay: `${delay}ms` } : undefined}
      className={`${animar ? "transition-[opacity,translate] duration-700 ease-[cubic-bezier(.2,.7,.2,1)]" : ""} ${
        revelado ? "" : "translate-y-10 opacity-0"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
