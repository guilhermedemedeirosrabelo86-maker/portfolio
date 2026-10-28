# Quarto 3D: luz, olhar em volta, cama e guarda-roupa — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o quarto (paredes novas e teto), deixar a pessoa girar a visão parada no meio, começar apagado com interruptor, LED no teto com controle na cama, cama com o escudo cartoon do Criciúma e guarda-roupa com as skills.

**Architecture:** O que já existe continua em `js/quarto.js`, com as mudanças de câmera, luz e interação. A metade nova do quarto (paredes de trás e da direita, cama, guarda-roupa, LED, interruptor, escudo, dados das skills) vai para um módulo novo, `js/quarto-fundo.js`, que recebe as ferramentas de montagem (`THREE`, `caixa`, `mat`, `textura`…) e devolve as peças que o `quarto.js` anima.

**Tech Stack:** HTML, CSS e JS puros. Three.js 0.160 pela CDN (importmap). Sem build.

**Spec:** `docs/superpowers/specs/2026-10-28-quarto-3d-luz-cama-guarda-roupa-design.md`

## Global Constraints

- Sem npm e sem build. Os módulos ES são carregados direto pelo navegador.
- Comentários em português, no estilo do `quarto.js` (cabeçalhos `// ===== X =====` e explicação do porquê).
- Desenho sob demanda: toda mudança visual chama `pedirQuadro()`. Nada de laço contínuo.
- Não adicionar nem remover luzes depois da montagem. Acender e apagar = mudar `intensity`.
- Uma única luz com sombra (a `lua`). Sombra recalculada só quando algo se mexe (`quadrosDeSombra`).
- `prefers-reduced-motion`: portas abrem sem animação, a luz troca na hora e a câmera pula direto.
- Textos humildes, sem autoelogio. Os textos das skills são exatamente os da seção `#skills` do `index.html`.
- Cache: as versões `?v=3` no `quarto/index.html` passam para `?v=4`, e o import do módulo novo usa `./quarto-fundo.js?v=4`.

## Review Focus

1. Arrastar para girar e soltar em cima de um objeto **não pode** contar como clique (o objeto não pode abrir).
2. As setas do teclado não giram a visão enquanto se digita no campo de busca do monitor ou enquanto um objeto está em foco.
3. Clicar em "Central Brindes" no guarda-roupa com o monitor **desligado** precisa ligar o monitor e abrir a página do projeto. O botão voltar do navegador precisa funcionar a partir dali.
4. Com o quarto apagado, os móveis ainda precisam ser reconhecíveis (não pode ficar preto).
5. Redimensionar a janela com a câmera no monitor continua encaixando o navegador (o campo de visão de perto é fixo, não o atual da câmera).

## Como verificar (não há testes automatizados no projeto)

- Sintaxe: `node --check js/quarto.js && node --check js/quarto-fundo.js` sem saída.
- No navegador: `python -m http.server 8123` na raiz e abrir `http://localhost:8123/quarto/`. Conferir com prints e com o console sem erros (Chrome).

---

### Task 1: Quarto fechado e olhar em volta

**Files:**
- Create: `js/quarto-fundo.js`
- Modify: `js/quarto.js` (seção "O quarto", câmera/vistas, mouse, desenhar, luzes da sombra)
- Modify: `css/quarto.css` (cursor de arrastar)
- Modify: `quarto/index.html` (`?v=4`)

**Interfaces:**
- Produces: `export const QUARTO = { esquerda: -4.2, direita: 4.2, frente: -3, fundo: 5.2, teto: 3.3 }` em `quarto-fundo.js`.
- Produces: `export function montarFundo(kit)` com `kit = { THREE, cena, caixa, mat, textura, materialTela, clicavel, clicaveis, COR }`, que devolve um objeto com as peças (as tasks seguintes acrescentam campos nele).
- Produces (em `quarto.js`): `const OLHO = new THREE.Vector3(0, 1.6, 1.6)`, `let giro = 0, inclinacao = -0.08`, `function vistaGeral()` que retorna `{ pos, alvo, fov: 55 }`, `const FOV_PERTO = 38`.

- [ ] **Step 1:** Em `montarFundo`, criar o chão, as 4 paredes e o teto com as medidas de `QUARTO`. Remover do `quarto.js` o chão 14×10, o `fundo` 14×6 e a `lateral` 10×6, que passam a vir de `QUARTO`. O rodapé coral fica só na parede da mesa. Acrescentar uma porta decorativa na parede da direita (z ≈ -2,0, 0,9 × 2,1).
- [ ] **Step 2:** As vistas ganham `fov`. As de perto usam `FOV_PERTO`. `calcularVistaMonitor()` passa a usar `FOV_PERTO` no lugar de `camera.fov`. Em `irPara`/`desenhar`, interpolar também o `fov` e chamar `camera.updateProjectionMatrix()` quando ele mudar.
- [ ] **Step 3:** A vista geral é calculada a partir de `OLHO`, `giro` e `inclinacao` (direção `(-sin g·cos i, sin i, -cos g·cos i)`). `voltarAoQuarto()` usa `irPara(vistaGeral())`. A posição inicial também.
- [ ] **Step 4:** Arrastar: `pointerdown`/`pointermove`/`pointerup` no canvas com `setPointerCapture`. Funciona só sem `focado` e sem `viagem`. Fica 0,005 rad por pixel. A inclinação fica limitada a [-0,7, 0,5]. O clique é ignorado se o ponteiro andou mais de 6 px desde o `pointerdown`. A classe `.arrastando` vai no `.quarto`. Setas (`keydown` na `window`): ±0,12 rad, só sem `focado` e quando o alvo do evento não é `input`/`textarea`.
- [ ] **Step 5:** Ajustar a câmera de sombra da lua para cobrir o quarto inteiro (`left:-6, right:6, top:6, bottom:-3`, `mapSize 2048`).
- [ ] **Step 6:** CSS: `.quarto:not(.focado) canvas { cursor: grab }` e `.quarto.arrastando canvas { cursor: grabbing }`. Conferir que `.quarto.mira canvas` continua `pointer` (deve vir depois).
- [ ] **Step 7: Verificar** `node --check` e, no navegador, que: a mesa inteira aparece na primeira vista; dá para girar 360° e ver as paredes vazias atrás e à direita; arrastar e soltar em cima do notebook não abre o notebook; o clique simples abre; voltar ao quarto mantém a direção; o navegador do monitor encaixa certo depois de redimensionar a janela.

### Task 2: Começa apagado e interruptor

**Files:**
- Modify: `js/quarto-fundo.js`, `js/quarto.js`, `quarto/index.html`

**Interfaces:**
- Consumes: `montarFundo`, `QUARTO`.
- Produces: o retorno de `montarFundo` ganha `interruptor` (grupo clicável, `userData.nome = "interruptor"`) e `tecla` (Mesh que gira) e `lampadaTeto` (Mesh com `MeshBasicMaterial`).
- Produces (em `quarto.js`): `let luzAcesa = false`, `function alternarLuz()`.

- [ ] **Step 1:** Em `montarFundo`: interruptor na parede da direita (`x ≈ 4,19, y 1,15, z ≈ -1,2`, grupo com `rotation.y = -π/2`, espelho 0,09 × 0,13 claro, tecla que inclina ±0,25 rad em x). Uma luminária de teto (disco no centro do teto) com material básico que fica cinza apagada e quase branca acesa. Clicável com o rótulo `"<b>Interruptor</b> · Luz"`.
- [ ] **Step 2:** Luzes no `quarto.js`: guardar a `HemisphereLight` numa constante (`ambiente`) e criar uma `PointLight` de teto sem sombra (`luzTeto`, posição no centro do teto). Os níveis são os seguintes: apagado = `ambiente 0.35`, `luzTeto 0`, `luzQuente 0`; aceso = `ambiente 1.6`, `luzTeto` ≈ 1.2, `luzQuente 2.2`. A troca é animada em ~300 ms dentro de `desenhar()` (instantânea com menos movimento).
- [ ] **Step 3:** `alternarLuz()`: inverte `luzAcesa`, gira a tecla, troca a cor da lâmpada e atualiza `aria-pressed` no atalho. Avisa na `.quarto-dica` "Luz acesa." / "Luz apagada." e limpa depois de 2,5 s, se a dica ainda for a mesma. O clique no canvas em `"interruptor"` chama `alternarLuz()`, sem `focar()`.
- [ ] **Step 4:** Dica inicial: "Está escuro. Arraste para olhar em volta: o interruptor fica na parede à sua direita." Ela some ao acender.
- [ ] **Step 5:** `index.html`: atalho `<button type="button" data-acao-quarto="luz" aria-pressed="false">Interruptor · Luz</button>`. Ligar no `quarto.js` por `[data-acao-quarto]`.
- [ ] **Step 6: Verificar** que entra escuro, mas com os móveis visíveis pelo contorno, e que a dica aparece. O clique no interruptor acende tudo, a luminária da mesa inclusive, e o segundo apaga. O atalho faz o mesmo e a câmera não se mexe.

### Task 3: Cama, tapete e escudo cartoon do Criciúma

**Files:**
- Modify: `js/quarto-fundo.js`

**Interfaces:**
- Produces: o retorno de `montarFundo` ganha `cama` (Group com `userData.nome = "cama"`, **fora** de `clicaveis`) e `TOPO_CAMA` (altura do colchão).

- [ ] **Step 1:** Cama encostada na parede do fundo, centrada em x = 0: estrado, colchão, coberta, 2 travesseiros e cabeceira estofada alta. A largura é ≈ 1,5 e o comprimento ≈ 2,0. Tapete na frente da cama.
- [ ] **Step 2:** Escudo em textura de canvas, com quadro na parede acima da cabeceira (`rotation.y = π`). Estilo cartoon: contorno preto grosso, listras verticais amarelo/preto/branco recortadas no formato do escudo, faixa com "CRICIÚMA", uma estrela em cima e um brilho branco de desenho animado. Material `mat(0xffffff, { map })`.
- [ ] **Step 3: Verificar** girando para trás que a cama e o escudo aparecem, que o escudo fica legível com a luz acesa e reconhecível no escuro.

### Task 4: Fita de LED e controle na cama

**Files:**
- Modify: `js/quarto-fundo.js`, `js/quarto.js`, `quarto/index.html`

**Interfaces:**
- Consumes: `cama`, `TOPO_CAMA`, `QUARTO`.
- Produces: o retorno de `montarFundo` ganha `led` (array de materiais básicos da fita e do brilho), `controle` (grupo clicável `"controle"`) e `botaoControle` (Mesh que mostra a cor).
- Produces: `export const CORES_LED = [["roxo", 0xb06cff], ["azul", 0x4f8cff], ["coral", 0xff7a59], ["verde-água", 0x5eead4], ["branco quente", 0xffe2c4]]`. A cor inicial é o roxo.
- Produces (em `quarto.js`): `let corLed = 0`, `function trocarCorLed()`.

- [ ] **Step 1:** A fita são 4 barras finas no encontro de cada parede com o teto, mais 4 faixas de brilho (plano com gradiente transparente, como o `halo` do quadro) logo abaixo, na parede. Tudo com material básico tingido pela cor do LED.
- [ ] **Step 2:** Controle em cima da coberta, perto do pé da cama, com um botão redondo da cor atual. Clicável com o rótulo `"<b>Controle</b> · Cor do LED"`.
- [ ] **Step 3:** `trocarCorLed()`: passa para a próxima cor, pinta os materiais da fita, o botão do controle e a `contraLuz` (que deixa de ser coral fixa). A dica mostra "LED: azul." por 2 s. O clique no canvas em `"controle"` chama a função sem `focar()`. Atalho `<button type="button" data-acao-quarto="led">Controle · LED</button>`.
- [ ] **Step 4: Verificar** que a fita aparece em volta do teto inteiro, que cada clique troca a cor (fita, brilho e tom do quarto), no claro e no escuro.

### Task 5: Guarda-roupa com as skills

**Files:**
- Modify: `js/quarto-fundo.js`, `js/quarto.js`, `quarto/index.html`, `css/quarto.css`

**Interfaces:**
- Consumes: `projetos` (ids `central-brindes`, `meu-predio`, `gr-digital`), `focar`, `ligarMonitor`, `abrirPagina`.
- Produces: `export const skills` em `quarto-fundo.js`. Cada item tem a forma `{ id, nome, onde: ["central-brindes", …] }` **ou** `{ id, nome, texto }` **ou** `{ id, nome, texto, link }`. Ordem e textos idênticos à seção `#skills`: HTML, CSS, JavaScript (Central Brindes, Meu Prédio, GR Digital); React (estudando) → texto "Estudando agora"; Python → Meu Prédio; SQL → Central Brindes; SQLite → Meu Prédio; Firebase → Central Brindes; Cloudflare Workers → Central Brindes; Git → texto "Em todos os projetos"; GitHub → texto "Código de todos no meu perfil" com link para o GitHub.
- Produces: o retorno de `montarFundo` ganha `guardaRoupa` (grupo clicável `"guarda-roupa"`) e `portas` (2 grupos-dobradiça com `userData.aberta` = ângulo de aberta). Cada camiseta é um grupo clicável `"skill-<id>"`.
- Produces (em `quarto.js`): `function destacarSkill(id)` e `function abrirProjetoNoMonitor(id)`.

- [ ] **Step 1:** Guarda-roupa em `quarto-fundo.js`: grupo em `(≈3,9, 0, ≈3,6)` com `rotation.y = -π/2`, montado de frente para o +z local. Mede 1,8 de largura, 0,6 de fundo e 2,3 de altura. Tem duas portas em dobradiças nas laterais (abertas: -1,9 e +1,9 rad) e dois cabideiros: 6 camisetas em cima e 5 embaixo. Embaixo dos cabideiros ficam prateleiras ou gavetas vazias, para usar depois.
- [ ] **Step 2:** Camiseta = plano com textura de canvas (silhueta de camiseta + nome da tecnologia + cabide), `transparent` com `alphaTest`, uma cor por skill. Rótulo `"<b>Nome</b> · onde usei"`.
- [ ] **Step 3:** No `quarto.js`: vista `"guarda-roupa"` (de frente para ele, deslocada para ele ficar à direita da tela, `fov: FOV_PERTO` ou um pouco maior, se as 11 camisetas não couberem). As portas abrem enquanto `focado === "guarda-roupa"` e fecham ao voltar, animadas como a capa do livro (`passo 0.09`, ou `1` com menos movimento), atualizando `quadrosDeSombra`.
- [ ] **Step 4:** Clique numa camiseta: se o guarda-roupa não está em foco, chamar `focar("guarda-roupa")`. Depois, `destacarSkill(id)`.
- [ ] **Step 5:** `index.html`: `<section class="painel painel-esquerda painel-skills" data-painel="guarda-roupa" aria-labelledby="painel-skills">` com o tipo "Guarda-roupa", h2 "Skills", o texto "Cada tecnologia e o projeto onde dá para ver ela funcionando." e um `<ul>` vazio que o JS preenche a partir de `skills`. Cada `<li data-skill="id">` traz o nome e, no "onde", `<button type="button" data-ver-projeto="id">Nome do projeto</button>` ou o texto, ou `<a href target="_blank" rel="noopener noreferrer">` para o GitHub. Atalho `<button type="button" data-ir="guarda-roupa">Guarda-roupa · Skills</button>`.
- [ ] **Step 6:** `destacarSkill(id)`: marca `aria-current="true"` (e a classe de destaque) só naquele `li` e faz `scrollIntoView({ block: "nearest" })`. `abrirProjetoNoMonitor(id)`: `abrirPagina({ tipo: "projeto", valor: id })`, `focar("monitor")`, `ligarMonitor()`.
- [ ] **Step 7:** CSS: o painel de skills com `max-height: 80vh; overflow-y: auto`, a lista em linhas compactas, o `li[aria-current]` com borda/realce na cor `--destaque` e os botões de projeto parecendo links.
- [ ] **Step 8: Verificar** que o clique no guarda-roupa abre as portas e o painel à esquerda, sem tapar as camisetas. O clique em "Firebase" destaca a linha certa. "Central Brindes" com o monitor desligado leva ao monitor, liga e abre a página do projeto, e o voltar do navegador funciona. O atalho de teclado abre o painel. Esc fecha as portas e volta.

### Task 6: Fechamento

**Files:**
- Modify: `README.md` (linha do `quarto/`, se precisar citar o arquivo novo), comentário do topo do `quarto.js` (lista de objetos)

- [ ] **Step 1:** Atualizar o comentário do topo do `quarto.js` (Interruptor, Controle, Guarda-roupa, olhar em volta) e o README, citando `js/quarto-fundo.js`.
- [ ] **Step 2: Verificar** o roteiro inteiro no navegador (Review Focus 1–5), o console sem erros e o aviso de tela pequena intacto.
- [ ] **Step 3:** Commit somente quando o Guilherme pedir. O trabalho anterior do quarto ainda não foi commitado.
