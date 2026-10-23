import Image from "next/image";
import { perfil } from "@/content/perfil";

// Enquanto não houver foto (perfil.fotoUrl), mostra uma ilustração de "código".
export function HeroIlustracao() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[420px] items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute inset-[6%] rounded-full border border-accent/50 shadow-[0_0_80px_rgb(245_179_1/0.22),inset_0_0_80px_rgb(245_179_1/0.12)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-40 [background-image:radial-gradient(rgb(245_179_1/0.35)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(circle,black_30%,transparent_70%)]"
      />

      {perfil.fotoUrl ? (
        <Image
          src={perfil.fotoUrl}
          alt={`Foto de ${perfil.nome}`}
          width={320}
          height={380}
          priority
          className="relative h-[78%] w-auto rounded-t-full rounded-b-3xl object-cover"
        />
      ) : (
        <svg viewBox="0 0 320 320" role="img" aria-label="Ilustração de uma janela de código" className="relative w-[78%]">
          <defs>
            <linearGradient id="hero-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f5b301" />
              <stop offset="1" stopColor="#ff8a00" />
            </linearGradient>
            <linearGradient id="hero-janela" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1c1c1f" />
              <stop offset="1" stopColor="#111113" />
            </linearGradient>
          </defs>
          <circle cx="250" cy="70" r="26" fill="url(#hero-grad)" opacity="0.25" />
          <circle cx="62" cy="262" r="18" fill="url(#hero-grad)" opacity="0.3" />
          <g transform="rotate(-4 160 160)">
            <rect x="40" y="70" width="240" height="180" rx="16" fill="url(#hero-janela)" stroke="#333338" />
            <circle cx="62" cy="92" r="5" fill="#f87171" />
            <circle cx="78" cy="92" r="5" fill="#fbbf24" />
            <circle cx="94" cy="92" r="5" fill="#34d399" />
            <rect x="60" y="120" width="70" height="8" rx="4" fill="#f5b301" />
            <rect x="138" y="120" width="90" height="8" rx="4" fill="#3a3a40" />
            <rect x="76" y="140" width="110" height="8" rx="4" fill="#ffd166" />
            <rect x="76" y="160" width="60" height="8" rx="4" fill="#3a3a40" />
            <rect x="144" y="160" width="70" height="8" rx="4" fill="#ff8a00" />
            <rect x="76" y="180" width="130" height="8" rx="4" fill="#3a3a40" />
            <rect x="60" y="200" width="40" height="8" rx="4" fill="#f5b301" />
            <rect x="60" y="222" width="12" height="8" rx="2" fill="#ecebe8" className="motion-safe:animate-pulse" />
          </g>
          <g transform="translate(206 196)">
            <rect width="88" height="56" rx="12" fill="#151517" stroke="url(#hero-grad)" strokeWidth="1.5" />
            <text
              x="44"
              y="37"
              textAnchor="middle"
              fontSize="22"
              fontWeight="700"
              fill="url(#hero-grad)"
              fontFamily="ui-monospace, monospace"
            >
              {"</>"}
            </text>
          </g>
        </svg>
      )}

      <div className="absolute right-0 bottom-[6%] w-48 rounded-xl border border-accent/40 bg-[#151517]/90 p-4 shadow-xl backdrop-blur">
        <p className="flex items-center justify-between gap-2 text-sm font-semibold text-white">
          Aberto a oportunidades
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-ok opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok" />
          </span>
        </p>
        <p className="mt-1.5 text-xs text-muted">Vagas de desenvolvimento e projetos.</p>
      </div>
    </div>
  );
}
