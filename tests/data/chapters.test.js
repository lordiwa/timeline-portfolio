// tests/data/chapters.test.js
// Contrato de shape para src/data/chapters.js (CON-05 + ART-05 + ART-06).
//
// 5 tests (T1..T5):
//   T1 — chapters es array de longitud 7
//   T2 — cada item cumple shape D3-04: { id, year, era, eraKey, titleKey, avatarSrc, palette }
//   T3 — ids van exactamente [0,1,2,3,4,5,6] (sin gaps, sin duplicados)
//   T4 — years coinciden con Phase 1 ScrollShell baseline (UI-SPEC §7.1)
//   T5 — ART-06 palette field existe como Array; ch0 y ch1 tienen hex codes concretos

import { describe, it, expect } from 'vitest'
import { chapters } from '@/data/chapters'

describe('chapters shape contract (CON-05 + ART-06)', () => {
  it('T1 — chapters es array de longitud 7', () => {
    expect(Array.isArray(chapters)).toBe(true)
    expect(chapters).toHaveLength(7)
  })

  it('T2 — cada item cumple shape D3-04: id, year, era, eraKey, titleKey, avatarSrc, palette', () => {
    chapters.forEach((ch) => {
      // id: number 0..6
      expect(typeof ch.id).toBe('number')
      expect(ch.id).toBeGreaterThanOrEqual(0)
      expect(ch.id).toBeLessThanOrEqual(6)

      // year: number
      expect(typeof ch.year).toBe('number')

      // era: string no vacío
      expect(typeof ch.era).toBe('string')
      expect(ch.era.length).toBeGreaterThan(0)

      // eraKey: referencia i18n 'chapters.N.era'
      expect(ch.eraKey).toMatch(/^chapters\.\d\.era$/)

      // titleKey: referencia i18n 'chapters.N.title'
      expect(ch.titleKey).toMatch(/^chapters\.\d\.title$/)

      // avatarSrc: convención ART-05 '/assets/chN-bust.png'
      expect(ch.avatarSrc).toMatch(/^\/assets\/ch\d-bust\.png$/)

      // palette: Array (puede estar vacío en Phase 3 para ch2..ch6)
      expect(Array.isArray(ch.palette)).toBe(true)
    })
  })

  it('T3 — ids van exactamente [0,1,2,3,4,5,6] sin gaps ni duplicados', () => {
    expect(chapters.map((c) => c.id)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('T4 — years coinciden con Phase 1 ScrollShell baseline', () => {
    expect(chapters.map((c) => c.year)).toEqual([1995, 2001, 2009, 2013, 2015, 2022, 2026])
  })

  it('T5 — ART-06 palette field: ch0 y ch1 con hex codes completos; ch2..ch6 son Array', () => {
    // ch0 — Terminal CRT: negro + verde fósforo (de chapter-themes.css)
    expect(chapters[0].palette).toEqual(['#000000', '#00ff41'])

    // ch1 — HTML 90s: navy + magenta + amarillo + blanco (de chapter-themes.css)
    expect(chapters[1].palette).toEqual(['#000080', '#ff00ff', '#ffff00', '#ffffff'])

    // ch2..ch6 — palette field existe (CONTENT-CHECKLIST §5 llena en Plan 03-05)
    for (let i = 2; i <= 6; i++) {
      expect(Array.isArray(chapters[i].palette)).toBe(true)
    }
  })
})
