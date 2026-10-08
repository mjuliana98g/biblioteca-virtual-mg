import { iniciarTema } from "../tema.js";
import { carregarCartaoAtual, carregarDesafios } from "./dadosDoBingo.js";
import { atualizarPagina, iniciarPaginaDoBingo } from "./cartoesDoBingo.js";

async function iniciarAplicacao() {
    iniciarTema();
    iniciarPaginaDoBingo();

    await carregarDesafios();
    carregarCartaoAtual();
    atualizarPagina();
};

iniciarAplicacao();