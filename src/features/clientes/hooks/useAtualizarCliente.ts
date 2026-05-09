import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { ClienteFormValues } from '../helpers/clienteSchema'
import { clientesKeys } from './useListarClientes'

interface AtualizarClienteVars {
  id: number
  values: ClienteFormValues
}

export function useAtualizarCliente() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarClienteVars>({
    mutationFn: async ({ id, values }) => {
      const { error, response } = await api.PUT('/api/clientes/{id}', {
        params: { path: { id } },
        body: {
          id,
          nome: values.nome,
          telefone: values.telefone,
          email: values.email ?? null,
          cpf: values.cpf ?? null,
          endereco: values.endereco ?? null,
        },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientesKeys.all }),
        queryClient.invalidateQueries({ queryKey: clientesKeys.detail(id) }),
      ])
    },
  })
}
