import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { SessionSummary } from '../../types/quiz'
import ProgressBar from '../../components/ui/ProgressBar'

const WingGlyph = () => (
  <svg width="56" height="48" viewBox="0 0 28 24" fill="none">
    <path d="M2 20 C6 12 14 8 26 4 C20 10 18 16 20 22 C14 18 8 18 2 20Z" fill="#FFDC5C" opacity="0.9"/>
    <path d="M2 20 C8 16 14 14 20 22 C14 22 8 22 2 20Z" fill="#FFDC5C" opacity="0.5"/>
  </svg>
)

function useCountUp(target: number, duration: number, active: boolean): number {
  const [count, setCount] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    let raf: number
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.round(target * progress))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, active])

  return count
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const summary = location.state as SessionSummary | null

  const [animating, setAnimating] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimating(true), 300); return () => clearTimeout(t) }, [])

  const xpCount = useCountUp(summary?.xpEarned ?? 0, 1200, animating)

  if (!summary) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#2a0d33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, Arial, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,.6)', marginBottom: 16 }}>Resultado não encontrado.</p>
          <button onClick={() => navigate('/trilha')} style={{ backgroundColor: '#531A61', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontFamily: 'Inter, Arial, sans-serif' }}>Voltar à trilha</button>
        </div>
      </div>
    )
  }

  const { topicName, vestibularSlug, correct, wrong, isPerfect, accuracy, newMasteryLevel, newAchievements, levelUp, newLevel, questions } = summary

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#2a0d33', fontFamily: 'Inter, Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ maxWidth: 520, width: '90%', textAlign: 'center', padding: '60px 24px' }}
      >
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <WingGlyph />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: animating ? 1 : 0, scale: animating ? 1 : 0.8 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 72, fontWeight: 700, color: '#FFDC5C', letterSpacing: '-0.045em', lineHeight: 0.9, marginTop: 24, marginBottom: 8 }}
        >
          +{xpCount} XP
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 26, color: '#fff', marginBottom: 8 }}>Sessão concluída!</p>
          <span style={{ backgroundColor: '#840033', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 999 }}>{topicName}</span>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 32, marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 24, color: '#10b981' }}>✓</span>
              <p style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, color: '#fff', fontWeight: 700, letterSpacing: '-0.04em', margin: '4px 0 2px' }}>{correct}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>corretas</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 24, color: '#840033' }}>✗</span>
              <p style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, color: '#fff', fontWeight: 700, letterSpacing: '-0.04em', margin: '4px 0 2px' }}>{wrong}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>erradas</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 24, color: '#FFDC5C' }}>⚡</span>
              <p style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, color: '#fff', fontWeight: 700, letterSpacing: '-0.04em', margin: '4px 0 2px' }}>{Math.round(accuracy * 100)}%</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>acerto</p>
            </div>
          </div>

          {isPerfect && (
            <div style={{ backgroundColor: 'rgba(255,220,92,.15)', border: '1px solid #FFDC5C', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 17, color: '#FFDC5C' }}>Sessão perfeita! 100% de acerto</p>
            </div>
          )}

          {levelUp && (
            <div style={{ backgroundColor: 'rgba(83,26,97,.4)', border: '1px solid #531A61', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 17, color: '#fff' }}>Você subiu para o Nível {newLevel}!</p>
            </div>
          )}

          {newAchievements.map((a) => (
            <div key={a.slug} style={{ backgroundColor: 'rgba(255,220,92,.08)', borderLeft: '3px solid #FFDC5C', borderRadius: '0 12px 12px 0', padding: 14, marginBottom: 10, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: "'Questrial', sans-serif", fontSize: 15, color: '#FFDC5C' }}>{a.name}</p>
                {a.xpBonus > 0 && <span style={{ backgroundColor: 'rgba(255,220,92,.2)', color: '#FFDC5C', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>+{a.xpBonus} XP</span>}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{a.description}</p>
            </div>
          ))}

          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>Nível de maestria: {newMasteryLevel}/5</p>
            <div style={{ maxWidth: 280, margin: '0 auto' }}>
              <ProgressBar value={newMasteryLevel / 5 * 100} color="amarelo" size="md" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
            <button
              onClick={() => navigate(`/revisao/${sessionId}`, { state: { questions, topicName, vestibularSlug, correct, total: correct + wrong + summary.skipped, accuracy } })}
              style={{ width: '100%', padding: 14, borderRadius: 12, backgroundColor: 'transparent', border: '1.5px solid rgba(255,255,255,.25)', color: '#fff', cursor: 'pointer', fontSize: 15, fontFamily: 'Inter, Arial, sans-serif' }}
            >
              Revisar respostas
            </button>
            <button
              onClick={() => navigate(`/trilha/${vestibularSlug}`)}
              style={{ width: '100%', padding: 14, borderRadius: 12, backgroundColor: '#840033', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'Inter, Arial, sans-serif' }}
            >
              Voltar à trilha
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
