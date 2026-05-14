import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface Option { id: string; text: string }
interface Question { id: string; body: string; options: Option[]; correctId: string; explanation: string }

const MOCK_SESSION = {
  topicName: 'Interpretação e Análise de Texto',
  vestibularName: 'FUVEST',
  questions: [
    {
      id: 'q1',
      body: 'A partir da leitura do trecho, é correto afirmar que o autor valoriza, sobretudo:',
      options: [
        { id: 'A', text: 'A visão objetivista da realidade social.' },
        { id: 'B', text: 'A problematização da relação entre linguagem e poder.' },
        { id: 'C', text: 'Os aspectos históricos em detrimento do texto.' },
        { id: 'D', text: 'A análise estrutural em detrimento do conteúdo.' },
        { id: 'E', text: 'Uma perspectiva exclusivamente formalista.' },
      ],
      correctId: 'B',
      explanation: 'O autor questiona as estruturas de poder presentes na linguagem, evidenciando como o discurso reflete e reproduz relações sociais.',
    },
    {
      id: 'q2',
      body: 'Qual recurso expressivo predomina no trecho apresentado?',
      options: [
        { id: 'A', text: 'Antítese.' },
        { id: 'B', text: 'Hipérbole.' },
        { id: 'C', text: 'Ironia.' },
        { id: 'D', text: 'Metonímia.' },
        { id: 'E', text: 'Eufemismo.' },
      ],
      correctId: 'C',
      explanation: 'O uso da ironia é perceptível quando o autor utiliza elogios aparentes para criticar a postura descrita.',
    },
    {
      id: 'q3',
      body: 'Ao analisar o texto, percebe-se que o narrador adota uma posição:',
      options: [
        { id: 'A', text: 'Neutra e imparcial diante dos fatos.' },
        { id: 'B', text: 'Engajada e crítica em relação ao tema.' },
        { id: 'C', text: 'Nostálgica e sentimental.' },
        { id: 'D', text: 'Indiferente às questões sociais.' },
        { id: 'E', text: 'Técnica e descritiva.' },
      ],
      correctId: 'B',
      explanation: 'O narrador demonstra claramente seu engajamento ao utilizar termos que evidenciam posicionamento crítico.',
    },
  ] as Question[],
}

const WingGlyph = () => (
  <svg width="20" height="17" viewBox="0 0 28 24" fill="none" style={{ color: '#FFDC5C' }}>
    <path d="M2 20 C6 12 14 8 26 4 C20 10 18 16 20 22 C14 18 8 18 2 20Z" fill="currentColor" opacity="0.9"/>
    <path d="M2 20 C8 16 14 14 20 22 C14 22 8 22 2 20Z" fill="currentColor" opacity="0.5"/>
  </svg>
)

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function QuizPage() {
  const navigate = useNavigate()
  const { questions, topicName, vestibularName } = MOCK_SESSION
  const total = questions.length

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [confirmedAnswer, setConfirmedAnswer] = useState(false)
  const [answeredMap, setAnsweredMap] = useState<Record<string, { selectedId: string; isCorrect: boolean }>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(3000)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    if (isFinished) return
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(interval)
  }, [isFinished])

  const goToQuestion = useCallback((idx: number) => {
    setCurrentIndex(idx)
    setSelectedOption(null)
    setConfirmedAnswer(false)
  }, [])

  function handleConfirm() {
    if (!selectedOption) return
    const q = questions[currentIndex]
    const isCorrect = selectedOption === q.correctId
    setAnsweredMap((prev) => ({ ...prev, [q.id]: { selectedId: selectedOption, isCorrect } }))
    setConfirmedAnswer(true)
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      goToQuestion(currentIndex + 1)
    } else {
      setIsFinished(true)
    }
  }

  function toggleMark() {
    const q = questions[currentIndex]
    setMarkedForReview((prev) => {
      const next = new Set(prev)
      if (next.has(q.id)) next.delete(q.id); else next.add(q.id)
      return next
    })
  }

  const corretas = Object.values(answeredMap).filter((a) => a.isCorrect).length
  const erradas = Object.values(answeredMap).filter((a) => !a.isCorrect).length
  const xpMock = corretas * 15

  if (isFinished) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#2a0d33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
        <motion.div
          style={{ maxWidth: 480, width: '90%', textAlign: 'center', padding: 40 }}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <WingGlyph />
          </motion.div>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 64, fontWeight: 700, color: '#FFDC5C', letterSpacing: '-0.045em', lineHeight: 0.9, marginTop: 20, marginBottom: 16 }}>+{xpMock} XP</div>
          <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 24, color: '#fff', marginBottom: 28 }}>Sessão concluída!</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
            <span style={{ color: '#10b981', fontSize: 16, fontWeight: 700 }}>✓ {corretas} corretas</span>
            <span style={{ color: '#840033', fontSize: 16, fontWeight: 700 }}>✗ {erradas} erradas</span>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 16 }}>⏱ {formatTime(3000 - timeLeft)}</span>
          </div>
          <button onClick={() => navigate(-1)} style={{ width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#840033', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
            Voltar à trilha →
          </button>
        </motion.div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const answered = answeredMap[currentQ.id]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#2a0d33', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#2a0d33', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <WingGlyph />
            <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 14 }}>{vestibularName} · {topicName}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 400, height: 6, backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((currentIndex + 1) / total) * 100}%`, background: 'linear-gradient(90deg, #840033, #531A61)', borderRadius: 999, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>{currentIndex + 1} / {total}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button style={{ background: 'none', border: '1px solid rgba(255,255,255,.3)', color: 'rgba(255,255,255,.6)', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Arial, sans-serif' }}>‖ pausar</button>
            <button onClick={() => setIsFinished(true)} style={{ backgroundColor: '#840033', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>finalizar entrega →</button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', padding: '32px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }} className="quiz-grid">

        {/* Coluna esquerda — questão */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: '#FFDC5C', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>QUESTÃO {currentIndex + 1} DE {total}</span>
            <button onClick={toggleMark} style={{ background: 'none', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.6)', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'Arial, sans-serif' }}>
              {markedForReview.has(currentQ.id) ? '✓ Marcada' : 'MARCAR P/ REVISÃO'}
            </button>
          </div>
          <p style={{ fontSize: 18, color: '#fff', lineHeight: 1.7, marginBottom: 28 }}>{currentQ.body}</p>

          {/* Opções */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt.id
              const isConfirmedCorrect = confirmedAnswer && opt.id === currentQ.correctId
              const isConfirmedWrong = confirmedAnswer && isSelected && opt.id !== currentQ.correctId

              let bg = 'rgba(255,255,255,.05)'
              let border = '1.5px solid rgba(255,255,255,.12)'
              let letterColor = '#FFDC5C'
              if (isSelected && !confirmedAnswer) { bg = 'rgba(83,26,97,.5)'; border = '1.5px solid #531A61' }
              if (isConfirmedCorrect) { bg = 'rgba(6,78,59,.4)'; border = '1.5px solid #10b981'; letterColor = '#10b981' }
              if (isConfirmedWrong) { bg = 'rgba(132,0,51,.4)'; border = '1.5px solid #840033'; letterColor = '#840033' }

              return (
                <div
                  key={opt.id}
                  onClick={() => { if (!confirmedAnswer) setSelectedOption(opt.id) }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderRadius: 14, backgroundColor: bg, border, cursor: confirmedAnswer ? 'default' : 'pointer', transition: 'all 0.15s' }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: letterColor, width: 20, flexShrink: 0, marginTop: 1 }}>{opt.id}</span>
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,.9)', lineHeight: 1.5 }}>{opt.text}</span>
                </div>
              )
            })}
          </div>

          {/* Botão confirmar */}
          {selectedOption && !confirmedAnswer && (
            <button onClick={handleConfirm} style={{ width: '100%', padding: 15, marginTop: 20, borderRadius: 12, backgroundColor: '#840033', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
              Confirmar resposta
            </button>
          )}

          {/* Explicação */}
          <AnimatePresence>
            {confirmedAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ marginTop: 20, backgroundColor: 'rgba(255,255,255,.06)', borderLeft: '3px solid #FFDC5C', borderRadius: '0 14px 14px 0', padding: 16 }}
              >
                <p style={{ fontSize: 13, color: '#FFDC5C', fontWeight: 700, marginBottom: 8 }}>✦ Explicação</p>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>{answered?.isCorrect === false ? '✗ Incorreto. ' : '✓ Correto! '}{currentQ.explanation}</p>
                <div style={{ textAlign: 'right', marginTop: 12 }}>
                  <button onClick={handleNext} style={{ backgroundColor: '#531A61', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Arial, sans-serif' }}>
                    {currentIndex < total - 1 ? 'Próxima questão →' : 'Ver resultado →'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Coluna direita — painel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Cronômetro */}
          <div style={{ backgroundColor: '#FFDC5C', borderRadius: 20, padding: 20 }}>
            <p style={{ fontSize: 11, color: 'rgba(83,26,97,.6)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>TEMPO RESTANTE</p>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 44, fontWeight: 700, color: '#531A61', letterSpacing: '-0.04em', lineHeight: 1 }}>{formatTime(timeLeft)}</div>
            <p style={{ fontSize: 12, color: 'rgba(83,26,97,.6)', marginTop: 6 }}>{formatTime(timeLeft)} RESTAM · {formatTime(3000)} TOTAL</p>
          </div>

          {/* Progresso */}
          <div style={{ backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 20, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '.1em', textTransform: 'uppercase' }}>RESPONDIDAS</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>{Object.keys(answeredMap).length}/{total}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '.1em', textTransform: 'uppercase' }}>MARCADAS</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>{markedForReview.size}</p>
              </div>
            </div>
          </div>

          {/* Navegar */}
          <div style={{ backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 20, padding: 20 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>Navegar questões</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {questions.map((q, i) => {
                const ans = answeredMap[q.id]
                const isCurrentQ = i === currentIndex
                const isMarked = markedForReview.has(q.id)
                let bg = 'rgba(255,255,255,.08)'
                if (ans) bg = ans.isCorrect ? '#531A61' : '#840033'
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(i)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: isCurrentQ ? '2px solid #FFDC5C' : isMarked ? '2px solid rgba(255,220,92,.4)' : '2px solid transparent',
                      backgroundColor: bg, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                    }}
                  >{i + 1}</button>
                )
              })}
            </div>
          </div>

          {/* Respira */}
          <div style={{ backgroundColor: 'rgba(255,220,92,.08)', borderRadius: 20, padding: 16 }}>
            <p style={{ fontSize: 12, color: '#FFDC5C', fontWeight: 700, marginBottom: 6 }}>✦ RESPIRA</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.5 }}>
              Você no ritmo certo — 1min por questão é o seu melhor desta semana.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .quiz-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
