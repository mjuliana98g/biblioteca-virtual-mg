import { carregarLivros } from "./api.js";
import { mostrarLivros } from "./render.js";

const listaLivros = document.querySelector("#lista-livros");

async function iniciar() {
  const livros = await carregarLivros();
  console.log("Livros carregados:", livros);
  mostrarLivros(livros, listaLivros);
}

iniciar();