import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))
import { ai } from '../lib/gemini'
import { env } from '../lib/env'
import { aiModel, generate } from '../lib/ai'

const call = vi.mocked(ai.models.generateContent)
type R = Awaited<ReturnType<typeof ai.models.generateContent>>
beforeEach(() => { call.mockReset(); call.mockResolvedValue({ text: 'ok' } as R) })

describe('camada única de IA', () => {
  it('texto simples vai como string, sem config quando não há opções', async () => {
    expect(await generate({ task: 'bulk', input: 'Explique.' })).toBe('ok')
    expect(call).toHaveBeenCalledWith({ model: env.GEMINI_MODEL, contents: 'Explique.' })
  })

  it('mensagens com imagem, sistema, JSON e limites viram o pedido do provedor', async () => {
    const signal = new AbortController().signal
    await generate({
      task: 'chat', system: 'Você é o Sabiá.', json: true, maxOutputTokens: 500, timeoutMs: 9000, signal,
      input: [{ role: 'user', text: 'Oi' }, { role: 'assistant', text: 'Olá!' }, { role: 'user', text: 'Veja', images: [{ mimeType: 'image/webp', data: 'AAA' }] }],
    })
    expect(call).toHaveBeenCalledWith({
      model: env.SABIA_MODEL,
      config: { systemInstruction: 'Você é o Sabiá.', responseMimeType: 'application/json', maxOutputTokens: 500, abortSignal: signal, httpOptions: { timeout: 9000 } },
      contents: [
        { role: 'user', parts: [{ text: 'Oi' }] },
        { role: 'model', parts: [{ text: 'Olá!' }] },
        { role: 'user', parts: [{ inlineData: { mimeType: 'image/webp', data: 'AAA' } }, { text: 'Veja' }] },
      ],
    })
  })

  it('resposta vazia vira texto vazio; erro do provedor sobe como está', async () => {
    call.mockResolvedValueOnce({ text: undefined } as R)
    expect(await generate({ task: 'chat', input: 'x' })).toBe('')
    call.mockRejectedValueOnce(Object.assign(new Error('quota'), { status: 429 }))
    await expect(generate({ task: 'chat', input: 'x' })).rejects.toMatchObject({ status: 429 })
    expect(aiModel('chat')).toBe(env.SABIA_MODEL)
  })
})
