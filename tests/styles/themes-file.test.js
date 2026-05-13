// tests/styles/themes-file.test.js
// Verifica existencia del archivo src/styles/chapter-themes.css y su estructura @layer.
// Tests ARQUITECTURALES: verifican el texto fuente con readFileSync (no CSS computado).
//
// Cobertura: THM-01 (7 chapter blocks presentes), THM-02 (@layer cascade correcto).
// Nota: jsdom NO resuelve @layer cascade + CSS Custom Props heredados via DOM tree walk.
// Ver plan `notes.jsdom_limitation`. Validación visual computed-style → W5 §1 manual.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const CSS_PATH = resolve(process.cwd(), 'src/styles/chapter-themes.css')

let source = ''
try {
  source = readFileSync(CSS_PATH, 'utf8')
} catch (_) {
  source = ''
}

describe('themes-file.test.js — @layer architecture (THM-01 + THM-02)', () => {
  // T1: El archivo existe y no está vacío
  it('T1: src/styles/chapter-themes.css exists and is non-empty', () => {
    expect(existsSync(CSS_PATH)).toBe(true)
    expect(source.length).toBeGreaterThan(0)
  })

  // T2: Contiene la declaración @layer con el orden correcto (THM-02)
  it('T2: contains @layer reset, themes, components, utilities declaration', () => {
    expect(source).toMatch(/@layer\s+reset\s*,\s*themes\s*,\s*components\s*,\s*utilities\s*;/)
  })

  // T3: Contiene el wrapper @layer themes { ... } con chapter selectors dentro
  it('T3: contains @layer themes { } wrapper block with chapter content', () => {
    expect(source).toContain('@layer themes {')
    // El bloque @layer themes debe contener al menos un selector data-chapter
    const layerThemesMatch = source.match(/@layer themes\s*\{([\s\S]*)\}(?:\s*$|\s*@layer)/)
    // Alternativa: verificar que existe el wrapper y tiene chapter blocks
    expect(source).toMatch(/@layer themes\s*\{[\s\S]*\[data-chapter=/)
  })

  // T4: Exactamente 7 bloques únicos [data-chapter="N"] (N=0..6) — THM-01
  it('T4: contains exactly 7 unique [data-chapter="N"] selectors (0..6) — THM-01', () => {
    const matches = Array.from(source.matchAll(/\[data-chapter="(\d)"\]/g)).map(m => m[1])
    const unique = [...new Set(matches)]
    unique.sort()
    expect(unique).toEqual(['0', '1', '2', '3', '4', '5', '6'])
  })
})
