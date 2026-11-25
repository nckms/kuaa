import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import InterestButton from '../../components/InterestButton'
import './PlansPage.css'

const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim() || ''

interface PlanSummary {
  plan: 'FREE' | 'PLUS'
  expiresAt: string | null
  quotas: Array<{ name: 'practice' | 'sabia' | 'essayFeedback'; period: 'day' | 'month'; limit: number; used: number }>
}
interface BillingConfig { enabled: boolean; prices?: { full: number; student: number } }
interface MySubscription { status: string; priceKind: 'FULL' | 'STUDENT'; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean }
interface StudentStatus { eligible: boolean; last: { status: string; submittedAt: string; expiresAt: string | null; rejectReason: string | null } | null }

const QUOTA_LABEL = { practice: 'Práticas', sabia: 'Perguntas ao Sabiá', essayFeedback: 'Análises de redação' }
const ROWS: Array<[string, string, string]> = [
  ['Diagnóstico e trilha adaptativa', 'Incluído', 'Incluído'],
  ['Explicação de todo erro', 'Sempre', 'Sempre'],
  ['Simulado semanal', 'Incluído', 'Incluído'],
  ['Sessões de prática', '5 por dia', '40 por dia'],
  ['Perguntas ao Sabiá', '15 por dia', '100 por dia'],
  ['Análise de redação por IA', '2 por mês', '15 por mês'],
]
const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '')
const apiError = (err: unknown, fallback: string) =>
  (axios.isAxiosError(err) && typeof err.response?.data?.error === 'string' ? err.response.data.error : fallback)

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function PlansPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const purchase = params.get('compra')
  const [adult, setAdult] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)

  const config = useQuery({ queryKey: ['billing', 'config'], queryFn: async () => (await api.get<BillingConfig>('/billing/config')).data })
  const summary = useQuery({
    queryKey: ['user', 'plan'],
    queryFn: async () => (await api.get<PlanSummary>('/users/me/plan')).data,
    enabled: isAuthenticated,
    // Depois de assinar, consulta até a confirmação chegar (Pix leva instantes).
    refetchInterval: (query) => (purchase === 'ok' && query.state.data?.plan !== 'PLUS' ? 4000 : false),
  })
  const subscription = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => (await api.get<MySubscription | null>('/billing/subscription')).data,
    enabled: isAuthenticated,
    refetchInterval: purchase === 'ok' ? 4000 : false,
  })
  const student = useQuery({
    queryKey: ['students', 'verification'],
    queryFn: async () => (await api.get<StudentStatus>('/students/verification')).data,
    enabled: isAuthenticated,
  })
  const checkout = useMutation({
    mutationFn: async () => (await api.post<{ url: string }>('/billing/checkout', { adultConfirmed: true })).data,
    onSuccess: ({ url }) => { window.location.assign(url) },
  })
  const portal = useMutation({
    mutationFn: async () => (await api.post<{ url: string }>('/billing/portal')).data,
    onSuccess: ({ url }) => { window.location.assign(url) },
  })
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Escolha um arquivo.')
      if (file.size > 4 * 1024 * 1024) throw new Error('Arquivo maior que 4 MB.')
      return (await api.post('/students/verification', { fileBase64: await readAsDataUrl(file), consent: true })).data
    },
    onSuccess: () => { setFile(null); setConsent(false); void queryClient.invalidateQueries({ queryKey: ['students'] }) },
  })

  const prices = config.data?.prices
  const isPlus = summary.data?.plan === 'PLUS'
  const sub = subscription.data
  const hasSubscription = Boolean(sub && ['active', 'trialing', 'past_due'].includes(sub.status))
  const studentPrice = student.data?.eligible

  return (
    <div className="kp">
      <header className="kp-top">
        <Link to="/" className="kp-brand" aria-label="Kuaa, início"><img src="/brand/wordmark-w.png" alt="Kuaa" /></Link>
        {isAuthenticated ? <Link to="/dashboard" className="kp-login">Voltar ao painel</Link> : <Link to="/entrar" className="kp-login">Entrar</Link>}
      </header>

      <main className="kp-main">
        <h1>Planos</h1>
        <p className="kp-lead">O gratuito já tem o essencial para estudar: diagnóstico, trilha e explicação de todo erro. O Plus aumenta o volume de prática e de IA para quem estuda todo dia.</p>

        {purchase === 'ok' && !isPlus && <p className="kp-banner" role="status">Assinatura enviada. Assim que o banco confirmar (no Pix leva instantes), seu Plus aparece aqui.</p>}
        {purchase === 'ok' && isPlus && <p className="kp-banner is-ok" role="status">Tudo certo: seu Kuaa Plus está ativo.</p>}
        {purchase === 'cancelada' && <p className="kp-banner" role="status">A assinatura não foi concluída. Nada foi cobrado.</p>}

        {summary.data && (
          <section className="kp-current" aria-label="Seu plano">
            <p><strong>Seu plano: {isPlus ? 'Kuaa Plus' : 'Gratuito'}</strong></p>
            {hasSubscription && sub && (
              <p className="kp-sub">
                {sub.status === 'past_due' ? 'Pagamento da renovação pendente. ' : ''}
                {sub.cancelAtPeriodEnd
                  ? `Assinatura cancelada: o Plus continua até ${date(sub.currentPeriodEnd)}.`
                  : `Renova em ${date(sub.currentPeriodEnd)}${sub.priceKind === 'STUDENT' ? ' com preço de estudante' : ''}.`}
                {' '}<button type="button" className="kp-linkbtn" onClick={() => portal.mutate()} disabled={portal.isPending}>Gerenciar ou cancelar</button>
              </p>
            )}
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
            <p className="kp-price">{prices ? brl(studentPrice ? prices.student : prices.full) : 'R$ 29,90'} <small>por mês</small></p>
            <p className="kp-note">
              {studentPrice ? 'Preço de estudante aplicado. ' : `Estudante paga meia: ${prices ? brl(prices.student) : 'R$ 14,95'}/mês. `}
              Paga com Pix Automático, sem cartão. Cancele quando quiser.
            </p>
            {isPlus && hasSubscription ? <p className="kp-ok">Sua assinatura está ativa.</p>
              : !config.data?.enabled ? <div className="kp-soon" style={{ display: 'grid', gap: 10, justifyItems: 'start' }}>
                <p style={{ margin: 0 }}>As assinaturas abrem em breve.</p>
                {isAuthenticated ? <InterestButton source="planos" /> : <Link to="/cadastro" className="kp-btn">Criar conta grátis<i className="bi bi-arrow-right" aria-hidden="true" /></Link>}
              </div>
                : !isAuthenticated ? <Link to="/cadastro" className="kp-btn">Criar conta para assinar<i className="bi bi-arrow-right" aria-hidden="true" /></Link>
                  : <form className="kp-buy" onSubmit={(event) => { event.preventDefault(); if (adult) checkout.mutate() }}>
                    <label className="kp-check">
                      <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} />
                      <span>Sou maior de 18 anos ou responsável pelo estudante e concordo com os <Link to="/termos" target="_blank">Termos</Link> (renovação mensal, cancelamento quando quiser).</span>
                    </label>
                    <button type="submit" className="kp-btn" disabled={!adult || checkout.isPending}>
                      {checkout.isPending ? 'Abrindo pagamento…' : 'Assinar com Pix'}<i className="bi bi-lock" aria-hidden="true" />
                    </button>
                    <p className="kp-fine">Você autoriza uma vez no app do seu banco. Antes de cada mês, o banco avisa o valor e você pode cancelar por lá ou aqui.</p>
                    {checkout.isError && <p role="alert" className="kp-err">{apiError(checkout.error, 'Não foi possível abrir o pagamento. Tente de novo em instantes.')}</p>}
                  </form>}
          </section>
        </div>

        {isAuthenticated && config.data?.enabled && !hasSubscription && (
          <section className="kp-student" aria-labelledby="kp-student-title">
            <h2 id="kp-student-title">Meia para estudante</h2>
            {student.data?.eligible ? (
              <p className="kp-ok-dark">Meia aprovada até {date(student.data.last?.expiresAt)}. O preço de estudante já aparece na assinatura.</p>
            ) : student.data?.last?.status === 'PENDING' ? (
              <p>Recebemos seu documento em {date(student.data.last.submittedAt)}. A análise sai em até 2 dias úteis.</p>
            ) : (
              <form className="kp-upload" onSubmit={(event) => { event.preventDefault(); if (file && consent) upload.mutate() }}>
                {student.data?.last?.status === 'REJECTED' && <p className="kp-err-dark" role="alert">Documento recusado: {student.data.last.rejectReason}</p>}
                <p>Envie uma foto da carteirinha de estudante ou da declaração de matrícula deste ano (JPG, PNG ou PDF, até 4 MB).</p>
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" aria-label="Documento de estudante"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                <label className="kp-check is-dark">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                  <span>Autorizo o uso desta imagem só para conferir a matrícula. Ela é apagada assim que a análise termina.</span>
                </label>
                <button type="submit" className="kp-btn is-outline" disabled={!file || !consent || upload.isPending}>
                  {upload.isPending ? 'Enviando…' : 'Enviar para análise'}
                </button>
                {upload.isError && <p className="kp-err-dark" role="alert">{apiError(upload.error, upload.error instanceof Error ? upload.error.message : 'Não foi possível enviar.')}</p>}
              </form>
            )}
          </section>
        )}

        <table className="kp-table">
          <caption className="kp-sr">Comparação entre os planos</caption>
          <thead><tr><th scope="col">O que você tem</th><th scope="col">Gratuito</th><th scope="col">Plus</th></tr></thead>
          <tbody>{ROWS.map(([label, free, plus]) => <tr key={label}><th scope="row">{label}</th><td>{free}</td><td>{plus}</td></tr>)}</tbody>
        </table>

        <section className="kp-faq" aria-labelledby="kp-faq-title">
          <h2 id="kp-faq-title">Antes de assinar</h2>
          <dl>
            <dt>Preciso de cartão?</dt>
            <dd>Não. A assinatura usa Pix Automático: você autoriza uma vez no app do banco e a mensalidade é debitada sozinha, com aviso do banco antes de cada cobrança.</dd>
            <dt>Como cancelo?</dt>
            <dd>Em "Gerenciar ou cancelar", aqui nesta página, ou no app do seu banco. O Plus continua até o fim do mês já pago.</dd>
            <dt>Quem pode assinar?</dt>
            <dd>Maiores de 18 anos ou o responsável pelo estudante.</dd>
            <dt>E se eu me arrepender?</dt>
            <dd>Você pode pedir o reembolso integral da primeira mensalidade em até 7 dias.{SUPPORT_EMAIL && <> Escreva para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</>}</dd>
            <dt>O Kuaa garante aprovação?</dt>
            <dd>Não. O Kuaa organiza o que estudar e explica seus erros; o resultado depende do seu estudo.</dd>
          </dl>
        </section>
      </main>
    </div>
  )
}
