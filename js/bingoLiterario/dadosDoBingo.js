import { guardarValor, lerValor } from "../armazenamento.js";
import { obterDataHoje } from "../dadosDosLivros.js";

const CAMINHO_DESAFIOS = "data/desafiosBingo.json";
const CHAVE_CARTAO_ATUAL = "bingo-cartao-atual";
const CHAVE_CARTOES_ANTERIORES = "bingo-cartoes-anteriores";
const DESAFIOS_POR_CARTAO = 9;
const LINHAS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
];

let desafios = [];
let cartaoAtual = null;

// ------------------------------------------------------------------------------------------

export async function carregarDesafios() {
    try {
        const resposta = await fetch(CAMINHO_DESAFIOS);

        if (!resposta.ok) {
            throw new Error(`Erro ao carregar os desafios (${resposta.status})`);
        }

        desafios = await resposta.json();
    } catch (erro) {
        console.error(erro);
    }
};

function sortearDesafios() {
    const restantes = [...desafios]; // cópia para não estragar a original
    const sorteados = [];

    while (sorteados.length < DESAFIOS_POR_CARTAO && restantes.length > 0) {
        const indice = Math.floor(Math.random() * restantes.length); // sorteia uma posição ao acaso
        sorteados.push(...restantes.splice(indice, 1)); // tira esse desafio da cópia e manda-o para os sorteados
    }

    return sorteados;
};

// ------------------------------------------------------------------------------------------

function criarCartaoBingo(numero) {
    return {
        numero,
        inicio: obterDataHoje(),
        fim: null, // só tem data quando o cartão fica completo
        quadrados: sortearDesafios().map((desafio) => ({ ...desafio, idLivro: null })),
    };
};

function guardarCartaoAtual() {
    guardarValor(localStorage, CHAVE_CARTAO_ATUAL, cartaoAtual);
};

function estaValido(cartao) { // um cartão guardado só serve se tiver os 9 quadrados
    return cartao?.quadrados?.length === DESAFIOS_POR_CARTAO;
};

function obterCartoesAnteriores() {
    return lerValor(localStorage, CHAVE_CARTOES_ANTERIORES, []);
};

function criarProximoCartao() {
    return criarCartaoBingo(obterCartoesAnteriores().length + 1);
};

export function carregarCartaoAtual() {
    const cartaoGuardado = lerValor(localStorage, CHAVE_CARTAO_ATUAL);

    cartaoAtual = estaValido(cartaoGuardado) ? cartaoGuardado : criarProximoCartao();
    guardarCartaoAtual();
};

export function obterCartaoAtual() {
    return cartaoAtual;
};

export function obterCartoesCompletos() {
    return [...obterCartoesAnteriores(), cartaoAtual].filter((cartao) => cartao.fim);
};

// ------------------------------------------------------------------------------------------

function temLivro(indice) {
    return Boolean(cartaoAtual.quadrados[indice].idLivro);
};

function temAlgumLivro() {
    return cartaoAtual.quadrados.some((quadrado) => quadrado.idLivro);
};

export function contarLinhas() {
    return LINHAS.filter((linha) => linha.every(temLivro)).length;
};

export function temBingo() {
    return cartaoAtual.quadrados.every((quadrado) => quadrado.idLivro);
};

export function estaAMeio() {
    return temAlgumLivro() && !temBingo();
};

export function obterIdsUsados() {
    return cartaoAtual.quadrados
        .map((quadrado) => quadrado.idLivro)
        .filter(Boolean);
};

export function associarLivro(indice, idLivro) { // idLivro null esvazia o quadrado
    cartaoAtual.quadrados[indice].idLivro = idLivro;
    cartaoAtual.fim = temBingo() ? obterDataHoje() : null;
    guardarCartaoAtual();
};

// ------------------------------------------------------------------------------------------

function arquivarCartaoAtual() { // só os cartões completos ficam guardados
    if (temBingo()) {
        guardarValor(localStorage, CHAVE_CARTOES_ANTERIORES, [...obterCartoesAnteriores(), cartaoAtual]);
    }
};

export function sortearNovoCartao() {
    arquivarCartaoAtual();
    cartaoAtual = criarProximoCartao();
    guardarCartaoAtual();
};