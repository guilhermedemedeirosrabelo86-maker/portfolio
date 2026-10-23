/* =========================================================
   Central Brindes · DEMO
   Selo flutuante: avisa que é demonstração, restaura os dados
   e volta ao portfólio.
   ========================================================= */
(function () {
  "use strict";

  var css = document.createElement("style");
  css.textContent = [
    ".demo-selo{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:8px;flex-wrap:wrap;max-width:calc(100vw - 32px);",
    "padding:8px 10px 8px 14px;border-radius:14px;background:#141414;color:#fff;font:500 13px/1.3 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12)}",
    ".demo-selo b{color:#FCB83F;font-weight:800;letter-spacing:.08em;font-size:11px}",
    ".demo-selo span{opacity:.85}",
    ".demo-selo button,.demo-selo a{all:unset;cursor:pointer;padding:6px 10px;border-radius:9px;background:rgba(255,255,255,.1);font-weight:600;font-size:12px;white-space:nowrap}",
    ".demo-selo button:hover,.demo-selo a:hover{background:rgba(255,255,255,.2)}",
    ".demo-selo :focus-visible{outline:2px solid #FCB83F;outline-offset:2px}",
    ".demo-selo .x{padding:6px 8px}",
    ".demo-selo.min > :not(.abrir){display:none}",
    ".demo-selo:not(.min) .abrir{display:none}",
    "@media (max-width:720px){.demo-selo{right:8px;left:8px;bottom:calc(76px + env(safe-area-inset-bottom));justify-content:center}}",
  ].join("");
  document.head.appendChild(css);

  var selo = document.createElement("div");
  selo.className = "demo-selo";
  selo.setAttribute("role", "region");
  selo.setAttribute("aria-label", "Aviso de demonstração");
  selo.innerHTML =
    '<b>DEMO</b><span>Dados fictícios · tudo fica só no seu navegador</span>' +
    '<button type="button" data-a="restaurar">Restaurar demo</button>' +
    '<a href="acompanhar.html?c=' + (window.DEMO_TOKEN_EXEMPLO || "") + '" target="_blank" rel="noopener">Página do representante</a>' +
    '<a href="../../">Voltar ao portfólio</a>' +
    '<button type="button" class="x" data-a="min" aria-label="Minimizar aviso">✕</button>' +
    '<button type="button" class="abrir" data-a="abrir" aria-label="Mostrar aviso da demonstração"><b>DEMO</b></button>';

  selo.addEventListener("click", function (e) {
    var a = e.target.closest("[data-a]");
    if (!a) return;
    if (a.dataset.a === "restaurar") {
      if (window.demoStore) window.demoStore.reset();
      location.reload();
    }
    if (a.dataset.a === "min") selo.classList.add("min");
    if (a.dataset.a === "abrir") selo.classList.remove("min");
  });

  document.body.appendChild(selo);
})();
