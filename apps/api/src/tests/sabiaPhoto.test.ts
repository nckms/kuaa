import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))
import { ai } from '../lib/gemini'
import { env } from '../lib/env'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { parsePhotoReply } from '../modules/sabia/sabia.photo'

const generate = vi.mocked(ai.models.generateContent)
type GenResponse = Awaited<ReturnType<typeof ai.models.generateContent>>
const originalKey = env.GEMINI_API_KEY
// PNG 1x1 válido.
const IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

beforeEach(async () => { await truncateUserData(); generate.mockReset(); env.GEMINI_API_KEY = 'mock-key' })
afterAll(async () => { env.GEMINI_API_KEY = originalKey; await testPrisma.$disconnect() })

async function user(suffix: string, plus: boolean) {
  const s = await registerAndLogin(suffix)
  if (plus) await testPrisma.user.update({ where: { id: s.userId }, data: { plan: 'PLUS', planExpiresAt: null } })
  return { ...s, auth: `Bearer ${s.token}` }
}

describe('foto de questão para o Sabiá (Plus)', () => {
  it('separa a transcrição da resposta e reconhece foto ilegível', () => {
    expect(parsePhotoReply('<questao>Quanto é 2+2?\nA) 3 B) 4</questao>\nQue operação aparece aqui?')).toEqual({ question: 'Quanto é 2+2?\nA) 3 B) 4', reply: 'Que operação aparece aqui?' })
    expect(parsePhotoReply('<questao>ILEGIVEL</questao> Manda outra foto?')).toEqual({ question: null, reply: 'Manda outra foto?' })
  })

  it('gratuito recebe 402 sem chamar a IA', async () => {
    const s = await user('photo_free', false)
    const res = await api.post('/api/v1/sabia/photo').set('Authorization', s.auth).send({ image: IMAGE })
    expect(res.status).toBe(402)
    expect(generate).not.toHaveBeenCalled()
  })

  it('Plus manda a foto, recebe a orientação e a conversa guarda só a transcrição', async () => {
    const s = await user('photo_plus', true)
    generate.mockResolvedValueOnce({ text: '<questao>Um carro faz 16 km/L. Quantos litros para 80 km?</questao>\nQue grandeza relaciona distância e consumo?' } as GenResponse)
    const res = await api.post('/api/v1/sabia/photo').set('Authorization', s.auth).send({ image: IMAGE, note: 'não entendi', conversationId: null })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ readable: true, reply: 'Que grandeza relaciona distância e consumo?' })
    const call = generate.mock.calls[0]![0] as { contents: Array<{ parts: Array<{ inlineData?: { mimeType: string } }> }> }
    expect(call.contents[0]!.parts[0]!.inlineData!.mimeType).toBe('image/png')
    const saved = await testPrisma.sabiaMessage.findMany({ where: { userId: s.userId }, orderBy: { createdAt: 'asc' } })
    expect(saved.map((m) => [m.role, m.kind])).toEqual([['user', 'photo'], ['assistant', 'text']])
    expect(saved[0]!.content).toContain('16 km/L')
    expect(saved[0]!.content).not.toContain('base64')

    // A conversa continua em texto com a transcrição no contexto.
    generate.mockResolvedValueOnce({ text: 'Boa! E quantos litros por km?' } as GenResponse)
    const follow = await api.post('/api/v1/sabia/ask').set('Authorization', s.auth).send({ message: 'distância?', conversationId: res.body.conversationId })
    expect(follow.status).toBe(200)
    const ctx = JSON.stringify((generate.mock.calls[1]![0] as { contents: unknown }).contents)
    expect(ctx).toContain('16 km/L')
  })

  it('rejeita formato que não é imagem', async () => {
    const s = await user('photo_bad', true)
    expect((await api.post('/api/v1/sabia/photo').set('Authorization', s.auth).send({ image: 'data:application/pdf;base64,AAAA' })).status).toBe(400)
  })
})
