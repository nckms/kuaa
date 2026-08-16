/**
 * Kuaa — Teste de Carga com k6
 *
 * Simula o fluxo completo de um usuário:
 *   register → login → GET vestibulares → enroll → GET trail → generate quiz
 *   → GET session → answer todas as questões → finish
 *
 * ATENÇÃO: Rodar APENAS contra um banco de staging isolado.
 * NUNCA execute contra o banco de produção (Supabase principal).
 *
 * Instalação do k6:
 *   Windows (Chocolatey): choco install k6
 *   Windows (direto):     https://dl.k6.io/msi/k6-latest-amd64.msi
 *   macOS:                brew install k6
 *   Linux:                https://grafana.com/docs/k6/latest/set-up/install-k6/
 *
 * Como rodar (exemplo com 10 VUs por 1 minuto contra staging local):
 *   BASE_URL=http://localhost:3334 k6 run apps/api/loadtest/quiz-flow.js
 *
 * Cenário padrão: 50 VUs por 2 minutos (meta do TCC):
 *   BASE_URL=http://localhost:3334 VUS=50 DURATION=2m k6 run apps/api/loadtest/quiz-flow.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3334'
const VUS = parseInt(__ENV.VUS || '50')
const DURATION = __ENV.DURATION || '2m'

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    // Meta do TCC: 50 usuários sem degradação
    http_req_duration: ['p(95)<2000'], // 95% das requests em menos de 2s
    http_req_failed: ['rate<0.05'],    // menos de 5% de erros
    errors: ['rate<0.05'],
  },
}

const PARAMS = {
  headers: { 'Content-Type': 'application/json' },
}

export default function () {
  const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // 1. Register
  const registerRes = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      name: `Usuário k6 ${uid}`,
      email: `k6_${uid}@loadtest.kuaa`,
      password: 'Senha123!',
    }),
    PARAMS,
  )
  const ok1 = check(registerRes, { 'register 201': (r) => r.status === 201 })
  errorRate.add(!ok1)
  if (!ok1) return

  const { accessToken, refreshToken } = registerRes.json()
  const authParams = {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
  }

  // 2. GET vestibulares
  const vestRes = http.get(`${BASE_URL}/api/v1/vestibulares`, authParams)
  const ok2 = check(vestRes, { 'vestibulares 200': (r) => r.status === 200 })
  errorRate.add(!ok2)
  if (!ok2) return

  const vestibulares = vestRes.json()
  const enem = vestibulares.find((v) => v.slug === 'enem')
  if (!enem) { errorRate.add(1); return }

  // 3. Enroll
  const enrollRes = http.post(
    `${BASE_URL}/api/v1/enrollments`,
    JSON.stringify({ vestibularId: enem.id }),
    authParams,
  )
  const ok3 = check(enrollRes, { 'enroll 201': (r) => r.status === 201 })
  errorRate.add(!ok3)
  if (!ok3) return

  // 4. GET trail → pegar primeiro topicId desbloqueado
  const trailRes = http.get(`${BASE_URL}/api/v1/trail/enem`, authParams)
  const ok4 = check(trailRes, { 'trail 200': (r) => r.status === 200 })
  errorRate.add(!ok4)
  if (!ok4) return

  const trail = trailRes.json()
  const allTopics = trail.subjects.flatMap((s) => s.topics)
  const firstTopic = allTopics.find((t) => t.progress.unlocked)
  if (!firstTopic) { errorRate.add(1); return }

  sleep(0.5) // simula tempo de leitura da tela

  // 5. Generate quiz
  const genRes = http.post(
    `${BASE_URL}/api/v1/quiz/generate`,
    JSON.stringify({ topicId: firstTopic.id, count: 5 }),
    authParams,
  )
  const ok5 = check(genRes, { 'generate 200': (r) => r.status === 200 })
  errorRate.add(!ok5)
  if (!ok5) return

  const { sessionId } = genRes.json()

  sleep(0.5)

  // 6. GET session
  const sessionRes = http.get(`${BASE_URL}/api/v1/quiz/${sessionId}`, authParams)
  const ok6 = check(sessionRes, { 'session 200': (r) => r.status === 200 })
  errorRate.add(!ok6)
  if (!ok6) return

  const { questions } = sessionRes.json()

  // 7. Answer todas as questões (opção A em todas — não importa a correção no loadtest)
  for (const question of questions) {
    const answerRes = http.post(
      `${BASE_URL}/api/v1/quiz/${sessionId}/answer`,
      JSON.stringify({ questionId: question.id, optionId: 'A', timeSpentMs: 3000 }),
      authParams,
    )
    check(answerRes, { 'answer 200': (r) => r.status === 200 })
    sleep(0.3)
  }

  // 8. Finish
  const finishRes = http.post(`${BASE_URL}/api/v1/quiz/${sessionId}/finish`, null, authParams)
  const ok8 = check(finishRes, { 'finish 200': (r) => r.status === 200 })
  errorRate.add(!ok8)

  sleep(1)
}
