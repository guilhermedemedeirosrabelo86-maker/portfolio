import { TechIcon } from "./TechIcon";

export function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Tecnologias">
      {tags.map((tag) => (
        <li
          key={tag}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white/[0.02] px-2.5 py-1 text-xs text-[#cfd2ee]"
        >
          <TechIcon nome={tag} className="h-3.5 w-3.5 shrink-0" />
          {tag}
        </li>
      ))}
    </ul>
  );
}
