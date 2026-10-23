import { perfil } from "@/content/perfil";
import { mailtoUrl, whatsappUrl } from "@/lib/links";
import { Botao } from "@/components/ui/Botao";
import { Container } from "@/components/ui/Container";
import { IconGitHub, IconLinkedIn, IconMail, IconWhatsApp } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/Reveal";

const linkCanal =
  "flex min-w-0 items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm text-soft transition hover:border-accent hover:text-white";

export function Contato() {
  return (
    <section id="contato" className="scroll-mt-20 py-24">
      <Container>
        <Reveal className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-[#1d1a12] to-[#0f0f10] p-8 sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl"
          />
          <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">Contato</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Vamos conversar sobre uma vaga ou um projeto?
          </h2>
          <p className="mt-4 max-w-xl text-soft">
            Estou em busca de uma vaga na área de desenvolvimento e topo projetos também. O jeito mais rápido de falar comigo é pelo
            WhatsApp.
          </p>

          <div className="mt-8">
            <Botao href={whatsappUrl(perfil.whatsapp, perfil.mensagemWhatsapp)} externo>
              <IconWhatsApp className="h-4 w-4" /> Chamar no WhatsApp
            </Botao>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl [&>li]:min-w-0">
            <li>
              <a href={mailtoUrl(perfil.email)} aria-label={`E-mail: ${perfil.email}`} className={linkCanal}>
                <IconMail />
                <span className="truncate">{perfil.email}</span>
              </a>
            </li>
            <li>
              <a href={perfil.github} target="_blank" rel="noopener noreferrer" className={linkCanal}>
                <IconGitHub />
                <span>GitHub</span>
              </a>
            </li>
            {perfil.linkedin && (
              <li>
                <a href={perfil.linkedin} target="_blank" rel="noopener noreferrer" className={linkCanal}>
                  <IconLinkedIn />
                  <span>LinkedIn</span>
                </a>
              </li>
            )}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
