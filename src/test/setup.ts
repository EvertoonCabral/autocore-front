import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './msw/server'

// jsdom não implementa ResizeObserver — Radix UI (Switch, Select, Dialog)
// depende dele. Polyfill mínimo para os testes não quebrarem.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  ;(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    ResizeObserverPolyfill as unknown as typeof ResizeObserver
}

const API = 'http://localhost:5206'

// Handlers default — testes que precisam de outro comportamento usam
// `server.use(...)` para sobrescrever no escopo do teste.
const defaultHandlers = [
  http.get(`${API}/api/auth/me`, () =>
    HttpResponse.json({ erro: 'Não autenticado.' }, { status: 401 }),
  ),
]

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeAll(() => server.use(...defaultHandlers))
afterEach(() => {
  server.resetHandlers()
  server.use(...defaultHandlers)
})
afterAll(() => server.close())
