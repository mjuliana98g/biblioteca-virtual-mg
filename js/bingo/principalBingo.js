   import { iniciarTema } from "../utilidades.js";
   import { carregarLivros } from "../dados.js";
   import { carregarBingo } from "./dadosBingo.js";
   import { atualizarPagina, iniciarPaginaBingo } from "./paginaBingo.js";

   async function iniciarAplicacao() {
       iniciarTema();
       iniciarPaginaBingo();

       await carregarLivros();
       await carregarBingo();
       atualizarPagina();
   };

   iniciarAplicacao();