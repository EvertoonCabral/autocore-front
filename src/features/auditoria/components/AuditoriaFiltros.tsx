import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/features/auth/auth-context'
import { useListarUsuarios } from '@/shared/hooks/useListarUsuarios'
import {
  OPERACAO_LABEL,
  OPERACAO_VALUES,
  TIPO_ENTIDADE_LABEL,
  TIPO_ENTIDADE_VALUES,
} from '../helpers/auditoriaLabels'

const ALL = '__all__'

export interface AuditoriaFiltrosValues {
  usuarioId: string
  tipoEntidade: string
  operacao: string
  de: string
  ate: string
}

interface Props {
  values: AuditoriaFiltrosValues
  onChange: (key: keyof AuditoriaFiltrosValues, value: string) => void
}

export function AuditoriaFiltros({ values, onChange }: Props) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  // Lista de usuários é Admin-only no back. Operador-com-flag não consegue
  // listar, então escondemos o filtro nesse caso.
  const { data: usuarios } = useListarUsuarios({ enabled: isAdmin })

  return (
    <div className="grid grid-cols-1 gap-3 rounded-md border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5">
        <Label htmlFor="filtro-tipo">Tipo</Label>
        <Select
          value={values.tipoEntidade === '' ? ALL : values.tipoEntidade}
          onValueChange={(v) => onChange('tipoEntidade', v === ALL ? '' : v)}
        >
          <SelectTrigger id="filtro-tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {TIPO_ENTIDADE_VALUES.map((t) => (
              <SelectItem key={t} value={t}>
                {TIPO_ENTIDADE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filtro-operacao">Operação</Label>
        <Select
          value={values.operacao === '' ? ALL : values.operacao}
          onValueChange={(v) => onChange('operacao', v === ALL ? '' : v)}
        >
          <SelectTrigger id="filtro-operacao">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {OPERACAO_VALUES.map((op) => (
              <SelectItem key={op} value={op}>
                {OPERACAO_LABEL[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isAdmin && (
        <div className="space-y-1.5">
          <Label htmlFor="filtro-usuario">Usuário</Label>
          <Select
            value={values.usuarioId === '' ? ALL : values.usuarioId}
            onValueChange={(v) => onChange('usuarioId', v === ALL ? '' : v)}
          >
            <SelectTrigger id="filtro-usuario">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {(usuarios ?? []).map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.nomeCompleto ?? u.email ?? `#${u.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="filtro-de">De</Label>
        <Input
          id="filtro-de"
          type="date"
          value={values.de}
          onChange={(e) => onChange('de', e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filtro-ate">Até</Label>
        <Input
          id="filtro-ate"
          type="date"
          value={values.ate}
          onChange={(e) => onChange('ate', e.target.value)}
        />
      </div>
    </div>
  )
}
