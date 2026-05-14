// tests/data/projects.test.js
// Contrato de shape para src/data/projects.js (CON-06 + D3-03).
//
// 4 tests (T1..T4):
//   T1 — projects es Array
//   T2 — si length > 0, cada item tiene los 12 campos D3-03 exactos
//   T3 — items con chapterEra===3 tienen planet* === null (Phase 5 los pobla)
//   T4 — chapterEra es number entre 0 y 6

import { describe, it, expect } from 'vitest'
import { projects } from '@/data/projects'

// Shape D3-03 (locked): 12 campos
const EXPECTED_KEYS = [
  'chapterEra',
  'descKey',
  'id',
  'imageSrc',
  'link',
  'planetColor',
  'planetOrbit',
  'planetSprite',
  'role',
  'techStack',
  'titleKey',
  'year',
].sort()

describe('projects shape contract (CON-06 + D3-03)', () => {
  it('T1 — projects es Array', () => {
    expect(Array.isArray(projects)).toBe(true)
  })

  it('T2 — si hay proyectos, cada item tiene los 12 campos D3-03 exactos', () => {
    if (projects.length === 0) return // array vacío pasa trivialmente
    projects.forEach((p) => {
      const keys = Object.keys(p).sort()
      expect(keys).toEqual(EXPECTED_KEYS)
    })
  })

  it('T3 — items con chapterEra===3 (Phase 3 scope) tienen planet* === null', () => {
    const ch3 = projects.filter((p) => p.chapterEra === 3)
    ch3.forEach((p) => {
      expect(p.planetSprite).toBeNull()
      expect(p.planetOrbit).toBeNull()
      expect(p.planetColor).toBeNull()
    })
  })

  it('T4 — chapterEra es number entre 0 y 6', () => {
    projects.forEach((p) => {
      expect(typeof p.chapterEra).toBe('number')
      expect(p.chapterEra).toBeGreaterThanOrEqual(0)
      expect(p.chapterEra).toBeLessThanOrEqual(6)
    })
  })

  // T5..T9 — Phase 5 W0: 3 items chapterEra=6 con planet fields poblados (D5-01).
  // Mapping D5-01:
  //   ch6-ar-vr        → planetOrbit:0.2 (arriba, cronológicamente earliest 2015)
  //                       planetColor:'#ff3ca6' (hot pink)
  //   ch6-remoose      → planetOrbit:0.5 (medio, 2023+)
  //                       planetColor:'#4dffff' (cyan)
  //   ch6-software-mind → planetOrbit:0.8 (fondo, cierre 2023+ convergencia AI)
  //                       planetColor:'#ffd95c' (amber)

  it('T5 — exactamente 3 items con chapterEra === 6', () => {
    const ch6 = projects.filter((p) => p.chapterEra === 6)
    expect(ch6).toHaveLength(3)
  })

  it('T6 — los 3 items ch6 tienen ids ch6-ar-vr, ch6-remoose, ch6-software-mind', () => {
    const ch6Ids = projects
      .filter((p) => p.chapterEra === 6)
      .map((p) => p.id)
      .sort()
    expect(ch6Ids).toEqual(['ch6-ar-vr', 'ch6-remoose', 'ch6-software-mind'])
  })

  it('T7 — los 3 items ch6 tienen planet* poblados (no null) — shape D3-03 Phaser fields', () => {
    const ch6 = projects.filter((p) => p.chapterEra === 6)
    ch6.forEach((p) => {
      expect(p.planetSprite, `${p.id}.planetSprite debe estar poblado`).not.toBeNull()
      expect(p.planetOrbit, `${p.id}.planetOrbit debe estar poblado`).not.toBeNull()
      expect(p.planetColor, `${p.id}.planetColor debe estar poblado`).not.toBeNull()
    })
  })

  it('T8 — planetOrbit en rango [0..1] para los 3 items ch6 (Y-normalized arrival descent)', () => {
    const ch6 = projects.filter((p) => p.chapterEra === 6)
    ch6.forEach((p) => {
      expect(typeof p.planetOrbit).toBe('number')
      expect(p.planetOrbit).toBeGreaterThanOrEqual(0)
      expect(p.planetOrbit).toBeLessThanOrEqual(1)
    })
  })

  it('T9 — planetSprite matchea /^\\/assets\\/ch6-planet-(ar-vr|remoose|software-mind)\\.png$/ (ART-05)', () => {
    const ch6 = projects.filter((p) => p.chapterEra === 6)
    ch6.forEach((p) => {
      expect(p.planetSprite).toMatch(
        /^\/assets\/ch6-planet-(ar-vr|remoose|software-mind)\.png$/
      )
    })
  })
})
