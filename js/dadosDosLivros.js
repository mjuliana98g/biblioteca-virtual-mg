import { guardarValor, lerValor } from "./armazenamento.js";

const CAMINHO_LIVROS = "data/livros.json"; // ficheiro com os livros originais (só de leitura)
const CHAVE_LIVROS_ADICIONADOS = "livros-adicionados"; // lista de livros adicionados
const CHAVE_LIVROS_EDITADOS = "livros-editados"; 
const CHAVE_ESTADOS_LEITURA = "estados"; 
const CHAVE_FAVORITOS = "favoritos"; 
const CHAVE_LIVROS_JA_SAIRAM = "livros-lancados"; // lista de ids marcados como "já saiu"
const CHAVE_LIVROS_REMOVIDOS = "livros-removidos"; 
const CHAVE_PROGRESSO_LEITURA = "progresso-leitura"; // lista id páginas lidas

let livros = [];

// ------------------------------------------------------------------------------------------

function obterDataHoje() {
    return new Date().toISOString().slice(0, 10);
};

function estaNoFuturo(data) {
    return data > obterDataHoje();
};

export function temDataLancamento(livro) {
    return Boolean(livro.dataLancamento); // texto vazio dá false, texto preenchido dá true
};

export function chegouDataLancamento(livro) {
    return temDataLancamento(livro) && !estaNoFuturo(livro.dataLancamento);
};

// ------------------------------------------------------------------------------------------

async function buscarLivrosDoFicheiro() { // vai buscar o livros.json, se falhar, devolve uma lista vazia
    try {
        const resposta = await fetch(CAMINHO_LIVROS); // vai buscar o ficheiro e espera pela resposta

        if (!resposta.ok) { // o fetch não falha com erro 404, por isso verificamos
            throw new Error(`Erro ao carregar os livros (${resposta.status})`); // salta para o catch
        }

        return await resposta.json(); // converte o texto do ficheiro em lista de livros
    } catch (erro) {
        console.error(erro); // mostra o erro a vermelho na consola
        return []; // a app continua a funcionar, só sem os livros do ficheiro
    }
};

function lerDadosGuardados() { // lê do localStorage todas as alterações feitas pelo utilizador
    return {
        progresso: lerValor(localStorage, CHAVE_PROGRESSO_LEITURA, {}),
        adicionados: lerValor(localStorage, CHAVE_LIVROS_ADICIONADOS, []),
        editados: lerValor(localStorage, CHAVE_LIVROS_EDITADOS, {}),
        estados: lerValor(localStorage, CHAVE_ESTADOS_LEITURA, {}),
        favoritos: lerValor(localStorage, CHAVE_FAVORITOS, []),
        livrosJaSairam: lerValor(localStorage, CHAVE_LIVROS_JA_SAIRAM, []),
        removidos: lerValor(localStorage, CHAVE_LIVROS_REMOVIDOS, []),
    };
};

function aplicarDadosGuardados(livro, dados) { // junta a um livro as alterações guardadas
    return { // devolve um livro novo
        ...livro, // copia o livro original
        ...dados.editados[livro.id], // por cima, as edições feitas
        favorito: dados.favoritos.includes(livro.id),
        estado: dados.estados[livro.id] || livro.estado,
        paginasLidas: dados.progresso[livro.id] ?? livro.paginasLidas, // ?? mantém o 0 como valor válido
        dataLancamento: dados.livrosJaSairam.includes(livro.id) ? "" : livro.dataLancamento,
    };
};

export async function carregarLivros() {
    const livrosDoFicheiro = await buscarLivrosDoFicheiro();
    const dados = lerDadosGuardados();

    livros = [...livrosDoFicheiro, ...dados.adicionados] // junta os livros do ficheiro com os adicionados
        .filter((livro) => !dados.removidos.includes(livro.id)) // tira os removidos
        .map((livro) => aplicarDadosGuardados(livro, dados)); // aplica as alterações a cada livro
};

// ------------------------------------------------------------------------------------------

export function encontrarLivro(id) { // pelo id
    return livros.find((livro) => livro.id === id);
};

export function obterLivrosLancados() {
    return livros.filter((livro) => !temDataLancamento(livro));
};

export function obterLivrosPorLancar() {
    return livros
        .filter(temDataLancamento)
        .sort((a, b) => a.dataLancamento.localeCompare(b.dataLancamento)); // ordena por data
};

// ------------------------------------------------------------------------------------------

// Lê o valor guardado, calcula o novo com a função "atualizar" e guarda-o
function atualizarValorGuardado(chave, valorInicial, atualizar) {
    const valorAtual = lerValor(localStorage, chave, valorInicial);
    guardarValor(localStorage, chave, atualizar(valorAtual));
};

// Altera um livro só na memória (para o ecrã mostrar já a mudança, sem recarregar)
function atualizarLivroMemoria(id, alteracoes) {
    livros = livros.map((livro) =>
        livro.id === id ? { ...livro, ...alteracoes } : livro
    );
};

// ------------------------------------------------------------------------------------------

export function adicionarLivro(livro) {
    atualizarValorGuardado(CHAVE_LIVROS_ADICIONADOS, [], (adicionados) => [...adicionados, livro]);
    livros = [...livros, livro];
};

export function removerLivro(id) {
    atualizarValorGuardado(CHAVE_LIVROS_REMOVIDOS, [], (removidos) => [...removidos, id]);
    livros = livros.filter((livro) => livro.id !== id);
};

export function alternarFavorito(id) { // liga ou desliga o favorito e guarda a lista de favoritos
    atualizarLivroMemoria(id, { favorito: !encontrarLivro(id).favorito });

    const idsFavoritos = livros.filter((livro) => livro.favorito).map((livro) => livro.id);
    guardarValor(localStorage, CHAVE_FAVORITOS, idsFavoritos);
};

export function alterarEstado(id, estado) {
    atualizarValorGuardado(CHAVE_ESTADOS_LEITURA, {}, (estados) => ({ ...estados, [id]: estado }));
    atualizarLivroMemoria(id, { estado });
};

export function guardarProgressoLeitura(id, paginasLidas) {
    atualizarValorGuardado(CHAVE_PROGRESSO_LEITURA, {}, (progresso) => ({ ...progresso, [id]: paginasLidas }));
    atualizarLivroMemoria(id, { paginasLidas });
};

export function marcarComoLancado(id) { // regista que o livro "já saiu" e apaga-lhe a data
    atualizarValorGuardado(CHAVE_LIVROS_JA_SAIRAM, [], (jaSairam) => [...jaSairam, id]);
    atualizarLivroMemoria(id, { dataLancamento: "" });
};

export function editarLivro(id, campos) {
    atualizarValorGuardado(CHAVE_LIVROS_EDITADOS, {}, (editados) => ({ ...editados, [id]: campos }));
    atualizarValorGuardado(CHAVE_ESTADOS_LEITURA, {}, (estados) => ({ ...estados, [id]: campos.estado })); // o estado guardado tem prioridade sobre as edições

    if (campos.dataLancamento !== "") { // se o livro editado ainda tem data, deixa de estar "marcado como lançado"
        atualizarValorGuardado(CHAVE_LIVROS_JA_SAIRAM, [], (jaSairam) =>
            jaSairam.filter((idJaSaiu) => idJaSaiu !== id)
        );
    }

    atualizarLivroMemoria(id, campos);
};

// ------------------------------------------------------------------------------------------

export function calcularPercentagem(paginasLidas, paginas) {
    return paginas > 0 ? Math.round((paginasLidas / paginas) * 100) : 0; // o "paginas > 0" evita dividir por zero
};

export function calcularPaginas(percentagem, paginas) {
    return Math.round((percentagem / 100) * paginas);
};