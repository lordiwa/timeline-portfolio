// tests/assets/ch6-assets.test.js
//
// Phase 5 W1 asset existence + size budget gate.
//
// Cobertura (T1-T4 mandatorios + T5/T6 conditional):
//   T1: ch6-bg.png existe (RED hasta W1 cuando artist-creator lo genere).
//   T2: 3 planets ch6-planet-{ar-vr,remoose,software-mind}.png existen (RED hasta W1).
//   T3: 2 ships ch6-ship-{1,2}.png existen (RED hasta W1).
//   T4: ch6-bg.png ≤80 KB (Phase 6 budget carry-forward — Pitfall 12).
//   T5 (conditional): si existe ch6-bg-stars-far.png, su size ≤80 KB.
//        Si NO existe, skip silent (single-layer fallback per Open Q4 RESOLVED D5-04).
//   T6 (conditional): si existe ch6-bg-nebulae-mid.png, su size ≤80 KB.
//        Si NO existe, skip silent.
//
// W0 expected outcome: T1-T4 RED (assets aún no generados), T5/T6 GREEN
// (assets opcionales no existen → fallback aplicable, no assertion).
// W1 expected outcome: T1-T4 GREEN tras commit de los 6 assets mandatorios.
//
// Analog: tests/assets/asset-naming.test.js (readdirSync + existsSync + statSync).
// RED scaffold W0 — verde tras W1.

import { describe, it, expect } from 'vitest'
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const ASSETS_DIR = resolve(process.cwd(), 'public/assets')
const SIZE_BUDGET_BYTES = 80 * 1024 // 80 KB Phase 6 budget per asset

describe('ch6 assets existence + size budget (Phase 5 W1 gate)', () => {
  // T1 — ch6-bg.png existe
  it('T1: ch6-bg.png exists', () => {
    const path = resolve(ASSETS_DIR, 'ch6-bg.png')
    expect(
      existsSync(path),
      `Falta ch6-bg.png. W1 (artist-creator) lo genera vía forge_background con paleta D5-04 synthwave.`
    ).toBe(true)
  })

  // T2 — 3 planets existen
  it('T2: 3 planets ch6-planet-{ar-vr,remoose,software-mind}.png exist', () => {
    const slugs = ['ar-vr', 'remoose', 'software-mind']
    const missing = []
    for (const slug of slugs) {
      const path = resolve(ASSETS_DIR, `ch6-planet-${slug}.png`)
      if (!existsSync(path)) missing.push(`ch6-planet-${slug}.png`)
    }
    expect(
      missing,
      `Planets ausentes: ${JSON.stringify(missing)}. W1 los genera vía forge_sprite + bg-removal Adobe MCP.`
    ).toEqual([])
  })

  // T3 — 2 ships existen
  it('T3: 2 ships ch6-ship-{1,2}.png exist', () => {
    const missing = []
    for (const n of [1, 2]) {
      const path = resolve(ASSETS_DIR, `ch6-ship-${n}.png`)
      if (!existsSync(path)) missing.push(`ch6-ship-${n}.png`)
    }
    expect(
      missing,
      `Ships ausentes: ${JSON.stringify(missing)}. W1 los genera vía forge_sprite glitchy/neural.`
    ).toEqual([])
  })

  // T4 — ch6-bg.png ≤80 KB (Phase 6 budget carry-forward)
  it('T4: ch6-bg.png ≤80 KB (Phase 6 budget — Pitfall 12)', () => {
    const path = resolve(ASSETS_DIR, 'ch6-bg.png')
    if (!existsSync(path)) {
      // RED esperado en W0; W1 hace que exista y este branch ya no se ejecuta.
      expect(
        existsSync(path),
        `ch6-bg.png debe existir antes de medir su size. W1 (artist-creator) lo genera.`
      ).toBe(true)
      return
    }
    const size = statSync(path).size
    expect(
      size,
      `ch6-bg.png size=${size} bytes excede budget ${SIZE_BUDGET_BYTES} bytes (80KB). ` +
        `Phase 6 deploy bloqueado si bg >80KB. Ajustar Adobe MCP downscale o paleta indexada.`
    ).toBeLessThanOrEqual(SIZE_BUDGET_BYTES)
  })

  // T5 — conditional: ch6-bg-stars-far.png (si existe) ≤80 KB
  it('T5: ch6-bg-stars-far.png (si existe) ≤80 KB — single-layer fallback OK', () => {
    const path = resolve(ASSETS_DIR, 'ch6-bg-stars-far.png')
    if (!existsSync(path)) {
      // Single-layer fallback — no assertion. Test pasa GREEN.
      return
    }
    const size = statSync(path).size
    expect(
      size,
      `ch6-bg-stars-far.png size=${size} bytes excede budget ${SIZE_BUDGET_BYTES} bytes (80KB).`
    ).toBeLessThanOrEqual(SIZE_BUDGET_BYTES)
  })

  // T6 — conditional: ch6-bg-nebulae-mid.png (si existe) ≤80 KB
  it('T6: ch6-bg-nebulae-mid.png (si existe) ≤80 KB — single-layer fallback OK', () => {
    const path = resolve(ASSETS_DIR, 'ch6-bg-nebulae-mid.png')
    if (!existsSync(path)) {
      // Single-layer fallback — no assertion. Test pasa GREEN.
      return
    }
    const size = statSync(path).size
    expect(
      size,
      `ch6-bg-nebulae-mid.png size=${size} bytes excede budget ${SIZE_BUDGET_BYTES} bytes (80KB).`
    ).toBeLessThanOrEqual(SIZE_BUDGET_BYTES)
  })
})
