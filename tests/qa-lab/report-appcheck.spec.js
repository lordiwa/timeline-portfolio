// TASK-050 — App Check (reCAPTCHA v3) en el envio. Modulos de firebase mockeados.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ name: 'app' })),
  getApps: vi.fn(() => []),
  initializeAppCheck: vi.fn(),
  provider: vi.fn(function (key) { this.key = key }),
  addDoc: vi.fn(async () => ({ id: 'doc1' })),
}))
vi.mock('firebase/app', () => ({ initializeApp: m.initializeApp, getApps: m.getApps }))
vi.mock('firebase/app-check', () => ({ initializeAppCheck: m.initializeAppCheck, ReCaptchaV3Provider: m.provider }))
vi.mock('firebase/firestore', () => ({ getFirestore: () => ({}), collection: () => ({}), addDoc: m.addDoc, serverTimestamp: () => 'TS' }))

import { submitReport } from '../../src/qa-lab/report/firebase.js'
import { buildSubmission } from '../../src/qa-lab/report/schema.js'
import { scoreReport } from '../../src/qa-lab/report/scorer.js'

const doc = () => buildSubmission({
  seed: 's', level: 'junior', lang: 'es', candidate: { name: 'Ana', email: 'ana@x.io' }, startedAt: 1, finishedAt: 2,
  findings: [], scoreResult: scoreReport({ activeBugIds: [], findings: [] }), solutionViewed: false,
})
const cfg = { VITE_FIREBASE_API_KEY: 'k', VITE_FIREBASE_AUTH_DOMAIN: 'd', VITE_FIREBASE_PROJECT_ID: 'p', VITE_FIREBASE_APP_ID: 'a' }

describe('App Check', () => {
  beforeEach(() => { vi.clearAllMocks(); m.getApps.mockReturnValue([]) })

  it('sin VITE_RECAPTCHA_SITE_KEY no inicializa App Check, avisa una sola vez y el envio sigue (evita romper dev y tests)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect((await submitReport(doc(), cfg)).ok).toBe(true)
    m.getApps.mockReturnValue([])
    expect((await submitReport(doc(), cfg)).ok).toBe(true)
    expect(m.initializeAppCheck).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('con la clave llama a initializeAppCheck con el provider reCAPTCHA v3 y auto-refresh, y manda createdAt (evita enviar sin App Check)', async () => {
    const r = await submitReport(doc(), { ...cfg, VITE_RECAPTCHA_SITE_KEY: 'site-key' })
    expect(r.ok).toBe(true)
    expect(m.initializeAppCheck).toHaveBeenCalledTimes(1)
    const [app, opts] = m.initializeAppCheck.mock.calls[0]
    expect(app).toEqual({ name: 'app' })
    expect(opts.provider.key).toBe('site-key')
    expect(opts.isTokenAutoRefreshEnabled).toBe(true)
    expect(m.initializeApp.mock.invocationCallOrder[0]).toBeLessThan(m.initializeAppCheck.mock.invocationCallOrder[0])
    expect(m.addDoc.mock.calls[0][1].createdAt).toBe('TS')
  })
})
