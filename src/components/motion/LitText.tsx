"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

type LitTextProps = { texto: string; destaques: string[]; className?: string };

// As palavras acendem enquanto o parágrafo sobe de 85% até 25% da altura da tela.
export function LitText({ texto, destaques, className = "" }: LitTextProps) {
  const palavras = texto.split(" ");
  const ref = useRef<HTMLParagraphElement>(null);
  const reduzido = useReducedMotion();
  const [acesasRolagem, setAcesas] = useState(palavras.length);
  const acesas = reduzido ? palavras.length : acesasRolagem;

  useEffect(() => {
    if (reduzido) return;
    let quadro = 0;
    function calcular() {
      const el = ref.current;
      if (!el) return;
      const topo = el.getBoundingClientRect().top;
      const progresso = (window.innerHeight * 0.85 - topo) / (window.innerHeight * 0.6);
      setAcesas(Math.round(Math.min(Math.max(progresso, 0), 1) * palavras.length));
    }
    function aoRolar() {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(calcular);
    }
    calcular();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, [reduzido, palavras.length]);

  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">
        {palavras.map((palavra, i) => {
          const destaque = destaques.some((d) => palavra.startsWith(d));
          return (
            <span key={i}>
              <span
                data-lit={i < acesas ? "true" : "false"}
                data-hl={destaque ? "true" : undefined}
                className="text-[#2c2b28] transition-colors duration-300 data-[lit=true]:text-white data-[hl=true]:data-[lit=true]:text-accent"
              >
                {palavra}
              </span>
              {i < palavras.length - 1 ? " " : ""}
            </span>
          );
        })}
      </span>
    </p>
  );
}
