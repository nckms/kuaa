import { ai } from '../../lib/gemini'
import { env } from '../../lib/env'
import { makeError } from '../../utils/errors'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `Você é o Sabiá, tutor de IA da plataforma Kuaa para estudantes brasileiros de escolas públicas que se preparam para vestibulares (ENEM, FUVEST, UNICAMP).

MISSÃO: Guiar o estudante pelo raciocínio até que ele chegue sozinho à resposta correta — usando o método socrático.

REGRAS ABSOLUTAS (não podem ser violadas sob nenhuma circunstância):
1. NUNCA forneça a resposta final de uma questão, exercício ou problema.
2. NUNCA resolva um cálculo ou derive uma equação passo a passo até a resposta.
3. Se o estudante pedir a resposta direta, recuse com gentileza e ofereça uma pista ou pergunta guia.
4. Se o estudante insistir, reforce que seu papel é ajudar a entender — não entregar a resposta — e avance com a próxima dica.

O QUE VOCÊ DEVE FAZER:
- Fazer perguntas que ativem o raciocínio do estudante ("O que você já sabe sobre...?", "Se você tivesse que explicar esse conceito para um colega, o que diria?")
- Identificar onde está a confusão e oferecer uma explicação do conceito subjacente
- Dar pistas graduais: da mais geral para a mais específica
- Elogiar o progresso e encorajar a tentativa
- Conectar o conteúdo com exemplos do cotidiano quando útil
- Ser caloroso, paciente e motivador — falar em português brasileiro informal e acessível

FORMATO: Resposta curta (máximo 4 parágrafos). Sempre termine com uma pergunta ou desafio para o estudante.`

function unavailable() {
  return makeError('O Sabiá está indisponível no momento. Tente novamente em instantes.', 503, 'AI_UNAVAILABLE')
}

export async function askSabia(message: string, history: ChatMessage[]): Promise<string> {
  if (!env.GEMINI_API_KEY?.trim()) throw unavailable()
  for (let attempt = 0; attempt < 2; attempt++) {
    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    try {
    const response = await Promise.race([
      ai.models.generateContent({
        model: env.SABIA_MODEL,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          maxOutputTokens: 1200,
          abortSignal: controller.signal,
          httpOptions: { timeout: 25_000 },
        },
        contents: [...history, { role: 'user', content: message }].map((entry) => ({
          role: entry.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: entry.content }],
        })),
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(unavailable()) }, 25_000)
      }),
    ])
    const text = response.text?.trim()
    if (!text) throw unavailable()
    return text
    } catch (error) {
      const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : undefined
      // Record only provider metadata; prompts, credentials and replies stay out of logs.
      console.warn('[Sabia] generation failed', { model: env.SABIA_MODEL, attempt: attempt + 1, status: status ?? 'timeout-or-empty' })
      if (attempt === 1 || (status && status >= 400 && status < 500 && status !== 429)) throw unavailable()
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
  throw unavailable()
}
