import { describe, expect, test } from "vitest";
import { calcularIdade } from "./idade";

describe("calcularIdade", () => {
  test("depois do aniversário no ano", () => {
    expect(calcularIdade("2006-03-03", new Date(2026, 9, 23))).toBe(20);
  });

  test("antes do aniversário no ano", () => {
    expect(calcularIdade("2006-03-03", new Date(2027, 2, 2))).toBe(20);
  });

  test("no dia do aniversário", () => {
    expect(calcularIdade("2006-03-03", new Date(2027, 2, 3))).toBe(21);
  });
});
