// lib/services/jiraClient.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import { APP_CONFIG } from '@/lib/config'
import { jsonFetch } from './http'

// Tipos de alto nivel (alineados con tu buildPayload)
export type Mode = 'criterion' | 'framework'

export type CriterionDTO = {
  id: string
  title: string
}

export type FrameworkDTO = {
  id?: string
  questions?: Array<{ id: string }>
}

export type UpsertRiskRequest = {
  ticket: string
  mode: Mode
  // Snapshot resumido de criterio (si aplica)
  criterion?: {
    def: CriterionDTO
    answers: Record<string, 'yes' | 'no' | 'unknown'>
    justifications: Record<string, string>
  }
  // Estado de framework (si aplica)
  framework?: {
    def: FrameworkDTO
    answers: Record<string, 'yes' | 'no' | 'unknown'>
    score: number
    level: string
    allAnswered: boolean
  }
  notes?: string
}

export type UpsertRiskResponse = {
  ok: boolean
  updatedLabels?: string[]
  postedComment?: boolean
  ticket?: string
}

function backendEnabled(): boolean {
  return Boolean(APP_CONFIG.features.enableBackend && APP_CONFIG.api.baseUrl)
}

/**
 * Envía el payload de riesgo al backend (cuando esté disponible).
 * Hoy: si enableBackend=false, hace un stub (console.info) y devuelve ok=true.
 */
export async function upsertRisk(req: UpsertRiskRequest): Promise<UpsertRiskResponse> {
  if (!backendEnabled()) {
    console.info('[jiraClient:stub] upsertRisk', req)
    return { ok: true, ticket: req.ticket }
  }

  // Ejemplo real: POST /risk
  // Ajustá la ruta y contrato cuando tengas el endpoint real
  return await jsonFetch<UpsertRiskResponse>('/risk', {
    method: 'POST',
    body: req,
  })
}

/**
 * (Opcional) Sólo comentar en Jira vía backend.
 */
export async function postComment(ticket: string, text: string): Promise<{ ok: boolean }> {
  if (!backendEnabled()) {
    console.info('[jiraClient:stub] postComment', { ticket, text })
    return { ok: true }
  }
  return await jsonFetch<{ ok: boolean }>('/jira/comment', {
    method: 'POST',
    body: { ticket, text },
  })
}

/**
 * (Opcional) Actualizar labels vía backend.
 */
export async function setLabels(ticket: string, labels: string[]): Promise<{ ok: boolean }> {
  if (!backendEnabled()) {
    console.info('[jiraClient:stub] setLabels', { ticket, labels })
    return { ok: true }
  }
  return await jsonFetch<{ ok: boolean }>('/jira/labels', {
    method: 'POST',
    body: { ticket, labels },
  })
}
