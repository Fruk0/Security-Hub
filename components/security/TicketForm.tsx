'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink, Pencil, CheckCircle2 } from 'lucide-react'

type Props = {
  jiraKey: string
  /** Podés seguir pasándolo; lo combino con la validación local. */
  isJiraKeyValid: boolean
  ticketConfirmed: boolean
  jiraUrl?: string | null
  onChangeKey: (value: string) => void
  onConfirm: () => void
  onChangeTicket: () => void
  copyTicketKey: () => void | Promise<void>
  copiedKey?: string | null
}

const JIRA_KEY_REGEX = /^[A-Z][A-Z0-9]+-\d+$/

export default function TicketForm({
  jiraKey,
  isJiraKeyValid,
  ticketConfirmed,
  jiraUrl,
  onChangeKey,
  onConfirm,
  onChangeTicket,
  copyTicketKey,
  copiedKey,
}: Props) {
  // Validación local (evita casos como "CSSAS")
  const localValid = JIRA_KEY_REGEX.test(jiraKey)
  const canConfirm = !!jiraKey && localValid && isJiraKeyValid

  if (!ticketConfirmed) {
    const showError = !!jiraKey && !localValid

    return (
      <>
        {/* Grilla SOLO con label+input y botón → se alinean entre sí */}
        <div
          className="
            grid gap-4
            md:grid-cols-[minmax(0,1fr)_auto]
            md:items-center
          "
        >
          <div className="min-w-0">
            <Label htmlFor="jiraKey" className="mb-2 block">
              Ticket de Jira (KEY)
            </Label>

            <Input
              id="jiraKey"
              value={jiraKey}
              onChange={(e) => onChangeKey(e.target.value.toUpperCase())}
              disabled={ticketConfirmed}
              className="uppercase"
              placeholder="CS-201"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              required
              aria-invalid={showError ? 'true' : 'false'}
              aria-describedby="jiraKey-help jiraKey-error"
              autoFocus
            />
          </div>

          <Button
            variant="default"
            disabled={!canConfirm}
            onClick={onConfirm}
            title={canConfirm ? 'Confirmar ticket' : 'Ingresá una KEY válida (PROYECTO-123)'}
            aria-disabled={!canConfirm}
            className="md:mt-6"
          >
            Confirmar ticket
          </Button>
        </div>

        {/* Hint y error FUERA de la grilla → no alteran la alineación vertical */}
        <div className="mt-1">

          {showError && (
            <p id="jiraKey-error" className="mt-1 text-xs text-rose-600">
              Ingresá una KEY válida, ej.: <code>CS-201</code>.
            </p>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        <div className="leading-tight truncate">
          <div className="text-xs text-muted-foreground">Ticket confirmado</div>
          <div className="font-semibold tracking-tight truncate">
            <span className="font-mono">{jiraKey}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyTicketKey}
          title="Copiar KEY"
          aria-label="Copiar KEY"
        >
          <Copy className="h-4 w-4 mr-2" />
          {copiedKey === 'ok' ? 'Copiado' : 'Copiar'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          asChild
          disabled={!jiraUrl}
          title={jiraUrl ? 'Abrir en Jira' : 'Configura NEXT_PUBLIC_JIRA_BASE_URL'}
          aria-label="Abrir en Jira"
        >
          <a href={jiraUrl ?? '#'} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir
          </a>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onChangeTicket}
          title="Cambiar ticket"
          aria-label="Cambiar ticket"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Cambiar
        </Button>
      </div>
    </div>
  )
}
