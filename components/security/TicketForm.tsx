// components/security/TicketForm.tsx
'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { CheckCircle2, Copy, ExternalLink, Pencil } from 'lucide-react'

type Props = {
  jiraKey: string
  isJiraKeyValid: boolean
  ticketConfirmed: boolean
  jiraUrl?: string
  onChangeKey: (v: string) => void
  onConfirm: () => void
  onChangeTicket: () => void
  copyTicketKey: () => Promise<void> | void
  copiedKey: null | 'ok' | 'err'
}

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
  if (ticketConfirmed) {
    return (
      <div className="rounded-md border bg-muted/40 px-3 py-2 flex items-center justify-between">
        {/* Izquierda: estado + key */}
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="text-emerald-600 w-5 h-5 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground leading-tight">Ticket confirmado</div>
            <div className="font-semibold text-lg truncate font-mono tracking-tight">{jiraKey}</div>
          </div>
        </div>

        {/* Derecha: acciones */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            title={copiedKey === 'ok' ? 'Copiado' : 'Copiar ticket'}
            aria-label="Copiar ticket"
            onClick={() => copyTicketKey()}
            className="h-8 w-8"
          >
            <Copy className={cn('w-3.5 h-3.5', copiedKey === 'ok' && 'text-emerald-600')} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Abrir en Jira"
            aria-label="Abrir en Jira"
            asChild
            className="h-8 w-8"
          >
            <a href={jiraUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>

          <Button
            variant="outline"
            size="icon"
            title="Cambiar ticket"
            aria-label="Cambiar ticket"
            onClick={onChangeTicket}
            className="h-8 w-8"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  // Estado: sin confirmar (edición)
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="jiraKey">Ticket de Jira</Label>
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="jiraKey"
            placeholder="CS-2323"
            value={jiraKey}
            onChange={(e) => onChangeKey(e.target.value)}
            className="uppercase font-mono tracking-tight"
          />
          <Button onClick={onConfirm} disabled={!isJiraKeyValid}>
            Confirmar
          </Button>
        </div>
      </div>
    </Card>
  )
}
