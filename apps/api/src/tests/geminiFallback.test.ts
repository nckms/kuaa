import { describe, expect, it, vi } from 'vitest'
import { isTransientModelError, OVERLOAD_COOLDOWN_MS, QUOTA_COOLDOWN_MS, withModelFallback } from '../lib/gemini'

type Fn = Parameters<typeof withModelFallback>[0]
const overloaded = () => Object.assign(new Error('{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}'), { status: 503 })

describe('modelo reserva do Gemini', () => {
  it('reconhece sobrecarga, cota e modelo inexistente; não troca em erro de conteúdo ou cancelamento', () => {
    expect(isTransientModelError(overloaded())).toBe(true)
    expect(isTransientModelError(Object.assign(new Error('quota'), { status: 429 }))).toBe(true)
    expect(isTransientModelError(new Error('[GoogleGenerativeAI Error]: RESOURCE_EXHAUSTED'))).toBe(true)
    expect(isTransientModelError(Object.assign(new Error('models/x is not found'), { status: 404 }))).toBe(true)
    expect(isTransientModelError(Object.assign(new Error('Invalid JSON payload'), { status: 400 }))).toBe(false)
    expect(isTransientModelError(Object.assign(new Error('This operation was aborted'), { name: 'AbortError' }))).toBe(false)
  })

  it('503 no principal → responde pelo reserva e registra a troca', async () => {
    const calls: string[] = []
    const raw = vi.fn(async (p: { model: string }) => { calls.push(p.model); if (p.model === 'principal') throw overloaded(); return { text: `ok de ${p.model}` } })
    const log = vi.fn()
    const generate = withModelFallback(raw as unknown as Fn, ['reserva-1', 'reserva-2'], log)
    const res = await generate({ model: 'principal', contents: 'oi' })
    expect(res.text).toBe('ok de reserva-1')
    expect(calls).toEqual(['principal', 'reserva-1'])
    expect(log).toHaveBeenCalledWith('principal', 'reserva-1', '503')
  })

  it('erro de conteúdo não tenta outros modelos; todos sobrecarregados devolve o último erro', async () => {
    const bad = vi.fn(async () => { throw Object.assign(new Error('Invalid argument'), { status: 400 }) })
    await expect(withModelFallback(bad as unknown as Fn, ['r1'])({ model: 'p', contents: 'x' })).rejects.toThrow('Invalid argument')
    expect(bad).toHaveBeenCalledTimes(1)
    const busy = vi.fn(async () => { throw overloaded() })
    await expect(withModelFallback(busy as unknown as Fn, ['r1', 'r2'])({ model: 'p', contents: 'x' })).rejects.toMatchObject({ status: 503 })
    expect(busy).toHaveBeenCalledTimes(3)
  })

  it('cota esgotada: pula o modelo por 10 min; todos sem cota falha sem chamar o provedor; depois volta a tentar', async () => {
    let t = 0
    const quota = () => Object.assign(new Error('You exceeded your current quota'), { status: 429 })
    const calls: string[] = []
    const raw = vi.fn(async (p: { model: string }) => { calls.push(p.model); if (p.model === 'principal') throw quota(); return { text: p.model } })
    const generate = withModelFallback(raw as unknown as Fn, ['reserva'], () => undefined, () => t)
    expect((await generate({ model: 'principal', contents: 'x' })).text).toBe('reserva')
    expect((await generate({ model: 'principal', contents: 'x' })).text).toBe('reserva')
    expect(calls).toEqual(['principal', 'reserva', 'reserva'])
    t = QUOTA_COOLDOWN_MS + 1
    await generate({ model: 'principal', contents: 'x' })
    expect(calls.slice(3)).toEqual(['principal', 'reserva'])

    const none = vi.fn(async () => { throw quota() })
    const g2 = withModelFallback(none as unknown as Fn, ['r1'], () => undefined, () => 0)
    await expect(g2({ model: 'p', contents: 'x' })).rejects.toMatchObject({ status: 429 })
    expect(none).toHaveBeenCalledTimes(2)
    await expect(g2({ model: 'p', contents: 'x' })).rejects.toMatchObject({ status: 429 })
    expect(none).toHaveBeenCalledTimes(2)
  })

  it('sobrecarga (503): pula o principal por 1 minuto, registra o motivo uma vez e volta a tentar depois', async () => {
    let t = 0
    const calls: string[] = []
    const logs: string[] = []
    const busy = () => Object.assign(new Error('This model is currently experiencing high demand'), { status: 503 })
    const raw = vi.fn(async (p: { model: string }) => { calls.push(p.model); if (p.model === 'principal') throw busy(); return { text: p.model } })
    const generate = withModelFallback(raw as unknown as Fn, ['reserva'], (from, to, reason) => logs.push(`${from}>${to}:${reason}`), () => t)
    await generate({ model: 'principal', contents: 'x' })
    await generate({ model: 'principal', contents: 'x' })
    expect(calls).toEqual(['principal', 'reserva', 'reserva'])
    expect(logs).toEqual(['principal>reserva:503', 'principal>reserva:em pausa'])
    t = OVERLOAD_COOLDOWN_MS + 1
    await generate({ model: 'principal', contents: 'x' })
    expect(calls.slice(3)).toEqual(['principal', 'reserva'])
  })

  it('todos sobrecarregados: não falha sem tentar (diferente de cota esgotada)', async () => {
    const busy = vi.fn(async () => { throw Object.assign(new Error('overloaded'), { status: 503 }) })
    const g = withModelFallback(busy as unknown as Fn, ['r1'], () => undefined, () => 0)
    await expect(g({ model: 'p', contents: 'x' })).rejects.toMatchObject({ status: 503 })
    await expect(g({ model: 'p', contents: 'x' })).rejects.toMatchObject({ status: 503 })
    expect(busy).toHaveBeenCalledTimes(4)
  })
})
