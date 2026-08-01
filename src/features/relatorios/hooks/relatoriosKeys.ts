/**
 * Query key factory dos relatórios financeiros. Centralizado para que
 * invalidações e testes usem a mesma raiz `['relatorios', ...]`.
 */
export const relatoriosKeys = {
  all: ['relatorios'] as const,
  faturamento: (params: Record<string, unknown>) =>
    ['relatorios', 'faturamento-recebido', params] as const,
  resumo: (params: Record<string, unknown>) =>
    ['relatorios', 'resumo-financeiro', params] as const,
  clientes: (params: Record<string, unknown>) =>
    ['relatorios', 'clientes', params] as const,
}
