import { carregarJson, guardarValor, lerValor, obterDataHoje } from "../utilidades.js";
import { obterLivros } from "../dados.js";

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

function criarCartao() {
    const restantes = [...desafios];
    const sorteados = [];

    while (sorteados.length < DESAFIOS_POR_CARTAO && restantes.length > 0) {
        const posicao = Math.floor(Math.random() * restantes.length);

        sorteados.push(...restantes.splice(posicao, 1));
    }

    return {
        numero: lerValor(localStorage, CHAVE_CARTOES_ANTERIORES, []).length + 1,
        inicio: obterDataHoje(),
        fim: null,
        quadrados: sorteados.map((desafio) => ({ ...desafio, idLivro: null })),
    };
};

export async function carregarBingo() {
    const cartaoGuardado = lerValor(localStorage, CHAVE_CARTAO_ATUAL);
    const guardadoValido = cartaoGuardado?.quadrados?.length === DESAFIOS_POR_CARTAO;
    const idsLidos = obterLivros()
        .filter((livro) => livro.estado === "lido")
        .map((livro) => livro.id);

    desafios = await carregarJson(CAMINHO_DESAFIOS);
    cartaoAtual = guardadoValido ? cartaoGuardado : criarCartao();

    if (!cartaoAtual.fim) {
        guardarQuadrados(cartaoAtual.quadrados.map((quadrado) =>
            idsLidos.includes(quadrado.idLivro) ? quadrado : { ...quadrado, idLivro: null }
        ));
    }
};

export function obterCartaoAtual() {
    return cartaoAtual;
};

export function obterCartoesCompletos() {
    const anteriores = lerValor(localStorage, CHAVE_CARTOES_ANTERIORES, []);

    return [...anteriores, cartaoAtual].filter((cartao) => cartao.fim);
};

export function obterIdsUsados() {
    return cartaoAtual.quadrados.map((quadrado) => quadrado.idLivro).filter(Boolean);
};

export function contarLinhas() {
    const { quadrados } = cartaoAtual;

    return LINHAS.filter((linha) => linha.every((posicao) => quadrados[posicao].idLivro)).length;
};

export function temBingo() {
    return obterIdsUsados().length === cartaoAtual.quadrados.length;
};

export function estaAMeio() {
    return obterIdsUsados().length > 0 && !temBingo();
};

function guardarQuadrados(quadrados) {
    const completo = quadrados.every((quadrado) => quadrado.idLivro);
    const fim = completo ? (cartaoAtual.fim ?? obterDataHoje()) : null;

    cartaoAtual = { ...cartaoAtual, quadrados, fim };
    guardarValor(localStorage, CHAVE_CARTAO_ATUAL, cartaoAtual);
};

export function associarLivro(posicao, livro) {
    const escolha = { idLivro: livro?.id ?? null, titulo: livro?.titulo ?? null };

    guardarQuadrados(cartaoAtual.quadrados.map((quadrado, indice) =>
        indice === posicao ? { ...quadrado, ...escolha } : quadrado
    ));
};

export function sortearNovoCartao() {
    if (temBingo()) {
        guardarValor(localStorage, CHAVE_CARTOES_ANTERIORES, obterCartoesCompletos());
    }

    cartaoAtual = criarCartao();
    guardarValor(localStorage, CHAVE_CARTAO_ATUAL, cartaoAtual);
};