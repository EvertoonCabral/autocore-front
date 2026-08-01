import { useMutation } from '@tanstack/react-query'
import { notificarNaoAutorizado } from '@/api/client'
import { env } from '@/lib/env'

export interface BaixarCsvParams {
  /**
   * Caminho do endpoint de CSV, começando com `/` (ex.:
   * `/api/relatorios/faturamento-recebido/csv`).
   */
  path: string
  /** Query params a anexar. Apenas os definidos entram na URL. */
  query?: Record<string, string | number | undefined>
  /** Nome default do arquivo caso o back não mande Content-Disposition. */
  defaultFilename: string
}

/**
 * Baixa um relatório em CSV.
 *
 * O endpoint devolve `text/csv` cru (não envelope JSON), então usamos `fetch`
 * em vez do client openapi-fetch tipado — igual ao download de PDF da OS. O
 * cookie httpOnly `autocore.auth` vai via `credentials: 'include'`. Em 401
 * notificamos manualmente (fetch cru não passa pelo middleware). O download é
 * disparado por um `<a download>` temporário sobre um object URL, revogado em
 * seguida.
 */
export function useBaixarRelatorioCsv() {
  return useMutation<void, Error, BaixarCsvParams>({
    mutationFn: async ({ path, query, defaultFilename }) => {
      const params = new URLSearchParams()
      if (query) {
        for (const [k, v] of Object.entries(query)) {
          if (v != null && v !== '') params.set(k, String(v))
        }
      }
      const qs = params.toString()
      const url = `${env.VITE_API_BASE_URL}${path}${qs ? `?${qs}` : ''}`

      const resp = await fetch(url, { method: 'GET', credentials: 'include' })

      if (!resp.ok) {
        if (resp.status === 401) notificarNaoAutorizado()
        let mensagem = `Falha ao gerar CSV (HTTP ${resp.status})`
        try {
          const body = (await resp.json()) as { erro?: string }
          if (body.erro) mensagem = body.erro
        } catch {
          // resposta não-JSON; usa mensagem padrão
        }
        throw new Error(mensagem)
      }

      const filename = filenameFromDisposition(
        resp.headers.get('Content-Disposition'),
        defaultFilename,
      )

      const blob = await resp.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    },
  })
}

/** Extrai `filename` de um header Content-Disposition; cai no default. */
function filenameFromDisposition(
  disposition: string | null,
  fallback: string,
): string {
  if (!disposition) return fallback
  // filename*=UTF-8''nome.csv  (RFC 5987) tem prioridade
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition)
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''))
    } catch {
      // fallthrough
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition)
  if (plain?.[1]) return plain[1].trim()
  return fallback
}
