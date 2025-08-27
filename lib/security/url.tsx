'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export const URL_PARAM_TICKET = 't'
export const URL_PARAM_CRIT = 'crit'

type Options = {
  jiraKey: string
  selectedCriterionId: string | null
  setTicketKey: (key: string) => void
  selectCriterionId: (id: string | null) => void
  validateCriterionId?: (id: string) => boolean
}

/**
 * Sincroniza estado <-> URL:
 *  - Lee una única vez al montar (hidrata estado desde ?t= & ?crit=)
 *  - Escribe recién DESPUÉS de hidratar, evitando borrar los parámetros al primer render.
 */
export function useUrlSync({
  jiraKey,
  selectedCriterionId,
  setTicketKey,
  selectCriterionId,
  validateCriterionId,
}: Options) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Señales internas
  const readOnceRef = useRef(false)
  const blockWriteRef = useRef(true) // bloquea escritura hasta terminar la hidratación
  const initialRef = useRef<{ t?: string; crit?: string }>({})

  // --- 1) Lectura inicial (hidrata estado desde URL) ---
  useEffect(() => {
    if (readOnceRef.current) return
    readOnceRef.current = true

    const t = searchParams.get(URL_PARAM_TICKET) || undefined
    const crit = searchParams.get(URL_PARAM_CRIT) || undefined
    initialRef.current = { t, crit }

    if (t) setTicketKey(t.toUpperCase())
    if (crit && (!validateCriterionId || validateCriterionId(crit))) {
      selectCriterionId(crit)
    }

    // Permitimos escribir recién en el próximo tick,
    // dándole tiempo al estado externo a aplicarse.
    const id = setTimeout(() => {
      blockWriteRef.current = false
    }, 0)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- 2) Escritura (solo cuando NO está bloqueado) ---
  useEffect(() => {
    if (blockWriteRef.current) return

    const current = new URLSearchParams(searchParams.toString())

    // Estado -> URL
    if (jiraKey) current.set(URL_PARAM_TICKET, jiraKey)
    else current.delete(URL_PARAM_TICKET)

    if (selectedCriterionId) current.set(URL_PARAM_CRIT, selectedCriterionId)
    else current.delete(URL_PARAM_CRIT)

    const nextStr = current.toString()
    const prevStr = searchParams.toString()

    if (nextStr !== prevStr) {
      const url = nextStr ? `${pathname}?${nextStr}` : pathname
      router.replace(url, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jiraKey, selectedCriterionId, pathname, router, searchParams])
}
