import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receber } from '@/api/envelope'
import type { AgendaOrdemDto } from '@/api/types'

export const agendaKeys = {
  all: ['agenda'] as const,
  janela: (de: string, ate: string) => ['agenda', 'janela', de, ate] as const,
}

/**
 * OS agendadas dentro da janela [de, ate]. `de`/`ate` são datas de calendário
 * LOCAIS no formato `yyyy-MM-dd` — o back converte para UTC via America/Sao_Paulo.
 * Retorna a lista já desembrulhada do envelope `{ dados }`.
 */
export function useAgendaOrdens(de: string, ate: string) {
  return useQuery({
    queryKey: agendaKeys.janela(de, ate),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await api.GET('/api/ordens/agenda', {
        params: { query: { de, ate } },
      })
      return receber<AgendaOrdemDto[]>(result)
    },
  })
}
