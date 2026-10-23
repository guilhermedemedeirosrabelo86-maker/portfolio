# Portfólio · Guilherme Rabelo

Portfólio pessoal feito com **Next.js**, **TypeScript** e **Tailwind CSS**.

## Rodar no computador

```bash
npm install
npm run dev     # abre em http://localhost:3000
npm test        # roda os testes
npm run build   # gera a versão de produção
```

## Onde editar o conteúdo

Tudo o que aparece no site fica em `src/content/`. Não precisa mexer no layout.

| Quero... | Arquivo | O que fazer |
|---|---|---|
| Colocar minha foto | `src/content/perfil.ts` | Salve a foto em `public/` (ex.: `public/foto.jpg`) e preencha `fotoUrl: "/foto.jpg"` |
| Ligar o botão de currículo | `src/content/perfil.ts` | Salve o PDF em `public/` e preencha `cvUrl: "/curriculo.pdf"` |
| Mostrar o LinkedIn | `src/content/perfil.ts` | Preencha `linkedin` com o link do perfil |
| Ligar a demo do Central Brindes | `src/content/projetos.ts` | Preencha `demoUrl` no projeto `central-brindes` |
| Adicionar um projeto | `src/content/projetos.ts` | Copie um item da lista e ajuste os campos |
| Trocar o endereço do site | `src/content/site.ts` | Mude `url` quando tiver domínio próprio |

Campos com `""` ficam escondidos no site até serem preenchidos.

## Publicar

O site é publicado na [Vercel](https://vercel.com): importe este repositório do GitHub e a cada `git push` uma nova versão vai ao ar.
