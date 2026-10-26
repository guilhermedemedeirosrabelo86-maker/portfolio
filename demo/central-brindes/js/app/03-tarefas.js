/* Central de Brindes · Tarefas: lista de afazeres, criar, editar e comentar */
"use strict";

/* ---------- Tarefas ----------
   Lugar único das tarefas (as criadas a partir de mensagens também aparecem aqui).
   Lista de afazeres: toca no círculo para concluir; toca no texto para abrir, editar e comentar. */
const comigo = p => p.responsavel === myId || (!p.responsavel && p.autor === myId);
// prazos de um toque (adicionar rápido e formulário)
const PRAZOS_RAP = [["", "Sem prazo"], ["0", "Hoje"], ["1", "Amanhã"], ["7", "Em 7 dias"]];
const prazoRapido = k => k === "" || k == null ? null : emDias(Number(k));
const prazoTxt = s => s === today() ? "hoje" : s === emDias(1) ? "amanhã" : s === emDias(-1) ? "ontem" : fmtPrazo(s);
// o que foi concluído hoje aparece apagadinho no fim (dá para desfazer tocando no círculo)
function feitasHoje(vis) {
  const ini = new Date(); ini.setHours(0, 0, 0, 0);
  const filtro = { meus: p => comigo(p) || p.concluidoPor === myId, pedi: p => p.autor === myId, abertos: () => true, pessoa: p => p.autor === F.pedPessoa || p.responsavel === F.pedPessoa }[F.pedF] || (() => true);
  const l = vis.filter(p => p.status === "concluido" && (p.concluidoEm || 0) >= ini.getTime() && filtro(p)).sort((a, b) => b.concluidoEm - a.concluidoEm);
  return l.length ? `<section class="tf-grupo tf-feitas"><h2 class="sec-t">${ic("check", "i-sm")}Feitas hoje<span class="num">${l.length}</span></h2><div class="card tf-list">${l.slice(0, 15).map(tarefaRow).join("")}</div></section>` : "";
}
VIEWS.pedidos = {
  head: () => pageHead("Operação", "Tarefas", "Escreva e aperte Enter para anotar. Toque no círculo quando terminar.",
    `<button class="btn" id="tfNova">${ic("plus")}Tarefa para alguém</button>`) +
    `<form class="tf-rapida card" id="tfRapida" autocomplete="off">
      <div class="tf-r-l">${ic("plus", "i tf-r-ic")}<input class="tf-r-in" id="tfRTexto" placeholder="${matchMedia("(max-width:720px)").matches ? "Anotar uma tarefa…" : "Anotar uma tarefa para mim…"}" aria-label="Nova tarefa para mim" enterkeyhint="done" maxlength="5000"><button class="btn primary" id="tfRBtn" type="submit">Adicionar</button></div>
      <div class="tf-r-opc"><span class="seg mini" role="group" aria-label="Prazo">${PRAZOS_RAP.map(([k, l]) => `<button type="button" data-rp="${k}" aria-pressed="${k === ""}">${l}</button>`).join("")}</span><button type="button" class="link" id="tfRMais">Mais opções</button></div>
    </form>
    <div class="seg scroll" id="pedSeg" role="group" aria-label="Filtrar tarefas" style="margin-top:12px"></div>`,
  bind() {
    $("#tfNova").onclick = () => tarefaForm();
    let prazo = "";
    $$("[data-rp]").forEach(b => b.onclick = () => { prazo = b.dataset.rp; $$("[data-rp]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#tfRTexto").focus(); });
    $("#tfRMais").onclick = () => tarefaForm(null, { texto: $("#tfRTexto").value.trim(), responsavel: myId, prazo: prazoRapido(prazo) });
    $("#tfRapida").onsubmit = async ev => {
      ev.preventDefault();
      const inp = $("#tfRTexto"), texto = inp.value.trim(); if (!texto) { inp.focus(); return; }
      const btn = $("#tfRBtn"); btn.disabled = true;
      const ref = col("pedidos").doc();
      const ok = await save(() => ref.set({ texto, tipo: "tarefa", autor: myId, responsavel: myId, prazo: prazoRapido(prazo), status: "andamento", criadoEm: Date.now(), envioId: null, conversaId: null, msgId: null, membros: null }), "Tarefa anotada");
      btn.disabled = false;
      if (ok) { inp.value = ""; inp.focus(); if (F.pedF !== "meus" && F.pedF !== "abertos") F.pedF = "meus"; FOCO_TAREFA = ref.id; renderBody(true); }
    };
  },
  body() {
    const vis = S.pedidos.filter(pedVisivel), ab = vis.filter(p => p.status !== "concluido");
    const defs = [["meus", "Comigo", ab.filter(comigo)], ["pedi", "Que eu pedi", ab.filter(p => p.autor === myId && p.responsavel && p.responsavel !== myId)], ["abertos", "Todas abertas", ab], ["concluidos", "Concluídas", vis.filter(p => p.status === "concluido")]];
    if (F.pedF === "pessoa" && F.pedPessoa) defs.push(["pessoa", firstName(F.pedPessoa), vis.filter(p => p.status !== "concluido" && (p.autor === F.pedPessoa || p.responsavel === F.pedPessoa))]);
    if (!defs.some(d => d[0] === F.pedF)) F.pedF = "meus";
    $("#pedSeg").innerHTML = defs.map(([k, l, arr]) => `<button data-pf="${k}" aria-pressed="${F.pedF === k}">${esc(l)}${k === "concluidos" ? "" : `<span class="n num">${arr.length}</span>`}</button>`).join("");
    $$("[data-pf]").forEach(b => b.onclick = () => { F.pedF = b.dataset.pf; renderBody(true); });
    if (loading()) return skeleton("Carregando tarefas…");
    const list = defs.find(d => d[0] === F.pedF)[2];
    if (!list.length) {
      const msg = { meus: ["Nada pendente com você", "Anote uma tarefa no campo acima ou espere alguém te passar uma."], pedi: ["Nenhuma tarefa pedida por você em aberto", "Use Tarefa para alguém para pedir algo a alguém da equipe."], abertos: ["Nenhuma tarefa em aberto", "A equipe está em dia."], concluidos: ["Nenhuma tarefa concluída ainda", ""], pessoa: ["Nenhuma tarefa em aberto com essa pessoa", ""] }[F.pedF];
      return `<div class="card">${empty(F.pedF === "concluidos" ? "tarefa" : "check", msg[0], msg[1])}</div>` + (F.pedF === "concluidos" ? "" : feitasHoje(vis));
    }
    if (F.pedF === "concluidos") return `<section class="card tf-list">${list.slice().sort((a, b) => (b.concluidoEm || 0) - (a.concluidoEm || 0)).slice(0, 60).map(tarefaRow).join("")}</section>`;
    const hoje = today(), grupos = [["Atrasadas", list.filter(isLate)], ["Para hoje", list.filter(p => p.prazo === hoje)], ["Próximas", list.filter(p => p.prazo && p.prazo > hoje)], ["Sem prazo", list.filter(p => !p.prazo)]];
    return grupos.filter(g => g[1].length).map(([t, arr]) => `<section class="tf-grupo"><h2 class="sec-t${t === "Atrasadas" ? " bad" : ""}">${t}<span class="num">${arr.length}</span></h2><div class="card tf-list">${arr.sort((a, b) => (a.prazo || "").localeCompare(b.prazo || "") || a.criadoEm - b.criadoEm).map(tarefaRow).join("")}</div></section>`).join("") + feitasHoje(vis);
  },
  after() {
    const n2 = $("#tfNova2"); if (n2) n2.onclick = () => tarefaForm();
    $$("[data-tf]", $("#vbody")).forEach(b => b.onclick = () => tarefaAcao(b.dataset.tf, b.dataset.id, b));
    if (FOCO_TAREFA) { const el = $("#m-" + FOCO_TAREFA); FOCO_TAREFA = null; if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("pisca"); } }
  }
};
let FOCO_TAREFA = null;
function tarefaRow(p) {
  const done = p.status === "concluido", env = p.envioId ? S.envios.find(e => e.id === p.envioId) : null, conv = p.conversaId ? S.conversas.find(c => c.id === p.conversaId) : null;
  const meta = [];
  if (p.tipo === "envio") meta.push(`<span class="tag brand">Envio de brindes</span>`);
  if (!(p.responsavel === myId && F.pedF === "meus")) meta.push(`<span>${p.responsavel ? `${avatar(p.responsavel, "xs")}${p.responsavel === myId ? "Você" : who(p.responsavel)}` : `${ic("user")}Sem responsável`}</span>`);
  if (p.autor !== myId && p.autor !== p.responsavel) meta.push(`<span>pedida por ${who(p.autor)}</span>`);
  if (p.prazo && !done) meta.push(`<span class="tf-prazo${isLate(p) ? " late" : p.prazo === today() ? " hoje" : ""}">${ic("clock")}${isLate(p) ? "venceu " : ""}${prazoTxt(p.prazo)}</span>`);
  if (env) meta.push(`<span>${ic("truck")}Envio ${ST_ENVIO[env.status].toLowerCase()}</span>`);
  if (done) meta.push(`<span>${ic("check")}${p.concluidoPor === myId ? "Você" : who(p.concluidoPor)} · ${fmtD(p.concluidoEm)}</span>`);
  return `<div class="tf${done ? " done" : ""}${isLate(p) ? " late" : ""}" id="m-${p.id}">
    <button class="tf-chk" data-tf="toggle" data-id="${p.id}" aria-label="${done ? "Reabrir tarefa" : "Concluir tarefa"}" title="${done ? "Reabrir" : "Concluir"}">${ic("check")}</button>
    <button class="tf-main" data-tf="abrir" data-id="${p.id}"><span class="tf-txt">${esc(p.texto)}</span><span class="tf-meta">${meta.join("")}</span></button>
    <button class="btn sm ghost icon" data-tf="mais" data-id="${p.id}" aria-label="Mais ações">${ic("dots")}</button></div>`;
}
function tarefaAcao(act, id, btn) {
  const p = S.pedidos.find(x => x.id === id); if (!p) return;
  const ref = col("pedidos").doc(id);
  if (act === "abrir") return tarefaForm(p);
  if (act === "toggle") {
    if (p.status === "concluido") return save(() => ref.update({ status: p.responsavel ? "andamento" : "aberto", concluidoEm: null, concluidoPor: null }), "Tarefa reaberta");
    return save(() => ref.update({ status: "concluido", concluidoEm: Date.now(), concluidoPor: myId })).then(ok => ok && toast("Tarefa concluída", "", { l: "Desfazer", fn: () => save(() => ref.update({ status: p.status, concluidoEm: null, concluidoPor: null }), "Desfeito") }));
  }
  if (act === "mais") {
    const conv = p.conversaId && S.conversas.find(c => c.id === p.conversaId);
    return abrirMenu(btn, [
      p.status !== "concluido" && p.responsavel !== myId && { icon: "hand", l: "Assumir", s: "Passa a tarefa para você", fn: () => save(() => ref.update({ responsavel: myId, status: "andamento" }), "Tarefa assumida por você") },
      p.tipo === "envio" && !p.envioId && { icon: "truck", l: "Criar o envio", s: "Abre o formulário já ligado a esta tarefa", fn: () => envioForm(null, { pedidoId: id, obs: p.texto }) },
      { icon: "edit", l: "Abrir, editar e comentar", fn: () => tarefaForm(p) },
      conv && { icon: "pedidos", l: "Abrir a conversa", s: nomeConversa(conv), fn: () => abrirConversa(conv.id) },
      p.autor === myId && { icon: "trash", l: "Apagar tarefa", danger: true, fn: async () => { const { id: _, ...dados } = p; if (await save(() => ref.delete())) toast("Tarefa apagada", "", { l: "Desfazer", fn: () => save(() => ref.set(dados), "Tarefa restaurada") }); } },
    ], p.texto.split("\n")[0].slice(0, 60));
  }
}
// formulário único: criar, editar e comentar (pre = dados de quando vem de uma mensagem)
function tarefaForm(p, pre) {
  const ed = !!p, d = p || pre || {};
  let unsub = null;
  openDrawer({
    eyebrow: ed ? `Tarefa · ${ST_PED[p.status]}` : pre?.conversaId ? "Da conversa" : "Tarefas", title: ed ? "Tarefa" : "Nova tarefa", narrow: true,
    body: `<label class="field"><span>O que precisa ser feito</span><textarea class="textarea" id="tfTexto" rows="4" placeholder="Ex.: Enviar 20 cartelas para o representante de Recife">${esc(d.texto || "")}</textarea></label>
      <div class="row2"><label class="field"><span>Responsável</span><select class="select" id="tfResp">${memberOptions(d.responsavel || "", "Sem responsável")}</select></label>
        <label class="field"><span>Prazo</span><input class="input" type="date" id="tfPrazo" value="${esc(d.prazo || "")}"></label></div>
      <div class="seg mini tf-prazos" role="group" aria-label="Prazo rápido">${PRAZOS_RAP.map(([k, l]) => `<button type="button" data-fp="${k}" aria-pressed="${(prazoRapido(k) || "") === (d.prazo || "")}">${l}</button>`).join("")}</div>
      <label class="g-check" style="color:var(--ink-2)"><input type="checkbox" id="tfEnvio"${d.tipo === "envio" ? " checked" : ""}>É um pedido de envio de brindes</label>
      ${ed ? `<div class="section-t">Comentários</div><div class="cm-list" id="cmList"><span class="muted" style="font-size:13px">Carregando…</span></div>
        <form class="replyform" id="cmForm"><input class="input" id="cmIn" placeholder="Escreva um comentário…" autocomplete="off"><button class="btn">${ic("send")}</button></form>` : ""}
      <div class="err" id="tfErr" role="alert"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="tfOk">${ic("check")}${ed ? "Salvar" : "Criar tarefa"}</button>`,
    onMount(ov) {
      const marcaPrazo = () => $$("[data-fp]", ov).forEach(x => x.setAttribute("aria-pressed", (prazoRapido(x.dataset.fp) || "") === $("#tfPrazo").value));
      $$("[data-fp]", ov).forEach(b => b.onclick = () => { $("#tfPrazo").value = prazoRapido(b.dataset.fp) || ""; marcaPrazo(); });
      $("#tfPrazo").oninput = marcaPrazo;
      if (ed && db) {
        unsub = col("pedidos").doc(p.id).collection("respostas").onSnapshot(s => {
          const box = $("#cmList"); if (!box || !ov.isConnected) { unsub?.(); return; }
          const rs = s.docs.map(x => x.data()).sort((a, b) => a.em - b.em);
          box.innerHTML = rs.map(r => `<div class="reply">${avatar(r.autor, "xs")}<div class="rb"><div class="rh"><b>${who(r.autor)}</b><span>${fmtDT(r.em)}</span></div><div class="rt">${esc(r.texto)}</div></div></div>`).join("") || `<span class="muted" style="font-size:13px">Nenhum comentário ainda.</span>`;
          hydrate(box);
        }, () => { });
        $("#cmForm").onsubmit = async ev => { ev.preventDefault(); const inp = $("#cmIn"), t = inp.value.trim(); if (!t) return; if (await save(() => col("pedidos").doc(p.id).collection("respostas").add({ texto: t, autor: myId, em: Date.now() }))) inp.value = ""; };
      }
      $("#tfOk").onclick = async () => {
        const texto = $("#tfTexto").value.trim(); if (!texto) { $("#tfErr").textContent = "Escreva o que precisa ser feito."; return; }
        const resp = $("#tfResp").value || null, prazo = $("#tfPrazo").value || null, tipo = $("#tfEnvio").checked ? "envio" : "tarefa";
        $("#tfOk").disabled = true;
        let ok, pid = p?.id;
        if (ed) {
          const upd = { texto, responsavel: resp, prazo, tipo };
          if (p.status !== "concluido") upd.status = resp ? "andamento" : "aberto";
          ok = await save(() => col("pedidos").doc(p.id).update(upd), "Tarefa salva");
          if (ok && resp && resp !== p.responsavel && resp !== myId) notificar({ tipo: "tarefa", pedidoId: p.id });
        } else {
          const ref = col("pedidos").doc(), doc = { texto, tipo, autor: myId, responsavel: resp, prazo, status: resp ? "andamento" : "aberto", criadoEm: Date.now(), envioId: null, conversaId: pre?.conversaId || null, msgId: pre?.msgId || null, membros: pre?.membros || null };
          pid = ref.id;
          ok = await save(() => { const b = db.batch(); b.set(ref, doc); if (pre?.msgId) b.update(col("conversas").doc(pre.conversaId).collection("mensagens").doc(pre.msgId), { pedidoId: ref.id }); return b.commit(); }, "Tarefa criada");
          if (ok && resp && resp !== myId) notificar({ tipo: "tarefa", pedidoId: ref.id });
        }
        if (ok) { unsub?.(); closeDrawer(); if (!ed && tab === "pedidos") { F.pedF = resp && resp !== myId ? "pedi" : "meus"; FOCO_TAREFA = pid; renderBody(true); } }
        else { const b = $("#tfOk"); if (b) b.disabled = false; }
      };
    }
  });
}
function irParaTarefa(pid) {
  const p = S.pedidos.find(x => x.id === pid); if (!p) return;
  FOCO_TAREFA = pid;
  go("pedidos", { pedF: p.status === "concluido" ? "concluidos" : comigo(p) ? "meus" : "abertos" });
}
