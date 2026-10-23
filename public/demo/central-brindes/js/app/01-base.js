/* Central de Brindes · Utilidades, ícones, estado, cálculos de estoque, pessoas, gravação e tema */
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtN = n => Number(n || 0).toLocaleString("pt-BR");
const fmtD = t => t ? new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "";
const fmtDM = t => t ? new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "") : "";
const fmtDT = t => t ? new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
const fmtH = t => new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fmtPrazo = s => { if (!s) return ""; const [, m, d] = s.split("-"); return `${d}/${m}`; };
const diaISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => diaISO(new Date());
const emDias = n => { const d = new Date(); d.setDate(d.getDate() + n); return diaISO(d); };
const shortId = id => "#" + String(id).slice(-5).toUpperCase();
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function ago(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 7) { const d = Math.floor(s / 86400); return d === 1 ? "ontem" : `há ${d} dias`; }
  return fmtD(t);
}

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
const FORMAS = ["Correios", "Transportadora", "Motoboy", "Retirada em mãos", "Junto com pedido de venda"];
const ST_ENVIO = { pendente: "Pendente", separado: "Separado", postado: "Postado", entregue: "Entregue", cancelado: "Cancelado" };
const SITUACOES = {
  transito: { l: "Em trânsito", c: "st-transito", d: "Seguindo para a cidade de destino" },
  saiu: { l: "Saiu para entrega", c: "st-transito", d: "Com o carteiro, deve chegar hoje" },
  retirada: { l: "Aguardando retirada", c: "st-pendente", d: "Na agência dos Correios esperando o destinatário" },
  problema: { l: "Problema na entrega", c: "st-atrasado", d: "Endereço não encontrado, ausente, devolvido…" },
};
const SERVICOS = ["PAC", "SEDEX", "SEDEX 10", "Carta registrada", "Impresso", "Mini Envios"];
const DIAS_ALERTA = 8;
const rastreioUrl = c => `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(c)}`;
const codigoOk = c => /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(c);
/* Caixas (volumes) de um envio: cada caixa tem o seu código de rastreio nos Correios.
   e.volumes = quantas caixas; e.rastreios = códigos na ordem das caixas; e.rastreio = o da 1ª caixa
   (mantido para os envios antigos e para quem só tem um código). */
// representante já recebeu a mensagem desta etapa (aviso dado antes da postagem não vale para o rastreio)
const avisado = e => !!e.avisadoEm && (!e.postadoEm || e.avisadoEm >= e.postadoEm);
const codigosDe = e => { const l = (Array.isArray(e?.rastreios) ? e.rastreios : []).map(c => String(c || "").trim()).filter(Boolean); return l.length ? l : e?.rastreio ? [e.rastreio] : []; };
const MAX_CAIXAS = 30;
const celular = () => matchMedia("(max-width:720px)").matches;
const volumesDe = e => Math.max(1, Math.min(MAX_CAIXAS, Number(e?.volumes) || 1), codigosDe(e).length);
const codigosDoTexto = t => [...new Set((String(t || "").toUpperCase().match(/[A-Z]{2}\d{9}[A-Z]{2}/g) || []))];
const txtCaixas = n => n === 1 ? "1 caixa" : `${n} caixas`;
const diasDesde = t => Math.max(0, Math.floor((Date.now() - t) / 864e5));
const atrasado = e => e.status === "postado" && e.postadoEm && diasDesde(e.postadoEm) >= DIAS_ALERTA && e.situacao !== "retirada";
const precisaAtencao = e => e.status === "postado" && (e.situacao === "problema" || e.situacao === "retirada" || atrasado(e));
const situacaoLabel = e => e.status === "postado" ? (SITUACOES[e.situacao] || SITUACOES.transito).l : ST_ENVIO[e.status];
const situacaoCls = e => e.status === "postado" ? (SITUACOES[e.situacao] || SITUACOES.transito).c : "st-" + e.status;
const fmtMoeda = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const frase = s => { s = String(s || "").toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };
// como cumprimentar alguém pelo nome: pula iniciais ("J.", "M&J"), números e códigos; sem um nome de verdade, fica sem nome
function primeiroNome(n) {
  const ws = String(n || "").trim().split(/[\s,;]+/).filter(Boolean);
  const bom = ws.find(w => /^[A-Za-zÀ-ÿ'-]{3,}$/.test(w) && !/^(LTDA|EIRELI|ME|EPP|CIA|REPRESENTA[CÇ][OÕ]ES|REPRESENTANTE|COMERCIO|COMÉRCIO)$/i.test(w));
  return bom ? nomeProprio(bom) : "";
}
// "LOJA DO PINTOR LTDA" → "Loja do Pintor Ltda"
const nomeProprio = s => String(s || "").toLowerCase().replace(/(^|[\s/-])(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/ (Da|De|Do|Das|Dos|E)(?= )/g, w => w.toLowerCase());
/* Para quem é o envio: o próprio representante ou um cliente dele (o nome do cliente fica em "destinatario").
   Envios antigos sem a marcação: é para cliente quando o destinatário não é o representante. */
const paraClienteDe = e => { if (!e?.repId) return false; if (e.paraCliente != null) return !!e.paraCliente; const r = repById(e.repId); return !!r && norm(r.nome) !== norm(e.destinatario); };
const dataInput = t => { const d = t ? new Date(t) : new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const lerData = v => { if (!v) return Date.now(); if (v === today()) return Date.now(); const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d, 12).getTime(); };
const ST_PED = { aberto: "Aberta", andamento: "Em andamento", concluido: "Concluída" };
const CORES = ["#D61C38", "#F58140", "#D99A00", "#1F8A4C", "#0E7C86", "#1D5FC4", "#6B3FA0", "#B83280", "#6B4F3A", "#3B4452"];

/* ---------- ícones ---------- */
const P = {
  painel: '<rect x="3" y="3" width="7.5" height="9" rx="2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2"/><rect x="3" y="15" width="7.5" height="6" rx="2"/>',
  pedidos: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" stroke-linejoin="round"/><path d="M8.5 8h7M8.5 11.5h4.5"/>',
  envios: '<path d="M2.5 6.5h11v10h-11zM13.5 9.5h4.2l3.3 3.4v3.6h-7.5z" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="1.9"/><circle cx="17.3" cy="17.5" r="1.9"/>',
  estoque: '<path d="M3.5 7.8 12 3.2l8.5 4.6v8.4L12 20.8l-8.5-4.6z" stroke-linejoin="round"/><path d="m3.5 7.8 8.5 4.6 8.5-4.6M12 12.4v8.4"/>',
  reps: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.4"/>',
  equipe: '<circle cx="9" cy="8" r="3.3"/><path d="M3 20c.6-3.6 3-5.6 6-5.6s5.4 2 6 5.6"/><path d="M15.5 4.9a3.3 3.3 0 0 1 0 6.3M17.6 14.7c1.8.7 3 2.4 3.4 5.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.9-4 3.8-6.2 7.5-6.2s6.6 2.2 7.5 6.2"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" stroke-linejoin="round"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  reply: '<path d="M9.5 7 4.5 12l5 5"/><path d="M4.5 12h9a6 6 0 0 1 6 6v1"/>',
  hand: '<path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4a1.5 1.5 0 0 1 3 0v6m0-.5V6a1.5 1.5 0 0 1 3 0v8.5a6.5 6.5 0 0 1-6.5 6.5h-.8a6 6 0 0 1-4.7-2.3L3.4 14.6a1.6 1.6 0 0 1 2.4-2.1L8 14.5"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  box: '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z" stroke-linejoin="round"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/>',
  out: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 14v4.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V14"/>',
  in: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 14v4.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V14"/>',
  list: '<path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11"/><circle cx="4.5" cy="6.5" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="17.5" r=".8"/>',
  count: '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 8.5h8M8 12.5h8M8 16.5h4"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" stroke-linejoin="round"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  truck: '<path d="M2.5 6.5h11v10h-11zM13.5 9.5h4.2l3.3 3.4v3.6h-7.5z" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="1.9"/><circle cx="17.3" cy="17.5" r="1.9"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4z" stroke-linejoin="round"/><path d="M12 10v4.5M12 17.2v.1"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5V6z" stroke-linejoin="round"/><path d="m9 12 2 2 4-4"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  chev: '<path d="m9.5 6 6 6-6 6"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14.5h10V21H7z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" stroke-linejoin="round"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  install: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M12 7.5v7M9 11.5l3 3 3-3"/>',
  db: '<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
  tarefa: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="m8.5 12.3 2.4 2.4 4.8-5"/>',
  back: '<path d="M15 5.5 8.5 12l6.5 6.5"/>',
  send: '<path d="M4.5 12 20 4.5 16.5 20l-4.2-6.3z" stroke-linejoin="round"/><path d="m12.3 13.7 7.7-9.2"/>',
  grupo: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.8 14.3c2.3.2 4 1.8 4.7 4.7"/>',
  newchat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h7M20 11v2.5a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" stroke-linejoin="round"/><path d="M18 2.5v6M15 5.5h6"/>',
  rastreio: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.8"/>',
  whats: '<g transform="translate(2.6 2.6) scale(.783)"><path fill="currentColor" stroke="none" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></g>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
  ext: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" stroke-linejoin="round"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/>',
  device: '<rect x="2.5" y="4.5" width="13" height="10" rx="1.5"/><path d="M6 18.5h6M9 14.5v4"/><rect x="17" y="8" width="4.5" height="11" rx="1.2"/>',
  camera: '<path d="M3.5 8.5A2 2 0 0 1 5.5 6.5h2.2l1.6-2.2h5.4l1.6 2.2h2.2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.6"/>',
  clip: '<path d="m20 11.5-7.8 7.8a5 5 0 0 1-7-7l8.3-8.4a3.3 3.3 0 0 1 4.7 4.7l-8.3 8.3a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6"/>',
  filter: '<path d="M4 5.5h16l-6.2 7.3v5.7l-3.6 1.8v-7.5z" stroke-linejoin="round"/>',
  dots: '<circle cx="5.5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18.5" cy="12" r="1.4" fill="currentColor"/>',
  grade: '<circle cx="5.5" cy="5.5" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="5.5" r="1.7" fill="currentColor" stroke="none"/><circle cx="18.5" cy="5.5" r="1.7" fill="currentColor" stroke="none"/><circle cx="5.5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="5.5" cy="18.5" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="1.7" fill="currentColor" stroke="none"/><circle cx="18.5" cy="18.5" r="1.7" fill="currentColor" stroke="none"/>',
  lado: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><path d="M9.5 4.5v15"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2v.1"/>',
};
const ic = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${P[n] || ""}</svg>`;

/* ---------- estado ---------- */
const COLS = ["itens", "movimentos", "envios", "representantes", "pedidos", "perfis", "conversas", "kits"];
const S = Object.fromEntries(COLS.map(k => [k, []]));
const loaded = {};
let db = null, myId = null, readOnly = false, noDb = false;
let tab = "painel";
try { const h = location.hash.slice(1); if (h) tab = h; } catch (e) {}
const F = { envStatus: "ativos", envQ: "", envUF: "", envRep: "", envAviso: "", envVista: (() => { try { return localStorage.getItem("cb-vista") || "lista"; } catch (x) { return "lista"; } })(), estQ: "", estCat: "", estBaixo: false, estVista: (() => { try { return localStorage.getItem("cb-est-vista") || "vitrine"; } catch (x) { return "vitrine"; } })(), repQ: "", pedF: "meus", pedPessoa: "" };

const TABS = [
  { k: "painel", l: "Início", g: "Geral", c: "g-slate", icon: "painel" },
  { k: "pedidos", l: "Tarefas", g: "Operação", c: "g-blue", icon: "tarefa" },
  { k: "envios", l: "Envios", g: "Operação", c: "g-teal", icon: "envios" },
  { k: "rastreio", l: "Rastreamento", g: "Operação", c: "g-red", icon: "rastreio" },
  { k: "estoque", l: "Estoque de brindes", g: "Cadastros", c: "g-amber", icon: "estoque" },
  { k: "reps", l: "Representantes", g: "Cadastros", c: "g-pink", icon: "reps" },
  { k: "equipe", l: "Equipe", g: "Cadastros", c: "g-violet", icon: "equipe" },
  { k: "sql", l: "Consultas SQL", g: "Gestão", c: "g-slate", icon: "db", admin: true },
];
const tabInfo = k => TABS.find(t => t.k === k);
const VERSAO = "v5.10";

/* ---------- cálculos ---------- */
// a conta do estoque é feita uma vez e reaproveitada até os dados mudarem (cada tela chama várias vezes)
let stockMemo = null;
function stock() {
  const k = [S.itens, S.movimentos, S.envios, S.itens.length, S.movimentos.length, S.envios.length];
  if (stockMemo && stockMemo.k.every((x, i) => x === k[i])) return stockMemo.st;
  const st = calcStock(); stockMemo = { k, st };
  queueMicrotask(() => { stockMemo = null; });   // mudanças feitas direto nos envios (sem trocar a lista) entram na próxima atualização
  return st;
}
function calcStock() {
  const st = {};
  for (const it of S.itens) st[it.id] = { fis: 0, res: 0 };
  for (const m of S.movimentos) (st[m.itemId] ||= { fis: 0, res: 0 }).fis += Number(m.qtd) || 0;
  for (const e of S.envios) {
    if (e.status === "cancelado") continue;
    for (const l of e.itens || []) {
      const s = (st[l.itemId] ||= { fis: 0, res: 0 });
      if (e.status === "pendente") s.res += Number(l.qtd) || 0; else s.fis -= Number(l.qtd) || 0;
    }
  }
  for (const k in st) st[k].disp = st[k].fis - st[k].res;
  return st;
}
// busca de item pelo código com índice (as listas chamam isso para cada linha)
let itemIdx = null;
const itemById = id => {
  if (!itemIdx || itemIdx.l !== S.itens || itemIdx.n !== S.itens.length) {
    itemIdx = { l: S.itens, n: S.itens.length, m: new Map() };
    for (const i of S.itens) if (!itemIdx.m.has(i.id)) itemIdx.m.set(i.id, i);
  }
  return itemIdx.m.get(id);
};
// nome da peça sem o tamanho que a importação da contagem põe no fim ("CAMISETA LOGO · G" → "CAMISETA LOGO")
// aceita "· G", "- G", "TAMANHO G", "TAM. G", "(G)" ou só " G" no fim; com o tamanho do item, tira exatamente ele
const nomeBase = (n, tam) => {
  let s = String(n || "").trim();
  const t = String(tam || "").trim();
  const sep = "\\s*(?:[·\\-–/]|\\(|tamanho|tam\\.?)?\\s*";
  if (t) s = s.replace(new RegExp("\\s" + sep + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\)?$", "i"), "");
  return s.replace(/\s*(?:[·\-–/]|\(|tamanho|tam\.?)\s*(?:PP|P|M|G|GG|XG|XGG|EXG|EG|\d{1,2})\)?$/i, "").trim() || String(n || "");
};
const repById = id => S.representantes.find(r => r.id === id);
const itemName = id => itemById(id)?.nome || "Item removido";
// cor fixa para um nome (categoria, representante): sempre a mesma cor para o mesmo nome
const CORES_SUAVES = ["#3B82F6", "#14B8A6", "#F59E0B", "#8B5CF6", "#EC4899", "#22A05B", "#0EA5E9", "#F97316"];
const corDe = s => CORES_SUAVES[[...norm(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % CORES_SUAVES.length];
// brinde que vem em fardo (cartelas): o estoque fica em UNIDADES; onde a pessoa digita, digita fardos e o sistema multiplica
const porFardo = it => Number(it?.porFardo) > 1 ? Number(it.porFardo) : 0;
const txtFardos = (it, n) => { const p = porFardo(it); if (!p) return ""; const f = n / p; return `${Number.isInteger(f) ? fmtN(f) : f.toFixed(1).replace(".", ",")} ${Math.abs(f) === 1 ? "fardo" : "fardos"}`; };
const totalUn = e => (e.itens || []).reduce((a, l) => a + Number(l.qtd || 0), 0);
function stockState(it, s) {
  if (!s || s.disp <= 0) return ["zero", "Sem estoque"];
  if (s.disp <= (Number(it.minimo) || 0)) return ["baixo", "Baixo"];
  return ["ok", "Normal"];
}
const pedVisivel = p => !Array.isArray(p.membros) || p.membros.includes(myId);
const pedAbertos = () => S.pedidos.filter(p => p.status !== "concluido" && pedVisivel(p));
const isLate = p => p.prazo && p.status !== "concluido" && p.prazo < today();
const ativos = () => S.envios.filter(e => e.status === "pendente" || e.status === "separado" || e.status === "postado");

/* ---------- pessoas ---------- */
const perfil = id => S.perfis.find(p => p.id === id);
function uname(id) {
  if (!id) return "—";
  const pf = perfil(id); if (pf?.nome) return pf.nome;
  return id === myId ? "Você" : "Alguém";
}
// (27) 99999-0000; se não parecer telefone brasileiro, mostra como foi digitado
const fmtTel = t => { const d = String(t || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, ""); return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : String(t || ""); };
const firstName = id => uname(id).split(" ")[0];
const ucor = id => perfil(id)?.cor || "#A39B9D";
function initials(n) { const w = String(n || "?").trim().split(/\s+/).filter(Boolean); return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); }
function paintAv(el, id) { el.textContent = initials(uname(id)); el.style.background = ucor(id); el.title = uname(id); }
function applyPeople(root) {
  $$("[data-uid]", root).forEach(e => { e.textContent = uname(e.dataset.uid); });
  $$("[data-av]", root).forEach(e => paintAv(e, e.dataset.av));
}
const hydrate = (root = document) => applyPeople(root);
const who = id => `<span data-uid="${esc(id || "")}">${esc(uname(id))}</span>`;
const avatar = (id, size = "") => `<span class="av ${size}" data-av="${esc(id || "")}" aria-hidden="true">${esc(initials(uname(id)))}</span>`;
function memberIds() {
  const s = new Set(S.perfis.filter(p => p.ativo !== false).map(p => p.id));
  if (myId) s.add(myId);
  return [...s].sort((a, b) => uname(a).localeCompare(uname(b)));
}
function memberOptions(sel, emptyLabel = "Sem responsável") {
  const ids = memberIds(); if (sel && !ids.includes(sel)) ids.push(sel);
  return `<option value="">${emptyLabel}</option>` + ids.map(id => `<option value="${esc(id)}"${id === sel ? " selected" : ""}>${esc(uname(id))}${id === myId ? " (você)" : ""}</option>`).join("");
}

/* ---------- gravação ---------- */
function toast(msg, kind, acao) {
  const t = document.createElement("div");
  t.className = "toast " + (kind || ""); t.setAttribute("role", "status");
  t.innerHTML = ic(kind === "err" ? "alert" : "check") + "<span></span>";
  t.lastChild.textContent = msg;
  if (acao) { const b = document.createElement("button"); b.className = "toast-btn"; b.textContent = acao.l; b.onclick = () => { t.remove(); acao.fn(); }; t.appendChild(b); }
  $("#toastRoot").appendChild(t);
  setTimeout(() => t.remove(), acao ? 7000 : kind === "err" ? 6000 : 2800);
}
function errMsg(e) {
  const c = String(e && e.code || "");
  if (/permission-denied|invalid_argument/.test(c)) return "Sem permissão para salvar. Seu acesso pode ter sido desativado: saia e entre de novo.";
  if (/quota|resource-exhausted|resource_exhausted/.test(c)) return "O limite gratuito do banco de dados foi atingido hoje. Tente amanhã ou fale com o administrador.";
  if (/not-found/.test(c)) return "Esse registro não existe mais. Atualize a página.";
  return "Sem conexão com o banco de dados agora. Tente de novo em instantes.";
}
async function save(fn, okMsg) {
  if (!db || !myId) { toast("Entre no sistema para salvar.", "err"); return false; }
  if (readOnly === true) { toast(errMsg({ code: "invalid_argument" }), "err"); return false; }
  const estoqueAntes = alertasEstoque();
  try { await fn(); }
  catch (e) {
    if (e?.code === "unavailable") {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
      try { await fn(); } catch (e2) { toast(errMsg(e2), "err"); return false; }
    } else {
      if (e?.code === "invalid_argument" && readOnly === null) { readOnly = true; setBanner(); }
      toast(errMsg(e), "err"); return false;
    }
  }
  if (okMsg) toast(okMsg);
  avisarEstoque(estoqueAntes);
  return true;
}
const col = n => db.collection(n);
// brinde que acabou de entrar em alerta (baixo ou zerado) por causa desta gravação → notificação no celular da equipe
const NIVEL_ESTOQUE = { ok: 0, baixo: 1, zero: 2 };
function alertasEstoque() {
  if (!loaded.itens || !loaded.movimentos || !loaded.envios || !S.itens.length) return null;
  const st = stock(), m = {};
  for (const i of S.itens) if (!i.arquivado) m[i.id] = { estado: stockState(i, st[i.id])[0], disp: st[i.id]?.disp ?? 0 };
  return m;
}
function avisarEstoque(antes) {
  if (!antes) return;
  const depois = alertasEstoque(); if (!depois) return;
  const novos = Object.entries(depois).filter(([id, d]) => antes[id] && NIVEL_ESTOQUE[d.estado] > NIVEL_ESTOQUE[antes[id].estado]).map(([id, d]) => ({ id, estado: d.estado, disp: Math.max(0, Math.round(d.disp)) }));
  if (novos.length) notificar({ tipo: "estoque", itens: novos.slice(0, 20) });
}

/* ---------- tema (claro / escuro / automático) ---------- */
const ROOT = document.documentElement;
const hostTheme = ROOT.getAttribute("data-theme");
const TEMAS = { auto: "Automático", light: "Claro", dark: "Escuro" };
// visual sóbrio (v5): o claro volta a ser o padrão; na primeira abertura depois da mudança
// todo mundo começa no claro, e quem preferir o escuro troca no botão de tema (fica guardado)
try { if (!localStorage.getItem("cb-tema-v5")) { localStorage.setItem("cb-tema-v5", "1"); localStorage.setItem("cb-tema", "light"); } } catch (e) {}
function temaSalvo() { try { return localStorage.getItem("cb-tema") || "light"; } catch (e) { return "light"; } }
function temaEfetivo() { const a = ROOT.getAttribute("data-theme"); if (a === "light" || a === "dark") return a; return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
function aplicarTema(t) {
  if (t === "light" || t === "dark") ROOT.setAttribute("data-theme", t);
  else if (hostTheme) ROOT.setAttribute("data-theme", hostTheme); else ROOT.removeAttribute("data-theme");
  try { localStorage.setItem("cb-tema", t); } catch (e) {}
  ROOT.classList.toggle("esc", temaEfetivo() === "dark");   // "esc" = tela escura de fato (escolhido ou automático com o aparelho no escuro)
  const b = $("#themeBtn"); if (b) { const ef = temaEfetivo(); b.innerHTML = ic(ef === "dark" ? "sun" : "moon"); b.title = ef === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"; b.setAttribute("aria-label", b.title); }
}
function alternarTema() { const novo = temaEfetivo() === "dark" ? "light" : "dark"; aplicarTema(novo); toast(`Tema ${TEMAS[novo].toLowerCase()} ativado`); }
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (temaSalvo() === "auto") aplicarTema("auto"); }); } catch (e) {}
ROOT.classList.toggle("esc", temaEfetivo() === "dark");
