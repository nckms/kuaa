import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import KuaaLogo from '../components/ui/KuaaLogo'
import AsaGlyph from '../components/ui/AsaGlyph'
import { useAuthStore } from '../stores/auth.store'

const features = [
  {
    title: 'Trilhas com IA',
    desc: 'Conteúdo adaptado ao seu nível, gerado por IA com base no histórico de cada vestibular.',
    color: '#531A61',
    bg: 'rgba(83,26,97,.18)',
    label: 'Adaptativo',
  },
  {
    title: 'Progresso visual',
    desc: 'Acompanhe sua evolução matéria por matéria, com simulados e questões comentadas.',
    color: '#840033',
    bg: 'rgba(132,0,51,.18)',
    label: 'Métricas',
  },
  {
    title: 'Monitores gratuitos',
    desc: 'Acesse monitores estudantis para tirar dúvidas — sem pagar absolutamente nada.',
    color: '#FFDC5C',
    bg: 'rgba(255,220,92,.12)',
    label: 'Comunidade',
  },
]

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const firstVestibularSlug = useAuthStore((s) => s.firstVestibularSlug)
  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'

  return (
    <div style={{ backgroundColor: '#1a0a1f', minHeight: '100vh', fontFamily: "'Questrial', Arial, sans-serif" }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 32px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)', backgroundColor: 'rgba(26,10,31,.85)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <KuaaLogo size={34} dark />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {isAuthenticated ? (
              <Link
                to={trailHref}
                style={{ backgroundColor: '#FFDC5C', color: '#2a0d33', fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 12, padding: '10px 22px', borderRadius: 999, textDecoration: 'none', letterSpacing: '-.02em' }}
              >
                Minha trilha →
              </Link>
            ) : (
              <>
                <Link
                  to="/entrar"
                  style={{ color: 'rgba(255,255,255,.55)', fontSize: 14, textDecoration: 'none', fontWeight: 500, padding: '8px 16px' }}
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  style={{ backgroundColor: '#FFDC5C', color: '#2a0d33', fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 12, padding: '10px 22px', borderRadius: 999, textDecoration: 'none', letterSpacing: '-.02em' }}
                >
                  Cadastrar grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '100px 32px 88px' }}>
        <div style={{ position: 'absolute', right: -80, top: -80, opacity: 0.06, pointerEvents: 'none', color: '#fff' }}>
          <AsaGlyph size={520} tone="mono" />
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div className="k-pill ghost-dark" style={{ marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FFDC5C', flexShrink: 0 }} />
            Para escolas públicas brasileiras · 100% gratuito
          </div>

          <motion.h1
            style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 'clamp(34px, 5.5vw, 68px)', color: '#fff', marginBottom: 24, lineHeight: 1.05, letterSpacing: '-.03em' }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Conhecimento<br />que abre asas
          </motion.h1>

          <motion.p
            style={{ fontSize: 18, color: 'rgba(255,255,255,.55)', marginBottom: 44, lineHeight: 1.7, maxWidth: 500, margin: '0 auto 44px' }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Plataforma gratuita com IA adaptativa, trilhas progressivas e monitores estudantis para ENEM, FUVEST e UNICAMP.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
          >
            <Link
              to="/cadastro"
              style={{ display: 'inline-block', backgroundColor: '#FFDC5C', color: '#2a0d33', fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 15, padding: '18px 40px', borderRadius: 999, textDecoration: 'none', letterSpacing: '-.02em', boxShadow: '0 0 0 6px rgba(255,220,92,.12)' }}
            >
              Começar agora — é grátis
            </Link>
            <p style={{ color: 'rgba(255,255,255,.28)', fontSize: 12, letterSpacing: '.04em' }}>
              SEM CARTÃO · SEM PAYWALL · PARA SEMPRE
            </p>
          </motion.div>
        </div>
      </section>

      {/* Divider stats */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '28px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap' }}>
          {[
            { num: '3', label: 'Vestibulares cobertos' },
            { num: '37+', label: 'Tópicos de estudo' },
            { num: 'R$0', label: 'Custo para o aluno' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 32, color: '#FFDC5C', letterSpacing: '-.045em', lineHeight: 0.92 }}>{s.num}</div>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginTop: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section style={{ backgroundColor: '#2a0d33', padding: '80px 32px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 26, color: '#FFDC5C', textAlign: 'center', marginBottom: 52, letterSpacing: '-.025em' }}>
            Por que o Kuaa?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {features.map((f) => (
              <div key={f.title} style={{ backgroundColor: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '32px 28px' }}>
                <span className="k-pill" style={{ backgroundColor: f.bg, color: f.color, marginBottom: 20 }}>{f.label}</span>
                <h3 style={{ fontFamily: "'Unbounded', sans-serif", color: '#fff', fontSize: 17, fontWeight: 700, marginBottom: 10, letterSpacing: '-.02em' }}>{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <KuaaLogo size={30} dark showTagline />
        </div>
        <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 12, letterSpacing: '.04em' }}>
          © 2025 KUAA · PROJETO ACADÊMICO SEM FINS LUCRATIVOS
        </p>
      </footer>
    </div>
  )
}
