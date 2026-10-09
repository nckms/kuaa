import humanities from '../../data/curated-humanities.json'
import science from '../../data/curated-science.json'
import type { GeneratedQuestion } from './quiz.types'

export interface CuratedQuestion extends GeneratedQuestion {
  id: string
  topicTags: string[]
}

export const curatedQuestions: CuratedQuestion[] = [...humanities, ...science]
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-_]/g, ' ')

export function getCuratedQuestions(topicName: string): CuratedQuestion[] {
  const topic = normalize(topicName)
  return curatedQuestions.filter((question) => question.topicTags.some((tag) => topic.includes(normalize(tag))))
}

export function generateCuratedQuestions(data: { topicName: string; userMasteryLevel: number; questionCount: number }): GeneratedQuestion[] {
  const matches = getCuratedQuestions(data.topicName)
  const shuffled = matches.map((question) => ({ question, random: Math.random() }))
    .sort((a, b) => Math.abs(a.question.difficulty - Math.max(1, data.userMasteryLevel))
      - Math.abs(b.question.difficulty - Math.max(1, data.userMasteryLevel)) || a.random - b.random)
  // A shorter distinct session is preferable to padding it with repeated questions.
  return shuffled.slice(0, data.questionCount).map(({ question }) => ({
    body: question.body,
    options: question.options.map((option) => ({ ...option })),
    explanation: question.explanation,
    difficulty: question.difficulty,
  }))
}
