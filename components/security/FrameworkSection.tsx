// components/security/FrameworkSection.tsx
'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

import type { FrameworkDef } from '@/lib/security/domain'
import type { QA } from '@/lib/security/domain'
import { buildCommentForFramework } from '@/lib/security/jira'
import { writeClipboard } from '@/lib/security/clipboard'

type Props = {
  FRAMEWORK: FrameworkDef
  /** Estos props pueden venir, pero NO los usamos para calcular la copia */
  level: string
  score: number
  levelColor: string
  progressPct: number
  /** Estado externo. Puede contener 'yes'|'no'|'unknown' o 'Sí'|'No'|'No sé' */
  answers: Record<number, QA | string | undefined>
  onSetAnswer: (qid: number, v: QA) => void
}

/* ============================
 * Helpers locales
 * ============================ */
type NormAns = 'yes' | 'no' | 'unknown'

function normalize(v: unknown): NormAns | undefined {
  const s = String(v ?? '').trim().toLowerCase()
  if (['yes', 'y', 'si', 'sí', 'true', '1'].includes(s)) return 'yes'
  if (['no', 'n', 'false', '0'].includes(s)) return 'no'
  if (['unknown', 'no se', 'no sé', 'nose', 'ns', 'na', 'null', 'undefined'].includes(s)) return 'unknown'
  return undefined
}

function countsAsRisk(invert: boolean | undefined, ans: NormAns | undefined): boolean {
  if (!ans) return false
  if (invert) {
    // invert_logic=true → sumar cuando NO o NO SÉ (penaliza falta de control)
    return ans === 'no' || ans === 'unknown'
  }
  // normal → sumar cuando SÍ o NO SÉ
  return ans === 'yes' || ans === 'unknown'
}

function computeScore(FRAMEWORK: FrameworkDef, norm: Record<number, NormAns | undefined>) {
  let total = 0
  for (const q of FRAMEWORK.questions) {
    const ans = norm[q.id]
    if (countsAsRisk(Boolean((q as any).invert_logic), ans)) {
      total += Number((q as any).weight ?? 0)
    }
  }
  return total
}

function pickBand(score: number, bands?: Array<{ min: number; max: number; label: string }>): string {
  const b = bands ?? [
    { min: 0,  max: 4,  label: 'Bajo' },
    { min: 5,  max: 8,  label: 'Medio' },
    { min: 9,  max: 12, label: 'Alto' },
    { min: 13, max: 20, label: 'Crítico' },
  ]
  const found = b.find(x => score >= x.min && score <= x.max)
  return found?.label ?? (score >= (b.at(-1)?.min ?? 0) ? b.at(-1)!.label : b[0].label)
}

function applyRulesMinBand(FRAMEWORK: FrameworkDef, norm: Record<number, NormAns | undefined>, currentBand: string) {
  // Regla especial del framework que nos diste: si (Q1) y (Q2|Q3|Q4) => mínimo Alto
  const q1 = norm[1]
  const q2 = norm[2]
  const q3 = norm[3]
  const q4 = norm[4]
  const exposed = q1 === 'yes' || q1 === 'unknown'
  const sensitive = (q2 === 'yes' || q2 === 'unknown') || (q3 === 'yes' || q3 === 'unknown') || (q4 === 'yes' || q4 === 'unknown')
  if (exposed && sensitive) {
    const order = ['Bajo', 'Medio', 'Alto', 'Crítico']
    const idx = Math.max(order.indexOf('Alto'), order.indexOf(currentBand))
    return order[idx] ?? currentBand
  }
  return currentBand
}

/* ============================
 * Componente
 * ============================ */
export default function FrameworkSection({
  FRAMEWORK,
  answers,
  onSetAnswer,
}: Props) {
  const [copied, setCopied] = React.useState<null | 'ok' | 'err'>(null)

  // Normalizamos SIEMPRE lo que venga del estado externo
  const normAnswers = React.useMemo<Record<number, NormAns | undefined>>(() => {
    const out: Record<number, NormAns | undefined> = {}
    for (const q of FRAMEWORK.questions) {
      out[q.id] = normalize(answers[q.id])
    }
    return out
  }, [FRAMEWORK, answers])

  // ¿Todas respondidas? (da igual cuál opción)
  const allAnswered = React.useMemo(
    () => FRAMEWORK.questions.every(q => !!normAnswers[q.id]),
    [FRAMEWORK, normAnswers]
  )

  // Recalculamos score y banda de forma local (no dependemos de props)
  const localScore = React.useMemo(() => computeScore(FRAMEWORK, normAnswers), [FRAMEWORK, normAnswers])
  const baseBand   = React.useMemo(
    () => pickBand(localScore, (FRAMEWORK as any)?.scoring?.bands),
    [localScore, FRAMEWORK]
  )
  const finalBand  = React.useMemo(
    () => applyRulesMinBand(FRAMEWORK, normAnswers, baseBand),
    [FRAMEWORK, normAnswers, baseBand]
  )

  async function handleCopyToJira() {
    const ok = await writeClipboard(
      buildCommentForFramework(FRAMEWORK, normAnswers as any, localScore, finalBand, allAnswered)
    )
    setCopied(ok ? 'ok' : 'err')
    setTimeout(() => setCopied(null), 1400)
  }

  return (
    <Card className="p-4 border-0 shadow-none">
      <CardHeader className="p-0 mb-3">
        <CardTitle className="text-lg">Framework de Security Risk</CardTitle>
        {(FRAMEWORK as any)?.description && (
          <CardDescription className="text-sm text-muted-foreground">
            {(FRAMEWORK as any).description}
          </CardDescription>
        )}
      </CardHeader>

      {/* Contenedor único con borde y separadores (sin doble borde) */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        {FRAMEWORK.questions.map((q, idx) => {
          const val = normAnswers[q.id] ?? ''
          return (
            <div
              key={q.id}
              className={cn('p-3 flex flex-col gap-2', idx > 0 && 'border-t border-gray-200')}
            >
              {/* Enunciado + weight */}
              <div className="flex items-start justify-between gap-2">
                <div className="prose prose-sm dark:prose-invert font-medium">
                  <ReactMarkdown>{q.text as any}</ReactMarkdown>
                </div>
                {typeof (q as any).weight === 'number' && (
                  <span className="text-xs font-medium text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    +{(q as any).weight}
                  </span>
                )}
              </div>

              {/* Radios: valores yes/no/unknown */}
              <RadioGroup
                className="flex flex-wrap gap-x-6 gap-y-2"
                value={val as string}
                onValueChange={(v: string) => onSetAnswer(q.id, v as QA)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id={`fw-${q.id}-si`} value="yes" />
                  <Label htmlFor={`fw-${q.id}-si`}>Sí</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id={`fw-${q.id}-no`} value="no" />
                  <Label htmlFor={`fw-${q.id}-no`}>No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id={`fw-${q.id}-nose`} value="unknown" />
                  <Label htmlFor={`fw-${q.id}-nose`}>No sé</Label>
                </div>
              </RadioGroup>

              {/* Notas */}
              {(q as any).notes && <p className="text-xs text-muted-foreground">{(q as any).notes}</p>}
            </div>
          )
        })}
      </div>

      {/* Botón al final, a la izquierda */}
      <div className="pt-4">
        <Button
          onClick={handleCopyToJira}
          size="sm"
          disabled={!allAnswered}
          className={cn(
            'px-3',
            allAnswered
              ? 'bg-sky-600 hover:bg-sky-700 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200'
          )}
        >
          {copied === 'ok' ? 'Copiado' : copied === 'err' ? 'Error ❌' : 'Copiar a Jira'}
        </Button>
      </div>
    </Card>
  )
}
