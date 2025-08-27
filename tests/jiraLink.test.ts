// test/services/jiraLink.test.ts
import { describe, it, expect, vi } from 'vitest'
import { buildJiraUrl } from '@/lib/services/jiraLink'

vi.mock('@/lib/config', () => ({
  APP_CONFIG: { jira: { baseUrl: 'https://acme.atlassian.net' } }
}))

describe('buildJiraUrl', () => {
  it('arma URL válida con base y key válida', () => {
    expect(buildJiraUrl('CS-123')).toBe('https://acme.atlassian.net/browse/CS-123')
  })
  it('devuelve null si base es null', () => {
    expect(buildJiraUrl('CS-123', null)).toBeNull()
  })
  it('devuelve null si key inválida', () => {
    expect(buildJiraUrl('bad key', 'https://acme.atlassian.net')).toBeNull()
  })
})

