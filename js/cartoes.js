import { verificarPorLancar } from "./biblioteca.js";

const CAPA_POR_DEFEITO = "img/sem-capa.svg";
const ESTADOS = ["quero-ler", "a-ler", "lido"];

export function criarElemento(etiqueta, { texto, classe } = {}) {
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
    }, { once: true });

    return capa;
};

export function criarLinkGoodreads(livro) {
    const pesquisa = `https://www.goodreads.com/search?q=${encodeURIComponent(
        `${livro.titulo} ${livro.autor}`
    )}`;
    const link = criarElemento("a", { texto: "Goodreads ↗" });

    link.href = livro.goodreads || pesquisa;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    return link;
};

export function obterTextoEstado(estado) {
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

function criarFigura(livro) {
    const figura = criarElemento("figure");
    figura.append(criarCapa(livro));
    return figura;
};

function criarTitulo(livro) {
    const titulo = criarElemento("h3");
    const botao = criarBotao(livro.titulo, "abrir-detalhes");

    botao.setAttribute("aria-haspopup", "dialog");
    titulo.append(botao);

    return titulo;
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

function criarOpcaoEstado(estado, livro) {
    const item = criarElemento("li");
    const botao = criarBotao(obterTextoEstado(estado));

    botao.dataset.novoEstado = estado;

    if (estado === livro.estado) {
        botao.setAttribute("aria-current", "true");
    }

    item.append(botao);
    return item;
};

function criarMenuEstado(livro) {
    const menu = criarElemento("ul", { classe: "menu-estado" });

    menu.hidden = true;
    menu.append(...ESTADOS.map((estado) => criarOpcaoEstado(estado, livro)));

    return menu;
};

function criarSeletorEstado(livro) {
    const seletor = criarElemento("div", { classe: "seletor-estado" });
    seletor.append(criarBotaoEstado(livro), criarMenuEstado(livro));
    return seletor;
};

function criarBotaoFavorito(livro) {
    const botao = criarBotao(livro.favorito ? "★" : "☆");

    botao.setAttribute("aria-pressed", livro.favorito);
    botao.setAttribute("aria-label", "Favorito");

    return botao;
};

function criarBotaoJaSaiu() {
    return criarBotao("Já saiu", "botao-ja-saiu");
};

function criarAcoes(livro) {
    const acoes = criarElemento("div", { classe: "acoes-livro" });

    if (verificarPorLancar(livro)) {
        acoes.append(criarBotaoJaSaiu());
    } else {
        acoes.append(criarSeletorEstado(livro), criarBotaoFavorito(livro));
    }

    return acoes;
};

function criarInformacao(livro) {
    const informacao = criarElemento("div", { classe: "informacao-livro" });

    informacao.append(
        criarTitulo(livro),
        criarElemento("p", { texto: livro.autor }),
        criarParagrafoGoodreads(livro),
        criarAcoes(livro)
    );

    return informacao;
};

function criarBotaoRemover(livro) {
    const botao = criarBotao("✕", "botao-fechar botao-remover");

    botao.setAttribute("aria-label", `Remover ${livro.titulo}`);
    botao.title = "Remover livro";

    return botao;
};

function criarCartao(livro) {
    const item = criarElemento("li");
    const cartao = criarElemento("article");

    cartao.dataset.id = livro.id;
    cartao.append(criarFigura(livro), criarInformacao(livro), criarBotaoRemover(livro));
    item.append(cartao);

    return item;
};

export function mostrarLivros(livros, lista, mensagemVazia = "Nenhum livro encontrado.") {
    if (livros.length === 0) {
        lista.replaceChildren(criarElemento("li", { texto: mensagemVazia }));
        return;
    }

    lista.replaceChildren(...livros.map(criarCartao));
};