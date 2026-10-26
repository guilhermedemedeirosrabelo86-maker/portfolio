/* Central de Brindes · Conversas estilo WhatsApp (mensagens podem virar tarefas) */
"use strict";

/* =========================================================
   CONVERSAS (estilo WhatsApp); mensagens podem virar tarefas
   conversas/{id}: tipo (direta|grupo), nome, membros[], fixo, ultimaMsg, atualizadoEm, lidos{uid: ts}
   conversas/{id}/mensagens/{id}: texto, autor, em, pedidoId?, apagada?
   ========================================================= */
const CH = { aberta: null, msgs: [], unsub: null, draft: {}, busca: "", scroll: null, marcando: new Set() };
const EQUIPE_ID = "equipe";
const dmId = (a, b) => "dm_" + [a, b].sort().join("_");
const outroMembro = c => (c.membros || []).find(u => u !== myId) || myId;
function nomeConversa(c) { if (!c) return ""; if (c.tipo === "direta") return uname(outroMembro(c)); return c.nome || "Grupo"; }
const minhasConversas = () => S.conversas.filter(c => (c.membros || []).includes(myId)).sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0));
const naoLida = c => !!(c.ultimaMsg && c.ultimaMsg.autor !== myId && (c.ultimaMsg.em || 0) > ((c.lidos || {})[myId] || 0));
const naoLidas = () => minhasConversas().filter(naoLida).length;
const fmtHora = t => { if (!t) return ""; const d = new Date(t), h = new Date(); if (d.toDateString() === h.toDateString()) return fmtH(t); const o = new Date(h); o.setDate(h.getDate() - 1); if (d.toDateString() === o.toDateString()) return "ontem"; return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); };
function linkify(t) { return esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); }
function avatarConversa(c, size = "") {
  if (c.tipo === "direta") return avatar(outroMembro(c), size);
  const cor = c.id === EQUIPE_ID ? "#D61C38" : (c.cor || "#0E7C86");
  return `<span class="av ${size} av-grp" style="background:${cor}" aria-hidden="true">${c.id === EQUIPE_ID ? `<img src="assets/simbolo.svg" alt="">` : ic("grupo")}</span>`;
}
function abrirConversa(id) {
  if (!db || !myId) return;
  if (CH.aberta === id && CH.unsub) { renderBody(true); return; }
  fecharConversa(); CH.aberta = id; CH.msgs = []; CH.scroll = null;
  if (tab !== "chat") go("chat");
  CH.unsub = col("conversas").doc(id).collection("mensagens").orderBy("em", "desc").limit(200).onSnapshot(sn => {
    CH.msgs = sn.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    if (tab === "chat") scheduleRender();
    marcarLida(id);
  }, () => { });
  renderBody(true);
}
function fecharConversa() { if (CH.unsub) { CH.unsub(); CH.unsub = null; } CH.aberta = null; CH.msgs = []; }
function marcarLida(id) {
  const c = S.conversas.find(x => x.id === id);
  if (!c || !naoLida(c) || CH.marcando.has(id) || document.hidden) return;
  CH.marcando.add(id);
  col("conversas").doc(id).update({ ["lidos." + myId]: Date.now() }).catch(() => { }).finally(() => CH.marcando.delete(id));
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && tab === "chat" && CH.aberta) marcarLida(CH.aberta); });
async function conversaDireta(uid) {
  const id = dmId(myId, uid);
  if (!S.conversas.some(c => c.id === id)) {
    const ok = await save(() => col("conversas").doc(id).set({ tipo: "direta", membros: [myId, uid].sort(), criadoPor: myId, criadoEm: Date.now(), atualizadoEm: Date.now(), ultimaMsg: null, lidos: {} }));
    if (!ok) return;
  }
  closeDrawer(); abrirConversa(id);
}
async function garantirEquipe() {
  if (!isAdmin() || !loaded.conversas || !loaded.perfis) return;
  const ativosIds = S.perfis.filter(p => p.ativo !== false).map(p => p.id);
  const eq = S.conversas.find(c => c.id === EQUIPE_ID);
  if (!eq) {
    await col("conversas").doc(EQUIPE_ID).set({ tipo: "grupo", fixo: true, nome: "Equipe Marketing", membros: ativosIds, criadoPor: myId, criadoEm: Date.now(), atualizadoEm: Date.now(), ultimaMsg: null, lidos: {} }).catch(() => { });
  } else {
    const faltam = ativosIds.filter(u => !(eq.membros || []).includes(u));
    if (faltam.length) await col("conversas").doc(EQUIPE_ID).update({ membros: firebase.firestore.FieldValue.arrayUnion(...faltam) }).catch(() => { });
  }
}
async function enviarMensagem() {
  const c = S.conversas.find(x => x.id === CH.aberta); if (!c) return;
  const ta = $("#cvTexto"); const texto = ta.value.trim(); if (!texto) { ta.focus(); return; }
  const em = Date.now(), msgRef = col("conversas").doc(c.id).collection("mensagens").doc();
  const msg = { texto, autor: myId, em };
  $("#cvSend").disabled = true;
  const ok = await save(() => { const b = db.batch(); b.set(msgRef, msg); b.update(col("conversas").doc(c.id), { ultimaMsg: { texto: texto.slice(0, 140), autor: myId, em }, atualizadoEm: em, ["lidos." + myId]: em }); return b.commit(); });
  if (ok) { notificar({ tipo: "msg", conversaId: c.id }); CH.draft[c.id] = ""; ta.value = ""; CH.scroll = { bottom: true }; renderBody(true); $("#cvTexto")?.focus(); }
  else { const s2 = $("#cvSend"); if (s2) s2.disabled = false; }
}
function msgParaTarefa(m) {
  const c = S.conversas.find(x => x.id === CH.aberta); if (!c || m.pedidoId) return;
  tarefaForm(null, { texto: m.texto, conversaId: c.id, msgId: m.id, membros: c.tipo === "direta" ? c.membros : null });
}
function tarefaChip(pid) {
  const p = S.pedidos.find(x => x.id === pid);
  if (!p) return `<div class="task-chip off">${ic("tarefa")}<span>Tarefa removida</span></div>`;
  return `<button class="task-chip${p.status === "concluido" ? " done" : ""}" data-tarefa="${p.id}">${ic("tarefa")}<span>Tarefa · ${ST_PED[p.status]}${p.responsavel ? " · " + esc(firstName(p.responsavel)) : ""}${p.prazo && p.status !== "concluido" ? " · " + fmtPrazo(p.prazo) : ""}</span><b>Ver</b></button>`;
}
VIEWS.chat = {
  head: () => "",
  body() {
    const old = $("#cvMsgs");
    if (old && CH.scroll?.bottom !== true) CH.scroll = { top: old.scrollTop, bottom: old.scrollHeight - old.scrollTop - old.clientHeight < 80 };
    if (bloqueadas.has("conversas")) return `<div class="card">${empty("alert", "Conversas ainda não liberadas no banco", "Publique as regras novas no Firebase (Firestore Database → Regras → colar o arquivo firestore.rules → Publicar) e atualize a página.")}</div>`;
    if (!loaded.conversas) return skeleton("Carregando conversas…");
    const q = norm(CH.busca);
    const lista = minhasConversas().filter(c => !q || norm(nomeConversa(c)).includes(q));
    const itens = lista.map(c => {
      const um = c.ultimaMsg, nl = naoLida(c);
      const prev = um ? `${c.tipo !== "direta" && um.autor ? (um.autor === myId ? "Você" : firstName(um.autor)) + ": " : um.autor === myId ? "Você: " : ""}${um.texto}` : (c.tipo === "direta" ? "Toque para conversar" : `${(c.membros || []).length} participantes`);
      return `<button class="cl-item${c.id === CH.aberta ? " on" : ""}${nl ? " unread" : ""}" data-conv="${esc(c.id)}">${avatarConversa(c, "lg")}
        <span class="cl-txt"><span class="cl-top"><b>${esc(nomeConversa(c))}</b><small>${fmtHora(um?.em || c.atualizadoEm)}</small></span>
        <span class="cl-bot"><span class="cl-prev">${esc(prev)}</span>${nl ? `<i class="cl-dot" aria-label="Não lida"></i>` : ""}</span></span></button>`;
    }).join("");
    const listaHtml = `<aside class="cl">
      <div class="cl-head"><h2>Conversas</h2><div class="btns"><button class="btn sm ghost icon" id="clNovoGrupo" title="Novo grupo" aria-label="Novo grupo">${ic("grupo")}</button><button class="btn sm primary" id="clNova">${ic("newchat")}Nova</button></div></div>
      <div class="cl-search"><div class="search" style="width:100%">${ic("search")}<input class="input" id="clBusca" type="search" placeholder="Buscar conversa" value="${esc(CH.busca)}"></div></div>
      <div class="cl-list">${itens || `<div class="empty" style="padding:30px 16px">${lista.length || CH.busca ? "Nenhuma conversa encontrada." : "Nenhuma conversa ainda. Clique em <b>Nova</b> para falar com alguém da equipe."}</div>`}</div>
    </aside>`;
    const c = S.conversas.find(x => x.id === CH.aberta);
    let pane;
    if (!c) {
      pane = `<section class="cv cv-empty"><div class="empty"><div class="ico">${ic("pedidos")}</div><b>Suas conversas</b><p>Escolha uma conversa ao lado ou comece uma nova. Qualquer mensagem pode virar uma tarefa (ela vai para a aba Tarefas).</p></div></section>`;
    } else {
      const grupo = c.tipo !== "direta";
      let html = "", dia = "", ant = null;
      for (const m of CH.msgs) {
        const d0 = new Date(m.em).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }), d = d0.charAt(0).toUpperCase() + d0.slice(1);
        if (d !== dia) { html += `<div class="cv-day"><span>${esc(d)}</span></div>`; dia = d; ant = null; }
        const mine = m.autor === myId, cont = ant && ant.autor === m.autor && m.em - ant.em < 5 * 60e3;
        const acts = [];
        if (!m.pedidoId && !m.apagada) acts.push(`<button class="mact" data-mact="tarefa" data-id="${m.id}" title="Transformar em tarefa">${ic("tarefa")}</button>`);
        if (mine && !m.apagada) acts.push(`<button class="mact" data-mact="apagar" data-id="${m.id}" title="Apagar mensagem">${ic("trash")}</button>`);
        html += `<div class="cv-msg${mine ? " me" : ""}${cont ? " cont" : ""}">
          ${!mine && grupo ? `<span class="cv-av">${cont ? "" : avatar(m.autor, "sm")}</span>` : ""}
          <div class="bub${m.pedidoId ? " has-task" : ""}">${!mine && grupo && !cont ? `<span class="bub-name" style="color:${ucor(m.autor)}">${who(m.autor)}</span>` : ""}
            ${m.apagada ? `<span class="bub-del">${ic("x", "i-sm")}Mensagem apagada</span>` : `<div class="bub-text">${linkify(m.texto)}</div>`}
            ${m.pedidoId && !m.apagada ? tarefaChip(m.pedidoId) : ""}
            <span class="bub-time">${fmtH(m.em)}</span>
            ${acts.length ? `<span class="bub-acts">${acts.join("")}</span>` : ""}</div></div>`;
        ant = m;
      }
      const membros = (c.membros || []).filter(u => u !== myId || grupo);
      const sub = grupo ? membros.map(u => u === myId ? "Você" : firstName(u)).join(", ") : (perfil(outroMembro(c))?.cargo || "Conversa individual");
      pane = `<section class="cv">
        <header class="cv-head"><button class="btn ghost icon cv-back" id="cvBack" aria-label="Voltar">${ic("back")}</button>${avatarConversa(c)}
          <div class="cv-title"><b>${esc(nomeConversa(c))}</b><small>${esc(sub)}</small></div>
          ${grupo ? `<button class="btn sm ghost" id="cvInfo">${ic("equipe")}<span class="hide-sm">Participantes</span></button>` : ""}</header>
        <div class="cv-msgs" id="cvMsgs">${html || `<div class="cv-hint">Nenhuma mensagem ainda. Diga um oi 👋</div>`}</div>
        <form class="cv-comp" id="cvForm">
          <div class="cv-row">
            <textarea id="cvTexto" rows="1" placeholder="Mensagem"></textarea>
            <button class="btn primary icon cv-send" id="cvSend" aria-label="Enviar">${ic("send")}</button></div>
        </form></section>`;
    }
    return `<div class="chat-app${c ? " has-open" : ""}">${listaHtml}${pane}</div>`;
  },
  after() {
    if (!$("#clNova")) return; // ainda carregando
    $$("[data-conv]").forEach(b => b.onclick = () => abrirConversa(b.dataset.conv));
    $("#clNova").onclick = novaConversaDrawer;
    $("#clNovoGrupo").onclick = () => grupoDrawer();
    const bs = $("#clBusca"); bs.oninput = () => { CH.busca = bs.value; renderBody(true); };
    const c = S.conversas.find(x => x.id === CH.aberta);
    if (!c) return;
    const box = $("#cvMsgs");
    if (!CH.scroll || CH.scroll.bottom) box.scrollTop = box.scrollHeight; else box.scrollTop = CH.scroll.top;
    CH.scroll = null;
    $("#cvBack").onclick = () => { fecharConversa(); renderBody(true); };
    const info = $("#cvInfo"); if (info) info.onclick = () => grupoDrawer(c);
    const ta = $("#cvTexto");
    ta.value = CH.draft[c.id] || "";
    const grow = () => { ta.style.height = "auto"; ta.style.height = Math.min(160, ta.scrollHeight) + "px"; };
    grow();
    ta.oninput = () => { CH.draft[c.id] = ta.value; grow(); };
    ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !ehCelular()) { e.preventDefault(); enviarMensagem(); } };
    $("#cvForm").onsubmit = e => { e.preventDefault(); enviarMensagem(); };
    $$("[data-tarefa]", box).forEach(b => b.onclick = () => irParaTarefa(b.dataset.tarefa));
    $$("[data-mact]", box).forEach(b => b.onclick = () => {
      const m = CH.msgs.find(x => x.id === b.dataset.id); if (!m) return;
      if (b.dataset.mact === "tarefa") msgParaTarefa(m);
      if (b.dataset.mact === "apagar") armConfirm(b, "Apagar?", () => save(() => col("conversas").doc(c.id).collection("mensagens").doc(m.id).update({ apagada: true, texto: "" }), "Mensagem apagada"));
    });
    marcarLida(c.id);
  }
};
function novaConversaDrawer() {
  const pessoas = S.perfis.filter(p => p.id !== myId && p.ativo !== false).sort((a, b) => uname(a.id).localeCompare(uname(b.id)));
  openDrawer({
    eyebrow: "Conversas", title: "Nova conversa", narrow: true,
    body: `<button class="btn" id="ncGrupo" style="justify-content:flex-start;height:48px">${ic("grupo")}Novo grupo</button>
      <div class="section-t">Pessoas da equipe</div>
      <div class="list" style="padding:0">${pessoas.map(p => `<button class="li li-btn" data-dm="${esc(p.id)}">${avatar(p.id)}<div class="grow"><div class="t">${who(p.id)}</div><div class="s">${esc(p.cargo || "")}</div></div>${ic("chev", "i-sm muted")}</button>`).join("") || `<p class="muted">Ainda não há outras pessoas cadastradas. Um administrador adiciona em Equipe → Adicionar pessoa.</p>`}</div>`,
    onMount(ov) {
      $$("[data-dm]", ov).forEach(b => b.onclick = () => conversaDireta(b.dataset.dm));
      $("#ncGrupo").onclick = () => grupoDrawer();
    }
  });
}
function grupoDrawer(c) {
  const editando = !!c, fixo = c?.fixo;
  const sel = new Set(c ? c.membros : [myId]);
  const pessoas = S.perfis.filter(p => p.ativo !== false || sel.has(p.id)).sort((a, b) => (b.id === myId) - (a.id === myId) || uname(a.id).localeCompare(uname(b.id)));
  openDrawer({
    eyebrow: "Conversas", title: editando ? (fixo ? nomeConversa(c) : "Participantes do grupo") : "Novo grupo", narrow: true,
    body: `${fixo ? `<p class="muted">Grupo fixo com todas as pessoas ativas da equipe. Quem entra na equipe é adicionado automaticamente.</p>` : `<label class="field"><span>Nome do grupo</span><input class="input" id="grNome" value="${esc(c?.nome || "")}" placeholder="Ex.: Feira de outubro, Envios Nordeste…"></label>`}
      <div class="section-t">Participantes</div>
      <div class="list" style="padding:0">${pessoas.map(p => `<label class="li li-btn">${avatar(p.id)}<div class="grow"><div class="t">${who(p.id)}${p.id === myId ? " (você)" : ""}</div><div class="s">${esc(p.cargo || "")}</div></div>${fixo ? "" : `<input type="checkbox" class="gr-chk" value="${esc(p.id)}"${sel.has(p.id) ? " checked" : ""}${p.id === myId && !editando ? " disabled" : ""}>`}</label>`).join("")}</div>
      <div class="err" id="grErr" role="alert"></div>`,
    foot: fixo ? `<button class="btn primary" data-close>Fechar</button>` : `${editando ? `<button class="btn ghost danger left" id="grSair">${ic("arrow")}Sair do grupo</button>` : ""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="grOk">${ic("check")}${editando ? "Salvar" : "Criar grupo"}</button>`,
    onMount(ov) {
      if (fixo) return;
      $("#grOk").onclick = async () => {
        const nome = $("#grNome").value.trim();
        const membros = [...new Set([...$$(".gr-chk:checked", ov).map(x => x.value), ...(editando ? [] : [myId])])];
        if (!nome) return $("#grErr").textContent = "Dê um nome ao grupo.";
        if (membros.length < 2) return $("#grErr").textContent = "Escolha pelo menos mais uma pessoa.";
        if (editando && !membros.includes(myId)) return $("#grErr").textContent = "Para sair do grupo use o botão Sair do grupo.";
        if (editando) { if (await save(() => col("conversas").doc(c.id).update({ nome, membros }), "Grupo atualizado")) closeDrawer(); return; }
        const ref = col("conversas").doc(), em = Date.now();
        if (await save(() => ref.set({ tipo: "grupo", nome, membros, cor: CORES[Math.floor(Math.random() * CORES.length)], criadoPor: myId, criadoEm: em, atualizadoEm: em, ultimaMsg: null, lidos: {} }), "Grupo criado")) { closeDrawer(); abrirConversa(ref.id); }
      };
      const sair = $("#grSair"); if (sair) sair.onclick = () => armConfirm(sair, "Confirmar saída", async () => { if (await save(() => col("conversas").doc(c.id).update({ membros: firebase.firestore.FieldValue.arrayRemove(myId) }), "Você saiu do grupo")) { closeDrawer(); fecharConversa(); renderBody(true); } });
    }
  });
}
