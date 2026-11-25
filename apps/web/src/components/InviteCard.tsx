import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

interface Referral { code: string; url: string; joined: number; rewarded: number; rewardDays: number; remainingThisMonth: number }

/** "Estude com um amigo": link de convite com 7 dias de Plus para os dois. */
export default function InviteCard() {
  const referral = useQuery({ queryKey: ['referral'], queryFn: async () => (await api.get<Referral>('/users/me/referral')).data, staleTime: 60_000 })
  const [copied, setCopied] = useState(false)
  if (!referral.data) return null
  const { url, rewarded, rewardDays, remainingThisMonth } = referral.data
  const message = `Tô usando o Kuaa pra estudar pro ENEM: faz um diagnóstico de 5 minutos e mostra o que estudar. Entra pelo meu link e a gente ganha ${rewardDays} dias do Plus: ${url}`

  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Kuaa', text: message }); return }
    } catch { /* cancelado: cai para copiar */ }
    try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { /* sem clipboard */ }
  }

  return <section className="k-card is-md" aria-labelledby="invite-title" style={{ marginBottom: 16 }}>
    <h2 id="invite-title" className="st-h2" style={{ margin: 0 }}>Estude com um amigo</h2>
    <p className="k-muted" style={{ fontSize: 14, margin: '6px 0 12px' }}>
      Quando um amigo entra pelo seu link e termina o diagnóstico, vocês dois ganham <strong>{rewardDays} dias do Kuaa Plus</strong>.
      {rewarded > 0 && ` Você já ganhou com ${rewarded} ${rewarded === 1 ? 'amigo' : 'amigos'}.`}
      {remainingThisMonth === 0 && ' Você atingiu o limite de bônus deste mês; seus amigos continuam ganhando.'}
    </p>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button type="button" className="k-btn k-btn-primary is-sm" onClick={() => void share()}>
        <i className="bi bi-share" aria-hidden="true" />{copied ? 'Mensagem copiada!' : 'Convidar'}
      </button>
      <a className="k-btn k-btn-outline is-sm" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
        <i className="bi bi-whatsapp" aria-hidden="true" />WhatsApp
      </a>
    </div>
  </section>
}
