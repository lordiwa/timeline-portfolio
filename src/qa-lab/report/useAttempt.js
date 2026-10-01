// Estado de la prueba. Persiste en sessionStorage por (seed, level): un reload no pierde los hallazgos.
import { ref, computed, toValue, getCurrentScope, onScopeDispose } from 'vue'
import { scoreReport } from './scorer.js'
import { buildSubmission } from './schema.js'
import { submitReport } from './firebase.js'

const PREFIX = 'qa-lab:attempt:'

export function useAttempt(seedSource, levelSource, { send = submitReport, now = Date.now, storage = globalThis.sessionStorage } = {}) {
  const key = () => `${PREFIX}${toValue(seedSource)}:${toValue(levelSource)}`
  const load = () => {
    try { return JSON.parse(storage?.getItem(key()) || 'null') } catch { return null }
  }
  const saved = load()

  const candidate = ref(saved?.candidate ?? null)
  const startedAt = ref(saved?.startedAt ?? null)
  const findings = ref(saved?.findings ?? [])
  const solutionViewed = ref(!!saved?.solutionViewed)
  const result = ref(saved?.result ?? null) // { doc, score, id }
  const sending = ref(false)
  const error = ref(null)
  const elapsedMs = ref(result.value ? result.value.doc.durationMs : startedAt.value ? now() - startedAt.value : 0)

  const started = computed(() => startedAt.value !== null)
  const finished = computed(() => result.value !== null)

  const persist = () => {
    try {
      storage?.setItem(key(), JSON.stringify({
        candidate: candidate.value, startedAt: startedAt.value, findings: findings.value,
        solutionViewed: solutionViewed.value, result: result.value,
      }))
    } catch { /* storage lleno o bloqueado: se sigue en memoria */ }
  }

  let timer = null
  const tick = () => { elapsedMs.value = now() - startedAt.value }
  const runTimer = () => {
    if (timer === null && started.value && !finished.value) timer = setInterval(tick, 1000)
  }
  const stopTimer = () => { clearInterval(timer); timer = null }
  if (getCurrentScope()) onScopeDispose(stopTimer)
  runTimer()

  function start({ name, email }) {
    candidate.value = { name: String(name).trim(), email: String(email).trim() }
    startedAt.value = now()
    elapsedMs.value = 0
    persist()
    runTimer()
  }
  let seq = 0
  function addFinding({ page = '', description, severity = 'medium', guessedBugId = null, guessedCategory = null }) {
    const id = `f${now().toString(36)}${(seq++).toString(36)}`
    findings.value = [...findings.value, {
      id, page, description: String(description).trim(), severity,
      guessedBugId: guessedBugId || null, guessedCategory: guessedCategory || null,
    }]
    persist()
  }
  function removeFinding(id) {
    findings.value = findings.value.filter((f) => f.id !== id)
    persist()
  }
  function markSolutionViewed() {
    if (!solutionViewed.value) { solutionViewed.value = true; persist() }
  }

  /** Descarta el intento (cambio de semilla/nivel confirmado): borra lo guardado y frena el cronometro. */
  function discard() {
    stopTimer()
    try { storage?.removeItem(key()) } catch { /* storage bloqueado */ }
    candidate.value = null; startedAt.value = null; findings.value = []; solutionViewed.value = false
    result.value = null; error.value = null; elapsedMs.value = 0
  }

  /**
   * ctx: { activeBugIds, categoryOf, lang }. Reintentable si el guardado falla (no se pierde nada).
   * Sin config de Firebase ('not-configured') el resultado SE MUESTRA igual: queda en result con pending=true y el
   * documento completo en sessionStorage; volver a llamar submit() lo reenvia tal cual (mismo doc, mismo puntaje).
   */
  async function submit({ activeBugIds, categoryOf, lang }) {
    if (!started.value || sending.value) return null
    if (result.value?.pending) {
      sending.value = true
      const res = await send(result.value.doc)
      sending.value = false
      if (res.ok) { result.value = { ...result.value, pending: false, id: res.id }; error.value = null; persist() } else error.value = res
      return res
    }
    sending.value = true
    error.value = null
    const finishedAt = now()
    const scoreResult = scoreReport({ activeBugIds, findings: findings.value, categoryOf })
    const doc = buildSubmission({
      seed: toValue(seedSource), level: toValue(levelSource), lang, candidate: candidate.value,
      startedAt: startedAt.value, finishedAt, findings: findings.value, scoreResult,
      solutionViewed: solutionViewed.value, userAgent: globalThis.navigator?.userAgent ?? '',
    })
    const res = await send(doc)
    sending.value = false
    if (!res.ok && res.error !== 'not-configured') { error.value = res; return res }
    stopTimer()
    elapsedMs.value = doc.durationMs
    result.value = { doc, score: scoreResult, id: res.ok ? res.id : null, pending: !res.ok }
    error.value = res.ok ? null : res
    persist()
    return res
  }

  return {
    candidate, startedAt, findings, solutionViewed, result, sending, error, elapsedMs, started, finished,
    start, addFinding, removeFinding, markSolutionViewed, submit, discard,
  }
}
