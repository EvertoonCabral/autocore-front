import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import type { UsuarioDto } from '@/api/types'
import { useAuth } from '@/features/auth/auth-context'
import { useListarUsuarios } from '@/features/auditoria/hooks/useListarUsuarios'
import { useAtualizarPermissaoAuditoria } from '@/features/auditoria/hooks/useAtualizarPermissaoAuditoria'

export function AcessoAuditoriaTab() {
  const { user } = useAuth()
  const { data: usuarios, isLoading, isError } = useListarUsuarios()
  const atualizar = useAtualizarPermissaoAuditoria()

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-10 w-full max-w-2xl" />
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-destructive">Não foi possível carregar os usuários.</p>
  }

  // Filtra: esconde Admins (todos) e o próprio usuário logado.
  // Admin sempre vê auditoria — não faz sentido mostrar toggle.
  const operadores =
    (usuarios ?? []).filter(
      (u) => (u.role ?? '').toLowerCase() === 'operador' && u.id !== user?.id,
    ) ?? []

  if (operadores.length === 0) {
    return (
      <EmptyState
        title="Nenhum operador cadastrado"
        description="Quando houver usuários com role Operador, eles aparecerão aqui para receber acesso à auditoria."
      />
    )
  }

  const columns: ColumnDef<UsuarioDto>[] = [
    {
      id: 'nome',
      header: 'Nome',
      cell: (u) => <span className="font-medium">{u.nomeCompleto ?? '—'}</span>,
    },
    {
      id: 'email',
      header: 'E-mail',
      className: 'w-72',
      cell: (u) => <span className="text-muted-foreground">{u.email ?? '—'}</span>,
    },
    {
      id: 'ativo',
      header: 'Status',
      className: 'w-24',
      cell: (u) =>
        u.ativo ? (
          <Badge variant="secondary">Ativo</Badge>
        ) : (
          <Badge variant="outline">Inativo</Badge>
        ),
    },
    {
      id: 'permissao',
      header: 'Pode ver auditoria',
      className: 'w-44 text-right',
      cell: (u) => {
        const checked = u.podeVerAuditoria === true
        return (
          <div className="flex justify-end">
            <Switch
              aria-label={`Permitir auditoria para ${u.nomeCompleto ?? u.email ?? `#${u.id}`}`}
              checked={checked}
              disabled={atualizar.isPending}
              onCheckedChange={async (next) => {
                if (u.id == null) return
                try {
                  await atualizar.mutateAsync({
                    usuarioId: u.id,
                    podeVerAuditoria: next,
                  })
                  toast.success('Permissão atualizada.')
                } catch (err) {
                  const apiErr = err as { message?: string }
                  toast.error(apiErr.message ?? 'Não foi possível atualizar a permissão.')
                }
              }}
            />
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Operadores marcados aqui podem visualizar o histórico de auditoria — útil para
        encarregados ou supervisores. Administradores sempre têm acesso e não aparecem nesta
        lista.
      </p>
      <DataTable<UsuarioDto>
        columns={columns}
        data={operadores}
        rowKey={(u) => u.id ?? `usr-${u.email ?? ''}`}
      />
    </div>
  )
}
