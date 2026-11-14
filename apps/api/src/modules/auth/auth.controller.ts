import type { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'
import {
  RegisterSchema,
  LoginSchema,
  RefreshSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from './auth.schemas'

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = RegisterSchema.parse(req.body)
    const result = await authService.register(input)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = LoginSchema.parse(req.body)
    const result = await authService.login(input)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = RefreshSchema.parse(req.body)
    const result = await authService.refresh(refreshToken)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = RefreshSchema.parse(req.body)
    await authService.logout(refreshToken)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export const FORGOT_PASSWORD_MESSAGE =
  'Se houver uma conta com este e-mail, enviaremos um link para redefinir a senha. Confira também a caixa de spam.'

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body)
    // Resposta imediata e idêntica para qualquer e-mail: o tempo de envio do
    // e-mail não pode revelar se a conta existe.
    void authService.forgotPassword(email).catch((error: unknown) => {
      console.error('[Auth] Falha ao processar pedido de redefinição:', error instanceof Error ? error.message : 'erro')
    })
    res.status(202).json({ message: FORGOT_PASSWORD_MESSAGE })
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = ResetPasswordSchema.parse(req.body)
    await authService.resetPassword(input)
    res.status(200).json({ message: 'Senha redefinida. Entre com a nova senha.' })
  } catch (err) {
    next(err)
  }
}
