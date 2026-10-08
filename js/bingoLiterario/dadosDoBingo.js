import { guardarValor, lerValor } from "../armazenamento.js";
import { obterDataHoje } from "../dadosDosLivros.js";

const CAMINHO_DESAFIOS = "data/desafiosBingo.json";
const CHAVE_CARTAO_ATUAL = "bingo-cartao-atual";
const DESAFIOS_POR_CARTAO = 9;

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

export function sortearDesafios() {
    const restantes = [...desafios]; // cópia para não estragar a original
    const sorteados = [];

    while (sorteados.length < DESAFIOS_POR_CARTAO && restantes.length > 0) {
        const indice = Math.floor(Math.random() * restantes.length); // enquanto não houver 9 sorteados e ainda sobrarem desafios, sorteia uma posição ao acaso
        sorteados.push(...restantes.splice(indice, 1)); // tira esse desafio da cópia, e manda para os sorteados
    }

    return sorteados;
}; 

function criarCartaoBingo(numero) {
    return {
        numero,
        inicio: obterDataHoje(),
        quadrados: sortearDesafios().map((desafio) => ({ ...desafio, idLivro: null })),
    };
};

function guardarCartaoAtual() { // no localStorage
    guardarValor(localStorage, CHAVE_CARTAO_ATUAL, cartaoAtual);
};

function estaCompleto(cartao) {
    return cartao?.quadrados?.length === DESAFIOS_POR_CARTAO;
};

export function carregarCartaoAtual() { // lê o cartão guardado - se não houver, ou se estiver incompleto, cria o cartão n.º 1 e guarda-o
    const cartaoGuardado = lerValor(localStorage, CHAVE_CARTAO_ATUAL);

    cartaoAtual = estaCompleto(cartaoGuardado) ? cartaoGuardado : criarCartaoBingo(1);
    guardarCartaoAtual();
};

export function obterCartaoAtual() {
    return cartaoAtual;
};

export function sortearNovoCartao() { // cria um cartão com o nº seguinte, substitui o atual e guarda-o
    cartaoAtual = criarCartaoBingo(cartaoAtual.numero + 1);
    guardarCartaoAtual();
};