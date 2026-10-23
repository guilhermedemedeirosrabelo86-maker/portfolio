import Link from "next/link";
import type { ReactNode } from "react";

type BotaoProps = {
  children: ReactNode;
  href?: string;
  variante?: "primario" | "contorno";
  desabilitado?: boolean;
  externo?: boolean;
  className?: string;
  ariaLabel?: string;
};

const estilos = {
  primario:
    "bg-gradient-brand text-on-accent shadow-[0_8px_30px_-8px_rgb(245_179_1/0.45)] hover:brightness-110",
  contorno: "border border-line bg-white/[0.02] text-ink hover:border-accent hover:bg-white/[0.05]",
};

const comum =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Sem href ou desabilitado vira um <span> que não leva a lugar nenhum.
export function Botao({
  children,
  href,
  variante = "primario",
  desabilitado = false,
  externo = false,
  className = "",
  ariaLabel,
}: BotaoProps) {
  const classes = `${comum} ${estilos[variante]} ${className}`;

  if (!href || desabilitado) {
    return (
      <span aria-disabled="true" className={`${comum} cursor-not-allowed border border-dashed border-line text-muted ${className}`}>
        {children}
      </span>
    );
  }

  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className={classes}>
        {children}
      </a>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link href={href} aria-label={ariaLabel} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} aria-label={ariaLabel} className={classes}>
      {children}
    </a>
  );
}
