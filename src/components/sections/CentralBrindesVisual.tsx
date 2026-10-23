// Miniatura ilustrativa do Central Brindes, com dados fictícios.
const itens = [
  { nome: "Caneta personalizada", qtd: 340, pct: 85 },
  { nome: "Ecobag", qtd: 120, pct: 48 },
  { nome: "Caderno", qtd: 64, pct: 30 },
  { nome: "Boné", qtd: 12, pct: 8, baixo: true },
];

const envios = [
  { destino: "Representante · SC", status: "Entregue", cor: "bg-emerald-400/15 text-emerald-300" },
  { destino: "Representante · PR", status: "Separado", cor: "bg-sky-400/15 text-sky-300" },
  { destino: "Representante · RS", status: "Pendente", cor: "bg-amber-400/15 text-amber-300" },
];

export function CentralBrindesVisual({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Ilustração do painel do Central Brindes com dados fictícios"
      className={`overflow-hidden rounded-xl border border-line bg-gradient-to-br from-[#1c1c1f] to-[#111113] p-4 text-[11px] ${className}`}
    >
      <div aria-hidden="true">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold text-white">Estoque</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-muted">dados fictícios</span>
        </div>
        <ul className="space-y-2">
          {itens.map((i) => (
            <li key={i.nome}>
              <div className="mb-1 flex justify-between text-soft">
                <span>{i.nome}</span>
                <span className={i.baixo ? "font-semibold text-amber-300" : ""}>{i.qtd}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${i.baixo ? "bg-amber-400" : "bg-gradient-brand"}`}
                  style={{ width: `${i.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 mb-2 font-semibold text-white">Envios</div>
        <ul className="space-y-1.5">
          {envios.map((e) => (
            <li key={e.destino} className="flex items-center justify-between rounded-md bg-white/[0.04] px-2 py-1.5">
              <span className="text-soft">{e.destino}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${e.cor}`}>{e.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
