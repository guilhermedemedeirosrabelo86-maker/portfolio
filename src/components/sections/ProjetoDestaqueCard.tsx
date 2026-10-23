import type { Projeto } from "@/content/types";
import { Botao } from "@/components/ui/Botao";
import { Tags } from "@/components/ui/Tags";
import { IconArrowRight, IconExternal, IconGitHub } from "@/components/ui/icons";
import { TiltCard } from "@/components/motion/TiltCard";
import { CentralBrindesVisual } from "./CentralBrindesVisual";

export function ProjetoDestaqueCard({ projeto }: { projeto: Projeto }) {
  const etapas = [
    { rotulo: "Problema", texto: projeto.problema },
    { rotulo: "Solução", texto: projeto.solucao },
    { rotulo: "Resultado", texto: projeto.resultado },
  ].filter((e) => e.texto);

  return (
    <TiltCard className="h-full rounded-2xl border border-accent/40 bg-card">
      <article className="grid h-full gap-6 p-5 sm:p-6 xl:grid-cols-[0.9fr_1.1fr]">
        <CentralBrindesVisual className="self-start" />
        <div className="flex flex-col">
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">Projeto principal</p>
          <h3 className="mt-1 text-2xl font-bold text-white">{projeto.titulo}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{projeto.resumo}</p>

          <dl className="mt-4 space-y-2 text-sm">
            {etapas.map((e) => (
              <div key={e.rotulo}>
                <dt className="inline font-semibold text-white">{e.rotulo}: </dt>
                <dd className="inline text-soft">{e.texto}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <Tags tags={projeto.tags} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {projeto.casoUrl && (
              <Botao href={projeto.casoUrl}>
                Ver estudo de caso <IconArrowRight />
              </Botao>
            )}
            {projeto.codigoUrl && (
              <Botao href={projeto.codigoUrl} variante="contorno" externo>
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
      </article>
    </TiltCard>
  );
}
