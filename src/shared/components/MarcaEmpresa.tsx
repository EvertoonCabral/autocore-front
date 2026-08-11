import { Zap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { env } from '@/lib/env'
import { useObterConfiguracaoEmpresa } from '@/features/configuracoes/hooks/useObterConfiguracaoEmpresa'

type Size = 'sm' | 'md' | 'lg'
type Fallback = 'text-only' | 'icon-square' | 'icon-circle'

interface Props {
  /** Altura/escala do logo. `sm` (header/sidebar), `md` (cards), `lg` (login). */
  size?: Size
  /**
   * O que mostrar quando a empresa não tem logo definida:
   *  - `text-only`: apenas o nome da empresa em texto (default — Header global)
   *  - `icon-square`: ícone de raio (Zap) num quadrado do casco (branco no
   *    sidebar-colorida claro, marca no casco escuro) + nome ao lado (Sidebar).
   *    Usa os tokens `--nav-active-*` para SEMPRE contrastar com a sidebar,
   *    diferente do primário (que compartilha o matiz da marca).
   *  - `icon-circle`: ícone de raio (Zap) em círculo da cor da marca (LoginPage
   *    com layout vertical) — fora do casco, usa `--brand` direto.
   */
  fallback?: Fallback
  /**
   * Texto de marca exibido ao lado do logo/ícone. Quando informado, aparece
   * mesmo quando há logo (ex.: nome do produto "AutoCore" ao lado da logo da
   * empresa na sidebar). Quando ausente, usa o nome da empresa nos fallbacks.
   */
  label?: string
  className?: string
}

/**
 * Marca visual da oficina — logo configurada pelo Admin em
 * `/configuracoes` → aba "Empresa", ou fallback quando ainda não há logo.
 *
 * Como o endpoint `GET /api/configuracoes/empresa` é **anônimo**, este
 * componente pode ser usado também na tela de Login (antes do usuário
 * autenticar). O `<img>` aponta direto para o endpoint do back e o
 * browser cacheia por 24h (ETag = logoHash); quando o Admin substitui
 * ou remove, o hash muda → URL muda → browser baixa nova versão.
 */
export function MarcaEmpresa({
  size = 'md',
  fallback = 'text-only',
  label,
  className,
}: Props) {
  const { data } = useObterConfiguracaoEmpresa()
  const nomeEmpresa = data?.nomeEmpresa?.trim() || 'AutoCore'
  // Texto da marca: `label` explícito (ex.: "AutoCore") tem prioridade.
  const marca = label ?? nomeEmpresa

  // Tamanhos por escala
  const imgHeight = {
    sm: 'h-8 max-w-[160px]',
    md: 'h-10 max-w-[200px]',
    lg: 'h-16 max-w-[280px]',
  }[size]

  const iconBox = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }[size]

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size]

  const textSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size]

  // Com logo: img direto (browser cacheia). Se houver `label`, mostra o texto
  // da marca (ex.: "AutoCore") ao lado da logo da empresa.
  if (data?.logoHash) {
    const src = `${env.VITE_API_BASE_URL}/api/configuracoes/empresa/logo?v=${encodeURIComponent(
      data.logoHash,
    )}`
    if (!label) {
      return (
        <img
          src={src}
          alt={nomeEmpresa}
          className={cn(imgHeight, 'w-auto object-contain', className)}
        />
      )
    }
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <img src={src} alt={nomeEmpresa} className={cn(imgHeight, 'w-auto object-contain')} />
        <span className={cn(textSize, 'font-semibold')}>{label}</span>
      </div>
    )
  }

  // Sem logo: fallback configurável
  if (fallback === 'icon-square') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className={cn(
            'flex items-center justify-center rounded-md bg-nav-active text-nav-active-foreground',
            iconBox,
          )}
        >
          <Zap className={iconSize} />
        </div>
        <span className={cn(textSize, 'font-semibold')}>{marca}</span>
      </div>
    )
  }

  if (fallback === 'icon-circle') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-brand text-brand-foreground',
            iconBox,
          )}
        >
          <Zap className={iconSize} />
        </div>
        <span className={cn(textSize, 'font-semibold')}>{marca}</span>
      </div>
    )
  }

  // text-only (default)
  return <span className={cn(textSize, 'font-semibold', className)}>{marca}</span>
}
