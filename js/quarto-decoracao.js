// =========================================================
// Quarto 3D · decoração
// Enfeites que deixam o quarto com a cara do Guilherme: futebol, games,
// tecnologia e lives. Alguns são interativos (clique neles):
//   TV            -> troca de canal (jogo de futebol / live)
//   Videogame     -> liga e a TV vai para a tela do jogo
//   Caixa de som  -> toca uma música lo-fi (barrinhas dançam junto)
//   Bola          -> dá uns quiques
//   Neon AO VIVO  -> acende e apaga
//   Abajur        -> acende e apaga
//
//   Parede da esquerda: canto gamer (TV passando um jogo, rack com console,
//                       controles, puff) e o letreiro neon "AO VIVO"
//   Parede da mesa:     microfone e webcam (lives), PC gamer com fans RGB,
//                       pôster "PRESS START", relógio e uma planta grande
//   Parede do fundo:    criados-mudos, cachecol na cama e bola no chão
//                       (o escudo do Criciúma em cima da cama fica no quarto-fundo.js)
//   Parede da direita:  prateleira com troféu e videogame portátil
//
// Para continuar leve: nenhuma luz nova. O que "brilha" (telas, neon,
// abajures) usa material que não recebe luz (MeshBasicMaterial).
// montarDecoracao() devolve animar(agora): o quarto.js chama a cada quadro e
// ela diz se ainda tem algo se mexendo (para pedir o próximo quadro).
// =========================================================

import { QUARTO } from "./quarto-fundo.js?v=16";
import { criarSom } from "./quarto-som.js?v=16";

export function montarDecoracao({ THREE, cena, caixa, mat, textura, materialTela, clicavel }) {
  const { esquerda, direita, frente, fundo } = QUARTO;

  // Peças presas numa parede são montadas "de frente" (olhando para +z)
  // e depois giradas para a parede certa.
  function naParede(lado, x, y, z) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = { frente: 0, fundo: Math.PI, esquerda: Math.PI / 2, direita: -Math.PI / 2 }[lado];
    cena.add(g);
    return g;
  }

  // Quadro com moldura e uma imagem desenhada no canvas
  function quadroNaParede(lado, x, y, z, largura, altura, desenhar, corMoldura = 0x0a0f1a) {
    const g = naParede(lado, x, y, z);
    const moldura = caixa(largura + 0.06, altura + 0.06, 0.035, corMoldura, 0.012);
    const imagem = textura(Math.round(largura * 600), Math.round(altura * 600), desenhar);
    const pintura = new THREE.Mesh(new THREE.PlaneGeometry(largura, altura), mat(0xffffff, { map: imagem.t }));
    pintura.position.z = 0.019;
    g.add(moldura, pintura);
    return g;
  }

  const brilha = (cor) => new THREE.MeshBasicMaterial({ color: cor });

  // =====================================================
  // Canto gamer (parede da esquerda)
  // =====================================================
  const Z_GAMER = 2.75;

  // TV passando um jogo de futebol "ao vivo"
  const tv = naParede("esquerda", esquerda + 0.06, 1.55, Z_GAMER);
  const bordaTv = caixa(1.66, 0.96, 0.06, 0x07090f, 0.02);
  // Cada canal é uma imagem desenhada uma vez só; trocar de canal só troca
  // qual imagem a tela mostra (não redesenha nada)
  const canais = {
    futebol: textura(1024, 576, desenharJogo).t,
    live: textura(1024, 576, desenharLive).t,
    game: textura(1024, 576, desenharGame).t,
  };
  const telaTv = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 0.89), materialTela(canais.futebol));
  telaTv.position.z = 0.031;
  tv.add(bordaTv, telaTv);
  let canal = "futebol";
  let videogameLigado = false;
  function mostrarCanal() {
    telaTv.material.map = canais[videogameLigado ? "game" : canal];
  }
  clicavel(tv, "tv", "<b>TV</b> · trocar de canal");
  tv.userData.aoClicar = () => {
    if (videogameLigado) return "A TV está no videogame. Desligue o videogame para voltar aos canais.";
    canal = canal === "futebol" ? "live" : "futebol";
    mostrarCanal();
    return canal === "futebol" ? "Canal: jogo do Criciúma." : "Canal: live de programação.";
  };

  // Letreiro neon "AO VIVO" em cima da TV
  const neon = textura(1024, 256, (ctx, l, a) => {
    ctx.clearRect(0, 0, l, a);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 150px sans-serif";
    // Brilho em volta (várias passadas com sombra) e o tubo por cima
    ctx.shadowColor = "#ff3b5c";
    for (const blur of [60, 30, 12]) {
      ctx.shadowBlur = blur;
      ctx.fillStyle = "#ff3b5c";
      ctx.fillText("● AO VIVO", l / 2, a / 2 + 6);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffd6de";
    ctx.fillText("● AO VIVO", l / 2, a / 2 + 6);
  });
  const placaNeon = naParede("esquerda", esquerda + 0.03, 2.5, Z_GAMER);
  const letreiro = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.325),
    new THREE.MeshBasicMaterial({ map: neon.t, transparent: true, depthWrite: false }),
  );
  placaNeon.add(letreiro);
  clicavel(placaNeon, "neon", "<b>Neon</b> · acender e apagar");
  placaNeon.userData.aoClicar = () => {
    const aceso = letreiro.material.opacity < 1;
    letreiro.material.opacity = aceso ? 1 : 0.18;
    return aceso ? "Neon aceso." : "Neon apagado.";
  };

  // Rack baixo com soundbar, console e dois controles
  const rack = naParede("esquerda", esquerda + 0.22, 0, Z_GAMER);
  const movel = caixa(2.0, 0.42, 0.42, 0x1b2438, 0.02);
  movel.position.y = 0.21;
  const frenteRack = caixa(1.9, 0.3, 0.02, 0x26324f, 0.01);
  frenteRack.position.set(0, 0.21, 0.21);
  const fitaRack = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.012, 0.01), brilha(0x5eead4));
  fitaRack.position.set(0, 0.02, 0.21);
  rack.add(movel, frenteRack, fitaRack);

  // Caixa de som (soundbar) com 12 barrinhas que dançam com a música
  const caixaSom = new THREE.Group();
  caixaSom.position.set(0, 0.46, 0.08);
  const corpoSom = caixa(1.0, 0.07, 0.1, 0x0d121d, 0.02);
  caixaSom.add(corpoSom);
  const materialBarra = brilha(0x5eead4);
  const geometriaBarra = new THREE.BoxGeometry(0.035, 1, 0.004);
  geometriaBarra.translate(0, 0.5, 0); // cresce de baixo para cima
  const barras = [];
  for (let i = 0; i < 12; i++) {
    const barra = new THREE.Mesh(geometriaBarra, materialBarra);
    barra.position.set(-0.33 + i * 0.06, -0.025, 0.052);
    barra.scale.y = 0.006;
    caixaSom.add(barra);
    barras.push(barra);
  }
  rack.add(caixaSom);
  const som = criarSom();
  clicavel(caixaSom, "caixa-de-som", "<b>Caixa de som</b> · tocar música");
  caixaSom.userData.aoClicar = () => {
    const tocando = som.alternar();
    caixaSom.userData.rotulo = tocando ? "<b>Caixa de som</b> · parar música" : "<b>Caixa de som</b> · tocar música";
    return tocando ? "Tocando uma música lo-fi (feita no navegador)." : "Música parada.";
  };

  const videogame = new THREE.Group();
  videogame.position.set(-0.68, 0.42, 0.02);
  const corpoConsole = caixa(0.36, 0.08, 0.28, 0xe9edf5, 0.02);
  corpoConsole.position.y = 0.04;
  const luzConsole = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.008, 0.005), brilha(0x4f8cff));
  luzConsole.position.set(0, 0.04, 0.142);
  videogame.add(corpoConsole, luzConsole);
  rack.add(videogame);
  luzConsole.material.color.set(0x1b2233); // começa desligado
  clicavel(videogame, "videogame", "<b>Videogame</b> · ligar");
  videogame.userData.aoClicar = () => {
    videogameLigado = !videogameLigado;
    luzConsole.material.color.set(videogameLigado ? 0x4f8cff : 0x1b2233);
    videogame.userData.rotulo = videogameLigado ? "<b>Videogame</b> · desligar" : "<b>Videogame</b> · ligar";
    mostrarCanal();
    vibrarAte = performance.now() + 450; // o controle do puff vibra
    return videogameLigado ? "Videogame ligado: a TV foi para o jogo." : "Videogame desligado.";
  };

  rack.add(controle(0x111827, 0.62, 0.43, 0.06, 0.3));
  rack.add(controle(0xff7a59, 0.4, 0.43, 0.1, -0.5));

  // Puff na frente da TV, com um controle em cima
  const puff = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), mat(0x3b4a7a));
  puff.scale.set(1, 0.6, 1);
  puff.position.set(-2.75, 0.25, Z_GAMER + 0.1);
  puff.castShadow = true;
  puff.receiveShadow = true;
  cena.add(puff);
  const controlePuff = controle(0xeef2fb, 0, 0, 0, 0.8);
  controlePuff.position.set(-2.7, 0.49, Z_GAMER + 0.05);
  controlePuff.rotation.x = -0.15;
  cena.add(controlePuff);
  let vibrarAte = 0;

  // Controle de videogame: corpo, duas "pegadas", analógicos e botões
  function controle(cor, x, y, z, giro) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = giro;
    const corpo = caixa(0.16, 0.03, 0.08, cor, 0.015);
    corpo.position.y = 0.015;
    g.add(corpo);
    for (const lado of [-1, 1]) {
      const pegada = caixa(0.05, 0.03, 0.08, cor, 0.015);
      pegada.position.set(lado * 0.07, 0.012, 0.035);
      pegada.rotation.y = lado * 0.4;
      const analogico = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 10), mat(0x2a2f3d));
      analogico.position.set(lado * 0.03, 0.034, 0.012);
      g.add(pegada, analogico);
    }
    return g;
  }

  // =====================================================
  // Parede da mesa: lives e PC
  // =====================================================
  // A mesa fica em z = -2,25 e a superfície em y ≈ 0,795 (ver quarto.js)
  const TOPO_MESA = 0.795;

  // Microfone de lives num pedestal de mesa, virado para a cadeira
  const microfone = new THREE.Group();
  microfone.position.set(-0.5, TOPO_MESA, -1.95);
  microfone.rotation.y = 0.35;
  const baseMic = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.018, 20), mat(0x111827));
  baseMic.position.y = 0.009;
  const hasteMic = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8), mat(0x2a2f3d));
  hasteMic.position.y = 0.11;
  const capsula = new THREE.Group();
  capsula.position.y = 0.26;
  capsula.rotation.x = 0.35;
  const corpoMic = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.13, 16), mat(0x1b2233));
  const grade = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x8a95ae));
  grade.position.y = 0.065;
  const anelMic = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.005, 6, 20), brilha(0xff3b5c));
  anelMic.rotation.x = Math.PI / 2;
  anelMic.position.y = 0.03;
  capsula.add(corpoMic, grade, anelMic);
  microfone.add(baseMic, hasteMic, capsula);
  microfone.traverse((o) => o.isMesh && (o.castShadow = true));
  cena.add(microfone);

  // Webcam em cima do monitor (o monitor fica em x 0, z -2,5)
  const webcam = new THREE.Group();
  webcam.position.set(0, TOPO_MESA + 1.0, -2.5);
  const corpoCam = caixa(0.11, 0.035, 0.04, 0x0d121d, 0.012);
  const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.01, 14), brilha(0x4f8cff));
  lente.rotation.x = Math.PI / 2;
  lente.position.z = 0.022;
  const luzCam = new THREE.Mesh(new THREE.SphereGeometry(0.004, 6, 6), brilha(0xff3b5c));
  luzCam.position.set(0.035, 0, 0.021);
  webcam.add(corpoCam, lente, luzCam);
  cena.add(webcam);

  // PC gamer no chão, ao lado da mesa, com o vidro lateral virado para o quarto
  const pc = new THREE.Group();
  pc.position.set(1.8, 0, -2.42);
  pc.rotation.y = 0.6; // vira o vidro um pouco para quem está no meio do quarto
  const gabinete = caixa(0.24, 0.5, 0.48, 0x0d121d, 0.015);
  gabinete.position.y = 0.25;
  const vidro = textura(480, 500, desenharFans);
  const ladoVidro = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.46), materialTela(vidro.t));
  ladoVidro.rotation.y = -Math.PI / 2;
  ladoVidro.position.set(-0.121, 0.25, 0);
  const frentePc = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.006, 0.006), brilha(0xb06cff));
  frentePc.position.set(0, 0.45, 0.241);
  pc.add(gabinete, ladoVidro, frentePc);
  cena.add(pc);

  // Pôster "PRESS START" entre a janela e a foto
  quadroNaParede("frente", -3.35, 1.9, frente + 0.02, 0.6, 0.82, desenharPressStart);

  // Relógio de parede, à direita da prateleira
  const relogio = naParede("frente", 3.45, 2.35, frente + 0.02);
  const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 32), mat(0xeef2fb));
  aro.rotation.x = Math.PI / 2;
  const mostrador = textura(256, 256, desenharRelogio);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.18, 32), mat(0xffffff, { map: mostrador.t }));
  face.position.z = 0.021;
  relogio.add(aro, face);

  // Planta grande no canto, entre a janela e a parede da mesa
  const plantaGrande = new THREE.Group();
  plantaGrande.position.set(-3.95, 0, -2.75);
  const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 20), mat(0xe9edf5));
  vaso.position.y = 0.2;
  plantaGrande.add(vaso);
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.7, 8), mat(0x4a3a2e));
  tronco.position.y = 0.72;
  plantaGrande.add(tronco);
  [
    [0, 1.2, 0, 0.26], [-0.2, 1.0, 0.1, 0.2], [0.2, 1.05, -0.05, 0.22],
    [0.08, 1.38, 0.08, 0.18], [-0.12, 1.32, -0.1, 0.17], [0.15, 0.85, 0.12, 0.16],
  ].forEach(([x, y, z, r], i) => {
    const folha = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(i % 2 ? 0x2f9a6c : 0x4fbf8b, { flatShading: true }));
    folha.position.set(x, y, z);
    plantaGrande.add(folha);
  });
  plantaGrande.traverse((o) => o.isMesh && (o.castShadow = true));
  cena.add(plantaGrande);

  // =====================================================
  // Parede do fundo: futebol
  // =====================================================
  // Criados-mudos dos dois lados da cama
  function criadoMudo(x) {
    const g = new THREE.Group();
    g.position.set(x, 0, fundo - 0.24);
    const movelCm = caixa(0.46, 0.5, 0.42, 0x33405f, 0.02);
    movelCm.position.y = 0.25;
    const gaveta = caixa(0.4, 0.16, 0.02, 0x3d4b6e, 0.01);
    gaveta.position.set(0, 0.34, -0.21);
    const puxador = caixa(0.1, 0.015, 0.02, 0xc9cfdb, 0.006);
    puxador.position.set(0, 0.34, -0.225);
    g.add(movelCm, gaveta, puxador);
    cena.add(g);
    return g;
  }

  // Esquerdo: abajur (brilho desenhado, sem luz de verdade) e despertador
  const cmEsquerdo = criadoMudo(-1.15);
  const baseAbajur = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.2, 16), mat(0xe9edf5));
  baseAbajur.position.y = 0.6;
  const cupula = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 0.15, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd9a8, side: THREE.DoubleSide }),
  );
  cupula.position.y = 0.78;
  const despertador = caixa(0.14, 0.07, 0.06, 0x111827, 0.012);
  despertador.position.set(0.13, 0.535, -0.08);
  const horas = textura(256, 128, (ctx, l, a) => {
    ctx.fillStyle = "#05080f";
    ctx.fillRect(0, 0, l, a);
    ctx.fillStyle = "#5eead4";
    ctx.font = "700 84px monospace";
    ctx.textAlign = "center";
    ctx.fillText("21:04", l / 2, 96);
  });
  const telaDespertador = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.05), materialTela(horas.t));
  telaDespertador.rotation.y = Math.PI;
  telaDespertador.position.set(0.13, 0.535, -0.111);
  cmEsquerdo.add(baseAbajur, cupula, despertador, telaDespertador);
  const abajur = new THREE.Group();
  cmEsquerdo.add(abajur);
  abajur.add(baseAbajur, cupula);
  clicavel(abajur, "abajur", "<b>Abajur</b> · acender e apagar");
  abajur.userData.aoClicar = () => {
    const aceso = cupula.material.color.getHex() !== 0xffd9a8;
    cupula.material.color.set(aceso ? 0xffd9a8 : 0x4a4f63);
    return aceso ? "Abajur aceso." : "Abajur apagado.";
  };

  // Direito: pilha de jogos e um controle
  const cmDireito = criadoMudo(1.15);
  [0x4f8cff, 0xff3b5c, 0x2f9a6c].forEach((cor, i) => {
    const jogoCaixa = caixa(0.14, 0.018, 0.18, cor, 0.004);
    jogoCaixa.position.set(-0.08, 0.51 + i * 0.019, 0.02);
    jogoCaixa.rotation.y = i * 0.15;
    cmDireito.add(jogoCaixa);
  });
  const controleCm = controle(0x111827, 0.1, 0.5, -0.05, 2.6);
  cmDireito.add(controleCm);

  // Cachecol listrado em cima do pé da cama (a cama vai de z 3,2 a 5,2)
  const listrasCachecol = textura(512, 64, (ctx, l, a) => {
    const cores = ["#ffd200", "#141414", "#ffffff", "#141414"];
    for (let x = 0; x < l; x += 32) {
      ctx.fillStyle = cores[(x / 32) % cores.length];
      ctx.fillRect(x, 0, 32, a);
    }
  });
  const materialCachecol = mat(0xffffff, { map: listrasCachecol.t });
  const cachecol = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.02, 0.18), materialCachecol);
  cachecol.position.set(0, 0.565, 3.55);
  cachecol.rotation.y = 0.05;
  cena.add(cachecol);
  for (const lado of [-1, 1]) {
    const ponta = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.18), materialCachecol);
    ponta.position.set(lado * 0.83, 0.41, 3.55 + lado * 0.04);
    cena.add(ponta);
  }

  // Bola de futebol no chão, perto da cama
  const gomos = textura(512, 256, desenharGomos);
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), mat(0xffffff, { map: gomos.t }));
  bola.position.set(1.25, 0.11, 2.75);
  bola.rotation.set(0.4, 0.8, 0);
  bola.castShadow = true;
  cena.add(bola);
  let quicouEm = -Infinity;
  clicavel(bola, "bola", "<b>Bola</b> · chutar");
  bola.userData.aoClicar = () => {
    quicouEm = performance.now();
    return "Quique!";
  };

  // =====================================================
  // Parede da direita: prateleira de conquistas
  // =====================================================
  const prateleira = naParede("direita", direita - 0.15, 1.45, 0.75);
  const tabua = caixa(1.2, 0.035, 0.26, 0x4a3a2e, 0.01);
  prateleira.add(tabua);

  // Troféu dourado
  const ouro = mat(0xf2c94c, { emissive: 0x3a2a00 });
  const trofeu = new THREE.Group();
  trofeu.position.set(-0.35, 0.018, 0);
  const pedestal = caixa(0.12, 0.05, 0.12, 0x1b2233, 0.008);
  pedestal.position.y = 0.025;
  const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 0.08, 12), ouro);
  pe.position.y = 0.09;
  const taca = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.03, 0.1, 20), ouro);
  taca.position.y = 0.18;
  for (const lado of [-1, 1]) {
    const alca = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 6, 12, Math.PI), ouro);
    alca.rotation.z = lado * Math.PI / 2;
    alca.position.set(lado * 0.065, 0.18, 0);
    trofeu.add(alca);
  }
  trofeu.add(pedestal, pe, taca);
  prateleira.add(trofeu);

  // Videogame portátil em pé
  const portatil = caixa(0.2, 0.11, 0.025, 0xeef2fb, 0.012);
  portatil.position.set(0.05, 0.075, -0.02);
  portatil.rotation.x = -0.15;
  const telaPortatil = textura(160, 96, (ctx, l, a) => {
    ctx.fillStyle = "#1b2742";
    ctx.fillRect(0, 0, l, a);
    ctx.fillStyle = "#ffd200";
    ctx.font = "700 26px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GG!", l / 2, 58);
  });
  const telinha = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.06), materialTela(telaPortatil.t));
  telinha.position.set(0.05, 0.075, -0.006);
  telinha.rotation.x = -0.15;
  prateleira.add(portatil, telinha);

  // Mini bola e um boneco (um "robozinho" de tecnologia)
  const miniBola = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), mat(0xffffff, { map: gomos.t }));
  miniBola.position.set(0.35, 0.068, 0);
  const robo = new THREE.Group();
  robo.position.set(0.5, 0.018, 0);
  const cabeca = caixa(0.07, 0.06, 0.06, 0x5eead4, 0.012);
  cabeca.position.y = 0.11;
  const corpoRobo = caixa(0.06, 0.07, 0.05, 0x4f8cff, 0.01);
  corpoRobo.position.y = 0.045;
  const olhos = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.002), brilha(0x0b1220));
  olhos.position.set(0, 0.115, 0.031);
  robo.add(cabeca, corpoRobo, olhos);
  prateleira.add(miniBola, robo);
  prateleira.traverse((o) => o.isMesh && (o.castShadow = true));

  // Quadro "GAME ON" acima da prateleira
  quadroNaParede("direita", direita - 0.02, 2.3, 0.75, 0.9, 0.5, desenharGameOn);

  // ===== Animações (chamada a cada quadro pelo quarto.js) =====
  // Devolve true enquanto alguma coisa se mexe.
  const Y_BOLA = 0.11;
  function animar(agora) {
    let mexendo = false;

    // Bola: 3 quiques que vão diminuindo, girando um pouco
    const t = (agora - quicouEm) / 1000;
    if (t < 1.4) {
      bola.position.y = Y_BOLA + Math.abs(Math.sin(t * Math.PI * 2.2)) * 0.45 * Math.exp(-t * 2.2);
      bola.rotation.z -= 0.08;
      mexendo = true;
    } else if (bola.position.y !== Y_BOLA) {
      bola.position.y = Y_BOLA;
    }

    // Controle do puff vibrando
    if (agora < vibrarAte) {
      controlePuff.rotation.z = Math.sin(agora * 0.09) * 0.05;
      mexendo = true;
    } else {
      controlePuff.rotation.z = 0;
    }
    return mexendo;
  }

  // Barrinhas da caixa de som: atualizadas por um relógio próprio, só com a
  // música tocando (não precisa redesenhar 60 vezes por segundo)
  function atualizarBarras() {
    const niveis = som.niveis(barras.length);
    barras.forEach((barra, i) => (barra.scale.y = 0.006 + niveis[i] * 0.09));
    return som.tocando;
  }

  return { animar, atualizarBarras, caixaSom: corpoSom }; // (uma malha, para testar se está na tela)
}

// =========================================================
// Desenhos em canvas
// =========================================================

// Jogo na TV: gramado listrado, linhas, jogadores e o placar
function desenharJogo(ctx, l, a) {
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i % 2 ? "#2f8f4e" : "#36a05a";
    ctx.fillRect((i * l) / 10, 0, l / 10 + 1, a);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 5;
  ctx.strokeRect(40, 40, l - 80, a - 80);
  ctx.beginPath();
  ctx.moveTo(l / 2, 40);
  ctx.lineTo(l / 2, a - 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(l / 2, a / 2, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(40, a / 2 - 110, 120, 220);
  ctx.strokeRect(l - 160, a / 2 - 110, 120, 220);
  // Jogadores: listrados de amarelo e preto contra os de branco
  const jogadores = [
    [300, 200, 1], [380, 330, 1], [470, 260, 1], [560, 180, 1], [610, 380, 1],
    [520, 300, 0], [650, 250, 0], [720, 340, 0], [800, 220, 0], [420, 420, 0],
  ];
  for (const [x, y, nosso] of jogadores) {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 16, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = nosso ? "#ffd200" : "#f4f6fb";
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = nosso ? "#141414" : "#3c7be8";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(585, 205, 7, 0, Math.PI * 2);
  ctx.fill();
  // Placar
  ctx.fillStyle = "rgba(8,12,20,0.88)";
  ctx.beginPath();
  ctx.roundRect(56, 54, 330, 54, 10);
  ctx.fill();
  ctx.font = "800 30px sans-serif";
  ctx.fillStyle = "#ffd200";
  ctx.fillText("CRI", 76, 92);
  ctx.fillStyle = "#fff";
  ctx.fillText("2 × 1", 150, 92);
  ctx.fillText("VIS", 250, 92);
  ctx.fillStyle = "#8a95ae";
  ctx.font = "600 22px sans-serif";
  ctx.fillText("78'", 330, 90);
  // Selo "AO VIVO"
  ctx.fillStyle = "#e11d48";
  ctx.beginPath();
  ctx.roundRect(l - 210, 54, 150, 46, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 24px sans-serif";
  ctx.fillText("● AO VIVO", l - 196, 85);
}

// Canal "live": uma tela de transmissão com câmera, código e chat
function desenharLive(ctx, l, a) {
  ctx.fillStyle = "#0e1424";
  ctx.fillRect(0, 0, l, a);
  // Editor de código ocupando a maior parte
  ctx.fillStyle = "#121b2e";
  ctx.fillRect(24, 24, 690, a - 48);
  const linhas = [
    ["#ff7a59", "function sorteio(lista) {"],
    ["#eef2fb", "  const i = Math.floor("],
    ["#eef2fb", "    Math.random() * lista.length"],
    ["#eef2fb", "  );"],
    ["#eef2fb", "  return lista[i];"],
    ["#ff7a59", "}"],
    ["#8a95ae", "// próximo: tela de cadastro"],
  ];
  ctx.font = "26px monospace";
  linhas.forEach(([cor, texto], i) => {
    ctx.fillStyle = "#3a4766";
    ctx.fillText(String(i + 1), 44, 84 + i * 44);
    ctx.fillStyle = cor;
    ctx.fillText(texto, 90, 84 + i * 44);
  });
  // Câmera (silhueta) no canto
  ctx.fillStyle = "#1b2742";
  ctx.fillRect(740, 24, 260, 170);
  ctx.fillStyle = "#3a4766";
  ctx.beginPath();
  ctx.arc(870, 95, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(870, 190, 70, 50, 0, Math.PI, 0);
  ctx.fill();
  // Chat
  ctx.fillStyle = "#121b2e";
  ctx.fillRect(740, 210, 260, a - 234);
  const chat = [["#5eead4", "ana", "boa noite!"], ["#ffb547", "leo", "que projeto é?"], ["#b06cff", "bia", "gg"], ["#ff7a59", "rafa", "manda o link"]];
  ctx.font = "20px sans-serif";
  chat.forEach(([cor, nome, msg], i) => {
    ctx.fillStyle = cor;
    ctx.fillText(nome, 756, 250 + i * 64);
    ctx.fillStyle = "#b9c2d6";
    ctx.fillText(msg, 756, 276 + i * 64);
  });
  // Selo AO VIVO
  ctx.fillStyle = "#e11d48";
  ctx.beginPath();
  ctx.roundRect(752, 36, 120, 36, 6);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 20px sans-serif";
  ctx.fillText("● AO VIVO", 764, 61);
}

// Tela do videogame: um jogo de plataforma em pixels
function desenharGame(ctx, l, a) {
  const ceu = ctx.createLinearGradient(0, 0, 0, a);
  ceu.addColorStop(0, "#4f8cff");
  ceu.addColorStop(1, "#9fd3ff");
  ctx.fillStyle = ceu;
  ctx.fillRect(0, 0, l, a);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  [[160, 110], [520, 80], [820, 140]].forEach(([x, y]) => {
    ctx.fillRect(x, y, 120, 28);
    ctx.fillRect(x + 24, y - 20, 70, 24);
  });
  // Chão de blocos
  for (let x = 0; x < l; x += 48) {
    ctx.fillStyle = "#2f8f4e";
    ctx.fillRect(x, a - 110, 48, 18);
    ctx.fillStyle = "#8a5a3c";
    ctx.fillRect(x, a - 92, 48, 92);
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.strokeRect(x, a - 92, 48, 46);
  }
  // Plataformas e moedas
  ctx.fillStyle = "#c97b4a";
  ctx.fillRect(360, 300, 192, 36);
  ctx.fillRect(660, 220, 144, 36);
  ctx.fillStyle = "#ffd200";
  [[400, 270], [450, 270], [500, 270], [700, 190], [750, 190]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // Personagem (um bonequinho coral)
  ctx.fillStyle = "#ff7a59";
  ctx.fillRect(200, a - 170, 36, 44);
  ctx.fillStyle = "#ffe2c4";
  ctx.fillRect(204, a - 196, 28, 26);
  ctx.fillStyle = "#141414";
  ctx.fillRect(222, a - 188, 5, 6);
  // Placar do jogo
  ctx.fillStyle = "#141414";
  ctx.font = "800 30px monospace";
  ctx.fillText("MOEDAS 07   VIDAS 3   FASE 1-2", 40, 50);
}

// Vidro do PC: três fans com anéis coloridos
function desenharFans(ctx, l, a) {
  ctx.fillStyle = "#070a12";
  ctx.fillRect(0, 0, l, a);
  const cores = [["#b06cff", "#4f8cff"], ["#4f8cff", "#5eead4"], ["#ff7a59", "#b06cff"]];
  cores.forEach(([c1, c2], i) => {
    const x = l / 2;
    const y = 90 + i * 160;
    const g = ctx.createLinearGradient(x - 70, y - 70, x + 70, y + 70);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.strokeStyle = g;
    ctx.lineWidth = 14;
    ctx.shadowColor = c1;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(x, y, 62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Pás da hélice
    ctx.fillStyle = "#1b2233";
    for (let p = 0; p < 7; p++) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((p * Math.PI * 2) / 7);
      ctx.beginPath();
      ctx.ellipse(0, -30, 12, 26, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#2a2f3d";
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
  });
  // Reflexo do vidro
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(l * 0.5, 0);
  ctx.lineTo(0, a * 0.5);
  ctx.fill();
}

// Pôster de game retrô: "PRESS START" com um controle em pixels
function desenharPressStart(ctx, l, a) {
  const g = ctx.createLinearGradient(0, 0, 0, a);
  g.addColorStop(0, "#2a1650");
  g.addColorStop(1, "#0b1220");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, l, a);
  // Grade de "chão" em perspectiva, estilo anos 80
  ctx.strokeStyle = "rgba(255,59,92,0.5)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const y = a * 0.62 + i * i * 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(l, y);
    ctx.stroke();
  }
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(l / 2 + i * 10, a * 0.62);
    ctx.lineTo(l / 2 + i * 70, a);
    ctx.stroke();
  }
  // Controle em pixels
  const px = 14;
  const desenho = [
    "..XXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXX.",
    "XX.XXXXXXXXX.XXX",
    "X...XXXXXXX.X.XX",
    "XX.XXXXXXXXX.XXX",
    "XXXXXX....XXXXXX",
    "XXXX........XXXX",
  ];
  const x0 = l / 2 - (desenho[0].length * px) / 2;
  desenho.forEach((linha, y) =>
    [...linha].forEach((c, x) => {
      if (c !== "X") return;
      ctx.fillStyle = "#5eead4";
      ctx.fillRect(x0 + x * px, 120 + y * px, px - 1, px - 1);
    }),
  );
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd200";
  ctx.font = "900 46px monospace";
  ctx.fillText("PRESS", l / 2, a * 0.43);
  ctx.fillText("START", l / 2, a * 0.43 + 50);
  ctx.fillStyle = "#ff3b5c";
  ctx.font = "700 20px monospace";
  ctx.fillText("▶ 1 PLAYER", l / 2, a * 0.58);
}

// Relógio marcando 21:04 (a mesma hora do celular)
function desenharRelogio(ctx, l, a) {
  ctx.fillStyle = "#f4f6fb";
  ctx.fillRect(0, 0, l, a);
  ctx.translate(l / 2, a / 2);
  ctx.fillStyle = "#1b2233";
  for (let i = 0; i < 12; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 6);
    ctx.fillRect(-3, -110, 6, i % 3 ? 12 : 22);
    ctx.restore();
  }
  const ponteiro = (angulo, comprimento, largura, cor) => {
    ctx.save();
    ctx.rotate(angulo);
    ctx.fillStyle = cor;
    ctx.fillRect(-largura / 2, -comprimento, largura, comprimento + 12);
    ctx.restore();
  };
  ponteiro(((9 + 4 / 60) * Math.PI) / 6, 62, 9, "#1b2233");
  ponteiro((4 * Math.PI) / 30, 92, 6, "#1b2233");
  ctx.fillStyle = "#ff7a59";
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Gomos da bola (mapa que envolve a esfera)
function desenharGomos(ctx, l, a) {
  ctx.fillStyle = "#f4f6fb";
  ctx.fillRect(0, 0, l, a);
  ctx.fillStyle = "#141414";
  const pentagono = (x, y, r) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
    }
    ctx.closePath();
    ctx.fill();
  };
  for (let i = 0; i < 6; i++) {
    pentagono(i * 86 + 20, 64, 26);
    pentagono(i * 86 + 63, 180, 26);
  }
  pentagono(l / 2, 4, 40);
  pentagono(l / 2, a - 4, 40);
}

// Quadro "GAME ON" com um controle desenhado
function desenharGameOn(ctx, l, a) {
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, l, a);
  ctx.scale(l / 680, a / 320); // desenhado numa área de 680 × 320
  ctx.strokeStyle = "#5eead4";
  ctx.lineWidth = 10;
  ctx.lineJoin = "round";
  // Contorno de um controle
  ctx.beginPath();
  ctx.moveTo(70, 110);
  ctx.quadraticCurveTo(90, 70, 160, 80);
  ctx.lineTo(220, 80);
  ctx.quadraticCurveTo(290, 70, 310, 110);
  ctx.quadraticCurveTo(350, 220, 300, 230);
  ctx.quadraticCurveTo(270, 232, 240, 180);
  ctx.lineTo(140, 180);
  ctx.quadraticCurveTo(110, 232, 80, 230);
  ctx.quadraticCurveTo(30, 220, 70, 110);
  ctx.stroke();
  ctx.fillStyle = "#5eead4";
  ctx.fillRect(105, 118, 40, 12);
  ctx.fillRect(119, 104, 12, 40);
  ctx.fillStyle = "#ff7a59";
  ctx.beginPath();
  ctx.arc(250, 115, 9, 0, Math.PI * 2);
  ctx.arc(272, 135, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#eef2fb";
  ctx.font = "900 92px sans-serif";
  ctx.fillText("GAME", 360, 150);
  ctx.fillStyle = "#ff7a59";
  ctx.fillText("ON", 360, 245);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
