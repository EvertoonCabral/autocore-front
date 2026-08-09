import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusOrdemBadge } from '@/shared/components/StatusOrdemBadge'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { AuditoriaInfo } from '@/shared/components/AuditoriaInfo'
import { formatBRL, formatData } from '@/lib/format'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'
import type { OrdemServicoResumoDto } from '@/api/types'
import { useObterVeiculo } from '../hooks/useObterVeiculo'
import { useDesativarVeiculo } from '../hooks/useDesativarVeiculo'

export function VeiculoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const numericId = Number(id)
  const navigate = useNavigate()

  const { data: veiculo, isLoading, isError } = useObterVeiculo(numericId)
  const desativar = useDesativarVeiculo()

  const [dialogAberto, setDialogAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erroMotivo, setErroMotivo] = useState<string | null>(null)

  useEffect(() => {
    if (!dialogAberto) {
      setMotivo('')
      setErroMotivo(null)
    }
  }, [dialogAberto])

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full max-w-2xl" />
      </div>
    )
  }

  if (isError || !veiculo) {
    return (
      <div className="space-y-3">
        <Button asChild variant="outline">
          <Link to="/veiculos">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <p className="text-sm text-destructive">Veículo não encontrado.</p>
      </div>
    )
  }

  const isAtivo = veiculo.ativo ?? true
  const ordens = veiculo.ordens ?? []

  const columns: ColumnDef<OrdemServicoResumoDto>[] = [
    {
      id: 'numero',
      header: 'Número',
      className: 'w-36 font-mono text-xs',
      cell: (o) => o.numero,
    },
    {
      id: 'status',
      header: 'Status',
      className: 'w-44',
      cell: (o) => <StatusOrdemBadge status={o.status as StatusOrdem | undefined} />,
    },
    {
      id: 'aberta',
      header: 'Aberta em',
      className: 'w-28',
      cell: (o) => formatData(o.abertaEm),
    },
    {
      id: 'totalGeral',
      header: <span className="text-right">Total</span>,
      className: 'w-32 text-right',
      cell: (o) => <span className="tabular-nums">{formatBRL(o.totalGeral ?? 0)}</span>,
    },
  ]

  function confirmarDesativar() {
    const texto = motivo.trim()
    if (!texto) {
      setErroMotivo('Informe o motivo da desativação.')
      return
    }
    void (async () => {
      try {
        await desativar.mutateAsync({ id: numericId, motivo: texto })
        toast.success('Veículo desativado.')
        setDialogAberto(false)
        navigate('/veiculos')
      } catch (err) {
        const apiErr = err as { message?: string }
        toast.error(apiErr.message ?? 'Não foi possível desativar.')
      }
    })()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={veiculo.placa ?? '(sem placa)'}
        description={
          <span className="flex items-center gap-2">
            <span>Veículo #{veiculo.id}</span>
            {!isAtivo && <Badge variant="secondary">Inativo</Badge>}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/veiculos">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            {isAtivo && (
              <Button asChild>
                <Link to={`/veiculos/${numericId}/editar`}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Link>
              </Button>
            )}
            {isAtivo && (
              <Button variant="destructive" onClick={() => setDialogAberto(true)}>
                <Trash2 className="h-4 w-4" />
                Desativar
              </Button>
            )}
          </div>
        }
      />

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-md border bg-card p-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Proprietário</dt>
          <dd className="text-base">
            <Link
              to={`/clientes/${veiculo.clienteId}`}
              className="font-medium hover:underline"
            >
              {veiculo.clienteNome ?? '—'}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Marca / Modelo</dt>
          <dd className="text-base">
            {[veiculo.marca, veiculo.modelo].filter(Boolean).join(' ') || '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Ano (fabricação / modelo)</dt>
          <dd className="text-base tabular-nums">
            {veiculo.anoFabricacao ?? '—'} / {veiculo.anoModelo ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Cor</dt>
          <dd className="text-base">{veiculo.cor ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Quilometragem atual</dt>
          <dd className="text-base tabular-nums">
            {veiculo.quilometragemAtual != null
              ? `${veiculo.quilometragemAtual.toLocaleString('pt-BR')} km`
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Chassi</dt>
          <dd className="text-base tabular-nums">{veiculo.chassi ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Renavam</dt>
          <dd className="text-base tabular-nums">{veiculo.renavam ?? '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Observações</dt>
          <dd className="text-base whitespace-pre-line">{veiculo.observacoes ?? '—'}</dd>
        </div>
        {!isAtivo && veiculo.motivoDesativacao && (
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Motivo da desativação</dt>
            <dd className="text-base whitespace-pre-line">{veiculo.motivoDesativacao}</dd>
          </div>
        )}
      </dl>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ordens de serviço deste veículo</h2>
        <DataTable
          columns={columns}
          data={ordens}
          rowKey={(o) => o.id ?? `os-${o.numero}`}
          onRowClick={(o) => navigate(`/ordens/${o.id}`)}
          empty={
            <EmptyState
              title="Nenhuma OS para este veículo"
              description="As ordens de serviço abertas para este veículo aparecerão aqui."
            />
          }
        />
      </section>

      <AuditoriaInfo
        criadoEm={veiculo.criadoEm}
        criadoPorUsuarioNome={veiculo.criadoPorUsuarioNome}
        atualizadoEm={veiculo.atualizadoEm}
        atualizadoPorUsuarioNome={veiculo.atualizadoPorUsuarioNome}
      />

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar veículo?</DialogTitle>
            <DialogDescription>
              O veículo <strong>{veiculo.placa}</strong> será marcado como inativo. O histórico
              de ordens de serviço é preservado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo-desativacao">Motivo *</Label>
            <Textarea
              id="motivo-desativacao"
              rows={3}
              placeholder="Ex.: veículo vendido / baixa definitiva."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              aria-invalid={!!erroMotivo}
            />
            {erroMotivo && (
              <p role="alert" className="text-sm text-destructive">
                {erroMotivo}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogAberto(false)}
              disabled={desativar.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmarDesativar}
              disabled={desativar.isPending}
            >
              {desativar.isPending && <Loader2 className="animate-spin" />}
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
