# Biblioteca Virtual Matilde Gomes

Biblioteca pessoal online para organizar os livros que já li, os que estou a ler e os que quero ler, com estatísticas de leitura e um Bingo Literário para tornar a leitura num jogo.

Projeto prático do módulo de JavaScript, feito com **HTML5, CSS3 e JavaScript moderno (ES6+)**, sem bibliotecas externas.

## Ver o site

**https://mjuliana98g.github.io/biblioteca-virtual-mg/**

## Funcionalidades

### Estante
- Adicionar, editar e remover livros (título, autor, editora, géneros, idioma, páginas, saga, volume, classificação, capa e link do Goodreads)
- Validação do formulário: campos obrigatórios, livros repetidos (mesmo título e autor), números de páginas e de volume, classificação de 0 a 5 e links
- Rascunho do formulário guardado se a página for recarregada a meio
- Mudar o estado de cada livro: **Quero ler**, **A ler** ou **Lido**
- Marcar livros lidos como favoritos
- Pesquisa por título ou autor, filtros por género, saga, editora e estado, e ordenação por título ou autor
- Janela de detalhes de cada livro, com possibilidade para edição

### Leituras e lançamentos
- **Leituras Atuais** com barra de progresso, atualizada por páginas ou por percentagem
- **Próximos Lançamentos** com a data de saída e o botão "Já saiu" quando a data chega

### Estatísticas
- Progresso de livros lidos
- Géneros mais lidos
- Média das classificações e gráfico por número de estrelas
- Livros de 5 estrelas

### Bingo Literário
- Cartão 3×3 com 9 desafios sorteados
- Cada desafio é cumprido com um livro já lido
- Mensagens de "Linha!" e "Bingo!", histórico de cartões completos e livros extra ganhos
- Aviso na página principal quando um livro passa a "Lido"

### Outros
- Modo claro e modo escuro
- Site responsivo: computador, tablet e telemóvel, com menu lateral no telemóvel

## Como os dados são guardados

- Os livros iniciais estão no ficheiro `data/livros.json` e os desafios do Bingo em `data/desafiosBingo.json`. São carregados com `fetch`.
- As alterações feitas no site ficam guardadas no browser:
  - **localStorage:** livros, cartões do Bingo e tema (ficam guardados de uma visita para a outra);
  - **sessionStorage:** ordenação, rascunho do formulário e aviso do Bingo (apagam-se ao fechar o separador).
- Por isso, os dados alterados ficam só no browser onde foram feitos. Para voltar aos livros iniciais, basta limpar o armazenamento do site no browser.

## Estrutura do projeto

```
├── index.html            Página principal (estante)
├── bingo.html            Página do Bingo Literário
├── css/
│   └── style.css         Estilos das duas páginas
├── data/
│   ├── livros.json       Livros iniciais
│   └── desafiosBingo.json  Desafios do Bingo
├── img/                  Logótipo, ícone e capa por defeito
└── js/
    ├── principal.js      Arranque da página principal
    ├── dados.js          Carregar e guardar os livros
    ├── paginaLivros.js   Desenhar os cartões, estatísticas e barra lateral
    ├── acoes.js          Filtros, cliques, janelas e menu
    ├── formulario.js     Adicionar e editar livros
    ├── utilidades.js     Funções partilhadas pelas duas páginas
    └── bingo/
        ├── principalBingo.js  Arranque do Bingo
        ├── dadosBingo.js      Cartões e desafios
        └── paginaBingo.js     Desenhar e controlar o cartão
```

## Requisitos do projeto

| Requisito | Onde está |
| --- | --- |
| 1. Lógica e controlo de fluxo | `switch` em `tratarClique` (acoes.js); `filter` + `reduce` + `map` em `mostrarClassificacoes` (paginaLivros.js); `while` em `criarCartao` (bingo/dadosBingo.js) |
| 2. Dados simples | validação do formulário em `encontrarErrosDeRegras` (formulario.js); `normalizarTexto`, `formatarData` e `calcularPercentagem` (utilidades.js) |
| 3. Dados complexos imutáveis | `adicionarLivro`, `removerLivro` e `alterarLivro` com spread, `filter` e `map` (dados.js); `filtrarEOrdenar` (acoes.js) |
| 4. DOM dinâmico | `criarElemento` com `document.createElement` (utilidades.js), usado em todos os cartões, gráficos e no Bingo |
| 5. Reatividade e eventos | delegação de eventos em `tratarClique` (acoes.js); pesquisa e filtros em tempo real; submissão do formulário (formulario.js) |
| 6. Scope e closures | lista de livros protegida dentro de dados.js (sem `export`); closure `mostrarMenu` em `iniciarMenuLateral` (acoes.js) |
| 7. Assincronismo | `carregarJson` com `fetch`, `async/await` e `try/catch` (utilidades.js); janelas com `Promise` em `esperarResposta` |
| 8. Modularização | 9 módulos com `import`/`export`; utilidades.js e dados.js partilhados pelas duas páginas |
| Persistência | livros, tema e Bingo no `localStorage`; ordenação, rascunho e aviso do Bingo no `sessionStorage` |

## Como abrir no computador

O projeto usa módulos JavaScript (`import`/`export`) e `fetch`, por isso **não funciona abrindo o `index.html` com duplo clique**. É preciso um servidor local. A forma mais simples:

1. Descarregar o projeto: botão verde **Code → Download ZIP** no GitHub, ou com `git clone https://github.com/mjuliana98g/biblioteca-virtual-mg.git`
2. Abrir a pasta no **Visual Studio Code**
3. Instalar a extensão **Live Server**
4. Clicar com o botão direito no `index.html` → **Open with Live Server**

O site abre no browser.

## Autora

Matilde Gomes, 2026