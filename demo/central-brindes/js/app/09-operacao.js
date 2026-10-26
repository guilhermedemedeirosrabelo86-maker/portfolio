/* Central de Brindes · Desfazer, menus, barra do celular, seleção em lote, modo separação, leitor de código, previsão e 'Para hoje' */
"use strict";

/* ---------- desfazer ----------
   Grava a mudança na hora e mostra "Desfazer" no aviso, em vez de pedir confirmação antes. */
async function mudarComDesfazer(lista, msg) {
  // lista: [{ e, upd }] → grava tudo junto; o desfazer volta cada campo ao valor anterior
  const volta = lista.map(({ e, upd }) => ({ id: e.id, prev: Object.fromEntries(Object.keys(upd).map(k => [k, e[k] === undefined ? null : e[k]])) }));
  const ok = await save(() => { const b = db.batch(); lista.forEach(({ e, upd }) => b.update(col("envios").doc(e.id), upd)); return b.commit(); });
  const separados = lista.filter(({ e, upd }) => upd.status === "separado" && e.status === "pendente").map(({ e }) => e.id);
  if (ok && separados.length) notificar({ tipo: "envios", evento: "separado", ids: separados });
  if (ok) toast(msg, "", { l: "Desfazer", fn: () => save(() => { const b = db.batch(); volta.forEach(v => b.update(col("envios").doc(v.id), v.prev)); return b.commit(); }, "Desfeito") });
  return ok;
}
const updSeparado = () => ({ status: "separado", separadoEm: Date.now(), separadoPor: myId, entregueEm: null, entreguePor: null });

/* ---------- menu "⋯" e menu de criar ---------- */
function abrirMenu(btn, itens, titulo) {
  const sheet = !btn || matchMedia("(max-width:720px)").matches;
  $("#menuRoot").innerHTML = `<div class="pm-ov${sheet ? " sheet" : ""}" id="pmOv"><div class="pmenu" role="menu">${titulo ? `<div class="pm-t">${esc(titulo)}</div>` : ""}${itens.filter(Boolean).map((x, i) => x.sep ? `<div class="pm-sep">${esc(x.sep)}</div>` : `<button role="menuitem" class="pm-i${x.danger ? " danger" : ""}" data-pm="${i}">${x.c ? `<span class="m-ico sm ${x.c}">${ic(x.icon)}</span>` : ic(x.icon)}<span class="grow"><b>${esc(x.l)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ""}</span></button>`).join("")}</div></div>`;
  const lista = itens.filter(Boolean), ov = $("#pmOv"), m = $(".pmenu", ov);
  if (!sheet) {
    const r = btn.getBoundingClientRect(), h = m.offsetHeight, w = m.offsetWidth;
    m.style.top = (r.bottom + 6 + h > innerHeight - 8 ? Math.max(8, r.top - 6 - h) : r.bottom + 6) + "px";
    m.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + "px";
  }
  ov.onclick = ev => { if (m.dataset.arrastou) return; const b = ev.target.closest("[data-pm]"); fecharMenu(); if (b) lista[+b.dataset.pm].fn(); };
  if (sheet) arrastarParaFechar(m, fecharMenu);
  $("[data-pm]", ov)?.focus({ preventScroll: true });
}
function fecharMenu() { $("#menuRoot").innerHTML = ""; }
// folha de baixo (celular): arrastar para baixo fecha; com a lista rolada, o arrasto rola a lista primeiro.
// "pega" diz onde o dedo pode começar (nas janelas de formulário, só no alto, para não fechar enquanto rola ou preenche)
function arrastarParaFechar(el, fechar, pega = () => true) {
  let y0 = null, dy = 0, t0 = 0, arrastou = false;
  el.addEventListener("touchstart", e => {
    y0 = el.scrollTop > 0 || !pega(e.target) ? null : e.touches[0].clientY; dy = 0; t0 = Date.now(); arrastou = false;
  }, { passive: true });
  el.addEventListener("touchmove", e => {
    if (y0 == null) return;
    dy = e.touches[0].clientY - y0;
    if (!arrastou && dy < 6) { if (dy < 0) y0 = null; return; }
    arrastou = true; e.preventDefault();
    el.style.transition = "none"; el.style.transform = `translateY(${Math.max(0, dy)}px)`;
  }, { passive: false });
  el.addEventListener("touchend", () => {
    if (y0 == null || !arrastou) { y0 = null; return; }
    y0 = null; el.dataset.arrastou = "1"; setTimeout(() => delete el.dataset.arrastou, 60);
    el.style.transition = "transform .2s cubic-bezier(.2,.8,.2,1)";
    if (dy > Math.min(120, el.offsetHeight * .25) || dy / (Date.now() - t0) > .6) { el.style.transform = "translateY(100%)"; setTimeout(fechar, 180); }
    else el.style.transform = "";
  });
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#pmOv")) fecharMenu(); });
window.addEventListener("resize", () => { if ($("#pmOv:not(.sheet)")) fecharMenu(); });
function menuEnvio(e, btn) {
  const vivo = e.status !== "cancelado", A = act => () => envAction(act, e.id, btn);
  abrirMenu(btn, [
    vivo && { icon: "edit", l: "Revisar mensagem do aviso", s: "Editar o texto antes de mandar no WhatsApp", fn: A("avisaredit") },
    vivo && { icon: "link", l: "Copiar link de acompanhamento", s: "Página para o representante acompanhar", fn: A("link") },
    { icon: "clip", l: "Fotos e arquivos", s: (n => n ? `${n} anexo${n > 1 ? "s" : ""}` : "Nenhum anexo")((e.fotos || []).length), fn: A("fotos") },
    vivo && { icon: "box", l: "Caixas e códigos de rastreio", s: (n => codigosDe(e).length ? `${txtCaixas(n)} · ${codigosDe(e).length === n ? "códigos completos" : `${codigosDe(e).length} de ${n} códigos`}` : `${txtCaixas(n)} · sem código ainda`)(volumesDe(e)), fn: A("caixas") },
    vivo && { icon: "print", l: "Imprimir declaração e etiqueta", fn: A("docs") },
    e.status === "postado" && { icon: "truck", l: "Editar postagem", fn: A("postar") },
    e.status === "separado" && { icon: "undo", l: "Voltar para pendente", fn: A("pendente") },
    e.status === "entregue" && { icon: "undo", l: e.postadoEm ? "Voltar para postado" : "Voltar para separado", fn: A("voltarpostado") },
    e.recebidoOk === false && !e.problemaResolvido && { icon: "check", l: "Problema resolvido", s: "Tira o aviso do Início", fn: A("resolvido") },
    (e.status === "postado" || e.status === "entregue") && !e.recebidoEm && e.repId && { icon: "whats", l: "Perguntar se chegou", s: e.lembradoEm ? `Perguntado em ${fmtDM(e.lembradoEm)}` : "Manda a pergunta com o link para confirmar", fn: () => perguntarChegou(e) },
    { icon: "edit", l: "Editar envio", fn: A("editar") },
    (e.status === "pendente" || e.status === "separado") && { icon: "x", l: "Cancelar envio", s: "Os itens voltam para o estoque", danger: true, fn: A("cancelar") },
    isAdmin() && { icon: "trash", l: "Apagar envio", s: "Some de vez do sistema (só administrador)", danger: true, fn: A("apagar") },
  ],`${e.destinatario} · ${shortId(e.id)}`);
}
function menuCriar(btn) {
  const pend = S.envios.filter(e => e.status === "pendente").length;
  // o que faz sentido na tela atual aparece primeiro
  const ctx = {
    envios: [{ c: "g-teal", icon: "envios", l: "Novo envio", s: "Registrar um envio à mão", fn: () => envioForm() }, { c: "g-red", icon: "camera", l: "Ler etiqueta de uma caixa", s: "Abre o envio pelo código de rastreio ou da nota", fn: lerEtiquetaEAbrir }, { c: "g-blue", icon: "in", l: "Importar notas fiscais", s: "XML ou PDF das notas, ou DACE dos Correios", fn: importarNotasDrawer }, { c: "g-amber", icon: "box", l: "Modo separação", s: pend ? `${pend} envio${pend > 1 ? "s" : ""} para separar` : "Nenhum envio pendente agora", fn: () => modoSeparacao() }, { c: "g-amber", icon: "phone", l: "Chamar o Correio", s: "Pedir a coleta dos envios separados", fn: chamarCorreio }, { c: "g-blue", icon: "truck", l: "Importar rastreios da agência", s: "Planilha do Portal Postal", fn: importarRastreiosDrawer }],
    estoque: [{ c: "g-green", icon: "in", l: "Entrada no estoque", s: "Chegou material", fn: () => movForm("entrada") }, { c: "g-pink", icon: "out", l: "Saída do estoque", s: "Saiu sem ser por envio", fn: () => saidaForm() }, { c: "g-amber", icon: "count", l: "Contar estoque", s: "Conferir a prateleira item por item", fn: () => contagemModo() }, { c: "g-amber", icon: "list", l: "Importar planilha da contagem", s: "Excel com código e quantidade", fn: importarContagemDrawer }, { c: "g-green", icon: "download", l: "Exportar estoque (Excel)", s: "Planilha com o que está no sistema", fn: () => exportarEstoqueExcel() }, { c: "g-blue", icon: "in", l: "Entrada pela nota do fornecedor", s: "XML da nota: soma tudo de uma vez", fn: entradaNotaDrawer }, { c: "g-teal", icon: "list", l: "Lista de compras", s: "O que está acabando, com quantidade sugerida", fn: listaComprasDrawer }, { c: "g-slate", icon: "plus", l: "Novo item", s: "Cadastrar um brinde", fn: () => itemForm() }],
    pedidos: [{ c: "g-violet", icon: "tarefa", l: "Nova tarefa", s: "Para você ou para alguém da equipe", fn: () => tarefaForm() }],
    reps: [{ c: "g-pink", icon: "reps", l: "Novo representante", s: "Cadastrar quem recebe brindes", fn: () => repForm() }],
    equipe: [isAdmin() && { c: "g-violet", icon: "plus", l: "Adicionar pessoa", s: "Dar acesso a alguém da equipe", fn: novaPessoaDrawer }, { c: "g-slate", icon: "user", l: "Editar meu perfil", s: "Nome, cargo e cor", fn: () => perfilGate() }].filter(Boolean),
  }[tab] || [];
  const geral = [
    { c: "g-teal", icon: "envios", l: "Novo envio", s: "Registrar um envio à mão", fn: () => envioForm() },
    { c: "g-red", icon: "camera", l: "Ler etiqueta de uma caixa", s: "Abre o envio pelo código de rastreio ou da nota", fn: lerEtiquetaEAbrir },
    { c: "g-blue", icon: "in", l: "Importar notas fiscais", s: "XML ou PDF das notas, ou DACE dos Correios", fn: importarNotasDrawer },
    { c: "g-amber", icon: "phone", l: "Chamar o Correio", s: "Pedir a coleta dos envios separados", fn: chamarCorreio },
    { c: "g-amber", icon: "box", l: "Modo separação", s: pend ? `${pend} envio${pend > 1 ? "s" : ""} para separar` : "Nenhum envio pendente agora", fn: () => modoSeparacao() },
    { c: "g-green", icon: "in", l: "Entrada no estoque", s: "Chegou material", fn: () => movForm("entrada") },
    { c: "g-pink", icon: "out", l: "Saída do estoque", s: "Saiu sem ser por envio", fn: () => saidaForm() },
    { c: "g-amber", icon: "count", l: "Contar estoque", s: "Conferir a prateleira item por item", fn: () => contagemModo() },
    { c: "g-slate", icon: "box", l: "Kits de brindes", s: "Combinações que se repetem", fn: kitsDrawer },
    { c: "g-violet", icon: "tarefa", l: "Nova tarefa", s: "Pedir algo para a equipe", fn: () => tarefaForm() },
  ].filter(x => !ctx.some(c => c.l === x.l));
  if (ctx.length) return abrirMenu(btn, [...ctx, { sep: "Outros atalhos" }, ...geral], { envios: "Envios", estoque: "Estoque", pedidos: "Tarefas", reps: "Representantes", equipe: "Equipe" }[tab]);
  abrirMenu(btn, [
    { c: "g-teal", icon: "envios", l: "Novo envio", s: "Registrar um envio à mão", fn: () => envioForm() },
    { c: "g-blue", icon: "in", l: "Importar notas fiscais", s: "XML ou PDF das notas, ou DACE dos Correios", fn: importarNotasDrawer },
    { c: "g-amber", icon: "phone", l: "Chamar o Correio", s: "Pedir a coleta dos envios separados", fn: chamarCorreio },
    { c: "g-amber", icon: "box", l: "Modo separação", s: pend ? `${pend} envio${pend > 1 ? "s" : ""} para separar` : "Nenhum envio pendente agora", fn: () => modoSeparacao() },
    { c: "g-green", icon: "in", l: "Entrada no estoque", s: "Chegou material", fn: () => movForm("entrada") },
    { c: "g-pink", icon: "out", l: "Saída do estoque", s: "Saiu sem ser por envio", fn: () => saidaForm() },
    { c: "g-amber", icon: "count", l: "Contar estoque", s: "Conferir a prateleira item por item", fn: () => contagemModo() },
    { c: "g-slate", icon: "box", l: "Kits de brindes", s: "Combinações que se repetem", fn: kitsDrawer },
    { c: "g-violet", icon: "tarefa", l: "Nova tarefa", s: "Pedir algo para a equipe", fn: () => tarefaForm() },
  ], "Criar");
}

/* ---------- barra de navegação embaixo (celular) ---------- */
function renderBnav() {
  const el = $("#bnav"); if (!el) return;
  const it = k => { const t = tabInfo(k), n = myId ? countFor(k) : 0; return `<button class="bn-i" data-tab="${k}"${k === tab ? ' aria-current="page"' : ""}><span class="bn-ic">${ic(t.icon)}${n ? `<span class="bn-n num">${n > 99 ? "99+" : n}</span>` : ""}</span><span>${k === "painel" ? "Início" : k === "estoque" ? "Estoque" : t.l}</span></button>`; };
  const fora = TABS.filter(t => !["painel", "envios", "estoque"].includes(t.k) && (!t.admin || isAdmin())), nMais = myId ? fora.reduce((a, t) => a + countFor(t.k), 0) : 0;
  const noMais = fora.some(t => t.k === tab);
  el.innerHTML = `${it("painel")}${it("envios")}<button class="bn-plus" id="bnPlus" aria-label="Criar">${ic("plus")}</button>${it("estoque")}<button class="bn-i" id="bnMais"${noMais ? ' aria-current="page"' : ""}><span class="bn-ic">${ic("grade")}${nMais ? `<span class="bn-n num">${nMais > 99 ? "99+" : nMais}</span>` : ""}</span><span>Menu</span></button>`;
  $("#bnPlus").onclick = () => menuCriar(null);
  $("#bnMais").onclick = openNav;
  const mb = $("#menuBtn"); if (mb) mb.classList.toggle("tem-novo", !!(myId && naoLidas()));
}

/* ---------- seleção de vários envios ---------- */
const SEL = { on: false, ids: new Set() };
function selecionados() { return S.envios.filter(e => SEL.ids.has(e.id)); }
function renderSelBar() {
  const root = $("#selRoot"); if (!root) return;
  if (!SEL.on || tab !== "envios") { root.innerHTML = ""; return; }
  const n = selecionados().length;
  root.innerHTML = `<div class="selbar" role="toolbar" aria-label="Ações nos envios selecionados">
    <span class="sb-n"><b class="num">${n}</b> selecionado${n === 1 ? "" : "s"}</span>
    <button class="btn sm ghost" id="sbTodos">${ic("check")}Todos</button>
    <span class="sb-acts"><button class="btn sm" id="sbSep"${n ? "" : " disabled"}>${ic("box")}Separar</button><button class="btn sm" id="sbImp"${n ? "" : " disabled"}>${ic("print")}Imprimir</button><button class="btn sm wa" id="sbAv"${n ? "" : " disabled"}>${ic("whats")}Avisar</button></span>
    <button class="btn sm ghost icon" id="sbX" aria-label="Sair da seleção">${ic("x")}</button></div>`;
  $("#sbX").onclick = () => sairSelecao();
  $("#sbTodos").onclick = () => { const vis = filteredEnvios().map(e => e.id), todos = vis.every(id => SEL.ids.has(id)); vis.forEach(id => todos ? SEL.ids.delete(id) : SEL.ids.add(id)); renderBody(true); };
  $("#sbSep").onclick = async () => {
    const l = selecionados().filter(e => e.status === "pendente");
    if (!l.length) return toast("Nenhum dos selecionados está pendente.", "err");
    if (await mudarComDesfazer(l.map(e => ({ e, upd: updSeparado() })), `${l.length} envio${l.length > 1 ? "s marcados" : " marcado"} como separado${l.length > 1 ? "s" : ""}`)) sairSelecao();
  };
  $("#sbImp").onclick = () => imprimirLote(selecionados().filter(e => e.status !== "cancelado"));
  $("#sbAv").onclick = () => avisarLote(selecionados().filter(e => e.status !== "cancelado"));
}
function sairSelecao() { SEL.on = false; SEL.ids.clear(); if (tab === "envios") renderBody(true); renderSelBar(); }

/* ---------- impressão em lote ---------- */
const linhasDocs = e => (e.itens || []).map(l => ({ id: l.itemId, n: itemName(l.itemId), q: Number(l.qtd) || 0, v: Number(l.valor) || Number(itemById(l.itemId)?.valor) || 0 }));
function imprimirLote(lista) {
  if (!lista.length) return toast("Nenhum envio para imprimir.", "err");
  if (!REM) {
    if (isAdmin()) return remetenteDrawer(() => imprimirLote(lista));
    return toast("Um administrador precisa cadastrar os dados do remetente (avatar → Dados do remetente).", "err");
  }
  const semValor = lista.filter(e => linhasDocs(e).some(l => !l.v)).length, semPeso = lista.filter(e => !e.peso).length;
  openDrawer({
    eyebrow: "Envios", title: `Imprimir ${lista.length} envio${lista.length > 1 ? "s" : ""}`, narrow: true,
    body: `<label class="g-check" style="color:var(--ink-2)"><input type="checkbox" id="ilDecl" checked>Declaração de conteúdo (2 vias de cada)</label>
      <label class="g-check" style="color:var(--ink-2)"><input type="checkbox" id="ilEtq" checked>Etiquetas de endereço</label>
      ${semValor || semPeso ? `<div class="banner">${ic("alert")}<span>${semValor ? `${semValor} envio${semValor > 1 ? "s têm" : " tem"} item sem valor unitário. ` : ""}${semPeso ? `${semPeso} sem peso. ` : ""}Esses campos saem em branco na declaração (dá para preencher à mão ou cadastrar o valor do item em Estoque → Editar).</span></div>` : ""}
      <div class="lines">${lista.map(e => `<div class="li" style="padding:6px 0"><span class="uf">${esc(e.uf || "—")}</span><div class="grow"><div class="t">${esc(e.destinatario)}</div><div class="s">${fmtN(totalUn(e))} un.${e.nf ? " · NF " + esc(e.nf) : ""}</div></div></div>`).join("")}</div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="ilOk">${ic("print")}Gerar e imprimir</button>`,
    onMount() {
      $("#ilOk").onclick = () => {
        const decl = $("#ilDecl").checked, etq = $("#ilEtq").checked;
        if (!decl && !etq) return toast("Escolha pelo menos um documento.", "err");
        const w = window.open("", "_blank");
        if (!w) return toast("O navegador bloqueou a janela de impressão. Permita pop-ups para este site.", "err");
        w.document.open(); w.document.write(docsPagina(`Documentos de ${lista.length} envios`, lista.map(e => docsHTML(e, linhasDocs(e), e.peso || 0, decl, etq, true)).join(""))); w.document.close();
        closeDrawer();
      };
    }
  });
}

/* ---------- avisar vários representantes ----------
   O WhatsApp só abre um por vez, então é uma lista: um toque em cada. */
function avisarLote(lista) {
  if (!lista.length) return toast("Nenhum envio para avisar.", "err");
  const fone = e => foneWa(e.repId ? repById(e.repId)?.telefone : "");
  openDrawer({
    eyebrow: "Envios", title: "Avisar representantes", narrow: true,
    body: `<p class="muted" style="margin:0">Toque em cada um: o WhatsApp abre com a mensagem pronta. Depois de enviar, volte aqui para o próximo.</p>
      <div class="lines">${lista.map(e => `<div class="li av-row" data-avr="${e.id}" style="padding:8px 0"><span class="uf">${esc(e.uf || "—")}</span><div class="grow"><div class="t">${esc(e.destinatario)}</div><div class="s">${esc(situacaoLabel(e))} · ${e.repId ? esc(repById(e.repId)?.nome || "") : "sem representante"}${e.avisadoEm ? ` · avisado ${fmtDM(e.avisadoEm)}` : ""}</div></div>
        ${fone(e) ? `<button class="btn sm wa" data-av="${e.id}">${ic("whats")}Avisar</button>` : `<button class="btn sm" data-avrev="${e.id}" title="Sem telefone no cadastro do representante">${ic("edit")}Escolher contato</button>`}</div>`).join("")}</div>`,
    foot: `<button class="btn" data-close>Fechar</button>`,
    onMount(ov) {
      $$("[data-av]", ov).forEach(b => b.onclick = async () => {
        const e = S.envios.find(x => x.id === b.dataset.av); if (!e) return;
        await avisarRapido(e);
        b.closest(".av-row").classList.add("feito"); b.innerHTML = `${ic("check")}Avisado`; b.classList.remove("wa");
      });
      $$("[data-avrev]", ov).forEach(b => b.onclick = () => { const e = S.envios.find(x => x.id === b.dataset.avrev); if (e) avisarDrawer(e); });
    }
  });
}

/* ---------- modo separação ----------
   Um envio por vez, letra grande: toca em cada brinde ao pôr na caixa, tira a foto e conclui. */
const SEP = { fila: [], i: 0, marcados: {}, feitos: [] };
function modoSeparacao(ids) {
  SEP.fila = ids || S.envios.filter(e => e.status === "pendente").sort((a, b) => a.criadoEm - b.criadoEm).map(e => e.id);
  SEP.i = 0; SEP.marcados = {}; SEP.feitos = []; SEP.cx = {};
  if (!SEP.fila.length) return toast("Nenhum envio pendente para separar.");
  closeDrawer(); fecharMenu(); sepRender();
}
function sepFechar() {
  if (SEP.feitos.length) { notificar({ tipo: "envios", evento: "separado", ids: SEP.feitos }); SEP.feitos = []; }
  $("#sepRoot").innerHTML = ""; document.body.classList.remove("sep-on"); }
function sepRender() {
  document.body.classList.add("sep-on");
  while (SEP.i < SEP.fila.length && S.envios.find(x => x.id === SEP.fila[SEP.i])?.status !== "pendente") SEP.i++;
  const total = SEP.fila.length, root = $("#sepRoot");
  if (SEP.i >= total) {
    const n = SEP.feitos.length;
    root.innerHTML = `<div class="sep"><div class="sep-top"><button class="btn ghost icon" id="spX" aria-label="Fechar">${ic("x")}</button><span>Separação</span><span></span></div>
      <div class="sep-fim"><span class="sep-ok">${ic("check")}</span><h2>${n ? `${n} envio${n > 1 ? "s separados" : " separado"}!` : "Nada foi separado"}</h2><p class="muted">${n ? "Os itens já saíram do estoque." : "Os envios continuam pendentes."}</p>
        ${n ? `<button class="btn primary" id="spImp">${ic("print")}Imprimir documentos desses envios</button>` : ""}<button class="btn" id="spEnv">${ic("envios")}Ver envios</button></div></div>`;
    $("#spX").onclick = sepFechar;
    $("#spEnv").onclick = () => { sepFechar(); go("envios", { envStatus: "separado" }); };
    const imp = $("#spImp"); if (imp) imp.onclick = () => { const l = S.envios.filter(e => SEP.feitos.includes(e.id)); sepFechar(); imprimirLote(l); };
    return;
  }
  const e = S.envios.find(x => x.id === SEP.fila[SEP.i]), m = (SEP.marcados[e.id] ||= new Set()), itens = e.itens || [];
  const tudo = itens.length && itens.every((_, k) => m.has(k)), st = stock();
  const cx = (SEP.cx ||= {})[e.id] ||= volumesDe(e);
  root.innerHTML = `<div class="sep" role="dialog" aria-modal="true" aria-label="Modo separação">
    <div class="sep-top"><button class="btn ghost icon" id="spX" aria-label="Sair">${ic("x")}</button><span><b class="num">${SEP.i + 1}</b> de <span class="num">${total}</span></span><button class="btn ghost sm" id="spPular">Pular${ic("chev")}</button></div>
    <div class="sep-prog"><i style="width:${(SEP.i / total) * 100}%"></i></div>
    <div class="sep-body">
      <div class="sep-dest"><span class="ec-uf st-pendente">${esc(e.uf || "—")}</span><div><h2>${esc(e.destinatario)}</h2><div class="muted">${esc([e.cidade, e.uf].filter(Boolean).join("/"))}${e.nf ? ` · NF ${esc(e.nf)}` : ""}${e.pedidoVenda ? ` · Pedido ${esc(e.pedidoVenda)}` : ""}</div></div></div>
      ${e.obs ? `<div class="obs">${esc(e.obs)}</div>` : ""}
      <div class="sep-hint">Toque em cada item ao colocar na caixa · <b class="num">${m.size}/${itens.length}</b></div>
      <div class="sep-itens">${itens.map((l, k) => { const it = itemById(l.itemId), x = st[l.itemId]; return `<button class="sep-it${m.has(k) ? " on" : ""}" data-k="${k}"><span class="sep-chk">${ic("check")}</span><span class="sep-q num">${fmtN(l.qtd)}×</span><span class="sep-n"><b>${esc(frase(itemName(l.itemId)))}</b><small>${esc(it?.codigo || "")}${x && x.fis < 0 ? " · estoque do sistema negativo" : ""}</small></span></button>`; }).join("")}</div>
    </div>
    <div class="sep-foot">${tudo ? `<div class="sep-cx"><span>Em quantas caixas ficou?</span><div class="pg-qtd"><button type="button" class="btn icon" id="spCxMenos" aria-label="Uma caixa a menos"${cx <= 1 ? " disabled" : ""}>−</button><b class="num">${cx}</b><button type="button" class="btn icon" id="spCxMais" aria-label="Uma caixa a mais"${cx >= MAX_CAIXAS ? " disabled" : ""}>+</button></div></div><button class="btn primary big" id="spFoto">${ic("camera")}Foto da caixa e concluir</button><button class="btn" id="spSem">Concluir sem foto</button>` : `<button class="btn primary big" disabled>${itens.length - m.size === 1 ? "Falta 1 item" : `Faltam ${itens.length - m.size} itens`}</button>`}</div></div>`;
  $("#spX").onclick = () => SEP.feitos.length ? (SEP.i = total, sepRender()) : sepFechar();
  $("#spPular").onclick = () => { SEP.i++; sepRender(); };
  $$("[data-k]", root).forEach(b => b.onclick = () => { const k = +b.dataset.k; m.has(k) ? m.delete(k) : m.add(k); if (navigator.vibrate) navigator.vibrate(12); sepRender(); });
  const cxM = $("#spCxMenos"), cxP = $("#spCxMais");
  if (cxM) cxM.onclick = () => { SEP.cx[e.id] = Math.max(1, cx - 1); sepRender(); };
  if (cxP) cxP.onclick = () => { SEP.cx[e.id] = Math.min(MAX_CAIXAS, cx + 1); sepRender(); };
  const concluir = async () => { if (await save(() => col("envios").doc(e.id).update({ ...updSeparado(), volumes: SEP.cx[e.id] || 1 }), SEP.cx[e.id] > 1 ? `Separado em ${txtCaixas(SEP.cx[e.id])}. Os itens saíram do estoque.` : "Separado. Os itens saíram do estoque.")) { SEP.feitos.push(e.id); SEP.i++; sepRender(); } };
  const foto = $("#spFoto"); if (foto) foto.onclick = () => escolherFotos(e, "separacao", true, concluir);
  const sem = $("#spSem"); if (sem) sem.onclick = concluir;
}

/* ---------- ler a etiqueta de uma caixa (ou a nota fiscal) e abrir o envio ---------- */
const chaveDoTexto = t => (String(t || "").replace(/\D/g, "").match(/\d{44}/) || [])[0] || null;
function envioPorCodigo(v) {
  const c = String(v || "").toUpperCase().replace(/\s+/g, ""), ch = chaveDoTexto(v);
  return S.envios.find(e => codigosDe(e).includes(c)) || (ch && S.envios.find(e => e.chaveNfe === ch)) || null;
}
async function lerEtiquetaEAbrir() {
  const v = await lerCodigoBarras(t => rastreioDoTexto(t) || chaveDoTexto(t));
  if (!v) return;
  const e = envioPorCodigo(v);
  if (!e) return toast(`Nenhum envio com o código ${v}. Confira se o código já foi registrado na postagem.`, "err");
  const k = codigosDe(e).indexOf(String(v).toUpperCase());
  if (tab !== "envios") go("envios");
  envioDetalhe(e.id);
  toast(`${e.destinatario}${k >= 0 && codigosDe(e).length > 1 ? ` · caixa ${k + 1} de ${codigosDe(e).length}` : ""}`);
}

/* ---------- leitor de código de barras (rastreio dos Correios) ----------
   Usa o leitor do próprio navegador (Android/Chrome); no iPhone carrega o ZXing. */
const ZXING = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
function carregarZxing() {
  return carregarLib(ZXING, "sha384-BzBxP10ZE72aitqj5UMmUsbKFliP/DZqA8Wq+BNNhlIJDGoEd1tpkMYXOg9+n6sB", "leitor de código de barras").then(() => window.ZXing);
}
const rastreioDoTexto = t => (String(t || "").toUpperCase().replace(/\s+/g, "").match(/[A-Z]{2}\d{9}[A-Z]{2}/) || [])[0] || null;
function lerCodigoBarras(validar = rastreioDoTexto) {
  return new Promise(resolve => {
    $("#scanRoot").innerHTML = `<div class="scan"><video id="scVid" playsinline muted autoplay></video><div class="scan-mira"><i></i></div>
      <div class="scan-top"><button class="btn ghost icon" id="scX" aria-label="Fechar">${ic("x")}</button></div>
      <div class="scan-txt" id="scTxt">Aponte para o código de barras da etiqueta ou do comprovante dos Correios</div>
      <div class="scan-lido" id="scLido" hidden><span>Li: <b class="mono" id="scVal"></b><small>Não parece um código de rastreio (ex.: AB123456789BR). Aponte para outro código ou use assim mesmo.</small></span><button class="btn sm" id="scUsar">Usar assim mesmo</button></div></div>`;
    const vid = $("#scVid"); let fim = false, stream = null, reader = null, timer = 0;
    const acabar = v => { if (fim) return; fim = true; clearTimeout(timer); try { reader?.reset(); } catch (x) {} stream?.getTracks().forEach(t => t.stop()); $("#scanRoot").innerHTML = ""; if (v && navigator.vibrate) navigator.vibrate(60); resolve(v || null); };
    $("#scX").onclick = () => acabar(null);
    const falha = msg => { const t = $("#scTxt"); if (!fim && t) t.textContent = msg; };
    // código no formato de rastreio: usa na hora; outro código: mostra o que leu e deixa a pessoa decidir
    let ultimo = "";
    const tentar = raw => {
      const v = validar(raw); if (v) return acabar(v);
      const t = String(raw || "").trim(); if (!t || t === ultimo || fim) return;
      ultimo = t; $("#scVal").textContent = t.length > 40 ? t.slice(0, 40) + "…" : t; $("#scLido").hidden = false;
      $("#scUsar").onclick = () => acabar(t.toUpperCase().replace(/\s+/g, ""));
    };
    const camera = { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 }, advanced: [{ focusMode: "continuous" }] };
    (async () => {
      try {
        // a câmera é aberta aqui (igual para todos os aparelhos); a leitura é feita quadro a quadro
        stream = await navigator.mediaDevices.getUserMedia({ video: camera, audio: false });
        if (fim) return acabar(null);
        vid.srcObject = stream; await vid.play();
        let detectar;
        const nativos = "BarcodeDetector" in window ? await BarcodeDetector.getSupportedFormats().catch(() => []) : [];
        if (nativos.includes("code_128")) {
          // Android/Chrome: leitor do próprio aparelho
          const det = new BarcodeDetector({ formats: ["code_128", "code_39", "code_93", "itf", "ean_13", "qr_code", "data_matrix", "pdf417"].filter(f => nativos.includes(f)) });
          detectar = async () => { for (const c of await det.detect(vid)) tentar(c.rawValue); };
        } else {
          // iPhone e computador: ZXing lendo uma "foto" da câmera a cada volta (o modo ao vivo dele não devolve resultado)
          const Z = await carregarZxing(); if (fim) return;
          const hints = new Map(); hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.CODE_39, Z.BarcodeFormat.CODE_93, Z.BarcodeFormat.ITF, Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.QR_CODE, Z.BarcodeFormat.DATA_MATRIX, Z.BarcodeFormat.PDF_417]); hints.set(Z.DecodeHintType.TRY_HARDER, true);
          reader = new Z.BrowserMultiFormatReader(hints);
          const tela = document.createElement("canvas"), g = tela.getContext("2d", { willReadFrequently: true });
          detectar = async () => {
            const w = vid.videoWidth, h = vid.videoHeight; if (!w || !h) return;
            const k = Math.min(1, 1280 / w); tela.width = Math.round(w * k); tela.height = Math.round(h * k);
            g.drawImage(vid, 0, 0, tela.width, tela.height);
            try { tentar(reader.decodeBitmap(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(tela)))).getText()); } catch (x) { /* nenhum código neste quadro */ }
          };
        }
        const loop = async () => { if (fim) return; try { await detectar(); } catch (x) { } timer = setTimeout(loop, 150); };
        loop();
      } catch (x) {
        falha(/NotAllowed|Permission/i.test(x?.name || x?.message) ? "O acesso à câmera foi negado. Libere a câmera para este site nas configurações do navegador." : (x?.message || "Não foi possível abrir a câmera."));
      }
    })();
  });
}

/* ---------- previsão de estoque ----------
   Consumo médio dos últimos 90 dias (ou desde o primeiro envio, se o sistema é mais novo). */
function consumoDiario() {
  const agora = Date.now(), prim = Math.min(...S.envios.map(e => e.criadoEm || agora), agora);
  const dias = Math.max(14, Math.min(90, (agora - prim) / 864e5)), desde = agora - dias * 864e5, soma = {};
  for (const e of S.envios) {
    if (!["separado", "postado", "entregue"].includes(e.status) || (e.separadoEm || e.criadoEm || 0) < desde) continue;
    for (const l of e.itens || []) soma[l.itemId] = (soma[l.itemId] || 0) + (Number(l.qtd) || 0);
  }
  for (const m of S.movimentos) if (m.tipo === "saida" && (m.em || 0) >= desde) soma[m.itemId] = (soma[m.itemId] || 0) - (Number(m.qtd) || 0);
  return Object.fromEntries(Object.entries(soma).map(([k, v]) => [k, v / dias]));
}
const diasRestantes = (taxa, disp) => taxa > 0 && disp > 0 ? Math.floor(disp / taxa) : null;
const textoDias = d => d < 1 ? "acaba hoje" : d < 7 ? `acaba em ~${d} dia${d > 1 ? "s" : ""}` : d < 60 ? `acaba em ~${Math.round(d / 7)} semana${Math.round(d / 7) > 1 ? "s" : ""}` : `dura ~${Math.round(d / 30)} meses`;

/* ---------- hora de comprar ----------
   Cada brinde pode ter o prazo de reposição (quantos dias o fornecedor leva para entregar; cadastro do item).
   O aviso vem quando o que tem acaba dentro desse prazo + 2 semanas de folga. Sem prazo cadastrado, conta 14 dias. */
const PRAZO_PADRAO = 14, FOLGA_COMPRA = 14;
const temPrazo = i => Number(i?.prazoReposicao) > 0;
const prazoDe = i => temPrazo(i) ? Number(i.prazoReposicao) : PRAZO_PADRAO;
const limiteCompra = i => prazoDe(i) + FOLGA_COMPRA;
const textoPrazo = n => n < 14 ? `${n} dia${n > 1 ? "s" : ""}` : `~${Math.round(n / 7)} semanas`;
// "acaba em ~5 semanas · leva ~6 semanas para chegar"
const textoCompra = (i, d) => `${textoDias(d)}${temPrazo(i) ? ` · leva ${textoPrazo(prazoDe(i))} para chegar` : ""}`;
// dias até acabar, se o brinde já está na hora de comprar; senão null
const horaDeComprar = (i, disp, taxa) => { const d = diasRestantes(taxa, disp); return d != null && d <= limiteCompra(i) ? d : null; };

/* aviso no celular dos administradores: uma vez quando o brinde entra na hora de comprar.
   Marca "avisoCompraEm" no item (com transação, para dois computadores abertos não avisarem em dobro);
   a marca sai quando o brinde volta a ter folga (chegou mercadoria), e aí pode avisar de novo no futuro. */
async function verificarCompras() {
  if (noDb || !myId || !isAdmin() || readOnly || !["itens", "movimentos", "envios", "perfis"].every(k => loaded[k] && !bloqueadas.has(k)) || !S.itens.length) return;
  const st = stock(), taxa = consumoDiario(), novos = [], limpar = [];
  for (const i of S.itens) {
    if (i.arquivado) continue;
    const disp = st[i.id]?.disp || 0, d = horaDeComprar(i, disp, taxa[i.id]);
    if (d != null && !i.avisoCompraEm) novos.push({ i, d });
    else if (d == null && disp > 0 && i.avisoCompraEm) limpar.push(i);
  }
  for (const i of limpar) col("itens").doc(i.id).update({ avisoCompraEm: null }).catch(() => { });
  const avisar = [];
  for (const { i, d } of novos.slice(0, 20)) {
    const ref = col("itens").doc(i.id);
    try {
      const ok = await db.runTransaction(async tx => { const s = await tx.get(ref); if (!s.exists || s.data().avisoCompraEm) return false; tx.update(ref, { avisoCompraEm: Date.now() }); return true; });
      if (ok) avisar.push({ id: i.id, dias: d });
    } catch (x) { }
  }
  if (avisar.length) notificar({ tipo: "compra", itens: avisar });
}

/* ---------- Início: o que precisa de você hoje ---------- */
function paraHoje() {
  const r = [], hoje = Date.now(), st = stock(), taxa = consumoDiario();
  const pend = S.envios.filter(e => e.status === "pendente").sort((a, b) => a.criadoEm - b.criadoEm);
  if (pend.length) { const d = diasDesde(pend[0].criadoEm); r.push({ c: "g-amber", icon: "box", t: `${pend.length} envio${pend.length > 1 ? "s" : ""} para separar`, s: d >= 1 ? `O mais antigo espera há ${d} dia${d > 1 ? "s" : ""}` : "Chegaram hoje", b: "Separar agora", fn: () => modoSeparacao(), alerta: d >= 3 }); }
  const sep = S.envios.filter(e => e.status === "separado");
  if (sep.length) r.push({ c: "g-teal", icon: "truck", t: `${sep.length} separado${sep.length > 1 ? "s" : ""} esperando postagem`, s: "Registre o código de rastreio quando postar", b: "Ver", fn: () => go("envios", { envStatus: "separado" }) });
  const aten = S.envios.filter(precisaAtencao);
  if (aten.length) r.push({ c: "g-red", icon: "rastreio", t: `${aten.length} entrega${aten.length > 1 ? "s precisam" : " precisa"} de atenção`, s: "Atrasada, com problema ou aguardando retirada", b: "Ver", fn: () => go("rastreio"), alerta: true });
  const semAviso = S.envios.filter(e => e.status === "postado" && e.repId && !avisado(e));
  if (semAviso.length) r.push({ c: "g-green", icon: "whats", t: `${semAviso.length} representante${semAviso.length > 1 ? "s" : ""} sem aviso da postagem`, s: "Mande o código de rastreio pelo WhatsApp", b: "Avisar", fn: () => avisarLote(semAviso) });
  const semConf = semConfirmacao();
  if (semConf.length) r.push({ c: "g-green", icon: "whats", t: `${semConf.length} envio${semConf.length > 1 ? "s" : ""} sem confirmação de chegada`, s: "Postados há dias e o representante não confirmou. Pergunte se chegou.", b: "Ver", fn: () => go("rastreio", { rcTab: "caminho" }) });
  const probs = S.envios.filter(e => e.recebidoOk === false && !e.problemaResolvido);
  if (probs.length) r.push({ c: "g-red", icon: "alert", t: `${probs.length} representante${probs.length > 1 ? "s relataram" : " relatou"} problema no recebimento`, s: probs.slice(0, 2).map(e => `${nomeProprio(e.destinatario)}: ${e.recebidoObs || ""}`).join(" · "), b: "Ver", fn: () => go("rastreio", { rcTab: "prob" }), alerta: true });
  const minhas = pedAbertos().filter(p => (p.responsavel === myId || (!p.responsavel && p.autor === myId)) && p.prazo && p.prazo <= today());
  if (minhas.length) r.push({ c: "g-blue", icon: "tarefa", t: `${minhas.length} tarefa${minhas.length > 1 ? "s" : ""} sua${minhas.length > 1 ? "s" : ""} vencendo`, s: minhas.filter(isLate).length ? `${minhas.filter(isLate).length} já passou do prazo` : "O prazo é hoje", b: "Ver", fn: () => go("pedidos", { pedF: "meus" }), alerta: minhas.some(isLate) });
  const acabando = S.itens.filter(i => !i.arquivado).map(i => ({ i, d: diasRestantes(taxa[i.id], st[i.id]?.disp || 0), z: (st[i.id]?.disp || 0) <= 0 && taxa[i.id] > 0 })).filter(x => x.z || (x.d != null && x.d <= limiteCompra(x.i))).sort((a, b) => (a.z ? -1 : a.d) - (b.z ? -1 : b.d));
  if (acabando.length) {
    // "hora de comprar" = acaba antes de uma compra feita hoje chegar; os demais só estão chegando perto
    const urg = acabando.filter(x => x.z || x.d <= prazoDe(x.i)), mais = acabando.length - urg.length;
    r.push({ c: "g-pink", icon: "estoque", t: urg.length ? `Hora de comprar: ${urg.length} brinde${urg.length > 1 ? "s" : ""}${mais ? ` (e mais ${mais} logo)` : ""}` : `${acabando.length} brinde${acabando.length > 1 ? "s podem" : " pode"} acabar em breve`,
      s: acabando.slice(0, 2).map(x => `${frase(x.i.nome)} (${x.z ? "sem estoque" : textoCompra(x.i, x.d)})`).join(" · "), b: "Lista de compras", fn: listaComprasDrawer, alerta: urg.length > 0 });
  }
  return r;
}
let HOJE = [];
function paraHojeHTML() {
  const l = HOJE = paraHoje();
  return `<section class="card hoje"><div class="card-h"><div><h2>Para hoje</h2><div class="sub">${l.length ? "O que está esperando por você" : "Nada pendente"}</div></div></div>
    ${l.length ? `<div class="hoje-l">${l.map((x, k) => `<div class="hoje-r${x.alerta ? " alerta" : ""}"><span class="m-ico sm ${x.c}">${ic(x.icon)}</span><div class="grow"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></div><button class="btn sm${k === 0 ? " primary" : ""}" data-hoje="${k}">${esc(x.b)}</button></div>`).join("")}</div>`
      : `<div class="empty" style="padding:18px">${ic("check")}<b>Tudo em dia</b><p>Nenhum envio parado, nenhuma tarefa vencendo.</p></div>`}</section>`;
}
