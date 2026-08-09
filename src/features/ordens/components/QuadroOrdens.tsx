import { useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import { formatBRL } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { StatusOrdemValues, type StatusOrdem } from '@/shared/enums/statusOrdem'
import type { OrdemServicoResumoDto } from '@/api/types'
import { useListarOrdens } from '../hooks/useListarOrdens'
import { useMudarStatusOrdem } from '../hooks/useMudarStatusOrdem'
import { resolverAcaoDrop } from '../lib/resolverAcaoDrop'
import { FecharOrdemDialog } from './FecharOrdemDialog'

interface ColunaMeta {
  status: StatusOrdem
  label: string
  /** Classe de cor da etapa (token semântico). */
  cor: string
  /** Mensagem quando a coluna está vazia (nunca "0"). */
  vazio: string
}

const COLUNAS: ColunaMeta[] = [
  { status: StatusOrdemValues.Aberta, label: 'Aberta', cor: 'bg-info', vazio: 'Nada aberto' },
  {
    status: StatusOrdemValues.EmAndamento,
    label: 'Em andamento',
    cor: 'bg-warning',
    vazio: 'Nada em andamento',
  },
  {
    status: StatusOrdemValues.AguardandoProduto,
    label: 'Aguardando produto',
    cor: 'bg-neutralc',
    vazio: 'Nenhum veículo na bancada',
  },
  {
    status: StatusOrdemValues.Concluida,
    label: 'Concluída',
    cor: 'bg-success',
    vazio: 'Nada concluído',
  },
]

const LIMITE_CARDS = 3

interface Filtros {
  filtro?: string
  abertaDe?: string
  abertaAte?: string
}

interface DragData {
  status: StatusOrdem
  ordem: OrdemServicoResumoDto
}

// ─── Card ──────────────────────────────────────────────────────────────────

interface CartaoProps {
  ordem: OrdemServicoResumoDto
  status: StatusOrdem
  onOpen: (id: number) => void
}

function CartaoOrdem({ ordem, status, onOpen }: CartaoProps) {
  const id = `card-${ordem.id}`
  const terminal = status === StatusOrdemValues.Concluida
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: terminal,
    data: { status, ordem } satisfies DragData,
  })

  const saldo = ordem.saldoDevedor ?? 0

  function handleKeyDown(e: KeyboardEvent) {
    // Enter abre o detalhe; as demais teclas (Espaço/setas) ficam para o
    // sensor de teclado do dnd-kit iniciar/conduzir o arraste.
    if (e.key === 'Enter') {
      e.preventDefault()
      if (ordem.id != null) onOpen(ordem.id)
      return
    }
    listeners?.onKeyDown?.(e)
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => ordem.id != null && onOpen(ordem.id)}
      className={cn(
        'cursor-pointer rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-colors',
        'hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !terminal && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <div className="font-mono text-xs text-muted-foreground">{ordem.numero}</div>
      <div className="mt-0.5 truncate text-sm font-medium">{ordem.clienteNome}</div>
      {ordem.veiculoDescricao && (
        <div className="truncate text-xs text-muted-foreground">{ordem.veiculoDescricao}</div>
      )}
      <div
        className={cn(
          'mt-1 text-xs tabular-nums',
          saldo > 0 ? 'font-medium text-danger' : 'text-muted-foreground',
        )}
      >
        {formatBRL(saldo)}
      </div>
    </div>
  )
}

// ─── Column ──────────────────────────────────────────────────────────────────

interface ColunaProps {
  meta: ColunaMeta
  filtros: Filtros
  onOpen: (id: number) => void
}

function ColunaQuadro({ meta, filtros, onOpen }: ColunaProps) {
  const [expandido, setExpandido] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${meta.status}`,
    data: { status: meta.status },
  })

  const { data, isLoading } = useListarOrdens({
    status: meta.status,
    pagina: 1,
    porPagina: 50,
    ...(filtros.filtro ? { filtro: filtros.filtro } : {}),
    ...(filtros.abertaDe ? { abertaDe: filtros.abertaDe } : {}),
    ...(filtros.abertaAte ? { abertaAte: filtros.abertaAte } : {}),
  })

  const ordens = data?.dados ?? []
  const total = data?.total ?? ordens.length
  const visiveis = expandido ? ordens : ordens.slice(0, LIMITE_CARDS)
  const restantes = ordens.length - visiveis.length

  return (
    <section
      ref={setNodeRef}
      aria-label={`Coluna ${meta.label}`}
      className={cn(
        // Bandeja recuada: `bg-secondary` é o tom "recessed" projetado, distinto
        // do canvas nos dois temas; `border-border` iguala o contorno dos demais
        // componentes (o `border-faint` sumia contra o fundo claro).
        'flex min-w-0 flex-1 flex-col rounded-xl border border-border bg-secondary transition-colors',
        isOver && 'ring-2 ring-ring',
      )}
    >
      <header className="flex items-center gap-2 border-b border-border-faint px-3 py-2.5">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', meta.cor)} aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {meta.label}
        </span>
        <span className="ml-auto rounded-full bg-subtle px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {isLoading ? '…' : total}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2 p-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[74px] w-full rounded-lg" />
            <Skeleton className="h-[74px] w-full rounded-lg" />
          </>
        ) : ordens.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">{meta.vazio}</p>
        ) : (
          <>
            {visiveis.map((o) => (
              <CartaoOrdem key={o.id} ordem={o} status={meta.status} onOpen={onOpen} />
            ))}
            {restantes > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 w-full text-xs"
                onClick={() => setExpandido(true)}
              >
                Mostrar mais {restantes}
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

// ─── Board ──────────────────────────────────────────────────────────────────

interface QuadroProps {
  filtros?: Filtros
}

export function QuadroOrdens({ filtros = {} }: QuadroProps) {
  const navigate = useNavigate()
  const mudarStatus = useMudarStatusOrdem()

  const [arrastando, setArrastando] = useState<OrdemServicoResumoDto | null>(null)
  const [pendenteFechar, setPendenteFechar] = useState<OrdemServicoResumoDto | null>(null)
  const [dialogAberto, setDialogAberto] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function onDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined
    setArrastando(data?.ordem ?? null)
  }

  function onDragEnd(event: DragEndEvent) {
    setArrastando(null)
    const { active, over } = event
    if (!over) return

    const origem = (active.data.current as DragData | undefined)?.status
    const ordem = (active.data.current as DragData | undefined)?.ordem
    const destino = (over.data.current as { status?: StatusOrdem } | undefined)?.status
    if (origem == null || destino == null || !ordem || ordem.id == null) return

    const acao = resolverAcaoDrop(origem, destino)
    if (acao === 'noop') return

    if (acao === 'mudar') {
      mudarStatus.mutate(
        { id: ordem.id, status: destino },
        {
          onError: () => toast.error('Não foi possível mover a OS.'),
          onSuccess: () => toast.success('OS movida.'),
        },
      )
      return
    }

    // acao === 'fechar'
    setPendenteFechar(ordem)
    setDialogAberto(true)
  }

  function onOpen(id: number) {
    navigate(`/ordens/${id}`)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {COLUNAS.map((meta) => (
            <ColunaQuadro key={meta.status} meta={meta} filtros={filtros} onOpen={onOpen} />
          ))}
        </div>

        <DragOverlay>
          {arrastando ? (
            <div className="rounded-lg border border-border-faint bg-card p-3 shadow-lg">
              <div className="font-mono text-xs text-muted-foreground">{arrastando.numero}</div>
              <div className="mt-0.5 text-sm font-medium">{arrastando.clienteNome}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <FecharOrdemDialog
        ordem={pendenteFechar}
        open={dialogAberto}
        onOpenChange={(open) => {
          setDialogAberto(open)
          if (!open) setPendenteFechar(null)
        }}
      />
    </>
  )
}
