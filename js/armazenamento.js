export function guardarValor(armazenamento, chave, valor) { // armazenamento: local ou session
    armazenamento.setItem(chave, JSON.stringify(valor)); // converte o valor em texto com JSON.stringify e guarda-o com setItem
};

export function lerValor(armazenamento, chave, valorPorDefeito = null) {
    try {
        const textoGuardado = armazenamento.getItem(chave); // vai buscar o texto com getItem(chave) e converte-o de volta com JSON.parse
        return textoGuardado ? JSON.parse(textoGuardado) : valorPorDefeito; 
    } catch {
        return valorPorDefeito;
    }
};

export function apagarValor(armazenamento, chave) {
    armazenamento.removeItem(chave);
};