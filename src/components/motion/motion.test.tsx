import { act, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LitText } from "./LitText";
import { Reveal } from "./Reveal";
import { ScrollProgress } from "./ScrollProgress";
import { TiltCard } from "./TiltCard";

type Midia = { reduzido?: boolean; ponteiroFino?: boolean };

function configurarMidia({ reduzido = false, ponteiroFino = true }: Midia) {
  window.matchMedia = vi.fn((query: string) => ({
    matches:
      (query.includes("prefers-reduced-motion: reduce") && reduzido) ||
      (query.includes("pointer: fine") && ponteiroFino),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

let callbackObserver: IntersectionObserverCallback | null = null;

function instalarIntersectionObserver() {
  callbackObserver = null;
  class FakeObserver {
    constructor(cb: IntersectionObserverCallback) {
      callbackObserver = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
}

const revelado = (texto: string) =>
  screen.getByText(texto).closest("[data-revealed]")?.getAttribute("data-revealed");

beforeEach(() => {
  configurarMidia({});
  instalarIntersectionObserver();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Reveal", () => {
  test("com movimento reduzido o conteúdo fica visível", () => {
    configurarMidia({ reduzido: true });
    render(<Reveal>oi</Reveal>);
    expect(revelado("oi")).toBe("true");
  });

  test("sem IntersectionObserver o conteúdo fica visível", () => {
    // @ts-expect-error simulando navegador sem suporte
    delete window.IntersectionObserver;
    render(<Reveal>oi</Reveal>);
    expect(revelado("oi")).toBe("true");
  });

  test("esconde até entrar na tela e então revela", () => {
    render(<Reveal>oi</Reveal>);
    expect(revelado("oi")).toBe("false");
    act(() => {
      callbackObserver?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(revelado("oi")).toBe("true");
  });
});

describe("Reveal após hidratação do servidor", () => {
  test("com movimento reduzido continua visível depois de hidratar", async () => {
    configurarMidia({ reduzido: true });
    const html = renderToString(<Reveal>oi</Reveal>);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    await act(async () => {
      hydrateRoot(container, <Reveal>oi</Reveal>);
    });
    expect(container.querySelector("[data-revealed]")).toHaveAttribute("data-revealed", "true");
    expect(container.querySelector("[data-revealed]")?.className).not.toMatch(/opacity-0/);
    container.remove();
  });
});

describe("Reveal já visível ao carregar", () => {
  test("não esconde o que já está na tela (sem piscar)", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 100, bottom: 300, left: 0, right: 100, width: 100, height: 200, x: 0, y: 100, toJSON: () => ({}),
    } as DOMRect);
    render(<Reveal>oi</Reveal>);
    expect(revelado("oi")).toBe("true");
    expect(screen.getByText("oi").closest("[data-revealed]")?.className).not.toMatch(/opacity-0/);
  });
});

describe("TiltCard", () => {
  test("desliga em toque (ponteiro grosso)", () => {
    configurarMidia({ ponteiroFino: false });
    render(<TiltCard>c</TiltCard>);
    expect(screen.getByText("c").closest("[data-tilt]")).toHaveAttribute("data-tilt", "off");
  });

  test("desliga com movimento reduzido", () => {
    configurarMidia({ reduzido: true });
    render(<TiltCard>c</TiltCard>);
    expect(screen.getByText("c").closest("[data-tilt]")).toHaveAttribute("data-tilt", "off");
  });

  test("o card não se mexe quando o mouse passa por cima", () => {
    render(<TiltCard>c</TiltCard>);
    const card = screen.getByText("c").closest("[data-tilt]") as HTMLElement;
    fireEvent.mouseMove(card, { clientX: 10, clientY: 10 });
    expect(card.style.transform).toBe("");
    expect(card.className).not.toMatch(/transition-transform/);
  });

  test("liga com mouse", () => {
    render(<TiltCard>c</TiltCard>);
    expect(screen.getByText("c").closest("[data-tilt]")).toHaveAttribute("data-tilt", "on");
  });
});

describe("LitText", () => {
  test("separa palavras e marca os destaques", () => {
    const { container } = render(
      <LitText texto="Estudo Engenharia de Software" destaques={["Engenharia"]} />,
    );
    expect(container.querySelectorAll("span[data-lit]")).toHaveLength(4);
    expect(screen.getByText("Engenharia")).toHaveAttribute("data-hl", "true");
    expect(screen.getByText("Estudo")).not.toHaveAttribute("data-hl");
  });

  test("com movimento reduzido todas as palavras ficam acesas", () => {
    configurarMidia({ reduzido: true });
    const { container } = render(<LitText texto="um dois três" destaques={[]} />);
    const spans = [...container.querySelectorAll("span[data-lit]")];
    expect(spans.every((s) => s.getAttribute("data-lit") === "true")).toBe(true);
  });

  test("mantém o texto completo legível para leitores de tela", () => {
    render(<LitText texto="um dois três" destaques={[]} />);
    expect(screen.getByText("um dois três", { selector: ".sr-only" })).toBeInTheDocument();
  });
});

describe("ScrollProgress", () => {
  test("começa em 0% e é decorativa", () => {
    const { container } = render(<ScrollProgress />);
    const barra = container.firstElementChild as HTMLElement;
    expect(barra).toHaveAttribute("aria-hidden", "true");
    expect(barra.style.transform).toBe("scaleX(0)");
  });
});
