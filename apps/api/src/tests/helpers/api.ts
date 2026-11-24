import request from 'supertest'
import { app } from '../../app'
import { authLimitStores } from '../../middleware/authRateLimit'

export const api = request(app)

export async function registerAndLogin(suffix: string = String(Date.now())) {
  // Account fixture setup must not consume the shared IP's authentication budget.
  for (const store of authLimitStores) await store.resetAll()
  const email = `test_${suffix}@kuaa-test.com`
  const password = 'Senha123!'

  const res = await api
    .post('/api/v1/auth/register')
    .send({ name: 'Usuário Teste', email, password })

  return {
    token: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
    userId: res.body.user?.id as string,
    email,
    password,
  }
}
