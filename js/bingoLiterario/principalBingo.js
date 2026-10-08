import { iniciarTema } from "../tema.js";
import { carregarLivros } from "../dadosDosLivros.js";
import { carregarCartaoAtual, carregarDesafios } from "./dadosDoBingo.js";
import { atualizarPagina, iniciarPaginaDoBingo } from "./cartoesDoBingo.js";

async function iniciarAplicacao() {
    iniciarTema();
    iniciarPaginaDoBingo();

    await carregarDesafios();
    await carregarLivros();
    carregarCartaoAtual();
    atualizarPagina();
};

iniciarAplicacao();