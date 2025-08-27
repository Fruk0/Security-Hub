// lib/services/http.ts
import { APP_CONFIG } from '@/lib/config'

export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

export async function jsonFetch<T = unknown>(path: string, opts: HttpOptions = {}): Promise<T> {
  if (!APP_CONFIG.api.baseUrl) {
    throw new Error('API base URL no configurada (NEXT_PUBLIC_API_BASE_URL)')
  }

  const url = `${APP_CONFIG.api.baseUrl}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? APP_CONFIG.api.timeoutMs
  )

  try {
    const res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers ?? {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal ?? controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`)
    }

    // Puede no tener body (204)
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}
