import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './schema'
import { env } from '@/lib/env'

/**
 * Evento global emitido quando uma resposta autenticada retorna 401.
 * O AuthProvider escuta e força logout + redirect para /login.
 */
export const UNAUTHORIZED_EVENT = 'autocore:unauthorized'

const unauthorizedMiddleware: Middleware = {
  onResponse: ({ response, request }) => {
    if (response.status === 401) {
      // Não dispara para o próprio /login (evita loop em credenciais erradas).
      const isLoginCall = new URL(request.url).pathname.endsWith('/api/auth/login')
      if (!isLoginCall) {
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
      }
    }
    return response
  },
}

// `credentials: 'include'` faz o browser enviar o cookie httpOnly autocore.auth
// em todas as requests. O cookie é setado pelo back em /api/auth/login e nunca
// é tocado pelo JavaScript (defesa contra XSS).
//
// `fetch` é resolvido por chamada (não capturado no createClient) para que MSW
// e outros patchers de globalThis.fetch funcionem em ambiente de teste.
export const api = createClient<paths>({
  baseUrl: env.VITE_API_BASE_URL,
  credentials: 'include',
  fetch: (...args) => globalThis.fetch(...args),
})
api.use(unauthorizedMiddleware)
