import { expect, test } from "vitest";
import { metadata } from "./page";

test("estudo de caso tem canonical e Open Graph próprios", () => {
  expect(metadata.alternates?.canonical).toBe("/projetos/central-brindes");
  expect(metadata.openGraph?.url).toBe("/projetos/central-brindes");
  expect(metadata.openGraph?.title).toBe("Central Brindes · Guilherme Rabelo");
});

test("estudo de caso mantém a imagem de compartilhamento", () => {
  expect(JSON.stringify(metadata.openGraph?.images)).toContain("/opengraph-image");
  expect(JSON.stringify(metadata.twitter?.images)).toContain("/opengraph-image");
});
