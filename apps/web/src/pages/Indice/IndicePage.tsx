import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useIndex } from '../../hooks/useIndex'
import { useAuthStore } from '../../stores/auth.store'
import { INDEX_BANDS, indexBand, sparkPoints } from '../../utils/kuaaIndex'
import { subjectThemeByName } from '../../utils/subjectTheme'
import './IndicePage.css'

function Gauge({ score }: { score: number }) {
  const frac = Math.max(0, Math.min(1, (score - 300) / 700))
  const angle = Math.PI * (1 - frac)
  return (
    <svg viewBox="0 0 220 128" width="100%" role="img" aria-label={`Posição ${score} na escala de 300 a 1000`}>
      <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="rgba(53,20,62,.14)" strokeWidth="16" strokeLinecap="round" />
      <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="#35143E" strokeWidth="16" strokeLinecap="round" pathLength={100} strokeDasharray={`${(frac * 100).toFixed(1)} 100`} />
      <circle cx={(110 + 90 * Math.cos(angle)).toFixed(1)} cy={(110 - 90 * Math.sin(angle)).toFixed(1)} r="9" fill="#fff" stroke="#35143E" strokeWidth="4" />
      <text x="20" y="126" fontSize="9" fill="#35143E" textAnchor="middle" fontFamily="Geist Mono">300</text>
      <text x="200" y="126" fontSize="9" fill="#35143E" textAnchor="middle" fontFamily="Geist Mono">1000</text>
    </svg>
  )
}

export default function IndicePage() {
  const firstVestibularSlug = useAuthStore((state) => state.firstVestibularSlug)
  const vestibularName = useAuthStore((state) => state.enrollments.find((item) => item.vestibular.slug === firstVestibularSlug)?.vestibular.name)
  const { data, isLoading, isError, refetch } = useIndex(firstVestibularSlug ?? '')
  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'

  if (isLoading || isError || !data) {
    return <AppLayout><div className="k-page"><div className="k-state" role={isError ? 'alert' : 'status'}>
      <p style={{ margin: 0 }}>{isError ? 'Não foi possível carregar seu índice.' : 'Carregando seu índice...'}</p>
      {isError && <button type="button" className="k-btn k-btn-primary is-sm" onClick={() => void refetch()}>Tentar novamente</button>}
    </div></div></AppLayout>
  }

  const hasActivity = data.subjectBreakdown.length > 0
  const band = indexBand(data.score)
  const lowestSubject = [...data.subjectBreakdown].sort((a, b) => a.score - b.score)[0]
  const values = data.history.map((point) => point.score)
  const line = sparkPoints(values, 560, 170)
  const subjects = [...data.subjectBreakdown].sort((a, b) => b.score - a.score)

  return <AppLayout><div className="k-page">
    <header><p className="k-eyebrow">Seu perfil de aprovação{vestibularName ? ` · ${vestibularName}` : ''}</p><h1 className="k-h1">Índice Kuaa</h1></header>

    <section className="ix-hero" aria-label="Seu índice atual">
      <div className="ix-hero-main">
        {data.percentile != null && hasActivity && <span className="ix-pill">Top {Math.max(1, 100 - Math.round(data.percentile))}%{vestibularName ? ` · ${vestibularName}` : ''}</span>}
        <div className="ix-score">{hasActivity ? data.score : '—'}</div>
        <div className="ix-score-sub">{hasActivity ? <>de 1000 · faixa <strong>{band.name}</strong></> : 'Responda questões para ver seu índice.'}</div>
        {hasActivity && data.delta7d !== 0 && (
          <div className="ix-delta" style={{ color: data.delta7d > 0 ? '#1E6B4E' : 'var(--k-vinho)' }}>
            <i className={`bi ${data.delta7d > 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}`} aria-hidden="true" />{data.delta7d > 0 ? '+' : ''}{data.delta7d} pts em 7 dias
          </div>
        )}
      </div>
      <div className="ix-hero-gauge">
        <Gauge score={hasActivity ? data.score : 300} />
        <div className="ix-bands">
          {INDEX_BANDS.map((item, index) => <div key={item.name} className={hasActivity && index === band.index ? 'is-on' : ''}><small className="k-mono">{item.range}</small><span>{item.name}</span></div>)}
        </div>
      </div>
    </section>

    <div className="k-row">
      <section className="k-card ix-evo" aria-labelledby="ix-evo-title">
        <div className="k-card-head"><h3 id="ix-evo-title" className="k-h3">Evolução</h3><span className="k-muted" style={{ fontSize: 13 }}>por mês</span></div>
        {values.length >= 2 ? <>
          <svg viewBox="0 0 560 180" width="100%" height="200" preserveAspectRatio="none" style={{ overflow: 'visible' }} role="img" aria-label="Evolução mensal do Índice Kuaa">
            {[45, 90, 135].map((y) => <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="var(--k-line-soft)" />)}
            <polygon points={`0,180 ${line} 560,180`} fill="#531A61" opacity=".08" />
            <polyline points={line} fill="none" stroke="#531A61" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="ix-evo-labels k-mono">{data.history.map((point, index) => <span key={`${point.month}-${index}`}>{point.month}<strong>{point.score}</strong></span>)}</div>
        </> : <p className="k-muted" style={{ fontSize: 14, margin: 0 }}>O gráfico aparece após dois meses de atividade.</p>}
      </section>

      <section className="k-card ix-subjects" aria-labelledby="ix-subj-title">
        <div className="k-card-head"><h3 id="ix-subj-title" className="k-h3">Por matéria</h3><span className="k-muted" style={{ fontSize: 13 }}>% de acerto ponderado</span></div>
        {subjects.length ? <div className="ix-subject-list">{subjects.map((subject, index) => {
          const theme = subjectThemeByName(subject.subjectName, index)
          return <div key={subject.subjectId}>
            <div className="ix-subject-head"><span>{subject.subjectName}</span><span className="k-mono">
              {subject.delta !== 0 && <span style={{ color: subject.delta > 0 ? 'var(--k-verde)' : 'var(--k-vinho)' }}>{subject.delta > 0 ? '↑' : '↓'} {Math.abs(subject.delta)}</span>}
              <span>{subject.score}%</span>
            </span></div>
            <div className="k-track"><span style={{ width: `${Math.max(2, Math.min(100, subject.score))}%`, background: theme.color }} /></div>
          </div>
        })}</div> : <p className="k-muted" style={{ fontSize: 14, margin: 0 }}>Responda questões para ver seus acertos por matéria.</p>}
      </section>
    </div>

    <div className="k-row">
      <section className="ix-next">
        <div><p className="k-eyebrow" style={{ color: 'var(--k-amarelo)' }}>Próximo passo</p><h2>{lowestSubject ? `Revise ${lowestSubject.subjectName}` : 'Comece pela trilha'}</h2>
          <p>{lowestSubject ? 'É onde você tem o menor percentual de acertos até agora.' : 'Responda questões para acompanhar seu desempenho.'}</p></div>
        <Link to={trailHref} className="k-btn k-btn-yellow">Abrir trilha<i className="bi bi-arrow-right" aria-hidden="true" /></Link>
      </section>
      <details className="k-card is-md ix-how"><summary>Como funciona o índice?</summary><p>Ele resume seus acertos nas questões da trilha e dos simulados em uma escala de 300 a 1000. Questões mais difíceis têm peso maior. Não é nota do vestibular nem previsão de aprovação.</p></details>
    </div>
  </div></AppLayout>
}
