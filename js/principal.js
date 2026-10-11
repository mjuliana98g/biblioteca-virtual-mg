import { carregarLivros } from "./dados.js";
import { atualizarPagina, iniciarAcoes, iniciarDialogos, iniciarMenuLateral } from "./acoes.js";
import { iniciarFormulario } from "./formulario.js";
import { iniciarTema } from "./utilidades.js";

async function iniciarAplicacao() {
    iniciarTema();
    iniciarAcoes();
    iniciarMenuLateral();
    iniciarDialogos();
    iniciarFormulario();

    await carregarLivros();
    atualizarPagina();
};

iniciarAplicacao();