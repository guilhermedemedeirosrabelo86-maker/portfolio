import { projetoDestaque, projetos } from "@/content/projetos";
import { Container } from "@/components/ui/Container";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { Reveal } from "@/components/motion/Reveal";
import { ProjetoCard } from "./ProjetoCard";
import { ProjetoDestaqueCard } from "./ProjetoDestaqueCard";

export function Projetos() {
  const destaque = projetoDestaque();
  const outros = projetos.filter((p) => !p.destaque);

  return (
    <section id="projetos" className="scroll-mt-20 border-t border-white/5 bg-black/20 py-20">
      <Container>
        <Reveal>
          <SecaoTitulo rotulo="Portfólio" titulo="Projetos em destaque" />
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Reveal className="h-full">
            <ProjetoDestaqueCard projeto={destaque} />
          </Reveal>
          <div className="grid content-start gap-5">
            {outros.map((projeto, i) => (
              <Reveal key={projeto.slug} delay={120 * (i + 1)}>
                <ProjetoCard projeto={projeto} />
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
