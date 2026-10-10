import { alterarLivro, encontrarLivro, obterLivros, removerLivro } from "./dados.js";
import {
    atualizarBarraLateral,
    criarLinkGoodreads,
    mostrarCartoes,
    mostrarCincoEstrelas,
    mostrarClassificacoes,
    mostrarGeneros,
    TEXTOS_ESTADO,
} from "./paginaLivros.js";
import {
    calcularPercentagem,
    criarCapa,
    criarElemento,
    esperarResposta,
    formatarData,
    guardarValor,
    lerValor,
    listarUnicosOrdenados,
    normalizarTexto,
} from "./utilidades.js";

const CHAVE_ORDENACAO = "ordenacao";
const CHAVE_AVISO_BINGO = "bingo-aviso-pendente";

const zonaFiltros = document.querySelector("#estante search");
const campoPesquisa = document.querySelector("#filtro-pesquisa");
const filtroGenero = document.querySelector("#filtro-genero");
const filtroSaga = document.querySelector("#filtro-saga");
const filtroEditora = document.querySelector("#filtro-editora");
const filtrosEstado = document.querySelector("#filtros-estado");
const campoOrdenacao = document.querySelector("#ordenacao");

const zonaPrincipal = document.querySelector("main");
const listaLeituras = document.querySelector("#lista-leituras");
const listaLancamentos = document.querySelector("#lista-lancamentos");
const listaLivros = document.querySelector("#lista-livros");
const listaFavoritos = document.querySelector("#lista-favoritos");

const avisoBingo = document.querySelector("#aviso-bingo");
const linkAvisoBingo = document.querySelector("#link-aviso-bingo");
const botaoRemoverAviso = document.querySelector("#remover-aviso-bingo");

const dialogoDetalhes = document.querySelector("#dialogo-detalhes");
const tituloDetalhes = document.querySelector("#titulo-detalhes");
const conteudoDetalhes = document.querySelector("#conteudo-detalhes");
const botaoFecharDetalhes = document.querySelector("#fechar-detalhes");

const dialogoConfirmar = document.querySelector("#dialogo-confirmar");
const tituloConfirmar = document.querySelector("#titulo-confirmar");
const mensagemConfirmar = document.querySelector("#mensagem-confirmar");
const botaoSimConfirmar = document.querySelector("#sim-confirmar");

const dialogoLeitura = document.querySelector("#dialogo-atualizar-leitura");
const tituloLeitura = document.querySelector("#livro-atualizar-leitura");
const campoPaginasLidas = document.querySelector("#paginas-lidas");
const campoPercentagemLida = document.querySelector("#percentagem-lida");

// ------------------------------------------------------------------------------------------
// FILTROS E ORDENAÇÃO
// ------------------------------------------------------------------------------------------

function filtrarEOrdenar(livros) {
    const termo = normalizarTexto(campoPesquisa.value.trim());
    const estado = filtrosEstado.querySelector("input:checked").value;
    const criterio = campoOrdenacao.value;

    return livros
        .filter((livro) =>
            normalizarTexto(`${livro.titulo} ${livro.autor}`).includes(termo) &&
            (filtroGenero.value === "todos" || livro.generos.includes(filtroGenero.value)) &&
            (filtroSaga.value === "todas" || livro.saga === filtroSaga.value) &&
            (filtroEditora.value === "todas" || livro.editora === filtroEditora.value) &&
            (estado === "todos" || livro.estado === estado)
        )
        .sort((a, b) => a[criterio].localeCompare(b[criterio], "pt"));
};

function preencherFiltros(livros) {
    const filtros = [
        [filtroGenero, livros.flatMap((livro) => livro.generos)],
        [filtroSaga, livros.map((livro) => livro.saga)],
        [filtroEditora, livros.map((livro) => livro.editora)],
    ];

    for (const [filtro, valores] of filtros) {
        const escolhido = filtro.value;
        const opcoes = listarUnicosOrdenados(valores);
        const [opcaoTodos] = filtro.options;

        filtro.replaceChildren(opcaoTodos, ...opcoes.map((opcao) => new Option(opcao, opcao)));
        filtro.value = opcoes.includes(escolhido) ? escolhido : opcaoTodos.value;
    }
};

export function limparFiltros() {
    campoPesquisa.value = "";
    filtroGenero.value = "todos";
    filtroSaga.value = "todas";
    filtroEditora.value = "todas";
    filtrosEstado.querySelector('input[value="todos"]').checked = true;
};

// ------------------------------------------------------------------------------------------
// ATUALIZAR A PÁGINA
// ------------------------------------------------------------------------------------------

function mostrarAvisoBingo() {
    const livro = encontrarLivro(lerValor(sessionStorage, CHAVE_AVISO_BINGO));

    avisoBingo.hidden = !livro;
    linkAvisoBingo.textContent = livro
        ? `Leste "${livro.titulo}"! Verificar Bingo Literário →`
        : "";
};

export function atualizarPagina() {
    const livros = obterLivros();
    const lancados = livros.filter((livro) => !livro.dataLancamento);
    const porLancar = livros
        .filter((livro) => livro.dataLancamento)
        .sort((a, b) => a.dataLancamento.localeCompare(b.dataLancamento));
    const favoritos = lancados.filter((livro) => livro.favorito);
    const emLeitura = lancados.filter((livro) => livro.estado === "a-ler");

    preencherFiltros(lancados);
    mostrarCartoes(emLeitura, listaLeituras, "Não estás a ler nenhum livro de momento.", true);
    mostrarCartoes(porLancar, listaLancamentos, "Ainda não há lançamentos à espera.");
    mostrarCartoes(filtrarEOrdenar(lancados), listaLivros, "Nenhum livro encontrado.");
    mostrarCartoes(favoritos, listaFavoritos, "Ainda não tens livros favoritos.");
    mostrarClassificacoes(lancados);
    mostrarGeneros(lancados);
    mostrarCincoEstrelas(lancados);
    atualizarBarraLateral({ emLeitura, lancados, porLancar, favoritos });
    mostrarAvisoBingo();
};

// ------------------------------------------------------------------------------------------
// DETALHES DO LIVRO
// ------------------------------------------------------------------------------------------

function listarDetalhes(livro) {
    const classificacao = livro.classificacao > 0
        ? `★ ${String(livro.classificacao).replace(".", ",")} / 5`
        : "Sem classificação";
    const lancamento = livro.dataLancamento ? formatarData(livro.dataLancamento) : "";
    const detalhes = [
        ["Autor", livro.autor],
        ["Editora", livro.editora],
        ["Géneros", livro.generos.join(", ")],
        ["Idioma", livro.idioma],
        ["Páginas", livro.paginas],
        ["Saga", livro.saga],
        ["Volume", livro.volume],
        ["Estado", TEXTOS_ESTADO[livro.estado]],
        ["Classificação", classificacao],
        ["Lançamento", lancamento],
    ];

    return detalhes.filter(([, valor]) => valor);
};

function abrirDetalhes(livro) {
    const legenda = criarElemento("figcaption", { filhos: [criarLinkGoodreads(livro)] });
    const linhas = listarDetalhes(livro).flatMap(([nome, valor]) => [
        criarElemento("dt", { textContent: nome }),
        criarElemento("dd", { textContent: valor }),
    ]);

    dialogoDetalhes.dataset.id = livro.id;
    tituloDetalhes.textContent = livro.titulo;
    conteudoDetalhes.replaceChildren(
        criarElemento("figure", { filhos: [criarCapa(livro), legenda] }),
        criarElemento("dl", { filhos: linhas })
    );
    dialogoDetalhes.showModal();
};

// ------------------------------------------------------------------------------------------
// PERGUNTAS
// ------------------------------------------------------------------------------------------

async function confirmar(titulo, pergunta, textoSim) {
    tituloConfirmar.textContent = titulo;
    mensagemConfirmar.textContent = pergunta;
    botaoSimConfirmar.textContent = textoSim;

    return (await esperarResposta(dialogoConfirmar)) === "sim";
};

async function pedirProgresso(livro) {
    const paginasLidas = livro.paginasLidas ?? 0;

    tituloLeitura.textContent = livro.titulo;
    campoPaginasLidas.max = livro.paginas;
    campoPaginasLidas.value = paginasLidas;
    campoPercentagemLida.value = calcularPercentagem(paginasLidas, livro.paginas);

    const resposta = await esperarResposta(dialogoLeitura);

    return resposta === "guardar" ? Number(campoPaginasLidas.value) : null;
};

// ------------------------------------------------------------------------------------------
// AÇÕES DOS CARTÕES
// ------------------------------------------------------------------------------------------

function fecharMenus() {
    for (const menu of document.querySelectorAll(".menu-estado")) {
        menu.hidden = true;
        menu.previousElementSibling.ariaExpanded = "false";
    }
};

function alternarMenu(botao) {
    const menu = botao.nextElementSibling;
    const vaiAbrir = menu.hidden;

    fecharMenus();
    menu.hidden = !vaiAbrir;
    botao.ariaExpanded = String(vaiAbrir);
};

function mudarEstado(livro, estado) {
    alterarLivro(livro.id, { estado });

    if (estado === "lido" && livro.estado !== "lido") {
        guardarValor(sessionStorage, CHAVE_AVISO_BINGO, livro.id);
    }
};

async function atualizarLeitura(livro) {
    const paginasLidas = await pedirProgresso(livro);

    if (paginasLidas === null) {
        return;
    }

    alterarLivro(livro.id, { paginasLidas });

    const terminou = paginasLidas === livro.paginas;
    const pergunta = `Terminaste "${livro.titulo}"? Queres marcá-lo como lido?`;

    if (terminou && (await confirmar("Leitura concluída", pergunta, "Sim"))) {
        mudarEstado(livro, "lido");
    }
};

async function confirmarERemover(livro) {
    const pergunta = `Queres remover "${livro.titulo}" da tua estante?`;

    if (await confirmar("Remover livro", pergunta, "Remover")) {
        removerLivro(livro.id);
    }
};

async function confirmarELancar(livro) {
    const pergunta = `Queres adicionar "${livro.titulo}" à tua estante?`;

    if (await confirmar("Já saiu", pergunta, "Sim")) {
        alterarLivro(livro.id, { dataLancamento: "" });
    }
};

async function tratarClique(evento) {
    const cartao = evento.target.closest("article");
    const botao = evento.target.closest("[data-acao]");

    if (!cartao || evento.target.closest("a")) {
        return;
    }

    const livro = encontrarLivro(Number(cartao.dataset.id));

    switch (botao?.dataset.acao) {
        case "menu":
            alternarMenu(botao);
            return;
        case "favorito":
            alterarLivro(livro.id, { favorito: !livro.favorito });
            break;
        case "estado":
            mudarEstado(livro, botao.dataset.novoEstado);
            break;
        case "remover":
            await confirmarERemover(livro);
            break;
        case "lancar":
            await confirmarELancar(livro);
            break;
        case "leitura":
            await atualizarLeitura(livro);
            break;
        default:
            if (!evento.target.closest(".seletor-estado")) {
                abrirDetalhes(livro);
            }
            return;
    }

    atualizarPagina();
};

// ------------------------------------------------------------------------------------------
// ARRANQUE
// ------------------------------------------------------------------------------------------

export function iniciarDialogos() {
    botaoFecharDetalhes.addEventListener("click", () => dialogoDetalhes.close());
    dialogoDetalhes.addEventListener("click", (evento) => {
        if (evento.target === dialogoDetalhes) {
            dialogoDetalhes.close();
        }
    });
    campoPaginasLidas.addEventListener("input", () => {
        const paginas = Number(campoPaginasLidas.value);

        campoPercentagemLida.value = calcularPercentagem(paginas, Number(campoPaginasLidas.max));
    });
    campoPercentagemLida.addEventListener("input", () => {
        const percentagem = Number(campoPercentagemLida.value);

        campoPaginasLidas.value = Math.round((percentagem / 100) * Number(campoPaginasLidas.max));
    });
};

export function iniciarAcoes() {
    const removerAviso = () => {
        sessionStorage.removeItem(CHAVE_AVISO_BINGO);
        avisoBingo.hidden = true;
    };

    campoOrdenacao.value = lerValor(sessionStorage, CHAVE_ORDENACAO, "titulo");

    zonaFiltros.addEventListener("input", () => {
        guardarValor(sessionStorage, CHAVE_ORDENACAO, campoOrdenacao.value);
        atualizarPagina();
    });
    zonaPrincipal.addEventListener("click", tratarClique);
    linkAvisoBingo.addEventListener("click", removerAviso);
    botaoRemoverAviso.addEventListener("click", removerAviso);
    document.addEventListener("click", (evento) => {
        if (!evento.target.closest(".seletor-estado")) {
            fecharMenus();
        }
    });
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            fecharMenus();
        }
    });
};