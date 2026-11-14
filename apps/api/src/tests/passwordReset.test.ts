import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { memoryOutbox } from '../lib/mailer'
import { hashResetToken } from '../modules/auth/passwordReset'

// Ordem importa: o limite em memória é 5 pedidos/hora por IP para /forgot-password.
let account: Awaited<ReturnType<typeof registerAndLogin>>
const logged: string[] = []
const spies = (['log', 'info', 'warn', 'error'] as const).map((level) =>
  vi.spyOn(console, level).mockImplementation((...args: unknown[]) => { logged.push(args.map(String).join(' ')) }))

const forgot = (email: string) => api.post('/api/v1/auth/forgot-password').send({ email })
const reset = (token: string, password: string) => api.post('/api/v1/auth/reset-password').send({ token, password })
const tokenFromMail = (text: string) => decodeURIComponent(/#token=([A-Za-z0-9_%-]+)/.exec(text)![1]!)
async function nextMail(before: number) {
  await vi.waitFor(() => expect(memoryOutbox.length).toBe(before + 1), { timeout: 5000 })
  return memoryOutbox[before]!
}
/** Libera o intervalo de reenvio de 60 s sem esperar. */
const skipCooldown = () => testPrisma.passwordResetToken.updateMany({
  where: { userId: account.userId }, data: { createdAt: new Date(Date.now() - 120_000) } })

beforeAll(async () => {
  await truncateUserData()
  account = await registerAndLogin('password_reset')
})
beforeEach(() => { logged.length = 0 })
afterAll(async () => {
  spies.forEach((spy) => spy.mockRestore())
  await testPrisma.$disconnect()
})

describe('recuperação de senha', () => {
  it('responde igual para e-mail existente e inexistente e só envia para a conta real', async () => {
    const before = memoryOutbox.length
    const known = await forgot(account.email.toUpperCase())
    const unknown = await forgot('ninguem-cadastrado@kuaa-test.com')
    expect(known.status).toBe(202)
    expect(unknown.status).toBe(known.status)
    expect(unknown.body).toEqual(known.body)
    const mail = await nextMail(before)
    expect(mail.to).toBe(account.email)
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(memoryOutbox.length).toBe(before + 1)
    expect(mail.text).toMatch(/\/redefinir-senha#token=/)
    expect(mail.text).not.toMatch(/\?token=/)

    // Pedido repetido dentro de 60 s: mesma resposta, nenhum e-mail novo.
    const quiet = await forgot(account.email)
    expect(quiet.status).toBe(202)
    expect(quiet.body).toEqual(known.body)
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(memoryOutbox.length).toBe(before + 1)
  })

  it('guarda só o hash, não registra o token em log e troca a senha uma única vez', async () => {
    const token = tokenFromMail(memoryOutbox.at(-1)!.text)
    const rows = await testPrisma.passwordResetToken.findMany({ where: { userId: account.userId } })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.tokenHash).toBe(hashResetToken(token))
    expect(JSON.stringify(rows)).not.toContain(token)
    expect(rows[0]!.expiresAt.getTime() - rows[0]!.createdAt.getTime()).toBeLessThanOrEqual(30 * 60_000 + 1000)

    const done = await reset(token, 'NovaSenha456!')
    expect(done.status).toBe(200)
    expect(logged.join('\n')).not.toContain(token)

    expect((await api.post('/api/v1/auth/login').send({ email: account.email, password: account.password })).status).toBe(401)
    expect((await api.post('/api/v1/auth/login').send({ email: account.email, password: 'NovaSenha456!' })).status).toBe(200)
    // Sessões antigas são encerradas.
    expect((await api.post('/api/v1/auth/refresh').send({ refreshToken: account.refreshToken })).status).toBe(401)

    const reused = await reset(token, 'OutraSenha789!')
    expect(reused.status).toBe(400)
    expect(reused.body.code).toBe('INVALID_RESET_TOKEN')
    account.password = 'NovaSenha456!'
  })

  it('recusa token expirado, inventado ou substituído por um pedido mais novo', async () => {
    await skipCooldown()
    let before = memoryOutbox.length
    await forgot(account.email)
    const older = tokenFromMail((await nextMail(before)).text)
    await skipCooldown()
    before = memoryOutbox.length
    await forgot(account.email)
    const newer = tokenFromMail((await nextMail(before)).text)

    expect((await reset(older, 'Substituida123!')).status).toBe(400)
    expect((await reset('x'.repeat(43), 'Inventada123!')).status).toBe(400)

    await testPrisma.passwordResetToken.updateMany({ where: { tokenHash: hashResetToken(newer) }, data: { expiresAt: new Date(Date.now() - 1000) } })
    const expired = await reset(newer, 'Expirada123!')
    expect(expired.status).toBe(400)
    expect(expired.body.error).toContain('expirado')
    expect((await api.post('/api/v1/auth/login').send({ email: account.email, password: account.password })).status).toBe(200)
  })

  it('consome o token só uma vez sob requisições simultâneas', async () => {
    const token = 'token-de-teste-concorrencia-'.padEnd(43, 'x')
    await testPrisma.passwordResetToken.create({ data: { userId: account.userId, tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + 600_000) } })
    const results = await Promise.all([reset(token, 'Paralela111!'), reset(token, 'Paralela222!')])
    expect(results.map((res) => res.status).sort()).toEqual([200, 400])
  })

  it('limita pedidos repetidos sem depender do Redis', async () => {
    const res = await forgot(account.email)
    expect(res.status).toBe(429)
    expect(res.body.code).toBe('RATE_LIMIT_EXCEEDED')
  })
})
