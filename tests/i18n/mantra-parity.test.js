// tests/i18n/mantra-parity.test.js
//
// Phase 5 W0 — Complementary parity guard for chapters.6.mantra (CON-04 + A11Y-06).
//
// Cobertura (3 tests):
//   T1: chapters.6.mantra existe en es.json con valor string trim length >= 5 chars.
//   T2: chapters.6.mantra existe en en.json con valor string trim length >= 5 chars.
//   T3: ES y EN son strings DISTINTOS (no copy-paste — el mantra está traducido).
//
// Por qué un test separado de parity.test.js:
//   parity.test.js T1 sólo verifica paridad de keys flat — NO el valor non-empty.
//   Esto guarda contra reintroducción accidental de empty string o mismo valor en
//   ES y EN (D5-03 lockea: "Y siempre muestra una sonrisa" ES vs "And always show a smile" EN).
//   Blocker 4 RESOLVED Opción A (mantra-parity test cubre CON-04 + A11Y-06 explícitamente).
//
// Estado esperado tras Task 3 commit: GREEN (mantra ES + EN poblados con strings distintos).
// RED→GREEN scaffold W0 (verde ya tras Task 3 — no requiere waves posteriores).

import { describe, it, expect } from 'vitest'
import es from '@/i18n/es.json'
import en from '@/i18n/en.json'

describe('mantra-parity.test.js — chapters.6.mantra A11Y-06 + CON-04 guard', () => {
  it('T1: es.json chapters.6.mantra existe + trim length >= 5 chars (no empty)', () => {
    const mantraEs = es?.chapters?.['6']?.mantra
    expect(
      mantraEs,
      'chapters.6.mantra debe existir en es.json (D5-03 + A11Y-06)'
    ).toBeDefined()
    expect(typeof mantraEs).toBe('string')
    expect(
      mantraEs.trim().length,
      `mantra ES no debe ser empty/whitespace-only; recibido: "${mantraEs}"`
    ).toBeGreaterThanOrEqual(5)
  })

  it('T2: en.json chapters.6.mantra existe + trim length >= 5 chars (no empty)', () => {
    const mantraEn = en?.chapters?.['6']?.mantra
    expect(
      mantraEn,
      'chapters.6.mantra debe existir en en.json (D5-03 + A11Y-06)'
    ).toBeDefined()
    expect(typeof mantraEn).toBe('string')
    expect(
      mantraEn.trim().length,
      `mantra EN no debe ser empty/whitespace-only; recibido: "${mantraEn}"`
    ).toBeGreaterThanOrEqual(5)
  })

  it('T3: ES y EN son strings DISTINTOS (copy traducido, no copy-paste)', () => {
    const mantraEs = es?.chapters?.['6']?.mantra
    const mantraEn = en?.chapters?.['6']?.mantra
    // D5-03 locked:
    //   ES: "Y siempre muestra una sonrisa"
    //   EN: "And always show a smile"
    expect(
      mantraEs,
      `mantra ES y EN no deben ser idénticos. ES="${mantraEs}", EN="${mantraEn}". ` +
        `El mantra debe estar TRADUCIDO entre idiomas (D5-03).`
    ).not.toBe(mantraEn)
  })
})
