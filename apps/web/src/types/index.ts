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
}
