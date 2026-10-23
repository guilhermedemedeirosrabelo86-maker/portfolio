import { perfil } from "@/content/perfil";
import { Container } from "@/components/ui/Container";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { Reveal } from "@/components/motion/Reveal";
import { TechIcon } from "@/components/ui/TechIcon";

export function Skills() {
  return (
    <section id="skills" className="scroll-mt-20 border-t border-white/5 bg-black/20 py-20">
      <Container>
        <Reveal>
          <SecaoTitulo rotulo="Skills" titulo="Com o que eu trabalho" />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {perfil.skills.map((g, i) => (
            <Reveal key={g.grupo} delay={120 * i} className="rounded-2xl border border-line bg-card p-6">
              <h3 className="text-base font-semibold text-white">{g.grupo}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {g.itens.map((item) => (
                  <li
                    key={item}
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-sm text-[#cfd2ee]"
                  >
                    <TechIcon nome={item} className="h-4 w-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
