// tests/i18n/parity.test.js
// Verifica paridad exacta de keys entre en.json y es.json (I18N-02).
//
// Cobertura (3 tests):
//   T1 — flatten(en).sort() deep-equals flatten(es).sort() — paridad completa
//   T2 — ambos JSON contienen keys chapters.0.title ... chapters.6.title
//   T3 — ambos JSON contienen ui.skipLink, ui.langToggle.*, ui.timeline.*, avatar.*

import { describe, it, expect } from 'vitest'
import en from '@/i18n/en.json'
import es from '@/i18n/es.json'

// Flatten un objeto anidado a un array de dotted-paths (keys hoja solamente).
// Análogo a RESEARCH §Pattern 4 líneas 786-800.
function flatten(obj, prefix = '') {
  return Object.keys(obj).flatMap((k) => {
    const path = prefix ? `${prefix}.${k}` : k
    return typeof obj[k] === 'object' && obj[k] !== null
      ? flatten(obj[k], path)
      : [path]
  })
}

describe('i18n key parity (I18N-02)', () => {
  it('T1 — en.json y es.json tienen exactamente las mismas keys', () => {
    const enKeys = flatten(en).sort()
    const esKeys = flatten(es).sort()
    expect(enKeys).toEqual(esKeys)
  })

  it('T2 — ambos JSON tienen las 7 chapter titles (chapters.0.title ... chapters.6.title)', () => {
    for (let i = 0; i <= 6; i++) {
      expect(en.chapters[String(i)]?.title).toBeDefined()
      expect(es.chapters[String(i)]?.title).toBeDefined()
    }
  })

  it('T3 — ambos JSON tienen ui.skipLink, ui.langToggle.*, ui.timeline.*, avatar.ariaTemplate, avatar.busts.*.alt', () => {
    // ui keys
    expect(en.ui?.skipLink).toBeDefined()
    expect(es.ui?.skipLink).toBeDefined()
    expect(en.ui?.langToggle?.aria).toBeDefined()
    expect(es.ui?.langToggle?.aria).toBeDefined()
    expect(en.ui?.langToggle?.label).toBeDefined()
    expect(es.ui?.langToggle?.label).toBeDefined()
    expect(en.ui?.timeline?.navAria).toBeDefined()
    expect(es.ui?.timeline?.navAria).toBeDefined()
    expect(en.ui?.timeline?.tickAria).toBeDefined()
    expect(es.ui?.timeline?.tickAria).toBeDefined()
    // avatar keys
    expect(en.avatar?.ariaTemplate).toBeDefined()
    expect(es.avatar?.ariaTemplate).toBeDefined()
    for (let i = 0; i <= 6; i++) {
      expect(en.avatar?.busts[String(i)]?.alt).toBeDefined()
      expect(es.avatar?.busts[String(i)]?.alt).toBeDefined()
    }
  })
})
