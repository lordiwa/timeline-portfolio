// TASK-050 fase A — registro de la prueba. Cada spec nombra el dano que previene.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { scoreReport } from '../../src/qa-lab/report/scorer.js'
import { buildSubmission, validateSubmission, DOC_KEYS, SCORE_KEYS, LIMITS, FINDINGS_JSON_MAX } from '../../src/qa-lab/report/schema.js'
import { useAttempt } from '../../src/qa-lab/report/useAttempt.js'
import { submitReport, getFirebaseConfig } from '../../src/qa-lab/report/firebase.js'
import ReportPanel from '../../src/qa-lab/report/ReportPanel.vue'
import StartAttempt from '../../src/qa-lab/report/StartAttempt.vue'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'

const CAT = { a: 'ui', b: 'ui', c: 'validation', d: 'a11y' }
const categoryOf = (id) => CAT[id] ?? null
const F = (id, bug = null, cat = null) => ({ id, page: 'p', description: 'd', severity: 'low', guessedBugId: bug, guessedCategory: cat })
const score = (active, findings) => scoreReport({ activeBugIds: active, findings, categoryOf })

describe('scorer', () => {
  it('aciertos, falsos positivos y missed (evita puntuar mal un reporte y mostrar un resultado falso)', () => {
    const r = score(['a', 'c', 'd'], [F('1', 'a'), F('2', 'zzz'), F('3')])
    expect(r.hits).toEqual([{ findingId: '1', bugId: 'a' }])
    expect(r.falsePositives).toEqual(['2'])
    expect(r.missed).toEqual(['c', 'd'])
    expect(r.breakdown.unclassified).toEqual(['3'])
    expect(r.score).toBe(Math.round(100 * (1 - 0.5) / 3))
  })
  it('duplicados cuentan una sola vez: el mismo bug cargado dos veces no infla el puntaje', () => {
    const r = score(['a', 'c'], [F('1', 'a'), F('2', 'a')])
    expect(r.hits).toHaveLength(1)
    expect(r.falsePositives).toEqual([])
    expect(r.breakdown.duplicates).toEqual(['2'])
    expect(r.score).toBe(50)
  })
  it('medio acierto por categoria consume un bug libre, no uno ya acertado (evita contar dos veces un bug)', () => {
    const r = score(['a', 'b'], [F('1', 'a'), F('2', null, 'ui'), F('3', null, 'ui')])
    expect(r.hits.map((h) => h.bugId)).toEqual(['a'])
    expect(r.breakdown.halfHits).toEqual([{ findingId: '2', bugId: 'b' }])
    expect(r.falsePositives).toEqual(['3']) // ya no queda bug 'ui' libre
    expect(r.missed).toEqual(['b'])
  })
  it('lista vacia y sin bugs activos dan 0 sin NaN (evita un score invalido en el documento)', () => {
    expect(score(['a'], []).score).toBe(0)
    expect(score([], [F('1', 'a')]).score).toBe(0)
    expect(score([], []).score).toBe(0)
  })
})

const goodDoc = () => {
  const findings = [F('1', 'a')]
  return buildSubmission({
    seed: 's1', level: 'junior', lang: 'es', candidate: { name: ' Ana ', email: 'ana@x.io' },
    startedAt: 1000, finishedAt: 5000, findings, scoreResult: score(['a'], findings), solutionViewed: true, userAgent: 'u'.repeat(500),
  })
}

const mutF = (d, fn) => { const a = JSON.parse(d.findingsJson); fn(a[0]); return JSON.stringify(a) }

describe('schema', () => {
  it('un documento bien armado valida y trunca userAgent (evita guardar datos de mas)', () => {
    const d = goodDoc()
    expect(validateSubmission(d)).toEqual({ ok: true, errors: [] })
    expect(d.userAgent).toHaveLength(LIMITS.userAgent)
    expect(d.durationMs).toBe(4000)
    expect(Object.keys(d).sort()).toEqual([...DOC_KEYS].sort())
  })
  it('20 findings al tope (todos los strings al maximo y escapados) caben en FINDINGS_JSON_MAX (evita rechazar un intento valido en reglas)', () => {
    const big = (n) => ''.repeat(n)
    const f = { id: big(LIMITS.id), page: big(LIMITS.page), description: big(LIMITS.description), severity: 'critical', guessedBugId: big(LIMITS.bugId), guessedCategory: big(LIMITS.category) }
    const json = JSON.stringify(Array(LIMITS.findings).fill(f))
    expect(json.length).toBeLessThanOrEqual(FINDINGS_JSON_MAX)
    const d = goodDoc(); d.findingsJson = json; d.findingsCount = LIMITS.findings
    expect(validateSubmission(d).ok).toBe(true)
  })
  it.each([
    ['clave extra (IP)', (d) => { d.ip = '1.1.1.1' }],
    ['nombre > 80', (d) => { d.candidate.name = 'x'.repeat(81) }],
    ['email invalido', (d) => { d.candidate.email = 'sin-arroba' }],
    ['21 findings', (d) => { const a = Array.from({ length: 21 }, (_, i) => F(String(i))); d.findingsJson = JSON.stringify(a); d.findingsCount = 21 }],
    ['findingsCount que no coincide', (d) => { d.findingsCount = 2 }],
    ['findingsJson no es JSON', (d) => { d.findingsJson = '{no' }],
    ['findingsJson demasiado grande', (d) => { d.findingsJson = 'x'.repeat(FINDINGS_JSON_MAX + 1) }],
    ['description > 1000', (d) => { d.findingsJson = mutF(d, (f) => { f.description = 'x'.repeat(1001) }) }],
    ['severidad invalida', (d) => { d.findingsJson = mutF(d, (f) => { f.severity = 'x' }) }],
    ['score fuera de rango', (d) => { d.score.value = 101 }],
    ['solutionViewed no booleano', (d) => { d.solutionViewed = 'si' }],
  ])('rechaza %s (evita que entre basura o abuso de tamano)', (_n, mutate) => {
    const d = goodDoc()
    mutate(d)
    expect(validateSubmission(d).ok).toBe(false)
  })
})

describe('firebase', () => {
  it('sin config devuelve un error claro y no lanza (evita romper el lab sin VITE_FIREBASE_*)', async () => {
    expect(getFirebaseConfig({})).toBeNull()
    const r = await submitReport(goodDoc(), {})
    expect(r).toMatchObject({ ok: false, error: 'not-configured' })
  })
})

describe('useAttempt', () => {
  let store
  const storage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v } }
  beforeEach(() => { store = {} })
  const ctx = { activeBugIds: ['a'], categoryOf, lang: 'es' }

  it('persiste por (seed, level) y un reload recupera hallazgos y solucionario visto (evita perder el trabajo)', () => {
    const a = useAttempt('s1', 'junior', { storage })
    a.start({ name: 'Ana', email: 'ana@x.io' })
    a.addFinding({ description: 'roto', guessedBugId: 'a' })
    a.markSolutionViewed()
    const b = useAttempt('s1', 'junior', { storage })
    expect(b.started.value).toBe(true)
    expect(b.findings.value).toHaveLength(1)
    expect(b.solutionViewed.value).toBe(true)
    b.removeFinding(b.findings.value[0].id)
    expect(useAttempt('s1', 'junior', { storage }).findings.value).toHaveLength(0)
    expect(useAttempt('s1', 'senior', { storage }).started.value).toBe(false)
    expect(useAttempt('s2', 'junior', { storage }).started.value).toBe(false)
  })
  it('submit guarda el doc con solutionViewed y, si falla el envio, conserva el intento para reintentar', async () => {
    const send = vi.fn().mockResolvedValueOnce({ ok: false, error: 'network', message: 'x' }).mockResolvedValueOnce({ ok: true, id: 'doc1' })
    const a = useAttempt('s1', 'junior', { storage, send })
    a.start({ name: 'Ana', email: 'ana@x.io' })
    a.addFinding({ description: 'roto', guessedBugId: 'a' })
    a.markSolutionViewed()
    await a.submit(ctx)
    expect(a.finished.value).toBe(false)
    expect(a.error.value.error).toBe('network')
    await a.submit(ctx)
    expect(a.finished.value).toBe(true)
    const doc = send.mock.calls[1][0]
    expect(validateSubmission(doc).ok).toBe(true)
    expect(doc.solutionViewed).toBe(true)
    expect(doc.score.value).toBe(100)
    expect(useAttempt('s1', 'junior', { storage }).finished.value).toBe(true)
  })
})

describe('componentes', () => {
  const i18n = createLabI18n('es')
  it('StartAttempt valida email y muestra el aviso de privacidad (evita empezar sin datos validos)', async () => {
    const w = mount(StartAttempt, { global: { plugins: [i18n] } })
    expect(w.get('[data-testid=privacy]').text()).toContain('No se comparte con terceros')
    expect(w.get('[data-testid=privacy] a').attributes('href')).toBe('mailto:srparca@gmail.com')
    await w.get('#qa-start-name').setValue('Ana')
    await w.get('#qa-start-email').setValue('mal')
    await w.get('form').trigger('submit')
    expect(w.emitted('start')).toBeUndefined()
    expect(w.get('[role=alert]').text()).not.toBe('')
    await w.get('#qa-start-email').setValue('ana@x.io')
    await w.get('form').trigger('submit')
    expect(w.emitted('start')[0][0]).toEqual({ name: 'Ana', email: 'ana@x.io' })
  })
  it('ReportPanel carga y quita hallazgos con labels asociados (evita un panel inutilizable o inaccesible)', async () => {
    const attempt = useAttempt('s9', 'junior', { storage: { getItem: () => null, setItem() {} } })
    attempt.start({ name: 'Ana', email: 'ana@x.io' })
    const w = mount(ReportPanel, {
      props: { attempt, scoreContext: { activeBugIds: [], categoryOf, lang: 'es' }, categories: ['ui'], bugOptions: [{ id: 'a', label: 'A' }] },
      global: { plugins: [i18n] },
    })
    expect(w.get('label[for=qa-f-desc]').exists()).toBe(true)
    await w.get('form').trigger('submit') // vacio: error accesible
    expect(w.get('[data-testid=finding-error]').text()).not.toBe('')
    await w.get('#qa-f-desc').setValue('boton roto')
    await w.get('form').trigger('submit')
    expect(w.findAll('[data-testid=finding-list] li')).toHaveLength(1)
    await w.get('[data-testid=finding-list] button').trigger('click')
    expect(w.findAll('[data-testid=finding-list] li')).toHaveLength(0)
  })
})

describe('firestore.rules (estatico; el test con emulador queda PENDIENTE, ver README)', () => {
  const rules = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8')
  const code = rules.replace(/\/\/.*$/gm, '')
  it('no hay allow read ni write abierto y solo create valida (evita exponer o dejar escribir libre la coleccion)', () => {
    expect(code).not.toMatch(/allow\s+(?:[a-z,\s]*\b)?(read|write)\b/)
    expect(code).not.toMatch(/if\s+true/)
    expect(code).toMatch(/allow create: if validAttempt\(request\.resource\.data\)/)
    expect(code).toMatch(/allow get, list, update, delete: if false/)
  })
  it('las claves permitidas en reglas coinciden con schema.js (evita que cliente y reglas diverjan)', () => {
    const list = (m) => [...m.matchAll(/'([A-Za-z]+)'/g)].map((x) => x[1]).sort()
    const top = code.match(/d\.keys\(\)\.hasOnly\(\[([^\]]+)\]/)[1]
    expect(list(top)).toEqual([...DOC_KEYS, 'createdAt'].sort())
    const sc = code.match(/d\.score\.keys\(\)\.hasOnly\(\[([^\]]+)\]/)[1]
    expect(list(sc)).toEqual([...SCORE_KEYS].sort())
  })
})
