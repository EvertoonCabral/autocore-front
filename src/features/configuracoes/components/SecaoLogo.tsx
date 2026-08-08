import { useEffect, useRef, useState } from 'react'
import { Image as ImageIcon, Loader2, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { isValidationError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { env } from '@/lib/env'
import {
  MIME_LOGO_PERMITIDOS,
  validarArquivoLogo,
} from '../helpers/configuracaoEmpresaSchema'
import { useAtualizarLogoEmpresa } from '../hooks/useAtualizarLogoEmpresa'
import { useRemoverLogoEmpresa } from '../hooks/useRemoverLogoEmpresa'
import type { ConfiguracaoEmpresaDto } from '@/api/types'

interface Props {
  configuracao: ConfiguracaoEmpresaDto
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function SecaoLogo({ configuracao }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [previewArquivo, setPreviewArquivo] = useState<string | null>(null)
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)

  const atualizar = useAtualizarLogoEmpresa()
  const remover = useRemoverLogoEmpresa()

  const temLogo = !!configuracao.logoHash
  const logoUrl = temLogo
    ? `${env.VITE_API_BASE_URL}/api/configuracoes/empresa/logo?v=${encodeURIComponent(
        configuracao.logoHash ?? '',
      )}`
    : null

  // Gerencia a object URL do preview do arquivo selecionado.
  useEffect(() => {
    if (!arquivoSelecionado) {
      setPreviewArquivo(null)
      return
    }
    const url = URL.createObjectURL(arquivoSelecionado)
    setPreviewArquivo(url)
    return () => URL.revokeObjectURL(url)
  }, [arquivoSelecionado])

  function abrirSeletor() {
    setErroValidacao(null)
    inputRef.current?.click()
  }

  function onArquivoEscolhido(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Limpa o input para permitir re-seleção do mesmo arquivo após cancelar.
    event.target.value = ''
    if (!file) return

    const resultado = validarArquivoLogo(file)
    if (!resultado.ok) {
      setErroValidacao(resultado.erro)
      setArquivoSelecionado(null)
      return
    }
    setErroValidacao(null)
    setArquivoSelecionado(file)
  }

  function cancelar() {
    setArquivoSelecionado(null)
    setErroValidacao(null)
  }

  async function enviar() {
    if (!arquivoSelecionado) return
    try {
      await atualizar.mutateAsync(arquivoSelecionado)
      toast.success('Logo atualizada.')
      setArquivoSelecionado(null)
      setErroValidacao(null)
    } catch (err: unknown) {
      const detalhes = isValidationError(err)
        ? err.detalhes.map((d) => d.mensagem).filter(Boolean).join(' ')
        : ''
      const msg =
        detalhes ||
        (err instanceof Error ? err.message : 'Não foi possível enviar a logo.')
      toast.error(msg)
    }
  }

  async function confirmarRemocao() {
    try {
      await remover.mutateAsync()
      toast.success('Logo removida.')
    } catch (err: unknown) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível remover a logo.')
    }
  }

  const exibindoPreviewArquivo = arquivoSelecionado !== null && previewArquivo !== null
  const fonteImagem = exibindoPreviewArquivo ? previewArquivo : logoUrl

  return (
    <section className="max-w-3xl space-y-4 rounded-md border bg-card p-6">
      <div>
        <h3 className="text-base font-semibold">Logo da empresa</h3>
        <p className="text-sm text-muted-foreground">
          Exibida no cabeçalho do sistema e em documentos. PNG, JPG ou WebP até 2 MB.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Preview */}
        <div className="flex h-32 w-64 shrink-0 items-center justify-center rounded-md border bg-muted/30 p-3">
          {fonteImagem ? (
            <img
              src={fonteImagem}
              alt={exibindoPreviewArquivo ? 'Pré-visualização da nova logo' : 'Logo atual'}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageIcon className="h-8 w-8" aria-hidden="true" />
              <span className="text-xs">Nenhuma logo definida</span>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="flex flex-1 flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={MIME_LOGO_PERMITIDOS.join(',')}
            onChange={onArquivoEscolhido}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            data-testid="logo-file-input"
          />

          {arquivoSelecionado ? (
            <>
              <div className="rounded-md border bg-background p-3 text-sm">
                <p className="font-medium">{arquivoSelecionado.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatarTamanho(arquivoSelecionado.size)} · {arquivoSelecionado.type}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={enviar} disabled={atualizar.isPending}>
                  {atualizar.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Enviar
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelar}
                  disabled={atualizar.isPending}
                  type="button"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={abrirSeletor}>
                <Upload className="h-4 w-4" />
                {temLogo ? 'Substituir logo' : 'Selecionar arquivo'}
              </Button>
              {temLogo && (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="destructive" disabled={remover.isPending}>
                      {remover.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remover logo
                    </Button>
                  }
                  title="Remover logo da empresa?"
                  description="O cabeçalho voltará a exibir o nome da empresa como texto. Você pode enviar uma nova logo a qualquer momento."
                  confirmLabel="Remover"
                  variant="destructive"
                  onConfirm={confirmarRemocao}
                  pending={remover.isPending}
                />
              )}
            </div>
          )}

          {erroValidacao && (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive"
            >
              {erroValidacao}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Formatos aceitos: PNG, JPG, WebP. Tamanho máximo: 2 MB. Recomendamos imagens com
            fundo transparente e proporção horizontal.
          </p>
        </div>
      </div>
    </section>
  )
}
