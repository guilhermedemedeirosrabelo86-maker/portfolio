/* eslint-disable @typescript-eslint/no-explicit-any */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";

const RAIZ = join(process.cwd(), "public/demo/central-brindes");
const PROIBIDOS = [/anjo/i, /AIza/, /firebaseapp\.com/i, /workers\.dev/i, /gstatic\.com\/firebasejs/i, /controle-brindes/i, /brindes-anjotintas/i];
const TEXTO = /\.(html|js|css|json|webmanifest|txt|svg)$/;

function arquivos(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const c = join(dir, n);
    return statSync(c).isDirectory() ? arquivos(c) : [c];
  });
}
const todos = () => arquivos(RAIZ);
const ler = (c: string) => readFileSync(c, "utf8");

describe("arquivos da demo", () => {
  test("a demo existe", () => {
    expect(existsSync(join(RAIZ, "index.html"))).toBe(true);
    expect(existsSync(join(RAIZ, "acompanhar.html"))).toBe(true);
  });

  test("sem marca, chaves ou endereços da empresa", () => {
    const achados = todos().flatMap((c) => {
      const nome = relative(RAIZ, c);
      const noNome = PROIBIDOS.filter((re) => re.test(nome)).map((re) => `${nome} (nome): ${re}`);
      const noConteudo = TEXTO.test(c) ? PROIBIDOS.filter((re) => re.test(ler(c))).map((re) => `${nome}: ${re}`) : [];
      return [...noNome, ...noConteudo];
    });
    expect(achados).toEqual([]);
  });

  test("sem caminhos absolutos que quebram no subcaminho", () => {
    const re = /(src|href)="\/(?!\/)|fetch\(\s*["'`]\/(?!api\/)|location\.(href|pathname)\s*=\s*["'`]\//g;
    const achados = todos()
      .filter((c) => /\.(html|js)$/.test(c))
      .flatMap((c) => (ler(c).match(re) || []).map((m) => `${relative(RAIZ, c)}: ${m}`));
    expect(achados).toEqual([]);
  });

  test("sem service worker registrado", () => {
    const achados = todos().filter((c) => /\.(html|js)$/.test(c) && /serviceWorker\.register/.test(ler(c)));
    expect(achados.map((c) => relative(RAIZ, c))).toEqual([]);
  });

  test("ordem dos scripts", () => {
    for (const pagina of ["index.html", "acompanhar.html"]) {
      const html = ler(join(RAIZ, pagina));
      const pos = (s: string) => html.indexOf(s);
      expect(pos("js/firebase-demo.js"), pagina).toBeGreaterThan(-1);
      expect(pos("js/demo-seed.js"), pagina).toBeGreaterThan(-1);
      expect(pos("js/demo-seed.js")).toBeLessThan(pos("js/firebase-demo.js"));
      expect(html).not.toMatch(/firebase-config\.js/);
    }
    const index = ler(join(RAIZ, "index.html"));
    expect(index.indexOf("js/firebase-demo.js")).toBeLessThan(index.indexOf("js/app/01-base.js"));
    expect(index).toMatch(/js\/demo-ui\.js/);
  });

  test("semente coerente e fictícia", () => {
    const w: any = {};
    new Function("window", ler(join(RAIZ, "js/demo-seed.js")))(w);
    const s = w.criarSeedDemo();
    expect(s.perfis.visitante).toMatchObject({ admin: true, ativo: true });
    expect(Object.keys(s.itens).length).toBeGreaterThanOrEqual(20);
    expect(Object.keys(s.representantes).length).toBeGreaterThanOrEqual(6);
    const status = new Set(Object.values<any>(s.envios).map((e) => e.status));
    for (const st of ["pendente", "separado", "entregue", "cancelado"]) expect(status.has(st), st).toBe(true);
    expect(s.config.setup).toBeTruthy();
    const emails = JSON.stringify(s).match(/[\w.+-]+@[\w.-]+/g) || [];
    expect(emails.filter((e) => !/@(demo\.local|exemplo\.com)$/.test(e))).toEqual([]);
  });
});
