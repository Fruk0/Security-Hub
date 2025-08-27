// lib/services/jiraLink.ts
import { APP_CONFIG } from '@/lib/config'
import { isValidJiraKey } from '@/lib/security/validators'

/**
 * Devuelve la URL a Jira para una KEY dada, o null si:
 * - no hay base configurada
 * - o la KEY no es válida
 */
export function buildJiraUrl(key: string, base: string | null = APP_CONFIG.jira.baseUrl): string | null {
  if (!base || !key || !isValidJiraKey(key)) return null
  return `${base}/browse/${key}`
}
