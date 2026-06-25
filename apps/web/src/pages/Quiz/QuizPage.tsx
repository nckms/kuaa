import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, useAnswer, useFinish } from '../../hooks/useQuiz'
import ProgressBar from '../../components/ui/ProgressBar'
import type { AnswerResult } from '../../types/quiz'

const WingGlyph = () => (
  <svg width="20" height="17" viewBox="0 0 28 24" fill="none">
    <path d="M2 20 C6 12 14 8 26 4 C20 10 18 16 20 22 C14 18 8 18 2 20Z" fill="#FFDC5C" opacity="0.9"/>
    <path d="M2 20 C8 16 14 14 20 22 C14 22 8 22 2 20Z" fill="#FFDC5C" opacity="0.5"/>
  </svg>
)

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const MOTIVATIONAL_CORRECT = [
  'Excelente! Continue assim.',
  'Correto! Você está no caminho certo.',
  'Muito bem! Conhecimento que abre asas.',
  'Perfeito! Siga em frente.',
  'Ótimo! Você domina este conteúdo.',
]

const MOTIVATIONAL_WRONG = [
  'Não desanime! Leia a explicação com atenção.',
  'Erro faz parte do aprendizado. Siga em frente!',
  'Continue! Cada erro é uma oportunidade de aprender.',
]

export default function QuizPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const { data: session, isLoading, isError } = useSession(sessionId)
  const answerMutation = useAnswer(sessionId ?? '')
  const finishMutation = useFinish(sessionId ?? '')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(50 * 60)
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [answeredMap, setAnsweredMap] = useState<Record<string, AnswerResult>>({})
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [motivationalMsg, setMotivationalMsg] = useState('')

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(interval)
  }, [])

  const goToQuestion = useCallback((idx: number) => {
    setCurrentIndex(idx)
    setSelectedOption(null)
    setAnswerResult(null)
    setIsConfirmed(false)
    setQuestionStartTime(Date.now())
  }, [])

  useEffect(() => {
    if (!session) return
    const restored = Object.fromEntries(
      (session.answeredResults ?? []).map((answer) => [answer.questionId, answer]),
    )
    setAnsweredMap(restored)
    goToQuestion(0)
  }, [session, goToQuestion])

  if (isLoading || !session) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#2a0d33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, Arial, sans-serif' }}>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 16 }}>Carregando sessão...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#2a0d33', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Inter, Arial, sans-serif' }}>
        <p style={{ color: '#fca5a5', fontSize: 16 }}>Erro ao carregar a sessão.</p>
        <button onClick={() => navigate(-1)} style={{ backgroundColor: '#531A61', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontFamily: 'Inter, Arial, sans-serif' }}>Voltar</button>
      </div>
    )
  }

  const { questions, topicName, subjectName, vestibularName } = session
  const total = questions.length
  const currentQ = questions[currentIndex]
  const answeredCount = Object.keys(answeredMap).length

  async function handleConfirm() {
    if (!selectedOption || !currentQ) return
    const timeSpentMs = Date.now() - questionStartTime
    try {
      const result = await answerMutation.mutateAsync({
        questionId: currentQ.id,
        optionId: selectedOption,
        timeSpentMs,
      })
      setAnswerResult(result)
      setIsConfirmed(true)
      setAnsweredMap((prev) => ({ ...prev, [currentQ.id]: { ...result, selectedOptionId: selectedOption } }))
      if (result.isCorrect) {
        setMotivationalMsg(MOTIVATIONAL_CORRECT[Math.floor(Math.random() * MOTIVATIONAL_CORRECT.length)])
      } else {
        setMotivationalMsg(MOTIVATIONAL_WRONG[Math.floor(Math.random() * MOTIVATIONAL_WRONG.length)])
      }
    } catch (err) {
      console.error('Erro ao responder:', err)
    }
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      goToQuestion(currentIndex + 1)
    } else {
      finishMutation.mutate()
    }
  }

  const handleFinish = () => finishMutation.mutate()

  const prevResult = answeredMap[currentQ?.id ?? '']
  const displayResult = isConfirmed ? answerResult : prevResult ?? null
  const isAlreadyAnswered = !!prevResult && !isConfirmed

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#2a0d33', fontFamily: 'Inter, Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: 'rgba(26,8,38,.95)', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <WingGlyph />
            <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>{vestibularName} · {topicName}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
              <ProgressBar value={(answeredCount / total) * 100} color="vinho" size="sm" />
            </div>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 11 }}>{currentIndex + 1} / {total}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setShowFinishModal(true)}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,.25)', color: 'rgba(255,255,255,.6)', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, Arial, sans-serif' }}
            >Pausar</button>
            <button
              onClick={() => setShowFinishModal(true)}
              disabled={finishMutation.isPending}
              style={{ backgroundColor: '#840033', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, Arial, sans-serif', fontWeight: 600 }}
            >{finishMutation.isPending ? 'Finalizando...' : 'Finalizar'}</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 960, margin: '0 auto', width: '100%', padding: '32px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }} className="quiz-grid">

        {/* Questão */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: '#FFDC5C', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>
              QUESTÃO {currentIndex + 1} DE {total}
            </span>
            <button
              onClick={() => setMarkedForReview((prev) => {
                const next = new Set(prev)
                if (next.has(currentQ.id)) next.delete(currentQ.id); else next.add(currentQ.id)
                return next
              })}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,.2)', color: markedForReview.has(currentQ.id) ? '#FFDC5C' : 'rgba(255,255,255,.6)', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, Arial, sans-serif' }}
            >
              {markedForReview.has(currentQ.id) ? 'Marcada' : 'Marcar p/ revisão'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 16 }}>{subjectName} · Nível {currentQ.difficulty}/5</p>
          <p style={{ fontSize: 18, color: '#fff', lineHeight: 1.8 }}>{currentQ.body}</p>

          {/* Opções */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt.id
              const res = displayResult
              const isConfirmedCorrect = res && opt.id === res.correctOptionId
              const chosenOptionId = res?.selectedOptionId ?? selectedOption
              const isRestoredSelected = !!res && opt.id === chosenOptionId
              const isConfirmedWrong = res && isRestoredSelected && !res.isCorrect
              const isDisabled = isConfirmed || isAlreadyAnswered

              let bg = 'rgba(255,255,255,.05)'
              let border = '1.5px solid rgba(255,255,255,.12)'
              let letterColor = '#FFDC5C'
              const textOpacity = res && opt.id !== res.correctOptionId && opt.id !== selectedOption ? 0.45 : 1

              if ((isSelected || isRestoredSelected) && !isDisabled) { bg = 'rgba(83,26,97,.5)'; border = '1.5px solid #531A61' }
              if (isConfirmedCorrect) { bg = 'rgba(6,78,59,.4)'; border = '1.5px solid #10b981'; letterColor = '#10b981' }
              if (isConfirmedWrong) { bg = 'rgba(132,0,51,.4)'; border = '1.5px solid #840033'; letterColor = '#840033' }

              return (
                <div
                  key={opt.id}
                  onClick={() => { if (!isDisabled) setSelectedOption(opt.id) }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderRadius: 14, backgroundColor: bg, border, cursor: isDisabled ? 'default' : 'pointer', transition: 'all 0.15s', opacity: textOpacity }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: letterColor, width: 22, flexShrink: 0, marginTop: 1 }}>{opt.id}</span>
                  <span style={{ fontSize: 15, color: '#fff', lineHeight: 1.5, flex: 1 }}>{opt.text}</span>
                </div>
              )
            })}
          </div>

          {/* Botão confirmar */}
          {selectedOption && !isConfirmed && !isAlreadyAnswered && (
            <button
              onClick={handleConfirm}
              disabled={answerMutation.isPending}
              style={{ width: '100%', padding: 15, marginTop: 20, borderRadius: 12, backgroundColor: '#840033', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'Inter, Arial, sans-serif' }}
            >
              {answerMutation.isPending ? 'Verificando...' : 'Confirmar resposta'}
            </button>
          )}

          {/* Explicação */}
          <AnimatePresence>
            {(isConfirmed || isAlreadyAnswered) && displayResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 20, backgroundColor: 'rgba(255,255,255,.06)', borderLeft: '3px solid #FFDC5C', borderRadius: '0 14px 14px 0', padding: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#FFDC5C', fontWeight: 700 }}>Explicação</span>
                  {displayResult.xpDelta > 0 && (
                    <span style={{ backgroundColor: 'rgba(255,220,92,.2)', color: '#FFDC5C', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>+{displayResult.xpDelta} XP</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: displayResult.isCorrect ? '#10b981' : '#fca5a5', marginBottom: 8 }}>
                  {motivationalMsg || (displayResult.isCorrect ? 'Resposta correta.' : 'Revise este ponto antes de seguir.')}
                </p>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>{displayResult.explanation}</p>

                <div style={{ textAlign: 'right', marginTop: 12 }}>
                  <button
                    onClick={handleNext}
                    disabled={finishMutation.isPending}
                    style={{ backgroundColor: currentIndex < total - 1 ? '#531A61' : '#840033', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif' }}
                  >
                    {finishMutation.isPending ? 'Finalizando...' : currentIndex < total - 1 ? 'Próxima questão' : 'Ver resultado'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Painel lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Cronômetro */}
          <div style={{ backgroundColor: '#FFDC5C', borderRadius: 20, padding: 20 }}>
            <p style={{ fontSize: 11, color: 'rgba(83,26,97,.6)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>TEMPO RESTANTE</p>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 40, fontWeight: 700, color: timeLeft < 300 ? '#840033' : '#531A61', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {formatTime(timeLeft)}
            </div>
            {timeLeft < 300 && <p style={{ color: '#840033', fontSize: 12, marginTop: 6, fontWeight: 700 }}>Menos de 5 minutos!</p>}
          </div>

          {/* Progresso */}
          <div style={{ backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 20, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '.1em', textTransform: 'uppercase' }}>RESPONDIDAS</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>{answeredCount}/{total}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '.1em', textTransform: 'uppercase' }}>MARCADAS</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>{markedForReview.size}</p>
              </div>
            </div>
          </div>

          {/* Navegar questões */}
          <div style={{ backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 20, padding: 20 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>Navegar questões</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {questions.map((q, i) => {
                const ans = answeredMap[q.id]
                const isCurrent = i === currentIndex
                const isMarked = markedForReview.has(q.id)
                let bg = 'rgba(255,255,255,.08)'
                if (ans) bg = ans.isCorrect ? '#531A61' : '#840033'
                return (
                  <button key={q.id} onClick={() => goToQuestion(i)}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: isCurrent ? '2px solid #FFDC5C' : isMarked ? '2px solid rgba(255,220,92,.4)' : '2px solid transparent', backgroundColor: bg, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, Arial, sans-serif' }}
                  >{i + 1}</button>
                )
              })}
            </div>
          </div>

          {/* Corações */}
          <div style={{ backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 20, padding: 16 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>Corações restantes</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const hearts = answerResult?.heartsRemaining ?? 5
                return <span key={i} style={{ fontSize: 20, color: i < hearts ? '#840033' : 'rgba(255,255,255,.15)' }}>♥</span>
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal finalizar */}
      <AnimatePresence>
        {showFinishModal && (
          <>
            <motion.div
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,.6)', zIndex: 40 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFinishModal(false)}
            />
            <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                style={{ backgroundColor: '#fff', borderRadius: 24, padding: 28, maxWidth: 380, width: '100%', fontFamily: 'Inter, Arial, sans-serif' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ fontFamily: "'Questrial', sans-serif", fontSize: 22, color: '#1a1a1a', marginBottom: 8 }}>Finalizar sessão?</h3>
                <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
                  {answeredCount} de {total} questões respondidas.
                  {answeredCount < total && ` As ${total - answeredCount} restantes serão puladas.`}
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowFinishModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #e5e7eb', backgroundColor: 'transparent', color: '#6b7280', cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, Arial, sans-serif' }}>
                    Continuar
                  </button>
                  <button onClick={handleFinish} disabled={finishMutation.isPending} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', backgroundColor: '#840033', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif' }}>
                    {finishMutation.isPending ? 'Finalizando...' : 'Finalizar'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) { .quiz-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
