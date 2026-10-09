import { beforeAll, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

let token: string

beforeAll(async () => {
  await truncateUserData()
  const vestibular = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  const own = await registerAndLogin('ranking_own')
  const other = await registerAndLogin('ranking_other')
  token = own.token
  for (const auth of [own, other]) {
    await testPrisma.enrollment.create({ data: { userId: auth.userId, vestibularId: vestibular.id } })
  }
  await testPrisma.user.update({ where: { id: other.userId }, data: {
    name: 'Nome Privado Terceiro', avatarUrl: 'https://example.com/private-photo.png', xp: 100,
  } })
})

describe('Comparativo anonimo', () => {
  it('nao retorna nome, foto ou identificador de outros estudantes', async () => {
    const res = await api.get('/api/v1/ranking/enem').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.entries).toHaveLength(2)
    for (const entry of res.body.entries) {
      expect(Object.keys(entry).sort()).toEqual(['displayName', 'level', 'rank', 'xp'])
      expect(entry.displayName).toBe(`Estudante ${entry.rank}`)
    }
    expect(JSON.stringify(res.body)).not.toContain('Nome Privado Terceiro')
    expect(JSON.stringify(res.body)).not.toContain('private-photo')
    expect(res.body.myRank.rank).toBe(2)
  })
})
