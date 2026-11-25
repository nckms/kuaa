import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { env } from '../lib/env'

// PNG 1x1 válido.
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const pngBody = { fileBase64: `data:image/png;base64,${PNG}${'A'.repeat(0)}`, consent: true }
let admin: Awaited<ReturnType<typeof registerAndLogin>>
const original = env.ADMIN_USER_IDS

beforeEach(async () => {
  await truncateUserData()
  admin = await registerAndLogin('admin_reviewer')
  env.ADMIN_USER_IDS = admin.userId
})
beforeAll(() => { /* env ajustado por teste */ })
afterAll(() => { env.ADMIN_USER_IDS = original })

describe('meia para estudante (documento + análise)', () => {
  it('aceita imagem real, recusa arquivo que não é imagem/PDF e exige consentimento', async () => {
    const s = await registerAndLogin('student_upload')
    const fake = Buffer.from('<script>alert(1)</script>'.repeat(10)).toString('base64')
    expect((await api.post('/api/v1/students/verification').set('Authorization', `Bearer ${s.token}`).send({ fileBase64: fake, consent: true })).status).toBe(400)
    expect((await api.post('/api/v1/students/verification').set('Authorization', `Bearer ${s.token}`).send({ fileBase64: pngBody.fileBase64 })).status).toBe(400)
    const ok = await api.post('/api/v1/students/verification').set('Authorization', `Bearer ${s.token}`).send(pngBody)
    expect(ok.status).toBe(201)
    const me = await api.get('/api/v1/students/verification').set('Authorization', `Bearer ${s.token}`)
    expect(me.body).toMatchObject({ eligible: false, last: { status: 'PENDING' } })
  })

  it('só admin lista e vê documentos; aprovar libera a meia por 12 meses e APAGA a imagem', async () => {
    const s = await registerAndLogin('student_review')
    await api.post('/api/v1/students/verification').set('Authorization', `Bearer ${s.token}`).send(pngBody)
    expect((await api.get('/api/v1/admin/student-verifications').set('Authorization', `Bearer ${s.token}`)).status).toBe(403)
    const list = await api.get('/api/v1/admin/student-verifications').set('Authorization', `Bearer ${admin.token}`)
    expect(list.body).toHaveLength(1)
    expect(list.body[0]).not.toHaveProperty('documentData')
    const id = list.body[0].id
    const doc = await api.get(`/api/v1/admin/student-verifications/${id}/document`).set('Authorization', `Bearer ${admin.token}`)
    expect(doc.status).toBe(200)
    expect(doc.headers['content-type']).toBe('image/png')
    expect((await api.post(`/api/v1/admin/student-verifications/${id}/review`).set('Authorization', `Bearer ${admin.token}`).send({ approve: true })).status).toBe(200)
    const row = await testPrisma.studentVerification.findUniqueOrThrow({ where: { id } })
    expect(row.documentData).toBeNull()
    expect(row.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 360 * 86_400_000)
    expect((await api.get(`/api/v1/admin/student-verifications/${id}/document`).set('Authorization', `Bearer ${admin.token}`)).status).toBe(404)
    expect((await api.get('/api/v1/students/verification').set('Authorization', `Bearer ${s.token}`)).body.eligible).toBe(true)
    // Revisar de novo não muda nada.
    expect((await api.post(`/api/v1/admin/student-verifications/${id}/review`).set('Authorization', `Bearer ${admin.token}`).send({ approve: false })).status).toBe(409)
  })

  it('recusa apaga a imagem e informa o motivo; reenviar substitui o pedido pendente', async () => {
    const s = await registerAndLogin('student_reject')
    await api.post('/api/v1/students/verification').set('Authorization', `Bearer ${s.token}`).send(pngBody)
    await api.post('/api/v1/students/verification').set('Authorization', `Bearer ${s.token}`).send(pngBody)
    expect(await testPrisma.studentVerification.count({ where: { userId: s.userId, status: 'PENDING' } })).toBe(1)
    expect(await testPrisma.studentVerification.count({ where: { userId: s.userId, documentData: { not: null } } })).toBe(1)
    const [item] = (await api.get('/api/v1/admin/student-verifications').set('Authorization', `Bearer ${admin.token}`)).body
    await api.post(`/api/v1/admin/student-verifications/${item.id}/review`).set('Authorization', `Bearer ${admin.token}`).send({ approve: false, reason: 'Declaração de 2023.' })
    const me = await api.get('/api/v1/students/verification').set('Authorization', `Bearer ${s.token}`)
    expect(me.body).toMatchObject({ eligible: false, last: { status: 'REJECTED', rejectReason: 'Declaração de 2023.' } })
    expect(await testPrisma.studentVerification.count({ where: { documentData: { not: null } } })).toBe(0)
  })

  it('pedidos sem análise há mais de 30 dias têm a imagem apagada', async () => {
    const s = await registerAndLogin('student_stale')
    await testPrisma.studentVerification.create({ data: { userId: s.userId, status: 'PENDING', documentData: Buffer.from(PNG, 'base64'), documentMime: 'image/png', submittedAt: new Date(Date.now() - 31 * 86_400_000) } })
    await api.get('/api/v1/admin/student-verifications').set('Authorization', `Bearer ${admin.token}`)
    const row = await testPrisma.studentVerification.findFirstOrThrow({ where: { userId: s.userId } })
    expect(row.status).toBe('EXPIRED')
    expect(row.documentData).toBeNull()
  })
})
