import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import './PlansPage.css'

const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim() || ''
export const PLUS_PRICE = 'R$ 99'
export const PLUS_UNTIL = '31/12/2027'

interface PlanSummary {
  plan: 'FREE' | 'PLUS'
  expiresAt: string | null
  quotas: Array<{ name: 'practice' | 'sabia' | 'essayFeedback'; period: 'day' | 'month'; limit: number; used: number }>
}
const QUOTA_LABEL = { practice: 'Práticas', sabia: 'Perguntas ao Sabiá', essayFeedback: 'Análises de redação' }

const ROWS: Array<[string, string, string]> = [
  ['Diagnóstico e trilha adaptativa', 'Incluído', 'Incluído'],
  ['Explicação de todo erro', 'Sempre', 'Sempre'],
  ['Simulado semanal', 'Incluído', 'Incluído'],
  ['Sessões de prática', '5 por dia', '40 por dia'],
  ['Perguntas ao Sabiá', '15 por dia', '100 por dia'],
  ['Análise de redação por IA', '2 por mês', '15 por mês'],
]

export default function PlansPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const email = useAuthStore((state) => state.user?.email)
  const [params] = useSearchParams()
  const purchase = params.get('compra')
  const [adult, setAdult] = useState(false)
  const config = useQuery({
    queryKey: ['billing', 'config'],
    queryFn: async () => (await api.get<{ enabled: boolean }>('/billing/config')).data,
  })
  const summary = useQuery({
    queryKey: ['user', 'plan'],
    queryFn: async () => (await api.get<PlanSummary>('/users/me/plan')).data,
    enabled: isAuthenticated,
    // Depois de pagar (Pix confirma em instantes), consulta até o Plus aparecer.
    refetchInterval: (query) => (purchase === 'ok' && query.state.data?.plan !== 'PLUS' ? 4000 : false),
  })
  const checkout = useMutation({
    mutationFn: async () => (await api.post<{ url: string }>('/billing/checkout', { adultConfirmed: true })).data,
    onSuccess: ({ url }) => { window.location.assign(url) },
  })
  const isPlus = summary.data?.plan === 'PLUS'
  const expires = summary.data?.expiresAt ? new Date(summary.data.expiresAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : null

  return (
    <div className="kp">
      <header className="kp-top">
        <Link to="/" className="kp-brand" aria-label="Kuaa, início"><img src="/brand/wordmark-w.png" alt="Kuaa" /></Link>
        {isAuthenticated ? <Link to="/dashboard" className="kp-login">Voltar ao painel</Link> : <Link to="/entrar" className="kp-login">Entrar</Link>}
      </header>

      <main className="kp-main">
        <h1>Planos</h1>
        <p className="kp-lead">O gratuito já tem o essencial para estudar: diagnóstico, trilha e explicação de todo erro. O Plus aumenta o volume de prática e de IA para quem estuda todo dia.</p>

        {purchase === 'ok' && !isPlus && <p className="kp-banner" role="status">Pagamento enviado. Assim que a confirmação chegar (no Pix leva poucos instantes), seu Plus aparece aqui.</p>}
        {purchase === 'ok' && isPlus && <p className="kp-banner is-ok" role="status">Tudo certo: seu Kuaa Plus está ativo.</p>}
        {purchase === 'cancelada' && <p className="kp-banner" role="status">O pagamento não foi concluído. Nada foi cobrado.</p>}

        {summary.data && (
          <section className="kp-current" aria-label="Seu plano">
            <p><strong>Seu plano: {isPlus ? 'Kuaa Plus' : 'Gratuito'}</strong>{isPlus && expires ? ` · válido até ${expires}` : ''}</p>
            <ul>
              {summary.data.quotas.map((quota) => (
                <li key={quota.name}>
                  <span>{QUOTA_LABEL[quota.name]} {quota.period === 'day' ? 'hoje' : 'neste mês'}</span>
                  <span className="kp-mono">{Math.min(quota.used, quota.limit)} de {quota.limit}</span>
                  <span className="kp-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (100 * quota.used) / quota.limit)}%` }} /></span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="kp-cards">
          <section className="kp-card" aria-labelledby="kp-free">
            <h2 id="kp-free">Gratuito</h2>
            <p className="kp-price">R$ 0</p>
            <p className="kp-note">Para sempre.</p>
            {!isAuthenticated && <Link to="/cadastro" className="kp-btn is-outline">Criar conta grátis</Link>}
          </section>
          <section className="kp-card is-plus" aria-labelledby="kp-plus">
            <h2 id="kp-plus">Kuaa Plus</h2>
            <p className="kp-price">{PLUS_PRICE} <small>à vista</small></p>
            <p className="kp-note">Acesso até {PLUS_UNTIL}. Pagamento único, sem renovação automática.</p>
            {isPlus ? <p className="kp-ok">Seu Plus está ativo.</p>
              : !config.data?.enabled ? <p className="kp-soon">A venda abre em breve.</p>
                : !isAuthenticated ? <Link to="/cadastro" className="kp-btn">Criar conta para assinar<i className="bi bi-arrow-right" aria-hidden="true" /></Link>
                  : <form className="kp-buy" onSubmit={(event) => { event.preventDefault(); if (adult) checkout.mutate() }}>
                    <label className="kp-check">
                      <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} />
                      <span>Sou maior de 18 anos ou responsável pelo estudante.</span>
                    </label>
                    <button type="submit" className="kp-btn" disabled={!adult || checkout.isPending}>
                      {checkout.isPending ? 'Abrindo pagamento…' : 'Pagar com Pix ou cartão'}<i className="bi bi-lock" aria-hidden="true" />
                    </button>
                    {checkout.isError && <p role="alert" className="kp-err">Não foi possível abrir o pagamento. Tente de novo em instantes.</p>}
                  </form>}
          </section>
        </div>

        <table className="kp-table">
          <caption className="kp-sr">Comparação entre os planos</caption>
          <thead><tr><th scope="col">O que você tem</th><th scope="col">Gratuito</th><th scope="col">Plus</th></tr></thead>
          <tbody>{ROWS.map(([label, free, plus]) => <tr key={label}><th scope="row">{label}</th><td>{free}</td><td>{plus}</td></tr>)}</tbody>
        </table>

        <section className="kp-faq" aria-labelledby="kp-faq-title">
          <h2 id="kp-faq-title">Antes de comprar</h2>
          <dl>
            <dt>Como o Plus é liberado?</dt>
            <dd>Automaticamente, na conta{isAuthenticated && email ? ` ${email}` : ' em que você estiver logado'}, assim que o pagamento é confirmado. No cartão é na hora; no Pix, poucos instantes depois de pagar. O pagamento é processado pela Stripe; o Kuaa não vê os dados do seu cartão.</dd>
            <dt>Quem pode comprar?</dt>
            <dd>Maiores de 18 anos ou o responsável pelo estudante.</dd>
            <dt>E se eu me arrepender?</dt>
            <dd>Você pode pedir o reembolso integral em até 7 dias após a compra.{SUPPORT_EMAIL && <> Escreva para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</>}</dd>
            <dt>O Kuaa garante aprovação?</dt>
            <dd>Não. O Kuaa organiza o que estudar e explica seus erros; o resultado depende do seu estudo.</dd>
          </dl>
        </section>
      </main>
    </div>
  )
}
