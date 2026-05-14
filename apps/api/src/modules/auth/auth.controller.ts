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

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body)
    await authService.forgotPassword(email)
    res.status(200).json({ message: 'Se o e-mail existir, enviaremos instruções' })
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
    res.status(200).json({ message: 'Senha redefinida com sucesso' })
  } catch (err) {
    next(err)
  }
}
