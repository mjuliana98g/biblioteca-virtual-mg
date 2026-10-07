import { guardarValor, lerValor } from "./armazenamento.js";

const CHAVE_TEMA = "tema"; // nome da etiqueta onde o tema fica guardado no localStorage
const TEMA_CLARO = "claro";
const TEMA_ESCURO = "escuro";

const botaoTema = document.querySelector("#botao-tema");

// ------------------------------------------------------------------------------------------

function definirTemaPagina(tema) { // escreve a palavra "claro" ou "escuro" no <html> e o CSS lê essa etiqueta e muda as cores
    document.documentElement.dataset.tema = tema;
};

function atualizarBotaoTema(tema) { // muda o icone e o texto do botão e do leitor de ecrã
    const temaEscuro = tema === TEMA_ESCURO;

    botaoTema.textContent = temaEscuro ? "☀︎" : "⏾";
    botaoTema.setAttribute(
        "aria-label",
        temaEscuro ? "Mudar para modo claro" : "Mudar para modo escuro"
    );
};

function mudarParaTema(tema) {
    definirTemaPagina(tema);
    atualizarBotaoTema(tema);
};

function alternarTema() {
    const temaAtual = document.documentElement.dataset.tema;
    const novoTema = temaAtual === TEMA_ESCURO ? TEMA_CLARO : TEMA_ESCURO;

    guardarValor(localStorage, CHAVE_TEMA, novoTema);
    mudarParaTema(novoTema);
};

export function iniciarTema() {
    mudarParaTema(lerValor(localStorage, CHAVE_TEMA, TEMA_CLARO)); //se não houver tema guardado, usa claro
    botaoTema.addEventListener("click", alternarTema);
};