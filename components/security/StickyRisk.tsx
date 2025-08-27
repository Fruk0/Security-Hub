'use client'

import React, { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Band } from '@/lib/security/scoring'
import { computeScoreAndBand } from '@/lib/security/scoring'

type Answer = 'Sí' | 'No' | 'No sé'
type AnswersMap = Record<number, Answer | string | boolean | number | undefined>

type FrameworkQuestion = { id: number; weight: number; invert_logic: boolean; dimension: 'Likelihood' | 'Impact' }
type FrameworkLike = {
  questions: Array<{ id: number; weight: number; invert_logic: boolean; dimension: 'Likelihood' | 'Impact' }>
  scoring?: { bands?: Band[] }
}

function adaptToSR(v: any): Answer | undefined {
  if (v == null) return undefined
  const s = String(v).toLowerCase().trim()
  if (['sí','si','yes','y','true','1'].includes(s)) return 'Sí'
  if (['no','false','0','n'].includes(s)) return 'No'
  if (['no sé','nose','unknown','ns','na'].includes(s)) return 'No sé'
  return 'No' // default seguro que no suma
}

// Nuevo mapping de colores por banda (fallback si no se provee getLevelColor)
const levelColorByBand = (band: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'): string => {
  switch (band) {
    case 'Bajo': return 'bg-emerald-600' // Verde
    case 'Medio': return 'bg-orange-500' // Naranja
    case 'Alto': return 'bg-rose-600'    // Rojo
    case 'Crítico': return 'bg-fuchsia-700' // Violeta
    default: return 'bg-gray-400'
  }
}

type StickyRiskProps = {
  /** Respuestas crudas del estado (state.frameworkAnswers) */
  answers: AnswersMap
  /** FRAMEWORK cargado (con questions y scoring.bands) */
  framework: FrameworkLike
  /** Mapea banda -> color de badge. Opcional; si no se pasa, usa el mapping nuevo */
  getLevelColor?: (band: 'Bajo' | 'Medio' | 'Alto' | 'Crítico') => string
  /** Opcional: override de bandas si no vienen en framework */
  bandsOverride?: Band[]
}

/**
 * Render 1:1 del sticky actual de page:
 * - Badge con color por nivel
 * - "score pts"
 * - "Riesgo FINAL" / "Riesgo temporal"
 * - "respondidas/total" + Progress
 */
export default function StickyRisk({ answers, framework, getLevelColor, bandsOverride }: StickyRiskProps) {
  const totalQuestions = framework?.questions?.length ?? 8

  const QUESTIONS: FrameworkQuestion[] = useMemo(
    () => (framework?.questions ?? []).map((q) => ({
      id: q.id,
      weight: q.weight,
      invert_logic: Boolean(q.invert_logic),
      dimension: q.dimension as 'Likelihood' | 'Impact'
    })),
    [framework]
  )

  const bands = useMemo<Band[]>(
    () => bandsOverride ?? framework?.scoring?.bands ?? [
      { min: 0,  max: 4,  label: 'Bajo' },
      { min: 5,  max: 8,  label: 'Medio' },
      { min: 9,  max: 12, label: 'Alto' },
      { min: 13, max: 20, label: 'Crítico' }
    ],
    [framework, bandsOverride]
  )

  const adaptedAnswers = useMemo(() => {
    const m: Record<number, Answer | undefined> = {}
    Object.entries(answers || {}).forEach(([k, v]) => (m[Number(k)] = adaptToSR(v)))
    return m
  }, [answers])

  const { score, band, answered } = useMemo(
    () => computeScoreAndBand(adaptedAnswers, { questions: QUESTIONS, bands }),
    [adaptedAnswers, QUESTIONS, bands]
  )

  const frameworkReady = answered >= totalQuestions
  const levelColor = (getLevelColor ?? levelColorByBand)(band)
  const progressPct = (answered / totalQuestions) * 100

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="shadow-xl border">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3">
            <Badge className={cn('text-white', levelColor)}>{band}</Badge>
            <span className="font-semibold text-lg">{score} pts</span>
            <span className="text-xs text-muted-foreground">
              {frameworkReady ? 'Riesgo FINAL' : 'Riesgo temporal'}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {answered}/{totalQuestions} respondidas
          </div>
          <Progress value={progressPct} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  )
}
