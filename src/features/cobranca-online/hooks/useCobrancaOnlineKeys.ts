import type { components } from '@/api/schema'

export type IntencaoPagamentoDto = components['schemas']['IntencaoPagamentoDto']
export type SimulacaoCobrancaDto = components['schemas']['SimulacaoCobrancaDto']

export const cobrancaOnlineKeys = {
  all: ['cobranca-online'] as const,
  intencao: (id: number) => [...cobrancaOnlineKeys.all, 'intencao', id] as const,
  daOrdem: (ordemId: number) => [...cobrancaOnlineKeys.all, 'ordem', ordemId] as const,
  simular: (ordemId: number, valor: number | undefined, tipo: number) =>
    [...cobrancaOnlineKeys.all, 'simular', ordemId, valor ?? null, tipo] as const,
}
