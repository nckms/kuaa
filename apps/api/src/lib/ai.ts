// Ponto único de acesso à IA. Os módulos descrevem o pedido (sistema, mensagens, imagens, JSON,
// limites) sem saber qual provedor responde. Hoje o adaptador é o Gemini (lib/gemini.ts, com os
// modelos reserva e o cooldown de cota); trocar de provedor é escrever outro adaptador aqui.
import { ai as gemini } from './gemini'
import { env } from './env'

/** chat: respostas ao aluno (Sabiá, correções). bulk: trabalho em lote (explicações, questões, classificação). */
export type AiTask = 'chat' | 'bulk'
export interface AiImage { mimeType: string; data: string } // base64
export interface AiMessage { role: 'user' | 'assistant'; text: string; images?: AiImage[] }
export interface AiRequest {
  task: AiTask
  system?: string
  /** Texto simples vira uma mensagem do usuário. */
  input: string | AiMessage[]
  /** Pede JSON (o chamador faz o parse e valida). */
  json?: boolean
  /** Esquema JSON da resposta, quando o provedor suporta. */
  jsonSchema?: object
  maxOutputTokens?: number
  timeoutMs?: number
  signal?: AbortSignal
}

/** Há chave configurada para o provedor atual. */
export function aiAvailable(): boolean {
  return Boolean(env.GEMINI_API_KEY?.trim())
}

/** Modelo usado para a tarefa (para logs; não mostrar ao aluno). */
export function aiModel(task: AiTask): string {
  return task === 'chat' ? env.SABIA_MODEL : env.GEMINI_MODEL
}

/** Gera a resposta e devolve o texto ('' se vier vazia). Erros do provedor sobem como estão. */
export async function generate(req: AiRequest): Promise<string> {
  const messages: AiMessage[] = typeof req.input === 'string' ? [{ role: 'user', text: req.input }] : req.input
  const plain = typeof req.input === 'string'
  const config: Record<string, unknown> = {}
  if (req.system) config.systemInstruction = req.system
  if (req.json) config.responseMimeType = 'application/json'
  if (req.jsonSchema) config.responseJsonSchema = req.jsonSchema
  if (req.maxOutputTokens) config.maxOutputTokens = req.maxOutputTokens
  if (req.signal) config.abortSignal = req.signal
  if (req.timeoutMs) config.httpOptions = { timeout: req.timeoutMs }
  const response = await gemini.models.generateContent({
    model: aiModel(req.task),
    ...(Object.keys(config).length ? { config } : {}),
    // Texto simples vai como string (igual a antes); com imagem ou histórico, como mensagens.
    contents: plain ? req.input as string : messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [...(m.images ?? []).map((inlineData) => ({ inlineData })), { text: m.text }],
    })),
  })
  return response.text ?? ''
}
