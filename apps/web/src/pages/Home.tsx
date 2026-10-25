import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import './Home.css'

const EXAMS = [
  { name: 'ENEM', color: '#531A61', tag: 'NACIONAL', desc: 'Trilha por áreas com foco em interpretação e TRI — e redação com os 5 critérios oficiais.', q: '180', qLabel: 'questões' },
  { name: 'FUVEST', color: '#840033', tag: 'USP', desc: 'Conteúdo mais denso e cobrança de obras literárias. Treino de 1ª e 2ª fase.', q: '90', qLabel: 'questões na 1ª fase' },
  { name: 'UNICAMP', color: '#28765B', tag: 'UNICAMP', desc: 'Questões interdisciplinares e redação com dois gêneros. A trilha prioriza o que mais cai.', q: '72', qLabel: 'questões na 1ª fase' },
]

const STEPS = [
  { icon: 'bi-search', t: 'Faça o diagnóstico', d: 'Questões calibradas mostram onde você está em cada área.' },
  { icon: 'bi-signpost-split', t: 'Siga sua trilha', d: 'Todo dia, o próximo tópico certo. Sem perder tempo com o que você já domina.' },
  { icon: 'bi-graph-up-arrow', t: 'Veja a nota subir', d: 'Simulados semanais atualizam seu Índice Kuaa de 300 a 1000.' },
]

const FEATURES = [
  { t: 'Trilha adaptativa', d: 'Reordena os tópicos conforme seus acertos e erros.', icon: 'bi-signpost-split', tone: 'roxo' },
  { t: 'Sabiá IA', d: 'Tira dúvida a qualquer hora, explica passo a passo e gera questões.', icon: 'bi-stars', tone: 'amarelo' },
  { t: 'Simulado semanal', d: 'Cronometrado, com mapa de questões e gabarito comentado.', icon: 'bi-clipboard-check', tone: 'branco' },
  { t: 'Índice Kuaa', d: 'Uma nota única que mostra o quanto você está perto da aprovação.', icon: 'bi-speedometer2', tone: 'tinta' },
]

export default function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const firstVestibularSlug = useAuthStore((state) => state.firstVestibularSlug)
  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'
  const startHref = isAuthenticated ? trailHref : '/cadastro'

  return (
    <div className="landing">
      <nav className="landing-nav" aria-label="Principal">
        <Link to="/" aria-label="Kuaa, início"><img src="/brand/wordmark-t.png" alt="Kuaa" className="landing-wordmark" /></Link>
        <div className="landing-nav-right">
          <div className="landing-nav-links"><a href="#como-funciona">Como funciona</a><a href="#vestibulares">Vestibulares</a><a href="#recursos">Sabiá IA</a></div>
          {isAuthenticated ? (
            <Link className="landing-nav-cta" to={trailHref}>Minha trilha</Link>
          ) : (
            <>
              <Link className="landing-nav-login" to="/entrar">Entrar</Link>
              <Link className="landing-nav-cta" to="/cadastro">Criar conta</Link>
            </>
          )}
        </div>
      </nav>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <div className="landing-kicker"><span>Grátis</span>ENEM · FUVEST · UNICAMP</div>
            <h1 id="landing-title">Estude o que falta. <span>Pule o que você já sabe.</span></h1>
            <p>Um diagnóstico rápido mostra seus pontos fracos. Daí o Kuaa monta sua trilha do dia — questões, simulados e uma tutora de IA que explica sem enrolar.</p>
            <div className="landing-actions">
              <Link to={startHref} className="k-btn k-btn-primary is-lg has-glow">{isAuthenticated ? 'Continuar estudando' : 'Começar meu diagnóstico'} <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
              {!isAuthenticated && <Link to="/entrar" className="k-btn k-btn-outline is-lg">Já tenho conta</Link>}
            </div>
            <dl className="landing-facts">
              <div><dt>3</dt><dd>vestibulares</dd></div>
              <div><dt>1/dia</dt><dd>tópico recomendado</dd></div>
              <div><dt>300–1000</dt><dd>Índice Kuaa</dd></div>
            </dl>
          </div>
          <div className="landing-hero-art">
            <img src="/brand/owl-light.png" alt="Sabiá, a mascote do Kuaa" />
            <div className="landing-float is-check" aria-hidden="true">
              <span><i className="bi bi-check-lg" /></span>
              <div><strong>Funções do 1º grau</strong><small>dominado · 9/10 acertos</small></div>
            </div>
            <div className="landing-float is-index" aria-hidden="true">
              <small>Índice Kuaa</small>
              <div><strong>712</strong><em>↑ 38</em></div>
            </div>
          </div>
        </section>

        <section id="vestibulares" className="landing-band">
          <div className="landing-inner">
            <p className="k-eyebrow">Escolha sua prova</p>
            <h2 className="landing-h2">Cada vestibular cobra de um jeito. Sua trilha também.</h2>
            <div className="landing-exams">
              {EXAMS.map((exam) => (
                <article key={exam.name} className="landing-exam">
                  <header><span style={{ color: exam.color }}>{exam.name}</span><small>{exam.tag}</small></header>
                  <p>{exam.desc}</p>
                  <footer><strong>{exam.q}</strong><small>{exam.qLabel}</small></footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="landing-inner landing-steps">
          <div><p className="k-eyebrow">Como funciona</p><h2 className="landing-h2">Três passos. Sem enrolação.</h2></div>
          <div className="landing-steps-grid">
            {STEPS.map((step) => (
              <div key={step.t} className="landing-step">
                <span><i className={`bi ${step.icon}`} aria-hidden="true" /></span>
                <strong>{step.t}</strong>
                <p>{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="recursos" className="landing-inner landing-features">
          {FEATURES.map((feature) => (
            <div key={feature.t} className={`landing-feature is-${feature.tone}`}>
              <span><i className={`bi ${feature.icon}`} aria-hidden="true" /></span>
              <div><strong>{feature.t}</strong><p>{feature.d}</p></div>
            </div>
          ))}
        </section>

        <section className="landing-inner landing-final">
          <div className="landing-cta">
            <h2>Descubra seu ponto de partida hoje.</h2>
            <Link to={startHref} className="k-btn k-btn-yellow is-lg">{isAuthenticated ? 'Abrir minha trilha' : 'Criar conta grátis'} <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
          </div>
          <footer className="landing-footer">
            <span>© 2026 Kuaa · Conhecimento que abre asas.</span>
          </footer>
        </section>
      </main>
    </div>
  )
}
