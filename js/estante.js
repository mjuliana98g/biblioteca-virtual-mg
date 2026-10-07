import { guardarValor, lerValor } from "./armazenamento.js";
import {
    alterarEstado,
    alternarFavorito,
    calcularPercentagem,
    encontrarLivro,
    guardarProgressoLeitura,
    marcarComoLancado,
    obterLivrosLancados,
    obterLivrosPorLancar,
    removerLivro,
} from "./dadosDosLivros.js";
import { mostrarCartoes, mostrarCartoesLeitura } from "./cartoesDosLivros.js";
import {
    abrirDialogoDetalhes,
    confirmarConclusao,
    confirmarLancamento,
    confirmarRemocao,
    pedirProgressoLeitura,
} from "./dialogos.js";
import { atualizarEstatisticas } from "./estatisticas.js";
import { desenharRoleta, iniciarRoleta } from "./desafioRoleta.js";

const CHAVE_ORDENACAO = "ordenacao";

const campoPesquisa = document.querySelector("#filtro-pesquisa");
const filtroGenero = document.querySelector("#filtro-genero");
const filtroSaga = document.querySelector("#filtro-saga");
const filtroEditora = document.querySelector("#filtro-editora");
const filtrosEstado = document.querySelector("#filtros-estado");
const campoOrdenacao = document.querySelector("#ordenacao");

const progressoTexto = document.querySelector("#progresso-texto");
const progressoBarra = document.querySelector("#progresso-barra");
const contadorLeituras = document.querySelector("#contador-leituras");
const contadorLancamentos = document.querySelector("#contador-lancamentos");
const contadorEstante = document.querySelector("#contador-estante");
const contadorFavoritos = document.querySelector("#contador-favoritos");

const listaLeituras = document.querySelector("#lista-leituras");
const listaLancamentos = document.querySelector("#lista-lancamentos");
const listaLivros = document.querySelector("#lista-livros");
const listaFavoritos = document.querySelector("#lista-favoritos");

// ------------------------------------------------------------------------------------------

function normalizarTexto(texto) { // tira acentos e maiúsculas, para a pesquisa os ignorar
    return texto
        .normalize("NFD") // separa as letras dos acentos (é vira e + ´)
        .replace(/[\u0300-\u036f]/g, "") // apaga os acentos
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

function filtrarSeHouverEscolha(livros, escolha, valorTodos, corresponde) { // se a escolha for "todos" não filtra; senão, fica só com os livros em que corresponde(livro, escolha) é true
    return escolha === valorTodos
        ? livros
        : livros.filter((livro) => corresponde(livro, escolha));
};

function filtrarLivros(livros) { // aplica os filtros um a seguir ao outro
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
    const daEditora = filtrarSeHouverEscolha(
        daSaga,
        filtroEditora.value,
        "todas",
        (livro, editora) => livro.editora === editora
    );

    return filtrarSeHouverEscolha(
        daEditora,
        obterEstadoSelecionado(),
        "todos",
        (livro, estado) => livro.estado === estado
    );
};

function ordenarLivros(livros) {
    const criterio = campoOrdenacao.value; // "titulo" ou "autor"

    return [...livros].sort((a, b) => a[criterio].localeCompare(b[criterio], "pt")); // [...livros] faz uma cópia, porque o sort altera a lista original
};

function listarUnicosOrdenados(valores) {
    return [...new Set(valores)].sort((a, b) => a.localeCompare(b, "pt")); // o Set tira os repetidos
};

function listarGeneros(livros) {
    return listarUnicosOrdenados(livros.flatMap((livro) => livro.generos)); // flatMap junta as listas de géneros de todos os livros numa só
};

function listarValoresPreenchidos(livros, campo) { // campo: "saga" ou "editora"
    return listarUnicosOrdenados(
        livros.map((livro) => livro[campo]).filter(Boolean) // filter(Boolean) tira os vazios
    );
};

function preencherFiltro(filtro, opcoes, valorTodos, textoTodos) {
    const selecionado = filtro.value;

    filtro.replaceChildren(
        new Option(textoTodos, valorTodos), // primeira opção: "Todos"
        ...opcoes.map((opcao) => new Option(opcao, opcao))
    );

    filtro.value = opcoes.includes(selecionado) ? selecionado : valorTodos; // mantém a escolha se ela ainda existir
};

function preencherFiltros(livros) {
    preencherFiltro(filtroGenero, listarGeneros(livros), "todos", "Todos");
    preencherFiltro(filtroSaga, listarValoresPreenchidos(livros, "saga"), "todas", "Todas");
    preencherFiltro(filtroEditora, listarValoresPreenchidos(livros, "editora"), "todas", "Todas");
};

export function limparFiltros() {
    campoPesquisa.value = "";
    filtroGenero.value = "todos";
    filtroSaga.value = "todas";
    filtroEditora.value = "todas";
    filtrosEstado.querySelector('input[value="todos"]').checked = true;
};

function restaurarOrdenacao() { // recupera a ordenação escolhida (sessionStorage)
    campoOrdenacao.value = lerValor(sessionStorage, CHAVE_ORDENACAO, "titulo");

    if (!campoOrdenacao.value) { // se o valor guardado não existir nas opções, o campo fica vazio
        campoOrdenacao.value = "titulo";
    }
};

function guardarOrdenacao() {
    guardarValor(sessionStorage, CHAVE_ORDENACAO, campoOrdenacao.value);
};

// ------------------------------------------------------------------------------------------

function atualizarContador(contador, total) {
    contador.textContent = total; // o que se vê
    contador.value = total; // o valor do <data>
};

function contarLivrosLidos(livros) {
    return livros.filter((livro) => livro.estado === "lido").length;
};

function atualizarProgresso(livros) {
    const total = livros.length;
    const lidos = contarLivrosLidos(livros);
    const palavra = total === 1 ? "livro lido" : "livros lidos";

    progressoTexto.textContent = `${lidos} de ${total} ${palavra}`;
    progressoBarra.value = calcularPercentagem(lidos, total);
};

function atualizarBarraLateral({ emLeitura, lancados, porLancar, favoritos }) { // recebe um objeto e tira as 4 listas de dentro dele
    atualizarContador(contadorLeituras, emLeitura.length);
    atualizarContador(contadorLancamentos, porLancar.length);
    atualizarContador(contadorEstante, lancados.length);
    atualizarContador(contadorFavoritos, favoritos.length);
    atualizarProgresso(lancados);
};

// ------------------------------------------------------------------------------------------

export function atualizarPagina() { // redesenha tudo; chama-se sempre que algo muda
    const lancados = obterLivrosLancados();
    const porLancar = obterLivrosPorLancar();
    const favoritos = lancados.filter((livro) => livro.favorito);
    const emLeitura = lancados.filter((livro) => livro.estado === "a-ler");
    const queroLer = lancados.filter((livro) => livro.estado === "quero-ler");

    preencherFiltros(lancados); // primeiro os filtros, porque o filtrarLivros precisa deles
    mostrarCartoesLeitura(emLeitura, listaLeituras);
    mostrarCartoes(porLancar, listaLancamentos, "Ainda não há lançamentos à espera.");
    mostrarCartoes(ordenarLivros(filtrarLivros(lancados)), listaLivros);
    mostrarCartoes(favoritos, listaFavoritos, "Ainda não tens livros favoritos.");
    atualizarEstatisticas(lancados);
    desenharRoleta(queroLer);
    atualizarBarraLateral({ emLeitura, lancados, porLancar, favoritos });
};

// ------------------------------------------------------------------------------------------

function obterIdDoCartao(elemento) { // sobe até ao <article> do cartão e lê o data-id
    return Number(elemento.closest("article").dataset.id);
};

function obterLivroDoCartao(elemento) {
    return encontrarLivro(obterIdDoCartao(elemento));
};

function fecharMenusDeEstado() {
    document.querySelectorAll(".menu-estado").forEach((menu) => {
        menu.hidden = true;
        menu.previousElementSibling.setAttribute("aria-expanded", "false"); // o botão que está antes do menu
    });
};

function alternarMenuDeEstado(botao) {
    const menu = botao.nextElementSibling; // o menu está logo a seguir ao botão
    const vaiAbrir = menu.hidden;

    fecharMenusDeEstado(); // só um menu aberto de cada vez
    menu.hidden = !vaiAbrir;
    botao.setAttribute("aria-expanded", vaiAbrir);
};

function alternarFavoritoDoCartao(botao) {
    alternarFavorito(obterIdDoCartao(botao));
    atualizarPagina();
};

function alterarEstadoDoCartao(opcao) {
    alterarEstado(obterIdDoCartao(opcao), opcao.dataset.novoEstado); // o novo estado está no data-novo-estado da opção
    atualizarPagina();
};

async function removerLivroDoCartao(botao) {
    const livro = obterLivroDoCartao(botao);

    if (await confirmarRemocao(livro)) { // espera pela resposta na janela
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

async function atualizarLeituraDoCartao(botao) {
    const livro = obterLivroDoCartao(botao);
    const paginasLidas = await pedirProgressoLeitura(livro);

    if (paginasLidas === null) { // cancelou
        return;
    }

    guardarProgressoLeitura(livro.id, paginasLidas);

    if (paginasLidas === livro.paginas && (await confirmarConclusao(livro))) { // chegou ao fim: pergunta se quer marcar como lido
        alterarEstado(livro.id, "lido");
    }

    atualizarPagina();
};

function abrirDetalhesDoCartao(cartao) {
    abrirDialogoDetalhes(obterLivroDoCartao(cartao));
};

function ignorarClique() { }; // cliques em links e no seletor de estado não abrem os detalhes

const ACOES_DOS_CARTOES = [ // a ordem importa: o primeiro seletor que corresponder ganha, por isso o "article" (abrir detalhes) fica em último
    { seletor: "[aria-pressed]", executar: alternarFavoritoDoCartao },
    { seletor: "button[data-estado]", executar: alternarMenuDeEstado },
    { seletor: "[data-novo-estado]", executar: alterarEstadoDoCartao },
    { seletor: ".botao-remover", executar: removerLivroDoCartao },
    { seletor: ".botao-ja-saiu", executar: lancarLivroDoCartao },
    { seletor: ".botao-atualizar-leitura", executar: atualizarLeituraDoCartao },
    { seletor: "a, .seletor-estado", executar: ignorarClique },
    { seletor: "article", executar: abrirDetalhesDoCartao },
];

function tratarCliqueNaLista(evento) { // um só "ouvinte" por lista (delegação de eventos): descobre em que parte do cartão clicaste
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

// ------------------------------------------------------------------------------------------

function iniciarFiltros() {
    restaurarOrdenacao();

    campoPesquisa.addEventListener("input", atualizarPagina); // a cada letra escrita
    filtroGenero.addEventListener("change", atualizarPagina);
    filtroSaga.addEventListener("change", atualizarPagina);
    filtroEditora.addEventListener("change", atualizarPagina);
    filtrosEstado.addEventListener("change", atualizarPagina);
    campoOrdenacao.addEventListener("change", () => {
        guardarOrdenacao();
        atualizarPagina();
    });
};

function iniciarCliquesDosCartoes() {
    for (const lista of [listaLeituras, listaLancamentos, listaLivros, listaFavoritos]) {
        lista.addEventListener("click", tratarCliqueNaLista);
    }

    document.addEventListener("click", fecharMenusAoClicarFora);
    document.addEventListener("keydown", fecharMenusAoPrimirEscape);
};

function comecarALerLivroSorteado(livro) { // entregue à roleta, que a chama quando carregas em "Começar a ler"
    alterarEstado(livro.id, "a-ler");
    atualizarPagina();
};

export function iniciarEstante() {
    iniciarRoleta(comecarALerLivroSorteado);
    iniciarFiltros();
    iniciarCliquesDosCartoes();
};