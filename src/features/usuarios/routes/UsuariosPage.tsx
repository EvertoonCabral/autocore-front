import { useMemo, useState } from 'react'
import { Eye, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type ColumnDef } from '@/shared/components/DataTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { RequireRole } from '@/shared/guards/RequireRole'
import { useListarUsuarios } from '@/shared/hooks/useListarUsuarios'
import { useAuth } from '@/features/auth/auth-context'
import type { UsuarioDto } from '@/api/types'
import { NovoUsuarioDialog } from '../components/NovoUsuarioDialog'
import { EditarUsuarioDialog } from '../components/EditarUsuarioDialog'

export function UsuariosPage() {
  return (
    // eslint-disable-next-line jsx-a11y/aria-role -- `role` é prop do nosso guard, não ARIA
    <RequireRole role="Admin">
      <UsuariosPageInner />
    </RequireRole>
  )
}

function UsuariosPageInner() {
  const { user } = useAuth()
  const { data: usuarios, isLoading, isError } = useListarUsuarios()
  const [mostrarInativos, setMostrarInativos] = useState(false)
  const [novoOpen, setNovoOpen] = useState(false)
  const [editar, setEditar] = useState<UsuarioDto | null>(null)

  const lista = useMemo(() => {
    const base = usuarios ?? []
    return mostrarInativos ? base : base.filter((u) => u.ativo !== false)
  }, [usuarios, mostrarInativos])

  const columns: ColumnDef<UsuarioDto>[] = [
    {
      id: 'nome',
      header: 'Nome',
      cell: (u) => <span className="font-bold">{u.nomeCompleto ?? '—'}</span>,
    },
    {
      id: 'email',
      header: 'E-mail',
      cell: (u) => <span className="text-muted-foreground">{u.email ?? '—'}</span>,
    },
    {
      id: 'role',
      header: 'Role',
      className: 'w-28',
      cell: (u) =>
        (u.role ?? '').toLowerCase() === 'admin' ? (
          <Badge>Admin</Badge>
        ) : (
          <Badge variant="secondary">Operador</Badge>
        ),
    },
    {
      id: 'ativo',
      header: 'Status',
      className: 'w-24',
      cell: (u) =>
        u.ativo ? (
          <Badge className="bg-success text-white hover:bg-success">Ativo</Badge>
        ) : (
          <Badge variant="secondary">Inativo</Badge>
        ),
    },
    {
      id: 'auditoria',
      header: 'Pode ver auditoria',
      className: 'w-44',
      cell: (u) =>
        u.podeVerAuditoria === true ? (
          <span
            className="inline-flex items-center text-muted-foreground"
            title="Configurar em /configuracoes → Acesso à Auditoria"
            aria-label="Pode ver auditoria"
          >
            <Eye className="h-4 w-4" />
          </span>
        ) : null,
    },
    {
      id: 'acoes',
      header: '',
      className: 'w-24 text-right',
      cell: (u) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditar(u)}
          aria-label={`Editar ${u.nomeCompleto ?? u.email ?? `#${u.id ?? ''}`}`}
        >
          Editar
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuários"
        description="Gerencie Admins e Operadores."
        actions={
          <Button onClick={() => setNovoOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo usuário
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <Switch
          id="mostrarInativos"
          checked={mostrarInativos}
          onCheckedChange={setMostrarInativos}
        />
        <Label htmlFor="mostrarInativos" className="cursor-pointer text-sm font-normal">
          Mostrar inativos
        </Label>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar os usuários.</p>
      ) : (
        <DataTable<UsuarioDto>
          columns={columns}
          data={lista}
          loading={isLoading}
          rowKey={(u) => u.id ?? `usr-${u.email ?? ''}`}
          empty={
            <EmptyState
              title="Nenhum usuário encontrado"
              description={
                mostrarInativos
                  ? 'A base ainda não tem usuários cadastrados.'
                  : 'Tente marcar "Mostrar inativos" para ver desativados.'
              }
            />
          }
        />
      )}

      <NovoUsuarioDialog open={novoOpen} onOpenChange={setNovoOpen} />

      {editar && (
        <EditarUsuarioDialog
          usuario={editar}
          usuarioCorrenteId={user?.id ?? 0}
          open={true}
          onOpenChange={(o) => {
            if (!o) setEditar(null)
          }}
        />
      )}
    </div>
  )
}
