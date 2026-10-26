/* Central de Brindes · Navegação, renderização das telas, gavetas e o Início */
"use strict";

/* ---------- navegação ---------- */
function countFor(k) {
  if (k === "chat") return naoLidas();
  if (k === "pedidos") return pedAbertos().filter(p => p.responsavel === myId || (!p.responsavel && p.autor === myId)).length;
  if (k === "envios") return S.envios.filter(e => e.status === "pendente" || e.status === "separado").length;
  if (k === "rastreio") return S.envios.filter(precisaAtencao).length;
  if (k === "estoque") { const st = stock(); return S.itens.filter(i => !i.arquivado && stockState(i, st[i.id])[0] !== "ok").length; }
  return 0;
}
// o que o número ao lado de cada item do menu quer dizer (aparece ao passar o mouse)
const CONT_ALERTA = new Set(["rastreio", "estoque"]);
function countTip(k, n) {
  const p = n === 1;
  return { chat: p ? "1 mensagem nova" : `${n} mensagens novas`, pedidos: p ? "1 tarefa com você" : `${n} tarefas com você`,
    envios: p ? "1 envio para separar ou postar" : `${n} envios para separar ou postar`, rastreio: p ? "1 entrega precisa de atenção" : `${n} entregas precisam de atenção`,
    estoque: p ? "1 brinde acabando ou em falta" : `${n} brindes acabando ou em falta` }[k] || "";
}
const mIco = (t, cls = "m-ico") => `<span class="${cls} ${t.c}">${ic(t.icon)}</span>`;
function renderNav() {
  const tt = $("#tbTitle"); tt.textContent = tab === "estoque" && matchMedia("(max-width:720px)").matches ? "Estoque" : tabInfo(tab)?.l || "Início"; tt.classList.toggle("longo", tt.textContent.length > 12); tt.dataset.g = tabInfo(tab)?.g && tab !== "painel" ? tabInfo(tab).g : "";
  renderBnav();
  let html = "", g = "";
  for (const t of TABS) {
    if (t.admin && !isAdmin()) continue;
    if (t.g !== g) { html += `<div class="nd-label">${t.g}</div>`; g = t.g; }
    const n = countFor(t.k);
    html += `<button class="nd-item" data-tab="${t.k}" data-tip="${esc(t.l)}"${t.k === tab ? ' aria-current="page"' : ""}>${mIco(t)}<span class="nd-l">${t.l}</span>${n ? `<span class="count num${CONT_ALERTA.has(t.k) ? " alerta" : ""}" title="${esc(countTip(t.k, n))}">${n}</span>` : ""}</button>`;
  }
  // menu fixo do computador: sempre montado, o CSS mostra só em telas largas
  const sn = $("#sideNav");
  const rail = document.body.classList.contains("sn-rail");
  if (sn) sn.innerHTML = `<div class="sn-head"><img class="sn-logo" src="assets/logo.svg" alt="Empresa Demo" width="292" height="94"><img class="sn-simb" src="assets/simbolo.svg" alt="" width="110" height="70"><div class="sn-sis"><b>Central de Brindes</b><small>Marketing</small></div></div>
    <nav class="nd-list">${html}</nav>${agoraHTML()}
    <div class="sn-pe"><button class="sn-toggle" data-snx data-tip="${rail ? "Expandir menu" : "Recolher menu"}" aria-label="${rail ? "Expandir menu" : "Recolher menu"}">${ic("lado")}<span class="nd-l">Recolher menu</span></button><span class="sn-ver nd-l">${VERSAO}</span></div>`;
  if ($("#navRoot").innerHTML) $("#ndList").innerHTML = html;
}
// cartão "Agora" no pé do menu lateral: o que está esperando separação e coleta, com o atalho certo
function agoraHTML() {
  if (!myId || !loaded.envios) return "";
  const pend = S.envios.filter(e => e.status === "pendente").length, seps = S.envios.filter(e => e.status === "separado"), cx = seps.reduce((a, e) => a + volumesDe(e), 0);
  const l = [];
  if (pend) l.push(`<button class="ag-l" data-agora="separar"><span class="ag-n num">${pend}</span><span class="ag-t"><b>Para separar</b><small>${pend === 1 ? "1 envio" : pend + " envios"}</small></span>${ic("chev", "i-sm")}</button>`);
  if (seps.length) l.push(`<button class="ag-l" data-agora="correio"><span class="ag-n num">${cx}</span><span class="ag-t"><b>Esperando coleta</b><small>${cx === 1 ? "1 caixa" : cx + " caixas"} · Correio</small></span>${ic("chev", "i-sm")}</button>`);
  return `<div class="sn-agora"><span class="ag-cab">Agora</span>${l.join("") || `<p class="ag-ok">${ic("check", "i-sm")}Nada esperando separação ou coleta.</p>`}</div>`;
}
document.addEventListener("click", e => { const b = e.target.closest("[data-agora]"); if (!b) return; b.dataset.agora === "separar" ? modoSeparacao() : chamarCorreio(); });
function openNav() {
  $("#navRoot").innerHTML = `<div class="navov" id="navov"></div><aside class="navdrawer" aria-label="Menu">
    <div class="nd-head"><span class="nd-logo"><img src="assets/simbolo.svg" alt="Empresa Demo"></span><div class="t"><b>Central de Brindes</b><small>Marketing · Empresa Demo</small></div><button class="tb-menu nd-close" id="ndClose" aria-label="Fechar menu">${ic("x")}</button></div>
    <nav class="nd-list" id="ndList"></nav>${agoraHTML()}
    <div class="nd-foot">${VERSAO} · © ${new Date().getFullYear()} Empresa Demo</div></aside>`;
  renderNav();
  $("#navov").onclick = closeNav; $("#ndClose").onclick = closeNav;
  $("#ndClose").focus({ focusVisible: false });
}
function closeNav() { $("#navRoot").innerHTML = ""; }
// computador: menu fixo na esquerda; o ☰ do topo e o botão do pé do menu alternam entre aberto (com nomes)
// e encolhido (só ícones). A escolha fica guardada neste aparelho. Celular: o menu abre por cima da tela.
const menuFixo = () => matchMedia("(min-width:721px)").matches;
function alternarMenu() {
  if (!menuFixo()) return $("#navRoot").innerHTML ? closeNav() : openNav();
  const rail = document.body.classList.toggle("sn-rail");
  try { localStorage.setItem("cb-menu", rail ? "fechado" : "aberto"); } catch (x) { }
  // só o botão muda de texto: sem redesenhar o menu, o logo e os nomes esmaecem junto com a largura
  const t = $(".sn-toggle"), l = rail ? "Expandir menu" : "Recolher menu";
  if (t) { t.dataset.tip = l; t.setAttribute("aria-label", l); }
}
// sem escolha guardada: aberto no computador, encolhido no tablet
try { const m = localStorage.getItem("cb-menu"); if (m === "fechado" || (!m && matchMedia("(min-width:721px) and (max-width:1199px)").matches)) document.body.classList.add("sn-rail"); } catch (x) { }
document.addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) { closeNav(); go(b.dataset.tab); } if (e.target.closest("[data-busca]")) openPalette(); if (e.target.closest("[data-snx]")) alternarMenu(); });
function go(t, opts) {
  if (!VIEWS[t] || !tabInfo(t)) t = "painel";   // aba que saiu do sistema (ex.: Conversas) volta para o Início
  if (tabInfo(t)?.admin && myId && loaded.perfis && !isAdmin()) t = "painel";
  tab = t;
  document.body.dataset.view = t;
  // animação de entrada só ao trocar de tela (não a cada atualização dos dados)
  document.body.classList.add("trocou"); clearTimeout(go.t); go.t = setTimeout(() => document.body.classList.remove("trocou"), 450);
  if (t !== "chat") fecharConversa();
  try { history.replaceState(null, "", "#" + t); } catch (e) {}
  if (opts) Object.assign(F, opts);
  if (t !== "envios" && SEL.on) { SEL.on = false; SEL.ids.clear(); }
  renderSelBar(); fecharMenu();
  renderNav();
  $("#vhead").innerHTML = VIEWS[t].head();
  VIEWS[t].bind?.();
  renderBody(true);
  window.scrollTo(0, 0);
  if (t === "pedidos") setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 40);
}
let rq = 0;
function scheduleRender() {
  if (rq) return;
  rq = requestAnimationFrame(() => {
    rq = 0; renderNav();
    if (tab === "equipe" && isAdmin() && !$("#eqNew")) { $("#vhead").innerHTML = VIEWS.equipe.head(); VIEWS.equipe.bind(); }
    renderBody(false); paintMe(); setBanner();
    clearTimeout(verificarCompras.t); verificarCompras.t = setTimeout(verificarCompras, 8000);   // hora de comprar: confere com calma depois que os dados assentam
  });
}
// no celular, as abas de filtro (que ficavam cortadas) viram uma lista de escolha com todas as opções
function espelharSeg(seg) {
  let sel = seg.nextElementSibling?.classList.contains("seg-sel") ? seg.nextElementSibling : null;
  if (!celular()) { sel?.remove(); seg.classList.remove("seg-oculto"); return; }
  const bts = $$("button", seg); if (!bts.length) return;
  if (!sel) { sel = document.createElement("select"); sel.className = "select seg-sel"; sel.setAttribute("aria-label", seg.getAttribute("aria-label") || "Filtro"); seg.after(sel); }
  sel.innerHTML = bts.map((b, i) => { const n = $(".n", b)?.textContent; const l = [...b.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join("").trim(); return `<option value="${i}"${b.getAttribute("aria-pressed") === "true" ? " selected" : ""}>${esc(l)}${n ? ` (${esc(n)})` : ""}</option>`; }).join("");
  sel.onchange = () => bts[+sel.value]?.click();
  seg.classList.add("seg-oculto");
}
/* faixa escura do topo (computador e tablet): vai até logo depois do cabeçalho da tela;
   no Início desce mais, para os cartões de número "subirem" sobre ela */
function ajustarFaixa() {
  const c = $(".content"); if (!c) return;
  if (!matchMedia("(min-width:721px)").matches) return c.style.removeProperty("--band");
  const hero = $("#vbody > .hero"), ref = hero || $("#vhead .ph");
  if (!ref) return c.style.setProperty("--band", "0px");
  const fim = ref.getBoundingClientRect().bottom - c.getBoundingClientRect().top + (hero ? 92 : 12);
  c.style.setProperty("--band", Math.max(0, Math.round(fim)) + "px");
}
addEventListener("resize", () => { clearTimeout(ajustarFaixa.t); ajustarFaixa.t = setTimeout(ajustarFaixa, 120); });
function renderBody(first) {
  const v = VIEWS[tab];
  const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 200;
  const ae = document.activeElement;
  const keep = ae && ae.id && $("#vbody").contains(ae) ? { id: ae.id, v: ae.value, s: ae.selectionStart, e: ae.selectionEnd } : null;
  $("#vbody").innerHTML = v.body();
  v.after?.();
  document.body.classList.toggle("conv-aberta", tab === "chat" && !!CH.aberta);
  if (keep) { const n = document.getElementById(keep.id); if (n) { if (keep.v != null && n.value !== keep.v) n.value = keep.v; n.focus({ preventScroll: true }); try { n.setSelectionRange(keep.s, keep.e); } catch (e) {} } }
  hydrate($("#vbody"));
  ajustarFaixa(); if (first) setTimeout(ajustarFaixa, 380);
  $$("#vhead .seg.scroll").forEach(espelharSeg);
  if (tab === "pedidos" && !first && nearBottom) window.scrollTo(0, document.body.scrollHeight);
}
function setBanner() {
  let m = "";
  if (myId && loaded.itens && !S.itens.length && isAdmin()) m = "IMPORTAR";
  if (m === "IMPORTAR") {
    if (!$("#bnImport")) {
      $("#banner").innerHTML = `<div class="banner" style="background:var(--sep-bg);color:var(--sep);align-items:center">${ic("box")}<span style="flex:1">O estoque está vazio. Quer trazer os 53 brindes e o representante cadastrados no sistema anterior?</span><button class="btn sm primary" id="bnImport">Importar dados</button></div>`;
      $("#bnImport").onclick = e => importarDados(e.currentTarget);
    }
    return;
  }
  if (!m && myId && cartelasEmFardo().some(x => x.converter)) {
    if (!$("#bnFardo")) {
      $("#banner").innerHTML = `<div class="banner" style="align-items:center">${ic("alert")}<span style="flex:1">As cartelas da contagem entraram em fardos. Converter para unidades?</span><button class="btn sm primary" id="bnFardo">Ver e converter</button></div>`;
      $("#bnFardo").onclick = converterFardosDrawer;
    }
    return;
  }
  $("#banner").innerHTML = m ? `<div class="banner">${ic("alert")}<span></span></div>` : "";
  if (m) $("#banner span").textContent = m;
}
const loading = () => !noDb && !["itens", "movimentos", "envios", "representantes", "pedidos"].every(k => loaded[k]);
// topo de cada tela: faixa vermelha da marca (ícone, título, explicação e o logo); os botões ficam logo abaixo
const pageHead = (eyebrow, title, sub, actions = "") => `<div class="ph"><div class="ph-band"><div class="ph-main">${tabInfo(tab) ? mIco(tabInfo(tab)) : ""}<div>${eyebrow ? `<span class="ph-eyebrow"><span class="ph-trilha">Central de Brindes<i>›</i></span>${eyebrow}<span class="ph-trilha"><i>›</i>${title}</span></span>` : ""}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div></div><img class="ph-logo" src="assets/logo-branca.svg" alt="" width="488" height="157"></div>${actions ? `<div class="actions">${actions}</div>` : ""}</div>`;
const empty = (icon, title, text, action = "") => `<div class="empty"><div class="ico">${ic(icon)}</div><b>${title}</b>${text ? `<p>${text}</p>` : ""}${action}</div>`;
// enquanto os dados chegam: blocos cinza com brilho passando (no lugar de "Carregando…")
const skeleton = txt => `<div class="sk" role="status" aria-label="${esc(txt)}"><div class="sk-tiles">${"<i></i>".repeat(3)}</div><div class="sk-card">${'<div class="sk-l"><i class="sk-c"></i><span><i></i><i></i></span><i class="sk-n"></i></div>'.repeat(4)}</div></div>`;

/* ---------- gaveta (formulários) ---------- */
function openDrawer({ eyebrow = "", title, body, foot = "", narrow = false, wide = false, onMount }) {
  $("#drawerRoot").innerHTML = `<div class="overlay" id="ov"><section class="drawer${narrow ? " narrow" : ""}${wide ? " wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="dt">
    <div class="d-head"><div>${eyebrow ? `<div class="eyebrow" id="dEy"></div>` : ""}<h2 id="dt"></h2></div><button class="btn ghost icon" data-close aria-label="Fechar">${ic("x")}</button></div>
    <div class="d-body">${body}</div>${foot ? `<div class="d-foot">${foot}</div>` : ""}</section></div>`;
  $("#dt").textContent = title;
  if (eyebrow) $("#dEy").textContent = eyebrow;
  const ov = $("#ov");
  ov.addEventListener("click", e => { if (e.target === ov || e.target.closest("[data-close]")) closeDrawer(); });
  if (celular()) { const d = $(".drawer", ov); arrastarParaFechar(d, closeDrawer, t => !t.closest(".d-body, .d-foot")); }
  onMount?.(ov);
  // no celular não coloca o cursor sozinho (evita abrir o teclado e dar zoom ao abrir a tela)
  const f = $(".d-body input:not([type=hidden]), .d-body select, .d-body textarea", ov); if (f && !f.disabled && !ehCelular()) f.focus();
  hydrate(ov);
}
function closeDrawer() { $("#drawerRoot").innerHTML = ""; }
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#ov")) closeDrawer(); });
// pergunta simples de confirmação (sim / voltar)
function confirmar(titulo, texto, botao, fn, perigo = false) {
  openDrawer({
    title: titulo, narrow: true, body: `<p style="margin:0;color:var(--ink-2)">${esc(texto)}</p>`,
    foot: `<button class="btn" data-close>Voltar</button><button class="btn ${perigo ? "danger" : "primary"}" id="cfOk">${esc(botao)}</button>`,
    onMount() { $("#cfOk").onclick = async () => { $("#cfOk").disabled = true; closeDrawer(); await fn(); }; }
  });
}
function armConfirm(btn, label, fn) {
  if (btn.dataset.armed) { fn(); return; }
  btn.dataset.armed = "1"; const old = btn.innerHTML; btn.textContent = label; btn.classList.add("armed");
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.innerHTML = old; btn.classList.remove("armed"); } }, 4000);
}
const stepper = e => {
  if (e.status === "cancelado") return `<span class="pill st-cancelado">Cancelado ${fmtDM(e.canceladoEm)}</span>`;
  const steps = [["Pendente", e.criadoEm], ["Separado", e.separadoEm], ["Postado", e.postadoEm], ["Entregue", e.entregueEm]];
  const idx = ["pendente", "separado", "postado", "entregue"].indexOf(e.status);
  return `<div class="stepper">${steps.map(([l, t], i) => `${i ? `<span class="bar${i <= idx ? " done" : ""}"></span>` : ""}<div class="step${i <= idx ? " done" : ""}${i === idx + 1 ? " now" : ""}"><span class="dot">${ic("check")}</span><span class="lbl">${l}</span><span class="dt num">${i <= idx && t ? fmtDM(t) : "&nbsp;"}</span></div>`).join("")}</div>`;
};

/* =========================================================
   TELAS
   ========================================================= */
const VIEWS = {};

/* ---------- Painel ---------- */
VIEWS.painel = {
  head: () => "",
  body() {
    const h = new Date().getHours(), nome = myId ? firstName(myId) : "";
    // faixa da marca: saudação, data e os três números do dia (cada um leva para a tela certa)
    // atalhos da correria do dia: o que se faz várias vezes ao dia (separar e chamar o Correio só aparecem quando há o que fazer)
    const nPend = S.envios.filter(e => e.status === "pendente").length, nSep = S.envios.filter(e => e.status === "separado").length;
    const acoes = [nPend && ["hSeparar", "box", `Separar <span class="num h-n">${nPend}</span>`, " primary"], nSep && ["hCorreio", "phone", `Chamar o Correio <span class="num h-n">${nSep}</span>`, ""],
      ["hNotas", "in", "Importar notas", nPend ? "" : " primary"], ["hContar", "count", "Contar estoque", ""]].filter(Boolean);
    const hero = () => `<section class="hero"><div class="hero-txt"><span class="hero-dia">${esc(frase(new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })))}</span><h1>${h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"}${nome ? ", " + esc(nome) : ""}</h1><p class="hero-sub">Aqui está o resumo dos brindes hoje.</p></div>
      <div class="hero-acoes">${acoes.map(([id, i, l, c]) => `<button class="btn${c}" id="${id}">${ic(i)}${l}</button>`).join("")}</div></section>`;
    // cartela: os quatro números do dia como chips de tinta lado a lado; o chip só ganha cor quando tem algo (zero fica neutro)
    const COR_CHIP = ["var(--chama-y)", "var(--cobalto)", "var(--lilas)", "var(--folha)"];
    const kp = ([n, l, icone, sub, go, opts], k) => `<button class="tinta${n ? "" : " vazia"}" style="--tinta:${COR_CHIP[k]}" data-go="${go}"${opts ? ` data-opts='${JSON.stringify(opts)}'` : ""}><span class="tinta-cor"><b class="num">${fmtN(n)}</b>${ic(icone)}</span><span class="tinta-rot"><b>${l}</b><small>${sub}</small></span></button>`;
    if (loading()) return hero() + skeleton("Carregando…");
    const st = stock(), ab = pedAbertos(), at = ativos(), aten = S.envios.filter(precisaAtencao);
    const baixos = S.itens.filter(i => !i.arquivado && stockState(i, st[i.id])[0] !== "ok"), zerados = baixos.filter(i => stockState(i, st[i.id])[0] === "zero");
    const meus = ab.filter(comigo);
    const mes = new Date(); mes.setDate(1); mes.setHours(0, 0, 0, 0);
    const entMes = S.envios.filter(e => e.status === "entregue" && e.entregueEm >= mes.getTime()).length;
    const feed = activity(14).map(atvLinha).join("");   // no computador mostra quantas couberem ao lado do "Para hoje"
    const pend = S.envios.filter(e => e.status === "pendente").length, trans = S.envios.filter(e => e.status === "postado").length;
    const maisVelho = S.envios.filter(e => e.status === "pendente").reduce((a, e) => Math.min(a, e.criadoEm || Infinity), Infinity);
    const saiu = S.envios.filter(e => e.status === "postado" && e.situacao === "saiu").length, atras = meus.filter(isLate).length;
    const cards = [
      [pend, "Para separar", "box", pend ? (diasDesde(maisVelho) ? `o mais antigo espera há ${diasDesde(maisVelho)} ${diasDesde(maisVelho) === 1 ? "dia" : "dias"}` : "chegaram hoje") : "nada esperando", "envios", { envStatus: "pendente" }],
      [trans, "Em trânsito", "truck", saiu ? `${saiu} ${saiu === 1 ? "saiu" : "saíram"} para entrega` : aten.length ? `${aten.length} ${aten.length === 1 ? "precisa" : "precisam"} de atenção` : "andando normalmente", "rastreio"],
      [meus.length, meus.length === 1 ? "Tarefa com você" : "Tarefas com você", "tarefa", atras ? `${atras} ${atras === 1 ? "atrasada" : "atrasadas"}` : meus.length ? "tudo no prazo" : "nada pendente", "pedidos", { pedF: "meus" }],
      [entMes, "Entregues no mês", "check", `desde 1º de ${new Date().toLocaleDateString("pt-BR", { month: "long" })}`, "envios", { envStatus: "entregue" }],
    ];
    // para a correria: números numa linha, "Para hoje" largo com estoque e atividade ao lado, gráfico por último
    const welcome = hero() + `<div class="cartela">${cards.map(kp).join("")}</div>`;
    return `${welcome}<div class="home home-v2">
      <div class="h-esq"><div class="h-hoje">${paraHojeHTML()}</div>
      <div class="h-graf-fim">${graficoEnvios()}</div></div>
      <div class="h-lado">${alertaEstoqueHTML(st, baixos)}
      <aside class="h-ativ"><section class="card"><div class="card-h"><div><h2>Atividade recente</h2><div class="sub">O que a equipe fez por último</div></div>${feed ? `<button class="link" id="atvTudo">Ver tudo</button>` : ""}</div><div class="atv">${feed || `<p class="muted" style="padding:4px 18px 16px">Nenhuma atividade ainda.</p>`}</div></section></aside></div></div>`;
  },
  after() {
    $$("[data-go]", $("#vbody")).forEach(b => b.onclick = () => go(b.dataset.go, JSON.parse(b.dataset.opts || "{}")));
    $$("[data-hoje]", $("#vbody")).forEach(b => b.onclick = () => HOJE[+b.dataset.hoje]?.fn());
    ligarGrafico();
    const a = (id, fn) => { const b = $("#" + id); if (b) b.onclick = fn; };
    a("hSeparar", () => modoSeparacao()); a("hCorreio", chamarCorreio); a("hNotas", importarNotasDrawer); a("hContar", () => contagemModo());
    $$("[data-alitem]", $("#vbody")).forEach(b => b.onclick = () => histDrawer(b.dataset.alitem));
    const av = $("#alVer"); if (av) av.onclick = () => go("estoque", { estBaixo: true });
    const tudo = $("#atvTudo"); if (tudo) tudo.onclick = atividadeDrawer;
  }
};
/* ---------- Início: brindes em alerta (os 6 mais urgentes), com a barrinha de duração ---------- */
function alertaEstoqueHTML(st, baixos) {
  const taxa = consumoDiario();
  const l = baixos.map(i => { const s = st[i.id] || { fis: 0, res: 0, disp: 0 }; return { i, s, dias: diasRestantes(taxa[i.id], s.disp), k: stockState(i, s)[0] }; })
    .sort((a, b) => (a.k === "zero" ? 0 : 1) - (b.k === "zero" ? 0 : 1) || a.s.disp - b.s.disp).slice(0, 6);
  const corpo = l.length ? `<div class="al-lista">${l.map(({ i, s, dias, k }) => {
      const min = Number(i.minimo) || 0, pct = k === "zero" ? 3 : Math.max(6, Math.min(100, min ? s.disp / (min * 2) * 100 : 50));
      return `<button class="al-l" data-alitem="${esc(i.id)}"><span class="st-av" style="--hue:${corDe(i.categoria || "Outros")}">${esc(initials(i.nome.replace(/\s*·.*$/, "")))}</span>
        <span class="al-nm"><b>${esc(i.nome)}</b><small>${esc(i.codigo || "")}${min ? ` · mínimo ${fmtN(min)}` : ""}${dias != null ? ` · ${esc(textoDias(dias))}` : ""}</small><span class="st-nivel st-nv-${k}"><i style="width:${pct}%"></i></span></span>
        <span class="al-q ${k}"><b class="num">${fmtN(Math.max(0, s.disp))}</b><small>${s.disp < 0 ? `faltam ${fmtN(-s.disp)}` : k === "zero" ? "sem estoque" : "disponíveis"}</small></span></button>`; }).join("")}</div>`
    : `<p class="muted" style="padding:6px 22px 20px">Tudo acima do mínimo. ${ic("check", "i-sm")}</p>`;
  return `<section class="card h-alerta"><div class="card-h"><div><h2>Estoque em alerta</h2><div class="sub">${baixos.length ? `${baixos.length} ${baixos.length === 1 ? "brinde precisa" : "brindes precisam"} de atenção` : "Nenhum brinde abaixo do mínimo"}</div></div>${baixos.length ? `<button class="link" id="alVer">Ver todos</button>` : ""}</div>${corpo}</section>`;
}
/* ---------- gráfico do Início: envios por mês (últimos 6), entregues × em andamento ----------
   Colunas empilhadas de até 24px, 2px de respiro entre as partes, ponta arredondada só em cima.
   Cores conferidas no validador de daltonismo; "em andamento" ainda leva listras (não depende só da cor).
   Passar o mouse (ou o Tab) numa coluna mostra os números do mês; a tabela escondida lê para leitor de tela. */
let GF = [];
function graficoEnvios() {
  const ini = new Date(); ini.setDate(1); ini.setHours(0, 0, 0, 0);
  GF = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(ini); d.setMonth(d.getMonth() - i); GF.push({ d, ent: 0, and: 0 }); }
  const fim = k => k < 5 ? GF[k + 1].d.getTime() : Infinity;
  for (const e of S.envios) {
    if (e.status === "cancelado" || !e.criadoEm) continue;
    const k = GF.findIndex((m, j) => e.criadoEm >= m.d.getTime() && e.criadoEm < fim(j));
    if (k >= 0) GF[k][e.status === "entregue" ? "ent" : "and"]++;
  }
  const tot = GF.map(m => m.ent + m.and), max = Math.max(...tot);
  const mesN = d => d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const cab = `<div class="card-h"><div><h2>Envios por mês</h2><div class="sub">Últimos 6 meses, pela data do envio</div></div>
    <div class="gf-leg"><span><i class="gf-k ent"></i>Entregues</span><span><i class="gf-k and"></i>Em andamento</span></div></div>`;
  if (!max) return `<section class="card h-graf">${cab}<p class="muted" style="padding:18px 22px">Nenhum envio nos últimos 6 meses.</p></section>`;
  // escala com números redondos (1, 2, 5 × 10ⁿ)
  const bruto = max / 4, pot = Math.pow(10, Math.floor(Math.log10(bruto || 1))), passo = Math.max(1, [1, 2, 5, 10].map(x => x * pot).find(x => x >= bruto));
  const topo = Math.ceil(max / passo) * passo, ticks = []; for (let t = 0; t <= topo; t += passo) ticks.push(t);
  const col = (m, k) => {
    const t = m.ent + m.and, partes = [m.and ? `<i class="and" style="flex:${m.and}"></i>` : "", m.ent ? `<i class="ent" style="flex:${m.ent}"></i>` : ""].join("");
    return `<div class="gf-c" tabindex="0" data-gf="${k}" aria-label="${esc(mesN(m.d))}: ${m.ent} entregues, ${m.and} em andamento">
      <div class="gf-bar" style="height:${t / topo * 100}%">${k === 5 && t ? `<b class="gf-v num">${fmtN(t)}</b>` : ""}${partes}</div></div>`;
  };
  return `<section class="card h-graf">${cab}
    <div class="gf" aria-hidden="false">
      <div class="gf-plot">
        ${ticks.map(t => `<div class="gf-gl" style="bottom:${t / topo * 100}%"><span class="num">${fmtN(t)}</span></div>`).join("")}
        <div class="gf-cols">${GF.map(col).join("")}</div>
      </div>
      <div class="gf-x">${GF.map((m, k) => `<span${k === 5 ? ' class="atual"' : ""}>${esc(mesN(m.d))}</span>`).join("")}</div>
      <div class="gf-tip" role="status" hidden></div>
    </div>
    <table class="gf-sr"><caption>Envios por mês</caption><thead><tr><th>Mês</th><th>Entregues</th><th>Em andamento</th></tr></thead><tbody>${GF.map(m => `<tr><td>${esc(mesN(m.d))}</td><td>${m.ent}</td><td>${m.and}</td></tr>`).join("")}</tbody></table></section>`;
}
function ligarGrafico() {
  const gf = $(".gf"); if (!gf) return;
  const tip = $(".gf-tip", gf);
  const mostrar = c => {
    const m = GF[+c.dataset.gf]; if (!m) return;
    tip.replaceChildren();
    const tit = document.createElement("b"); tit.className = "gf-tt"; tit.textContent = frase(m.d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })); tip.append(tit);
    for (const [cls, v, l] of [["and", m.and, "em andamento"], ["ent", m.ent, "entregues"]]) {
      const r = document.createElement("span"); r.className = "gf-tr";
      const k = document.createElement("i"); k.className = "gf-tk " + cls;
      const n = document.createElement("b"); n.className = "num"; n.textContent = fmtN(v);
      r.append(k, n, document.createTextNode(" " + l)); tip.append(r);
    }
    tip.hidden = false;
    const g = gf.getBoundingClientRect(), b = c.getBoundingClientRect();
    tip.style.left = Math.min(Math.max(8, b.left - g.left + b.width / 2 - tip.offsetWidth / 2), g.width - tip.offsetWidth - 8) + "px";
    $$(".gf-c", gf).forEach(x => x.classList.toggle("on", x === c));
  };
  const esconder = () => { tip.hidden = true; $$(".gf-c", gf).forEach(x => x.classList.remove("on")); };
  $$(".gf-c", gf).forEach(c => { c.onpointerenter = () => mostrar(c); c.onfocus = () => mostrar(c); c.onblur = esconder; });
  gf.onpointerleave = esconder;
}
// uma linha por acontecimento: quem, o quê e quando (o texto longo é cortado com "…")
const atvLinha = a => `<div class="atv-l">${avatar(a.by, "xs")}<span class="atv-t">${a.html}</span><time>${ago(a.t)}</time></div>`;
function atividadeDrawer() {
  const dia = t => { const d = new Date(t), h = new Date(); const o = new Date(h); o.setDate(h.getDate() - 1); if (d.toDateString() === h.toDateString()) return "Hoje"; if (d.toDateString() === o.toDateString()) return "Ontem"; return frase(d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })); };
  let html = "", ult = "";
  for (const a of activity(80)) { const d = dia(a.t); if (d !== ult) { html += `<div class="section-t">${esc(d)}</div>`; ult = d; } html += atvLinha(a); }
  openDrawer({ eyebrow: "Início", title: "Atividade recente", narrow: true, body: `<div class="atv atv-full">${html}</div>`, foot: `<button class="btn primary" data-close>Fechar</button>` });
}
// histórico da equipe, do mais novo para o mais antigo; o texto só é montado para os "n" que vão aparecer
// (montar o texto de todos os envios e movimentações do ano pesava a cada atualização do Início)
function activity(n = Infinity) {
  const a = [];
  const b = s => `<b>${esc(s)}</b>`;
  for (const p of S.pedidos) {
    a.push({ t: p.criadoEm, by: p.autor, h: () => `${b(firstName(p.autor))} pediu: ${esc(p.texto.split("\n")[0].slice(0, 80))}` });
    if (p.status === "concluido" && p.concluidoEm) a.push({ t: p.concluidoEm, by: p.concluidoPor, h: () => `${b(firstName(p.concluidoPor))} concluiu uma tarefa de ${esc(firstName(p.autor))}` });
  }
  for (const e of S.envios) {
    a.push({ t: e.criadoEm, by: e.criadoPor, h: () => `${b(firstName(e.criadoPor))} registrou envio para ${b(e.destinatario)}` });
    if (e.separadoEm && e.status !== "cancelado") a.push({ t: e.separadoEm, by: e.separadoPor, h: () => e.separadoPor ? `${b(firstName(e.separadoPor))} separou o envio para ${esc(e.destinatario)}` : `Envio para ${b(e.destinatario)} foi separado` });
    if (e.postadoEm && (e.status === "postado" || e.status === "entregue")) a.push({ t: e.postadoEm, by: e.postadoPor, h: () => (e.postadoPor ? `${b(firstName(e.postadoPor))} postou o envio para ${esc(e.destinatario)}` : `Envio para ${b(e.destinatario)} foi postado`) + (e.servico ? " (" + esc(e.servico) + ")" : "") });
    if (e.entregueEm && e.status === "entregue") a.push({ t: e.entregueEm, by: e.entreguePor, h: () => e.recebidoEm ? `Representante confirmou o recebimento do envio para ${b(e.destinatario)}` : `Envio para ${b(e.destinatario)} foi entregue` });
  }
  for (const m of S.movimentos) {
    if (m.tipo === "entrada") a.push({ t: m.em, by: m.por, h: () => `${b(firstName(m.por))} deu entrada de ${fmtN(m.qtd)} ${esc(itemName(m.itemId))}` });
    if (m.tipo === "saida") a.push({ t: m.em, by: m.por, h: () => `${b(firstName(m.por))} registrou saída de ${fmtN(-m.qtd)} ${esc(itemName(m.itemId))}${m.motivo ? ` (${esc(m.motivo.toLowerCase())})` : ""}` });
  }
  return a.filter(x => x.t).sort((x, y) => y.t - x.t).slice(0, n).map(x => ({ t: x.t, by: x.by, html: x.h() }));
}
