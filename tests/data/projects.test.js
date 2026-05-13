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
})
