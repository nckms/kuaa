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
  STRIPE_PRICE_FULL_LOOKUP: z.string().default('kuaa_plus_mensal'),
  STRIPE_PRICE_STUDENT_LOOKUP: z.string().default('kuaa_plus_mensal_estudante'),
  // Teto autorizado no Pix Automático (centavos). Cobre o preço cheio.
  PIX_MANDATE_MAX_CENTS: z.coerce.number().int().positive().default(2990),
  // IDs de usuário (separados por vírgula) que podem analisar documentos de estudante.
  ADMIN_USER_IDS: z.string().default(''),
  // Web Push (lembretes). Sem as duas chaves o recurso fica desligado.
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('https://kuaa-web.vercel.app'),
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
