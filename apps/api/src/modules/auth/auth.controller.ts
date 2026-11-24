import type { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'
import { assertBrowserOrigin, browserToken, clearBrowserSession, isBrowserSession, setBrowserSession } from './browserSession'
import {
  RegisterSchema,
  LoginSchema,
  RefreshSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from './auth.schemas'

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (isBrowserSession(req)) assertBrowserOrigin(req)
    const input = RegisterSchema.parse(req.body)
    const result = await authService.register(input)
    if (isBrowserSession(req)) {
      setBrowserSession(res, result.refreshToken)
      res.status(201).json({ user: result.user, accessToken: result.accessToken })
    } else res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (isBrowserSession(req)) assertBrowserOrigin(req)
    const input = LoginSchema.parse(req.body)
    const result = await authService.login(input)
    if (isBrowserSession(req)) {
      setBrowserSession(res, result.refreshToken)
      res.status(200).json({ user: result.user, accessToken: result.accessToken })
    } else res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (isBrowserSession(req)) {
      assertBrowserOrigin(req)
      const { refreshToken } = RefreshSchema.parse({ refreshToken: browserToken(req) ?? req.body?.refreshToken })
      const result = await authService.refresh(refreshToken, true)
      setBrowserSession(res, result.refreshToken!)
      res.status(200).json({ accessToken: result.accessToken })
      return
    }
    const { refreshToken, rotate } = RefreshSchema.parse(req.body)
    const result = await authService.refresh(refreshToken, rotate)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (isBrowserSession(req)) {
      assertBrowserOrigin(req)
      const token = browserToken(req)
      if (token) await authService.logout(RefreshSchema.parse({ refreshToken: token }).refreshToken)
      clearBrowserSession(res)
      res.status(204).end()
      return
    }
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
