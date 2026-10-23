# Portfólio Guilherme Rabelo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portfólio de uma página em Next.js (+ página de estudo de caso do Central Brindes), visual azul-escuro com gradiente azul→roxo, animações de scroll/mouse, pronto para deploy na Vercel.

**Architecture:** Next.js App Router com páginas estáticas. Todo conteúdo editável vive em `src/content/` (dados tipados); componentes de seção só leem esses dados. Animações são componentes cliente pequenos e isolados em `src/components/motion/`, feitos com CSS + IntersectionObserver (sem biblioteca de animação).

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Vitest + @testing-library/react + jsdom · Node 24.

**Spec:** `docs/superpowers/specs/2026-10-23-portfolio-design.md`

## Global Constraints

- Todo texto visível em **pt-BR**; `<html lang="pt-BR">`.
- Cores: fundo base `#080a1a`, card `#0e1130`, borda `#232856`, texto `#e8eaf6`, texto suave `#9da2c8`, gradiente `#3b82f6` → `#8b5cf6`, verde do selo `#22c55e`. Definidas como tokens `@theme` em `src/app/globals.css`.
- **O nome da empresa empregadora não aparece em nenhum texto, imagem ou metadado do site.** Usar "empresa onde trabalho".
- Nenhum link com `href=""` ou `href="#"`; item pendente (string vazia em `src/content`) = elemento escondido ou em estado "em breve".
- WhatsApp: `5548998230477`. E-mail: `guilhermedemedeirosrabelo86@gmail.com`. GitHub: `https://github.com/guilhermedemedeirosrabelo86-maker`. Código do Central Brindes: `https://github.com/guilhermedemedeirosrabelo86-maker/central-brindes`. GR Digital: `https://github.com/guilhermedemedeirosrabelo86-maker/GR-Digital`.
- Animações escolhidas: surgir ao rolar, luz+3D no mouse (só `pointer: fine`), texto que acende, barra de progresso. Tudo desligado com `prefers-reduced-motion: reduce`.
- URL base única em `src/content/site.ts` (`https://guilherme-rabelo.vercel.app` até haver domínio).
- `.superpowers/` e `node_modules/` no `.gitignore`.

## Review Focus

1. **Celular (360px)**: nenhuma rolagem horizontal; hero e card principal empilham; tilt/luz não ativam em toque. → teste de classe/guard em Task 3 + verificação manual em Task 6.
2. **Movimento reduzido**: todo conteúdo visível e estático, nada preso em `opacity: 0`. → teste em Task 3.
3. **JS/IntersectionObserver indisponível**: `Reveal` não pode deixar conteúdo invisível. → teste em Task 3.
4. **Conteúdo pendente vazio** (cv, demo, foto, linkedin): sem links quebrados nem botões mortos. → teste em Task 4.
5. **Vazamento do nome da empresa**: nenhuma ocorrência de "Anjo" no HTML renderizado. → testes em Tasks 4 e 5.

---

### Task 1: Projeto base, tema e testes

**Files:**
- Create: projeto via `create-next-app` na raiz; `vitest.config.ts`; `vitest.setup.ts`; `src/app/globals.css` (substituir); `src/app/layout.tsx` (substituir); `.gitignore` (acrescentar `.superpowers/`); `src/smoke.test.ts`

**Interfaces:**
- Produces: script `npm test` (vitest run); utilitários Tailwind `bg-base`, `bg-card`, `border-line`, `text-ink`, `text-muted`, classe `.text-gradient` e `.bg-gradient-brand`; fonte via `next/font/google` (Inter) na variável `--font-sans`.

- [ ] **Step 1:** `git init`; rodar `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack` (pasta já tem `docs/` e `.superpowers/`; se recusar pasta não vazia, criar em pasta temporária e mover).
- [ ] **Step 2:** `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`; `vitest.config.ts` com `environment: "jsdom"`, alias `@` → `src`, `setupFiles: ["vitest.setup.ts"]`; script `"test": "vitest run"`.
- [ ] **Step 3:** Escrever `src/smoke.test.ts`: `expect(1 + 1).toBe(2)`. Rodar `npm test` → PASS.
- [ ] **Step 4:** `globals.css` com tokens do Global Constraints, `body` com fundo `#080a1a` + gradiente radial sutil roxo no topo direito, `scroll-behavior: smooth` (só sem reduced-motion). `layout.tsx`: `lang="pt-BR"`, Inter, metadata provisória `title: "Guilherme Rabelo · Desenvolvedor Web"`.
- [ ] **Step 5:** `npm run build` → sucesso. Commit `chore: base Next.js com tema e Vitest`.

### Task 2: Camada de conteúdo

**Files:**
- Create: `src/content/types.ts`, `src/content/site.ts`, `src/content/perfil.ts`, `src/content/projetos.ts`, `src/lib/links.ts`
- Test: `src/content/content.test.ts`, `src/lib/links.test.ts`

**Interfaces:**
- Produces:
  - `type Projeto = { slug: string; titulo: string; resumo: string; destaque: boolean; status: "pronto" | "em-construcao"; tags: string[]; imagem?: string; linkExterno?: string; codigoUrl?: string; demoUrl?: string; casoUrl?: string; problema?: string; solucao?: string; resultado?: string }`
  - `type Perfil = { nome: string; cargo: string; frase: string; sobre: string; palavrasDestaque: string[]; whatsapp: string; email: string; github: string; linkedin: string; cvUrl: string; fotoUrl: string; skills: { grupo: string; itens: string[] }[] }`
  - `site: { url: string; titulo: string; descricao: string }`
  - `perfil: Perfil`, `projetos: Projeto[]`, `projetoDestaque(): Projeto`
  - `whatsappUrl(numero: string, mensagem: string): string` e `mailtoUrl(email: string): string` em `src/lib/links.ts`

- [ ] **Step 1: Testes que falham**
```ts
// links.test.ts
expect(whatsappUrl("5548998230477", "Olá, Guilherme!"))
  .toBe("https://wa.me/5548998230477?text=Ol%C3%A1%2C%20Guilherme!");
expect(mailtoUrl("a@b.com")).toBe("mailto:a@b.com");
// content.test.ts
expect(projetos.filter(p => p.destaque)).toHaveLength(1);
expect(projetoDestaque().slug).toBe("central-brindes");
expect(projetoDestaque().codigoUrl).toBe("https://github.com/guilhermedemedeirosrabelo86-maker/central-brindes");
expect(projetoDestaque().demoUrl ?? "").toBe("");
expect(projetos.find(p => p.slug === "outros-sites")?.status).toBe("em-construcao");
expect(JSON.stringify({ perfil, projetos, site })).not.toMatch(/anjo/i);
expect(perfil.cvUrl).toBe(""); expect(perfil.fotoUrl).toBe(""); expect(perfil.linkedin).toBe("");
```
- [ ] **Step 2:** `npm test` → FAIL (módulos inexistentes).
- [ ] **Step 3:** Implementar. Conteúdo:
  - Projetos (nesta ordem): `central-brindes` (destaque, `casoUrl: "/projetos/central-brindes"`, tags `HTML, CSS, JavaScript, Firebase, Cloudflare Workers, SQL`, problema/solução/resultado da spec §4); `gr-digital` (`linkExterno` = repo GR-Digital, tags `HTML, CSS, JavaScript`); `outros-sites` (`status: "em-construcao"`, resumo "Novos sites chegando por aqui.").
  - Perfil: cargo "Desenvolvedor Web"; skills em grupos *Front-end* (HTML, CSS, JavaScript, React (estudando)), *Back-end e dados* (Firebase, SQL, Cloudflare Workers), *Ferramentas* (Git, GitHub). `sobre` em 1–3 frases na voz dele contando a história da spec §1; `palavrasDestaque` com 3–5 termos que aparecem em `sobre`. Copy livre, tom direto.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: conteúdo tipado do portfólio`.

### Task 3: Componentes de animação

**Files:**
- Create: `src/components/motion/useReducedMotion.ts`, `Reveal.tsx`, `TiltCard.tsx`, `LitText.tsx`, `ScrollProgress.tsx`
- Test: `src/components/motion/motion.test.tsx`

**Interfaces:**
- Produces (todos `"use client"`):
  - `useReducedMotion(): boolean`
  - `<Reveal delay?: number (ms) as?: keyof JSX.IntrinsicElements className?>` — entra com fade + translateY(40px), 700ms. Estado escondido só é aplicado **depois de montar e com IntersectionObserver disponível e sem reduced-motion**; antes disso o conteúdo é visível. Atributo `data-revealed="true|false"`.
  - `<TiltCard className?>` — luz radial roxa (260px) seguindo o cursor via CSS vars `--x/--y` e rotação máx. 6° por eixo + scale 1.03. Só ativa com `matchMedia("(pointer: fine)")` e sem reduced-motion; senão é um `div` estático. Atributo `data-tilt="on|off"`.
  - `<LitText texto: string destaques: string[] className?>` — divide por espaço em `<span>`; palavra acesa ganha `data-lit="true"`; palavras cujo início casa com algum destaque ganham `data-hl="true"` (cor roxa quando acesa). Progresso = posição do elemento entre 85% e 25% da viewport. Com reduced-motion, todas acesas.
  - `<ScrollProgress />` — barra fixa de 3px no topo com gradiente, largura = % rolado.

- [ ] **Step 1: Testes que falham** (mockar `matchMedia` e `IntersectionObserver` no próprio teste)
```tsx
// reduced motion ligado
render(<Reveal>oi</Reveal>); expect(screen.getByText("oi").closest("[data-revealed]")).toHaveAttribute("data-revealed","true");
// IntersectionObserver ausente (delete window.IntersectionObserver)
render(<Reveal>oi</Reveal>); expect(...).toHaveAttribute("data-revealed","true");
// pointer coarse
render(<TiltCard>c</TiltCard>); expect(...).toHaveAttribute("data-tilt","off");
// LitText
render(<LitText texto="Estudo Engenharia de Software" destaques={["Engenharia"]} />);
expect(container.querySelectorAll("span")).toHaveLength(4);
expect(screen.getByText("Engenharia")).toHaveAttribute("data-hl","true");
// LitText com reduced motion: todos data-lit="true"
```
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar. Comportamento de referência funcionando em `.superpowers/brainstorm/394-1792754589/content/animacoes.html`. Listeners de scroll `passive` + `requestAnimationFrame`.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: componentes de animação com respeito a movimento reduzido`.

### Task 4: Página inicial

**Files:**
- Create: `src/components/sections/Navbar.tsx`, `Hero.tsx`, `HeroIlustracao.tsx`, `Projetos.tsx`, `ProjetoDestaqueCard.tsx`, `ProjetoCard.tsx`, `Sobre.tsx`, `Skills.tsx`, `Contato.tsx`, `Footer.tsx`; `src/components/ui/Botao.tsx`
- Modify: `src/app/page.tsx`, `src/app/layout.tsx` (incluir `<ScrollProgress />`)
- Test: `src/app/page.test.tsx`

**Interfaces:**
- Consumes: `perfil`, `projetos`, `projetoDestaque()`, `whatsappUrl`, `mailtoUrl` (Task 2); `Reveal`, `TiltCard`, `LitText` (Task 3).
- Produces: `<Botao href?: string variante: "primario" | "contorno" desabilitado?: boolean externo?: boolean>` — sem `href` ou `desabilitado` renderiza `<span aria-disabled="true">`. Âncoras de seção: `#inicio`, `#sobre`, `#projetos`, `#skills`, `#contato`.

- [ ] **Step 1: Testes que falham** (renderizar `<Home />`)
```tsx
expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Guilherme Rabelo");
expect(screen.getAllByRole("link").map(a=>a.getAttribute("href"))).not.toContain("");
expect(screen.getAllByRole("link").map(a=>a.getAttribute("href"))).not.toContain("#");
expect(screen.queryByText(/baixar currículo/i)).toBeNull();          // cvUrl vazio
expect(screen.getByText(/demo em breve/i).closest("[aria-disabled]")).toBeTruthy();
expect(screen.getByRole("link",{name:/ver código/i})).toHaveAttribute("href","https://github.com/guilhermedemedeirosrabelo86-maker/central-brindes");
expect(screen.getAllByRole("link",{name:/whatsapp|vamos conversar/i})[0].getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5548998230477/);
expect(screen.getByRole("link",{name:/e-mail/i})).toHaveAttribute("href","mailto:guilhermedemedeirosrabelo86@gmail.com");
expect(screen.getByText(/em construção/i)).toBeInTheDocument();
expect(screen.getByText(/aberto a oportunidades/i)).toBeInTheDocument();
expect(document.body.textContent).not.toMatch(/anjo/i);
```
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar seguindo o mockup aprovado "Versão 2" (`.superpowers/brainstorm/394-1792754589/content/referencia-v1.html`) e a ordem da spec §4: Navbar (logo "GR." gradiente, links, botão contorno "Vamos conversar" → WhatsApp; menu hambúrguer abaixo de `md`) · Hero (h1 com nome, cargo em gradiente, frase, botões "Ver projetos →" (`#projetos`) e "Fale comigo no WhatsApp", ícones GitHub/e-mail; à direita `HeroIlustracao` — SVG abstrato tech dentro de anel com brilho; se `perfil.fotoUrl` preenchido, mostra `next/image` no lugar; selo "Aberto a oportunidades" com bolinha verde) · Projetos (card grande do destaque com rótulo "PROJETO PRINCIPAL", Problema/Solução/Resultado, tags, botões "Ver estudo de caso", "Ver código", "Demo em breve" desabilitado; à direita cards menores; cards dentro de `TiltCard` + `Reveal` com delay escalonado 120ms) · Sobre (`LitText`) · Skills (grupos) · Contato (WhatsApp, e-mail, GitHub; LinkedIn só se preenchido) · Footer. Mensagem do WhatsApp: "Olá, Guilherme! Vi seu portfólio e gostaria de conversar."
- [ ] **Step 4:** `npm test` → PASS; `npm run build` → sucesso. Commit `feat: página inicial do portfólio`.

### Task 5: Estudo de caso do Central Brindes

**Files:**
- Create: `src/app/projetos/central-brindes/page.tsx`, `src/components/caso/DestaquesTecnicos.tsx`, `src/content/casoCentralBrindes.ts`
- Test: `src/app/projetos/central-brindes/page.test.tsx`

**Interfaces:**
- Consumes: `projetoDestaque()`, `Botao`, `Reveal`, `TiltCard`.
- Produces: `casoCentralBrindes: { destaques: { titulo: string; texto: string }[]; stack: string[] }`.

- [ ] **Step 1: Testes que falham**
```tsx
expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Central Brindes");
["Problema","Solução","Resultado","Destaques técnicos","Stack"].forEach(t=>expect(screen.getByRole("heading",{name:t})).toBeInTheDocument());
expect(screen.getAllByRole("heading",{level:3}).length).toBeGreaterThanOrEqual(8); // um por destaque
expect(screen.getByRole("link",{name:/ver código/i})).toHaveAttribute("href", projetoDestaque().codigoUrl);
expect(screen.getByRole("link",{name:/voltar/i})).toHaveAttribute("href","/#projetos");
expect(document.body.textContent).not.toMatch(/anjo/i);
```
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar. Os 8 destaques são os itens da spec §4 "Destaques técnicos" (estoque calculado pelo histórico; envios + importação de NF; página pública de acompanhamento; tarefas/conversas com push; rotinas automáticas e backup; login e permissões; SQL no navegador; deploy automático). Stack da spec. Imagem: ilustração/placeholder no estilo do site (sem prints reais). `export const metadata` com título "Central Brindes · Guilherme Rabelo".
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: estudo de caso do Central Brindes`.

### Task 6: SEO, responsivo e verificação no navegador

**Files:**
- Create: `src/app/opengraph-image.tsx`, `src/app/icon.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `README.md`
- Modify: `src/app/layout.tsx` (metadata completa com `metadataBase: new URL(site.url)`)

- [ ] **Step 1:** Metadata: título, descrição, Open Graph (`next/og`, 1200×630, fundo do site, "Guilherme Rabelo" + "Desenvolvedor Web" em gradiente), ícone "GR" 32×32, sitemap com `/` e `/projetos/central-brindes`, robots liberando tudo.
- [ ] **Step 2:** README curto em pt-BR: rodar local, onde editar conteúdo (`src/content/*` — foto, currículo, LinkedIn, demo), deploy na Vercel.
- [ ] **Step 3:** `npm test` e `npm run build` → ambos passam.
- [ ] **Step 4:** `npm run dev` e conferir no navegador em 1440px e 375px: sem rolagem horizontal (`document.documentElement.scrollWidth <= innerWidth`), hero/projeto empilhados no celular, animações funcionando, links do WhatsApp/e-mail/GitHub corretos, página do caso abre e volta. Com "reduzir movimento" emulado: tudo visível.
- [ ] **Step 5:** Commit `feat: SEO e ajustes finais`.

### Task 7: Publicação (com o Guilherme)

- [ ] **Step 1:** Confirmar com o Guilherme antes de qualquer passo público: criar repo `portfolio` no GitHub dele e fazer push.
- [ ] **Step 2:** Ele importa o repo na Vercel (login dele) — guiar o passo a passo; anotar a URL final e, se diferente, atualizar `site.url` e commitar.
