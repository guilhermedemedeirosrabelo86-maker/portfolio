// nascimento no formato AAAA-MM-DD
export function calcularIdade(nascimento: string, hoje: Date): number {
  const [ano, mes, dia] = nascimento.split("-").map(Number);
  const jaFezAniversario =
    hoje.getMonth() + 1 > mes || (hoje.getMonth() + 1 === mes && hoje.getDate() >= dia);
  return hoje.getFullYear() - ano - (jaFezAniversario ? 0 : 1);
}
