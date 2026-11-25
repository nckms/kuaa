import { describe, expect, it, vi } from 'vitest'
import { isTransientModelError, withModelFallback } from '../lib/gemini'

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
    expect(log).toHaveBeenCalledWith('principal', 'reserva-1')
  })

  it('erro de conteúdo não tenta outros modelos; todos sobrecarregados devolve o último erro', async () => {
    const bad = vi.fn(async () => { throw Object.assign(new Error('Invalid argument'), { status: 400 }) })
    await expect(withModelFallback(bad as unknown as Fn, ['r1'])({ model: 'p', contents: 'x' })).rejects.toThrow('Invalid argument')
    expect(bad).toHaveBeenCalledTimes(1)
    const busy = vi.fn(async () => { throw overloaded() })
    await expect(withModelFallback(busy as unknown as Fn, ['r1', 'r2'])({ model: 'p', contents: 'x' })).rejects.toMatchObject({ status: 503 })
    expect(busy).toHaveBeenCalledTimes(3)
  })
})
