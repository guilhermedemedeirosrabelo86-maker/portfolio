import {
  siCloudflareworkers,
  siCss,
  siFirebase,
  siGit,
  siGithub,
  siHtml5,
  siJavascript,
  siNextdotjs,
  siPython,
  siReact,
  siSqlite,
  siTailwindcss,
  siTypescript,
} from "simple-icons";

type Icone = { path: string; hex: string };

// Ícone genérico de banco de dados (SQL não tem logo de marca).
const banco: Icone = {
  hex: "8B5CF6",
  path: "M12 2C7.03 2 3 3.57 3 5.5v13C3 20.43 7.03 22 12 22s9-1.57 9-3.5v-13C21 3.57 16.97 2 12 2Zm0 2c4.42 0 7 1.3 7 1.5S16.42 7 12 7 5 5.7 5 5.5 7.58 4 12 4ZM5 8.1C6.6 8.68 9.15 9 12 9s5.4-.32 7-.9V12c0 .2-2.58 1.5-7 1.5S5 12.2 5 12V8.1Zm0 6.5c1.6.58 4.15.9 7 .9s5.4-.32 7-.9v3.9c0 .2-2.58 1.5-7 1.5s-7-1.3-7-1.5v-3.9Z",
};

const icones: Record<string, Icone> = {
  html: siHtml5,
  css: siCss,
  javascript: siJavascript,
  react: siReact,
  python: siPython,
  firebase: siFirebase,
  "firebase authentication": siFirebase,
  "cloud firestore": siFirebase,
  "firebase cloud messaging": siFirebase,
  "cloudflare workers": siCloudflareworkers,
  git: siGit,
  github: siGithub,
  sql: banco,
  sqlite: siSqlite,
  "next.js": siNextdotjs,
  typescript: siTypescript,
  "tailwind css": siTailwindcss,
};

const CLARO = "#e8eaf6";

function luminancia(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// "React (estudando)" e "SQLite (no navegador)" usam o ícone de "React" e "SQLite".
export function TechIcon({ nome, className = "h-4 w-4 shrink-0" }: { nome: string; className?: string }) {
  const chave = nome.replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase();
  const icone = icones[chave];
  if (!icone) return null;
  const cor = luminancia(icone.hex) < 0.1 ? CLARO : `#${icone.hex}`;
  return (
    <svg viewBox="0 0 24 24" fill={cor} aria-hidden="true" className={className}>
      <path d={icone.path} />
    </svg>
  );
}
