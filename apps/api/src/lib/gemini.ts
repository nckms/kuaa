import { GoogleGenAI } from '@google/genai'
import { env } from './env'

export const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY ?? '',
})

type Generate = typeof ai.models.generateContent
type GenerateParams = Parameters<Generate>[0]

/** Erro passageiro do provedor (sobrecarga, cota, modelo indisponível): vale tentar outro modelo. */
export function isTransientModelError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const status = Number((error as { status?: unknown; code?: unknown }).status ?? (error as { code?: unknown }).code)
  if ([404, 429, 500, 503].includes(status)) return true
  const message = error instanceof Error ? error.message : ''
  if (/abort/i.test((error as { name?: string }).name ?? '') || /abort/i.test(message)) return false
  return /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|"code":\s*(429|503|500|404)|NOT_FOUND/i.test(message)
}

/** Cota esgotada (429 / RESOURCE_EXHAUSTED): não adianta insistir no mesmo modelo por alguns minutos. */
export function isQuotaError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const status = Number((error as { status?: unknown; code?: unknown }).status ?? (error as { code?: unknown }).code)
  const message = error instanceof Error ? error.message : ''
  return status === 429 || /RESOURCE_EXHAUSTED|"code":\s*429|exceeded your current quota/i.test(message)
}
export const QUOTA_COOLDOWN_MS = 10 * 60_000

/**
 * Envolve a chamada ao Gemini com modelos reserva: se o modelo pedido falhar
 * por sobrecarga/cota/indisponibilidade, tenta os da lista na ordem. Erros de
 * conteúdo (400) e cancelamentos por tempo não trocam de modelo.
 */
export function withModelFallback(generate: Generate, fallbacks: string[], log: (from: string, to: string) => void = () => undefined, now: () => number = Date.now): Generate {
  // Modelo com cota esgotada fica de fora por 10 min: sem isso, toda chamada perde 1–3 s
  // esperando o 429 do principal antes de ir para o reserva.
  const exhaustedUntil = new Map<string, { until: number; error: unknown }>()
  return (async (params: GenerateParams) => {
    const all = [params.model, ...fallbacks.filter((model) => model && model !== params.model)]
    const chain = all.filter((model) => (exhaustedUntil.get(model)?.until ?? 0) <= now())
    // Todos sem cota: falha na hora com o último erro, em vez de 3 idas ao provedor.
    if (!chain.length) throw exhaustedUntil.get(all[all.length - 1]!)!.error
    let lastError: unknown
    for (const model of chain) {
      try {
        const response = await generate({ ...params, model })
        if (model !== params.model) log(String(params.model), model)
        return response
      } catch (error) {
        lastError = error
        if (isQuotaError(error)) exhaustedUntil.set(model, { until: now() + QUOTA_COOLDOWN_MS, error })
        if (!isTransientModelError(error) || params.config?.abortSignal?.aborted) throw error
      }
    }
    throw lastError
  }) as Generate
}

const fallbackModels = env.GEMINI_FALLBACK_MODELS.split(',').map((model) => model.trim()).filter(Boolean)
if (fallbackModels.length) {
  ai.models.generateContent = withModelFallback(ai.models.generateContent.bind(ai.models), fallbackModels,
    (from, to) => console.warn(`[Gemini] ${from} indisponível; resposta veio do modelo reserva ${to}`))
}
