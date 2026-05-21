import { env } from '@/lib/env'
import { useObterConfiguracaoEmpresa } from '@/features/configuracoes/hooks/useObterConfiguracaoEmpresa'

/**
 * Logo da empresa exibida no Header global.
 *
 * - Se há `logoHash`, carrega `<img>` apontando direto para o endpoint do back
 *   (browser cacheia 24h, ETag = logoHash). Quando o Admin substitui ou
 *   remove, o hash muda → URL muda → browser baixa nova versão.
 * - Sem logo, mostra o nome da empresa como texto (fallback). Default:
 *   "AutoCore" enquanto a query não respondeu.
 * - `crossOrigin="use-credentials"` é necessário em dev (front em :5173, back
 *   em :5206) para o browser enviar o cookie httpOnly autocore.auth — sem
 *   isso, o back responde 401.
 */
export function HeaderLogo() {
  const { data } = useObterConfiguracaoEmpresa()
  const nomeEmpresa = data?.nomeEmpresa?.trim() || 'AutoCore'

  if (data?.logoHash) {
    const src = `${env.VITE_API_BASE_URL}/api/configuracoes/empresa/logo?v=${encodeURIComponent(
      data.logoHash,
    )}`
    return (
      <img
        src={src}
        alt={nomeEmpresa}
        className="h-8 w-auto max-w-[180px] object-contain"
        crossOrigin="use-credentials"
      />
    )
  }

  return <span className="text-base font-semibold">{nomeEmpresa}</span>
}
