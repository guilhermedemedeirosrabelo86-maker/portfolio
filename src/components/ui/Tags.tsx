export function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tecnologias">
      {tags.map((tag) => (
        <li key={tag} className="rounded-md border border-line bg-white/[0.02] px-2.5 py-1 text-xs text-[#cfd2ee]">
          {tag}
        </li>
      ))}
    </ul>
  );
}
