/* Central de Brindes · Login, conta, equipe (administração) e sessão com o Firebase */
"use strict";

/* =========================================================
   LOGIN · FIREBASE (usuário e senha próprios, sem claude.ai)
   - Login: Firebase Authentication (e-mail + senha). A pessoa pode
     digitar o usuário (ex.: guilherme) ou o e-mail.
   - usuarios/{usuario} guarda só o e-mail, para o login por usuário.
   - perfis/{uid}: nome, usuário, e-mail, cargo, cor, ativo, admin.
   - Senhas ficam no Firebase (nunca no banco nem no código).
   - Contas novas: só o administrador cria, na tela Equipe.
   ========================================================= */
let auth = null, fbConfig = null, unsubs = [], setupFeito = null, criandoSetup = false;
const bloqueadas = new Set();
const isAdmin = () => perfil(myId)?.admin === true;

/* ---------- utilidades de login ---------- */
function forca(s) { let n = 0; if (s.length >= 8) n++; if (/[A-Z]/.test(s) && /[a-z]/.test(s)) n++; if (/\d/.test(s)) n++; if (/[^A-Za-z0-9]/.test(s) || s.length >= 12) n++; return s ? Math.max(1, n) : 0; }
const normUser = s => norm(s).trim().replace(/\s+/g, ".");
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
function validaUsuario(u) {
  if (!/^[a-z0-9._-]{3,30}$/.test(u)) return "O usuário deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado.";
  return "";
}
function validaSenha(s, c) {
  if (s.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  if (c !== undefined && s !== c) return "As senhas não conferem.";
  return "";
}
function senhaProvisoria() {
  const a = "abcdefghjkmnpqrstuvwxyz", A = "ABCDEFGHJKMNPQRSTUVWXYZ", n = "23456789";
  const r = s => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  return r(A) + r(a) + r(a) + r(a) + r(n) + r(n) + r(n) + "@" + r(A) + r(a);
}
function authMsg(e) {
  const c = e?.code || "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return "Usuário ou senha incorretos.";
  if (/too-many-requests/.test(c)) return "Muitas tentativas. Por segurança o acesso foi pausado por alguns minutos.";
  if (/email-already-in-use/.test(c)) return "Esse e-mail já tem uma conta no sistema.";
  if (/invalid-email/.test(c)) return "E-mail inválido.";
  if (/weak-password/.test(c)) return "Senha fraca: use pelo menos 6 caracteres.";
  if (/network-request-failed/.test(c)) return "Sem internet. Verifique a conexão e tente de novo.";
  if (/requires-recent-login/.test(c)) return "Por segurança, saia e entre de novo antes de fazer isso.";
  if (/user-disabled/.test(c)) return "Essa conta foi desativada.";
  return "Não foi possível concluir. Tente de novo em instantes.";
}
async function emailDoLogin(v) {
  v = v.trim();
  if (v.includes("@")) return v.toLowerCase();
  const s = await db.collection("usuarios").doc(normUser(v)).get();
  return s.exists ? s.data().email : null;
}
const mascara = e => { const [u, d] = String(e).split("@"); return (u.length <= 2 ? u[0] + "*" : u.slice(0, 2) + "*".repeat(Math.max(1, u.length - 2))) + "@" + d; };

/* ---------- conta ---------- */
function paintMe() {
  const pf = myId ? perfil(myId) : null;
  if (myId) paintAv($("#meAv"), myId);
  const mn = $("#meNome"), mc = $("#meCargo");
  if (mn) { mn.textContent = myId ? uname(myId) : ""; mc.textContent = pf ? (pf.admin ? "Administrador" : pf.cargo || "Equipe") : ""; }
  $("#footer").innerHTML = `<span class="ft-inst">Empresa Demo · Marketing · Uso interno</span>${ic("user")}<span class="ft-user"></span><span class="ver">${VERSAO} · © ${new Date().getFullYear()} Empresa Demo</span>`;
  $("#footer .ft-user").textContent = myId && pf ? `${uname(myId)}${pf.usuario ? " (" + pf.usuario + ")" : ""}${pf.cargo ? " · " + pf.cargo : ""}${pf.admin ? " · Administrador" : ""}` : "Central de Brindes · Marketing";
}
function contaDrawer() {
  const pf = perfil(myId) || {};
  openDrawer({
    eyebrow: "Minha conta", title: uname(myId), narrow: true,
    body: `<div class="acct">${avatar(myId, "lg")}<div><b></b><small></small></div></div>
      <div class="field"><span>Tema</span><div class="seg" id="acTema" role="group" aria-label="Tema">${Object.entries(TEMAS).map(([k, l]) => `<button type="button" data-tema="${k}" aria-pressed="${temaSalvo() === k}">${ic(k === "auto" ? "auto" : k === "light" ? "sun" : "moon", "i-sm")}${l}</button>`).join("")}</div><small>Automático segue o tema do seu computador ou celular.</small></div>
      <div class="menu-list">
        <button class="btn" id="acNotif">${ic("bell")}${notifStatus()}</button>
        ${"Notification" in window && Notification.permission === "granted" ? `<button class="btn" id="acTeste">${ic("bell")}Mandar notificação de teste</button>${isAdmin() ? `<button class="btn" id="acTesteCorreio">${ic("phone")}Testar lembrete do Correio</button>` : ""}` : ""}
        <button class="btn" id="acInstall">${ic("install")}Instalar o app neste aparelho</button>
        <button class="btn" id="acDisp">${ic("device")}Acessar em outro dispositivo</button>
        ${isAdmin() ? `<button class="btn" id="acBackups">${ic("db")}Backups automáticos</button><button class="btn" id="acBackup">${ic("download")}Baixar backup dos dados</button><button class="btn" id="acRem">${ic("print")}Dados do remetente (Correios)</button>` : ""}
        <button class="btn" id="acPerfil">${ic("user")}Editar perfil</button>
        <button class="btn" id="acSenha">${ic("shield")}Trocar senha</button>
        <button class="btn danger" id="acSair">${ic("arrow")}Sair do sistema</button>
      </div>`,
    onMount(ov) {
      $(".acct b", ov).textContent = uname(myId);
      $(".acct small", ov).textContent = `@${pf.usuario || ""} · ${pf.email || ""}${pf.admin ? " · Administrador" : ""}`;
      $$("[data-tema]", ov).forEach(b => b.onclick = () => { aplicarTema(b.dataset.tema); $$("[data-tema]", ov).forEach(x => x.setAttribute("aria-pressed", x.dataset.tema === b.dataset.tema)); });
      $("#acDisp").onclick = dispositivosDrawer;
      $("#acInstall").onclick = () => { closeDrawer(); instalarApp(); };
      $("#acNotif").onclick = () => { closeDrawer(); ativarNotificacoes(true); };
      const ts = $("#acTeste"); if (ts) ts.onclick = () => { closeDrawer(); testarNotificacao(); };
      const tc = $("#acTesteCorreio"); if (tc) tc.onclick = () => { closeDrawer(); testarNotificacao("correio"); };
      const bk = $("#acBackup"); if (bk) bk.onclick = () => { closeDrawer(); baixarBackup(); };
      const bks = $("#acBackups"); if (bks) bks.onclick = () => { closeDrawer(); backupsDrawer(); };
      const rm = $("#acRem"); if (rm) rm.onclick = () => { closeDrawer(); remetenteDrawer(); };
      $("#acPerfil").onclick = () => { closeDrawer(); perfilGate(); };
      $("#acSenha").onclick = () => { closeDrawer(); senhaGate(); };
      $("#acSair").onclick = () => { closeDrawer(); sair(); };
    }
  });
}
function dispositivosDrawer() {
  const link = location.href.split("#")[0];
  const step = (n, t, d) => `<div class="li" style="align-items:flex-start;padding-inline:0"><span class="m-ico g-blue" style="width:30px;height:30px;border-radius:9px;font-weight:800">${n}</span><div class="grow"><div class="t" style="white-space:normal">${t}</div><div class="s" style="white-space:normal;font-size:13.5px">${d}</div></div></div>`;
  openDrawer({
    eyebrow: "Minha conta", title: "Acessar em outro dispositivo", narrow: true,
    body: `<div class="field"><span>Endereço do sistema</span><div style="display:flex;gap:8px"><input class="input mono" id="dvLink" readonly value="${esc(link)}"><button class="btn" id="dvCopy">${ic("link")}Copiar</button></div></div>
      <div class="section-t">No celular ou em outro computador</div>
      ${step(1, "Abra o endereço no navegador", "Chrome, Edge, Safari… Pode mandar para você mesmo pelo WhatsApp ou e-mail.")}
      ${step(2, "Entre com seu usuário e senha", "Marque “Manter conectado” se o aparelho for só seu.")}
      ${step(3, "No celular, adicione à tela inicial", "No menu do navegador (⋮ no Android ou Compartilhar no iPhone), toque em “Adicionar à tela inicial”. Fica como um app.")}
      <div class="banner" style="background:var(--sep-bg);color:var(--sep)">${ic("equipe")}<span>Para outra pessoa da equipe acessar, um administrador cria o usuário dela na tela <b>Equipe → Adicionar pessoa</b>.</span></div>`,
    foot: `<button class="btn primary" data-close>Entendi</button>`,
    onMount() {
      $("#dvCopy").onclick = async () => { try { await navigator.clipboard.writeText(link); toast("Endereço copiado"); } catch (e) { const i = $("#dvLink"); i.focus(); i.select(); toast("Selecionei o endereço: use Ctrl+C para copiar"); } };
      $("#dvLink").onfocus = e => e.target.select();
    }
  });
}
async function sair() { closeNav(); closePalette(); try { await auth.signOut(); } catch (e) {} toast("Você saiu do sistema"); }

/* ---------- casca visual ---------- */
function gateShell(inner) {
  return `<div class="gate" role="dialog" aria-modal="true" aria-label="Entrar na Central de Brindes">
    <span class="g-orb o1" aria-hidden="true"></span><span class="g-orb o2" aria-hidden="true"></span><span class="g-orb o3" aria-hidden="true"></span>
    <section class="g-brand"><div class="g-logo"><img src="assets/logo.svg" alt="Empresa Demo" width="488" height="157"><div class="tagline"><span>Central de Brindes</span></div><div class="sub2">Estoque, envios e pedidos do Marketing</div></div></section>
    <section class="g-side"><form class="g-card" id="gForm" autocomplete="on" novalidate><span class="g-badge"><img src="assets/simbolo.svg" alt="">Marketing · Empresa Demo</span>${inner}</form></section>
    <footer class="g-foot"><span>Plataforma interna · Marketing Empresa Demo</span><span>© ${new Date().getFullYear()} Empresa Demo · Todos os direitos reservados</span></footer></div>`;
}
const gateLoading = () => gateShell(`<h2>Boas-vindas de volta</h2><p class="sub">Conectando…</p><div class="g-spin" aria-hidden="true"></div><div class="g-divider">Acesso restrito a colaboradores</div>`);
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const LOCK = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
const MAIL = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></svg>';
const fText = (id, ph, icon, val = "", attrs = "") => `<label class="g-field">${icon}<input id="${id}" placeholder="${ph}" value="${esc(val)}" aria-label="${ph}" ${attrs}></label>`;
const fUser = (id, ph, val = "", extra = "") => fText(id, ph, ic("user"), val, `autocomplete="username" autocapitalize="none" spellcheck="false" ${extra}`);
const fPass = (id, ph, ac = "current-password") => `<label class="g-field">${LOCK}<input id="${id}" type="password" placeholder="${ph}" autocomplete="${ac}" aria-label="${ph}"><button type="button" class="g-eye" data-eye="${id}" aria-label="Mostrar senha">${EYE}</button></label>`;
function bindGate(onSubmit) {
  const root = $("#gateRoot");
  $$("[data-eye]", root).forEach(b => b.onclick = () => { const i = $("#" + b.dataset.eye); i.type = i.type === "password" ? "text" : "password"; b.setAttribute("aria-label", i.type === "password" ? "Mostrar senha" : "Esconder senha"); });
  $("#gForm").onsubmit = e => { e.preventDefault(); onSubmit(); };
  const f = $("input:not([readonly])", root); if (f && !ehCelular()) f.focus();
}
function bindStrength(inputId, barId) { const i = $("#" + inputId), bar = $("#" + barId); i.addEventListener("input", () => { bar.className = "g-strength s" + forca(i.value); }); }
const strengthBar = id => `<div class="g-strength" id="${id}" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`;
const gErr = () => `<div class="g-err" id="gErr" role="alert"></div>`;
const setErr = m => { const e = $("#gErr"); if (e) e.textContent = m; };
function busy(on, label) { const b = $("#gBtn"); if (!b) return; b.disabled = on; if (label) b.textContent = on ? label : b.dataset.label; }
function lembrado() { try { return localStorage.getItem("cb-usuario") || ""; } catch (e) { return ""; } }
function lembrar(u) { try { u ? localStorage.setItem("cb-usuario", u) : localStorage.removeItem("cb-usuario"); } catch (e) {} }
const tickSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

/* ---------- telas de acesso ---------- */
function naoConfiguradoGate() {
  esconderSplash();
  $("#gateRoot").innerHTML = gateShell(`<h2>Quase lá</h2><p class="sub">O sistema ainda não foi ligado ao banco de dados.</p>
    <div class="g-note">${ic("alert")}<span>Preencha o arquivo <b>js/firebase-config.js</b> com as chaves do seu projeto Firebase, seguindo o guia <b>COMO-INSTALAR.md</b>.</span></div>
    <div class="g-divider">Acesso restrito a colaboradores</div>`);
}
function loginGate(msg) {
  esconderSplash();
  const hr = new Date().getHours(), oi = hr < 12 ? "Bom dia" : hr < 18 ? "Boa tarde" : "Boa noite";
  $("#gateRoot").innerHTML = gateShell(`<h2>${oi}, que bom ver você</h2><p class="sub">Entre com seu usuário e senha para continuar</p>
    ${fUser("lgUser", "Usuário ou e-mail", lembrado())}
    ${fPass("lgPass", "Senha")}
    <div class="g-caps" id="lgCaps" hidden>${ic("alert")}Caps Lock ligado</div>
    <div class="g-row2"><label class="g-check"><input type="checkbox" id="lgManter"${lembrado() ? " checked" : ""}>Manter conectado</label><button type="button" class="g-link" id="lgEsqueci">Esqueci minha senha</button></div>
    ${gErr()}
    <button class="g-btn" id="gBtn" data-label="Entrar">Entrar</button>
    <div class="g-divider">Acesso restrito a colaboradores</div>`);
  if (msg) setErr(msg);
  bindGate(async () => {
    const v = $("#lgUser").value.trim(), s = $("#lgPass").value;
    if (!v || !s) { setErr("Preencha usuário e senha."); return; }
    busy(true, "Entrando…"); setErr("");
    try {
      const email = await emailDoLogin(v);
      if (!email) throw { code: "auth/invalid-credential" };
      const manter = $("#lgManter").checked;
      await auth.setPersistence(manter ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);
      lembrar(manter ? v : "");
      entrouAgora = true;
      await auth.signInWithEmailAndPassword(email, s);
    } catch (e) { entrouAgora = false; busy(false, true); setErr(authMsg(e)); $("#lgPass").value = ""; $("#lgPass").focus(); }
  });
  $("#lgEsqueci").onclick = () => esqueciGate($("#lgUser").value);
  const caps = ev => { if (ev.getModifierState) $("#lgCaps").hidden = !ev.getModifierState("CapsLock"); };
  $("#lgPass").addEventListener("keydown", caps); $("#lgPass").addEventListener("keyup", caps);
  if (lembrado() && !ehCelular()) $("#lgPass").focus();
}
function esqueciGate(pre = "") {
  $("#gateRoot").innerHTML = gateShell(`<h2>Esqueceu a senha?</h2><p class="sub">Enviamos um link para você criar uma senha nova.</p>
    ${fUser("esUser", "Usuário ou e-mail", pre)}
    ${gErr()}
    <button class="g-btn" id="gBtn" data-label="Enviar link por e-mail">Enviar link por e-mail</button>
    <button type="button" class="g-ghost" id="esVoltar">Voltar para o login</button>
    <div class="g-divider">Acesso restrito a colaboradores</div>`);
  $("#esVoltar").onclick = () => loginGate();
  bindGate(async () => {
    const v = $("#esUser").value.trim(); if (!v) { setErr("Informe seu usuário ou e-mail."); return; }
    busy(true, "Enviando…");
    try {
      const email = await emailDoLogin(v);
      if (email) await auth.sendPasswordResetEmail(email);
      $("#gateRoot").innerHTML = gateShell(`<h2>Verifique seu e-mail</h2><p class="sub">Se esse usuário existir, enviamos um link para ${email ? `<b>${esc(mascara(email))}</b>` : "o e-mail cadastrado"}.</p>
        <div class="g-note" style="background:rgba(59,130,246,.1);color:#93C5FD">${MAIL}<span>Abra o e-mail, clique no link e crie a senha nova. Não achou? Olhe a caixa de spam ou peça ao administrador.</span></div>
        <button type="button" class="g-btn" id="gBtn" data-label="Voltar para o login">Voltar para o login</button>`);
      $("#gBtn").onclick = () => loginGate();
    } catch (e) { busy(false, true); setErr(authMsg(e)); }
  });
}
function setupGate() {
  esconderSplash();
  let cor = CORES[0];
  $("#gateRoot").innerHTML = gateShell(`<h2>Configuração inicial</h2><p class="sub">Crie a conta do administrador. Ela vai cadastrar o restante da equipe.</p>
    ${fText("suNome", "Nome completo", ic("edit"), "", 'autocomplete="name"')}
    ${fText("suCargo", "Cargo ou função", ic("flag"))}
    ${fUser("suUser", "Usuário para entrar (ex.: guilherme)")}
    ${fText("suEmail", "E-mail (para recuperar a senha)", MAIL, "", 'type="email" autocomplete="email"')}
    ${fPass("suPass", "Crie uma senha", "new-password")}${strengthBar("suBar")}
    ${fPass("suConf", "Confirme a senha", "new-password")}
    ${gErr()}
    <button class="g-btn" id="gBtn" data-label="Criar administrador e entrar">Criar administrador e entrar</button>
    <div class="g-divider">Só aparece na primeira vez</div>`);
  bindStrength("suPass", "suBar");
  bindGate(async () => {
    const nome = $("#suNome").value.trim().replace(/\s+/g, " "), usuario = normUser($("#suUser").value), email = $("#suEmail").value.trim().toLowerCase();
    const s = $("#suPass").value, c = $("#suConf").value;
    if (nome.length < 2) return setErr("Digite seu nome.");
    const mu = validaUsuario(usuario); if (mu) return setErr(mu);
    if (!emailOk(email)) return setErr("Digite um e-mail válido.");
    const ms = validaSenha(s, c); if (ms) return setErr(ms);
    busy(true, "Criando…");
    criandoSetup = true;
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, s);
      const uid = cred.user.uid, b = db.batch();
      b.set(db.collection("perfis").doc(uid), { nome, usuario, email, cargo: $("#suCargo").value.trim(), cor, ativo: true, admin: true, criadoEm: Date.now() });
      b.set(db.collection("usuarios").doc(usuario), { email, uid });
      b.set(db.collection("config").doc("setup"), { admin: uid, em: Date.now() });
      await b.commit();
      setupFeito = true; criandoSetup = false;
      lembrar(usuario);
      entrouAgora = true;
      iniciarSessao(cred.user);
      toast(`Tudo pronto, ${nome.split(" ")[0]}! Você é o administrador.`);
    } catch (e) {
      criandoSetup = false; busy(false, true);
      if (auth.currentUser) { try { await auth.currentUser.delete(); } catch (x) {} }
      setErr(e?.code?.startsWith("auth/") ? authMsg(e) : "Não foi possível concluir a configuração. Confira se as regras do banco (firestore.rules) foram publicadas.");
    }
  });
}
function perfilGate() {
  const pf = perfil(myId) || {};
  let cor = pf.cor || CORES[0];
  $("#gateRoot").innerHTML = gateShell(`<h2>Editar perfil</h2><p class="sub">Altere como a equipe vê você.</p>
    <div class="g-preview"><span class="av lg" id="pvAv"></span><div class="who"><b id="pvNome"></b><small id="pvCargo"></small></div></div>
    ${fText("pfNome", "Nome completo", ic("edit"), pf.nome || "", 'autocomplete="name"')}
    ${fText("pfCargo", "Cargo ou função", ic("flag"), pf.cargo || "")}
    <div class="g-label">Cor do perfil</div>
    <div class="g-swatches">${CORES.map(c => `<button type="button" style="background:${c}" data-cor="${c}" aria-pressed="${c === cor}" aria-label="Cor ${c}">${tickSvg}</button>`).join("")}</div>
    <div class="g-help">Usuário: <b>@${esc(pf.usuario || "")}</b> · ${esc(pf.email || "")}. Para mudar, fale com o administrador.</div>
    ${gErr()}
    <button class="g-btn" id="gBtn" data-label="Salvar perfil">Salvar perfil</button>
    <button type="button" class="g-ghost" id="pfCancel">Cancelar</button>`);
  const root = $("#gateRoot");
  const pv = () => { const n = $("#pfNome").value.trim() || "Seu nome"; $("#pvNome").textContent = n; $("#pvCargo").textContent = `@${pf.usuario || ""} · ${$("#pfCargo").value.trim() || "Cargo"}`; const a = $("#pvAv"); a.textContent = initials(n); a.style.background = cor; };
  pv(); ["pfNome", "pfCargo"].forEach(id => $("#" + id).addEventListener("input", pv));
  $$("[data-cor]", root).forEach(b => b.onclick = () => { cor = b.dataset.cor; $$("[data-cor]", root).forEach(x => x.setAttribute("aria-pressed", x.dataset.cor === cor)); pv(); });
  $("#pfCancel").onclick = () => { root.innerHTML = ""; };
  bindGate(async () => {
    const nome = $("#pfNome").value.trim().replace(/\s+/g, " ");
    if (nome.length < 2) return setErr("Digite seu nome.");
    busy(true, "Salvando…");
    if (await save(() => col("perfis").doc(myId).update({ nome, cargo: $("#pfCargo").value.trim(), cor, atualizadoEm: Date.now() }), "Perfil atualizado")) root.innerHTML = "";
    else busy(false, true);
  });
}
function senhaGate() {
  const pf = perfil(myId) || {};
  $("#gateRoot").innerHTML = gateShell(`<h2>Trocar senha</h2><p class="sub">Confirme a senha atual e escolha a nova.</p>
    ${fUser("snUser", "Usuário", pf.usuario || "", "readonly")}
    ${fPass("snAtual", "Senha atual")}
    ${fPass("snNova", "Nova senha", "new-password")}${strengthBar("snBar")}
    ${fPass("snConf", "Confirme a nova senha", "new-password")}
    <div class="g-help">Mínimo de 6 caracteres. Use letras, números e símbolos para ficar mais forte.</div>
    ${gErr()}
    <button class="g-btn" id="gBtn" data-label="Salvar nova senha">Salvar nova senha</button>
    <button type="button" class="g-ghost" id="snCancel">Cancelar</button>`);
  bindStrength("snNova", "snBar");
  $("#snCancel").onclick = () => { $("#gateRoot").innerHTML = ""; };
  bindGate(async () => {
    const nova = $("#snNova").value, m = validaSenha(nova, $("#snConf").value); if (m) return setErr(m);
    busy(true, "Salvando…");
    try {
      const u = auth.currentUser;
      await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, $("#snAtual").value));
      await u.updatePassword(nova);
      $("#gateRoot").innerHTML = ""; toast("Senha alterada");
    } catch (e) { busy(false, true); setErr(/invalid-credential|wrong-password/.test(e?.code || "") ? "A senha atual está incorreta." : authMsg(e)); }
  });
}

/* ---------- administração da equipe ---------- */
function novaPessoaDrawer() {
  const provisoria = senhaProvisoria();
  openDrawer({
    eyebrow: "Equipe", title: "Adicionar pessoa", narrow: true,
    body: `<label class="field"><span>Nome completo</span><input class="input" id="npNome"></label>
      <div class="row2"><label class="field"><span>Usuário</span><input class="input" id="npUser" autocapitalize="none" spellcheck="false" placeholder="ex.: ana.souza"></label>
      <label class="field"><span>Cargo</span><input class="input" id="npCargo"></label></div>
      <label class="field"><span>E-mail</span><input class="input" id="npEmail" type="email" placeholder="usado para recuperar a senha"></label>
      <label class="field"><span>Senha provisória</span><div style="display:flex;gap:8px"><input class="input mono" id="npPass" value="${provisoria}"><button type="button" class="btn" id="npGen" title="Gerar outra">${ic("undo")}</button></div><small>Passe para a pessoa. Ela pode trocar depois em Minha conta → Trocar senha.</small></label>
      <label class="g-check" style="color:var(--ink-2)"><input type="checkbox" id="npAdmin">Administrador (pode cadastrar e desativar pessoas)</label>
      <div class="err" id="npErr" role="alert"></div>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="npOk">${ic("plus")}Criar acesso</button>`,
    onMount() {
      $("#npNome").oninput = () => { if (!$("#npUser").dataset.touched) { const w = $("#npNome").value.trim().split(/\s+/); $("#npUser").value = normUser(w.length > 1 ? w[0] + " " + w[w.length - 1] : w[0] || ""); } };
      $("#npUser").oninput = e => e.target.dataset.touched = "1";
      $("#npGen").onclick = () => $("#npPass").value = senhaProvisoria();
      $("#npOk").onclick = async () => {
        const err = $("#npErr"); err.textContent = "";
        const nome = $("#npNome").value.trim().replace(/\s+/g, " "), usuario = normUser($("#npUser").value), email = $("#npEmail").value.trim().toLowerCase(), senha = $("#npPass").value;
        if (nome.length < 2) return err.textContent = "Digite o nome.";
        const mu = validaUsuario(usuario); if (mu) return err.textContent = mu;
        if (S.perfis.some(p => p.usuario === usuario)) return err.textContent = "Esse usuário já está em uso.";
        if (!emailOk(email)) return err.textContent = "Digite um e-mail válido.";
        const ms = validaSenha(senha); if (ms) return err.textContent = ms;
        $("#npOk").disabled = true;
        try {
          const sec = firebase.apps.find(a => a.name === "cadastro") || firebase.initializeApp(fbConfig, "cadastro");
          const cred = await sec.auth().createUserWithEmailAndPassword(email, senha);
          const uid = cred.user.uid; await sec.auth().signOut();
          const b = db.batch();
          b.set(db.collection("perfis").doc(uid), { nome, usuario, email, cargo: $("#npCargo").value.trim(), cor: CORES[S.perfis.length % CORES.length], ativo: true, admin: $("#npAdmin").checked, criadoEm: Date.now(), criadoPor: myId });
          b.set(db.collection("usuarios").doc(usuario), { email, uid });
          await b.commit();
          if (S.conversas.some(c => c.id === EQUIPE_ID)) col("conversas").doc(EQUIPE_ID).update({ membros: firebase.firestore.FieldValue.arrayUnion(uid) }).catch(() => { });
          closeDrawer();
          openDrawer({ eyebrow: "Equipe", title: "Acesso criado", narrow: true,
            body: `<div class="acct"><span class="av lg" style="background:var(--ok-dot)">${esc(initials(nome))}</span><div><b>${esc(nome)}</b><small>${esc(email)}</small></div></div>
              <p>Envie estes dados para a pessoa entrar:</p>
              <div class="stock-now"><div><span>Usuário</span><b class="mono" style="font-size:17px;user-select:all">${esc(usuario)}</b></div><div><span>Senha provisória</span><b class="mono" style="font-size:17px;user-select:all">${esc(senha)}</b></div></div>
              <div class="field"><span>Endereço do sistema</span><input class="input mono" readonly value="${esc(location.href.split("#")[0])}" data-seleciona></div>
              <p class="muted" style="font-size:13px">Por segurança, esta senha não fica salva em lugar nenhum. Se perder, use “Enviar redefinição de senha” na tela Equipe.</p>`,
            foot: `<button class="btn primary" data-close>Pronto</button>`, onMount(ov) { $$("[data-seleciona]", ov).forEach(i => i.onfocus = () => i.select()); } });
        } catch (e) { $("#npOk").disabled = false; err.textContent = e?.code?.startsWith("auth/") ? authMsg(e) : errMsg(e); }
      };
    }
  });
}
async function enviarRedefinicao(pf) {
  try { await auth.sendPasswordResetEmail(pf.email); toast(`Link de nova senha enviado para ${mascara(pf.email)}`); }
  catch (e) { toast(authMsg(e), "err"); }
}

/* ---------- dados iniciais (vindos do sistema anterior) ---------- */
async function importarDados(btn) {
  if (btn) btn.disabled = true;
  try {
    const d = await (await fetch("data/dados-iniciais.json", { cache: "no-store" })).json();
    const b = db.batch(); let n = 0;
    for (const { id, ...x } of d.itens || []) { b.set(db.collection("itens").doc(id), x); n++; }
    for (const { id, ...x } of d.movimentos || []) { b.set(db.collection("movimentos").doc(id), { ...x, por: myId }); n++; }
    for (const { id, ...x } of d.representantes || []) { b.set(db.collection("representantes").doc(id), x); n++; }
    await b.commit();
    toast(`${n} registros importados`);
  } catch (e) { if (btn) btn.disabled = false; toast("Não foi possível importar: " + errMsg(e), "err"); }
}

/* ---------- animações de abertura e de entrada ---------- */
let entrouAgora = false;
const T_ABERTURA = 0; // tempo contado desde que a página começou a abrir
const quandoPronto = (fn, limite = 5000, t0 = performance.now()) => (!loading() || performance.now() - t0 > limite) ? fn() : setTimeout(() => quandoPronto(fn, limite, t0), 120);
// some depois que a tela por baixo já foi desenhada (dois quadros), para a animação não brigar com o app
const MENOS_MOV = matchMedia("(prefers-reduced-motion: reduce)").matches;
function sumir(el, ms) {
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(async () => {
    el.style.pointerEvents = "none";
    const trava = setTimeout(() => el.remove(), 900); // remove de qualquer jeito, mesmo se o navegador não avisar o fim da animação
    try {
      const fim = { easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" };
      if (!MENOS_MOV) el.firstElementChild?.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.05)" }], { ...fim, duration: 280 });
      await el.animate([{ opacity: 1 }, { opacity: 0 }], { ...fim, duration: MENOS_MOV ? 200 : 380, delay: MENOS_MOV ? 0 : 140 }).finished;
    } catch (x) { /* navegador sem animações: só remove */ }
    clearTimeout(trava); el.remove();
  }, ms)));
}
// abertura: fica pelo menos ~0,7s (para não piscar) e, com a pessoa já logada, espera os dados chegarem
function esconderSplash(esperarDados) {
  const sp = $("#splash"); if (!sp || sp.dataset.saindo) return;
  sp.dataset.saindo = "1";
  const sair = () => sumir(sp, Math.max(0, 700 - (performance.now() - T_ABERTURA)));
  esperarDados ? quandoPronto(sair) : sair();
}
setTimeout(() => esconderSplash(), 8000); // segurança: nunca fica presa
// entrada pelo login: símbolo e saudação sobre o vermelho da marca, depois esmaece revelando o app
function boasVindas(nome) {
  const el = document.createElement("div");
  el.className = "bv"; el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<div class="bv-in"><span class="bv-logo"><img src="assets/simbolo.svg" alt=""></span><b></b></div>`;
  $("b", el).textContent = `Olá, ${String(nome || "").split(" ")[0] || "bem-vindo"}!`;
  document.body.appendChild(el);
  const t0 = performance.now();
  quandoPronto(() => sumir(el, Math.max(0, 1000 - (performance.now() - t0))));
}

/* ---------- sessão ---------- */
function pararDados() { bloqueadas.clear(); unsubs.forEach(u => { try { u(); } catch (e) {} }); unsubs = []; COLS.forEach(k => { S[k] = []; loaded[k] = false; }); }
let REM = null;
function iniciarDados() {
  pararDados();
  // confirmações de recebimento vindas da página pública (precisa das regras novas; sem elas, só não aparece)
  unsubs.push(db.collection("acompanhamento").where("recebidoEm", ">", 0).onSnapshot(s => { RECEB = s.docs.map(x => ({ id: x.id, ...x.data() })); aplicarRecebimentos(); }, () => { }));
  for (const k of COLS) {
    if (k === "conversas") { loaded[k] = true; continue; }   // aba Conversas retirada a pedido: não lê mais as mensagens
    if (k === COLS[0]) unsubs.push(db.doc("config/remetente").onSnapshot(sn => { REM = sn.exists ? sn.data() : null; }, () => { }));
    const fonte = k === "conversas" ? col(k).where("membros", "array-contains", myId) : col(k);
    unsubs.push(fonte.onSnapshot(s => {
      S[k] = s.docs.map(x => ({ id: x.id, ...x.data() })); loaded[k] = true;
      if (k === "envios" || k === "itens") agendarSyncPublico();
      if (k === "envios") aplicarRecebimentos();
      if (k === "conversas" || k === "perfis") garantirEquipe();
      if (k === "conversas") { const n = naoLidas(); document.title = n ? `(${n}) Central de Brindes` : "Central de Brindes"; if (tab === "chat" && CH.aberta) marcarLida(CH.aberta); }
      if (k === "perfis") { paintMe(); const me = perfil(myId); if (me && me.ativo === false) { sair(); } }
      scheduleRender();
    }, err => {
      if (err?.code !== "permission-denied") return;
      if (k === "perfis") { toast("Seu acesso foi removido.", "err"); sair(); return; }
      // outra coleção recusada (ex.: regras do banco ainda não publicadas): não desconecta, só avisa na tela
      S[k] = []; loaded[k] = true; bloqueadas.add(k); scheduleRender();
    }));
  }
}
async function iniciarSessao(u) {
  myId = u.uid;
  let me = null;
  try { const s = await col("perfis").doc(myId).get(); me = s.exists ? { id: s.id, ...s.data() } : null; } catch (e) { me = null; }
  if (!me || me.ativo === false) {
    await auth.signOut().catch(() => {});
    loginGate(me ? "Seu acesso foi desativado. Fale com o administrador." : "Essa conta não tem acesso à Central de Brindes. Fale com o administrador.");
    return;
  }
  S.perfis = [me];
  iniciarDados();
  setTimeout(() => ativarNotificacoes(false), 2500);
  paintMe();
  if (entrouAgora) { entrouAgora = false; boasVindas(me.nome); }
  $("#gateRoot").innerHTML = "";
  go(tab);
  esconderSplash(true);
}
