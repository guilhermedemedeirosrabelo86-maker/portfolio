/* Central de Brindes · Rastreamento, Estoque, Representantes e Equipe */
"use strict";

/* ---------- Rastreamento ---------- */
VIEWS.rastreio = {
  head: () => pageHead("Operação", "Rastreamento", "Envios postados até a entrega. O que está atrasado ou com problema aparece primeiro."),
  bind() { $$("[data-go2]").forEach(b => b.onclick = () => go(b.dataset.go2, { envStatus: "postado" })); },
  body() {
    if (loading()) return skeleton("Carregando rastreamento…");
    const E = S.envios;
    const aguardando = E.filter(e => e.status === "pendente" || e.status === "separado");
    const transito = E.filter(e => e.status === "postado").sort((a, b) => (a.postadoEm || 0) - (b.postadoEm || 0));
    const atencao = transito.filter(precisaAtencao);
    const mes = new Date(); mes.setDate(1); mes.setHours(0, 0, 0, 0);
    const entregues = E.filter(e => e.status === "entregue");
    const entMes = entregues.filter(e => e.entregueEm >= mes.getTime());
    const prazos = entregues.filter(e => e.postadoEm && e.entregueEm && e.entregueEm >= Date.now() - 120 * 864e5).map(e => ({ e, d: Math.max(0, (e.entregueEm - e.postadoEm) / 864e5) }));
    const media = prazos.length ? prazos.reduce((a, x) => a + x.d, 0) / prazos.length : null;
    const freteMes = E.filter(e => e.postadoEm >= mes.getTime() && e.status !== "cancelado").reduce((a, e) => a + (Number(e.frete) || 0), 0);
    const strip = `<div class="strip">
      <button data-go="envios" data-opts='{"envStatus":"postado"}'><span class="lbl"><i class="sl-ic" style="--c:var(--sep-dot)">${ic("truck")}</i>Em trânsito</span><span class="val">${transito.length}</span><span class="sub">${(n => n === 1 ? "1 saiu para entrega" : n + " saíram para entrega")(transito.filter(e => e.situacao === "saiu").length)}</span></button>
      <div><span class="lbl"><i class="sl-ic" style="--c:var(--bad-dot)">${ic("alert")}</i>Precisam de atenção</span><span class="val">${atencao.length}</span><span class="sub${atencao.length ? " alert" : ""}">${atencao.length ? "veja logo abaixo" : "tudo andando normalmente"}</span></div>
      <button data-go="envios" data-opts='{"envStatus":"entregue"}'><span class="lbl"><i class="sl-ic" style="--c:var(--ok-dot)">${ic("check")}</i>Entregues no mês</span><span class="val">${entMes.length}</span><span class="sub">${freteMes ? "frete do mês " + fmtMoeda(freteMes) : "neste mês"}</span></button>
      <div><span class="lbl"><i class="sl-ic" style="--c:var(--pend-dot)">${ic("clock")}</i>Prazo médio</span><span class="val">${media != null ? media.toFixed(1).replace(".", ",") + " d" : "—"}</span><span class="sub">da postagem à entrega</span></div>
    </div>`;
    const motivo = e => e.situacao === "problema" ? `<span class="pill st-atrasado">Problema</span>` : e.situacao === "retirada" ? `<span class="pill st-pendente">Aguardando retirada</span>` : `<span class="pill st-atrasado">${diasDesde(e.postadoEm)} dias em trânsito</span>`;
    const acoes = e => `<div class="btns"><button class="btn sm" data-eact="situacao" data-id="${e.id}">${ic("rastreio")}Atualizar</button><button class="btn sm ghost wa" data-eact="avisar" data-id="${e.id}" title="Avisar representante" aria-label="Avisar representante">${ic("whats")}</button><a class="btn sm ghost icon" href="${rastreioUrl(codigosDe(e)[0] || "")}" target="_blank" rel="noopener" title="Ver nos Correios" aria-label="Ver nos Correios">${ic("ext")}</a></div>`;
    const atencaoHtml = atencao.length ? atencao.map(e => `<div class="li rt-row"><span class="ec-uf ${situacaoCls(e)}" style="width:38px;height:38px;font-size:12px">${esc(e.uf || "—")}</span><div class="grow"><div class="t">${esc(e.destinatario)}</div><div class="s"><span class="mono">${esc(codigosDe(e)[0] || "")}</span>${codigosDe(e).length > 1 ? ` +${codigosDe(e).length - 1} caixa${codigosDe(e).length > 2 ? "s" : ""}` : ""} · postado ${fmtDM(e.postadoEm)}${(e.historico || []).slice(-1)[0]?.nota ? " · " + esc(e.historico.slice(-1)[0].nota) : ""}</div></div>${motivo(e)}${acoes(e)}</div>`).join("")
      : empty("check", "Nada fora do normal", `Aparecem aqui envios com problema, aguardando retirada ou há mais de ${DIAS_ALERTA} dias em trânsito.`);
    const tabela = transito.length ? `<div class="tblwrap"><table class="tbl rt-tbl"><thead><tr><th>Destinatário</th><th>Código</th><th class="hide-sm">Serviço</th><th>Postado</th><th>Situação</th><th class="hide-sm">Avisado</th><th></th></tr></thead><tbody>${transito.map(e => `<tr>
        <td><div class="it-name"><b>${esc(e.destinatario)}</b><span style="font-family:var(--f)">${esc([e.cidade, e.uf].filter(Boolean).join("/"))}</span></div></td>
        <td><div class="rt-cods">${codigosDe(e).map((c, k) => `<button class="code copybtn" data-eact="copiar" data-id="${e.id}" data-cod="${esc(c)}" title="Copiar${codigosDe(e).length > 1 ? " (caixa " + (k + 1) + ")" : ""}">${esc(c)}</button>`).join("") || "—"}</div>${codigosDe(e).length > 1 ? `<small class="muted">${txtCaixas(codigosDe(e).length)}</small>` : ""}</td>
        <td class="hide-sm">${esc(e.servico || "—")}</td>
        <td style="white-space:nowrap"><span class="num ${atrasado(e) ? "q-neg" : ""}">${fmtDM(e.postadoEm)}</span><small class="muted" style="display:block">há ${diasDesde(e.postadoEm)} d</small></td>
        <td><span class="pill ${situacaoCls(e)}">${situacaoLabel(e)}</span></td>
        <td class="hide-sm">${e.avisadoEm ? `<span class="q-pos" style="font-size:13px">✓ ${fmtDM(e.avisadoEm)}</span>` : `<span class="muted">—</span>`}</td>
        <td>${acoes(e)}</td></tr>`).join("")}</tbody></table></div>`
      : empty("truck", "Nenhum envio em trânsito", "Quando você registrar a postagem de um envio, ele aparece aqui até ser entregue.");
    // envios por estado (últimos 90 dias)
    const porUF = {}; E.filter(e => e.status !== "cancelado" && e.criadoEm >= Date.now() - 90 * 864e5).forEach(e => { const u = e.uf || "—"; porUF[u] = (porUF[u] || 0) + 1; });
    const ufs = Object.entries(porUF).sort((a, b) => b[1] - a[1]).slice(0, 8), maxUF = Math.max(1, ...ufs.map(x => x[1]));
    const ufHtml = ufs.length ? `<div class="bars">${ufs.map(([u, n]) => `<div class="bar-row"><span class="uf">${esc(u)}</span><div class="bar-track"><i style="width:${n / maxUF * 100}%"></i></div><b class="num">${n}</b></div>`).join("")}</div>` : `<p class="muted" style="padding:0 18px 16px">Sem envios nos últimos 90 dias.</p>`;
    // prazo por serviço
    const porServ = {}; prazos.forEach(({ e, d }) => { const k = e.servico || "Outro"; (porServ[k] ||= []).push(d); });
    const servHtml = Object.keys(porServ).length ? `<div class="bars">${Object.entries(porServ).map(([k, arr]) => { const m = arr.reduce((a, x) => a + x, 0) / arr.length; return `<div class="bar-row"><span class="tag">${esc(k)}</span><div class="bar-track"><i style="width:${Math.min(100, m / 15 * 100)}%;background:var(--ok-dot)"></i></div><b class="num">${m.toFixed(1).replace(".", ",")} d</b></div>`; }).join("")}</div><p class="muted" style="padding:0 18px 14px;font-size:12.5px">Média de dias entre postagem e entrega (últimos 120 dias).</p>` : `<p class="muted" style="padding:0 18px 16px">Aparece quando houver entregas com data de postagem registrada.</p>`;
    // entregas por mês (6 meses)
    const meses = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() - i); meses.push(d); }
    const cont = meses.map((d, i) => { const fim = i < 5 ? meses[i + 1].getTime() : Infinity; return { d, n: E.filter(e => e.postadoEm >= d.getTime() && e.postadoEm < fim && e.status !== "cancelado").length }; });
    const maxM = Math.max(1, ...cont.map(x => x.n));
    const mesHtml = `<div class="cols">${cont.map(x => `<div class="col-b"><b class="num">${x.n || ""}</b><div class="col-track">${x.n ? `<i style="height:${x.n / maxM * 100}%"></i>` : ""}</div><span>${x.d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span></div>`).join("")}</div>`;
    return `${strip}
      ${recebimentosHTML()}
      <section class="card"><div class="card-h"><div><h2>Precisam de atenção</h2><div class="sub">Problema, aguardando retirada ou mais de ${DIAS_ALERTA} dias em trânsito</div></div></div><div class="list">${atencaoHtml}</div></section>
      <section class="card"><div class="card-h"><div><h2>Em trânsito</h2><div class="sub">Do mais antigo para o mais recente</div></div></div>${tabela}</section>
      <h2 class="sec-t">Relatórios</h2>
      <div class="rt-charts">
        <section class="card"><div class="card-h"><div><h2>Postagens por mês</h2><div class="sub">Últimos 6 meses</div></div></div>${mesHtml}</section>
        <section class="card"><div class="card-h"><div><h2>Prazo de entrega</h2><div class="sub">Por serviço dos Correios</div></div></div>${servHtml}</section>
        <section class="card"><div class="card-h"><div><h2>Envios por estado</h2><div class="sub">Últimos 90 dias</div></div></div>${ufHtml}</section>
      </div>`;
  },
  after() {
    $$("[data-go]", $("#vbody")).forEach(b => b.onclick = () => go(b.dataset.go, JSON.parse(b.dataset.opts || "{}")));
    $$("[data-eact]", $("#vbody")).forEach(b => b.onclick = ev => { ev.stopPropagation(); envAction(b.dataset.eact, b.dataset.id, b); });
    $$("[data-rct]", $("#vbody")).forEach(b => b.onclick = () => { F.rcTab = b.dataset.rct; renderBody(true); });
    const rt = $("#rcTodos"); if (rt) rt.onclick = () => perguntarLote(gruposRecebimento()[F.rcTab].filter(e => e.repId));
    $$("[data-rcpq]", $("#vbody")).forEach(b => b.onclick = ev => { ev.stopPropagation(); const e = S.envios.find(x => x.id === b.dataset.rcpq); if (e) { perguntarChegou(e); renderBody(true); } });
    $$("[data-rcver]", $("#vbody")).forEach(r => r.onclick = ev => { if (ev.target.closest("button,a")) return; envioDetalhe(r.dataset.rcver); });
  }
};

/* ---------- chegou para o representante? (status da confirmação de recebimento) ---------- */
function gruposRecebimento() {
  const agora = Date.now(), E = S.envios.filter(e => e.status !== "cancelado");
  return {
    caminho: E.filter(e => e.status === "postado" && !e.recebidoEm).sort((a, b) => (a.postadoEm || 0) - (b.postadoEm || 0)),
    falta: E.filter(e => e.status === "entregue" && !e.recebidoEm && (e.entregueEm || 0) > agora - 30 * 864e5).sort((a, b) => (a.entregueEm || 0) - (b.entregueEm || 0)),
    ok: E.filter(e => e.recebidoEm && e.recebidoOk !== false && e.recebidoEm > agora - 60 * 864e5).sort((a, b) => b.recebidoEm - a.recebidoEm),
    prob: E.filter(e => e.recebidoEm && e.recebidoOk === false).sort((a, b) => (a.problemaResolvido ? 1 : 0) - (b.problemaResolvido ? 1 : 0) || b.recebidoEm - a.recebidoEm),
  };
}
function recebimentosHTML() {
  const g = gruposRecebimento();
  const abas = [["caminho", "A caminho", g.caminho.length], ["falta", "Entregue, falta confirmar", g.falta.length], ["ok", "Confirmados", g.ok.length], ["prob", "Com problema", g.prob.filter(e => !e.problemaResolvido).length]];
  if (!abas.some(a => a[0] === F.rcTab)) F.rcTab = g.prob.some(e => !e.problemaResolvido) ? "prob" : "caminho";
  const lista = g[F.rcTab].slice(0, 40);
  const quem = e => e.repId ? `${paraClienteDe(e) ? "cliente de " : ""}${esc(repById(e.repId)?.nome || "")}` : "sem representante";
  const linha = e => {
    const dias = e.postadoEm ? diasDesde(e.postadoEm) : null, atrasado = F.rcTab === "caminho" && dias != null && dias >= diasParaPerguntar(e);
    const info = F.rcTab === "ok" ? `confirmado ${fmtDM(e.recebidoEm)}${e.postadoEm ? ` · chegou em ${Math.max(0, Math.round((e.recebidoEm - e.postadoEm) / 864e5))} dias` : ""}`
      : F.rcTab === "prob" ? `“${esc(e.recebidoObs || "")}” · ${fmtDM(e.recebidoEm)}${e.problemaResolvido ? " · resolvido" : ""}`
      : F.rcTab === "falta" ? `Correios entregou ${fmtDM(e.entregueEm)}${e.lembradoEm ? ` · perguntado ${fmtDM(e.lembradoEm)}` : ""}`
      : `postado ${fmtDM(e.postadoEm)} · <b class="${atrasado ? "late" : ""}">há ${dias} ${dias === 1 ? "dia" : "dias"}</b>${e.lembradoEm ? ` · perguntado ${fmtDM(e.lembradoEm)}` : ""}`;
    const acao = (F.rcTab === "caminho" || F.rcTab === "falta") && e.repId
      ? `<button class="btn sm ghost wa" data-rcpq="${e.id}" title="Perguntar pelo WhatsApp se chegou">${ic("whats")}<span class="bl">Perguntar</span></button>`
      : F.rcTab === "prob" && !e.problemaResolvido ? `<button class="btn sm" data-eact="resolvido" data-id="${e.id}">${ic("check")}<span class="bl">Resolvido</span></button>` : "";
    return `<div class="rc-l" data-rcver="${e.id}"><span class="rc-dot rc-${F.rcTab}${atrasado ? " late" : ""}" aria-hidden="true"></span><div class="grow"><b>${esc(nomeProprio(e.destinatario))}</b><small>${quem(e)}${e.pedidoVenda ? ` · pedido ${esc(e.pedidoVenda)}` : ""}</small><small>${info}</small></div>${acao}${ic("chev", "i rc-chev")}</div>`;
  };
  const vazio = { caminho: "Nenhum envio a caminho sem confirmação.", falta: "Nenhum envio entregue esperando confirmação.", ok: "Nenhuma confirmação nos últimos 60 dias.", prob: "Nenhum problema relatado." }[F.rcTab];
  return `<section class="card rc"><div class="card-h"><div><h2>Chegou para o representante?</h2><div class="sub">Quem já confirmou o recebimento pelo link e quem ainda não</div></div></div>
    <div class="seg rc-abas" role="group" aria-label="Situação da chegada">${abas.map(([k, l, n]) => `<button data-rct="${k}" aria-pressed="${F.rcTab === k}"${k === "prob" && n ? ' class="alerta"' : ""}>${l}<span class="n num">${n}</span></button>`).join("")}</div>
    <div class="rc-lista">${lista.map(linha).join("") || `<p class="muted" style="padding:14px 4px;margin:0">${vazio}</p>`}</div>
    ${F.rcTab !== "ok" && F.rcTab !== "prob" && g[F.rcTab].filter(e => e.repId).length > 1 ? `<button class="btn sm" id="rcTodos" style="margin-top:6px">${ic("whats")}Perguntar a todos de uma vez</button>` : ""}</section>`;
}

/* ---------- Estoque ----------
   Lista compacta: um brinde por linha (nome à esquerda, número grande à direita).
   Um toque na linha abre a ficha do brinde com as ações (entrada, saída, contar, editar) e o histórico. */
// fotos dos brindes recortadas do catálogo (assets/brindes/MK0000.jpg); sem foto, fica a sigla colorida
const FOTOS_BRINDES = new Set();   // DEMO: sem fotos de produtos (fica a sigla colorida)
const fotoDe = i => { const c = String(i?.codigo || "").toUpperCase().match(/MK\d{4}/); return c && FOTOS_BRINDES.has(c[0]) ? `assets/brindes/${c[0]}.jpg` : ""; };
const fotoHTML = (i, cls = "st-foto") => { const f = fotoDe(i); return f ? `<img class="${cls}" src="${f}" alt="" loading="lazy" decoding="async">` : `<span class="${cls} st-sem" style="--hue:${corDe(i.categoria || "Outros")}">${esc(initials(i.nome.replace(/\s*·.*$/, "")))}</span>`; };
const ORDEM_TAM = ["PP", "P", "M", "G", "GG", "XG", "XGG", "EXG"];
VIEWS.estoque = {
  head: () => pageHead("Cadastros", "Estoque de brindes", "Toque num brinde para dar entrada, saída, contar ou ver o histórico.",
    `<button class="btn icon" id="stMais" title="Mais ações" aria-label="Mais ações" aria-haspopup="menu">${ic("dots")}</button><button class="btn" id="stContar">${ic("count")}Contar estoque</button><button class="btn" id="stSaida">${ic("out")}Saída</button><button class="btn primary" id="stEntrada">${ic("in")}Entrada</button>`) +
    `<div class="toolbar env-tb"><div class="search">${ic("search")}<input class="input" id="stQ" type="search" placeholder="Buscar por nome ou código" value="${esc(F.estQ)}"></div></div>
    <div class="seg scroll" id="stCats" role="group" aria-label="Filtrar itens" style="margin-top:10px"></div>`,
  bind() {
    // ações de uso menos frequente ficam no "⋯", para a fila de botões não pesar
    $("#stMais").onclick = e => abrirMenu(e.currentTarget, [
      { c: "g-violet", icon: "plus", l: "Novo item", s: "Cadastrar um brinde", fn: () => itemForm() },
      { c: "g-amber", icon: "list", l: "Lista de compras", s: "O que repor e quanto pedir", fn: listaComprasDrawer },
      { c: "g-green", icon: "download", l: "Exportar Excel", s: "Planilha no formato da contagem", fn: () => exportarEstoqueExcel() },
    ]);
    $("#stContar").onclick = () => contagemModo();
    $("#stEntrada").onclick = () => movForm("entrada");
    $("#stSaida").onclick = () => saidaForm();
    $("#stQ").oninput = e => { F.estQ = e.target.value; renderBody(true); };
  },
  body() {
    const cats = [...new Set(S.itens.filter(i => !i.arquivado).map(i => i.categoria || "Outros"))].sort();
    if (F.estCat && !cats.includes(F.estCat)) F.estCat = "";
    const stc = loading() ? {} : stock(), ativosIt = S.itens.filter(i => !i.arquivado);
    const nAlerta = loading() ? 0 : ativosIt.filter(i => stockState(i, stc[i.id])[0] !== "ok").length;
    $("#stCats").innerHTML = [`<button data-stc="" aria-pressed="${!F.estCat && !F.estBaixo}">Todos<span class="n num">${ativosIt.length}</span></button>`,
      `<button data-stc="__alerta" class="alerta" aria-pressed="${F.estBaixo}">${ic("alert", "i-sm")}Em alerta<span class="n num">${nAlerta}</span></button>`,
      ...cats.map(c => `<button data-stc="${esc(c)}" aria-pressed="${F.estCat === c && !F.estBaixo}">${esc(c)}<span class="n num">${ativosIt.filter(i => (i.categoria || "Outros") === c).length}</span></button>`)].join("");
    $$("[data-stc]").forEach(b => b.onclick = () => { const v = b.dataset.stc; F.estBaixo = v === "__alerta"; F.estCat = v === "__alerta" ? "" : v; renderBody(true); });
    if (loading()) return skeleton("Carregando estoque…");
    if (!S.itens.length) return `<div class="card">${empty("box", "Nenhum brinde cadastrado", "Cadastre os itens para controlar o estoque.", `<button class="btn primary" id="stNovo2">${ic("plus")}Novo item</button>`)}</div>`;
    const st = stock(), q = norm(F.estQ), taxa = consumoDiario();
    // resumo: três números grandes (o de alerta filtra a lista)
    const sum = ativosIt.reduce((a, i) => { const x = st[i.id] || { fis: 0, res: 0 }; a.fis += Math.max(0, x.fis); a.res += x.res; return a; }, { fis: 0, res: 0 });
    const resumo = `<div class="st-resumo">
      <div class="st-tile"><b class="num">${fmtN(sum.fis)}</b><span>unidades na prateleira</span></div>
      <div class="st-tile"><b class="num">${fmtN(sum.res)}</b><span>reservadas para envios</span></div>
      <button class="st-tile${nAlerta ? " bad" : " ok"}" id="stAlertaT"${nAlerta ? "" : " disabled"}><b class="num">${nAlerta || ic("check")}</b><span>${nAlerta ? `${nAlerta === 1 ? "brinde" : "brindes"} em alerta` : "nada em alerta"}</span></button></div>`;
    let list = ativosIt;
    if (q) list = list.filter(i => norm(i.nome + " " + (i.codigo || "")).includes(q));
    if (F.estCat) list = list.filter(i => (i.categoria || "Outros") === F.estCat);
    if (F.estBaixo) list = list.filter(i => stockState(i, st[i.id])[0] !== "ok");
    if (!list.length) return resumo + `<div class="card">${empty("search", "Nenhum item encontrado", "Mude a busca ou os filtros.")}</div>`;
    const groups = {}; list.forEach(i => (groups[i.categoria || "Outros"] ||= []).push(i));
    // uma linha por brinde
    const linha = i => {
      const s = st[i.id] || { fis: 0, res: 0, disp: 0 }, [k, l] = stockState(i, s), min = Number(i.minimo) || 0;
      const dias = diasRestantes(taxa[i.id], s.disp);
      const sub = [esc(i.codigo || "sem código")]; if (porFardo(i)) sub.push(`fardo c/ ${fmtN(porFardo(i))}`);
      if (k !== "ok") sub.push(`<b class="st-txt-${k}">${l}${k === "baixo" && min ? ` · mínimo ${fmtN(min)}` : ""}</b>`);
      else if (dias != null && dias <= limiteCompra(i)) sub.push(`<b class="st-txt-baixo">${textoCompra(i, dias)}</b>`);
      // barrinha: quanto tempo o que tem dura no ritmo de saída dos últimos meses (cheia = 3 meses ou mais)
      const nivel = dias != null ? `<span class="st-nivel st-nv-${k === "ok" && dias <= limiteCompra(i) ? "baixo" : k}" title="${esc(textoDias(dias))}"><i style="width:${Math.max(4, Math.min(100, dias / 90 * 100))}%"></i></span>` : "";
      return `<button class="st-row st-${k}" data-item="${esc(i.id)}" aria-label="${esc(i.nome)}: ${fmtN(s.disp)} disponíveis. ${l}">
        <span class="st-av" style="--hue:${corDe(i.categoria || "Outros")}" aria-hidden="true">${esc(initials(i.nome.replace(/\s*·.*$/, "")))}<span class="st-dot"></span></span>
        <span class="st-nm"><b>${esc(i.nome)}</b><small>${sub.join(" · ")}</small>${nivel}</span>
        <span class="st-q"><b class="num">${fmtN(Math.max(0, s.disp))}</b><small>${s.disp < 0 ? `faltam ${fmtN(-s.disp)} p/ envios` : porFardo(i) ? `unidades · ${txtFardos(i, s.disp)}` : s.res ? `${fmtN(s.fis)} na prateleira` : s.disp === 1 ? "disponível" : "disponíveis"}</small></span>
        ${ic("chev", "i st-chev")}</button>`;
    };
    // vitrine: um cartão por brinde com a foto do catálogo; peças com tamanho viram um cartão só com os tamanhos lado a lado
    const nivelDe = (i, s, k) => { const d = diasRestantes(taxa[i.id], s.disp); return d != null ? `<span class="st-nivel st-nv-${k === "ok" && d <= limiteCompra(i) ? "baixo" : k}" title="${esc(textoDias(d))}"><i style="width:${Math.max(4, Math.min(100, d / 90 * 100))}%"></i></span>` : `<span class="st-nivel st-nv-vazio"></span>`; };
    const cartao = i => {
      const s = st[i.id] || { fis: 0, res: 0, disp: 0 }, [k, l] = stockState(i, s), min = Number(i.minimo) || 0, dias = diasRestantes(taxa[i.id], s.disp);
      const aviso = k !== "ok" ? `<span class="st-chip st-chip-${k}">${l}${k === "baixo" && min ? ` · mín. ${fmtN(min)}` : ""}</span>` : dias != null && dias <= limiteCompra(i) ? `<span class="st-chip st-chip-baixo">${esc(textoDias(dias))}</span>` : "";
      return `<button class="st-row st-card st-${k}" data-item="${esc(i.id)}" aria-label="${esc(i.nome)}: ${fmtN(s.disp)} disponíveis. ${l}">
        <span class="st-fotobox">${fotoHTML(i)}${aviso}</span>
        <span class="st-info"><small class="st-cod">${esc(i.codigo || "sem código")}${porFardo(i) ? ` · fardo c/ ${fmtN(porFardo(i))}` : ""}</small><b class="st-nome">${esc(frase(i.nome))}</b>
        <span class="st-num"><b class="num">${fmtN(Math.max(0, s.disp))}</b><small>${s.disp < 0 ? `faltam ${fmtN(-s.disp)} p/ envios` : porFardo(i) ? txtFardos(i, s.disp) : s.res ? `disponíveis · ${fmtN(s.fis)} na prateleira` : s.disp === 1 ? "disponível" : "disponíveis"}</small></span>${nivelDe(i, s, k)}</span></button>`;
    };
    const cartaoTam = l => {
      const i0 = l[0], ord = t => { const k = ORDEM_TAM.indexOf(String(t).toUpperCase()); return k < 0 ? 99 : k; };
      l = l.slice().sort((a, b) => ord(a.tamanho) - ord(b.tamanho) || String(a.tamanho).localeCompare(String(b.tamanho)));
      const tot = l.reduce((a, i) => a + Math.max(0, (st[i.id] || { disp: 0 }).disp), 0), piores = l.map(i => stockState(i, st[i.id])[0]);
      const k = piores.includes("zero") ? (piores.every(x => x === "zero") ? "zero" : "baixo") : piores.includes("baixo") ? "baixo" : "ok";
      const aviso = k !== "ok" ? `<span class="st-chip st-chip-${k}">${k === "zero" ? "Sem estoque" : `${piores.filter(x => x !== "ok").length} tamanho${piores.filter(x => x !== "ok").length > 1 ? "s" : ""} em alerta`}</span>` : "";
      return `<div class="st-card st-multi st-${k}"><span class="st-fotobox">${fotoHTML(i0)}${aviso}</span>
        <span class="st-info"><small class="st-cod">${esc(i0.codigo || "sem código")} · ${l.length} tamanhos</small><b class="st-nome">${esc(frase(nomeBase(i0.nome, i0.tamanho)))}</b>
        <span class="st-num"><b class="num">${fmtN(tot)}</b><small>disponíveis no total</small></span>
        <span class="st-tams">${l.map(i => { const s = st[i.id] || { disp: 0 }, kk = stockState(i, s)[0]; return `<button class="st-row st-tam st-${kk}" data-item="${esc(i.id)}" aria-label="${esc(nomeBase(i.nome, i.tamanho))} tamanho ${esc(i.tamanho)}: ${fmtN(s.disp)} disponíveis"><span>${esc(i.tamanho)}</span><b class="num">${fmtN(Math.max(0, s.disp))}</b></button>`; }).join("")}</span></span></div>`;
    };
    const vitrine = l => {
      const porCod = {}, out = [];
      l.slice().sort((a, b) => a.nome.localeCompare(b.nome)).forEach(i => { if (i.tamanho && i.codigo) { const c = norm(i.codigo); if (!porCod[c]) { porCod[c] = []; out.push(porCod[c]); } porCod[c].push(i); } else out.push(i); });
      return `<div class="st-vitrine">${out.map(x => Array.isArray(x) ? (x.length > 1 ? cartaoTam(x) : cartao(x[0])) : cartao(x)).join("")}</div>`;
    };
    const emLista = F.estVista === "lista";
    const tudoAberto = !!(q || F.estBaixo || F.estCat);
    // primeira visita (nunca abriu nem fechou categoria): com poucos brindes, já mostra tudo aberto
    if (!ABERTAS.pronto) { ABERTAS.pronto = true; if (!abertasSalvas() && list.length <= 60) Object.keys(groups).forEach(c => ABERTAS.add(c)); }
    const secoes = Object.keys(groups).sort().map(c => {
      const fechada = !tudoAberto && !ABERTAS.has(c), alertas = groups[c].filter(i => stockState(i, st[i.id])[0] !== "ok").length;
      return `<section class="st-grupo${fechada ? " fechada" : ""}"><button class="st-cab" data-cat="${esc(c)}" aria-expanded="${!fechada}"${tudoAberto ? " disabled" : ""}>${ic("chev", "i st-seta")}<span class="sec-t">${esc(c)}<span class="num">${groups[c].length}</span></span>${alertas ? `<span class="st-alerta">${ic("alert", "i-sm")}${alertas} em alerta</span>` : ""}</button>
      ${fechada ? "" : emLista ? `<div class="card st-lista">${groups[c].sort((a, b) => a.nome.localeCompare(b.nome)).map(linha).join("")}</div>` : vitrine(groups[c])}</section>`;
    }).join("");
    const nCats = Object.keys(groups).length, todasFechadas = Object.keys(groups).every(c => !ABERTAS.has(c));
    const vista = `<div class="seg st-vista" role="group" aria-label="Como mostrar"><button data-stv="vitrine" aria-pressed="${!emLista}" title="Cartões com foto" aria-label="Cartões com foto">${ic("painel", "i-sm")}</button><button data-stv="lista" aria-pressed="${emLista}" title="Lista compacta" aria-label="Lista compacta">${ic("list", "i-sm")}</button></div>`;
    const barra = `<div class="st-barra"><span class="muted">${nCats} ${nCats === 1 ? "categoria" : "categorias"}</span>${!tudoAberto && nCats > 1 ? `<button class="link st-todas" id="stTodas">${todasFechadas ? "Expandir todas" : "Recolher todas"}</button>` : ""}${vista}</div>`;
    return `${resumo}${barra}${secoes}<div class="foot-note num">${list.length} ${list.length === 1 ? "item" : "itens"}</div>`;
  },
  after() {
    $$("[data-item]", $("#vbody")).forEach(b => b.onclick = () => histDrawer(b.dataset.item));
    $$("[data-cat]", $("#vbody")).forEach(b => b.onclick = () => { const c = b.dataset.cat; ABERTAS.has(c) ? ABERTAS.delete(c) : ABERTAS.add(c); guardarAbertas(); renderBody(true); });
    const td = $("#stTodas"); if (td) td.onclick = () => { const cats = [...new Set(S.itens.filter(i => !i.arquivado).map(i => i.categoria || "Outros"))]; const abrir = cats.every(c => !ABERTAS.has(c)); ABERTAS.clear(); if (abrir) cats.forEach(c => ABERTAS.add(c)); guardarAbertas(); renderBody(true); };
    const at = $("#stAlertaT"); if (at) at.onclick = () => { F.estBaixo = true; F.estCat = ""; renderBody(true); };
    const n2 = $("#stNovo2"); if (n2) n2.onclick = () => itemForm();
    $$("[data-stv]", $("#vbody")).forEach(b => b.onclick = () => { F.estVista = b.dataset.stv; try { localStorage.setItem("cb-est-vista", F.estVista); } catch (e) { } renderBody(true); });
  }
};
function itemForm(it) {
  const cats = [...new Set(S.itens.map(i => i.categoria).filter(Boolean))].sort();
  const d = it || {};
  openDrawer({
    eyebrow: "Estoque", title: it ? "Editar item" : "Novo item", narrow: true,
    body: `<div class="row2"><label class="field"><span>Código</span><input class="input mono" id="itCod" value="${esc(d.codigo || "")}" placeholder="MK0000"></label>
      <label class="field"><span>Categoria</span><input class="input" id="itCat" list="catList" value="${esc(d.categoria || "")}"><datalist id="catList">${cats.map(c => `<option value="${esc(c)}">`).join("")}</datalist></label></div>
      <div class="row2"><label class="field"><span>Nome do item</span><input class="input" id="itNome" value="${esc(d.nome || "")}"></label>
      <label class="field"><span>Tamanho (opcional)</span><input class="input" id="itTam" value="${esc(d.tamanho || "")}" placeholder="P, M, G, GG, XG…"><small>Peça de roupa: um item por tamanho, com o mesmo código.</small></label></div>
      <div class="row2"><label class="field"><span>Valor unitário (R$, opcional)</span><input class="input num" id="itValor" inputmode="decimal" placeholder="0,00" value="${d.valor ? String(d.valor).replace(".", ",") : ""}"><small>Usado na declaração de conteúdo dos Correios.</small></label>
      <label class="field"><span>Demora para chegar (dias)</span><input class="input num" type="number" min="0" id="itPrazo" value="${temPrazo(d) ? d.prazoReposicao : ""}" placeholder="${PRAZO_PADRAO}"><small>Quanto o fornecedor leva para entregar depois do pedido. O aviso de "hora de comprar" vem com essa antecedência.</small></label></div>
      <div class="row2"><label class="field"><span>Estoque mínimo</span><input class="input num" type="number" min="0" id="itMin" value="${esc(d.minimo ?? 0)}"><small>Abaixo disso o item entra em alerta.</small></label>
      <label class="field"><span>Unidades por fardo (opcional)</span><input class="input num" type="number" min="0" id="itPf" value="${porFardo(d) || ""}" placeholder="Ex.: 50"><small>Preencha se você conta este brinde em fardos: o sistema multiplica e guarda em unidades.</small></label>
      ${it ? "" : `<label class="field"><span>Quantidade inicial</span><input class="input num" type="number" min="0" id="itIni" value="0"><small>O que tem hoje na prateleira.</small></label>`}</div>
      <div class="err" id="itErr" role="alert"></div>`,
    foot: `${it ? `<button class="btn ghost danger left" id="itArq">${ic("trash")}Arquivar</button>` : ""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="itOk">${ic("check")}Salvar</button>`,
    onMount() {
      $("#itCod").onchange = () => {
        const irmao = S.itens.find(i => i.tamanho && norm(i.codigo || "") === norm($("#itCod").value.trim()));
        if (!irmao) return;
        if (!$("#itNome").value.trim()) $("#itNome").value = irmao.nome.replace(/\s*·\s*[A-Z0-9]{1,4}$/i, "");
        if (!$("#itCat").value.trim()) $("#itCat").value = irmao.categoria || "";
        if (!$("#itTam").value.trim()) $("#itTam").focus();
      };
      $("#itOk").onclick = async () => {
        const tam = tamDe($("#itTam").value);
        let nome = $("#itNome").value.trim(); if (!nome) { $("#itErr").textContent = "Informe o nome do item."; return; }
        if (tam && !norm(nome).endsWith(norm(" · " + tam))) nome = nome.replace(/\s*·\s*[A-Z0-9]{1,4}$/i, "") + " · " + tam;   // "CAMISETA LOGO · XXG"
        const body = { codigo: $("#itCod").value.trim().toUpperCase(), nome: nome.toUpperCase(), categoria: $("#itCat").value.trim() || "Outros", minimo: Math.max(0, parseInt($("#itMin").value, 10) || 0), valor: lerValor($("#itValor").value), porFardo: Math.max(0, parseInt($("#itPf").value, 10) || 0), prazoReposicao: Math.max(0, Math.min(365, parseInt($("#itPrazo").value, 10) || 0)), tamanho: tam };
        const dup = tam && S.itens.find(i => i.id !== it?.id && !i.arquivado && i.tamanho === tam && norm(i.codigo || "") === norm(body.codigo));
        if (dup) { $("#itErr").textContent = `Já existe ${dup.nome} com esse código.`; return; }
        let ok;
        if (it) ok = await save(() => col("itens").doc(it.id).update(body), "Item atualizado");
        else {
          const ini = (parseInt($("#itIni").value, 10) || 0) * (body.porFardo > 1 ? body.porFardo : 1), ref = col("itens").doc();
          ok = await save(async () => { await ref.set({ ...body, criadoEm: Date.now() }); if (ini > 0) await col("movimentos").add({ itemId: ref.id, tipo: "entrada", qtd: ini, obs: "Quantidade inicial", por: myId, em: Date.now() }); }, "Item cadastrado");
        }
        if (ok) closeDrawer();
      };
      const a = $("#itArq"); if (a) a.onclick = () => armConfirm(a, "Confirmar", async () => { if (await save(() => col("itens").doc(it.id).update({ arquivado: true }), "Item arquivado")) closeDrawer(); });
    }
  });
}
// ---------- kits de brindes: combinações que se repetem (ex.: "Kit loja nova") ----------
const kitsOrdenados = () => S.kits.slice().sort((a, b) => a.nome.localeCompare(b.nome));
const resumoKit = k => (k.itens || []).map(l => `${fmtN(l.qtd)}× ${frase(itemName(l.itemId))}`).join(" · ");
function kitsDrawer() {
  const lista = kitsOrdenados();
  openDrawer({
    eyebrow: "Envios", title: "Kits de brindes", narrow: true,
    body: `<p class="muted" style="margin:0">Combinações de brindes que se repetem. No formulário de envio, um toque no kit já preenche os itens.</p>
      ${bloqueadas.has("kits") ? `<div class="banner">${ic("alert")}<span>Os kits ainda não foram liberados no banco: publique as regras novas no Firebase (Firestore → Regras).</span></div>` : ""}
      <div class="lines">${lista.map(k => `<button class="li li-btn kit-li" data-kit="${esc(k.id)}">${ic("box")}<div class="grow"><div class="t">${esc(k.nome)}</div><div class="s">${esc(resumoKit(k))}</div></div>${ic("chev", "i-sm muted")}</button>`).join("") || `<div class="empty" style="padding:18px">${ic("box")}<b>Nenhum kit ainda</b><p>Crie o primeiro: dê um nome e escolha os brindes.</p></div>`}</div>`,
    foot: `<button class="btn" data-close>Fechar</button><button class="btn primary" id="kitNovo">${ic("plus")}Novo kit</button>`,
    onMount(ov) {
      $("#kitNovo").onclick = () => kitForm();
      $$("[data-kit]", ov).forEach(b => b.onclick = () => kitForm(S.kits.find(k => k.id === b.dataset.kit)));
    }
  });
}
function kitForm(kit) {
  const itens = S.itens.filter(i => !i.arquivado).slice().sort((a, b) => a.nome.localeCompare(b.nome));
  if (!itens.length) return toast("Cadastre os brindes no Estoque primeiro.", "err");
  const opts = sel => `<option value="">Escolha o item…</option>` + itens.map(i => `<option value="${esc(i.id)}"${i.id === sel ? " selected" : ""}>${esc(i.nome)}${i.codigo ? " · " + esc(i.codigo) : ""}</option>`).join("");
  const linha = l => `<div class="line"><select class="select" data-ki aria-label="Item">${opts(l.itemId)}</select><input class="input num" type="number" min="1" step="1" data-kq value="${esc(l.qtd || "")}" placeholder="Qtd" aria-label="Quantidade"><button type="button" class="btn ghost icon" data-krm aria-label="Remover item">${ic("trash")}</button></div>`;
  const d = kit || { nome: "", itens: [{ itemId: "", qtd: "" }] };
  openDrawer({
    eyebrow: "Kits de brindes", title: kit ? "Editar kit" : "Novo kit", narrow: true,
    body: `<label class="field"><span>Nome do kit</span><input class="input" id="kNome" value="${esc(d.nome)}" placeholder="Ex.: Kit loja nova, Kit feira, Kit representante"></label>
      <div class="section-t">Brindes do kit</div>
      <div class="lines" id="kLines">${(d.itens.length ? d.itens : [{ itemId: "", qtd: "" }]).map(linha).join("")}</div>
      <button type="button" class="btn sm" id="kAdd" style="align-self:flex-start">${ic("plus")}Adicionar brinde</button>
      <div class="err" id="kErr" role="alert"></div>`,
    foot: `${kit ? `<button class="btn ghost danger left" id="kDel">${ic("trash")}Apagar</button>` : ""}<button class="btn" id="kVoltar">${ic("back")}Voltar</button><button class="btn primary" id="kOk">${ic("check")}Salvar kit</button>`,
    onMount(ov) {
      const liga = () => $$("[data-krm]", ov).forEach(b => b.onclick = () => { if ($$("#kLines .line", ov).length > 1) b.closest(".line").remove(); });
      liga();
      $("#kAdd").onclick = () => { $("#kLines").insertAdjacentHTML("beforeend", linha({ itemId: "", qtd: "" })); liga(); };
      $("#kVoltar").onclick = kitsDrawer;
      $("#kOk").onclick = async () => {
        const nome = $("#kNome").value.trim(), err = $("#kErr"); err.textContent = "";
        if (!nome) { err.textContent = "Dê um nome ao kit."; return; }
        const ag = {};
        for (const ln of $$("#kLines .line", ov)) {
          const id = $("[data-ki]", ln).value, q = parseInt($("[data-kq]", ln).value, 10);
          if (!id && !q) continue;
          if (!id) { err.textContent = "Escolha o brinde em todas as linhas."; return; }
          if (!(q > 0)) { err.textContent = `Informe a quantidade de ${itemName(id)}.`; return; }
          ag[id] = (ag[id] || 0) + q;
        }
        if (!Object.keys(ag).length) { err.textContent = "Coloque pelo menos um brinde no kit."; return; }
        const body = { nome, itens: Object.entries(ag).map(([itemId, qtd]) => ({ itemId, qtd })), atualizadoEm: Date.now() };
        const ok = await save(() => kit ? col("kits").doc(kit.id).update(body) : col("kits").add({ ...body, criadoPor: myId, criadoEm: Date.now() }), kit ? "Kit atualizado" : "Kit criado");
        if (ok) kitsDrawer();
      };
      const del = $("#kDel"); if (del) del.onclick = () => armConfirm(del, "Confirmar exclusão", async () => { if (await save(() => col("kits").doc(kit.id).delete(), "Kit apagado")) kitsDrawer(); });
    }
  });
}

// categorias do Estoque começam fechadas; as que a pessoa abre ficam guardadas neste aparelho
const ABERTAS = new Set((() => { try { return JSON.parse(localStorage.getItem("cb-est-abertas") || "[]"); } catch (e) { return []; } })());
function abertasSalvas() { try { return localStorage.getItem("cb-est-abertas") != null; } catch (e) { return false; } }
function guardarAbertas() { try { localStorage.setItem("cb-est-abertas", JSON.stringify([...ABERTAS])); } catch (e) { } }

// saída avulsa: material que saiu sem ser por envio (evento, uso interno, alguém retirou, perda…)
const MOTIVOS_SAIDA = ["Uso interno", "Evento / feira", "Retirado por alguém", "Doação / cortesia", "Perda ou avaria", "Outro"];
function saidaForm(itemId) {
  const st = stock();
  const itens = S.itens.filter(i => !i.arquivado).slice().sort((a, b) => a.nome.localeCompare(b.nome));
  if (!itens.length) { toast("Cadastre um item primeiro.", "err"); return; }
  let motivo = MOTIVOS_SAIDA[0];
  openDrawer({
    eyebrow: "Estoque", title: "Registrar saída avulsa", narrow: true,
    body: `<p class="muted" style="margin:0">Para material que saiu sem ser por um envio: uso interno, evento, alguém retirou, perda…</p>
      <label class="field"><span>Item</span><select class="select" id="sdItem">${itens.map(i => `<option value="${esc(i.id)}"${i.id === itemId ? " selected" : ""}>${esc(i.nome)}${i.codigo ? " · " + esc(i.codigo) : ""}</option>`).join("")}</select></label>
      <div class="stock-now" id="sdNow"></div>
      <label class="field"><span id="sdLbl">Quantidade que saiu</span><input class="input num" type="number" min="1" id="sdQtd"><small id="sdHint"></small></label>
      <div class="field"><span>Motivo</span><div class="seg" id="sdMot" role="group" aria-label="Motivo" style="flex-wrap:wrap">${MOTIVOS_SAIDA.map(m => `<button type="button" data-mot="${esc(m)}" aria-pressed="${m === motivo}">${esc(m)}</button>`).join("")}</div></div>
      <label class="field"><span>Quem retirou (opcional)</span><input class="input" id="sdQuem" placeholder="Ex.: Ana do Comercial, representante Carlos"></label>
      <label class="field"><span>Observação (opcional)</span><input class="input" id="sdObs" placeholder="Ex.: feira de Joinville, caixa danificada"></label>
      <div class="err" id="sdErr" role="alert"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="sdOk">${ic("out")}Registrar saída</button>`,
    onMount(ov) {
      const s = () => st[$("#sdItem").value] || { fis: 0, res: 0, disp: 0 };
      const pf = () => porFardo(itemById($("#sdItem").value)), un = () => (parseInt($("#sdQtd").value, 10) || 0) * (pf() || 1);
      const upd = () => { const x = s(); $("#sdNow").innerHTML = `<div><b class="num">${fmtN(x.fis)}</b><span>Em estoque</span></div><div><b class="num">${fmtN(x.res)}</b><span>Reservado</span></div><div><b class="num">${fmtN(x.disp)}</b><span>Disponível</span></div>`; $("#sdLbl").textContent = pf() ? `Quantos fardos saíram (fardo c/ ${fmtN(pf())})` : "Quantidade que saiu"; aviso(); };
      const aviso = () => { const q = un(), x = s(), h = $("#sdHint"); h.style.color = ""; h.textContent = pf() && q ? `= ${fmtN(q)} unidades. Desconta do estoque na hora.` : "Desconta do estoque na hora."; if (q > x.fis) { h.textContent = `Só há ${fmtN(x.fis)} na prateleira.`; h.style.color = "var(--bad)"; } else if (q > x.disp) { h.textContent = `Atenção: ${fmtN(q - Math.max(0, x.disp))} dessas unidades estão reservadas para envios pendentes.`; h.style.color = "var(--pend)"; } };
      upd(); $("#sdItem").onchange = upd; $("#sdQtd").oninput = aviso;
      $$("[data-mot]", ov).forEach(b => b.onclick = () => { motivo = b.dataset.mot; $$("[data-mot]", ov).forEach(x => x.setAttribute("aria-pressed", x === b)); });
      if (itemId) setTimeout(() => $("#sdQtd")?.focus(), 0);
      $("#sdOk").onclick = async () => {
        const id = $("#sdItem").value, q = un(), x = s();
        if (!(q > 0)) { $("#sdErr").textContent = "Informe a quantidade que saiu."; return; }
        if (q > x.fis) { $("#sdErr").textContent = `Não dá para tirar ${fmtN(q)}: só há ${fmtN(x.fis)} na prateleira. Se o estoque estiver errado, faça uma contagem antes.`; return; }
        $("#sdOk").disabled = true;
        const ok = await save(() => col("movimentos").add({ itemId: id, tipo: "saida", qtd: -q, motivo, retiradoPor: $("#sdQuem").value.trim(), obs: $("#sdObs").value.trim(), por: myId, em: Date.now() }), `Saída registrada: ${fmtN(q)} ${frase(itemName(id))}`);
        if (ok) closeDrawer(); else { const b = $("#sdOk"); if (b) b.disabled = false; }
      };
    }
  });
}
function movForm(tipo, itemId) {
  const st = stock();
  const itens = S.itens.filter(i => !i.arquivado).slice().sort((a, b) => a.nome.localeCompare(b.nome));
  if (!itens.length) { toast("Cadastre um item primeiro.", "err"); return; }
  const cont = tipo === "contagem";
  openDrawer({
    eyebrow: "Estoque", title: cont ? "Contagem de estoque" : "Registrar entrada", narrow: true,
    body: `${cont ? "" : `<button type="button" class="btn sm" id="mvNota" style="align-self:flex-start">${ic("in")}Tenho o XML da nota do fornecedor</button>`}<label class="field"><span>Item</span><select class="select" id="mvItem">${itens.map(i => `<option value="${esc(i.id)}"${i.id === itemId ? " selected" : ""}>${esc(i.nome)}${i.codigo ? " · " + esc(i.codigo) : ""}</option>`).join("")}</select></label>
      <div class="stock-now" id="mvNow"></div>
      <label class="field"><span id="mvLbl"></span><input class="input num" type="number" min="${cont ? 0 : 1}" id="mvQtd"><small id="mvHint"></small></label>
      <label class="field"><span>Observação</span><input class="input" id="mvObs" placeholder="${cont ? "Ex.: inventário de setembro" : "Ex.: NF 1234, gráfica, fornecedor"}"></label>
      <div class="err" id="mvErr" role="alert"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="mvOk">${ic("check")}${cont ? "Ajustar estoque" : "Registrar entrada"}</button>`,
    onMount() {
      const pf = () => porFardo(itemById($("#mvItem").value));
      const dica = () => { const q = parseInt($("#mvQtd").value, 10), base = cont ? "O sistema calcula a diferença e ajusta o estoque." : "Soma ao que já está em estoque."; $("#mvHint").textContent = pf() && q >= 0 ? `= ${fmtN(q * pf())} unidades. ${base}` : base; };
      const upd = () => { const s = st[$("#mvItem").value] || { fis: 0, res: 0, disp: 0 }; $("#mvLbl").textContent = pf() ? `${cont ? "Fardos contados na prateleira" : "Fardos que chegaram"} (fardo c/ ${fmtN(pf())})` : cont ? "Quantidade contada na prateleira" : "Quantidade que chegou"; dica(); $("#mvNow").innerHTML = `<div><b class="num">${fmtN(s.fis)}</b><span>Em estoque</span></div><div><b class="num">${fmtN(s.res)}</b><span>Reservado</span></div><div><b class="num">${fmtN(s.disp)}</b><span>Disponível</span></div>`; };
      upd(); $("#mvItem").onchange = upd; $("#mvQtd").oninput = dica;
      const mn = $("#mvNota"); if (mn) mn.onclick = entradaNotaDrawer;
      if (itemId) setTimeout(() => $("#mvQtd")?.focus(), 0);
      $("#mvOk").onclick = async () => {
        const id = $("#mvItem").value, q = parseInt($("#mvQtd").value, 10) * (pf() || 1);
        if (isNaN(q) || q < 0 || (!cont && q <= 0)) { $("#mvErr").textContent = "Informe uma quantidade válida."; return; }
        const fis = (st[id] || { fis: 0 }).fis, qtd = cont ? q - fis : q;
        if (cont && qtd === 0) { closeDrawer(); toast("A contagem bate com o sistema. Nada a ajustar."); return; }
        if (await save(() => col("movimentos").add({ itemId: id, tipo: cont ? "contagem" : "entrada", qtd, obs: $("#mvObs").value.trim(), por: myId, em: Date.now() }), cont ? `Estoque ajustado (${qtd > 0 ? "+" : ""}${fmtN(qtd)})` : "Entrada registrada")) closeDrawer();
      };
    }
  });
}
/* ---------- lista de compras: o que está acabando, com quantidade sugerida ----------
   Entra o que já está no mínimo (ou abaixo) e o que acaba antes de uma compra chegar (prazo de reposição + folga; pelo menos 30 dias).
   Sugestão: o suficiente para ~3 meses de consumo (ou 2× o mínimo, o que for maior), menos o disponível. */
function listaCompras() {
  const st = stock(), taxa = consumoDiario();
  const arred = n => n <= 20 ? Math.ceil(n) : n <= 200 ? Math.ceil(n / 10) * 10 : Math.ceil(n / 50) * 50;
  return S.itens.filter(i => !i.arquivado).map(i => {
    const s = st[i.id] || { disp: 0 }, min = Number(i.minimo) || 0, t = taxa[i.id] || 0, dias = diasRestantes(t, s.disp);
    const precisa = s.disp <= min || (dias != null && dias <= Math.max(30, limiteCompra(i))) || (s.disp <= 0 && t > 0);
    // sugestão: o que sai enquanto a compra não chega + uns 3 meses depois que chegar
    return precisa ? { i, disp: s.disp, min, dias, sug: Math.max(1, arred(Math.max(min * 2, t * (prazoDe(i) + 90)) - Math.max(0, s.disp))) } : null;
  }).filter(Boolean).sort((a, b) => (a.disp <= 0 ? -1 : a.dias ?? 999) - (b.disp <= 0 ? -1 : b.dias ?? 999));
}
function listaComprasDrawer() {
  const l = listaCompras();
  openDrawer({
    eyebrow: "Estoque", title: "Lista de compras", narrow: true,
    body: l.length ? `<p class="muted" style="margin:0">Brindes no mínimo ou que acabam antes de uma compra feita hoje chegar (pelo prazo de reposição de cada um). A quantidade sugerida cobre a espera e mais uns 3 meses; ajuste à vontade.</p>
      <div class="lc-lista">${l.map((x, k) => `<div class="lc-l"><div class="grow"><b>${esc(x.i.nome)}</b><small>${esc(x.i.codigo || "")}${x.i.codigo ? " · " : ""}${x.disp <= 0 ? `<span class="st-txt-zero">sem estoque</span>` : `${fmtN(x.disp)} disponíveis`}${x.min ? ` · mínimo ${fmtN(x.min)}` : ""}${x.dias != null && x.disp > 0 ? ` · ${textoCompra(x.i, x.dias)}` : ""}</small></div><input class="input num" type="number" min="0" step="1" data-lc="${k}" value="${x.sug}" aria-label="Quantidade para comprar de ${esc(x.i.nome)}"></div>`).join("")}</div>`
      : `<div class="empty" style="padding:18px">${ic("check")}<b>Nada para comprar agora</b><p>Nenhum brinde está no mínimo nem acabando antes de uma compra chegar.</p></div>`,
    foot: l.length ? `<button class="btn" id="lcCopiar">${ic("copy")}Copiar</button><button class="btn" id="lcTarefa">${ic("tarefa")}Virar tarefa</button><button class="btn primary" id="lcWa">${ic("whats")}Enviar</button>` : `<button class="btn primary" data-close>Fechar</button>`,
    onMount(ov) {
      if (!l.length) return;
      const texto = () => `Lista de compras de brindes (${fmtD(Date.now())}):\n` + l.map((x, k) => ({ x, q: parseInt($(`[data-lc="${k}"]`, ov).value, 10) || 0 })).filter(y => y.q > 0).map(({ x, q }) => `• ${fmtN(q)} × ${frase(x.i.nome)}${x.i.codigo ? ` (${x.i.codigo})` : ""}`).join("\n");
      $("#lcCopiar").onclick = () => copiar(texto(), "Lista copiada");
      $("#lcWa").onclick = () => abrirWa("", texto());
      $("#lcTarefa").onclick = () => tarefaForm(null, { texto: texto(), responsavel: myId });
    }
  });
}

/* ---------- entrada pela nota do fornecedor (XML) ----------
   Cada linha da nota é ligada a um brinde do estoque. O sistema lembra a ligação (pelo código do produto na nota)
   para as próximas notas do mesmo fornecedor. */
function itemDaLinhaNota(l) {
  const cod = String(l.codigo || "").toUpperCase(), nm = norm(l.nome);
  const ativos = S.itens.filter(i => !i.arquivado);
  return ativos.find(i => (i.aliases || []).includes(cod)) || ativos.find(i => String(i.codigo || "").toUpperCase() === cod)
    || ativos.find(i => norm(i.nome) === nm) || ativos.find(i => nm && (nm.includes(norm(i.nome)) || norm(i.nome).includes(nm))) || null;
}
function entradaNotaDrawer() {
  let nota = null;
  const itens = S.itens.filter(i => !i.arquivado).slice().sort((a, b) => a.nome.localeCompare(b.nome));
  const opts = sel => `<option value="">Não entra no estoque</option>` + itens.map(i => `<option value="${esc(i.id)}"${i.id === sel ? " selected" : ""}>${esc(i.nome)}${i.codigo ? " · " + esc(i.codigo) : ""}</option>`).join("");
  openDrawer({
    eyebrow: "Estoque", title: "Entrada pela nota do fornecedor", narrow: true,
    body: `<label class="drop" id="enDrop">${ic("in")}<b>Escolher o XML da nota</b><small>O arquivo .xml que o fornecedor manda junto com a nota</small><input type="file" id="enArq" accept=".xml,text/xml,application/xml" hidden></label>
      <div id="enRes"></div><div class="err" id="enErr" role="alert"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="enOk" disabled>${ic("check")}Dar entrada</button>`,
    onMount(ov) {
      const mostrar = () => {
        const ja = nota.chave && S.movimentos.find(m => m.chaveNfe === nota.chave);
        $("#enRes").innerHTML = `<div class="en-h"><b>NF ${esc(nota.nf || "?")}${nota.emitente ? ` · ${esc(nota.emitente)}` : ""}</b><small>${nota.emissao ? fmtD(nota.emissao) + " · " : ""}${nota.itens.length} ${nota.itens.length === 1 ? "item" : "itens"} na nota</small></div>
          ${ja ? `<div class="banner">${ic("alert")}<span>Esta nota já teve entrada em ${fmtD(ja.em)}. Se der entrada de novo, o estoque soma duas vezes.</span></div>` : ""}
          <div class="lines">${nota.itens.map((l, k) => `<div class="en-l"><div class="en-n"><b>${esc(l.nome)}</b><small>Código ${esc(l.codigo || "—")} · na nota: ${fmtN(l.qtd)}</small></div><div class="en-c"><select class="select" data-ens="${k}" aria-label="Brinde do estoque">${opts(itemDaLinhaNota(l)?.id || "")}</select><input class="input num" type="number" min="0" step="1" data-enq="${k}" value="${Math.round(l.qtd)}" aria-label="Quantidade que entra"></div></div>`).join("")}</div>
          <small class="muted">Confira a quantidade: se a nota vem em caixas ou pacotes, coloque o total de unidades.</small>`;
        $("#enOk").disabled = false;
      };
      $("#enArq").onchange = async ev => {
        const f = ev.target.files[0]; if (!f) return; $("#enErr").textContent = "";
        try { nota = lerXmlNfe(await f.text()); if (!nota.itens.length) throw new Error("A nota não tem itens"); mostrar(); }
        catch (x) { $("#enErr").textContent = "Não consegui ler esse arquivo: " + (x.message || x); }
      };
      $("#enOk").onclick = async () => {
        const linhas = nota.itens.map((l, k) => ({ l, id: $(`[data-ens="${k}"]`, ov).value, q: parseInt($(`[data-enq="${k}"]`, ov).value, 10) || 0 })).filter(x => x.id && x.q > 0);
        if (!linhas.length) { $("#enErr").textContent = "Ligue pelo menos uma linha da nota a um brinde do estoque."; return; }
        $("#enOk").disabled = true;
        const agora = Date.now(), obs = `NF ${nota.nf || ""}${nota.emitente ? " · " + nota.emitente : ""}`;
        const ok = await save(() => {
          const b = db.batch();
          for (const x of linhas) {
            b.set(col("movimentos").doc(), { itemId: x.id, tipo: "entrada", qtd: x.q, obs, chaveNfe: nota.chave || "", por: myId, em: agora });
            const it = itemById(x.id), cod = String(x.l.codigo || "").toUpperCase();
            if (cod && it && !(it.aliases || []).includes(cod) && String(it.codigo || "").toUpperCase() !== cod) b.update(col("itens").doc(x.id), { aliases: firebase.firestore.FieldValue.arrayUnion(cod) });
          }
          return b.commit();
        }, `Entrada registrada: ${linhas.length} ${linhas.length === 1 ? "brinde" : "brindes"}`);
        if (ok) closeDrawer(); else $("#enOk").disabled = false;
      };
    }
  });
}
function histDrawer(id) {
  const it = itemById(id); if (!it) return;
  setTimeout(() => { const b = $(".drawer .d-body"); if (b && fotoDe(it) && !$(".hd-foto", b)) b.insertAdjacentHTML("afterbegin", `<div class="hd-foto"><img src="${fotoDe(it)}" alt=""></div>`); }, 0);
  const s = stock()[id] || { fis: 0, res: 0, disp: 0 };
  const ev = [];
  S.movimentos.filter(m => m.itemId === id).forEach(m => ev.push({ em: m.em, qtd: m.qtd, t: m.tipo === "contagem" ? "Ajuste por contagem" : m.tipo === "saida" ? `Saída avulsa${m.motivo ? " · " + m.motivo : ""}` : "Entrada", s: [m.retiradoPor ? "retirado por " + m.retiradoPor : "", m.obs].filter(Boolean).join(" · "), por: m.por, mov: m.id }));
  S.envios.filter(e => e.status !== "cancelado" && (e.itens || []).some(l => l.itemId === id)).forEach(e => {
    const q = (e.itens || []).filter(l => l.itemId === id).reduce((a, l) => a + Number(l.qtd || 0), 0);
    ev.push({ em: e.separadoEm || e.criadoEm, qtd: -q, t: `Envio para ${e.destinatario}`, s: `${ST_ENVIO[e.status]}${e.status === "pendente" ? " (reservado)" : ""}${e.cidade ? " · " + e.cidade + (e.uf ? "/" + e.uf : "") : ""}`, por: e.criadoPor, res: e.status === "pendente" });
  });
  ev.sort((a, b) => b.em - a.em);
  openDrawer({
    eyebrow: [it.codigo, it.categoria, porFardo(it) ? `fardo c/ ${fmtN(porFardo(it))}` : ""].filter(Boolean).join(" · "), title: it.nome,
    body: `<div class="stock-now"><div><b class="num">${fmtN(s.fis)}</b><span>Na prateleira</span></div><div><b class="num">${fmtN(s.res)}</b><span>Reservado</span></div><div class="destaque st-${stockState(it, s)[0]}"><b class="num">${fmtN(s.disp)}</b><span>Disponível</span></div></div>
      <div class="it-acts">
        <button class="it-act" data-ia="entrada">${ic("in")}<span>Entrada</span></button>
        <button class="it-act" data-ia="saida">${ic("out")}<span>Saída</span></button>
        <button class="it-act" data-ia="contagem">${ic("count")}<span>Contar</span></button>
        <button class="it-act" data-ia="editar">${ic("edit")}<span>Editar</span></button></div>
      <div class="section-t">Movimentações</div>
      <div class="hist">${ev.map(x => `<div class="li">${avatar(x.por, "sm")}<div class="grow"><div class="t">${esc(x.t)}</div><div class="s">${fmtDT(x.em)} · ${who(x.por)}${x.s ? " · " + esc(x.s) : ""}</div></div><span class="num ${x.res ? "q-res" : x.qtd >= 0 ? "q-pos" : "q-neg"}">${x.qtd > 0 ? "+" : ""}${fmtN(x.qtd)}</span>${x.mov ? `<button class="btn sm ghost icon danger" data-delmov="${x.mov}" title="Desfazer lançamento" aria-label="Desfazer lançamento">${ic("undo")}</button>` : ""}</div>`).join("") || empty("list", "Nenhuma movimentação", "Registre uma entrada ou uma contagem.")}</div>`,
    foot: `<button class="btn primary" data-close>Fechar</button>`,
    onMount(ov) {
      $$("[data-ia]", ov).forEach(b => b.onclick = () => { const a = b.dataset.ia; if (a === "entrada") movForm("entrada", id); if (a === "contagem") movForm("contagem", id); if (a === "saida") saidaForm(id); if (a === "editar") itemForm(itemById(id)); });
      $$("[data-delmov]", ov).forEach(b => b.onclick = () => armConfirm(b, "Desfazer", async () => { if (await save(() => col("movimentos").doc(b.dataset.delmov).delete(), "Lançamento desfeito")) histDrawer(id); }));
    }
  });
}

/* ---------- modo contagem (inventário) ----------
   Tela cheia, um brinde por vez, número grande: digita quanto tem na prateleira e vai para o próximo.
   O progresso fica guardado no aparelho (dá para parar e continuar depois). No fim, mostra só as
   diferenças e aplica todos os ajustes de uma vez. */
const CT_KEY = "cb-contagem";
let CT = null;
const ctGuardar = () => { try { localStorage.setItem(CT_KEY, JSON.stringify(CT)); } catch (e) { } };
const ctLer = () => { try { const x = JSON.parse(localStorage.getItem(CT_KEY) || "null"); return x && Array.isArray(x.ids) ? x : null; } catch (e) { return null; } };
const ctApagar = () => { CT = null; try { localStorage.removeItem(CT_KEY); } catch (e) { } };
const ctItens = cat => S.itens.filter(i => !i.arquivado && (!cat || (i.categoria || "Outros") === cat))
  .sort((a, b) => (a.categoria || "Outros").localeCompare(b.categoria || "Outros") || a.nome.localeCompare(b.nome));
function ctFechar() { $("#sepRoot").innerHTML = ""; document.body.classList.remove("sep-on"); }
function ctTela(miolo, rodape = "", topo = "") {
  document.body.classList.add("sep-on"); closeDrawer(); fecharMenu();
  $("#sepRoot").innerHTML = `<div class="sep ct" role="dialog" aria-modal="true" aria-label="Contagem de estoque">
    <div class="sep-top"><button class="btn ghost icon" id="ctX" aria-label="Sair da contagem">${ic("x")}</button>${topo || `<b>Contagem de estoque</b><span style="width:40px"></span>`}</div>
    ${miolo}${rodape ? `<div class="sep-foot">${rodape}</div>` : ""}</div>`;
  $("#ctX").onclick = () => { ctFechar(); if (CT && Object.keys(CT.cont).length) toast("Contagem guardada. Continue quando quiser em Estoque → Contar estoque."); };
}
function contagemModo() {
  if (!S.itens.some(i => !i.arquivado)) return toast("Cadastre os brindes primeiro.", "err");
  const salvo = ctLer();
  const cats = [...new Set(S.itens.filter(i => !i.arquivado).map(i => i.categoria || "Outros"))].sort();
  ctTela(`<div class="sep-body">
      ${salvo ? `<div class="ct-retomar"><b>Você tem uma contagem em andamento</b><span>${Object.keys(salvo.cont).length} de ${salvo.ids.length} brindes contados${salvo.cat ? ` · ${esc(salvo.cat)}` : ""} · começou ${fmtDT(salvo.inicio)}</span>
        <button class="btn primary big" id="ctCont">${ic("count")}Continuar de onde parei</button></div>
        <div class="sec-t" style="margin-top:8px">Ou começar uma nova</div>` : ""}
      <p class="ct-dica">${ic("alert", "i-sm")}<span>Conte só o que está <b>na prateleira</b>. Não conte o que já está em caixas separadas para envio: isso já saiu do estoque no sistema.</span></p>
      <div class="ct-escopo">
        <button class="ct-op" data-ctcat=""><b>Tudo</b><span>${ctItens().length} brindes</span>${ic("chev")}</button>
        ${cats.length > 1 ? cats.map(c => `<button class="ct-op" data-ctcat="${esc(c)}"><b>${esc(c)}</b><span>${ctItens(c).length} ${ctItens(c).length === 1 ? "brinde" : "brindes"}</span>${ic("chev")}</button>`).join("") : ""}
      </div>
      <div class="sec-t" style="margin-top:8px">Já contou numa planilha?</div>
      <div class="ct-escopo"><button class="ct-op" id="ctBaixar"><b>Baixar planilha do estoque</b><span>Excel com o que está no sistema, para conferir ou contar</span>${ic("chev")}</button>
        <button class="ct-op" id="ctPlan"><b>Importar planilha da contagem</b><span>Excel (.xlsx) ou CSV</span>${ic("chev")}</button></div></div>`);
  $("#ctBaixar").onclick = e => exportarEstoqueExcel(e.currentTarget);
  $("#ctPlan").onclick = () => { ctFechar(); importarContagemDrawer(); };
  const c = $("#ctCont"); if (c) c.onclick = () => { CT = salvo; ctItem(); };
  $$("[data-ctcat]").forEach(b => b.onclick = () => {
    const ids = ctItens(b.dataset.ctcat).map(i => i.id);
    CT = { ids, i: 0, cont: {}, cat: b.dataset.ctcat, inicio: Date.now() }; ctGuardar(); ctItem();
  });
}
function ctItem() {
  CT.ids = CT.ids.filter(id => itemById(id) && !itemById(id).arquivado);
  if (CT.i >= CT.ids.length) return ctResumo();
  const id = CT.ids[CT.i], it = itemById(id), s = stock()[id] || { fis: 0 }, total = CT.ids.length, pf = porFardo(it) || 1, ja = CT.cont[id] != null ? CT.cont[id] / pf : null;
  ctTela(`<div class="sep-prog"><i style="width:${(CT.i / total) * 100}%"></i></div>
    <div class="sep-body ct-item">
      <div class="ct-cat">${esc(it.categoria || "Outros")}${it.codigo ? ` · <span class="mono">${esc(it.codigo)}</span>` : ""}</div>
      <h2 class="ct-nome">${esc(it.nome)}</h2>
      <div class="ct-sis">No sistema: <b class="num">${fmtN(s.fis)}</b> na prateleira${pf > 1 ? ` (${txtFardos(it, s.fis)})` : ""}</div>
      <label class="ct-lbl" for="ctQ">${pf > 1 ? `Quantos fardos você contou? <small>(fardo c/ ${fmtN(pf)})</small>` : "Quantos você contou?"}</label>
      <div class="ct-num"><button class="ct-pm" id="ctMenos" aria-label="Menos um">−</button>
        <input class="ct-in" id="ctQ" type="number" inputmode="numeric" min="0" step="1" value="${ja ?? ""}" placeholder="0" autocomplete="off">
        <button class="ct-pm" id="ctMais" aria-label="Mais um">+</button></div>
      <button class="btn ct-bate" id="ctBate">${ic("check")}Bate com o sistema (${fmtN(Math.max(0, s.fis))})</button>
      <div class="err" id="ctErr" role="alert"></div>
    </div>`,
    `<button class="btn primary big" id="ctProx">${CT.i + 1 < total ? "Próximo" : "Ver resumo"}${ic("chev")}</button>
     <div class="ct-nav"><button class="btn ghost" id="ctVolta"${CT.i ? "" : " disabled"}>${ic("back")}Anterior</button><button class="btn ghost" id="ctResumoB">${ic("list")}Resumo</button></div>`,
    `<span><b class="num">${CT.i + 1}</b> de <span class="num">${total}</span></span><button class="btn ghost sm" id="ctPular">Pular${ic("chev")}</button>`);
  const inp = $("#ctQ"), err = $("#ctErr");
  setTimeout(() => { inp.focus(); inp.select(); }, 60);
  const val = () => { const v = inp.value.trim(); if (v === "") return null; const n = Number(v); return Number.isInteger(n) && n >= 0 ? n : NaN; };
  const avancar = () => {
    const n = val();
    if (n === null) { err.textContent = "Digite a quantidade (ou toque em Pular)."; inp.focus(); return; }
    if (Number.isNaN(n)) { err.textContent = "Use um número inteiro, 0 ou mais."; inp.focus(); return; }
    CT.cont[id] = n * pf; CT.i++; ctGuardar(); if (navigator.vibrate) navigator.vibrate(12); ctItem();
  };
  const passo = d => { const n = val(); inp.value = Math.max(0, (Number.isInteger(n) ? n : 0) + d); err.textContent = ""; };
  $("#ctMenos").onclick = () => passo(-1);
  $("#ctMais").onclick = () => passo(1);
  $("#ctBate").onclick = () => { CT.cont[id] = Math.max(0, s.fis); CT.i++; ctGuardar(); ctItem(); };
  $("#ctProx").onclick = avancar;
  inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); avancar(); } };
  inp.oninput = () => { err.textContent = ""; };
  $("#ctPular").onclick = () => { CT.i++; ctGuardar(); ctItem(); };
  $("#ctVolta").onclick = () => { CT.i = Math.max(0, CT.i - 1); ctGuardar(); ctItem(); };
  $("#ctResumoB").onclick = ctResumo;
}
function ctResumo() {
  const st = stock(), contados = CT.ids.filter(id => CT.cont[id] != null), pulados = CT.ids.filter(id => CT.cont[id] == null);
  const difs = contados.map(id => ({ id, sis: (st[id] || { fis: 0 }).fis, cont: CT.cont[id] })).map(x => ({ ...x, d: x.cont - x.sis })).filter(x => x.d !== 0);
  const iguais = contados.length - difs.length;
  const linha = x => `<button class="ct-dif" data-ctir="${esc(x.id)}"><span class="grow"><b>${esc(itemName(x.id))}</b><small>sistema ${fmtN(x.sis)} → contado ${fmtN(x.cont)}</small></span><span class="ct-d num ${x.d > 0 ? "pos" : "neg"}">${x.d > 0 ? "+" : ""}${fmtN(x.d)}</span></button>`;
  ctTela(`<div class="sep-body">
      <div class="ct-nums"><div><b class="num">${contados.length}</b><span>contados</span></div><div class="ok"><b class="num">${iguais}</b><span>batem</span></div><div class="${difs.length ? "bad" : ""}"><b class="num">${difs.length}</b><span>com diferença</span></div>${pulados.length ? `<div><b class="num">${pulados.length}</b><span>pulados</span></div>` : ""}</div>
      ${difs.length ? `<div class="sec-t">Diferenças · toque para recontar</div><div class="card ct-lista">${difs.map(linha).join("")}</div>`
        : contados.length ? `<div class="sep-fim" style="flex:none;padding:12px"><span class="sep-ok">${ic("check")}</span><h2>Tudo bate com o sistema</h2><p class="muted">Nenhum ajuste a fazer.</p></div>` : `<p class="muted">Nenhum brinde contado ainda.</p>`}
      ${pulados.length ? `<div class="sec-t">Pulados · não serão ajustados</div><div class="card ct-lista">${pulados.map(id => `<button class="ct-dif" data-ctir="${esc(id)}"><span class="grow"><b>${esc(itemName(id))}</b><small>toque para contar</small></span>${ic("chev")}</button>`).join("")}</div>` : ""}
      <div class="err" id="ctErr" role="alert"></div></div>`,
    difs.length ? `<button class="btn primary big" id="ctAplicar">${ic("check")}Ajustar ${difs.length} ${difs.length === 1 ? "brinde" : "brindes"} no estoque</button><button class="btn" id="ctVoltar">${ic("back")}Voltar à contagem</button>`
      : `<button class="btn primary big" id="ctFim">${ic("check")}Concluir contagem</button><button class="btn" id="ctVoltar">${ic("back")}Voltar à contagem</button>`,
    `<b>Resumo da contagem</b><span style="width:40px"></span>`);
  $$("[data-ctir]").forEach(b => b.onclick = () => { CT.i = CT.ids.indexOf(b.dataset.ctir); ctGuardar(); ctItem(); });
  $("#ctVoltar").onclick = () => { const k = CT.ids.findIndex(id => CT.cont[id] == null); CT.i = k >= 0 ? k : Math.max(0, CT.ids.length - 1); ctGuardar(); ctItem(); };
  const fim = $("#ctFim"); if (fim) fim.onclick = () => { ctApagar(); ctFechar(); toast("Contagem concluída. Tudo bate com o sistema."); };
  const ap = $("#ctAplicar"); if (ap) ap.onclick = async () => {
    ap.disabled = true;
    const agora = Date.now(), obs = `Contagem de ${fmtD(CT.inicio)}`, atual = stock();
    // a diferença é calculada de novo na hora de gravar, com o estoque mais recente
    const lanc = difs.map(x => ({ itemId: x.id, qtd: x.cont - (atual[x.id] || { fis: 0 }).fis })).filter(x => x.qtd !== 0);
    const ok = await save(() => { const b = db.batch(); lanc.forEach(x => b.set(col("movimentos").doc(), { itemId: x.itemId, tipo: "contagem", qtd: x.qtd, obs, por: myId, em: agora })); return b.commit(); });
    if (!ok) { ap.disabled = false; return; }
    const n = lanc.length; ctApagar();
    ctTela(`<div class="sep-fim"><span class="sep-ok">${ic("check")}</span><h2>Estoque ajustado</h2><p class="muted">${n} ${n === 1 ? "brinde ajustado" : "brindes ajustados"}. Cada ajuste aparece no histórico do brinde como "Ajuste por contagem".</p>
      <button class="btn primary" id="ctVer">${ic("estoque")}Ver o estoque</button></div>`);
    $("#ctVer").onclick = () => { ctFechar(); go("estoque"); };
  };
}

/* ---------- importar contagem de uma planilha (.xlsx / .csv) ----------
   Lê as colunas Código e Quantidade (e, se tiver, Tamanho, Item e Categoria). Linha sem quantidade não mexe em nada.
   Tamanho (P, M, G…) vira um brinde próprio: id "MK0172-M", mesmo código e o campo `tamanho`. Na primeira vez,
   o brinde "geral" daquele código é zerado e arquivado. Cada diferença vira um "Ajuste por contagem".
   Importar a mesma planilha de novo não muda nada: o número contado passa a ser o do sistema. */
const XLSXJS = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
let xlsxLib = null;
const carregarXlsx = () => xlsxLib ||= carregarLib(XLSXJS, "sha384-vtjasyidUo0kW94K5MXDXntzOJpQgBKXmE7e2Ga4LG0skTTLeBi97eFAXsqewJjw", "leitor de planilha")
  .then(() => window.XLSX).catch(e => { xlsxLib = null; throw e; });
const tamDe = t => { const s = String(t ?? "").trim(); return ["", "unico", "todos", "un", "-"].includes(norm(s)) ? "" : s.toUpperCase(); };
async function lerPlanilhaContagem(file) {
  const X = await carregarXlsx(), wb = X.read(await file.arrayBuffer());
  const cab = c => norm(c).trim();
  for (const aba of wb.SheetNames) {
    const rows = X.utils.sheet_to_json(wb.Sheets[aba], { header: 1, defval: null, raw: true });
    const h = rows.findIndex(r => r.some(c => cab(c) === "codigo") && r.some(c => /^(quantidade|qtd|contado)/.test(cab(c))));
    if (h < 0) continue;
    const col_ = re => rows[h].findIndex(c => re.test(cab(c)));
    const c = { cod: col_(/^codigo$/), qtd: col_(/^(quantidade|qtd|contado)/), tam: col_(/^tamanho/), nome: col_(/^(item|nome|descricao)/), cat: col_(/^categoria/), emb: col_(/^embalagem/) };
    const linhas = [];
    for (const r of rows.slice(h + 1)) {
      const codigo = String(r[c.cod] ?? "").trim().toUpperCase();
      if (!/^[A-Z0-9][A-Z0-9.\-\/]*$/.test(codigo)) continue;
      const v = r[c.qtd], vazio = v == null || String(v).trim() === "";
      const por = c.emb >= 0 ? parseInt((String(r[c.emb] ?? "").match(/c\/\s*(\d+)/i) || [])[1], 10) || 0 : 0;   // "Caixa c/ 50 un."
      linhas.push({ codigo, por: por > 1 ? por : 0, tam: c.tam >= 0 ? tamDe(r[c.tam]) : "", nome: c.nome >= 0 ? String(r[c.nome] ?? "").trim() : "", cat: c.cat >= 0 ? String(r[c.cat] ?? "").trim() : "",
        qtd: vazio ? null : typeof v === "number" ? v : Number(String(v).trim().replace(/\./g, "").replace(",", ".")) });
    }
    return linhas;
  }
  throw new Error("Não achei as colunas Código e Quantidade na planilha.");
}
/* Item vendido em caixa (coluna Embalagem "Caixa c/ 50 un."): a contagem pode ter vindo em caixas ou em unidades.
   Palpite: se o número é múltiplo exato da caixa, já são unidades; senão, são caixas. Dá para trocar na tela. */
const chaveCx = l => l.codigo + "|" + l.tam;
const palpiteCaixa = l => { const it = S.itens.find(i => norm(i.codigo || i.id) === norm(l.codigo) && (i.tamanho || "") === l.tam); return it && porFardo(it) ? porFardo(it) === l.por : !(Number.isInteger(l.qtd) && l.qtd >= l.por && l.qtd % l.por === 0); };
// compara a planilha com o sistema: o que é novo, o que muda, o que bate
function planoContagem(linhas) {
  const st = stock(), fis = id => (st[id] || { fis: 0 }).fis;
  const doCodigo = cod => S.itens.filter(i => norm(i.codigo || i.id) === norm(cod));
  const ag = {}, pulados = [], invalidos = [], arquivar = new Map();
  for (const l of linhas) {
    if (l.qtd == null) { pulados.push(l); continue; }
    if (!Number.isInteger(l.qtd) || l.qtd < 0) { invalidos.push(l); continue; }
    const k = l.codigo + (l.tam ? "-" + l.tam : "");
    if (ag[k]) ag[k].qtd += l.qtd; else ag[k] = { ...l, k };   // mesmo item em duas linhas: soma
  }
  const novos = [], difs = [], iguais = [], fardos = [];
  for (const l of Object.values(ag)) {
    const mesmos = doCodigo(l.codigo), geral = mesmos.find(i => !i.tamanho && !i.arquivado) || mesmos.find(i => !i.tamanho);
    const it = l.tam ? mesmos.find(i => i.tamanho === l.tam) : geral;
    if (l.tam && geral && !geral.arquivado) arquivar.set(geral.id, geral);
    if (!it) { novos.push({ ...l, base: geral || mesmos[0] }); continue; }
    if (l.fardo != null && (porFardo(it) || 0) !== l.fardo) fardos.push({ it, porFardo: l.fardo });   // o sistema aprende o tamanho do fardo
    const sis = fis(it.id);
    (sis === l.qtd && !(it.arquivado && l.qtd) ? iguais : difs).push({ ...l, it, sis });
  }
  const ger = [...arquivar.values()].map(g => ({ it: g, sis: fis(g.id), res: (st[g.id] || { res: 0 }).res }));
  return { novos, difs, iguais, pulados, invalidos, arquivar: ger, fardos };
}
async function aplicarContagem(p) {
  const agora = Date.now(), st = stock(), ops = [], obs = `Contagem por planilha de ${fmtD(agora)}`;
  const mov = (itemId, qtd, o = obs) => { if (qtd) ops.push(b => b.set(col("movimentos").doc(), { itemId, tipo: "contagem", qtd, obs: o, por: myId, em: agora })); };
  for (const n of p.novos) {
    const id = S.itens.some(i => i.id === n.k) ? col("itens").doc().id : n.k;
    const nome = (n.nome || n.base?.nome || n.codigo).toUpperCase();
    ops.push(b => b.set(col("itens").doc(id), { codigo: n.codigo, nome: n.tam ? `${nome} · ${n.tam}` : nome, categoria: n.base?.categoria || n.cat || "Outros",
      minimo: 0, valor: n.base?.valor || 0, ...(n.tam ? { tamanho: n.tam } : {}), ...(n.fardo ? { porFardo: n.fardo } : {}), criadoEm: agora, origem: "contagem" }));
    mov(id, n.qtd);
  }
  for (const d of p.difs) {
    mov(d.it.id, d.qtd - (st[d.it.id] || { fis: 0 }).fis);
    if (d.it.arquivado && d.qtd) ops.push(b => b.update(col("itens").doc(d.it.id), { arquivado: false }));
  }
  for (const f of p.fardos) ops.push(b => b.update(col("itens").doc(f.it.id), { porFardo: f.porFardo }));
  for (const g of p.arquivar) {
    mov(g.it.id, -(st[g.it.id] || { fis: 0 }).fis, "Separado por tamanho (contagem por planilha)");
    ops.push(b => b.update(col("itens").doc(g.it.id), { arquivado: true }));
  }
  for (let i = 0; i < ops.length; i += 400) {   // o Firebase aceita até 500 gravações por vez
    const parte = ops.slice(i, i + 400);
    if (!await save(() => { const b = db.batch(); parte.forEach(f => f(b)); return b.commit(); })) return false;
  }
  return true;
}
function importarContagemDrawer() {
  const nomeL = l => esc((l.nome || l.base?.nome || l.it?.nome || l.codigo) + (l.tam && !l.it ? " · " + l.tam : ""));
  const lista = (t, arr, fn) => arr.length ? `<div class="sec-t">${t}</div><div class="card ct-lista">${arr.map(fn).join("")}</div>` : "";
  const lin = (nome, sub, dir = "") => `<div class="ct-dif"><span class="grow"><b>${nome}</b><small>${sub}</small></span>${dir}</div>`;
  const dlt = d => `<span class="ct-d num ${d > 0 ? "pos" : "neg"}">${d > 0 ? "+" : ""}${fmtN(d)}</span>`;
  openDrawer({
    eyebrow: "Estoque", title: "Importar planilha da contagem", wide: true,
    body: `<label class="drop" id="icDrop"><input type="file" id="icArq" accept=".xlsx,.xls,.csv" hidden>
        ${ic("in")}<b>Arraste a planilha da contagem aqui</b><span class="muted">ou toque para escolher · precisa das colunas Código e Quantidade (Tamanho é opcional)</span></label>
      <p class="muted" style="margin:0">Linha sem quantidade não mexe no estoque. Item em fardo (coluna Embalagem "Caixa c/ 50 un.") pode ser contado em fardos: o sistema multiplica e guarda em unidades. O número da planilha passa a ser o do sistema: dá para importar de novo quando terminar de contar.</p>
      <div id="icRes"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="icOk" disabled>${ic("check")}Ajustar estoque</button>`,
    onMount(ov) {
      let plano = null, linhas = [], emCaixa = {};
      const caixas = () => linhas.filter(l => l.por && Number.isFinite(l.qtd) && l.qtd > 0);
      const vezes = l => { const u = Math.round(l.qtd * l.por * 1000) / 1000; return Number.isInteger(u) ? u : l.qtd; };
      const replanejar = () => { plano = planoContagem(linhas.map(l => !l.por ? l : emCaixa[chaveCx(l)] ? { ...l, qtd: vezes(l), fardo: l.por } : { ...l, fardo: 0 })); mostrar(plano); };
      const ok = $("#icOk", ov), res = $("#icRes", ov);
      const mostrar = p => {
        const muda = p.novos.length + p.difs.length + p.arquivar.length + p.fardos.filter(f => !p.difs.some(d => d.it.id === f.it.id)).length;
        res.innerHTML = `<div class="ct-nums"><div><b class="num">${p.novos.length + p.difs.length + p.iguais.length}</b><span>contados</span></div><div class="ok"><b class="num">${p.iguais.length}</b><span>batem</span></div><div class="${p.difs.length ? "bad" : ""}"><b class="num">${p.difs.length}</b><span>mudam</span></div><div><b class="num">${p.novos.length}</b><span>novos</span></div>${p.pulados.length ? `<div><b class="num">${p.pulados.length}</b><span>sem número</span></div>` : ""}</div>
          ${p.invalidos.length ? `<div class="banner">${ic("alert")}<span>Quantidade que não entendi (fica de fora): ${p.invalidos.map(l => `${esc(l.codigo)}${l.tam ? " " + esc(l.tam) : ""}`).join(", ")}</span></div>` : ""}
          ${p.arquivar.some(g => g.res) ? `<div class="banner">${ic("alert")}<span>Há envios pendentes com ${p.arquivar.filter(g => g.res).map(g => esc(g.it.nome)).join(", ")} sem tamanho. Depois de importar, edite esses envios e escolha o tamanho.</span></div>` : ""}
          ${caixas().length ? `<div class="sec-t">Contado em fardos? · o sistema multiplica e guarda em unidades</div><div class="card ct-lista">${caixas().map(l => { const k = chaveCx(l), cx = emCaixa[k]; return `<label class="ct-dif"><input type="checkbox" data-iccx="${esc(k)}"${cx ? " checked" : ""}><span class="grow"><b>${esc(l.nome || l.codigo)}</b><small>${cx ? `${String(l.qtd).replace(".", ",")} fardos × ${fmtN(l.por)} = <b>${fmtN(vezes(l))} unidades</b>` : `${fmtN(l.qtd)} unidades (fardo com ${fmtN(l.por)})`}</small></span></label>`; }).join("")}</div>` : ""}
          ${lista("Mudam no estoque", p.difs, d => lin(nomeL(d), `sistema ${fmtN(d.sis)} → contado ${fmtN(d.qtd)}`, dlt(d.qtd - d.sis)))}
          ${lista("Novos · serão cadastrados", p.novos, n => lin(nomeL(n), `${esc(n.codigo)}${n.tam ? " · tamanho " + esc(n.tam) : ""} · ${esc(n.base?.categoria || n.cat || "Outros")}`, dlt(n.qtd)))}
          ${lista("Passam a ser separados por tamanho · o item geral é zerado e arquivado", p.arquivar, g => lin(esc(g.it.nome), `${esc(g.it.codigo || g.it.id)} · tinha ${fmtN(g.sis)} sem tamanho`, g.sis ? dlt(-g.sis) : ""))}
          ${lista("Sem número na planilha · não mexe", p.pulados, l => lin(nomeL(l), esc(l.codigo)))}`;
        $$("[data-iccx]", res).forEach(x => x.onchange = () => { emCaixa[x.dataset.iccx] = x.checked; replanejar(); });
        ok.disabled = !muda;
        ok.innerHTML = `${ic("check")}${muda ? `Ajustar ${muda} ${muda === 1 ? "brinde" : "brindes"}` : "Tudo bate com o sistema"}`;
      };
      const receber = async f => {
        res.innerHTML = `<p class="muted">Lendo ${esc(f.name)}…</p>`; ok.disabled = true;
        try { linhas = await lerPlanilhaContagem(f); emCaixa = {}; linhas.filter(l => l.por).forEach(l => emCaixa[chaveCx(l)] = palpiteCaixa(l)); replanejar(); }
        catch (x) { plano = null; res.innerHTML = ""; toast(`${f.name}: ${x.message}`, "err"); }
      };
      const inp = $("#icArq", ov), drop = $("#icDrop", ov);
      inp.onchange = () => { const f = inp.files[0]; inp.value = ""; if (f) receber(f); };
      drop.addEventListener("dragover", ev => { ev.preventDefault(); drop.classList.add("over"); });
      drop.addEventListener("dragleave", () => drop.classList.remove("over"));
      drop.addEventListener("drop", ev => { ev.preventDefault(); drop.classList.remove("over"); const f = ev.dataTransfer.files[0]; if (f) receber(f); });
      ok.onclick = async () => {
        if (!plano) return;
        ok.disabled = true; ok.textContent = "Ajustando…";
        if (await aplicarContagem(plano)) { closeDrawer(); toast("Estoque ajustado pela planilha"); go("estoque"); }
        else ok.disabled = false;
      };
    }
  });
}

/* ---------- exportar o estoque para Excel ----------
   Mesmo formato da planilha de contagem (Código, Item, Tamanho, Categoria, Embalagem, Quantidade…),
   então dá para baixar, contar em cima e importar de volta. Brinde em fardo sai com a quantidade em
   fardos (pode ter vírgula) e "Fardo c/ 50 un." na Embalagem; a coluna Unidades mostra o total. */
async function exportarEstoqueExcel(btn) {
  if (btn) btn.disabled = true;
  try {
    const X = await carregarXlsx(), st = stock(), hoje = new Date();
    const itens = S.itens.filter(i => !i.arquivado).sort((a, b) => (a.categoria || "Outros").localeCompare(b.categoria || "Outros") || a.nome.localeCompare(b.nome));
    const cab = ["Código", "Item", "Tamanho", "Categoria", "Embalagem", "Quantidade", "Unidades na prateleira", "Reservado p/ envios", "Disponível", "Mínimo", "Situação", "Observações"];
    const linhas = itens.map(i => {
      const s = st[i.id] || { fis: 0, res: 0, disp: 0 }, pf = porFardo(i);
      return [i.codigo || i.id, i.nome.replace(/\s*·\s*[A-Z0-9]{1,4}$/i, ""), i.tamanho || "Único", i.categoria || "Outros", pf ? `Fardo c/ ${pf} un.` : "Unidade",
        pf ? Math.round(s.fis / pf * 100) / 100 : s.fis, s.fis, s.res, s.disp, Number(i.minimo) || 0, stockState(i, s)[1], ""];
    });
    const tot = linhas.reduce((a, l) => [a[0] + l[6], a[1] + l[7], a[2] + l[8]], [0, 0, 0]);
    const aoa = [[`Estoque de Brindes · Empresa Demo`], [`Exportado em ${hoje.toLocaleDateString("pt-BR")} às ${hoje.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} por ${uname(myId)}`, null, null, null, null, `${linhas.length} brindes`], [], cab, ...linhas, [], ["", "Total", "", "", "", "", ...tot]];
    const ws = X.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [10, 42, 9, 22, 18, 12, 14, 14, 11, 9, 13, 24].map(w => ({ wch: w }));
    ws["!autofilter"] = { ref: X.utils.encode_range({ s: { r: 3, c: 0 }, e: { r: 3 + linhas.length, c: cab.length - 1 } }) };
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, "Estoque");
    X.writeFile(wb, `Estoque de Brindes - ${today()}.xlsx`);
    toast("Planilha do estoque baixada");
  } catch (e) { toast("Não foi possível gerar a planilha: " + e.message, "err"); }
  if (btn) btn.disabled = false;
}

/* ---------- cartelas que entraram em fardos ----------
   A planilha de 19/10/2026 foi importada antes de o sistema saber o tamanho do fardo: as cartelas ficaram com o
   número de FARDOS no lugar das unidades. Código → [unidades por fardo, fardos contados naquela planilha].
   Some sozinho depois de convertido (o brinde passa a ter porFardo). */
const FARDOS_PLANILHA = { MK0222: [25, 4], MK0151: [50, 94], MK0067: [100, 41], MK0275: [100, 47], MK0189: [100, 10], MK0294: [100, 49], MK0133: [50, 179], MK0221: [50, 71],
  MK0065: [100, 45], MK0161: [100, 48], MK0092: [50, 86], MK0058: [50, 106], MK0252: [100, 49], MK0251: [50, 127], MK0309: [100, 4], MK0393: [50, 82] };
function cartelasEmFardo() {
  if (loading()) return [];
  const st = stock();
  return Object.entries(FARDOS_PLANILHA).map(([cod, [p, cnt]]) => {
    const it = S.itens.find(i => !i.arquivado && !i.tamanho && norm(i.codigo || i.id) === norm(cod));
    if (!it || porFardo(it)) return null;
    const fis = (st[it.id] || { fis: 0 }).fis;
    return { it, p, fis, converter: fis > 0 && fis <= cnt };   // número na escala de fardos → multiplica
  }).filter(Boolean);
}
function converterFardosDrawer() {
  const l = cartelasEmFardo();
  if (!l.length) return toast("As cartelas já estão em unidades.");
  openDrawer({
    eyebrow: "Estoque", title: "Cartelas: fardos → unidades", narrow: true,
    body: `<p class="muted" style="margin:0">Estas cartelas entraram com o número de fardos. Marque as que devem ser multiplicadas pelo tamanho do fardo. Todas passam a ser contadas em fardos daqui para frente.</p>
      <div class="card ct-lista">${l.map((x, k) => `<label class="ct-dif"><input type="checkbox" data-cvf="${k}"${x.converter ? " checked" : ""}><span class="grow"><b>${esc(x.it.nome)}</b><small data-cvt="${k}"></small></span></label>`).join("")}</div>`,
    foot: `<button class="btn" data-close>Agora não</button><button class="btn primary" id="cvfOk">${ic("check")}Converter</button>`,
    onMount(ov) {
      const txt = c => { const x = l[+c.dataset.cvf]; $(`[data-cvt="${c.dataset.cvf}"]`, ov).innerHTML = c.checked ? `${fmtN(x.fis)} fardos × ${fmtN(x.p)} = <b>${fmtN(x.fis * x.p)} unidades</b>` : `já está em unidades: fica ${fmtN(x.fis)}`; };
      $$("[data-cvf]", ov).forEach(c => { txt(c); c.onchange = () => txt(c); });
      $("#cvfOk", ov).onclick = async () => {
        $("#cvfOk", ov).disabled = true;
        const agora = Date.now(), marcados = new Set($$("[data-cvf]", ov).filter(c => c.checked).map(c => +c.dataset.cvf));
        const ok = await save(() => {
          const b = db.batch();
          l.forEach((x, k) => {
            b.update(col("itens").doc(x.it.id), { porFardo: x.p });
            if (marcados.has(k) && x.fis > 0) b.set(col("movimentos").doc(), { itemId: x.it.id, tipo: "contagem", qtd: x.fis * (x.p - 1), obs: `Conversão de ${x.fis} fardos para unidades (fardo c/ ${x.p})`, por: myId, em: agora });
          });
          return b.commit();
        }, "Cartelas convertidas para unidades");
        if (ok) closeDrawer(); else $("#cvfOk", ov).disabled = false;
      };
    }
  });
}

/* ---------- Representantes ---------- */
VIEWS.reps = {
  head: () => pageHead("Cadastros", "Representantes", "Quem recebe brindes pelo Brasil e o histórico de envios de cada um.", `<button class="btn primary" id="rpNew">${ic("plus")}Novo representante</button>`) +
    `<div class="toolbar" style="margin-top:16px"><div class="search">${ic("search")}<input class="input" id="rpQ" type="search" placeholder="Buscar nome, cidade ou estado" value="${esc(F.repQ)}"></div></div>`,
  bind() { $("#rpNew").onclick = () => repForm(); $("#rpQ").oninput = e => { F.repQ = e.target.value; renderBody(true); }; },
  body() {
    if (loading()) return skeleton("Carregando…");
    if (!S.representantes.length) return `<div class="card">${empty("reps", "Nenhum representante cadastrado", "Cadastre para agilizar os envios: cidade, UF e endereço entram sozinhos no formulário.", `<button class="btn primary" id="rpNew2">${ic("plus")}Cadastrar representante</button>`)}</div>`;
    const q = norm(F.repQ);
    const list = S.representantes.filter(r => !q || norm([r.nome, r.apelido, r.cidade, r.uf, UF_NOME[r.uf], r.regiao].join(" ")).includes(q));
    if (!list.length) return `<div class="card">${empty("search", "Nenhum representante encontrado", "")}</div>`;
    // separado por estado, em ordem alfabética do nome do estado; sem estado vai por último
    const grupos = {};
    list.forEach(r => (grupos[r.uf || ""] ||= []).push(r));
    const ufs = Object.keys(grupos).sort((a, b) => !a ? 1 : !b ? -1 : (UF_NOME[a] || a).localeCompare(UF_NOME[b] || b));
    return `<div class="rp-lista">${ufs.map(uf => `<section class="rp-grupo"><h3 class="sec-t">${esc(uf ? UF_NOME[uf] || uf : "Sem estado")}<span class="num">${grupos[uf].length}</span></h3>
      <div class="rp-linhas">${grupos[uf].sort((a, b) => a.nome.localeCompare(b.nome)).map(r => `<button class="rp-l" data-rep="${r.id}"><span class="av" style="background:${corDe(r.nome)}">${esc(initials(r.nome))}</span><span class="rp-n"><b>${esc(r.nome)}</b>${r.regiao ? `<small>${esc(r.regiao)}</small>` : ""}</span><span class="rp-c">${esc(r.cidade || "")}</span>${ic("chev", "i rp-seta")}</button>`).join("")}</div></section>`).join("")}</div>`;
  },
  after() {
    const n2 = $("#rpNew2"); if (n2) n2.onclick = () => repForm();
    $$("[data-rep]", $("#vbody")).forEach(b => b.onclick = () => { const r = repById(b.dataset.rep); if (r) repFicha(r); });
  }
};
const UF_NOME = { AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul", MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco", PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina", SE: "Sergipe", SP: "São Paulo", TO: "Tocantins" };
// ficha do representante: tudo o que tem no cadastro, os números e os últimos envios
function repFicha(r) {
  const envs = S.envios.filter(e => e.repId === r.id && e.status !== "cancelado").sort((a, b) => b.criadoEm - a.criadoEm);
  const un = envs.reduce((a, e) => a + totalUn(e), 0);
  const tel = String(r.telefone || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  const fone = foneWa(r.telefone);
  // [ícone, rótulo, valor, ocupa a linha toda?]
  const dados = [
    r.telefone && ["phone", "Telefone", `<a href="tel:+55${esc(tel)}">${esc(fmtTel(r.telefone))}</a>`],
    r.cep && ["pin", "CEP", `<span class="num">${esc(r.cep)}</span>`],
    r.email && ["mail", "E-mail", `<span style="user-select:all">${esc(r.email)}</span>`, 1],
    r.endereco && ["truck", "Endereço de entrega", esc(r.endereco), 1],
    r.documento && ["shield", "CPF/CNPJ", `<span class="num" style="user-select:all">${esc(r.documento)}</span>`],
    r.apelido && ["user", "Como chamar", esc(r.apelido)],
  ].filter(Boolean);
  // os campos curtos andam em dupla; o que ficar sem par ocupa a linha toda (o quadro fica sempre fechado)
  for (let i = 0; i < dados.length; i++) if (!dados[i][3]) { if (dados[i + 1] && !dados[i + 1][3]) i++; else dados[i][3] = 1; }
  const sec = (t, h) => `<section class="ef-sec"><div class="ef-t"><h4>${t}</h4></div>${h}</section>`;
  openDrawer({
    eyebrow: "Representante", title: r.nome,
    body: `<div class="ef rp-ficha">
      <div class="rp-hero"><span class="av lg" style="background:${corDe(r.nome)}">${esc(initials(r.nome))}</span><div class="rp-hero-t"><b>${esc(r.cidade || "Cidade não informada")}</b><small>${esc([UF_NOME[r.uf], r.regiao].filter(Boolean).join(" · ") || "Representante")}</small></div>${r.uf ? `<span class="rp-uf">${esc(r.uf)}</span>` : ""}</div>
      <div class="rp-acoes"><button class="btn primary" id="rfEnvio">${ic("truck")}Novo envio</button>${fone ? `<button class="btn wa" id="rfWa">${ic("whats")}WhatsApp</button>` : ""}<button class="btn" id="rfEdit">${ic("edit")}Editar</button></div>
      ${sec("Contato e entrega", dados.length ? `<div class="rp-box rp-dados">${dados.map(([i, l, v, largo]) => `<div class="rp-it${largo ? " largo" : ""}"><span class="rp-ic">${ic(i, "i-sm")}</span><div><small>${l}</small><span>${v}</span></div></div>`).join("")}</div>` : `<p class="rp-box rp-vazio">Sem telefone, e-mail nem endereço. Toque em Editar para completar.</p>`)}
      ${r.obs ? sec("Observações", `<div class="obs">${esc(r.obs)}</div>`) : ""}
      <div class="stats rp-stats"><div><b class="num">${envs.length}</b><span>envio${envs.length === 1 ? "" : "s"}</span></div><div><b class="num">${fmtN(un)}</b><span>unidades</span></div><div><b class="num">${envs[0] ? fmtDM(envs[0].criadoEm) : "—"}</b><span>último</span></div></div>
      ${envs.length ? sec("Últimos envios", `<div class="rp-box rp-envs">${envs.slice(0, 3).map(e => `<button class="rp-env" data-env="${e.id}"><span>${fmtD(e.criadoEm)} · <b class="num">${fmtN(totalUn(e))}</b> un.</span><span class="pill ${situacaoCls(e)}">${situacaoLabel(e)}</span></button>`).join("")}</div><button class="btn ghost sm rp-todos" id="rfTodos">Ver todos os ${envs.length} envios${ic("chev", "i-sm")}</button>`) : ""}
    </div>`,
    onMount(ov) {
      $("#rfEdit").onclick = () => { closeDrawer(); repForm(r); };
      $("#rfEnvio").onclick = () => { closeDrawer(); envioForm(); const s = $("#evRep"); s.value = r.id; s.dispatchEvent(new Event("change")); };
      const wa = $("#rfWa"); if (wa) wa.onclick = () => abrirWa(fone, `Olá${r.apelido?.trim() ? ", " + r.apelido.trim() : ""}, `);
      const todos = $("#rfTodos"); if (todos) todos.onclick = () => { closeDrawer(); go("envios", { envRep: r.id, envStatus: "todos", envQ: "", envUF: "" }); };
      $$("[data-env]", ov).forEach(b => b.onclick = () => { closeDrawer(); envioDetalhe(b.dataset.env); });
    }
  });
}
function repForm(r) {
  const d = r || {};
  openDrawer({
    eyebrow: "Representante", title: r ? "Editar representante" : "Novo representante",
    body: `<div class="row2"><label class="field"><span>Nome</span><input class="input" id="rpNome" value="${esc(d.nome || "")}"></label>
      <label class="field"><span>Região ou empresa</span><input class="input" id="rpReg" value="${esc(d.regiao || "")}" placeholder="Ex.: Nordeste"></label></div>
      <label class="field"><span>Como chamar no WhatsApp (opcional)</span><input class="input" id="rpApelido" value="${esc(d.apelido || "")}" placeholder="Ex.: Carlos, Seu Zé, Dona Marta"><small id="rpApH"></small></label>
      <div class="row3"><label class="field"><span>Cidade</span><input class="input" id="rpCid" value="${esc(d.cidade || "")}"></label>
      <label class="field"><span>UF</span><select class="select" id="rpUF"><option value=""></option>${UFS.map(u => `<option${u === d.uf ? " selected" : ""}>${u}</option>`).join("")}</select></label>
      <label class="field"><span>CEP</span><input class="input" id="rpCep" inputmode="numeric" placeholder="00000-000" value="${esc(d.cep || "")}"><small id="rpCepHint">Preenche o endereço sozinho.</small></label></div>
      <label class="field"><span>Endereço de entrega</span><input class="input" id="rpEnd" value="${esc(d.endereco || "")}"></label>
      <div class="row2"><label class="field"><span>Telefone</span><input class="input" id="rpTel" value="${esc(d.telefone || "")}"></label>
      <label class="field"><span>E-mail</span><input class="input" id="rpMail" value="${esc(d.email || "")}"></label></div>
      <label class="field"><span>CPF ou CNPJ (opcional)</span><input class="input" id="rpDoc" inputmode="numeric" value="${esc(d.documento || "")}"><small>Sai na declaração de conteúdo dos Correios.</small></label>
      <label class="field"><span>Observações</span><textarea class="textarea" id="rpObs" rows="3">${esc(d.obs || "")}</textarea></label>
      <div class="err" id="rpDup" role="alert"></div>
      <div class="err" id="rpErr" role="alert"></div>`,
    foot: `${r ? `<button class="btn ghost danger left" id="rpDel">${ic("trash")}Excluir</button>` : ""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="rpOk">${ic("check")}Salvar</button>`,
    onMount() {
      ligarCep({ cep: "#rpCep", end: "#rpEnd", cid: "#rpCid", uf: "#rpUF", hint: "#rpCepHint" });
      const prev = () => { const n = $("#rpApelido").value.trim(); $("#rpApH").textContent = n ? `As mensagens começam com: “Olá, ${n}, segue…”` : "Vazio: as mensagens começam com “Olá, segue…”. Preencha para incluir o nome da pessoa."; };
      $("#rpNome").addEventListener("input", prev); $("#rpApelido").addEventListener("input", prev); prev();
      /* já existe? mesmo nome, CPF/CNPJ ou telefone de outro representante */
      const dig = s => String(s || "").replace(/\D/g, "");
      const nomeChave = s => norm(s).replace(/\s+/g, " ").trim();
      const repetido = () => {
        const n = nomeChave($("#rpNome").value), doc = dig($("#rpDoc").value), tel = dig($("#rpTel").value).slice(-8);
        for (const o of S.representantes) {
          if (r && o.id === r.id) continue;
          if (n && nomeChave(o.nome) === n) return { o, por: "o mesmo nome" };
          if (doc.length >= 11 && dig(o.documento) === doc) return { o, por: "o mesmo CPF/CNPJ" };
          if (tel.length === 8 && dig(o.telefone).slice(-8) === tel) return { o, por: "o mesmo telefone" };
        }
        return null;
      };
      const avisarDup = () => {
        const d = repetido(), box = $("#rpDup");
        if (!d) { box.innerHTML = ""; return null; }
        box.innerHTML = `Já existe um representante com ${d.por}: <b>${esc(d.o.nome)}</b>${d.o.cidade ? ` (${esc(d.o.cidade)}${d.o.uf ? "/" + esc(d.o.uf) : ""})` : ""}. <button type="button" class="btn sm" id="rpVerDup">Abrir o cadastro dele</button>`;
        $("#rpVerDup").onclick = () => { closeDrawer(); repFicha(d.o); };
        return d;
      };
      ["#rpNome", "#rpDoc", "#rpTel"].forEach(s => $(s).addEventListener("input", avisarDup)); avisarDup();
      $("#rpOk").onclick = async () => {
        const nome = $("#rpNome").value.trim(); if (!nome) { $("#rpErr").textContent = "Informe o nome."; return; }
        const ok = $("#rpOk");
        if (avisarDup() && !ok.dataset.armed) { armConfirm(ok, "Já existe · salvar mesmo assim", () => { }); return; }
        const body = { nome, apelido: $("#rpApelido").value.trim(), regiao: $("#rpReg").value.trim(), cidade: $("#rpCid").value.trim(), uf: $("#rpUF").value, cep: $("#rpCep").value.trim(), endereco: $("#rpEnd").value.trim(), telefone: $("#rpTel").value.trim(), email: $("#rpMail").value.trim(), documento: $("#rpDoc").value.trim(), obs: $("#rpObs").value.trim() };
        if (await save(() => r ? col("representantes").doc(r.id).update(body) : col("representantes").add(body), r ? "Representante atualizado" : "Representante cadastrado")) closeDrawer();
      };
      const del = $("#rpDel"); if (del) del.onclick = () => armConfirm(del, "Confirmar exclusão", async () => { if (await save(() => col("representantes").doc(r.id).delete(), "Representante excluído")) closeDrawer(); });
    }
  });
}

/* ---------- Equipe ---------- */
VIEWS.equipe = {
  head: () => pageHead("Cadastros", "Equipe", "Quem usa a Central de Brindes e o que está com cada pessoa.", `<button class="btn" id="eqMe">${ic("user")}Editar meu perfil</button>${isAdmin() ? `<button class="btn primary" id="eqNew">${ic("plus")}Adicionar pessoa</button>` : ""}`),
  bind() { $("#eqMe").onclick = () => perfilGate(); const n = $("#eqNew"); if (n) n.onclick = novaPessoaDrawer; },
  body() {
    if (loading() || !loaded.perfis) return skeleton("Carregando equipe…");
    const list = S.perfis.slice().sort((a, b) => (a.ativo === false) - (b.ativo === false) || uname(a.id).localeCompare(uname(b.id)));
    if (!list.length) return `<div class="card">${empty("equipe", "Ninguém criou perfil ainda", "")}</div>`;
    return `<div class="grid-cards">${list.map(pf => {
      const com = S.pedidos.filter(p => p.status !== "concluido" && p.responsavel === pf.id).length;
      const feitos = S.pedidos.filter(p => p.autor === pf.id).length;
      const conc = S.pedidos.filter(p => p.concluidoPor === pf.id).length;
      const envs = S.envios.filter(e => e.criadoPor === pf.id).length;
      return `<article class="pcard${pf.ativo === false ? " off" : ""}"><div class="pcard-h">${avatar(pf.id, "lg")}<div class="who"><b>${who(pf.id)}</b><small>${pf.usuario ? "@" + esc(pf.usuario) + " · " : ""}${esc(pf.cargo || "Sem cargo informado")}${pf.ativo === false ? " · desativado" : ""}</small></div>${pf.id === myId ? `<span class="tag brand">Você</span>` : pf.admin ? `<span class="tag">Admin</span>` : ""}</div>
        <div class="stats"><div><b class="num">${com}</b><span>em aberto</span></div><div><b class="num">${feitos}</b><span>pedida${feitos === 1 ? "" : "s"}</span></div><div><b class="num">${conc}</b><span>concluída${conc === 1 ? "" : "s"}</span></div><div><b class="num">${envs}</b><span>envio${envs === 1 ? "" : "s"}</span></div></div>
        <div class="btns pcard-acts"><button class="btn sm" data-eq="ver" data-id="${esc(pf.id)}">${ic("tarefa")}Ver tarefas</button>${isAdmin() && (pf.email || pf.id !== myId) ? `<button class="btn sm ghost icon" data-eq="mais" data-id="${esc(pf.id)}" aria-label="Mais ações" title="Mais ações" aria-haspopup="menu">${ic("dots")}</button>` : ""}</div></article>`;
    }).join("")}</div>`;
  },
  after() {
    $$("[data-eq]", $("#vbody")).forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      if (b.dataset.eq === "ver") go("pedidos", { pedF: "pessoa", pedPessoa: id });
      if (b.dataset.eq === "mais") {
        const pf = perfil(id), eu = id === myId;
        abrirMenu(b, [
          pf.email && { icon: "mail", l: "Enviar nova senha", s: "Manda um link para criar uma senha nova", fn: () => confirmar(`Enviar nova senha para ${firstName(id)}?`, `Um link para criar uma senha nova vai para ${pf.email}.`, "Enviar link", () => enviarRedefinicao(pf)) },
          !eu && { icon: "shield", l: pf.admin ? "Remover administrador" : "Tornar administrador", s: pf.admin ? "Deixa de poder gerenciar a equipe" : "Pode adicionar pessoas e apagar envios", fn: () => confirmar(pf.admin ? `Remover ${firstName(id)} dos administradores?` : `Tornar ${firstName(id)} administrador?`, pf.admin ? "A pessoa continua usando o sistema normalmente." : "Administradores adicionam e desativam pessoas e podem apagar envios.", "Confirmar", () => save(() => col("perfis").doc(id).update({ admin: !pf.admin }), pf.admin ? `${firstName(id)} não é mais administrador` : `${firstName(id)} agora é administrador`)) },
          !eu && (pf.ativo === false
            ? { icon: "undo", l: "Reativar acesso", fn: () => save(() => col("perfis").doc(id).update({ ativo: true }), "Pessoa reativada") }
            : { icon: "x", l: "Desativar acesso", s: "A pessoa não consegue mais entrar", danger: true, fn: () => confirmar(`Desativar ${firstName(id)}?`, "A pessoa não consegue mais entrar no sistema. O que ela fez continua registrado e dá para reativar depois.", "Desativar", () => save(() => col("perfis").doc(id).update({ ativo: false }), "Pessoa desativada: ela não consegue mais entrar"), true) }),
        ], uname(id));
      }
    });
  }
};
