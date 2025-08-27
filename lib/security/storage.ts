'use client'

import { useEffect } from 'react'
import type { QA } from '@/lib/security/domain'

// ------- NAMESPACE & helpers -------
const NS_FW = 'sro:fw'
const NS_NOTES = 'sro:notes'
const NS_CRIT = 'sro:crit'

const keyFW = (jiraKey: string) => `${NS_FW}:${jiraKey}`
const keyNotes = (jiraKey: string) => `${NS_NOTES}:${jiraKey}`
const keyCrit = (jiraKey: string) => `${NS_CRIT}:${jiraKey}`

// ------- FRAMEWORK -------
export function useFrameworkStorage(
  jiraKey: string,
  answers: Record<string, QA>,
  setFrameworkAnswer: (qid: string, value: QA) => void
) {
  // Hidratar al cambiar de ticket: mergea storage -> estado SIN pisar respuestas ya presentes
  useEffect(() => {
    if (!jiraKey) return
    try {
      const raw = localStorage.getItem(keyFW(jiraKey))
      if (!raw) return
      const data = JSON.parse(raw) as Record<string, QA> | null
      if (!data) return

      for (const [qid, value] of Object.entries(data)) {
        if (!(qid in answers)) {
          setFrameworkAnswer(qid, value as QA)
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jiraKey])

  // Guardar en cada cambio
  useEffect(() => {
    if (!jiraKey) return
    try {
      localStorage.setItem(keyFW(jiraKey), JSON.stringify(answers))
    } catch {
      // ignore
    }
  }, [jiraKey, answers])
}

export function clearFrameworkStorage(jiraKey?: string) {
  try {
    if (jiraKey) localStorage.removeItem(keyFW(jiraKey))
  } catch {
    // ignore
  }
}

// ------- NOTAS -------
export function useNotesStorage(
  jiraKey: string,
  notes: string,
  setNotes: (v: string) => void
) {
  // Hidratar (si no hay notas en memoria)
  useEffect(() => {
    if (!jiraKey) return
    try {
      const raw = localStorage.getItem(keyNotes(jiraKey))
      if (!raw) return
      const saved = JSON.parse(raw) as string | null
      if (saved && !notes.trim()) {
        setNotes(saved)
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jiraKey])

  // Guardar en cada cambio
  useEffect(() => {
    if (!jiraKey) return
    try {
      localStorage.setItem(keyNotes(jiraKey), JSON.stringify(notes))
    } catch {
      // ignore
    }
  }, [jiraKey, notes])
}

export function clearNotesStorage(jiraKey?: string) {
  try {
    if (jiraKey) localStorage.removeItem(keyNotes(jiraKey))
  } catch {
    // ignore
  }
}

// ------- CRITERIOS (respuestas + justificaciones por criterio) -------

type CritBuffers = {
  a: Record<string, QA> // answers
  j: Record<string, string> // justifications
}
type CritStore = Record<string, CritBuffers> // { [criterionId]: { a, j } }

function readCrit(jiraKey: string): CritStore {
  try {
    const raw = localStorage.getItem(keyCrit(jiraKey))
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') return data as CritStore
    return {}
  } catch {
    return {}
  }
}

function writeCrit(jiraKey: string, store: CritStore) {
  try {
    localStorage.setItem(keyCrit(jiraKey), JSON.stringify(store))
  } catch {
    // ignore
  }
}

export function useCriteriaStorage(
  jiraKey: string,
  selectedCriterionId: string | null,
  // buffers del estado actual:
  answers: Record<string, QA>,
  justifications: Record<string, string>,
  // setter de reemplazo atómico (nuevo en state.ts):
  replaceBuffers: (answers: Record<string, QA>, justifications: Record<string, string>) => void
) {
  // Hidratar buffers cuando cambia el criterio seleccionado o el ticket
  useEffect(() => {
    if (!jiraKey || !selectedCriterionId) return
    const store = readCrit(jiraKey)
    const entry = store[selectedCriterionId] || { a: {}, j: {} }

    // merge seguro: si en memoria ya hay algo, no lo pisamos
    const mergedA = { ...entry.a, ...answers }
    const mergedJ = { ...entry.j, ...justifications }

    // reemplazo atómico en el reducer
    replaceBuffers(mergedA, mergedJ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jiraKey, selectedCriterionId])

  // Guardar ante cambios de buffers
  useEffect(() => {
    if (!jiraKey || !selectedCriterionId) return
    const store = readCrit(jiraKey)
    store[selectedCriterionId] = {
      a: { ...(answers || {}) },
      j: { ...(justifications || {}) },
    }
    writeCrit(jiraKey, store)
  }, [jiraKey, selectedCriterionId, answers, justifications])
}

export function clearCriteriaStorage(jiraKey?: string) {
  try {
    if (jiraKey) localStorage.removeItem(keyCrit(jiraKey))
  } catch {
    // ignore
  }
}
