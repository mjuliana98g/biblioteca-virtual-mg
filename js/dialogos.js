import {
    criarCapa,
    criarElemento,
    criarLinkGoodreads,
    obterTextoEstado,
} from "./cartoes.js";

const dialogoDetalhes = document.querySelector("#dialogo-detalhes");
const tituloDetalhes = document.querySelector("#titulo-detalhes");
const conteudoDetalhes = document.querySelector("#conteudo-detalhes");
const botaoFecharDetalhes = document.querySelector("#fechar-detalhes");
const botaoEditarDetalhes = document.querySelector("#editar-detalhes");
const dialogoRemocao = document.querySelector("#dialogo-confirmar-remocao");
const mensagemRemocao = document.querySelector("#mensagem-confirmar-remocao");
const dialogoLancamento = document.querySelector("#dialogo-confirmar-lancamento");
const mensagemLancamento = document.querySelector("#mensagem-confirmar-lancamento");

let livroAberto = null;

function formatarData(data) {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

function formatarClassificacao(classificacao) {
    return classificacao > 0
        ? `★ ${classificacao.toLocaleString("pt-PT")} / 5`
        : "Sem classificação";
};

function listarDetalhes(livro) {
    const detalhes = [
        ["Autor", livro.autor],
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

function criarListaDetalhes(livro) {
    const lista = criarElemento("dl");

    for (const [nome, valor] of listarDetalhes(livro)) {
        lista.append(
            criarElemento("dt", { texto: nome }),
            criarElemento("dd", { texto: String(valor) })
        );
    }

    return lista;
};

function criarFiguraComLink(livro) {
    const figura = criarElemento("figure");
    const legenda = criarElemento("figcaption");

    legenda.append(criarLinkGoodreads(livro));
    figura.append(criarCapa(livro), legenda);

    return figura;
};

function fecharAoClicarNoFundo(evento) {
    if (evento.target === dialogoDetalhes) {
        dialogoDetalhes.close();
    }
};

export function abrirDetalhes(livro) {
    livroAberto = livro;
    tituloDetalhes.textContent = livro.titulo;
    conteudoDetalhes.replaceChildren(criarFiguraComLink(livro), criarListaDetalhes(livro));
    dialogoDetalhes.showModal();
};

export function iniciarDetalhes(aoEditar) {
    botaoFecharDetalhes.addEventListener("click", () => dialogoDetalhes.close());
    dialogoDetalhes.addEventListener("click", fecharAoClicarNoFundo);
    botaoEditarDetalhes.addEventListener("click", () => {
        dialogoDetalhes.close();
        aoEditar(livroAberto);
    });
};

function perguntar(dialogo, mensagem, texto, respostaDeConfirmacao) {
    mensagem.textContent = texto;
    dialogo.returnValue = "";

    return new Promise((resolver) => {
        dialogo.addEventListener(
            "close",
            () => resolver(dialogo.returnValue === respostaDeConfirmacao),
            { once: true }
        );
        dialogo.showModal();
    });
};

export function confirmarRemocao(livro) {
    return perguntar(
        dialogoRemocao,
        mensagemRemocao,
        `Queres remover "${livro.titulo}" da tua estante?`,
        "remover"
    );
};

export function confirmarLancamento(livro) {
    return perguntar(
        dialogoLancamento,
        mensagemLancamento,
        `Queres adicionar "${livro.titulo}" à tua estante?`,
        "sim"
    );
};