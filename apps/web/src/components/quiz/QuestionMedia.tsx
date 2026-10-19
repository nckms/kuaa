import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bar, BarChart, CartesianGrid, LabelList, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { QuestionMediaData, QuestionVisual } from '../../types/quiz'
import './QuestionMedia.css'

export function safeQuestionImageUrl(value?: string | null): string | null {
  if (!value || /[\s\\]/.test(value)
    || Array.from(value).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return null
  try {
    const local = value.startsWith('/question-media/')
    if (!local && !/^https:\/\//i.test(value)) return null
    if (local && /%(?:2f|5c|25)/i.test(value.split(/[?#]/)[0])) return null
    const url = new URL(value, 'https://question-media.invalid')
    if (url.protocol !== 'https:' || url.username || url.password) return null
    if (local && !url.pathname.startsWith('/question-media/')) return null
    return local ? `${url.pathname}${url.search}${url.hash}` : url.href
  } catch {
    return null
  }
}

function QuestionImage({ src, alt, caption }: { src: string; alt: string; caption?: string | null }) {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [modalFailed, setModalFailed] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const captionId = useId()

  useEffect(() => {
    if (!expanded) return
    const element = dialog.current
    if (!element) return
    const previousOverflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      trigger.current?.focus()
    }
  }, [expanded])

  const retry = () => {
    setFailed(false)
    setModalFailed(false)
    setAttempt((current) => current + 1)
  }

  return (
    <figure className="question-media__figure">
      <div className="question-media__image-frame">
        {failed ? (
          <div className="question-media__failure" role="status">
            <p>Não foi possível carregar a imagem.</p>
            <button type="button" className="question-media__button" onClick={retry}>
              <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <img key={attempt} src={src} alt={alt} aria-describedby={caption ? captionId : undefined}
              onError={() => setFailed(true)} />
            <button ref={trigger} type="button" className="question-media__zoom question-media__button"
              title="Ampliar imagem" aria-label="Ampliar imagem" onClick={() => setExpanded(true)}>
              <i className="bi bi-arrows-fullscreen" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {caption && <figcaption id={captionId}>{caption}</figcaption>}
      {expanded && createPortal(
        <dialog ref={dialog} className="question-media__dialog" aria-label="Imagem da questão ampliada"
          onCancel={() => setExpanded(false)} onClose={() => setExpanded(false)}>
          <div className="question-media__dialog-toolbar">
            <button type="button" autoFocus className="question-media__button" title="Fechar imagem"
              aria-label="Fechar imagem" onClick={() => setExpanded(false)}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>
          <div className="question-media__dialog-content">
            {modalFailed ? <div className="question-media__failure" role="status">
              <p>Não foi possível carregar a imagem.</p>
              <button type="button" className="question-media__button" onClick={retry}>
                <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Tentar novamente
              </button>
            </div> : <img key={attempt} src={src} alt={alt} onError={() => setModalFailed(true)} />}
            {caption && <p>{caption}</p>}
          </div>
        </dialog>, document.body,
      )}
    </figure>
  )
}

function QuestionChart({ visual }: { visual: QuestionVisual }) {
  const titleId = useId()
  const descriptionId = useId()
  const numericXAxis = visual.type === 'line' && visual.points.length > 0
    && visual.points.every((point) => point.label.trim() !== '' && Number.isFinite(Number(point.label)))
  const chartPoints = numericXAxis
    ? visual.points.map((point) => ({ ...point, xValue: Number(point.label) }))
    : visual.points
  const axes = <>
    <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
    {numericXAxis ? (
      <XAxis type="number" dataKey="xValue" scale="linear" domain={['dataMin', 'dataMax']}
        stroke="#4b5563" tick={{ fontSize: 12 }} height={50} minTickGap={12} />
    ) : (
      <XAxis type="category" dataKey="label" stroke="#4b5563" tick={{ fontSize: 12 }} height={50} minTickGap={12} />
    )}
    <YAxis stroke="#4b5563" tick={{ fontSize: 12 }} width={48} />
    <Tooltip />
  </>
  return (
    <figure className="question-media__figure">
      <figcaption id={titleId} className="question-media__chart-title">{visual.title}</figcaption>
      <p className="question-media__axis-label">
        {visual.yLabel}
      </p>
      <p id={descriptionId} className="question-media__sr-only">
        Gráfico de {visual.type === 'line' ? 'linhas' : 'barras'}. Eixo horizontal: {visual.xLabel}.
        Eixo vertical: {visual.yLabel}. {visual.points.length} pontos.
      </p>
      <div className="question-media__chart" role="img" aria-labelledby={titleId}
        aria-describedby={descriptionId}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          {visual.type === 'line' ? (
            <LineChart data={chartPoints} margin={{ top: 28, right: 28, bottom: 0, left: 0 }} accessibilityLayer>
              {axes}
              <Line type="linear" dataKey="value" name={visual.yLabel} stroke="#531A61" strokeWidth={2}
                dot={{ r: 4 }} isAnimationActive={false}>
                {visual.points.length <= 8 && <LabelList dataKey="value" position="top" fill="#1f2937" fontSize={12} />}
              </Line>
            </LineChart>
          ) : (
            <BarChart data={visual.points} margin={{ top: 28, right: 28, bottom: 0, left: 0 }} accessibilityLayer>
              {axes}
              <Bar dataKey="value" name={visual.yLabel} fill="#840033" maxBarSize={56} isAnimationActive={false}>
                {visual.points.length <= 8 && <LabelList dataKey="value" position="top" fill="#1f2937" fontSize={12} />}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <p className="question-media__axis-label">{visual.xLabel}</p>
      <details className="question-media__data">
        <summary>Dados do gráfico</summary>
        <table>
          <caption>{visual.title}</caption>
          <thead><tr><th scope="col">{visual.xLabel}</th><th scope="col">{visual.yLabel}</th></tr></thead>
          <tbody>{visual.points.map((point, index) => (
            <tr key={index}><th scope="row">{point.label}</th><td>{point.value}</td></tr>
          ))}</tbody>
        </table>
      </details>
    </figure>
  )
}

export default function QuestionMedia({ imageUrl, imageAlt, imageCaption, visual }: QuestionMediaData) {
  const src = safeQuestionImageUrl(imageUrl)
  if (!imageUrl && !visual) return null
  return (
    <div className="question-media">
      {src ? <QuestionImage key={src} src={src} alt={imageAlt?.trim() || imageCaption?.trim() || 'Imagem da questão'}
        caption={imageCaption} /> : imageUrl ? (
          <figure className="question-media__figure"><p role="status">Imagem indisponível: endereço não permitido.</p></figure>
        ) : null}
      {visual && <QuestionChart visual={visual} />}
    </div>
  )
}
