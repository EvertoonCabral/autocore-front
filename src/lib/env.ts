import { z } from 'zod'

const schema = z.object({
  // Vazio ('') = topologia same-origin: o app chama caminhos relativos
  // (/api/...) e o nginx do front faz proxy para a API. Uma URL absoluta
  // aponta para uma API em outra origem (exige CORS + SameSite compatível).
  VITE_API_BASE_URL: z.string().url().or(z.literal('')).default(''),
  // Client ID do Google Identity Services. Vazio ('') = login com Google
  // desabilitado (o botão nem é renderizado). Preenchido = habilita o fluxo
  // "Entrar com Google" na tela de login.
  VITE_GOOGLE_CLIENT_ID: z.string().default(''),
})

const parsed = schema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors)
  throw new Error('VITE_API_BASE_URL inválida (use uma URL http(s) ou deixe vazia) — veja .env.example.')
}

export const env = parsed.data
