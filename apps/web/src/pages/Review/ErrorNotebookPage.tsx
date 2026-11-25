import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useReviewOverview, useStartReview, type ReviewItemSummary } from '../../hooks/useReview'
import './Review.css'

const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
function nextLabel(item: ReviewItemSummary) {
  const ms = new Date(item.dueAt).getTime() - Date.now()
  if (ms <= 0) return 'Revisar hoje'
  const days = Math.ceil(ms / 86_400_000)
  return days === 1 ? 'Volta amanhã' : `Volta em ${days} dias`
}

export default function ErrorNotebookPage() {
  const overview = useReviewOverview()
  const start = useStartReview()
  const navigate = useNavigate()
  const data = overview.data

  const review = async (topicId: string) => {
    const { sessionId } = await start.mutateAsync(topicId)
    navigate(`/quiz/${sessionId}`)
  }

  return (
    <AppLayout>
      <div className="k-page">
        <p className="k-eyebrow">Caderno de erros</p>
        <h1 className="sim-title">Meus erros</h1>
        <p className="sim-lead">Toda questão que você erra volta para revisão no dia seguinte. Acertou, ela volta em 3 dias. Dois acertos seguidos e ela sai do caderno. Revisar não gasta suas práticas do dia.</p>
        <Link to="/raio-x" className="rv-link-plus"><i className="bi bi-activity" aria-hidden="true" />Raio-X dos erros: descubra por que você erra (Plus)</Link>
        {start.isError && <p role="alert" className="k-alert">Não foi possível abrir a revisão. Tente de novo.</p>}
        {overview.isLoading && <div className="k-state">Carregando…</div>}
        {overview.isError && <div className="k-state" role="alert">Não foi possível carregar seus erros.</div>}
        {data && <>
          <div className="rv-stats">
            <div className="k-card is-sm"><strong>{data.due}</strong><span>para revisar hoje</span></div>
            <div className="k-card is-sm"><strong>{data.open}</strong><span>no caderno</span></div>
            <div className="k-card is-sm"><strong>{data.resolved}</strong><span>já dominadas</span></div>
          </div>
          {data.open === 0 ? (
            <div className="k-state">{data.resolved ? 'Caderno zerado. Os próximos erros aparecem aqui.' : 'Nenhum erro ainda. Quando você errar uma questão na prática, no simulado ou numa prova anterior, ela aparece aqui.'}</div>
          ) : <>
            <section aria-labelledby="rv-topics" className="rv-section">
              <h2 id="rv-topics" className="k-h3">Revisar por tópico</h2>
              <ul className="rv-topics">
                {data.topics.map((t) => (
                  <li key={t.topicId} className="k-card is-sm">
                    <div><strong>{t.topicName}</strong><small>{t.subjectName} · {t.due ? `${t.due} para hoje` : 'nenhuma vence hoje'} · {t.open} no caderno</small></div>
                    <button type="button" className={`k-btn is-sm ${t.due ? 'k-btn-primary' : 'k-btn-outline'}`} disabled={start.isPending} onClick={() => void review(t.topicId)}>
                      {t.due ? 'Revisar' : 'Treinar'}<i className="bi bi-arrow-right" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="rv-items" className="rv-section">
              <h2 id="rv-items" className="k-h3">Questões no caderno</h2>
              <ul className="rv-items">
                {data.items.map((i) => (
                  <li key={i.id}>
                    <p>{i.preview}{i.preview.length >= 140 ? '…' : ''}</p>
                    <small>{i.subjectName} · {i.topicName}{i.origin ? ` · ${i.origin}` : ''} · errou em {day(i.lastWrongAt)}{i.timesWrong > 1 ? ` (${i.timesWrong}×)` : ''}</small>
                    <span className={`rv-next${new Date(i.dueAt).getTime() <= Date.now() ? ' is-due' : ''}`}>{nextLabel(i)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>}
        </>}
      </div>
    </AppLayout>
  )
}
