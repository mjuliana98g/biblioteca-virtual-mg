import { criarBotao, criarCapa, criarElemento } from "./cartoesDosLivros.js";

const NAMESPACE_SVG = "http://www.w3.org/2000/svg"; // obrigatório para criar elementos SVG com JavaScript
const CENTRO = 160; // centro do desenho (igual ao transform-origin do CSS)
const RAIO = 150; // tamanho da roleta
const RAIO_DO_TEXTO = 92; // distância do centro a que fica o título de cada fatia
const NUMERO_MINIMO_DE_LIVROS = 2;
const MAXIMO_DE_LETRAS = 16; // os títulos maiores são cortados
const VOLTAS_COMPLETAS = 5; // voltas inteiras antes de parar
const DURACAO_DO_GIRO_EM_MS = 4000; // tem de ser igual à transição do CSS (4s)

const svgRoleta = document.querySelector("#roleta");
const fatiasDaRoleta = document.querySelector("#fatias-da-roleta");
const mensagemRoleta = document.querySelector("#mensagem-roleta");
const botaoRoleta = document.querySelector("#botao-roleta");
const dialogoRoleta = document.querySelector("#dialogo-roleta");
const botaoGirar = document.querySelector("#botao-girar");
const cartaoLivroSorteado = document.querySelector("#livro-sorteado");

let livrosDaRoleta = []; // os livros que estão na roleta
let rotacaoAtual = 0; // quantos graus a roleta já rodou
let livroSorteado = null; // o último livro sorteado

// ------------------------------------------------------------------------------------------

function criarElementoSvg(etiqueta, atributos = {}) { // como o criarElemento, mas para SVG
    const elemento = document.createElementNS(NAMESPACE_SVG, etiqueta);

    for (const [nome, valor] of Object.entries(atributos)) {
        elemento.setAttribute(nome, valor);
    }

    return elemento;
};

function calcularPonto(angulo, raio) { // converte um ângulo (0° = topo, para a direita) num ponto x, y
    const radianos = (angulo * Math.PI) / 180;

    return {
        x: CENTRO + raio * Math.sin(radianos),
        y: CENTRO - raio * Math.cos(radianos),
    };
};

function criarCaminhoDaFatia(anguloInicial, anguloFinal) {
    const inicio = calcularPonto(anguloInicial, RAIO);
    const fim = calcularPonto(anguloFinal, RAIO);

    return `M ${CENTRO} ${CENTRO} L ${inicio.x} ${inicio.y} A ${RAIO} ${RAIO} 0 0 1 ${fim.x} ${fim.y} Z`; // M: vai ao centro; L: linha até ao início; A: arco até ao fim; Z: fecha a fatia
};

function abreviarTitulo(titulo) {
    return titulo.length > MAXIMO_DE_LETRAS
        ? `${titulo.slice(0, MAXIMO_DE_LETRAS - 1)}…`
        : titulo;
};

function calcularRotacaoDoTexto(angulo) { // o texto da metade esquerda é virado ao contrário para não ficar de cabeça para baixo
    return angulo <= 180 ? angulo - 90 : angulo + 90;
};

function calcularTamanhoDoTexto(totalDeLivros) { // quantos mais livros, mais pequeno o texto (mínimo 9)
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
    const tamanho = 360 / totalDeLivros; // graus que cada fatia ocupa
    const anguloInicial = indice * tamanho;
    const fatia = criarElementoSvg("g", {
        class: "fatia", // o resto da divisão faz as cores repetirem-se: 0, 1, 2, 0, 1...
    });

    fatia.append(
        criarElementoSvg("path", {
            d: criarCaminhoDaFatia(anguloInicial, anguloInicial + tamanho),
        }),
        criarTextoDaFatia(livro, anguloInicial + tamanho / 2, totalDeLivros) // o texto fica no meio da fatia
    );

    return fatia;
};

export function desenharRoleta(livros) { // chamada pelo estante.js sempre que a página se atualiza
    const temLivrosSuficientes = livros.length >= NUMERO_MINIMO_DE_LIVROS;

    livrosDaRoleta = livros;
    rotacaoAtual = 0;
    cartaoLivroSorteado.hidden = true;
    botaoGirar.textContent = "Girar a roleta";
    fatiasDaRoleta.style.transform = "";
    svgRoleta.toggleAttribute("hidden", !temLivrosSuficientes); // o SVG não tem a propriedade hidden, por isso usa-se toggleAttribute
    botaoGirar.hidden = !temLivrosSuficientes;
    mensagemRoleta.hidden = temLivrosSuficientes; // sem livros suficientes, mostra a mensagem
    fatiasDaRoleta.replaceChildren(
        ...livros.map((livro, indice) => criarFatia(livro, indice, livros.length))
    );
};

// ------------------------------------------------------------------------------------------

function descreverAutoria(livro) { // "Autor · Editora" (sem a editora, se não existir)
    return [livro.autor, livro.editora].filter(Boolean).join(" · ");
};

function descreverPaginas(livro) {
    return livro.paginas ? `${livro.paginas} páginas` : ""; // evita escrever "null páginas"
};

function criarListaDeGeneros(livro) {
    const lista = criarElemento("ul", { classe: "generos-do-sorteado" });
    lista.append(...livro.generos.map((genero) => criarElemento("li", { texto: genero })));
    return lista;
};

function mostrarLivroSorteado(livro) {
    livroSorteado = livro;
    cartaoLivroSorteado.replaceChildren(
        criarCapa(livro),
        criarElemento("h3", { texto: livro.titulo }),
        criarElemento("p", { texto: descreverAutoria(livro), classe: "autor-do-sorteado" }),
        criarListaDeGeneros(livro),
        criarElemento("p", { texto: descreverPaginas(livro) }),
        criarBotao("Começar a ler", "botao-comecar-a-ler")
    );
    cartaoLivroSorteado.hidden = false;
};

// ------------------------------------------------------------------------------------------

function esperar(milissegundos) { // devolve uma Promise que só termina passado este tempo (para usar com await)
    return new Promise((resolver) => setTimeout(resolver, milissegundos));
};

function sortearIndice() {
    return Math.floor(Math.random() * livrosDaRoleta.length); // número aleatório entre 0 e o último livro
};

function calcularRotacaoFinal(indice) { // graus a rodar para a fatia sorteada parar no topo (onde está o ponteiro)
    const tamanho = 360 / livrosDaRoleta.length;
    const centroDaFatia = indice * tamanho + tamanho / 2;
    const grausEmFalta = (360 - centroDaFatia - (rotacaoAtual % 360) + 360) % 360; // o que falta a partir da posição em que a roleta já está

    return rotacaoAtual + VOLTAS_COMPLETAS * 360 + grausEmFalta; // soma sempre, para a roleta rodar sempre para a frente
};

function destacarFatia(indice) {
    Array.from(fatiasDaRoleta.children).forEach((fatia, posicao) => {
        fatia.classList.toggle("sorteada", posicao === indice); // true só na fatia sorteada
    });
};

async function girarRoleta() {
    const indice = sortearIndice();

    botaoGirar.disabled = true; // evita cliques durante o giro
    cartaoLivroSorteado.hidden = true;
    destacarFatia(-1); // -1 não corresponde a nenhuma fatia, por isso tira o destaque a todas
    rotacaoAtual = calcularRotacaoFinal(indice);
    fatiasDaRoleta.style.transform = `rotate(${rotacaoAtual}deg)`; // o CSS faz a animação
    await esperar(DURACAO_DO_GIRO_EM_MS); // espera que a roleta pare
    destacarFatia(indice);
    mostrarLivroSorteado(livrosDaRoleta[indice]);
    botaoGirar.textContent = "Girar outra vez";
    botaoGirar.disabled = false;
};

// ------------------------------------------------------------------------------------------

function fecharSeClicouFora(evento) {
    if (evento.target === dialogoRoleta) {
        dialogoRoleta.close();
    }
};

function tratarCliqueNoLivroSorteado(evento, aoComecarALer) { // o cartão é refeito a cada sorteio, por isso ouvimos no contentor e procuramos o botão com closest
    if (evento.target.closest(".botao-comecar-a-ler")) {
        aoComecarALer(livroSorteado);
        dialogoRoleta.close();
    }
};

export function iniciarRoleta(aoComecarALer) { // aoComecarALer vem do estante.js
    botaoRoleta.addEventListener("click", () => dialogoRoleta.showModal());
    dialogoRoleta.addEventListener("click", fecharSeClicouFora);
    botaoGirar.addEventListener("click", girarRoleta);
    cartaoLivroSorteado.addEventListener("click", (evento) =>
        tratarCliqueNoLivroSorteado(evento, aoComecarALer)
    );
};