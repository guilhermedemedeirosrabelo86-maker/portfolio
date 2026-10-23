import type { Projeto } from "@/content/types";
import { Tags } from "@/components/ui/Tags";
import { IconExternal } from "@/components/ui/icons";
import { TiltCard } from "@/components/motion/TiltCard";

export function ProjetoCard({ projeto }: { projeto: Projeto }) {
  const emConstrucao = projeto.status === "em-construcao";

  return (
    <TiltCard
      className={`h-full rounded-2xl bg-card ${emConstrucao ? "border border-dashed border-line" : "border border-line"}`}
    >
      <article className="flex h-full gap-4 p-5">
        <div
          aria-hidden="true"
          className={`hidden h-20 w-24 shrink-0 rounded-lg sm:block ${
            emConstrucao
              ? "bg-[repeating-linear-gradient(135deg,#18181a_0_8px,#202023_8px_16px)]"
              : "bg-gradient-to-br from-[#3a2a05] to-[#1c1a14]"
          }`}
        />
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{projeto.titulo}</h3>
            {emConstrucao && (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                Em construção
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{projeto.resumo}</p>
          {projeto.tags.length > 0 && (
            <div className="mt-3">
              <Tags tags={projeto.tags} />
            </div>
          )}
          {projeto.linkExterno && (
            <a
              href={projeto.linkExterno}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-white"
            >
              Ver {projeto.titulo} <IconExternal />
            </a>
          )}
        </div>
      </article>
    </TiltCard>
  );
}
