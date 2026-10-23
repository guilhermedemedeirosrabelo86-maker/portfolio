import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { projetoDestaque } from "@/content/projetos";
import CasoCentralBrindes from "./page";

beforeEach(() => {
  render(<CasoCentralBrindes />);
});

describe("estudo de caso do Central Brindes", () => {
  test("título da página", () => {
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Central Brindes");
  });

  test("tem as seções do estudo de caso", () => {
    for (const titulo of ["Problema", "Solução", "Resultado", "Destaques técnicos", "Stack"]) {
      expect(screen.getByRole("heading", { level: 2, name: titulo })).toBeInTheDocument();
    }
  });

  test("lista os oito destaques técnicos", () => {
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(8);
  });

  test("links de código e de volta", () => {
    expect(screen.getByRole("link", { name: /ver código/i })).toHaveAttribute("href", projetoDestaque().codigoUrl);
    expect(screen.getByRole("link", { name: /voltar/i })).toHaveAttribute("href", "/#projetos");
  });

  test("mostra o print do sistema", () => {
    expect(screen.getByRole("img", { name: /tela inicial do central brindes/i })).toBeInTheDocument();
  });

  test("demo linkada e explicada", () => {
    expect(screen.getByRole("link", { name: /ver demo/i })).toHaveAttribute("href", "/demo/central-brindes/index.html");
    expect(screen.getByText(/dados fictícios e roda inteira no seu navegador/i)).toBeInTheDocument();
  });

  test("não cita a empresa empregadora", () => {
    expect(document.body.textContent).not.toMatch(/anjo/i);
  });
});
