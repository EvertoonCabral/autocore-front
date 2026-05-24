import { useQuery } from '@tanstack/react-query'
import { env } from '@/lib/env'

export interface ContagensPendencias {
  pendenciasVencidas: number
  ossAguardandoProdutoHa7Dias: number
}

/**
 * Conta pendências para o sino do header. Refetch a cada 5 minutos com
 * staleTime de 60s para não martelar o back. `enabled` controla pela rota
 * (não polla se o usuário não está autenticado — caller cuida).
 *
 * Fetch direto (sem openapi-fetch) — o tipo gerado só estará disponível
 * após o próximo `npm run api:types`. A forma do dado permanece igual.
 */
export function usePendencias(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dashboard', 'pendencias'],
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const resp = await fetch(
        `${env.VITE_API_BASE_URL}/api/dashboard/pendencias`,
        { credentials: 'include' },
      )
      if (!resp.ok) {
        throw new Error(`Falha ao carregar pendências (HTTP ${resp.status})`)
      }
      const body = (await resp.json()) as { dados: ContagensPendencias }
      return body.dados
    },
  })
}
