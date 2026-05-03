import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './msw/server'

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
