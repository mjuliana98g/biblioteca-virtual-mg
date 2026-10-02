import { calcularPaginas, calcularPercentagem } from "./biblioteca.js";
import {
    formatarData,
    criarCapa,
    criarElemento,
    criarLinkGoodreads,
    obterTextoEstado,
} from "./cartoes.js";

const dialogoDetalhes = document.querySelector("#dialogo-detalhes");
const dialogoLeitura = document.querySelector("#dialogo-atualizar-leitura");
const livroDaLeitura = document.querySelector("#livro-atualizar-leitura");
const campoPaginasLidas = document.querySelector("#paginas-lidas");
const campoPercentagemLida = document.querySelector("#percentagem-lida");
const botaoFecharLeitura = document.querySelector("#fechar-leitura");
const botaoCancelarLeitura = document.querySelector("#cancelar-leitura");
const dialogoConclusao = document.querySelector("#dialogo-confirmar-conclusao");
const mensagemConclusao = document.querySelector("#mensagem-confirmar-conclusao");
const tituloDetalhes = document.querySelector("#titulo-detalhes");
const conteudoDetalhes = document.querySelector("#conteudo-detalhes");
const botaoFecharDetalhes = document.querySelector("#fechar-detalhes");
const botaoEditarDetalhes = document.querySelector("#editar-detalhes");
const dialogoRemocao = document.querySelector("#dialogo-confirmar-remocao");
const mensagemRemocao = document.querySelector("#mensagem-confirmar-remocao");
const dialogoLancamento = document.querySelector("#dialogo-confirmar-lancamento");
const mensagemLancamento = document.querySelector("#mensagem-confirmar-lancamento");

let livroAberto = null;
let totalDePaginas = 0;

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

function esperarFecho(dialogo, obterResultado) {
    dialogo.returnValue = "";

    return new Promise((resolver) => {
        dialogo.addEventListener(
            "close",
            () => resolver(obterResultado(dialogo.returnValue)),
            { once: true }
        );
        dialogo.showModal();
    });
};

function perguntar(dialogo, mensagem, texto, respostaDeConfirmacao) {
    mensagem.textContent = texto;

    return esperarFecho(dialogo, (resposta) => resposta === respostaDeConfirmacao);
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

export function confirmarConclusao(livro) {
    return perguntar(
        dialogoConclusao,
        mensagemConclusao,
        `Terminaste "${livro.titulo}"? Queres marcá-lo como lido?`,
        "sim"
    );
};

function atualizarPercentagemLida() {
    campoPercentagemLida.value = calcularPercentagem(
        Number(campoPaginasLidas.value),
        totalDePaginas
    );
};

function atualizarPaginasLidas() {
    campoPaginasLidas.value = calcularPaginas(
        Number(campoPercentagemLida.value),
        totalDePaginas
    );
};

function preencherLeitura(livro) {
    const paginasLidas = livro.paginasLidas ?? 0;

    totalDePaginas = livro.paginas;
    livroDaLeitura.textContent = livro.titulo;
    campoPaginasLidas.max = livro.paginas;
    campoPaginasLidas.value = paginasLidas;
    campoPercentagemLida.value = calcularPercentagem(paginasLidas, livro.paginas);
};

export function pedirProgressoLeitura(livro) {
    preencherLeitura(livro);

    return esperarFecho(dialogoLeitura, (resposta) =>
        resposta === "guardar" ? Number(campoPaginasLidas.value) : null
    );
};

export function iniciarLeitura() {
    campoPaginasLidas.addEventListener("input", atualizarPercentagemLida);
    campoPercentagemLida.addEventListener("input", atualizarPaginasLidas);
    botaoFecharLeitura.addEventListener("click", () => dialogoLeitura.close());
    botaoCancelarLeitura.addEventListener("click", () => dialogoLeitura.close());
};