import { apagar, guardar, ler } from "./armazenamento.js";

const CHAVE_RASCUNHO = "rascunho-livro";

const dialogo = document.querySelector("#dialogo-formulario-livro");
const formulario = document.querySelector("#formulario-livro");
const titulo = document.querySelector("#titulo-formulario");
const botaoAbrir = document.querySelector("#botao-adicionar-livro");
const botaoFechar = document.querySelector("#fechar-formulario");
const botaoCancelar = document.querySelector("#cancelar-formulario");
const botaoGuardar = document.querySelector("#guardar-formulario");
const caixaPorLancar = document.querySelector("#livro-por-lancar");
const campoDataLancamento = document.querySelector("#campo-data-lancamento");
const mensagemErro = document.querySelector("#mensagem-erro-formulario");

function verificarSeLinkValido(texto) {
    return texto === "" || /^https?:\/\/\S+$/.test(texto);
};

function verificarIntClassificacao(classificacao) {
    return classificacao >= 0 && classificacao <= 5 && Number.isInteger(classificacao * 4);
};

function encontrarCamposEmFalta(dados) {
    const regras = [
        { campo: "titulo-livro", falha: dados.titulo === "" },
        { campo: "autor-livro", falha: dados.autor === "" },
        { campo: "generos-livro", falha: dados.generos.length === 0 },
        { campo: "data-lancamento", falha: dados.porLancar && dados.dataLancamento === "" },
    ];

    return regras.filter((regra) => regra.falha).map((regra) => regra.campo);
};

function encontrarPrimeiroErro(dados) {
    const regras = [
        {
            campo: "estado-livro",
            falha: dados.porLancar && dados.estado !== "quero-ler",
            mensagem: "Um livro que ainda não foi lançado só pode estar em «Quero ler».",
        },
        {
            campo: "classificacao-livro",
            falha: !verificarIntClassificacao(dados.classificacao),
            mensagem: "A classificação tem de estar entre 0 e 5, de 0,25 em 0,25.",
        },
        {
            campo: "classificacao-livro",
            falha: dados.classificacao > 0 && dados.estado !== "lido",
            mensagem: "Só podes classificar livros que já leste (estado «Lido»).",
        },
        {
            campo: "link-goodreads",
            falha: !verificarSeLinkValido(dados.goodreads),
            mensagem: "O link do Goodreads tem de começar por http:// ou https://.",
        },
        {
            campo: "link-capa",
            falha: !verificarSeLinkValido(dados.capa),
            mensagem: "O link da capa tem de começar por http:// ou https://.",
        },
    ];

    return regras.find((regra) => regra.falha);
};

function lerDadosDoFormulario() {
    const campos = formulario.elements;
    const generosMarcados = formulario.querySelectorAll('input[name="genero"]:checked');

    return {
        titulo: campos["titulo-livro"].value.trim(),
        autor: campos["autor-livro"].value.trim(),
        generos: [...generosMarcados].map((caixa) => caixa.value),
        idioma: campos["idioma-livro"].value,
        paginas: Number(campos["paginas-livro"].value),
        saga: campos["saga-livro"].value.trim(),
        estado: campos["estado-livro"].value,
        volume: Number(campos["volume-livro"].value),
        classificacao: Number(campos["classificacao-livro"].value),
        goodreads: campos["link-goodreads"].value.trim(),
        capa: campos["link-capa"].value.trim(),
        porLancar: campos["livro-por-lancar"].checked,
        dataLancamento: campos["data-lancamento"].value,
    };
};

function criarCamposDoLivro(dados) {
    return {
        titulo: dados.titulo,
        autor: dados.autor,
        generos: dados.generos,
        idioma: dados.idioma,
        paginas: dados.paginas > 0 ? dados.paginas : null,
        capa: dados.capa,
        estado: dados.estado,
        classificacao: dados.classificacao,
        saga: dados.saga,
        volume: dados.volume > 0 ? dados.volume : null,
        goodreads: dados.goodreads,
        dataLancamento: dados.porLancar ? dados.dataLancamento : "",
    };
};

function criarLivro(dados) {
    return { id: Date.now(), favorito: false, ...criarCamposDoLivro(dados) };
};

function converterLivroEmValores(livro) {
    const dataLancamento = livro.dataLancamento || "";
    const valores = {
        "titulo-livro": livro.titulo,
        "autor-livro": livro.autor,
        "idioma-livro": livro.idioma,
        "paginas-livro": livro.paginas ?? "",
        "saga-livro": livro.saga || "",
        "estado-livro": livro.estado,
        "volume-livro": livro.volume ?? "",
        "classificacao-livro": livro.classificacao > 0 ? livro.classificacao : "",
        "link-goodreads": livro.goodreads || "",
        "link-capa": livro.capa || "",
        "livro-por-lancar": dataLancamento !== "",
        "data-lancamento": dataLancamento,
    };

    for (const genero of livro.generos) {
        valores[`genero-${genero}`] = true;
    }

    return valores;
};

function obterCampos() {
    return formulario.querySelectorAll("input, select");
};

function obterChaveDoCampo(campo) {
    return campo.id || `${campo.name}-${campo.value}`;
};

function lerValorDoCampo(campo) {
    return campo.type === "checkbox" ? campo.checked : campo.value;
};

function atribuirValorAoCampo(campo, valor) {
    if (campo.type === "checkbox") {
        campo.checked = valor;
    } else {
        campo.value = valor;
    }
};

function lerValores() {
    const valores = {};

    for (const campo of obterCampos()) {
        valores[obterChaveDoCampo(campo)] = lerValorDoCampo(campo);
    }

    return valores;
};

function preencherValores(valores) {
    for (const campo of obterCampos()) {
        const chave = obterChaveDoCampo(campo);

        if (chave in valores) {
            atribuirValorAoCampo(campo, valores[chave]);
        }
    }
};

let idEmEdicao = null;

function estaEmEdicao() {
    return idEmEdicao !== null;
};

function guardarRascunho() {
    if (estaEmEdicao()) {
        return;
    }

    guardar(sessionStorage, CHAVE_RASCUNHO, {
        aberto: dialogo.open,
        valores: lerValores(),
    });
};

function atualizarCampoDataLancamento() {
    campoDataLancamento.hidden = !caixaPorLancar.checked;
};

function restaurarRascunho() {
    const rascunho = ler(sessionStorage, CHAVE_RASCUNHO);

    if (!rascunho) {
        return;
    }

    preencherValores(rascunho.valores);
    atualizarCampoDataLancamento();

    if (rascunho.aberto) {
        dialogo.showModal();
    }
};

function definirLivroEmEdicao(id) {
    idEmEdicao = id;
    titulo.textContent = estaEmEdicao() ? "Editar livro" : "Adicionar livro";
    botaoGuardar.textContent = estaEmEdicao() ? "Guardar" : "Adicionar";
};

function abrirParaAdicionar() {
    dialogo.showModal();
    guardarRascunho();
};

export function abrirParaEditar(livro) {
    definirLivroEmEdicao(livro.id);
    preencherValores(converterLivroEmValores(livro));
    atualizarCampoDataLancamento();
    dialogo.showModal();
};

function marcarCamposInvalidos(ids) {
    for (const campo of formulario.querySelectorAll("[aria-invalid]")) {
        campo.removeAttribute("aria-invalid");
    }

    for (const id of ids) {
        formulario.elements[id].setAttribute("aria-invalid", "true");
    }
};

function mostrarErro(ids, mensagem) {
    marcarCamposInvalidos(ids);
    mensagemErro.textContent = mensagem;
};

function limparMarcacaoDoCampo(evento) {
    evento.target.closest("[aria-invalid]")?.removeAttribute("aria-invalid");
};

function limparFormulario() {
    definirLivroEmEdicao(null);
    formulario.reset();
    atualizarCampoDataLancamento();
    marcarCamposInvalidos([]);
    mensagemErro.textContent = "";
    apagar(sessionStorage, CHAVE_RASCUNHO);
};

function validarDados(dados) {
    const camposEmFalta = encontrarCamposEmFalta(dados);

    if (camposEmFalta.length > 0) {
        mostrarErro(camposEmFalta, "Campos obrigatórios por preencher.");
        return false;
    }

    const erro = encontrarPrimeiroErro(dados);

    if (erro) {
        mostrarErro([erro.campo], erro.mensagem);
        return false;
    }

    return true;
};

function submeterFormulario(evento, aoAdicionar, aoEditar) {
    evento.preventDefault();

    const dados = lerDadosDoFormulario();

    if (!validarDados(dados)) {
        return;
    }

    if (estaEmEdicao()) {
        aoEditar(idEmEdicao, criarCamposDoLivro(dados));
    } else {
        aoAdicionar(criarLivro(dados));
    }

    dialogo.close();
};

export function iniciarFormulario(aoAdicionar, aoEditar) {
    botaoAbrir.addEventListener("click", abrirParaAdicionar);
    botaoFechar.addEventListener("click", () => dialogo.close());
    botaoCancelar.addEventListener("click", () => dialogo.close());
    dialogo.addEventListener("close", limparFormulario);
    caixaPorLancar.addEventListener("change", atualizarCampoDataLancamento);
    formulario.addEventListener("input", guardarRascunho);
    formulario.addEventListener("input", limparMarcacaoDoCampo);
    formulario.addEventListener("submit", (evento) =>
        submeterFormulario(evento, aoAdicionar, aoEditar)
    );

    restaurarRascunho();
};