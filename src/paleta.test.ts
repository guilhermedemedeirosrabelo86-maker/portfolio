import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

// Paleta preto + âmbar: nenhuma cor da paleta antiga azul/roxa pode sobrar.
const ANTIGAS = [
  /#3b82f6/i, /#8b5cf6/i, /#3b5bf6/i, /#6d4cf0/i, /#080a1a/i, /#0e1130/i, /#232856/i,
  /#9da2c8/i, /#e8eaf6/i, /#cfd2ee/i, /#b4b8d6/i, /#a78bfa/i, /#a5b4fc/i, /#262a55/i,
  /indigo-\d/, /brand-(blue|purple)/, /rgb\(139 92 246/, /rgb\(99 102 241/, /rgb\(59 63 160/,
];

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return /\.(tsx?|css)$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

test("nenhuma cor da paleta antiga no código", () => {
  const sobras = arquivos("src").flatMap((arquivo) => {
    const texto = readFileSync(arquivo, "utf8");
    return ANTIGAS.filter((re) => re.test(texto)).map((re) => `${arquivo}: ${re}`);
  });
  expect(sobras).toEqual([]);
});
