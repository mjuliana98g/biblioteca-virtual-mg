import { calcularPercentagem, chegouDataLancamento, temDataLancamento } from "./dadosDosLivros.js";

const CAPA_POR_DEFEITO = "img/sem-capa.svg";
const ESTADOS_LEITURA = ["quero-ler", "a-ler", "lido"];

// ------------------------------------------------------------------------------------------

function formatarData(data) {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

export function criarElemento(etiqueta, { texto, classe } = {}) { //cria qualquer elemento HTML
    const elemento = document.createElement(etiqueta);

    if (texto) {
        elemento.textContent = texto;
    }

    if (classe) {
        elemento.className = classe;
    }

    return elemento;
};

export function criarBotao(texto, classe) {
    const botao = criarElemento("button", { texto, classe });
    botao.type = "button";
    return botao;
};

export function criarCapa(livro) {
    const capa = criarElemento("img");

    capa.src = livro.capa || CAPA_POR_DEFEITO;
    capa.alt = `Capa do livro ${livro.titulo}`;
    capa.addEventListener("error", () => {
        capa.src = CAPA_POR_DEFEITO;
    }, { once: true }); // faz só uma vez, para não entrar em ciclo se a img por defeito também falhar

    return capa;
};

function criarLinkGoodreads(livro) {
    const pesquisa = `https://www.goodreads.com/search?q=${encodeURIComponent(
        `${livro.titulo} ${livro.autor}`
    )}`; // se o livro não tiver link, faz uma pesquisa no Goodreads com título e autor
    const link = criarElemento("a", { texto: "Goodreads ↗" });

    link.href = livro.goodreads || pesquisa;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    return link;
};

function obterTextoEstado(estado) {
    switch (estado) {
        case "lido":
            return "Lido";
        case "a-ler":
            return "A ler";
        case "quero-ler":
            return "Quero ler";
        default:
            return "Sem estado";
    }
};

// ------------------------------------------------------------------------------------------

function criarFigura(livro) {
    const figura = criarElemento("figure");
    figura.append(criarCapa(livro));
    return figura;
};

export function criarFiguraComLink(livro) {
    const figura = criarFigura(livro);
    const legenda = criarElemento("figcaption");

    legenda.append(criarLinkGoodreads(livro));
    figura.append(legenda);

    return figura;
};

function criarTitulo(livro) {
    const titulo = criarElemento("h3");
    const botao = criarBotao(livro.titulo, "abrir-detalhes");

    botao.setAttribute("aria-haspopup", "dialog");
    titulo.append(botao);

    return titulo;
};

function criarParagrafoEditora(livro) {
    const paragrafo = criarElemento("p", { texto: livro.editora });
    paragrafo.hidden = !livro.editora;
    return paragrafo;
};

function criarDataLancamento(livro) {
    const data = criarElemento("time", { texto: formatarData(livro.dataLancamento) });

    data.dateTime = livro.dataLancamento;
    data.hidden = !temDataLancamento(livro);

    return data;
};

function criarParagrafoGoodreads(livro) {
    const paragrafo = criarElemento("p");
    paragrafo.append(criarLinkGoodreads(livro));
    return paragrafo;
};

function criarBotaoEstado(livro) {
    const botao = criarBotao(`${obterTextoEstado(livro.estado)} ▾`);

    botao.dataset.estado = livro.estado;
    botao.setAttribute("aria-expanded", "false");

    return botao;
};

function criarOpcaoEstado(estado, livro) { // cria uma opção do menu (um <li> com botão), marcando a atual
    const item = criarElemento("li");
    const botao = criarBotao(obterTextoEstado(estado));

    botao.dataset.novoEstado = estado;

    if (estado === livro.estado) {
        botao.setAttribute("aria-current", "true");
    }

    item.append(botao);
    return item;
};

function criarMenuEstado(livro) { // cria a lista com as 3 opções (escondida até ser clicada)
    const menu = criarElemento("ul", { classe: "menu-estado" });

    menu.hidden = true;
    menu.append(...ESTADOS_LEITURA.map((estado) => criarOpcaoEstado(estado, livro)));

    return menu;
};

function criarSeletorEstado(livro) { // junta o botão de estado e o menu
    const seletor = criarElemento("div", { classe: "seletor-estado" });
    seletor.append(criarBotaoEstado(livro), criarMenuEstado(livro));
    return seletor;
};

function criarBotaoFavorito(livro) {
    const botao = criarBotao(livro.favorito ? "❤︎" : "♡");

    botao.setAttribute("aria-pressed", livro.favorito);
    botao.setAttribute("aria-label", "Favorito");
    botao.disabled = livro.estado !== "lido" && !livro.favorito;
    botao.title = botao.disabled ? "Só podes marcar como favorito um livro que já leste" : "";

    return botao;
};

function criarBotaoJaSaiu() {
    return criarBotao("Já saiu", "botao-ja-saiu");
};

function criarBotoesDoCartao(livro) {
    const acoes = criarElemento("div", { classe: "acoes-livro" });

    if (chegouDataLancamento(livro)) {
        acoes.append(criarBotaoJaSaiu()); //se a data já chegou, só cria o botão 'Já Saiu'
    } else if (!temDataLancamento(livro)) {
        acoes.append(criarSeletorEstado(livro), criarBotaoFavorito(livro));
    } // o livro não tem data (já está na estante), cria o seletor de estado + favorito
    // a data é futura, não cria nenhum botão
    return acoes;
};

function criarCorpoDoCartao(livro) {
    const corpo = criarElemento("div", { classe: "informacao-livro" });

    corpo.append(
        criarTitulo(livro),
        criarElemento("p", { texto: livro.autor }),
        criarParagrafoEditora(livro),
        criarDataLancamento(livro),
        criarParagrafoGoodreads(livro),
        criarBotoesDoCartao(livro)
    );

    return corpo;
};

function criarBotaoRemover(livro) {
    const botao = criarBotao("✕", "botao-fechar botao-remover");

    botao.setAttribute("aria-label", `Remover ${livro.titulo}`);
    botao.title = "Remover livro";

    return botao;
};

function criarBarraDeProgresso(livro, percentagem) {
    const barra = criarElemento("progress");

    barra.max = 100;
    barra.value = percentagem;
    barra.setAttribute("aria-label", `Progresso de leitura de ${livro.titulo}`);

    return barra;
};

function criarProgressoLeitura(livro) {
    const paginasLidas = livro.paginasLidas ?? 0;
    const percentagem = calcularPercentagem(paginasLidas, livro.paginas);
    const texto = livro.paginas
        ? `${paginasLidas} de ${livro.paginas} páginas · ${percentagem}%`
        : `${percentagem}%`;
    const progresso = criarElemento("div", { classe: "progresso-livro" });

    progresso.append(criarBarraDeProgresso(livro, percentagem), criarElemento("p", { texto }));

    return progresso;
};

function formatarClassificacao(classificacao) {
    return classificacao > 0
        ? `★ ${classificacao.toLocaleString("pt-PT")} / 5`
        : "Sem classificação";
};

function listarDetalhes(livro) {
    const detalhes = [
        ["Autor", livro.autor],
        ["Editora", livro.editora],
        ["Géneros", livro.generos.join(", ")],
        ["Idioma", livro.idioma],
        ["Páginas", livro.paginas],
        ["Saga", livro.saga],
        ["Volume", livro.volume],
        ["Estado", obterTextoEstado(livro.estado)],
        ["Classificação", formatarClassificacao(livro.classificacao)],
        ["Lançamento", livro.dataLancamento ? formatarData(livro.dataLancamento) : ""],
    ];

    return detalhes.filter(([, valor]) => valor);
};

export function criarListaDetalhes(livro) {
    const lista = criarElemento("dl");

    for (const [nome, valor] of listarDetalhes(livro)) {
        lista.append(
            criarElemento("dt", { texto: nome }),
            criarElemento("dd", { texto: String(valor) })
        );
    }

    return lista;
};

// ------------------------------------------------------------------------------------------

function criarItemDoCartao(livro) {
    const item = criarElemento("li");
    const cartao = criarElemento("article");

    cartao.dataset.id = livro.id;
    cartao.append(criarFigura(livro), criarCorpoDoCartao(livro), criarBotaoRemover(livro));
    item.append(cartao);

    return item;
};

function criarItemDoCartaoLeitura(livro) {
    const item = criarItemDoCartao(livro);
    const acoes = item.querySelector(".acoes-livro");

    item.querySelector("article").classList.add("cartao-leitura");
    item.querySelector(".informacao-livro").insertBefore(criarProgressoLeitura(livro), acoes);

    acoes.replaceChildren();

    if (livro.paginas) {
        acoes.append(criarBotao("Atualizar leitura", "botao-atualizar-leitura"));
    }

    return item;
};

export function mostrarCartoes(
    livros,
    lista,
    mensagemVazia = "Nenhum livro encontrado.",
    criarCartaoDoLivro = criarItemDoCartao
) {
    if (livros.length === 0) {
        lista.replaceChildren(criarElemento("li", { texto: mensagemVazia }));
        return;
    }

    lista.replaceChildren(...livros.map((livro) => criarCartaoDoLivro(livro)));
};

export function mostrarCartoesLeitura(livros, lista) {
    mostrarCartoes(livros, lista, "Não estás a ler nenhum livro de momento.", criarItemDoCartaoLeitura);
};