import type { Perfil } from "./types";

// Itens com "" ficam escondidos no site até serem preenchidos.
export const perfil: Perfil = {
  nome: "Guilherme Rabelo",
  cargo: "Desenvolvedor Web",
  frase:
    "Estudante de Engenharia de Software. Crio sites e sistemas que resolvem problemas reais, como o que construí para a equipe da empresa onde trabalho.",
  sobre:
    "Trabalho o dia todo, estudo Engenharia de Software à noite e, mesmo assim, construí sozinho um sistema completo que a equipe da empresa usa todos os dias. Gosto de olhar para um problema real e transformar em software que funciona.",
  palavrasDestaque: ["Engenharia", "Software", "sistema", "completo", "problema"],
  whatsapp: "5548998230477",
  mensagemWhatsapp: "Olá, Guilherme! Vi seu portfólio e gostaria de conversar.",
  email: "guilhermedemedeirosrabelo86@gmail.com",
  github: "https://github.com/guilhermedemedeirosrabelo86-maker",
  linkedin: "",
  cvUrl: "",
  fotoUrl: "",
  skills: [
    { grupo: "Front-end", itens: ["HTML", "CSS", "JavaScript", "React (estudando)"] },
    { grupo: "Back-end e dados", itens: ["Firebase", "SQL", "Cloudflare Workers"] },
    { grupo: "Ferramentas", itens: ["Git", "GitHub"] },
  ],
};
