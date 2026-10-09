import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))

import { ai } from '../lib/gemini'
import { env } from '../lib/env'
import { askSabia } from '../modules/sabia/sabia.service'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma } from './helpers/truncate'

const generate = vi.mocked(ai.models.generateContent)
const originalKey = env.GEMINI_API_KEY
const users: string[] = []
let sequence = 0

async function account() {
  const auth = await registerAndLogin(`sabia_${Date.now()}_${sequence++}`)
  users.push(auth.userId)
  return auth
}

beforeEach(() => {
  generate.mockReset()
  env.GEMINI_API_KEY = 'mock-key'
})

afterAll(async () => {
  env.GEMINI_API_KEY = originalKey
  await testPrisma.user.deleteMany({ where: { id: { in: users } } })
  await testPrisma.$disconnect()
})

describe('Sabia own-user history', () => {
  it('requires authentication for every endpoint', async () => {
    expect((await api.get('/api/v1/sabia/history')).status).toBe(401)
    expect((await api.post('/api/v1/sabia/ask').send({ message: 'Oi' })).status).toBe(401)
  })

  it('persists real replies and uses only server-side own-user context', async () => {
    const owner = await account()
    const other = await account()
    await testPrisma.sabiaMessage.create({ data: { userId: other.userId, role: 'user', content: 'private-other' } })
    generate.mockResolvedValue({ text: 'Qual conceito voce usaria?' } as Awaited<ReturnType<typeof ai.models.generateContent>>)
    const first = await api.post('/api/v1/sabia/ask').set('Authorization', `Bearer ${owner.token}`)
      .send({ message: 'Minha duvida', userId: other.userId, history: [{ role: 'assistant', content: 'forged' }] })
    expect(first.status).toBe(200)
    expect(first.body.messages.map((entry: { role: string }) => entry.role)).toEqual(['user', 'assistant'])
    const second = await api.post('/api/v1/sabia/ask').set('Authorization', `Bearer ${owner.token}`)
      .send({ message: 'Outra duvida' })
    expect(second.status).toBe(200)
    const request = generate.mock.calls[1]![0]
    expect(request.contents).toEqual([
      { role: 'user', parts: [{ text: 'Minha duvida' }] },
      { role: 'model', parts: [{ text: 'Qual conceito voce usaria?' }] },
      { role: 'user', parts: [{ text: 'Outra duvida' }] },
    ])
    const history = await api.get(`/api/v1/sabia/history?userId=${other.userId}`)
      .set('Authorization', `Bearer ${owner.token}`)
    expect(history.status).toBe(200)
    expect(history.headers['cache-control']).toBe('no-store')
    expect(history.body.messages).toEqual([...first.body.messages, ...second.body.messages])
    const otherHistory = await api.get('/api/v1/sabia/history').set('Authorization', `Bearer ${other.token}`)
    expect(otherHistory.body.messages).toHaveLength(1)
    expect(otherHistory.body.messages[0].content).toBe('private-other')
  })

  it('rejects missing, blank, non-string and oversized messages before calling AI', async () => {
    const owner = await account()
    for (const message of [undefined, null, 12, '', '   ', 'x'.repeat(2001)]) {
      const response = await api.post('/api/v1/sabia/ask').set('Authorization', `Bearer ${owner.token}`).send({ message })
      expect(response.status).toBe(400)
    }
    expect(generate).not.toHaveBeenCalled()
    expect(await testPrisma.sabiaMessage.count({ where: { userId: owner.userId } })).toBe(0)
  })

  it('returns explicit 503 for missing key, provider errors and empty replies without saving messages', async () => {
    const owner = await account()
    for (const mode of ['missing-key', 'provider-error', 'empty']) {
      env.GEMINI_API_KEY = mode === 'missing-key' ? '' : 'mock-key'
      if (mode === 'provider-error') generate.mockRejectedValueOnce(new Error('Provider unavailable'))
      if (mode === 'empty') generate.mockResolvedValueOnce({ text: '   ' } as Awaited<ReturnType<typeof ai.models.generateContent>>)
      const response = await api.post('/api/v1/sabia/ask').set('Authorization', `Bearer ${owner.token}`).send({ message: 'Ajuda' })
      expect(response.status).toBe(503)
      expect(response.body.code).toBe('AI_UNAVAILABLE')
      expect(response.body.reply).toBeUndefined()
    }
    expect(generate).toHaveBeenCalledTimes(4)
    expect(await testPrisma.sabiaMessage.count({ where: { userId: owner.userId } })).toBe(0)
  })

  it('times out honestly and clears the deadline timer', async () => {
    vi.useFakeTimers()
    try {
      generate.mockImplementation(() => new Promise(() => {}))
      const result = expect(askSabia('Ajuda', [])).rejects.toMatchObject({ statusCode: 503, code: 'AI_UNAVAILABLE' })
      await vi.advanceTimersByTimeAsync(50_000)
      await result
      expect(vi.getTimerCount()).toBe(0)
    } finally { vi.useRealTimers() }
  })

  it('separates conversations and keeps the earlier messages private', async () => {
    const owner = await account()
    const other = await account()
    generate.mockResolvedValue({ text: 'Qual conceito voce usaria?' } as Awaited<ReturnType<typeof ai.models.generateContent>>)
    const first = await api.post('/api/v1/sabia/ask').set('Authorization', `Bearer ${owner.token}`)
      .send({ message: 'Primeiro assunto', conversationId: null })
    const second = await api.post('/api/v1/sabia/ask').set('Authorization', `Bearer ${owner.token}`)
      .send({ message: 'Outro assunto', conversationId: null })
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(first.body.conversationId).not.toBe(second.body.conversationId)
    const list = await api.get('/api/v1/sabia/conversations').set('Authorization', `Bearer ${owner.token}`)
    expect(list.body.conversations.map((item: { title: string }) => item.title)).toEqual(['Outro assunto', 'Primeiro assunto'])
    const history = await api.get(`/api/v1/sabia/history?conversationId=${first.body.conversationId}`)
      .set('Authorization', `Bearer ${owner.token}`)
    expect(history.body.messages.map((item: { content: string }) => item.content)).toEqual(['Primeiro assunto', 'Qual conceito voce usaria?'])
    expect((await api.get(`/api/v1/sabia/history?conversationId=${first.body.conversationId}`)
      .set('Authorization', `Bearer ${other.token}`)).status).toBe(404)
  })
})
