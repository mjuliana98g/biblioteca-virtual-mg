import {
    calcularPercentagem,
    criarCapa,
    criarElemento,
    formatarData,
    formatarQuantidade,
    obterDataHoje,
} from "./utilidades.js";

export const TEXTOS_ESTADO = {
    "quero-ler": "Quero ler",
    "a-ler": "A ler",
    "lido": "Lido",
};
const CLASSIFICACAO_MAXIMA = 5;
const NUMERO_DE_GENEROS = 5;
const CLASSIFICACOES_POSSIVEIS = Array.from({ length: 20 }, (_, posicao) => (posicao + 1) * 0.25);

const mediaClassificacoes = document.querySelector("#media-classificacoes");
const graficoClassificacoes = document.querySelector("#grafico-classificacoes");
const textoTotalClassificados = document.querySelector("#total-classificados");
const listaGeneros = document.querySelector("#lista-generos");
const listaCapasCincoEstrelas = document.querySelector("#capas-cinco-estrelas");
const textoTotalCincoEstrelas = document.querySelector("#total-cinco-estrelas");
const progressoTexto = document.querySelector("#progresso-texto");
const progressoBarra = document.querySelector("#progresso-barra");
const contadorLeituras = document.querySelector("#contador-leituras");
const contadorLancamentos = document.querySelector("#contador-lancamentos");
const contadorEstante = document.querySelector("#contador-estante");
const contadorFavoritos = document.querySelector("#contador-favoritos");

export function criarLinkGoodreads(livro) {
    const termo = encodeURIComponent(`${livro.titulo} ${livro.autor}`);
    const pesquisa = `https://www.goodreads.com/search?q=${termo}`;

    return criarElemento("a", {
        textContent: "Goodreads ↗",
        href: livro.goodreads || pesquisa,
        target: "_blank",
        rel: "noopener noreferrer",
    });
};

function criarBotaoAcao(texto, acao, classe = "") {
    return criarElemento("button", { textContent: texto, className: classe, dados: { acao } });
};

function criarSeletorEstado(livro) {
    const botao = criarBotaoAcao(`${TEXTOS_ESTADO[livro.estado]} ▾`, "menu");
    const opcoes = Object.entries(TEXTOS_ESTADO).map(([estado, texto]) => {
        const opcao = criarBotaoAcao(texto, "estado");

        opcao.dataset.novoEstado = estado;
        opcao.ariaCurrent = estado === livro.estado ? "true" : null;

        return criarElemento("li", { filhos: [opcao] });
    });

    botao.dataset.estado = livro.estado;
    botao.ariaExpanded = "false";

    return criarElemento("div", {
        className: "seletor-estado",
        filhos: [botao, criarElemento("ul", { className: "menu-estado", hidden: true, filhos: opcoes })],
    });
};

function criarBotaoFavorito(livro) {
    const botao = criarBotaoAcao(livro.favorito ? "❤︎" : "♡", "favorito");
    const podeSerFavorito = livro.estado === "lido" || livro.favorito;

    botao.ariaPressed = String(livro.favorito);
    botao.ariaLabel = "Favorito";
    botao.disabled = !podeSerFavorito;
    botao.title = podeSerFavorito ? "" : "Só podes marcar como favorito um livro que já leste";

    return botao;
};

function criarBotoes(livro, emLeitura) {
    if (emLeitura) {
        const botao = criarBotaoAcao("Atualizar leitura", "leitura", "botao-atualizar-leitura");

        return livro.paginas ? [botao] : [];
    }

    if (livro.dataLancamento) {
        const jaSaiu = livro.dataLancamento <= obterDataHoje();

        return jaSaiu ? [criarBotaoAcao("Já saiu", "lancar", "botao-ja-saiu")] : [];
    }

    return [criarSeletorEstado(livro), criarBotaoFavorito(livro)];
};

function criarProgresso(livro) {
    const paginasLidas = livro.paginasLidas ?? 0;
    const percentagem = calcularPercentagem(paginasLidas, livro.paginas);
    const texto = livro.paginas
        ? `${paginasLidas} de ${livro.paginas} páginas · ${percentagem}%`
        : `${percentagem}%`;
    const barra = criarElemento("progress", { max: 100, value: percentagem });

    barra.ariaLabel = `Progresso de leitura de ${livro.titulo}`;

    return criarElemento("div", {
        className: "progresso-livro",
        filhos: [barra, criarElemento("p", { textContent: texto })],
    });
};

function criarInformacao(livro, emLeitura) {
    const titulo = criarElemento("button", { textContent: livro.titulo, className: "abrir-detalhes" });
    const data = criarElemento("time", { dateTime: livro.dataLancamento });

    titulo.ariaHasPopup = "dialog";
    data.hidden = !livro.dataLancamento;
    data.textContent = livro.dataLancamento ? formatarData(livro.dataLancamento) : "";

    return criarElemento("div", {
        className: "informacao-livro",
        filhos: [
            criarElemento("h3", { filhos: [titulo] }),
            criarElemento("p", { textContent: livro.autor }),
            criarElemento("p", { textContent: livro.editora, hidden: !livro.editora }),
            data,
            criarElemento("p", { filhos: [criarLinkGoodreads(livro)] }),
            ...(emLeitura ? [criarProgresso(livro)] : []),
            criarElemento("div", { className: "acoes-livro", filhos: criarBotoes(livro, emLeitura) }),
        ],
    });
};

function criarCartao(livro, emLeitura) {
    const capa = criarElemento("figure", { filhos: [criarCapa(livro)] });
    const botaoRemover = criarBotaoAcao("✕", "remover", "botao-fechar botao-remover");
    const cartao = criarElemento("article", {
        className: emLeitura ? "cartao-leitura" : "",
        dados: { id: livro.id },
        filhos: [capa, criarInformacao(livro, emLeitura), botaoRemover],
    });

    botaoRemover.ariaLabel = `Remover ${livro.titulo}`;
    botaoRemover.title = "Remover livro";

    return criarElemento("li", { filhos: [cartao] });
};

export function mostrarCartoes(livros, lista, mensagemVazia, emLeitura = false) {
    if (livros.length === 0) {
        lista.replaceChildren(criarElemento("li", { textContent: mensagemVazia }));
        return;
    }

    lista.replaceChildren(...livros.map((livro) => criarCartao(livro, emLeitura)));
};

function criarColuna({ classificacao, livros }, maximo) {
    const nota = String(classificacao).replace(".", ",");
    const coluna = criarElemento("li", {
        tabIndex: 0,
        filhos: [
            criarElemento("span", { textContent: livros.length, className: "total" }),
            criarElemento("span", { className: "barra" }),
            criarElemento("span", { textContent: nota, className: "nota" }),
            criarElemento("ul", {
                className: "livros-da-barra",
                filhos: livros.map((livro) => criarElemento("li", { textContent: livro.titulo })),
            }),
        ],
    });

    coluna.querySelector(".barra").style.height = `${(livros.length / maximo) * 100}%`;

    return coluna;
};

export function mostrarClassificacoes(livros) {
    const classificados = livros.filter((livro) => livro.classificacao > 0);
    const soma = classificados.reduce((total, livro) => total + livro.classificacao, 0);
    const media = classificados.length > 0 ? soma / classificados.length : 0;
    const grupos = CLASSIFICACOES_POSSIVEIS
        .map((classificacao) => ({
            classificacao,
            livros: classificados.filter((livro) => livro.classificacao === classificacao),
        }))
        .filter((grupo) => grupo.livros.length > 0);
    const maximo = Math.max(...grupos.map((grupo) => grupo.livros.length), 1);

    mediaClassificacoes.value = media;
    mediaClassificacoes.textContent = media.toFixed(1).replace(".", ",");
    textoTotalClassificados.textContent =
        formatarQuantidade(classificados.length, "livro classificado", "livros classificados");
    graficoClassificacoes.replaceChildren(...grupos.map((grupo) => criarColuna(grupo, maximo)));
};

function contarGeneros(livros) {
    const contagem = livros
        .flatMap((livro) => livro.generos)
        .reduce((total, genero) => ({ ...total, [genero]: (total[genero] ?? 0) + 1 }), {});

    return Object.entries(contagem)
        .sort((a, b) => b[1] - a[1])
        .slice(0, NUMERO_DE_GENEROS);
};

export function mostrarGeneros(livros) {
    const generos = contarGeneros(livros);
    const maximo = generos[0]?.[1] ?? 1;
    const linhas = generos.map(([genero, total]) => {
        const nome = criarElemento("span", { textContent: genero });
        const numero = criarElemento("span", { textContent: total });
        const barra = criarElemento("progress", { max: maximo, value: total });

        barra.ariaLabel = `${genero}: ${total}`;

        return criarElemento("li", { filhos: [criarElemento("p", { filhos: [nome, numero] }), barra] });
    });

    listaGeneros.replaceChildren(...linhas);
};

export function mostrarCincoEstrelas(livros) {
    const cincoEstrelas = livros.filter((livro) => livro.classificacao === CLASSIFICACAO_MAXIMA);

    listaCapasCincoEstrelas.replaceChildren(
        ...cincoEstrelas.map((livro) => criarElemento("li", { filhos: [criarCapa(livro)] }))
    );
    textoTotalCincoEstrelas.textContent =
        cincoEstrelas.length === 0
            ? "Ainda não deste 5 estrelas a nenhum livro."
            : formatarQuantidade(cincoEstrelas.length, "livro com 5 estrelas", "livros com 5 estrelas");
};

export function atualizarBarraLateral({ emLeitura, lancados, porLancar, favoritos }) {
    const lidos = lancados.filter((livro) => livro.estado === "lido").length;
    const contadores = [
        [contadorLeituras, emLeitura.length],
        [contadorLancamentos, porLancar.length],
        [contadorEstante, lancados.length],
        [contadorFavoritos, favoritos.length],
    ];

    for (const [contador, total] of contadores) {
        contador.value = total;
        contador.textContent = total;
    }

    progressoTexto.textContent =
        `${lidos} de ${formatarQuantidade(lancados.length, "livro lido", "livros lidos")}`;
    progressoBarra.value = calcularPercentagem(lidos, lancados.length);
};