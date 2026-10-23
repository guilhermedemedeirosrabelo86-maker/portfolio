import { describe, expect, test } from "vitest";
import { mailtoUrl, whatsappUrl } from "./links";

describe("links de contato", () => {
  test("whatsappUrl monta o link wa.me com a mensagem codificada", () => {
    expect(whatsappUrl("5548998230477", "Olá, Guilherme!")).toBe(
      "https://wa.me/5548998230477?text=Ol%C3%A1%2C%20Guilherme!",
    );
  });

  test("mailtoUrl monta o link de e-mail", () => {
    expect(mailtoUrl("a@b.com")).toBe("mailto:a@b.com");
  });
});
