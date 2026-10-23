/* =========================================================
   Central Brindes · DEMO
   Firebase falso: imita a parte da API "compat" do Firebase que o
   sistema usa, guardando tudo no localStorage do próprio navegador.
   Nada sai daqui para a internet.
   ========================================================= */
(function () {
  "use strict";

  var CHAVE = "cb-demo-v1";
  var VISITANTE = { uid: "visitante", email: "visitante@demo.local", displayName: "Visitante" };

  // Configuração falsa (o sistema só confere se existe)
  window.FIREBASE_CONFIG = { apiKey: "demo", projectId: "demo" };
  window.FIREBASE_VAPID_KEY = "";

  /* ---------- utilidades ---------- */
  function clonar(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function novoId() {
    var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", s = "";
    for (var i = 0; i < 20; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  }
  function eObjeto(v) { return v !== null && typeof v === "object" && !Array.isArray(v) && !v.__fv; }
  function lerCampo(obj, caminho) {
    return caminho.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function igual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  /* ---------- FieldValue ---------- */
  var FieldValue = {
    arrayUnion: function () { return { __fv: "arrayUnion", v: [].slice.call(arguments) }; },
    arrayRemove: function () { return { __fv: "arrayRemove", v: [].slice.call(arguments) }; },
    delete: function () { return { __fv: "delete" }; },
    serverTimestamp: function () { return { __fv: "now" }; },
    increment: function (n) { return { __fv: "increment", v: n }; },
  };
  function resolver(atual, valor) {
    if (!valor || !valor.__fv) return clonar(valor);
    var lista = Array.isArray(atual) ? atual.slice() : [];
    switch (valor.__fv) {
      case "arrayUnion":
        valor.v.forEach(function (x) { if (!lista.some(function (y) { return igual(x, y); })) lista.push(clonar(x)); });
        return lista;
      case "arrayRemove":
        return lista.filter(function (y) { return !valor.v.some(function (x) { return igual(x, y); }); });
      case "now": return Date.now();
      case "increment": return (typeof atual === "number" ? atual : 0) + valor.v;
    }
  }
  function gravarCampo(obj, caminho, valor) {
    var partes = caminho.split("."), alvo = obj;
    for (var i = 0; i < partes.length - 1; i++) {
      if (!eObjeto(alvo[partes[i]])) alvo[partes[i]] = {};
      alvo = alvo[partes[i]];
    }
    var ult = partes[partes.length - 1];
    if (valor && valor.__fv === "delete") delete alvo[ult];
    else alvo[ult] = resolver(alvo[ult], valor);
  }
  function mesclar(destino, origem) {
    Object.keys(origem).forEach(function (k) {
      var v = origem[k];
      if (eObjeto(v) && eObjeto(destino[k])) mesclar(destino[k], v);
      else if (v && v.__fv === "delete") delete destino[k];
      else destino[k] = eObjeto(v) ? mesclar({}, v) : resolver(destino[k], v);
    });
    return destino;
  }

  /* ---------- armazenamento ---------- */
  function sementeInicial() {
    var docs = {};
    var seed = typeof window.criarSeedDemo === "function" ? window.criarSeedDemo() : {};
    Object.keys(seed || {}).forEach(function (col) {
      Object.keys(seed[col]).forEach(function (id) { docs[col + "/" + id] = clonar(seed[col][id]); });
    });
    return docs;
  }
  function lerStorage() {
    try {
      var bruto = window.localStorage.getItem(CHAVE);
      if (!bruto) return null;
      var dados = JSON.parse(bruto);
      return dados && dados.docs ? dados.docs : null;
    } catch (e) { return null; }
  }
  function salvar() {
    try { window.localStorage.setItem(CHAVE, JSON.stringify({ versao: 1, docs: docs })); } catch (e) { /* sem storage: segue na memória */ }
  }

  var docs = lerStorage();
  if (!docs) { docs = sementeInicial(); salvar(); }

  /* ---------- ouvintes ---------- */
  // Como no Firebase de verdade: avisos chegam depois (assíncronos), agrupados,
  // e só para quem teve alguma mudança. Isso evita laço quando um ouvinte grava.
  var ouvintes = [], avisoAgendado = false;
  function avisarTodos() {
    if (avisoAgendado) return;
    avisoAgendado = true;
    Promise.resolve().then(function () {
      avisoAgendado = false;
      ouvintes.slice().forEach(function (o) { if (o.ativo) o.disparar(); });
    });
  }

  if (window.__demoStorageHandler) window.removeEventListener("storage", window.__demoStorageHandler);
  window.__demoStorageHandler = function (e) {
    if (e.key !== CHAVE && e.key !== null) return;
    var novos = lerStorage();
    docs = novos || sementeInicial();
    avisarTodos();
  };
  window.addEventListener("storage", window.__demoStorageHandler);

  /* ---------- snapshots ---------- */
  function DocSnap(ref) {
    var d = docs[ref.path];
    return { id: ref.id, ref: ref, exists: d !== undefined, metadata: { fromCache: false, hasPendingWrites: false }, data: function () { return clonar(docs[ref.path]); }, get: function (c) { return lerCampo(docs[ref.path] || {}, c); } };
  }
  function QuerySnap(lista) {
    return {
      docs: lista, size: lista.length, empty: lista.length === 0,
      forEach: function (fn) { lista.forEach(fn); },
      metadata: { fromCache: false, hasPendingWrites: false },
    };
  }

  /* ---------- operações de escrita (sem avisar) ---------- */
  function aplicarSet(path, data, opts) {
    if (opts && opts.merge && docs[path]) mesclar(docs[path], data);
    else docs[path] = mesclar({}, data);
  }
  function aplicarUpdate(path, data) {
    if (!docs[path]) { var e = new Error("No document to update: " + path); e.code = "not-found"; throw e; }
    Object.keys(data).forEach(function (k) { gravarCampo(docs[path], k, data[k]); });
  }
  function aplicarDelete(path) {
    delete docs[path];
    Object.keys(docs).forEach(function (k) { if (k.indexOf(path + "/") === 0) delete docs[k]; });
  }
  function confirmar() { salvar(); avisarTodos(); }

  /* ---------- referências ---------- */
  function DocRef(path) {
    var partes = path.split("/");
    var ref = {
      id: partes[partes.length - 1], path: path,
      get parent() { return ColRef(partes.slice(0, -1).join("/")); },
      collection: function (sub) { return ColRef(path + "/" + sub); },
      get: function () { return Promise.resolve(DocSnap(ref)); },
      set: function (data, opts) { try { aplicarSet(path, data, opts); } catch (e) { return Promise.reject(e); } confirmar(); return Promise.resolve(); },
      update: function (data) { try { aplicarUpdate(path, data); } catch (e) { return Promise.reject(e); } confirmar(); return Promise.resolve(); },
      delete: function () { aplicarDelete(path); confirmar(); return Promise.resolve(); },
      onSnapshot: function (next, erro) {
        if (typeof next === "object" && next) { erro = next.error; next = next.next; }
        return ouvir(function () { var sn = DocSnap(ref); return { snap: sn, assinatura: JSON.stringify([sn.exists, docs[path]]) }; }, next, erro);
      },
      isEqual: function (o) { return o && o.path === path; },
    };
    return ref;
  }

  function Query(colPath, filtros, ordens, lim) {
    function resultado() {
      var prefixo = colPath + "/";
      var lista = Object.keys(docs)
        .filter(function (k) { return k.indexOf(prefixo) === 0 && k.slice(prefixo.length).indexOf("/") === -1; })
        .map(function (k) { return DocSnap(DocRef(k)); })
        .filter(function (s) {
          var d = docs[s.ref.path];
          return filtros.every(function (f) { return comparar(lerCampo(d, f.campo), f.op, f.valor); });
        });
      if (ordens.length) {
        lista.sort(function (a, b) {
          for (var i = 0; i < ordens.length; i++) {
            var o = ordens[i], va = lerCampo(docs[a.ref.path], o.campo), vb = lerCampo(docs[b.ref.path], o.campo);
            if (va === vb) continue;
            if (va === undefined || va === null) return 1;
            if (vb === undefined || vb === null) return -1;
            var r = va < vb ? -1 : 1;
            return o.dir === "desc" ? -r : r;
          }
          return 0;
        });
      }
      if (lim != null) lista = lista.slice(0, lim);
      return QuerySnap(lista);
    }
    var q = {
      where: function (campo, op, valor) { return Query(colPath, filtros.concat([{ campo: campo, op: op, valor: valor }]), ordens, lim); },
      orderBy: function (campo, dir) { return Query(colPath, filtros, ordens.concat([{ campo: campo, dir: dir || "asc" }]), lim); },
      limit: function (n) { return Query(colPath, filtros, ordens, n); },
      get: function () { return Promise.resolve(resultado()); },
      onSnapshot: function (next, erro) {
        if (typeof next === "object" && next) { erro = next.error; next = next.next; }
        return ouvir(function () { var sn = resultado(); return { snap: sn, assinatura: JSON.stringify(sn.docs.map(function (d) { return [d.id, docs[d.ref.path]]; })) }; }, next, erro);
      },
    };
    return q;
  }

  function comparar(v, op, alvo) {
    switch (op) {
      case "==": return igual(v, alvo);
      case "!=": return v !== undefined && !igual(v, alvo);
      case ">": return v != null && v > alvo;
      case ">=": return v != null && v >= alvo;
      case "<": return v != null && v < alvo;
      case "<=": return v != null && v <= alvo;
      case "array-contains": return Array.isArray(v) && v.some(function (x) { return igual(x, alvo); });
      case "array-contains-any": return Array.isArray(v) && v.some(function (x) { return alvo.some(function (y) { return igual(x, y); }); });
      case "in": return alvo.some(function (y) { return igual(v, y); });
      case "not-in": return v !== undefined && !alvo.some(function (y) { return igual(v, y); });
    }
    return false;
  }

  function ColRef(path) {
    var base = Query(path, [], [], null);
    base.id = path.split("/").pop();
    base.path = path;
    base.doc = function (id) { return DocRef(path + "/" + (id || novoId())); };
    base.add = function (data) { var r = base.doc(); return r.set(data).then(function () { return r; }); };
    return base;
  }

  function ouvir(calcular, entregar, erro) {
    var o = { ativo: true, ultima: null };
    o.disparar = function () {
      try {
        var r = calcular();
        if (r.assinatura === o.ultima) return;
        o.ultima = r.assinatura;
        entregar(r.snap);
      } catch (e) { if (erro) erro(e); else setTimeout(function () { throw e; }); }
    };
    ouvintes.push(o);
    Promise.resolve().then(function () { if (o.ativo) o.disparar(); });
    return function () { o.ativo = false; ouvintes = ouvintes.filter(function (x) { return x !== o; }); };
  }

  /* ---------- Firestore ---------- */
  var db = {
    collection: function (p) { return ColRef(p); },
    doc: function (p) { return DocRef(p); },
    enablePersistence: function () { return Promise.resolve(); },
    batch: function () {
      var ops = [];
      var b = {
        set: function (ref, data, opts) { ops.push(function () { aplicarSet(ref.path, data, opts); }); return b; },
        update: function (ref, data) { ops.push(function () { aplicarUpdate(ref.path, data); }); return b; },
        delete: function (ref) { ops.push(function () { aplicarDelete(ref.path); }); return b; },
        commit: function () {
          var copia = clonar(docs);
          try { ops.forEach(function (op) { op(); }); } catch (e) { docs = copia; return Promise.reject(e); }
          confirmar(); return Promise.resolve();
        },
      };
      return b;
    },
    runTransaction: function (fn) {
      var b = db.batch();
      var tx = {
        get: function (ref) { return Promise.resolve(DocSnap(ref)); },
        set: function (ref, d, o) { b.set(ref, d, o); return tx; },
        update: function (ref, d) { b.update(ref, d); return tx; },
        delete: function (ref) { b.delete(ref); return tx; },
      };
      return Promise.resolve(fn(tx)).then(function (r) { return b.commit().then(function () { return r; }); });
    },
  };

  /* ---------- Auth ---------- */
  function criarAuth(principal) {
    var atual = principal ? Object.assign({}, VISITANTE) : null;
    function usuario(u) {
      return Object.assign(u, {
        getIdToken: function () { return Promise.resolve("demo"); },
        reauthenticateWithCredential: function () { return Promise.resolve(); },
        updatePassword: function () { return Promise.resolve(); },
        updateEmail: function () { return Promise.resolve(); },
      });
    }
    if (atual) usuario(atual);
    return {
      languageCode: "pt-BR",
      get currentUser() { return atual; },
      onAuthStateChanged: function (cb) { Promise.resolve().then(function () { cb(atual); }); return function () {}; },
      signInWithEmailAndPassword: function () { return Promise.resolve({ user: atual }); },
      createUserWithEmailAndPassword: function (email) { return Promise.resolve({ user: usuario({ uid: "u" + novoId().slice(0, 10), email: email }) }); },
      sendPasswordResetEmail: function () { return Promise.resolve(); },
      setPersistence: function () { return Promise.resolve(); },
      signOut: function () { return Promise.resolve(); },
    };
  }
  var authPrincipal = criarAuth(true);

  /* ---------- firebase ---------- */
  var apps = [];
  var firebase = {
    apps: apps,
    initializeApp: function (config, nome) {
      nome = nome || "[DEFAULT]";
      var existente = apps.find(function (a) { return a.name === nome; });
      if (existente) return existente;
      var auth = nome === "[DEFAULT]" ? authPrincipal : criarAuth(false);
      var app = { name: nome, options: config || {}, auth: function () { return auth; }, firestore: function () { return db; }, delete: function () { return Promise.resolve(); } };
      apps.push(app);
      return app;
    },
    auth: function () { return authPrincipal; },
    firestore: function () { return db; },
    messaging: function () {
      return { getToken: function () { return Promise.resolve(""); }, onMessage: function () { return function () {}; }, deleteToken: function () { return Promise.resolve(true); } };
    },
  };
  firebase.auth.Auth = { Persistence: { LOCAL: "local", SESSION: "session", NONE: "none" } };
  firebase.auth.EmailAuthProvider = { credential: function (email, senha) { return { email: email, senha: senha }; } };
  firebase.firestore.FieldValue = FieldValue;
  window.firebase = firebase;

  window.demoStore = {
    reset: function () { docs = sementeInicial(); confirmar(); },
    exportar: function () { return clonar(docs); },
  };

  /* ---------- rede: /api/* responde localmente ---------- */
  if (!window.__fetchOriginal) window.__fetchOriginal = window.fetch;
  var original = window.__fetchOriginal;
  window.fetch = function (entrada, init) {
    var url = typeof entrada === "string" ? entrada : (entrada && entrada.url) || "";
    if (/(^|\/)api\//.test(url)) {
      var corpo = JSON.stringify(/\/api\/backups/.test(url) ? { ok: true, lista: [] } : { ok: true });
      if (typeof Response === "function") return Promise.resolve(new Response(corpo, { status: 200, headers: { "content-type": "application/json" } }));
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(corpo)); }, text: function () { return Promise.resolve(corpo); } });
    }
    return original ? original.call(window, entrada, init) : Promise.reject(new Error("sem rede na demo"));
  };
})();
