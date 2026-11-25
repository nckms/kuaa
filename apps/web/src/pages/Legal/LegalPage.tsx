import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './Legal.css'

// Preencher antes de abrir a venda (ver docs/lancamento.md).
export const LEGAL = {
  responsible: 'Nicolas Martins (responsável pelo Kuaa)',
  contact: 'pelo e-mail de contato que será publicado aqui antes da abertura das assinaturas',
  updatedAt: '25 de novembro de 2026',
}

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return <div className="legal">
    <header className="legal-top">
      <Link to="/"><img src="/brand/wordmark-t.png" alt="Kuaa" height={28} /></Link>
      <nav><Link to="/termos">Termos</Link><Link to="/privacidade">Privacidade</Link><Link to="/planos">Planos</Link></nav>
    </header>
    <main className="legal-main">
      <p className="legal-draft" role="note"><strong>Versão preliminar.</strong> Este texto está em revisão jurídica e pode mudar; mudanças relevantes serão avisadas no app.</p>
      <h1>{title}</h1>
      <p className="legal-updated">Atualizado em {LEGAL.updatedAt}</p>
      {children}
    </main>
  </div>
}
