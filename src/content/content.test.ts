import { describe, expect, test } from "vitest";
import { perfil } from "./perfil";
import { projetoDestaque, projetos } from "./projetos";
import { site } from "./site";

describe("conteúdo do portfólio", () => {
  test("existe exatamente um projeto em destaque, o Central Brindes", () => {
    expect(projetos.filter((p) => p.destaque)).toHaveLength(1);
    expect(projetoDestaque().slug).toBe("central-brindes");
  });

  test("Central Brindes tem link de código e ainda não tem demo", () => {
    expect(projetoDestaque().codigoUrl).toBe(
      "https://github.com/guilhermedemedeirosrabelo86-maker/central-brindes",
    );
    expect(projetoDestaque().demoUrl ?? "").toBe("");
  });

  test("outros sites aparecem como em construção", () => {
    expect(projetos.find((p) => p.slug === "outros-sites")?.status).toBe("em-construcao");
  });

  test("o nome da empresa empregadora não aparece no conteúdo", () => {
    expect(JSON.stringify({ perfil, projetos, site })).not.toMatch(/anjo/i);
  });

  test("itens pendentes começam vazios", () => {
    expect(perfil.cvUrl).toBe("");
    expect(perfil.fotoUrl).toBe("");
    expect(perfil.linkedin).toBe("");
  });

  test("palavras em destaque do Sobre aparecem no texto", () => {
    for (const palavra of perfil.palavrasDestaque) {
      expect(perfil.sobre).toContain(palavra);
    }
  });
});
