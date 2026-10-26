/* Central de Brindes · Consultas SQL (SQLite no navegador, somente leitura) */
"use strict";

/* =========================================================
   CONSULTAS SQL (SQLite no navegador, somente leitura)
   Monta um banco SQLite em memória com uma CÓPIA dos dados atuais.
   Nada do que se roda aqui altera os dados reais.
   ========================================================= */
// carrega uma biblioteca externa uma vez só, conferindo a assinatura (integrity): se o arquivo no CDN mudar, o navegador recusa
const libs = {};
function carregarLib(src, integrity, nome) {
  return libs[src] ||= new Promise((ok, erro) => {
    const sc = document.createElement("script");
    sc.src = src; sc.integrity = integrity; sc.crossOrigin = "anonymous";
    sc.onload = ok;
    sc.onerror = () => { delete libs[src]; sc.remove(); erro(new Error(`Não foi possível carregar o ${nome}. Verifique a internet.`)); };
    document.head.appendChild(sc);
  });
}
const SQLJS = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/";
let sqlLib = null;
function carregarSqlJs() {
  return sqlLib ||= carregarLib(SQLJS + "sql-wasm.js", "sha384-1fHJox8K973mCCD3PTAOc0ljrAGXD2VeK8zf+vNIdx55pWPULNlpxKMkU8bF4nUd", "SQLite")
    .then(() => initSqlJs({ locateFile: f => SQLJS + f })).catch(e => { sqlLib = null; throw e; });
}
const dtSql = t => { if (!t) return null; const d = new Date(t), z = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`; };
const TABELAS_SQL = {
  itens: "id TEXT PRIMARY KEY, codigo TEXT, nome TEXT, categoria TEXT, minimo INTEGER, valor REAL, arquivado INTEGER, criado_em TEXT",
  estoque: "item_id TEXT PRIMARY KEY, codigo TEXT, nome TEXT, categoria TEXT, em_estoque INTEGER, reservado INTEGER, disponivel INTEGER, minimo INTEGER, situacao TEXT",
  movimentos: "id TEXT PRIMARY KEY, item_id TEXT, item_nome TEXT, tipo TEXT, qtd INTEGER, obs TEXT, por TEXT, em TEXT",
  envios: "id TEXT PRIMARY KEY, codigo TEXT, destinatario TEXT, representante_id TEXT, representante TEXT, cidade TEXT, uf TEXT, cep TEXT, endereco TEXT, status TEXT, situacao TEXT, forma TEXT, servico TEXT, transportadora TEXT, rastreio TEXT, caixas INTEGER, nf TEXT, frete REAL, unidades INTEGER, criado_em TEXT, separado_em TEXT, postado_em TEXT, entregue_em TEXT, cancelado_em TEXT, dias_entrega INTEGER, criado_por TEXT, avisado_em TEXT, obs TEXT, fotos INTEGER",
  envio_itens: "envio_id TEXT, item_id TEXT, item_nome TEXT, categoria TEXT, qtd INTEGER, valor_unit REAL",
  representantes: "id TEXT PRIMARY KEY, nome TEXT, regiao TEXT, cidade TEXT, uf TEXT, cep TEXT, endereco TEXT, telefone TEXT, email TEXT, documento TEXT",
  tarefas: "id TEXT PRIMARY KEY, texto TEXT, tipo TEXT, status TEXT, autor TEXT, responsavel TEXT, prazo TEXT, atrasada INTEGER, criado_em TEXT, concluido_em TEXT, concluido_por TEXT, conversa TEXT",
  equipe: "id TEXT PRIMARY KEY, nome TEXT, usuario TEXT, email TEXT, cargo TEXT, ativo INTEGER, admin INTEGER",
};
function montarBancoSql(SQL) {
  const b = new SQL.Database();
  for (const [t, cols] of Object.entries(TABELAS_SQL)) b.run(`CREATE TABLE ${t} (${cols});`);
  const ins = (t, linhas) => {
    if (!linhas.length) return;
    const n = Object.keys(linhas[0]).length, st = b.prepare(`INSERT INTO ${t} VALUES (${Array(n).fill("?").join(",")})`);
    for (const l of linhas) st.run(Object.values(l).map(v => v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v));
    st.free();
  };
  const nome = id => id ? uname(id) : null, st = stock();
  b.run("BEGIN");
  ins("itens", S.itens.map(i => ({ id: i.id, codigo: i.codigo || null, nome: i.nome, categoria: i.categoria || null, minimo: Number(i.minimo) || 0, valor: Number(i.valor) || null, arquivado: i.arquivado ? 1 : 0, criado_em: dtSql(i.criadoEm) })));
  ins("estoque", S.itens.filter(i => !i.arquivado).map(i => { const x = st[i.id] || { fis: 0, res: 0, disp: 0 }; return { item_id: i.id, codigo: i.codigo || null, nome: i.nome, categoria: i.categoria || null, em_estoque: x.fis, reservado: x.res, disponivel: x.disp, minimo: Number(i.minimo) || 0, situacao: stockState(i, x)[1] }; }));
  ins("movimentos", S.movimentos.map(m => ({ id: m.id, item_id: m.itemId, item_nome: itemName(m.itemId), tipo: m.tipo, qtd: Number(m.qtd) || 0, obs: m.obs || null, por: nome(m.por), em: dtSql(m.em) })));
  ins("envios", S.envios.map(e => ({ id: e.id, codigo: shortId(e.id), destinatario: e.destinatario, representante_id: e.repId || null, representante: e.repId ? (repById(e.repId)?.nome || null) : null, cidade: e.cidade || null, uf: e.uf || null, cep: e.cep || null, endereco: e.endereco || null, status: e.status, situacao: e.status === "postado" ? situacaoLabel(e) : null, forma: e.forma || null, servico: e.servico || null, transportadora: e.transportadora || null, rastreio: codigosDe(e).join(" ") || null, caixas: volumesDe(e), nf: e.nf || null, frete: Number(e.frete) || null, unidades: totalUn(e), criado_em: dtSql(e.criadoEm), separado_em: dtSql(e.separadoEm), postado_em: dtSql(e.postadoEm), entregue_em: dtSql(e.entregueEm), cancelado_em: dtSql(e.canceladoEm), dias_entrega: e.postadoEm && e.entregueEm ? Math.max(0, Math.round((e.entregueEm - e.postadoEm) / 864e5)) : null, criado_por: nome(e.criadoPor), avisado_em: dtSql(e.avisadoEm), obs: e.obs || null, fotos: (e.fotos || []).length })));
  ins("envio_itens", S.envios.flatMap(e => (e.itens || []).map(l => ({ envio_id: e.id, item_id: l.itemId, item_nome: itemName(l.itemId), categoria: itemById(l.itemId)?.categoria || null, qtd: Number(l.qtd) || 0, valor_unit: Number(l.valor) || Number(itemById(l.itemId)?.valor) || null }))));
  ins("representantes", S.representantes.map(r => ({ id: r.id, nome: r.nome, regiao: r.regiao || null, cidade: r.cidade || null, uf: r.uf || null, cep: r.cep || null, endereco: r.endereco || null, telefone: r.telefone || null, email: r.email || null, documento: r.documento || null })));
  ins("tarefas", S.pedidos.filter(pedVisivel).map(t => ({ id: t.id, texto: t.texto, tipo: t.tipo || null, status: t.status, autor: nome(t.autor), responsavel: nome(t.responsavel), prazo: t.prazo || null, atrasada: isLate(t) ? 1 : 0, criado_em: dtSql(t.criadoEm), concluido_em: dtSql(t.concluidoEm), concluido_por: nome(t.concluidoPor), conversa: t.conversaId ? nomeConversa(S.conversas.find(c => c.id === t.conversaId)) || null : null })));
  ins("equipe", S.perfis.map(x => ({ id: x.id, nome: x.nome, usuario: x.usuario || null, email: x.email || null, cargo: x.cargo || null, ativo: x.ativo === false ? 0 : 1, admin: x.admin ? 1 : 0 })));
  b.run("COMMIT");
  return b;
}
const CONSULTAS = [
  ["Envios por estado", "SELECT uf, COUNT(*) AS envios, SUM(unidades) AS unidades\nFROM envios\nWHERE status <> 'cancelado'\nGROUP BY uf\nORDER BY envios DESC;"],
  ["Brindes mais enviados", "SELECT ei.item_nome, SUM(ei.qtd) AS unidades, COUNT(DISTINCT ei.envio_id) AS envios\nFROM envio_itens ei\nJOIN envios e ON e.id = ei.envio_id\nWHERE e.status <> 'cancelado'\nGROUP BY ei.item_nome\nORDER BY unidades DESC;"],
  ["Envios por mês", "SELECT strftime('%Y-%m', criado_em) AS mes, COUNT(*) AS envios, SUM(unidades) AS unidades, ROUND(SUM(COALESCE(frete, 0)), 2) AS frete\nFROM envios\nWHERE status <> 'cancelado'\nGROUP BY mes\nORDER BY mes DESC;"],
  ["Envios por representante", "SELECT COALESCE(representante, destinatario) AS representante, uf, COUNT(*) AS envios, SUM(unidades) AS unidades, MAX(criado_em) AS ultimo_envio\nFROM envios\nWHERE status <> 'cancelado'\nGROUP BY 1, 2\nORDER BY envios DESC;"],
  ["Estoque em alerta", "SELECT codigo, nome, em_estoque, reservado, disponivel, minimo, situacao\nFROM estoque\nWHERE disponivel <= minimo\nORDER BY disponivel;"],
  ["Prazo de entrega por serviço", "SELECT servico, COUNT(*) AS entregas, ROUND(AVG(dias_entrega), 1) AS media_dias, MIN(dias_entrega) AS mais_rapido, MAX(dias_entrega) AS mais_lento\nFROM envios\nWHERE dias_entrega IS NOT NULL\nGROUP BY servico;"],
  ["Envios parados (mais de 8 dias)", "SELECT codigo, destinatario, uf, rastreio, servico, postado_em,\n  CAST(julianday('now', 'localtime') - julianday(postado_em) AS INTEGER) AS dias\nFROM envios\nWHERE status = 'postado' AND julianday('now', 'localtime') - julianday(postado_em) > 8\nORDER BY dias DESC;"],
  ["Tarefas abertas por pessoa", "SELECT COALESCE(responsavel, '(sem responsável)') AS pessoa, COUNT(*) AS abertas, SUM(atrasada) AS atrasadas\nFROM tarefas\nWHERE status <> 'concluido'\nGROUP BY pessoa\nORDER BY abertas DESC;"],
  ["Consumo por categoria", "SELECT COALESCE(ei.categoria, 'Outros') AS categoria, SUM(ei.qtd) AS unidades\nFROM envio_itens ei JOIN envios e ON e.id = ei.envio_id\nWHERE e.status <> 'cancelado'\nGROUP BY 1 ORDER BY unidades DESC;"],
];
const SQLV = { texto: CONSULTAS[0][1], res: null, erro: "", ms: 0, rodando: false };
async function rodarSql() {
  const ta = $("#sqlTexto"); if (ta) SQLV.texto = ta.value;
  SQLV.rodando = true; SQLV.erro = ""; renderBody(true);
  try {
    const SQL = await carregarSqlJs(), b = montarBancoSql(SQL), t0 = performance.now();
    const out = b.exec(SQLV.texto);
    SQLV.ms = Math.round(performance.now() - t0);
    SQLV.res = out.length ? out[out.length - 1] : { columns: [], values: [] };
    b.close();
  } catch (e) { SQLV.erro = String(e?.message || e); SQLV.res = null; }
  SQLV.rodando = false; renderBody(true);
}
async function baixarSqlite() {
  try {
    const SQL = await carregarSqlJs(), b = montarBancoSql(SQL), bin = b.export(); b.close();
    const url = URL.createObjectURL(new Blob([bin], { type: "application/x-sqlite3" }));
    const a = document.createElement("a"); a.href = url; a.download = `central-brindes-${today()}.sqlite`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
    toast("Arquivo .sqlite baixado. Abra no DB Browser for SQLite.");
  } catch (e) { toast(String(e?.message || e), "err"); }
}
function exportarResultado() {
  const r = SQLV.res; if (!r || !r.values.length) return toast("Rode uma consulta com resultado antes.", "err");
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "﻿" + [r.columns, ...r.values].map(l => l.map(v => q(typeof v === "number" ? String(v).replace(".", ",") : v)).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `consulta-${today()}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast("Resultado exportado (abre no Excel)");
}
VIEWS.sql = {
  head: () => pageHead("Gestão", "Consultas SQL", "Pergunte qualquer coisa aos dados com SQL (SQLite). Roda sobre uma cópia: nada aqui altera os dados reais.",
    `<button class="btn" id="sqlDl">${ic("download")}Baixar banco .sqlite</button>`),
  bind() { $("#sqlDl").onclick = baixarSqlite; },
  body() {
    const r = SQLV.res;
    const tabela = SQLV.erro ? `<div class="banner" style="background:var(--bad-bg);color:var(--bad)">${ic("alert")}<span class="mono" style="white-space:pre-wrap">${esc(SQLV.erro)}</span></div>`
      : !r ? `<div class="card">${empty("db", "Escolha uma consulta pronta ou escreva a sua", "Depois clique em Executar (ou Ctrl+Enter).")}</div>`
      : !r.columns.length ? `<div class="card">${empty("check", "Comando executado", "Não houve linhas de resultado.")}</div>`
      : `<div class="card"><div class="card-h"><div><h2>Resultado</h2><div class="sub">${fmtN(r.values.length)} ${r.values.length === 1 ? "linha" : "linhas"} · ${SQLV.ms} ms${r.values.length > 1000 ? " · mostrando as primeiras 1.000" : ""}</div></div><button class="btn sm" id="sqlCsv">${ic("download")}Exportar para Excel</button></div>
          <div class="tblwrap sql-res"><table class="tbl sql-tbl"><thead><tr>${r.columns.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${r.values.slice(0, 1000).map(l => `<tr>${l.map(v => `<td class="${typeof v === "number" ? "r num" : ""}">${v === null ? '<span class="muted">NULL</span>' : esc(typeof v === "number" && !Number.isInteger(v) ? v.toLocaleString("pt-BR") : v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
    return `<div class="sql-app"><div class="sql-main">
      <section class="card sql-ed"><div class="card-h"><h2>Consulta</h2><div class="btns"><span class="hint muted hide-sm" style="font-size:12px">Ctrl+Enter executa</span><button class="btn primary" id="sqlRun"${SQLV.rodando ? " disabled" : ""}>${ic("arrow")}${SQLV.rodando ? "Executando…" : "Executar"}</button></div></div>
        <textarea id="sqlTexto" class="sql-txt" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea></section>
      <div class="sql-out">${tabela}</div></div>
      <aside class="sql-side">
        <section class="card"><div class="card-h"><h2>Consultas prontas</h2></div><div class="list">${CONSULTAS.map((c, i) => `<button class="li li-btn" data-q="${i}"><span class="t" style="white-space:normal;font-size:13.5px">${esc(c[0])}</span>${ic("chev", "i-sm muted")}</button>`).join("")}</div></section>
        <section class="card"><div class="card-h"><h2>Tabelas</h2></div><div class="sql-schema">${Object.entries(TABELAS_SQL).map(([t, cols]) => `<details><summary><b class="mono">${t}</b></summary><div class="cols">${cols.split(",").map(x => `<button class="code" data-ins="${esc(x.trim().split(" ")[0])}">${esc(x.trim().split(" ")[0])}</button>`).join("")}</div></details>`).join("")}</div></section>
      </aside>
    </div>`;
  },
  after() {
    const ta = $("#sqlTexto"); if (!ta) return;
    ta.value = SQLV.texto;
    ta.oninput = () => SQLV.texto = ta.value;
    ta.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); rodarSql(); } if (e.key === "Tab") { e.preventDefault(); const p = ta.selectionStart; ta.setRangeText("  ", p, ta.selectionEnd, "end"); SQLV.texto = ta.value; } };
    $("#sqlRun").onclick = rodarSql;
    const c = $("#sqlCsv"); if (c) c.onclick = exportarResultado;
    $$("[data-q]").forEach(b => b.onclick = () => { SQLV.texto = CONSULTAS[+b.dataset.q][1]; ta.value = SQLV.texto; rodarSql(); });
    $$("[data-ins]").forEach(b => b.onclick = () => { const p = ta.selectionStart; ta.setRangeText(b.dataset.ins, p, ta.selectionEnd, "end"); SQLV.texto = ta.value; ta.focus(); });
  }
};
