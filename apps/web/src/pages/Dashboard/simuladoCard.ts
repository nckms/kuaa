import type { SimuladoAttempt } from '../../types/simulado'

export type SimuladoCardState = {
  kind: 'loading' | 'error' | 'available' | 'in_progress' | 'finished'
  badge: string
  title: string
  detail?: string
  cta?: string
}

/**
 * Estado do cartão do simulado semanal no painel. Carregamento e falha nunca
 * aparecem como "Disponível". A API devolve apenas a tentativa da semana
 * corrente (domingo 00:00 UTC), então na virada da semana o cartão volta a
 * "Disponível" sem lógica extra no cliente.
 */
export function simuladoCardState(query: {
  data?: SimuladoAttempt | null
  isLoading: boolean
  isError: boolean
}): SimuladoCardState {
  if (query.isLoading) return { kind: 'loading', badge: 'Carregando', title: 'Verificando seu simulado da semana…' }
  if (query.isError) return { kind: 'error', badge: 'Indisponível', title: 'Não foi possível consultar o simulado.' }
  const attempt = query.data
  if (!attempt) return { kind: 'available', badge: 'Disponível', title: 'Até 45 questões · 90 min', cta: 'Fazer agora' }
  if (!attempt.finishedAt) {
    const answered = Object.keys(attempt.answers ?? {}).length
    return {
      kind: 'in_progress', badge: 'Em andamento', title: `${answered} de ${attempt.questions.length} respondidas`,
      cta: 'Continuar',
    }
  }
  const correct = attempt.correct ?? 0
  const wrong = attempt.wrong ?? 0
  const blank = Math.max(0, attempt.questions.length - correct - wrong)
  return {
    kind: 'finished', badge: 'Entregue', title: attempt.score != null ? `${attempt.score} pontos` : 'Simulado entregue',
    detail: `${correct} ${correct === 1 ? 'acerto' : 'acertos'} · ${wrong} ${wrong === 1 ? 'erro' : 'erros'} · ${blank} em branco`, cta: 'Ver resultado',
  }
}
