// lib/config.ts

export type AppConfig = {
  appName: string
  jira: {
    baseUrl: string | null // e.g. "https://tu-org.atlassian.net"
  }
  api: {
    baseUrl: string | null // e.g. "http://localhost:4000"  (futuro backend)
    timeoutMs: number
  }
  features: {
    enableBackend: boolean // palanca para activar llamadas reales al backend en el futuro
  }
}

function sanitizeBaseUrl(url: string | undefined): string | null {
  if (!url) return null
  return url.replace(/\/+$/, '')
}

export const APP_CONFIG: AppConfig = {
  appName: 'SRO',
  jira: {
    baseUrl: sanitizeBaseUrl(process.env.NEXT_PUBLIC_JIRA_BASE_URL),
  },
  api: {
    baseUrl: sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
    timeoutMs: 10000,
  },
  features: {
    // Si no hay API base configurada, forzamos false
    enableBackend: Boolean(process.env.NEXT_PUBLIC_API_BASE_URL) && process.env.NEXT_PUBLIC_ENABLE_BACKEND === 'true',
  },
}
