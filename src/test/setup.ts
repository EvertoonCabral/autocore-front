import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './msw/server'

// jsdom não implementa ResizeObserver — Radix UI (Switch, Select, Dialog)
// depende dele. Polyfill mínimo para os testes não quebrarem.
if (typeof globalThis.ResizeObserver === 'undefined') {
  // Polyfill mínimo + dispara a callback uma vez ao chamar `observe()` com
  // dimensões mockadas. O Recharts <ResponsiveContainer> precisa receber ao
  // menos um evento para sair do estado "0x0" no jsdom.
  class ResizeObserverPolyfill implements ResizeObserver {
    private callback: ResizeObserverCallback
    constructor(cb: ResizeObserverCallback) {
      this.callback = cb
    }
    observe(target: Element): void {
      const rect = { width: 500, height: 300, top: 0, left: 0, right: 500, bottom: 300 }
      const entry = {
        target,
        contentRect: rect as DOMRectReadOnly,
        borderBoxSize: [{ inlineSize: 500, blockSize: 300 }],
        contentBoxSize: [{ inlineSize: 500, blockSize: 300 }],
        devicePixelContentBoxSize: [{ inlineSize: 500, blockSize: 300 }],
      } as unknown as ResizeObserverEntry
      // Dispara assíncrono para imitar comportamento real.
      queueMicrotask(() => this.callback([entry], this))
    }
    unobserve(): void {}
    disconnect(): void {}
  }
  ;(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    ResizeObserverPolyfill as unknown as typeof ResizeObserver
}

// jsdom não implementa layout — getBoundingClientRect e offsetWidth/Height
// retornam 0. Recharts <ResponsiveContainer> não renderiza nada nesse caso.
// Mockamos dimensões padrão (500x300) para que os gráficos apareçam nos
// testes. Componentes que querem testar layout real continuam funcionando
// porque os mocks só atuam quando o valor padrão (0) seria retornado.
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return (
      (this as unknown as { __mockWidth?: number }).__mockWidth ?? 500
    )
  },
})
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    return (
      (this as unknown as { __mockHeight?: number }).__mockHeight ?? 300
    )
  },
})

// Recharts <ResponsiveContainer> usa ResizeObserver para detectar a área
// do parent. Como o polyfill é no-op, sobrescrevemos `getBoundingClientRect`
// para devolver dimensões fixas — assim o gráfico calcula um layout válido.
const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
HTMLElement.prototype.getBoundingClientRect = function (): DOMRect {
  const rect = originalGetBoundingClientRect.call(this)
  if (rect.width !== 0 || rect.height !== 0) return rect
  return {
    width: 500,
    height: 300,
    top: 0,
    left: 0,
    right: 500,
    bottom: 300,
    x: 0,
    y: 0,
    toJSON: () => rect,
  }
}

// jsdom também não implementa hasPointerCapture/releasePointerCapture, que
// Radix Select usa internamente. Stubs no-op evitam o throw.
if (typeof HTMLElement.prototype.hasPointerCapture === 'undefined') {
  ;(HTMLElement.prototype as unknown as { hasPointerCapture: () => boolean }).hasPointerCapture =
    () => false
}
if (typeof HTMLElement.prototype.releasePointerCapture === 'undefined') {
  ;(HTMLElement.prototype as unknown as { releasePointerCapture: () => void }).releasePointerCapture =
    () => undefined
}
if (typeof HTMLElement.prototype.scrollIntoView === 'undefined') {
  HTMLElement.prototype.scrollIntoView = () => undefined
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
