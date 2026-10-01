const CAPA_POR_DEFEITO = "img/sem-capa.svg";

function criarElemento(etiqueta, texto) {
    const elemento = document.createElement(etiqueta);
    if (texto) {
        elemento.textContent = texto;
    }
    return elemento;
};

function transformarEstado(estado) {
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

function criarCapa(livro) {
    const capa = criarElemento("img");
    capa.src = livro.capa || CAPA_POR_DEFEITO;
    capa.alt = `Capa do livro ${livro.titulo}`;
    capa.width = 100;
    capa.addEventListener("error", () => {
        capa.src = CAPA_POR_DEFEITO;
    }, { once: true });
    return capa;
};

function criarClassificacao(nota) {
    const estrelas = criarElemento("p", "★".repeat(nota) + "☆".repeat(5 - nota));
    estrelas.setAttribute("aria-label", `${nota} de 5 estrelas`);
    return estrelas;
};

function criarTextos(livro) {
    const textos = [
        criarElemento("h3", livro.titulo),
        criarElemento("p", livro.autor),
        criarElemento("p", `${livro.generos.join(", ")} · ${livro.idioma}`),
    ];
    if (livro.saga) {
        textos.push(criarElemento("p", `Saga: ${livro.saga}`));
    }
    if (livro.estado === "lido" && livro.classificacao > 0) {
        textos.push(criarClassificacao(livro.classificacao));
    }
    return textos;
}

function criarBotaoEstado(livro) {
    const botao = criarElemento("button", `${transformarEstado(livro.estado)} ▾`);
    botao.type = "button";
    botao.dataset.estado = livro.estado;
    return botao;
};

function criarBotaoFavorito(livro) {
    const botao = criarElemento("button", livro.favorito ? "★" : "☆");
    botao.type = "button";
    botao.setAttribute("aria-pressed", livro.favorito);
    botao.setAttribute("aria-label", "Favorito");
    return botao;
};

function criarLinkGoodreads(livro) {
    const pesquisa = `https://www.goodreads.com/search?q=${encodeURIComponent(
        `${livro.titulo} ${livro.autor}`
    )}`;

    const link = criarElemento("a", "Goodreads ↗");
    link.href = livro.goodreads || pesquisa;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
};

function criarFigura(livro) {
    const figura = criarElemento("figure");
    const legenda = criarElemento("figcaption");

    legenda.append(criarLinkGoodreads(livro));
    figura.append(criarCapa(livro), legenda);
    return figura;
}

function criarAcoes(livro) {
    const acoes = criarElemento("div");
    acoes.className = "acoes-livro";
    acoes.append(criarBotaoEstado(livro), criarBotaoFavorito(livro));
    return acoes;
};

function criarInfo(livro) {
    const info = criarElemento("div");
    info.className = "info-livro";
    info.append(...criarTextos(livro), criarAcoes(livro));
    return info;
};

function criarBotaoRemover(livro) {
    const botao = criarElemento("button", "✕");
    botao.type = "button";
    botao.className = "botao-remover";
    botao.setAttribute("aria-label", `Remover ${livro.titulo}`);
    botao.title = "Remover livro";
    return botao;
};

export function criarCartaoLivro(livro) {
    const item = criarElemento("li");
    const cartao = criarElemento("article");
    cartao.dataset.id = livro.id;
    cartao.append(criarFigura(livro), criarInfo(livro), criarBotaoRemover(livro));
    item.append(cartao);
    return item;
};

export function mostrarLivros(livros, contentor) {
    if (livros.length === 0) {
        contentor.replaceChildren(criarElemento("li", "Nenhum livro encontrado."));
        return;
    }
    contentor.replaceChildren(...livros.map(criarCartaoLivro));
};