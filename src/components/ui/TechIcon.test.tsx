import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { TechIcon } from "./TechIcon";

describe("TechIcon", () => {
  test("desenha o ícone de uma tecnologia conhecida", () => {
    const { container } = render(<TechIcon nome="React" />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  test("ignora sufixos como (estudando)", () => {
    const { container } = render(<TechIcon nome="React (estudando)" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  test("tem ícone para todas as skills e tags usadas no site", async () => {
    const { perfil } = await import("@/content/perfil");
    const { projetos } = await import("@/content/projetos");
    const { casoCentralBrindes } = await import("@/content/casoCentralBrindes");
    const nomes = [
      ...perfil.skills.flatMap((g) => g.itens),
      ...projetos.flatMap((p) => p.tags),
      ...casoCentralBrindes.stack,
    ];
    for (const nome of nomes) {
      const { container, unmount } = render(<TechIcon nome={nome} />);
      expect(container.querySelector("svg"), nome).not.toBeNull();
      unmount();
    }
  });

  test("tecnologia desconhecida não desenha nada", () => {
    const { container } = render(<TechIcon nome="Tecnologia Inventada" />);
    expect(container.firstChild).toBeNull();
  });

  test("ícones de marca escuros ficam claros no fundo escuro", () => {
    const { container } = render(<TechIcon nome="GitHub" />);
    expect(container.querySelector("svg")?.getAttribute("fill")).toBe("#ecebe8");
  });
});
