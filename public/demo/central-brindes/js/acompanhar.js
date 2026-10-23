/* =========================================================
   Página pública de acompanhamento de envio (sem login).
   Endereço: /r/<código>  (ou acompanhar.html?c=<código>)
   Lê só o documento acompanhamento/<código>, que o sistema
   mantém com dados mínimos: destinatário, cidade, itens,
   situação, rastreio e datas. Nada de valores ou dados internos.
   ========================================================= */
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtD = t => t ? new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
const fmtDM = t => t ? new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "") : "";
const fmtDT = t => t ? new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  box: svg('<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/>'),
  truck: svg('<path d="M2.5 6.5h11v10h-11zM13.5 9.5h4.2l3.3 3.4v3.6h-7.5z"/><circle cx="6.5" cy="17.5" r="1.9"/><circle cx="17.3" cy="17.5" r="1.9"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  alert: svg('<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/>'),
  store: svg('<path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16v10H4zM9.5 19.5v-5h5v5"/>'),
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  copy: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>'),
  ext: svg('<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>'),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
};
const rastreioUrl = c => `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(c)}`;

function estado(d) {
  if (d.status === "cancelado") return { cls: "h-off", ico: I.x, tag: "Envio", t: "Envio cancelado", p: "Este envio foi cancelado. Em caso de dúvida, fale com o Marketing." };
  if (d.status === "entregue") return { cls: "h-ok", ico: I.check, tag: "Concluído", t: "Entregue", p: `Seu envio foi entregue${d.entregueEm ? " em " + fmtD(d.entregueEm) : ""}.` };
  if (d.status === "postado") {
    if (d.situacao === "saiu") return { cls: "h-go", ico: I.truck, tag: "Hoje", t: "Saiu para entrega", p: "Seu envio está com o carteiro e deve chegar hoje." };
    if (d.situacao === "retirada") return { cls: "h-wait", ico: I.store, tag: "Atenção", t: "Aguardando retirada", p: "Seu envio está na agência dos Correios. Retire levando um documento com foto. O endereço da agência aparece no rastreio dos Correios." };
    if (d.situacao === "problema") return { cls: "h-bad", ico: I.alert, tag: "Atenção", t: "Problema na entrega", p: "Os Correios informaram um problema na entrega. Já estamos verificando. Se o endereço mudou, avise o Marketing." };
    return { cls: "h-go", ico: I.truck, tag: "A caminho", t: "Em trânsito", p: `Seu envio foi postado${d.postadoEm ? " em " + fmtD(d.postadoEm) : ""} e está a caminho pelos Correios.` };
  }
  if (d.status === "separado") return { cls: "h-wait", ico: I.box, tag: "Preparando", t: "Separado", p: "Seus materiais já foram separados e serão postados em breve." };
  return { cls: "h-wait", ico: I.box, tag: "Recebido", t: "Pedido recebido", p: "Estamos preparando os seus materiais." };
}
const NOMES = { postado: "Postado nos Correios", transito: "Em trânsito", saiu: "Saiu para entrega", retirada: "Aguardando retirada na agência", problema: "Problema na entrega", entregue: "Entregue" };

let REF = null;
// "Recebi": quem tem o link confirma o recebimento uma única vez (as regras do banco só deixam mexer nesses campos)
function cardRecebimento(d) {
  if (d.recebidoEm) return `<section class="card rec ${d.recebidoOk === false ? "rec-prob" : "rec-ok"}"><span class="ico">${d.recebidoOk === false ? I.alert : I.check}</span><div><b>${d.recebidoOk === false ? "Recebimento confirmado, com um problema" : "Recebimento confirmado"}</b><small>${fmtDT(d.recebidoEm)}${d.recebidoObs ? ` · “${esc(d.recebidoObs)}”` : ""}</small><small>Obrigado! O Marketing já foi avisado.</small></div></section>`;
  if (d.status !== "postado" && d.status !== "entregue") return "";
  return `<section class="card rec-ask" id="recAsk"><h2>${d.paraCliente ? "O cliente já recebeu?" : "Já chegou?"}</h2>
    <p class="muted" style="margin:0 0 12px">Quando ${d.paraCliente ? "o material chegar ao cliente" : "o material chegar"}, avise o Marketing com um toque.</p>
    <div class="rec-bts"><button class="btn primary" id="recOk">${I.check}${d.paraCliente ? "Chegou tudo certo" : "Recebi tudo certo"}</button><button class="btn" id="recProb">${I.alert}Chegou, mas tem um problema</button></div>
    <div id="recProbBox" hidden><textarea class="textarea" id="recObs" rows="3" maxlength="500" placeholder="Conte o que aconteceu: faltou item, caixa danificada…"></textarea><button class="btn primary" id="recEnviar">Enviar</button></div>
    <p class="err" id="recErr" role="alert"></p></section>`;
}
function ligarRecebimento() {
  const ok = $("#recOk"); if (!ok || !REF) return;
  const enviar = async (bom, obs) => {
    $$("#recAsk button").forEach(b => b.disabled = true);
    try { await REF.update({ recebidoEm: Date.now(), recebidoOk: bom, recebidoObs: obs || "" }); fetch("/api/recebido", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: REF.id }), keepalive: true }).catch(() => { }); }
    catch (x) { $("#recErr").textContent = "Não consegui enviar agora. Verifique a internet e tente de novo."; $$("#recAsk button").forEach(b => b.disabled = false); }
  };
  ok.onclick = () => enviar(true, "");
  $("#recProb").onclick = () => { $("#recProbBox").hidden = false; $("#recObs").focus(); };
  $("#recEnviar").onclick = () => { const t = $("#recObs").value.trim(); if (!t) { $("#recErr").textContent = "Escreva o que aconteceu."; return; } enviar(false, t.slice(0, 500)); };
}
const $$ = s => [...document.querySelectorAll(s)];
function render(d) {
  const e = estado(d);
  const ordem = ["pendente", "separado", "postado", "entregue"];
  const idx = d.status === "cancelado" ? -1 : ordem.indexOf(d.status);
  const passos = [["Recebido", d.criadoEm], ["Separado", d.separadoEm], ["Postado", d.postadoEm], ["Entregue", d.entregueEm]];
  const eventos = [];
  if (d.criadoEm) eventos.push({ t: "Pedido recebido pelo Marketing", em: d.criadoEm });
  if (d.separadoEm) eventos.push({ t: "Materiais separados", em: d.separadoEm });
  (d.historico || []).forEach(h => eventos.push({ t: NOMES[h.s] || h.s, em: h.em }));
  if (d.status === "entregue" && d.entregueEm && !(d.historico || []).some(h => h.s === "entregue")) eventos.push({ t: "Entregue", em: d.entregueEm });
  eventos.sort((a, b) => b.em - a.em);
  const cods = (Array.isArray(d.rastreios) && d.rastreios.length ? d.rastreios : d.rastreio ? [d.rastreio] : []).filter(Boolean);
  $("#pubRoot").innerHTML = `
    <section class="hero-st ${e.cls}"><span class="ico">${e.ico}</span><small>${esc(e.tag)}</small><h1>${esc(e.t)}</h1><p>${esc(e.p)}</p></section>
    ${cardRecebimento(d)}
    <section class="card"><h2>Para ${esc(d.destinatario || "você")}${d.cidade ? ` · ${esc(d.cidade)}${d.uf ? "/" + esc(d.uf) : ""}` : ""}</h2>${d.paraCliente && d.repNome ? `<p class="muted" style="margin:-6px 0 10px">Cliente do representante ${esc(d.repNome)}</p>` : ""}
      ${d.status === "cancelado" ? "" : `<div class="steps">${passos.map(([l, t], i) => `<div class="s${i <= idx ? " done" : ""}${i === idx + 1 ? " now" : ""}"><span class="d">${I.check}</span><b>${l}</b><small>${i <= idx && t ? fmtDM(t) : ""}</small></div>`).join("")}</div>`}</section>
    ${cods.length ? `<section class="card">${cods.length > 1 ? `<h2>Seu envio foi em ${cods.length} caixas</h2><p class="muted" style="margin:-4px 0 10px">Cada caixa tem o seu código de rastreio${d.servico ? " (" + esc(d.servico) + ")" : ""}. Elas podem chegar em dias diferentes.</p>` : ""}${cods.map((c, k) => `<div class="trk-pub"><div class="c"><small>${cods.length > 1 ? `Caixa ${k + 1}` : `Código de rastreio${d.servico ? " · " + esc(d.servico) : ""}`}</small><b>${esc(c)}</b></div>
      <div class="btns"><button class="btn sm" data-cp="${esc(c)}">${I.copy}Copiar</button><a class="btn sm primary" href="${rastreioUrl(c)}" target="_blank" rel="noopener">${I.ext}Ver nos Correios</a></div></div>`).join("")}</section>` : ""}
    <section class="card"><h2>Itens do envio</h2><div class="items">${(d.itens || []).map(i => `<div><span>${esc(i.n)}</span><b>${Number(i.q || 0).toLocaleString("pt-BR")} un.</b></div>`).join("") || `<p class="muted">—</p>`}</div></section>
    ${eventos.length ? `<section class="card"><h2>Histórico</h2><div class="tl">${eventos.map(v => `<div class="e"><span class="dot"></span><div><b>${esc(v.t)}</b><span>${fmtDT(v.em)}</span></div></div>`).join("")}</div></section>` : ""}
    <p class="pub-foot"><span class="live"><i></i>Atualizado ${fmtDT(d.atualizadoEm || Date.now())}</span></p>`;
  ligarRecebimento();
  document.querySelectorAll("[data-cp]").forEach(cp => cp.onclick = async () => { try { await navigator.clipboard.writeText(cp.dataset.cp); cp.innerHTML = I.check + "Copiado"; } catch (x) { } });
}
function aviso(t, p, ico = I.link) {
  $("#pubRoot").innerHTML = `<div class="card msg-box"><div class="ico">${ico}</div><h2 style="margin:0">${esc(t)}</h2><p>${esc(p)}</p></div>`;
}

(function () {
  const token = (location.pathname.match(/\/r\/([A-Za-z0-9]{12,64})/) || [])[1] || new URLSearchParams(location.search).get("c");
  if (!token || !/^[A-Za-z0-9]{12,64}$/.test(token)) return aviso("Link incompleto", "Confira se o link foi copiado inteiro, do jeito que o Marketing enviou.");
  if (!window.firebase || !window.FIREBASE_CONFIG) return aviso("Página indisponível", "Tente de novo em alguns minutos.", I.alert);
  firebase.initializeApp(window.FIREBASE_CONFIG);
  const ref = REF = firebase.firestore().collection("acompanhamento").doc(token);
  const naoAchou = () => aviso("Envio não encontrado", "Este link não existe ou ainda está sendo preparado. Tente de novo em alguns instantes ou fale com o Marketing.");
  // 1) busca uma vez (rápido e funciona em qualquer rede)
  ref.get().then(s => s.exists ? render(s.data()) : naoAchou()).catch(() => aviso("Não foi possível carregar", "Verifique sua internet e tente de novo.", I.alert));
  // 2) depois fica ouvindo as atualizações em tempo real
  ref.onSnapshot(
    s => { if (!s.metadata.fromCache) s.exists ? render(s.data()) : naoAchou(); },
    () => { /* sem tempo real: a página continua com os dados da primeira busca */ }
  );
})();
