/* Central de Brindes · Busca rápida (Ctrl+K) e ajuda */
"use strict";

/* =========================================================
   BUSCA RÁPIDA (Ctrl+K)
   ========================================================= */
function openPalette() {
  $("#paletteRoot").innerHTML = `<div class="palov" id="palov"><div class="palette" role="dialog" aria-modal="true" aria-label="Buscar">
    <div class="pal-in">${ic("search")}<input id="palQ" type="search" enterkeyhint="search" placeholder="Buscar brindes, envios, tarefas…" autocomplete="off"><kbd>Esc</kbd><button type="button" class="pal-x" id="palX">Cancelar</button></div>
    <div class="pal-res" id="palRes" role="listbox"></div></div></div>`;
  const q = $("#palQ"); let sel = 0, items = [];
  const run = () => {
    const t = norm(q.value.trim());
    const res = [];
    const add = (g, arr) => { if (arr.length) res.push([g, arr]); };
    add("Módulos", TABS.filter(x => (!x.admin || isAdmin()) && (!t || norm(x.l).includes(t))).map(x => ({ c: x.c, icon: x.icon, b: x.l, s: "Abrir módulo", fn: () => go(x.k) })));
    add("Ações", [
      { c: "g-teal", icon: "plus", b: "Novo envio", s: "Registrar um envio", fn: () => envioForm() },
      { c: "g-red", icon: "camera", b: "Ler etiqueta de uma caixa", s: "Abre o envio pelo código de barras", fn: lerEtiquetaEAbrir },
      { c: "g-blue", icon: "in", b: "Importar notas fiscais", s: "XML ou PDF das notas", fn: importarNotasDrawer },
      { c: "g-amber", icon: "box", b: "Modo separação", s: "Separar os envios pendentes um por um", fn: () => modoSeparacao() },
      { c: "g-blue", icon: "plus", b: "Nova tarefa", s: "Pedir algo para a equipe", fn: () => tarefaForm() },
      { c: "g-amber", icon: "in", b: "Registrar entrada no estoque", s: "Chegou material", fn: () => movForm("entrada") },
      { c: "g-pink", icon: "out", b: "Registrar saída do estoque", s: "Saiu sem ser por envio", fn: () => saidaForm() },
      { c: "g-slate", icon: "box", b: "Kits de brindes", s: "Combinações que se repetem", fn: kitsDrawer },
    ].filter(x => !t || norm(x.b).includes(t)));
    if (t) {
      add("Brindes", S.itens.filter(i => !i.arquivado && norm(i.nome + " " + i.codigo).includes(t)).slice(0, 6).map(i => ({ c: "g-amber", icon: "box", b: i.nome, s: `${i.codigo || ""} · ${i.categoria || ""}`, fn: () => { go("estoque"); histDrawer(i.id); } })));
      add("Envios", S.envios.filter(e => norm([e.destinatario, e.cidade, e.uf, ...codigosDe(e)].join(" ")).includes(t)).slice(0, 6).map(e => ({ c: "g-teal", icon: "truck", b: e.destinatario, s: `${[e.cidade, e.uf].filter(Boolean).join("/")} · ${ST_ENVIO[e.status]} · ${fmtD(e.criadoEm)}`, fn: () => go("envios", { envQ: e.destinatario, envStatus: "todos", envUF: "", envRep: "" }) })));
      add("Representantes", S.representantes.filter(r => norm([r.nome, r.cidade, r.uf].join(" ")).includes(t)).slice(0, 5).map(r => ({ c: "g-green", icon: "reps", b: r.nome, s: [r.cidade, r.uf].filter(Boolean).join("/"), fn: () => go("envios", { envRep: r.id, envStatus: "todos", envQ: "", envUF: "" }) })));
      add("Conversas", minhasConversas().filter(c => norm(nomeConversa(c)).includes(t)).slice(0, 5).map(c => ({ c: "g-green", icon: "pedidos", b: nomeConversa(c), s: c.tipo === "direta" ? "Conversa individual" : `Grupo · ${(c.membros || []).length} pessoas`, fn: () => abrirConversa(c.id) })));
      add("Tarefas", S.pedidos.filter(p => pedVisivel(p) && norm(p.texto).includes(t)).slice(0, 5).map(p => ({ c: "g-blue", icon: "tarefa", b: p.texto.split("\n")[0].slice(0, 70), s: `${uname(p.autor)} · ${ST_PED[p.status]}`, fn: () => irParaTarefa(p.id) })));
    }
    items = res.flatMap(([, a]) => a); sel = Math.min(sel, Math.max(0, items.length - 1));
    let i = 0;
    $("#palRes").innerHTML = res.length ? res.map(([g, arr]) => `<div class="pal-grp">${g}</div>` + arr.map(x => `<button class="pal-item" role="option" data-i="${i}" aria-selected="${i++ === sel}"><span class="m-ico ${x.c}">${ic(x.icon)}</span><span><b>${esc(x.b)}</b><small>${esc(x.s)}</small></span></button>`).join("")).join("") : `<div class="pal-empty">Nada encontrado para “${esc(q.value)}”.</div>`;
    $$(".pal-item").forEach(b => b.onclick = () => pick(+b.dataset.i));
  };
  const pick = i => { const x = items[i]; if (!x) return; closePalette(); x.fn(); };
  q.oninput = () => { sel = 0; run(); };
  q.onkeydown = e => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); run(); $(".pal-item[aria-selected=true]")?.scrollIntoView({ block: "nearest" }); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); run(); $(".pal-item[aria-selected=true]")?.scrollIntoView({ block: "nearest" }); }
    if (e.key === "Enter") { e.preventDefault(); pick(sel); }
  };
  $("#palov").onclick = e => { if (e.target.id === "palov") closePalette(); };
  $("#palX").onclick = closePalette;
  run(); q.focus();
}
function closePalette() { $("#paletteRoot").innerHTML = ""; }
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if ($("#gateRoot").innerHTML) return; $("#palov") ? closePalette() : openPalette(); }
  if (e.key === "Escape") { if ($("#palov")) closePalette(); else if ($("#navov")) closeNav(); }
});

function helpDrawer() {
  const step = (t, c, icon, txt) => `<div class="li" style="align-items:flex-start;padding-inline:0"><span class="m-ico ${c}" style="width:36px;height:36px;border-radius:10px">${ic(icon)}</span><div class="grow"><div class="t" style="white-space:normal">${t}</div><div class="s" style="white-space:normal;font-size:13.5px">${txt}</div></div></div>`;
  openDrawer({
    eyebrow: "Central de Brindes", title: "Como usar", narrow: true,
    body:
      step("Tarefas", "g-blue", "tarefa", "O único lugar das tarefas. Para anotar algo seu, escreva no campo do topo, escolha o prazo (Hoje, Amanhã…) e aperte Enter. Para pedir a alguém, use Mais opções (ou Tarefa para alguém no computador). Toque no círculo para concluir; o que você fez hoje aparece no fim, em Feitas hoje.") +
      step("Kits de brindes", "g-slate", "box", "Em Envios → ⋯ → Kits de brindes, cadastre combinações que se repetem (ex.: Kit loja nova). No formulário de envio, um toque no kit preenche os itens; dois toques somam 2 kits.") +
      step("Envios", "g-teal", "truck", "Registre o envio com destino e itens. Ele começa Pendente (itens reservados), passa para Separado (saem do estoque) e termina Entregue. Cancelar devolve os itens.") +
      step("Rastreamento", "g-red", "rastreio", "Depois de separar, clique em Registrar postagem e informe o código dos Correios. Se o pedido foi em mais de uma caixa, toque no + de “Em quantas caixas foi?” e informe o código de cada caixa (dá para ler com a câmera ou colar todos de uma vez); as etiquetas saem uma por caixa. Atualize a situação (trânsito, saiu para entrega, retirada, problema, entregue) e use Avisar representante para mandar a mensagem pronta no WhatsApp, já com o link de acompanhamento (o representante vê a situação sozinho, sem login). Quando chegar, ele toca em “Recebi tudo certo” nesse link e o envio vira Entregue sozinho; se relatar um problema, aparece no Início. No envio, escolha se é para o próprio representante ou para um cliente dele: a mensagem muda de acordo.") +
      step("Estoque", "g-amber", "box", "Toque num brinde para ver o histórico e dar Entrada, Saída, Contar ou Editar. Para conferir tudo, use Contar estoque: vai item por item, você digita quanto tem na prateleira e no fim o sistema mostra só as diferenças para ajustar de uma vez (dá para parar e continuar depois). O mínimo de cada item gera o alerta.") +
      step("Representantes", "g-green", "reps", "Cadastre endereço e contato uma vez. No envio, escolher o representante preenche tudo sozinho.") +
      step("Documentos dos Correios", "g-amber", "print", "No envio, clique em Imprimir para gerar a declaração de conteúdo (2 vias) e a etiqueta de endereço. Os dados da empresa ficam em avatar → Dados do remetente.") +
      step("App e notificações", "g-green", "bell", "Avatar → Instalar o app e Ativar notificações: você recebe aviso de tarefa passada para você, de envio novo para separar, de envio pronto para postar, de brinde acabando, um resumo nos dias úteis às 8h e às 14h e (administradores) o lembrete das 11h30 para chamar o Correio, mesmo com o sistema fechado.") +
      step("Busca rápida", "g-slate", "search", "Aperte Ctrl+K em qualquer tela para achar brindes, envios, representantes e tarefas.") +
      step("Tema claro ou escuro", "g-violet", "moon", "Use o botão de sol/lua na barra de cima, ou escolha Automático em Minha conta (clique no seu avatar)."),
    foot: `<button class="btn primary" data-close>Entendi</button>`
  });
}
