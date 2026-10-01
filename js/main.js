import { carregarLivros } from "./api.js";
import { mostrarLivros } from "./render.js";
import { iniciarDialogo } from "./dialogo.js";
import { guardar, ler } from "./storage.js";

const CHAVE_FAVORITOS = "favoritos";

const listaLivros = document.querySelector("#lista-livros");
const listaFavoritos = document.querySelector("#lista-favoritos");
const contadorFavoritos = document.querySelector("#contador-favoritos");

let livros = [];

function atualizarPagina() {
  const favoritos = livros.filter((livro) => livro.favorito);

  mostrarLivros(livros, listaLivros);
  mostrarLivros(favoritos, listaFavoritos, "Ainda não tens livros favoritos.");

  contadorFavoritos.textContent = favoritos.length;
  contadorFavoritos.value = favoritos.length;
};

function alternarFavorito(id) {
  livros = livros.map((livro) =>
    livro.id === id ? { ...livro, favorito: !livro.favorito } : livro
  );

  const idsFavoritos = livros
    .filter((livro) => livro.favorito)
    .map((livro) => livro.id);

  guardar(localStorage, CHAVE_FAVORITOS, idsFavoritos);
  atualizarPagina();
};

function aoClicarNaLista(evento) {
  const botao = evento.target.closest("[aria-pressed]");

  if (!botao) {
    return;
  }

  const id = Number(botao.closest("article").dataset.id);
  alternarFavorito(id);
};

async function iniciar() {
  iniciarDialogo();
  listaLivros.addEventListener("click", aoClicarNaLista);
  listaFavoritos.addEventListener("click", aoClicarNaLista);

  const livrosDoFicheiro = await carregarLivros();
  const idsFavoritos = ler(localStorage, CHAVE_FAVORITOS, []);

  livros = livrosDoFicheiro.map((livro) => ({
    ...livro,
    favorito: idsFavoritos.includes(livro.id),
  }));

  atualizarPagina();
};

iniciar();