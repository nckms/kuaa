import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import './Home.css'
import InstallAppCard from '../components/InstallAppCard'

const EXAMPLE = [
  { topic: 'Interpretação de texto', area: 'Linguagens', correct: 2, total: 5, action: 'Revisar tópico', state: 'review' },
  { topic: 'Funções do 1º grau', area: 'Matemática', correct: 4, total: 5, action: 'Avançar', state: 'next' },
  { topic: 'Cinemática', area: 'Física', correct: null, total: 5, action: 'Ainda bloqueado', state: 'locked' },
] as const

const STEPS = [
  { t: 'Diagnóstico', d: '12 questões de níveis diferentes mostram por onde começar em cada área.' },
  { t: 'Trilha', d: 'Regras simples olham seus acertos recentes: abaixo do esperado, o tópico volta para revisão; acima, você avança e a dificuldade sobe.' },
  { t: 'Questões reais', d: 'A prática usa questões oficiais do ENEM de 2009 a 2023, com ano e número da prova. Cada erro vem com explicação (escrita com apoio de IA, sempre com o gabarito oficial).' },
]

export default function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const firstVestibularSlug = useAuthStore((state) => state.firstVestibularSlug)
  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'
  const startHref = isAuthenticated ? trailHref : '/cadastro'
  const startLabel = isAuthenticated ? 'Continuar estudando' : 'Começar diagnóstico'

  return (
    <div className="kl">
      <header className="kl-top">
        <Link to="/" className="kl-brand" aria-label="Kuaa, início"><img src="/brand/wordmark-w.webp" alt="Kuaa" /></Link>
        {isAuthenticated
          ? <Link to={trailHref} className="kl-login">Minha trilha</Link>
          : <Link to="/entrar" className="kl-login">Entrar</Link>}
      </header>

      <main>
        <section className="kl-hero" aria-labelledby="kl-title">
          <div className="kl-hero-copy">
            <p className="kl-exams" aria-label="Vestibulares atendidos">
              <span>ENEM</span><span>FUVEST</span><span>UNICAMP</span>
            </p>
            <h1 id="kl-title">Descubra o que <mark>revisar</mark> para o seu vestibular.</h1>
            <p className="kl-lead">Você responde a um diagnóstico curto. O Kuaa usa seus acertos e erros para indicar o próximo tópico e pratica com <strong>mais de 2.700 questões reais do ENEM</strong>, com explicação em cada erro. Começar é gratuito.</p>
            <div className="kl-actions">
              <Link to={startHref} className="kl-cta">{startLabel}<i className="bi bi-arrow-right" aria-hidden="true" /></Link>
              {!isAuthenticated && <p className="kl-has-account">Já tem conta? <Link to="/entrar">Entrar</Link></p>}
            </div>
          </div>

          <div className="kl-art">
          <img className="kl-owl" src="/brand/owl-light.webp" width={330} height={470} alt="Sabiá, a mascote do Kuaa" />
          <figure className="kl-sheet" aria-labelledby="kl-sheet-cap">
            <div className="kl-sheet-head">
              <span>Sua trilha</span>
              <small>exemplo</small>
            </div>
            <ol className="kl-rows">
              {EXAMPLE.map((row) => (
                <li key={row.topic} className={`is-${row.state}`}>
                  <div className="kl-row-main">
                    <strong>{row.topic}</strong>
                    <small>{row.area}</small>
                  </div>
                  <span className="kl-score">{row.correct == null ? '—' : `${row.correct} de ${row.total} acertos`}</span>
                  <span className="kl-next">{row.state !== 'locked' && <i className="bi bi-arrow-right" aria-hidden="true" />}{row.action}</span>
                </li>
              ))}
            </ol>
            <figcaption id="kl-sheet-cap">Exemplo ilustrativo. Não são dados seus.</figcaption>
          </figure>
          </div>
        </section>

        <section className="kl-how" aria-labelledby="kl-how-title">
          <h2 id="kl-how-title">Como funciona</h2>
          <ol className="kl-steps">
            {STEPS.map((step, index) => (
              <li key={step.t}>
                <span className="kl-step-n" aria-hidden="true">{index + 1}</span>
                <div><h3>{step.t}</h3><p>{step.d}</p></div>
              </li>
            ))}
          </ol>
          <p className="kl-note">
            O Sabiá, assistente de IA, tira dúvidas sem entregar a resposta pronta. O Índice Kuaa estima sua nota do ENEM em cada área pela TRI, com os parâmetros oficiais do INEP, a partir das questões que você resolve. Não é a nota oficial nem previsão de aprovação.
          </p>
        </section>

        <section className="kl-end" aria-label="Começar">
          <p>Leva poucos minutos e você sai com um tópico para estudar hoje.</p>
          <Link to={startHref} className="kl-cta">{startLabel}<i className="bi bi-arrow-right" aria-hidden="true" /></Link>
        </section>
      </main>

      <footer className="kl-foot">
        <img src="/brand/wordmark-t.webp" alt="Kuaa" />
        <Link to="/planos" className="kl-foot-link">Planos</Link>
        <Link to="/termos" className="kl-foot-link">Termos</Link>
        <Link to="/privacidade" className="kl-foot-link">Privacidade</Link>
        <InstallAppCard compact />
      </footer>
    </div>
  )
}
