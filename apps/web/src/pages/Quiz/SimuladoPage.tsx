import { useState } from 'react'
import KuaaLogo from '../../components/ui/KuaaLogo'
import KuaaIcon from '../../components/ui/KuaaIcon'

type Alternative = 'A' | 'B' | 'C' | 'D' | 'E'
type QuestionStatus = 'answered' | 'flagged' | 'current' | 'unanswered'

interface QuestionState {
  id: number
  status: QuestionStatus
}

function buildQuestions(): QuestionState[] {
  return Array.from({ length: 45 }, (_, i) => {
    const id = i + 1
    if (id === 18) return { id, status: 'current' }
    if (id <= 17) {
      if (id === 5 || id === 12) return { id, status: 'flagged' }
      return { id, status: 'answered' }
    }
    return { id, status: 'unanswered' }
  })
}

const QUESTIONS = buildQuestions()

const QUESTION_TEXT = `Leia o excerto abaixo, extraído do ensaio "A vertigem do presente", de autoria fictícia para fins avaliativos:`

const BLOCKQUOTE = `"A velocidade com que o mundo contemporâneo processa informações excede, em muito, a capacidade humana de assimilar significados. Vivemos numa era em que o excesso de dados coexiste paradoxalmente com a escassez de sentido — fenômeno que Lipovetsky denominou de 'hiperestimulação cognitiva'." `

const QUESTION = `De acordo com o texto e com os princípios da análise crítica do discurso, a expressão 'hiperestimulação cognitiva' é empregada para:`

const ALTERNATIVES: { key: Alternative; text: string }[] = [
  { key: 'A', text: 'descrever um processo de ampliação da inteligência coletiva mediada por tecnologias digitais.' },
  { key: 'B', text: 'caracterizar o paradoxo entre a abundância informacional e a redução da capacidade de produção de sentido.' },
  { key: 'C', text: 'criticar o uso excessivo de dispositivos móveis como causa principal da crise educacional contemporânea.' },
  { key: 'D', text: 'indicar que a velocidade do processamento tecnológico superou os limites biológicos da cognição humana.' },
  { key: 'E', text: 'defender a necessidade de regulamentação das plataformas digitais para conter o excesso de informação.' },
]

function getStatusColor(status: QuestionStatus): string {
  switch (status) {
    case 'answered': return '#531A61'
    case 'flagged': return '#FFDC5C'
    case 'current': return '#840033'
    case 'unanswered': return 'rgba(26,10,31,.08)'
  }
}

function getStatusTextColor(status: QuestionStatus): string {
  switch (status) {
    case 'answered': return '#fff'
    case 'flagged': return '#2a0d33'
    case 'current': return '#fff'
    case 'unanswered': return 'var(--k-tinta-3)'
  }
}

export default function SimuladoPage() {
  const [selected, setSelected] = useState<Alternative>('B')
  const [flagged, setFlagged] = useState(false)

  const progress = (18 / 45) * 100

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--k-creme)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Questrial', Arial, sans-serif",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: 'var(--k-roxo-deep)',
          padding: '0 32px',
          height: 62,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexShrink: 0,
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KuaaLogo size={32} dark />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.15)' }} />
          <span
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 600,
              fontSize: 12,
              color: 'rgba(255,255,255,.7)',
              letterSpacing: '.05em',
            }}
          >
            ENEM 2025 · Simulado Completo
          </span>
        </div>

        {/* Center progress */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, maxWidth: 480, margin: '0 auto' }}>
          <div
            style={{
              flex: 1,
              height: 6,
              background: 'rgba(255,255,255,.12)',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg,#840033,#531A61,#FFDC5C)',
                borderRadius: 999,
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: '#FFDC5C',
              whiteSpace: 'nowrap',
            }}
          >
            17 / 45
          </span>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,.2)',
              background: 'transparent',
              color: 'rgba(255,255,255,.7)',
              fontFamily: "'Unbounded', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              letterSpacing: '.08em',
            }}
          >
            <KuaaIcon name="pause" size={14} color="rgba(255,255,255,.7)" />
            pausar
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,220,92,.15)',
              color: '#FFDC5C',
              fontFamily: "'Unbounded', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '.08em',
            }}
          >
            finalizar
          </button>
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          padding: '24px 32px 16px',
          borderBottom: '1px solid var(--k-line)',
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 500,
              fontSize: 11,
              color: 'var(--k-tinta-3)',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
            }}
          >
            questão 18 de 45
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              color: 'var(--k-tinta)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Interpretação de texto · ensaios contemporâneos
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFlagged((f) => !f)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid var(--k-line-2)',
                background: flagged ? 'var(--k-amarelo-soft)' : '#fff',
                color: flagged ? 'var(--k-tinta)' : 'var(--k-tinta-3)',
                fontSize: 11,
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 500,
                cursor: 'pointer',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
              }}
            >
              <KuaaIcon name="flag" size={13} color={flagged ? '#840033' : 'var(--k-tinta-3)'} />
              marcar p/ revisar
            </button>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid var(--k-line-2)',
                background: '#fff',
                color: 'var(--k-tinta-3)',
                fontSize: 11,
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 500,
                cursor: 'pointer',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
              }}
            >
              <KuaaIcon name="sparkle" size={13} color="var(--k-roxo)" />
              dica do prof.
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 20,
          padding: '24px 32px',
          alignItems: 'start',
        }}
      >
        {/* Question card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '32px 36px',
            boxShadow: 'var(--k-shadow-sm)',
          }}
        >
          {/* Text base */}
          <p style={{ color: 'var(--k-tinta-2)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            {QUESTION_TEXT}
          </p>

          {/* Blockquote */}
          <blockquote
            style={{
              borderLeft: '3px solid #840033',
              paddingLeft: 20,
              margin: '0 0 24px',
            }}
          >
            <p
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--k-tinta)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {BLOCKQUOTE}
            </p>
          </blockquote>

          {/* Question */}
          <p
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--k-tinta)',
              letterSpacing: '-0.02em',
              lineHeight: 1.5,
              marginBottom: 28,
            }}
          >
            {QUESTION}
          </p>

          {/* Alternatives */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ALTERNATIVES.map(({ key, text }) => {
              const isSelected = selected === key
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '14px 18px',
                    borderRadius: 12,
                    border: '1.5px solid',
                    borderColor: isSelected ? '#840033' : 'var(--k-line-2)',
                    background: isSelected ? 'rgba(132,0,51,.06)' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all .12s',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: isSelected ? '#840033' : 'var(--k-creme)',
                      color: isSelected ? '#fff' : 'var(--k-tinta-3)',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: "'Unbounded', sans-serif",
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {key}
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      color: isSelected ? 'var(--k-tinta)' : 'var(--k-tinta-2)',
                      lineHeight: 1.55,
                      paddingTop: 3,
                    }}
                  >
                    {text}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Bottom nav */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 28,
              paddingTop: 20,
              borderTop: '1px solid var(--k-line)',
            }}
          >
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                border: '1px solid var(--k-line-2)',
                background: '#fff',
                color: 'var(--k-tinta-2)',
                fontFamily: "'Unbounded', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                letterSpacing: '.05em',
              }}
            >
              ← anterior
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <KuaaIcon name="clock" size={14} color="var(--k-tinta-3)" />
              <span style={{ fontSize: 12, color: 'var(--k-tinta-3)', fontFamily: "'Unbounded', sans-serif" }}>
                1m 12s nesta questão
              </span>
            </div>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--k-roxo-deep)',
                color: '#FFDC5C',
                fontFamily: "'Unbounded', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '.05em',
              }}
            >
              próxima →
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Timer */}
          <div
            style={{
              background: 'var(--k-amarelo)',
              borderRadius: 18,
              padding: '22px 24px',
            }}
          >
            <div
              style={{
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 700,
                fontSize: 54,
                color: 'var(--k-roxo-deep)',
                letterSpacing: '-0.045em',
                lineHeight: 0.92,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              32:18
            </div>
            <div
              style={{
                height: 6,
                background: 'rgba(26,10,31,.12)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '64%',
                  height: '100%',
                  background: 'var(--k-vinho)',
                  borderRadius: 999,
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--k-tinta-2)', textAlign: 'center', marginTop: 8 }}>
              tempo restante
            </div>
          </div>

          {/* Mini stats */}
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '18px 20px',
              boxShadow: 'var(--k-shadow-sm)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 700,
                  fontSize: 28,
                  color: 'var(--k-roxo)',
                  letterSpacing: '-0.04em',
                }}
              >
                17
              </div>
              <div style={{ fontSize: 11, color: 'var(--k-tinta-3)' }}>respondidas</div>
              <div style={{ fontSize: 10, color: 'var(--k-tinta-3)' }}>de 45</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: "'Unbounded', sans-serif",
                  fontWeight: 700,
                  fontSize: 28,
                  color: '#FFDC5C',
                  letterSpacing: '-0.04em',
                }}
              >
                02
              </div>
              <div style={{ fontSize: 11, color: 'var(--k-tinta-3)' }}>marcadas</div>
              <div style={{ fontSize: 10, color: 'var(--k-tinta-3)' }}>p/ revisar</div>
            </div>
          </div>

          {/* Question grid */}
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '18px 20px',
              boxShadow: 'var(--k-shadow-sm)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 500,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: 'var(--k-tinta-3)',
                marginBottom: 12,
              }}
            >
              mapa de questões
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(9, 1fr)',
                gap: 4,
              }}
            >
              {QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 5,
                    background: getStatusColor(q.status),
                    border: q.status === 'current' ? '2px solid #FFDC5C' : '2px solid transparent',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 8,
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 700,
                    color: getStatusTextColor(q.status),
                    cursor: 'pointer',
                  }}
                >
                  {q.id}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { color: '#531A61', label: 'respondida', textColor: '#fff' },
                { color: '#FFDC5C', label: 'marcada', textColor: '#2a0d33' },
                { color: '#840033', label: 'atual', textColor: '#fff' },
                { color: 'rgba(26,10,31,.08)', label: 'pendente', textColor: 'var(--k-tinta-3)' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: 'var(--k-tinta-3)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip card */}
          <div
            style={{
              background: 'var(--k-roxo-deep)',
              borderRadius: 16,
              padding: '20px 22px',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 700,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: 'var(--k-amarelo)',
                marginBottom: 10,
              }}
            >
              respira ✦
            </div>
            <p
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 14,
                color: 'rgba(255,255,255,.8)',
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              "Você já respondeu 17 questões — isso é mais da metade. Confie no seu preparo e
              elimine as alternativas absurdas primeiro."
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
