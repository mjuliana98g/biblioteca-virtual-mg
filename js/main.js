import { carregarLivros } from "./api.js";
import { mostrarLivros } from "./render.js";
import { iniciarDialogo } from "./dialogo.js";
import { guardar, ler } from "./storage.js";
import { iniciarTema } from "./theme.js";

const CHAVE_FAVORITOS = "favoritos";
const CHAVE_ESTADOS = "estados";
const CHAVE_REMOVIDOS = "livros-removidos";
const CHAVE_ADICIONADOS = "livros-adicionados";
const CHAVE_ORDENACAO = "ordenacao";

const listaLivros = document.querySelector("#lista-livros");
const listaFavoritos = document.querySelector("#lista-favoritos");
const contadorFavoritos = document.querySelector("#contador-favoritos");
const dialogoRemover = document.querySelector("#dialogo-remover");
const mensagemRemover = document.querySelector("#mensagem-remover");
const contadorEstante = document.querySelector("#contador-estante");
const campoPesquisa = document.querySelector("#filtro-pesquisa");
const filtroGenero = document.querySelector("#filtro-genero");
const filtroSaga = document.querySelector("#filtro-saga");
const filtrosEstado = document.querySelector("#filtros-estado");
const campoOrdenar = document.querySelector("#ordenar");
const progressoTexto = document.querySelector("#progresso-texto");
const progressoBarra = document.querySelector("#progresso-barra");

let livros = [];
let idParaRemover = null;

function atualizarContador(contador, total) {
  contador.textContent = total;
  contador.value = total;
};

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

function filtrarPorPesquisa(lista) {
  const termo = normalizar(campoPesquisa.value.trim());

  return lista.filter((livro) =>
    normalizar(`${livro.titulo} ${livro.autor}`).includes(termo)
  );
};

function unicosOrdenados(lista) {
  return [...new Set(lista)].sort((a, b) => a.localeCompare(b, "pt"));
};

function listarGeneros() {
  return unicosOrdenados(livros.flatMap((livro) => livro.generos));
};

function listarSagas() {
  return unicosOrdenados(
    livros.filter((livro) => livro.saga).map((livro) => livro.saga)
  );
};

function preencherFiltro(filtro, opcoes, valorTodos, textoTodos) {
  const selecionado = filtro.value;

  filtro.replaceChildren(
    new Option(textoTodos, valorTodos),
    ...opcoes.map((opcao) => new Option(opcao, opcao))
  );

  filtro.value = opcoes.includes(selecionado) ? selecionado : valorTodos;
};

function filtrarPorGenero(lista) {
  const genero = filtroGenero.value;

  return genero === "todos"
    ? lista
    : lista.filter((livro) => livro.generos.includes(genero));
};

function filtrarPorSaga(lista) {
  const saga = filtroSaga.value;

  return saga === "todas"
    ? lista
    : lista.filter((livro) => livro.saga === saga);
};

function filtrarPorEstado(lista) {
  const estado = filtrosEstado.querySelector('input[name="estado"]:checked').value;

  return estado === "todos"
    ? lista
    : lista.filter((livro) => livro.estado === estado);
};

function aplicarFiltros(lista) {
  return filtrarPorEstado(
    filtrarPorSaga(filtrarPorGenero(filtrarPorPesquisa(lista)))
  );
};

function ordenar(lista) {
  const criterio = campoOrdenar.value;

  return [...lista].sort((a, b) => a[criterio].localeCompare(b[criterio], "pt"));
};

function restaurarOrdenacao() {
  campoOrdenar.value = ler(sessionStorage, CHAVE_ORDENACAO, "titulo");

  if (!campoOrdenar.value) {
    campoOrdenar.value = "titulo";
  }
};

function aoMudarOrdenacao() {
  guardar(sessionStorage, CHAVE_ORDENACAO, campoOrdenar.value);
  atualizarPagina();
};

function limparFiltros() {
  campoPesquisa.value = "";
  filtroGenero.value = "todos";
  filtroSaga.value = "todas";
  filtrosEstado.querySelector('input[value="todos"]').checked = true;
};

function atualizarProgresso() {
  const total = livros.length;
  const lidos = livros.reduce(
    (soma, livro) => (livro.estado === "lido" ? soma + 1 : soma),
    0
  );

  progressoTexto.textContent = `${lidos} de ${total} ${total === 1 ? "livro lido" : "livros lidos"}`;
  progressoBarra.value = total === 0 ? 0 : Math.round((lidos / total) * 100);
};

function atualizarPagina() {
  const favoritos = livros.filter((livro) => livro.favorito);

  preencherFiltro(filtroGenero, listarGeneros(), "todos", "Todos");
  preencherFiltro(filtroSaga, listarSagas(), "todas", "Todas");

  mostrarLivros(ordenar(aplicarFiltros(livros)), listaLivros);
  mostrarLivros(favoritos, listaFavoritos, "Ainda não tens livros favoritos.");

  atualizarContador(contadorEstante, livros.length);
  atualizarContador(contadorFavoritos, favoritos.length);
  atualizarProgresso();
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

function removerLivro(id) {
  const removidos = ler(localStorage, CHAVE_REMOVIDOS, []);
  guardar(localStorage, CHAVE_REMOVIDOS, [...removidos, id]);

  livros = livros.filter((livro) => livro.id !== id);
  atualizarPagina();
};

function adicionarLivro(novoLivro) {
  const adicionados = ler(localStorage, CHAVE_ADICIONADOS, []);
  guardar(localStorage, CHAVE_ADICIONADOS, [...adicionados, novoLivro]);

  livros = [...livros, novoLivro];

  limparFiltros();
  atualizarPagina();
};

function pedirConfirmacaoParaRemover(id) {
  const livro = livros.find((livro) => livro.id === id);

  idParaRemover = id;
  mensagemRemover.textContent = `Queres remover "${livro.titulo}" da tua estante?`;
  dialogoRemover.returnValue = "";
  dialogoRemover.showModal();
};

function aoFecharConfirmacao() {
  if (dialogoRemover.returnValue === "remover") {
    removerLivro(idParaRemover);
  }
  idParaRemover = null;
};

function idDoCartao(elemento) {
  return Number(elemento.closest("article").dataset.id);
};

function aoClicarNaLista(evento) {
  const botaoFavorito = evento.target.closest("[aria-pressed]");
  const botaoEstado = evento.target.closest("button[data-estado]");
  const opcaoEstado = evento.target.closest("[data-novo-estado]");
  const botaoRemover = evento.target.closest(".botao-remover");

  if (botaoFavorito) {
    alternarFavorito(idDoCartao(botaoFavorito));
  } else if (botaoEstado) {
    alternarMenu(botaoEstado);
  } else if (opcaoEstado) {
    mudarEstado(idDoCartao(opcaoEstado), opcaoEstado.dataset.novoEstado);
  } else if (botaoRemover) {
    pedirConfirmacaoParaRemover(idDoCartao(botaoRemover));
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
  iniciarDialogo(adicionarLivro);
  iniciarTema();
  listaLivros.addEventListener("click", aoClicarNaLista);
  listaFavoritos.addEventListener("click", aoClicarNaLista);
  document.addEventListener("click", aoClicarNoDocumento);
  document.addEventListener("keydown", aoPrimirTecla);
  campoPesquisa.addEventListener("input", atualizarPagina);
  filtroGenero.addEventListener("change", atualizarPagina);
  filtroSaga.addEventListener("change", atualizarPagina);
  filtrosEstado.addEventListener("change", atualizarPagina);
  dialogoRemover.addEventListener("close", aoFecharConfirmacao);
  campoOrdenar.addEventListener("change", aoMudarOrdenacao);
  restaurarOrdenacao();

  const livrosDoFicheiro = await carregarLivros();
  const adicionados = ler(localStorage, CHAVE_ADICIONADOS, []);
  const idsFavoritos = ler(localStorage, CHAVE_FAVORITOS, []);
  const estados = ler(localStorage, CHAVE_ESTADOS, {});
  const removidos = ler(localStorage, CHAVE_REMOVIDOS, []);

  livros = [...livrosDoFicheiro, ...adicionados]
    .filter((livro) => !removidos.includes(livro.id))
    .map((livro) => ({
      ...livro,
      favorito: idsFavoritos.includes(livro.id),
      estado: estados[livro.id] || livro.estado,
    }));

  atualizarPagina();
};

iniciar();