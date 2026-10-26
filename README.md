# Portfólio · Guilherme Rabelo

Portfólio pessoal feito com **HTML, CSS e JavaScript puros**, sem frameworks e sem etapa de build.

## Rodar no computador

Não precisa instalar nada: é só abrir o `index.html` no navegador.

Se quiser um servidor local (o mesmo jeito que o site roda publicado), use a extensão
**Live Server** do VS Code, ou rode no terminal:

```bash
npx serve .
```

## Estrutura

```
index.html                      página principal (início, projetos, sobre, skills, contato)
projetos/central-brindes/       página do estudo de caso
css/style.css                   todo o visual do site (cores no topo, em :root)
js/main.js                      tudo o que é dinâmico (menu, animações, idade, ícones)
img/                            imagens, favicon e imagem de compartilhamento
demo/central-brindes/           demonstração do Central Brindes com dados fictícios
sitemap.xml, robots.txt         ajudam o Google a encontrar as páginas
```

## O que o JavaScript faz

Cada parte é uma função em `js/main.js`:

| Função | O que faz |
|---|---|
| `iniciarMenu` | Abre e fecha o menu ☰ no celular |
| `iniciarBarraProgresso` | Barrinha amarela no topo que acompanha a rolagem |
| `iniciarRevelar` | Faz os blocos com `data-reveal` surgirem ao entrar na tela (usa `IntersectionObserver`) |
| `iniciarTextoAcende` | Acende as palavras do "Sobre mim" conforme a rolagem |
| `iniciarCardsLuz` | Luz que segue o mouse nos cards (variáveis CSS `--x` e `--y`) |
| `iniciarIdade` | Calcula a idade a partir da data de nascimento |
| `iniciarIcones` | Coloca o ícone de cada tecnologia nas listas de tags |

Quem ativou "reduzir movimento" no sistema vê tudo sem animação (`prefers-reduced-motion`).

## Onde editar

| Quero... | Onde |
|---|---|
| Mudar textos | Direto no `index.html` |
| Mudar as cores | Variáveis no começo do `css/style.css` |
| Colocar o LinkedIn | Copie um item da lista `.redes` (início) e `.canais` (contato) no `index.html` |
| Adicionar um projeto | Copie um bloco `<div data-reveal>` dentro de `.projetos-lista` |
| Trocar o endereço do site | Procure `guilherme-rabelo.vercel.app` nos `.html`, `sitemap.xml` e `robots.txt` |

## Publicar

Por ser um site estático, funciona em qualquer hospedagem gratuita:

- **GitHub Pages:** no repositório, vá em *Settings → Pages* e escolha a branch `main` e a pasta `/ (root)`.
- **Vercel:** importe o repositório; não precisa configurar nada.
