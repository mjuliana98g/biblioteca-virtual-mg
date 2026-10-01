import { carregarBiblioteca, adicionarLivro, editarLivro } from "./biblioteca.js";
import { iniciarDetalhes } from "./dialogos.js";
import { atualizarPagina, iniciarEstante, limparFiltros } from "./estante.js";
import { abrirParaEditar, iniciarFormulario } from "./formulario.js";
import { iniciarTema } from "./tema.js";

function adicionarNovoLivro(livro) {
    adicionarLivro(livro);
    limparFiltros();
    atualizarPagina();
};

function guardarLivroEditado(id, campos) {
    editarLivro(id, campos);
    atualizarPagina();
};

async function iniciar() {
    iniciarTema();
    iniciarEstante();
    iniciarDetalhes(abrirParaEditar);
    iniciarFormulario(adicionarNovoLivro, guardarLivroEditado);

    await carregarBiblioteca();
    atualizarPagina();
};

iniciar();