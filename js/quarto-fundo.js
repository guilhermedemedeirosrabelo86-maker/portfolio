// =========================================================
// Quarto 3D · a outra metade do quarto
// O quarto.js monta a parede da mesa (monitor, notebook, celular...).
// Este arquivo monta o resto, que aparece quando a pessoa gira a visão:
//   - chão, paredes e teto (o quarto agora é fechado)
//   - porta e interruptor (parede da direita)
//   - luminária de teto
//   - cama, tapete e o quadro do Criciúma com a logo oficial (parede do fundo)
//   - fita de LED em volta do teto e o controle dela, em cima da cama
//   - guarda-roupa com roupas (cenário) e um troféu para cada tecnologia (as skills)
//
// Ele só MONTA as peças. Quem anima (acender a luz, abrir as portas,
// trocar a cor do LED) é o quarto.js, com as peças que montarFundo() devolve.
// =========================================================

// Medidas do quarto (em metros, mais ou menos). A mesa fica na parede da
// "frente" e a pessoa fica parada no meio, olhando para ela.
export const QUARTO = { esquerda: -4.2, direita: 4.2, frente: -3, fundo: 5.2, teto: 3.3 };

// Cores da fita de LED, na ordem em que o controle troca
export const CORES_LED = [
  ["roxo", 0xb06cff],
  ["azul", 0x4f8cff],
  ["coral", 0xff7a59],
  ["verde-água", 0x5eead4],
  ["branco quente", 0xffe2c4],
];

const GITHUB = "https://github.com/guilhermedemedeirosrabelo86-maker";

// As skills: os mesmos textos da seção "Skills" do site (index.html).
// "onde" são ids da lista de projetos do quarto.js (viram links para o monitor).
// "sobre" é uma frase simples do que a tecnologia é; "tipo" é o grupo dela no site.
export const skills = [
  { id: "html", tipo: "Front-end", nome: "HTML", cor: "#e8673c", sobre: "A estrutura das páginas: títulos, textos, imagens e formulários.", onde: ["central-brindes", "meu-predio", "gr-digital"] },
  { id: "css", tipo: "Front-end", nome: "CSS", cor: "#3c7be8", sobre: "O visual das páginas: cores, fontes, espaços e o layout no computador e no celular.", onde: ["central-brindes", "meu-predio", "gr-digital"] },
  { id: "javascript", tipo: "Front-end", nome: "JavaScript", cor: "#f2c94c", sobre: "O que faz a página reagir: cliques, telas que mudam e dados que chegam do servidor.", onde: ["central-brindes", "meu-predio", "gr-digital"] },
  { id: "react", tipo: "Front-end", nome: "React (estudando)", curto: "React", cor: "#5ed3f3", sobre: "Biblioteca de JavaScript para montar telas em componentes.", texto: "Estudando agora" },
  { id: "python", tipo: "Back-end e dados", nome: "Python", cor: "#3f6fa8", sobre: "Linguagem usada no back-end, em automações e para trabalhar com dados.", onde: ["meu-predio"] },
  { id: "sql", tipo: "Back-end e dados", nome: "SQL", cor: "#8a95ae", sobre: "A linguagem para guardar e consultar dados num banco.", onde: ["central-brindes"] },
  { id: "sqlite", tipo: "Back-end e dados", nome: "SQLite", cor: "#4b8fb8", sobre: "Um banco de dados SQL que fica num arquivo só, sem servidor separado.", onde: ["meu-predio"] },
  { id: "firebase", tipo: "Back-end e dados", nome: "Firebase", cor: "#ffa000", sobre: "Serviços do Google com banco de dados e login prontos na nuvem.", onde: ["central-brindes"] },
  { id: "cloudflare", tipo: "Back-end e dados", nome: "Cloudflare Workers", curto: "Cloudflare", cor: "#f38020", sobre: "Código que roda nos servidores da Cloudflare, sem eu precisar manter um servidor.", onde: ["central-brindes"] },
  { id: "git", tipo: "Ferramentas", nome: "Git", cor: "#f05033", sobre: "Guarda o histórico de cada mudança no código.", texto: "Em todos os projetos" },
  { id: "github", tipo: "Ferramentas", nome: "GitHub", cor: "#eef2fb", sobre: "Onde o código fica guardado on-line, para qualquer um ver.", texto: "Código de todos no meu perfil", link: GITHUB },
];

export function montarFundo({ THREE, cena, caixa, mat, textura, clicavel, aoCarregar }) {
  const { esquerda, direita, frente, fundo, teto } = QUARTO;
  const largura = direita - esquerda;
  const profundidade = fundo - frente;
  const meioX = (esquerda + direita) / 2;
  const meioZ = (frente + fundo) / 2;

  // ===== Chão, paredes e teto =====
  function plano(l, a, cor) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, a), mat(cor));
    m.receiveShadow = true;
    return m;
  }
  const chao = plano(largura, profundidade, 0x1d2944);
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(meioX, 0, meioZ);

  const paredeFrente = plano(largura, teto, 0x1f2c4a);
  paredeFrente.position.set(meioX, teto / 2, frente);

  const paredeFundo = plano(largura, teto, 0x1f2c4a);
  paredeFundo.rotation.y = Math.PI;
  paredeFundo.position.set(meioX, teto / 2, fundo);

  const paredeEsquerda = plano(profundidade, teto, 0x1a2742);
  paredeEsquerda.rotation.y = Math.PI / 2;
  paredeEsquerda.position.set(esquerda, teto / 2, meioZ);

  const paredeDireita = plano(profundidade, teto, 0x1a2742);
  paredeDireita.rotation.y = -Math.PI / 2;
  paredeDireita.position.set(direita, teto / 2, meioZ);

  const forro = plano(largura, profundidade, 0x3a4766);
  forro.rotation.x = Math.PI / 2;
  forro.position.set(meioX, teto, meioZ);

  // Rodapé coral na parede da mesa (como já era)
  const rodape = new THREE.Mesh(new THREE.BoxGeometry(largura, 0.06, 0.04), mat(0xff7a59));
  rodape.position.set(meioX, 0.03, frente + 0.02);
  cena.add(chao, paredeFrente, paredeFundo, paredeEsquerda, paredeDireita, forro, rodape);

  // Peças presas numa parede são montadas "de frente" (olhando para +z)
  // e depois giradas para a parede certa por este grupo.
  function naParede(lado, x, y, z) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    if (lado === "direita") g.rotation.y = -Math.PI / 2;
    if (lado === "fundo") g.rotation.y = Math.PI;
    cena.add(g);
    return g;
  }

  // ===== Porta (enfeite) e interruptor, na parede da direita =====
  const porta = naParede("direita", direita - 0.01, 0, -2.0);
  const batente = caixa(1.0, 2.15, 0.04, 0x111a2c);
  batente.position.y = 1.075;
  const folha = caixa(0.88, 2.06, 0.05, 0x2e3b5e, 0.015);
  folha.position.set(0, 1.03, 0.02);
  const macaneta = caixa(0.12, 0.025, 0.04, 0xc9cfdb, 0.01);
  macaneta.position.set(0.32, 1.0, 0.06);
  porta.add(batente, folha, macaneta);

  const interruptor = naParede("direita", direita - 0.01, 1.15, -1.2);
  const espelho = caixa(0.09, 0.13, 0.015, 0xeef2fb, 0.008);
  // A tecla inclina para cima (apagado) ou para baixo (aceso)
  const tecla = caixa(0.045, 0.07, 0.02, 0xd6dbe6, 0.006);
  tecla.position.z = 0.012;
  tecla.rotation.x = -0.25;
  interruptor.add(espelho, tecla);
  clicavel(interruptor, "interruptor", "<b>Interruptor</b> · Luz");

  // ===== Luminária de teto =====
  // Um disco que fica cinza apagado e claro aceso (a luz em si fica no quarto.js)
  const lampadaTeto = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.04, 32),
    new THREE.MeshBasicMaterial({ color: 0x3a4560 }),
  );
  lampadaTeto.position.set(0, teto - 0.02, 0.8);
  cena.add(lampadaTeto);

  // ===== Cama, encostada na parede do fundo =====
  const cama = new THREE.Group();
  cama.position.set(0, 0, fundo);
  cama.rotation.y = Math.PI; // "frente" da cama aponta para o meio do quarto
  cena.add(cama);
  const LARGURA_CAMA = 1.5;
  const COMPRIMENTO_CAMA = 2.0;
  const estrado = caixa(LARGURA_CAMA + 0.08, 0.28, COMPRIMENTO_CAMA, 0x2a2f45, 0.03);
  estrado.position.set(0, 0.14, COMPRIMENTO_CAMA / 2 + 0.06);
  const colchao = caixa(LARGURA_CAMA, 0.22, COMPRIMENTO_CAMA - 0.06, 0xe9edf5, 0.06);
  colchao.position.set(0, 0.39, COMPRIMENTO_CAMA / 2 + 0.07);
  const TOPO_CAMA = 0.5;
  // Coberta: cobre do pé até perto dos travesseiros e cai um pouco nas laterais
  const coberta = caixa(LARGURA_CAMA + 0.06, 0.06, 1.45, 0x2b3d6b, 0.03);
  coberta.position.set(0, TOPO_CAMA + 0.01, COMPRIMENTO_CAMA - 0.68);
  const faixa = caixa(LARGURA_CAMA + 0.07, 0.065, 0.12, 0xff7a59, 0.03);
  faixa.position.set(0, TOPO_CAMA + 0.012, COMPRIMENTO_CAMA - 1.25);
  const cabeceira = caixa(LARGURA_CAMA + 0.3, 1.15, 0.1, 0x33405f, 0.05);
  cabeceira.position.set(0, 0.575, 0.05);
  cama.add(estrado, colchao, coberta, faixa, cabeceira);
  for (const x of [-0.36, 0.36]) {
    const travesseiro = caixa(0.6, 0.13, 0.36, 0xf4f6fb, 0.06);
    travesseiro.position.set(x, TOPO_CAMA + 0.05, 0.36);
    travesseiro.rotation.x = -0.12;
    cama.add(travesseiro);
  }
  cama.userData.nome = "cama"; // pronta para virar clicável no futuro

  // Tapete na frente da cama
  const tapeteCama = caixa(2.4, 0.02, 1.2, 0x3a2f4f, 0.01);
  tapeteCama.position.set(0, 0.01, fundo - COMPRIMENTO_CAMA - 0.3);
  cena.add(tapeteCama);

  // ===== Quadro do Criciúma, em cima da cama =====
  // A logo oficial (img/escudo-criciuma.png, do Wikimedia Commons) é
  // desenhada num canvas de fundo claro quando a imagem termina de carregar.
  const escudo = textura(900, 720, (ctx, l, a) => {
    ctx.fillStyle = "#f4f1e8";
    ctx.fillRect(0, 0, l, a);
  });
  const logo = new Image();
  logo.onload = () => {
    const { ctx, c } = escudo;
    const escala = Math.min((c.width * 0.82) / logo.width, (c.height * 0.82) / logo.height);
    const w = logo.width * escala;
    const h = logo.height * escala;
    ctx.drawImage(logo, (c.width - w) / 2, (c.height - h) / 2, w, h);
    escudo.t.needsUpdate = true;
    aoCarregar();
  };
  logo.src = "../img/escudo-criciuma.png";
  const quadroEscudo = naParede("fundo", 0, 2.2, fundo - 0.01);
  const molduraEscudo = caixa(1.0, 0.82, 0.04, 0x0a0f1a, 0.015);
  const pinturaEscudo = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.72), mat(0xffffff, { map: escudo.t }));
  pinturaEscudo.position.z = 0.022;
  quadroEscudo.add(molduraEscudo, pinturaEscudo);

  // ===== Fita de LED no teto =====
  // Uma barrinha em cada encontro de parede com teto, e logo abaixo uma
  // faixa de brilho desenhado (bem mais barato que luzes de verdade).
  // Todos os materiais ficam em "led" para o quarto.js trocar a cor.
  const brilhoLed = textura(32, 256, (ctx, l, a) => {
    const g = ctx.createLinearGradient(0, 0, 0, a);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l, a);
  });
  const materialFita = new THREE.MeshBasicMaterial({ color: CORES_LED[0][1] });
  const materialBrilho = new THREE.MeshBasicMaterial({
    map: brilhoLed.t,
    color: CORES_LED[0][1],
    transparent: true,
    depthWrite: false,
  });
  const led = [materialFita, materialBrilho];
  // O brilho fica colado na parede (4 mm) e "empurrado para trás" no teste de
  // profundidade (polygonOffset). Assim quadros e pôster sempre ficam na frente
  // dele: antes ele ficava na mesma distância do pôster e os dois piscavam.
  materialBrilho.polygonOffset = true;
  materialBrilho.polygonOffsetFactor = 1;
  materialBrilho.polygonOffsetUnits = 4;
  const paredes = [
    ["frente", largura, meioX, frente, 0],
    ["fundo", largura, meioX, fundo, Math.PI],
    ["esquerda", profundidade, esquerda, meioZ, Math.PI / 2],
    ["direita", profundidade, direita, meioZ, -Math.PI / 2],
  ];
  for (const [, comprimento, x, z, giro] of paredes) {
    const g = new THREE.Group();
    g.position.set(x, teto, z);
    g.rotation.y = giro;
    const fita = new THREE.Mesh(new THREE.BoxGeometry(comprimento, 0.03, 0.03), materialFita);
    fita.position.set(0, -0.06, 0.04);
    const brilho = new THREE.Mesh(new THREE.PlaneGeometry(comprimento, 0.7), materialBrilho);
    brilho.position.set(0, -0.42, 0.004);
    g.add(fita, brilho);
    cena.add(g);
  }

  // Controle do LED, em cima da coberta, perto do pé da cama
  const controle = new THREE.Group();
  // Em cima da coberta (que termina em y ≈ 0,54) e longe do cachecol do pé da cama
  controle.position.set(-0.4, TOPO_CAMA + 0.054, COMPRIMENTO_CAMA - 0.8);
  controle.rotation.y = 0.4;
  const corpoControle = caixa(0.07, 0.022, 0.16, 0x1b2233, 0.01);
  const botaoControle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.008, 16),
    new THREE.MeshBasicMaterial({ color: CORES_LED[0][1] }),
  );
  botaoControle.position.set(0, 0.014, -0.035);
  controle.add(corpoControle, botaoControle);
  cama.add(controle);
  clicavel(controle, "controle", "<b>Controle</b> · Cor do LED");

  // ===== Guarda-roupa (Skills), na parede da direita =====
  const LARGURA_GR = 1.8;
  const ALTURA_GR = 2.3;
  const FUNDO_GR = 0.6;
  const guardaRoupa = naParede("direita", direita - FUNDO_GR / 2 - 0.02, 0, 3.6);
  const madeira = 0x4a3a2e;
  // Caixa aberta na frente: fundo, laterais, topo e base
  const costas = caixa(LARGURA_GR, ALTURA_GR, 0.03, 0x2e241c, 0.005);
  costas.position.set(0, ALTURA_GR / 2, -FUNDO_GR / 2 + 0.015);
  guardaRoupa.add(costas);
  for (const x of [-LARGURA_GR / 2 + 0.02, LARGURA_GR / 2 - 0.02]) {
    const lado = caixa(0.04, ALTURA_GR, FUNDO_GR, madeira, 0.01);
    lado.position.set(x, ALTURA_GR / 2, 0);
    guardaRoupa.add(lado);
  }
  for (const y of [0.04, ALTURA_GR - 0.02]) {
    const tampo = caixa(LARGURA_GR, 0.04, FUNDO_GR, madeira, 0.01);
    tampo.position.set(0, y, 0);
    guardaRoupa.add(tampo);
  }
  // Dentro: duas prateleiras, duas gavetas e uma tábua em cima das gavetas
  for (const y of [0.62, 1.2]) {
    const prateleiraGR = caixa(LARGURA_GR - 0.08, 0.03, FUNDO_GR - 0.06, madeira, 0.005);
    prateleiraGR.position.set(0, y, 0);
    guardaRoupa.add(prateleiraGR);
  }
  const tabuaGavetas = caixa(LARGURA_GR - 0.08, 0.03, FUNDO_GR - 0.06, madeira, 0.005);
  tabuaGavetas.position.set(0, 0.365, 0);
  guardaRoupa.add(tabuaGavetas);
  for (const x of [-0.43, 0.43]) {
    const gaveta = caixa(0.8, 0.26, 0.04, 0x5a4636, 0.01);
    gaveta.position.set(x, 0.22, FUNDO_GR / 2 - 0.04);
    const puxador = caixa(0.16, 0.02, 0.03, 0xc9cfdb, 0.008);
    puxador.position.set(x, 0.3, FUNDO_GR / 2 - 0.005);
    guardaRoupa.add(gaveta, puxador);
  }
  // Alturas das superfícies onde os troféus ficam
  const EM_CIMA = ALTURA_GR + 0.02; // em cima do guarda-roupa, por fora
  const MEIO = 1.215;
  const BAIXO = 0.635;
  const GAVETAS = 0.38;

  // ===== Roupas (só cenário) =====
  // Peças finas penduradas de lado, como num guarda-roupa de verdade. Cada
  // uma é um plano com o recorte da roupa (desenhado no canvas, a parte de
  // fora fica transparente) e umas ondas no tecido, para não ficar reta.
  const Y_CABIDEIRO = 2.12;
  const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, LARGURA_GR - 0.08, 8), mat(0xc9cfdb));
  barra.rotation.z = Math.PI / 2;
  barra.position.set(0, Y_CABIDEIRO, 0);
  guardaRoupa.add(barra);
  const cabide = criarCabide(THREE, mat);
  const roupas = [
    { tipo: "camiseta", cor: "#1b1f2a", x: -0.74, giro: 0.15 },
    { tipo: "moletom", cor: "#7a8296", x: -0.55, giro: -0.12 },
    { tipo: "camiseta", cor: "#eef2fb", x: -0.37, giro: 0.28 },
    { tipo: "criciuma", cor: "#ffd200", x: -0.2, giro: -0.06 },
    { tipo: "jaqueta", cor: "#3c5a8a", x: 0.06, giro: 0.14 },
    { tipo: "xadrez", cor: "#a8323a", x: 0.29, giro: -0.22 },
    { tipo: "camiseta", cor: "#ff7a59", x: 0.5, giro: 0.08 },
  ];
  const pecasRoupa = [];
  roupas.forEach((roupa, i) => {
    const longa = !["camiseta", "criciuma"].includes(roupa.tipo);
    const largura = 0.42;
    const altura = longa ? 0.62 : 0.5;
    const desenho = textura(256, longa ? 378 : 305, (ctx, l, a) => desenharRoupa(ctx, l, a, roupa, longa));
    const pano = new THREE.PlaneGeometry(largura, altura, 10, 16);
    ondular(pano, i);
    pano.translate(0, -altura / 2 - 0.025, 0); // pendura logo abaixo do cabide
    const malha = new THREE.Mesh(pano, mat(0xffffff, { map: desenho.t, alphaTest: 0.5, side: THREE.DoubleSide }));
    const peca = new THREE.Group();
    peca.position.set(roupa.x, Y_CABIDEIRO, 0);
    peca.rotation.y = Math.PI / 2 + roupa.giro; // de lado, cada uma meio torta
    peca.add(malha, cabide.clone());
    guardaRoupa.add(peca);
    pecasRoupa.push(peca);
  });

  // ===== Troféus (as skills) =====
  // Um troféu diferente para cada tecnologia, espalhados sem muito padrão.
  // Cada um guarda onde fica (userData.lugar) e onde fica quando é
  // escolhido (userData.vitrine: vem para a frente, maior, dando uma volta).
  // O quarto.js anima entre os dois.
  const t = trofeus(THREE, mat, caixa, textura);
  const modelos = {
    // Alguns têm o formato do ícone da tecnologia
    html: (nome) => t.escudo(0xe34f26, "5", nome),
    css: (nome) => t.escudo(0x1572b6, "3", nome),
    javascript: (nome) => t.quadradoJs(nome),
    react: (nome) => t.atomo(nome),
    python: (nome) => t.cobras(nome),
    sql: (nome) => t.bancoDeDados(nome),
    sqlite: () => t.medalhaPendurada(t.prata()),
    firebase: (nome) => t.chama(nome),
    cloudflare: (nome) => t.nuvem(nome),
    git: (nome) => t.losangoGit(nome),
    github: (nome) => t.cristal(nome),
  };
  // [x, altura da superfície, z, giro] — o lugar de cada um
  const lugares = {
    html: [-0.45, EM_CIMA, 0.04, 0.35],
    css: [-0.58, MEIO, 0.06, -0.25],
    javascript: [0.12, MEIO, 0.1, 0.4],
    firebase: [0.62, MEIO, -0.02, -0.15],
    python: [-0.6, BAIXO, -0.13, 0.1],
    sql: [-0.12, BAIXO, 0.08, 0.3],
    cloudflare: [0.45, BAIXO + 0.1, -0.05, -0.35], // em cima de uma caixa
    react: [-0.55, GAVETAS, 0.12, 0.4],
    git: [0.05, GAVETAS, 0.06, -0.7],
    github: [0.6, GAVETAS, 0.1, 0.2],
    sqlite: [-0.83, 1.06, 0.2, 0], // pendurada num gancho na lateral de dentro
  };
  // A caixa de papelão em que o troféu da nuvem fica
  const caixaPapelao = caixa(0.2, 0.1, 0.17, 0xb08a5a, 0.006);
  caixaPapelao.position.set(0.45, BAIXO + 0.05, -0.05);
  caixaPapelao.rotation.y = 0.2;
  guardaRoupa.add(caixaPapelao);
  const gancho = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.003, 6, 10, Math.PI * 1.4), mat(0xc9cfdb));
  gancho.position.set(-0.83, 1.07, 0.2);
  guardaRoupa.add(gancho);

  const ALTURA_VITRINE = 0.42; // tamanho com que todos aparecem na frente
  const invisivel = new THREE.MeshBasicMaterial({ visible: false });
  const trofeusSkills = skills.map((skill) => {
    const trofeu = modelos[skill.id](skill.curto || skill.nome);
    const [x, y, z, giro] = lugares[skill.id];
    // Área de clique do tamanho do troféu (os detalhes finos são difíceis de acertar)
    const caixaLimite = new THREE.Box3().setFromObject(trofeu);
    const tamanho = caixaLimite.getSize(new THREE.Vector3());
    const centro = caixaLimite.getCenter(new THREE.Vector3());
    const clique = new THREE.Mesh(new THREE.BoxGeometry(tamanho.x + 0.03, tamanho.y + 0.03, tamanho.z + 0.03), invisivel);
    clique.position.copy(centro);
    trofeu.add(clique);

    const altura = tamanho.y;
    const escala = Math.min(3, ALTURA_VITRINE / altura);
    // No lugar, um pouco maiores; os da prateleira do meio menos, porque as
    // roupas descem até perto dela
    // (o HTML, em cima do guarda-roupa, é o maior; em cima das gavetas o espaço é baixo)
    const escalaLugar = skill.id === "html" ? 1.7 : y === MEIO ? 1.12 : y === GAVETAS ? 1.15 : 1.4;
    // O troféu tem a origem na base; a medalha pendurada tem no gancho (topo)
    const doTopo = skill.id === "sqlite";
    const yVitrine = doTopo ? 1.35 + (altura * escala) / 2 : 1.35 - (altura * escala) / 2;
    trofeu.userData.skill = skill.id;
    trofeu.userData.lugar = { pos: new THREE.Vector3(x, y, z), giro, escala: escalaLugar };
    trofeu.userData.vitrine = { pos: new THREE.Vector3(0, yVitrine, 0.72), giro: giro + Math.PI * 2, escala };
    trofeu.position.set(x, y, z);
    trofeu.rotation.y = giro;
    trofeu.scale.setScalar(escalaLugar);
    guardaRoupa.add(trofeu);
    clicavel(trofeu, `skill-${skill.id}`, `<b>${skill.curto || skill.nome}</b> · ver troféu`);
    return trofeu;
  });

  // As portas giram em dobradiças nas laterais. userData.aberta = ângulo aberta.
  const portas = [];
  for (const lado of [-1, 1]) {
    const dobradica = new THREE.Group();
    dobradica.position.set((lado * LARGURA_GR) / 2, 0, FUNDO_GR / 2 + 0.01);
    const folhaPorta = caixa(LARGURA_GR / 2 - 0.01, ALTURA_GR - 0.04, 0.03, madeira, 0.01);
    folhaPorta.position.set((-lado * (LARGURA_GR / 2 - 0.01)) / 2, ALTURA_GR / 2, 0);
    const puxador = caixa(0.02, 0.3, 0.03, 0xc9cfdb, 0.008);
    puxador.position.set(-lado * (LARGURA_GR / 2 - 0.1), 1.25, 0.03);
    dobradica.add(folhaPorta, puxador);
    dobradica.userData.aberta = lado * 1.9;
    guardaRoupa.add(dobradica);
    portas.push(dobradica);
  }
  guardaRoupa.traverse((o) => o.isMesh && (o.castShadow = true));
  // Portas e troféus se mexem: sem sombra, a sombra do quarto não precisa
  // ser recalculada enquanto eles animam (fica bem mais leve). As roupas
  // finas também não fazem sombra.
  [...portas, ...trofeusSkills, ...pecasRoupa].forEach((g) => g.traverse((o) => (o.castShadow = false)));
  // O grupo inteiro é clicável; os troféus têm nome próprio e ganham do grupo
  clicavel(guardaRoupa, "guarda-roupa", "<b>Guarda-roupa</b> · Skills");

  return { interruptor, tecla, lampadaTeto, cama, TOPO_CAMA, led, controle, botaoControle, guardaRoupa, portas, trofeus: trofeusSkills };
}

// ===== Roupas =====

// Cabide: gancho em cima e a barra em "V" que segura os ombros
function criarCabide(THREE, mat) {
  const g = new THREE.Group();
  const metal = mat(0xc9cfdb);
  const gancho = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 12, Math.PI * 1.3), metal);
  gancho.position.y = 0.012;
  gancho.rotation.z = -0.3;
  for (const lado of [-1, 1]) {
    const braco = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.19, 6), metal);
    braco.rotation.z = lado * 1.3;
    braco.position.set(lado * 0.09, -0.03, 0);
    g.add(braco);
  }
  g.add(gancho);
  return g;
}

// Ondas no tecido: dobras que aumentam para baixo e o corpo "cheio" no meio
function ondular(geometria, semente) {
  const pos = geometria.attributes.position;
  const { width: l, height: a } = geometria.parameters;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const desce = (a / 2 - pos.getY(i)) / a; // 0 no ombro, 1 na barra
    const dobras = Math.sin((x / l) * Math.PI * 4 + semente * 1.7) * 0.012 * (0.4 + desce);
    const cheio = Math.cos((x / l) * Math.PI) * 0.018;
    pos.setZ(i, dobras + cheio);
  }
  geometria.computeVertexNormals();
}

// Desenha a roupa no canvas: recorte, cor, sombras das dobras e detalhes
function desenharRoupa(ctx, l, a, roupa, longa) {
  const s = l / 256;
  ctx.clearRect(0, 0, l, a);
  ctx.save();
  ctx.scale(s, s);
  const forma = new Path2D(
    longa
      ? "M88 14 Q128 44 168 14 L226 36 Q246 60 248 120 L250 330 L222 334 L212 130 L204 120 L204 372 L52 372 L52 120 L44 130 L34 334 L6 330 L8 120 Q10 60 30 36 Z"
      : "M88 14 Q128 44 168 14 L228 40 L250 96 L210 112 L200 92 L200 298 L56 298 L56 92 L46 112 L6 96 L28 40 Z",
  );
  ctx.clip(forma);
  ctx.fillStyle = roupa.cor;
  ctx.fillRect(0, 0, 256, 380);

  if (roupa.tipo === "criciuma") {
    // Listras amarelo, preto e branco
    const listras = ["#ffd200", "#141414", "#ffffff", "#141414"];
    for (let x = 0, i = 0; x < 256; x += 22, i++) {
      ctx.fillStyle = listras[i % listras.length];
      ctx.fillRect(x, 0, 22, 380);
    }
  }
  if (roupa.tipo === "xadrez") {
    // Flanela xadrez: faixas escuras cruzadas
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    for (let p = 0; p < 380; p += 40) {
      ctx.fillRect(0, p, 256, 14);
      ctx.fillRect(p, 0, 14, 380);
    }
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    for (let p = 20; p < 380; p += 40) {
      ctx.fillRect(0, p, 256, 3);
      ctx.fillRect(p, 0, 3, 380);
    }
  }
  if (roupa.tipo === "moletom") {
    // Capuz caído atrás da gola e o bolso canguru
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(128, 22, 52, 30, 0, 0, Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(78, 250, 100, 60, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(116, 34);
    ctx.lineTo(114, 90);
    ctx.moveTo(140, 34);
    ctx.lineTo(142, 90);
    ctx.stroke();
  }
  if (roupa.tipo === "jaqueta") {
    // Zíper no meio, gola virada e bolsos
    ctx.fillStyle = "#c9cfdb";
    ctx.fillRect(126, 30, 4, 345);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.moveTo(88, 14);
    ctx.lineTo(110, 70);
    ctx.lineTo(128, 40);
    ctx.lineTo(146, 70);
    ctx.lineTo(168, 14);
    ctx.fill();
    ctx.fillRect(66, 200, 44, 6);
    ctx.fillRect(146, 200, 44, 6);
  }

  // Sombras das dobras (faixas verticais suaves) e luz de cima
  for (let x = 30; x < 256; x += 46) {
    const g = ctx.createLinearGradient(x - 14, 0, x + 14, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, "rgba(0,0,0,0.16)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - 14, 60, 28, 330);
  }
  const luz = ctx.createLinearGradient(0, 0, 0, 380);
  luz.addColorStop(0, "rgba(255,255,255,0.12)");
  luz.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = luz;
  ctx.fillRect(0, 0, 256, 380);
  // Barra e gola com costura
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 6;
  ctx.stroke(forma);
  ctx.restore();
}

// ===== Troféus =====
// Cada função monta um troféu com a base em y = 0 e devolve o grupo.
// Os de ícone (escudo do HTML/CSS, quadrado do JS, átomo do React, cobras
// do Python, losango do Git, banco de dados do SQL) são peças com
// espessura (ExtrudeGeometry) e o desenho da frente num plano por cima.
// Os materiais são novos a cada troféu: o destaque do mouse acende os
// materiais do objeto, e não pode acender os dos outros junto.
function trofeus(THREE, mat, caixa, textura) {
  const prata = () => mat(0xd6dbe6);

  // Base preta com plaquinha dourada (o nome vem do troféu, via textura)
  function base(largura, altura, fundo, nome) {
    const g = new THREE.Group();
    const bloco = caixa(largura, altura, fundo, 0x1b2233, 0.006);
    bloco.position.y = altura / 2;
    g.add(bloco);
    if (nome) {
      const placa = textura(256, 64, (ctx, l, a) => {
        const brilho = ctx.createLinearGradient(0, 0, l, a);
        brilho.addColorStop(0, "#e9c45a");
        brilho.addColorStop(1, "#a8812a");
        ctx.fillStyle = brilho;
        ctx.fillRect(0, 0, l, a);
        ctx.fillStyle = "#2a1e00";
        ctx.textAlign = "center";
        let tamanho = 40;
        do {
          ctx.font = `800 ${tamanho}px sans-serif`;
          tamanho -= 2;
        } while (ctx.measureText(nome).width > 230 && tamanho > 12);
        ctx.fillText(nome, l / 2, 46);
      });
      const plaquinha = new THREE.Mesh(new THREE.PlaneGeometry(largura * 0.8, largura * 0.2), mat(0xffffff, { map: placa.t }));
      plaquinha.position.set(0, altura / 2, fundo / 2 + 0.001);
      g.add(plaquinha);
    }
    return g;
  }

  // Medalha pendurada: origem no gancho, a fita desce em "V" até o disco
  function medalhaPendurada(material) {
    const g = new THREE.Group();
    for (const lado of [-1, 1]) {
      const fita = caixa(0.022, 0.12, 0.003, lado < 0 ? 0xff7a59 : 0xeef2fb, 0.002);
      fita.position.set(lado * 0.014, -0.055, 0);
      fita.rotation.z = lado * 0.22;
      g.add(fita);
    }
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.007, 24), material);
    disco.rotation.x = Math.PI / 2;
    disco.position.y = -0.15;
    g.add(disco);
    return g;
  }

  // Chama (Firebase): duas chamas em camadas, laranja e amarela
  function chama(nome) {
    const g = base(0.08, 0.045, 0.07, nome);
    const desenhoChama = (r) => {
      const f = new THREE.Shape();
      f.moveTo(0, 0);
      f.bezierCurveTo(r, 0, r * 1.1, r * 1.1, r * 0.2, r * 2.4);
      f.bezierCurveTo(r * 0.3, r * 1.4, -r * 0.4, r * 1.6, -r * 0.5, r * 1.1);
      f.bezierCurveTo(-r * 1.1, r * 0.8, -r, 0, 0, 0);
      return new THREE.ExtrudeGeometry(f, { depth: 0.012, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 });
    };
    const fora = new THREE.Mesh(desenhoChama(0.05), mat(0xff7a1a));
    fora.position.set(0, 0.045, -0.006);
    const dentro = new THREE.Mesh(desenhoChama(0.028), mat(0xffd200));
    dentro.position.set(0, 0.05, 0.01);
    g.add(fora, dentro);
    return g;
  }

  // Nuvem laranja (Cloudflare): bolinhas juntas em cima de uma base
  function nuvem(nome) {
    const g = base(0.1, 0.04, 0.06, nome);
    const laranja = mat(0xf38020);
    [[-0.04, 0.07, 0.028], [0, 0.085, 0.04], [0.042, 0.072, 0.03], [0.018, 0.06, 0.026], [-0.018, 0.058, 0.026]].forEach(([x, y, r]) => {
      const bolinha = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), laranja);
      bolinha.position.set(x, y, 0);
      g.add(bolinha);
    });
    return g;
  }

  // Cristal (GitHub): um octaedro esticado, com as faces lapidadas
  function cristal(nome) {
    const g = base(0.07, 0.04, 0.07, nome);
    const pedra = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.045, 0),
      mat(0x7fdcff, { flatShading: true }),
    );
    pedra.scale.set(0.8, 1.4, 0.8);
    pedra.position.y = 0.04 + 0.064;
    g.add(pedra);
    return g;
  }

  // Plano transparente com um desenho (número, letras, galhos...) para ir na frente de um ícone
  function emblema(largura, altura, desenhar) {
    const imagem = textura(256, Math.round((256 * altura) / largura), desenhar);
    return new THREE.Mesh(
      new THREE.PlaneGeometry(largura, altura),
      mat(0xffffff, { map: imagem.t, transparent: true, depthWrite: false }),
    );
  }

  // Peça com espessura a partir de uma forma 2D
  function peca(forma, cor, espessura = 0.016) {
    const geo = new THREE.ExtrudeGeometry(forma, { depth: espessura, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 });
    geo.translate(0, 0, -espessura / 2);
    return new THREE.Mesh(geo, mat(cor));
  }

  // Escudo do HTML5 / CSS3, com o número na frente
  function escudo(cor, numero, nome) {
    const g = base(0.09, 0.045, 0.07, nome);
    const forma = new THREE.Shape();
    forma.moveTo(-0.055, 0.135);
    forma.lineTo(0.055, 0.135);
    forma.lineTo(0.045, 0.02);
    forma.lineTo(0, 0);
    forma.lineTo(-0.045, 0.02);
    forma.closePath();
    const corpo = peca(forma, cor);
    corpo.position.y = 0.05;
    const frente = emblema(0.11, 0.135, (ctx, l, a) => {
      // Metade da direita mais clara, como no logo
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.moveTo(l / 2, 8);
      ctx.lineTo(l - 26, 8);
      ctx.lineTo(l - 46, a - 46);
      ctx.lineTo(l / 2, a - 18);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "900 150px sans-serif";
      ctx.fillText(numero, l / 2, a * 0.72);
    });
    frente.position.set(0, 0.05 + 0.0675, 0.0115);
    g.add(corpo, frente);
    return g;
  }

  // Quadrado amarelo do JavaScript com "JS" no canto
  function quadradoJs(nome) {
    const g = base(0.09, 0.045, 0.07, nome);
    const bloco = caixa(0.1, 0.1, 0.02, 0xf7df1e, 0.008);
    bloco.position.y = 0.1;
    const frente = emblema(0.1, 0.1, (ctx, l, a) => {
      ctx.fillStyle = "#141414";
      ctx.textAlign = "right";
      ctx.font = "900 110px sans-serif";
      ctx.fillText("JS", l - 18, a - 22);
    });
    frente.position.set(0, 0.1, 0.0115);
    g.add(bloco, frente);
    return g;
  }

  // Átomo do React: núcleo e três órbitas
  function atomo(nome) {
    const g = base(0.09, 0.04, 0.06, nome);
    const azul = mat(0x61dafb);
    const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.012, 14, 10), azul);
    nucleo.position.y = 0.105;
    g.add(nucleo);
    for (let i = 0; i < 3; i++) {
      const orbita = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.004, 6, 40), azul);
      orbita.scale.y = 0.38;
      const giro = new THREE.Group();
      giro.position.y = 0.105;
      giro.rotation.z = (i * Math.PI) / 3;
      giro.add(orbita);
      g.add(giro);
    }
    return g;
  }

  // Cobras do Python: duas peças em "L", azul em cima e amarela embaixo
  function cobras(nome) {
    const g = base(0.09, 0.04, 0.06, nome);
    const metade = () => {
      const f = new THREE.Shape();
      f.moveTo(-0.045, 0);
      f.lineTo(-0.045, 0.03);
      f.quadraticCurveTo(-0.045, 0.045, -0.03, 0.045);
      f.lineTo(0.005, 0.045);
      f.lineTo(0.005, 0.06);
      f.quadraticCurveTo(0.005, 0.075, -0.01, 0.075);
      f.lineTo(-0.03, 0.075);
      f.quadraticCurveTo(-0.045, 0.075, -0.045, 0.06);
      f.lineTo(-0.045, 0.05);
      f.lineTo(-0.055, 0.05);
      f.quadraticCurveTo(-0.065, 0.05, -0.065, 0.035);
      f.lineTo(-0.065, 0.01);
      f.quadraticCurveTo(-0.065, 0, -0.055, 0);
      f.closePath();
      return f;
    };
    const azul = peca(metade(), 0x3776ab);
    azul.position.set(0.02, 0.05, 0);
    const amarela = peca(metade(), 0xffd43b);
    amarela.rotation.z = Math.PI;
    amarela.position.set(0.0, 0.05 + 0.115, 0.004);
    // Olhinhos
    const olho = new THREE.SphereGeometry(0.004, 8, 6);
    const olhoAzul = new THREE.Mesh(olho, mat(0xffffff));
    olhoAzul.position.set(0.0, 0.05 + 0.065, 0.012);
    const olhoAmarelo = new THREE.Mesh(olho, mat(0xffffff));
    olhoAmarelo.position.set(0.0, 0.05 + 0.05, 0.016);
    g.add(azul, amarela, olhoAzul, olhoAmarelo);
    return g;
  }

  // Losango laranja do Git com os galhos desenhados na frente
  function losangoGit(nome) {
    const g = base(0.09, 0.045, 0.07, nome);
    const lado = 0.08;
    const bloco = caixa(lado, lado, 0.018, 0xf05032, 0.01);
    bloco.rotation.z = Math.PI / 4;
    bloco.position.y = 0.045 + (lado * Math.SQRT2) / 2;
    const frente = emblema(0.075, 0.075, (ctx, l, a) => {
      ctx.strokeStyle = "#fff";
      ctx.fillStyle = "#fff";
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(l * 0.32, a * 0.18);
      ctx.lineTo(l * 0.32, a * 0.82);
      ctx.moveTo(l * 0.32, a * 0.36);
      ctx.lineTo(l * 0.68, a * 0.6);
      ctx.stroke();
      for (const [x, y] of [[0.32, 0.18], [0.32, 0.82], [0.68, 0.6]]) {
        ctx.beginPath();
        ctx.arc(l * x, a * y, 24, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    frente.rotation.z = Math.PI / 4;
    frente.position.set(0, bloco.position.y, 0.0115);
    g.add(bloco, frente);
    return g;
  }

  // Banco de dados (SQL): três discos empilhados com aros dourados
  function bancoDeDados(nome) {
    const g = base(0.09, 0.04, 0.07, nome);
    for (let i = 0; i < 3; i++) {
      const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.03, 24), mat(0x3c7be8));
      disco.position.y = 0.058 + i * 0.034;
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.003, 6, 24), mat(0xf2c94c));
      aro.rotation.x = Math.PI / 2;
      aro.position.y = disco.position.y + 0.016;
      g.add(disco, aro);
    }
    return g;
  }

  return { prata, medalhaPendurada, chama, nuvem, cristal, escudo, quadradoJs, atomo, cobras, losangoGit, bancoDeDados };
}
