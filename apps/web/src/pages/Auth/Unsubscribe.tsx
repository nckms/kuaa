import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import AuthShell from './AuthShell'

function readToken(): string {
  return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') ?? ''
}

/** Descadastro do e-mail semanal pelo link do e-mail, sem precisar entrar. */
export default function Unsubscribe() {
  const [token] = useState(readToken)
  const [state, setState] = useState<'working' | 'done' | 'error'>(token ? 'working' : 'error')

  useEffect(() => {
    if (!token) return
    window.history.replaceState(null, '', window.location.pathname)
    let active = true
    api.post('/users/unsubscribe', { token })
      .then(() => { if (active) setState('done') })
      .catch(() => { if (active) setState('error') })
    return () => { active = false }
  }, [token])

  return (
    <AuthShell asideTitle="E-mail semanal" asideText="Um lembrete por semana com o próximo tópico da sua trilha. Você decide se quer receber." title={state === 'done' ? 'Pronto, e-mail desligado' : state === 'error' ? 'Link inválido' : 'Desligando e-mail…'}>
      <p role="status" style={{ margin: 0 }}>
        {state === 'done' && 'Você não vai mais receber o e-mail semanal do Kuaa. Dá para religar quando quiser em Configurações.'}
        {state === 'error' && 'Este link de descadastro não é válido. Você também pode desligar o e-mail em Configurações, depois de entrar.'}
        {state === 'working' && 'Só um instante.'}
      </p>
      <p style={{ marginTop: 16 }}><Link to="/entrar">Entrar no Kuaa</Link></p>
    </AuthShell>
  )
}
