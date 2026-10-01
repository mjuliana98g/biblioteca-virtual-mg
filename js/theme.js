import { guardar, ler } from "./storage.js";

const CHAVE_TEMA = "tema";

const botaoTema = document.querySelector("#botao-tema");

function aplicarTema(tema) {
  const eEscuro = tema === "escuro";

  document.documentElement.dataset.tema = tema;
  botaoTema.textContent = eEscuro ? "☀︎" : "⏾";
  botaoTema.setAttribute(
    "aria-label",
    eEscuro ? "Mudar para modo claro" : "Mudar para modo escuro"
  );
};

function alternarTema() {
  const temaAtual = document.documentElement.dataset.tema;
  const novoTema = temaAtual === "escuro" ? "claro" : "escuro";

  guardar(localStorage, CHAVE_TEMA, novoTema);
  aplicarTema(novoTema);
};

export function iniciarTema() {
  aplicarTema(ler(localStorage, CHAVE_TEMA, "claro"));
  botaoTema.addEventListener("click", alternarTema);
};