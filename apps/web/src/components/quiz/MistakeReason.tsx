import { useState } from 'react'
import { api } from '../../services/api'

const OPTIONS: Array<[string, string]> = [['conteudo', 'Não sabia o conteúdo'], ['leitura', 'Me confundi na leitura'], ['conta', 'Errei a conta'], ['duvida', 'Fiquei entre duas'], ['tempo', 'Chutei']]

/** Um toque para dizer por que errou: alimenta o Raio-X dos erros. Opcional. */
export default function MistakeReason({ sessionId, questionId }: { sessionId: string; questionId: string }) {
  const [chosen, setChosen] = useState<string | null>(null)
  const pick = (reason: string) => {
    setChosen(reason)
    api.patch(`/insights/answers/${sessionId}/${questionId}/reason`, { reason }).catch(() => setChosen(null))
  }
  return (
    <div className="qz-reason" role="group" aria-label="Por que você errou?">
      <span>Por que você errou?</span>
      {OPTIONS.map(([id, label]) => (
        <button key={id} type="button" aria-pressed={chosen === id} onClick={() => pick(id)}>{label}</button>
      ))}
    </div>
  )
}
