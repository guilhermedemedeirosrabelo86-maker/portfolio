# Quarto 3D: luz, olhar em volta, cama e guarda-roupa com as skills

Data: 28/10/2026
Arquivos envolvidos: `quarto/index.html`, `js/quarto.js`, `css/quarto.css`

## Por quê

O quarto 3D é a versão criativa do portfólio do Guilherme (estudante procurando a primeira vaga de dev). Hoje ele mostra só a "parede da mesa": monitor (projetos), notebook (GitHub), celular (WhatsApp), quadro (sobre mim) e livro (formação). Faltam duas coisas:

1. **As skills**, que estão no site normal mas não no 3D.
2. **A sensação de um quarto de verdade, com a cara dele**, que a pessoa explora: acende a luz, olha em volta, vê a cama, o quadro do Criciúma, o LED no teto e abre o guarda-roupa.

Quem visita é principalmente um recrutador. O objetivo é que ele se divirta explorando e saia sabendo o que o Guilherme faz e o que ele sabe usar.

## Como deve funcionar (decidido pelo Guilherme)

### Começa apagado
- Ao entrar, a luz do teto está **apagada** e a **luminária da mesa também** (decidido pelo Guilherme). Só aparecem o luar da janela, o brilho das telinhas (notebook, celular, a bolinha de ligar do monitor) e a fita de LED.
- Tem um **interruptor na parede da direita**. Clicar nele acende a luz do teto, e clicar de novo apaga. *(Decisão do Claude: a luminária acende e apaga junto com o interruptor.)*
- O monitor continua começando **desligado**, com a bolinha coral piscando, como hoje.
- Apagado não quer dizer preto: a luz ambiente fica baixa, mas os móveis precisam continuar reconhecíveis pelo contorno, com o luar e o LED.

### Olhar em volta, parado
- A pessoa fica **parada no meio do quarto** e **gira a visão para onde quiser**, como num jogo de primeira pessoa, só que sem andar. Dá para olhar para trás e ver a cama e o guarda-roupa.
- Andar (WASD) fica para depois. Não faz parte deste trabalho.
- Clicar num objeto continua como hoje: a câmera vai até ele e abre o painel. "Voltar ao quarto" (e Esc) leva a câmera de volta ao meio.

### Arrumação do quarto (opção "A" da planta)
- **Frente:** tudo o que já existe (mesa com monitor, notebook, celular, cabo, enfeites, quadro "sobre mim", prateleira com o livro, pôster). Fica como está.
- **Esquerda:** a janela que já existe.
- **Atrás (parede nova):** **cama com cabeceira** encostada na parede, de frente para quem olha, com travesseiros e coberta. Na parede, acima da cabeceira, o **quadro do Criciúma**. Um tapete na frente da cama.
- **Direita (parede nova):** o **guarda-roupa**, mais para o fundo, e o **interruptor**, mais para a frente, perto de onde seria a porta.
- **Teto (novo):** **fita de LED** contornando todo o encontro das paredes com o teto.

### Fita de LED
- A cor muda num **controlinho em cima da cama**. Cada clique passa para a próxima cor da lista.
- O LED fica sempre aceso, com a luz do teto acesa ou apagada.

### Guarda-roupa = Skills
- As portas **abrem** com um clique e a câmera vai até ele.
- Dentro tem **camisetas penduradas num cabide, uma por tecnologia**, com o nome escrito nela.
- Clicar numa camiseta abre um painel dizendo **onde ele usou aquilo**. Os textos são os mesmos da seção Skills do site (`index.html`, seção `#skills`):

| Tecnologia | Onde aparece |
|---|---|
| HTML | Central Brindes, Meu Prédio, GR Digital |
| CSS | Central Brindes, Meu Prédio, GR Digital |
| JavaScript | Central Brindes, Meu Prédio, GR Digital |
| React | Estudando agora |
| Python | Meu Prédio |
| SQL | Central Brindes |
| SQLite | Meu Prédio |
| Firebase | Central Brindes |
| Cloudflare Workers | Central Brindes |
| Git | Em todos os projetos |
| GitHub | Código de todos no meu perfil |

  Os dados devem sair de uma lista única no `quarto.js` (como a lista `projetos` que já existe), para ficar fácil manter igual ao site.
- **Os nomes de projeto no "onde usei" são links** (decidido pelo Guilherme). Clicar em "Central Brindes", "Meu Prédio" ou "GR Digital" leva a câmera até o monitor, liga o monitor se estiver desligado e abre o navegador direto na página daquele projeto (ids `central-brindes`, `meu-predio` e `gr-digital` da lista `projetos`). O botão "voltar" do navegador deve funcionar normalmente a partir dali. "Código de todos no meu perfil" leva ao GitHub (link externo, como no painel do notebook). "Estudando agora" e "Em todos os projetos" ficam só como texto.
- **Um painel só** para o guarda-roupa: a lista de todas as skills em HTML. Clicar numa camiseta destaca aquela skill na lista. O painel abre do **lado esquerdo** da tela (`painel-esquerda`), para não tapar as camisetas. *(Decisão do Claude.)*
- O guarda-roupa vai ganhar outras coisas dentro no futuro. As camisetas não devem ocupar o espaço todo de um jeito que impeça isso (por exemplo: cabideiro em cima e prateleiras/gavetas vazias embaixo).

### Cama
- Neste trabalho ela é decoração, mas vai ganhar função no futuro. Deve ser montada como um grupo próprio com nome (o mesmo padrão de `clicavel()`), pronta para virar clicável sem refazer nada.

### Quadro do Criciúma
- Desenhado no próprio código (textura de canvas): um **escudo em estilo cartoon** (decidido pelo Guilherme), com contorno grosso, cores chapadas, listras **amarelo, preto e branco** e o nome **CRICIÚMA**. É uma releitura simples e divertida, não uma cópia fiel do escudo oficial.

## Acessibilidade (seguir o que o quarto já faz)
- Novos botões na barra "Objetos do quarto": **Interruptor · Luz**, **Controle · LED** e **Guarda-roupa · Skills**.
- O painel do guarda-roupa precisa listar **todas as skills em HTML**, para quem usa teclado ou leitor de tela, e não só as camisetas 3D.
- Também dá para girar a visão pelo teclado, com as setas.
- "Menos movimento" (`prefers-reduced-motion`): a câmera pula direto, as portas abrem sem animação e a troca de luz é instantânea.

## Restrições
- **HTML, CSS e JS puros**, Three.js 0.160 pela CDN e importmap, como hoje. Sem npm e sem build.
- **Código comentado em português e simples de explicar.** O Guilherme precisa saber explicar cada parte numa entrevista.
- **Continuar leve:** desenho sob demanda (`pedirQuadro()`), poucas luzes, `MeshLambertMaterial`, uma única luz com sombra (a lua), sombra recalculada só quando algo se mexe. Os móveis novos devem seguir isso.
- O quarto 3D continua **só para computador**. O aviso em tela pequena fica como está.
- Os textos seguem o tom do site: humildes, sem autoelogio e sem inventar dados.
- As animações devem ser **sóbrias e diretas** (portas abrindo e luz acendendo, sem exagero).

## Fora deste trabalho (não-objetivos)
- Andar pelo quarto (WASD).
- Funções para a cama e outros itens dentro do guarda-roupa (ficam para depois).
- Sons.
- Versão 3D para celular.

## Seria um fracasso se…
- O recrutador ficasse **perdido no escuro**, sem saber que precisa achar o interruptor.
- O quarto ficasse **pesado** (travando, ventoinha disparando) por causa de luzes e móveis novos.
- Girar a visão **atrapalhasse** clicar nos objetos ou usar os painéis e o navegador do monitor.
- As skills do 3D ficassem **diferentes** das do site.

## Decisões do Claude (o Guilherme pode trocar)
- **Dica no escuro:** ao entrar, aparece uma dica curta na área de dica que já existe (`.quarto-dica`), algo como "Está escuro. O interruptor fica na parede à sua direita." Ela some quando a luz acende.
- **Jeito de girar a visão:** **arrastar com o mouse** (segurar e mover), com o cursor sempre visível. Clique sem arrastar continua sendo clique no objeto. Não usar "travar o mouse" (pointer lock) como nos jogos, porque esconde o cursor, confunde quem não joga e briga com os painéis HTML. O giro para os lados é livre (360°), e o giro para cima e para baixo é limitado.
- **Ponto onde a pessoa fica:** no meio do quarto, na altura dos olhos de alguém em pé, olhando para a mesa. Para a parede da mesa inteira (quadro "sobre mim" e pôster incluídos) aparecer logo de cara, o quarto fica mais fundo (a parede de trás, com a cama, vai mais para trás) e o campo de visão abre um pouco (hoje é 38°; algo entre 50° e 60°). As vistas de perto e `calcularVistaMonitor()` devem continuar funcionando com o campo de visão novo.
- **Interruptor e controle do LED funcionam onde a pessoa está**: a câmera não viaja até eles e nenhum painel abre. Os botões de atalho "Interruptor · Luz" e "Controle · LED" fazem a mesma coisa (não usam o caminho de `focar()`), com `aria-pressed` no interruptor. A `.quarto-dica` (que é `aria-live`) avisa o que mudou, por exemplo "Luz acesa" ou "LED: azul".
- **O LED pinta o quarto de leve:** a cor da fita também muda a cor de uma luz que já existe (por exemplo a `contraLuz` coral), sem acrescentar luzes.
- **Girar a visão fica desligado** enquanto um objeto está em foco ou o navegador do monitor está aberto. As setas não podem atrapalhar a digitação e a rolagem do navegador.
- **Depois de focar num objeto**, "Voltar ao quarto" volta ao meio olhando para a mesma direção de antes.
- **Cores do LED:** um ciclo curto (por exemplo roxo, azul, coral, verde-água e branco quente). A cor inicial é a que o builder achar melhor no escuro.
- **Luz do teto e luminária:** acender muda a intensidade de luzes que já existem (mais a luz do teto), em vez de ligar e desligar luzes. Ligar e desligar muda a quantidade de luzes na cena e faz o Three.js recompilar os materiais, o que dá um engasgo.

## Fica a critério de quem construir
- Medidas e posições exatas dos móveis, das paredes novas e do teto (o quarto hoje vai de x = -4,2 até a mesa em z = -3, e o chão já é maior do que isso).
- Ajustar a área da sombra da lua para cobrir os móveis novos.
- Cores, materiais e detalhes da cama, do guarda-roupa, do tapete e do controle.
- Visual das camisetas e do painel de skill, seguindo o estilo dos painéis atuais (`.painel`).
- Como organizar o `quarto.js` (pode separar partes em funções novas). O arquivo já tem cerca de 1.170 linhas.
