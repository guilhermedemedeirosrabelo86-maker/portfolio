# Demo do Central Brindes — Design

Data: 2026-10-23
Status: aprovado em 2026-10-23

## 1. Intenção e o porquê

O Central Brindes é o projeto principal do portfólio do Guilherme (ver `2026-10-23-portfolio-design.md`). Hoje o card mostra "Demo em breve". O objetivo é que um recrutador **abra e use o sistema de verdade**, em poucos minutos, e saia pensando "esse cara construiu um sistema de verdade", sem nenhum dado real e sem a marca da empresa onde o Guilherme trabalha.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Demo clicável, dentro do portfólio, em `/demo/central-brindes/`.
- Abre direto, sem login, como usuário "Visitante" com perfil de **administrador** (todas as telas visíveis).
- As funções principais **funcionam de verdade**: cadastrar/editar/arquivar brinde, entradas/saídas/contagem, criar envio, separar, marcar entregue, cancelar (estoque recalcula), kits, representantes, tarefas e conversas, busca, consultas SQL no navegador.
- Os dados ficam **só no navegador do visitante** (localStorage). Botão **"Restaurar demo"** volta ao estado inicial.
- Faixa fixa no topo: "Demonstração com dados fictícios" + "Restaurar demo" + link "Voltar ao portfólio".
- O card do portfólio troca "Demo em breve" por "Ver demo" apontando para a demo.

**Não-objetivos**
- Sincronizar a demo com versões futuras do sistema original (é uma cópia única, um retrato da versão atual).
- Notificações push reais, rotinas automáticas (8h, 11h30, 14h), backup na nuvem, troca de senha, criação real de contas.

**Anti-objetivos (fracasso mesmo funcionando)**
- **Alterar o projeto original.** O repositório `central-brindes` do Guilherme e o sistema em produção não são tocados. A demo nasce de uma cópia do código (commit `299d8f3`, v5.10), feita numa pasta temporária e copiada para o portfólio.
- **Qualquer chamada ao Firebase/Cloudflare reais** ou à infraestrutura da empresa.
- **Vazar a marca ou dados da empresa**: nenhum "Anjo" (qualquer caixa) em arquivos, nomes de arquivo, comentários, classes CSS, textos ou imagens da demo; nenhuma foto real de produto; nenhum dado real (nomes, e-mails, endereços, notas fiscais, chaves do Firebase, chave VAPID, URL do sistema em produção).
- Demo quebrada ou vazia ao abrir: tem que estar populada e navegável no primeiro carregamento.

## 3. Restrições

- A demo é **HTML/CSS/JS puro**, como o original, servida como arquivos estáticos pelo Next.js a partir de `public/demo/central-brindes/`. O build do portfólio não processa esses arquivos.
- Funciona servida num subcaminho: nenhum caminho absoluto (`/js/...`, `/r/<código>`, `/api/...`) pode quebrar.
- Sem dependências novas no portfólio.
- ESLint, TypeScript e Vitest do portfólio ignoram `public/demo/**` (o código copiado não segue as regras do portfólio).

## 4. Como funciona (decidido)

### 4.1 Firebase falso ("shim")
O original carrega o SDK compat v10 do Firebase por CDN e usa: `firebase.initializeApp`, `firebase.auth()`, `firebase.firestore()`, `firebase.messaging()`. Na demo, as tags `<script>` do CDN e `js/firebase-config.js` são **removidas** e substituídas por um arquivo local `js/firebase-demo.js` que expõe um objeto global `firebase` compatível com o que o código usa, guardando tudo em `localStorage`:

- **Firestore**: `collection(nome)`, `doc(caminho)`, subcoleções (`envios/{id}/fotos`, `pedidos/{id}/respostas`), `where`, `orderBy`, `limit`, `get`, `set` (com `{merge}`), `update`, `add`, `delete`, `onSnapshot` (dispara na hora e a cada mudança), `batch()`, `runTransaction()`, `enablePersistence()` (não faz nada), `FieldValue.arrayUnion/arrayRemove/serverTimestamp/increment/delete` e o que mais o código usar (o builder confere com `grep` no código copiado).
- **Auth**: `onAuthStateChanged` chama de volta na hora com o usuário Visitante; `signInWithEmailAndPassword`/`createUserWithEmailAndPassword`/`sendPasswordResetEmail` resolvem sem fazer nada real; `signOut` mostra que na demo não há saída e mantém o Visitante; `setPersistence` não faz nada.
- **Messaging**: `getToken`/`onMessage` não fazem nada.
- **`fetch` para `/api/*`** (notify, recebido, backups) responde `{ ok: true }` localmente, sem rede. `viacep.com.br` continua real (API pública de CEP).

### 4.2 Dados fictícios
Um arquivo `data/demo-seed.json` (substitui `dados-iniciais.json`) com, pelo menos:
- ~20 brindes genéricos em categorias variadas, com códigos fictícios, alguns abaixo do mínimo (para aparecer alerta de estoque baixo);
- movimentos de entrada/saída/contagem coerentes com o estoque;
- ~6 representantes inventados (nomes, cidades e telefones obviamente fictícios);
- ~8 envios cobrindo todos os status (pendente, separado, entregue, cancelado), com rastreio fictício;
- 2–3 kits; 3–4 tarefas/conversas com respostas;
- perfis da equipe fictícios + o perfil Visitante (admin);
- datas relativas à data de hoje (ex.: "há 3 dias"), para a demo não parecer velha.

Na primeira visita (ou ao "Restaurar demo"), o seed é carregado no localStorage.

### 4.3 Marca e imagens
- **Cores: ficam iguais ao original** (vermelho `--brand`, laranja/amarelo da chama). Decisão do Guilherme: "deixe tudo igual sem a logo apenas". Nada de re-tematizar o CSS.
- Logos da empresa substituídos por um logo genérico "Central Brindes" (SVG/PNG gerado), mantendo o layout.
- Fotos reais de `assets/brindes/` **removidas**; brindes aparecem com ilustração/ícone por categoria.
- Textos, comentários, nomes de arquivo e classes CSS sem "Anjo". O bloco "REGRA DA MARCA" do CSS sai ou é neutralizado.
- `manifest.webmanifest`, ícones e `<title>` com nome genérico.

### 4.4 Caminhos e páginas
- Todos os caminhos viram relativos ao diretório da demo.
- A página pública de acompanhamento funciona como `acompanhar.html?c=<código>` (no lugar de `/r/<código>`), lendo do mesmo localStorage, com pelo menos um envio de exemplo linkado de dentro da demo.
- Service worker (`sw.js`) **não é registrado** na demo.
- Arquivos de publicação do original (`build.sh`, `wrangler.jsonc`, `_redirects`, `_headers`, `preparar-publicacao.bat`, `src/worker.js`, `firestore.rules`, docs internas como `COMO-INSTALAR.md`, `CLAUDE.md`) **não são copiados**.

### 4.5 No portfólio
- `src/content/projetos.ts`: `demoUrl: "/demo/central-brindes/index.html"` no Central Brindes. (O Next.js não serve `index.html` sozinho para uma pasta de `public/` e tira a barra final, o que quebraria os caminhos relativos. Apontar direto para o arquivo funciona na Vercel sem mudar a configuração do portfólio.)
- O botão "Ver demo" abre em nova aba (como os outros links externos).
- Nota no estudo de caso: "A demo usa dados fictícios e roda inteira no seu navegador."

## 5. Verificação esperada
- Teste automatizado do shim (Vitest/jsdom): CRUD, `where`/`orderBy`, `onSnapshot`, `batch`, `arrayUnion`, persistência e restauração.
- Teste que varre `public/demo/central-brindes/` e falha com "anjo" (qualquer caixa), chaves do Firebase (`AIza`), `firebaseapp.com`, `workers.dev`, `gstatic.com/firebasejs`.
- Teste no navegador: abrir a demo sem erros no console; criar envio, separar, ver estoque cair; cancelar e ver voltar; Restaurar demo; abrir acompanhamento público.

## 6. Decisões minhas (Claude) — conferir
- Visitante entra como **administrador** para que o recrutador veja todas as telas, inclusive SQL.
- Dados só no navegador de cada visitante (ninguém estraga a demo de outro).
- ViaCEP continua real; o resto da rede é simulado.
- Retrato único da versão v5.10, sem sincronização.
- Link da demo aponta para `index.html` (sem mexer em `next.config.ts`).
- Funções que o documento não lista mas passam a funcionar sozinhas com o Firebase falso (importar nota fiscal XML/PDF, importar/exportar Excel, leitor de código de barras, declaração dos Correios) ficam ligadas.

## 7. Deixado para o builder
- Estrutura interna do shim, formato no localStorage, nomes exatos dos dados fictícios, estilo do logo genérico e das ilustrações de categoria, texto exato da faixa.
