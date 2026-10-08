import { apagarValor, guardarValor, lerValor } from "../armazenamento.js";
import { encontrarLivro } from "../dadosDosLivros.js";

const CHAVE_AVISO_BINGO = "bingo-aviso-pendente";

const aviso = document.querySelector("#aviso-bingo");
const linkAviso = document.querySelector("#link-aviso-bingo");
const botaoRemoverAviso = document.querySelector("#remover-aviso-bingo");

function desenharAviso() {
    const livro = encontrarLivro(lerValor(sessionStorage, CHAVE_AVISO_BINGO));

    aviso.hidden = !livro;

    if (livro) {
        linkAviso.textContent = `Leste "${livro.titulo}"! Verificar Bingo Literário →`;
    }
};

function removerAviso() {
    apagarValor(sessionStorage, CHAVE_AVISO_BINGO);
    desenharAviso();
};

export function avisarDesafioPendente(idLivro) {
    guardarValor(sessionStorage, CHAVE_AVISO_BINGO, idLivro);
    desenharAviso();
};

export function iniciarAvisoDoBingo() {
    linkAviso.addEventListener("click", removerAviso);
    botaoRemoverAviso.addEventListener("click", removerAviso);
    desenharAviso();
};