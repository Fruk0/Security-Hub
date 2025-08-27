'use client'

import * as React from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import type { QA } from '@/lib/security/domain'
import { ChevronRight } from 'lucide-react'

type CriterionQuestion = {
  id: string
  text?: string | null
  requiresJustificationWhen?: QA[]
}

type CriterionDef = {
  id: string
  title: string
  description?: string | null
  summary?: string | null
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
              Elegí el criterio que aplique y completá sus afirmaciones. Si no aplica ninguno, avanzá directamente al framework.
            </p>
          </div>
<Button
  onClick={onGoToFramework}
  size="sm"
  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-sm"
>
  Continuar sin criterio
</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CRITERIA.map((c) => (
            <Card
              key={c.id}
              className="group relative p-5 hover:border-emerald-300 hover:shadow-md transition cursor-pointer"
              onClick={() => onSelectCriterionId(c.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectCriterionId(c.id)
              }}
            >
              <CardHeader className="p-0 pr-6 flex justify-between items-center">
                <div className="space-y-1 min-w-0">
                  <CardTitle className="text-base font-semibold">{c.title}</CardTitle>
                  {c.summary && (
                    <CardDescription className="text-sm text-muted-foreground">
                      {c.summary}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <ChevronRight className="absolute top-5 right-5 w-4 h-4 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
            </Card>
          ))}
        </div>
      </>
    )
  }

  // ---- Lógica de botón único dinámico ----
  const totalQs = selectedCriterion.questions.length
  const answeredCount = selectedCriterion.questions.filter(q => {
    const v = props.critAnswers[q.id]
    return v === 'yes' || v === 'no' || v === 'unknown'
  }).length
  const allAnswered = answeredCount === totalQs
  const hasDoubt = selectedCriterion.questions.some(q => props.critAnswers[q.id] === 'unknown')

  const buttonLabel = selectedReadyToAccept
    ? 'Aceptar por criterio'
    : allAnswered && hasDoubt
      ? 'Solicitar revisión de criterio'
      : 'Continuar al framework'

  const buttonVariant =
    selectedReadyToAccept || (allAnswered && hasDoubt) ? 'default' : 'outline'

  const buttonStyle =
    selectedReadyToAccept
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : allAnswered && hasDoubt
        ? 'bg-amber-600 hover:bg-amber-700 text-white'
        : '' // outline neutro

  const handlePrimaryAction = () => {
    if (!selectedCriterion) return
    if (selectedReadyToAccept) {
      onAcceptByCriterion({
        def: selectedCriterion,
        answers: { ...critAnswers },
        justifications: { ...critJustifications },
      })

      // 🔹 Limpiar resto de criterios y volver al estado neutral
      selectedCriterion.questions.forEach((q) => {
        onSetAnswer(q.id, '' as QA)
        onSetJustification(q.id, '')
      })

      onSelectCriterionId(null) // volver a la lista de criterios
      return
    }
    if (allAnswered && hasDoubt) {
      onRequestReview({
        def: selectedCriterion,
        answers: { ...critAnswers },
        justifications: { ...critJustifications },
      })
      return
    }
    onDiscardToFramework()
  }
  // ----------------------------------------

  return (
    <>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{selectedCriterion.title}</h3>
        {selectedCriterion.description && (
          <p className="text-sm text-muted-foreground break-words">
            {selectedCriterion.description}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200">
        {selectedCriterion.questions.map((q, idx) => (
          <div
            key={q.id}
            className={cn('p-3', idx > 0 && 'border-t border-gray-200')}
          >
            <div className="prose prose-sm dark:prose-invert font-medium">
              <ReactMarkdown>{String(q.text ?? '')}</ReactMarkdown>
            </div>

            <RadioGroup
              className="mt-2 flex flex-wrap gap-x-6 gap-y-2"
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

      {/* Único botón, alineado a la izquierda */}
      <div className="flex justify-start pt-4">
        <Button
          onClick={handlePrimaryAction}
          variant={buttonVariant as any}
          className={cn(buttonStyle)}
        >
          {buttonLabel}
        </Button>
      </div>
    </>
  )
}
