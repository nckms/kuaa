import { describe, expect, it } from 'vitest'
import { eapTheta, scoreAreas, triData } from '../modules/exams/tri'

const mt2023 = Array.from({ length: 45 }, (_, k) => `cofenem2023q${String(136 + k).padStart(3, '0')}`)

describe('nota TRI (parâmetros do INEP)', () => {
  it('carrega parâmetros, gabaritos corrigidos e anuladas', () => {
    const t = triData()
    expect(Object.keys(t.params).length).toBeGreaterThan(2500)
    expect(t.keyFixes.cofenem2010q139).toBe('B')
    expect(t.annulled).toContain('cofenem2023q164')
  })

  it('EAP: mais acertos, theta maior; sem itens, theta 0', () => {
    expect(eapTheta([])).toBeCloseTo(0, 5)
    const items = Array.from({ length: 10 }, (_, i) => ({ a: 2, b: -1 + i * 0.2, c: 0.2, correct: false }))
    const low = eapTheta(items)
    const high = eapTheta(items.map((x) => ({ ...x, correct: true })))
    expect(high).toBeGreaterThan(low)
  })

  it('Matemática 2023: tudo certo dá nota alta, nenhum acerto dá 0, prova curta não tem nota', () => {
    const t = triData()
    const all = scoreAreas(mt2023, {}, (id) => Boolean(t.params[id]))
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ area: 'MT', label: 'Matemática' })
    expect(all[0]!.score).toBeGreaterThan(850)
    expect(scoreAreas(mt2023, {}, () => false)[0]!.score).toBe(0)
    const half = scoreAreas(mt2023, {}, (id) => Number(id.slice(-3)) % 2 === 0)[0]!.score
    expect(half).toBeGreaterThan(0)
    expect(half).toBeLessThan(all[0]!.score)
    expect(scoreAreas(mt2023.slice(0, 10), {}, () => true)).toEqual([])
  })
})
