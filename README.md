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
quarto/                         versão criativa: o portfólio como um quarto em 3D (no celular, versão leve)
css/style.css                   todo o visual do site (cores no topo, em :root)
js/main.js                      tudo o que é dinâmico (menu, animações, idade, ícones)
js/quarto.js, css/quarto.css    o quarto 3D (Three.js vem de uma CDN, sem instalar nada)
js/quarto-fundo.js              a outra metade do quarto: cama, guarda-roupa (skills), LED e interruptor
js/quarto-decoracao.js          enfeites: canto gamer, lives, PC, futebol (TV, videogame, som e bola são clicáveis)
js/quarto-som.js                música da caixa de som, gerada no navegador (Web Audio API)
img/                            sua foto, print do projeto, favicon e imagem de compartilhamento
demo/central-brindes/           demonstração do Central Brindes com dados fictícios
404.html                        página de "não encontrada" (Vercel e GitHub Pages usam sozinhos)
sitemap.xml, robots.txt         ajudam o Google a encontrar as páginas
```

## O que o JavaScript faz

Cada parte é uma função em `js/main.js`:

| Função | O que faz |
|---|---|
| `iniciarEntrada` | Anima o topo ao abrir a página (o CSS usa a classe `pronto`) |
| `iniciarAbertura` | Tela de boas-vindas com contador de 0 a 100 (só na primeira visita da sessão) |
| `iniciarMenu` | Abre e fecha o menu do celular |
| `iniciarNavbar` | Dá fundo à navbar ao rolar e desliza a pílula até a seção atual |
| `iniciarBarraProgresso` | Barrinha coral no topo que acompanha a rolagem |
| `iniciarTitulos` | Coloca os títulos numa "máscara" para o texto subir quando aparece |
| `iniciarVitrine` | O print do estudo de caso se endireita conforme a rolagem |
| `iniciarSeletor` | Lista de projetos: o mouse troca a prévia ao lado |
| `iniciarDetalhes` | Abre e fecha o detalhe de cada projeto (um `<dialog>` que sobe de baixo) |
| `iniciarGaleria` | Carrossel de prints do Meu Prédio |
| `iniciarVideos` | Toca os vídeos só enquanto estão na tela |
| `iniciarRevelar` | Blocos com `data-reveal` surgem ao entrar na tela (`IntersectionObserver`) |
| `iniciarTextoAcende` | Acende as palavras do "Sobre" conforme a rolagem |
| `iniciarCopiar` | Botão que copia o e-mail |
| `iniciarIdade` | Calcula a idade a partir da data de nascimento |
| `iniciarIcones` | Coloca o ícone de cada tecnologia nas listas |

Quem ativou "reduzir movimento" no sistema vê tudo sem animação (`prefers-reduced-motion`).

## Onde editar

| Quero... | Onde |
|---|---|
| Mudar textos | Direto no `index.html` |
| Mudar as cores | Variáveis no começo do `css/style.css` |
| Trocar a foto | Substitua `img/guilherme.jpg` (de preferência 720 × 900, retrato) |
| Adicionar um projeto | No `index.html`, copie um `<li>` da `.seletor-lista`, uma tela da `.previa-moldura`, uma frase em `data-legendas` e um `<dialog class="detalhe">` (o `id` do dialog é o `href` do item) |
| Trocar o endereço do site | Procure `portfolio-lyart-eta-yv04rf5tdp.vercel.app` nos `.html`, `sitemap.xml` e `robots.txt` |

## Publicar

Por ser um site estático, funciona em qualquer hospedagem gratuita:

- **GitHub Pages:** no repositório, vá em *Settings → Pages* e escolha a branch `main` e a pasta `/ (root)`.
- **Vercel:** importe o repositório. O `vercel.json` avisa que é um site estático (sem framework), então não precisa configurar nada.
