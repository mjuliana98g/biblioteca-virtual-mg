export async function carregarLivros() {
    try {
        const resposta = await fetch("data/livros.json");
        if (!resposta.ok) {
            throw new Error(`Erro ao carregar os livros (${resposta.status})`);
        }
        return await resposta.json();
    }
    catch (erro) {
        console.error(erro);
        return [];
    }
};