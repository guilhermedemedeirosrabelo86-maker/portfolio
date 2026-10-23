import { describe, expect, test } from "vitest";
import { site } from "@/content/site";
import robots from "./robots";
import sitemap from "./sitemap";

describe("SEO", () => {
  test("sitemap lista as duas páginas com a URL base", () => {
    expect(sitemap().map((e) => e.url)).toEqual([site.url, `${site.url}/projetos/central-brindes`]);
  });

  test("robots libera tudo e aponta o sitemap", () => {
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toBe(`${site.url}/sitemap.xml`);
  });
});
