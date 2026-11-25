// LGPD: o próprio aluno baixa uma cópia dos dados (portabilidade/acesso) e
// exclui a conta, sem depender de pedido manual.
import type { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'
import { stripeClient } from '../billing/billing'
import { clearBrowserSession } from '../auth/browserSession'

const ACTIVE_STRIPE = ['active', 'trialing', 'past_due', 'incomplete', 'unpaid']

export async function exportMyData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, school: true, city: true, state: true, plan: true, planExpiresAt: true,
        xp: true, level: true, streakDays: true, longestStreak: true, createdAt: true, lastActivityAt: true,
        preferences: true, signupSource: true },
    })
    if (!user) throw makeError('Conta não encontrada', 404, 'NOT_FOUND')
    const [enrollments, progress, sessions, simulados, essays, sabia, achievements, subscriptions, grants, studentChecks, signals] = await Promise.all([
      prisma.enrollment.findMany({ where: { userId }, include: { vestibular: { select: { slug: true, name: true } } } }),
      prisma.userTopicProgress.findMany({ where: { userId }, include: { topic: { select: { name: true } } } }),
      prisma.quizSession.findMany({ where: { userId }, orderBy: { startedAt: 'asc' }, include: {
        topic: { select: { name: true } },
        answers: { orderBy: { answeredAt: 'asc' }, select: { optionId: true, isCorrect: true, timeSpentMs: true, answeredAt: true,
          question: { select: { body: true, options: true, explanation: true } } } },
      } }),
      prisma.simuladoAttempt.findMany({ where: { userId }, select: { startedAt: true, finishedAt: true, score: true, correct: true, wrong: true, answers: true } }),
      prisma.essayDraft.findMany({ where: { userId } }),
      prisma.sabiaMessage.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, select: { conversationId: true, role: true, content: true, createdAt: true } }),
      prisma.userAchievement.findMany({ where: { userId }, include: { achievement: { select: { name: true } } } }),
      prisma.subscription.findMany({ where: { userId }, select: { status: true, priceKind: true, currentPeriodEnd: true, cancelAtPeriodEnd: true, createdAt: true } }),
      prisma.planGrant.findMany({ where: { userId }, select: { plan: true, expiresAt: true, source: true, createdAt: true } }),
      prisma.studentVerification.findMany({ where: { userId }, select: { status: true, submittedAt: true, reviewedAt: true, expiresAt: true, rejectReason: true } }),
      prisma.productSignal.findMany({ where: { userId }, select: { kind: true, periodKey: true, source: true, createdAt: true } }),
    ])
    const data = {
      exportedAt: new Date().toISOString(),
      about: 'Cópia dos seus dados no Kuaa (LGPD art. 18). Senha e documentos de estudante não são incluídos: a senha é guardada só como hash e o documento é apagado após a análise.',
      user, enrollments, progress, sessions, simulados, essays, sabia, achievements, subscriptions, planGrants: grants, studentVerifications: studentChecks, productSignals: signals,
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="kuaa-meus-dados-${new Date().toISOString().slice(0, 10)}.json"`)
    res.setHeader('Cache-Control', 'no-store')
    res.send(JSON.stringify(data, null, 2))
  } catch (err) { next(err) }
}

const DeleteSchema = z.object({ password: z.string().min(1).max(200), confirm: z.literal('EXCLUIR') })

export async function deleteMyAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = DeleteSchema.safeParse(req.body)
    if (!parsed.success) throw makeError('Digite sua senha e a palavra EXCLUIR para confirmar.', 400, 'CONFIRMATION_REQUIRED')
    const userId = req.userId!
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
    if (!user) throw makeError('Conta não encontrada', 404, 'NOT_FOUND')
    if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) throw makeError('Senha incorreta.', 403, 'INVALID_PASSWORD')

    // Primeiro para a cobrança: se a Stripe falhar, a conta NÃO é excluída (nada de cobrar quem não tem mais conta).
    const live = await prisma.subscription.findMany({ where: { userId, status: { in: ACTIVE_STRIPE } }, select: { stripeSubscriptionId: true } })
    for (const sub of live) {
      try { await stripeClient().subscriptions.cancel(sub.stripeSubscriptionId) } catch (error) {
        const code = (error as { code?: string }).code
        if (code !== 'resource_missing') throw makeError('Não foi possível cancelar sua assinatura agora. Tente de novo em alguns minutos.', 502, 'BILLING_CANCEL_FAILED')
      }
    }

    await prisma.$transaction(async (tx) => {
      const sessionIds = (await tx.quizSession.findMany({ where: { userId }, select: { id: true } })).map((s) => s.id)
      await tx.userAnswer.deleteMany({ where: { OR: [{ userId }, { question: { generatedForSessionId: { in: sessionIds } } }] } })
      // Questões geradas para as sessões do aluno saem junto (não viram acervo órfão).
      await tx.question.deleteMany({ where: { generatedForSessionId: { in: sessionIds } } })
      await tx.quizSession.deleteMany({ where: { userId } })
      await tx.userTopicProgress.deleteMany({ where: { userId } })
      await tx.userAchievement.deleteMany({ where: { userId } })
      await tx.enrollment.deleteMany({ where: { userId } })
      await tx.user.delete({ where: { id: userId } }) // o resto tem onDelete: Cascade
    })
    clearBrowserSession(res)
    res.status(204).end()
  } catch (err) { next(err) }
}
