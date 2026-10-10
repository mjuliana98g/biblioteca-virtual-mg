import { adicionarLivro, alterarLivro, encontrarLivro, obterLivros } from "./dados.js";
import { atualizarPagina, limparFiltros } from "./acoes.js";
import { guardarValor, lerValor, normalizarTexto } from "./utilidades.js";

const CHAVE_RASCUNHO = "rascunho-livro";
const MENSAGENS = {
    porLancar: "Um livro que ainda não foi lançado só pode estar em «Quero ler».",
    classificacao: "A classificação tem de estar entre 0 e 5, de 0,25 em 0,25.",
    classificarSoLidos: "Só podes classificar livros que já leste (estado «Lido»).",
    linkGoodreads: "O link do Goodreads tem de começar por http:// ou https://.",
    linkCapa: "O link da capa tem de começar por http:// ou https://.",
    repetido: "Já tens um livro com este título e este autor.",
};
const LINK_VALIDO = /^(https?:\/\/\S+)?$/;

const dialogoFormulario = document.querySelector("#dialogo-formulario-livro");
const formulario = document.querySelector("#formulario-livro");
const tituloFormulario = document.querySelector("#titulo-formulario");
const botaoAdicionarLivro = document.querySelector("#botao-adicionar-livro");
const botaoFecharFormulario = document.querySelector("#fechar-formulario");
const botaoCancelarFormulario = document.querySelector("#cancelar-formulario");
const botaoGuardarFormulario = document.querySelector("#guardar-formulario");
const dialogoDetalhes = document.querySelector("#dialogo-detalhes");
const botaoEditarDetalhes = document.querySelector("#editar-detalhes");
const caixaPorLancar = document.querySelector("#livro-por-lancar");
const campoDataLancamento = document.querySelector("#campo-data-lancamento");
const mensagemErroFormulario = document.querySelector("#mensagem-erro-formulario");

let idEmEdicao = null;

function lerFormulario() {
    const campos = new FormData(formulario);

    return {
        titulo: campos.get("titulo").trim(),
        autor: campos.get("autor").trim(),
        editora: campos.get("editora").trim(),
        generos: campos.getAll("generos"),
        idioma: campos.get("idioma"),
        paginas: Number(campos.get("paginas")) || null,
        saga: campos.get("saga").trim(),
        estado: campos.get("estado"),
        volume: Number(campos.get("volume")) || null,
        classificacao: Number(campos.get("classificacao")),
        goodreads: campos.get("goodreads").trim(),
        capa: campos.get("capa").trim(),
        dataLancamento: caixaPorLancar.checked ? campos.get("dataLancamento") : "",
    };
};

function preencherFormulario(livro) {
    for (const campo of formulario.elements) {
        if (campo.name === "generos") {
            campo.checked = livro.generos.includes(campo.value);
        } else if (campo.name === "porLancar") {
            campo.checked = Boolean(livro.dataLancamento);
        } else if (campo.name) {
            campo.value = livro[campo.name] || "";
        }
    }

    campoDataLancamento.hidden = !caixaPorLancar.checked;
};

function guardarRascunho() {
    if (idEmEdicao === null) {
        const rascunho = { aberto: dialogoFormulario.open, livro: lerFormulario() };

        guardarValor(sessionStorage, CHAVE_RASCUNHO, rascunho);
    }
};

function mostrarErros(erros) {
    for (const campo of formulario.querySelectorAll("[aria-invalid]")) {
        campo.removeAttribute("aria-invalid");
    }

    for (const { campo } of erros) {
        formulario.elements[campo].setAttribute("aria-invalid", "true");
    }

    mensagemErroFormulario.textContent = erros[0]?.mensagem ?? "";
};

function encontrarCamposEmFalta(livro) {
    const emFalta = [
        { campo: "titulo", falha: !livro.titulo },
        { campo: "autor", falha: !livro.autor },
        { campo: "generos-livro", falha: livro.generos.length === 0 },
        { campo: "dataLancamento", falha: caixaPorLancar.checked && !livro.dataLancamento },
    ];

    return emFalta
        .filter((regra) => regra.falha)
        .map((regra) => ({ campo: regra.campo, mensagem: "Campos obrigatórios por preencher." }));
};

function estaRepetido(livro) {
    const titulo = normalizarTexto(livro.titulo);
    const autor = normalizarTexto(livro.autor);

    return obterLivros().some((outro) =>
        outro.id !== idEmEdicao &&
        normalizarTexto(outro.titulo) === titulo &&
        normalizarTexto(outro.autor) === autor
    );
};

function encontrarErrosDeRegras(livro) {
    const { classificacao, estado } = livro;
    const foraDosLimites = classificacao < 0 || classificacao > 5;
    const classificacaoInvalida = foraDosLimites || !Number.isInteger(classificacao * 4);
    const repetido = estaRepetido(livro);
    const regras = [
        [repetido, "titulo", MENSAGENS.repetido],
        [repetido, "autor", MENSAGENS.repetido],
        [caixaPorLancar.checked && estado !== "quero-ler", "estado", MENSAGENS.porLancar],
        [classificacaoInvalida, "classificacao", MENSAGENS.classificacao],
        [classificacao > 0 && estado !== "lido", "classificacao", MENSAGENS.classificarSoLidos],
        [!LINK_VALIDO.test(livro.goodreads), "goodreads", MENSAGENS.linkGoodreads],
        [!LINK_VALIDO.test(livro.capa), "capa", MENSAGENS.linkCapa],
    ];

    return regras
        .filter(([falha]) => falha)
        .map(([, campo, mensagem]) => ({ campo, mensagem }));
};

function validar(livro) {
    const erros = [...encontrarCamposEmFalta(livro), ...encontrarErrosDeRegras(livro)];

    mostrarErros(erros);

    return erros.length === 0;
};

function abrirParaEditar() {
    const livro = encontrarLivro(Number(dialogoDetalhes.dataset.id));

    dialogoDetalhes.close();
    idEmEdicao = livro.id;
    tituloFormulario.textContent = "Editar livro";
    botaoGuardarFormulario.textContent = "Guardar";
    preencherFormulario(livro);
    dialogoFormulario.showModal();
};

function limparFormulario() {
    idEmEdicao = null;
    tituloFormulario.textContent = "Adicionar livro";
    botaoGuardarFormulario.textContent = "Adicionar";
    formulario.reset();
    campoDataLancamento.hidden = true;
    mostrarErros([]);
    sessionStorage.removeItem(CHAVE_RASCUNHO);
};

function submeterFormulario(evento) {
    evento.preventDefault();

    const livro = lerFormulario();

    if (!validar(livro)) {
        return;
    }

    if (idEmEdicao === null) {
        adicionarLivro({ ...livro, id: Date.now(), favorito: false });
        limparFiltros();
    } else {
        alterarLivro(idEmEdicao, livro);
    }

    dialogoFormulario.close();
    atualizarPagina();
};

function restaurarRascunho() {
    const rascunho = lerValor(sessionStorage, CHAVE_RASCUNHO);

    if (!rascunho) {
        return;
    }

    preencherFormulario(rascunho.livro);

    if (rascunho.aberto) {
        dialogoFormulario.showModal();
    }
};

export function iniciarFormulario() {
    botaoAdicionarLivro.addEventListener("click", () => {
        dialogoFormulario.showModal();
        guardarRascunho();
    });
    botaoEditarDetalhes.addEventListener("click", abrirParaEditar);
    botaoFecharFormulario.addEventListener("click", () => dialogoFormulario.close());
    botaoCancelarFormulario.addEventListener("click", () => dialogoFormulario.close());
    dialogoFormulario.addEventListener("close", limparFormulario);
    caixaPorLancar.addEventListener("change", () => {
        campoDataLancamento.hidden = !caixaPorLancar.checked;
    });
    formulario.addEventListener("input", (evento) => {
        evento.target.closest("[aria-invalid]")?.removeAttribute("aria-invalid");
        guardarRascunho();
    });
    formulario.addEventListener("submit", submeterFormulario);
    restaurarRascunho();
};