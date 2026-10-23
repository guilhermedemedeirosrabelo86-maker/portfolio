import { perfil } from "@/content/perfil";
import { Container } from "@/components/ui/Container";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { LitText } from "@/components/motion/LitText";
import { Reveal } from "@/components/motion/Reveal";

const fatos = [
  { valor: "Eng. de Software", rotulo: "Graduação em andamento" },
  { valor: "Dia todo", rotulo: "Trabalhando e construindo ao mesmo tempo" },
  { valor: "Em uso real", rotulo: "Sistema usado pela equipe todos os dias" },
];

export function Sobre() {
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
        <ul className="mt-14 grid gap-4 sm:grid-cols-3">
          {fatos.map((f, i) => (
            <Reveal as="li" key={f.valor} delay={120 * i} className="rounded-2xl border border-line bg-card p-5">
              <p className="text-gradient text-xl font-bold">{f.valor}</p>
              <p className="mt-1 text-sm text-muted">{f.rotulo}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
