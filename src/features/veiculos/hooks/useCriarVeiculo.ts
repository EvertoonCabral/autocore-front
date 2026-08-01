import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, ApiError } from '@/api/errors'
import type { ConflitoPlacaDto } from '@/api/types'
import type { VeiculoFormValues } from '../helpers/veiculoSchema'
import { veiculosKeys } from './useListarVeiculos'

export interface NovoVeiculoResultado {
  id: number
}

/**
 * Variáveis da criação: os valores do form + os campos do fluxo de
 * transferência (HTTP 409). Numa criação normal ambos ficam ausentes; ao
 * confirmar a transferência de placa, o caller reenvia o MESMO payload com
 * `confirmarSubstituicao: true` + o `motivoDesativacaoAnterior`.
 */
export interface CriarVeiculoVars extends VeiculoFormValues {
  confirmarSubstituicao?: boolean
  motivoDesativacaoAnterior?: string
}

/**
 * Narrowing do erro de conflito de placa (HTTP 409). Confirma que é um
 * `ApiError` de conflito cujo `conflito` carrega o payload `ConflitoPlacaDto`.
 */
export function isConflitoPlacaError(
  err: unknown,
): err is ApiError & { conflito: ConflitoPlacaDto } {
  if (!(err instanceof ApiError) || err.kind !== 'conflict') return false
  const c = err.conflito as Partial<ConflitoPlacaDto> | undefined
  return !!c && typeof c === 'object' && typeof c.placa === 'string'
}

export function useCriarVeiculo() {
  const queryClient = useQueryClient()
  return useMutation<NovoVeiculoResultado, ApiError, CriarVeiculoVars>({
    mutationFn: async (vars) => {
      const { data, error, response } = await api.POST('/api/veiculos', {
        body: {
          clienteId: vars.clienteId,
          placa: vars.placa,
          marca: vars.marca ?? null,
          modelo: vars.modelo ?? null,
          anoFabricacao: vars.anoFabricacao ?? null,
          anoModelo: vars.anoModelo ?? null,
          cor: vars.cor ?? null,
          chassi: vars.chassi ?? null,
          renavam: vars.renavam ?? null,
          observacoes: vars.observacoes ?? null,
          confirmarSubstituicao: vars.confirmarSubstituicao ?? false,
          motivoDesativacaoAnterior: vars.motivoDesativacaoAnterior ?? null,
        },
      })
      // toApiError anexa o `conflito` do corpo 409 no ApiError (kind 'conflict').
      if (error || !data) throw toApiError(error, response.status)
      const dados = unwrap<{ id?: number | null }>(data)
      return { id: Number(dados.id ?? 0) }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: veiculosKeys.all })
    },
  })
}
