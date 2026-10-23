import { readFileSync } from "node:fs";
import { join } from "node:path";

export const CHAVE = "cb-demo-v1";
const arquivo = join(process.cwd(), "public/demo/central-brindes/js/firebase-demo.js");

type W = Record<string, unknown>;

// Roda o firebase-demo.js como script clássico no window do jsdom.
// limpar=true apaga o localStorage antes (primeira visita).
export function carregarShim({ limpar = true }: { limpar?: boolean } = {}) {
  const w = window as unknown as W;
  if (limpar) localStorage.clear();
  delete w.firebase;
  delete w.demoStore;
  (0, eval)(readFileSync(arquivo, "utf8"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { firebase: w.firebase as any, demoStore: w.demoStore as any };
}
