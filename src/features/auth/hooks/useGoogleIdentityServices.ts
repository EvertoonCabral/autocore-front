import { useEffect, useRef } from 'react'
import type { GoogleCredentialResponse } from '../types/google-identity'

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const SCRIPT_ID = 'google-identity-services'

/**
 * Injeta o script do GIS uma única vez (compartilhado entre montagens) e
 * resolve quando `window.google.accounts.id` está disponível. Em jsdom/testes
 * o script nunca carrega de fato — a Promise simplesmente nunca resolve e o
 * hook degrada em silêncio (não lança).
 */
function carregarGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const existente = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existente) {
      existente.addEventListener('load', () => resolve())
      existente.addEventListener('error', () => reject(new Error('Falha ao carregar o GIS.')))
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => reject(new Error('Falha ao carregar o GIS.')))
    document.head.appendChild(script)
  })
}

export interface UseGoogleIdentityServicesOptions {
  clientId: string
  onCredential: (idToken: string) => void
}

/**
 * Encapsula TODO o acesso ao DOM/global do GIS. Devolve um `ref` para o
 * container onde o botão oficial do Google é renderizado. Nunca lança no
 * import nem no render — se `window.google` não existir (jsdom), não faz nada.
 */
export function useGoogleIdentityServices({
  clientId,
  onCredential,
}: UseGoogleIdentityServicesOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Mantém o callback atualizado sem re-inicializar o GIS a cada render.
  const onCredentialRef = useRef(onCredential)
  onCredentialRef.current = onCredential

  useEffect(() => {
    if (!clientId) return
    let cancelado = false

    carregarGis()
      .then(() => {
        if (cancelado) return
        const id = window.google?.accounts?.id
        const container = containerRef.current
        if (!id || !container) return

        id.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            if (response.credential) onCredentialRef.current(response.credential)
          },
        })
        container.replaceChildren()
        id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          logo_alignment: 'left',
        })
      })
      .catch(() => {
        // Silencioso: sem GIS, o botão simplesmente não aparece.
      })

    return () => {
      cancelado = true
    }
  }, [clientId])

  return { containerRef }
}
