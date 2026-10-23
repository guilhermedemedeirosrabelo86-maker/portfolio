import { perfil } from "@/content/perfil";
import { mailtoUrl, whatsappUrl } from "@/lib/links";
import { Botao } from "@/components/ui/Botao";
import { Container } from "@/components/ui/Container";
import { IconArrowRight, IconDownload, IconGitHub, IconLinkedIn, IconMail, IconPin, IconWhatsApp } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/Reveal";
import { HeroIlustracao } from "./HeroIlustracao";

const social =
  "flex h-10 w-10 items-center justify-center rounded-full border border-line text-soft transition hover:border-accent hover:text-white";

export function Hero() {
  return (
    <section id="inicio" className="scroll-mt-20">
      <Container className="grid items-center gap-12 py-16 md:grid-cols-[1.15fr_1fr] md:py-24">
        <Reveal>
          <p className="text-lg text-muted">Olá, eu sou</p>
          <h1 className="mt-1 text-5xl font-extrabold tracking-tight text-white sm:text-6xl">{perfil.nome}</h1>
          <p className="text-gradient mt-2 text-3xl font-bold sm:text-4xl">{perfil.cargo}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted">
            <IconPin /> {perfil.cidade}
          </p>
          <p className="mt-6 max-w-lg leading-relaxed text-soft">{perfil.frase}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Botao href="#projetos">
              Ver projetos <IconArrowRight />
            </Botao>
            <Botao href={whatsappUrl(perfil.whatsapp, perfil.mensagemWhatsapp)} variante="contorno" externo>
              <IconWhatsApp className="h-4 w-4" /> Fale comigo no WhatsApp
            </Botao>
            {perfil.cvUrl && (
              <Botao href={perfil.cvUrl} variante="contorno" externo>
                Baixar currículo <IconDownload />
              </Botao>
            )}
          </div>

          <ul className="mt-8 flex gap-3">
            <li>
              <a href={perfil.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={social}>
                <IconGitHub />
              </a>
            </li>
            <li>
              <a href={mailtoUrl(perfil.email)} aria-label="E-mail" className={social}>
                <IconMail />
              </a>
            </li>
            {perfil.linkedin && (
              <li>
                <a href={perfil.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={social}>
                  <IconLinkedIn />
                </a>
              </li>
            )}
          </ul>
        </Reveal>

        <Reveal delay={150}>
          <HeroIlustracao />
        </Reveal>
      </Container>
    </section>
  );
}
