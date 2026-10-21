import { Link } from 'react-router-dom'
import KuaaLogo from '../components/ui/KuaaLogo'
import { useAuthStore } from '../stores/auth.store'
import './Home.css'

export default function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const firstVestibularSlug = useAuthStore((state) => state.firstVestibularSlug)
  const trailHref = firstVestibularSlug ? `/trilha/${firstVestibularSlug}` : '/trilha'

  return (
    <div className="home-page">
      <header className="home-header">
        <Link to="/" aria-label="Kuaa, início"><KuaaLogo size={38} /></Link>
        <nav aria-label="Acesso">
          {isAuthenticated ? <Link className="home-header-action" to={trailHref}>Minha trilha</Link> : <>
            <Link to="/entrar">Entrar</Link>
            <Link className="home-header-action" to="/cadastro">Criar conta</Link>
          </>}
        </nav>
      </header>

      <main>
        <section className="home-hero" aria-labelledby="home-title">
          <img className="home-mascot" src="/kuaa-logo.png" alt="" aria-hidden="true" />
          <div className="home-hero-content">
            <h1 id="home-title">Kuaa</h1>
            <p className="home-tagline">Conhecimento que abre asas.</p>
            <p className="home-description">Escolha seu vestibular, descubra o que precisa estudar e avance com aulas, questões e simulados.</p>
            <div className="home-actions">
              <Link className="home-primary-action" to={isAuthenticated ? trailHref : '/cadastro'}>{isAuthenticated ? 'Continuar estudando' : 'Começar a estudar'} <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
              {!isAuthenticated && <Link className="home-secondary-action" to="/entrar">Já tenho conta</Link>}
            </div>
          </div>
        </section>

        <section className="home-how" aria-labelledby="home-how-title">
          <div className="home-how-inner">
            <div><p className="home-overline">Seu estudo</p><h2 id="home-how-title">Um caminho claro até a prova</h2></div>
            <ol>
              <li><span>01</span><div><strong>Escolha a prova</strong><p>ENEM, FUVEST ou UNICAMP.</p></div></li>
              <li><span>02</span><div><strong>Veja seu ponto de partida</strong><p>Um diagnóstico inicial orienta sua trilha.</p></div></li>
              <li><span>03</span><div><strong>Estude e pratique</strong><p>Revise as respostas e acompanhe seu progresso.</p></div></li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  )
}
