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
const tituloFormulario = document.querySelector("#titulo-adicionar");
const botaoSubmeter = formulario.querySelector('button[type="submit"]');

let idEmEdicao = null;

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
  if (idEmEdicao !== null) {
    return;
  }

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

function definirModo(id) {
  idEmEdicao = id;
  tituloFormulario.textContent = id === null ? "Adicionar livro" : "Editar livro";
  botaoSubmeter.textContent = id === null ? "Adicionar" : "Guardar";
};

function valoresDoLivro(livro) {
  const dataLancamento = livro.dataLancamento || "";
  const valores = {
    "titulo": livro.titulo,
    "autor": livro.autor,
    "idioma": livro.idioma,
    "paginas": livro.paginas ?? "",
    "saga": livro.saga || "",
    "estado-livro": livro.estado,
    "volume": livro.volume ?? "",
    "classificacao": livro.classificacao > 0 ? livro.classificacao : "",
    "goodreads": livro.goodreads || "",
    "capa": livro.capa || "",
    "eh-lancamento": dataLancamento !== "",
    "data-lancamento": dataLancamento,
  };

  for (const genero of livro.generos) {
    valores[`genero-${genero}`] = true;
  }

  return valores;
};

export function abrirParaEditar(livro) {
  definirModo(livro.id);
  preencherValores(valoresDoLivro(livro));
  atualizarCampoData();
  dialogo.showModal();
};

function aoFechar() {
  definirModo(null);
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
    volume: Number(formulario.querySelector("#volume").value),
    classificacao: Number(formulario.querySelector("#classificacao").value),
    goodreads: formulario.querySelector("#goodreads").value.trim(),
    capa: formulario.querySelector("#capa").value.trim(),
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

function classificacaoValida(nota) {
  return nota >= 0 && nota <= 5 && Number.isInteger(nota * 4);
};

function primeiroErro(dados) {
  const regras = [
    {
      campo: "#estado-livro",
      falha: dados.porLancar && dados.estado !== "quero-ler",
      mensagem: "Um livro que ainda não foi lançado só pode estar em «Quero ler».",
    },
    {
      campo: "#classificacao",
      falha: !classificacaoValida(dados.classificacao),
      mensagem: "A classificação tem de estar entre 0 e 5, de 0,25 em 0,25.",
    },
    {
      campo: "#classificacao",
      falha: dados.classificacao > 0 && dados.estado !== "lido",
      mensagem: "Só podes classificar livros que já leste (estado «Lido»).",
    },
    {
      campo: "#goodreads",
      falha: !linkValido(dados.goodreads),
      mensagem: "O link do Goodreads tem de começar por http:// ou https://.",
    },
    {
      campo: "#capa",
      falha: !linkValido(dados.capa),
      mensagem: "O link da capa tem de começar por http:// ou https://.",
    },
  ];

  return regras.find((regra) => regra.falha);
};

function limparAssinalado(evento) {
  const assinalado = evento.target.closest("[aria-invalid]");

  if (assinalado) {
    assinalado.removeAttribute("aria-invalid");
  }
};

function camposDoLivro(dados) {
  return {
    titulo: dados.titulo,
    autor: dados.autor,
    generos: dados.generos,
    idioma: dados.idioma,
    paginas: dados.paginas > 0 ? dados.paginas : null,
    capa: dados.capa,
    estado: dados.estado,
    classificacao: dados.classificacao,
    saga: dados.saga,
    volume: dados.volume > 0 ? dados.volume : null,
    goodreads: dados.goodreads,
    dataLancamento: dados.porLancar ? dados.dataLancamento : "",
  };
};

function criarLivro(dados) {
  return { id: Date.now(), favorito: false, ...camposDoLivro(dados) };
};

function aoSubmeter(evento, aoAdicionar, aoEditar) {
  evento.preventDefault();

  const dados = lerDadosDoFormulario();
  const emFalta = camposEmFalta(dados);

  assinalarCampos(emFalta);

  if (emFalta.length > 0) {
    erroFormulario.textContent = "Campos obrigatórios por preencher.";
    return;
  }

  const erro = primeiroErro(dados);

  if (erro) {
    assinalarCampos([formulario.querySelector(erro.campo)]);
    erroFormulario.textContent = erro.mensagem;
    return;
  }

  if (idEmEdicao === null) {
    aoAdicionar(criarLivro(dados));
  } else {
    aoEditar(idEmEdicao, camposDoLivro(dados));
  }

  dialogo.close();
};

export function iniciarDialogo(aoAdicionar, aoEditar) {
  botaoAbrir.addEventListener("click", abrirDialogo);
  botaoFechar.addEventListener("click", fecharDialogo);
  botaoCancelar.addEventListener("click", fecharDialogo);
  dialogo.addEventListener("close", aoFechar);
  formulario.addEventListener("submit", (evento) => aoSubmeter(evento, aoAdicionar, aoEditar));
  caixaLancamento.addEventListener("change", atualizarCampoData);
  formulario.addEventListener("submit", (evento) => aoSubmeter(evento, aoAdicionar));
  formulario.addEventListener("input", limparAssinalado);

  restaurarRascunho();
};