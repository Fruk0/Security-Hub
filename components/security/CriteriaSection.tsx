'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import type { QA } from '@/lib/security/domain'

type CriterionQuestion = {
  id: string
  text?: string | null
  requiresJustificationWhen?: QA[]
}

type CriterionDef = {
  id: string
  title: string
  description?: string | null
  questions: CriterionQuestion[]
}

type Snapshot = {
  def: CriterionDef
  answers: Record<string, QA>
  justifications: Record<string, string>
}

type Props = {
  CRITERIA: CriterionDef[]
  selectedCriterion: CriterionDef | null
  critAnswers: Record<string, QA>
  critJustifications: Record<string, string>
  selectedEvalLabel: string
  statusBadgeClass: string
  selectedReadyToAccept: boolean
  onGoToFramework: () => void
  onSelectCriterionId: (id: string | null) => void
  onSetAnswer: (qid: string, value: QA) => void
  onSetJustification: (qid: string, value: string) => void
  onAcceptByCriterion: (snap: Snapshot) => void
  onRequestReview: (snap: Snapshot) => void
  onDiscardToFramework: () => void
}

export default function CriteriaSection(props: Props) {
  const {
    CRITERIA,
    selectedCriterion,
    critAnswers,
    critJustifications,
    selectedEvalLabel,
    statusBadgeClass,
    selectedReadyToAccept,
    onGoToFramework,
    onSelectCriterionId,
    onSetAnswer,
    onSetJustification,
    onAcceptByCriterion,
    onRequestReview,
    onDiscardToFramework,
  } = props

  if (!selectedCriterion) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Criterios (opcional)</h3>
            <p className="text-sm text-muted-foreground">
              Si alguno aplica, seleccioná el criterio para responder sus afirmaciones. Si no aplica, salteá al framework.
            </p>
          </div>
          <Button variant="default" onClick={onGoToFramework}>
            No aplica / Ir al framework
          </Button>
        </div>

        {/* Grid refinado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CRITERIA.map((c) => (
            <Card
              key={c.id}
              className="p-5 hover:border-emerald-300 transition-colors cursor-pointer"
              onClick={() => onSelectCriterionId(c.id)}
            >
              {/* Contenido con jerarquía y aire */}
              <div className="space-y-3">
                <CardHeader className="p-0">
                  <CardTitle className="text-base font-semibold">{c.title}</CardTitle>
                  {c.description && (
                    <CardDescription className="text-sm text-muted-foreground">
                      {c.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="p-0 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation() // evita doble disparo
                      onSelectCriterionId(c.id)
                    }}
                    className="hover:bg-indigo-500 hover:text-white transition-colors"
                  >
                    Usar este criterio
                  </Button>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </>
    )
  }

  const answered = Object.keys(critAnswers).length > 0

  const handlePrimaryAction = () => {
    if (!selectedCriterion) return

    if (selectedReadyToAccept) {
      onAcceptByCriterion({
        def: selectedCriterion,
        answers: { ...critAnswers },
        justifications: { ...critJustifications },
      })
      return
    }

    if (selectedEvalLabel === 'REVISAR') {
      if (!answered) return
      onRequestReview({
        def: selectedCriterion,
        answers: { ...critAnswers },
        justifications: { ...critJustifications },
      })
      return
    }

    onDiscardToFramework()
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-semibold">{selectedCriterion.title}</h3>
          {selectedCriterion.description && (
            <p className="text-sm text-muted-foreground break-words">
              {selectedCriterion.description}
            </p>
          )}
        </div>
        <Badge className={statusBadgeClass}>{selectedEvalLabel}</Badge>
      </div>

      <div className="space-y-3">
        {selectedCriterion.questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-2 border rounded-lg p-3">
            <div className="prose prose-sm dark:prose-invert font-medium">
              <ReactMarkdown>{String(q.text ?? '')}</ReactMarkdown>
            </div>

            <RadioGroup
              className="flex gap-6"
              value={critAnswers[q.id] ?? ''}
              onValueChange={(v: string) => onSetAnswer(q.id, v as QA)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id={`${q.id}-yes`} value="yes" />
                <Label htmlFor={`${q.id}-yes`}>Aplica</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id={`${q.id}-no`} value="no" />
                <Label htmlFor={`${q.id}-no`}>No aplica</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id={`${q.id}-unknown`} value="unknown" />
                <Label htmlFor={`${q.id}-unknown`}>Duda</Label>
              </div>
            </RadioGroup>

            {critAnswers[q.id] === 'yes' && q.requiresJustificationWhen?.includes('yes') && (
              <div className="mt-2">
                <Label htmlFor={`${q.id}-crit-just`} className="text-xs">
                  Justificación
                </Label>
                <Textarea
                  id={`${q.id}-crit-just`}
                  placeholder="Explicá brevemente por qué aplica…"
                  value={critJustifications[q.id] ?? ''}
                  onChange={(e) => onSetJustification(q.id, e.target.value)}
                  className={cn(
                    'min-h-[32px] py-1 text-sm',
                    !critJustifications[q.id]?.trim() && 'ring-1 ring-rose-500'
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Solo acción principal (sin "Volver a criterios") */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handlePrimaryAction}
          className={cn(
            selectedReadyToAccept && 'bg-emerald-600 hover:bg-emerald-700 text-white',
            !selectedReadyToAccept &&
              selectedEvalLabel === 'REVISAR' &&
              'bg-amber-600 hover:bg-amber-700 text-white'
          )}
          variant={
            selectedReadyToAccept ? 'default' : selectedEvalLabel === 'REVISAR' ? 'default' : 'destructive'
          }
        >
          {selectedReadyToAccept
            ? 'Aceptar por criterio'
            : selectedEvalLabel === 'REVISAR'
            ? 'Solicitar revisión de criterio'
            : 'Descartar e ir al framework'}
        </Button>
      </div>
    </>
  )
}
