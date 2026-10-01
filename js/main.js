import { carregarLivros } from "./api.js";
import { mostrarLivros } from "./render.js";
import { iniciarDialogo } from "./dialogo.js";
import { guardar, ler } from "./storage.js";

const CHAVE_FAVORITOS = "favoritos";
const CHAVE_ESTADOS = "estados";

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

function mudarEstado(id, novoEstado) {
  livros = livros.map((livro) =>
    livro.id === id ? { ...livro, estado: novoEstado } : livro
  );

  const estados = ler(localStorage, CHAVE_ESTADOS, {});
  guardar(localStorage, CHAVE_ESTADOS, { ...estados, [id]: novoEstado });
  atualizarPagina();
};

function fecharMenus() {
  document.querySelectorAll(".menu-estado").forEach((menu) => {
    menu.hidden = true;
    menu.previousElementSibling.setAttribute("aria-expanded", "false");
  });
};

function alternarMenu(botao) {
  const menu = botao.nextElementSibling;
  const vaiAbrir = menu.hidden;

  fecharMenus();
  menu.hidden = !vaiAbrir;
  botao.setAttribute("aria-expanded", vaiAbrir);
};

function idDoCartao(elemento) {
  return Number(elemento.closest("article").dataset.id);
};

function aoClicarNaLista(evento) {
  const botaoFavorito = evento.target.closest("[aria-pressed]");
  const botaoEstado = evento.target.closest("button[data-estado]");
  const opcaoEstado = evento.target.closest("[data-novo-estado]");

  if (botaoFavorito) {
    alternarFavorito(idDoCartao(botaoFavorito));
  } else if (botaoEstado) {
    alternarMenu(botaoEstado);
  } else if (opcaoEstado) {
    mudarEstado(idDoCartao(opcaoEstado), opcaoEstado.dataset.novoEstado);
  }
};

function aoClicarNoDocumento(evento) {
  if (!evento.target.closest(".seletor-estado")) {
    fecharMenus();
  }
};

function aoPrimirTecla(evento) {
  if (evento.key === "Escape") {
    fecharMenus();
  }
};

async function iniciar() {
  iniciarDialogo();
  listaLivros.addEventListener("click", aoClicarNaLista);
  listaFavoritos.addEventListener("click", aoClicarNaLista);
  document.addEventListener("click", aoClicarNoDocumento);
  document.addEventListener("keydown", aoPrimirTecla);

  const livrosDoFicheiro = await carregarLivros();
  const idsFavoritos = ler(localStorage, CHAVE_FAVORITOS, []);
  const estados = ler(localStorage, CHAVE_ESTADOS, {});

  livros = livrosDoFicheiro.map((livro) => ({
    ...livro,
    favorito: idsFavoritos.includes(livro.id),
    estado: estados[livro.id] || livro.estado,
  }));

  atualizarPagina();
};

iniciar();