import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { api } from '../../services/api'
import '../Plans/PlansPage.css'

interface Pending { id: string; submittedAt: string; documentMime: string; user: { name: string; email: string } }

/** Análise de documentos de estudante (meia). Acesso só para ADMIN_USER_IDS. */
function DocumentPreview({ id, mime }: { id: string; mime: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let objectUrl: string | null = null
    let active = true
    api.get(`/admin/student-verifications/${id}/document`, { responseType: 'blob' }).then((res) => {
      if (!active) return
      objectUrl = URL.createObjectURL(res.data as Blob)
      setUrl(objectUrl)
    }).catch(() => setUrl(null))
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [id])
  if (!url) return <p>Carregando documento…</p>
  return mime === 'application/pdf'
    ? <iframe title="Documento" src={url} style={{ width: '100%', height: 480, border: 0 }} />
    : <img src={url} alt="Documento enviado pelo aluno" style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 12 }} />
}

export default function StudentReviewPage() {
  const queryClient = useQueryClient()
  const list = useQuery({
    queryKey: ['admin', 'students'],
    queryFn: async () => (await api.get<Pending[]>('/admin/student-verifications')).data,
    retry: false,
  })
  const review = useMutation({
    mutationFn: async (input: { id: string; approve: boolean; reason?: string }) =>
      (await api.post(`/admin/student-verifications/${input.id}/review`, { approve: input.approve, reason: input.reason })).data,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['admin', 'students'] }) },
  })
  const forbidden = axios.isAxiosError(list.error) && list.error.response?.status === 403

  return (
    <div className="kp">
      <header className="kp-top">
        <Link to="/" className="kp-brand" aria-label="Kuaa, início"><img src="/brand/wordmark-w.png" alt="Kuaa" /></Link>
        <Link to="/dashboard" className="kp-login">Painel</Link>
      </header>
      <main className="kp-main">
        <h1>Meia estudantil</h1>
        <p className="kp-lead">Aprove só com documento de matrícula atual. A imagem é apagada assim que você decide.</p>
        {forbidden && <p className="kp-banner">Acesso restrito.</p>}
        {list.isLoading && <p>Carregando…</p>}
        {list.data?.length === 0 && <p className="kp-banner is-ok">Nenhum pedido pendente.</p>}
        {list.data?.map((item) => (
          <section key={item.id} className="kp-student" aria-label={`Pedido de ${item.user.name}`}>
            <p><strong>{item.user.name}</strong> · {item.user.email} · enviado em {new Date(item.submittedAt).toLocaleString('pt-BR')}</p>
            <DocumentPreview id={item.id} mime={item.documentMime} />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
              <button type="button" className="kp-btn" disabled={review.isPending} onClick={() => review.mutate({ id: item.id, approve: true })}>Aprovar meia</button>
              <button type="button" className="kp-btn is-outline" disabled={review.isPending}
                onClick={() => review.mutate({ id: item.id, approve: false, reason: window.prompt('Motivo da recusa (o aluno vê):') ?? undefined })}>Recusar</button>
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
