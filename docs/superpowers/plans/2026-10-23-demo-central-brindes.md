# Demo do Central Brindes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cópia clicável do Central Brindes em `public/demo/central-brindes/`, rodando 100% no navegador com dados fictícios, sem marca da empresa, linkada no card do portfólio.

**Architecture:** Os arquivos estáticos do original (snapshot `299d8f3`) são copiados para `public/demo/central-brindes/`. O SDK do Firebase via CDN é trocado por `js/firebase-demo.js`, um objeto global `firebase` compatível com o subconjunto da API compat v10 que o app usa, persistido em `localStorage`. Os dados iniciais vêm de `js/demo-seed.js`. O portfólio só ganha o link.

**Tech Stack:** HTML/CSS/JS puros (demo) · Next.js 16 servindo `public/` · Vitest + jsdom para testar o shim e o "scrub" da marca.

**Spec:** `docs/superpowers/specs/2026-10-23-demo-central-brindes-design.md`

## Global Constraints

- **Nunca escrever** no clone original (`scratchpad/central-brindes`) nem no GitHub dele. Só ler e copiar.
- Origem: `C:\Users\GUILHE~1.RAB\AppData\Local\Temp\claude\C--Users-guilherme-rabelo-PORTIFOLIO-Gui\d9451650-45cb-4dc6-a0f5-9dca7418a77c\scratchpad\central-brindes`, commit `299d8f3`.
- Cores do original **ficam iguais** (`--brand`, `--flame-o`, `--flame-y`). Sai só a marca: logo, nome da empresa, fotos de produtos.
- Em `public/demo/central-brindes/` não pode existir (qualquer caixa): `anjo`, `AIza`, `firebaseapp.com`, `workers.dev`, `gstatic.com/firebasejs`, `controle-brindes`, `brindes-anjotintas`.
- Sem rede além de `viacep.com.br`: `fetch` para `/api/*` responde `{ ok: true }` localmente.
- Visitante: uid `visitante`, nome "Visitante", perfil `admin: true, ativo: true`.
- Chave do localStorage: `cb-demo-v1`.
- Link no portfólio: `demoUrl: "/demo/central-brindes/index.html"`.

## Review Focus

1. **Primeira visita com localStorage vazio** abre populada (sem tela de login, sem "setup inicial"). → teste em Task 1 (`semente na primeira carga`).
2. **localStorage indisponível/cheio** (aba anônima com bloqueio, cota excedida): a demo ainda abre e funciona na memória. → teste em Task 1.
3. **Duas abas abertas**: uma mudança numa não corrompe a outra (última escrita vence, sem erro). → teste em Task 1 (recarrega do storage em `storage` event).
4. **"Restaurar demo" no meio do uso** volta exatamente ao estado inicial e os listeners recebem os dados novos. → teste em Task 1.
5. **Link direto da página pública** (`acompanhar.html?c=<código>`) aberto numa aba nova, antes de abrir o app, mostra o envio de exemplo. → seed em Task 2 + verificação no navegador Task 3.

---

### Task 1: Firebase falso (`firebase-demo.js`)

**Files:**
- Create: `public/demo/central-brindes/js/firebase-demo.js`
- Create: `src/demo/firebaseDemo.test.ts`, `src/demo/carregarShim.ts` (helper de teste)
- Modify: `eslint.config.mjs` (ignorar `public/demo/**`)

**Interfaces:**
- Produces (script clássico, sem módulos; define globais):
  - `window.firebase` com: `initializeApp(config, nome?)`, `apps: {name}[]`, `auth()`, `firestore()` (+ `firestore.FieldValue.{arrayUnion, arrayRemove, delete, serverTimestamp, increment}`), `messaging()` (`getToken` → `""`, `onMessage` → no-op).
  - `auth()`: `{ currentUser: { uid: "visitante", email: "visitante@demo.local", getIdToken: async () => "demo" }, languageCode, onAuthStateChanged(cb) → unsubscribe (chama cb com currentUser em microtask), signInWithEmailAndPassword, createUserWithEmailAndPassword(email) → { user: { uid } }, sendPasswordResetEmail, setPersistence, signOut }` — `signOut` resolve e **não** desloga (mantém Visitante).
  - Firestore: `collection(path)`, `doc(path)`; refs com `.id`, `.path`, `.collection(sub)`, `.doc(id?)` (sem id → id aleatório), `get()`, `set(data, {merge?})`, `update(data)` (aceita `"a.b"` com ponto), `delete()`, `add(data)`, `onSnapshot(next, err?)` → unsubscribe; query: `where(campo, op, valor)` com ops `== != > >= < <= array-contains in array-contains-any`, `orderBy(campo, "asc"|"desc")`, `limit(n)`; `batch()` (`set/update/delete/commit`), `runTransaction(fn)` (tx com `get/set/update/delete`), `enablePersistence()` resolve.
  - Snapshots: query → `{ docs: DocSnap[], size, empty, forEach, metadata: { fromCache: false, hasPendingWrites: false } }`; `DocSnap = { id, exists, ref, data() }` (`data()` devolve cópia profunda, `undefined` se não existe).
  - `window.demoStore = { reset(): void, exportar(): object }`; `reset()` recarrega `window.criarSeedDemo()` (Task 2) — se não existir, começa vazio.
  - Antes de qualquer outro script: `window.FIREBASE_CONFIG = { apiKey: "demo" }` e `window.FIREBASE_VAPID_KEY = ""`; e embrulha `window.fetch`: URL que contém `/api/` → `Response` JSON `{ ok: true }`.
- Notificação de mudanças: síncrona após cada escrita (listeners recebem snapshot novo); evento `storage` de outra aba recarrega e notifica.

- [ ] **Step 1: Testes que falham** (`carregarShim()` lê o arquivo com `fs` e roda com `window.eval`, limpando `localStorage` e `window.firebase` antes)
```ts
test("semente na primeira carga", ...)              // window.criarSeedDemo = () => ({ itens: { a: { nome: "Caneta" } } }); carregar; (await db.collection("itens").get()).size === 1
test("add, get, update com ponto, delete", ...)      // update({ "x.y": 2 }) → data().x.y === 2
test("set com merge mantém campos", ...)
test("where/orderBy/limit", ...)                    // where("n", ">", 1).orderBy("n","desc").limit(1) → só o maior
test("array-contains e arrayUnion/arrayRemove", ...)
test("subcoleção pedidos/{id}/respostas", ...)
test("onSnapshot dispara na hora e a cada escrita; unsubscribe para", ...)
test("batch aplica tudo no commit", ...)
test("runTransaction lê e escreve", ...)
test("persiste no localStorage e sobrevive a recarregar o shim", ...)
test("funciona sem localStorage (setItem lança)", ...) // vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw new Error("quota")})
test("evento storage de outra aba atualiza listeners", ...)
test("demoStore.reset volta à semente e notifica listeners", ...)
test("auth: onAuthStateChanged entrega o Visitante; signOut não desloga", ...)
test("fetch para /api/ responde ok sem rede", ...)   // (await fetch("/api/notify",{method:"POST"})).json() → { ok: true }
```
- [ ] **Step 2:** `npm test` → FAIL (arquivo não existe).
- [ ] **Step 3:** Implementar. Antes, conferir com `grep` no original se usa algum método/operador fora da lista acima e incluir.
- [ ] **Step 4:** `npm test` → PASS; `npx eslint src` limpo. Commit `feat(demo): Firebase falso em localStorage`.

### Task 2: Cópia do app, dados fictícios e remoção da marca

**Files:**
- Create (copiar do original): `index.html`, `acompanhar.html`, `404.html`, `css/styles.css`, `js/app/01..14-*.js`, `js/acompanhar.js`, `manifest.webmanifest`, `robots.txt` → em `public/demo/central-brindes/`.
- **Não copiar:** `firestore.rules`, `build.sh`, `wrangler.jsonc`, `_redirects`, `_headers`, `preparar-publicacao.bat`, `src/`, `sw.js`, `js/firebase-config.js`, `data/`, `assets/brindes/`, `assets/logo-*`, `assets/simbolo-*`, `*.md`.
- Create: `js/demo-seed.js`, `js/demo-ui.js`, `assets/logo.svg`, `assets/simbolo.svg`, ícones genéricos (`assets/icon-*.png` substituídos por versões neutras)
- Test: `src/demo/demoArquivos.test.ts`

**Interfaces:**
- Consumes: `window.firebase`, `window.demoStore` (Task 1).
- Produces: `window.criarSeedDemo(): Record<colecao, Record<id, dados>>` — chaves de coleção iguais ao original (`itens, movimentos, envios, representantes, pedidos, perfis, conversas, kits, usuarios, config, acompanhamento`, subcoleções como `"pedidos/<id>/respostas"`); datas = `Date.now() - n*dia`. Inclui `config/setup` (existe) e `config/remetente`.
- Produces: `js/demo-ui.js` — injeta faixa fixa "Demonstração com dados fictícios · tudo fica só no seu navegador" com botões **Restaurar demo** (`demoStore.reset()` + `location.reload()`) e **Voltar ao portfólio** (`../../`).

- [ ] **Step 1: Teste que falha** (`demoArquivos.test.ts`, varre recursivamente `public/demo/central-brindes`)
```ts
test("sem marca, chaves ou endereços da empresa", ...)  // conteúdo E nomes de arquivo; regex da Global Constraints → lista vazia
test("sem caminhos absolutos que quebram no subcaminho", ...) // nos .html/.js: nenhum src="/ href="/ fetch("/ exceto "/api/" (interceptado) → lista vazia
test("sem service worker registrado", ...)          // nenhum "serviceWorker.register"
test("ordem dos scripts", ...)                      // index.html: firebase-demo.js e demo-seed.js antes de js/app/01-base.js; nenhum gstatic
test("semente coerente", ...)                       // eval demo-seed.js: perfis.visitante.admin === true; ≥20 itens; ≥6 representantes; envios com os 4 status; ≥1 item abaixo do mínimo; nenhum e-mail fora de @demo.local / @exemplo.com
```
- [ ] **Step 2:** `npm test` → FAIL (pasta não existe).
- [ ] **Step 3:** Copiar os arquivos listados. Em `index.html` e `acompanhar.html`: trocar as 4 tags do CDN + `firebase-config.js` por `js/firebase-demo.js`, `js/demo-seed.js` (e `js/demo-ui.js` no fim do body). Tornar relativos os caminhos absolutos. Página pública: ler o código de `?c=` (em vez de `/r/<código>`) e qualquer link gerado pelo app para a página pública passa a ser `acompanhar.html?c=<código>`. Remover registro do service worker.
- [ ] **Step 4:** Marca: trocar referências a `logo-anjo-cor.png`/`logo-anjo-branca-cor.png`/`simbolo-anjo-cor.png` por `assets/logo.svg`/`assets/simbolo.svg` (wordmark "Central Brindes" e um "C" simples, nas cores do próprio CSS); remover/neutralizar o bloco "REGRA DA MARCA" no fim do CSS; trocar todo texto "Anjo"/"Anjo Tintas" por nomes genéricos ("Central Brindes", "a empresa"); fotos de brindes: onde o app monta `assets/brindes/<código>.jpg`, usar o fallback sem foto que o app já tem (se não houver, um ícone por categoria).
- [ ] **Step 5:** Escrever `demo-seed.js` com dados fictícios (nomes de representantes claramente inventados, telefones `(48) 90000-00xx`, e-mails `@exemplo.com`), incluindo um envio entregue com código de acompanhamento conhecido para o link de exemplo.
- [ ] **Step 6:** `npm test` → PASS. Commit `feat(demo): cópia do Central Brindes sem marca e com dados fictícios`.

### Task 3: Link no portfólio e verificação no navegador

**Files:**
- Modify: `src/content/projetos.ts` (`demoUrl: "/demo/central-brindes/index.html"`), `src/content/content.test.ts`, `src/app/page.test.tsx`, `src/app/projetos/central-brindes/page.tsx` (nota "A demo usa dados fictícios e roda inteira no seu navegador.")

- [ ] **Step 1: Testes que falham:** `content.test.ts` → `expect(projetoDestaque().demoUrl).toBe("/demo/central-brindes/index.html")`; `page.test.tsx` → link `/ver demo/i` com esse href e **nenhum** "Demo em breve"; teste no caso → texto "dados fictícios e roda inteira no seu navegador".
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** Implementar. **Step 4:** `npm test` → PASS; `npm run build` ok.
- [ ] **Step 5: Navegador** (`next start`): abrir `/demo/central-brindes/index.html` com localStorage limpo → sem erros no console, sem requisições para gstatic/firebase; aparece a faixa; Visitante logado. Fluxo: criar envio de 2 itens → separar → estoque cai → cancelar → estoque volta; nova tarefa aparece; Consultas SQL rodam `select count(*) from itens`; **Restaurar demo** volta ao inicial; abrir `acompanhar.html?c=<código de exemplo>` em aba nova. Conferir que nenhuma tela mostra logo ou nome da empresa.
- [ ] **Step 6:** Commit `feat: link da demo do Central Brindes no portfólio`.
