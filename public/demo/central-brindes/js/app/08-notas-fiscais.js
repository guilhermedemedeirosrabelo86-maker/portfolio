/* Central de Brindes · Importar notas fiscais (XML ou PDF da DANFE) */
"use strict";

/* ---------- importar notas fiscais (XML ou PDF da DANFE) ----------
   Cada nota vira um rascunho de envio: o usuário confere e confirma.
   - XML: leitura exata (padrão nacional da NF-e).
   - PDF: lê o texto da DANFE pela posição dos campos (pdf.js, sem custo).
   A chave de acesso (44 dígitos) evita importar a mesma nota duas vezes. */
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
function carregarPdfJs() {
  return carregarLib(PDFJS + "pdf.min.js", "sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e", "leitor de PDF")
    .then(() => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js"; return window.pdfjsLib; });
}
const numBR = v => parseFloat(String(v || "").replace(/\./g, "").replace(",", ".")) || 0;
const fmtCep = c => { const d = String(c || "").replace(/\D/g, ""); return d.length === 8 ? d.slice(0, 5) + "-" + d.slice(5) : d; };
const nfDaChave = ch => ch && ch.length === 44 ? String(parseInt(ch.slice(25, 34), 10)) : "";
const formaDoTransp = t => !t ? "" : /CORREIO|POSTA/i.test(t) ? "Correios" : "Transportadora";
function montarEndereco(l, n, c, b) { return [[l, n].filter(Boolean).join(", ") + (c ? " - " + c : ""), b].filter(Boolean).join(" - "); }

function lerXmlNfe(texto) {
  const doc = new DOMParser().parseFromString(texto, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("XML inválido");
  const um = (tag, raiz = doc) => { const el = raiz.getElementsByTagNameNS("*", tag)[0] || raiz.getElementsByTagName(tag)[0]; return el ? el.textContent.trim() : ""; };
  const todos = (tag, raiz = doc) => { const l = raiz.getElementsByTagNameNS("*", tag); return [...(l.length ? l : raiz.getElementsByTagName(tag))]; };
  const inf = todos("infNFe")[0];
  if (!inf) throw new Error("Este XML não é de uma nota fiscal eletrônica");
  const ide = todos("ide", inf)[0], dest = todos("dest", inf)[0], end = dest ? todos("enderDest", dest)[0] : null, transp = todos("transp", inf)[0];
  const chave = (inf.getAttribute("Id") || "").replace(/\D/g, "") || um("chNFe");
  const vol = transp ? todos("vol", transp)[0] : null;
  const cpl = um("infCpl", inf);
  return {
    chave, nf: um("nNF", ide) || nfDaChave(chave), serie: um("serie", ide), emitente: um("xNome", todos("emit", inf)[0] || inf), emissao: Date.parse(um("dhEmi", ide) || um("dEmi", ide)) || null,
    destinatario: dest ? um("xNome", dest) : "", documento: dest ? (um("CNPJ", dest) || um("CPF", dest)) : "",
    endereco: end ? montarEndereco(um("xLgr", end), um("nro", end), um("xCpl", end), um("xBairro", end)) : "",
    cep: end ? fmtCep(um("CEP", end)) : "", cidade: end ? um("xMun", end) : "", uf: end ? um("UF", end) : "",
    telefone: end ? um("fone", end) : "", email: dest ? um("email", dest) : "",
    transportadora: transp ? um("xNome", todos("transporta", transp)[0] || transp) : "",
    peso: vol ? numBR(um("pesoB", vol).replace(".", ",")) : 0, volumes: vol ? parseInt(um("qVol", vol), 10) || 0 : 0,
    pedidoVenda: (cpl.match(/Pedido\s*N[ro°º.]*\s*:?\s*([A-Z]?\d+)/i) || [])[1] || "",
    valorNf: parseFloat(um("vNF", inf)) || 0,
    itens: todos("det", inf).map(d => { const p = todos("prod", d)[0]; return { codigo: um("cProd", p).toUpperCase(), nome: um("xProd", p), qtd: parseFloat(um("qCom", p)) || 0, valor: parseFloat(um("vUnCom", p)) || 0 }; }),
  };
}

async function lerPdfDanfe(file) {
  const lib = await carregarPdfJs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const paginas = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const pg = await pdf.getPage(n), tc = await pg.getTextContent();
    const its = tc.items.filter(i => i.str && i.str.trim()).map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width || 0 }));
    // agrupa em linhas (mesma altura) e junta os pedaços da esquerda para a direita
    its.sort((a, b) => b.y - a.y || a.x - b.x);
    const linhas = [];
    for (const it of its) { const l = linhas.find(l => Math.abs(l.y - it.y) < 2.5); if (l) l.its.push(it); else linhas.push({ y: it.y, its: [it] }); }
    linhas.forEach(l => { l.its.sort((a, b) => a.x - b.x); l.t = l.its.reduce((t, it, i) => { const ant = l.its[i - 1]; return t + (ant && it.x - (ant.x + ant.w) > 1.2 && !/\s$/.test(t) ? " " : "") + it.s; }, "").replace(/\s+/g, " ").trim(); });
    paginas.push({ its, linhas });
  }
  const p1 = paginas[0], tudo = paginas.map(p => p.linhas.map(l => l.t).join("\n")).join("\n");
  const N = s => norm(s).replace(/\s+/g, " ").trim();
  // posição (y) de um título de seção na 1ª página
  const secao = re => { const l = p1.linhas.find(l => re.test(N(l.t))); return l ? l.y : null; };
  const yDest = secao(/destinatario\s*\/?\s*remetente/), yFat = secao(/^fatura|calculo do imposto/), yTransp = secao(/transportador/), yProd = secao(/dados do produto/);
  // valor que fica logo abaixo de um rótulo, dentro da faixa (entre y de cima e de baixo)
  function campo(re, topo, base) {
    const rot = p1.its.find(i => re.test(N(i.s)) && (topo == null || i.y <= topo + 1) && (base == null || i.y > base));
    if (!rot) return "";
    const mesmaLinha = p1.its.filter(i => Math.abs(i.y - rot.y) < 2.5 && i.x > rot.x + 2 && /[A-Za-z]/.test(i.s) && i.s === i.s.toUpperCase()).sort((a, b) => a.x - b.x);
    const fim = mesmaLinha.length ? mesmaLinha[0].x - 2 : Infinity;
    const abaixo = p1.its.filter(i => i.y < rot.y - 1 && i.y > rot.y - 16 && i.x >= rot.x - 6 && i.x < fim);
    if (!abaixo.length) return "";
    const yv = Math.max(...abaixo.map(i => i.y));
    return abaixo.filter(i => Math.abs(i.y - yv) < 2.5).sort((a, b) => a.x - b.x).map(i => i.s).join(" ").replace(/\s+/g, " ").trim();
  }
  // DACE (Declaração Auxiliar de Conteúdo Eletrônica, a "etiqueta" dos Correios sem nota fiscal)
  if (/declaracao auxiliar de conteudo|^dace$/m.test(N(tudo))) return lerDace(p1, paginas, tudo, campo);
  const D = re => campo(re, yDest, yFat ?? yTransp);
  const chave = ((tudo.replace(/[ .]/g, "").match(/\d{44}/) || [])[0]) || "";
  const transp = campo(/^(nome\s*\/\s*)?razao social$/, yTransp, yProd);
  const itens = [];
  paginas.forEach(p => {
    let atual = null;
    for (const l of p.linhas) {
      const m = l.t.match(/^([A-Z]{1,4}\d{2,7})\s+(.*?)\s+(\d{8})\s+(\d{2,4})\s+(\d{4})\s+([A-Za-z]{1,6})\s+([\d.]+,\d+)\s+([\d.]+,\d+)/);
      if (m) { atual = { codigo: m[1], nome: m[2].trim(), qtd: numBR(m[7]), valor: numBR(m[8]) }; itens.push(atual); continue; }
      // continuação da descrição na linha de baixo (ignora o peso "0,42 KG")
      if (atual && l.its[0] && l.its[0].x > (p.linhas.find(x => x.t.startsWith(atual.codigo))?.its[1]?.x ?? 0) - 4 && /^[A-Z][A-Z0-9 .\-\/]*$/.test(l.t) && !/^\d/.test(l.t) && l.t.length < 60) atual.nome += (/\s[A-Z]$/.test(atual.nome) ? "" : " ") + l.t;
      else atual = null;
    }
  });
  const res = {
    chave, nf: nfDaChave(chave) || (tudo.match(/N[°º.o]*\s*0*(\d{3,9})/) || [])[1] || "", serie: chave ? String(parseInt(chave.slice(22, 25), 10)) : "",
    emissao: (() => { const v = D(/data d[ae] emissao/); const m = v.match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? new Date(+m[3], m[2] - 1, +m[1], 12).getTime() : null; })(),
    destinatario: D(/^(nome\s*\/\s*)?razao social$/), documento: D(/^cnpj\s*\/\s*cpf$/).replace(/\D/g, ""),
    endereco: montarEndereco(D(/^endereco$/), "", "", D(/^bairro/)), cep: fmtCep(D(/^cep$/)), cidade: D(/^municipio$/), uf: D(/^uf$/).slice(0, 2),
    telefone: D(/^fone/), email: "", transportadora: transp, peso: numBR(campo(/^peso bruto$/)), volumes: parseInt(campo(/^quantidade$/, yTransp, yProd), 10) || 0,
    pedidoVenda: (tudo.match(/Pedido\s*N[ro°º.]*\s*:?\s*([A-Z]?\d+)/i) || [])[1] || "",
    valorNf: numBR(campo(/valor total da nota/)), itens,
  };
  if (!res.chave && !res.itens.length && !res.destinatario) throw new Error("Não encontrei os dados da nota neste PDF (ele pode ser uma imagem escaneada)");
  return res;
}

// DACE: destinatário, cidade, endereço e os itens escritos à mão ("50 x CAMISETAS = 15,00"), sem código do brinde
function lerDace(p1, paginas, tudo, campo) {
  const cidUf = campo(/^cidade-uf destinatario$/).match(/^(.*?)\s*-\s*([A-Z]{2})$/) || [];
  const itens = [];
  paginas.forEach(p => p.linhas.forEach(l => {
    const m = l.t.match(/^(\d+(?:[.,]\d+)?)\s*[xX×]\s*(.+?)(?:\s*=\s*([\d.]*,?\d+))?$/);
    if (m && /[A-Za-z]/.test(m[2]) && m[2].length < 80) { const qtd = numBR(m[1]); itens.push({ codigo: "", nome: m[2].trim(), qtd, valor: m[3] && qtd ? numBR(m[3]) / qtd : 0 }); }
  }));
  const emi = (tudo.match(/(\d{4})-(\d{2})-(\d{2})/) || []);
  const compl = campo(/^informacoes complementares$/);
  const res = {
    chave: ((tudo.replace(/[ .]/g, "").match(/\d{44}/) || [])[0]) || "", nf: "", dace: (tudo.match(/N[º°o.]\s*0*(\d{4,12})/) || [])[1] || "", serie: "",
    emissao: emi[1] ? new Date(+emi[1], emi[2] - 1, +emi[3], 12).getTime() : null,
    destinatario: campo(/^nome destinatario$/), documento: campo(/^cnpj\/cpf destinatario$/).replace(/\D/g, ""),
    endereco: [campo(/^endereco destinatario$/), compl].filter(Boolean).join(" - "), cep: fmtCep((tudo.match(/\b\d{5}-\d{3}\b/) || [""])[0]),
    cidade: (cidUf[1] || "").trim(), uf: cidUf[2] || "", telefone: "", email: "",
    transportadora: /correio/i.test(campo(/^modalidade de transporte$/) + tudo) ? "Correios" : "", peso: 0, volumes: 0, pedidoVenda: "",
    valorNf: numBR(campo(/^valor total$/) || (tudo.match(/valor total\s+([\d.]*,\d{2})/i) || [])[1]), itens, tipoDoc: "DACE",
  };
  if (!res.destinatario && !itens.length) throw new Error("Não encontrei os dados nesta DACE");
  return res;
}

async function lerNota(file) {
  const nome = file.name || "arquivo";
  if (/\.xml$/i.test(nome) || /xml/.test(file.type)) return { ...lerXmlNfe(await file.text()), origem: "XML", nomeArq: nome };
  if (/\.pdf$/i.test(nome) || file.type === "application/pdf") { const r = await lerPdfDanfe(file); return { ...r, origem: r.tipoDoc || "PDF", nomeArq: nome, pdf: file }; }
  throw new Error(`"${nome}" não é XML nem PDF`);
}

const ordTam = t => { const k = ["PP", "P", "M", "G", "GG", "XG", "XGG", "EXG"].indexOf(String(t || "").toUpperCase()); return k < 0 ? 99 : k; };
// confere cada rascunho com o estoque e os envios que já existem
function avaliarRascunhos(rs) {
  const st = stock(), usado = {};
  const porCodigo = c => S.itens.find(i => !i.tamanho && norm(i.codigo || "") === norm(c)) || S.itens.find(i => norm(i.id) === norm(c));
  // código separado por tamanho (camiseta, polo…): a nota não diz o tamanho, então pede para escolher
  const tamanhosDe = c => S.itens.filter(i => i.tamanho && !i.arquivado && norm(i.codigo || "") === norm(c));
  const tamDoNome = (nome, tams) => { const tk = String(nome || "").toUpperCase().split(/[\s\-\/()]+/); return tams.find(t => tk.includes(t.tamanho))?.tamanho; };
  // DACE não tem código: procura pelo nome já escolhido antes ou pelas palavras do nome
  const chaveNome = n => "NOME:" + norm(n).replace(/[^a-z0-9]+/g, " ").trim().toUpperCase();
  const singular = w => w.replace(/(oes|aes)$/, "ao").replace(/(es|s)$/, "");
  const parecidos = nome => { const ws = norm(nome).split(/[^a-z0-9]+/).filter(w => w.length >= 3).map(singular); return S.itens.filter(i => !i.arquivado && ws.length && ws.every(w => norm(i.nome).split(/[^a-z0-9]+/).some(x => singular(x).startsWith(w)))); };
  for (const r of rs) {
    r.avisos = [];
    const dup = r.chave ? S.envios.find(e => e.chaveNfe === r.chave && e.status !== "cancelado") : r.dace && S.envios.find(e => e.dace === r.dace && e.status !== "cancelado");
    if (dup) { r.avisos.push({ t: `Esta ${r.dace && !r.chave ? "DACE" : "nota"} já foi importada (envio ${shortId(dup.id)}).`, grave: true }); if (!r.avaliado) r.marcado = false; }
    if (!r.destinatario) r.avisos.push({ t: "Destinatário não encontrado: preencha depois em Editar." });
    if (!r.itens.length) r.avisos.push({ t: "Nenhum item encontrado na nota.", grave: true });
    r.linhas = r.itens.map((l, j) => {
      if (!l.codigo) {
        const lembrado = S.itens.find(i => !i.arquivado && (i.aliases || []).includes(chaveNome(l.nome)));
        if (!lembrado && l.itemEsc === undefined) { const so = parecidos(l.nome); if (so.length === 1) l.itemEsc = so[0].id; }   // um parecido só: já vem escolhido
        const it = itemById(l.itemEsc) || lembrado;
        if (!it) { const sug = parecidos(l.nome); return { ...l, j, escolher: sug, semItem: true }; }
        // peça separada por tamanho (camiseta P, M, G…): distribui a quantidade entre os tamanhos
        const fam = it.tamanho && it.codigo ? tamanhosDe(it.codigo).sort((a, b) => ordTam(a.tamanho) - ordTam(b.tamanho)) : [];
        if (fam.length > 1) {
          l.dist ||= {};
          const soma = fam.reduce((a, t) => a + (Number(l.dist[t.id]) || 0), 0);
          const partes = fam.filter(t => Number(l.dist[t.id]) > 0).map(t => ({ itemId: t.id, qtd: Number(l.dist[t.id]) }));
          const lembrar = l.itemEsc && !(it.aliases || []).includes(chaveNome(l.nome)) ? chaveNome(l.nome) : "";
          return { ...l, j, itemId: it.id, familia: fam.map(t => ({ id: t.id, tamanho: t.tamanho, disp: st[t.id]?.disp || 0 })), soma, partes, semDist: soma !== l.qtd,
            nomeSis: `${nomeBase(it.nome, it.tamanho)} · ${partes.length ? partes.map(p => `${p.qtd} ${itemById(p.itemId).tamanho}`).join(", ") : "tamanhos?"}`, escolher: l.itemEsc || !lembrado ? parecidos(l.nome) : null, lembrar };
        }
        const disp = (st[it.id]?.disp || 0) - (r.marcado ? (usado[it.id] || 0) : 0);
        if (r.marcado) usado[it.id] = (usado[it.id] || 0) + l.qtd;
        return { ...l, j, itemId: it.id, nomeSis: it.tamanho ? `${nomeBase(it.nome, it.tamanho)} · ${it.tamanho}` : it.nome, escolher: l.itemEsc || !lembrado ? parecidos(l.nome) : null, lembrar: l.itemEsc && !(it.aliases || []).includes(chaveNome(l.nome)) ? chaveNome(l.nome) : "", falta: l.qtd > disp ? Math.max(0, disp) : null, arquivado: !!it.arquivado };
      }
      const tams = tamanhosDe(l.codigo);
      if (tams.length && l.tam === undefined) l.tam = tamDoNome(l.nome, tams) || "";
      const it = tams.length ? tams.find(t => t.tamanho === l.tam) : porCodigo(l.codigo);
      if (tams.length && !it) return { ...l, j, tams, semTam: true };
      if (!it) return { ...l, novo: true };
      // brinde em fardo: a nota vem em fardos e o estoque é em unidades
      const pf = porFardo(it), q = pf ? l.qtd * pf : l.qtd;
      const disp = (st[it.id]?.disp || 0) - (r.marcado ? (usado[it.id] || 0) : 0);
      if (r.marcado) usado[it.id] = (usado[it.id] || 0) + q;
      if (pf) return { ...l, j, qtd: q, fardos: l.qtd, valor: l.valor ? l.valor / pf : l.valor, tams: tams.length ? tams : null, itemId: it.id, nomeSis: it.nome, falta: q > disp ? Math.max(0, disp) : null, arquivado: !!it.arquivado };
      return { ...l, j, tams: tams.length ? tams : null, itemId: it.id, nomeSis: it.nome, falta: l.qtd > disp ? Math.max(0, disp) : null, arquivado: !!it.arquivado };
    });
    if (r.linhas.some(l => l.semTam)) r.avisos.push({ t: "Escolha o tamanho das peças abaixo para criar o envio.", grave: true });
    if (r.linhas.some(l => l.semDist && !l.semItem)) r.avisos.push({ t: "Distribua a quantidade entre os tamanhos abaixo (a soma tem que bater).", grave: true });
    if (r.linhas.some(l => l.semItem)) r.avisos.push({ t: "Escolha abaixo qual brinde é cada item (o sistema lembra nas próximas).", grave: true });
    if (r.linhas.some(l => l.novo)) r.avisos.push({ t: "Item novo: será cadastrado no estoque ao confirmar." });
    if (r.linhas.some(l => l.falta != null)) r.avisos.push({ t: "Estoque insuficiente no sistema para algum item (o envio é criado mesmo assim)." });
    r.avaliado = true;
  }
}

// representante cujo nome (duas primeiras palavras) aparece no destinatário
function repDoNome(dest) {
  const d = norm(dest);
  const l = S.representantes.filter(x => { const ws = norm(x.nome).split(/[^a-z0-9]+/).filter(w => w.length >= 3).slice(0, 2); return ws.length && ws.every(w => d.includes(w)); });
  return l.length === 1 ? l[0].id : null;
}
function importarNotasDrawer() {
  let rascunhos = [], lendo = 0;
  const reps = S.representantes.slice().sort((a, b) => a.nome.localeCompare(b.nome));
  const card = (r, i) => `<article class="nf-card${r.marcado ? "" : " off"}" data-i="${i}">
    <label class="nf-top"><input type="checkbox" data-nfchk ${r.marcado ? "checked" : ""}>
      <div class="nf-h"><b>${esc(r.destinatario || "Sem destinatário")}</b>
        <span class="muted">${r.dace ? `DACE ${esc(r.dace)}` : `NF ${esc(r.nf || "?")}`}${r.emissao ? " · " + fmtD(r.emissao) : ""}${r.pedidoVenda ? " · Pedido " + esc(r.pedidoVenda) : ""} · ${esc([r.cidade, r.uf].filter(Boolean).join("/") || "cidade?")}${r.cep ? " · CEP " + esc(r.cep) : ""}</span></div>
      <span class="tag">${r.origem}${r.pdf && r.origem === "XML" ? "+PDF" : ""}</span></label>
    ${r.avisos.length ? `<div class="nf-avisos">${r.avisos.map(a => `<span class="${a.grave ? "grave" : ""}">${ic("alert", "i-sm")}${esc(a.t)}</span>`).join("")}</div>` : ""}
    <div class="chips">${r.linhas.map(l => `<span class="ichip${l.novo ? " novo" : l.falta != null ? " falta" : ""}" title="${esc(l.codigo + " · " + l.nome)}"><b class="num">${l.fardos ? `${fmtN(l.fardos)} fd (${fmtN(l.qtd)})` : fmtN(l.qtd)}×</b><span>${esc(l.nomeSis || l.nome)}${l.novo ? " (novo)" : l.semTam ? " · tamanho?" : l.falta != null ? ` (disp. ${fmtN(l.falta)})` : ""}</span></span>`).join("")}</div>
    ${r.linhas.filter(l => l.escolher).map(l => {
      // um item por peça: as que têm tamanho entram uma vez só (o 1º tamanho representa a família)
      const umPorPeca = lista => { const vistos = new Set(); return lista.filter(i => { if (!i.tamanho) return true; const c = norm(i.codigo || i.nome); if (vistos.has(c)) return false; vistos.add(c); return true; }); };
      const fam = i => i.tamanho ? S.itens.filter(x => x.tamanho && !x.arquivado && norm(x.codigo || "") === norm(i.codigo || "")) : [];
      const sel = itemById(l.itemId), selFam = sel?.tamanho ? norm(sel.codigo || "") : null;
      const op = i => `<option value="${esc(i.id)}"${i.id === l.itemId || (selFam && i.tamanho && norm(i.codigo || "") === selFam) ? " selected" : ""}>${esc(i.tamanho ? nomeBase(i.nome, i.tamanho) : i.nome)}${i.tamanho ? ` · tamanhos ${esc(fam(i).sort((a, b) => ordTam(a.tamanho) - ordTam(b.tamanho)).map(x => x.tamanho).join(", "))}` : ""}${i.codigo ? " (" + esc(i.codigo) + ")" : ""}</option>`;
      l = { ...l, escolher: umPorPeca(l.escolher) };
      const ids = new Set(l.escolher.flatMap(i => [i.id, ...fam(i).map(x => x.id)]));
      const outros = umPorPeca(S.itens.filter(i => !i.arquivado && !ids.has(i.id)).sort((a, b) => a.nome.localeCompare(b.nome) || ordTam(a.tamanho) - ordTam(b.tamanho)));
      return `<label class="field"><span>Qual brinde é · ${fmtN(l.qtd)}× ${esc(l.nome)}</span><select class="select" data-nfitem="${l.j}"><option value="">Escolha…</option>${l.escolher.length ? `<optgroup label="Parecidos">${l.escolher.map(op).join("")}</optgroup><optgroup label="Todos os brindes">` : ""}${outros.map(op).join("")}${l.escolher.length ? "</optgroup>" : ""}</select></label>`; }).join("")}
    ${r.linhas.filter(l => l.familia).map(l => `<div class="field nf-dist"><span>Quantos de cada tamanho · ${esc(frase(nomeBase(itemById(l.itemId).nome, itemById(l.itemId).tamanho)))} <b class="${l.semDist ? "nf-falta" : "nf-ok"}">${fmtN(l.soma)} de ${fmtN(l.qtd)}</b></span>
      <div class="nf-tams">${l.familia.map(t => `<label class="nf-tam"><b>${esc(t.tamanho)}</b><input class="input num" type="number" min="0" inputmode="numeric" data-nfdist="${l.j}" data-tid="${esc(t.id)}" value="${l.dist[t.id] || ""}" placeholder="0"><small>${fmtN(Math.max(0, t.disp))} disp.</small></label>`).join("")}</div></div>`).join("")}
    ${r.linhas.filter(l => l.tams).map(l => `<label class="field"><span>Tamanho · ${fmtN(l.qtd)}× ${esc(l.nome)}</span><select class="select" data-nftam="${l.j}"><option value="">Escolha…</option>${l.tams.map(t => `<option${t.tamanho === l.tam ? " selected" : ""}>${esc(t.tamanho)}</option>`).join("")}</select></label>`).join("")}
    <div class="row2"><label class="field"><span>Representante</span><select class="select" data-nfrep><option value="">Nenhum</option>${reps.map(x => `<option value="${esc(x.id)}"${x.id === r.repId ? " selected" : ""}>${esc(x.nome)}</option>`).join("")}</select></label>
      <label class="field"><span>Forma de envio</span><select class="select" data-nfforma><option value=""></option>${FORMAS.map(f => `<option${f === r.forma ? " selected" : ""}>${f}</option>`).join("")}</select></label></div>
  </article>`;
  openDrawer({
    eyebrow: "Envios", title: "Importar notas fiscais ou DACE", wide: true,
    body: `<label class="drop" id="nfDrop"><input type="file" id="nfArq" accept=".xml,.pdf,application/pdf,text/xml,application/xml" multiple hidden>
        ${ic("in")}<b>Arraste aqui os XML ou PDF das notas, ou a DACE dos Correios</b><span class="muted">ou toque para escolher · pode mandar várias de uma vez</span></label>
      <div id="nfStatus" class="muted" role="status"></div>
      <div id="nfLista" class="nf-lista"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="nfOk" disabled>${ic("check")}Criar envios</button>`,
    onMount(ov) {
      const pintar = () => {
        avaliarRascunhos(rascunhos);
        $("#nfLista", ov).innerHTML = rascunhos.map(card).join("");
        const n = rascunhos.filter(r => r.marcado).length, b = $("#nfOk", ov);
        b.disabled = !n || lendo > 0 || rascunhos.some(r => r.marcado && r.linhas.some(l => l.semTam || l.semItem || l.semDist)); b.innerHTML = `${ic("check")}${n ? `Criar ${n} envio${n > 1 ? "s" : ""}` : "Criar envios"}`;
        $$(".nf-card", ov).forEach(c => {
          const r = rascunhos[+c.dataset.i];
          $("[data-nfchk]", c).onchange = ev => { r.marcado = ev.target.checked; pintar(); };
          $("[data-nfrep]", c).onchange = ev => { r.repId = ev.target.value || null; };
          $("[data-nfforma]", c).onchange = ev => { r.forma = ev.target.value; };
          $$("[data-nftam]", c).forEach(sel => sel.onchange = ev => { r.itens[+sel.dataset.nftam].tam = ev.target.value; pintar(); });
          $$("[data-nfitem]", c).forEach(sel => sel.onchange = ev => { const l = r.itens[+sel.dataset.nfitem]; l.itemEsc = ev.target.value || undefined; l.dist = {}; pintar(); });
          // distribuição por tamanho: atualiza a soma e o botão sem redesenhar; redesenha só ao sair do bloco dos tamanhos
          $$("[data-nfdist]", c).forEach(inp => inp.oninput = () => {
            const l = r.itens[+inp.dataset.nfdist]; l.dist[inp.dataset.tid] = Math.max(0, parseInt(inp.value, 10) || 0);
            const soma = Object.values(l.dist).reduce((a, v) => a + v, 0), bb = inp.closest(".nf-dist").querySelector("span > b");
            bb.textContent = `${fmtN(soma)} de ${fmtN(l.qtd)}`; bb.className = soma === l.qtd ? "nf-ok" : "nf-falta";
            avaliarRascunhos(rascunhos);
            $("#nfOk", ov).disabled = lendo > 0 || !rascunhos.some(x => x.marcado) || rascunhos.some(x => x.marcado && x.linhas.some(y => y.semTam || y.semItem || y.semDist));
          });
          $$(".nf-dist", c).forEach(g => g.addEventListener("focusout", ev => { if (!g.contains(ev.relatedTarget)) setTimeout(() => { if (!g.contains(document.activeElement)) pintar(); }, 0); }));
        });
      };
      const status = () => { $("#nfStatus", ov).textContent = lendo ? `Lendo ${lendo} arquivo${lendo > 1 ? "s" : ""}…` : rascunhos.length ? `${rascunhos.length} nota${rascunhos.length > 1 ? "s" : ""} lida${rascunhos.length > 1 ? "s" : ""}. Confira e confirme.` : ""; };
      const receber = async files => {
        lendo += files.length; status(); pintar();
        for (const f of files) {
          try {
            const r = await lerNota(f);
            // XML e PDF da mesma nota viram um rascunho só (dados do XML + PDF anexado)
            const igual = r.chave && rascunhos.find(x => x.chave === r.chave);
            if (igual) { if (r.origem === "XML" && igual.origem === "PDF") { const pdf = igual.pdf; Object.assign(igual, r, { pdf, origem: "XML", forma: igual.forma, repId: igual.repId }); } else if (r.pdf && !igual.pdf) igual.pdf = r.pdf; }
            else rascunhos.push({ ...r, marcado: true, repId: repDoNome(r.destinatario), forma: formaDoTransp(r.transportadora) });
          } catch (x) { toast(`${f.name}: ${x.message}`, "err"); }
          lendo--; status(); pintar();
        }
      };
      const inp = $("#nfArq", ov), drop = $("#nfDrop", ov);
      inp.onchange = () => { const fs = [...inp.files]; inp.value = ""; if (fs.length) receber(fs); };
      drop.addEventListener("dragover", ev => { ev.preventDefault(); drop.classList.add("over"); });
      drop.addEventListener("dragleave", () => drop.classList.remove("over"));
      drop.addEventListener("drop", ev => { ev.preventDefault(); drop.classList.remove("over"); const fs = [...ev.dataTransfer.files]; if (fs.length) receber(fs); });
      $("#nfOk", ov).onclick = async () => {
        const sel = rascunhos.filter(r => r.marcado); if (!sel.length) return;
        const b = $("#nfOk", ov); b.disabled = true; b.textContent = "Criando…";
        let ok = 0; const ids = [];
        for (const r of sel) { const id = await criarEnvioDaNota(r); if (id) { ok++; ids.push(id); r.marcado = false; r.criado = true; } }
        if (ids.length) notificar({ tipo: "envios", evento: "novo", ids });
        rascunhos = rascunhos.filter(r => !r.criado);
        if (ok) toast(`${ok} envio${ok > 1 ? "s criados" : " criado"} como pendente${ok > 1 ? "s" : ""}`);
        if (!rascunhos.length) closeDrawer(); else { status(); pintar(); }
      };
    }
  });
}

async function criarEnvioDaNota(r) {
  const now = Date.now(), ops = [], criados = {};
  r.linhas.filter(l => l.lembrar && l.itemId).forEach(l => ops.push(b => b.update(col("itens").doc(l.itemId), { aliases: firebase.firestore.FieldValue.arrayUnion(l.lembrar) })));
  const linhas = r.linhas.flatMap(l => l.familia ? l.partes.map(p => ({ ...l, ...p, familia: null })) : [l]).map(l => {
    if (!l.novo) return { itemId: l.itemId, qtd: l.qtd, valor: l.valor || null };
    if (!criados[l.codigo]) {
      const ref = S.itens.some(i => i.id === l.codigo) ? col("itens").doc() : col("itens").doc(l.codigo);
      ops.push(b => b.set(ref, { codigo: l.codigo, nome: l.nome.toUpperCase(), categoria: "Outros", minimo: 0, valor: l.valor || 0, criadoEm: now, origem: "nota " + (r.nf || "") }));
      criados[l.codigo] = ref.id;
    }
    return { itemId: criados[l.codigo], qtd: l.qtd, valor: l.valor || null };
  });
  // junta linhas repetidas do mesmo item
  const ag = {}; linhas.forEach(l => { if (ag[l.itemId]) ag[l.itemId].qtd += l.qtd; else ag[l.itemId] = { ...l }; });
  const ref = col("envios").doc(), fotos = [];
  if (r.pdf) {
    try {
      const dados = await lerDataUrl(r.pdf);
      if (dados.length <= MAX_ARQ) { const fref = ref.collection("fotos").doc(); ops.push(b => b.set(fref, { dados, tipo: "pdf", nome: r.nomeArq || r.pdf.name, etapa: "nota", em: now, por: myId })); fotos.push({ id: fref.id, etapa: "nota", em: now, por: myId, tipo: "pdf", nome: r.pdf.name, thumb: null }); }
    } catch (x) { /* sem o PDF anexado, o envio é criado do mesmo jeito */ }
  }
  const envio = {
    repId: r.repId || null, destinatario: r.destinatario || (r.dace ? "Destinatário da DACE " + r.dace : "Destinatário da NF " + (r.nf || "")), documento: r.documento || "", telefone: r.telefone || "", email: r.email || "",
    cidade: r.cidade || "", uf: UFS.includes(r.uf) ? r.uf : "", cep: r.cep || "", endereco: r.endereco || "",
    itens: Object.values(ag), forma: r.forma || "", transportadora: r.transportadora || "", nf: r.nf || "", rastreio: "",
    chaveNfe: r.chave || "", pedidoVenda: r.pedidoVenda || "", peso: r.peso || null, valorNf: r.valorNf || null, emissaoNf: r.emissao || null,
    obs: r.dace ? `DACE nº ${r.dace}` : "", ...(r.dace ? { dace: r.dace } : {}), status: "pendente", criadoEm: now, criadoPor: myId, pedidoId: null, importadoDe: r.origem, fotos,
  };
  const ok = await save(() => { const b = db.batch(); ops.forEach(f => f(b)); b.set(ref, envio); return b.commit(); });
  return ok ? ref.id : null;
}
