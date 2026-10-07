import { apagarValor, guardarValor, lerValor } from "./armazenamento.js";

const CHAVE_RASCUNHO = "rascunho-livro"; // chave onde se guarda o rascunho (sessionStorage)

const dialogoFormulario = document.querySelector("#dialogo-formulario-livro");
const formulario = document.querySelector("#formulario-livro");
const tituloFormulario = document.querySelector("#titulo-formulario");
const botaoAdicionarLivro = document.querySelector("#botao-adicionar-livro");
const botaoFecharFormulario = document.querySelector("#fechar-formulario");
const botaoCancelarFormulario = document.querySelector("#cancelar-formulario");
const botaoGuardarFormulario = document.querySelector("#guardar-formulario");
const caixaPorLancar = document.querySelector("#livro-por-lancar");
const campoDataLancamento = document.querySelector("#campo-data-lancamento"); // escondido se o livro não for "por lançar"
const mensagemErroFormulario = document.querySelector("#mensagem-erro-formulario");

let idLivroEdicao = null; // id do livro que está a ser editado (null = a adicionar um livro novo)

// ------------------------------------------------------------------------------------------

function lerDadosDoFormulario() { // lê os campos e devolve um objeto "dados" limpo
    const campos = formulario.elements; // os campos do formulário, acessíveis pelo id
    const generosMarcados = formulario.querySelectorAll('input[name="genero"]:checked');

    return {
        titulo: campos["titulo-livro"].value.trim(), // trim() tira os espaços do início e do fim
        autor: campos["autor-livro"].value.trim(),
        editora: campos["editora-livro"].value.trim(),
        generos: [...generosMarcados].map((caixa) => caixa.value), // lista com os géneros marcados
        idioma: campos["idioma-livro"].value,
        paginas: Number(campos["paginas-livro"].value), // converte o texto em número
        saga: campos["saga-livro"].value.trim(),
        estado: campos["estado-livro"].value,
        volume: Number(campos["volume-livro"].value),
        classificacao: Number(campos["classificacao-livro"].value),
        goodreads: campos["link-goodreads"].value.trim(),
        capa: campos["link-capa"].value.trim(),
        porLancar: campos["livro-por-lancar"].checked, // true ou false
        dataLancamento: campos["data-lancamento"].value,
    };
};

function converterDadosLivro(dados) { // transforma os dados nos campos do livro (ainda sem id)
    return {
        titulo: dados.titulo,
        autor: dados.autor,
        editora: dados.editora,
        generos: dados.generos,
        idioma: dados.idioma,
        paginas: dados.paginas > 0 ? dados.paginas : null, // 0 significa "não preenchido", guarda null
        capa: dados.capa,
        estado: dados.estado,
        classificacao: dados.classificacao,
        saga: dados.saga,
        volume: dados.volume > 0 ? dados.volume : null,
        goodreads: dados.goodreads,
        dataLancamento: dados.porLancar ? dados.dataLancamento : "", // a data só conta se for "por lançar"
    };
};

function criarLivro(dados) { // junta os campos a um id e a favorito: false
    return { id: Date.now(), favorito: false, ...converterDadosLivro(dados) }; // Date.now() são os milissegundos atuais, por isso o id é único
};

function converterLivroEmValores(livro) { // o contrário: transforma um livro nos valores para preencher o formulário ao editar
    const dataLancamento = livro.dataLancamento || "";
    const valores = { // cada chave é o id do campo
        "titulo-livro": livro.titulo,
        "autor-livro": livro.autor,
        "editora-livro": livro.editora || "", // || "" evita escrever "undefined" no campo
        "idioma-livro": livro.idioma,
        "paginas-livro": livro.paginas ?? "",
        "saga-livro": livro.saga || "",
        "estado-livro": livro.estado,
        "volume-livro": livro.volume ?? "",
        "classificacao-livro": livro.classificacao > 0 ? livro.classificacao : "",
        "link-goodreads": livro.goodreads || "",
        "link-capa": livro.capa || "",
        "livro-por-lancar": dataLancamento !== "", // marcada se o livro tem data
        "data-lancamento": dataLancamento,
    };

    for (const genero of livro.generos) {
        valores[`genero-${genero}`] = true; // as caixas dos géneros não têm id, a chave é "nome-valor"
    }

    return valores;
};

// ------------------------------------------------------------------------------------------

function obterCamposFormulario() { // todos os input e select
    return formulario.querySelectorAll("input, select");
};

function obterChaveDoCampo(campo) { // como identificar cada campo
    return campo.id || `${campo.name}-${campo.value}`; // as caixas dos géneros não têm id
};

function lerValorDoCampo(campo) {
    return campo.type === "checkbox" ? campo.checked : campo.value; // caixa: true/false, resto: texto
};

function definirValorDoCampo(campo, valor) {
    if (campo.type === "checkbox") {
        campo.checked = valor;
    } else {
        campo.value = valor;
    }
};

function lerValoresDosCampos() { // "fotografia" exata de todos os campos (usada no rascunho)
    const valores = {};

    for (const campo of obterCamposFormulario()) {
        valores[obterChaveDoCampo(campo)] = lerValorDoCampo(campo);
    }

    return valores;
};

function preencherCampos(valores) { // o contrário: preenche os campos a partir de um objeto de valores
    for (const campo of obterCamposFormulario()) {
        const chave = obterChaveDoCampo(campo);

        if (chave in valores) { // só mexe nos campos que existem no objeto
            definirValorDoCampo(campo, valores[chave]);
        }
    }
};

// ------------------------------------------------------------------------------------------

function estaEmEdicao() {
    return idLivroEdicao !== null;
};

function atualizarVisibilidadeData() { // mostra a data só se a caixa "por lançar" estiver marcada
    campoDataLancamento.hidden = !caixaPorLancar.checked;
};

function guardarRascunho() { // guarda o que está escrito no sessionStorage (dura enquanto o separador estiver aberto)
    if (estaEmEdicao()) { // ao editar não há rascunho
        return;
    }

    guardarValor(sessionStorage, CHAVE_RASCUNHO, {
        aberto: dialogoFormulario.open, // lembra se a janela estava aberta
        valores: lerValoresDosCampos(),
    });
};

function restaurarRascunho() { // ao carregar a página, recupera o que estava escrito
    const rascunho = lerValor(sessionStorage, CHAVE_RASCUNHO);

    if (!rascunho) {
        return;
    }

    preencherCampos(rascunho.valores);
    atualizarVisibilidadeData();

    if (rascunho.aberto) {
        dialogoFormulario.showModal(); // volta a abrir a janela se estava aberta
    }
};

// ------------------------------------------------------------------------------------------

function marcarCamposInvalidos(ids) { // marca os campos com erro (o CSS destaca o aria-invalid)
    for (const campo of formulario.querySelectorAll("[aria-invalid]")) {
        campo.removeAttribute("aria-invalid"); // primeiro tira as marcas antigas
    }

    for (const id of ids) {
        formulario.elements[id].setAttribute("aria-invalid", "true");
    }
};

function mostrarErro(ids, mensagem) {
    marcarCamposInvalidos(ids);
    mensagemErroFormulario.textContent = mensagem;
};

function limparMarcacaoDoCampo(evento) { // quando voltas a escrever, tira a marca de erro desse campo
    evento.target.closest("[aria-invalid]")?.removeAttribute("aria-invalid"); // closest sobe até ao elemento marcado; ?. não faz nada se não houver
};

// ------------------------------------------------------------------------------------------

function definirModoDoFormulario(id) { // id = editar esse livro, null = adicionar um novo
    idLivroEdicao = id;
    tituloFormulario.textContent = estaEmEdicao() ? "Editar livro" : "Adicionar livro";
    botaoGuardarFormulario.textContent = estaEmEdicao() ? "Guardar" : "Adicionar";
};

function abrirDialogoParaAdicionar() {
    dialogoFormulario.showModal();
    guardarRascunho(); // regista logo que a janela está aberta
};

export function abrirDialogoParaEditar(livro) {
    definirModoDoFormulario(livro.id);
    preencherCampos(converterLivroEmValores(livro));
    atualizarVisibilidadeData();
    dialogoFormulario.showModal();
};

function limparFormulario() { // corre sempre que a janela fecha (evento "close")
    definirModoDoFormulario(null);
    formulario.reset(); // esvazia os campos
    atualizarVisibilidadeData();
    marcarCamposInvalidos([]);
    mensagemErroFormulario.textContent = "";
    apagarValor(sessionStorage, CHAVE_RASCUNHO); // já não há rascunho
};

// ------------------------------------------------------------------------------------------

function estaVazioOuELinkValido(texto) { // o link é opcional, mas se existir tem de começar por http:// ou https://
    return texto === "" || /^https?:\/\/\S+$/.test(texto);
};

function estaClassificacaoValida(classificacao) { // entre 0 e 5, de 0,25 em 0,25
    return classificacao >= 0 && classificacao <= 5 && Number.isInteger(classificacao * 4); // x4 tem de dar um número inteiro
};

function encontrarCamposEmFalta(dados) { // devolve os campos obrigatórios por preencher
    const regras = [
        { campo: "titulo-livro", falha: dados.titulo === "" },
        { campo: "autor-livro", falha: dados.autor === "" },
        { campo: "generos-livro", falha: dados.generos.length === 0 },
        { campo: "data-lancamento", falha: dados.porLancar && dados.dataLancamento === "" },
    ];

    return regras.filter((regra) => regra.falha).map((regra) => regra.campo); // fica só com as que falham e só com o nome do campo
};

function encontrarPrimeiroErro(dados) { // percorre as regras e devolve a primeira que falha (a ordem importa)
    const regras = [
        {
            campo: "estado-livro",
            falha: dados.porLancar && dados.estado !== "quero-ler",
            mensagem: "Um livro que ainda não foi lançado só pode estar em «Quero ler».",
        },
        {
            campo: "classificacao-livro",
            falha: !estaClassificacaoValida(dados.classificacao),
            mensagem: "A classificação tem de estar entre 0 e 5, de 0,25 em 0,25.",
        },
        {
            campo: "classificacao-livro",
            falha: dados.classificacao > 0 && dados.estado !== "lido",
            mensagem: "Só podes classificar livros que já leste (estado «Lido»).",
        },
        {
            campo: "link-goodreads",
            falha: !estaVazioOuELinkValido(dados.goodreads),
            mensagem: "O link do Goodreads tem de começar por http:// ou https://.",
        },
        {
            campo: "link-capa",
            falha: !estaVazioOuELinkValido(dados.capa),
            mensagem: "O link da capa tem de começar por http:// ou https://.",
        },
    ];

    return regras.find((regra) => regra.falha); // se nenhuma falhar, devolve undefined
};

function validarDados(dados) { // devolve true se está tudo bem; senão mostra o erro e devolve false
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

// ------------------------------------------------------------------------------------------

function submeterFormulario(evento, aoAdicionar, aoEditar) {
    evento.preventDefault(); // impede a página de recarregar

    const dados = lerDadosDoFormulario();

    if (!validarDados(dados)) {
        return;
    }

    if (estaEmEdicao()) {
        aoEditar(idLivroEdicao, converterDadosLivro(dados)); // aoEditar e aoAdicionar vêm do principal.js
    } else {
        aoAdicionar(criarLivro(dados));
    }

    dialogoFormulario.close(); // ao fechar, o evento "close" chama limparFormulario
};

export function iniciarFormulario(aoAdicionar, aoEditar) { // liga os eventos e restaura o rascunho
    botaoAdicionarLivro.addEventListener("click", abrirDialogoParaAdicionar);
    botaoFecharFormulario.addEventListener("click", () => dialogoFormulario.close());
    botaoCancelarFormulario.addEventListener("click", () => dialogoFormulario.close());
    dialogoFormulario.addEventListener("close", limparFormulario);
    caixaPorLancar.addEventListener("change", atualizarVisibilidadeData);
    formulario.addEventListener("input", guardarRascunho); // a cada letra escrita
    formulario.addEventListener("input", limparMarcacaoDoCampo);
    formulario.addEventListener("submit", (evento) =>
        submeterFormulario(evento, aoAdicionar, aoEditar)
    );

    restaurarRascunho();
};