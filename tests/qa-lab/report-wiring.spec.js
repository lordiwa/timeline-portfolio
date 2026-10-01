// TASK-050 fase B — el flujo de prueba cableado al lab (montaje real de App.vue). Cada spec nombra el dano que previene.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import App from '../../src/qa-lab/App.vue'
import { generateSite } from '../../src/qa-lab/generator/site.js'
import { LEVELS } from '../../src/qa-lab/generator/levels.js'
import { BUGS, BUG_BY_ID } from '../../src/qa-lab/bugs/catalog.js'
import { scoreReport } from '../../src/qa-lab/report/scorer.js'
import { buildSubmission, validateSubmission, LAB_VERSION } from '../../src/qa-lab/report/schema.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import { tick, track, cleanup } from './helpers.js'

beforeEach(() => {
  sessionStorage.clear()
  vi.stubEnv('VITE_FIREBASE_API_KEY', '') // sin config: el caso real de hoy
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

const mountApp = (props) => track(mount(App, { props, global: { plugins: [createLabI18n('es')] }, attachTo: document.body }))
const $ = (w, id) => w.find(`[data-testid="${id}"]`)

async function begin(w) {
  await $(w, 'take-test').trigger('click')
  await w.get('#qa-start-name').setValue('Ana')
  await w.get('#qa-start-email').setValue('ana@x.io')
  await w.get('[data-testid="start-attempt"]').trigger('submit')
  await tick(5)
}
async function addFinding(w, desc, bugId) {
  await w.get('#qa-f-desc').setValue(desc)
  await w.get('#qa-f-bug').setValue(bugId)
  await w.get('[data-testid="finding-form"]').trigger('submit')
  await tick(5)
}

describe('flujo de la prueba en el lab', () => {
  it('empezar, cargar 2 hallazgos y enviar sin config muestra el resultado con el puntaje correcto y no pierde el envio (evita un resultado falso o un envio perdido)', async () => {
    const seed = 'flow-1'
    const site = generateSite(seed, 'junior')
    const active = site.bugs[0]
    const inactive = BUGS.map((b) => b.id).find((id) => !site.bugs.includes(id))
    const w = mountApp({ initialSeed: seed, initialLevel: 'junior' })
    await begin(w)
    expect($(w, 'report-panel').exists()).toBe(true)
    expect($(w, 'result-solution').exists()).toBe(false) // el solucionario no se filtra antes del resultado
    await addFinding(w, 'primero', active)
    await addFinding(w, 'segundo', inactive)
    await $(w, 'submit-report').trigger('click')
    await tick(20)

    const expected = scoreReport({
      activeBugIds: site.bugs, categoryOf: (id) => BUG_BY_ID[id].category,
      findings: [{ id: 'a', guessedBugId: active }, { id: 'b', guessedBugId: inactive }],
    })
    expect($(w, 'report-result').exists()).toBe(true)
    expect($(w, 'report-result').text()).toContain(`Puntaje: ${expected.score}/100`)
    expect($(w, 'report-result').text()).toContain('Aciertos: 1')
    expect($(w, 'report-result').text()).toContain('Falsos positivos: 1')
    expect($(w, 'pending-notice').text()).toContain('El registro no está disponible todavía')
    // el solucionario recien aparece aca, con todos los activos
    expect(w.findAll('[data-testid="result-solution"] li').map((li) => li.attributes('data-bug-id'))).toEqual(site.bugs)
    // el envio no se perdio: el doc completo quedo en sessionStorage para reintentar
    const saved = JSON.parse(sessionStorage.getItem('qa-lab:attempt:flow-1:junior'))
    expect(saved.result.pending).toBe(true)
    expect(validateSubmission(saved.result.doc).ok).toBe(true)
    expect(saved.result.doc.labVersion).toBe(LAB_VERSION)
  })

  it('bugOptions trae los 36 del catalogo, en el mismo orden y con el mismo set en toda semilla (evita deducir los activos del selector)', async () => {
    const seen = []
    for (const [seed, level] of [['opt-a', 'junior'], ['opt-b', 'senior'], ['opt-c', 'semi']]) {
      const w = mountApp({ initialSeed: seed, initialLevel: level })
      await begin(w)
      const opts = w.findAll('#qa-f-bug option').slice(1)
      seen.push(opts.map((o) => `${o.attributes('value')}|${o.text()}`))
      w.unmount()
      sessionStorage.clear()
    }
    expect(seen[0]).toHaveLength(BUGS.length)
    expect(seen[0].map((x) => x.split('|')[0])).toEqual(BUGS.map((b) => b.id))
    expect(seen[1]).toEqual(seen[0])
    expect(seen[2]).toEqual(seen[0])
  })

  it('revelar durante la prueba pide confirmacion propia y deja solutionViewed=true visible (evita un intento limpio que vio la respuesta)', async () => {
    const w = mountApp({ initialSeed: 'rev-9', initialLevel: 'junior' })
    await begin(w)
    await $(w, 'reveal').trigger('click')
    expect($(w, 'confirm-dialog').exists()).toBe(true)
    expect($(w, 'solution').exists()).toBe(false) // todavia no se revelo
    await $(w, 'confirm-cancel').trigger('click')
    expect($(w, 'confirm-dialog').exists()).toBe(false)
    expect(JSON.parse(sessionStorage.getItem('qa-lab:attempt:rev-9:junior')).solutionViewed).toBe(false)
    await $(w, 'reveal').trigger('click')
    await $(w, 'confirm-ok').trigger('click')
    expect($(w, 'solution').exists()).toBe(true)
    expect($(w, 'marked').text()).toContain('quedará marcado')
    expect(JSON.parse(sessionStorage.getItem('qa-lab:attempt:rev-9:junior')).solutionViewed).toBe(true)
  })

  it('cambiar de semilla con una prueba en curso pide confirmacion: cancelar la conserva, confirmar la descarta (evita perder el trabajo sin avisar)', async () => {
    const w = mountApp({ initialSeed: 'sw-1', initialLevel: 'junior' })
    await begin(w)
    await addFinding(w, 'x', BUGS[0].id)
    await $(w, 'new-page').trigger('click')
    expect($(w, 'confirm-dialog').exists()).toBe(true)
    expect($(w, 'seed').text()).toBe('sw-1')
    await $(w, 'confirm-cancel').trigger('click')
    expect($(w, 'seed').text()).toBe('sw-1')
    expect(w.findAll('[data-testid="finding-list"] li')).toHaveLength(1)
    // cambiar el nivel tambien: el select vuelve al valor actual hasta confirmar
    await $(w, 'level').setValue('senior')
    expect($(w, 'confirm-dialog').exists()).toBe(true)
    expect($(w, 'level').element.value).toBe('junior')
    await $(w, 'confirm-cancel').trigger('click')
    await $(w, 'new-page').trigger('click')
    await $(w, 'confirm-ok').trigger('click')
    expect($(w, 'seed').text()).not.toBe('sw-1')
    expect(sessionStorage.getItem('qa-lab:attempt:sw-1:junior')).toBeNull()
    expect($(w, 'take-test').text()).toBe('Tomar la prueba')
  })

  it('tras un reload la prueba se retoma con los hallazgos y el cronometro (evita perder el intento al recargar)', async () => {
    const w1 = mountApp({ initialSeed: 'rl-1', initialLevel: 'junior' })
    await begin(w1)
    await addFinding(w1, 'persistido', BUGS[0].id)
    w1.unmount()
    const w2 = mountApp({ initialSeed: 'rl-1', initialLevel: 'junior' })
    expect($(w2, 'take-test').text()).toBe('Reporte') // ya empezada
    await $(w2, 'take-test').trigger('click')
    expect(w2.findAll('[data-testid="finding-list"] li')).toHaveLength(1)
    expect(w2.get('[data-testid="finding-list"]').text()).toContain('persistido')
    expect($(w2, 'timer').exists()).toBe(true)
  })
})

describe('level cerrado a junior/semi/senior', () => {
  const doc = (level) => buildSubmission({
    seed: 's', level, lang: 'es', candidate: { name: 'Ana', email: 'ana@x.io' }, startedAt: 1, finishedAt: 2,
    findings: [], scoreResult: scoreReport({ activeBugIds: [], findings: [] }), solutionViewed: false,
  })
  it('validateSubmission rechaza un level fuera del enum (evita guardar un nivel inventado)', () => {
    for (const l of LEVELS) expect(validateSubmission(doc(l)).ok).toBe(true)
    expect(validateSubmission(doc('expert')).ok).toBe(false)
    expect(validateSubmission(doc('')).ok).toBe(false)
  })
  it('firestore.rules fija level al mismo enum que el cliente (evita que reglas y schema diverjan)', () => {
    const code = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8').replace(/\/\/.*$/gm, '')
    const m = code.match(/d\.level in \[([^\]]+)\]/)
    expect(m).not.toBeNull()
    expect([...m[1].matchAll(/'([a-z]+)'/g)].map((x) => x[1])).toEqual(LEVELS)
  })
})

describe('review de TASK-050', () => {
  const okDoc = () => buildSubmission({
    seed: 's', level: 'junior', lang: 'es', candidate: { name: 'Ana', email: 'ana@x.io' }, startedAt: 1, finishedAt: 2,
    findings: [{ id: 'f1', page: 'p', description: 'd', severity: 'low' }], scoreResult: scoreReport({ activeBugIds: [], findings: [] }), solutionViewed: false,
  })
  it('validateSubmission rechaza un finding con clave extra o string demasiado largo (evita guardar basura dentro de un hallazgo)', () => {
    expect(validateSubmission(okDoc()).ok).toBe(true)
    const a = okDoc(); a.findings[0].extra = 'x'
    const b = okDoc(); b.findings[0].page = 'x'.repeat(101)
    const c = okDoc(); c.durationMs = 999
    expect([a, b, c].map((d) => validateSubmission(d).ok)).toEqual([false, false, false])
  })
  it('firestore.rules valida cada finding en linea (20 indices), createdAt y la ventana de tiempo (evita findings sin validar en el servidor)', () => {
    const code = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8').replace(/\/\/.*$/gm, '')
    expect(code).not.toContain('validFinding')
    for (let i = 0; i < 20; i++) expect(code).toContain(`(d.findings.size() < ${i + 1} || (d.findings[${i}] is map`)
    expect(code).not.toContain('d.findings[20]')
    expect(code).toContain('d.findings.size() <= 20')
    expect(code).toContain('d.createdAt == request.time')
    expect(code).toContain('d.durationMs == d.finishedAt - d.startedAt')
    expect(code).toContain('request.time.toMillis() + 300000')
    for (const k of ['hits', 'halfHits', 'falsePositives']) expect(code).toContain(`d.score.${k} <= 20`)
    expect(code).toContain('d.score.missed <= 36')
    expect(code).not.toContain("hasAll(['id'") // finding sin hasAll (menos nodos)
    expect(code).toContain("d.findings[0].get('guessedBugId', null)")
  })
  it('revelar antes de empezar, aunque se oculte de nuevo, marca el intento al empezar (evita un intento limpio que vio la respuesta)', async () => {
    const w = mountApp({ initialSeed: 'ev-1', initialLevel: 'junior' })
    await $(w, 'reveal').trigger('click')
    await $(w, 'reveal').trigger('click') // oculta
    await begin(w)
    expect($(w, 'marked').exists()).toBe(true)
  })
})

