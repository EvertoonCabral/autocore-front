import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { ClienteFormValues } from '../helpers/clienteSchema'
import { clientesKeys } from './useListarClientes'

export interface NovoClienteResultado {
  id: number
}

export function useCriarCliente() {
  const queryClient = useQueryClient()
  return useMutation<NovoClienteResultado, ApiError, ClienteFormValues>({
    mutationFn: async (form) => {
      const { data, error, response } = await api.POST('/api/clientes', {
        body: {
          nome: form.nome,
          telefone: form.telefone,
          email: form.email ?? null,
          cpf: form.cpf ?? null,
          endereco: form.endereco ?? null,
        },
      })
      if (error || !data) throw toApiError(error, response.status)
      const dados = unwrap<{ id?: number | null }>(data)
      return { id: Number(dados.id ?? 0) }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientesKeys.all })
    },
  })
}
