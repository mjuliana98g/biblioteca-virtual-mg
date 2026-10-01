import { guardar, ler, apagar } from "./storage.js";

const CHAVE_RASCUNHO = "rascunho-livro";

const dialogo = document.querySelector("#dialogo-livro");
const formulario = document.querySelector("#form-livro");
const botaoAbrir = document.querySelector("#botao-abrir-formulario");
const botaoFechar = document.querySelector("#fechar-formulario");
const botaoCancelar = document.querySelector("#cancelar-formulario");
const caixaLancamento = document.querySelector("#eh-lancamento");
const campoData = document.querySelector("#campo-data");
const erroFormulario = document.querySelector("#erro-formulario");

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
};

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
};

function guardarRascunho() {
  guardar(sessionStorage, CHAVE_RASCUNHO, {
    aberto: dialogo.open,
    valores: lerValores(),
  });
};

function atualizarCampoData() {
  campoData.hidden = !caixaLancamento.checked;
};

function restaurarRascunho() {
  const rascunho = ler(sessionStorage, CHAVE_RASCUNHO);

  if (!rascunho) {
    return;
  }

  preencherValores(rascunho.valores);
  atualizarCampoData();

  if (rascunho.aberto) {
    dialogo.showModal();
  }
};

function abrirDialogo() {
  dialogo.showModal();
  guardarRascunho();
};

function fecharDialogo() {
  dialogo.close();
};

function aoFechar() {
  formulario.reset();
  atualizarCampoData();
  assinalarCampos([]);
  erroFormulario.textContent = "";
  apagar(sessionStorage, CHAVE_RASCUNHO);
}

function lerDadosDoFormulario() {
  const generos = [
    ...formulario.querySelectorAll('input[name="genero"]:checked'),
  ].map((caixa) => caixa.value);

  return {
    titulo: formulario.querySelector("#titulo").value.trim(),
    autor: formulario.querySelector("#autor").value.trim(),
    generos,
    idioma: formulario.querySelector("#idioma").value,
    paginas: Number(formulario.querySelector("#paginas").value),
    saga: formulario.querySelector("#saga").value.trim(),
    estado: formulario.querySelector("#estado-livro").value,
    goodreads: formulario.querySelector("#goodreads").value.trim(),
    porLancar: caixaLancamento.checked,
    dataLancamento: formulario.querySelector("#data-lancamento").value,
  };
};

function camposEmFalta(dados) {
  const regras = [
    { campo: formulario.querySelector("#titulo"), falha: dados.titulo === "" },
    { campo: formulario.querySelector("#autor"), falha: dados.autor === "" },
    { campo: formulario.querySelector("#generos"), falha: dados.generos.length === 0 },
    {
      campo: formulario.querySelector("#data-lancamento"),
      falha: dados.porLancar && dados.dataLancamento === "",
    },
  ];

  return regras.filter((regra) => regra.falha).map((regra) => regra.campo);
};

function assinalarCampos(campos) {
  for (const campo of formulario.querySelectorAll("[aria-invalid]")) {
    campo.removeAttribute("aria-invalid");
  }

  for (const campo of campos) {
    campo.setAttribute("aria-invalid", "true");
  }
};

function linkValido(texto) {
  return texto === "" || /^https?:\/\/\S+$/.test(texto);
};

function limparAssinalado(evento) {
  const assinalado = evento.target.closest("[aria-invalid]");

  if (assinalado) {
    assinalado.removeAttribute("aria-invalid");
  }
};

function criarLivro(dados) {
  return {
    id: Date.now(),
    titulo: dados.titulo,
    autor: dados.autor,
    generos: dados.generos,
    idioma: dados.idioma,
    paginas: dados.paginas > 0 ? dados.paginas : null,
    capa: "",
    estado: dados.estado,
    favorito: false,
    classificacao: 0,
    saga: dados.saga,
    volume: null,
    goodreads: dados.goodreads,
    dataLancamento: dados.porLancar ? dados.dataLancamento : "",
  };
};

function aoSubmeter(evento, aoAdicionar) {
  evento.preventDefault();

  const dados = lerDadosDoFormulario();
  const emFalta = camposEmFalta(dados);

  assinalarCampos(emFalta);

  if (emFalta.length > 0) {
    erroFormulario.textContent = "Campos obrigatórios por preencher.";
    return;
  }

  if (dados.porLancar && dados.estado !== "quero-ler") {
    assinalarCampos([formulario.querySelector("#estado-livro")]);
    erroFormulario.textContent =
      "Um livro que ainda não foi lançado só pode estar em «Quero ler».";
    return;
  }

  if (!linkValido(dados.goodreads)) {
    assinalarCampos([formulario.querySelector("#goodreads")]);
    erroFormulario.textContent =
      "O link do Goodreads tem de começar por http:// ou https://.";
    return;
  }

  aoAdicionar(criarLivro(dados));
  dialogo.close();
};

export function iniciarDialogo(aoAdicionar) {
  botaoAbrir.addEventListener("click", abrirDialogo);
  botaoFechar.addEventListener("click", fecharDialogo);
  botaoCancelar.addEventListener("click", fecharDialogo);
  dialogo.addEventListener("close", aoFechar);
  formulario.addEventListener("input", guardarRascunho);
  caixaLancamento.addEventListener("change", atualizarCampoData);
  formulario.addEventListener("submit", (evento) => aoSubmeter(evento, aoAdicionar));
  formulario.addEventListener("input", limparAssinalado);

  restaurarRascunho();
};