import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import type { DashboardFluxoDto } from '@/api/types'

interface Props {
  fluxo: DashboardFluxoDto | undefined
  loading?: boolean
}

/** "há {n} dias" (ou "há 1 dia"). */
function haDias(n: number): string {
  return n === 1 ? 'há 1 dia' : `há ${n} dias`
}

interface ColunaProps {
  label: string
  /** Classe de cor da etapa (ex.: `bg-info`). */
  cor: string
  quantidade: number
  legenda: string
  loading: boolean
}

function Coluna({ label, cor, quantidade, legenda, loading }: ColunaProps) {
  const zerado = quantidade === 0
  return (
    <div className="flex flex-1 flex-col gap-1 px-4 py-4 first:pl-5 last:pr-5">
      <div className="flex items-center gap-2">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', cor)} aria-hidden />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-1 h-[30px] w-12" />
      ) : (
        <span
          className={cn(
            'text-[30px] font-semibold leading-none tabular-nums',
            zerado ? 'text-content-disabled' : 'text-foreground',
          )}
        >
          {quantidade}
        </span>
      )}
      <span className="min-h-4 text-xs text-muted-foreground">{loading ? '' : legenda}</span>
    </div>
  )
}

const CORES = {
  aberta: 'bg-info',
  emAndamento: 'bg-warning',
  aguardandoProduto: 'bg-neutralc',
  concluida: 'bg-success',
} as const

/**
 * Faixa de fluxo das OS (design 1a) — substitui os 6 KpiCards.
 * Quatro colunas equivalentes (Aberta / Em andamento / Aguardando produto /
 * Concluída) separadas por bordas, com uma barra proporcional no rodapé.
 */
export function FaixaFluxo({ fluxo, loading = false }: Props) {
  const aberta = fluxo?.aberta
  const emAndamento = fluxo?.emAndamento
  const aguardando = fluxo?.aguardandoProduto
  const concluida = fluxo?.concluida

  const qAberta = aberta?.quantidade ?? 0
  const qAndamento = emAndamento?.quantidade ?? 0
  const qAguardando = aguardando?.quantidade ?? 0
  const qConcluida = concluida?.quantidade ?? 0

  const legendaEtapa = (
    quantidade: number,
    maisAntigaDias: number | null | undefined,
    vazio: string,
  ): string => {
    if (quantidade === 0) return vazio
    if (maisAntigaDias != null) return `mais antiga ${haDias(maisAntigaDias)}`
    return ''
  }

  const naoPagas = concluida?.naoPagas ?? 0
  const legendaConcluida = naoPagas === 0 ? 'tudo pago' : `${naoPagas} ainda não pagas`

  const total = qAberta + qAndamento + qAguardando + qConcluida
  const segmentos = [
    { cor: CORES.aberta, valor: qAberta },
    { cor: CORES.emAndamento, valor: qAndamento },
    { cor: CORES.aguardandoProduto, valor: qAguardando },
    { cor: CORES.concluida, valor: qConcluida },
  ]

  return (
    <Card className="overflow-hidden" role="group" aria-label="Fluxo de ordens de serviço">
      <div className="flex divide-x divide-border">
        <Coluna
          label="Aberta"
          cor={CORES.aberta}
          quantidade={qAberta}
          legenda={legendaEtapa(qAberta, aberta?.maisAntigaDias, 'nada aqui')}
          loading={loading}
        />
        <Coluna
          label="Em andamento"
          cor={CORES.emAndamento}
          quantidade={qAndamento}
          legenda={legendaEtapa(qAndamento, emAndamento?.maisAntigaDias, 'nada aqui')}
          loading={loading}
        />
        <Coluna
          label="Aguardando produto"
          cor={CORES.aguardandoProduto}
          quantidade={qAguardando}
          legenda={legendaEtapa(
            qAguardando,
            aguardando?.maisAntigaDias,
            'nenhum veículo na bancada',
          )}
          loading={loading}
        />
        <Coluna
          label="Concluída"
          cor={CORES.concluida}
          quantidade={qConcluida}
          legenda={legendaConcluida}
          loading={loading}
        />
      </div>
      <div className="flex h-1 w-full overflow-hidden bg-subtle" aria-hidden>
        {total > 0 &&
          segmentos.map((s, i) =>
            s.valor > 0 ? (
              <div
                key={i}
                className={s.cor}
                style={{ width: `${(s.valor / total) * 100}%` }}
              />
            ) : null,
          )}
      </div>
    </Card>
  )
}
