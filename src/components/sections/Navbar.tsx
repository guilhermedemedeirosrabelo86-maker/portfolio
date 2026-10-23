"use client";

import Link from "next/link";
import { useState } from "react";
import { perfil } from "@/content/perfil";
import { whatsappUrl } from "@/lib/links";
import { Container } from "@/components/ui/Container";

const links = [
  { href: "/#inicio", rotulo: "Início" },
  { href: "/#sobre", rotulo: "Sobre" },
  { href: "/#projetos", rotulo: "Projetos" },
  { href: "/#skills", rotulo: "Skills" },
  { href: "/#contato", rotulo: "Contato" },
];

export function Navbar() {
  const [aberto, setAberto] = useState(false);
  const conversar = whatsappUrl(perfil.whatsapp, perfil.mensagemWhatsapp);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-base/70 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/#inicio" className="text-gradient text-2xl font-extrabold tracking-tight" aria-label="Início">
          GR.
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted transition hover:text-white">
              {l.rotulo}
            </Link>
          ))}
          <a
            href={conversar}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-brand-purple/70 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-purple/15"
          >
            Vamos conversar
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls="menu-celular"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {aberto ? (
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </Container>

      {aberto && (
        <nav id="menu-celular" aria-label="Menu" className="border-t border-white/5 bg-base/95 md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setAberto(false)}
                className="rounded-lg px-3 py-3 text-ink hover:bg-white/5"
              >
                {l.rotulo}
              </Link>
            ))}
            <a
              href={conversar}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-brand mt-2 rounded-lg px-3 py-3 text-center font-semibold text-white"
            >
              Vamos conversar
            </a>
          </Container>
        </nav>
      )}
    </header>
  );
}
