import { beforeEach, describe, expect, it } from 'vitest'
import { api } from './helpers/api'
import { authLimitStores } from '../middleware/authRateLimit'
import { testPrisma, truncateUserData } from './helpers/truncate'

beforeEach(async () => { await truncateUserData(); for (const store of authLimitStores) await store.resetAll() })
const register = (suffix: string, attribution?: unknown) => api.post('/api/v1/auth/register')
  .send({ name: 'Aluno Origem', email: `test_src_${suffix}@kuaa-test.com`, password: 'Senha123!', ...(attribution ? { attribution } : {}) })

describe('origem do cadastro (?ref / utm)', () => {
  it('guarda ref e utm normalizados', async () => {
    const res = await register('ok', { ref: 'Prof.Ana', utmSource: 'instagram', utmCampaign: 'enem_2027' })
    expect(res.status).toBe(201)
    const user = await testPrisma.user.findUniqueOrThrow({ where: { email: 'test_src_ok@kuaa-test.com' } })
    expect(user.signupSource).toEqual({ ref: 'prof.ana', utmSource: 'instagram', utmCampaign: 'enem_2027' })
    expect(res.body.user).not.toHaveProperty('signupSource')
  })
  it('origem inválida nunca impede o cadastro: só é descartada', async () => {
    const res = await register('bad', { ref: '<script>alert(1)</script>', email: 'x@y.z' })
    expect(res.status).toBe(201)
    const user = await testPrisma.user.findUniqueOrThrow({ where: { email: 'test_src_bad@kuaa-test.com' } })
    expect(user.signupSource).toBeNull()
  })
})
