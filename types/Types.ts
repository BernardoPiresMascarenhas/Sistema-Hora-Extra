// lib/types.ts
// Tipagens estritas do domínio "Hora Extra".
 
export type MetodoPagamento = "Pix" | "Débito" | "Crédito" | "Dinheiro";
 
/**
 * Produto normalizado para uso na aplicação (numbers de verdade).
 * ATENÇÃO: o Supabase retorna `numeric` como STRING. Use `parseProduto`.
 */
export interface Produto {
  id: string;
  nome: string;
  custo_reposicao: number;
  preco_venda_normal: number;
  estoque_atual: number;
  estoque_minimo: number;
  is_promo: boolean;
  qtd_minima_promo: number;
  preco_promo: number;
  criado_em: string;
}
 
export interface ProdutoRow extends Omit<
  Produto,
  "custo_reposicao" | "preco_venda_normal" | "preco_promo"
> {
  custo_reposicao: string | number;
  preco_venda_normal: string | number;
  preco_promo: string | number;
}
 
export function parseProduto(row: ProdutoRow): Produto {
  return {
    ...row,
    custo_reposicao: Number(row.custo_reposicao),
    preco_venda_normal: Number(row.preco_venda_normal),
    preco_promo: Number(row.preco_promo),
  };
}
 
/** Item do carrinho no front. */
export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}
 
/** Payload enviado ao servidor: apenas id + quantidade. */
export interface ItemVendaInput {
  produto_id: string;
  quantidade: number;
}
 
export interface Venda {
  id: string;
  total_bruto: number;
  total_custo: number;
  valor_taxa: number;       // taxa da maquininha congelada na venda
  lucro_liquido: number;    // = total_bruto - total_custo - valor_taxa
  metodo_pagamento: MetodoPagamento;
  criado_em: string;
}
 
/** Configuração de taxa por método de pagamento. */
export interface ConfiguracaoTaxa {
  metodo: MetodoPagamento;
  percentual: number;       // ex: 3.5 = 3,5%
}


export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  criado_em: string;
}