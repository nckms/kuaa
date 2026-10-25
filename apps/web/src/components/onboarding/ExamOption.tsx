import './ExamOption.css'

const VESTIBULAR_META: Record<string, { color: string; abbr: string; meta: string }> = {
  enem: { color: '#531A61', abbr: 'ENEM', meta: '180 questões · 4 áreas + redação' },
  fuvest: { color: '#840033', abbr: 'FUV', meta: '90 questões na 1ª fase · USP' },
  unicamp: { color: '#28765B', abbr: 'UNI', meta: '72 questões na 1ª fase · redação dupla' },
}

interface Props {
  vestibular: { slug: string; name: string; description?: string }
  selected: boolean
  disabled?: boolean
  note?: string
  compact?: boolean
  onClick: () => void
}

export default function ExamOption({ vestibular, selected, disabled, note, compact, onClick }: Props) {
  const meta = VESTIBULAR_META[vestibular.slug] ?? { color: '#531A61', abbr: vestibular.name.slice(0, 4).toUpperCase(), meta: vestibular.description ?? '' }
  return (
    <button type="button" className={`exam-option${compact ? ' is-compact' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={selected}>
      <span className="exam-option-abbr" style={{ background: meta.color }}>{meta.abbr}</span>
      <span className="exam-option-text"><strong>{vestibular.name}</strong><small>{note ?? meta.meta}</small></span>
      <span className="exam-option-check" aria-hidden="true"><i className="bi bi-check-lg" /></span>
    </button>
  )
}
