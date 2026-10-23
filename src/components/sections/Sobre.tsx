import { perfil } from "@/content/perfil";
import { Container } from "@/components/ui/Container";
import { Idade } from "@/components/ui/Idade";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { IconCake, IconCap, IconPin } from "@/components/ui/icons";
import { LitText } from "@/components/motion/LitText";
import { Reveal } from "@/components/motion/Reveal";

export function Sobre() {
  const graduacao = perfil.formacao[0];

  const informacoes = [
    { icone: <IconPin className="h-5 w-5" />, rotulo: "Cidade", valor: perfil.cidade },
    { icone: <IconCake className="h-5 w-5" />, rotulo: "Idade", valor: <Idade nascimento={perfil.nascimento} /> },
    {
      icone: <IconCap className="h-5 w-5" />,
      rotulo: "Graduação",
      valor: `${graduacao.curso} · ${graduacao.instituicao}`,
    },
  ];

  return (
    <section id="sobre" className="scroll-mt-20 py-24">
      <Container>
        <Reveal>
          <SecaoTitulo rotulo="Sobre mim" titulo="Quem é o Guilherme" />
        </Reveal>
        <LitText
          texto={perfil.sobre}
          destaques={perfil.palavrasDestaque}
          className="max-w-4xl text-2xl leading-snug font-bold tracking-tight sm:text-4xl"
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Reveal className="rounded-2xl border border-line bg-card p-6">
            <h3 className="text-base font-semibold text-white">Informações</h3>
            <dl className="mt-5 space-y-4">
              {informacoes.map((info) => (
                <div key={info.rotulo} className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-accent">
                    {info.icone}
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs text-muted">{info.rotulo}</dt>
                    <dd className="font-medium text-white">{info.valor}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={120} className="rounded-2xl border border-line bg-card p-6">
            <h3 className="text-base font-semibold text-white">Formação</h3>
            <ol className="relative mt-5 space-y-6 border-l border-line pl-6">
              {perfil.formacao.map((f) => (
                <li key={f.curso} className="relative">
                  <span
                    aria-hidden="true"
                    className="bg-gradient-brand absolute top-1.5 -left-[29px] h-2.5 w-2.5 rounded-full ring-4 ring-card"
                  />
                  <p className="font-medium text-white">{f.curso}</p>
                  <p className="text-sm text-muted">
                    {f.instituicao} · {f.situacao}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
