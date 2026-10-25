import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import KuaaMascotLogo from '../../components/ui/KuaaMascotLogo'
import './Auth.css'

export const SIGNUP_STEPS = ['Dados', 'Vestibular', 'Diagnóstico']

interface Props {
  asideTitle: string
  asideText: string
  backTo?: string
  backLabel?: string
  topRight?: ReactNode
  step?: number
  title: string
  subtitle?: ReactNode
  children: ReactNode
}

export default function AuthShell({ asideTitle, asideText, backTo = '/', backLabel = 'Voltar', topRight, step, title, subtitle, children }: Props) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link to="/" aria-label="Kuaa, início"><img src="/brand/wordmark-w.png" alt="Kuaa" className="auth-aside-wordmark" /></Link>
        <div className="auth-aside-body">
          <KuaaMascotLogo size={120} radius={30} className="auth-aside-owl" />
          <h2>{asideTitle}</h2>
          <p>{asideText}</p>
        </div>
        <p className="auth-aside-foot">Conhecimento que abre asas.</p>
      </aside>
      <div className="auth-main">
        <div className="auth-topbar">
          <Link to={backTo} className="auth-back"><i className="bi bi-arrow-left" aria-hidden="true" />{backLabel}</Link>
          {topRight}
        </div>
        <div className="auth-center">
          <div className="auth-card">
            {step !== undefined && (
              <ol className="auth-steps" aria-label={`Etapa ${step + 1} de ${SIGNUP_STEPS.length}`}>
                {SIGNUP_STEPS.map((label, index) => (
                  <li key={label} className={index <= step ? 'is-done' : ''} aria-current={index === step ? 'step' : undefined}><span />{label}</li>
                ))}
              </ol>
            )}
            <h1 className="auth-title">{title}</h1>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
