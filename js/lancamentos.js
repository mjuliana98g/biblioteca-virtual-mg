function dataDeHoje() {
  return new Date().toISOString().slice(0, 10);
};

export function ePorLancar(livro) {
  return Boolean(livro.dataLancamento) && livro.dataLancamento > dataDeHoje();
};