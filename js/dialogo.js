import { guardar, ler, apagar } from "./storage.js";

const CHAVE_RASCUNHO = "rascunho-livro";

const dialogo = document.querySelector("#dialogo-livro");
const formulario = document.querySelector("#form-livro");
const botaoAbrir = document.querySelector("#botao-abrir-formulario");
const botaoFechar = document.querySelector("#fechar-formulario");
const botaoCancelar = document.querySelector("#cancelar-formulario");

function camposDoFormulario() {
  return formulario.querySelectorAll("input, select");
};

function chaveDoCampo(campo) {
  return campo.id || `${campo.name}-${campo.value}`;
};

function lerValores() {
  const valores = {};

  for (const campo of camposDoFormulario()) {
    valores[chaveDoCampo(campo)] =
      campo.type === "checkbox" ? campo.checked : campo.value;
  }

  return valores;
}

function preencherValores(valores) {
  for (const campo of camposDoFormulario()) {
    const chave = chaveDoCampo(campo);

    if (!(chave in valores)) {
      continue;
    }

    if (campo.type === "checkbox") {
      campo.checked = valores[chave];
    } else {
      campo.value = valores[chave];
    }
  }
}

function guardarRascunho() {
  guardar(sessionStorage, CHAVE_RASCUNHO, {
    aberto: dialogo.open,
    valores: lerValores(),
  });
}

function restaurarRascunho() {
  const rascunho = ler(sessionStorage, CHAVE_RASCUNHO);

  if (!rascunho) {
    return;
  }

  preencherValores(rascunho.valores);

  if (rascunho.aberto) {
    dialogo.showModal();
  }
}

/* ---------- Abrir e fechar ---------- */

function abrirDialogo() {
  dialogo.showModal();
  guardarRascunho();
}

function fecharDialogo() {
  dialogo.close();
}

function aoFechar() {
  formulario.reset();
  apagar(sessionStorage, CHAVE_RASCUNHO);
}

export function iniciarDialogo() {
  botaoAbrir.addEventListener("click", abrirDialogo);
  botaoFechar.addEventListener("click", fecharDialogo);
  botaoCancelar.addEventListener("click", fecharDialogo);
  dialogo.addEventListener("close", aoFechar);
  formulario.addEventListener("input", guardarRascunho);

  restaurarRascunho();
};