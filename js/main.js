// =========================================================
// Portfólio · Guilherme Rabelo
// Tudo o que o site faz de "dinâmico" está aqui.
// O script é carregado com "defer", então ele roda depois que o HTML
// já foi lido e todos os elementos existem.
// =========================================================

// O usuário pediu "menos movimento" nas configurações do sistema?
const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Entrada da página ----------
// Espera as fontes carregarem (para o texto não "pular") e coloca a classe
// "pronto" no <html>. O CSS usa essa classe para animar as peças com .entrada.
// Se a tela de boas-vindas estiver ligada, espera ela começar a sair.
function iniciarEntrada() {
  const raiz = document.documentElement;
  let feito = false;
  function mostrar() {
    if (feito) return;
    feito = true;
    // Ler offsetHeight obriga o navegador a calcular o estado inicial (escondido)
    // antes de trocarmos a classe; assim a transição acontece.
    void raiz.offsetHeight;
    setTimeout(() => raiz.classList.add("pronto"), 30);
  }

  if (raiz.classList.contains("abrindo")) {
    iniciarAbertura(mostrar);
    return;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mostrar);
  setTimeout(mostrar, 700); // se as fontes demorarem, mostra assim mesmo
}

// ---------- Tela de boas-vindas ----------
// Conta de 0 a 100 em cerca de 1,6 s. O número só chega a 100 quando a
// página terminou de carregar (fontes e foto); até lá ele para em 92.
// No 100 a tela sobe como uma cortina e o topo do site entra por baixo.
function iniciarAbertura(quandoSair) {
  const raiz = document.documentElement;
  const tela = document.querySelector(".abertura");
  if (!tela) {
    raiz.classList.remove("abrindo");
    quandoSair();
    return;
  }
  const numero = tela.querySelector("[data-contador]");
  const barra = tela.querySelector(".abertura-barra");
  const duracao = 1600;
  const inicio = performance.now();

  let carregou = false;
  const carregar = () => (carregou = true);
  if (document.readyState === "complete") carregar();
  else window.addEventListener("load", carregar);
  setTimeout(carregar, 4000); // internet lenta: não prende a pessoa aqui

  // Começa rápido e vai freando perto do fim
  const frear = (t) => 1 - Math.pow(1 - t, 3);

  function quadro(agora) {
    const tempo = Math.min((agora - inicio) / duracao, 1);
    let progresso = frear(tempo);
    if (!carregou) progresso = Math.min(progresso, 0.92);

    numero.textContent = Math.round(progresso * 100);
    barra.style.transform = `scaleX(${progresso})`;

    if (progresso < 1) {
      requestAnimationFrame(quadro);
    } else {
      setTimeout(sair, 250); // segura o "100" um instante na tela
    }
  }

  function sair() {
    try {
      sessionStorage.setItem("abertura-vista", "sim");
    } catch (erro) {}
    tela.classList.add("saindo");
    setTimeout(quandoSair, 350); // o topo começa a entrar enquanto a cortina sobe
    // Quando a cortina termina de subir: destrava a rolagem e some com a tela.
    // O setTimeout garante isso mesmo se o "transitionend" não vier (aba em segundo plano).
    const terminar = () => raiz.classList.remove("abrindo");
    tela.addEventListener("transitionend", terminar, { once: true });
    setTimeout(terminar, 1200);
  }

  requestAnimationFrame(quadro);
}

// ---------- Menu do celular ----------
// O botão mostra e esconde o menu. aria-expanded avisa leitores de tela
// se o menu está aberto (e o CSS usa isso para virar as linhas em X).
function iniciarMenu() {
  const botao = document.querySelector(".botao-menu");
  const menu = document.getElementById("menu-celular");
  if (!botao || !menu) return;

  function abrirOuFechar(abrir) {
    menu.hidden = !abrir;
    botao.setAttribute("aria-expanded", String(abrir));
    botao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
  }

  botao.addEventListener("click", () => abrirOuFechar(menu.hidden));

  // Clicou num link do menu: fecha o menu.
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => abrirOuFechar(false));
  });
}

// ---------- Navbar ----------
// 1. Ganha fundo depois que a página rola um pouco.
// 2. Uma pílula desliza até o link da seção que está no meio da tela.
function iniciarNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  aoRolar(() => navbar.classList.toggle("rolou", window.scrollY > 8));

  const indicador = document.querySelector(".menu-indicador");
  const links = [...document.querySelectorAll(".menu-desktop a[href^='#']")];
  if (!indicador || links.length === 0 || !("IntersectionObserver" in window)) return;

  let ativo = null;

  function moverPara(link) {
    ativo = link;
    links.forEach((l) => l.classList.toggle("ativo", l === link));
    if (!link) {
      indicador.style.opacity = "0";
      return;
    }
    indicador.style.opacity = "1";
    indicador.style.width = `${link.offsetWidth}px`;
    indicador.style.transform = `translateX(${link.offsetLeft}px)`;
  }

  // Observa uma faixa fina no meio da tela: a seção que passa por ela é a "atual".
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        const link = links.find((l) => l.getAttribute("href") === `#${entrada.target.id}`);
        if (entrada.isIntersecting) moverPara(link);
        else if (ativo === link) moverPara(null);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );

  links.forEach((link) => {
    const secao = document.querySelector(link.getAttribute("href"));
    if (secao) observador.observe(secao);
  });

  window.addEventListener("resize", () => ativo && moverPara(ativo));
}

// ---------- Barra de progresso da rolagem ----------
// Vai de 0 (topo da página) até 1 (final) e estica a barrinha com scaleX.
function iniciarBarraProgresso() {
  const barra = document.querySelector(".barra-progresso");
  if (!barra) return;

  aoRolar(() => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    const progresso = total > 0 ? doc.scrollTop / total : 0;
    barra.style.transform = `scaleX(${progresso})`;
  });
}

// ---------- Títulos que sobem de dentro de uma máscara ----------
// Coloca o texto do título dentro de <span class="linha"><span>…</span></span>.
// O CSS esconde o texto embaixo da "linha" e ele sobe quando o bloco aparece.
function iniciarTitulos() {
  document.querySelectorAll(".secao-cabeca h2").forEach((titulo) => {
    titulo.classList.add("dividido");
    titulo.innerHTML = `<span class="linha"><span>${titulo.innerHTML}</span></span>`;
  });
}

// ---------- Bola que segue o mouse em alguns títulos ----------
// Nos textos com data-bola, aparece uma bola coral que segue o mouse e
// inverte as cores (o efeito de cor é do CSS: mix-blend-mode).
// Só em computador com mouse e para quem não pediu "menos movimento".
function iniciarBola() {
  const temMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const alvos = document.querySelectorAll("[data-bola] .linha > span, [data-bola] .letras");
  if (!temMouse || menosMovimento || alvos.length === 0) return;

  const bola = document.createElement("div");
  bola.className = "bola";
  bola.setAttribute("aria-hidden", "true");
  bola.innerHTML = "<span></span>";
  document.body.append(bola);

  // Onde o mouse está (mouseX/mouseY) e onde a bola está (x/y).
  // A cada quadro a bola anda 20% do caminho até o mouse: por isso ela
  // "persegue" o cursor com um atraso suave, em vez de grudar nele.
  let mouseX = 0;
  let mouseY = 0;
  let x = 0;
  let y = 0;
  let primeiraVez = true;
  let andando = false;

  function seguir() {
    x += (mouseX - x) * 0.2;
    y += (mouseY - y) * 0.2;
    bola.style.transform = `translate(${x}px, ${y}px)`;
    // Para de animar quando já chegou (não gasta processamento à toa)
    if (Math.abs(mouseX - x) > 0.1 || Math.abs(mouseY - y) > 0.1) {
      requestAnimationFrame(seguir);
    } else {
      andando = false;
    }
  }

  window.addEventListener("mousemove", (evento) => {
    mouseX = evento.clientX;
    mouseY = evento.clientY;
    if (primeiraVez) {
      // Na primeira vez a bola já nasce no mouse, sem atravessar a tela
      x = mouseX;
      y = mouseY;
      primeiraVez = false;
    }
    if (!andando) {
      andando = true;
      requestAnimationFrame(seguir);
    }
  }, { passive: true });

  alvos.forEach((alvo) => {
    alvo.addEventListener("mouseenter", () => bola.classList.add("ativa"));
    alvo.addEventListener("mouseleave", () => bola.classList.remove("ativa"));
  });
}

// ---------- Saída do topo ----------
// Conforme o Sobre cobre o Início, --saida vai de 0 a 1. O CSS usa esse número
// para encolher e escurecer o Início, subir e apagar o texto e subir a foto
// mais devagar.
function iniciarSaidaTopo() {
  const topo = document.querySelector(".hero");
  if (!topo) return;

  // Onde o Início "prende". Se ele for mais alto que a tela (celular), prende
  // com o topo para fora (valor negativo), só quando o fim dele chega embaixo.
  // Assim dá para ver o Início inteiro antes de o Sobre cobrir.
  function calcularTopo() {
    const sobra = window.innerHeight - topo.offsetHeight;
    topo.style.setProperty("--topo-preso", `${Math.min(0, sobra)}px`);
  }
  calcularTopo();
  window.addEventListener("resize", calcularTopo);
  window.addEventListener("load", calcularTopo); // depois da foto carregar

  if (menosMovimento) return;
  aoRolar(() => {
    const p = Math.min(Math.max(window.scrollY / topo.offsetHeight, 0), 1);
    topo.style.setProperty("--saida", p.toFixed(3));
  });
}

// ---------- Transições entre seções ----------
// Para cada seção com data-transicao, calcula --t: 0 quando o topo dela
// aparece embaixo da tela e 1 quando o topo já subiu uns 75% da tela.
// O CSS usa --t para abrir o cartão dos Projetos e crescer o círculo do Contato.
function iniciarTransicoes() {
  const secoes = document.querySelectorAll("[data-transicao]");
  if (secoes.length === 0 || menosMovimento) return;
  aoRolar(() => {
    secoes.forEach((secao) => {
      const topo = secao.getBoundingClientRect().top;
      const t = Math.min(Math.max((window.innerHeight - topo) / (window.innerHeight * 0.75), 0), 1);
      secao.style.setProperty("--t", t.toFixed(3));
    });
  });
}

// ---------- Cascata ----------
// Em vez de o bloco inteiro aparecer de uma vez, cada linha aparece um
// pouquinho depois da anterior. Só prepara os atributos: quem anima é o
// iniciarRevelar (por isso esta função roda antes dele).
function iniciarCascata() {
  document.querySelectorAll("[data-cascata]").forEach((bloco) => {
    const itens = bloco.matches("ul") ? bloco.children : bloco.querySelectorAll("h3, li");
    [...itens].forEach((item, i) => {
      item.classList.add("cascata");
      item.setAttribute("data-reveal", "");
      item.dataset.delay = String(i * 70);
    });
  });
}

// ---------- Título do contato letra por letra ----------
// Separa o título em palavras e as palavras em letras. Cada letra ganha um
// número (--n) que o CSS usa como atraso: assim elas sobem uma depois da outra.
// As palavras ficam inteiras (não quebram no meio) e a frase completa vai num
// aria-label, para leitores de tela não lerem letra por letra.
function iniciarLetras() {
  const titulo = document.querySelector(".contato-titulo");
  if (!titulo) return;
  const texto = titulo.textContent.trim();
  let n = 0;
  const palavras = texto.split(" ").map((palavra) => {
    const letras = [...palavra].map((letra) => `<span class="letra" style="--n: ${n++}">${letra}</span>`).join("");
    return `<span class="palavra-letras">${letras}</span>`;
  });
  titulo.setAttribute("aria-label", texto);
  titulo.innerHTML = `<span class="letras" aria-hidden="true">${palavras.join(" ")}</span>`;
}

// ---------- Botão "voltar ao topo" ----------
// Aparece depois de rolar mais da metade da primeira tela e o anel em volta
// mostra quanto da página já foi lida (--progresso de 0 a 1).
function iniciarVoltarTopo() {
  const botao = document.querySelector(".voltar-topo");
  if (!botao) return;
  aoRolar(() => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    const progresso = total > 0 ? doc.scrollTop / total : 0;
    botao.style.setProperty("--progresso", progresso.toFixed(3));
    botao.classList.toggle("visivel", doc.scrollTop > window.innerHeight * 0.6);
  });
}

// ---------- Print do projeto que se endireita ao rolar ----------
// Quando entra na tela ele está deitado para trás e menor; conforme sobe,
// fica reto e no tamanho normal.
function iniciarVitrine() {
  const vitrine = document.querySelector("[data-vitrine]");
  if (!vitrine || menosMovimento) return;
  const janela = vitrine.querySelector(".vitrine-janela");

  aoRolar(() => {
    const topo = vitrine.getBoundingClientRect().top;
    const progresso = (window.innerHeight - topo) / (window.innerHeight * 0.75);
    const p = Math.min(Math.max(progresso, 0), 1); // entre 0 e 1
    janela.style.setProperty("--inclinacao", `${((1 - p) * 24).toFixed(2)}deg`);
    janela.style.setProperty("--escala", (0.9 + 0.1 * p).toFixed(3));
  });
}

// ---------- Lista de projetos com prévia ----------
// Passar o mouse (ou o foco do teclado) num projeto marca ele como ativo,
// troca a tela da prévia e a frase embaixo dela.
function iniciarSeletor() {
  const seletor = document.querySelector("[data-seletor]");
  if (!seletor) return;
  const itens = seletor.querySelectorAll(".seletor-item");
  const telas = seletor.querySelectorAll(".previa-moldura > *");
  const legenda = seletor.querySelector(".previa-legenda");
  const legendas = JSON.parse(legenda.dataset.legendas);
  let atual = 0;

  function ativar(i) {
    if (i === atual) return;
    // A tela que estava na frente vira "anterior" (fica embaixo) e a nova
    // entra por cima com a animação de varrer (ver .ativa no CSS).
    telas.forEach((tela, n) => {
      tela.classList.toggle("anterior", n === atual);
      tela.classList.toggle("ativa", n === i);
    });
    itens.forEach((item, n) => item.classList.toggle("ativo", n === i));
    legenda.textContent = legendas[i];
    atual = i;
  }

  // A prévia só aparece no computador; no celular nenhum item começa marcado
  if (window.matchMedia("(min-width: 1024px)").matches) itens[0].classList.add("ativo");
  itens.forEach((item, i) => {
    item.addEventListener("mouseenter", () => ativar(i));
    item.addEventListener("focus", () => ativar(i));
  });
}

// ---------- Detalhe do projeto (a folha que sobe) ----------
// Todo link para #central-brindes, #meu-predio etc. abre o <dialog> do
// projeto em vez de rolar a página. Vale para a lista e para a tabela de Skills.
function iniciarDetalhes() {
  const detalhes = document.querySelectorAll(".detalhe");
  if (!detalhes.length) return;

  function abrir(detalhe) {
    if (detalhe.open) return;
    detalhe.showModal(); // modal: prende o foco dentro e o Esc fecha
    // O foco vai para a folha (e não para o X), para não aparecer o anel de foco no X
    detalhe.focus();
    detalhe.scrollTop = 0;
    history.replaceState(null, "", `#${detalhe.id}`); // endereço compartilhável
  }

  function fechar(detalhe) {
    if (!detalhe.open || detalhe.classList.contains("fechando")) return;
    history.replaceState(null, "", "#projetos");
    if (menosMovimento) {
      detalhe.close();
      return;
    }
    // Primeiro desce (animação do CSS), depois fecha de verdade
    detalhe.classList.add("fechando");
    detalhe.addEventListener("animationend", () => {
      detalhe.classList.remove("fechando");
      detalhe.close();
    }, { once: true });
  }

  document.addEventListener("click", (evento) => {
    const link = evento.target.closest('a[href^="#"]');
    if (!link) return;
    const alvo = document.getElementById(link.getAttribute("href").slice(1));
    if (alvo && alvo.classList.contains("detalhe")) {
      evento.preventDefault();
      abrir(alvo);
    }
  });

  detalhes.forEach((detalhe) => {
    detalhe.querySelector(".detalhe-fechar").addEventListener("click", () => fechar(detalhe));
    // Esc: em vez de fechar seco, usa a mesma animação do botão
    detalhe.addEventListener("cancel", (evento) => {
      evento.preventDefault();
      fechar(detalhe);
    });
    // Clique no fundo escuro (acima da folha) também fecha
    detalhe.addEventListener("click", (evento) => {
      if (evento.target === detalhe && evento.clientY < detalhe.getBoundingClientRect().top) fechar(detalhe);
    });
  });

  // Quem chega com o endereço .../#meu-predio já vê o detalhe aberto
  const inicial = document.getElementById(location.hash.slice(1));
  if (inicial && inicial.classList.contains("detalhe")) abrir(inicial);
}

// ---------- Carrossel do Meu Prédio ----------
// Quem arrasta é o próprio navegador (scroll-snap no CSS). Aqui o JS só:
// 1) descobre qual print está na tela e marca o nome, o pontinho e a pílula;
// 2) faz as pílulas (no computador) rolarem até o print certo.
function iniciarGaleria() {
  const galeria = document.querySelector("[data-galeria]");
  if (!galeria) return;
  const trilho = galeria.querySelector(".galeria-trilho");
  const nome = galeria.querySelector(".galeria-nome");
  const pontos = galeria.querySelectorAll(".galeria-pontos i");
  const botoes = galeria.querySelectorAll(".galeria-botoes button");

  function marcar() {
    // A galeria fica dentro do detalhe do Meu Prédio. Fechado, ele não tem
    // largura, e aí não dá para calcular nada.
    if (!trilho.clientWidth) return;
    // Cada print ocupa a largura inteira do trilho, então a posição dividida
    // pela largura dá o número do print (0 a 6).
    const atual = Math.round(trilho.scrollLeft / trilho.clientWidth);
    nome.textContent = botoes[atual].textContent;
    pontos.forEach((ponto, i) => ponto.classList.toggle("ativo", i === atual));
    botoes.forEach((botao, i) => botao.setAttribute("aria-pressed", String(i === atual)));
  }

  botoes.forEach((botao, i) => {
    botao.addEventListener("click", () => {
      trilho.scrollTo({ left: i * trilho.clientWidth });
    });
  });

  // marcar() só mexe em poucos elementos, então pode rodar a cada rolagem.
  trilho.addEventListener("scroll", marcar, { passive: true });
  marcar();
}

// ---------- Vídeos do Meu Prédio ----------
// Vídeos com data-auto tocam (sem som) só enquanto estão na tela, para não
// gastar internet nem bateria à toa. O vídeo do computador fica dentro do
// carrossel: quando a pessoa passa para outro print ele sai da tela e pausa.
// Com "menos movimento" nada toca sozinho: aparecem os controles para dar play.
function iniciarVideos() {
  const videos = document.querySelectorAll("video[data-auto]");
  if (menosMovimento || !("IntersectionObserver" in window)) {
    videos.forEach((video) => (video.controls = true));
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        const video = entrada.target;
        if (entrada.isIntersecting) {
          video.play().catch(() => (video.controls = true)); // se o navegador bloquear, mostra o play
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.5 },
  );

  videos.forEach((video) => observador.observe(video));
}

// ---------- Blocos que aparecem ao rolar ----------
// Quem tem o atributo data-reveal surge (de baixo e sem desfoque) quando entra na tela.
// Sem JS ou com "menos movimento" nada é escondido: o conteúdo sempre aparece.
function iniciarRevelar() {
  if (menosMovimento || !("IntersectionObserver" in window)) return;

  // Avisa quando um elemento entra na tela (15% dele visível).
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.remove("escondido");
          observador.unobserve(entrada.target); // só anima uma vez
        }
      });
    },
    { threshold: 0.15 },
  );

  document.querySelectorAll("[data-reveal]").forEach((el) => {
    // O que já está na tela ao abrir a página fica como está, para não piscar.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;

    el.classList.add("revelar", "escondido");
    // data-delay="100" faz o elemento esperar 100 ms (efeito "um depois do outro").
    if (el.dataset.delay) el.style.transitionDelay = `${el.dataset.delay}ms`;
    observador.observe(el);
  });
}

// ---------- Texto que acende palavra por palavra ----------
// Quebra o parágrafo em <span> por palavra. Conforme o parágrafo sobe de 85%
// até 25% da altura da tela, mais palavras ganham a classe "acesa".
function iniciarTextoAcende() {
  const paragrafo = document.querySelector(".texto-acende");
  if (!paragrafo) return;

  const texto = paragrafo.textContent.trim();
  const destaques = (paragrafo.dataset.destaques || "").split(" ");
  const palavras = texto.split(" ");

  // Leitores de tela leem o texto inteiro de uma vez (não palavra por palavra).
  paragrafo.innerHTML = "";
  const textoLeitor = document.createElement("span");
  textoLeitor.className = "so-leitor";
  textoLeitor.textContent = texto;

  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");

  const spans = palavras.map((palavra, i) => {
    const span = document.createElement("span");
    span.className = "palavra";
    span.textContent = palavra;
    // "Engenharia" também pega "Engenharia," (com vírgula).
    if (destaques.some((d) => d && palavra.startsWith(d))) span.classList.add("palavra-destaque");
    visual.append(span);
    if (i < palavras.length - 1) visual.append(" ");
    return span;
  });

  paragrafo.append(textoLeitor, visual);

  // Com "menos movimento" tudo já fica aceso.
  if (menosMovimento) {
    spans.forEach((s) => s.classList.add("acesa"));
    return;
  }

  aoRolar(() => {
    const topo = paragrafo.getBoundingClientRect().top;
    const progresso = (window.innerHeight * 0.85 - topo) / (window.innerHeight * 0.6);
    const limitado = Math.min(Math.max(progresso, 0), 1); // entre 0 e 1
    const acesas = Math.round(limitado * spans.length);
    spans.forEach((s, i) => s.classList.toggle("acesa", i < acesas));
  });
}

// ---------- Botão "Copiar" do e-mail ----------
function iniciarCopiar() {
  document.querySelectorAll("[data-copiar]").forEach((botao) => {
    botao.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(botao.dataset.copiar);
        soltarConfete(botao);
        botao.textContent = "Copiado";
        botao.classList.add("copiado");
        setTimeout(() => {
          botao.textContent = "Copiar";
          botao.classList.remove("copiado");
        }, 2000);
      } catch {
        botao.textContent = "Não deu para copiar";
      }
    });
  });
}

// Solta bolinhas coloridas saindo do centro de um elemento.
// Cada bolinha é um <span> que voa numa direção sorteada e some no fim.
function soltarConfete(origem) {
  if (menosMovimento) return;
  const caixa = origem.getBoundingClientRect();
  const centroX = caixa.left + caixa.width / 2;
  const centroY = caixa.top + caixa.height / 2;
  const cores = ["#ff7a59", "#eef2fb", "#5eead4", "#ffb547"];

  for (let i = 0; i < 16; i++) {
    const bolinha = document.createElement("span");
    bolinha.className = "confete";
    bolinha.style.left = `${centroX}px`;
    bolinha.style.top = `${centroY}px`;
    bolinha.style.background = cores[i % cores.length];
    document.body.append(bolinha);

    const angulo = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
    const distancia = 55 + Math.random() * 60;
    bolinha
      .animate(
        [
          { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
          {
            transform: `translate(calc(-50% + ${Math.cos(angulo) * distancia}px), calc(-50% + ${Math.sin(angulo) * distancia + 20}px)) scale(0.4)`,
            opacity: 0,
          },
        ],
        { duration: 700 + Math.random() * 300, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      )
      .finished.then(() => bolinha.remove());
  }
}

// ---------- Recado no console ----------
// Para quem abrir as ferramentas de desenvolvedor (F12) do navegador.
function deixarRecado() {
  console.log(
    "%cOi! 👋%c\nSe você está olhando o código, o portfólio é feito à mão com HTML, CSS e JavaScript, sem framework.\nMeus projetos: github.com/guilhermedemedeirosrabelo86-maker\nVamos conversar? wa.me/5548998230477",
    "font: 800 24px sans-serif; color: #ff7a59;",
    "font: 14px sans-serif; color: inherit;",
  );
}

// ---------- Idade ----------
// Calculada na hora, para nunca ficar desatualizada.
function calcularIdade(nascimento, hoje) {
  const [ano, mes, dia] = nascimento.split("-").map(Number);
  const mesAtual = hoje.getMonth() + 1; // getMonth() começa em 0 (janeiro = 0)
  const jaFezAniversario = mesAtual > mes || (mesAtual === mes && hoje.getDate() >= dia);
  return hoje.getFullYear() - ano - (jaFezAniversario ? 0 : 1);
}

function iniciarIdade() {
  document.querySelectorAll("[data-nascimento]").forEach((el) => {
    el.textContent = `${calcularIdade(el.dataset.nascimento, new Date())} anos`;
  });
}

// ---------- Ícones das tecnologias ----------
// Para cada item das listas de tecnologias, procura o ícone pelo nome
// e coloca um <svg> antes do texto. Os desenhos vêm do projeto Simple Icons.
const icones = {
  html: { cor: "#E34F26", d: "M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z" },
  css: { cor: "#eef2fb", d: "M0 0v20.16A3.84 3.84 0 0 0 3.84 24h16.32A3.84 3.84 0 0 0 24 20.16V3.84A3.84 3.84 0 0 0 20.16 0Zm14.256 13.08c1.56 0 2.28 1.08 2.304 2.64h-1.608c.024-.288-.048-.6-.144-.84-.096-.192-.288-.264-.552-.264-.456 0-.696.264-.696.84-.024.576.288.888.768 1.08.72.288 1.608.744 1.92 1.296q.432.648.432 1.656c0 1.608-.912 2.592-2.496 2.592-1.656 0-2.4-1.032-2.424-2.688h1.68c0 .792.264 1.176.792 1.176.264 0 .456-.072.552-.24.192-.312.24-1.176-.048-1.512-.312-.408-.912-.6-1.32-.816q-.828-.396-1.224-.936c-.24-.36-.36-.888-.36-1.536 0-1.44.936-2.472 2.424-2.448m5.4 0c1.584 0 2.304 1.08 2.328 2.64h-1.608c0-.288-.048-.6-.168-.84-.096-.192-.264-.264-.528-.264-.48 0-.72.264-.72.84s.288.888.792 1.08c.696.288 1.608.744 1.92 1.296.264.432.408.984.408 1.656.024 1.608-.888 2.592-2.472 2.592-1.68 0-2.424-1.056-2.448-2.688h1.68c0 .744.264 1.176.792 1.176.264 0 .456-.072.552-.24.216-.312.264-1.176-.048-1.512-.288-.408-.888-.6-1.32-.816-.552-.264-.96-.576-1.2-.936s-.36-.888-.36-1.536c-.024-1.44.912-2.472 2.4-2.448m-11.031.018c.711-.006 1.419.198 1.839.63.432.432.672 1.128.648 1.992H9.336c.024-.456-.096-.792-.432-.96-.312-.144-.768-.048-.888.24-.12.264-.192.576-.168.864v3.504c0 .744.264 1.128.768 1.128a.65.65 0 0 0 .552-.264c.168-.24.192-.552.168-.84h1.776c.096 1.632-.984 2.712-2.568 2.688-1.536 0-2.496-.864-2.472-2.472v-4.032c0-.816.24-1.44.696-1.848.432-.408 1.146-.624 1.857-.63" },
  javascript: { cor: "#F7DF1E", d: "M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z" },
  react: { cor: "#61DAFB", d: "M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" },
  python: { cor: "#3776AB", d: "M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" },
  firebase: { cor: "#DD2C00", d: "M19.455 8.369c-.538-.748-1.778-2.285-3.681-4.569-.826-.991-1.535-1.832-1.884-2.245a146 146 0 0 0-.488-.576l-.207-.245-.113-.133-.022-.032-.01-.005L12.57 0l-.609.488c-1.555 1.246-2.828 2.851-3.681 4.64-.523 1.064-.864 2.105-1.043 3.176-.047.241-.088.489-.121.738-.209-.017-.421-.028-.632-.033-.018-.001-.035-.002-.059-.003a7.46 7.46 0 0 0-2.28.274l-.317.089-.163.286c-.765 1.342-1.198 2.869-1.252 4.416-.07 2.01.477 3.954 1.583 5.625 1.082 1.633 2.61 2.882 4.42 3.611l.236.095.071.025.003-.001a9.59 9.59 0 0 0 2.941.568q.171.006.342.006c1.273 0 2.513-.249 3.69-.742l.008.004.313-.145a9.63 9.63 0 0 0 3.927-3.335c1.01-1.49 1.577-3.234 1.641-5.042.075-2.161-.643-4.304-2.133-6.371m-7.083 6.695c.328 1.244.264 2.44-.191 3.558-1.135-1.12-1.967-2.352-2.475-3.665-.543-1.404-.87-2.74-.974-3.975.48.157.922.366 1.315.622 1.132.737 1.914 1.902 2.325 3.461zm.207 6.022c.482.368.99.712 1.513 1.028-.771.21-1.565.302-2.369.273a8 8 0 0 1-.373-.022c.458-.394.869-.823 1.228-1.279zm1.347-6.431c-.516-1.957-1.527-3.437-3.002-4.398-.647-.421-1.385-.741-2.194-.95.011-.134.026-.268.043-.4.014-.113.03-.216.046-.313.133-.689.332-1.37.589-2.025.099-.25.206-.499.321-.74l.004-.008c.177-.358.376-.719.61-1.105l.092-.152-.003-.001c.544-.851 1.197-1.627 1.942-2.311l.288.341c.672.796 1.304 1.548 1.878 2.237 1.291 1.549 2.966 3.583 3.612 4.48 1.277 1.771 1.893 3.579 1.83 5.375-.049 1.395-.461 2.755-1.195 3.933-.694 1.116-1.661 2.05-2.8 2.708-.636-.318-1.559-.839-2.539-1.599.79-1.575.952-3.28.479-5.072zm-2.575 5.397c-.725.939-1.587 1.55-2.09 1.856-.081-.029-.163-.06-.243-.093l-.065-.026c-1.49-.616-2.747-1.656-3.635-3.01-.907-1.384-1.356-2.993-1.298-4.653.041-1.19.338-2.327.882-3.379.316-.07.638-.114.96-.131l.084-.002c.162-.003.324-.003.478 0 .227.011.454.035.677.07.073 1.513.445 3.145 1.105 4.852.637 1.644 1.694 3.162 3.144 4.515z" },
  "cloudflare workers": { cor: "#F38020", d: "m8.213.063 8.879 12.136-8.67 11.739h2.476l8.665-11.735-8.89-12.14Zm4.728 0 9.02 11.992-9.018 11.883h2.496L24 12.656v-1.199L15.434.063ZM7.178 2.02.01 11.398l-.01 1.2 7.203 9.644 1.238-1.676-6.396-8.556 6.361-8.313Z" },
  git: { cor: "#F03C2E", d: "M13.09 23.549a1.54 1.54 0 0 1-2.18 0L.451 13.089a1.54 1.54 0 0 1 0-2.179l7.191-7.19 2.733 2.733a1.85 1.85 0 0 0 .964 2.326v6.66a1.849 1.849 0 1 0 1.54 0V8.957l2.508 2.508a1.85 1.85 0 1 0 1.09-1.09l-2.634-2.634a1.85 1.85 0 0 0-2.378-2.377L8.73 2.63 10.91.451a1.54 1.54 0 0 1 2.179 0l10.459 10.46a1.54 1.54 0 0 1 0 2.179z" },
  github: { cor: "#eef2fb", d: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
  sqlite: { cor: "#eef2fb", d: "M21.678.521c-1.032-.92-2.28-.55-3.513.544a8.71 8.71 0 0 0-.547.535c-2.109 2.237-4.066 6.38-4.674 9.544.237.48.422 1.093.544 1.561a13.044 13.044 0 0 1 .164.703s-.019-.071-.096-.296l-.05-.146a1.689 1.689 0 0 0-.033-.08c-.138-.32-.518-.995-.686-1.289-.143.423-.27.818-.376 1.176.484.884.778 2.4.778 2.4s-.025-.099-.147-.442c-.107-.303-.644-1.244-.772-1.464-.217.804-.304 1.346-.226 1.478.152.256.296.698.422 1.186.286 1.1.485 2.44.485 2.44l.017.224a22.41 22.41 0 0 0 .056 2.748c.095 1.146.273 2.13.5 2.657l.155-.084c-.334-1.038-.47-2.399-.41-3.967.09-2.398.642-5.29 1.661-8.304 1.723-4.55 4.113-8.201 6.3-9.945-1.993 1.8-4.692 7.63-5.5 9.788-.904 2.416-1.545 4.684-1.931 6.857.666-2.037 2.821-2.912 2.821-2.912s1.057-1.304 2.292-3.166c-.74.169-1.955.458-2.362.629-.6.251-.762.337-.762.337s1.945-1.184 3.613-1.72C21.695 7.9 24.195 2.767 21.678.521m-18.573.543A1.842 1.842 0 0 0 1.27 2.9v16.608a1.84 1.84 0 0 0 1.835 1.834h9.418a22.953 22.953 0 0 1-.052-2.707c-.006-.062-.011-.141-.016-.2a27.01 27.01 0 0 0-.473-2.378c-.121-.47-.275-.898-.369-1.057-.116-.197-.098-.31-.097-.432 0-.12.015-.245.037-.386a9.98 9.98 0 0 1 .234-1.045l.217-.028c-.017-.035-.014-.065-.031-.097l-.041-.381a32.8 32.8 0 0 1 .382-1.194l.2-.019c-.008-.016-.01-.038-.018-.053l-.043-.316c.63-3.28 2.587-7.443 4.8-9.791.066-.069.133-.128.198-.194Z" },
  vite: { cor: "#9135FF", d: "M13.056 23.238a.57.57 0 0 1-1.02-.355v-5.202c0-.63-.512-1.143-1.144-1.143H5.148a.57.57 0 0 1-.464-.903l3.777-5.29c.54-.753 0-1.804-.93-1.804H.57a.574.574 0 0 1-.543-.746.6.6 0 0 1 .08-.157L5.008.78a.57.57 0 0 1 .467-.24h14.589a.57.57 0 0 1 .466.903l-3.778 5.29c-.54.755 0 1.806.93 1.806h5.745c.238 0 .424.138.513.322a.56.56 0 0 1-.063.603z" },
  // SQL não tem logo de marca, então usa um ícone genérico de banco de dados.
  sql: { cor: "#F5B301", d: "M12 2C7.03 2 3 3.57 3 5.5v13C3 20.43 7.03 22 12 22s9-1.57 9-3.5v-13C21 3.57 16.97 2 12 2Zm0 2c4.42 0 7 1.3 7 1.5S16.42 7 12 7 5 5.7 5 5.5 7.58 4 12 4ZM5 8.1C6.6 8.68 9.15 9 12 9s5.4-.32 7-.9V12c0 .2-2.58 1.5-7 1.5S5 12.2 5 12V8.1Zm0 6.5c1.6.58 4.15.9 7 .9s5.4-.32 7-.9v3.9c0 .2-2.58 1.5-7 1.5s-7-1.3-7-1.5v-3.9Z" },
};

// Nomes diferentes que usam o mesmo ícone.
icones["firebase authentication"] = icones.firebase;
icones["cloud firestore"] = icones.firebase;
icones["firebase cloud messaging"] = icones.firebase;

function iniciarIcones() {
  document.querySelectorAll(".tags li, .usos-tec").forEach((item) => {
    // "React (estudando)" vira "react"; "SQLite (no navegador)" vira "sqlite".
    const chave = item.textContent.replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase();
    const icone = icones[chave];
    if (!icone) return;

    const svg = `<svg viewBox="0 0 24 24" fill="${icone.cor}" aria-hidden="true"><path d="${icone.d}"/></svg>`;
    item.insertAdjacentHTML("afterbegin", svg);
  });
}

// ---------- Ajudante: rodar uma função ao rolar a página ----------
// requestAnimationFrame junta várias rolagens num quadro só, para não pesar.
function aoRolar(funcao) {
  let quadro = 0;
  function agendar() {
    cancelAnimationFrame(quadro);
    quadro = requestAnimationFrame(funcao);
  }
  funcao(); // roda uma vez ao abrir a página
  window.addEventListener("scroll", agendar, { passive: true });
  window.addEventListener("resize", agendar);
}

// ---------- Liga tudo ----------
iniciarEntrada();
iniciarMenu();
iniciarNavbar();
iniciarBarraProgresso();
iniciarVoltarTopo();
iniciarIdade();
iniciarIcones();
iniciarTitulos();
iniciarLetras();
iniciarBola(); // depois dos títulos, que criam as .linha
deixarRecado();
iniciarVitrine();
iniciarSeletor();
iniciarDetalhes();
iniciarGaleria();
iniciarVideos();
iniciarTextoAcende();
iniciarSaidaTopo();
iniciarTransicoes();
iniciarCascata(); // antes do iniciarRevelar
iniciarRevelar();
iniciarCopiar();
