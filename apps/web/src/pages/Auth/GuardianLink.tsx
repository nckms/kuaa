import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import AuthShell from './AuthShell'

function readHash() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const confirm = params.get('confirmar'); const leave = params.get('sair')
  return confirm ? { action: 'confirm' as const, token: confirm } : leave ? { action: 'leave' as const, token: leave } : null
}

/** Link do e-mail do responsável: confirmar o endereço ou parar de receber, sem conta no Kuaa. */
export default function GuardianLink() {
  const [link] = useState(readHash)
  const [state, setState] = useState<'working' | 'confirmed' | 'left' | 'error'>(link ? 'working' : 'error')
  const [student, setStudent] = useState('')
  const [unsubToken, setUnsubToken] = useState('')

  useEffect(() => {
    if (!link) return
    window.history.replaceState(null, '', window.location.pathname)
    let active = true
    const run = link.action === 'confirm'
      ? api.post<{ studentFirstName: string; unsubscribeToken: string }>('/guardian/confirm', { token: link.token })
        .then((r) => { if (active) { setStudent(r.data.studentFirstName); setUnsubToken(r.data.unsubscribeToken); setState('confirmed') } })
      : api.post('/guardian/unsubscribe', { token: link.token }).then(() => { if (active) setState('left') })
    run.catch(() => { if (active) setState('error') })
    return () => { active = false }
  }, [link])

  const leave = async () => {
    try { await api.post('/guardian/unsubscribe', { token: unsubToken }); setState('left') } catch { setState('error') }
  }

  const title = state === 'confirmed' ? 'E-mail confirmado' : state === 'left' ? 'Pronto, você não vai mais receber' : state === 'error' ? 'Link inválido ou expirado' : 'Só um instante…'
  return (
    <AuthShell asideTitle="Resumo para o responsável" asideText="Uma vez por mês: dias estudados, questões respondidas, acertos e erros por matéria. Nada além disso." title={title}>
      <div role="status">
        {state === 'confirmed' && <>
          <p style={{ margin: 0 }}>Todo dia 1 você vai receber neste e-mail o resumo do mês de {student} no Kuaa.</p>
          <p className="k-muted" style={{ fontSize: 14 }}>O resumo traz só números de estudo. As respostas, redações e conversas de {student} não são enviadas.</p>
          <button type="button" className="k-link-btn" onClick={() => void leave()}>Mudei de ideia, não quero receber</button>
        </>}
        {state === 'left' && <p style={{ margin: 0 }}>Este e-mail não recebe mais o resumo. O aluno pode cadastrar outro responsável quando quiser.</p>}
        {state === 'error' && <p style={{ margin: 0 }}>Peça ao aluno para cadastrar o seu e-mail de novo em Configurações, no Kuaa.</p>}
      </div>
    </AuthShell>
  )
}
