import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { truncateUserData, testPrisma } from './helpers/truncate'

beforeEach(async () => {
  await truncateUserData()
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

describe('POST /api/v1/auth/register', () => {
  it('retorna 201 com user e tokens ao registrar', async () => {
    const res = await api
      .post('/api/v1/auth/register')
      .send({ name: 'Ana Silva', email: 'ana@kuaa-test.com', password: 'Senha123!' })

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('ana@kuaa-test.com')
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('retorna 409 ao tentar registrar e-mail duplicado', async () => {
    await api
      .post('/api/v1/auth/register')
      .send({ name: 'Ana Silva', email: 'dup@kuaa-test.com', password: 'Senha123!' })

    const res = await api
      .post('/api/v1/auth/register')
      .send({ name: 'Outro Nome', email: 'dup@kuaa-test.com', password: 'Outra123!' })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('EMAIL_IN_USE')
  })
})

describe('POST /api/v1/auth/login', () => {
  it('retorna 200 com user e tokens ao logar com credenciais válidas', async () => {
    await api
      .post('/api/v1/auth/register')
      .send({ name: 'Bob', email: 'bob@kuaa-test.com', password: 'Senha123!' })

    const res = await api
      .post('/api/v1/auth/login')
      .send({ email: 'bob@kuaa-test.com', password: 'Senha123!' })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.user.email).toBe('bob@kuaa-test.com')
  })

  it('retorna 401 com senha incorreta', async () => {
    await api
      .post('/api/v1/auth/register')
      .send({ name: 'Bob', email: 'bob2@kuaa-test.com', password: 'Senha123!' })

    const res = await api
      .post('/api/v1/auth/login')
      .send({ email: 'bob2@kuaa-test.com', password: 'SenhaErrada!' })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
  })

  it('retorna 401 com e-mail inexistente', async () => {
    const res = await api
      .post('/api/v1/auth/login')
      .send({ email: 'ninguem@kuaa-test.com', password: 'Senha123!' })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
  })
})

describe('POST /api/v1/auth/refresh', () => {
  it('retorna 200 com novo accessToken com refresh token válido', async () => {
    const { refreshToken } = await registerAndLogin('refresh_ok')

    const res = await api
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
  })

  it('retorna 401 com refresh token inválido', async () => {
    const res = await api
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'token-inexistente-qualquer' })

    expect(res.status).toBe(401)
  })

  it('retorna 401 com refresh token expirado', async () => {
    const { userId } = await registerAndLogin('refresh_expired')

    // Criar token expirado diretamente no banco
    await testPrisma.refreshToken.create({
      data: {
        token: 'token-expirado-fake',
        userId,
        expiresAt: new Date(Date.now() - 1000), // já expirou
      },
    })

    const res = await api
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'token-expirado-fake' })

    expect(res.status).toBe(401)
  })
})
