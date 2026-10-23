/* Central de Brindes · Tela de Envios, cards, ações e fotos/arquivos de cada envio */
"use strict";

const ENV_PASSO = 40, ENV_PAG = { chave: "", n: ENV_PASSO };
VIEWS.envios = {
  head: () => pageHead("Operação", "Envios", "Do pedido à entrega: separar, postar e avisar o representante.",
    `<button class="btn" id="envNf">${ic("in")}Importar notas</button><button class="btn primary" id="envNew">${ic("plus")}Novo envio</button>`) +
    `<div class="toolbar env-tb">
      <div class="search">${ic("search")}<input class="input" id="envQ" type="search" placeholder="${matchMedia("(max-width:720px)").matches ? "Buscar envio" : "Buscar destinatário, cidade, NF, rastreio"}" value="${esc(F.envQ)}"></div>
      <button class="btn" id="envFiltros" title="Filtrar por estado ou representante">${ic("filter")}<span class="bl">Filtros</span><span class="n num" id="envFn" hidden></span></button>
      <button class="btn" id="envSel" aria-pressed="false" title="Selecionar vários envios">${ic("check")}<span class="bl">Selecionar</span></button>
      <button class="btn icon" id="envMais" aria-label="Mais opções" title="Mais opções">${ic("dots")}</button>
    </div>
    <div class="env-filtros"><div class="seg scroll" id="envSeg" role="group" aria-label="Situação"></div><div class="seg scroll" id="envAv" role="group" aria-label="Aviso ao representante"></div><div class="seg env-vista" role="group" aria-label="Modo de ver"><button data-vista="lista" title="Lista compacta" aria-label="Lista compacta">${ic("list")}</button><button data-vista="cartoes" title="Cartões detalhados" aria-label="Cartões detalhados">${ic("painel")}</button></div></div>`,
  bind() {
    $("#envNew").onclick = () => envioForm();
    $("#envNf").onclick = importarNotasDrawer;
    $("#envQ").oninput = e => { F.envQ = e.target.value; renderBody(true); };
    $("#envFiltros").onclick = filtrosEnvios;
    $("#envSel").onclick = () => { if (SEL.on) return sairSelecao(); SEL.on = true; renderBody(true); renderSelBar(); };
    $("#envMais").onclick = e => abrirMenu(e.currentTarget, [
      { icon: "camera", l: "Ler etiqueta de uma caixa", s: "Abre o envio pelo código de barras", fn: lerEtiquetaEAbrir },
      { icon: "box", l: "Modo separação", s: "Separar os pendentes um por um", fn: () => modoSeparacao() },
      { icon: "in", l: "Importar notas fiscais", s: "XML ou PDF das notas, ou DACE dos Correios", fn: importarNotasDrawer },
      { icon: "truck", l: "Importar rastreios da agência", s: "Planilha do Portal Postal: registra as postagens de uma vez", fn: importarRastreiosDrawer },
      { icon: "check", l: "Selecionar vários", s: "Separar, imprimir ou avisar de uma vez", fn: () => { SEL.on = true; renderBody(true); renderSelBar(); } },
      { icon: "box", l: "Kits de brindes", s: "Combinações que se repetem", fn: kitsDrawer },
      { icon: "download", l: "Exportar planilha", s: "Os envios desta lista, em CSV", fn: exportCsv },
    ], "Envios");
  },
  body() {
    const cnt = k => S.envios.filter(e => k === "todos" || (k === "ativos" ? ["pendente", "separado", "postado"].includes(e.status) : e.status === k)).length;
    $("#envSeg").innerHTML = [["ativos", "A entregar"], ["pendente", "Pendentes"], ["separado", "Separados"], ["postado", "Postados"], ["entregue", "Entregues"], ["cancelado", "Cancelados"], ["todos", "Todos"]]
      .map(([k, l]) => `<button data-es="${k}" aria-pressed="${F.envStatus === k}">${l}<span class="n num">${cnt(k)}</span></button>`).join("");
    $$("[data-es]").forEach(b => b.onclick = () => { F.envStatus = b.dataset.es; renderBody(true); });
    const base = filteredEnvios(true).filter(e => e.status !== "cancelado"), nAv = base.filter(avisado).length;
    $("#envAv").innerHTML = [["", "Aviso: todos", ""], ["falta", "Falta avisar", base.length - nAv], ["feito", "Já avisados", nAv]]
      .map(([k, l, n]) => `<button data-ea="${k}" aria-pressed="${F.envAviso === k}">${k ? ic(k === "feito" ? "check" : "whats", "i-sm") : ""}${l}${n !== "" ? `<span class="n num">${n}</span>` : ""}</button>`).join("");
    $$("[data-ea]").forEach(b => b.onclick = () => { F.envAviso = b.dataset.ea; renderBody(true); });
    $$("[data-vista]").forEach(b => { b.setAttribute("aria-pressed", F.envVista === b.dataset.vista); b.onclick = () => { F.envVista = b.dataset.vista; try { localStorage.setItem("cb-vista", F.envVista); } catch (x) { } renderBody(true); }; });
    const nf = (F.envUF ? 1 : 0) + (F.envRep ? 1 : 0), fn = $("#envFn"); if (fn) { fn.hidden = !nf; fn.textContent = nf; }
    if (loading()) return skeleton("Carregando envios…");
    const list = filteredEnvios();
    const chips = nf ? `<div class="fchips">${F.envUF ? `<button class="fchip" data-limpa="envUF" title="Tirar filtro">${esc(F.envUF)}${ic("x")}</button>` : ""}${F.envRep ? `<button class="fchip" data-limpa="envRep" title="Tirar filtro">${esc(repById(F.envRep)?.nome || "Representante")}${ic("x")}</button>` : ""}</div>` : "";
    const pend = S.envios.filter(e => e.status === "pendente").length;
    const cta = pend && !SEL.on && ["ativos", "pendente"].includes(F.envStatus) ? `<div class="callout">${ic("box")}<span><b>${pend} envio${pend > 1 ? "s" : ""}</b> esperando separação</span><button class="btn sm primary" id="envSepCta">Separar agora</button></div>` : "";
    // mesmo aviso para o que já foi separado e ainda não foi postado nos Correios
    const seps = S.envios.filter(e => e.status === "separado"), maisVelho = Math.max(0, ...seps.map(e => e.separadoEm ? diasDesde(e.separadoEm) : 0));
    const ctaPost = seps.length && !SEL.on && ["ativos", "separado"].includes(F.envStatus) ? `<div class="callout postar">${ic("truck")}<span><b>${seps.length} envio${seps.length > 1 ? "s" : ""}</b> esperando postagem${maisVelho >= 1 ? `<small> · ${seps.length > 1 ? "o mais antigo " : ""}separado há ${maisVelho} dia${maisVelho > 1 ? "s" : ""}</small>` : ""}</span>${seps.length === 1 || F.envStatus !== "separado" ? `<button class="btn sm primary" id="envPostCta">${seps.length === 1 ? "Postar agora" : "Ver separados"}</button>` : ""}<button class="btn sm" id="envCorreioCta">${ic("whats")}Chamar o Correio</button></div>` : "";
    if (!list.length) return chips + `<div class="card">${S.envios.length ? empty("search", "Nenhum envio aqui", "Mude a situação, os filtros ou a busca.") : empty("truck", "Nenhum envio registrado", "Importe as notas fiscais ou registre o primeiro envio.", `<button class="btn primary" id="envNew2">${ic("plus")}Novo envio</button>`)}</div>`;
    // mostra 40 por vez: com milhares de envios a tela continua leve
    const chave = [F.envStatus, F.envQ, F.envUF, F.envRep, F.envAviso].join("|");
    if (ENV_PAG.chave !== chave) { ENV_PAG.chave = chave; ENV_PAG.n = ENV_PASSO; }
    const vis = list.slice(0, ENV_PAG.n), resto = list.length - vis.length;
    const lista = !celular() && F.envVista !== "cartoes";
    const corpo = lista ? `<div class="elista${SEL.on ? " selecionando" : ""}"><div class="el-cab" aria-hidden="true">${SEL.on ? "<span></span>" : ""}<span></span><span>Destinatário</span><span>Itens</span><span>Rastreio</span><span>Situação</span><span></span></div>${vis.map(envioLinha).join("")}</div>`
      : `<div class="ecards${SEL.on ? " selecionando" : ""}">${vis.map(envioCard).join("")}</div>`;
    return `${chips}${cta}${ctaPost}${corpo}${resto > 0 ? `<button class="btn mais-btn" id="envMaisLista">Mostrar mais ${Math.min(ENV_PASSO, resto)} <span class="muted">(faltam ${fmtN(resto)})</span></button>` : ""}`;
  },
  after() {
    const n2 = $("#envNew2"); if (n2) n2.onclick = () => envioForm();
    $$("[data-eact]", $("#vbody")).forEach(b => b.onclick = () => envAction(b.dataset.eact, b.dataset.id, b));
    const sb = $("#envSel"); if (sb) { sb.setAttribute("aria-pressed", SEL.on); sb.innerHTML = SEL.on ? `${ic("x")}<span class="bl">Cancelar</span>` : `${ic("check")}<span class="bl">Selecionar</span>`; }
    $$("[data-sel]", $("#vbody")).forEach(c => c.onchange = () => { c.checked ? SEL.ids.add(c.dataset.sel) : SEL.ids.delete(c.dataset.sel); c.closest(".ecard,.elinha").classList.toggle("sel", c.checked); renderSelBar(); });
    $$("[data-limpa]", $("#vbody")).forEach(b => b.onclick = () => { F[b.dataset.limpa] = ""; renderBody(true); });
    const cta = $("#envSepCta"); if (cta) cta.onclick = () => modoSeparacao();
    const cc = $("#envCorreioCta"); if (cc) cc.onclick = chamarCorreio;
    const cp = $("#envPostCta"); if (cp) cp.onclick = () => { const seps = S.envios.filter(e => e.status === "separado"); if (seps.length === 1) return postagemDrawer(seps[0]); F.envStatus = "separado"; renderBody(true); };
    const ml = $("#envMaisLista"); if (ml) ml.onclick = () => { ENV_PAG.n += ENV_PASSO; renderBody(); };
    $$("[data-card]", $("#vbody")).forEach(c => {
      const linha = c.classList.contains("elinha");
      c.onclick = ev => { if (!(celular() || linha) || SEL.on || ev.target.closest("button,a,input,label")) return; envioDetalhe(c.dataset.card); };
      if (linha) c.onkeydown = ev => { if ((ev.key === "Enter" || ev.key === " ") && ev.target === c) { ev.preventDefault(); envioDetalhe(c.dataset.card); } };
    });
    renderSelBar();
  }
};
// ficha completa do envio (no celular a lista mostra o cartão resumido)
function envioDetalhe(id) {
  const e = S.envios.find(x => x.id === id); if (!e) return;
  openDrawer({
    eyebrow: `Envio ${shortId(e.id)} · ${situacaoLabel(e)}`, title: e.destinatario,
    body: envioFicha(e), foot: fichaBotoes(e),
    onMount(ov) {
      $$("[data-eact]", ov).forEach(b => b.onclick = () => { const a = b.dataset.eact; if (!["copiar", "mais"].includes(a)) closeDrawer(); envAction(a, b.dataset.id, b); });
    }
  });
}
// ficha do envio (janela de detalhe): blocos com título, tudo alinhado na mesma margem
function envioFicha(e) {
  const its = e.itens || [], cods = codigosDe(e), rep = e.repId ? repById(e.repId) : null;
  const dados = [];
  if (e.forma) dados.push([esc(e.forma), "Forma"]);
  if (e.transportadora) dados.push([esc(e.transportadora), "Transportadora"]);
  if (e.nf) dados.push([`<span class="mono">${esc(e.nf)}</span>`, "Nota fiscal"]);
  if (e.pedidoVenda) dados.push([`<span class="mono">${esc(e.pedidoVenda)}</span>`, "Pedido"]);
  const sec = (t, h, extra = "") => `<section class="ef-sec"><div class="ef-t"><h4>${t}</h4>${extra}</div>${h}</section>`;
  return `<div class="ef">
    <div class="ef-dest"><span class="ec-uf ${situacaoCls(e)}">${esc(e.uf || "—")}</span><div class="ef-dl">
      ${paraClienteDe(e) ? `<span>${ic("user", "i-sm")}cliente de <b>${esc(rep?.nome || "")}</b></span>` : rep && norm(rep.nome) !== norm(e.destinatario) ? `<span>${ic("user", "i-sm")}<b>${esc(rep.nome)}</b></span>` : ""}
      <span>${ic("pin", "i-sm")}<b>${esc([e.cidade, e.uf].filter(Boolean).join("/") || "Cidade não informada")}</b></span>
      ${e.endereco ? `<span class="ef-end">${esc(e.endereco)}${e.cep ? ` · <span class="nw">CEP ${esc(e.cep)}</span>` : ""}</span>` : ""}
      <span class="ef-quem">${avatar(e.criadoPor, "xs")}${who(e.criadoPor)} · ${fmtDT(e.criadoEm)}</span>
    </div></div>
    <div class="ef-st"><span class="pill ${situacaoCls(e)}">${situacaoLabel(e)}</span>${avisoSelo(e)}</div>
    ${e.recebidoEm ? `<div class="rec-linha ${e.recebidoOk === false && !e.problemaResolvido ? "prob" : "ok"}">${ic(e.recebidoOk === false ? "alert" : "check", "i-sm")}<span>${e.recebidoOk === false ? `Recebido com problema${e.problemaResolvido ? " (resolvido)" : ""}: “${esc(e.recebidoObs || "")}”` : `${paraClienteDe(e) ? "Representante confirmou a entrega ao cliente" : "Representante confirmou o recebimento"}`} · ${fmtDM(e.recebidoEm)}</span></div>` : ""}
    ${sec(`Itens <small>${its.length}</small>`, `<div class="ef-itens">${its.map(l => `<div class="ef-it"><span>${esc(itemName(l.itemId))}</span><b class="num">${fmtN(l.qtd)}</b></div>`).join("")}${its.length > 1 ? `<div class="ef-it ef-tot"><span>Total</span><b class="num">${fmtN(totalUn(e))}</b></div>` : ""}</div>`)}
    <div class="ef-dados">${e.status !== "cancelado" ? `<div class="ef-d ef-cx"><small>Caixas</small>${caixasChip(e)}</div>` : ""}${dados.map(([v, l]) => `<div class="ef-d"><small>${l}</small><b>${v}</b></div>`).join("")}</div>
    ${cods.length ? trackBox(e) : ""}
    ${(e.fotos || []).length ? sec(`Fotos <small>${e.fotos.length}</small>`, fotosBox(e)) : ""}
    ${e.obs ? sec("Observação", `<div class="obs">${esc(e.obs)}</div>`) : ""}
    ${sec("Andamento", stepper(e))}
  </div>`;
}
function fichaBotoes(e) {
  const p = { pendente: ["separado", "box", "Marcar separado"], separado: ["postar", "truck", "Registrar postagem"], postado: ["situacao", "rastreio", "Atualizar situação"], cancelado: ["pendente", "undo", "Reativar"] }[e.status];
  return `<div class="ef-acts">${e.status !== "cancelado" ? `<button class="btn wa" data-eact="avisar" data-id="${e.id}" title="Abre o WhatsApp com a mensagem pronta">${ic("whats")}${avisado(e) ? "Avisar de novo" : "Avisar"}</button>` : ""}<button class="btn" data-eact="camera" data-id="${e.id}" title="Abre a câmera e salva a foto neste envio">${ic("camera")}Foto</button><button class="btn icon" data-eact="mais" data-id="${e.id}" title="Mais ações" aria-label="Mais ações" aria-haspopup="menu">${ic("dots")}</button></div>
    ${p ? `<button class="btn${e.status === "cancelado" ? "" : " primary"} ef-prim" data-eact="${p[0]}" data-id="${e.id}">${ic(p[1])}${p[2]}</button>` : ""}`;
}
function filtrosEnvios() {
  const reps = S.representantes.slice().sort((a, b) => a.nome.localeCompare(b.nome));
  openDrawer({
    eyebrow: "Envios", title: "Filtros", narrow: true,
    body: `<label class="field"><span>Estado</span><select class="select" id="flUF"><option value="">Todos os estados</option>${UFS.map(u => `<option${u === F.envUF ? " selected" : ""}>${u}</option>`).join("")}</select></label>
      <label class="field"><span>Representante</span><select class="select" id="flRep"><option value="">Todos os representantes</option>${reps.map(r => `<option value="${esc(r.id)}"${r.id === F.envRep ? " selected" : ""}>${esc(r.nome)}</option>`).join("")}</select></label>`,
    foot: `<button class="btn ghost left" id="flLimpa">Limpar</button><button class="btn primary" id="flOk">${ic("check")}Aplicar</button>`,
    onMount() {
      $("#flOk").onclick = () => { F.envUF = $("#flUF").value; F.envRep = $("#flRep").value; closeDrawer(); renderBody(true); };
      $("#flLimpa").onclick = () => { F.envUF = ""; F.envRep = ""; closeDrawer(); renderBody(true); };
    }
  });
}
function filteredEnvios(ignorarAviso) {
  const q = norm(F.envQ);
  return S.envios.filter(e => {
    if (!ignorarAviso && F.envAviso && (e.status === "cancelado" || avisado(e) !== (F.envAviso === "feito"))) return false;
    if (F.envStatus === "ativos" && !["pendente", "separado", "postado"].includes(e.status)) return false;
    if (!["ativos", "todos"].includes(F.envStatus) && e.status !== F.envStatus) return false;
    if (F.envUF && e.uf !== F.envUF) return false;
    if (F.envRep && e.repId !== F.envRep) return false;
    if (q) {
      const hay = norm([e.destinatario, e.cidade, e.uf, ...codigosDe(e), e.chaveNfe, e.transportadora, e.obs, e.nf, e.pedidoVenda, e.documento, e.chaveNfe, ...(e.itens || []).map(l => { const i = itemById(l.itemId); return i ? i.nome + " " + (i.codigo || "") : ""; })].join(" "));
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => b.criadoEm - a.criadoEm);
}
function trackBox(e) {
  const cods = codigosDe(e); if (!cods.length) return "";
  const dias = e.postadoEm ? diasDesde(e.postadoEm) : null;
  const ult = (e.historico || []).slice(-1)[0];
  if (cods.length > 1) return `<div class="trk${precisaAtencao(e) ? " warn" : ""}">
    <div class="trk-code"><span class="lbl">Rastreio${e.servico ? " · " + esc(e.servico) : ""} · ${txtCaixas(cods.length)}</span></div>
    <div class="trk-info">${e.postadoEm ? `<span>Postado ${fmtDM(e.postadoEm)}${e.status === "postado" ? ` · <b class="${atrasado(e) ? "late" : ""}">${dias === 0 ? "hoje" : dias === 1 ? "há 1 dia" : `há ${dias} dias`}</b>` : ""}</span>` : ""}${ult && ult.nota ? `<span class="muted">“${esc(ult.nota)}”</span>` : ""}${e.frete ? `<span>Frete ${fmtMoeda(e.frete)}</span>` : ""}${e.avisadoEm ? `<span class="ok">${ic("check", "i-sm")}Representante avisado ${fmtDM(e.avisadoEm)}</span>` : ""}</div>
    <div class="trk-cxs">${cods.map((c, k) => `<div class="trk-cx"><span class="trk-cxn">Caixa ${k + 1}</span><b class="mono">${esc(c)}</b><button class="btn sm ghost icon" data-eact="copiar" data-id="${e.id}" data-cod="${esc(c)}" title="Copiar código" aria-label="Copiar código da caixa ${k + 1}">${ic("copy")}</button><a class="btn sm ghost icon" href="${rastreioUrl(c)}" target="_blank" rel="noopener" title="Ver nos Correios" aria-label="Ver caixa ${k + 1} nos Correios">${ic("ext")}</a></div>`).join("")}</div>
  </div>`;
  return `<div class="trk${precisaAtencao(e) ? " warn" : ""}">
    <div class="trk-code"><span class="lbl">Rastreio${e.servico ? " · " + esc(e.servico) : ""}</span><b class="mono">${esc(cods[0])}</b></div>
    <div class="trk-info">${e.postadoEm ? `<span>Postado ${fmtDM(e.postadoEm)}${e.status === "postado" ? ` · <b class="${atrasado(e) ? "late" : ""}">${dias === 0 ? "hoje" : dias === 1 ? "há 1 dia" : `há ${dias} dias`}</b>` : ""}</span>` : ""}${ult && ult.nota ? `<span class="muted">“${esc(ult.nota)}”</span>` : ""}${e.frete ? `<span>Frete ${fmtMoeda(e.frete)}</span>` : ""}${e.avisadoEm ? `<span class="ok">${ic("check", "i-sm")}Representante avisado ${fmtDM(e.avisadoEm)}</span>` : ""}</div>
    <div class="trk-acts"><button class="btn sm ghost icon" data-eact="copiar" data-id="${e.id}" title="Copiar código" aria-label="Copiar código">${ic("copy")}</button><a class="btn sm ghost" href="${rastreioUrl(cods[0])}" target="_blank" rel="noopener">${ic("ext")}Correios</a></div>
  </div>`;
}
// botão sempre visível no cartão: quantas caixas e se falta código de alguma
function caixasChip(e) {
  if (e.status === "cancelado") return "";
  const n = volumesDe(e), c = codigosDe(e).length, postado = e.status === "postado" || e.status === "entregue";
  const falta = postado && c < n;
  const txt = falta ? `falta código de ${n - c === 1 ? "1 caixa" : (n - c) + " caixas"}` : postado ? "" : n === 1 ? "mudar" : "";
  return `<button class="cx-chip${falta ? " falta" : ""}" data-eact="caixas" data-id="${e.id}" title="Caixas e códigos de rastreio">${ic("box")}<b>${txtCaixas(n)}</b>${txt ? `<span>· ${txt}</span>` : ""}${ic("edit", "i cx-ed")}</button>`;
}
// lista compacta (computador): uma linha por envio; clicar abre a ficha completa
function envioLinha(e) {
  const acao = { pendente: ["separado", "box", "Separar"], separado: ["postar", "truck", "Postar"], postado: ["situacao", "rastreio", "Atualizar"], cancelado: ["pendente", "undo", "Reativar"] }[e.status];
  const cods = codigosDe(e), n = (e.itens || []).length, vol = volumesDe(e), rep = e.repId ? repById(e.repId) : null;
  const faltaCod = (e.status === "postado" || e.status === "entregue") && cods.length < vol;
  const quem = paraClienteDe(e) ? `cliente de ${esc(rep?.nome || "")}` : rep && norm(rep.nome) !== norm(e.destinatario) ? esc(rep.nome) : "";
  const ref = [e.pedidoVenda ? `Pedido ${esc(e.pedidoVenda)}` : "", e.nf ? `NF ${esc(e.nf)}` : ""].filter(Boolean).join(" · ") || shortId(e.id);
  return `<div class="elinha${e.status === "cancelado" ? " cancel" : ""}${SEL.ids.has(e.id) ? " sel" : ""}" data-st="${precisaAtencao(e) ? "atencao" : e.status}" data-card="${e.id}" tabindex="0" title="Abrir a ficha do envio">
    ${SEL.on ? `<label class="ec-chk"><input type="checkbox" data-sel="${e.id}"${SEL.ids.has(e.id) ? " checked" : ""} aria-label="Selecionar este envio"></label>` : ""}
    <span class="ec-uf ${situacaoCls(e)}">${esc(e.uf || "—")}</span>
    <div class="el-dest"><b>${esc(e.destinatario)}</b><small>${esc(e.cidade || "Cidade não informada")}${quem ? ` · ${quem}` : ""} · ${ago(e.criadoEm)}</small></div>
    <div class="el-itens"><b class="num">${fmtN(totalUn(e))} un.</b><small>${n} ${n === 1 ? "item" : "itens"} · ${e.status === "cancelado" ? txtCaixas(vol) : `<button class="el-cx${faltaCod ? " falta" : ""}" data-eact="caixas" data-id="${e.id}" title="Caixas e códigos de rastreio">${faltaCod ? `falta código` : txtCaixas(vol)}</button>`}</small></div>
    <div class="el-cod">${cods.length ? `<b class="mono">${esc(cods[0])}</b>${cods.length > 1 ? `<span class="muted"> +${cods.length - 1}</span>` : ""}` : `<span class="muted">sem rastreio</span>`}<small>${ref}</small></div>
    <div class="el-st"><span class="pill ${situacaoCls(e)}">${situacaoLabel(e)}</span>${avisoSelo(e)}</div>
    <div class="el-acts">${acao ? `<button class="btn sm${e.status === "cancelado" ? "" : " primary"}" data-eact="${acao[0]}" data-id="${e.id}">${ic(acao[1])}${acao[2]}</button>` : ""}${e.status !== "cancelado" ? `<button class="btn sm ghost icon wa" data-eact="avisar" data-id="${e.id}" title="${avisado(e) ? "Avisar de novo" : "Avisar"} pelo WhatsApp" aria-label="Avisar pelo WhatsApp">${ic("whats")}</button>` : ""}<button class="btn sm ghost icon" data-eact="mais" data-id="${e.id}" title="Mais ações" aria-label="Mais ações" aria-haspopup="menu">${ic("dots")}</button></div>
  </div>`;
}
// selo "avisado / falta avisar" no cartão
function avisoSelo(e) {
  if (e.status === "cancelado") return "";
  return avisado(e) ? `<span class="av-selo ok" title="Mensagem enviada pelo WhatsApp">${ic("check", "i-sm")}Avisado ${fmtDM(e.avisadoEm)}</span>`
    : `<span class="av-selo" title="Ainda não mandou mensagem ${e.avisadoEm ? "do rastreio" : ""} ao representante">${ic("whats", "i-sm")}Falta avisar</span>`;
}
function envioCard(e) {
  const a = [];
  if (e.status === "pendente") a.push(`<button class="btn sm primary" data-eact="separado" data-id="${e.id}">${ic("box")}Marcar separado</button>`);
  if (e.status === "separado") a.push(`<button class="btn sm primary" data-eact="postar" data-id="${e.id}">${ic("truck")}Registrar postagem</button>`);
  if (e.status === "postado") a.push(`<button class="btn sm primary" data-eact="situacao" data-id="${e.id}">${ic("rastreio")}Atualizar situação</button>`);
  if (e.status === "cancelado") a.push(`<button class="btn sm" data-eact="pendente" data-id="${e.id}">${ic("undo")}Reativar</button>`);
  const b = [];
  if (e.status !== "cancelado") b.push(`<button class="btn sm ghost wa" data-eact="avisar" data-id="${e.id}" title="Abre o WhatsApp com a mensagem pronta">${ic("whats")}<span class="bl">${avisado(e) ? "Avisar de novo" : "Avisar"}</span></button>`);
  b.push(`<button class="btn sm ghost" data-eact="camera" data-id="${e.id}" title="Abre a câmera e salva a foto neste envio">${ic("camera")}<span class="bl">Foto</span></button>`);
  b.push(`<button class="btn sm ghost icon" data-eact="mais" data-id="${e.id}" title="Mais ações" aria-label="Mais ações" aria-haspopup="menu">${ic("dots")}</button>`);
  const kv = [];
  if (e.forma) kv.push(`<span>Forma <b>${esc(e.forma)}</b></span>`);
  if (e.transportadora) kv.push(`<span>Transportadora <b>${esc(e.transportadora)}</b></span>`);
  if (e.nf) kv.push(`<span>NF <b class="mono">${esc(e.nf)}</b></span>`);
  if (e.pedidoVenda) kv.push(`<span>Pedido <b class="mono">${esc(e.pedidoVenda)}</b></span>`);
  return `<article class="ecard${e.status === "cancelado" ? " cancel" : ""}${SEL.ids.has(e.id) ? " sel" : ""}" data-st="${precisaAtencao(e) ? "atencao" : e.status}" data-card="${e.id}">
    <div class="ec-top">${SEL.on ? `<label class="ec-chk"><input type="checkbox" data-sel="${e.id}"${SEL.ids.has(e.id) ? " checked" : ""} aria-label="Selecionar este envio"></label>` : ""}<span class="ec-uf ${situacaoCls(e)}">${esc(e.uf || "—")}</span>
      <div class="ec-head"><h3>${esc(e.destinatario)}</h3>${paraClienteDe(e) ? `<div class="ec-cli">${ic("user", "i-sm")}cliente de <b>${esc(repById(e.repId)?.nome || "")}</b></div>` : ""}
        <div class="ec-meta"><span>${ic("pin")}${esc([e.cidade, e.uf].filter(Boolean).join("/") || "Cidade não informada")}</span>${e.endereco ? `<span class="hide-sm">${esc(e.endereco)}${e.cep ? " · CEP " + esc(e.cep) : ""}</span>` : ""}<span class="hide-sm">${avatar(e.criadoPor, "xs")}${who(e.criadoPor)} · ${fmtDT(e.criadoEm)}</span><span class="only-sm">${ago(e.criadoEm)}</span></div></div>
      <span class="ec-chev" aria-hidden="true">${ic("chev")}</span><div class="ec-right"><span class="pill ${situacaoCls(e)}">${situacaoLabel(e)}</span>${avisoSelo(e)}<span class="code">${shortId(e.id)}</span></div></div>
    <div class="ec-body"><div class="ec-resumo"><span class="pill ${situacaoCls(e)}">${situacaoLabel(e)}</span>${avisoSelo(e)}<span><b class="num">${(e.itens || []).length}</b> ${(e.itens || []).length === 1 ? "item" : "itens"} · <b class="num">${fmtN(totalUn(e))}</b> un.</span>${caixasChip(e)}${codigosDe(e).length ? `<span class="mono ec-cod">${esc(codigosDe(e)[0])}${codigosDe(e).length > 1 ? ` +${codigosDe(e).length - 1}` : ""}</span>` : ""}</div>
      <div class="chips ec-det">${(e.itens || []).map(l => `<span class="ichip"><b class="num">${fmtN(l.qtd)}×</b><span>${esc(itemName(l.itemId))}</span></span>`).join("")}</div>
      <div class="kv ec-det" style="margin-top:0"><span><b class="num">${fmtN(totalUn(e))}</b> unidades</span>${caixasChip(e)}${kv.join("")}</div>
      ${e.recebidoEm ? `<div class="rec-linha ${e.recebidoOk === false && !e.problemaResolvido ? "prob" : "ok"}">${ic(e.recebidoOk === false ? "alert" : "check", "i-sm")}<span>${e.recebidoOk === false ? `Recebido com problema${e.problemaResolvido ? " (resolvido)" : ""}: “${esc(e.recebidoObs || "")}”` : `${paraClienteDe(e) ? "Representante confirmou a entrega ao cliente" : "Representante confirmou o recebimento"}`} · ${fmtDM(e.recebidoEm)}</span></div>` : ""}
      <div class="ec-det">${trackBox(e)}</div>
      <div class="ec-det">${fotosBox(e)}</div>
      ${e.obs ? `<div class="obs ec-det">${esc(e.obs)}</div>` : ""}</div>
    <div class="ec-foot">${stepper(e)}<div class="btns">${a.join("")}${b.join("")}</div></div>
  </article>`;
}
function envAction(act, id, btn) {
  const e = S.envios.find(x => x.id === id); if (!e) return;
  const ref = col("envios").doc(id), now = Date.now();
  if (act === "editar") return envioForm(e);
  if (act === "postar") return postagemDrawer(e);
  if (act === "situacao") return situacaoDrawer(e);
  if (act === "avisar") return avisarRapido(e);
  if (act === "avisaredit") return avisarDrawer(e);
  if (act === "copiar") { const c = btn?.dataset?.cod; return c ? copiar(c, "Código copiado") : codigosDe(e).length > 1 ? copiar(codigosDe(e).join(" "), `${codigosDe(e).length} códigos copiados`) : copiar(codigosDe(e)[0], "Código copiado"); }
  if (act === "link") return copiarLink(e);
  if (act === "docs") return documentosDrawer(e);
  if (act === "camera") return escolherFotos(e, etapaPadrao(e), true);
  if (act === "fotos") return fotosDrawer(e);
  if (act === "verfoto") return verFoto(e, btn.dataset.fid);
  if (act === "mais") return menuEnvio(e, btn);
  if (act === "voltarpostado") return mudarComDesfazer([{ e, upd: e.postadoEm ? { status: "postado", entregueEm: null, entreguePor: null } : { status: "separado", entregueEm: null, entreguePor: null } }], "Entrega desfeita");
  if (act === "cancelar") return mudarComDesfazer([{ e, upd: { status: "cancelado", canceladoEm: now, canceladoPor: myId } }], "Envio cancelado. Os itens voltaram para o estoque.");
  if (act === "apagar") return apagarEnvioDrawer(e);
  if (act === "caixas") return caixasDrawer(e);
  if (act === "resolvido") return save(() => ref.update({ problemaResolvido: true }), "Problema marcado como resolvido");
  if (act === "pendente") return mudarComDesfazer([{ e, upd: { status: "pendente", separadoEm: null, separadoPor: null, postadoEm: null, postadoPor: null, entregueEm: null, entreguePor: null, canceladoEm: null, canceladoPor: null } }], e.status === "cancelado" ? "Envio reativado" : "Envio voltou para pendente");
  if (act === "separado") {
    const upd = e.status === "pendente" ? updSeparado() : { status: "separado", entregueEm: null, entreguePor: null };
    return mudarComDesfazer([{ e, upd }], e.status === "pendente" ? "Separado. Os itens saíram do estoque." : "Envio voltou para separado");
  }
  if (act === "entregue") return (async () => {
    if (!await mudarComDesfazer([{ e, upd: { status: "entregue", entregueEm: now, entreguePor: myId, historico: [...(e.historico || []), { s: "entregue", em: now, por: myId }] } }], "Entrega confirmada")) return;
    if (e.pedidoId) { const p = S.pedidos.find(x => x.id === e.pedidoId); if (p && p.status !== "concluido") save(() => col("pedidos").doc(p.id).update({ status: "concluido", concluidoEm: now, concluidoPor: myId })); }
  })();
}
/* ---------- apagar envio (só administrador): some de vez, com fotos e link de acompanhamento ----------
   Se os brindes já saíram da prateleira (separado, postado ou entregue), pergunta se saíram de verdade:
   sim → registra uma saída avulsa para o estoque não "ganhar" itens; não → os itens voltam para o estoque. */
function apagarEnvioDrawer(e) {
  if (!isAdmin()) return toast("Só um administrador pode apagar envios. Use Cancelar envio.", "err");
  const saiu = !["pendente", "cancelado"].includes(e.status);
  let saiuDeVerdade = e.status !== "separado";
  openDrawer({
    eyebrow: `${e.destinatario} · ${shortId(e.id)}`, title: "Apagar envio", narrow: true,
    body: `<div class="banner">${ic("alert")}<span>O envio some de vez do sistema, junto com as fotos e o link de acompanhamento. Não dá para desfazer.${e.status === "pendente" ? " Se só quer desistir dele, prefira <b>Cancelar envio</b>: fica registrado e os itens voltam para o estoque." : ""}</span></div>
      <div class="kv"><span>Etapa <b>${esc(ST_ENVIO[e.status] || e.status)}</b></span><span><b class="num">${fmtN(totalUn(e))}</b> unidades</span>${e.nf ? `<span>NF <b class="mono">${esc(e.nf)}</b></span>` : ""}</div>
      ${saiu ? `<div class="field"><span>Os brindes saíram de verdade da prateleira?</span><div class="seg" id="apSaiu" role="group" aria-label="Os brindes saíram?">
          <button type="button" data-saiu="1" aria-pressed="${saiuDeVerdade}">Sim, saíram</button><button type="button" data-saiu="0" aria-pressed="${!saiuDeVerdade}">Não, foi engano</button></div>
        <small class="muted" id="apHint"></small></div>` : ""}
      <div class="err" id="apErr" role="alert"></div>`,
    foot: `<button class="btn" data-close>Voltar</button><button class="btn danger" id="apOk">${ic("trash")}Apagar envio</button>`,
    onMount(ov) {
      const hint = () => { const h = $("#apHint"); if (h) h.textContent = saiuDeVerdade ? "O estoque continua igual: fica registrada uma saída avulsa com esses itens." : "Os itens voltam para o estoque."; };
      hint();
      $$("[data-saiu]", ov).forEach(b => b.onclick = () => { saiuDeVerdade = b.dataset.saiu === "1"; $$("[data-saiu]", ov).forEach(x => x.setAttribute("aria-pressed", x === b)); hint(); });
      const ok = $("#apOk");
      ok.onclick = () => armConfirm(ok, "Toque de novo para apagar", async () => {
        ok.disabled = true;
        const ref = col("envios").doc(e.id), now = Date.now();
        const feito = await save(async () => {
          const fotos = await ref.collection("fotos").get().catch(() => ({ docs: [] }));
          const b = db.batch();
          (fotos.docs || []).forEach(d => b.delete(d.ref));
          if (e.token) b.delete(db.collection("acompanhamento").doc(e.token));
          if (saiu && saiuDeVerdade) (e.itens || []).filter(l => l.itemId && Number(l.qtd) > 0).forEach(l => b.set(col("movimentos").doc(), { itemId: l.itemId, tipo: "saida", qtd: -Math.round(Number(l.qtd)), motivo: "Envio apagado", obs: `Envio para ${e.destinatario}${e.nf ? " · NF " + e.nf : ""}`, retiradoPor: "", por: myId, em: e.separadoEm || now }));
          b.delete(ref);
          return b.commit();
        }, "Envio apagado");
        if (feito) closeDrawer(); else ok.disabled = false;
      });
    }
  });
}
/* ---------- fotos e arquivos do envio ----------
   Ficam no próprio banco (Firestore), sem custo extra:
   - envios/{id}.fotos: lista leve com miniatura, etapa, quem e quando (aparece no card)
   - envios/{id}/fotos/{fid}: o arquivo inteiro (foto comprimida ou PDF), carregado só ao abrir */
const ETAPAS_FOTO = { separacao: "Separação", postagem: "Postagem", entrega: "Entrega", nota: "Nota fiscal", outro: "Outro" };
const MAX_ARQ = 900000; // um documento do Firestore aceita ~1 MB (o arquivo vai em texto base64)
const etapaPadrao = e => e.status === "postado" ? "postagem" : e.status === "entregue" ? "entrega" : "separacao";
const thumbOk = t => typeof t === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(t);
const fotoTh = x => `${thumbOk(x.thumb) ? `<img src="${x.thumb}" alt="" loading="lazy">` : `<span class="pdf">${x.tipo === "pdf" ? "PDF" : "?"}</span>`}<span class="et">${esc(ETAPAS_FOTO[x.etapa] || "")}</span>`;
function fotosBox(e) {
  const f = e.fotos || [];
  if (!f.length) return "";
  return `<div class="fotos">${f.map(x => `<button class="foto-th" data-eact="verfoto" data-id="${e.id}" data-fid="${esc(x.id)}" title="${esc(ETAPAS_FOTO[x.etapa] || "Arquivo")} · ${esc(uname(x.por))} · ${fmtDT(x.em)}">${fotoTh(x)}</button>`).join("")}</div>`;
}
function escolherFotos(e, etapa, camera, depois) {
  const inp = document.createElement("input");
  inp.type = "file";
  if (camera) { inp.accept = "image/*"; inp.setAttribute("capture", "environment"); }
  else { inp.accept = "image/*,application/pdf"; inp.multiple = true; }
  inp.style.display = "none";
  inp.onchange = async () => { const fs = [...inp.files]; inp.remove(); if (fs.length) { await enviarFotos(e, fs, etapa); depois?.(); } };
  document.body.appendChild(inp); inp.click();
}
const lerDataUrl = blob => new Promise((ok, err) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => err(r.error); r.readAsDataURL(blob); });
function carregarImg(file) {
  return new Promise((ok, err) => { const u = URL.createObjectURL(file), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => { URL.revokeObjectURL(u); err(new Error("img")); }; i.src = u; });
}
function reduzir(img, lado, q) {
  const k = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", q);
}
async function prepararArquivo(file) {
  if (file.type === "application/pdf") {
    const dados = await lerDataUrl(file);
    if (dados.length > MAX_ARQ) throw new Error(`O PDF "${file.name}" é grande demais (máx. ~650 KB). Tire uma foto da página ou reduza o arquivo.`);
    return { dados, tipo: "pdf", thumb: null };
  }
  if (!file.type.startsWith("image/")) throw new Error(`"${file.name}" não é foto nem PDF.`);
  let img;
  try { img = await carregarImg(file); } catch (x) { throw new Error(`Não deu para abrir a imagem "${file.name}".`); }
  let lado = 1600, q = 0.82, dados = reduzir(img, lado, q);
  while (dados.length > MAX_ARQ && lado > 600) { lado = Math.round(lado * 0.8); q = Math.max(0.6, q - 0.06); dados = reduzir(img, lado, q); }
  return { dados, tipo: "img", thumb: reduzir(img, 120, 0.55) };
}
async function enviarFotos(e, files, etapa) {
  if (!db || !myId) return toast("Entre no sistema para salvar.", "err");
  toast(files.length > 1 ? `Enviando ${files.length} arquivos…` : "Enviando foto…");
  let ok = 0;
  for (const file of files) {
    let a;
    try { a = await prepararArquivo(file); } catch (x) { toast(x.message, "err"); continue; }
    const ref = col("envios").doc(e.id), fref = ref.collection("fotos").doc(), now = Date.now();
    const nome = file.name || `foto-${today()}.jpg`;
    const meta = { id: fref.id, etapa, em: now, por: myId, tipo: a.tipo, nome, thumb: a.thumb };
    const feito = await save(() => { const b = db.batch(); b.set(fref, { dados: a.dados, tipo: a.tipo, nome, etapa, em: now, por: myId }); b.update(ref, { fotos: firebase.firestore.FieldValue.arrayUnion(meta) }); return b.commit(); });
    if (feito) ok++;
  }
  if (ok) toast(ok > 1 ? `${ok} arquivos salvos no envio` : "Foto salva no envio");
}
function fotosDrawer(e) {
  let etapa = etapaPadrao(e);
  const atual = () => S.envios.find(x => x.id === e.id) || e;
  const grade = () => { const f = atual().fotos || []; return f.length ? `<div class="fotos grande">${f.map(x => `<button class="foto-th" data-fid="${esc(x.id)}" title="${esc(uname(x.por))} · ${fmtDT(x.em)}">${fotoTh(x)}</button>`).join("")}</div>` : `<div class="empty" style="padding:20px">${ic("camera")}<span>Nenhuma foto ainda.</span></div>`; };
  openDrawer({
    eyebrow: `Envio ${shortId(e.id)} · ${e.destinatario}`, title: "Fotos e arquivos", narrow: true,
    body: `<div class="field"><span>Etapa</span><div class="seg" id="ftEtapa">${Object.entries(ETAPAS_FOTO).map(([k, l]) => `<button data-et="${k}" aria-pressed="${k === etapa}">${l}</button>`).join("")}</div></div>
      <div class="foto-acts"><button class="btn primary" id="ftCam">${ic("camera")}Tirar foto</button><button class="btn" id="ftArq">${ic("clip")}Escolher arquivo</button></div>
      <small class="muted">As fotos são reduzidas automaticamente. PDFs até ~650 KB. No computador, "Tirar foto" abre a escolha de arquivo.</small>
      <div id="ftGrade"></div>`,
    foot: `<button class="btn" data-close>Fechar</button>`,
    onMount(ov) {
      const pintar = () => { const g = $("#ftGrade"); if (!g) return; g.innerHTML = grade(); $$("[data-fid]", g).forEach(b => b.onclick = () => verFoto(atual(), b.dataset.fid, () => fotosDrawer(atual()))); };
      $$("[data-et]", ov).forEach(b => b.onclick = () => { etapa = b.dataset.et; $$("[data-et]", ov).forEach(x => x.setAttribute("aria-pressed", x === b)); });
      $("#ftCam", ov).onclick = () => escolherFotos(atual(), etapa, true, pintar);
      $("#ftArq", ov).onclick = () => escolherFotos(atual(), etapa, false, pintar);
      pintar();
    }
  });
}
async function verFoto(e, fid, voltar) {
  const meta = (e.fotos || []).find(x => x.id === fid); if (!meta) return;
  const ref = col("envios").doc(e.id), fref = ref.collection("fotos").doc(fid);
  const podeApagar = meta.por === myId || isAdmin();
  openDrawer({
    eyebrow: `Envio ${shortId(e.id)} · ${e.destinatario}`, title: meta.tipo === "pdf" ? (meta.nome || "Arquivo") : `Foto · ${ETAPAS_FOTO[meta.etapa] || "Envio"}`,
    body: `<div class="kv" style="margin:0"><span>${avatar(meta.por, "xs")} ${who(meta.por)}</span><span>${ETAPAS_FOTO[meta.etapa] || ""} · ${fmtDT(meta.em)}</span></div><div class="foto-view" id="fvBox"><span class="muted">Carregando…</span></div>`,
    foot: `${podeApagar ? `<button class="btn ghost danger left" id="fvDel">${ic("trash")}Apagar</button>` : ""}${voltar ? `<button class="btn" id="fvVoltar">${ic("back")}Voltar</button>` : `<button class="btn" data-close>Fechar</button>`}<a class="btn primary" id="fvBaixar" aria-disabled="true">${ic("download")}Baixar</a>`,
    onMount(ov) {
      if (voltar) $("#fvVoltar", ov).onclick = voltar;
      const del = $("#fvDel", ov);
      if (del) del.onclick = () => armConfirm(del, "Confirmar exclusão", async () => {
        if (await save(() => { const b = db.batch(); b.delete(fref); b.update(ref, { fotos: firebase.firestore.FieldValue.arrayRemove(meta) }); return b.commit(); }, "Foto apagada")) {
          if (voltar) { const n = S.envios.find(x => x.id === e.id) || e; fotosDrawer({ ...n, fotos: (n.fotos || []).filter(x => x.id !== fid) }); } else closeDrawer();
        }
      });
    }
  });
  try {
    const d = (await fref.get()).data();
    const box = $("#fvBox"); if (!box) return;
    if (!d) { box.innerHTML = `<span class="muted">Arquivo não encontrado.</span>`; return; }
    if (typeof d.dados !== "string" || !/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/.test(d.dados)) { box.innerHTML = `<span class="muted">Arquivo inválido.</span>`; return; }
    const url = URL.createObjectURL(await (await fetch(d.dados)).blob());
    box.innerHTML = d.tipo === "pdf" ? `<a class="btn" href="${url}" target="_blank" rel="noopener">${ic("ext")}Abrir PDF</a>` : `<a href="${url}" target="_blank" rel="noopener" title="Abrir em tamanho real"><img src="${url}" alt="Foto do envio"></a>`;
    const bx = $("#fvBaixar"); bx.href = url; bx.removeAttribute("aria-disabled");
    bx.download = d.tipo === "pdf" ? (d.nome || "arquivo.pdf") : `envio-${shortId(e.id).slice(1)}-${meta.etapa || "foto"}-${dataInput(meta.em)}.jpg`;
  } catch (x) { const box = $("#fvBox"); if (box) box.innerHTML = `<span class="muted">${esc(errMsg(x))}</span>`; }
}
