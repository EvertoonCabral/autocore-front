import { Wrench } from 'lucide-react'
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
   *  - `icon-square`: ícone Wrench em quadrado laranja + nome ao lado (Sidebar)
   *  - `icon-circle`: ícone Wrench em círculo laranja (LoginPage com layout vertical)
   */
  fallback?: Fallback
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
  className,
}: Props) {
  const { data } = useObterConfiguracaoEmpresa()
  const nomeEmpresa = data?.nomeEmpresa?.trim() || 'AutoCore'

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

  // Com logo: img direto (browser cacheia)
  if (data?.logoHash) {
    const src = `${env.VITE_API_BASE_URL}/api/configuracoes/empresa/logo?v=${encodeURIComponent(
      data.logoHash,
    )}`
    return (
      <img
        src={src}
        alt={nomeEmpresa}
        className={cn(imgHeight, 'w-auto object-contain', className)}
      />
    )
  }

  // Sem logo: fallback configurável
  if (fallback === 'icon-square') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className={cn(
            'flex items-center justify-center rounded-md bg-primary text-primary-foreground',
            iconBox,
          )}
        >
          <Wrench className={iconSize} />
        </div>
        <span className={cn(textSize, 'font-semibold')}>{nomeEmpresa}</span>
      </div>
    )
  }

  if (fallback === 'icon-circle') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-primary text-primary-foreground',
            iconBox,
          )}
        >
          <Wrench className={iconSize} />
        </div>
        <span className={cn(textSize, 'font-semibold')}>{nomeEmpresa}</span>
      </div>
    )
  }

  // text-only (default)
  return <span className={cn(textSize, 'font-semibold', className)}>{nomeEmpresa}</span>
}
