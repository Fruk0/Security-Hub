// tests/storage.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useFrameworkStorage,
  useNotesStorage,
  useCriteriaStorage,
  clearFrameworkStorage,
  clearNotesStorage,
  clearCriteriaStorage
} from '@/lib/security/storage'

describe('storage hooks', () => {
  const KEY = 'CS-101'

  beforeEach(() => {
    localStorage.clear()
  })

  it('framework: guarda e hidrata por ticket (merge seguro)', async () => {
    const setAnswerSpy: Array<[string, string]> = []

    // Sembrar storage ANTES del mount (el efecto de hidratación corre al mount / cambio de jiraKey)
    localStorage.setItem(`sro:fw:${KEY}`, JSON.stringify({ F1: 'yes', F2: 'no' }))

    const { rerender } = renderHook(
      (props: { jiraKey: string; answers: Record<string, any> }) =>
        useFrameworkStorage(props.jiraKey, props.answers, (qid, v) =>
          setAnswerSpy.push([qid, v as any])
        ),
      {
        initialProps: { jiraKey: KEY, answers: {} as any },
      }
    )

    // Debe hidratar (invocar setFrameworkAnswer por cada Q)
    await waitFor(() => {
      expect(setAnswerSpy.length).toBeGreaterThan(0)
    })

    // Guardar: al cambiar respuestas, persiste en localStorage
    const answers = { F1: 'unknown' } as any
    rerender({ jiraKey: KEY, answers })

    await waitFor(() => {
      const raw = localStorage.getItem(`sro:fw:${KEY}`)
      expect(raw && JSON.parse(raw!)).toMatchObject(answers)
    })

    clearFrameworkStorage(KEY)
    expect(localStorage.getItem(`sro:fw:${KEY}`)).toBeNull()
  })

  it('notes: guarda e hidrata', async () => {
    const setter = (v: string) => {
      // noop en test; verificamos storage luego
    }
    const { rerender } = renderHook(
      (props: { notes: string; set: (v: string) => void }) =>
        useNotesStorage(KEY, props.notes, props.set),
      { initialProps: { notes: '', set: setter } }
    )

    // Persistir
    rerender({ notes: 'hello', set: setter })
    await waitFor(() => {
      expect(localStorage.getItem(`sro:notes:${KEY}`)).toBe(JSON.stringify('hello'))
    })

    clearNotesStorage(KEY)
    expect(localStorage.getItem(`sro:notes:${KEY}`)).toBeNull()
  })

  it('criteria: guarda e hidrata buffers por criterio', async () => {
    const critId = 'C1'
    const answers = { Q1: 'yes' } as any
    const just = { Q1: 'razón' }

    renderHook(() =>
      useCriteriaStorage(KEY, critId, answers, just, () => {})
    )

    await waitFor(() => {
      const raw = localStorage.getItem(`sro:crit:${KEY}`)
      expect(raw).toBeTruthy()
      const obj = JSON.parse(raw!)
      expect(obj[critId].a.Q1).toBe('yes')
    })

    clearCriteriaStorage(KEY)
    expect(localStorage.getItem(`sro:crit:${KEY}`)).toBeNull()
  })
})
