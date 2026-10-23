"use client";

import { useSyncExternalStore } from "react";
import { calcularIdade } from "@/lib/idade";

const semAssinatura = () => () => {};

// Calculada no navegador, para a idade estar sempre certa mesmo com a página gerada no build.
export function Idade({ nascimento }: { nascimento: string }) {
  const idade = useSyncExternalStore(
    semAssinatura,
    () => calcularIdade(nascimento, new Date()),
    () => null,
  );
  if (idade === null) return null;
  return <>{idade} anos</>;
}
