import { criarCapa, criarElemento } from "./cartoes.js";

const NUMERO_DE_GENEROS = 5;
const CLASSIFICACOES_POSSIVEIS = Array.from({ length: 20 }, (_, posicao) => (posicao + 1) * 0.25);

const mediaClassificacoes = document.querySelector("#media-classificacoes");
const graficoClassificacoes = document.querySelector("#grafico-classificacoes");
const totalClassificados = document.querySelector("#total-classificados");
const listaGeneros = document.querySelector("#lista-generos");
const capasCincoEstrelas = document.querySelector("#capas-cinco-estrelas");
const totalCincoEstrelas = document.querySelector("#total-cinco-estrelas");

function formatarQuantidade(total, singular, plural) {
    return `${total} ${total === 1 ? singular : plural}`;
};

function filtrarClassificados(livros) {
    return livros.filter((livro) => livro.classificacao > 0);
};

function calcularMedia(livros) {
    if (livros.length === 0) {
        return 0;
    }

    const soma = livros.reduce((total, livro) => total + livro.classificacao, 0);

    return soma / livros.length;
};

function formatarMedia(media) {
    return media.toLocaleString("pt-PT", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
};

function agruparPorClassificacao(livros) {
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

function criarColunaDoGrafico({ classificacao, livros }, maximo) {
    const coluna = criarElemento("li");
    const barra = criarElemento("span", { classe: "barra" });

    barra.style.height = `${(livros.length / maximo) * 100}%`;
    coluna.append(
        criarElemento("span", { texto: String(livros.length), classe: "total" }),
        barra,
        criarElemento("span", { texto: classificacao.toLocaleString("pt-PT"), classe: "nota" })
    );

    if (livros.length > 0) {
        coluna.tabIndex = 0;
        coluna.append(criarListaDeTitulos(livros));
    }

    return coluna;
};

function mostrarGrafico(livros) {
        const grupos = agruparPorClassificacao(livros);
    const maximo = Math.max(...grupos.map((grupo) => grupo.livros.length), 1);

    graficoClassificacoes.replaceChildren(
        ...grupos.map((grupo) => criarColunaDoGrafico(grupo, maximo))
    );
};

function mostrarClassificacoes(livros) {
    const classificados = filtrarClassificados(livros);
    const media = calcularMedia(classificados);

    mediaClassificacoes.textContent = formatarMedia(media);
    mediaClassificacoes.value = media;
    totalClassificados.textContent = formatarQuantidade(
        classificados.length,
        "livro classificado",
        "livros classificados"
    );
    mostrarGrafico(classificados);
};

function contarGeneros(livros) {
    const generos = livros.flatMap((livro) => livro.generos);

    return [...new Set(generos)]
        .map((genero) => ({
            genero,
            total: generos.filter((outroGenero) => outroGenero === genero).length,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, NUMERO_DE_GENEROS);
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
    const generos = contarGeneros(livros);
    const maximo = generos[0]?.total ?? 1;

    listaGeneros.replaceChildren(
        ...generos.map((genero) => criarLinhaDeGenero(genero, maximo))
    );
};

function criarItemDeCapa(livro) {
    const item = criarElemento("li");

    item.append(criarCapa(livro));

    return item;
};

function mostrarCincoEstrelas(livros) {
    const livrosDeCincoEstrelas = livros.filter((livro) => livro.classificacao === 5);
    const total = livrosDeCincoEstrelas.length;

    capasCincoEstrelas.replaceChildren(...livrosDeCincoEstrelas.map(criarItemDeCapa));
    totalCincoEstrelas.textContent =
        total === 0
            ? "Ainda não deste 5 estrelas a nenhum livro."
            : formatarQuantidade(total, "livro com 5 estrelas", "livros com 5 estrelas");
};

export function atualizarEstatisticas(livros) {
    mostrarClassificacoes(livros);
    mostrarGeneros(livros);
    mostrarCincoEstrelas(livros);
};