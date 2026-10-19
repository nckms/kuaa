import { describe, expect, it } from 'vitest'
import { assessPerformance, readPerformance, type PerformanceEvidence } from '../services/adaptive/PerformanceEngine'
import { getTargetDifficulty, summarizeActivity } from '../services/adaptive/RecommendationEngine'
import { generateCuratedQuestions, getCuratedQuestions } from '../modules/quiz/curatedQuestions'

const now = new Date('2026-10-08T12:00:00Z')
const evidence = (count: number, isCorrect = true, difficulty = 1): PerformanceEvidence[] =>
  Array.from({ length: count }, () => ({ isCorrect, difficulty, answered: true,
    timeSpentMs: 30000, observedAt: now.toISOString() }))

describe('performance progression', () => {
  it('accumulates short sessions and consumes their evidence only once', () => {
    const first = assessPerformance(0, [], evidence(3), now)
    expect(first.summary).toMatchObject({ newLevel: 0, pendingAnswers: 3, decision: 'collect' })
    const second = assessPerformance(0, first.pending, evidence(3), now)
    expect(second.summary).toMatchObject({ newLevel: 1, pendingAnswers: 0, evidenceCount: 6, decision: 'advance' })
    expect(second.pending).toEqual([])
    expect(assessPerformance(1, second.pending, evidence(3), now).summary.newLevel).toBe(1)
  })
  it('preserves pending answers across empty sessions without a promotion', () => {
    const first = assessPerformance(0, [], evidence(3), now)
    expect(assessPerformance(0, first.pending, [], now).pending).toEqual(first.pending)
  })
  it('advances, reinforces and recovers at the actual question difficulty', () => {
    expect(assessPerformance(2, [], evidence(5, true, 2), now).summary.newLevel).toBe(3)
    expect(assessPerformance(3, [], evidence(5, false, 3), now).summary).toMatchObject({ newLevel: 2, decision: 'reinforce' })
    expect(assessPerformance(2, [], evidence(5, true, 1), now).summary.newLevel).toBe(2)
    expect(assessPerformance(2, [], evidence(5, false, 5), now).summary.newLevel).toBe(2)
    expect(assessPerformance(5, [], evidence(5, true, 5), now).summary.newLevel).toBe(5)
  })
  it('counts omissions without treating them as answered evidence', () => {
    const skipped = evidence(5, false).map((answer) => ({ ...answer, answered: false, timeSpentMs: null }))
    const result = assessPerformance(1, [], [...evidence(5), ...skipped], now)
    expect(result.summary).toMatchObject({ evidenceCount: 5, accuracy: 0.5, newLevel: 1, decision: 'reinforce' })
  })
  it('excludes stale, future and implausibly fast evidence', () => {
    const stale = evidence(4).map((answer) => ({ ...answer, observedAt: '2026-09-01T12:00:00Z' }))
    const future = evidence(5).map((answer) => ({ ...answer, observedAt: '2026-10-09T12:00:00Z' }))
    const fast = evidence(5).map((answer) => ({ ...answer, timeSpentMs: 10 }))
    expect(assessPerformance(0, stale, [...future, ...fast, ...evidence(1)], now).summary)
      .toMatchObject({ evidenceCount: 1, newLevel: 0, pendingAnswers: 1 })
  })
  it('round trips persisted state and rejects malformed metadata', () => {
    const state = assessPerformance(0, [], evidence(3), now)
    expect(readPerformance(JSON.parse(JSON.stringify({ performance: state })))).toEqual(state)
    expect(readPerformance({ performance: { version: 1, pending: 'invalid' } })).toBeNull()
    expect(readPerformance(null)).toBeNull()
  })
  it('raises the next target after advancement and reduces it after errors', () => {
    expect(getTargetDifficulty(0)).toBe(1)
    expect(getTargetDifficulty(1)).toBe(2)
    expect(getTargetDifficulty(5)).toBe(5)
    const weak = summarizeActivity(evidence(5, false, 3).map((answer) => ({ ...answer, answeredAt: now })), now)
    expect(getTargetDifficulty(4, weak)).toBe(2)
  })
  it('uses the same requested target in the reserve bank without relabeling questions', () => {
    const topicName = 'Interpretação de Texto'
    for (const targetDifficulty of [1, 5]) {
      const bank = getCuratedQuestions(topicName)
      const [selected] = generateCuratedQuestions({ topicName, userMasteryLevel: 0, targetDifficulty, questionCount: 1 })
      expect(Math.abs(selected!.difficulty - targetDifficulty)).toBe(Math.min(...bank.map((q) => Math.abs(q.difficulty - targetDifficulty))))
      expect(bank.find((q) => q.body === selected!.body)?.difficulty).toBe(selected!.difficulty)
    }
  })
})
