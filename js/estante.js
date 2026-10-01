import { guardar, ler } from "./armazenamento.js";
import {
    alterarEstado,
    alternarFavorito,
    encontrarLivro,
    marcarComoLancado,
    obterLivrosLancados,
    obterLivrosPorLancar,
    removerLivro,
} from "./biblioteca.js";
import { mostrarLivros } from "./cartoes.js";
import { abrirDetalhes, confirmarLancamento, confirmarRemocao } from "./dialogos.js";

const CHAVE_ORDENACAO = "ordenacao";

const campoPesquisa = document.querySelector("#filtro-pesquisa");
const filtroGenero = document.querySelector("#filtro-genero");
const filtroSaga = document.querySelector("#filtro-saga");
const filtrosEstado = document.querySelector("#filtros-estado");
const campoOrdenacao = document.querySelector("#ordenacao");
const progressoTexto = document.querySelector("#progresso-texto");
const progressoBarra = document.querySelector("#progresso-barra");
const contadorLancamentos = document.querySelector("#contador-lancamentos");
const contadorEstante = document.querySelector("#contador-estante");
const contadorFavoritos = document.querySelector("#contador-favoritos");
const listaLancamentos = document.querySelector("#lista-lancamentos");
const listaLivros = document.querySelector("#lista-livros");
const listaFavoritos = document.querySelector("#lista-favoritos");

function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
};

function obterEstadoSelecionado() {
    return filtrosEstado.querySelector('input[name="estado"]:checked').value;
};

function filtrarPorPesquisa(livros) {
    const termo = normalizarTexto(campoPesquisa.value.trim());

    return livros.filter((livro) =>
        normalizarTexto(`${livro.titulo} ${livro.autor}`).includes(termo)
    );
};

function filtrarSeHouverEscolha(livros, escolha, valorTodos, corresponde) {
    return escolha === valorTodos
        ? livros
        : livros.filter((livro) => corresponde(livro, escolha));
};

function filtrarLivros(livros) {
    const pesquisados = filtrarPorPesquisa(livros);
    const doGenero = filtrarSeHouverEscolha(
        pesquisados,
        filtroGenero.value,
        "todos",
        (livro, genero) => livro.generos.includes(genero)
    );
    const daSaga = filtrarSeHouverEscolha(
        doGenero,
        filtroSaga.value,
        "todas",
        (livro, saga) => livro.saga === saga
    );

    return filtrarSeHouverEscolha(
        daSaga,
        obterEstadoSelecionado(),
        "todos",
        (livro, estado) => livro.estado === estado
    );
};

function ordenarLivros(livros) {
    const criterio = campoOrdenacao.value;

    return [...livros].sort((a, b) => a[criterio].localeCompare(b[criterio], "pt"));
};

function listarUnicosOrdenados(valores) {
    return [...new Set(valores)].sort((a, b) => a.localeCompare(b, "pt"));
};

function listarGeneros(livros) {
    return listarUnicosOrdenados(livros.flatMap((livro) => livro.generos));
};

function listarSagas(livros) {
    return listarUnicosOrdenados(
        livros.filter((livro) => livro.saga).map((livro) => livro.saga)
    );
};

function preencherFiltro(filtro, opcoes, valorTodos, textoTodos) {
    const selecionado = filtro.value;

    filtro.replaceChildren(
        new Option(textoTodos, valorTodos),
        ...opcoes.map((opcao) => new Option(opcao, opcao))
    );

    filtro.value = opcoes.includes(selecionado) ? selecionado : valorTodos;
};

function preencherFiltros(livros) {
    preencherFiltro(filtroGenero, listarGeneros(livros), "todos", "Todos");
    preencherFiltro(filtroSaga, listarSagas(livros), "todas", "Todas");
};

export function limparFiltros() {
    campoPesquisa.value = "";
    filtroGenero.value = "todos";
    filtroSaga.value = "todas";
    filtrosEstado.querySelector('input[value="todos"]').checked = true;
};

function restaurarOrdenacao() {
    campoOrdenacao.value = ler(sessionStorage, CHAVE_ORDENACAO, "titulo");

    if (!campoOrdenacao.value) {
        campoOrdenacao.value = "titulo";
    }
};

function guardarOrdenacao() {
    guardar(sessionStorage, CHAVE_ORDENACAO, campoOrdenacao.value);
};

function iniciarFiltros() {
    restaurarOrdenacao();

    campoPesquisa.addEventListener("input", atualizarPagina);
    filtroGenero.addEventListener("change", atualizarPagina);
    filtroSaga.addEventListener("change", atualizarPagina);
    filtrosEstado.addEventListener("change", atualizarPagina);
    campoOrdenacao.addEventListener("change", () => {
        guardarOrdenacao();
        atualizarPagina();
    });
};

function atualizarContador(contador, total) {
    contador.textContent = total;
    contador.value = total;
};

function contarLivrosLidos(livros) {
    return livros.reduce(
        (total, livro) => (livro.estado === "lido" ? total + 1 : total),
        0
    );
};

function atualizarProgresso(livros) {
    const total = livros.length;
    const lidos = contarLivrosLidos(livros);
    const palavra = total === 1 ? "livro lido" : "livros lidos";

    progressoTexto.textContent = `${lidos} de ${total} ${palavra}`;
    progressoBarra.value = total === 0 ? 0 : Math.round((lidos / total) * 100);
};

function atualizarBarraLateral({ lancados, porLancar, favoritos }) {
    atualizarContador(contadorLancamentos, porLancar.length);
    atualizarContador(contadorEstante, lancados.length);
    atualizarContador(contadorFavoritos, favoritos.length);
    atualizarProgresso(lancados);
};

function fecharMenusDeEstado() {
    document.querySelectorAll(".menu-estado").forEach((menu) => {
        menu.hidden = true;
        menu.previousElementSibling.setAttribute("aria-expanded", "false");
    });
};

function alternarMenuDeEstado(botao) {
    const menu = botao.nextElementSibling;
    const vaiAbrir = menu.hidden;

    fecharMenusDeEstado();
    menu.hidden = !vaiAbrir;
    botao.setAttribute("aria-expanded", vaiAbrir);
};

export function atualizarPagina() {
    const lancados = obterLivrosLancados();
    const porLancar = obterLivrosPorLancar();
    const favoritos = lancados.filter((livro) => livro.favorito);

    preencherFiltros(lancados);
    mostrarLivros(porLancar, listaLancamentos, "Ainda não há lançamentos à espera.");
    mostrarLivros(ordenarLivros(filtrarLivros(lancados)), listaLivros);
    mostrarLivros(favoritos, listaFavoritos, "Ainda não tens livros favoritos.");
    atualizarBarraLateral({ lancados, porLancar, favoritos });
};

function obterIdDoCartao(elemento) {
    return Number(elemento.closest("article").dataset.id);
};

function obterLivroDoCartao(elemento) {
    return encontrarLivro(obterIdDoCartao(elemento));
};

function alternarFavoritoDoCartao(botao) {
    alternarFavorito(obterIdDoCartao(botao));
    atualizarPagina();
};

function alterarEstadoDoCartao(opcao) {
    alterarEstado(obterIdDoCartao(opcao), opcao.dataset.novoEstado);
    atualizarPagina();
};

async function removerLivroDoCartao(botao) {
    const livro = obterLivroDoCartao(botao);

    if (await confirmarRemocao(livro)) {
        removerLivro(livro.id);
        atualizarPagina();
    }
};

async function lancarLivroDoCartao(botao) {
    const livro = obterLivroDoCartao(botao);

    if (await confirmarLancamento(livro)) {
        marcarComoLancado(livro.id);
        atualizarPagina();
    }
};

function abrirDetalhesDoCartao(cartao) {
    abrirDetalhes(obterLivroDoCartao(cartao));
};

function ignorarClique() {};

const ACOES_DOS_CARTOES = [
    { seletor: "[aria-pressed]", executar: alternarFavoritoDoCartao },
    { seletor: "button[data-estado]", executar: alternarMenuDeEstado },
    { seletor: "[data-novo-estado]", executar: alterarEstadoDoCartao },
    { seletor: ".botao-remover", executar: removerLivroDoCartao },
    { seletor: ".botao-ja-saiu", executar: lancarLivroDoCartao },
    { seletor: "a, .seletor-estado", executar: ignorarClique },
    { seletor: "article", executar: abrirDetalhesDoCartao },
];

function tratarCliqueNaLista(evento) {
    const acao = ACOES_DOS_CARTOES.find(({ seletor }) => evento.target.closest(seletor));

    if (acao) {
        acao.executar(evento.target.closest(acao.seletor));
    }
};

function fecharMenusAoClicarFora(evento) {
    if (!evento.target.closest(".seletor-estado")) {
        fecharMenusDeEstado();
    }
};

function fecharMenusAoPrimirEscape(evento) {
    if (evento.key === "Escape") {
        fecharMenusDeEstado();
    }
};


function registarEventos() {
    for (const lista of [listaLancamentos, listaLivros, listaFavoritos]) {
        lista.addEventListener("click", tratarCliqueNaLista);
    }

    document.addEventListener("click", fecharMenusAoClicarFora);
    document.addEventListener("keydown", fecharMenusAoPrimirEscape);
};

export function iniciarEstante() {
    iniciarFiltros();
    registarEventos();
};