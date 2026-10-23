# Portfólio do Guilherme Rabelo — Design

Data: 2026-10-23
Status: aprovado em 2026-10-23

## 1. Intenção e o porquê

Guilherme é estudante de Engenharia de Software e trabalha o dia todo (fora da área) numa empresa, com um salário razoável. **Estágio não é o objetivo**: trocar o salário atual por uma bolsa não compensa. O portfólio existe para **abrir caminho para uma vaga efetiva na área de software** e, em segundo plano, para eventuais projetos pontuais.

Público: recrutadores, empresas e pessoas da área de software. Eventualmente os gestores dele na empresa atual (que vão ver o Central Brindes).

A história que o site conta: *trabalho o dia todo, estudo Engenharia de Software e, mesmo assim, construí um sistema completo que resolve um problema real e que a equipe usa todo dia.* O Central Brindes é a prova principal.

Sucesso = alguém da área ver o portfólio e pensar "quero conversar com esse cara" — e chamar no WhatsApp.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Passar credibilidade de desenvolvedor para gente técnica.
- Destacar o Central Brindes como projeto principal (problema → solução → resultado).
- Levar o visitante a entrar em contato (WhatsApp).
- O próprio código do portfólio servir como amostra de trabalho (repositório público no GitHub, stack de mercado).

**Não-objetivos (nesta etapa)**
- Demo clicável do Central Brindes — é um **projeto separado, feito depois** (ver §7). O portfólio só aponta para ela quando existir.
- Blog, versão em inglês, formulário de contato, painel de admin/CMS.

**Anti-objetivos (seria fracasso mesmo funcionando)**
- Parecer uma página de vendas de sites — esse papel é do GR Digital.
- Parecer currículo de quem procura estágio.
- **Expor dados reais ou a marca da empresa atual**: sem logo da empresa, sem prints com dados reais, sem nomes de pessoas/representantes. O sistema é descrito como "sistema interno que criei na empresa onde trabalho" até os gestores liberarem.
- Animações exageradas que deixem o site lento ou cansativo.

## 3. Restrições

- Tudo em **português (pt-BR)**.
- Hospedagem gratuita.
- Guilherme domina HTML, CSS e JavaScript puros e está estudando React (repos `aulas-react`, `VAGAS-REACT`). O código precisa ser legível para ele manter sozinho: adicionar projeto, trocar foto, ligar o currículo sem mexer em layout.
- Conteúdo pendente que vai chegar depois: **foto**, **currículo em PDF**, **LinkedIn** (opcional), links dos sites pequenos, link da demo. O site tem que funcionar bem sem eles.

## 4. O que foi decidido (pelo Guilherme)

### Visual
Baseado na imagem de referência dele (portfólio "Alex Morgan"): fundo **azul-marinho bem escuro**, destaques com **gradiente azul → roxo** (aprox. `#3b82f6` → `#8b5cf6`), cards escuros com borda sutil, tipografia sans-serif moderna e limpa. Mockup aprovado: "Versão 2" em `.superpowers/brainstorm/394-1792754589/content/referencia-v1.html`.

### Estrutura da página inicial (uma página, rolagem)
1. **Barra de navegação**: logo "GR." em gradiente; links Início · Sobre · Projetos · Skills · Contato; botão contornado "Vamos conversar" (abre WhatsApp).
2. **Topo (hero)**: "Olá, eu sou / **Guilherme Rabelo** / Desenvolvedor Web" (cargo em gradiente); frase curta sobre ele; botões "Ver projetos →" e WhatsApp; ícones sociais. À direita, **ilustração** (no lugar da foto, por enquanto) dentro de um **anel com brilho** azul/roxo, e o selo **"Aberto a oportunidades"** com bolinha verde.
3. **Projetos em destaque** (layout "Versão 2"):
   - **Card grande do Central Brindes**: imagem à esquerda; à direita o rótulo "PROJETO PRINCIPAL", título, bloco Problema / Solução / Resultado, tags de tecnologia, botão "Demo em breve" (desabilitado até a demo existir) e link para a página do projeto.
   - Ao lado, cards menores: **GR Digital** e **"Outros sites — em construção"**.
4. **Sobre mim**: texto com o efeito "texto que acende" (ver Animações).
5. **Skills**: o que ele usa de verdade.
6. **Contato**: WhatsApp e GitHub.
7. Rodapé simples.

### Página própria do Central Brindes (`/projetos/central-brindes`)
Estudo de caso detalhado, sem dados reais:
- **Problema**: o estoque de brindes do Marketing era controlado "no olho"; o sistema geral da empresa vivia com dados errados e desatualizados. Também havia os envios pelo Correio para representantes.
- **Solução**: sistema web completo, feito sozinho, por iniciativa própria.
- **Destaques técnicos** (fonte: repositório `central-brindes`):
  - Estoque **calculado a partir do histórico** (entradas + ajustes − saídas − envios), por isso nunca fica desencontrado; reservado vs. disponível; cancelar envio devolve itens.
  - **Envios** com fluxo pendente → separado → entregue, rastreio, fotos de comprovação; **importação de nota fiscal** (XML/PDF da DANFE).
  - **Página pública de acompanhamento** para o representante confirmar recebimento.
  - **Tarefas e conversas** da equipe com **notificações push** no celular.
  - **Rotinas automáticas** em dias úteis (resumo 8h, lembrete do Correio 11h30, resumo 14h), alerta de estoque baixo, **backup semanal**.
  - **Login e permissões** (admin/equipe) com regras de segurança no Firestore.
  - **Consultas SQL no navegador** (SQLite) e exportação para Excel/Power BI.
  - Deploy automático: push no GitHub → Cloudflare.
- **Stack**: HTML, CSS, JavaScript puro · Firebase Authentication · Cloud Firestore · Cloudflare Workers · Firebase Cloud Messaging · SQLite (no navegador).
- **Resultado**: usado no dia a dia pela equipe de Marketing.
- Imagens: **somente com dados fictícios** ou ilustrativas. Até haver prints fictícios, usar ilustração/placeholder de estilo coerente.

### Animações escolhidas
- **Surgir ao rolar**: elementos entram deslizando de baixo com fade, em sequência (stagger) nos grupos de cards.
- **Luz + inclinação 3D no mouse** nos cards de projeto: brilho roxo radial seguindo o cursor e leve rotação 3D.
- **Texto que acende** na seção Sobre: palavras passam de apagadas para acesas conforme a rolagem; algumas palavras-chave acendem em roxo.
- **Barra de progresso de leitura** fixa no topo, com o gradiente.
- Recusadas: projetos deslizando na horizontal, contadores de números, botão magnético.
- Referência funcionando: `.superpowers/brainstorm/394-1792754589/content/animacoes.html`.

### Contato
- Principal: **WhatsApp** (48) 99823-0477 → `https://wa.me/5548998230477` com mensagem pré-preenchida.
- **E-mail**: guilhermedemedeirosrabelo86@gmail.com (link `mailto:`), mostrado no Contato e nos ícones do hero.
- **GitHub**: https://github.com/guilhermedemedeirosrabelo86-maker
- Botão "Baixar currículo" **escondido** até o PDF existir.

### Projetos secundários
- **GR Digital**: site do negócio dele de criação de sites (repo `GR-Digital`). Link do site no ar: pendente — usar o repo enquanto isso.
- **Outros sites**: um card "em construção".

## 5. Decisões minhas (Claude) — conferir

- **Stack**: Next.js (App Router) + TypeScript + Tailwind CSS, deploy na Vercel. Motivo: é a stack mais pedida em vagas júnior e o código do portfólio vira vitrine. Guilherme pediu para ver assim e concordou com o caminho.
- **Conteúdo em arquivos de dados** (ex.: `src/content/projetos.ts`, `src/content/perfil.ts`) para que adicionar projeto, trocar foto, ligar currículo, WhatsApp e link da demo seja só editar dado. Itens pendentes ficam como valores vazios e a interface os esconde ou mostra o estado "em breve/em construção".
- **Animações respeitam `prefers-reduced-motion`**: com movimento reduzido, tudo aparece estático. Os efeitos de mouse (luz/3D) só em dispositivos com ponteiro fino (não no celular).
- **Responsivo**: no celular, hero em coluna (ilustração abaixo ou acima do texto), card do Central Brindes empilhado.
- **Skills listadas**: HTML, CSS, JavaScript, React (estudando), Firebase, Cloudflare, Git/GitHub, SQL. Agrupamento e ícones ficam a critério do builder.
- **Textos**: o builder escreve a copy em pt-BR seguindo a história da §1, tom direto e confiante, sem exagero. Guilherme revisa.
- **SEO básico**: título, descrição, Open Graph com imagem, favicon "GR".
- **Sem página de listagem de projetos**: o "Ver todos →" dos mockups sai. GR Digital e outros sites são só cards com link externo (repo ou site); só o Central Brindes tem página própria. Os dados de projeto têm campos de estudo de caso opcionais.
- **Endereço**: lança no `*.vercel.app`. A URL base fica numa única configuração (canonical, Open Graph, sitemap) para trocar quando houver domínio próprio.
- **Com link "Ver código"** para https://github.com/guilhermedemedeirosrabelo86-maker/central-brindes (decisão do Guilherme, mesmo sabendo que o repo mostra a marca da empresa). O campo de link de código é opcional no dado do projeto, para poder remover editando só o dado.
- **Repositório público**: `.superpowers/` vai no `.gitignore`. Este documento não cita o nome da empresa empregadora (fica como "empresa atual").

## 6. Deixado para o builder

- Biblioteca de animação (CSS + IntersectionObserver puro, ou Framer Motion/Motion) — desde que leve e que respeite movimento reduzido.
- Fonte exata (algo como Inter / Geist), ícones, estilo da ilustração do hero (pode ser SVG gerado, abstrato/tech, combinando com o gradiente).
- Organização de componentes e pastas.
- Estrutura do repositório git, README.

## 7. Depois do portfólio (fora deste escopo)

**Demo do Central Brindes**: cópia do sistema com o Firebase trocado por dados fictícios no próprio navegador, entrando sem login real, sem marca da empresa, em link separado. Será brainstormada e planejada como projeto próprio. Quando estiver no ar, o portfólio só troca "Demo em breve" pelo link.
