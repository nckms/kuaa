import { beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { hashRefreshToken } from '../modules/auth/auth.service'

const ORIGIN = 'http://localhost:5173'
const WEB = { 'X-Kuaa-Client': 'web', Origin: ORIGIN }

beforeEach(async () => { await truncateUserData() })

function sessionCookie(res: { headers: Record<string, unknown> }): string | undefined {
  const raw = res.headers['set-cookie']
  const list = Array.isArray(raw) ? raw as string[] : raw ? [String(raw)] : []
  return list.find((cookie) => cookie.startsWith('kuaa_session='))
}
const cookiePair = (setCookie: string) => setCookie.split(';')[0]

async function webLogin(suffix: string) {
  const account = await registerAndLogin(suffix)
  const res = await api.post('/api/v1/auth/login').set(WEB).send({ email: account.email, password: account.password })
  return { account, res, cookie: sessionCookie(res)! }
}

describe('sessão do navegador (cookie HttpOnly via proxy same-origin)', () => {
  it('login web devolve user e accessToken, sem refreshToken no JSON, e grava cookie HttpOnly restrito a /api/v1/auth', async () => {
    const { res, cookie } = await webLogin('weblogin')
    expect(res.status).toBe(200)
    expect(res.body.user?.id).toBeTruthy()
    expect(typeof res.body.accessToken).toBe('string')
    expect(res.body).not.toHaveProperty('refreshToken')
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=Lax/i)
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/i)
    const stored = await testPrisma.refreshToken.findMany({ where: { userId: res.body.user.id } })
    for (const row of stored) expect(row.token.startsWith('sha256:')).toBe(true)
  })

  it('cadastro web também usa o cookie e não expõe o refresh token', async () => {
    const res = await api.post('/api/v1/auth/register').set(WEB)
      .send({ name: 'Aluno Web', email: 'cadastro_web@kuaa-test.com', password: 'Senha123!' })
    expect(res.status).toBe(201)
    expect(res.body).not.toHaveProperty('refreshToken')
    expect(sessionCookie(res)).toMatch(/HttpOnly/i)
  })

  it('renovação pelo cookie rotaciona: o cookie novo funciona e o antigo deixa de valer depois da janela', async () => {
    const { cookie } = await webLogin('rotate')
    const first = await api.post('/api/v1/auth/refresh').set(WEB).set('Cookie', cookiePair(cookie)).send({})
    expect(first.status).toBe(200)
    expect(typeof first.body.accessToken).toBe('string')
    expect(first.body).not.toHaveProperty('refreshToken')
    const next = sessionCookie(first)!
    expect(cookiePair(next)).not.toBe(cookiePair(cookie))
    await testPrisma.refreshToken.updateMany({ where: { expiresAt: { lt: new Date(Date.now() + 60_000) } }, data: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await api.post('/api/v1/auth/refresh').set(WEB).set('Cookie', cookiePair(cookie)).send({})).status).toBe(401)
    expect((await api.post('/api/v1/auth/refresh').set(WEB).set('Cookie', cookiePair(next)).send({})).status).toBe(200)
  })

  it('origem não autorizada ou ausente não cria nem renova sessão por cookie', async () => {
    const { account, cookie } = await webLogin('origin')
    const evil = await api.post('/api/v1/auth/login').set({ 'X-Kuaa-Client': 'web', Origin: 'https://kuaa-web.vercel.app.evil.test' })
      .send({ email: account.email, password: account.password })
    expect(evil.status).toBe(403)
    expect(sessionCookie(evil)).toBeUndefined()
    const noOrigin = await api.post('/api/v1/auth/refresh').set('X-Kuaa-Client', 'web').set('Cookie', cookiePair(cookie)).send({})
    expect(noOrigin.status).toBe(403)
    expect(sessionCookie(noOrigin)).toBeUndefined()
    // Sem o cabeçalho web, o cookie é ignorado: o contrato mobile exige o token no corpo.
    expect((await api.post('/api/v1/auth/refresh').set('Cookie', cookiePair(cookie)).send({})).status).toBe(400)
  })

  it('token legado do localStorage migra para o cookie na primeira renovação e não pode ser reusado', async () => {
    const account = await registerAndLogin('legacyweb')
    const res = await api.post('/api/v1/auth/refresh').set(WEB).send({ refreshToken: account.refreshToken })
    expect(res.status).toBe(200)
    expect(sessionCookie(res)).toMatch(/HttpOnly/i)
    const old = await testPrisma.refreshToken.findFirstOrThrow({ where: { token: hashRefreshToken(account.refreshToken) } })
    expect(old.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 30_000)
    await testPrisma.refreshToken.update({ where: { id: old.id }, data: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await api.post('/api/v1/auth/refresh').send({ refreshToken: account.refreshToken })).status).toBe(401)
  })

  it('logout web invalida a sessão no banco e expira o cookie', async () => {
    const { cookie, res: login } = await webLogin('logout')
    const out = await api.delete('/api/v1/auth/logout').set(WEB).set('Cookie', cookiePair(cookie))
    expect(out.status).toBe(204)
    expect(sessionCookie(out)).toMatch(/Expires=Thu, 01 Jan 1970/i)
    expect(await testPrisma.refreshToken.count({ where: { userId: login.body.user.id } })).toBe(1) // só o do cadastro (fixture)
    expect((await api.post('/api/v1/auth/refresh').set(WEB).set('Cookie', cookiePair(cookie)).send({})).status).toBe(401)
  })

  it('contrato mobile (Bearer) continua igual: refreshToken no JSON e sem cookie', async () => {
    const account = await registerAndLogin('mobile')
    const res = await api.post('/api/v1/auth/login').send({ email: account.email, password: account.password })
    expect(res.status).toBe(200)
    expect(typeof res.body.refreshToken).toBe('string')
    expect(sessionCookie(res)).toBeUndefined()
    const rotated = await api.post('/api/v1/auth/refresh').send({ refreshToken: res.body.refreshToken, rotate: true })
    expect(rotated.status).toBe(200)
    expect(typeof rotated.body.refreshToken).toBe('string')
  })

  it('atrás de um proxy (mesmo IP para todos), o limite de login é por conta, não do site inteiro', async () => {
    for (let i = 0; i < 10; i++) {
      await api.post('/api/v1/auth/login').send({ email: 'alvo@kuaa-test.com', password: 'errada' })
    }
    expect((await api.post('/api/v1/auth/login').send({ email: 'alvo@kuaa-test.com', password: 'errada' })).status).toBe(429)
    expect((await api.post('/api/v1/auth/login').send({ email: 'outro@kuaa-test.com', password: 'errada' })).status).toBe(401)
  })
})
