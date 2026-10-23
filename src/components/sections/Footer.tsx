import { perfil } from "@/content/perfil";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <Container className="flex flex-col items-center justify-between gap-2 text-sm text-muted sm:flex-row">
        <p>
          <span className="text-gradient font-bold">GR.</span> {perfil.nome}
        </p>
        <p>Feito com Next.js, TypeScript e Tailwind CSS.</p>
      </Container>
    </footer>
  );
}
