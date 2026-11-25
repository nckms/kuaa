import { useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

interface Preview {
  studentFirstName: string; periodLabel: string; daysStudied: number; questions: number; correct: number; wrong: number
  accuracy: number | null; bySubject: { subject: string; questions: number; accuracy: number }[]; examsFinished: number; reviewDue: number; reviewResolved: number
}
interface GuardianState { guardian: { email: string; status: 'pending' | 'confirmed' | 'unsubscribed' } | null; preview: Preview; mailConfigured: boolean }

const STATUS = { pending: 'Aguardando confirmação', confirmed: 'Recebendo o resumo', unsubscribed: 'Parou de receber' }
const apiError = (err: unknown) => (axios.isAxiosError(err) && typeof err.response?.data?.error === 'string' ? err.response.data.error : 'Não foi possível salvar. Tente de novo.')

/** Responsável: recebe por e-mail, todo dia 1, o resumo do mês. O aluno vê a prévia exata. */
export default function GuardianSection() {
  const qc = useQueryClient()
  const state = useQuery({ queryKey: ['guardian'], queryFn: async () => (await api.get<GuardianState>('/guardian')).data })
  const [email, setEmail] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const save = useMutation({
    mutationFn: async () => (await api.put('/guardian', { email })).data,
    onSuccess: () => { setEmail(''); void qc.invalidateQueries({ queryKey: ['guardian'] }) },
  })
  const remove = useMutation({ mutationFn: async () => { await api.delete('/guardian') }, onSuccess: () => void qc.invalidateQueries({ queryKey: ['guardian'] }) })
  const g = state.data?.guardian
  const p = state.data?.preview

  return (
    <section className="k-card is-md st-section" aria-labelledby="guardian-title">
      <h2 id="guardian-title" className="st-h2">Responsável</h2>
      <p className="k-muted" style={{ fontSize: 14, margin: '4px 0 12px' }}>
        Cadastre o e-mail do seu pai, mãe ou responsável. Depois que ele confirmar, recebe todo dia 1 um resumo do seu mês: dias estudados, questões, acertos e erros por matéria. Você pode remover quando quiser.
      </p>
      {g && (
        <div className="st-row" style={{ marginBottom: 12 }}>
          <div><strong style={{ fontSize: 15 }}>{g.email}</strong><div className="k-muted" style={{ fontSize: 13 }}>{STATUS[g.status]}</div></div>
          <button type="button" className="k-btn k-btn-outline is-sm" disabled={remove.isPending} onClick={() => remove.mutate()}>Remover</button>
        </div>
      )}
      <form className="st-row" style={{ gap: 8, flexWrap: 'wrap' }} onSubmit={(event) => { event.preventDefault(); if (email.trim()) save.mutate() }}>
        <input className="k-input" type="email" inputMode="email" autoComplete="off" placeholder="email.do.responsavel@exemplo.com" aria-label="E-mail do responsável"
          value={email} onChange={(event) => setEmail(event.target.value)} style={{ flex: '1 1 220px' }} />
        <button type="submit" className="k-btn k-btn-primary is-sm" disabled={save.isPending || !email.trim()}>{g ? 'Trocar' : 'Enviar convite'}</button>
      </form>
      {save.isError && <p role="alert" className="k-alert" style={{ marginTop: 8 }}>{apiError(save.error)}</p>}
      {save.isSuccess && <p role="status" className="k-muted" style={{ fontSize: 13, marginTop: 8 }}>
        {save.data?.confirmationSent ? 'Convite enviado. O resumo só começa depois que o responsável confirmar pelo e-mail.' : 'E-mail salvo. O convite sai assim que o envio de e-mails do Kuaa estiver ativo.'}
      </p>}
      {state.data && !state.data.mailConfigured && <p className="k-muted" style={{ fontSize: 13, marginTop: 8 }}>O envio de e-mails do Kuaa ainda está sendo configurado; os convites e resumos saem assim que estiver ativo.</p>}
      {p && (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="k-link-btn" aria-expanded={showPreview} onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? 'Esconder' : 'Ver'} exatamente o que o responsável recebe
          </button>
          {showPreview && (
            <div className="st-guardian-preview" role="region" aria-label="Prévia do resumo">
              <p><strong>Resumo de {p.periodLabel} (até hoje)</strong></p>
              <p>{p.questions ? `${p.studentFirstName} estudou em ${p.daysStudied} ${p.daysStudied === 1 ? 'dia' : 'dias'} e respondeu ${p.questions} questões, com ${p.accuracy}% de acerto (${p.correct} certas, ${p.wrong} erradas).` : `${p.studentFirstName} ainda não respondeu questões neste mês.`}</p>
              {p.examsFinished > 0 && <p>Fez {p.examsFinished} {p.examsFinished === 1 ? 'prova anterior completa' : 'provas anteriores completas'} do ENEM.</p>}
              {p.reviewResolved > 0 && <p>Dominou {p.reviewResolved} {p.reviewResolved === 1 ? 'questão' : 'questões'} que tinha errado antes.</p>}
              {p.reviewDue > 0 && <p>{p.reviewDue} {p.reviewDue === 1 ? 'questão errada espera' : 'questões erradas esperam'} revisão.</p>}
              {p.bySubject.length > 0 && <ul>{p.bySubject.map((s) => <li key={s.subject}>{s.subject}: {s.questions} questões, {s.accuracy}% de acerto</li>)}</ul>}
              <p className="k-muted" style={{ fontSize: 13 }}>Os números são do uso do Kuaa e não preveem a nota da prova. Nada além disso é enviado: nem suas respostas, nem suas redações, nem conversas com o Sabiá.</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
