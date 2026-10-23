import { act, render, screen } from "@testing-library/react";
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
