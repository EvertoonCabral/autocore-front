import { z } from 'zod'

const schema = z.object({
  VITE_API_BASE_URL: z.string().url(),
})

const parsed = schema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors)
  throw new Error('VITE_API_BASE_URL não está definida ou é inválida — veja .env.example.')
}

export const env = parsed.data
