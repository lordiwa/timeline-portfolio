// tests/i18n/setup.test.js
// Verifica que vue-i18n está instalado y la instancia i18n está correctamente configurada.
//
// Cobertura (3 tests):
//   T1 — instancia i18n es truthy y global.locale.value es 'es' o 'en'
//   T2 — i18n.mode === 'composition' (legacy: false verificado)
//   T3 — package.json contiene "vue-i18n" con version ^11.x en dependencies

import { describe, it, expect } from 'vitest'
import { i18n } from '@/i18n'

describe('i18n setup', () => {
  it('T1 — instancia i18n es truthy y locale inicial es es o en', () => {
    expect(i18n).toBeTruthy()
    const locale = i18n.global.locale.value
    expect(['es', 'en']).toContain(locale)
  })

  it('T2 — i18n.mode === composition (legacy: false)', () => {
    // vue-i18n v11 con legacy:false expone mode = 'composition'
    expect(i18n.mode).toBe('composition')
  })

  it('T3 — package.json dependencies contiene vue-i18n ^11.x', async () => {
    const pkg = await import('../../package.json', { with: { type: 'json' } })
    const dep = pkg.default?.dependencies?.['vue-i18n'] ?? pkg.dependencies?.['vue-i18n']
    expect(dep).toBeDefined()
    expect(dep).toMatch(/^\^11\./)
  })
})
