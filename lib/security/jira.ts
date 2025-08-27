import type {
  CriterionDef, CriterionAnswers, FrameworkDef, FrameworkAnswers, QA
} from './domain';

/* ===============================
 * Helpers robustos (idioma/score)
 * =============================== */

type NormAns = 'yes' | 'no' | 'unknown'

function normalize(v: unknown): NormAns | undefined {
  const s = String(v ?? '').trim().toLowerCase()
  if (['yes', 'y', 'si', 'sí', 'true', '1'].includes(s)) return 'yes'
  if (['no', 'n', 'false', '0'].includes(s)) return 'no'
  if (['unknown', 'no se', 'no sé', 'nose', 'ns', 'na', 'null', 'undefined'].includes(s)) return 'unknown'
  return undefined
}

function toEs(v: unknown) {
  const n = normalize(v)
  if (n === 'yes') return 'Sí'
  if (n === 'no') return 'No'
  if (n === 'unknown') return 'No sé'
  return '—'
}

function countsAsRisk(invert: boolean | undefined, ans: unknown): boolean {
  const n = normalize(ans)
  if (!n) return false
  if (invert) {
    // invert_logic=true → suma cuando No o No sé
    return n === 'no' || n === 'unknown'
  }
  // normal → suma cuando Sí o No sé
  return n === 'yes' || n === 'unknown'
}

/* ===============================
 * Payload
 * =============================== */

export function buildPayload(opts: {
  ticket: string;
  mode: 'criterion' | 'framework' | 'pending';
  criterion?: { def: CriterionDef; answers: CriterionAnswers; justifications: Record<string, string> };
  framework?: { def: FrameworkDef; answers: FrameworkAnswers; score: number; level: string; allAnswered: boolean };
  notes?: string;
}) {
  const { ticket, mode, criterion, framework, notes } = opts;

  const rationale = framework
    ? framework.def.questions
        .filter(q => countsAsRisk((q as any).invert_logic, (framework.answers as any)[q.id]))
        .map(q => ({
          id: q.id,
          text: q.text,
          weight: (q as any).weight,
          answer: (framework.answers as any)[q.id]
        }))
    : [];

  return {
    ticket: ticket.trim(),
    decision: {
      mode,
      byCriterion: mode === 'criterion' && criterion ? {
        used: criterion.def.id,
        title: criterion.def.title,
        answers: criterion.answers,
        justifications: criterion.justifications
      } : null,
      byFramework: mode === 'framework' && framework ? {
        score: framework.score,
        level: framework.level,
        answers: framework.answers,
        allAnswered: framework.allAnswered
      } : null
    },
    notes,
    rationale,
    generatedAt: new Date().toISOString()
  };
}

/* ===============================
 * Comentarios
 * =============================== */

export function buildCommentForCriterion(
  def: CriterionDef,
  answers: CriterionAnswers,
  just: Record<string, string>,
  notes?: string
) {
  const linesArr = def.questions
    .filter(q => normalize(answers[q.id]) === 'yes')
    .map(q => {
      const j = (just[q.id] ?? '').trim()
      const justLine = j ? `  ${j}` : '  —'
      return `- ${q.text}\n${justLine}`
    })

  const lines = linesArr.join('\n')
  const safeBlock = lines.trim().length ? lines : '—'

  return [
    `Solicito aplicar el **criterio de ciberseguridad**: ${def.title}.`,
    `Respuestas y justificaciones:`,
    safeBlock,
    notes?.trim() ? `Notas: ${notes.trim()}` : ''
  ].filter(Boolean).join('\n\n')
}

export function buildCommentForFramework(
  def: FrameworkDef,
  answers: FrameworkAnswers,       // puede venir en es/en; normalizamos dentro
  score: number,
  level: string,
  allAnswered: boolean,
  notes?: string
) {
  const lines = def.questions
    .filter(q => countsAsRisk((q as any).invert_logic, (answers as any)[q.id]))
    .map(q => `- ${q.text} (+${(q as any).weight})\n  Respuesta: ${toEs((answers as any)[q.id])}`)
    .join('\n');

  return [
    `Solicito registrar el **Security Risk** calculado.`,
    `Nivel: **${level}** (${score} pts).`,
    allAnswered ? 'Todas las preguntas del framework fueron respondidas.' : 'Aún hay preguntas sin responder.',
    `Respuestas que aportan riesgo:`,
    lines || '—',
    notes ? `Notas: ${notes}` : ''
  ].filter(Boolean).join('\n\n');
}

// --- Comentario para "Revisión solicitada" de un criterio --- //

function toAnswerLabel(ans?: QA) {
  const n = normalize(ans)
  if (n === 'yes') return 'Aplica'
  if (n === 'no') return 'No aplica'
  if (n === 'unknown') return 'Duda'
  return '—'
}

/**
 * buildReviewCommentForCriterion
 * Arma el comentario para Jira cuando se solicita revisión de un criterio.
 * - Lista TODAS las afirmaciones del criterio (respondidas o no)
 * - Incluye Respuesta y, si existe, Justificación
 */
export function buildReviewCommentForCriterion(
  def: CriterionDef,
  answers: CriterionAnswers,
  just: Record<string, string>,
  notes?: string
) {
  const header = 'Se requiere **revisión del criterio de ciberseguridad**. **No se acepta el criterio** hasta resolver la revisión.\n\n'
  const titulo = `**Criterio:** ${def.title}\n`
  const cuerpo = def.questions.map(q => {
    const ansLabel = toAnswerLabel(answers[q.id])
    const j = (just[q.id] ?? '').trim()
    const lines = [
      `- ${q.text}`,
      `  - Respuesta: **${ansLabel}**`,
      j ? `  - Justificación: ${j}` : null
    ].filter(Boolean)
    return lines.join('\n')
  }).join('\n')

  const notas = notes?.trim() ? `\n\n**Notas adicionales:**\n${notes.trim()}` : ''
  return `${header}${titulo}\n${cuerpo}${notas}`
}
