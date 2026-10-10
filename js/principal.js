import { carregarLivros } from "./dados.js";
import { atualizarPagina, iniciarAcoes, iniciarDialogos } from "./acoes.js";
import { iniciarFormulario } from "./formulario.js";
import { iniciarTema } from "./utilidades.js";

async function iniciarAplicacao() {
    iniciarTema();
    iniciarAcoes();
    iniciarDialogos();
    iniciarFormulario();

    await carregarLivros();
    atualizarPagina();
};

iniciarAplicacao();