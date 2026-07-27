// tests/styles/themes-file.test.js
// TASK-008: verifica la arquitectura de capas del sistema de tokens nuevo
// (tokens.css + eras.css) que reemplaza a src/styles/chapter-themes.css.
//
// Cobertura: AC#1 (peso), AC#2 (sin duplicación section/HUD), THM-01/THM-02
// heredados (7 chapter blocks presentes, @layer cascade correcto).
// Tests ARQUITECTURALES: verifican el texto fuente con readFileSync (no CSS
// computado). Ver plan `notes.jsdom_limitation` — validación visual → manual.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const TOKENS_PATH = resolve(process.cwd(), 'src/styles/tokens.css')
const ERAS_PATH = resolve(process.cwd(), 'src/styles/eras.css')
const CHASSIS_PATH = resolve(process.cwd(), 'src/styles/chassis.css')
const OLD_THEMES_PATH = resolve(process.cwd(), 'src/styles/chapter-themes.css')

const tokensSource = existsSync(TOKENS_PATH) ? readFileSync(TOKENS_PATH, 'utf8') : ''
const erasSource = existsSync(ERAS_PATH) ? readFileSync(ERAS_PATH, 'utf8') : ''

describe('themes-file.test.js — tokens.css + eras.css architecture (TASK-008)', () => {
  // T1: los archivos nuevos existen y no están vacíos
  it('T1: src/styles/tokens.css and eras.css exist and are non-empty', () => {
    expect(existsSync(TOKENS_PATH)).toBe(true)
    expect(existsSync(ERAS_PATH)).toBe(true)
    expect(tokensSource.length).toBeGreaterThan(0)
    expect(erasSource.length).toBeGreaterThan(0)
  })

  // T2: el archivo viejo ya no existe (AC#1 — reemplazado, no solo reducido)
  it('T2: src/styles/chapter-themes.css no longer exists (replaced by tokens.css + eras.css)', () => {
    expect(existsSync(OLD_THEMES_PATH)).toBe(false)
  })

  // T3: tokens.css declara el orden de @layer con tokens/themes/chassis (spec §3)
  it('T3: tokens.css contains the canonical @layer order declaration', () => {
    expect(tokensSource).toMatch(
      /@layer\s+reset\s*,\s*tokens\s*,\s*themes\s*,\s*chassis\s*,\s*components\s*,\s*transitions\s*,\s*utilities\s*;/
    )
  })

  // T4: eras.css envuelve los bloques de era en @layer themes { }
  it('T4: eras.css contains @layer themes { } wrapper block with chapter content', () => {
    expect(erasSource).toContain('@layer themes {')
    expect(erasSource).toMatch(/@layer themes\s*\{[\s\S]*\[data-chapter=/)
  })

  // T5: exactamente 7 bloques únicos [data-chapter="N"] (N=0..6) — THM-01
  it('T5: contains exactly 7 unique [data-chapter="N"] selectors (0..6) — THM-01', () => {
    const matches = Array.from(erasSource.matchAll(/\[data-chapter="(\d)"\]/g)).map((m) => m[1])
    const unique = [...new Set(matches)]
    unique.sort()
    expect(unique).toEqual(['0', '1', '2', '3', '4', '5', '6'])
  })

  // T6 (AC#2 regression lock): cada era usa el selector de doble scope UNA vez —
  // ya no puede existir un [data-chapter="N"] Y un :root[data-active-chapter="N"]
  // como bloques SEPARADOS con sus propios tokens (la duplicación verbatim que
  // TASK-008 elimina). El único :root[data-active-chapter="N"] por era debe
  // aparecer en la MISMA declaración de selector que su [data-chapter="N"].
  it('T6 (AC#2 regression lock): each era declares its section+HUD scope in ONE double-scope block, never two separate blocks', () => {
    for (let i = 0; i <= 6; i++) {
      // El selector de doble scope debe existir tal cual (una sola declaración
      // que abre AMBOS ámbitos a la vez).
      const doubleScopePattern = new RegExp(
        `\\[data-chapter="${i}"\\]\\s*,\\s*\\n\\s*:root\\[data-active-chapter="${i}"\\]\\s*\\{`
      )
      expect(
        erasSource,
        `chapter ${i}: falta el selector de doble scope [data-chapter="${i}"], :root[data-active-chapter="${i}"] { }`
      ).toMatch(doubleScopePattern)

      // `:root[data-active-chapter="N"]` debe aparecer EXACTAMENTE una vez en
      // todo el archivo — si aparece una segunda vez, es un bloque HUD
      // duplicado por fuera del selector de doble scope (la deuda que este
      // ticket elimina, chapter-themes.css línea 169 del archivo viejo).
      const hudSelectorCount = (
        erasSource.match(new RegExp(`:root\\[data-active-chapter="${i}"\\]`, 'g')) || []
      ).length
      expect(
        hudSelectorCount,
        `chapter ${i}: :root[data-active-chapter="${i}"] aparece ${hudSelectorCount} veces — se esperaba 1 (duplicación reintroducida)`
      ).toBe(1)
    }
  })

  // T7 (AC#1 regression lock): tokens.css + eras.css combinados <= 25 KB.
  it('T7 (AC#1 regression lock): tokens.css + eras.css combined size is <= 25 KB', () => {
    const totalBytes = statSync(TOKENS_PATH).size + statSync(ERAS_PATH).size
    expect(
      totalBytes,
      `tokens.css + eras.css pesan ${(totalBytes / 1024).toFixed(1)} KB, máximo 25 KB (AC#1 de TASK-008)`
    ).toBeLessThanOrEqual(25 * 1024)
  })

  // T8: chassis.css existe (identidad RAFAEL-OS) y declara --hud-radius/--hud-glow/
  // --hud-scanline-alpha derivados de --era-progress (AC#5 regression lock: el
  // chasis debe interpolar sin JS — si esto desaparece, la prueba visual de AC#5
  // deja de tener un consumidor real que la sostenga).
  it('T8 (AC#5 regression lock): chassis.css derives --hud-radius/--hud-glow/--hud-scanline-alpha from --era-progress', () => {
    expect(existsSync(CHASSIS_PATH)).toBe(true)
    const chassisSource = readFileSync(CHASSIS_PATH, 'utf8')
    expect(chassisSource).toMatch(/--hud-radius:\s*calc\([^)]*var\(--era-progress\)[^)]*\)/)
    expect(chassisSource).toMatch(/--hud-glow:\s*calc\([^)]*var\(--era-progress\)[^)]*\)/)
    expect(chassisSource).toMatch(/--hud-scanline-alpha:\s*calc\([^)]*var\(--era-progress\)[^)]*\)/)
  })

  // T9 (AC#5 regression lock): --era-progress está registrada con @property
  // syntax '<number>' — sin esto, calc() con --era-progress no interpola.
  it('T9 (AC#5 regression lock): tokens.css registers --era-progress via @property as <number>', () => {
    expect(tokensSource).toMatch(/@property\s+--era-progress\s*\{[^}]*syntax:\s*'<number>'/)
  })
})
