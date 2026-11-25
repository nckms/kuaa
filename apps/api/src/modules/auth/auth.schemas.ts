import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  school: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  // Origem do cadastro. Valores curtos e sem espaços; nada pessoal.
  attribution: z.object({
    ref: z.string().regex(/^[a-z0-9_.-]{1,40}$/i),
    utmSource: z.string().regex(/^[a-z0-9_.-]{1,40}$/i),
    utmMedium: z.string().regex(/^[a-z0-9_.-]{1,40}$/i),
    utmCampaign: z.string().regex(/^[a-z0-9_.-]{1,60}$/i),
    referrer: z.string().regex(/^[a-z0-9.-]{1,80}$/i),
    invite: z.string().regex(/^[a-z0-9]{6,12}$/i),
  }).partial().strict().optional().catch(undefined),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1).max(200).refine((value) => !value.startsWith('sha256:'), 'Token invalido'),
  rotate: z.boolean().optional(),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(72),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type RefreshInput = z.infer<typeof RefreshSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
