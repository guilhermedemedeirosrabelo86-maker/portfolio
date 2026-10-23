export function SecaoTitulo({ rotulo, titulo }: { rotulo: string; titulo: string }) {
  return (
    <div className="mb-10">
      <p className="mb-2 text-xs font-bold tracking-[0.2em] text-accent uppercase">{rotulo}</p>
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{titulo}</h2>
    </div>
  );
}
