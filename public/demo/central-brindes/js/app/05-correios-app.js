/* Central de Brindes · CEP, remetente, documentos dos Correios, backup, app instalável e notificações */
"use strict";

/* =========================================================
   CEP · DOCUMENTOS DOS CORREIOS · BACKUP · APP · NOTIFICAÇÕES
   ========================================================= */
const lerValor = v => parseFloat(String(v || "").replace(/\./g, "").replace(",", ".")) || 0;
async function buscarCep(cep) {
  const d = String(cep || "").replace(/\D/g, "");
  if (d.length !== 8) return null;
  try { const r = await fetch(`https://viacep.com.br/ws/${d}/json/`); const j = await r.json(); return j && !j.erro ? j : null; } catch (e) { return null; }
}
function ligarCep(m) {
  const el = $(m.cep); if (!el) return;
  let ultimo = "";
  el.addEventListener("input", async () => {
    const d = el.value.replace(/\D/g, "").slice(0, 8);
    if (d.length < 8) { ultimo = ""; return; }
    el.value = d.replace(/(\d{5})(\d{3})/, "$1-$2");
    if (d === ultimo) return; ultimo = d;
    const h = $(m.hint); if (h) { h.textContent = "Buscando endereço…"; h.style.color = ""; }
    const j = await buscarCep(d);
    if (!j) { if (h) { h.textContent = "CEP não encontrado. Confira ou preencha o endereço à mão."; h.style.color = "var(--pend)"; } return; }
    const rua = j.logradouro || "", bairro = j.bairro || "";
    const end = $(m.end);
    if (end) { end.value = rua ? `${rua}, ${bairro ? " - " + bairro : ""}` : bairro; if (rua) { end.focus(); end.setSelectionRange(rua.length + 2, rua.length + 2); } }
    if ($(m.cid)) $(m.cid).value = j.localidade || "";
    if ($(m.uf)) $(m.uf).value = j.uf || "";
    if (h) { h.textContent = rua ? "Endereço preenchido. Complete com o número." : "Cidade preenchida. Esse CEP é geral: digite a rua e o número."; h.style.color = "var(--ok)"; }
  });
}

/* ----- remetente (dados da empresa que envia) ----- */
/* ---------- chamar o Correio para a coleta ---------- */
const CORREIO_PADRAO = "5548999420503";
// número com DDI 55: aceita "48 99942-0503" ou "55 48 99942-0503"
const foneBR = t => { const d = String(t || "").replace(/\D/g, ""); return d.length === 10 || d.length === 11 ? "55" + d : d; };
const foneCorreio = () => foneBR(REM?.correioWhats) || CORREIO_PADRAO;
const fmtFone = d => d.length >= 12 ? `(${d.slice(2, 4)}) ${d.slice(4, -4)}-${d.slice(-4)}` : d;
function chamarCorreio() {
  const seps = S.envios.filter(e => e.status === "separado"), cx = seps.reduce((a, e) => a + volumesDe(e), 0), fone = foneCorreio();
  const onde = `${REM?.nome || "Empresa Demo"}${REM?.endereco ? ` (${REM.endereco}${REM.cidade ? ", " + REM.cidade + (REM.uf ? "/" + REM.uf : "") : ""})` : ""}`;
  const texto = cx ? `Olá, segue pedido de coleta: ${txtCaixas(cx)} para retirar hoje na ${onde}.` : `Olá, segue pedido de coleta para hoje na ${onde}.`;
  openDrawer({
    eyebrow: "Correios", title: "Chamar o Correio", narrow: true,
    body: `<p class="muted" style="margin-top:0">${seps.length ? `<b>${seps.length} envio${seps.length > 1 ? "s separados" : " separado"}</b> · ${txtCaixas(cx)} esperando a coleta.` : "Nenhum envio separado esperando agora."}</p>
      <label class="field"><span>Mensagem</span><textarea class="textarea" id="ccTxt" rows="4"></textarea></label>
      <p class="muted" style="font-size:13px;margin:0">Correio: ${fmtFone(fone)}${isAdmin() ? ` · <button class="link" id="ccMudar">mudar número</button>` : ""}</p>`,
    foot: `<a class="btn" href="tel:+${fone}">${ic("phone")}Ligar</a><button class="btn primary" id="ccWa">${ic("whats")}Mandar no WhatsApp</button>`,
    onMount() {
      $("#ccTxt").value = texto;
      $("#ccWa").onclick = () => { abrirWa(fone, $("#ccTxt").value); closeDrawer(); };
      const m = $("#ccMudar"); if (m) m.onclick = () => { closeDrawer(); remetenteDrawer(); };
    }
  });
}
function remetenteDrawer(depois) {
  const r = REM || {};
  openDrawer({
    eyebrow: "Correios", title: "Dados do remetente", narrow: true,
    body: `<p class="muted">Saem na declaração de conteúdo e na etiqueta de todos os envios.</p>
      <label class="field"><span>Nome ou razão social</span><input class="input" id="rmNome" value="${esc(r.nome || "Empresa Demo")}"></label>
      <div class="row2"><label class="field"><span>CNPJ</span><input class="input" id="rmDoc" inputmode="numeric" value="${esc(r.documento || "")}"></label>
      <label class="field"><span>Telefone</span><input class="input" id="rmTel" value="${esc(r.telefone || "")}"></label></div>
      <label class="field"><span>A/C (aos cuidados de)</span><input class="input" id="rmAc" value="${esc(r.ac || "Marketing")}"></label>
      <div class="row3"><label class="field"><span>CEP</span><input class="input" id="rmCep" inputmode="numeric" value="${esc(r.cep || "")}"><small id="rmCepHint">Preenche o endereço sozinho.</small></label>
      <label class="field"><span>Cidade</span><input class="input" id="rmCid" value="${esc(r.cidade || "")}"></label>
      <label class="field"><span>UF</span><select class="select" id="rmUF"><option value=""></option>${UFS.map(u => `<option${u === r.uf ? " selected" : ""}>${u}</option>`).join("")}</select></label></div>
      <label class="field"><span>Endereço</span><input class="input" id="rmEnd" value="${esc(r.endereco || "")}"></label>
      <label class="field"><span>WhatsApp do Correio (coleta)</span><input class="input" id="rmCorreio" inputmode="tel" value="${esc(fmtFone(foneCorreio()))}"><small>Usado no botão "Chamar o Correio" e no lembrete das 11h30.</small></label>
      <div class="err" id="rmErr" role="alert"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="rmOk">${ic("check")}Salvar</button>`,
    onMount() {
      ligarCep({ cep: "#rmCep", end: "#rmEnd", cid: "#rmCid", uf: "#rmUF", hint: "#rmCepHint" });
      $("#rmOk").onclick = async () => {
        const body = { nome: $("#rmNome").value.trim(), documento: $("#rmDoc").value.trim(), telefone: $("#rmTel").value.trim(), ac: $("#rmAc").value.trim(), cep: $("#rmCep").value.trim(), cidade: $("#rmCid").value.trim(), uf: $("#rmUF").value, endereco: $("#rmEnd").value.trim(), correioWhats: foneBR($("#rmCorreio").value), atualizadoEm: Date.now() };
        if (!body.nome || !body.endereco || !body.cep) return $("#rmErr").textContent = "Preencha pelo menos nome, CEP e endereço.";
        if (await save(() => db.doc("config/remetente").set(body), "Dados do remetente salvos")) { REM = body; closeDrawer(); if (depois) setTimeout(depois, 250); }
      };
    }
  });
}

/* ----- declaração de conteúdo + etiqueta ----- */
function documentosDrawer(e) {
  if (!REM) {
    if (isAdmin()) return remetenteDrawer(() => documentosDrawer(e));
    return toast("Um administrador precisa cadastrar os dados do remetente (avatar → Dados do remetente).", "err");
  }
  const linhas = (e.itens || []).map(l => ({ id: l.itemId, n: itemName(l.itemId), q: Number(l.qtd) || 0, v: Number(l.valor) || Number(itemById(l.itemId)?.valor) || 0 }));
  openDrawer({
    eyebrow: `Envio ${shortId(e.id)} · ${e.destinatario}`, title: "Imprimir documentos", narrow: true,
    body: `<div class="banner" style="background:var(--sep-bg);color:var(--sep)">${ic("alert")}<span>A declaração de conteúdo vale para envios <b>sem nota fiscal</b>. Como o envio sai de uma empresa, confirme com o fiscal quando o brinde precisa sair com nota.</span></div>
      <label class="g-check" style="color:var(--ink-2)"><input type="checkbox" id="dcDecl" checked>Declaração de conteúdo (2 vias)</label>
      <label class="g-check" style="color:var(--ink-2)"><input type="checkbox" id="dcEtq" checked>Etiqueta de endereço (uma por caixa)</label>
      <div class="field"><span>Em quantas caixas vai?</span><div class="pg-qtd"><button type="button" class="btn icon" id="dcMenos" aria-label="Uma caixa a menos">−</button><b class="num" id="dcN">${volumesDe(e)}</b><button type="button" class="btn icon" id="dcMais" aria-label="Uma caixa a mais">+</button><small class="muted" id="dcNTxt"></small></div></div>
      <div class="section-t">Itens e valores</div>
      <div class="lines">${linhas.map((l, i) => `<div class="line" style="grid-template-columns:minmax(0,1fr) 70px 110px"><span style="font-size:13.5px;font-weight:700">${esc(frase(l.n))}</span><span class="num muted" style="text-align:right">${fmtN(l.q)} un.</span><input class="input num" data-val="${i}" inputmode="decimal" placeholder="R$ unit." value="${l.v ? String(l.v).replace(".", ",") : ""}"></div>`).join("")}</div>
      <small class="muted">Valor unitário de cada brinde (dá para salvar no cadastro do item em Estoque → Editar).</small>
      <label class="field"><span>Peso total (kg)</span><input class="input num" id="dcPeso" inputmode="decimal" placeholder="Ex.: 1,5" value="${e.peso ? String(e.peso).replace(".", ",") : ""}"></label>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="dcOk">${ic("print")}Gerar e imprimir</button>`,
    onMount(ov) {
      let n = volumesDe(e);
      const mostra = () => { $("#dcN").textContent = n; $("#dcNTxt").textContent = n > 1 ? `Sai uma etiqueta para cada caixa: "Caixa 1 de ${n}", "Caixa 2 de ${n}"…` : "Uma etiqueta."; $("#dcMenos").disabled = n <= Math.max(1, codigosDe(e).length); $("#dcMais").disabled = n >= MAX_CAIXAS; };
      $("#dcMenos").onclick = () => { n--; mostra(); }; $("#dcMais").onclick = () => { n++; mostra(); }; mostra();
      $("#dcOk").onclick = () => {
        $$("[data-val]", ov).forEach(inp => linhas[+inp.dataset.val].v = lerValor(inp.value));
        if (n !== volumesDe(e)) { e.volumes = n; col("envios").doc(e.id).update({ volumes: n }).catch(() => { }); }
        const html = docsHTML(e, linhas, lerValor($("#dcPeso").value), $("#dcDecl").checked, $("#dcEtq").checked, false, n);
        const w = window.open("", "_blank");
        if (!w) return toast("O navegador bloqueou a janela de impressão. Permita pop-ups para este site.", "err");
        w.document.open(); w.document.write(html); w.document.close();
        closeDrawer();
      };
    }
  });
}
function docsHTML(e, linhas, peso, comDecl, comEtq, soCorpo, caixas) {
  const r = REM || {}, rep = e.repId ? repById(e.repId) : null;
  const moeda = v => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tot = linhas.reduce((a, l) => a + l.q * l.v, 0), qtd = linhas.reduce((a, l) => a + l.q, 0);
  const hoje = new Date(), meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const bloco = (t, d) => `<div class="box"><div class="bt">${t}</div>
    <div class="f"><b>Nome:</b> ${esc(d.nome)}</div><div class="f"><b>Endereço:</b> ${esc(d.end)}</div>
    <div class="f2"><div><b>Cidade:</b> ${esc(d.cid)}</div><div><b>UF:</b> ${esc(d.uf)}</div><div><b>CEP:</b> ${esc(d.cep)}</div></div>
    <div class="f"><b>CPF/CNPJ:</b> ${esc(d.doc || "")}</div></div>`;
  const remD = { nome: r.nome, end: r.endereco, cid: r.cidade, uf: r.uf, cep: r.cep, doc: r.documento };
  const desD = { nome: e.destinatario, end: e.endereco || "", cid: e.cidade || "", uf: e.uf || "", cep: e.cep || "", doc: e.documento || rep?.documento || "" };
  const via = n => `<section class="decl"><h1>DECLARAÇÃO DE CONTEÚDO</h1><div class="via">${n}ª via</div>
    <div class="two">${bloco("REMETENTE", remD)}${bloco("DESTINATÁRIO", desD)}</div>
    <div class="bt full">IDENTIFICAÇÃO DOS BENS</div>
    <table><thead><tr><th style="width:36px">Item</th><th>Conteúdo</th><th style="width:70px">Quant.</th><th style="width:110px">Valor (R$)</th></tr></thead>
    <tbody>${linhas.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(frase(l.n))}</td><td class="c">${l.q}</td><td class="r">${moeda(l.q * l.v)}</td></tr>`).join("")}
    ${Array.from({ length: Math.max(0, 6 - linhas.length) }, () => `<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>`).join("")}</tbody>
    <tfoot><tr><td colspan="2" class="r"><b>Totais</b></td><td class="c"><b>${qtd}</b></td><td class="r"><b>${moeda(tot)}</b></td></tr>
    <tr><td colspan="3" class="r"><b>Peso total (kg)</b></td><td class="r"><b>${peso ? String(peso).replace(".", ",") : ""}</b></td></tr></tfoot></table>
    <div class="bt full">DECLARAÇÃO</div>
    <p class="txt">Declaro que não me enquadro no conceito de contribuinte previsto no art. 4º da Lei Complementar nº 87/1996, uma vez que não realizo, com habitualidade ou em volume que caracterize intuito comercial, operações de circulação de mercadoria, ainda que se iniciem no exterior, ou estou dispensado da emissão da nota fiscal por força da legislação tributária vigente, responsabilizando-me, nos termos da lei e a quem de direito, por informações inverídicas.</p>
    <p class="txt">Declaro ainda que não estou postando conteúdo inflamável, explosivo, causador de combustão espontânea, tóxico, corrosivo, gás ou qualquer outro conteúdo que constitua perigo, conforme o art. 13 da Lei Postal nº 6.538/78.</p>
    <div class="ass"><div>${esc(r.cidade || "____________")}, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}</div><div class="linha">Assinatura do declarante / remetente</div></div>
    <p class="obs"><b>Atenção:</b> o declarante / remetente é responsável exclusivamente pelas informações declaradas. Constitui crime contra a ordem tributária suprimir ou reduzir tributo, ou contribuição social e qualquer acessório (Lei 8.137/90, art. 1º, V).</p></section>`;
  const nCx = Math.max(1, caixas || volumesDe(e)), cods = codigosDe(e);
  const etq = k => `<section class="etq"><div class="etq-top"><span>Envio ${shortId(e.id)}</span>${cods[k] ? `<span class="mono">${esc(cods[k])}</span>` : ""}${e.servico ? `<span>${esc(e.servico)}</span>` : ""}</div>${nCx > 1 ? `<div class="etq-cx">CAIXA ${k + 1} DE ${nCx}</div>` : ""}
    <div class="etq-dest"><div class="lbl">DESTINATÁRIO</div><div class="nome">${esc(e.destinatario)}</div><div>${esc(e.endereco || "")}</div>
    <div class="cep">${esc(e.cep || "")}</div><div class="cid">${esc(e.cidade || "")}${e.uf ? " / " + esc(e.uf) : ""}</div>${rep?.telefone ? `<div>Tel.: ${esc(fmtTel(rep.telefone))}</div>` : ""}</div>
    <div class="etq-rem"><div class="lbl">REMETENTE</div><b>${esc(r.nome || "")}</b>${r.ac ? ` · A/C ${esc(r.ac)}` : ""}<br>${esc(r.endereco || "")}<br>${esc(r.cep || "")} · ${esc(r.cidade || "")}${r.uf ? "/" + esc(r.uf) : ""}${r.telefone ? " · " + esc(r.telefone) : ""}</div></section>`;
  const corpo = (comDecl ? via(1) + via(2) : "") + (comEtq ? Array.from({ length: nCx }, (_, k) => etq(k)).join("") : "");
  return soCorpo ? corpo : docsPagina(`Documentos ${shortId(e.id)} · ${esc(e.destinatario)}`, corpo);
}
function docsPagina(titulo, corpo) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title><style>
    @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:11pt/1.35 Arial,Helvetica,sans-serif;color:#000;margin:0}
    .decl{page-break-after:always;position:relative}h1{text-align:center;font-size:16pt;margin:0 0 8px;letter-spacing:.04em}
    .via{position:absolute;top:0;right:0;font-size:9pt;border:1px solid #000;padding:1px 6px}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.box{border:1.5px solid #000;padding:6px 8px}
    .bt{font-weight:700;background:#e6e6e6;border:1.5px solid #000;padding:3px 8px;margin:-6px -8px 6px;font-size:10pt}
    .bt.full{margin:10px 0 0;border-bottom:0}.f{padding:2px 0}.f2{display:grid;grid-template-columns:2fr 1fr 1.4fr;gap:6px;padding:2px 0}
    table{width:100%;border-collapse:collapse}th,td{border:1.5px solid #000;padding:3px 6px;font-size:10pt;text-align:left}
    th{background:#f2f2f2}.c{text-align:center}.r{text-align:right}.txt{border:1.5px solid #000;border-top:0;margin:0;padding:6px 8px;font-size:9.5pt;text-align:justify}
    .txt+.txt{border-top:0}.ass{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin:26px 0 8px}
    .ass .linha{border-top:1px solid #000;padding-top:3px;min-width:260px;text-align:center;font-size:9.5pt}.obs{font-size:8.5pt;margin:4px 0 0}
    .etq{width:100mm;min-height:150mm;border:2px dashed #000;padding:6mm;display:flex;flex-direction:column;gap:5mm}
    .etq-top{display:flex;justify-content:space-between;gap:8px;font-size:9pt;border-bottom:1px solid #000;padding-bottom:2mm}
    .mono{font-family:"Courier New",monospace;font-weight:700;letter-spacing:.06em}.lbl{font-size:8pt;font-weight:700;letter-spacing:.1em;margin-bottom:1mm}
    .etq-dest{font-size:12pt;flex:1}.etq-dest .nome{font-size:15pt;font-weight:700;margin-bottom:1mm}.cep{font-size:20pt;font-weight:700;letter-spacing:.06em;margin-top:2mm}.cid{font-size:13pt;font-weight:700;text-transform:uppercase}
    .etq-cx{font-size:16pt;font-weight:700;text-align:center;border:2px solid #000;padding:1.5mm;letter-spacing:.04em}
    .etq-rem{font-size:9pt;border-top:1px solid #000;padding-top:2mm}.etq:not(:last-of-type){break-after:page}
    .tip{font:13px Arial;background:#fff8e1;border:1px solid #f0c36d;padding:8px 12px;margin:0 0 12px}@media print{.tip{display:none}}
    </style></head><body><div class="tip">A janela de impressão abre sozinha. Dica: para a etiqueta, use papel de etiqueta 10×15 cm ou recorte na linha tracejada.</div>
    ${corpo}<script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`;
}

/* ----- backup ----- */
const dadosBackup = () => ({
  sistema: "Central de Brindes · Empresa Demo", versao: VERSAO, geradoEm: new Date().toISOString(), geradoPor: uname(myId),
  remetente: REM || null,
  itens: S.itens, movimentos: S.movimentos, envios: S.envios, representantes: S.representantes, pedidos: S.pedidos, kits: S.kits,
  equipe: S.perfis.map(p => ({ id: p.id, nome: p.nome, usuario: p.usuario, email: p.email, cargo: p.cargo, ativo: p.ativo, admin: p.admin })),
  obs: "As mensagens das conversas não entram no backup, por privacidade.",
});
function salvarArquivo(texto, nome) {
  const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function baixarBackup() {
  salvarArquivo(JSON.stringify(dadosBackup(), null, 2), `backup-central-brindes-${today()}.json`);
  toast(`Backup baixado: ${S.itens.length} itens, ${S.envios.length} envios, ${S.pedidos.length} tarefas`);
}

/* ----- backup automático: uma vez por semana, o sistema aberto por um administrador monta, compacta e manda
   para o servidor guardar (8 últimas cópias). Sem clique; se outro aparelho já fez nesta semana, não repete. ----- */
const BACKUP_DIAS = 7;
const b64DeBytes = buf => { const b = new Uint8Array(buf); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
const bytesDeB64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
async function apiBackups(corpo) {
  const idToken = await auth.currentUser.getIdToken();
  return fetch("/api/backups", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken, ...corpo }) });
}
async function enviarBackup() {
  const d = dadosBackup();
  const gz = await new Response(new Blob([JSON.stringify(d)]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
  const contagem = { itens: d.itens.length, movimentos: d.movimentos.length, envios: d.envios.length, representantes: d.representantes.length, pedidos: d.pedidos.length, kits: d.kits.length, equipe: d.equipe.length };
  const r = await fetch("/api/backups/guardar", { method: "POST", headers: { "content-type": "text/plain", "x-id-token": await auth.currentUser.getIdToken(), "x-contagem": JSON.stringify(contagem) }, body: b64DeBytes(gz) }).then(x => x.json());
  if (!r.ok) throw new Error(r.erro || r.motivo || "o servidor não guardou");
  try { localStorage.setItem("cb-backup-em", String(Date.now())); } catch (e) { }
  return r.id;
}
async function backupAutomatico() {
  try {
    if (!isAdmin() || !("CompressionStream" in window)) return;
    const ult = Number(localStorage.getItem("cb-backup-em") || 0); if (Date.now() - ult < BACKUP_DIAS * 864e5) return;
    const l = await apiBackups({ acao: "lista" }).then(x => x.json());
    if (!l.ok) return;
    const recente = l.lista?.[0]?.criadoEm || 0;
    if (Date.now() - recente < BACKUP_DIAS * 864e5) { try { localStorage.setItem("cb-backup-em", String(recente)); } catch (e) { } return; }
    await enviarBackup();
  } catch (x) { /* tenta de novo na próxima vez que o sistema abrir */ }
}
// confere uns 20 segundos depois que os dados carregaram (não atrapalha a abertura)
setInterval(() => { if (backupAutomatico.feito || !myId || !COLS.every(k => loaded[k])) return; backupAutomatico.feito = true; setTimeout(backupAutomatico, 20000); }, 5000);
function backupsDrawer() {
  openDrawer({
    eyebrow: "Minha conta", title: "Backups automáticos", narrow: true,
    body: `<p class="muted" style="margin-top:0">Uma vez por semana o sistema guarda sozinho uma cópia de todos os dados no servidor (brindes, movimentações, envios, representantes, tarefas, kits e equipe). Ficam as 8 últimas.</p><div id="bkLista" class="bk-lista"><p class="muted">Carregando…</p></div>`,
    foot: `<button class="btn" data-close>Fechar</button><button class="btn primary" id="bkAgora">${ic("db")}Fazer backup agora</button>`,
    onMount(ov) {
      const pintar = async () => {
        const r = await apiBackups({ acao: "lista" }).then(x => x.json()).catch(() => ({}));
        const box = $("#bkLista", ov); if (!box) return;
        if (!r.ok) { box.innerHTML = `<p class="err">${esc(r.erro || r.motivo || "Não consegui falar com o servidor.")}</p>`; return; }
        box.innerHTML = r.lista.length ? r.lista.map(v => `<div class="bk-l"><span class="grow"><b>${esc(new Date(v.criadoEm).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }))}</b>
            <small>${fmtN(v.contagem?.envios || 0)} envios · ${fmtN(v.contagem?.itens || 0)} brindes · ${fmtN(v.contagem?.movimentos || 0)} movimentações · ${esc(v.por || "")}</small></span>
            <button class="btn sm" data-bk="${esc(v.id)}">${ic("download")}Baixar</button></div>`).join("") : `<p class="muted">Nenhum backup guardado ainda.</p>`;
        $$("[data-bk]", ov).forEach(b => b.onclick = async () => {
          b.disabled = true;
          try {
            const b64 = await apiBackups({ acao: "baixar", id: b.dataset.bk }).then(x => x.text());
            const texto = await new Response(new Blob([bytesDeB64(b64)]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
            salvarArquivo(JSON.stringify(JSON.parse(texto), null, 2), `backup-central-brindes-${b.dataset.bk.slice(0, 8)}.json`);
            toast("Backup baixado");
          } catch (x) { toast("Não consegui baixar esse backup: " + (x?.message || x), "err"); }
          b.disabled = false;
        });
      };
      $("#bkAgora", ov).onclick = async ev => {
        const b = ev.currentTarget; b.disabled = true; b.textContent = "Guardando…";
        try { await enviarBackup(); toast("Backup guardado no servidor"); await pintar(); }
        catch (x) { toast("Não consegui guardar o backup: " + (x?.message || x), "err"); }
        b.disabled = false; b.innerHTML = `${ic("db")}Fazer backup agora`;
      };
      pintar();
    }
  });
}

/* ----- app instalável ----- */
let promptInstalar = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); promptInstalar = e; });
const ehIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const instalado = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
async function instalarApp() {
  if (instalado()) return toast("O app já está instalado neste aparelho");
  if (promptInstalar) { promptInstalar.prompt(); const r = await promptInstalar.userChoice.catch(() => null); promptInstalar = null; if (r?.outcome === "accepted") toast("App instalado!"); return; }
  const passos = ehIOS()
    ? ["Abra este site no <b>Safari</b>.", "Toque em <b>Compartilhar</b> (o quadrado com a seta para cima).", "Escolha <b>Adicionar à Tela de Início</b> → <b>Adicionar</b>."]
    : ["No menu do navegador (<b>⋮</b> no Chrome ou <b>…</b> no Edge), procure <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.", "Confirme. O ícone do sistema aparece junto dos seus apps."];
  openDrawer({ eyebrow: "App", title: "Instalar a Central de Brindes", narrow: true,
    body: `<p class="muted">Fica com o ícone do sistema, abre em tela cheia e recebe notificações.</p>${passos.map((t, i) => `<div class="li" style="align-items:flex-start;padding-inline:0"><span class="m-ico g-red" style="width:30px;height:30px;border-radius:9px;font-weight:800">${i + 1}</span><div class="grow"><div class="s" style="white-space:normal;font-size:14px;color:var(--ink-2)">${t}</div></div></div>`).join("")}`,
    foot: `<button class="btn primary" data-close>Entendi</button>` });
}

/* ----- notificações ----- */
const pushSuportado = () => "Notification" in window && "serviceWorker" in navigator && !!window.firebase?.messaging && !!window.FIREBASE_VAPID_KEY && !/COLE/.test(window.FIREBASE_VAPID_KEY || "");
function notifStatus() {
  if (!("Notification" in window)) return ehIOS() && !instalado() ? "Notificações (instale o app primeiro)" : "Notificações não disponíveis aqui";
  if (Notification.permission === "granted") return "Notificações ativadas neste aparelho";
  if (Notification.permission === "denied") return "Notificações bloqueadas no navegador";
  return "Ativar notificações neste aparelho";
}
async function ativarNotificacoes(manual) {
  try {
    if (!("Notification" in window)) { if (manual) { if (ehIOS() && !instalado()) instalarApp(); else toast("Este navegador não permite notificações.", "err"); } return; }
    if (!pushSuportado()) { if (manual) toast("As notificações ainda estão sendo configuradas pelo administrador.", "err"); return; }
    if (Notification.permission === "denied") { if (manual) toast("As notificações estão bloqueadas. Libere nas configurações do site no navegador.", "err"); return; }
    if (Notification.permission !== "granted") { if (!manual) return; const p = await Notification.requestPermission(); if (p !== "granted") return toast("Notificações não foram permitidas"); }
    const reg = await navigator.serviceWorker.ready;
    const token = await firebase.messaging().getToken({ vapidKey: window.FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return;
    const ref = db.doc("push/" + myId), snap = await ref.get().catch(() => null);
    const lista = [...new Set([token, ...((snap && snap.exists && snap.data().tokens) || [])])].slice(0, 6);
    await ref.set({ tokens: lista, atualizadoEm: Date.now() });
    if (manual) toast("Notificações ativadas neste aparelho");
    if (!ativarNotificacoes.ouvindo) { ativarNotificacoes.ouvindo = true; firebase.messaging().onMessage(m => { const n = m.notification || {}; if (n.title) toast(`${n.title}: ${n.body || ""}`); }); }
  } catch (x) { if (manual) toast("Não foi possível ativar as notificações: " + (x?.message || x), "err"); }
}
// manda uma notificação de teste para os aparelhos da própria pessoa (chega uns 8 segundos depois,
// dando tempo de sair do app para ver como ela aparece de verdade)
async function testarNotificacao(qual) {
  try {
    await ativarNotificacoes(false);
    toast("Saia do app agora: a notificação de teste chega em alguns segundos.");
    const idToken = await auth.currentUser.getIdToken();
    const r = await fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken, tipo: "teste", qual }), keepalive: true }).then(x => x.json());
    if (r.enviados === 0) toast("Nenhum aparelho com notificações ativadas. Toque em Ativar notificações neste aparelho.", "err");
    else if (r.ok === false) toast("As notificações ainda não estão configuradas no servidor.", "err");
  } catch (x) { toast("Não foi possível mandar o teste: " + (x?.message || x), "err"); }
}
async function notificar(dados) {
  try {
    if (!auth?.currentUser) return;
    const idToken = await auth.currentUser.getIdToken();
    fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken, ...dados }), keepalive: true }).catch(() => { });
  } catch (x) { }
}
// DEMO: sem service worker (sem notificações nem instalação)
