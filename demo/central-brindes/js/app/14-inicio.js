/* Central de Brindes · Partida do sistema */
"use strict";

/* =========================================================
   INÍCIO
   ========================================================= */
$("#gateRoot").innerHTML = gateLoading();
$("#menuBtn").onclick = alternarMenu;
$("#searchBtn").onclick = openPalette;
$("#quickBtn").onclick = e => menuCriar(e.currentTarget);
$("#helpBtn").onclick = helpDrawer;
$("#themeBtn").onclick = alternarTema;
aplicarTema(temaSalvo());
$("#meBtn").onclick = () => myId ? contaDrawer() : null;
paintMe();
renderNav();
go(tab);
// veio do lembrete das 11h30 (link com ?correio): abre o "Chamar o Correio" quando os envios carregarem
if (new URLSearchParams(location.search).has("correio")) {
  history.replaceState(null, "", location.pathname + location.hash);
  const t = setInterval(() => { if (myId && loaded.envios) { clearInterval(t); chamarCorreio(); } }, 400);
  setTimeout(() => clearInterval(t), 60000);
}
// veio do aviso "hora de comprar" (link com ?compras): abre a lista de compras quando o estoque carregar
if (new URLSearchParams(location.search).has("compras")) {
  history.replaceState(null, "", location.pathname + location.hash);
  const t = setInterval(() => { if (myId && loaded.itens && loaded.movimentos && loaded.envios) { clearInterval(t); listaComprasDrawer(); } }, 400);
  setTimeout(() => clearInterval(t), 60000);
}
(async () => {
  fbConfig = window.FIREBASE_CONFIG;
  if (!window.firebase || !fbConfig || !fbConfig.apiKey || /COLE/.test(fbConfig.apiKey)) { naoConfiguradoGate(); return; }
  firebase.initializeApp(fbConfig);
  auth = firebase.auth(); auth.languageCode = "pt-BR";
  db = firebase.firestore();
  try { await db.enablePersistence({ synchronizeTabs: true }); } catch (e) {} // cache local: abre mais rápido e economiza leituras
  try { setupFeito = (await db.collection("config").doc("setup").get()).exists; } catch (e) { setupFeito = true; }
  auth.onAuthStateChanged(u => {
    if (criandoSetup) return;
    if (u) { if (auth.currentUser && myId !== u.uid) iniciarSessao(u); return; }
    myId = null; pararDados(); paintMe(); closeDrawer(); fecharMenu(); sepFechar(); closePalette(); $("#scanRoot").innerHTML = ""; SEL.on = false; SEL.ids.clear(); renderSelBar();
    setupFeito === false ? setupGate() : loginGate();
  });
})();
