import { carregarJson, guardarValor, lerValor } from "./utilidades.js";

const CAMINHO_LIVROS = "data/livros.json";
const CHAVE_LIVROS = "livros";

let livros = [];

export async function carregarLivros() {
    livros = lerValor(localStorage, CHAVE_LIVROS) ?? (await carregarJson(CAMINHO_LIVROS));
};

export function obterLivros() {
    return livros;
};

export function encontrarLivro(id) {
    return livros.find((livro) => livro.id === id);
};

function guardarLivros(novosLivros) {
    livros = novosLivros;
    guardarValor(localStorage, CHAVE_LIVROS, livros);
};

export function adicionarLivro(livro) {
    guardarLivros([...livros, livro]);
};

export function removerLivro(id) {
    guardarLivros(livros.filter((livro) => livro.id !== id));
};

export function alterarLivro(id, alteracoes) {
    guardarLivros(livros.map((livro) => (livro.id === id ? { ...livro, ...alteracoes } : livro)));
};