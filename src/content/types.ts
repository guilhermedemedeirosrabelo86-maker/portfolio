export type Projeto = {
  slug: string;
  titulo: string;
  resumo: string;
  destaque: boolean;
  status: "pronto" | "em-construcao";
  tags: string[];
  imagem?: string;
  linkExterno?: string;
  codigoUrl?: string;
  demoUrl?: string;
  casoUrl?: string;
  problema?: string;
  solucao?: string;
  resultado?: string;
};

export type Perfil = {
  nome: string;
  cargo: string;
  frase: string;
  sobre: string;
  palavrasDestaque: string[];
  whatsapp: string;
  mensagemWhatsapp: string;
  email: string;
  github: string;
  linkedin: string;
  cvUrl: string;
  fotoUrl: string;
  skills: { grupo: string; itens: string[] }[];
};
