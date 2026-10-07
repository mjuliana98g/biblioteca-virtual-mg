import { calcularPaginas, calcularPercentagem } from "./dadosDosLivros.js";
import { criarFiguraComLink, criarListaDetalhes } from "./cartoesDosLivros.js";

const dialogoDetalhes = document.querySelector("#dialogo-detalhes");
const tituloDetalhes = document.querySelector("#titulo-detalhes");
const conteudoDetalhes = document.querySelector("#conteudo-detalhes");
const botaoFecharDetalhes = document.querySelector("#fechar-detalhes");
const botaoEditarDetalhes = document.querySelector("#editar-detalhes");

const dialogoConfirmarRemocao = document.querySelector("#dialogo-confirmar-remocao");
const mensagemConfirmarRemocao = document.querySelector("#mensagem-confirmar-remocao");
const dialogoConfirmarLancamento = document.querySelector("#dialogo-confirmar-lancamento");
const mensagemConfirmarLancamento = document.querySelector("#mensagem-confirmar-lancamento");
const dialogoConfirmarConclusao = document.querySelector("#dialogo-confirmar-conclusao");
const mensagemConfirmarConclusao = document.querySelector("#mensagem-confirmar-conclusao");

const dialogoLeitura = document.querySelector("#dialogo-atualizar-leitura");
const tituloLeitura = document.querySelector("#livro-atualizar-leitura");
const campoPaginasLidas = document.querySelector("#paginas-lidas");
const campoPercentagemLida = document.querySelector("#percentagem-lida");
const botaoFecharLeitura = document.querySelector("#fechar-leitura");
const botaoCancelarLeitura = document.querySelector("#cancelar-leitura");

let livroAbertoDetalhe = null;
let totalDePaginasLeitura = 0;

// ------------------------------------------------------------------------------------------

export function abrirDialogoDetalhes(livro) {
    livroAbertoDetalhe = livro;
    tituloDetalhes.textContent = livro.titulo;
    conteudoDetalhes.replaceChildren(criarFiguraComLink(livro), criarListaDetalhes(livro));
    dialogoDetalhes.showModal();
};

function fecharAoClicarNoFundo(evento) {
    if (evento.target === dialogoDetalhes) {
        dialogoDetalhes.close();
    }
};

export function iniciarDialogoDetalhes(aoEditar) {
    botaoFecharDetalhes.addEventListener("click", () => dialogoDetalhes.close());
    dialogoDetalhes.addEventListener("click", fecharAoClicarNoFundo);
    botaoEditarDetalhes.addEventListener("click", () => {
        dialogoDetalhes.close();
        aoEditar(livroAbertoDetalhe);
    });
};

// ------------------------------------------------------------------------------------------

function esperarFechoDialogo(dialogo, converterResposta) {
    dialogo.returnValue = "";

    return new Promise((resolver) => {
        dialogo.addEventListener(
            "close",
            () => resolver(converterResposta(dialogo.returnValue)),
            { once: true }
        );
        dialogo.showModal();
    });
};

function pedirConfirmacao(dialogo, elementoMensagem, pergunta, respostaDeConfirmacao) {
    elementoMensagem.textContent = pergunta;

    return esperarFechoDialogo(dialogo, (resposta) => resposta === respostaDeConfirmacao);
};

export function confirmarRemocao(livro) {
    return pedirConfirmacao(
        dialogoConfirmarRemocao,
        mensagemConfirmarRemocao,
        `Queres remover "${livro.titulo}" da tua estante?`,
        "remover"
    );
};

export function confirmarLancamento(livro) {
    return pedirConfirmacao(
        dialogoConfirmarLancamento,
        mensagemConfirmarLancamento,
        `Queres adicionar "${livro.titulo}" à tua estante?`,
        "sim"
    );
};

export function confirmarConclusao(livro) {
    return pedirConfirmacao(
        dialogoConfirmarConclusao,
        mensagemConfirmarConclusao,
        `Terminaste "${livro.titulo}"? Queres marcá-lo como lido?`,
        "sim"
    );
};

// ------------------------------------------------------------------------------------------

function atualizarPercentagemLida() {
    campoPercentagemLida.value = calcularPercentagem(
        Number(campoPaginasLidas.value),
        totalDePaginasLeitura
    );
};

function atualizarPaginasLidas() {
    campoPaginasLidas.value = calcularPaginas(
        Number(campoPercentagemLida.value),
        totalDePaginasLeitura
    );
};

function preencherDialogoLeitura(livro) { // Mete os valores do livro nos campos antes de abrir
    const paginasLidas = livro.paginasLidas ?? 0;

    totalDePaginasLeitura = livro.paginas;
    tituloLeitura.textContent = livro.titulo;
    campoPaginasLidas.max = livro.paginas;
    campoPaginasLidas.value = paginasLidas;
    campoPercentagemLida.value = calcularPercentagem(paginasLidas, livro.paginas);
};

export function pedirProgressoLeitura(livro) {
    preencherDialogoLeitura(livro);

    return esperarFechoDialogo(dialogoLeitura, (resposta) =>
        resposta === "guardar" ? Number(campoPaginasLidas.value) : null
    );
};

export function iniciarDialogoLeitura() {
    campoPaginasLidas.addEventListener("input", atualizarPercentagemLida);
    campoPercentagemLida.addEventListener("input", atualizarPaginasLidas);
    botaoFecharLeitura.addEventListener("click", () => dialogoLeitura.close());
    botaoCancelarLeitura.addEventListener("click", () => dialogoLeitura.close());
};