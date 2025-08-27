// tests/url.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { useUrlSync } from '@/lib/security/url'

// Mock de next/navigation
const replaceMock = vi.fn()
let search: URLSearchParams

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => '/home',
  useSearchParams: () => search,
}))

describe('useUrlSync', () => {
  beforeEach(() => {
    replaceMock.mockClear()
    // Sembramos la URL inicial ANTES del render
    search = new URLSearchParams('t=CS-232&crit=C1')
  })

  it('hidrata desde la URL y luego escribe cambios', async () => {
    const setTicketKey = vi.fn()
    const selectCriterionId = vi.fn()

    const initialProps = {
      jiraKey: '',
      selectedCriterionId: null as string | null,
      setTicketKey,
      selectCriterionId,
      validateCriterionId: (id: string) => id === 'C1',
    }

    const { rerender } = renderHook((props: typeof initialProps) => useUrlSync(props), {
      initialProps,
    })

    // Esperar a que el efecto de hidratación corra
    await waitFor(() => {
      expect(setTicketKey).toHaveBeenCalledWith('CS-232')
      expect(selectCriterionId).toHaveBeenCalledWith('C1')
    })

    // Ahora simulamos que el estado externo cambió -> el hook debe escribir a la URL
    rerender({
      ...initialProps,
      jiraKey: 'CS-999',
      selectedCriterionId: 'C2',
      validateCriterionId: () => true,
    })

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalled()
      const url = replaceMock.mock.calls.at(-1)![0] as string
      expect(url).toContain('t=CS-999')
      expect(url).toContain('crit=C2')
    })
  })
})
