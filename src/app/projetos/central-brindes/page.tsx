import type { Metadata } from "next";
import Link from "next/link";
import { casoCentralBrindes } from "@/content/casoCentralBrindes";
import { projetoDestaque } from "@/content/projetos";
import { Botao } from "@/components/ui/Botao";
import { Container } from "@/components/ui/Container";
import { Tags } from "@/components/ui/Tags";
import { IconExternal, IconGitHub } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";
import { CentralBrindesVisual } from "@/components/sections/CentralBrindesVisual";

const titulo = "Central Brindes · Guilherme Rabelo";
const imagem = { url: "/opengraph-image", width: 1200, height: 630, alt: "Guilherme Rabelo · Desenvolvedor Web" };
const descricao = "Estudo de caso: sistema web de estoque e envios criado por Guilherme Rabelo.";

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: "/projetos/central-brindes" },
  openGraph: {
    type: "article",
    locale: "pt_BR",
    url: "/projetos/central-brindes",
    siteName: "Guilherme Rabelo",
    title: titulo,
    description: descricao,
    images: [imagem],
  },
  twitter: { card: "summary_large_image", title: titulo, description: descricao, images: [imagem.url] },
};

export default function CasoCentralBrindes() {
  const projeto = projetoDestaque();
  const etapas = [
    { titulo: "Problema", texto: projeto.problema },
    { titulo: "Solução", texto: projeto.solucao },
    { titulo: "Resultado", texto: projeto.resultado },
  ];

  return (
    <main>
      <Container className="py-12 md:py-20">
        <Link href="/#projetos" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-white">
          <span aria-hidden="true">←</span> Voltar aos projetos
        </Link>

        <Reveal className="mt-8 grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-brand-purple uppercase">Estudo de caso</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{projeto.titulo}</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#b4b8d6]">{projeto.resumo}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {projeto.codigoUrl && (
                <Botao href={projeto.codigoUrl} externo>
                  <IconGitHub className="h-4 w-4" /> Ver código
                </Botao>
              )}
              {projeto.demoUrl ? (
                <Botao href={projeto.demoUrl} variante="contorno" externo>
                  Ver demo <IconExternal />
                </Botao>
              ) : (
                <Botao desabilitado>Demo em breve</Botao>
              )}
            </div>
          </div>
          <CentralBrindesVisual className="mx-auto w-full max-w-md text-xs" />
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {etapas.map((e, i) => (
            <Reveal key={e.titulo} delay={120 * i} className="rounded-2xl border border-line bg-card p-6">
              <h2 className="text-gradient text-lg font-bold">{e.titulo}</h2>
              <p className="mt-2 leading-relaxed text-[#cfd2ee]">{e.texto}</p>
            </Reveal>
          ))}
        </div>

        <section className="mt-20">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-white">Destaques técnicos</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Feito sozinho, por iniciativa própria, com HTML, CSS e JavaScript puros e serviços gratuitos.
            </p>
          </Reveal>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2">
            {casoCentralBrindes.destaques.map((d, i) => (
              <Reveal as="li" key={d.titulo} delay={80 * (i % 2)}>
                <TiltCard className="h-full rounded-2xl border border-line bg-card">
                  <div className="p-6">
                    <h3 className="font-semibold text-white">{d.titulo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{d.texto}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </ul>
        </section>

        <Reveal as="section" className="mt-20">
          <h2 className="text-3xl font-bold tracking-tight text-white">Stack</h2>
          <div className="mt-6">
            <Tags tags={casoCentralBrindes.stack} />
          </div>
          <p className="mt-6 text-sm text-muted">
            As imagens desta página são ilustrativas e usam dados fictícios.
          </p>
        </Reveal>
      </Container>
    </main>
  );
}
