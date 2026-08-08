import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, RotateCcw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/shared/components/EmptyState'
import { cn } from '@/lib/cn'
import {
  ACCENT_DEFAULTS,
  atendeContrasteMinimo,
  contrastRatio,
  derivarAccentDark,
  derivarAccentVars,
  isHexColor,
  sugerirTomAcessivel,
  THEME_BG,
} from '@/shared/theme/color'
import { useObterConfiguracaoEmpresa } from '../hooks/useObterConfiguracaoEmpresa'
import { useAtualizarAparencia } from '../hooks/useAtualizarAparencia'

const SWATCHES_LIGHT = ['#D75A0B', '#1F5F8B', '#2C6E49', '#9A3412', '#334E68']
const SWATCHES_DARK = ['#F2792E', '#4E97C9', '#56A87A', '#E8A33D', '#8FA3B8']
const MIN_CONTRASTE = 4.5

function normalizarHex(v: string): string {
  const h = v.trim().replace(/^#?/, '#')
  return h.toUpperCase()
}

export function AparenciaTab() {
  const { data, isLoading, isError } = useObterConfiguracaoEmpresa()
  const atualizar = useAtualizarAparencia()

  const [light, setLight] = useState('')
  const [dark, setDark] = useState('')
  // Enquanto o admin não mexer no escuro, ele acompanha a derivação do claro.
  const [darkTocado, setDarkTocado] = useState(false)

  // Semeia o estado a partir da configuração carregada.
  useEffect(() => {
    if (!data) return
    const l = data.accentLight && isHexColor(data.accentLight) ? data.accentLight : ACCENT_DEFAULTS.light
    setLight(l.toUpperCase())
    if (data.accentDark && isHexColor(data.accentDark)) {
      setDark(data.accentDark.toUpperCase())
      setDarkTocado(true)
    } else {
      setDark(derivarAccentDark(l).toUpperCase())
      setDarkTocado(false)
    }
  }, [data])

  function aoMudarLight(hex: string) {
    const h = normalizarHex(hex)
    setLight(h)
    if (!darkTocado && isHexColor(h)) setDark(derivarAccentDark(h).toUpperCase())
  }
  function aoMudarDark(hex: string) {
    setDark(normalizarHex(hex))
    setDarkTocado(true)
  }

  const lightOk = isHexColor(light) && atendeContrasteMinimo(light, 'light', MIN_CONTRASTE)
  const darkOk = isHexColor(dark) && atendeContrasteMinimo(dark, 'dark', MIN_CONTRASTE)
  const podeSalvar = lightOk && darkOk && !atualizar.isPending

  async function salvar() {
    if (!podeSalvar) return
    try {
      await atualizar.mutateAsync({
        accentLight: light.toUpperCase(),
        accentDark: dark.toUpperCase(),
      })
      toast.success('Cor de destaque atualizada.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar a aparência.')
    }
  }

  async function restaurarPadrao() {
    try {
      await atualizar.mutateAsync({ accentLight: null, accentDark: null })
      setLight(ACCENT_DEFAULTS.light)
      setDark(ACCENT_DEFAULTS.dark)
      setDarkTocado(false)
      toast.success('Cor de destaque restaurada para o padrão.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível restaurar.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full max-w-3xl" />
        <Skeleton className="h-64 w-full max-w-3xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Não foi possível carregar a configuração"
        description="Tente recarregar a página. Se o problema persistir, verifique se o backend está acessível."
      />
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="text-base font-semibold">Cor de destaque</h3>
        <p className="text-sm text-muted-foreground">
          Define a cor de destaque (accent) usada em botões, links, foco e gráficos. As cores de
          status (vencido, concluído, alerta) são fixas e não mudam. Exige contraste mínimo de
          4,5:1 contra o fundo do tema.
        </p>
      </div>

      <GrupoTema
        titulo="Tema claro"
        tema="light"
        valor={light}
        swatches={SWATCHES_LIGHT}
        onChange={aoMudarLight}
      />
      <GrupoTema
        titulo="Tema escuro"
        tema="dark"
        valor={dark}
        swatches={SWATCHES_DARK}
        onChange={aoMudarDark}
        legenda={
          darkTocado
            ? undefined
            : 'Pré-preenchido a partir do tema claro. Edite para personalizar.'
        }
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={restaurarPadrao} disabled={atualizar.isPending}>
          <RotateCcw className="h-4 w-4" />
          Restaurar padrão
        </Button>
        <Button type="button" onClick={salvar} disabled={!podeSalvar}>
          {atualizar.isPending ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  )
}

interface GrupoTemaProps {
  titulo: string
  tema: 'light' | 'dark'
  valor: string
  swatches: string[]
  onChange: (hex: string) => void
  legenda?: string | undefined
}

function GrupoTema({ titulo, tema, valor, swatches, onChange, legenda }: GrupoTemaProps) {
  const [mostrarCustom, setMostrarCustom] = useState(false)
  const valido = isHexColor(valor)
  const ratio = valido ? contrastRatio(valor, THEME_BG[tema]) : 0
  const ok = valido && ratio >= MIN_CONTRASTE
  const sugestao = useMemo(
    () => (valido && !ok ? sugerirTomAcessivel(valor, tema, MIN_CONTRASTE) : null),
    [valor, tema, valido, ok],
  )

  // Vars derivadas para o preview ao vivo (independem do tema global salvo).
  const vars = valido ? derivarAccentVars(valor, tema) : null
  const previewBg = tema === 'dark' ? '#1C1B19' : '#FFFFFF'
  const previewFg = tema === 'dark' ? '#F0EDE8' : '#1C1A17'

  return (
    <section className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{titulo}</h4>
        {valido && (
          <span
            className={cn(
              'text-xs tabular-nums',
              ok ? 'text-success-foreground' : 'text-danger',
            )}
          >
            Contraste {ratio.toFixed(2)}:1
          </span>
        )}
      </div>

      {legenda && <p className="text-xs text-muted-foreground">{legenda}</p>}

      {/* Swatches curados + botão custom */}
      <div className="flex flex-wrap items-center gap-2">
        {swatches.map((sw) => {
          const selecionado = valor.toUpperCase() === sw.toUpperCase()
          return (
            <button
              key={sw}
              type="button"
              aria-label={`Usar ${sw}`}
              aria-pressed={selecionado}
              onClick={() => onChange(sw)}
              className={cn(
                'h-10 w-10 rounded-md border ring-offset-background transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selecionado ? 'ring-2 ring-ring ring-offset-2' : 'border-border-strong',
              )}
              style={{ backgroundColor: sw }}
            />
          )
        })}
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Cor personalizada"
          aria-expanded={mostrarCustom}
          onClick={() => setMostrarCustom((v) => !v)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {mostrarCustom && (
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`hex-${tema}`}>Hex</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`Seletor de cor (${titulo})`}
                value={valido ? valor : '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-10 cursor-pointer rounded-md border border-border-strong bg-transparent p-0.5"
              />
              <Input
                id={`hex-${tema}`}
                value={valor}
                spellCheck={false}
                autoComplete="off"
                aria-invalid={!valido}
                onChange={(e) => onChange(e.target.value)}
                className="w-32 font-mono uppercase tabular-nums"
              />
            </div>
          </div>
        </div>
      )}

      {/* Aviso de contraste + sugestão */}
      {valido && !ok && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          <span>Contraste insuficiente ({ratio.toFixed(2)}:1). Mínimo 4,5:1.</span>
          {sugestao && (
            <button
              type="button"
              onClick={() => onChange(sugestao)}
              className="font-medium underline underline-offset-2"
            >
              Usar {sugestao}
            </button>
          )}
        </div>
      )}
      {!valido && (
        <p role="alert" className="text-sm text-danger">
          Informe uma cor hex válida (#RRGGBB).
        </p>
      )}

      {/* Preview ao vivo */}
      {vars && (
        <div
          className="space-y-3 rounded-md border p-4"
          style={{ backgroundColor: previewBg, color: previewFg }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
              style={{
                backgroundColor: `hsl(${vars.primary})`,
                color: `hsl(${vars.primaryForeground})`,
              }}
            >
              Botão primário
            </span>
            <span
              className="text-sm font-medium underline underline-offset-2"
              style={{ color: `hsl(${vars.accentForeground})` }}
            >
              Link de exemplo
            </span>
            <span
              className="inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: `hsl(${vars.accent})`,
                color: `hsl(${vars.accentForeground})`,
              }}
            >
              Badge accent
            </span>
          </div>
          <div className="h-1.5 w-full rounded-pill" style={{ backgroundColor: `hsl(${vars.primary})` }} />
        </div>
      )}
    </section>
  )
}
