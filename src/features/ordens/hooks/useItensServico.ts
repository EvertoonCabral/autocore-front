import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { AdicionarItemServicoFormValues } from '../helpers/ordemSchemas'
import { ordensKeys } from './useListarOrdens'

interface AdicionarServicoVars {
  ordemId: number
  values: AdicionarItemServicoFormValues
}

export function useAdicionarItemServico() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AdicionarServicoVars>({
    mutationFn: async ({ ordemId, values }) => {
      const { error, response } = await api.POST('/api/ordens/{id}/servicos', {
        params: { path: { id: ordemId } },
        body: {
          catalogoServicoId: values.catalogoServicoId,
          quantidade: values.quantidade,
        },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, { ordemId }) => {
      await queryClient.invalidateQueries({ queryKey: ordensKeys.detail(ordemId) })
    },
  })
}

interface RemoverServicoVars {
  ordemId: number
  itemId: number
}

export function useRemoverItemServico() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, RemoverServicoVars>({
    mutationFn: async ({ ordemId, itemId }) => {
      const { error, response } = await api.DELETE('/api/ordens/{id}/servicos/{itemId}', {
        params: { path: { id: ordemId, itemId } },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, { ordemId }) => {
      await queryClient.invalidateQueries({ queryKey: ordensKeys.detail(ordemId) })
    },
  })
}
