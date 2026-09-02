import { ai } from '../../lib/gemini'
import { env } from '../../lib/env'

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

const FALLBACK_RESPONSES = [
  'Antes de eu te ajudar mais a fundo, me conta o que você já tentou ou já sabe sobre esse assunto? Às vezes a gente já tem a resposta mais perto do que imagina.',
  'Interessante! Para eu te guiar melhor, me diz: o que você já entende sobre esse tema? Qual parte está te deixando confuso?',
  'Boa pergunta! Para a gente começar, o que você acha que poderia ser um bom ponto de partida para pensar nisso? Não precisa ser a resposta certa — só o que vem à cabeça.',
]

function isGemini503(err: unknown): boolean {
  if (err instanceof Error) {
    return err.message.includes('503') || err.message.includes('UNAVAILABLE')
  }
  return false
}

export async function askSabia(message: string, history: ChatMessage[]): Promise<string> {
  const hasApiKey = !!env.GEMINI_API_KEY?.trim()
  if (!hasApiKey) return getFallback()

  // Monta o contexto completo: histórico + mensagem atual
  const historyContext =
    history.length > 0
      ? history.map((m) => `${m.role === 'user' ? 'Estudante' : 'Sabiá'}: ${m.content}`).join('\n') + '\n'
      : ''

  const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n${historyContext}Estudante: ${message}\nSabiá:`

  const MAX_ATTEMPTS = 3
  const RETRY_BACKOFF_MS = [500, 1000]

  const absoluteDeadline = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout absoluto (20s)')), 20_000),
  )

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: fullPrompt,
        }),
        absoluteDeadline,
      ])

      const text = response.text?.trim()
      if (!text) throw new Error('Gemini retornou resposta vazia')
      return text
    } catch (err) {
      const isTimeout =
        err instanceof Error && err.message.startsWith('Gemini timeout absoluto')
      const is503 = isGemini503(err)

      if (isTimeout) {
        console.warn('[Sabia] Gemini timeout, usando fallback')
        break
      }

      if (is503 && attempt < MAX_ATTEMPTS) {
        const wait = RETRY_BACKOFF_MS[attempt - 1] ?? 1000
        console.warn(`[Sabia] Gemini 503 (tentativa ${attempt}/${MAX_ATTEMPTS}), retry em ${wait}ms`)
        await new Promise<void>((r) => setTimeout(r, wait))
        continue
      }

      console.warn('[Sabia] Gemini falhou, usando fallback:', err instanceof Error ? err.message : err)
      break
    }
  }

  return getFallback()
}

function getFallback(): string {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]!
}
