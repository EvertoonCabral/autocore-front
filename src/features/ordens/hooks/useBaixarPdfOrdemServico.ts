import { useMutation } from '@tanstack/react-query'
import { notificarNaoAutorizado } from '@/api/client'
import { env } from '@/lib/env'

export type TipoPdfOrdem = 'orcamento' | 'recibo'

export interface BaixarPdfParams {
  id: number
  tipo: TipoPdfOrdem
}

/**
 * Baixa o PDF de uma OS (orçamento ou recibo) e abre numa nova aba.
 *
 * O endpoint retorna `application/pdf` direto (não envelope JSON), por isso
 * usamos `fetch` em vez do client openapi-fetch tipado. O cookie httpOnly
 * `autocore.auth` é enviado via `credentials: 'include'` — mesma config do
 * resto da app. Em caso de erro, o back devolve `ApiErrorResponse` em JSON e
 * extraímos `erro` para o toast.
 */
export function useBaixarPdfOrdemServico() {
  return useMutation<void, Error, BaixarPdfParams>({
    mutationFn: async ({ id, tipo }) => {
      const url = `${env.VITE_API_BASE_URL}/api/ordens/${id}/pdf?tipo=${tipo}`
      const resp = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })

      if (!resp.ok) {
        // fetch cru não passa pelo middleware do openapi-fetch — notifica 401
        // manualmente para a sessão expirada derrubar o usuário.
        if (resp.status === 401) notificarNaoAutorizado()
        let mensagem = `Falha ao gerar PDF (HTTP ${resp.status})`
        try {
          const body = (await resp.json()) as { erro?: string }
          if (body.erro) mensagem = body.erro
        } catch {
          // resposta não-JSON; usa mensagem padrão
        }
        throw new Error(mensagem)
      }

      const blob = await resp.blob()
      const objectUrl = URL.createObjectURL(blob)
      // Abre numa nova aba — o browser cuida do preview e oferece download.
      // Revogamos o object URL após uma janela curta para liberar memória.
      window.open(objectUrl, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    },
  })
}
