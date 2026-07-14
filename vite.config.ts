import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Dev com topologia same-origin: se VITE_API_BASE_URL estiver vazia, o app
    // chama /api/... relativo e este proxy encaminha ao back local (:5206),
    // espelhando o proxy do nginx em produção. Quem preferir apontar direto
    // para o back via URL absoluta em .env também continua funcionando.
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET ?? 'http://localhost:5206',
        changeOrigin: true,
      },
    },
  },
})
