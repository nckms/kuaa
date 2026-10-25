export interface SubjectTheme {
  color: string
  soft: string
}

const THEMES: Record<string, SubjectTheme> = {
  redacao: { color: '#840033', soft: '#F8E7EC' },
  portugues: { color: '#531A61', soft: '#F3EAF6' },
  'lingua-portuguesa': { color: '#531A61', soft: '#F3EAF6' },
  linguagens: { color: '#531A61', soft: '#F3EAF6' },
  matematica: { color: '#2F5BD3', soft: '#E8EEFC' },
  fisica: { color: '#C2551F', soft: '#FBEDE5' },
  quimica: { color: '#0E7F80', soft: '#E3F3F3' },
  biologia: { color: '#28765B', soft: '#E6F2EC' },
  'ciencias-natureza': { color: '#28765B', soft: '#E6F2EC' },
  historia: { color: '#8E5A1E', soft: '#F5ECE0' },
  'ciencias-humanas': { color: '#8E5A1E', soft: '#F5ECE0' },
  geografia: { color: '#4E7A1C', soft: '#ECF3E2' },
  ingles: { color: '#B8336E', soft: '#F9E6EF' },
  espanhol: { color: '#B8336E', soft: '#F9E6EF' },
  filosofia: { color: '#5646B8', soft: '#ECEAF9' },
  sociologia: { color: '#A3721A', soft: '#F6EEDD' },
  artes: { color: '#B8336E', soft: '#F9E6EF' },
  'educacao-fisica': { color: '#C2551F', soft: '#FBEDE5' },
  atualidades: { color: '#4E7A1C', soft: '#ECF3E2' },
}

const FALLBACK: SubjectTheme[] = [
  { color: '#531A61', soft: '#F3EAF6' },
  { color: '#2F5BD3', soft: '#E8EEFC' },
  { color: '#0E7F80', soft: '#E3F3F3' },
  { color: '#8E5A1E', soft: '#F5ECE0' },
  { color: '#B8336E', soft: '#F9E6EF' },
]

export function subjectTheme(slug?: string | null, index = 0): SubjectTheme {
  return (slug && THEMES[slug]) || FALLBACK[index % FALLBACK.length]!
}

/** Tenta casar um nome de matéria ("Matemática") com o tema pelo slug derivado. */
export function subjectThemeByName(name: string, index = 0): SubjectTheme {
  const slug = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, '-')
  return subjectTheme(slug, index)
}
