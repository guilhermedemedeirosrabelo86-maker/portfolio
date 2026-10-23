import type { Projeto } from "./types";

export const projetos: Projeto[] = [
  {
    slug: "central-brindes",
    titulo: "Central Brindes",
    resumo: "Sistema web de estoque e envios que criei para a equipe de Marketing da empresa onde trabalho.",
    destaque: true,
    status: "pronto",
    tags: ["HTML", "CSS", "JavaScript", "Firebase", "Cloudflare Workers", "SQL"],
    imagem: "/projetos/central-brindes-painel.jpg",
    casoUrl: "/projetos/central-brindes",
    codigoUrl: "https://github.com/guilhermedemedeirosrabelo86-maker/central-brindes",
    demoUrl: "/demo/central-brindes/index.html",
    problema:
      "O estoque de brindes era controlado no olho, e o sistema geral da empresa vivia com dados errados e desatualizados.",
    solucao:
      "Criei por iniciativa própria um sistema web completo de estoque e envios pelo Correio para representantes.",
    resultado: "A equipe de Marketing usa o sistema no dia a dia.",
  },
  {
    slug: "gr-digital",
    titulo: "GR Digital",
    resumo: "Site do meu negócio de criação de sites para pequenas empresas.",
    destaque: false,
    status: "pronto",
    tags: ["HTML", "CSS", "JavaScript"],
    linkExterno: "https://github.com/guilhermedemedeirosrabelo86-maker/GR-Digital",
  },
  {
    slug: "outros-sites",
    titulo: "Outros sites",
    resumo: "Novos sites chegando por aqui.",
    destaque: false,
    status: "em-construcao",
    tags: [],
  },
];

export function projetoDestaque(): Projeto {
  const destaque = projetos.find((p) => p.destaque);
  if (!destaque) throw new Error("Nenhum projeto marcado como destaque.");
  return destaque;
}
