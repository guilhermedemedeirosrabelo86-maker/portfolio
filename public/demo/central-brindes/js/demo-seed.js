/* =========================================================
   Central Brindes · DEMO
   Dados fictícios carregados na primeira visita (e no "Restaurar demo").
   Nenhum nome, endereço, telefone ou produto aqui é real.
   ========================================================= */
(function () {
  "use strict";

  var TOKEN_EXEMPLO = "demoexemplo2026";
  window.DEMO_TOKEN_EXEMPLO = TOKEN_EXEMPLO;

  window.criarSeedDemo = function () {
    var DIA = 86400000, agora = Date.now();
    var ha = function (d, h) { return agora - d * DIA - (h || 0) * 3600000; };
    var diaISO = function (t) { var d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

    /* ---------- equipe ---------- */
    var perfis = {
      visitante: { nome: "Visitante", usuario: "visitante", email: "visitante@demo.local", cargo: "Recrutador(a) curioso(a)", cor: "#D61C38", ativo: true, admin: true },
      ana: { nome: "Ana Souza", usuario: "ana", email: "ana@exemplo.com", cargo: "Analista de Marketing", cor: "#2F6FEB", ativo: true, admin: false },
      bruno: { nome: "Bruno Lima", usuario: "bruno", email: "bruno@exemplo.com", cargo: "Assistente de Marketing", cor: "#1F9D55", ativo: true, admin: false },
      carla: { nome: "Carla Mendes", usuario: "carla", email: "carla@exemplo.com", cargo: "Coordenadora de Marketing", cor: "#8E44AD", ativo: true, admin: true },
    };
    var usuarios = {};
    Object.keys(perfis).forEach(function (id) { usuarios[perfis[id].usuario] = { email: perfis[id].email, uid: id }; });

    /* ---------- brindes ---------- */
    var lista = [
      ["MK0101", "CANETA ESFEROGRÁFICA", "Escritório", 300, 520],
      ["MK0102", "BLOCO DE ANOTAÇÕES", "Escritório", 100, 260],
      ["MK0103", "CADERNO CAPA DURA", "Escritório", 50, 64],
      ["MK0104", "MARCA-TEXTO", "Escritório", 80, 40],
      ["MK0105", "CHAVEIRO METÁLICO", "Acessórios", 60, 150],
      ["MK0106", "CHAVEIRO ABRIDOR", "Acessórios", 60, 18],
      ["MK0107", "SQUEEZE 500 ML", "Copos e garrafas", 40, 90],
      ["MK0108", "COPO TÉRMICO", "Copos e garrafas", 30, 22],
      ["MK0109", "CANECA DE PORCELANA", "Copos e garrafas", 24, 48],
      ["MK0110", "ECOBAG ALGODÃO", "Sacolas", 100, 210],
      ["MK0111", "SACOLA DE PAPEL", "Sacolas", 200, 640],
      ["MK0112", "MOCHILA SACO", "Sacolas", 40, 35],
      ["MK0113", "BONÉ", "Vestuário e acessórios", 50, 12],
      ["MK0114", "CAMISETA LOGO · P", "Vestuário e acessórios", 10, 25],
      ["MK0115", "CAMISETA LOGO · M", "Vestuário e acessórios", 15, 31],
      ["MK0116", "CAMISETA LOGO · G", "Vestuário e acessórios", 15, 8],
      ["MK0117", "AVENTAL", "Vestuário e acessórios", 20, 44],
      ["MK0118", "GUARDA-CHUVA", "Acessórios", 20, 27],
      ["MK0119", "BANNER DE LOJA", "Comunicação visual", 5, 14],
      ["MK0120", "DISPLAY DE BALCÃO", "Comunicação visual", 5, 3],
      ["MK0121", "CATÁLOGO DE CORES", "Comunicação visual", 100, 380],
      ["MK0122", "LEQUE DE CORES", "Comunicação visual", 50, 75],
      ["MK0123", "PEN DRIVE 16 GB", "Tecnologia", 20, 26],
      ["MK0124", "CARREGADOR PORTÁTIL", "Tecnologia", 10, 9],
    ];
    var itens = {}, movimentos = {}, m = 0;
    lista.forEach(function (l, i) {
      itens[l[0]] = { codigo: l[0], nome: l[1], categoria: l[2], minimo: l[3], arquivado: false, valor: Math.round((2 + (i * 7) % 45) * 100) / 100, criadoEm: ha(120), criadoPor: "carla" };
      movimentos["mv" + ++m] = { itemId: l[0], tipo: "entrada", qtd: l[4] + 40, obs: "Compra inicial", por: "carla", em: ha(90 - (i % 10)) };
    });
    movimentos["mv" + ++m] = { itemId: "MK0101", tipo: "saida", qtd: -20, motivo: "Evento", retiradoPor: "Bruno Lima", obs: "Feira regional", por: "bruno", em: ha(12) };
    movimentos["mv" + ++m] = { itemId: "MK0110", tipo: "saida", qtd: -15, motivo: "Evento", retiradoPor: "Ana Souza", obs: "Treinamento de pintores", por: "ana", em: ha(8) };
    movimentos["mv" + ++m] = { itemId: "MK0105", tipo: "contagem", qtd: -3, obs: "Contagem mensal", por: "carla", em: ha(5) };
    movimentos["mv" + ++m] = { itemId: "MK0121", tipo: "entrada", qtd: 200, obs: "Reposição", por: "ana", em: ha(3) };

    /* ---------- representantes ---------- */
    var reps = {
      r1: { nome: "Paulo Henrique Ficticio", regiao: "Sul de SC", cidade: "Criciúma", uf: "SC", cep: "88800-000", endereco: "Rua Exemplo, 100", telefone: "(48) 90000-0001", email: "paulo@exemplo.com", obs: "" },
      r2: { nome: "Mariana Exemplar", regiao: "Grande Florianópolis", cidade: "Florianópolis", uf: "SC", cep: "88000-000", endereco: "Av. Modelo, 200", telefone: "(48) 90000-0002", email: "mariana@exemplo.com", obs: "" },
      r3: { nome: "Rafael Demonstração", regiao: "Oeste do PR", cidade: "Cascavel", uf: "PR", cep: "85800-000", endereco: "Rua Teste, 300", telefone: "(45) 90000-0003", email: "rafael@exemplo.com", obs: "" },
      r4: { nome: "Juliana Fictícia", regiao: "Serra Gaúcha", cidade: "Caxias do Sul", uf: "RS", cep: "95000-000", endereco: "Rua Amostra, 400", telefone: "(54) 90000-0004", email: "juliana@exemplo.com", obs: "" },
      r5: { nome: "Thiago Modelo", regiao: "Vale do Itajaí", cidade: "Blumenau", uf: "SC", cep: "89000-000", endereco: "Rua Protótipo, 500", telefone: "(47) 90000-0005", email: "thiago@exemplo.com", obs: "" },
      r6: { nome: "Fernanda Simulada", regiao: "Norte de SC", cidade: "Joinville", uf: "SC", cep: "89200-000", endereco: "Rua Ilustrativa, 600", telefone: "(47) 90000-0006", email: "fernanda@exemplo.com", obs: "" },
    };

    /* ---------- envios ---------- */
    function envio(o) {
      var rep = reps[o.repId] || {};
      var e = {
        destinatario: o.destinatario || rep.nome, repId: o.repId || null, cidade: rep.cidade || o.cidade, uf: rep.uf || o.uf, cep: rep.cep || "", endereco: rep.endereco || "",
        itens: o.itens, status: o.status, forma: "correios", transportadora: "Correios", rastreio: o.rastreio || "", nf: "", obs: o.obs || "",
        criadoPor: o.por || "ana", criadoEm: ha(o.d), historico: [{ s: "pendente", em: ha(o.d), por: o.por || "ana" }],
      };
      if (["separado", "postado", "entregue"].indexOf(o.status) >= 0) { e.separadoEm = ha(o.d - 1); e.separadoPor = "bruno"; e.historico.push({ s: "separado", em: e.separadoEm, por: "bruno" }); }
      if (["postado", "entregue"].indexOf(o.status) >= 0) { e.postadoEm = ha(o.d - 2); e.postadoPor = "bruno"; e.situacao = o.situacao || "transito"; e.historico.push({ s: "postado", em: e.postadoEm, por: "bruno" }); }
      if (o.status === "entregue") { e.entregueEm = ha(o.d - 5); e.entreguePor = "ana"; e.historico.push({ s: "entregue", em: e.entregueEm, por: "ana" }); }
      if (o.status === "cancelado") { e.canceladoEm = ha(o.d - 1); e.canceladoPor = "carla"; e.historico.push({ s: "cancelado", em: e.canceladoEm, por: "carla" }); }
      if (o.token) e.token = o.token;
      return e;
    }
    var envios = {
      e1: envio({ repId: "r1", status: "pendente", d: 1, itens: [{ itemId: "MK0101", qtd: 50 }, { itemId: "MK0110", qtd: 20 }], obs: "Para a inauguração da loja parceira" }),
      e2: envio({ repId: "r2", status: "pendente", d: 0, itens: [{ itemId: "MK0121", qtd: 30 }, { itemId: "MK0122", qtd: 10 }] }),
      e3: envio({ repId: "r3", status: "separado", d: 3, itens: [{ itemId: "MK0107", qtd: 12 }, { itemId: "MK0113", qtd: 6 }] }),
      e4: envio({ repId: "r4", status: "postado", d: 6, rastreio: "AA000000001BR", itens: [{ itemId: "MK0102", qtd: 40 }, { itemId: "MK0101", qtd: 40 }], token: TOKEN_EXEMPLO }),
      e5: envio({ repId: "r5", status: "postado", d: 12, rastreio: "AA000000002BR", situacao: "atencao", itens: [{ itemId: "MK0119", qtd: 2 }, { itemId: "MK0120", qtd: 1 }] }),
      e6: envio({ repId: "r6", status: "entregue", d: 20, rastreio: "AA000000003BR", itens: [{ itemId: "MK0109", qtd: 12 }, { itemId: "MK0105", qtd: 30 }] }),
      e7: envio({ repId: "r1", status: "entregue", d: 30, rastreio: "AA000000004BR", itens: [{ itemId: "MK0111", qtd: 100 }] }),
      e8: envio({ repId: "r2", status: "cancelado", d: 9, itens: [{ itemId: "MK0123", qtd: 5 }], obs: "Evento adiado" }),
      e9: envio({ destinatario: "Loja Exemplo Tintas Ltda", cidade: "Tubarão", uf: "SC", status: "pendente", d: 2, itens: [{ itemId: "MK0117", qtd: 10 }, { itemId: "MK0110", qtd: 10 }], por: "carla" }),
    };

    /* página pública do envio de exemplo (o sistema mantém isso sozinho depois) */
    var ex = envios.e4;
    var acompanhamento = {};
    acompanhamento[TOKEN_EXEMPLO] = {
      destinatario: ex.destinatario, cidade: ex.cidade, uf: ex.uf, paraCliente: false, repNome: reps.r4.nome,
      itens: [{ n: "Bloco de anotações", q: 40 }, { n: "Caneta esferográfica", q: 40 }],
      status: ex.status, situacao: ex.situacao, rastreio: ex.rastreio, rastreios: [ex.rastreio], volumes: 1, servico: null,
      criadoEm: ex.criadoEm, separadoEm: ex.separadoEm, postadoEm: ex.postadoEm, entregueEm: null,
      historico: ex.historico.map(function (h) { return { s: h.s, em: h.em }; }), atualizadoEm: agora,
    };

    /* ---------- kits ---------- */
    var kits = {
      k1: { nome: "Kit loja nova", itens: [{ itemId: "MK0119", qtd: 1 }, { itemId: "MK0121", qtd: 20 }, { itemId: "MK0101", qtd: 50 }], criadoPor: "carla", criadoEm: ha(60), atualizadoEm: ha(60) },
      k2: { nome: "Kit pintor", itens: [{ itemId: "MK0113", qtd: 1 }, { itemId: "MK0117", qtd: 1 }, { itemId: "MK0107", qtd: 1 }], criadoPor: "ana", criadoEm: ha(45), atualizadoEm: ha(20) },
      k3: { nome: "Kit evento", itens: [{ itemId: "MK0110", qtd: 30 }, { itemId: "MK0105", qtd: 30 }, { itemId: "MK0102", qtd: 30 }], criadoPor: "ana", criadoEm: ha(30), atualizadoEm: ha(30) },
    };

    /* ---------- tarefas ---------- */
    var pedidos = {
      p1: { texto: "Separar o envio do Paulo para a inauguração", tipo: "envio", autor: "carla", responsavel: "bruno", prazo: diaISO(agora + DIA), status: "andamento", envioId: "e1", criadoEm: ha(1) },
      p2: { texto: "Orçar 200 bonés novos com dois fornecedores", tipo: "tarefa", autor: "carla", responsavel: "ana", prazo: diaISO(agora + 3 * DIA), status: "aberto", criadoEm: ha(2) },
      p3: { texto: "Conferir displays de balcão que chegaram com avaria", tipo: "tarefa", autor: "ana", responsavel: "visitante", prazo: diaISO(agora - DIA), status: "aberto", criadoEm: ha(4) },
      p4: { texto: "Atualizar o catálogo de cores no estoque", tipo: "tarefa", autor: "bruno", responsavel: "bruno", prazo: diaISO(agora - 2 * DIA), status: "concluido", concluidoPor: "bruno", concluidoEm: ha(3), criadoEm: ha(6) },
    };

    var seed = {
      itens: itens, movimentos: movimentos, envios: envios, representantes: reps, kits: kits, pedidos: pedidos,
      perfis: perfis, usuarios: usuarios, conversas: {}, acompanhamento: acompanhamento,
      config: {
        setup: { admin: "carla", em: ha(150) },
        remetente: { nome: "Empresa Demo", endereco: "Rua da Demonstração, 1", cidade: "Criciúma", uf: "SC", cep: "88800-000", ac: "Marketing" },
      },
      "pedidos/p1/respostas": { r1: { texto: "Já separei as canetas, falta a ecobag.", autor: "bruno", em: ha(0, 5) } },
      "pedidos/p2/respostas": { r1: { texto: "Mandei pedido para dois fornecedores, aguardando.", autor: "ana", em: ha(1, 3) } },
    };
    return seed;
  };
})();
