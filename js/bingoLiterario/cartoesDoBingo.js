import { criarBotao, criarElemento } from "../cartoesDosLivros.js";
import { obterCartaoAtual, sortearNovoCartao } from "./dadosDoBingo.js";

const COLUNAS = 3;
const LETRAS_DAS_COLUNAS = "ABC";

const informacaoCartao = document.querySelector("#informacao-cartao");
const cartela = document.querySelector("#cartela-bingo");
const botaoNovoCartao = document.querySelector("#botao-novo-cartao");

// ------------------------------------------------------------------------------------------

function calcularCoordenada(indice) {
    const letra = LETRAS_DAS_COLUNAS[indice % COLUNAS];
    const linha = Math.floor(indice / COLUNAS) + 1;

    return `${letra}${linha}`;
};

function formatarDiaMes(data) {
    const [, mes, dia] = data.split("-");

    return `${dia}/${mes}`;
};

function criarQuadrado(desafio, indice) {
    const quadrado = criarBotao(desafio.texto, `quadrado-bingo categoria-${desafio.categoria}`);
    const coordenada = criarElemento("small", { texto: calcularCoordenada(indice), classe: "coordenada" });
    const item = criarElemento("li");

    quadrado.prepend(coordenada);
    item.append(quadrado);

    return item;
};

function desenharInformacao(cartao) { // desenha a linha
    informacaoCartao.textContent = `Cartão n.º ${cartao.numero} · iniciado a ${formatarDiaMes(cartao.inicio)}`;
};

function desenharCartela(quadrados) { // desenha os quadrados
    cartela.replaceChildren(...quadrados.map(criarQuadrado));
};

export function atualizarPagina() {
    const cartao = obterCartaoAtual();

    desenharInformacao(cartao);
    desenharCartela(cartao.quadrados);
};

function trocarCartao() {
    sortearNovoCartao();
    atualizarPagina();
};

export function iniciarPaginaDoBingo() {
    botaoNovoCartao.addEventListener("click", trocarCartao);
};