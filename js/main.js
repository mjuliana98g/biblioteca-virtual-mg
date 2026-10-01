import { carregarLivros } from "./api.js";
import { mostrarLivros } from "./render.js";
import { iniciarDialogo } from "./dialogo.js";

const listaLivros = document.querySelector("#lista-livros");

async function iniciar() {
  iniciarDialogo();

  const livros = await carregarLivros();
  console.log("Livros carregados:", livros);
  mostrarLivros(livros, listaLivros);
}

iniciar();