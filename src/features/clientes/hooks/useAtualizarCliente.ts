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
          cpfCnpj: values.cpfCnpj ?? null,
          segundoTelefone: values.segundoTelefone ?? null,
          cep: values.cep ?? null,
          logradouro: values.logradouro ?? null,
          numero: values.numero ?? null,
          bairro: values.bairro ?? null,
          cidade: values.cidade ?? null,
          uf: values.uf ?? null,
          endereco: values.endereco ?? null,
          observacoes: values.observacoes ?? null,
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
