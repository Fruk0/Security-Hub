// lib/security/scoring.ts
export type Answer = 'Sí' | 'No' | 'No sé'
export type AnswersMap = Record<number, Answer | undefined>

export type FrameworkQ = {
  id: number
  weight: number
  invert_logic: boolean
  dimension: 'Likelihood' | 'Impact'
}

export type Band = { min: number; max: number; label: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' }

export interface ScoringConfig {
  questions: FrameworkQ[]
  bands: Band[]
}

const bandsDefault: Band[] = [
  { min: 0, max: 4,  label: 'Bajo'   },
  { min: 5, max: 8,  label: 'Medio'  },
  { min: 9, max: 12, label: 'Alto'   },
  { min: 13, max: 20, label: 'Crítico' }
]

const isYesOrNS = (a?: Answer) => a === 'Sí' || a === 'No sé'

export function computeScoreAndBand(
  answers: AnswersMap,
  cfg: ScoringConfig
): { score: number; band: Band['label']; answered: number } {
  let total = 0
  let answered = 0

  for (const q of cfg.questions) {
    const ans = answers[q.id]
    if (ans) answered++

    if (ans === 'Sí') {
      total += q.weight
    } else if (ans === 'No sé') {
      // “No sé” cuenta como Sí salvo invert_logic=true
      if (!q.invert_logic) total += q.weight
    } else if (ans === 'No') {
      // “No” suma solo si invert_logic=true
      if (q.invert_logic) total += q.weight
    }
  }

  // Regla: EXPOSED_AND_SENSITIVE_MIN_HIGH
  if (isYesOrNS(answers[1]) && (isYesOrNS(answers[2]) || isYesOrNS(answers[3]) || isYesOrNS(answers[4]))) {
    if (total < 9) total = 9
  }

  const bands = cfg.bands ?? bandsDefault
  const band = (bands.find(b => total >= b.min && total <= b.max)?.label ?? 'Bajo') as Band['label']
  return { score: total, band, answered }
}
