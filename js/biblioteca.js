import { guardar, ler } from "./armazenamento.js";

const CAMINHO_LIVROS = "data/livros.json";
const CHAVE_ADICIONADOS = "livros-adicionados";
const CHAVE_EDITADOS = "livros-editados";
const CHAVE_ESTADOS = "estados";
const CHAVE_FAVORITOS = "favoritos";
const CHAVE_LANCADOS = "livros-lancados";
const CHAVE_REMOVIDOS = "livros-removidos";
const CHAVE_PROGRESSO = "progresso-leitura";

let livros = [];

function obterDataDeHoje() {
    return new Date().toISOString().slice(0, 10);
};

export function calcularPercentagem(paginasLidas, paginas) {
    return paginas > 0 ? Math.round((paginasLidas / paginas) * 100) : 0;
};

export function calcularPaginas(percentagem, paginas) {
    return Math.round((percentagem / 100) * paginas);
};

export function verificarDataFutura(data) {
    return data > obterDataDeHoje();
};

export function verificarPorLancar(livro) {
    return Boolean(livro.dataLancamento);
};

export function verificarLancamentoChegou(livro) {
    return verificarPorLancar(livro) && !verificarDataFutura(livro.dataLancamento);
}

async function carregarLivrosDoFicheiro() {
    try {
        const resposta = await fetch(CAMINHO_LIVROS);

        if (!resposta.ok) {
            throw new Error(`Erro ao carregar os livros (${resposta.status})`);
        }

        return await resposta.json();
    } catch (erro) {
        console.error(erro);
        return [];
    }
};

function atualizarArmazenamento(chave, valorInicial, atualizar) {
    const valorAtual = ler(localStorage, chave, valorInicial);
    guardar(localStorage, chave, atualizar(valorAtual));
};

function lerDadosGuardados() {
    return {
        progresso: ler(localStorage, CHAVE_PROGRESSO, {}),
        adicionados: ler(localStorage, CHAVE_ADICIONADOS, []),
        editados: ler(localStorage, CHAVE_EDITADOS, {}),
        estados: ler(localStorage, CHAVE_ESTADOS, {}),
        favoritos: ler(localStorage, CHAVE_FAVORITOS, []),
        lancados: ler(localStorage, CHAVE_LANCADOS, []),
        removidos: ler(localStorage, CHAVE_REMOVIDOS, []),
    };
};

function aplicarDadosGuardados(livro, dados) {
    return {
        ...livro,
        ...dados.editados[livro.id],
        favorito: dados.favoritos.includes(livro.id),
        estado: dados.estados[livro.id] || livro.estado,
        paginasLidas: dados.progresso[livro.id] ?? livro.paginasLidas,
        dataLancamento: dados.lancados.includes(livro.id) ? "" : livro.dataLancamento,
    };
};

function atualizarLivro(id, alteracoes) {
    livros = livros.map((livro) =>
        livro.id === id ? { ...livro, ...alteracoes } : livro
    );
};

export async function carregarBiblioteca() {
    const livrosDoFicheiro = await carregarLivrosDoFicheiro();
    const dados = lerDadosGuardados();

    livros = [...livrosDoFicheiro, ...dados.adicionados]
        .filter((livro) => !dados.removidos.includes(livro.id))
        .map((livro) => aplicarDadosGuardados(livro, dados));
};

export function encontrarLivro(id) {
    return livros.find((livro) => livro.id === id);
};

export function obterLivrosLancados() {
    return livros.filter((livro) => !verificarPorLancar(livro));
};

export function obterLivrosPorLancar() {
    return livros
        .filter(verificarPorLancar)
        .sort((a, b) => a.dataLancamento.localeCompare(b.dataLancamento));
};

export function adicionarLivro(livro) {
    atualizarArmazenamento(CHAVE_ADICIONADOS, [], (adicionados) => [...adicionados, livro]);
    livros = [...livros, livro];
};

export function removerLivro(id) {
    atualizarArmazenamento(CHAVE_REMOVIDOS, [], (removidos) => [...removidos, id]);
    livros = livros.filter((livro) => livro.id !== id);
};

export function alternarFavorito(id) {
    atualizarLivro(id, { favorito: !encontrarLivro(id).favorito });

    const idsFavoritos = livros.filter((livro) => livro.favorito).map((livro) => livro.id);
    guardar(localStorage, CHAVE_FAVORITOS, idsFavoritos);
};

export function alterarEstado(id, estado) {
    atualizarArmazenamento(CHAVE_ESTADOS, {}, (estados) => ({ ...estados, [id]: estado }));
    atualizarLivro(id, { estado });
};

export function guardarProgressoLeitura(id, paginasLidas) {
    atualizarArmazenamento(CHAVE_PROGRESSO, {}, (progresso) => ({ ...progresso, [id]: paginasLidas }));
    atualizarLivro(id, { paginasLidas });
};

export function marcarComoLancado(id) {
    atualizarArmazenamento(CHAVE_LANCADOS, [], (lancados) => [...lancados, id]);
    atualizarLivro(id, { dataLancamento: "" });
};

export function editarLivro(id, campos) {
    atualizarArmazenamento(CHAVE_EDITADOS, {}, (editados) => ({ ...editados, [id]: campos }));
    atualizarArmazenamento(CHAVE_ESTADOS, {}, (estados) => ({ ...estados, [id]: campos.estado }));

    if (campos.dataLancamento !== "") {
        atualizarArmazenamento(CHAVE_LANCADOS, [], (lancados) =>
            lancados.filter((idLancado) => idLancado !== id)
        );
    }

    atualizarLivro(id, campos);
};