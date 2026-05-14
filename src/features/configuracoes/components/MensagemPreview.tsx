import {
  MENSAGEM_COBRANCA_DEFAULT,
  MENSAGEM_PREVIEW_SAMPLE,
  renderizarMensagemPreview,
} from '../helpers/configuracaoSchema'

interface Props {
  /** Template digitado pelo usuário (live). Se vazio, mostra o default do back. */
  template: string
}

/** Preview da `MensagemCobranca` com placeholders substituídos por valores de exemplo. */
export function MensagemPreview({ template }: Props) {
  const usandoDefault = template.trim().length === 0
  const renderizado = renderizarMensagemPreview(usandoDefault ? MENSAGEM_COBRANCA_DEFAULT : template)

  return (
    <div className="space-y-2 rounded-md border bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Preview da mensagem</p>
        {usandoDefault && (
          <span className="text-xs text-muted-foreground">
            Usando template padrão (back fallback)
          </span>
        )}
      </div>

      <div className="rounded-md border bg-background p-3">
        <p className="whitespace-pre-line text-sm">{renderizado}</p>
      </div>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">
          Valores de exemplo usados no preview
        </summary>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          <dt>{'{Cliente}'}</dt>
          <dd>{MENSAGEM_PREVIEW_SAMPLE.Cliente}</dd>
          <dt>{'{Numero}'}</dt>
          <dd>{MENSAGEM_PREVIEW_SAMPLE.Numero}</dd>
          <dt>{'{Valor}'}</dt>
          <dd>{MENSAGEM_PREVIEW_SAMPLE.Valor}</dd>
          <dt>{'{Vencimento}'}</dt>
          <dd>{MENSAGEM_PREVIEW_SAMPLE.Vencimento}</dd>
        </dl>
      </details>
    </div>
  )
}
