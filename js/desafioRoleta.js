import { criarBotao, criarCapa, criarElemento } from "./cartoes.js";

const NAMESPACE_SVG = "http://www.w3.org/2000/svg";
const CENTRO = 160;
const RAIO = 150;
const RAIO_DO_TEXTO = 92;
const NUMERO_MINIMO_DE_LIVROS = 2;
const NUMERO_DE_CORES = 3;
const MAXIMO_DE_LETRAS = 16;
const VOLTAS_COMPLETAS = 5;
const DURACAO_DO_GIRO = 4000;

const roleta = document.querySelector("#roleta");
const fatiasDaRoleta = document.querySelector("#fatias-da-roleta");
const mensagemRoleta = document.querySelector("#mensagem-roleta");
const botaoRoleta = document.querySelector("#botao-roleta");
const dialogoRoleta = document.querySelector("#dialogo-roleta");
const botaoGirar = document.querySelector("#botao-girar");
const livroSorteado = document.querySelector("#livro-sorteado");

let livrosDaRoleta = [];
let rotacaoAtual = 0;
let livroEscolhido = null;

function criarElementoSvg(etiqueta, atributos = {}) {
    const elemento = document.createElementNS(NAMESPACE_SVG, etiqueta);

    for (const [nome, valor] of Object.entries(atributos)) {
        elemento.setAttribute(nome, valor);
    }

    return elemento;
};

function calcularPonto(angulo, raio) {
    const radianos = (angulo * Math.PI) / 180;

    return {
        x: CENTRO + raio * Math.sin(radianos),
        y: CENTRO - raio * Math.cos(radianos),
    };
};

function criarCaminhoDaFatia(anguloInicial, anguloFinal) {
    const inicio = calcularPonto(anguloInicial, RAIO);
    const fim = calcularPonto(anguloFinal, RAIO);

    return `M ${CENTRO} ${CENTRO} L ${inicio.x} ${inicio.y} A ${RAIO} ${RAIO} 0 0 1 ${fim.x} ${fim.y} Z`;
};

function abreviarTitulo(titulo) {
    return titulo.length > MAXIMO_DE_LETRAS
        ? `${titulo.slice(0, MAXIMO_DE_LETRAS - 1)}…`
        : titulo;
};

function calcularRotacaoDoTexto(angulo) {
    return angulo <= 180 ? angulo - 90 : angulo + 90;
};

function calcularTamanhoDoTexto(totalDeLivros) {
    return Math.max(9, 22 - totalDeLivros * 2);
};

function criarTextoDaFatia(livro, angulo, totalDeLivros) {
    const { x, y } = calcularPonto(angulo, RAIO_DO_TEXTO);
    const texto = criarElementoSvg("text", {
        x,
        y,
        transform: `rotate(${calcularRotacaoDoTexto(angulo)} ${x} ${y})`,
        "font-size": calcularTamanhoDoTexto(totalDeLivros),
    });

    texto.textContent = abreviarTitulo(livro.titulo);

    return texto;
};

function criarFatia(livro, indice, totalDeLivros) {
    const tamanho = 360 / totalDeLivros;
    const anguloInicial = indice * tamanho;
    const fatia = criarElementoSvg("g", {
        class: `fatia fatia-${indice % NUMERO_DE_CORES}`,
    });

    fatia.append(
        criarElementoSvg("path", {
            d: criarCaminhoDaFatia(anguloInicial, anguloInicial + tamanho),
        }),
        criarTextoDaFatia(livro, anguloInicial + tamanho / 2, totalDeLivros)
    );

    return fatia;
};

function esperar(milissegundos) {
    return new Promise((resolver) => setTimeout(resolver, milissegundos));
};

function sortearIndice() {
    return Math.floor(Math.random() * livrosDaRoleta.length);
};

function calcularRotacaoFinal(indice) {
    const tamanho = 360 / livrosDaRoleta.length;
    const centroDaFatia = indice * tamanho + tamanho / 2;
    const falta = (360 - centroDaFatia - (rotacaoAtual % 360) + 360) % 360;
    return rotacaoAtual + VOLTAS_COMPLETAS * 360 + falta;
};

function destacarFatia(indice) {
    Array.from(fatiasDaRoleta.children).forEach((fatia, posicao) => {
        fatia.classList.toggle("sorteada", posicao === indice);
    });
};

function descreverAutoria(livro) {
    return [livro.autor, livro.editora].filter(Boolean).join(" · ");
};

function descreverExtensao(livro) {
    const partes = [`${livro.paginas} páginas`];
    return partes.join(" · ");
};

function criarListaDeGeneros(livro) {
    const lista = criarElemento("ul", { classe: "generos-do-sorteado" });
    lista.append(...livro.generos.map((genero) => criarElemento("li", { texto: genero })));
    return lista;
};

function mostrarLivroSorteado(livro) {
    livroEscolhido = livro;
    livroSorteado.replaceChildren(
        criarCapa(livro),
        criarElemento("h3", { texto: livro.titulo }),
        criarElemento("p", { texto: descreverAutoria(livro), classe: "autor-do-sorteado" }),
        criarListaDeGeneros(livro),
        criarElemento("p", { texto: descreverExtensao(livro) }),
        criarBotao("Começar a ler", "botao-comecar-a-ler")
    );
    livroSorteado.hidden = false;
};

async function girarRoleta() {
    const indice = sortearIndice();
    botaoGirar.disabled = true;
    livroSorteado.hidden = true;
    destacarFatia(-1);
    rotacaoAtual = calcularRotacaoFinal(indice);
    fatiasDaRoleta.style.transform = `rotate(${rotacaoAtual}deg)`;
    await esperar(DURACAO_DO_GIRO);
    destacarFatia(indice);
    mostrarLivroSorteado(livrosDaRoleta[indice]);
    botaoGirar.textContent = "Girar outra vez";
    botaoGirar.disabled = false;
};

export function desenharRoleta(livros) {
    const temLivrosSuficientes = livros.length >= NUMERO_MINIMO_DE_LIVROS;
    livrosDaRoleta = livros;
    rotacaoAtual = 0;
    livroSorteado.hidden = true;
    botaoGirar.textContent = "Girar a roleta";
    fatiasDaRoleta.style.transform = "";
    roleta.toggleAttribute("hidden", !temLivrosSuficientes);
    botaoGirar.hidden = !temLivrosSuficientes;
    mensagemRoleta.hidden = temLivrosSuficientes;
    fatiasDaRoleta.replaceChildren(
        ...livros.map((livro, indice) => criarFatia(livro, indice, livros.length))
    );
};

function fecharSeClicouFora(evento) {
    if (evento.target === dialogoRoleta) {
        dialogoRoleta.close();
    }
};

function tratarCliqueNoSorteado(evento, aoComecarALer) {
    if (evento.target.closest(".botao-comecar-a-ler")) {
        aoComecarALer(livroEscolhido);
        dialogoRoleta.close();
    }
};

export function iniciarRoleta(aoComecarALer) {
    botaoRoleta.addEventListener("click", () => dialogoRoleta.showModal());
    dialogoRoleta.addEventListener("click", fecharSeClicouFora);
    botaoGirar.addEventListener("click", girarRoleta);
    livroSorteado.addEventListener("click", (evento) =>
        tratarCliqueNoSorteado(evento, aoComecarALer)
    );
};