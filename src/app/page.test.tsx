import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import Home from "./page";

const hrefs = () => screen.getAllByRole("link").map((a) => a.getAttribute("href"));

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 23));
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  render(<Home />);
});

describe("página inicial", () => {
  test("o título principal é o nome", () => {
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Guilherme Rabelo");
  });

  test("não tem links vazios", () => {
    expect(hrefs()).not.toContain("");
    expect(hrefs()).not.toContain("#");
    expect(hrefs()).not.toContain(null);
  });

  test("esconde o botão de currículo enquanto não há PDF", () => {
    expect(screen.queryByText(/baixar currículo/i)).toBeNull();
  });

  test("link para a demo do Central Brindes", () => {
    expect(screen.getByRole("link", { name: /ver demo/i })).toHaveAttribute("href", "/demo/central-brindes/index.html");
    expect(screen.queryByText(/demo em breve/i)).toBeNull();
  });

  test("link para o código do Central Brindes", () => {
    expect(screen.getByRole("link", { name: /ver código/i })).toHaveAttribute(
      "href",
      "https://github.com/guilhermedemedeirosrabelo86-maker/central-brindes",
    );
  });

  test("link para o estudo de caso", () => {
    expect(screen.getByRole("link", { name: /estudo de caso/i })).toHaveAttribute(
      "href",
      "/projetos/central-brindes",
    );
  });

  test("botões de conversa levam ao WhatsApp", () => {
    const links = screen.getAllByRole("link", { name: /whatsapp|vamos conversar/i });
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5548998230477\?text=/);
    }
  });

  test("links de e-mail e GitHub", () => {
    for (const link of screen.getAllByRole("link", { name: /e-mail/i })) {
      expect(link).toHaveAttribute("href", "mailto:guilhermedemedeirosrabelo86@gmail.com");
    }
    expect(hrefs()).toContain("https://github.com/guilhermedemedeirosrabelo86-maker");
  });

  test("LinkedIn fica escondido enquanto vazio", () => {
    expect(screen.queryByRole("link", { name: /linkedin/i })).toBeNull();
  });

  test("mostra o selo, o card em construção e as seções", () => {
    expect(screen.getByText(/aberto a oportunidades/i)).toBeInTheDocument();
    expect(screen.getByText(/em construção/i)).toBeInTheDocument();
    for (const id of ["inicio", "projetos", "sobre", "skills", "contato"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  test("não cita a empresa empregadora", () => {
    expect(document.body.textContent).not.toMatch(/anjo/i);
  });

  test("mostra cidade, idade e formação", () => {
    expect(screen.getAllByText(/Criciúma, SC/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("20 anos")).toBeInTheDocument();
    expect(screen.getAllByText(/UNISATC/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Colégio Universitário/)).toBeInTheDocument();
    expect(screen.getByText(/Concluído em 2024/)).toBeInTheDocument();
  });
});
