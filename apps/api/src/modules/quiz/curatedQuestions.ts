import humanities from '../../data/curated-humanities.json'
import science from '../../data/curated-science.json'
import type { GeneratedQuestion } from './quiz.types'
import { getQuestionMedia } from './questionMedia'
import { visualQuestions } from '../../data/curated-visual'
import { enemQuestions } from '../../data/curated-enem'
import { enemHumanitiesQuestions } from '../../data/curated-enem-humanities'
import { enemLanguagesQuestions } from '../../data/curated-enem-languages'

export interface CuratedQuestion extends GeneratedQuestion {
  id: string
  topicTags: string[]
}

export const curatedQuestions: CuratedQuestion[] = [...humanities, ...science, ...enemQuestions, ...enemHumanitiesQuestions, ...enemLanguagesQuestions, ...visualQuestions]
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-_]/g, ' ')

export function getCuratedQuestions(topicName: string): CuratedQuestion[] {
  const topic = normalize(topicName)
  return curatedQuestions.filter((question) => question.topicTags.some((tag) => topic.includes(normalize(tag))))
}

export function generateCuratedQuestions(data: { topicName: string; userMasteryLevel: number; targetDifficulty?: number; questionCount: number; recentQuestionBodies?: string[] }): GeneratedQuestion[] {
  const matches = getCuratedQuestions(data.topicName)
  const target = Math.max(1, Math.min(5, data.targetDifficulty ?? data.userMasteryLevel))
  const seen = new Set(data.recentQuestionBodies ?? [])
  const shuffled = matches.map((question) => ({ question, random: Math.random() }))
    .sort((a, b) => Number(seen.has(a.question.body)) - Number(seen.has(b.question.body))
      || Math.abs(a.question.difficulty - target)
      - Math.abs(b.question.difficulty - target) || a.random - b.random)
  const selected = shuffled.slice(0, data.questionCount)
  const visual = shuffled.find(({ question }) => (question.visual || question.imageUrl)
    && !seen.has(question.body) && Math.abs(question.difficulty - target) <= 1)
  if (visual && selected.length && !selected.some(({ question }) => question.visual || question.imageUrl)) {
    selected[selected.length - 1] = visual
  }
  // A shorter distinct session is preferable to padding it with repeated questions.
  return selected.map(({ question }) => ({
    ...getQuestionMedia(question),
    body: question.body,
    options: question.options.map((option) => ({ ...option })),
    explanation: question.explanation,
    difficulty: question.difficulty,
  }))
}
