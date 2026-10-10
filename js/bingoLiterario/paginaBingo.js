import { criarCapa, criarElemento, esperarResposta, formatarQuantidade } from "../utilidades.js";
import { encontrarLivro, obterLivros } from "../dados.js";
import {
    associarLivro,
    contarLinhas,
    estaAMeio,
    obterCartaoAtual,
    obterCartoesCompletos,
    obterIdsUsados,
    sortearNovoCartao,
    temBingo,
} from "./dadosBingo.js";

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

let posicaoEscolhida = null;
let temporizadorMensagem = null;

function calcularCoordenada(posicao) {
    return `${LETRAS_COLUNAS[posicao % COLUNAS]}${Math.floor(posicao / COLUNAS) + 1}`;
};

function formatarDiaMes(data) {
    const [, mes, dia] = data.split("-");

    return `${dia}/${mes}`;
};

function criarQuadrado(desafio, posicao) {
    const coordenada = criarElemento("small", { textContent: calcularCoordenada(posicao) });
    const quadrado = criarElemento("button", {
        textContent: desafio.texto,
        className: `quadrado-bingo categoria-${desafio.categoria}`,
        onclick: () => abrirDialogoLivro(posicao),
    });

    coordenada.className = "coordenada";
    quadrado.classList.toggle("cumprido", Boolean(desafio.idLivro));
    quadrado.prepend(coordenada);

    return criarElemento("li", { filhos: [quadrado] });
};

function criarCartaoCompleto(cartao) {
    const periodo = `${formatarDiaMes(cartao.inicio)} → ${formatarDiaMes(cartao.fim)}`;
    const resumo = criarElemento("summary", {
        textContent: `Cartão n.º ${cartao.numero} · ${periodo}`,
    });
    const desafios = cartao.quadrados.map((quadrado) => {
        const titulo = encontrarLivro(quadrado.idLivro)?.titulo ?? "livro removido";

        return criarElemento("li", { textContent: `${quadrado.texto} — ${titulo}` });
    });
    const lista = criarElemento("ul", { filhos: desafios });
    const detalhes = criarElemento("details", { filhos: [resumo, lista] });

    return criarElemento("li", { filhos: [detalhes] });
};

function mostrarCompletos() {
    const cartoes = obterCartoesCompletos();
    const ganhos = formatarQuantidade(cartoes.length, "livro extra", "livros extra");

    totalCompletos.textContent = cartoes.length;
    mensagemLivroExtra.textContent = cartoes.length === 0
        ? `${REGRA_LIVRO_EXTRA} Completa o primeiro!`
        : `🕮 ${REGRA_LIVRO_EXTRA} Já ganhaste ${ganhos}!`;
    listaCompletos.replaceChildren(...[...cartoes].reverse().map(criarCartaoCompleto));
};

function criarLivroCartao({ coordenada, livro }) {
    const titulo = criarElemento("strong", { textContent: livro.titulo });
    const etiqueta = criarElemento("small", { textContent: coordenada });

    etiqueta.className = "etiqueta-quadrado";

    return criarElemento("li", { filhos: [criarCapa(livro), titulo, etiqueta] });
};

export function atualizarPagina() {
    const cartao = obterCartaoAtual();
    const cumpridos = obterIdsUsados().length;
    const livrosDoCartao = cartao.quadrados
        .map((quadrado, posicao) => ({
            coordenada: calcularCoordenada(posicao),
            livro: encontrarLivro(quadrado.idLivro),
        }))
        .filter(({ livro }) => livro)
        .sort((a, b) => a.coordenada.localeCompare(b.coordenada));

    infoCartao.textContent =
        `Cartão n.º ${cartao.numero} · iniciado a ${formatarDiaMes(cartao.inicio)}`;
    textoProgresso.textContent = `${cumpridos} de ${cartao.quadrados.length} desafios cumpridos`;
    barraProgresso.value = cumpridos;
    cartela.replaceChildren(...cartao.quadrados.map(criarQuadrado));
    livrosCartao.replaceChildren(...livrosDoCartao.map(criarLivroCartao));
    mostrarCompletos();
};

function celebrar(linhasAntes) {
    const mensagem = temBingo()
        ? "Bingo!"
        : linhasAntes === 0 && contarLinhas() > 0
            ? "Linha!"
            : "";

    if (!mensagem) {
        return;
    }

    clearTimeout(temporizadorMensagem);
    mensagemParabens.textContent = mensagem;
    mensagemParabens.hidden = false;
    temporizadorMensagem = setTimeout(() => {
        mensagemParabens.hidden = true;
    }, DURACAO_MENSAGEM);
};

function associar(idLivro) {
    const linhasAntes = contarLinhas();

    associarLivro(posicaoEscolhida, idLivro);
    dialogoLivro.close();
    atualizarPagina();
    celebrar(linhasAntes);
};

function criarOpcao(livro) {
    const opcao = criarElemento("button", {
        className: "opcao-livro",
        onclick: () => associar(livro.id),
        filhos: [
            criarCapa(livro),
            criarElemento("span", {
                filhos: [
                    criarElemento("strong", { textContent: livro.titulo }),
                    criarElemento("small", { textContent: livro.autor }),
                ],
            }),
        ],
    });

    return criarElemento("li", { filhos: [opcao] });
};

function abrirDialogoLivro(posicao) {
    const quadrado = obterCartaoAtual().quadrados[posicao];
    const idsUsados = obterIdsUsados();
    const disponiveis = obterLivros()
        .filter((livro) => livro.estado === "lido" && !idsUsados.includes(livro.id));

    posicaoEscolhida = posicao;
    desafioDialogo.textContent = quadrado.texto;
    desafioDialogo.className = `categoria-${quadrado.categoria}`;
    botaoTirarLivro.hidden = !quadrado.idLivro;
    livrosLidos.replaceChildren(...disponiveis.map(criarOpcao));
    semLivros.hidden = disponiveis.length > 0;
    dialogoLivro.showModal();
};

async function pedirNovoCartao() {
    if (estaAMeio() && (await esperarResposta(dialogoNovoCartao)) !== "confirmar") {
        return;
    }

    mensagemParabens.hidden = true;
    sortearNovoCartao();
    atualizarPagina();
};

export function iniciarPaginaBingo() {
    botaoNovoCartao.addEventListener("click", pedirNovoCartao);
    botaoTirarLivro.addEventListener("click", () => associar(null));
    botaoFecharLivro.addEventListener("click", () => dialogoLivro.close());
};