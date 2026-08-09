import { Link, Outlet } from 'react-router-dom'
import { LayoutGrid, List, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/shared/components/PageHeader'
import { SearchInput } from '@/shared/components/SearchInput'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import { cn } from '@/lib/cn'
import { formatData } from '@/lib/format'
import { STATUS_ORDEM_META, STATUS_ORDEM_OPTIONS, type StatusOrdem } from '@/shared/enums/statusOrdem'
import { useOsViewMode, type OsViewMode } from '../hooks/useOsViewMode'
import { ListaOrdens } from '../components/ListaOrdens'
import { QuadroOrdens } from '../components/QuadroOrdens'
import type { ListarOrdensParams } from '../hooks/useListarOrdens'

interface Chip {
  key: string
  label: string
  onRemove: () => void
}

export function OrdensListPage() {
  const [viewMode, setViewMode] = useOsViewMode()
  const { pagina, porPagina, q, filters, setPagina, setPorPagina, setQ, setFilter } = usePagedQuery({
    porPagina: 20,
  })

  const status = filters.status ? (Number(filters.status) as StatusOrdem) : undefined
  const abertaDe = filters.de ?? undefined
  const abertaAte = filters.ate ?? undefined
  const filtro = q.trim() || undefined

  const params: ListarOrdensParams = {
    pagina,
    porPagina,
    ...(status ? { status } : {}),
    ...(abertaDe ? { abertaDe } : {}),
    ...(abertaAte ? { abertaAte } : {}),
    ...(filtro ? { filtro } : {}),
  }

  const chips: Chip[] = []
  if (status) {
    chips.push({
      key: 'status',
      label: `Status: ${STATUS_ORDEM_META[status].label}`,
      onRemove: () => setFilter('status', null),
    })
  }
  if (abertaDe || abertaAte) {
    const periodo =
      abertaDe && abertaAte
        ? `${formatData(abertaDe)} – ${formatData(abertaAte)}`
        : abertaDe
          ? `A partir de ${formatData(abertaDe)}`
          : `Até ${formatData(abertaAte)}`
    chips.push({
      key: 'periodo',
      label: `Período: ${periodo}`,
      onRemove: () => {
        setFilter('de', null)
        setFilter('ate', null)
      },
    })
  }
  if (filtro) {
    chips.push({ key: 'busca', label: `Busca: "${filtro}"`, onRemove: () => setQ('') })
  }

  function limparTudo() {
    setFilter('status', null)
    setFilter('de', null)
    setFilter('ate', null)
    setQ('')
  }

  const filtrosQuadro = {
    ...(filtro ? { filtro } : {}),
    ...(abertaDe ? { abertaDe } : {}),
    ...(abertaAte ? { abertaAte } : {}),
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ordens de Serviço"
        description="Trabalhos abertos, em andamento e finalizados."
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <Button asChild>
              <Link to="/ordens/nova">
                <Plus className="h-4 w-4" />
                Nova OS
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Buscar</Label>
          <SearchInput
            value={q}
            onDebouncedChange={setQ}
            placeholder="Número, cliente ou placa…"
            className="w-64"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            value={status ? String(status) : 'all'}
            onValueChange={(v) => setFilter('status', v === 'all' ? null : v)}
          >
            <SelectTrigger id="filter-status" className="w-48">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_ORDEM_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={String(s.value)}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-de">Aberta de</Label>
          <Input
            id="filter-de"
            type="date"
            className="w-40"
            value={abertaDe ?? ''}
            onChange={(e) => setFilter('de', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-ate">Até</Label>
          <Input
            id="filter-ate"
            type="date"
            className="w-40"
            value={abertaAte ?? ''}
            onChange={(e) => setFilter('ate', e.target.value)}
          />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-border-faint bg-subtle px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {chip.label}
              <X className="h-3 w-3" aria-hidden />
              <span className="sr-only">Remover filtro</span>
            </button>
          ))}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={limparTudo}>
            Limpar
          </Button>
        </div>
      )}

      {viewMode === 'quadro' ? (
        <QuadroOrdens filtros={filtrosQuadro} />
      ) : (
        <ListaOrdens
          params={params}
          onPaginaChange={setPagina}
          onPorPaginaChange={setPorPagina}
          buscando={Boolean(filtro)}
        />
      )}

      {/* Modal de Nova OS (rota aninhada) */}
      <Outlet />
    </div>
  )
}

interface ViewToggleProps {
  value: OsViewMode
  onChange: (mode: OsViewMode) => void
}

function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Modo de visualização"
      className="inline-flex rounded-md border border-border-faint p-0.5"
    >
      <button
        type="button"
        aria-pressed={value === 'lista'}
        onClick={() => onChange('lista')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-sm transition-colors',
          value === 'lista'
            ? 'bg-subtle font-medium text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="h-4 w-4" aria-hidden />
        Lista
      </button>
      <button
        type="button"
        aria-pressed={value === 'quadro'}
        onClick={() => onChange('quadro')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-sm transition-colors',
          value === 'quadro'
            ? 'bg-subtle font-medium text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        Quadro
      </button>
    </div>
  )
}
