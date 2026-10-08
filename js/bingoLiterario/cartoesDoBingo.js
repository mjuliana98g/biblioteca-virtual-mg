import { criarBotao, criarCapa, criarElemento } from "../cartoesDosLivros.js";
import { encontrarLivro, obterLivrosLidos } from "../dadosDosLivros.js";
import {
    associarLivro,
    contarLinhas,
    estaAMeio,
    obterCartaoAtual,
    obterIdsUsados,
    sortearNovoCartao,
    temBingo,
    obterCartoesCompletos,
} from "./dadosDoBingo.js";

const COLUNAS = 3;
const LETRAS_COLUNAS = "ABC";
const DURACAO_MENSAGEM = 3000;
const REGRA_LIVRO_EXTRA = "Cada cartão completo dá direito a comprar um livro extra.";

const infoCartao = document.querySelector("#informacao-cartao");
const textoProgresso = document.querySelector("#progresso-bingo");
const barraProgresso = document.querySelector("#barra-bingo");
const cartela = document.querySelector("#cartela-bingo");
const mensagemParabens = document.querySelector("#mensagem-parabens");
const botaoNovoCartao = document.querySelector("#botao-novo-cartao");
const livrosCartao = document.querySelector("#lista-livros-do-cartao");
const dialogoNovoCartao = document.querySelector("#dialogo-novo-cartao");
const dialogoLivro = document.querySelector("#dialogo-escolher-livro");
const desafioDialogo = document.querySelector("#desafio-escolhido");
const semLivros = document.querySelector("#sem-livros-lidos");
const livrosLidos = document.querySelector("#lista-livros-lidos");
const botaoFecharLivro = document.querySelector("#fechar-escolher-livro");
const botaoTirarLivro = document.querySelector("#botao-tirar-livro");
const totalCompletos = document.querySelector("#total-cartoes-completos");
const mensagemLivroExtra = document.querySelector("#mensagem-livro-extra");
const listaCompletos = document.querySelector("#lista-cartoes-completos");

let indiceEscolhido = null;
let temporizadorMensagem = null;

// ------------------------------------------------------------------------------------------

function calcularCoordenada(indice) {
    const letra = LETRAS_COLUNAS[indice % COLUNAS];
    const linha = Math.floor(indice / COLUNAS) + 1;

    return `${letra}${linha}`;
};

function formatarDiaMes(data) {
    const [, mes, dia] = data.split("-");

    return `${dia}/${mes}`;
};

// ------------------------------------------------------------------------------------------

function criarQuadrado(desafio, indice) {
    const quadrado = criarBotao(desafio.texto, `quadrado-bingo categoria-${desafio.categoria}`);
    const coordenada = criarElemento("small", { texto: calcularCoordenada(indice), classe: "coordenada" });
    const item = criarElemento("li");

    quadrado.classList.toggle("cumprido", Boolean(desafio.idLivro));
    quadrado.addEventListener("click", () => abrirDialogoLivro(indice));
    quadrado.prepend(coordenada);
    item.append(quadrado);
    return item;
};

function desenharInformacao(cartao) {
    infoCartao.textContent = `Cartão n.º ${cartao.numero} · iniciado a ${formatarDiaMes(cartao.inicio)}`;
};

function desenharProgresso(cartao) {
    const cumpridos = obterIdsUsados().length;

    textoProgresso.textContent = `${cumpridos} de ${cartao.quadrados.length} desafios cumpridos`;
    barraProgresso.value = cumpridos;
};

function desenharCartela(quadrados) {
    cartela.replaceChildren(...quadrados.map(criarQuadrado));
};

// ------------------------------------------------------------------------------------------

function obterLivrosCartao(quadrados) {
    return quadrados
        .map((quadrado, indice) => ({
            coordenada: calcularCoordenada(indice),
            livro: encontrarLivro(quadrado.idLivro),
        }))
        .filter(({ livro }) => livro)
        .sort((a, b) => a.coordenada.localeCompare(b.coordenada));
};

function criarLivroCartao({ coordenada, livro }) {
    const titulo = criarElemento("strong", { texto: livro.titulo });
    const etiqueta = criarElemento("small", { texto: coordenada, classe: "etiqueta-quadrado" });
    const item = criarElemento("li");

    item.append(criarCapa(livro), titulo, etiqueta);
    return item;
};

function desenharLivrosCartao(quadrados) {
    livrosCartao.replaceChildren(...obterLivrosCartao(quadrados).map(criarLivroCartao));
};

function descreverLivro(idLivro) {
    return encontrarLivro(idLivro)?.titulo ?? "livro removido";
};

function criarLinhaDesafio(quadrado) {
    return criarElemento("li", { texto: `${quadrado.texto} — ${descreverLivro(quadrado.idLivro)}` });
};

function criarCartaoCompleto(cartao) {
    const titulo = `Cartão n.º ${cartao.numero} · ${formatarDiaMes(cartao.inicio)} → ${formatarDiaMes(cartao.fim)}`;
    const resumo = criarElemento("summary", { texto: titulo });
    const desafios = criarElemento("ul");
    const detalhes = criarElemento("details");
    const item = criarElemento("li");

    desafios.append(...cartao.quadrados.map(criarLinhaDesafio));
    detalhes.append(resumo, desafios);
    item.append(detalhes);
    return item;
};

function criarMensagemLivroExtra(total) {
    if (total === 0) {
        return `${REGRA_LIVRO_EXTRA} Completa o primeiro!`;
    }

    const livros = total === 1 ? "livro extra" : "livros extra";

    return `🕮 ${REGRA_LIVRO_EXTRA} Já ganhaste ${total} ${livros}!`;
};

function desenharEstatisticas() {
    const cartoes = obterCartoesCompletos();
    const maisRecentesPrimeiro = [...cartoes].reverse();

    totalCompletos.textContent = cartoes.length;
    mensagemLivroExtra.textContent = criarMensagemLivroExtra(cartoes.length);
    listaCompletos.replaceChildren(...maisRecentesPrimeiro.map(criarCartaoCompleto));
};

export function atualizarPagina() {
    const cartao = obterCartaoAtual();

    desenharInformacao(cartao);
    desenharProgresso(cartao);
    desenharCartela(cartao.quadrados);
    desenharLivrosCartao(cartao.quadrados);
    desenharEstatisticas();
};

// ------------------------------------------------------------------------------------------

function esconderMensagem() {
    mensagemParabens.hidden = true;
};

function mostrarMensagem(texto) {
    clearTimeout(temporizadorMensagem);
    mensagemParabens.textContent = texto;
    mensagemParabens.hidden = false;
    temporizadorMensagem = setTimeout(esconderMensagem, DURACAO_MENSAGEM);
};

function obterMensagemConquista(linhasAntes) {
    if (temBingo()) {
        return "Bingo!";
    }

    if (linhasAntes === 0 && contarLinhas() > 0) {
        return "Linha!";
    }

    return null;
};

function celebrarConquista(linhasAntes) {
    const mensagem = obterMensagemConquista(linhasAntes);

    if (mensagem) {
        mostrarMensagem(mensagem);
    }
};

// ------------------------------------------------------------------------------------------

function escolherLivro(idLivro) {
    const linhasAntes = contarLinhas();

    associarLivro(indiceEscolhido, idLivro);
    dialogoLivro.close();
    atualizarPagina();
    celebrarConquista(linhasAntes);
};

function tirarLivro() {
    associarLivro(indiceEscolhido, null);
    dialogoLivro.close();
    atualizarPagina();
};

function criarOpcaoLivro(livro) {
    const opcao = criarBotao("", "opcao-livro");
    const textos = criarElemento("span");
    const titulo = criarElemento("strong", { texto: livro.titulo });
    const autor = criarElemento("small", { texto: livro.autor });
    const item = criarElemento("li");

    textos.append(titulo, autor);
    opcao.append(criarCapa(livro), textos);
    opcao.addEventListener("click", () => escolherLivro(livro.id));
    item.append(opcao);
    return item;
};

function obterLivrosDisponiveis() {
    const idsUsados = obterIdsUsados();

    return obterLivrosLidos().filter((livro) => !idsUsados.includes(livro.id));
};

function desenharOpcoes() {
    const livros = obterLivrosDisponiveis();

    livrosLidos.replaceChildren(...livros.map(criarOpcaoLivro));
    semLivros.hidden = livros.length > 0;
};

function abrirDialogoLivro(indice) {
    const quadrado = obterCartaoAtual().quadrados[indice];

    indiceEscolhido = indice;
    desafioDialogo.textContent = quadrado.texto;
    desafioDialogo.className = `categoria-${quadrado.categoria}`;
    botaoTirarLivro.hidden = !quadrado.idLivro;
    desenharOpcoes();
    dialogoLivro.showModal();
};

// ------------------------------------------------------------------------------------------

function trocarCartao() {
    esconderMensagem();
    sortearNovoCartao();
    atualizarPagina();
};

function trocarCartaoSeConfirmado() {
    if (dialogoNovoCartao.returnValue === "confirmar") {
        trocarCartao();
    }
};

function pedirNovoCartao() {
    if (!estaAMeio()) {
        trocarCartao();
        return;
    }

    dialogoNovoCartao.returnValue = "";
    dialogoNovoCartao.showModal();
};

export function iniciarPaginaDoBingo() {
    botaoNovoCartao.addEventListener("click", pedirNovoCartao);
    dialogoNovoCartao.addEventListener("close", trocarCartaoSeConfirmado);
    botaoTirarLivro.addEventListener("click", tirarLivro);
    botaoFecharLivro.addEventListener("click", () => dialogoLivro.close());
};