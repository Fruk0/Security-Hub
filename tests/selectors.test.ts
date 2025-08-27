// tests/selectors.test.ts
import { describe, it, expect, vi } from 'vitest'
// Mockear engine y jiraLink ANTES de importar selectors
vi.mock('@/lib/security/engine', () => ({
  evalCriterion: vi.fn().mockReturnValue({ status: 'pass', label: 'PASA', allYes: true }),
  evalFramework: vi.fn().mockReturnValue({ score: 7, level: 'LOW', allAnswered: false }),
}))

vi.mock('@/lib/services/jiraLink', () => ({
  buildJiraUrl: (key: string) => `https://mocked.example/browse/${key}`,
}))

import {
  selectSelectedCriterion,
  selectSelectedEval,
  selectSelectedReadyToAccept,
  selectCriterionProgress,
  selectFrameworkEval,
  selectLevelColor,
  selectFrameworkProgress,
  selectShowFramework,
  selectDecisionReady,
  selectJiraUrlFromConfig,
} from '@/lib/security/selectors'

describe('selectors', () => {
  const CRITERIA = [
    { id: 'C1', title: 'C1', questions: [{ id: 'Q1', requiresJustificationWhen: ['yes'] }] },
    { id: 'C2', title: 'C2', questions: [] },
  ] as any

  it('selectSelectedCriterion', () => {
    expect(selectSelectedCriterion(CRITERIA, null)).toBeNull()
    expect(selectSelectedCriterion(CRITERIA, 'C1')?.id).toBe('C1')
  })

  it('selectSelectedEval + readyToAccept', () => {
    const sel = selectSelectedCriterion(CRITERIA, 'C1')
    const evalRes = selectSelectedEval(sel, { Q1: 'yes' } as any, { Q1: 'razón' })
    expect(evalRes.label).toBe('PASA')

    const ready = selectSelectedReadyToAccept(
      sel,
      evalRes.status as any,
      { Q1: 'yes' } as any,
      { Q1: 'razón' }
    )
    expect(ready).toBe(true)
  })

  it('selectCriterionProgress', () => {
    const sel = selectSelectedCriterion(CRITERIA, 'C1')
    const { answeredCount, pct } = selectCriterionProgress(sel, { Q1: 'no' } as any)
    expect(answeredCount).toBe(1)
    expect(pct).toBe(100)
  })

  it('framework eval + level color + progress', () => {
    const framework = { questions: [{ id: 'F1', text: '', riskType: 'X', weight: 1 }] } as any
    const levels = [{ key: 'LOW', color: 'bg-emerald-500' }]
    const fw = selectFrameworkEval(framework, levels as any, { F1: 'yes' } as any)
    expect(fw.score).toBe(7)
    expect(selectLevelColor('LOW', levels as any)).toBe('bg-emerald-500')
    expect(selectFrameworkProgress(1, 1)).toBe(100)
  })

  it('flujo UI: showFramework + decisionReady', () => {
    const state = { ticketConfirmed: true, criterionPass: 'fail' } as any
    expect(selectShowFramework(state)).toBe(true)
    expect(selectDecisionReady({ ...state }, false)).toBe(false)
    expect(selectDecisionReady({ ...state }, true)).toBe(true)
  })

  it('selectJiraUrlFromConfig usa el servicio (mockeado)', () => {
    expect(selectJiraUrlFromConfig('CS-123')).toBe('https://mocked.example/browse/CS-123')
  })
})

