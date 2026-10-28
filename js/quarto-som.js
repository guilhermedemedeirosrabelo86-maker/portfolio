// =========================================================
// Quarto 3D · música da caixa de som
// Uma batida "lo-fi" bem simples, criada na hora com a Web Audio API
// (sem arquivo de música para baixar). Toca só depois de um clique,
// como os navegadores exigem.
//
//   const som = criarSom();
//   som.alternar()   -> liga ou desliga (devolve true se ficou tocando)
//   som.niveis(8)    -> 8 números de 0 a 1 com a "altura" de cada faixa
//                       de frequência agora (para as barrinhas da caixa)
// =========================================================

// Acordes (em Hz): Lá menor 7, Fá maior 7, Dó maior e Sol maior
const ACORDES = [
  [220.0, 261.63, 329.63, 392.0],
  [174.61, 220.0, 261.63, 329.63],
  [130.81, 196.0, 261.63, 329.63],
  [146.83, 196.0, 246.94, 293.66],
];
const BPM = 78;
const TEMPO = 60 / BPM / 2; // duração de uma colcheia, em segundos

export function criarSom() {
  let ctx = null;
  let saida = null;
  let analisador = null;
  let dados = null;
  let tocando = false;
  let passo = 0;
  let proximo = 0;
  let relogio = null;

  // Monta o "estúdio" só no primeiro clique
  function preparar() {
    ctx = new AudioContext();
    analisador = ctx.createAnalyser();
    analisador.fftSize = 64;
    dados = new Uint8Array(analisador.frequencyBinCount);
    saida = ctx.createGain();
    saida.gain.value = 0.14; // volume baixo, de fundo
    saida.connect(analisador);
    analisador.connect(ctx.destination);
  }

  // Uma nota com ataque e saída suaves
  function nota(freq, inicio, duracao, tipo, volume) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = tipo;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, inicio);
    env.gain.linearRampToValueAtTime(volume, inicio + 0.03);
    env.gain.exponentialRampToValueAtTime(0.001, inicio + duracao);
    osc.connect(env).connect(saida);
    osc.start(inicio);
    osc.stop(inicio + duracao + 0.05);
  }

  // Bumbo: um "tum" que desce de tom rapidinho
  function bumbo(inicio) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.setValueAtTime(140, inicio);
    osc.frequency.exponentialRampToValueAtTime(45, inicio + 0.12);
    env.gain.setValueAtTime(0.9, inicio);
    env.gain.exponentialRampToValueAtTime(0.001, inicio + 0.25);
    osc.connect(env).connect(saida);
    osc.start(inicio);
    osc.stop(inicio + 0.3);
  }

  // Chimbal: um chiado curtinho (ruído filtrado)
  function chimbal(inicio) {
    const tamanho = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, tamanho, ctx.sampleRate);
    const canal = buffer.getChannelData(0);
    for (let i = 0; i < tamanho; i++) canal[i] = (Math.random() * 2 - 1) * (1 - i / tamanho);
    const fonte = ctx.createBufferSource();
    fonte.buffer = buffer;
    const filtro = ctx.createBiquadFilter();
    filtro.type = "highpass";
    filtro.frequency.value = 7000;
    const env = ctx.createGain();
    env.gain.value = 0.18;
    fonte.connect(filtro).connect(env).connect(saida);
    fonte.start(inicio);
  }

  // Agenda as notas um pouquinho antes da hora (o jeito certo de fazer
  // ritmo no navegador: o setInterval sozinho atrasa e "manca")
  function agendar() {
    while (proximo < ctx.currentTime + 0.2) {
      const compasso = Math.floor(passo / 8) % ACORDES.length;
      const naBatida = passo % 8;
      if (naBatida === 0) ACORDES[compasso].forEach((f) => nota(f, proximo, TEMPO * 7.5, "triangle", 0.08));
      if (naBatida === 0 || naBatida === 5) bumbo(proximo);
      if (naBatida % 2 === 1) chimbal(proximo);
      if (naBatida === 2 || naBatida === 6) nota(ACORDES[compasso][3] * 2, proximo, TEMPO * 1.5, "sine", 0.05);
      proximo += TEMPO;
      passo++;
    }
  }

  function alternar() {
    if (!ctx) preparar();
    tocando = !tocando;
    if (tocando) {
      ctx.resume();
      proximo = ctx.currentTime + 0.05;
      relogio = setInterval(agendar, 50);
    } else {
      clearInterval(relogio);
      ctx.suspend();
    }
    return tocando;
  }

  // Aba escondida: pausa o som junto (e volta ao reabrir)
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !tocando) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });

  function niveis(quantos) {
    if (!tocando) return new Array(quantos).fill(0);
    analisador.getByteFrequencyData(dados);
    return Array.from({ length: quantos }, (_, i) => dados[i + 1] / 255);
  }

  return { alternar, niveis, get tocando() { return tocando; } };
}
