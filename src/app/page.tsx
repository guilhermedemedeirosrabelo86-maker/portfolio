import { Contato } from "@/components/sections/Contato";
import { Hero } from "@/components/sections/Hero";
import { Projetos } from "@/components/sections/Projetos";
import { Skills } from "@/components/sections/Skills";
import { Sobre } from "@/components/sections/Sobre";

export default function Home() {
  return (
    <main>
      <Hero />
      <Projetos />
      <Sobre />
      <Skills />
      <Contato />
    </main>
  );
}
