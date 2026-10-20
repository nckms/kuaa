import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

beforeAll(truncateUserData)
afterAll(() => testPrisma.$disconnect())

describe('pratica de redacao', () => {
  it('guarda rascunho e autoavaliacao, envia uma vez e mantem historico privado', async () => {
    const first = await registerAndLogin('essay_first')
    const second = await registerAndLogin('essay_second')
    const authorization = `Bearer ${first.token}`
    const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
    expect((await api.get('/api/v1/essays/themes/enem')).status).toBe(401)
    expect((await api.get('/api/v1/essays/themes/enem').set('Authorization', authorization)).status).toBe(403)
    await api.post('/api/v1/enrollments').set('Authorization', authorization).send({ vestibularId: exam.id })
    const themes = await api.get('/api/v1/essays/themes/enem').set('Authorization', authorization)
    expect(themes.status).toBe(200)
    expect(themes.body.themes.length).toBeGreaterThan(0)
    const themeId = themes.body.themes[0].id
    const created = await api.post('/api/v1/essays').set('Authorization', authorization).send({ vestibularSlug: 'enem', themeId })
    expect(created.status).toBe(201)
    const id = created.body.id
    expect((await api.post(`/api/v1/essays/${id}/feedback`).set('Authorization', authorization).send({ aiConsent: true })).status).toBe(409)
    expect((await api.get(`/api/v1/essays/${id}`).set('Authorization', `Bearer ${second.token}`)).status).toBe(404)
    expect((await api.patch(`/api/v1/essays/${id}`).set('Authorization', `Bearer ${second.token}`).send({ body: 'Outro texto' })).status).toBe(404)
    expect((await api.post(`/api/v1/essays/${id}/submit`).set('Authorization', authorization)).status).toBe(400)
    const body = Array.from({ length: 40 }, (_, index) => `A leitura amplia oportunidades e exige políticas de acesso ${index + 1}.`).join(' ')
    const selfReview = { respondsToPrompt: true, argumentSupported: true, coherenceReviewed: false, finalReview: false }
    const saved = await api.patch(`/api/v1/essays/${id}`).set('Authorization', authorization).send({ body, selfReview })
    expect(saved.status).toBe(200)
    expect(saved.body.body).toBe(body)
    expect(saved.body.selfReview).toEqual(selfReview)
    const submitted = await api.post(`/api/v1/essays/${id}/submit`).set('Authorization', authorization)
    expect(submitted.status).toBe(200)
    expect(submitted.body.status).toBe('SUBMITTED')
    expect(submitted.body.submittedAt).toBeTruthy()
    expect((await api.post(`/api/v1/essays/${id}/submit`).set('Authorization', authorization)).body.submittedAt).toBe(submitted.body.submittedAt)
    expect((await api.patch(`/api/v1/essays/${id}`).set('Authorization', authorization).send({ body: 'Mudança tardia' })).status).toBe(409)
    expect((await api.post(`/api/v1/essays/${id}/feedback`).set('Authorization', authorization).send({})).status).toBe(400)
    expect((await api.post(`/api/v1/essays/${id}/feedback`).set('Authorization', `Bearer ${second.token}`).send({ aiConsent: true })).status).toBe(404)
    const unavailable = await api.post(`/api/v1/essays/${id}/feedback`).set('Authorization', authorization).send({ aiConsent: true })
    expect(unavailable.status).toBe(503)
    expect((await testPrisma.essayDraft.findUniqueOrThrow({ where: { id } })).aiConsentAt).toBeNull()
    const list = await api.get('/api/v1/essays?vestibularSlug=enem').set('Authorization', authorization)
    expect(list.body).toHaveLength(1)
    expect(list.body[0].wordCount).toBeGreaterThanOrEqual(40)
    expect(list.body[0].body).toBeUndefined()
    await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${second.token}`).send({ vestibularId: exam.id })
    expect((await api.get('/api/v1/essays?vestibularSlug=enem').set('Authorization', `Bearer ${second.token}`)).body).toEqual([])
  })

  it('rejeita proposta fora do vestibular escolhido', async () => {
    const auth = await registerAndLogin('essay_theme')
    const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'fuvest' } })
    await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${auth.token}`).send({ vestibularId: exam.id })
    const response = await api.post('/api/v1/essays').set('Authorization', `Bearer ${auth.token}`)
      .send({ vestibularSlug: 'fuvest', themeId: 'enem-acesso-leitura' })
    expect(response.status).toBe(404)
  })
})
