import { carregarLivros, adicionarLivro, editarLivro } from "./dadosDosLivros.js";
import { iniciarDialogoDetalhes, iniciarDialogoLeitura } from "./dialogos.js";
import { atualizarPagina, iniciarEstante, limparFiltros } from "./estante.js";
import { abrirDialogoParaEditar, iniciarFormulario } from "./formulario.js";
import { iniciarTema } from "./tema.js";
import { iniciarAvisoDoBingo } from "./bingoLiterario/avisoBingo.js";

// corre quando o formulário termina de adicionar um livro
function adicionarLivroEstante(livro) {
    adicionarLivro(livro);
    limparFiltros();
    atualizarPagina();
};

// corre quando o formulário termina de editar um livro
function guardarLivroEditado(id, campos) {
    editarLivro(id, campos);
    atualizarPagina();
};

async function iniciarAplicacao() {
    iniciarTema();
    iniciarEstante();
    iniciarDialogoDetalhes(abrirDialogoParaEditar); // função está a ser entregue mas não a ser executada
    iniciarDialogoLeitura();
    iniciarFormulario(adicionarLivroEstante, guardarLivroEditado); 

    await carregarLivros(); // await para primeiro carregar os livros e depois desenhar a pagina
    iniciarAvisoDoBingo();
    atualizarPagina();
};

iniciarAplicacao();