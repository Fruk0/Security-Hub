// test/services/jiraClient.test.ts
import { describe, it, expect, vi } from 'vitest'
import { upsertRisk } from '@/lib/services/jiraClient'

vi.mock('@/lib/config', () => ({
  APP_CONFIG: {
    api: { baseUrl: null, timeoutMs: 1000 },
    features: { enableBackend: false }
  }
}))

describe('jiraClient (stub)', () => {
  it('upsertRisk devuelve ok=true cuando backend está deshabilitado', async () => {
    const res = await upsertRisk({
      ticket: 'CS-123',
      mode: 'framework',
      framework: {
        def: { id: 'FW' },
        answers: { F1: 'yes' },
        score: 10,
        level: 'LOW',
        allAnswered: true
      }
    })
    expect(res.ok).toBe(true)
    expect(res.ticket).toBe('CS-123')
  })
})

