export function guardar(armazenamento, chave, valor) {
  armazenamento.setItem(chave, JSON.stringify(valor));
};

export function ler(armazenamento, chave, valorPorDefeito = null) {
  try {
    const guardado = armazenamento.getItem(chave);
    return guardado ? JSON.parse(guardado) : valorPorDefeito;
  } catch {
    return valorPorDefeito;
  }
};

export function apagar(armazenamento, chave) {
  armazenamento.removeItem(chave);
};