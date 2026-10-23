"use client";

import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let quadro = 0;
    function atualizar() {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const progresso = total > 0 ? doc.scrollTop / total : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${progresso})`;
    }
    function aoRolar() {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(atualizar);
    }
    atualizar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ transform: "scaleX(0)" }}
      className="bg-gradient-brand fixed inset-x-0 top-0 z-50 h-[3px] origin-left"
    />
  );
}
