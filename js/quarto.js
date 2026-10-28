// =========================================================
// Quarto 3D · Guilherme Rabelo
// Uma versão "criativa" do portfólio: um quarto em 3D (Three.js) onde cada
// objeto leva a uma parte do site.
//   Monitor  -> liga e mostra um navegador com busca pelos 3 projetos
//   Notebook -> GitHub (com código sendo digitado na tela)
//   Celular  -> WhatsApp
//   Quadro   -> sobre mim
//   Livro    -> formação
//   Guarda-roupa -> skills (um troféu por tecnologia)
//   Interruptor  -> acende a luz (o quarto começa apagado)
//   Controle     -> troca a cor da fita de LED do teto
//
// A pessoa fica parada no meio do quarto e gira a visão arrastando o mouse
// (ou com as setas). A outra metade do quarto (cama, guarda-roupa, LED...)
// é montada no quarto-fundo.js.
//
// Pensado para ser leve:
// - só desenha um quadro novo quando algo muda (não fica desenhando 60x por
//   segundo com tudo parado);
// - pixels limitados a 1,5x, sombra calculada uma vez só, materiais simples
//   (MeshLambertMaterial) e poucas luzes;
// - para de desenhar quando a aba fica oculta.
//
// A tela do monitor é uma página HTML de verdade, encaixada por cima da
// tela 3D quando a câmera para de frente para ela: o texto fica nítido,
// dá para clicar e usar o teclado.
// =========================================================

import { QUARTO, CORES_LED, skills, montarFundo } from "./quarto-fundo.js?v=16";
import { montarDecoracao } from "./quarto-decoracao.js?v=16";

const pagina = document.querySelector(".quarto");
const canvas = pagina.querySelector("canvas");
const carregando = pagina.querySelector(".quarto-carregando");
const etiqueta = pagina.querySelector(".etiqueta");
const dica = pagina.querySelector(".quarto-dica");
const navegador = pagina.querySelector(".navegador");

// "Menos movimento": a câmera pula direto, sem viagem, e nada fica balançando.
const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Versão leve (celular): o mesmo quarto, mas sem sombras e com menos pixels,
// os cards sobem de baixo e o navegador do monitor ocupa a tela inteira.
const versaoLeve = window.matchMedia("(max-width: 899px), (max-height: 500px)").matches;
// Tela de toque (celular, tablet): o dedo gira mais que o mouse
const toque = window.matchMedia("(pointer: coarse)").matches;

// ---------- Ajudantes de conta ----------
const limitar = (n) => Math.min(Math.max(n, 0), 1);
// Curva "devagar, rápido, devagar" para a câmera
const suavizar = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Escapa texto digitado pela pessoa antes de colocar no HTML
function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// ---------- Dados dos projetos (os mesmos textos do site) ----------
const projetos = [
  {
    id: "central-brindes",
    nome: "Central Brindes",
    tipo: "Sistema web, usado na empresa",
    resumo: "Sistema web de estoque e envios de brindes, feito para a equipe de Marketing da empresa onde trabalho.",
    legenda: "Estoque e envios de brindes para a equipe de Marketing.",
    tags: ["HTML", "CSS", "JavaScript", "Firebase", "Cloudflare Workers", "SQL"],
    imagens: [["../img/central-brindes-painel-960.webp", "Tela inicial do Central Brindes (demonstração com dados fictícios)"]],
    detalhes: [
      ["Problema", "O estoque de brindes era controlado no olho, e o sistema geral da empresa vivia com dados errados e desatualizados."],
      ["Solução", "Um sistema web de estoque e de envios pelo Correio para os representantes."],
      ["Resultado", "A equipe de Marketing usa o sistema no dia a dia."],
    ],
    links: [
      ["Ver estudo de caso", "../projetos/central-brindes/index.html"],
      ["Abrir a demo", "../demo/central-brindes/index.html"],
    ],
  },
  {
    id: "meu-predio",
    nome: "Meu Prédio",
    tipo: "App para condomínios, em desenvolvimento",
    resumo: "App para condomínios pequenos, geridos por um síndico morador. Funciona como um aplicativo instalado no celular.",
    legenda: "Síndico, morador e portaria num app só, com visitas por QR Code.",
    tags: ["Python", "SQLite", "JavaScript", "HTML", "CSS", "PWA"],
    imagens: [
      ["../img/meu-predio-inicio-960.webp", "Tela inicial do síndico, com saldo do condomínio, taxas pagas e o que precisa de atenção"],
      ["../img/meu-predio-contas-960.webp", "Prestação de contas com saldo, lançamentos e para onde foi o dinheiro"],
      ["../img/meu-predio-reservas-960.webp", "Reservas para aprovar e calendário do salão de festas"],
      ["../img/meu-predio-avisos-960.webp", "Mural de avisos com aviso fixado e contagem de quem leu"],
      ["../img/meu-predio-ocorrencia-960.webp", "Ocorrência resolvida com a conversa entre síndico e morador"],
      ["../img/meu-predio-portaria-960.webp", "Tela da portaria para validar o QR Code e ver os visitantes esperados"],
    ],
    detalhes: [
      ["Três perfis", "Síndico, morador e portaria, cada um vendo e fazendo só o que pode."],
      ["Visitas por QR Code", "O morador libera a visita e a portaria lê o QR com a câmera do celular."],
      ["Reservas", "Salão e churrasqueira num calendário, com regras e limite por unidade."],
      ["Prestação de contas", "Entradas, saídas, gráfico por categoria e quem pagou a taxa do mês."],
      ["Avisos e ocorrências", 'Mural com "lido por X de Y" e ocorrências com fotos e conversa.'],
      ["Back-end em Python", "Sem bibliotecas externas, com banco SQLite e testes automatizados da API."],
    ],
    links: [["Ver código", "https://github.com/guilhermedemedeirosrabelo86-maker/meu-predio"]],
  },
  {
    id: "gr-digital",
    nome: "GR Digital",
    tipo: "Site do meu negócio",
    resumo: "Site do meu negócio de criação de sites para pequenas empresas, com montador de orçamento e demos de clínica, barbearia e agenda online.",
    legenda: "Sites para pequenas empresas, com montador de orçamento.",
    tags: ["HTML", "CSS", "JavaScript"],
    imagens: [["../img/gr-digital-inicio-960.webp", "Página inicial do site da GR Digital"]],
    detalhes: [],
    links: [["Abrir o site", "https://sitesgrdigital.com.br"]],
  },
];

// ---------- Mensagens de "carregando" e de erro ----------
function mostrarAviso(texto, comBotao) {
  carregando.querySelector("p").textContent = texto;
  carregando.querySelector("a").hidden = !comBotao;
}

function esconderCarregando() {
  carregando.classList.add("pronto");
}

// ---------- Começo ----------
async function iniciarQuarto() {
  if (!("WebGLRenderingContext" in window)) {
    mostrarAviso("Seu navegador não mostra 3D. O site normal tem tudo o que está aqui.", true);
    return;
  }

  let THREE, RoundedBoxGeometry;
  try {
    // import() dinâmico: "three" e "three/addons/" vêm do importmap do <head>
    THREE = await import("three");
    ({ RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js"));
  } catch (erro) {
    mostrarAviso("Não deu para carregar o 3D agora. O site normal tem tudo o que está aqui.", true);
    return;
  }

  try {
    montarQuarto(THREE, RoundedBoxGeometry);
  } catch (erro) {
    console.error(erro);
    mostrarAviso("Não deu para montar o 3D neste navegador. O site normal tem tudo o que está aqui.", true);
  }
}

function montarQuarto(THREE, RoundedBoxGeometry) {
  // ===== Renderizadores =====
  const renderizador = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, versaoLeve ? 1.25 : 1.5));
  // No celular, sem sombras: é o que mais pesa para a placa de vídeo dele
  renderizador.shadowMap.enabled = !versaoLeve;
  // PCF com "radius" dá borda suave e é mais barata que a PCFSoft
  renderizador.shadowMap.type = THREE.PCFShadowMap;
  // A sombra só é recalculada quando algo se mexe (o livro), não todo quadro
  renderizador.shadowMap.autoUpdate = false;

  const cena = new THREE.Scene();
  cena.background = new THREE.Color(0x0b1220);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.03, 40);

  // ===== Materiais e peças =====
  const COR = { coral: 0xff7a59, parede: 0x1f2c4a, chao: 0x1d2944, madeira: 0x2e3b5e, escuro: 0x111a2c, claro: 0xeef2fb, folha: 0x4fbf8b };

  // MeshLambertMaterial é mais barato que o "Standard" e combina com o visual fosco
  const mat = (cor, extra = {}) => new THREE.MeshLambertMaterial({ color: cor, ...extra });

  // Caixa de cantos arredondados que faz e recebe sombra
  function caixa(largura, altura, fundo, cor, raio = 0.02) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(largura, altura, fundo, 2, raio), mat(cor));
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // Cria uma imagem num <canvas> para usar de textura (telas, pôster, capa...)
  function textura(largura, altura, desenhar) {
    const c = document.createElement("canvas");
    c.width = largura;
    c.height = altura;
    const ctx = c.getContext("2d");
    if (desenhar) desenhar(ctx, largura, altura);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { t, ctx, c };
  }

  // Tela que brilha sozinha (não recebe luz), com as cores reais da imagem
  const materialTela = (t) => new THREE.MeshBasicMaterial({ map: t, toneMapped: false });

  // ----- Objetos clicáveis -----
  // Cada grupo ganha um nome ("monitor", "notebook"...). Guardamos os materiais
  // dele para acender de leve quando o mouse passa por cima.
  const clicaveis = [];
  function clicavel(grupo, nome, rotulo) {
    grupo.userData.nome = nome;
    grupo.userData.rotulo = rotulo;
    grupo.userData.materiais = [];
    grupo.traverse((o) => {
      if (o.material && o.material.emissive) grupo.userData.materiais.push(o.material);
    });
    clicaveis.push(grupo);
  }

  // ===== O quarto =====
  // Chão, paredes, teto e tudo o que fica atrás e à direita de quem olha
  // (cama, guarda-roupa, LED, interruptor) vêm do quarto-fundo.js
  const fundo = montarFundo({ THREE, cena, caixa, mat, textura, clicavel, aoCarregar: () => pedirQuadro() });
  // Enfeites (futebol, games, tecnologia, lives) ficam no quarto-decoracao.js
  const decoracao = montarDecoracao({ THREE, cena, caixa, mat, textura, materialTela, clicavel });

  // Tapete com uma listra coral
  const tapete = caixa(3.4, 0.02, 2.2, 0x24314f, 0.01);
  tapete.position.set(0.1, 0.01, -0.6);
  const listra = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.06), mat(COR.coral));
  listra.rotation.x = -Math.PI / 2;
  listra.position.set(0.1, 0.022, 0.2);
  cena.add(tapete, listra);

  // Janela na parede lateral: céu à noite, lua e prédios ao longe
  const ceu = textura(512, 512, (ctx, l, a) => {
    const g = ctx.createLinearGradient(0, 0, 0, a);
    g.addColorStop(0, "#1a2c5a");
    g.addColorStop(1, "#3a2d5c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l, a);
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.2 + ((i * 37) % 10) / 12;
      ctx.fillRect((i * 97) % l, (i * 53) % (a * 0.75), 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffe9d6";
    ctx.beginPath();
    ctx.arc(l * 0.7, a * 0.28, 34, 0, Math.PI * 2);
    ctx.fill();
    for (let x = 0; x < l; x += 48) {
      const h = 60 + ((x * 7) % 120);
      ctx.fillStyle = "#0e1730";
      ctx.fillRect(x, a - h, 40, h);
      ctx.fillStyle = "#ffb547";
      if (x % 96 === 0) ctx.fillRect(x + 10, a - h + 20, 5, 6);
    }
  });
  const janela = new THREE.Group();
  const batente = caixa(1.75, 1.75, 0.06, COR.escuro);
  batente.position.z = -0.035;
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), materialTela(ceu.t));
  janela.add(batente, vidro, caixa(0.05, 1.6, 0.04, COR.escuro, 0.01), caixa(1.6, 0.05, 0.04, COR.escuro, 0.01));
  janela.rotation.y = Math.PI / 2;
  janela.position.set(-4.17, 2.0, -0.6);
  cena.add(janela);

  // ===== Mesa =====
  const mesa = new THREE.Group();
  mesa.position.set(0, 0, -2.25);
  cena.add(mesa);
  const tampo = caixa(2.8, 0.07, 1.0, COR.madeira, 0.03);
  tampo.position.y = 0.76;
  mesa.add(tampo);
  for (const x of [-1.32, 1.32]) {
    const pe = caixa(0.07, 0.74, 0.9, 0x1b2742);
    pe.position.set(x, 0.37, 0);
    mesa.add(pe);
  }
  const TOPO = 0.795; // altura da superfície da mesa

  // ===== Monitor (Projetos) =====
  const LARGURA_TELA = 1.15;
  const ALTURA_TELA = 0.66;
  const monitor = new THREE.Group();
  monitor.position.set(0, TOPO, -0.25);
  mesa.add(monitor);
  const moldura = caixa(LARGURA_TELA + 0.07, ALTURA_TELA + 0.07, 0.05, COR.escuro);
  moldura.position.y = 0.62;
  const queixo = caixa(LARGURA_TELA + 0.07, 0.06, 0.05, COR.escuro);
  queixo.position.y = 0.62 - ALTURA_TELA / 2 - 0.06;
  const haste = caixa(0.06, 0.32, 0.05, COR.escuro, 0.015);
  haste.position.set(0, 0.16, -0.04);
  const pezinho = caixa(0.38, 0.02, 0.22, COR.escuro, 0.01);
  pezinho.position.set(0, 0.01, -0.02);

  // A imagem da tela (desligada, ligando ou mostrando a busca) é desenhada num canvas
  const telaMonitor = textura(1024, 588);
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(LARGURA_TELA, ALTURA_TELA), materialTela(telaMonitor.t));
  tela.position.set(0, 0.62, 0.026);

  // Botão de ligar: bolinha no "queixo" do monitor que pisca enquanto está desligado
  const botaoLigar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.01, 16),
    new THREE.MeshBasicMaterial({ color: COR.coral }),
  );
  botaoLigar.rotation.x = Math.PI / 2;
  botaoLigar.position.set(LARGURA_TELA / 2 - 0.05, queixo.position.y, 0.027);
  botaoLigar.userData.nome = "ligar";
  botaoLigar.userData.rotulo = "<b>Ligar</b> o monitor";

  monitor.add(moldura, queixo, haste, pezinho, tela, botaoLigar);
  clicavel(monitor, "monitor", "<b>Monitor</b> · Projetos");
  clicaveis.push(botaoLigar);

  // A página HTML do navegador (no index.html) fica com 1024 px de largura,
  // na proporção da tela. encaixarNavegador() a coloca bem em cima da tela 3D.
  // (No celular, a página de 1024 px ficaria minúscula: lá ela ocupa a tela
  // inteira, com a classe "cheio", e não é encaixada no monitor.)
  const LARGURA_PX = 1024;
  navegador.hidden = false;
  if (versaoLeve) {
    navegador.classList.add("cheio");
  } else {
    navegador.style.width = `${LARGURA_PX}px`;
    navegador.style.height = `${Math.round((LARGURA_PX * ALTURA_TELA) / LARGURA_TELA)}px`;
  }

  // Projeta dois cantos da tela 3D para pixels da página e estica a página
  // HTML até eles. Funciona porque a câmera para bem de frente para o monitor.
  const cantoA = new THREE.Vector3();
  const cantoB = new THREE.Vector3();
  function encaixarNavegador() {
    if (versaoLeve) return;
    cantoA.set(-LARGURA_TELA / 2, ALTURA_TELA / 2, 0);
    cantoB.set(LARGURA_TELA / 2, -ALTURA_TELA / 2, 0);
    tela.localToWorld(cantoA).project(camera); // vira coordenada de -1 a 1
    tela.localToWorld(cantoB).project(camera);
    const largura = pagina.clientWidth;
    const altura = pagina.clientHeight;
    const x = ((cantoA.x + 1) / 2) * largura;
    const y = ((1 - cantoA.y) / 2) * altura;
    const escala = (((cantoB.x - cantoA.x) / 2) * largura) / LARGURA_PX;
    navegador.style.transform = `translate(${x}px, ${y}px) scale(${escala})`;
  }

  // Teclado e mouse
  const teclado = caixa(0.62, 0.02, 0.2, 0x1f2b48, 0.01);
  teclado.position.set(0, TOPO + 0.01, 0.18);
  const mouse = caixa(0.07, 0.025, 0.11, 0x1f2b48, 0.02);
  mouse.position.set(0.45, TOPO + 0.012, 0.2);
  mesa.add(teclado, mouse);

  // ===== Notebook (GitHub) =====
  const notebook = new THREE.Group();
  notebook.position.set(-0.92, TOPO, 0.02);
  notebook.rotation.y = 0.5;
  mesa.add(notebook);
  const baseNote = caixa(0.6, 0.022, 0.42, 0x45557a, 0.01);
  baseNote.position.y = 0.011;
  // A tampa gira na dobradiça (beirada de trás da base)
  const dobradica = new THREE.Group();
  dobradica.position.set(0, 0.022, -0.2);
  dobradica.rotation.x = -0.3;
  const tampa = caixa(0.6, 0.4, 0.015, 0x45557a, 0.01);
  tampa.position.y = 0.2;
  const codigo = textura(512, 330);
  const telaNote = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.355), materialTela(codigo.t));
  telaNote.position.set(0, 0.2, 0.0085);
  dobradica.add(tampa, telaNote);
  notebook.add(baseNote, dobradica);
  clicavel(notebook, "notebook", "<b>Notebook</b> · GitHub");

  // Código que vai sendo "digitado" na tela do notebook
  const linhasCodigo = [
    ["$ ", "#5eead4", "git status"],
    ["", "#8a95ae", "On branch main"],
    ["$ ", "#5eead4", 'git commit -m "feat: novo projeto"'],
    ["$ ", "#5eead4", "git push origin main"],
    ["", "#8a95ae", "To github.com/guilhermedemedeirosrabelo86-maker"],
    ["", "#ff7a59", "function iniciarProjeto() {"],
    ["", "#eef2fb", "  const ideia = 'resolver um problema';"],
    ["", "#eef2fb", "  return construir(ideia);"],
    ["", "#ff7a59", "}"],
  ];
  const totalLetras = linhasCodigo.reduce((soma, linha) => soma + linha[2].length, 0);
  let letras = 0;
  function desenharCodigo() {
    const { ctx, c } = codigo;
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#1b2742";
    ctx.fillRect(0, 0, c.width, 26);
    ctx.fillStyle = "#eef2fb";
    ctx.font = "600 13px monospace";
    ctx.fillText("terminal — portfolio", 12, 18);
    ctx.font = "15px monospace";
    let resto = letras;
    linhasCodigo.forEach(([prefixo, cor, texto], i) => {
      if (resto <= 0) return;
      const y = 54 + i * 30;
      ctx.fillStyle = "#ff7a59";
      ctx.fillText(prefixo, 14, y);
      ctx.fillStyle = cor;
      ctx.fillText(texto.slice(0, resto), 14 + ctx.measureText(prefixo).width, y);
      resto -= texto.length;
    });
    // Depois de tudo digitado, espera um pouco e recomeça
    letras = letras > totalLetras + 40 ? 0 : letras + 3;
    codigo.t.needsUpdate = true;
  }

  // ===== Cabo HDMI: do notebook até a parte de trás do monitor =====
  // Um tubo que segue uma curva suave (CatmullRomCurve3) passando pelos pontos
  // abaixo (coordenadas da mesa): sai da lateral do notebook, deita na mesa,
  // vai para trás e sobe até a entrada atrás da tela.
  const caminhoCabo = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.73, TOPO + 0.012, -0.29), // ponta no notebook
    new THREE.Vector3(-0.66, TOPO + 0.006, -0.42),
    new THREE.Vector3(-0.48, TOPO + 0.006, -0.56),
    new THREE.Vector3(-0.3, TOPO + 0.05, -0.5),
    new THREE.Vector3(-0.28, TOPO + 0.25, -0.38),
    new THREE.Vector3(-0.28, TOPO + 0.4, -0.3), // ponta atrás do monitor
  ]);
  const cabo = new THREE.Mesh(new THREE.TubeGeometry(caminhoCabo, 48, 0.008, 6, false), mat(0x0a0f1a));
  cabo.castShadow = true;
  mesa.add(cabo);
  // Os dois plugues: caixinhas nas pontas do cabo
  [caminhoCabo.points[0], caminhoCabo.points[caminhoCabo.points.length - 1]].forEach((ponto) => {
    const plugue = caixa(0.03, 0.018, 0.03, 0x1b2742, 0.004);
    plugue.position.copy(ponto);
    mesa.add(plugue);
  });

  // ===== Celular (WhatsApp) =====
  const celular = new THREE.Group();
  celular.position.set(0.95, TOPO, 0.05);
  celular.rotation.y = -0.35;
  mesa.add(celular);
  const suporte = caixa(0.14, 0.02, 0.12, 0x1b2742, 0.008);
  suporte.position.y = 0.01;
  const corpoCelular = new THREE.Group();
  corpoCelular.position.set(0, 0.02, -0.02);
  corpoCelular.rotation.x = -0.32;
  const aparelho = caixa(0.12, 0.24, 0.012, 0x0f1626, 0.012);
  aparelho.position.y = 0.12;
  const telaCelular = textura(256, 512, (ctx, l, a) => {
    const g = ctx.createLinearGradient(0, 0, 0, a);
    g.addColorStop(0, "#1b2742");
    g.addColorStop(1, "#0b1220");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l, a);
    ctx.fillStyle = "#eef2fb";
    ctx.font = "700 64px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("21:04", l / 2, 130);
    ctx.fillStyle = "#25d366";
    ctx.beginPath();
    ctx.roundRect(18, 200, l - 36, 120, 22);
    ctx.fill();
    ctx.fillStyle = "#06240f";
    ctx.textAlign = "left";
    ctx.font = "700 22px sans-serif";
    ctx.fillText("WhatsApp", 36, 240);
    ctx.font = "19px sans-serif";
    ctx.fillText("Olá, Guilherme! Vi seu", 36, 272);
    ctx.fillText("portfólio e gostaria...", 36, 298);
  });
  const telaCelularMalha = new THREE.Mesh(new THREE.PlaneGeometry(0.105, 0.215), materialTela(telaCelular.t));
  telaCelularMalha.position.set(0, 0.12, 0.0065);
  corpoCelular.add(aparelho, telaCelularMalha);
  celular.add(suporte, corpoCelular);
  clicavel(celular, "celular", "<b>Celular</b> · WhatsApp");

  // ===== Enfeites da mesa: caneca, planta e luminária =====
  const caneca = new THREE.Group();
  caneca.position.set(0.62, TOPO, -0.3);
  const xicara = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.054, 0.12, 20), mat(COR.coral));
  xicara.position.y = 0.06;
  xicara.castShadow = true;
  const alca = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 6, 12, Math.PI), mat(COR.coral));
  alca.rotation.z = -Math.PI / 2;
  alca.position.set(0.06, 0.06, 0);
  caneca.add(xicara, alca);

  const planta = new THREE.Group();
  planta.position.set(-1.2, TOPO, -0.3);
  const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.14, 16), mat(COR.claro));
  vaso.position.y = 0.07;
  vaso.castShadow = true;
  planta.add(vaso);
  [[0, 0.24, 0, 0.1], [-0.05, 0.2, 0.03, 0.07], [0.05, 0.22, -0.02, 0.065], [0.01, 0.33, 0, 0.06]].forEach(([x, y, z, r], i) => {
    const folha = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(i % 2 ? 0x2f9a6c : COR.folha, { flatShading: true }));
    folha.position.set(x, y, z);
    folha.castShadow = true;
    planta.add(folha);
  });

  const luminaria = new THREE.Group();
  luminaria.position.set(1.22, TOPO, -0.32);
  const baseLuminaria = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 20), mat(COR.escuro));
  baseLuminaria.position.y = 0.01;
  const braco = caixa(0.02, 0.5, 0.02, COR.escuro, 0.008);
  braco.position.y = 0.26;
  braco.rotation.z = 0.25;
  const cupula = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 20, 1, true), mat(COR.coral, { side: THREE.DoubleSide }));
  cupula.position.set(-0.08, 0.5, 0.02);
  cupula.rotation.z = 0.9;
  // A única luz "de ponto" da cena: o brilho quente da luminária
  const luzQuente = new THREE.PointLight(0xffb38a, 2.2, 3.2, 2);
  luzQuente.position.set(-0.15, 0.42, 0.1);
  luminaria.add(baseLuminaria, braco, cupula, luzQuente);
  mesa.add(caneca, planta, luminaria);

  // ===== Cadeira (de lado, para não tapar a mesa) =====
  const cadeira = new THREE.Group();
  cadeira.position.set(-1.75, 0, -1.15);
  cadeira.rotation.y = -0.9;
  const assento = caixa(0.55, 0.08, 0.52, 0x24314f, 0.04);
  assento.position.y = 0.5;
  const encosto = caixa(0.52, 0.6, 0.07, 0x24314f, 0.04);
  encosto.position.set(0, 0.85, 0.24);
  encosto.rotation.x = -0.1;
  const coluna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 10), mat(COR.escuro));
  coluna.position.y = 0.25;
  const estrela = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 5), mat(COR.escuro));
  estrela.position.y = 0.04;
  cadeira.add(assento, encosto, coluna, estrela);
  cadeira.traverse((o) => (o.castShadow = true));
  cena.add(cadeira);

  // ===== Quadro com a foto (Sobre mim) =====
  const quadro = new THREE.Group();
  quadro.position.set(-2.05, 1.95, -2.96);
  const molduraQuadro = caixa(0.9, 1.1, 0.05, COR.claro, 0.015);
  const texturaFoto = new THREE.TextureLoader().load("../img/guilherme-560.webp", pedirQuadro);
  texturaFoto.colorSpace = THREE.SRGBColorSpace;
  const foto = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.95), mat(0xffffff, { map: texturaFoto }));
  foto.position.z = 0.027;
  quadro.add(molduraQuadro, foto);
  // "Luz de galeria" em cima do quadro: um brilho desenhado (bem mais barato que uma luz de verdade)
  const brilho = textura(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,226,207,0.16)");
    g.addColorStop(1, "rgba(255,226,207,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: brilho.t, transparent: true, depthWrite: false }));
  halo.position.set(-2.05, 2.15, -2.99);
  cena.add(quadro, halo);
  clicavel(quadro, "quadro", "<b>Quadro</b> · Sobre mim");

  // ===== Prateleira e o livro (Formação) =====
  const prateleira = new THREE.Group();
  prateleira.position.set(2.1, 1.7, -2.82);
  prateleira.add(caixa(1.4, 0.04, 0.3, COR.madeira, 0.01));
  let xLivro = -0.6;
  [0x3a4a72, 0x5eead4, 0x2b3859, 0xffb547, 0x45557a].forEach((cor, i) => {
    const altura = 0.24 + ((i * 37) % 7) * 0.012;
    const espessura = 0.05 + (i % 2) * 0.015;
    const lombo = caixa(espessura, altura, 0.22, cor, 0.006);
    lombo.position.set(xLivro, 0.02 + altura / 2, 0);
    prateleira.add(lombo);
    xLivro += espessura + 0.008;
  });
  const cacto = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), mat(COR.folha, { flatShading: true }));
  cacto.position.set(0.6, 0.12, 0);
  prateleira.add(cacto);

  // O livro especial: coral, deitado, com "GR" na capa. A capa abre na lombada.
  const livro = new THREE.Group();
  livro.position.set(0.35, 0.02, 0.02);
  prateleira.add(livro);
  const capaImagem = textura(256, 340, (ctx, l, a) => {
    ctx.fillStyle = "#ff7a59";
    ctx.fillRect(0, 0, l, a);
    ctx.fillStyle = "#1b0c06";
    ctx.textAlign = "center";
    ctx.font = "800 70px sans-serif";
    ctx.fillText("GR", l / 2, a / 2 + 10);
    ctx.font = "600 20px sans-serif";
    ctx.fillText("minha história", l / 2, a / 2 + 50);
  });
  const paginaImagem = textura(360, 260, (ctx, l, a) => {
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(0, 0, l, a);
    ctx.fillStyle = "#1b0c06";
    ctx.font = "800 34px sans-serif";
    ctx.fillText("Formação", 24, 54);
    ctx.fillStyle = "#ff7a59";
    ctx.fillRect(24, 70, 50, 4);
    ctx.fillStyle = "#3a2a22";
    ctx.font = "600 20px sans-serif";
    ctx.fillText("Engenharia de Software", 24, 118);
    ctx.fillText("Ensino médio", 24, 188);
    ctx.font = "16px sans-serif";
    ctx.fillText("UNISATC, em andamento", 24, 142);
    ctx.fillText("Colégio Universitário, 2024", 24, 212);
  });
  const miolo = caixa(0.36, 0.06, 0.26, 0xf4efe6, 0.006);
  miolo.position.y = 0.03;
  const paginaLivro = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.245), mat(0xffffff, { map: paginaImagem.t }));
  paginaLivro.rotation.x = -Math.PI / 2;
  paginaLivro.position.y = 0.0605;
  const lombada = new THREE.Group();
  lombada.position.set(-0.185, 0.065, 0);
  const coral = mat(COR.coral);
  const capa = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.01, 0.27), [coral, coral, mat(0xffffff, { map: capaImagem.t }), coral, coral, coral]);
  capa.position.x = 0.185;
  lombada.add(capa);
  livro.add(miolo, paginaLivro, lombada);
  clicavel(livro, "livro", "<b>Livro</b> · Formação");
  cena.add(prateleira);

  // Pôster na parede (enfeite)
  const poster = textura(400, 520, (ctx) => {
    ctx.fillStyle = "#121b2e";
    ctx.fillRect(0, 0, 400, 520);
    ctx.fillStyle = "#ff7a59";
    ctx.font = "800 64px sans-serif";
    ctx.fillText("</>", 40, 120);
    ctx.fillStyle = "#eef2fb";
    ctx.font = "800 42px sans-serif";
    ctx.fillText("Feito", 40, 380);
    ctx.fillText("à mão.", 40, 430);
    ctx.fillStyle = "#8a95ae";
    ctx.font = "20px sans-serif";
    ctx.fillText("HTML · CSS · JS · Python", 40, 480);
  });
  const quadroPoster = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.78), mat(0xffffff, { map: poster.t }));
  quadroPoster.position.set(2.1, 2.5, -2.97);
  cena.add(quadroPoster);

  // ===== Luzes (poucas, de propósito) =====
  // Luz geral do ambiente: fraca com a luz apagada, forte com ela acesa
  const ambiente = new THREE.HemisphereLight(0xc4d0ff, 0x1b2742, 0.3);
  // "Luar" entrando pela janela: a única luz com sombra
  const lua = new THREE.DirectionalLight(0xaebfff, 1.3);
  lua.position.set(-6, 5, 1);
  lua.castShadow = true;
  lua.shadow.mapSize.set(2048, 2048);
  // A "câmera" da sombra precisa cobrir o quarto inteiro. Depois de mudar as
  // medidas dela, updateProjectionMatrix() é obrigatório: sem isso ela fica no
  // tamanho padrão e a sombra aparece cortada na diagonal nas paredes.
  Object.assign(lua.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 30 });
  lua.shadow.camera.updateProjectionMatrix();
  lua.target.position.set(0, 0, 1.1); // mira o meio do quarto
  cena.add(lua.target);
  lua.shadow.bias = -0.0004;
  lua.shadow.normalBias = 0.02;
  lua.shadow.radius = 4;
  // Luz de cor que vem do LED do teto (troca de cor junto com a fita)
  const contraLuz = new THREE.DirectionalLight(CORES_LED[0][1], 0.9);
  contraLuz.position.set(4, 3, -2);
  // A lâmpada do teto: sem sombra, começa com intensidade 0 (apagada).
  // Acender e apagar só muda a intensidade: ligar ou desligar luzes faz o
  // Three.js remontar os materiais, e isso dá um engasgo.
  const luzTeto = new THREE.PointLight(0xfff1e0, 0, 0, 1);
  luzTeto.position.set(0, QUARTO.teto - 0.25, 0.8);
  cena.add(ambiente, lua, contraLuz, luzTeto);
  renderizador.shadowMap.needsUpdate = true;

  // ===== Luz acesa ou apagada =====
  // Cada luz tem a intensidade "apagada" e a "acesa". desenhar() caminha de
  // uma para a outra em ~300 ms (na hora, com "menos movimento").
  const NIVEIS = [
    [ambiente, 0.3, 2.3],
    [luzTeto, 0, 9],
    [luzQuente, 0, 2.2],
  ];
  luzQuente.intensity = 0; // a luminária da mesa também começa apagada
  let luzAcesa = false;
  let nivelLuz = 0; // 0 = apagada, 1 = acesa (no meio do caminho, entre os dois)

  function alternarLuz() {
    luzAcesa = !luzAcesa;
    fundo.tecla.rotation.x = luzAcesa ? 0.25 : -0.25;
    fundo.lampadaTeto.material.color.set(luzAcesa ? 0xfff6ea : 0x3a4560);
    botaoLuz.setAttribute("aria-pressed", String(luzAcesa));
    avisar(luzAcesa ? "Luz acesa." : "Luz apagada.", 2500);
    pedirQuadro();
  }

  // ===== LED do teto =====
  let corLed = 0;
  function trocarCorLed() {
    corLed = (corLed + 1) % CORES_LED.length;
    const [nome, cor] = CORES_LED[corLed];
    fundo.led.forEach((m) => m.color.set(cor));
    fundo.botaoControle.material.color.set(cor);
    contraLuz.color.set(cor);
    avisar(`LED: ${nome}.`, 2000);
    pedirQuadro();
  }

  // Mostra um aviso na dica por um tempo (e só apaga se ainda for o mesmo)
  function avisar(texto, tempo) {
    dica.textContent = texto;
    setTimeout(() => dica.textContent === texto && (dica.textContent = ""), tempo);
  }

  const botaoLuz = pagina.querySelector('[data-acao-quarto="luz"]');
  botaoLuz.addEventListener("click", alternarLuz);
  pagina.querySelector('[data-acao-quarto="led"]').addEventListener("click", trocarCorLed);

  // ===== Tela do monitor (desligada, ligando, ligada) =====
  let monitorLigado = false;
  let ligouEm = 0;
  const DURACAO_BOOT = 1100;

  // Desenha a "página inicial da busca" (o que o monitor mostra de longe).
  // Mandar a imagem para a placa de vídeo custa caro, então só redesenha
  // enquanto o monitor está ligando (e uma última vez no fim).
  let telaPronta = false;
  function desenharTelaMonitor(agora) {
    const ligando = monitorLigado && agora - ligouEm < DURACAO_BOOT + 50;
    if (telaPronta && !ligando) return;
    telaPronta = !ligando;
    const { ctx, c } = telaMonitor;
    const L = c.width;
    const A = c.height;
    if (!monitorLigado) {
      ctx.fillStyle = "#05080f";
      ctx.fillRect(0, 0, L, A);
    } else {
      const t = (agora - ligouEm) / DURACAO_BOOT;
      ctx.fillStyle = "#0f1729";
      ctx.fillRect(0, 0, L, A);
      ctx.textAlign = "center";
      if (t < 0.6) {
        // Ligando: o selo "GR" aparece no meio
        ctx.globalAlpha = limitar(t / 0.25);
        ctx.fillStyle = "#ff7a59";
        ctx.beginPath();
        ctx.arc(L / 2, A / 2, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1b0c06";
        ctx.font = "800 60px sans-serif";
        ctx.fillText("GR", L / 2, A / 2 + 21);
      } else {
        // Página da busca, igual à do navegador em HTML
        ctx.globalAlpha = limitar((t - 0.6) / 0.4);
        desenharLogo(ctx, L / 2, A * 0.42, 92);
        ctx.fillStyle = "#1b2742";
        ctx.beginPath();
        ctx.roundRect(L / 2 - 300, A * 0.52, 600, 64, 32);
        ctx.fill();
        ctx.fillStyle = "#8a95ae";
        ctx.font = "24px sans-serif";
        ctx.fillText("projetos do Guilherme", L / 2, A * 0.52 + 40);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }
    telaMonitor.t.needsUpdate = true;
  }

  // "Guilherme" com cada letra de uma cor do site
  function desenharLogo(ctx, x, y, tamanho) {
    const cores = ["#ff7a59", "#eef2fb", "#5eead4", "#ffb547", "#ff7a59", "#eef2fb", "#5eead4", "#ffb547", "#ff7a59"];
    ctx.font = `800 ${tamanho}px sans-serif`;
    ctx.textAlign = "left";
    const palavra = "Guilherme";
    let inicio = x - ctx.measureText(palavra).width / 2;
    [...palavra].forEach((letra, i) => {
      ctx.fillStyle = cores[i];
      ctx.fillText(letra, inicio, y);
      inicio += ctx.measureText(letra).width;
    });
    ctx.textAlign = "center";
  }

  // ===== Câmera: vistas e viagem entre elas =====
  // Cada vista tem posição, alvo (para onde olha) e "fov" (abertura da
  // câmera, em graus). De perto a câmera fecha um pouco, como um zoom.
  const FOV_PERTO = 38;
  const FOV_QUARTO = 55;
  const vistas = {
    notebook: { pos: new THREE.Vector3(-0.35, 1.25, -1.35), alvo: new THREE.Vector3(-0.95, 0.92, -2.25), fov: FOV_PERTO },
    celular: { pos: new THREE.Vector3(0.6, 1.1, -1.55), alvo: new THREE.Vector3(0.95, 0.9, -2.2), fov: FOV_PERTO },
    quadro: { pos: new THREE.Vector3(-0.9, 1.9, -0.75), alvo: new THREE.Vector3(-2.05, 1.9, -2.96), fov: FOV_PERTO },
    livro: { pos: new THREE.Vector3(1.75, 2.75, -1.55), alvo: new THREE.Vector3(2.4, 1.74, -2.76), fov: FOV_PERTO },
    // De frente para o guarda-roupa, com ele à direita da tela (o painel fica à esquerda)
    "guarda-roupa": { pos: new THREE.Vector3(0.3, 1.3, 2.65), alvo: new THREE.Vector3(3.9, 1.2, 2.65), fov: 50 },
    monitor: { pos: new THREE.Vector3(), alvo: new THREE.Vector3(), fov: FOV_PERTO }, // calculada em ajustarTamanho()
  };
  // No celular o card fica embaixo: o guarda-roupa vai para o meio da tela
  if (versaoLeve) {
    vistas["guarda-roupa"].pos.set(0.9, 1.3, 3.6);
    vistas["guarda-roupa"].alvo.set(3.9, 1.25, 3.6);
  }

  // ===== Olhar em volta =====
  // A pessoa fica parada no OLHO e gira a cabeça: "giro" é para os lados e
  // "inclinacao" é para cima/baixo (os dois em radianos). Giro 0 = olhando a mesa.
  const OLHO = new THREE.Vector3(0, 1.6, 1.6);
  let giro = 0.02;
  let inclinacao = -0.1;
  // O mouse e as setas mudam o "alvo" do giro; a câmera vai até ele aos
  // poucos em desenhar(). Isso deixa o movimento macio, sem trancos.
  let giroAlvo = giro;
  let inclinacaoAlvo = inclinacao;
  function vistaGeral() {
    const direcao = new THREE.Vector3(
      -Math.sin(giro) * Math.cos(inclinacao),
      Math.sin(inclinacao),
      -Math.cos(giro) * Math.cos(inclinacao),
    );
    return { pos: OLHO.clone(), alvo: OLHO.clone().add(direcao), fov: FOV_QUARTO };
  }

  // As vistas foram pensadas para tela deitada (16:9). Numa tela em pé, o
  // mesmo "fov" mostraria uma fatia fininha do quarto. fovNaTela() abre o
  // campo de visão vertical para manter a mesma largura de antes (até 90°).
  function fovNaTela(fovBase) {
    if (camera.aspect >= 1.3) return fovBase;
    const meiaLargura = Math.tan(THREE.MathUtils.degToRad(fovBase / 2)) * (16 / 9);
    const vertical = THREE.MathUtils.radToDeg(2 * Math.atan(meiaLargura / camera.aspect));
    return Math.min(vertical, 90);
  }

  // De frente para o monitor, perto o bastante para a tela ocupar ~72% da
  // altura, mas ainda vendo a moldura e a mesa (não é tela cheia).
  function calcularVistaMonitor() {
    const centro = new THREE.Vector3();
    tela.getWorldPosition(centro);
    const tangente = Math.tan(THREE.MathUtils.degToRad(fovNaTela(FOV_PERTO) / 2));
    const pelaAltura = ALTURA_TELA / (2 * tangente * 0.72);
    const pelaLargura = LARGURA_TELA / (2 * tangente * camera.aspect * 0.86);
    // Mira um pouco abaixo do centro, para o botão de ligar aparecer embaixo da tela
    centro.y -= 0.04;
    vistas.monitor.alvo.copy(centro);
    vistas.monitor.pos.copy(centro).add(new THREE.Vector3(0, 0, Math.max(pelaAltura, pelaLargura)));
  }

  const inicio = vistaGeral();
  const posicao = inicio.pos;
  const alvo = inicio.alvo;
  let fov = inicio.fov;
  let viagem = null; // a viagem da câmera em andamento (ou null)

  function irPara(vista, aoChegar) {
    viagem = {
      de: posicao.clone(),
      deAlvo: alvo.clone(),
      deFov: fov,
      para: vista.pos.clone(),
      paraAlvo: vista.alvo.clone(),
      paraFov: vista.fov,
      inicio: performance.now(),
      duracao: menosMovimento ? 0 : 1200,
      aoChegar,
    };
    pedirQuadro();
  }

  // ===== Foco nos objetos e painéis =====
  let focado = null; // nome do objeto em foco, ou null na vista geral
  let livroAberto = false;

  function fecharPaineis() {
    pagina.querySelectorAll(".painel").forEach((p) => p.classList.remove("aberto"));
  }

  function focar(nome) {
    apagarDestaque();
    if (nome !== "guarda-roupa") mostrarSkill(null);
    if (nome === "ligar") nome = "monitor";
    focado = nome;
    livroAberto = nome === "livro";
    pagina.classList.add("focado");
    fecharPaineis();
    dica.textContent = "";

    if (nome === "monitor") {
      // Clicar no botão de ligar (ou no atalho) já liga
      irPara(vistas.monitor, () => {
        if (monitorLigado) mostrarNavegador();
        else dica.textContent = "O monitor está desligado. Clique no botão de ligar (a bolinha coral).";
      });
      return;
    }
    irPara(vistas[nome], () => {
      const painel = pagina.querySelector(`[data-painel="${nome}"]`);
      if (painel) painel.classList.add("aberto");
    });
  }

  function ligarMonitor() {
    if (monitorLigado) return;
    monitorLigado = true;
    ligouEm = performance.now();
    telaPronta = false;
    botaoLigar.material.color.set(0x5eead4); // luz verde-água: ligado
    dica.textContent = "";
    if (menosMovimento) ligouEm -= DURACAO_BOOT;
    setTimeout(() => focado === "monitor" && mostrarNavegador(), menosMovimento ? 0 : DURACAO_BOOT);
    pedirQuadro();
  }

  function voltarAoQuarto() {
    focado = null;
    livroAberto = false;
    pagina.classList.remove("focado");
    fecharPaineis();
    esconderNavegador();
    mostrarSkill(null);
    dica.textContent = "";
    // Volta para o meio, olhando para onde estava olhando antes
    irPara(vistaGeral());
  }

  // ===== Guarda-roupa: skills =====
  // O painel mostra a skill escolhida (em cima) e a lista de todas, para quem
  // usa teclado ou leitor de tela. Escolher uma (pelo troféu ou pela lista)
  // faz o troféu vir para a frente dando uma volta (animado em desenhar()).
  const listaSkills = pagina.querySelector(".skills-lista");
  const detalheSkill = pagina.querySelector(".skill-detalhe");
  const nomeProjeto = (id) => projetos.find((p) => p.id === id).nome;
  let skillAtiva = null;

  // "Onde usei": projetos viram botões (abrem no monitor), GitHub vira link
  function ondeHtml(s) {
    if (s.onde) return `<span class="chips">${s.onde.map((id) => `<button type="button" data-ver-projeto="${id}">${nomeProjeto(id)}</button>`).join("")}</span>`;
    if (s.link) return `<span class="chips"><a href="${s.link}" target="_blank" rel="noopener noreferrer">${escapar(s.texto)}</a></span>`;
    return `<span class="chips-texto">${escapar(s.texto)}</span>`;
  }

  listaSkills.innerHTML = skills
    .map(
      (s) =>
        `<li data-skill="${s.id}" style="--cor-skill: ${s.cor}"><button type="button" class="skill-nome" data-escolher-skill="${s.id}">${escapar(s.nome)}</button>${ondeHtml(s)}</li>`,
    )
    .join("");

  function mostrarSkill(id) {
    skillAtiva = id;
    listaSkills.querySelectorAll("li").forEach((li) => {
      if (li.dataset.skill === id) li.setAttribute("aria-current", "true");
      else li.removeAttribute("aria-current");
    });
    const s = skills.find((item) => item.id === id);
    detalheSkill.hidden = !s;
    if (s) {
      detalheSkill.style.setProperty("--cor-skill", s.cor);
      detalheSkill.innerHTML = `
        <p class="skill-detalhe-grupo">${escapar(s.tipo)}</p>
        <p class="skill-detalhe-nome">${escapar(s.nome)}</p>
        <p>${escapar(s.sobre)}</p>
        <div class="skill-detalhe-onde"><span>Onde usei</span>${ondeHtml(s)}</div>`;
    }
    pedirQuadro();
  }

  // Leva até o monitor, liga e já abre a página do projeto
  function abrirProjetoNoMonitor(id) {
    // Sem nada no histórico, começa pela busca: assim o "voltar" do navegador funciona
    if (historico.length === 0) abrirPagina({ tipo: "inicio" });
    abrirPagina({ tipo: "projeto", valor: id });
    focar("monitor");
    ligarMonitor();
  }

  // Cliques no painel: abrir projeto no monitor ou escolher uma skill da lista
  pagina.querySelector(".painel-skills").addEventListener("click", (evento) => {
    const projeto = evento.target.closest("[data-ver-projeto]");
    if (projeto) abrirProjetoNoMonitor(projeto.dataset.verProjeto);
    const escolha = evento.target.closest("[data-escolher-skill]");
    if (escolha) mostrarSkill(escolha.dataset.escolherSkill);
  });

  pagina.querySelector(".quarto-voltar").addEventListener("click", voltarAoQuarto);
  const SETAS = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
  window.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && focado) voltarAoQuarto();
    // Setas giram a visão (só no meio do quarto, e nunca enquanto digita)
    const seta = SETAS[evento.key];
    // (Alt + seta é o voltar/avançar do navegador: não mexe)
    const comAtalho = evento.altKey || evento.ctrlKey || evento.metaKey;
    if (seta && !comAtalho && !focado && !viagem && !evento.target.closest("input, textarea")) {
      evento.preventDefault();
      apagarDestaque(); // a etiqueta do mouse não vale mais depois de girar
      girarVisao(seta[0] * 0.08, seta[1] * 0.08);
    }
  });
  pagina.querySelectorAll("[data-ir]").forEach((botao) => {
    botao.addEventListener("click", () => {
      focar(botao.dataset.ir);
      // Pelo atalho do teclado, o monitor já liga sozinho
      if (botao.dataset.ir === "monitor") ligarMonitor();
    });
  });

  // ===== O navegador dentro do monitor =====
  const conteudo = navegador.querySelector(".navegador-pagina");
  const endereco = navegador.querySelector("[data-endereco]");
  let historico = []; // páginas visitadas: { tipo, valor }
  let posHistorico = -1;

  function mostrarNavegador() {
    if (historico.length === 0) abrirPagina({ tipo: "inicio" });
    encaixarNavegador();
    navegador.classList.add("ligado");
    pedirQuadro();
    // Foco no conteúdo, para quem usa teclado continuar de lá
    conteudo.focus({ preventScroll: true });
  }

  function esconderNavegador() {
    navegador.classList.remove("ligado");
    pedirQuadro();
  }

  // Abre uma página nova (e guarda no histórico, para o voltar/avançar)
  function abrirPagina(destino) {
    historico = historico.slice(0, posHistorico + 1);
    historico.push(destino);
    posHistorico = historico.length - 1;
    mostrarPagina(destino);
  }

  function mostrarPagina({ tipo, valor }) {
    if (tipo === "inicio") paginaInicio();
    if (tipo === "busca") paginaResultados(valor);
    if (tipo === "projeto") paginaProjeto(valor);
    conteudo.scrollTop = 0;
    navegador.querySelector('[data-acao="voltar"]').disabled = posHistorico <= 0;
    navegador.querySelector('[data-acao="avancar"]').disabled = posHistorico >= historico.length - 1;
    pedirQuadro();
  }

  const logoHtml = () =>
    `<span class="busca-logo" aria-label="Guilherme">${[..."Guilherme"].map((l, i) => `<span style="--c: ${i % 4}">${l}</span>`).join("")}</span>`;

  function formularioBusca(texto, grande) {
    return `
      <form class="busca-form ${grande ? "grande" : ""}" role="search">
        <label class="so-leitor" for="busca-campo">Pesquisar nos projetos</label>
        <svg class="icone-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input id="busca-campo" name="q" type="search" autocomplete="off" value="${escapar(texto)}" placeholder="Pesquise uma tecnologia ou um projeto">
      </form>`;
  }

  function paginaInicio() {
    endereco.textContent = "";
    conteudo.innerHTML = `
      <div class="busca-inicio">
        ${logoHtml()}
        ${formularioBusca("projetos do Guilherme", true)}
        <div class="busca-botoes">
          <button type="button" data-buscar>Pesquisar</button>
          <button type="button" data-sorte>Projeto aleatório</button>
        </div>
        <p class="busca-sugestoes">Experimente: <button type="button" data-sugestao="Python">Python</button> <button type="button" data-sugestao="Firebase">Firebase</button> <button type="button" data-sugestao="JavaScript">JavaScript</button></p>
      </div>`;
  }

  // Filtra os projetos pelo texto: nome, tipo, resumo ou tecnologias.
  // Uma busca genérica ("projetos do Guilherme") mostra todos.
  function buscar(texto) {
    const termo = texto.trim().toLowerCase();
    const achados = projetos.filter((p) =>
      [p.nome, p.tipo, p.resumo, ...p.tags].some((campo) => termo && campo.toLowerCase().includes(termo)),
    );
    return achados.length ? achados : projetos;
  }

  function paginaResultados(texto) {
    endereco.textContent = `/busca?q=${encodeURIComponent(texto)}`;
    const achados = buscar(texto);
    const exatos = achados !== projetos || projetos.some((p) => p.nome.toLowerCase().includes(texto.toLowerCase()));
    conteudo.innerHTML = `
      <div class="busca-topo">${logoHtml()}${formularioBusca(texto, false)}</div>
      <div class="busca-resultados">
        <p class="busca-contagem">${exatos ? `${achados.length} ${achados.length === 1 ? "resultado" : "resultados"}` : `Nada com "${escapar(texto)}". Veja todos os projetos:`}</p>
        <ol>
          ${achados
            .map(
              (p) => `
            <li>
              <button type="button" class="resultado" data-projeto="${p.id}">
                <img src="${p.imagens[0][0]}" alt="">
                <span>
                  <span class="resultado-site">portfolio › projetos › ${p.id}</span>
                  <span class="resultado-titulo">${p.nome} · ${p.tipo}</span>
                  <span class="resultado-texto">${p.resumo}</span>
                  <span class="resultado-tags">${p.tags.join(" · ")}</span>
                </span>
              </button>
            </li>`,
            )
            .join("")}
        </ol>
      </div>`;
  }

  function paginaProjeto(id) {
    const i = projetos.findIndex((p) => p.id === id);
    const p = projetos[i];
    const proximo = projetos[(i + 1) % projetos.length];
    endereco.textContent = `/projetos/${p.id}`;
    conteudo.innerHTML = `
      <article class="projeto-pagina">
        <header>
          <p class="projeto-tipo">${p.tipo}</p>
          <h2>${p.nome}</h2>
          <p class="projeto-resumo">${p.resumo}</p>
          <ul class="projeto-tags" aria-label="Tecnologias">${p.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
          <div class="projeto-links">
            ${p.links.map(([texto, url], n) => `<a class="botao botao-pequeno ${n === 0 ? "botao-primario" : "botao-contorno"}" href="${url}" target="_blank" rel="noopener noreferrer">${texto}</a>`).join("")}
          </div>
        </header>
        <figure class="projeto-print">
          <img src="${p.imagens[0][0]}" alt="${p.imagens[0][1]}" data-print>
          ${
            p.imagens.length > 1
              ? `<div class="projeto-miniaturas" role="group" aria-label="Outras telas">${p.imagens
                  .map(([src, alt], n) => `<button type="button" data-miniatura="${n}" ${n === 0 ? 'aria-current="true"' : ""} aria-label="${alt}"><img src="${src}" alt=""></button>`)
                  .join("")}</div>`
              : ""
          }
        </figure>
        ${p.detalhes.length ? `<ul class="projeto-detalhes">${p.detalhes.map(([t, d]) => `<li><h3>${t}</h3><p>${d}</p></li>`).join("")}</ul>` : ""}
        <footer class="projeto-rodape">
          <button type="button" data-acao-pagina="resultados">← Todos os projetos</button>
          <button type="button" data-projeto="${proximo.id}">Próximo: ${proximo.nome} →</button>
        </footer>
      </article>`;
    // Quando a imagem carregar, a camada 3D precisa ser desenhada de novo
    conteudo.querySelectorAll("img").forEach((img) => img.addEventListener("load", pedirQuadro, { once: true }));
  }

  // Um "ouvinte" só para todos os cliques dentro do navegador
  navegador.addEventListener("click", (evento) => {
    const alvoClique = evento.target.closest("button");
    if (!alvoClique) return;
    const d = alvoClique.dataset;
    const textoBusca = () => (navegador.querySelector("#busca-campo")?.value || "").trim() || "projetos do Guilherme";
    if (d.acao === "voltar" && posHistorico > 0) mostrarPagina(historico[--posHistorico]);
    else if (d.acao === "avancar" && posHistorico < historico.length - 1) mostrarPagina(historico[++posHistorico]);
    else if (d.acao === "inicio") abrirPagina({ tipo: "inicio" });
    else if (d.acao === "fechar") voltarAoQuarto();
    else if ("buscar" in d) abrirPagina({ tipo: "busca", valor: textoBusca() });
    else if ("sorte" in d) abrirPagina({ tipo: "projeto", valor: projetos[Math.floor(Math.random() * projetos.length)].id });
    else if (d.sugestao) abrirPagina({ tipo: "busca", valor: d.sugestao });
    else if (d.projeto) abrirPagina({ tipo: "projeto", valor: d.projeto });
    else if (d.acaoPagina === "resultados") abrirPagina({ tipo: "busca", valor: "projetos do Guilherme" });
    else if (d.miniatura) {
      // Troca o print grande pela miniatura clicada
      const print = navegador.querySelector("[data-print]");
      const miniatura = alvoClique.querySelector("img");
      print.src = miniatura.src;
      print.alt = alvoClique.getAttribute("aria-label");
      navegador.querySelectorAll("[data-miniatura]").forEach((b) => b.removeAttribute("aria-current"));
      alvoClique.setAttribute("aria-current", "true");
    }
  });
  navegador.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const campo = navegador.querySelector("#busca-campo");
    abrirPagina({ tipo: "busca", valor: campo.value.trim() || "projetos do Guilherme" });
  });

  // ===== Mouse: passar por cima e clicar nos objetos =====
  const raio = new THREE.Raycaster();
  const ponteiro = new THREE.Vector2();
  let sobre = null; // objeto embaixo do mouse

  function acharObjeto(x, y) {
    const r = canvas.getBoundingClientRect();
    ponteiro.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    raio.setFromCamera(ponteiro, camera);
    const acerto = raio.intersectObjects(clicaveis, true)[0];
    let o = acerto && acerto.object;
    while (o && !o.userData.nome) o = o.parent; // sobe até o grupo que tem nome
    return o || null;
  }

  function apagarDestaque() {
    if (sobre && sobre.userData.materiais) sobre.userData.materiais.forEach((m) => m.emissive.set(0x000000));
    sobre = null;
    etiqueta.classList.remove("visivel");
    pagina.classList.remove("mira");
    pedirQuadro();
  }

  // O teste do mouse roda no máximo uma vez por quadro
  let ultimoMouse = null;
  let mouseAgendado = false;
  canvas.addEventListener("pointermove", (evento) => {
    ultimoMouse = evento;
    if (mouseAgendado) return;
    mouseAgendado = true;
    requestAnimationFrame(() => {
      mouseAgendado = false;
      if (viagem || pagina.classList.contains("arrastando")) return;
      const o = acharObjeto(ultimoMouse.clientX, ultimoMouse.clientY);
      // O objeto em foco não acende; o botão de ligar só conta enquanto está desligado
      const util = o && o.userData.nome !== focado && !(o.userData.nome === "ligar" && monitorLigado) ? o : null;
      if (util !== sobre) {
        apagarDestaque();
        sobre = util;
        if (util && util.userData.materiais) {
          util.userData.materiais.forEach((m) => {
            m.emissive.set(COR.coral);
            m.emissiveIntensity = 0.12;
          });
        }
        pedirQuadro();
      }
      pagina.classList.toggle("mira", !!util);
      etiqueta.classList.toggle("visivel", !!util);
      if (util) {
        etiqueta.innerHTML = util.userData.rotulo;
        etiqueta.style.transform = `translate(${ultimoMouse.clientX}px, ${ultimoMouse.clientY}px)`;
      }
    });
  });
  canvas.addEventListener("pointerleave", apagarDestaque);

  // ===== Arrastar para olhar em volta =====
  // Segurar e mover o mouse gira a cabeça. Se o mouse andou mais de 6 px,
  // foi um arrasto e não um clique (assim soltar em cima de algo não abre nada).
  let arrasto = null; // { x, y, andou }
  function girarVisao(dx, dy) {
    giroAlvo += dx;
    inclinacaoAlvo = Math.min(Math.max(inclinacaoAlvo + dy, -0.7), 0.5);
    pedirQuadro();
  }
  canvas.addEventListener("pointerdown", (evento) => {
    if (evento.button !== 0) return;
    arrasto = { x: evento.clientX, y: evento.clientY, andou: 0 };
    if (!focado && !viagem) canvas.setPointerCapture(evento.pointerId);
  });
  canvas.addEventListener("pointermove", (evento) => {
    if (!arrasto) return;
    // Soltou o botão fora do canvas (em cima de um painel, fora da janela...):
    // o pointerup não chegou aqui, então o arrasto acabou
    if (!(evento.buttons & 1)) {
      arrasto = null;
      pagina.classList.remove("arrastando");
      return;
    }
    const dx = evento.clientX - arrasto.x;
    const dy = evento.clientY - arrasto.y;
    arrasto.x = evento.clientX;
    arrasto.y = evento.clientY;
    arrasto.andou += Math.abs(dx) + Math.abs(dy);
    if (focado || viagem || arrasto.andou <= 6) return;
    pagina.classList.add("arrastando");
    apagarDestaque();
    const sensibilidade = toque ? 0.005 : 0.0025; // o dedo anda menos pixels que o mouse
    girarVisao(dx * sensibilidade, dy * sensibilidade);
  });
  const soltar = () => {
    pagina.classList.remove("arrastando");
    // O "click" vem logo depois do pointerup: guarda se foi arrasto
    setTimeout(() => (arrasto = null), 0);
  };
  canvas.addEventListener("pointerup", soltar);
  canvas.addEventListener("pointercancel", soltar);

  canvas.addEventListener("click", (evento) => {
    if (arrasto && arrasto.andou > 6) return;
    const o = acharObjeto(evento.clientX, evento.clientY);
    if (!o) return;
    const nome = o.userData.nome;
    if (nome === "ligar") {
      if (focado !== "monitor") focar("monitor");
      ligarMonitor();
    } else if (nome === "interruptor") {
      alternarLuz(); // funciona de onde a pessoa está, sem a câmera viajar
    } else if (nome === "controle") {
      trocarCorLed();
    } else if (o.userData.aoClicar) {
      // Enfeites interativos (TV, videogame, caixa de som...): agem na hora
      const mensagem = o.userData.aoClicar();
      if (mensagem) avisar(mensagem, 2600);
      etiqueta.innerHTML = o.userData.rotulo;
      pedirQuadro();
    } else if (nome.startsWith("skill-")) {
      if (focado !== "guarda-roupa") focar("guarda-roupa");
      const id = nome.slice(6);
      mostrarSkill(skillAtiva === id ? null : id); // clicar de novo devolve ao cabide
    } else if (nome !== focado) {
      focar(nome);
    }
  });

  // ===== Tamanho =====
  function ajustarTamanho() {
    const largura = pagina.clientWidth;
    const altura = pagina.clientHeight;
    renderizador.setSize(largura, altura, false);
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();
    calcularVistaMonitor();
    // Se a câmera já estiver no monitor, acompanha a nova medida
    if (focado === "monitor" && !viagem) {
      posicao.copy(vistas.monitor.pos);
      alvo.copy(vistas.monitor.alvo);
    }
    pedirQuadro();
  }
  new ResizeObserver(ajustarTamanho).observe(pagina);

  // ===== Desenho sob demanda =====
  // pedirQuadro() agenda UM quadro. Se ainda houver movimento (viagem da
  // câmera, livro abrindo, celular vibrando, monitor ligando), o quadro
  // seguinte é agendado sozinho; senão, para.
  let agendado = false;
  let vibrarAte = 0;
  let quadrosDeSombra = 0;

  function pedirQuadro() {
    if (agendado || document.hidden) return;
    agendado = true;
    requestAnimationFrame(desenhar);
  }

  let quadroAnterior = 0;
  let subir = 0; // quanto a imagem sobe no celular (0 a 0,2 da altura)
  function desenhar(agora) {
    agendado = false;
    let mexendo = false;
    // Tempo desde o último quadro (limitado, para não dar salto depois de parado)
    const dt = Math.min(agora - quadroAnterior, 50);
    quadroAnterior = agora;

    // Olhar em volta: chega perto do alvo aos poucos (~70 ms de "atraso")
    if (!focado && !viagem && (Math.abs(giroAlvo - giro) > 0.0002 || Math.abs(inclinacaoAlvo - inclinacao) > 0.0002)) {
      const k = menosMovimento ? 1 : 1 - Math.exp(-dt / 70);
      giro += (giroAlvo - giro) * k;
      inclinacao += (inclinacaoAlvo - inclinacao) * k;
      const v = vistaGeral();
      posicao.copy(v.pos);
      alvo.copy(v.alvo);
      mexendo = true;
    }

    // Viagem da câmera
    if (viagem) {
      const t = viagem.duracao ? limitar((agora - viagem.inicio) / viagem.duracao) : 1;
      const e = suavizar(t);
      posicao.lerpVectors(viagem.de, viagem.para, e);
      alvo.lerpVectors(viagem.deAlvo, viagem.paraAlvo, e);
      fov = viagem.deFov + (viagem.paraFov - viagem.deFov) * e;
      if (t >= 1) {
        const aoChegar = viagem.aoChegar;
        viagem = null;
        if (aoChegar) aoChegar();
      } else {
        mexendo = true;
      }
    }
    camera.position.copy(posicao);
    camera.lookAt(alvo);
    const fovAgora = fovNaTela(fov);
    if (camera.fov !== fovAgora) {
      camera.fov = fovAgora;
      camera.updateProjectionMatrix();
    }

    // Celular em pé com um objeto em foco: o card cobre a parte de baixo da
    // tela, então a imagem "sobe" um pouco (setViewOffset desloca o quadro)
    const subirAlvo = versaoLeve && focado && camera.aspect < 1 ? 0.2 : 0;
    if (Math.abs(subir - subirAlvo) > 0.001) {
      subir += (subirAlvo - subir) * (menosMovimento ? 1 : 0.12);
      mexendo = true;
    } else {
      subir = subirAlvo;
    }
    if (subir > 0.001) {
      const l = pagina.clientWidth;
      const a = pagina.clientHeight;
      camera.setViewOffset(l, a, 0, a * subir, l, a);
    } else if (camera.view && camera.view.enabled) {
      camera.clearViewOffset();
    }

    // Luz acendendo ou apagando aos poucos (~300 ms)
    const nivelAlvo = luzAcesa ? 1 : 0;
    if (nivelLuz !== nivelAlvo) {
      const passo = menosMovimento ? 1 : 0.12;
      nivelLuz = nivelAlvo > nivelLuz ? Math.min(nivelLuz + passo, 1) : Math.max(nivelLuz - passo, 0);
      NIVEIS.forEach(([luz, apagada, acesa]) => (luz.intensity = apagada + (acesa - apagada) * nivelLuz));
      mexendo = true;
    }

    // Portas do guarda-roupa: abertas enquanto ele está em foco
    fundo.portas.forEach((porta) => {
      const anguloAlvo = focado === "guarda-roupa" ? porta.userData.aberta : 0;
      if (Math.abs(porta.rotation.y - anguloAlvo) > 0.002) {
        porta.rotation.y += (anguloAlvo - porta.rotation.y) * (menosMovimento ? 1 : 0.09);
        mexendo = true;
      }
    });

    // Troféus: o escolhido vem para a frente dando uma volta; os outros voltam
    fundo.trofeus.forEach((trofeu) => {
      const fora = focado === "guarda-roupa" && trofeu.userData.skill === skillAtiva;
      const lugar = fora ? trofeu.userData.vitrine : trofeu.userData.lugar;
      const passo = menosMovimento ? 1 : 0.14;
      const passoGiro = menosMovimento ? 1 : 0.07; // o giro é mais lento que o caminho
      if (trofeu.position.distanceTo(lugar.pos) > 0.001 || Math.abs(trofeu.rotation.y - lugar.giro) > 0.002) {
        trofeu.position.lerp(lugar.pos, passo);
        trofeu.rotation.y += (lugar.giro - trofeu.rotation.y) * passoGiro;
        trofeu.scale.setScalar(trofeu.scale.x + (lugar.escala - trofeu.scale.x) * passo);
        mexendo = true;
      }
    });

    // Enfeites (bola quicando, controle vibrando)
    if (decoracao.animar(agora)) mexendo = true;

    // Livro: a capa abre (ou fecha) aos poucos
    const capaAlvo = livroAberto ? 2.6 : 0;
    const livroAlvo = livroAberto ? 0.12 : 0.02;
    if (Math.abs(lombada.rotation.z - capaAlvo) > 0.002) {
      const passo = menosMovimento ? 1 : 0.09;
      lombada.rotation.z += (capaAlvo - lombada.rotation.z) * passo;
      livro.position.z += (livroAlvo - livro.position.z) * passo;
      quadrosDeSombra = 2; // a sombra do livro muda junto
      mexendo = true;
    }

    // Celular vibrando
    if (agora < vibrarAte) {
      corpoCelular.rotation.z = Math.sin(agora * 0.09) * 0.012;
      mexendo = true;
    } else {
      corpoCelular.rotation.z = 0;
    }

    // Monitor ligando
    if (monitorLigado && agora - ligouEm < DURACAO_BOOT + 50) mexendo = true;
    desenharTelaMonitor(agora);

    if (quadrosDeSombra > 0) {
      renderizador.shadowMap.needsUpdate = true;
      quadrosDeSombra--;
    }

    renderizador.render(cena, camera);
    if (navegador.classList.contains("ligado")) encaixarNavegador();
    if (mexendo) pedirQuadro();
  }

  // ===== Relógio lento (8 vezes por segundo) =====
  // Digita o código do notebook, pisca o botão de ligar e, de vez em quando,
  // faz o celular vibrar. Cada mudança pede um quadro só.
  // Otimização: antes ele redesenhava o quarto 8 vezes por segundo mesmo
  // com tudo parado. Agora só redesenha se o notebook, o botão do monitor ou
  // o celular estiverem dentro da visão da câmera.
  const visao = new THREE.Frustum();
  const matrizVisao = new THREE.Matrix4();
  function naTela(objeto) {
    matrizVisao.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    visao.setFromProjectionMatrix(matrizVisao);
    return visao.intersectsObject(objeto);
  }
  let tiques = 0;
  setInterval(() => {
    // Com o navegador aberto nada disso aparece: não gasta nada
    if (document.hidden || navegador.classList.contains("ligado")) return;
    tiques++;
    let mudou = false;
    if (naTela(telaNote)) {
      desenharCodigo();
      mudou = true;
    }
    if (!monitorLigado && naTela(botaoLigar)) {
      botaoLigar.material.color.set(tiques % 8 < 4 ? COR.coral : 0x7a3424);
      mudou = true;
    }
    if (!menosMovimento && tiques % 48 === 0 && naTela(telaCelularMalha)) {
      vibrarAte = performance.now() + 400;
      mudou = true;
    }
    if (mudou) pedirQuadro();
  }, 125);

  // Barrinhas da caixa de som: ~15 vezes por segundo, só com música e com a
  // caixa na tela
  setInterval(() => {
    if (document.hidden || !naTela(decoracao.caixaSom)) return;
    if (decoracao.atualizarBarras()) pedirQuadro();
  }, 66);

  document.addEventListener("visibilitychange", () => !document.hidden && pedirQuadro());

  // ===== Medição de desempenho (só com ?medir no endereço) =====
  // Ferramenta para testar: quantos objetos são desenhados, quanto tempo
  // leva um quadro e quantos quadros o quarto desenha parado.
  if (new URLSearchParams(location.search).has("medir")) {
    let contados = 0;
    const desenharOriginal = renderizador.render.bind(renderizador);
    renderizador.render = (c, cam) => {
      contados++;
      desenharOriginal(c, cam);
    };
    const gl = renderizador.getContext();
    const pixel = new Uint8Array(4);
    window.quartoMedir = {
      info: () => ({ ...renderizador.info.render, ...renderizador.info.memory, pixelRatio: renderizador.getPixelRatio() }),
      // Testes: trocar o tipo de sombra ("soft", "pcf", "basic", "off") e a resolução
      config({ sombra, pixel } = {}) {
        if (sombra) {
          renderizador.shadowMap.enabled = sombra !== "off";
          renderizador.shadowMap.type = { soft: THREE.PCFSoftShadowMap, pcf: THREE.PCFShadowMap, basic: THREE.BasicShadowMap }[sombra] ?? THREE.PCFShadowMap;
          renderizador.shadowMap.needsUpdate = true;
          cena.traverse((o) => o.material && [].concat(o.material).forEach((m) => (m.needsUpdate = true)));
        }
        if (pixel) {
          renderizador.setPixelRatio(pixel);
          ajustarTamanho();
        }
      },
      // Quadros desenhados sozinhos em "segundos" (com o quarto parado)
      async parado(segundos = 5) {
        contados = 0;
        await new Promise((r) => setTimeout(r, segundos * 1000));
        return contados / segundos;
      },
      // Desenha n quadros girando a câmera; devolve o tempo médio por quadro (ms)
      quadros(n = 200) {
        const giroAntes = giro;
        const tempos = [];
        for (let i = 0; i < n; i++) {
          giro = giroAntes + (i / n) * Math.PI * 2;
          const v = vistaGeral();
          camera.position.copy(v.pos);
          camera.lookAt(v.alvo);
          const antes = performance.now();
          desenharOriginal(cena, camera);
          gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel); // espera a placa de vídeo terminar
          tempos.push(performance.now() - antes);
        }
        giro = giroAntes;
        pedirQuadro();
        const media = tempos.reduce((a, b) => a + b, 0) / n;
        // média e o pior quadro (o "engasgo")
        return { media: +media.toFixed(2), pior: +Math.max(...tempos).toFixed(1) };
      },
    };
  }

  // ===== Primeiro quadro =====
  dica.textContent = toque
    ? "Está escuro. Arraste o dedo para olhar em volta: o interruptor fica na parede à sua direita."
    : "Está escuro. Arraste para olhar em volta: o interruptor fica na parede à sua direita.";
  desenharCodigo();
  ajustarTamanho();
  // (?semaquecer no endereço pula o aquecimento, só para comparar nos testes)
  if (!new URLSearchParams(location.search).has("semaquecer")) aquecer();
  desenhar(performance.now());
  esconderCarregando();

  // ===== Aquecimento (atrás da tela de "Montando o quarto…") =====
  // Na primeira vez que algo aparece, a placa de vídeo precisa preparar o
  // "programa" do material e receber as texturas: isso dava engasgos ao girar
  // pela primeira vez ou abrir o guarda-roupa. Aqui tudo é preparado antes:
  //   1. compile() prepara todos os materiais;
  //   2. initTexture() manda todas as texturas para a placa de vídeo;
  //   3. desenha o quarto olhando para 4 lados (com o guarda-roupa aberto),
  //      medindo o tempo. Se a máquina for lenta, baixa a resolução.
  function aquecer() {
    camera.fov = fovNaTela(fov);
    camera.updateProjectionMatrix();
    renderizador.compile(cena, camera);
    cena.traverse((o) => {
      if (!o.material) return;
      [].concat(o.material).forEach((m) => m.map && renderizador.initTexture(m.map));
    });
    const gl = renderizador.getContext();
    const pixel = new Uint8Array(4);
    const portasAntes = fundo.portas.map((p) => p.rotation.y);
    fundo.portas.forEach((p) => (p.rotation.y = p.userData.aberta));
    let tempo = 0;
    for (let i = 0; i < 8; i++) {
      giro = (i % 4) * (Math.PI / 2);
      const v = vistaGeral();
      camera.position.copy(v.pos);
      camera.lookAt(v.alvo);
      const antes = performance.now();
      renderizador.render(cena, camera);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel); // espera terminar
      if (i >= 4) tempo += performance.now() - antes; // a 1ª volta só aquece
    }
    fundo.portas.forEach((p, i) => (p.rotation.y = portasAntes[i]));
    giro = giroAlvo;
    // Qualidade automática: acima de ~14 ms por quadro (menos de 70 por
    // segundo), usa menos pixels. O quarto fica um pouco menos nítido, mas liso.
    if (tempo / 4 > 14 && renderizador.getPixelRatio() > 1) {
      renderizador.setPixelRatio(1);
      ajustarTamanho();
    }
  }
}

// ---------- Começa ----------
// No celular abre a versão leve (ver "versaoLeve" no começo do arquivo).
iniciarQuarto();
