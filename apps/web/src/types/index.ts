export interface SubjectBreakdownItem {
  subjectId: string
  subjectName: string
  score: number
  delta: number
}

export interface HistoryPoint {
  month: string
  score: number
}

export interface IndexData {
  score: number
  faixa: string
  subjectBreakdown: SubjectBreakdownItem[]
  percentile: number | null
  delta7d: number
  history: HistoryPoint[]
  /** Só no ENEM. */
  tri: TriIndex | null
}

export interface TriAreaScore {
  area: 'LC' | 'CH' | 'CN' | 'MT'
  label: string
  score: number | null
  margin: number | null
  items: number
  correct: number
  needed: number
}

/** Índice Kuaa do ENEM: nota TRI estimada por área com as questões oficiais respondidas. */
export interface TriIndex {
  overall: number | null
  areas: TriAreaScore[]
  totalItems: number
  delta7d: number | null
  history: HistoryPoint[]
}
