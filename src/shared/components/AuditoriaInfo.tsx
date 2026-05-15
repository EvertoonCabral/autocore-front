import { formatDataHora } from '@/lib/format'

interface Props {
  /** Pode ser null em registros antigos (pré-migration). */
  criadoEm?: string | null | undefined
  criadoPorUsuarioNome?: string | null | undefined
  atualizadoEm?: string | null | undefined
  atualizadoPorUsuarioNome?: string | null | undefined
  className?: string
}

/**
 * Bloco de auditoria padrão exibido no rodapé das telas de detalhe.
 * Mostra "Criado em X por Y" e, opcionalmente, "Atualizado em A por B".
 *
 * Quando o usuário é null (criação automática / antes da migration de
 * auditoria), exibe "(sistema)".
 */
export function AuditoriaInfo({
  criadoEm,
  criadoPorUsuarioNome,
  atualizadoEm,
  atualizadoPorUsuarioNome,
  className,
}: Props) {
  if (!criadoEm && !atualizadoEm) return null

  const usuario = (nome: string | null | undefined) =>
    nome ? <strong className="font-medium text-foreground">{nome}</strong> : <em>(sistema)</em>

  return (
    <div className={`flex flex-col gap-1 text-xs text-muted-foreground ${className ?? ''}`}>
      {criadoEm && (
        <p>
          Criado em <span className="tabular-nums">{formatDataHora(criadoEm)}</span> por{' '}
          {usuario(criadoPorUsuarioNome)}
        </p>
      )}
      {atualizadoEm && (
        <p>
          Atualizado em <span className="tabular-nums">{formatDataHora(atualizadoEm)}</span>{' '}
          por {usuario(atualizadoPorUsuarioNome)}
        </p>
      )}
    </div>
  )
}
