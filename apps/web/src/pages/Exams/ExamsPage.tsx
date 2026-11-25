import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useExams, useStartExam } from '../../hooks/useExams'
import type { ExamSummary } from '../../types/exams'
import './Exams.css'

const hours = (seconds: number) => `${Math.floor(seconds / 3600)}h${seconds % 3600 ? String(Math.round((seconds % 3600) / 60)).padStart(2, '0') : ''}`

function ExamCard({ exam, onStart, starting }: { exam: ExamSummary; onStart: () => void; starting: boolean }) {
  const last = exam.last
  const action = last && !last.finished ? 'Continuar' : last ? 'Refazer' : 'Fazer a prova'
  return (
    <article className="ex-card k-card is-sm">
      <div className="ex-card-head">
        <strong>Dia {exam.day}</strong>
        <small>{exam.area}</small>
      </div>
      <p className="ex-card-meta">{exam.questions} questões · {hours(exam.durationSeconds)}</p>
      {last?.finished && <p className="ex-card-last">Última: <strong>{last.correct ?? 0}/{last.total}</strong> acertos</p>}
      <button type="button" className={`k-btn is-sm ${last && !last.finished ? 'k-btn-primary' : 'k-btn-outline'}`} disabled={starting} onClick={onStart}>
        {action}<i className="bi bi-arrow-right" aria-hidden="true" />
      </button>
    </article>
  )
}

export default function ExamsPage() {
  const exams = useExams()
  const start = useStartExam()
  const navigate = useNavigate()
  const years = [...new Set((exams.data ?? []).map((e) => e.year))]

  const open = async (exam: ExamSummary) => {
    if (exam.last && !exam.last.finished) { navigate(`/provas/${exam.last.id}`); return }
    const { id } = await start.mutateAsync({ year: exam.year, day: exam.day })
    navigate(`/provas/${id}`)
  }

  return (
    <AppLayout>
      <div className="k-page">
        <p className="k-eyebrow">ENEM 2009–2023</p>
        <h1 className="sim-title">Provas anteriores</h1>
        <p className="sim-lead">Faça a prova oficial de um ano inteiro, na ordem e no tempo da prova real. A correção mostra o gabarito oficial e a explicação de cada questão.</p>
        <p className="k-muted ex-note">As questões vêm das provas do INEP. Algumas com figura que a base de origem não trazia ficaram de fora, por isso um dia pode ter menos de 90 questões. A redação não está incluída.</p>
        {start.isError && <p role="alert" className="k-alert">Não foi possível abrir a prova. Tente de novo.</p>}
        {exams.isLoading && <div className="k-state">Carregando provas…</div>}
        {exams.isError && <div className="k-state" role="alert">Não foi possível carregar as provas.</div>}
        {years.map((year) => (
          <section key={year} className="ex-year" aria-labelledby={`ex-${year}`}>
            <h2 id={`ex-${year}`} className="k-h3">ENEM {year}</h2>
            <div className="ex-grid">
              {(exams.data ?? []).filter((e) => e.year === year).map((exam) => (
                <ExamCard key={exam.day} exam={exam} starting={start.isPending} onStart={() => void open(exam)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppLayout>
  )
}
