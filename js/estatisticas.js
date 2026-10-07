import { criarCapa, criarElemento } from "./cartoesDosLivros.js";

const NUMERO_DE_GENEROS = 5; // quantos géneros aparecem no top
const CLASSIFICACOES_POSSIVEIS = Array.from({ length: 20 }, (_, posicao) => (posicao + 1) * 0.25); // cria 20 notas: 0,25 / 0,5 / ... / 5 (o _ é o valor, que não usamos)

const mediaClassificacoes = document.querySelector("#media-classificacoes");
const graficoClassificacoes = document.querySelector("#grafico-classificacoes");
const textoTotalClassificados = document.querySelector("#total-classificados");
const listaGeneros = document.querySelector("#lista-generos");
const listaCapasCincoEstrelas = document.querySelector("#capas-cinco-estrelas");
const textoTotalCincoEstrelas = document.querySelector("#total-cinco-estrelas");

function formatarQuantidade(total, singular, plural) { // escolhe o singular ou o plural: "1 livro" / "2 livros"
    return `${total} ${total === 1 ? singular : plural}`;
};

// ------------------------------------------------------------------------------------------

function filtrarClassificados(livros) { // só os livros com nota (0 = sem classificação)
    return livros.filter((livro) => livro.classificacao > 0);
};

function calcularMediaClassificacoes(livros) {
    if (livros.length === 0) { // evita dividir por zero
        return 0;
    }

    const soma = livros.reduce((total, livro) => total + livro.classificacao, 0); // reduce vai somando as notas

    return soma / livros.length;
};

function formatarMedia(media) { // sempre com 1 casa decimal e vírgula: 4,5
    return media.toLocaleString("pt-PT", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
};

function agruparPorClassificacao(livros) { // devolve [{ classificacao: 4.5, livros: [...] }, ...] só com as notas que têm livros
    return CLASSIFICACOES_POSSIVEIS
        .map((classificacao) => ({
            classificacao,
            livros: livros.filter((livro) => livro.classificacao === classificacao),
        }))
        .filter((grupo) => grupo.livros.length > 0);
};

function criarListaDeTitulos(livros) {
    const lista = criarElemento("ul", { classe: "livros-da-barra" });

    lista.append(...livros.map((livro) => criarElemento("li", { texto: livro.titulo })));

    return lista;
};

function criarColunaDoGrafico({ classificacao, livros }, maximo) { // uma coluna: número em cima, barra, nota em baixo
    const coluna = criarElemento("li");
    const barra = criarElemento("span", { classe: "barra" });

    barra.style.height = `${(livros.length / maximo) * 100}%`; // altura proporcional à coluna maior
    coluna.append(
        criarElemento("span", { texto: String(livros.length), classe: "total" }),
        barra,
        criarElemento("span", { texto: classificacao.toLocaleString("pt-PT"), classe: "nota" })
    );
    coluna.tabIndex = 0; // permite chegar à coluna com o teclado (Tab)
    coluna.append(criarListaDeTitulos(livros));

    return coluna;
};

function mostrarGrafico(livros) {
    const grupos = agruparPorClassificacao(livros);
    const maximo = Math.max(...grupos.map((grupo) => grupo.livros.length), 1); // o maior número de livros numa nota; o 1 evita um máximo de 0

    graficoClassificacoes.replaceChildren(
        ...grupos.map((grupo) => criarColunaDoGrafico(grupo, maximo))
    );
};

function mostrarClassificacoes(livros) {
    const classificados = filtrarClassificados(livros);
    const media = calcularMediaClassificacoes(classificados);

    mediaClassificacoes.textContent = formatarMedia(media); // o que se vê
    mediaClassificacoes.value = media; // o valor do <data>
    textoTotalClassificados.textContent = formatarQuantidade(
        classificados.length,
        "livro classificado",
        "livros classificados"
    );
    mostrarGrafico(classificados);
};

// ------------------------------------------------------------------------------------------

function listarGenerosMaisFrequentes(livros) { // devolve [{ genero, total }, ...] com os 5 mais frequentes
    const generos = livros.flatMap((livro) => livro.generos); // todos os géneros, com repetidos

    return [...new Set(generos)] // o Set tira os repetidos
        .map((genero) => ({
            genero,
            total: generos.filter((outroGenero) => outroGenero === genero).length, // quantas vezes aparece
        }))
        .sort((a, b) => b.total - a.total) // do mais frequente para o menos
        .slice(0, NUMERO_DE_GENEROS); // fica só com os primeiros
};

function criarLinhaDeGenero({ genero, total }, maximo) {
    const linha = criarElemento("li");
    const nome = criarElemento("p");
    const barra = criarElemento("progress");

    nome.append(
        criarElemento("span", { texto: genero }),
        criarElemento("span", { texto: String(total) })
    );
    barra.max = maximo;
    barra.value = total;
    barra.setAttribute("aria-label", `${genero}: ${total}`);
    linha.append(nome, barra);

    return linha;
};

function mostrarGeneros(livros) {
    const generos = listarGenerosMaisFrequentes(livros);
    const maximo = generos[0]?.total ?? 1; // o primeiro é o maior (a lista está ordenada); o ?? 1 é para quando não há géneros

    listaGeneros.replaceChildren(
        ...generos.map((genero) => criarLinhaDeGenero(genero, maximo))
    );
};

// ------------------------------------------------------------------------------------------

function criarItemDeCapa(livro) {
    const item = criarElemento("li");

    item.append(criarCapa(livro));

    return item;
};

function mostrarCincoEstrelas(livros) {
    const livrosDeCincoEstrelas = livros.filter((livro) => livro.classificacao === 5);
    const total = livrosDeCincoEstrelas.length;

    listaCapasCincoEstrelas.replaceChildren(...livrosDeCincoEstrelas.map(criarItemDeCapa));
    textoTotalCincoEstrelas.textContent =
        total === 0
            ? "Ainda não deste 5 estrelas a nenhum livro."
            : formatarQuantidade(total, "livro com 5 estrelas", "livros com 5 estrelas");
};

// ------------------------------------------------------------------------------------------

export function atualizarEstatisticas(livros) { // chamada pelo estante.js sempre que a página se atualiza
    mostrarClassificacoes(livros);
    mostrarGeneros(livros);
    mostrarCincoEstrelas(livros);
};