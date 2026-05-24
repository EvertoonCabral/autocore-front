import {
  CheckCircle2,
  CircleDot,
  DollarSign,
  Package,
  Send,
  Wrench,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL, formatDataHora } from '@/lib/format'
import {
  TIPO_COBRANCA,
  TIPO_ITEM_PRODUTO,
  TIPO_ITEM_SERVICO,
  TIPO_OPERACAO,
  TIPO_PAGAMENTO,
  useObterTimelineOrdem,
  type FormaPagamentoCod,
  type TimelineEntradaOrdem,
} from '../hooks/useObterTimelineOrdem'

const ICONE_POR_TIPO: Record<number, LucideIcon> = {
  [TIPO_OPERACAO]: CircleDot,
  [TIPO_PAGAMENTO]: DollarSign,
  [TIPO_ITEM_SERVICO]: Wrench,
  [TIPO_ITEM_PRODUTO]: Package,
  [TIPO_COBRANCA]: Send,
}

const NOME_FORMA: Record<FormaPagamentoCod, string> = {
  1: 'Dinheiro',
  2: 'Pix',
  3: 'Cartão',
  4: 'Transferência',
}

interface Props {
  ordemId: number
  className?: string
}

/**
 * Timeline rica de uma OS (auditoria + pagamentos + itens + cobranças
 * unificados). Renderiza nada quando o histórico está vazio (OS recém-aberta
 * sem operações) — mantém a tela limpa.
 */
export function TimelineOrdem({ ordemId, className }: Props) {
  const { data, isLoading, isError } = useObterTimelineOrdem(ordemId)

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
      {items.map((item, idx) => (
        <li key={`${item.tipo}-${item.ocorridoEm}-${idx}`} className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${corDeFundo(item)}`}
          >
            {iconeDe(item)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-medium text-foreground">{item.titulo}</span>
              {item.valor !== null && item.valor !== undefined && item.tipo !== TIPO_OPERACAO && (
                <span className="ml-1 tabular-nums text-foreground">
                  · {formatBRL(item.valor)}
                </span>
              )}
              {item.formaPagamento !== null && item.formaPagamento !== undefined && (
                <span className="ml-1 text-muted-foreground">
                  · {NOME_FORMA[item.formaPagamento]}
                </span>
              )}
              <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                {formatDataHora(item.ocorridoEm)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {item.descricao && <span>{item.descricao}</span>}
              {item.descricao && <span> · </span>}
              {item.usuarioNome ? (
                <span>por {item.usuarioNome}</span>
              ) : (
                <em>(sistema)</em>
              )}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function iconeDe(item: TimelineEntradaOrdem) {
  // Cobranças desenham CheckCircle2 (sucesso) ou XCircle (falha)
  if (item.tipo === TIPO_COBRANCA) {
    const Icon = item.cobrancaSucesso === false ? XCircle : CheckCircle2
    return <Icon className="h-3.5 w-3.5" aria-hidden />
  }
  const Icon = ICONE_POR_TIPO[item.tipo] ?? CircleDot
  return <Icon className="h-3.5 w-3.5" aria-hidden />
}

function corDeFundo(item: TimelineEntradaOrdem): string {
  if (item.tipo === TIPO_COBRANCA && item.cobrancaSucesso === false) {
    return 'border-destructive/40 bg-destructive/10 text-destructive'
  }
  if (item.tipo === TIPO_PAGAMENTO) {
    return 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300'
  }
  return 'bg-muted text-muted-foreground'
}
