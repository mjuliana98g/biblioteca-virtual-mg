const CHAVE_TEMA = "tema";
const TEMA_CLARO = "claro";
const TEMA_ESCURO = "escuro";
const CAPA_POR_DEFEITO = "img/sem-capa.svg";

const botaoTema = document.querySelector("#botao-tema");

// ------------------------------------------------------------------------------------------
// ARMAZENAMENTO E FICHEIROS
// ------------------------------------------------------------------------------------------

export function guardarValor(armazenamento, chave, valor) {
    armazenamento.setItem(chave, JSON.stringify(valor));
};

export function lerValor(armazenamento, chave, valorPorDefeito = null) {
    try {
        const textoGuardado = armazenamento.getItem(chave);

        return textoGuardado ? JSON.parse(textoGuardado) : valorPorDefeito;
    } catch {
        return valorPorDefeito;
    }
};

export async function carregarJson(caminho) {
    try {
        const resposta = await fetch(caminho);

        if (!resposta.ok) {
            throw new Error(`Erro ao carregar ${caminho} (${resposta.status})`);
        }

        return await resposta.json();
    } catch (erro) {
        console.error(erro);
        return [];
    }
};

// ------------------------------------------------------------------------------------------
// TEMA
// ------------------------------------------------------------------------------------------

function mudarTema(tema) {
    const temaEscuro = tema === TEMA_ESCURO;

    document.documentElement.dataset.tema = tema;
    guardarValor(localStorage, CHAVE_TEMA, tema);
    botaoTema.textContent = temaEscuro ? "☀︎" : "⏾";
    botaoTema.ariaLabel = temaEscuro ? "Mudar para modo claro" : "Mudar para modo escuro";
};

export function iniciarTema() {
    mudarTema(lerValor(localStorage, CHAVE_TEMA, TEMA_CLARO));
    botaoTema.addEventListener("click", () => {
        const temaAtual = document.documentElement.dataset.tema;

        mudarTema(temaAtual === TEMA_ESCURO ? TEMA_CLARO : TEMA_ESCURO);
    });
};

// -----------------------------------------------------------------------------------------
// ELEMENTOS HTML E JANELAS
// ------------------------------------------------------------------------------------------

export function criarElemento(etiqueta, { filhos = [], dados = {}, ...propriedades } = {}) {
    const elemento = document.createElement(etiqueta);

    if (etiqueta === "button") {
        elemento.type = "button";
    }

    Object.assign(elemento, propriedades);
    Object.assign(elemento.dataset, dados);
    elemento.append(...filhos);

    return elemento;
};

export function criarCapa(livro) {
    return criarElemento("img", {
        src: livro.capa || CAPA_POR_DEFEITO,
        alt: `Capa do livro ${livro.titulo}`,
        onerror: (evento) => {
            evento.target.onerror = null;
            evento.target.src = CAPA_POR_DEFEITO;
        },
    });
};

export function esperarResposta(dialogo) {
    dialogo.returnValue = "";

    return new Promise((resolver) => {
        dialogo.addEventListener("close", () => resolver(dialogo.returnValue), { once: true });
        dialogo.showModal();
    });
};

// ------------------------------------------------------------------------------------------
// CÁLCULOS E TEXTOS
// ------------------------------------------------------------------------------------------

export function calcularPercentagem(parte, total) {
    return total > 0 ? Math.round((parte / total) * 100) : 0;
};

export function obterDataHoje() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${hoje.getFullYear()}-${mes}-${dia}`;
};

export function formatarData(data) {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

export function formatarQuantidade(total, singular, plural) {
    return `${total} ${total === 1 ? singular : plural}`;
};

export function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

export function listarUnicosOrdenados(valores) {
    return [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt"));
};