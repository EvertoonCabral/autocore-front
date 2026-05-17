import { Navigate } from 'react-router-dom'
import { PageHeader } from '@/shared/components/PageHeader'
import { Pagination } from '@/shared/components/Pagination'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { useCan } from '@/shared/components/Can'
import { usePagedQuery } from '@/shared/hooks/usePagedQuery'
import { formatDataHora } from '@/lib/format'
import type { AuditoriaOperacaoDto } from '@/api/types'
import {
  AuditoriaFiltros,
  type AuditoriaFiltrosValues,
} from '../components/AuditoriaFiltros'
import { useListarAuditoria } from '../hooks/useListarAuditoria'
import {
  formatarDescricao,
  labelOperacao,
  labelTipoEntidade,
} from '../helpers/auditoriaLabels'

export function AuditoriaRelatorioPage() {
  const podeVer = useCan('auditoria.ver')

  const { pagina, porPagina, filters, setPagina, setPorPagina, setFilter } = usePagedQuery({
    porPagina: 20,
  })

  const filterValues: AuditoriaFiltrosValues = {
    usuarioId: filters.usuarioId ?? '',
    tipoEntidade: filters.tipoEntidade ?? '',
    operacao: filters.operacao ?? '',
    de: filters.de ?? '',
    ate: filters.ate ?? '',
  }

  const usuarioIdNum = filterValues.usuarioId ? Number(filterValues.usuarioId) : undefined

  const { data, isLoading } = useListarAuditoria(
    {
      pagina,
      porPagina,
      ...(usuarioIdNum != null && !Number.isNaN(usuarioIdNum) ? { usuarioId: usuarioIdNum } : {}),
      ...(filterValues.tipoEntidade ? { tipoEntidade: filterValues.tipoEntidade } : {}),
      ...(filterValues.operacao ? { operacao: filterValues.operacao } : {}),
      ...(filterValues.de ? { de: filterValues.de } : {}),
      ...(filterValues.ate ? { ate: filterValues.ate } : {}),
    },
    { enabled: podeVer },
  )

  if (!podeVer) return <Navigate to="/" replace />

  const columns: ColumnDef<AuditoriaOperacaoDto>[] = [
    {
      id: 'ocorridoEm',
      header: 'Quando',
      className: 'w-44',
      cell: (row) => (
        <span className="tabular-nums">{formatDataHora(row.ocorridoEm)}</span>
      ),
    },
    {
      id: 'usuario',
      header: 'Usuário',
      cell: (row) =>
        row.usuarioNome ? (
          <span>{row.usuarioNome}</span>
        ) : (
          <em className="text-muted-foreground">(sistema)</em>
        ),
    },
    {
      id: 'tipoEntidade',
      header: 'Tipo',
      className: 'w-36',
      cell: (row) => labelTipoEntidade(row.tipoEntidade),
    },
    {
      id: 'operacao',
      header: 'Operação',
      className: 'w-40',
      cell: (row) => labelOperacao(row.operacao),
    },
    {
      id: 'entidadeId',
      header: 'ID',
      className: 'w-20 font-mono text-xs',
      cell: (row) => row.entidadeId ?? '—',
    },
    {
      id: 'descricao',
      header: 'Descrição',
      cell: (row) => {
        const desc = formatarDescricao(row.operacao, row.descricao)
        return desc ? (
          <span className="text-sm">{desc}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Auditoria de operações"
        description="Histórico completo de operações de criação, edição e exclusão."
      />

      <AuditoriaFiltros
        values={filterValues}
        onChange={(key, value) => setFilter(key, value)}
      />

      <DataTable
        columns={columns}
        data={data?.dados}
        loading={isLoading}
        rowKey={(row) => row.id ?? `aud-${row.ocorridoEm ?? ''}-${row.entidadeId ?? ''}`}
        empty={
          <EmptyState
            title="Nenhuma operação encontrada"
            description="Ajuste os filtros ou aguarde novas operações no sistema."
          />
        }
      />

      {data && data.dados.length > 0 && (
        <Pagination
          pagina={pagina}
          porPagina={porPagina}
          total={data.total}
          onPaginaChange={setPagina}
          onPorPaginaChange={setPorPagina}
        />
      )}
    </div>
  )
}
