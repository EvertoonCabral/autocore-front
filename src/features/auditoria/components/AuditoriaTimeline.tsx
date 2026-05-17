import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/shared/components/Can'
import { formatDataHora } from '@/lib/format'
import { useListarOperacoesEntidade } from '../hooks/useListarOperacoesEntidade'
import {
  OPERACAO_ICON,
  formatarDescricao,
  labelOperacao,
  type TipoEntidadeAuditavel,
} from '../helpers/auditoriaLabels'
import { CircleDot } from 'lucide-react'

interface Props {
  tipoEntidade: TipoEntidadeAuditavel
  entidadeId: number
  className?: string
}

/**
 * Timeline vertical de operações de uma entidade. Não renderiza nada
 * quando o usuário não tem `auditoria.ver` ou quando o histórico vem
 * vazio — mantém a tela limpa.
 */
export function AuditoriaTimeline({ tipoEntidade, entidadeId, className }: Props) {
  const podeVer = useCan('auditoria.ver')

  const { data, isLoading, isError } = useListarOperacoesEntidade(tipoEntidade, entidadeId, {
    enabled: podeVer,
  })

  if (!podeVer) return null

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className ?? ''}`}>
        <Skeleton className="h-5 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className={`text-sm text-muted-foreground ${className ?? ''}`}>
        Não foi possível carregar o histórico.
      </p>
    )
  }

  const items = data ?? []
  if (items.length === 0) return null

  return (
    <ol className={`space-y-3 ${className ?? ''}`}>
      {items.map((item) => {
        const Icon = OPERACAO_ICON[item.operacao ?? ''] ?? CircleDot
        const descricao = formatarDescricao(item.operacao, item.descricao)
        const usuarioNome = item.usuarioNome
        return (
          <li key={item.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {usuarioNome ? (
                  <strong className="font-medium text-foreground">{usuarioNome}</strong>
                ) : (
                  <em className="text-muted-foreground">(sistema)</em>
                )}{' '}
                <span className="text-muted-foreground">{labelOperacao(item.operacao).toLowerCase()}</span>{' '}
                <span className="text-xs text-muted-foreground">·</span>{' '}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatDataHora(item.ocorridoEm)}
                </span>
              </p>
              {descricao && (
                <p className="text-xs text-muted-foreground">{descricao}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
