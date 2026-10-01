// Documento que se guarda en Firestore (coleccion qa_lab_attempts). Debe mantenerse alineado con
// /firestore.rules. Sin IP ni nada fuera de estos campos. Tiempos en ms epoch (enteros).
import { LEVELS } from '../generator/levels.js'

export const LAB_VERSION = 'v2'
export const LIMITS = {
  seed: 100, level: 20, lang: 2, name: 80, email: 120, labVersion: 20, userAgent: 200,
  findings: 30, page: 100, description: 1000, id: 40, bugId: 60, category: 30,
}
export const SEVERITIES = ['low', 'medium', 'high', 'critical']
export const LANGS = ['es', 'en']
export const DOC_KEYS = ['seed', 'level', 'lang', 'candidate', 'startedAt', 'finishedAt', 'durationMs', 'findings', 'score', 'solutionViewed', 'labVersion', 'userAgent']
// Las reglas agregan createdAt (serverTimestamp() lo pone firebase.js al enviar; no forma parte del documento validado aqui).
export const SCORE_KEYS = ['value', 'hits', 'halfHits', 'falsePositives', 'missed']
export const COLLECTION = 'qa_lab_attempts'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const str = (v, max, min = 1) => typeof v === 'string' && v.length >= min && v.length <= max
const int = (v, min, max = Number.MAX_SAFE_INTEGER) => Number.isInteger(v) && v >= min && v <= max
const sameKeys = (o, keys) => !!o && typeof o === 'object' && !Array.isArray(o) &&
  Object.keys(o).length === keys.length && keys.every((k) => k in o)

export function buildSubmission({ seed, level, lang, candidate, startedAt, finishedAt, findings, scoreResult, solutionViewed, userAgent = '' }) {
  const b = scoreResult.breakdown
  return {
    seed: String(seed), level: String(level), lang,
    candidate: { name: String(candidate?.name ?? '').trim(), email: String(candidate?.email ?? '').trim() },
    startedAt, finishedAt, durationMs: Math.max(0, finishedAt - startedAt),
    findings: findings.map((f) => ({
      id: f.id, page: f.page, description: f.description, severity: f.severity,
      guessedBugId: f.guessedBugId ?? null, guessedCategory: f.guessedCategory ?? null,
    })),
    score: { value: scoreResult.score, hits: b.hits, halfHits: b.halfHits.length, falsePositives: b.falsePositives, missed: b.missed },
    solutionViewed: !!solutionViewed,
    labVersion: LAB_VERSION,
    userAgent: String(userAgent).slice(0, LIMITS.userAgent),
  }
}

/** @returns {{ok: boolean, errors: string[]}} */
export function validateSubmission(doc) {
  const errors = []
  const bad = (m) => errors.push(m)
  if (!sameKeys(doc, DOC_KEYS)) return { ok: false, errors: ['keys'] }
  if (!str(doc.seed, LIMITS.seed)) bad('seed')
  if (!LEVELS.includes(doc.level)) bad('level') // enum cerrado: tambien en firestore.rules
  if (!LANGS.includes(doc.lang)) bad('lang')
  if (!sameKeys(doc.candidate, ['name', 'email'])) bad('candidate')
  else {
    if (!str(doc.candidate.name, LIMITS.name)) bad('candidate.name')
    if (!str(doc.candidate.email, LIMITS.email) || !EMAIL_RE.test(doc.candidate.email)) bad('candidate.email')
  }
  if (!int(doc.startedAt, 1)) bad('startedAt')
  if (!int(doc.finishedAt, 1) || doc.finishedAt < doc.startedAt) bad('finishedAt')
  if (!int(doc.durationMs, 0) || doc.durationMs !== doc.finishedAt - doc.startedAt) bad('durationMs')
  if (!Array.isArray(doc.findings) || doc.findings.length > LIMITS.findings) bad('findings')
  else {
    doc.findings.forEach((f, i) => {
      const ok = sameKeys(f, ['id', 'page', 'description', 'severity', 'guessedBugId', 'guessedCategory']) &&
        str(f.id, LIMITS.id) && str(f.page, LIMITS.page, 0) && str(f.description, LIMITS.description) &&
        SEVERITIES.includes(f.severity) &&
        (f.guessedBugId === null || str(f.guessedBugId, LIMITS.bugId)) &&
        (f.guessedCategory === null || str(f.guessedCategory, LIMITS.category))
      if (!ok) bad(`findings[${i}]`)
    })
  }
  if (!sameKeys(doc.score, SCORE_KEYS) || !int(doc.score.value, 0, 100) ||
      !['hits', 'halfHits', 'falsePositives'].every((k) => int(doc.score[k], 0, 30)) || !int(doc.score.missed, 0, 36)) bad('score')
  if (typeof doc.solutionViewed !== 'boolean') bad('solutionViewed')
  if (!str(doc.labVersion, LIMITS.labVersion)) bad('labVersion')
  if (!str(doc.userAgent, LIMITS.userAgent, 0)) bad('userAgent')
  return { ok: errors.length === 0, errors }
}
