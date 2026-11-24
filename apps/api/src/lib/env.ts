import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  // JWT_REFRESH_SECRET removido: refresh token usa crypto.randomUUID() persistido no banco,
  // não JWT assinado — a variável estava no .env por legado sem uso real no código.
  PORT: z.string().default('3333'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Opcionais — o sistema já degrada bem sem eles
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
  SABIA_MODEL: z.string().default('gemini-3.5-flash-lite'),
  REDIS_URL: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  // Explicit proxy IPs/CIDRs, never blindly trust all forwarded headers.
  TRUST_PROXY: z.string().default(''),
  // URL pública do site (sem barra final), usada nos links enviados por e-mail.
  APP_URL: z.string().url().optional(),
  // Entrega de e-mail (recuperação de senha):
  //   smtp     -> envia via servidor SMTP (produção ou caixa local de desenvolvimento)
  //   memory   -> guarda em memória (testes automatizados)
  //   disabled -> não envia; a API registra apenas um aviso sem o token
  MAIL_TRANSPORT: z.enum(['smtp', 'memory', 'disabled']).default('disabled'),
  MAIL_FROM: z.string().default('Kuaa <nao-responda@kuaa.local>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Pagamentos (Stripe). Sem STRIPE_SECRET_KEY a venda fica desligada.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PLUS_LOOKUP_KEY: z.string().default('kuaa_plus_enem_2027'),
  // Fim do acesso do Plus vendido agora (data no horário de Brasília).
  PLUS_EXPIRES_AT: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default('2027-12-31'),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    console.error('❌ Variáveis de ambiente obrigatórias ausentes ou inválidas:')
    missing.forEach((m) => console.error(m))
    process.exit(1)
  }
  return result.data
}

export const env = validateEnv()
