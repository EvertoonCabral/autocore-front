import type { ReactNode } from 'react'
import { Settings } from 'lucide-react'
import { useObterConfiguracaoEmpresa } from '@/features/configuracoes/hooks/useObterConfiguracaoEmpresa'

interface Props {
  /** Rótulo pequeno acima do título (ex.: "ENTRAR EM"). */
  eyebrow?: string
  /** Título do formulário (ex.: nome da oficina, "Recuperar senha"). */
  title: string
  /** Subtítulo institucional abaixo do título. */
  subtitle?: string
  children: ReactNode
}

/**
 * Layout dividido das telas de autenticação (design 3c). O painel esquerdo
 * (~44%) assume a **cor da marca** (`--brand`, vinda do AccentProvider — vale
 * já no login, endpoint anônimo) e resolve o "quadrado numa folha branca": a
 * tela deixa de ser vazia porque quase metade dela é a marca. O formulário à
 * direita não tem moldura de card — já está contido pela divisão.
 *
 * O painel esquerdo traz **texto institucional** (nome da oficina + proposta de
 * valor), nunca dados reais — a tela é pré-autenticação. Em telas estreitas o
 * painel colapsa numa faixa no topo (o conteúdo grande some, resta a marca).
 *
 * O casco (3a/3b) NÃO afeta esta tela — 3c é fixo.
 */
export function AuthShell({ eyebrow, title, subtitle, children }: Props) {
  const { data } = useObterConfiguracaoEmpresa()
  const nomeEmpresa = data?.nomeEmpresa?.trim() || 'AutoCore'

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Painel da marca */}
      <aside className="flex min-h-[120px] shrink-0 flex-col justify-between bg-brand p-8 text-brand-foreground md:min-h-screen md:w-[40%] md:p-12">
        <span className="text-lg font-semibold tracking-tight">{nomeEmpresa}</span>

        {/* Discurso institucional — some na faixa estreita para caber em 120px. */}
        <div className="hidden max-w-md md:block">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            A oficina inteira em uma tela só.
          </h1>
          <p className="mt-4 text-base text-brand-foreground/80">
            Ordens de serviço, veículos, peças e recebimentos no mesmo lugar — do orçamento à baixa
            no caixa.
          </p>
        </div>

        <span className="hidden text-xs uppercase tracking-widest text-brand-foreground/70 md:inline">
          AutoCore
        </span>
      </aside>

      {/* Área do formulário */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-background px-4 py-12">
        {/* Engrenagens decorativas (mundo automotivo) — puramente visual, atrás
            do formulário. Cor da marca em baixíssima opacidade; param para quem
            prefere menos movimento. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <Settings
            strokeWidth={1}
            className="absolute -bottom-20 -right-20 h-80 w-80 animate-gear-slow text-brand/[0.07] motion-reduce:animate-none"
          />
          <Settings
            strokeWidth={1}
            className="absolute bottom-28 right-40 h-44 w-44 animate-gear-slow-reverse text-brand/[0.06] motion-reduce:animate-none"
          />
        </div>
        <div className="relative z-10 w-full max-w-md space-y-6">
          <div className="space-y-1">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
