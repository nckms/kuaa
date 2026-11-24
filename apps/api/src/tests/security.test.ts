import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { hashRefreshToken, ROTATION_GRACE_MS } from '../modules/auth/auth.service'
import { errorHandler } from '../middleware/errorHandler'
import { createAuthRateLimit } from '../middleware/authRateLimit'
import { redis } from '../lib/redis'
import { makeError } from '../utils/errors'
import { prisma } from '../lib/prisma'

beforeEach(async () => { await truncateUserData() })

describe('security compatibility', () => {
  it('stores only refresh hashes, rejects hashes as credentials and revokes on logout', async () => {
    const account = await registerAndLogin('hash')
    const row = await testPrisma.refreshToken.findFirstOrThrow({ where: { userId: account.userId } })
    expect(row.token).toBe(hashRefreshToken(account.refreshToken))
    expect(row.token).not.toContain(account.refreshToken)
    expect((await api.post('/api/v1/auth/refresh').send({ refreshToken: row.token })).status).toBe(400)
    // Old frontend does not request rotation and can keep using its existing token.
    for (let i = 0; i < 2; i++) {
      expect((await api.post('/api/v1/auth/refresh').send({ refreshToken: account.refreshToken })).status).toBe(200)
    }
    expect((await api.delete('/api/v1/auth/logout').send({ refreshToken: account.refreshToken })).status).toBe(204)
    expect((await api.post('/api/v1/auth/refresh').send({ refreshToken: account.refreshToken })).status).toBe(401)
  })

  it('upgrades an existing plaintext session without losing the session', async () => {
    const account = await registerAndLogin('legacy')
    await testPrisma.refreshToken.create({ data: {
      userId: account.userId, token: 'legacy-session', expiresAt: new Date(Date.now() + 60_000),
    } })
    expect((await api.post('/api/v1/auth/refresh').send({ refreshToken: 'legacy-session' })).status).toBe(200)
    expect(await testPrisma.refreshToken.findUnique({ where: { token: 'legacy-session' } })).toBeNull()
    expect(await testPrisma.refreshToken.findUnique({ where: { token: hashRefreshToken('legacy-session') } })).not.toBeNull()
  })

  it('rotation tolerates a lost response for a short grace window, then the old token stops working', async () => {
    const account = await registerAndLogin('rotation')
    const responses = await Promise.all(Array.from({ length: 2 }, () =>
      api.post('/api/v1/auth/refresh').send({ refreshToken: account.refreshToken, rotate: true })))
    expect(responses.map((r) => r.status)).toEqual([200, 200])
    const replacement = responses[0].body.refreshToken
    expect(replacement).toBeTruthy()
    expect(replacement).not.toBe(account.refreshToken)
    const old = await testPrisma.refreshToken.findFirstOrThrow({ where: { token: hashRefreshToken(account.refreshToken) } })
    expect(old.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(ROTATION_GRACE_MS)
    // Simula o fim da janela.
    await testPrisma.refreshToken.update({ where: { id: old.id }, data: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await api.post('/api/v1/auth/refresh').send({ refreshToken: account.refreshToken, rotate: true })).status).toBe(401)
    expect((await api.post('/api/v1/auth/refresh').send({ refreshToken: replacement, rotate: true })).status).toBe(200)
  })

  it('limits login while Redis is unavailable; forwarded IP spoofing does not bypass it', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await api.post('/api/v1/auth/login').set('X-Forwarded-For', `192.0.2.${i + 1}`)
        .send({ email: 'absent@example.test', password: 'invalid' })
      expect(res.status).toBe(401)
    }
    expect((await api.post('/api/v1/auth/login').send({ email: 'absent@example.test', password: 'invalid' })).status).toBe(429)
  })

  it('keeps the local ceiling when the shared limiter throws', async () => {
    const status = vi.spyOn(redis, 'status', 'get')
    status.mockReturnValue('ready')
    const evalSpy = vi.spyOn(redis, 'eval').mockRejectedValue(new Error('disconnected'))
    try {
      const app = express()
      app.get('/', ...createAuthRateLimit('outage-test', 2, 60), (_req, res) => { res.sendStatus(200) })
      expect((await request(app).get('/')).status).toBe(200)
      expect((await request(app).get('/')).status).toBe(200)
      expect((await request(app).get('/')).status).toBe(429)
    } finally { status.mockRestore(); evalSpy.mockRestore() }
  })

  it('redacts unexpected exceptions, preserves deliberate service errors and sets request IDs', async () => {
    const app = express()
    app.get('/error', () => { throw new Error('postgresql://password@private/database') })
    app.get('/expected', () => { throw makeError('Servico temporariamente indisponivel', 503, 'AI_UNAVAILABLE') })
    app.use(errorHandler)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const response = await request(app).get('/error')
      expect(response.status).toBe(500)
      expect(JSON.stringify(response.body)).not.toContain('password')
      expect(JSON.stringify(log.mock.calls)).not.toContain('password')
      expect((await request(app).get('/expected')).body.code).toBe('AI_UNAVAILABLE')
      const health = await api.get('/api/v1/health')
      expect(health.headers['x-request-id']).toBeTruthy()
      expect(health.headers['cache-control']).toBe('no-store')
    } finally { log.mockRestore() }
  })

  it('reports database availability separately from process liveness', async () => {
    expect((await api.get('/api/v1/ready')).status).toBe(200)
    const db = vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Error('private database detail'))
    try {
      const response = await api.get('/api/v1/ready')
      expect(response.status).toBe(503)
      expect(response.body).toEqual({ status: 'unavailable', database: 'unavailable' })
      expect((await api.get('/api/v1/health')).status).toBe(200)
    } finally { db.mockRestore() }
  })
})
