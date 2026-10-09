import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useEvaluation, type Evaluation } from '../../hooks/useEvaluation'
import { useAuthStore } from '../../stores/auth.store'

const questions = [
  'Eu gostaria de usar o Kuaa com frequencia.',
  'Achei o Kuaa desnecessariamente complexo.',
  'Achei o Kuaa facil de usar.',
  'Acho que precisaria de ajuda de uma pessoa com conhecimentos tecnicos para usar o Kuaa.',
  'Achei que as diferentes funcoes do Kuaa estavam bem integradas.',
  'Achei que havia muita inconsistencia no Kuaa.',
  'Imagino que a maioria das pessoas aprenderia a usar o Kuaa rapidamente.',
  'Achei o Kuaa muito complicado de usar.',
  'Senti confianca ao usar o Kuaa.',
  'Precisei aprender muitas coisas antes de conseguir usar o Kuaa.',
]
const choices = ['Discordo totalmente', 'Discordo', 'Nem concordo nem discordo', 'Concordo', 'Concordo totalmente']

function EvaluationForm({ initial }: { initial: Evaluation | null }) {
  const { save } = useEvaluation()
  const [answers, setAnswers] = useState<number[]>(initial?.answers ?? Array<number>(10).fill(0))
  const [feedback, setFeedback] = useState(initial?.feedback ?? '')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function changed() { setSaved(false); save.reset(); setError('') }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    if (!consent || answers.some((answer) => answer < 1 || answer > 5)) {
      setError('Responda aos dez itens e confirme o consentimento para enviar.')
      return
    }
    setError('')
    try {
      await save.mutateAsync({ answers, feedback, consent: true })
      setSaved(true)
      setConsent(false)
    } catch { setError('Nao foi possivel salvar. Suas respostas foram mantidas; tente novamente.') }
  }

  return <form onSubmit={submit}>
    <fieldset disabled={save.isPending} style={{ border: 0, padding: 0, minWidth: 0 }}>
      <legend className="visually-hidden">Questionario de usabilidade</legend>
      {questions.map((question, index) => <fieldset key={question} style={{ border: 0, borderBottom: '1px solid #bbb', padding: '20px 0', minWidth: 0 }}>
        <legend style={{ float: 'none', width: 'auto', fontSize: 16, fontWeight: 600 }}>{index + 1}. {question}</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px' }}>
          {choices.map((label, choice) => <label key={label} style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 44, cursor: 'pointer' }}>
            <input type="radio" name={`question-${index}`} value={choice + 1} required
              checked={answers[index] === choice + 1}
              onChange={() => { changed(); setAnswers((previous) => previous.map((answer, item) => item === index ? choice + 1 : answer)) }} />
            <span>{choice + 1} - {label}</span>
          </label>)}
        </div>
      </fieldset>)}
      <label htmlFor="evaluation-feedback" style={{ display: 'block', marginTop: 24 }}>Comentario opcional (ate 2.000 caracteres; nao inclua dados pessoais)</label>
      <textarea id="evaluation-feedback" rows={4} maxLength={2000} value={feedback}
        style={{ width: '100%', boxSizing: 'border-box', margin: '8px 0 20px' }}
        onChange={(event) => { changed(); setFeedback(event.target.value) }} />
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <input type="checkbox" required checked={consent} onChange={(event) => { changed(); setConsent(event.target.checked) }} />
        <span>Participo voluntariamente e concordo com o uso destas respostas na avaliacao de usabilidade do TCC, com divulgacao apenas agregada e sem identificacao. Sei que a resposta fica vinculada a minha conta e que posso sair sem enviar, sem prejuizo ao uso do Kuaa.</span>
      </label>
      <button type="submit" className="btn btn-primary">{save.isPending ? 'Salvando...' : initial ? 'Atualizar avaliacao' : 'Enviar avaliacao'}</button>
    </fieldset>
    {error && <p role="alert" style={{ marginTop: 16 }}>{error}</p>}
    {saved && <p role="status" style={{ marginTop: 16 }}>Avaliacao salva. Obrigado pela participacao.</p>}
  </form>
}

export default function EvaluationPage() {
  const userId = useAuthStore((state) => state.user?.id)
  const { query } = useEvaluation()
  return <AppLayout>
    <section style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 120px', overflowWrap: 'anywhere' }}>
      <Link to="/dashboard">Voltar ao painel</Link>
      <h1 style={{ fontSize: 28, marginTop: 20 }}>Avaliacao de usabilidade</h1>
      <p>Participacao voluntaria apos usar o Kuaa. Questionario adaptado em portugues a partir do SUS; nao e uma avaliacao da sua aprendizagem.</p>
      {!userId ? <p role="alert">Entre na sua conta para responder.</p> : query.isPending ? <p role="status">Carregando avaliacao...</p> : query.isError ? <div role="alert">
        <p>Nao foi possivel carregar sua avaliacao.</p>
        <button type="button" className="btn btn-secondary" onClick={() => void query.refetch()}>Tentar novamente</button>
      </div> : <>
        {query.data && <section aria-label="Sua pontuacao salva" style={{ padding: '16px 0', borderBottom: '1px solid #bbb' }}>
          <h2 style={{ fontSize: 20 }}>Sua pontuacao salva: {query.data.score.toLocaleString('pt-BR')} de 100</h2>
          <p>Indice SUS de usabilidade percebida, nao porcentagem de acertos nem nota de aprendizagem. Uma resposta individual nao representa todos os usuarios.</p>
          <p>Uma nova submissao substitui sua avaliacao anterior.</p>
        </section>}
        <EvaluationForm key={userId} initial={query.data ?? null} />
      </>}
    </section>
  </AppLayout>
}
