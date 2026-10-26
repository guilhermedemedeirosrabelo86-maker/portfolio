/* Central de Brindes · Link de acompanhamento, postagem, situação, WhatsApp, formulário de envio e planilha */
"use strict";

/* ---------- página pública de acompanhamento ---------- */
const PUB_URL = t => new URL(`acompanhar.html?c=${t}`, location.href).href;   // DEMO: página pública dentro da demo
function gerarToken() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return [...crypto.getRandomValues(new Uint32Array(24))].map(x => a[x % a.length]).join("");
}
function pubPayload(e) {
  return {
    destinatario: e.destinatario || "", cidade: e.cidade || "", uf: e.uf || "", paraCliente: paraClienteDe(e), repNome: e.repId ? (repById(e.repId)?.nome || "") : "",
    itens: (e.itens || []).map(l => ({ n: frase(itemName(l.itemId)), q: Number(l.qtd) || 0 })),
    status: e.status || "pendente", situacao: e.situacao || null, rastreio: codigosDe(e)[0] || null, rastreios: codigosDe(e), volumes: volumesDe(e), servico: e.servico || null,
    criadoEm: e.criadoEm || null, separadoEm: e.separadoEm || null, postadoEm: e.postadoEm || null, entregueEm: e.entregueEm || null,
    historico: (e.historico || []).map(h => ({ s: h.s, em: h.em })),
  };
}
/* ---------- confirmação de recebimento feita pelo representante na página pública ----------
   A página grava recebidoEm/recebidoOk/recebidoObs em acompanhamento/<código>; o sistema copia para o envio
   e, se ainda não estava entregue, marca como entregue. */
let RECEB = [];
const recebendo = new Set();
function aplicarRecebimentos() {
  if (!myId || !db || !loaded.envios) return;
  for (const r of RECEB) {
    const e = S.envios.find(x => x.token === r.id);
    if (!e || e.recebidoEm || recebendo.has(e.id) || e.status === "cancelado") continue;
    recebendo.add(e.id);
    const em = Number(r.recebidoEm) || Date.now(), ok = r.recebidoOk !== false, obs = String(r.recebidoObs || "").slice(0, 500);
    const quem = e.repId ? (repById(e.repId)?.nome || "Representante") : e.destinatario;
    const upd = { recebidoEm: em, recebidoOk: ok, recebidoObs: obs };
    if (e.status !== "entregue") Object.assign(upd, { status: "entregue", entregueEm: em, entreguePor: null, historico: [...(e.historico || []), { s: "entregue", em, por: null, nota: ok ? "Recebimento confirmado pelo representante" : `Recebido com problema: ${obs}` }] });
    col("envios").doc(e.id).update(upd)
      .then(() => { toast(ok ? `${firstWord(quem)} confirmou que recebeu o envio para ${nomeProprio(e.destinatario)}` : `${firstWord(quem)} recebeu o envio para ${nomeProprio(e.destinatario)}, mas relatou um problema`, ok ? "" : "err"); if (upd.status === "entregue") concluirPedidoDoEnvio(e, Date.now()); })
      .catch(() => { })
      .finally(() => recebendo.delete(e.id));
  }
}
const firstWord = s => String(s || "").trim().split(/\s+/)[0];
function hashStr(t) { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
const pubSyncing = new Set();
let pubTimer = 0;
function agendarSyncPublico() { clearTimeout(pubTimer); pubTimer = setTimeout(syncPublicos, 400); }
async function syncPublicos() {
  if (!myId || !db || !loaded.envios || !loaded.itens) return;
  for (const e of S.envios) {
    if (!e.token || pubSyncing.has(e.id)) continue;
    const payload = pubPayload(e), h = hashStr(JSON.stringify(payload));
    if (e.pubHash === h) continue;
    pubSyncing.add(e.id);
    try {
      await db.collection("acompanhamento").doc(e.token).set({ ...payload, atualizadoEm: Date.now() }, { merge: true });
      await col("envios").doc(e.id).update({ pubHash: h });
    } catch (x) { /* tenta de novo na próxima mudança */ }
    finally { pubSyncing.delete(e.id); }
  }
}
// cria o código do link na hora (sem esperar o banco), para o WhatsApp abrir ainda dentro do toque
function tokenDe(e) {
  if (e.token) return e.token;
  const t = e.token = gerarToken(), payload = pubPayload(e);
  col("envios").doc(e.id).update({ token: t })
    .then(() => db.collection("acompanhamento").doc(t).set({ ...payload, atualizadoEm: Date.now() }, { merge: true }))
    .then(() => col("envios").doc(e.id).update({ pubHash: hashStr(JSON.stringify(payload)) }))
    .catch(() => { });
  return t;
}
async function garantirToken(e) { return tokenDe(e); }
async function copiarLink(e) {
  try { const t = await garantirToken(e); await copiar(PUB_URL(t), "Link de acompanhamento copiado"); }
  catch (x) { toast(errMsg(x), "err"); }
}
async function copiar(txt, ok) {
  try { await navigator.clipboard.writeText(txt); toast(ok || "Copiado"); }
  catch (e) { toast("Não consegui copiar. Selecione e use Ctrl+C.", "err"); }
}
function concluirPedidoDoEnvio(e, now) {
  if (!e.pedidoId) return null;
  const p = S.pedidos.find(x => x.id === e.pedidoId);
  return p && p.status !== "concluido" ? col("pedidos").doc(p.id).update({ status: "concluido", concluidoEm: now, concluidoPor: myId }) : null;
}
function postagemDrawer(e) {
  const d = e || {};
  // uma linha de código por caixa; o número de caixas pode mudar aqui mesmo
  let cods = codigosDe(d).slice(), n = volumesDe(d);
  const linha = k => `<div class="pg-cx"><span class="pg-n">Caixa ${k + 1}</span><span class="inp-btn"><input class="input mono" data-cod="${k}" value="${esc(cods[k] || "")}" placeholder="Ex.: AB123456789BR" autocapitalize="characters" spellcheck="false" aria-label="Código de rastreio da caixa ${k + 1}"><button type="button" class="btn" data-ler="${k}" title="Ler o código de barras com a câmera">${ic("camera")}Ler</button></span><small class="pg-aviso" data-av="${k}"></small></div>`;
  openDrawer({
    eyebrow: `Envio ${shortId(e.id)} · ${e.destinatario}`, title: e.status === "postado" ? "Editar postagem" : "Registrar postagem", narrow: true,
    body: `<div class="field"><span>Em quantas caixas foi?</span><div class="pg-qtd"><button type="button" class="btn icon" id="pgMenos" aria-label="Uma caixa a menos">−</button><b class="num" id="pgN">${n}</b><button type="button" class="btn icon" id="pgMais" aria-label="Uma caixa a mais">+</button><small class="muted">Cada caixa tem o seu código nos Correios.</small></div></div>
      <div class="field"><span id="pgTit">${n > 1 ? "Códigos de rastreio" : "Código de rastreio"}</span><div class="pg-cods" id="pgCods"></div><small id="pgHint">13 caracteres: 2 letras, 9 números e 2 letras (termina em BR).</small></div>
      <div class="row2"><label class="field"><span>Serviço</span><select class="select" id="pgServ">${SERVICOS.map(x => `<option${x === (d.servico || "PAC") ? " selected" : ""}>${x}</option>`).join("")}</select></label>
      <label class="field"><span>Data da postagem</span><input class="input" type="date" id="pgData" value="${dataInput(d.postadoEm)}" max="${today()}"></label></div>
      <label class="field"><span id="pgFreteL">Valor do frete${n > 1 ? " (todas as caixas)" : ""} (opcional)</span><input class="input num" id="pgFrete" inputmode="decimal" placeholder="0,00" value="${d.frete ? String(d.frete).replace(".", ",") : ""}"><small>Entra no painel de rastreamento como gasto com frete.</small></label>
      <div class="err" id="pgErr" role="alert"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="pgOk">${ic("check")}${e.status === "postado" ? "Salvar" : "Registrar postagem"}</button>`,
    onMount(ov) {
      const guardar = () => $$("[data-cod]", ov).forEach(i => cods[+i.dataset.cod] = i.value);
      const conferir = i => {
        i.value = i.value.toUpperCase().replace(/\s+/g, "");
        const av = $(`[data-av="${i.dataset.cod}"]`, ov), v = i.value, k = +i.dataset.cod;
        const repetido = v && $$("[data-cod]", ov).some(x => x !== i && x.value === v);
        av.textContent = repetido ? "Esse código já foi usado em outra caixa." : v && !codigoOk(v) ? "Não parece um código dos Correios. Confira; se estiver certo, pode salvar assim." : "";
        av.style.color = repetido ? "var(--bad)" : "var(--pend)";
        cods[k] = v;
      };
      const desenhar = (ler = true) => {
        if (ler) guardar();
        $("#pgCods").innerHTML = Array.from({ length: n }, (_, k) => linha(k)).join("");
        $("#pgN").textContent = n; $("#pgTit").textContent = n > 1 ? "Códigos de rastreio" : "Código de rastreio";
        $("#pgFreteL").textContent = `Valor do frete${n > 1 ? " (todas as caixas)" : ""} (opcional)`;
        $$("[data-cod]", ov).forEach(i => { i.oninput = () => conferir(i); conferir(i); });
        $$("[data-ler]", ov).forEach(b => b.onclick = async ev => {
          ev.preventDefault();
          const v = await lerCodigoBarras(); if (!v) return;
          const i = $(`[data-cod="${b.dataset.ler}"]`, ov); i.value = v; conferir(i); toast("Código lido: " + v);
          const prox = $$("[data-cod]", ov).find(x => !x.value); if (prox) prox.focus();
        });
        $("#pgMenos").disabled = n <= 1; $("#pgMais").disabled = n >= MAX_CAIXAS;
      };
      // colar vários códigos de uma vez no primeiro campo distribui um por caixa
      ov.addEventListener("paste", ev => {
        const i = ev.target.closest?.("[data-cod]"); if (!i) return;
        const l = codigosDoTexto(ev.clipboardData?.getData("text")); if (l.length < 2) return;
        ev.preventDefault(); guardar();
        const k0 = +i.dataset.cod; l.forEach((c, j) => cods[k0 + j] = c); n = Math.min(MAX_CAIXAS, Math.max(n, k0 + l.length)); desenhar(false);
      });
      $("#pgMenos").onclick = () => { if (n > 1) { guardar(); n--; desenhar(); } };
      $("#pgMais").onclick = () => { if (n < MAX_CAIXAS) { guardar(); n++; desenhar(); $(`[data-cod="${n - 1}"]`, ov)?.focus(); } };
      desenhar();
      $("#pgOk").onclick = async () => {
        guardar();
        const lista = cods.slice(0, n).map(c => String(c || "").trim().toUpperCase()), err = $("#pgErr");
        const falta = lista.findIndex(c => !c);
        if (falta >= 0) { err.textContent = n > 1 ? `Falta o código da caixa ${falta + 1}.` : "Informe o código de rastreio."; $(`[data-cod="${falta}"]`, ov).focus(); return; }
        if (new Set(lista).size !== lista.length) { err.textContent = "Tem código repetido em duas caixas. Confira."; return; }
        const frete = parseFloat(($("#pgFrete").value || "").replace(/\./g, "").replace(",", ".")) || 0;
        const postadoEm = lerData($("#pgData").value), servico = $("#pgServ").value;
        const upd = { rastreio: lista[0], rastreios: lista, volumes: n, servico, frete, postadoEm, forma: e.forma || "Correios" };
        const primeira = e.status !== "postado";
        if (primeira) Object.assign(upd, { status: "postado", postadoPor: myId, situacao: "transito", situacaoEm: postadoEm, historico: [...(e.historico || []), { s: "postado", em: postadoEm, por: myId }] });
        $("#pgOk").disabled = true;
        if (await save(() => col("envios").doc(e.id).update(upd), primeira ? (n > 1 ? `Postagem registrada: ${txtCaixas(n)}` : "Postagem registrada") : "Postagem atualizada")) {
          closeDrawer();
          if (primeira) setTimeout(() => avisarDrawer({ ...e, ...upd }), 250);
        } else $("#pgOk").disabled = false;
      };
    }
  });
}
/* ---------- editor de caixas: número de caixas (− +) e um campo de código para cada caixa ----------
   Usado no formulário de envio e em "Caixas e códigos". Colar vários códigos no 1º campo distribui um por caixa. */
const caixasEditorHTML = (titulo, dica) => `<div class="field cx-ed"><span>${titulo}</span><div class="pg-qtd"><button type="button" class="btn icon" data-cxmenos aria-label="Uma caixa a menos">−</button><b class="num" data-cxn></b><button type="button" class="btn icon" data-cxmais aria-label="Uma caixa a mais">+</button></div>
  <div class="pg-cods" data-cxcods></div>${dica ? `<small class="muted">${dica}</small>` : ""}</div>`;
function caixasEditor(raiz, n, cods, placeholder = "Opcional") {
  const st = { n: Math.max(1, n), cods: cods.slice() }, box = $("[data-cxcods]", raiz);
  const guardar = () => $$("[data-evcod]", raiz).forEach(i => st.cods[+i.dataset.evcod] = i.value.trim().toUpperCase().replace(/\s+/g, ""));
  const desenhar = () => {
    box.innerHTML = Array.from({ length: st.n }, (_, k) => `<div class="pg-cx cx-card"><span class="pg-n">${ic("box", "i-sm")}Caixa ${k + 1}</span><span class="inp-btn"><input class="input mono" data-evcod="${k}" value="${esc(st.cods[k] || "")}" placeholder="${esc(placeholder)}" autocapitalize="characters" spellcheck="false" aria-label="Código de rastreio da caixa ${k + 1}"><button type="button" class="btn" data-evler="${k}" title="Ler o código de barras com a câmera">${ic("camera")}Ler</button></span><small class="pg-aviso" data-evav="${k}"></small></div>`).join("");
    $("[data-cxn]", raiz).textContent = st.n; $("[data-cxmenos]", raiz).disabled = st.n <= 1; $("[data-cxmais]", raiz).disabled = st.n >= MAX_CAIXAS;
    $$("[data-evcod]", raiz).forEach(i => i.oninput = () => { i.value = i.value.toUpperCase().replace(/\s+/g, ""); const v = i.value, av = $(`[data-evav="${i.dataset.evcod}"]`, raiz), rep = v && $$("[data-evcod]", raiz).some(x => x !== i && x.value === v); av.textContent = rep ? "Esse código já foi usado em outra caixa." : v && !codigoOk(v) ? "Não parece um código dos Correios. Confira." : ""; av.style.color = rep ? "var(--bad)" : "var(--pend)"; });
    $$("[data-evler]", raiz).forEach(b => b.onclick = async () => { const v = await lerCodigoBarras(); if (!v) return; const i = $(`[data-evcod="${b.dataset.evler}"]`, raiz); i.value = v; i.oninput(); toast("Código lido: " + v); });
  };
  $("[data-cxmenos]", raiz).onclick = () => { guardar(); if (st.n > 1) st.n--; desenhar(); };
  $("[data-cxmais]", raiz).onclick = () => { guardar(); if (st.n < MAX_CAIXAS) st.n++; desenhar(); $(`[data-evcod="${st.n - 1}"]`, raiz)?.focus(); };
  raiz.addEventListener("paste", ev => {
    const i = ev.target.closest?.("[data-evcod]"); if (!i) return;
    const l = codigosDoTexto(ev.clipboardData?.getData("text")); if (l.length < 2) return;
    ev.preventDefault(); guardar(); const k0 = +i.dataset.evcod; l.forEach((c, j) => st.cods[k0 + j] = c); st.n = Math.min(MAX_CAIXAS, Math.max(st.n, k0 + l.length)); desenhar();
  });
  desenhar();
  return { n: () => st.n, codigos: () => { guardar(); return st.cods.slice(0, st.n).filter(Boolean); } };
}
// caixas e códigos a qualquer momento (antes ou depois de postar), sem mudar a etapa do envio
function caixasDrawer(e) {
  const postado = e.status === "postado" || e.status === "entregue";
  openDrawer({
    eyebrow: `Envio ${shortId(e.id)} · ${e.destinatario}`, title: "Caixas e códigos de rastreio", narrow: true,
    body: `<div id="cxEd">${caixasEditorHTML("Em quantas caixas vai (ou foi)?", postado ? "Cada caixa tem o seu código nos Correios." : "Pode deixar o código em branco e preencher depois, quando postar.")}</div><div class="err" id="cxErr" role="alert"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="cxOk">${ic("check")}Salvar</button>`,
    onMount(ov) {
      const ed = caixasEditor($("#cxEd", ov), volumesDe(e), codigosDe(e), postado ? "Ex.: AB123456789BR" : "Opcional");
      $("#cxOk").onclick = async () => {
        const lista = ed.codigos(), n = ed.n(), err = $("#cxErr");
        if (new Set(lista).size !== lista.length) { err.textContent = "Tem código repetido em duas caixas. Confira."; return; }
        if (postado && !lista.length) { err.textContent = "Informe pelo menos o código da caixa 1."; return; }
        $("#cxOk").disabled = true;
        if (await save(() => col("envios").doc(e.id).update({ volumes: n, rastreios: lista, rastreio: lista[0] || "" }), `Salvo: ${txtCaixas(n)}`)) closeDrawer(); else $("#cxOk").disabled = false;
      };
    }
  });
}
// campo de rastreio do formulário: aceita um ou vários códigos (um por caixa)
function rastreiosDoCampo(txt, d) {
  const v = String(txt || "").trim().toUpperCase(), l = codigosDoTexto(v), cods = l.length ? l : v ? [v] : [];
  return { rastreio: cods[0] || "", rastreios: cods, ...(cods.length > 1 ? { volumes: Math.max(cods.length, Number(d?.volumes) || 1) } : {}) };
}
function situacaoDrawer(e) {
  let sel = e.situacao || "transito";
  const opts = [...Object.entries(SITUACOES).map(([k, v]) => [k, v.l, v.d]), ["entregue", "Entregue", "Chegou ao destinatário"]];
  const hist = [...(e.historico || [])].reverse();
  const nomeSit = k => k === "postado" ? "Postado" : k === "entregue" ? "Entregue" : (SITUACOES[k] || {}).l || k;
  openDrawer({
    eyebrow: `${codigosDe(e)[0] || shortId(e.id)}${codigosDe(e).length > 1 ? ` +${codigosDe(e).length - 1}` : ""} · ${e.destinatario}`, title: "Atualizar situação", narrow: true,
    body: `<div class="btns" style="flex-wrap:wrap">${codigosDe(e).length > 1 ? codigosDe(e).map((c, k) => `<a class="btn sm" href="${rastreioUrl(c)}" target="_blank" rel="noopener">${ic("ext")}Caixa ${k + 1}</a>`).join("") : `<a class="btn" href="${rastreioUrl(codigosDe(e)[0] || "")}" target="_blank" rel="noopener">${ic("ext")}Consultar nos Correios</a>`}</div>
      ${codigosDe(e).length > 1 ? `<small class="muted" style="margin-top:-8px">A situação vale para o envio todo. Se uma caixa chegou e a outra não, deixe a situação da que falta e anote na observação.</small>` : ""}
      <div class="opt-cards" role="radiogroup" aria-label="Situação">${opts.map(([k, l, d]) => `<button type="button" class="opt" role="radio" data-sit="${k}" aria-checked="${k === sel}"><b>${l}</b><small>${d}</small></button>`).join("")}</div>
      <div class="row2" id="stDataRow" ${sel === "entregue" ? "" : "hidden"}><label class="field"><span>Data da entrega</span><input class="input" type="date" id="stData" value="${today()}" max="${today()}"></label></div>
      <label class="field"><span>Observação (opcional)</span><input class="input" id="stNota" placeholder="Ex.: saiu da unidade de Curitiba, destinatário ausente…"></label>
      ${hist.length ? `<div class="section-t">Histórico</div><div class="hist">${hist.map(h => `<div class="li">${avatar(h.por, "sm")}<div class="grow"><div class="t">${esc(nomeSit(h.s))}</div><div class="s">${fmtDT(h.em)} · ${who(h.por)}${h.nota ? " · " + esc(h.nota) : ""}</div></div></div>`).join("")}</div>` : ""}`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="stOk">${ic("check")}Salvar situação</button>`,
    onMount(ov) {
      $$("[data-sit]", ov).forEach(b => b.onclick = () => { sel = b.dataset.sit; $$("[data-sit]", ov).forEach(x => x.setAttribute("aria-checked", x.dataset.sit === sel)); $("#stDataRow").hidden = sel !== "entregue"; });
      $("#stOk").onclick = async () => {
        const nota = $("#stNota").value.trim(), now = Date.now();
        const em = sel === "entregue" ? lerData($("#stData").value) : now;
        const historico = [...(e.historico || []), { s: sel, em, por: myId, ...(nota ? { nota } : {}) }];
        const upd = sel === "entregue" ? { status: "entregue", entregueEm: em, entreguePor: myId, historico } : { situacao: sel, situacaoEm: now, historico };
        $("#stOk").disabled = true;
        const ok = await save(async () => { await col("envios").doc(e.id).update(upd); if (sel === "entregue") await concluirPedidoDoEnvio(e, now); }, sel === "entregue" ? "Entrega confirmada" : `Situação: ${SITUACOES[sel].l}`);
        if (ok) { closeDrawer(); if (sel !== "transito") setTimeout(() => avisarDrawer({ ...e, ...upd }), 250); } else $("#stOk").disabled = false;
      };
    }
  });
}
/* Mensagem do WhatsApp para o representante: curta e direta, começando com "Olá, segue…".
   O nome só entra se estiver preenchido em "Como chamar no WhatsApp" (o sistema não tenta adivinhar
   pelo cadastro, que muitas vezes é nome de empresa). Depois: itens, rastreio e o link. */
function mensagemRep(e, modo) {
  const rep = e.repId ? repById(e.repId) : null, cli = paraClienteDe(e), nCli = nomeProprio(e.destinatario);
  const nome = rep?.apelido?.trim() || "";
  const num = e.pedidoVenda ? ` ${e.pedidoVenda}` : "";
  const ped = cli ? `do pedido${num} do seu cliente ${nCli}` : `do seu pedido${num}`;
  const ola = t => `Olá${nome ? ", " + nome : ""}, segue ${t}`;
  const ls = (e.itens || []).map(l => `${fmtN(l.qtd)}x ${frase(itemName(l.itemId))}`);
  const itens = ls.length ? (ls.length <= 3 ? `Itens: ${ls.join(", ")}` : `Itens:\n${ls.map(x => "• " + x).join("\n")}`) : "";
  const cods = codigosDe(e);
  const rast = cods.length > 1 ? `Rastreio (${cods.length} caixas):\n${cods.map((c, k) => `Caixa ${k + 1}: ${c}`).join("\n")}` : cods.length ? `Rastreio: ${cods[0]}` : "";
  const link = e.token ? `Acompanhe: ${PUB_URL(e.token)}` : "";
  const botao = cli ? "Chegou tudo certo" : "Recebi tudo certo";
  const recebi = e.token && !e.recebidoEm ? `Quando chegar, toque em "${botao}" no link.` : "";
  const serv = e.servico ? ` (${e.servico})` : "";
  const em = t => t ? ` em ${fmtD(t)}` : "";
  const msg = (...partes) => partes.filter(Boolean).join("\n\n");
  const junto = (...l) => l.filter(Boolean).join("\n");
  if (modo === "chegou") return msg(ola(`o rastreio ${ped}, postado${em(e.postadoEm)}. Já chegou${cli ? " para ele" : ""}?`), rast, e.token ? `Se chegou, toque em "${botao}": ${PUB_URL(e.token)}` : "");
  if ((e.status === "pendente" || e.status === "separado") && cods.length) return msg(ola(`o rastreio ${ped}. Já está separado e vai pelos Correios${serv}.`), itens, rast, link);
  if (e.status === "pendente" || e.status === "separado") return msg(ola(`a atualização ${ped}: está sendo separado.`), itens, "Aviso quando for postado.", link);
  if (e.status === "entregue") return msg(ola(`a atualização ${ped}: consta como entregue${em(e.entregueEm)}. Chegou tudo certo${cli ? " para ele" : ""}?`), itens, e.token && !e.recebidoEm ? `Se chegou, toque em "${botao}": ${PUB_URL(e.token)}` : "");
  if (e.situacao === "saiu") return msg(ola(`a atualização ${ped}: saiu para entrega hoje.`), rast, link);
  if (e.situacao === "retirada") return msg(ola(`a atualização ${ped}: está aguardando retirada na agência dos Correios. ${cli ? "É preciso levar" : "Leve"} um documento com foto.`), rast, link);
  if (e.situacao === "problema") return msg(ola(`a atualização ${ped}: os Correios informaram um problema na entrega. O endereço está certo?`), e.endereco ? `${e.endereco}${e.cidade ? ", " + e.cidade + "/" + (e.uf || "") : ""}${e.cep ? " · CEP " + e.cep : ""}` : "", rast);
  return msg(ola(`o rastreio ${ped}, postado nos Correios${serv}${em(e.postadoEm)}.`), itens, rast, junto(link, recebi));
}
const ehCelular = () => matchMedia("(pointer:coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
function modoWa() { try { return localStorage.getItem("cb-wa") || "app"; } catch (x) { return "app"; } }
function setModoWa(m) { try { localStorage.setItem("cb-wa", m); } catch (x) { } }
function waLink(fone, texto) {
  const t = encodeURIComponent(texto);
  if (ehCelular()) return `https://wa.me/${fone}?text=${t}`;
  if (modoWa() === "web") return `https://web.whatsapp.com/send?phone=${fone}&text=${t}`;
  return `whatsapp://send?phone=${fone}&text=${t}`;
}
function abrirWa(fone, texto) {
  const a = document.createElement("a");
  a.href = waLink(fone, texto);
  if (!a.href.startsWith("whatsapp:")) { a.target = "_blank"; a.rel = "noopener"; }
  document.body.appendChild(a); a.click(); a.remove();
}
async function avisarRapido(e) {
  const rep = e.repId ? repById(e.repId) : null;
  const fone = foneWa(rep?.telefone);
  if (!fone) return avisarDrawer(e);
  tokenDe(e);
  abrirWa(fone, mensagemRep(e));
  save(() => col("envios").doc(e.id).update({ avisadoEm: Date.now(), avisadoPor: myId }));
  toast(ehCelular() || modoWa() === "web" ? "WhatsApp aberto com a mensagem pronta" : "Abrindo o WhatsApp: é só apertar Enter para enviar");
}
/* ---------- "chegou?": postado há dias e o representante ainda não confirmou ---------- */
const diasParaPerguntar = e => /sedex/i.test(e.servico || "") ? 4 : 8;
function semConfirmacao() {
  const agora = Date.now();
  return S.envios.filter(e => !e.recebidoEm && e.repId && e.postadoEm
    && (e.status === "postado" || (e.status === "entregue" && (e.entregueEm || 0) > agora - 10 * 864e5))
    && (agora - e.postadoEm) / 864e5 >= diasParaPerguntar(e)
    && (!e.lembradoEm || e.lembradoEm < agora - 3 * 864e5))
    .sort((a, b) => a.postadoEm - b.postadoEm);
}
function perguntarChegou(e) {
  const fone = foneWa(repById(e.repId)?.telefone);
  if (!fone) return toast("Esse representante não tem telefone no cadastro. Cadastre em Representantes.", "err");
  tokenDe(e);
  abrirWa(fone, mensagemRep(e, "chegou"));
  save(() => col("envios").doc(e.id).update({ lembradoEm: Date.now() }));
}
function perguntarLote(lista) {
  if (!lista.length) return toast("Nenhum envio esperando confirmação.");
  openDrawer({
    eyebrow: "Envios", title: "Perguntar se chegou", narrow: true,
    body: `<p class="muted" style="margin:0">Postados há alguns dias e o representante ainda não confirmou. Toque em cada um: o WhatsApp abre com a pergunta pronta e o link para ele confirmar.</p>
      <div class="lines">${lista.map(e => `<div class="li av-row" style="padding:8px 0"><span class="uf">${esc(e.uf || "—")}</span><div class="grow"><div class="t">${esc(e.destinatario)}</div><div class="s">${esc(repById(e.repId)?.nome || "")} · postado ${fmtDM(e.postadoEm)} (há ${diasDesde(e.postadoEm)} dias)${e.lembradoEm ? ` · perguntado ${fmtDM(e.lembradoEm)}` : ""}</div></div><button class="btn sm wa" data-pq="${e.id}">${ic("whats")}Perguntar</button></div>`).join("")}</div>`,
    foot: `<button class="btn" data-close>Fechar</button>`,
    onMount(ov) {
      $$("[data-pq]", ov).forEach(b => b.onclick = () => { const e = S.envios.find(x => x.id === b.dataset.pq); if (!e) return; perguntarChegou(e); b.closest(".av-row").classList.add("feito"); b.innerHTML = `${ic("check")}Perguntado`; b.classList.remove("wa"); });
    }
  });
}
function foneWa(t) { let d = String(t || "").replace(/\D/g, ""); if (!d) return ""; if (d.length <= 11) d = "55" + d.replace(/^0+/, ""); return d; }
function avisarDrawer(e) {
  tokenDe(e);
  const rep = e.repId ? repById(e.repId) : null;
  openDrawer({
    eyebrow: `Envio ${shortId(e.id)} · ${situacaoLabel(e)}`, title: "Avisar representante", narrow: true,
    body: `<div class="acct"><span class="av lg" style="background:#25D366">${ic("whats")}</span><div><b>${esc(e.destinatario)}</b><small>${esc([e.cidade, e.uf].filter(Boolean).join("/"))}</small></div></div>
      <label class="field"><span>WhatsApp do representante</span><input class="input" id="avFone" inputmode="tel" value="${esc(rep?.telefone || "")}" placeholder="(48) 99999-0000"><small>${rep ? (rep.telefone ? "Puxado do cadastro do representante." : "O representante está sem telefone no cadastro: digite aqui ou deixe vazio para escolher o contato no WhatsApp.") : "Sem cadastro: digite o número ou deixe vazio para escolher o contato no WhatsApp."}</small></label>
      <label class="field"><span>Mensagem</span><textarea class="textarea" id="avMsg" rows="17"></textarea></label>`,
    foot: `${ehCelular() ? "" : `<div class="seg left" role="group" aria-label="Abrir no"><button type="button" data-wam="app" aria-pressed="${modoWa() === "app"}">Aplicativo</button><button type="button" data-wam="web" aria-pressed="${modoWa() === "web"}">Web</button></div>`}<button class="btn" id="avCopy">${ic("copy")}Copiar</button><button class="btn primary wa-btn" id="avWa">${ic("whats")}Enviar pelo WhatsApp</button>`,
    onMount() {
      $("#avMsg").value = mensagemRep(e);
      const marcar = () => save(() => col("envios").doc(e.id).update({ avisadoEm: Date.now(), avisadoPor: myId }));
      $$("[data-wam]").forEach(b => b.onclick = () => { setModoWa(b.dataset.wam); $$("[data-wam]").forEach(x => x.setAttribute("aria-pressed", x.dataset.wam === b.dataset.wam)); });
      $("#avWa").onclick = () => {
        abrirWa(foneWa($("#avFone").value), $("#avMsg").value);
        marcar(); closeDrawer();
        toast(ehCelular() || modoWa() === "web" ? "WhatsApp aberto com a mensagem pronta" : "Abrindo o WhatsApp: é só apertar Enter para enviar");
      };
      $("#avCopy").onclick = async () => { await copiar($("#avMsg").value, "Mensagem copiada"); marcar(); };
    }
  });
}
function envioForm(e, pre) {
  const editing = !!e, locked = editing && e.status !== "pendente";
  const st = stock();
  const own = {}; if (editing && e.status === "pendente") (e.itens || []).forEach(l => own[l.itemId] = (own[l.itemId] || 0) + Number(l.qtd || 0));
  const avail = id => (st[id]?.disp || 0) + (own[id] || 0);
  const itens = S.itens.filter(i => !i.arquivado).slice().sort((a, b) => a.nome.localeCompare(b.nome));
  const cats = [...new Set(itens.map(i => i.categoria || "Outros"))].sort();
  const itemOpts = sel => `<option value="">Escolha o item…</option>` + cats.map(c => `<optgroup label="${esc(c)}">${itens.filter(i => (i.categoria || "Outros") === c).map(i => `<option value="${esc(i.id)}"${i.id === sel ? " selected" : ""}>${esc(i.nome)} — ${fmtN(avail(i.id))} disp.${porFardo(i) ? ` (unidades · fardo c/ ${fmtN(porFardo(i))})` : ""}</option>`).join("")}</optgroup>`).join("");
  const lineHTML = l => `<div class="line"><select class="select" data-li aria-label="Item">${itemOpts(l.itemId)}</select><input class="input num" type="number" min="1" step="1" data-lq value="${esc(l.qtd || "")}" placeholder="Qtd" aria-label="Quantidade"><button type="button" class="btn ghost icon" data-rm aria-label="Remover item">${ic("trash")}</button></div>`;
  const lines = editing ? (e.itens || []) : [{ itemId: "", qtd: "" }];
  const reps = S.representantes.slice().sort((a, b) => a.nome.localeCompare(b.nome));
  const d = e || {};
  openDrawer({
    eyebrow: editing ? `Envio ${shortId(e.id)}` : "Envio", title: editing ? "Editar envio" : "Novo envio",
    body: `<div class="section-t">Destino</div>
      <label class="field"><span>Representante</span><select class="select" id="evRep"><option value="">Outro destinatário (digitar abaixo)</option>${reps.map(r => `<option value="${esc(r.id)}"${r.id === d.repId ? " selected" : ""}>${esc(r.nome)}${r.cidade ? " · " + esc(r.cidade) + (r.uf ? "/" + esc(r.uf) : "") : ""}</option>`).join("")}</select><small>Escolhendo um representante, os dados de entrega são preenchidos sozinhos.</small></label>
      <div class="field" id="evParaW"${d.repId ? "" : " hidden"}><span>Para quem é?</span><div class="seg para-seg" id="evPara" role="group" aria-label="Para quem é o envio"><button type="button" data-para="rep" aria-pressed="${!paraClienteDe(d)}">${ic("user", "i-sm")}Para o representante</button><button type="button" data-para="cli" aria-pressed="${paraClienteDe(d)}">${ic("equipe", "i-sm")}Para um cliente dele</button></div><small id="evParaH"></small></div>
      <label class="field"><span id="evDestL">${paraClienteDe(d) ? "Nome do cliente" : "Destinatário"}</span><input class="input" id="evDest" value="${esc(d.destinatario || "")}" placeholder="Nome de quem recebe"></label>
      <div class="row3 cep-1o"><label class="field"><span>CEP</span><input class="input" id="evCep" inputmode="numeric" placeholder="00000-000" value="${esc(d.cep || "")}"><small id="evCepHint">Preenche o endereço sozinho.</small></label>
        <label class="field"><span>Cidade</span><input class="input" id="evCid" value="${esc(d.cidade || "")}"></label>
        <label class="field"><span>UF</span><select class="select" id="evUF"><option value=""></option>${UFS.map(u => `<option${u === d.uf ? " selected" : ""}>${u}</option>`).join("")}</select></label></div>
      <label class="field"><span>Endereço</span><input class="input" id="evEnd" value="${esc(d.endereco || "")}"></label>
      <div class="section-t">Itens</div>
      ${locked ? `<div class="banner">${ic("alert")}<span>Os itens não podem mudar depois que o envio foi separado. Se precisar, cancele e registre um novo.</span></div>` : ""}
      ${!locked && S.kits.length ? `<div class="kit-bar"><span class="muted">Usar um kit:</span>${kitsOrdenados().map(k => `<button type="button" class="kit-chip" data-usekit="${esc(k.id)}" title="${esc(resumoKit(k))}">${ic("box")}${esc(k.nome)}</button>`).join("")}</div>` : ""}
      <div class="lines" id="evLines">${lines.map(lineHTML).join("")}</div>
      ${locked ? "" : `<button type="button" class="btn sm" id="evAdd" style="align-self:flex-start">${ic("plus")}Adicionar item</button>`}
      ${itens.length ? "" : `<div class="err">Nenhum item cadastrado. Cadastre os brindes em Estoque primeiro.</div>`}
      <div class="section-t">Transporte</div>
      <div id="evCx">${caixasEditorHTML("Em quantas caixas vai?", "Cada caixa leva a sua etiqueta e o seu código de rastreio. Se ainda não tem o código, deixe em branco e preencha ao postar.")}</div>
      <div class="row2"><label class="field"><span>Forma de envio</span><select class="select" id="evForma"><option value=""></option>${FORMAS.map(f => `<option${f === d.forma ? " selected" : ""}>${f}</option>`).join("")}</select></label>
        <label class="field"><span>Transportadora</span><input class="input" id="evTransp" value="${esc(d.transportadora || "")}"></label></div>
      <div class="row2"><label class="field"><span>Número do pedido</span><input class="input" id="evPed" value="${esc(d.pedidoVenda || "")}" placeholder="Opcional" autocapitalize="characters"><small>Se tiver, a mensagem do WhatsApp cita o pedido.</small></label>
        <label class="field"><span>Nota fiscal</span><input class="input" id="evNf" value="${esc(d.nf || "")}" placeholder="Opcional"></label></div>
      <label class="field"><span>Observações</span><textarea class="textarea" id="evObs" rows="3">${esc(d.obs || pre?.obs || "")}</textarea></label>
      <div class="err" id="evErr" role="alert"></div>`,
    foot: `${editing && isAdmin() ? `<button class="btn ghost danger left" id="evDel">${ic("trash")}Apagar</button>` : ""}<button class="btn" data-close>Cancelar</button><button class="btn primary" id="evOk">${ic("check")}${editing ? "Salvar alterações" : "Registrar envio"}</button>`,
    onMount(ov) {
      const del = $("#evDel"); if (del) del.onclick = () => apagarEnvioDrawer(e);
      if (locked) $$("#evLines select,#evLines input,#evLines button", ov).forEach(x => x.disabled = true);
      const bindLines = () => $$("[data-rm]", ov).forEach(b => b.onclick = () => { if ($$(".line", ov).length > 1) b.closest(".line").remove(); });
      bindLines();
      const cxEd = caixasEditor($("#evCx", ov), volumesDe(d), codigosDe(d));
      // aplica um kit: soma na linha do mesmo brinde, usa linha vazia ou cria uma nova
      $$("[data-usekit]", ov).forEach(b => b.onclick = () => {
        const k = S.kits.find(x => x.id === b.dataset.usekit); if (!k) return;
        for (const l of k.itens || []) {
          if (!itemById(l.itemId) || itemById(l.itemId).arquivado) continue;
          const linhas = $$("#evLines .line", ov), mesma = linhas.find(ln => $("[data-li]", ln).value === l.itemId), vazia = linhas.find(ln => !$("[data-li]", ln).value);
          if (mesma) { const q = $("[data-lq]", mesma); q.value = (parseInt(q.value, 10) || 0) + Number(l.qtd); }
          else if (vazia) { $("[data-li]", vazia).value = l.itemId; $("[data-lq]", vazia).value = l.qtd; }
          else { $("#evLines").insertAdjacentHTML("beforeend", lineHTML({ itemId: l.itemId, qtd: l.qtd })); bindLines(); }
        }
        b.classList.add("usado"); toast(`${k.nome} adicionado`);
      });
      const add = $("#evAdd", ov); if (add) add.onclick = () => { $("#evLines").insertAdjacentHTML("beforeend", lineHTML({ itemId: "", qtd: "" })); bindLines(); $("#evLines .line:last-child select").focus(); };
      ligarCep({ cep: "#evCep", end: "#evEnd", cid: "#evCid", uf: "#evUF", hint: "#evCepHint" });
      let paraCli = paraClienteDe(d);
      const doRep = r => { $("#evDest").value = r.nome; $("#evCid").value = r.cidade || ""; $("#evUF").value = r.uf || ""; $("#evEnd").value = r.endereco || ""; $("#evCep").value = r.cep || ""; };
      const mostraPara = () => {
        const r = repById($("#evRep").value);
        $("#evParaW").hidden = !r;
        $$("[data-para]", ov).forEach(b => b.setAttribute("aria-pressed", (b.dataset.para === "cli") === paraCli));
        $("#evDestL").textContent = r && paraCli ? "Nome do cliente" : "Destinatário";
        $("#evParaH").textContent = !r ? "" : paraCli ? `Vai para um cliente de ${r.nome.split(" ")[0]}: preencha o nome e o endereço do cliente. A mensagem do WhatsApp vai para ${r.nome.split(" ")[0]}, falando do cliente.` : `Vai para o próprio ${r.nome.split(" ")[0]}, no endereço do cadastro dele.`;
      };
      $("#evRep").onchange = ev => { const r = repById(ev.target.value); if (r && !paraCli) doRep(r); mostraPara(); };
      $$("[data-para]", ov).forEach(b => b.onclick = () => {
        const r = repById($("#evRep").value); paraCli = b.dataset.para === "cli";
        if (r && !paraCli) doRep(r);
        if (r && paraCli && norm($("#evDest").value) === norm(r.nome)) { ["#evDest", "#evCid", "#evEnd", "#evCep"].forEach(s => $(s).value = ""); $("#evUF").value = ""; $("#evDest").focus(); }
        mostraPara();
      });
      mostraPara();
      $("#evOk").onclick = async () => {
        const errEl = $("#evErr"); errEl.textContent = "";
        const dest = $("#evDest").value.trim();
        if (!dest) { errEl.textContent = "Informe o destinatário."; $("#evDest").focus(); return; }
        { const l = cxEd.codigos(); if (new Set(l).size !== l.length) { errEl.textContent = "Tem código de rastreio repetido em duas caixas. Confira."; return; } }
        let linesOut = e?.itens || [];
        if (!locked) {
          const agg = {};
          for (const ln of $$(".line", ov)) {
            const id = $("[data-li]", ln).value, q = parseInt($("[data-lq]", ln).value, 10);
            if (!id && !q) continue;
            if (!id) { errEl.textContent = "Escolha o item em todas as linhas."; return; }
            if (!(q > 0)) { errEl.textContent = `Informe a quantidade de ${itemName(id)}.`; return; }
            agg[id] = (agg[id] || 0) + q;
          }
          if (!Object.keys(agg).length) { errEl.textContent = "Adicione pelo menos um item."; return; }
          for (const id in agg) if (agg[id] > avail(id)) { errEl.textContent = `Só há ${fmtN(avail(id))} disponíveis de ${itemName(id)}. Registre uma entrada no estoque ou diminua a quantidade.`; return; }
          linesOut = Object.entries(agg).map(([itemId, qtd]) => ({ itemId, qtd }));
        }
        const body = { repId: $("#evRep").value || null, paraCliente: !!($("#evRep").value && paraCli), destinatario: dest, cidade: $("#evCid").value.trim(), uf: $("#evUF").value, cep: $("#evCep").value.trim(), endereco: $("#evEnd").value.trim(),
          itens: linesOut, forma: $("#evForma").value, transportadora: $("#evTransp").value.trim(), nf: $("#evNf").value.trim(), pedidoVenda: $("#evPed").value.trim().toUpperCase(), ...(l => ({ rastreio: l[0] || "", rastreios: l, volumes: cxEd.n() }))(cxEd.codigos()), obs: $("#evObs").value.trim() };
        $("#evOk").disabled = true;
        let ok;
        if (editing) ok = await save(() => col("envios").doc(e.id).update(body), "Envio atualizado");
        else {
          const ref = col("envios").doc();
          Object.assign(body, { status: "pendente", criadoEm: Date.now(), criadoPor: myId, pedidoId: pre?.pedidoId || null });
          ok = await save(async () => {
            await ref.set(body);
            if (pre?.pedidoId) { const p = S.pedidos.find(x => x.id === pre.pedidoId); await col("pedidos").doc(pre.pedidoId).update({ envioId: ref.id, status: "andamento", responsavel: p?.responsavel || myId }); }
          }, "Envio registrado como pendente");
          if (ok) notificar({ tipo: "envios", evento: "novo", ids: [ref.id] });
        }
        if (ok) closeDrawer(); else { const b = $("#evOk"); if (b) b.disabled = false; }
      };
    }
  });
}
async function exportCsv() {
  const list = filteredEnvios();
  if (!list.length) { toast("Nenhum envio para exportar com esses filtros.", "err"); return; }
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Código", "Registrado em", "Destinatário", "Cidade", "UF", "Endereço", "Itens", "Total de unidades", "Status", "Separado em", "Postado em", "Entregue em", "Dias até a entrega", "Forma de envio", "Serviço", "Transportadora", "Caixas", "Rastreio", "Frete (R$)", "NF", "Representante avisado em", "Registrado por", "Observações"];
  const rows = list.map(e => [shortId(e.id), fmtDT(e.criadoEm), e.destinatario, e.cidade, e.uf, e.endereco, (e.itens || []).map(l => `${l.qtd}x ${itemName(l.itemId)}`).join(" | "), totalUn(e), situacaoLabel(e), fmtD(e.separadoEm), fmtD(e.postadoEm), fmtD(e.entregueEm), e.postadoEm && e.entregueEm ? Math.max(0, Math.round((e.entregueEm - e.postadoEm) / 864e5)) : "", e.forma, e.servico, e.transportadora, volumesDe(e), codigosDe(e).join(" "), e.frete ? String(e.frete).replace(".", ",") : "", e.nf, fmtD(e.avisadoEm), uname(e.criadoPor), e.obs]);
  const csv = "﻿" + [head, ...rows].map(r => r.map(q).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `envios-brindes-${today()}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast("Planilha baixada");
}

/* ---------- importar rastreios da agência (planilha do Portal Postal) ----------
   Lê qualquer planilha (.xlsx, .xls, .csv) ou texto colado: acha os códigos de rastreio de cada linha e liga ao envio
   pelo número da nota, pelo CEP ou pelo nome do destinatário. Mostra a prévia para conferir antes de gravar a postagem. */
const SERV_TXT = [[/SEDEX\s*10/, "SEDEX 10"], [/SEDEX/, "SEDEX"], [/\bPAC\b/, "PAC"], [/MINI/, "Mini Envios"], [/CARTA|REGISTRAD/, "Carta registrada"], [/IMPRESS/, "Impresso"]];
const digitos = s => String(s ?? "").replace(/\D/g, "");
function linhasDaPlanilha(rows) {
  // cabeçalho: a primeira linha com pelo menos dois nomes de coluna conhecidos
  const cab = c => norm(c).trim();
  const h = rows.findIndex(r => r.filter(c => /^(objeto|rastreio|codigo|etiqueta|destinatario|nome|nota|nf|cep|servico|valor|data)/.test(cab(c))).length >= 2);
  const col = re => h < 0 ? -1 : rows[h].findIndex(c => re.test(cab(c)));
  const c = { serv: col(/^servico|^modalidade/), valor: col(/^(valor|preco|tarifa|total)/), data: col(/^data/), nf: col(/^(nota|nf|n\.? ?fiscal)/), cep: col(/^cep/), nome: col(/^(destinatario|nome)/) };
  const dataDe = v => {
    if (typeof v === "number" && v > 30000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 864e5)); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12).getTime(); }
    const m = String(v ?? "").match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); if (!m) return null;
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(y, +m[2] - 1, +m[1], 12).getTime();
  };
  const valorDe = v => typeof v === "number" ? v : (parseFloat(String(v ?? "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")) || 0);
  const out = [];
  for (const r of rows.slice(h + 1)) {
    const texto = r.map(x => String(x ?? "")).join(" ").toUpperCase();
    const codigos = codigosDoTexto(texto); if (!codigos.length) continue;
    const st = c.serv >= 0 ? String(r[c.serv] ?? "").toUpperCase() : texto;
    out.push({
      codigos, texto: norm(texto),
      servico: (SERV_TXT.find(([re]) => re.test(st)) || [])[1] || "",
      valor: c.valor >= 0 ? valorDe(r[c.valor]) : 0,
      data: c.data >= 0 ? dataDe(r[c.data]) : (r.map(dataDe).find(Boolean) || null),
      nf: c.nf >= 0 ? digitos(r[c.nf]).replace(/^0+/, "") : "",
      cep: c.cep >= 0 ? digitos(r[c.cep]) : (texto.match(/\b\d{5}-?\d{3}\b/) || [""])[0].replace("-", ""),
      nome: c.nome >= 0 ? String(r[c.nome] ?? "").trim() : "",
    });
  }
  return out;
}
// liga cada linha a um envio: nota fiscal > CEP + nome > nome; só envios separados ou postados ainda sem esses códigos
function ligarRastreios(linhas) {
  const ja = new Set(S.envios.flatMap(codigosDe));
  const cand = S.envios.filter(e => e.status === "separado" || e.status === "postado");
  const palavras = e => norm(e.destinatario).split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !["ltda", "eireli", "comercio", "the"].includes(w)).slice(0, 2);
  const porEnvio = new Map(), soltas = [];
  for (const l of linhas) {
    l.codigos = l.codigos.filter(c => !ja.has(c)); if (!l.codigos.length) continue;
    const nf = cand.filter(e => l.nf ? digitos(e.nf).replace(/^0+/, "") === l.nf : e.nf && new RegExp(`\\b0*${digitos(e.nf).replace(/^0+/, "")}\\b`).test(l.texto));
    const nome = cand.filter(e => { const p = palavras(e); return p.length && p.every(w => l.texto.includes(w)); });
    const cep = cand.filter(e => digitos(e.cep).length === 8 && digitos(e.cep) === l.cep);
    // empate: fica com o único ainda separado (os postados já têm código)
    const um = l => l.length === 1 ? l[0] : l.filter(x => x.status === "separado").length === 1 ? l.find(x => x.status === "separado") : null;
    const e = um(nf) || um(nome.filter(x => cep.includes(x))) || um(nome) || um(cep);
    if (!e) { soltas.push(l); continue; }
    const g = porEnvio.get(e.id) || { e, codigos: [], valor: 0, servico: "", data: null, marcado: true };
    g.codigos.push(...l.codigos); g.valor += l.valor || 0; g.servico ||= l.servico; g.data ||= l.data;
    porEnvio.set(e.id, g);
  }
  return { grupos: [...porEnvio.values()], soltas };
}
function importarRastreiosDrawer() {
  let grupos = [], soltas = [];
  const linhaG = (g, k) => `<label class="ir-l"><input type="checkbox" data-irchk="${k}"${g.marcado ? " checked" : ""}>
      <span class="grow"><b>${esc(g.e.destinatario)}</b><small>${esc([g.e.cidade, g.e.uf].filter(Boolean).join("/"))}${g.e.nf ? ` · NF ${esc(g.e.nf)}` : ""} · ${g.e.status === "separado" ? "separado" : "já postado"}</small>
      <span class="ir-cods">${g.codigos.map(c => `<code>${esc(c)}</code>`).join("")}</span></span>
      <span class="ir-info"><b>${txtCaixas(g.codigos.length + (g.e.status === "postado" ? codigosDe(g.e).length : 0))}</b><small>${esc(g.servico || g.e.servico || "PAC")}${g.valor ? ` · ${fmtMoeda(g.valor)}` : ""}</small></span></label>`;
  const opcoes = S.envios.filter(e => e.status === "separado" || e.status === "postado").sort((a, b) => a.destinatario.localeCompare(b.destinatario));
  const linhaS = (l, k) => `<div class="ir-l ir-solta"><span class="grow"><span class="ir-cods">${l.codigos.map(c => `<code>${esc(c)}</code>`).join("")}</span><small>${esc(l.nome || "Sem destinatário na linha")}${l.nf ? ` · NF ${esc(l.nf)}` : ""}</small></span>
      <select class="select" data-irsolta="${k}"><option value="">Não ligar</option>${opcoes.map(e => `<option value="${e.id}">${esc(e.destinatario)}${e.nf ? " · NF " + esc(e.nf) : ""}</option>`).join("")}</select></div>`;
  openDrawer({
    eyebrow: "Envios", title: "Importar rastreios da agência", wide: true,
    body: `<label class="drop" id="irDrop"><input type="file" id="irArq" accept=".xlsx,.xls,.csv,.txt" hidden>
        ${ic("in")}<b>Planilha da agência (Portal Postal)</b><span class="muted">Excel ou CSV · os códigos são ligados aos envios pela nota, CEP ou nome</span></label>
      <label class="field"><span>…ou cole aqui as linhas da planilha</span><textarea class="textarea" id="irTxt" rows="3" placeholder="Cole as linhas copiadas da planilha"></textarea></label>
      <div id="irStatus" class="muted" role="status"></div><div id="irLista"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="irOk" disabled>${ic("check")}Registrar postagens</button>`,
    onMount(ov) {
      const pintar = () => {
        const n = grupos.filter(g => g.marcado).length + soltas.filter(l => l.envioId).length;
        $("#irStatus", ov).textContent = grupos.length || soltas.length ? `${grupos.length} envio${grupos.length === 1 ? "" : "s"} encontrado${grupos.length === 1 ? "" : "s"}${soltas.length ? ` · ${soltas.length} linha${soltas.length > 1 ? "s" : ""} sem envio certo (escolha abaixo ou deixe de fora)` : ""}` : "";
        $("#irLista", ov).innerHTML = (grupos.length ? `<div class="card ir-card">${grupos.map(linhaG).join("")}</div>` : "") + (soltas.length ? `<h3 class="sec-t" style="margin:16px 0 8px">Sem envio certo</h3><div class="card ir-card">${soltas.map(linhaS).join("")}</div>` : "");
        $$("[data-irchk]", ov).forEach(i => i.onchange = () => { grupos[+i.dataset.irchk].marcado = i.checked; pintar(); });
        $$("[data-irsolta]", ov).forEach(s => { s.value = soltas[+s.dataset.irsolta].envioId || ""; s.onchange = () => { soltas[+s.dataset.irsolta].envioId = s.value; pintar(); }; });
        const b = $("#irOk", ov); b.disabled = !n; b.innerHTML = `${ic("check")}${n ? `Registrar ${n} postage${n > 1 ? "ns" : "m"}` : "Registrar postagens"}`;
      };
      const ler = rows => { const r = ligarRastreios(linhasDaPlanilha(rows)); grupos = r.grupos; soltas = r.soltas; if (!grupos.length && !soltas.length) $("#irStatus", ov).textContent = "Nenhum código de rastreio novo encontrado (formato AA123456789BR)."; pintar(); };
      const arquivo = async f => {
        if (!f) return; $("#irStatus", ov).textContent = "Lendo a planilha…";
        try {
          const X = await carregarXlsx(), wb = X.read(await f.arrayBuffer());
          ler(wb.SheetNames.flatMap(a => X.utils.sheet_to_json(wb.Sheets[a], { header: 1, defval: null, raw: true })));
        } catch (x) { $("#irStatus", ov).textContent = "Não consegui ler esse arquivo: " + (x?.message || x); }
      };
      $("#irArq", ov).onchange = ev => arquivo(ev.target.files[0]);
      const drop = $("#irDrop", ov);
      drop.ondragover = ev => { ev.preventDefault(); drop.classList.add("over"); };
      drop.ondragleave = () => drop.classList.remove("over");
      drop.ondrop = ev => { ev.preventDefault(); drop.classList.remove("over"); arquivo(ev.dataTransfer.files[0]); };
      $("#irTxt", ov).oninput = ev => { const t = ev.target.value.trim(); if (t) ler(t.split(/\r?\n/).map(l => l.split(/\t|;/))); };
      $("#irOk", ov).onclick = async () => {
        const lista = grupos.filter(g => g.marcado);
        for (const l of soltas.filter(x => x.envioId)) {
          const e = S.envios.find(x => x.id === l.envioId); if (!e) continue;
          const g = lista.find(x => x.e.id === e.id) || (lista.push({ e, codigos: [], valor: 0, servico: "", data: null }), lista[lista.length - 1]);
          g.codigos.push(...l.codigos); g.valor += l.valor || 0; g.servico ||= l.servico; g.data ||= l.data;
        }
        if (!lista.length) return;
        $("#irOk", ov).disabled = true;
        const agora = Date.now();
        const ok = await save(() => {
          const b = db.batch();
          for (const { e, codigos, valor, servico, data } of lista) {
            const todos = [...new Set([...(e.status === "postado" ? codigosDe(e) : []), ...codigos])];
            const postadoEm = e.postadoEm || data || agora;
            const upd = { rastreio: todos[0], rastreios: todos, volumes: Math.max(volumesDe(e), todos.length), servico: servico || e.servico || "PAC", frete: (Number(e.frete) || 0) + (valor || 0), forma: e.forma || "Correios" };
            if (e.status === "separado") Object.assign(upd, { status: "postado", postadoEm, postadoPor: myId, situacao: "transito", situacaoEm: postadoEm, historico: [...(e.historico || []), { s: "postado", em: postadoEm, por: myId }] });
            b.update(col("envios").doc(e.id), upd);
          }
          return b.commit();
        }, `${lista.length} postage${lista.length > 1 ? "ns registradas" : "m registrada"}. Falta avisar os representantes.`);
        if (ok) { closeDrawer(); F.envAviso = "falta"; if (tab === "envios") renderBody(true); }
        else $("#irOk", ov).disabled = false;
      };
    }
  });
}
