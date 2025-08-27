// test/state.test.ts
import { describe, it, expect } from 'vitest'
import { uiReducer, createInitialState } from '@/lib/security/state'

describe('uiReducer', () => {
  it('setea y confirma ticket', () => {
    let s = createInitialState()
    s = uiReducer(s, { type: 'ticket/setKey', key: 'CS-123' })
    expect(s.jiraKey).toBe('CS-123')
    s = uiReducer(s, { type: 'ticket/confirm' })
    expect(s.ticketConfirmed).toBe(true)
  })

  it('change ticket limpia criterios y framework (pero conserva la KEY)', () => {
    let s = createInitialState()
    s = uiReducer(s, { type: 'ticket/setKey', key: 'CS-123' })
    s = uiReducer(s, { type: 'criteria/setAnswer', qid: 'Q1', value: 'yes' })
    s = uiReducer(s, { type: 'framework/setAnswer', qid: 'F1', value: 'no' })
    s = uiReducer(s, { type: 'ticket/confirm' })
    expect(s.ticketConfirmed).toBe(true)

    s = uiReducer(s, { type: 'ticket/change' })
    expect(s.jiraKey).toBe('CS-123')
    expect(s.ticketConfirmed).toBe(false)
    expect(Object.keys(s.critAnswers).length).toBe(0)
    expect(Object.keys(s.frameworkAnswers).length).toBe(0)
  })

  it('criteria: setAnswer/Justification/accept/requestReview/reset', () => {
    let s = createInitialState()
    s = uiReducer(s, { type: 'criteria/setAnswer', qid: 'C1Q1', value: 'yes' })
    expect(s.critAnswers['C1Q1']).toBe('yes')

    s = uiReducer(s, { type: 'criteria/setJustification', qid: 'C1Q1', value: 'ok' })
    expect(s.critJustifications['C1Q1']).toBe('ok')

    const snap = {
      def: { id: 'C1', title: 'Test', questions: [] },
      answers: { C1Q1: 'yes' },
      justifications: { C1Q1: 'ok' }
    }
    s = uiReducer(s, { type: 'criteria/accept', snap })
    expect(s.criterionPass).toBe('pass')
    expect(s.acceptedSnapshot?.def.id).toBe('C1')

    s = uiReducer(s, { type: 'criteria/reset' })
    expect(s.criterionPass).toBe('pending')
    expect(s.acceptedSnapshot).toBeNull()

    s = uiReducer(s, { type: 'criteria/requestReview', snap })
    expect(s.criterionReviewRequested).toBe(true)
    expect(s.reviewSnapshot?.def.id).toBe('C1')
  })

  it('framework: setAnswer', () => {
    let s = createInitialState()
    s = uiReducer(s, { type: 'framework/setAnswer', qid: 'F1', value: 'unknown' })
    expect(s.frameworkAnswers['F1']).toBe('unknown')
  })

  it('reset/all vuelve al estado inicial', () => {
    let s = createInitialState()
    s = uiReducer(s, { type: 'ticket/setKey', key: 'CS-123' })
    s = uiReducer(s, { type: 'reset/all' })
    expect(s).toEqual(createInitialState())
  })
})

