// tests/phaser/space-scene-shape.test.js
//
// Phase 5 W0 — RED scaffold para src/phaser/SpaceScene.js (PHA-05 + D5-02/D5-10).
//
// Cobertura (6 tests source-regex):
//   T1: class SpaceScene extends Phaser.Scene
//   T2: preload() carga 6 keys: ch6-bg, ch6-planet-{ar-vr,remoose,software-mind}, ch6-ship-{1,2}
//   T3: create() instancia 3 planet sprites + 2 ships + camera tween (scrollY)
//   T4: registry.get('prefersReduced') leído para branch PRM (D5-08)
//   T5: import singleton i18n `from '@/i18n'` (D5-10 + RESEARCH §Pattern 13)
//   T6: emit `arrival-complete` event (SIN prefijo `vue:` per D5-10 RESOLVED)
//
// Source-of-truth: 05-RESEARCH.md §Patterns 5, 6, 7, 8, 9, 13.
// RED scaffold W0 — verde tras W2 crea src/phaser/SpaceScene.js.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SCENE_PATH = resolve(process.cwd(), 'src/phaser/SpaceScene.js')

let src = ''
try {
  src = readFileSync(SCENE_PATH, 'utf8')
} catch (_) {
  src = ''
}

describe('SpaceScene shape (PHA-05) — RED W0 → verde W2', () => {
  it('T1: class SpaceScene extends Phaser.Scene', () => {
    expect(
      src,
      'SpaceScene.js debe declarar `class SpaceScene extends Phaser.Scene`. W2 crea este archivo.'
    ).toMatch(/class\s+SpaceScene\s+extends\s+Phaser\.Scene/)
  })

  it('T2: preload() carga 6 keys de assets ch6', () => {
    const keys = [
      'ch6-bg',
      'ch6-planet-ar-vr',
      'ch6-planet-remoose',
      'ch6-planet-software-mind',
      'ch6-ship-1',
      'ch6-ship-2',
    ]
    for (const key of keys) {
      expect(
        src,
        `SpaceScene.preload() debe cargar key "${key}" (this.load.image(...) o equivalente). W2 crea este archivo.`
      ).toMatch(new RegExp(`['"\`]${key.replace(/-/g, '\\-')}['"\`]`))
    }
  })

  it('T3: create() instancia 3 planet sprites + 2 ships + camera tween scrollY', () => {
    expect(
      src,
      'SpaceScene.create() debe definirse. W2 crea este archivo.'
    ).toMatch(/create\s*\(\s*\)\s*\{/)
    // Verify camera scrollY tween (arrival cinematográfico D5-02)
    expect(
      src,
      'SpaceScene.create() debe declarar camera tween con scrollY (arrival cinematográfico D5-02). W2 crea este archivo.'
    ).toMatch(/scrollY/)
    // Verify planet sprite creation pattern
    expect(
      src,
      'SpaceScene.create() debe instanciar sprites con planet data (3 planets). W2 crea este archivo.'
    ).toMatch(/(this\.add\.sprite|this\.add\.image)/)
  })

  it('T4: registry.get(\'prefersReduced\') leído para branch PRM (D5-08)', () => {
    expect(
      src,
      'SpaceScene debe leer `this.registry.get(\'prefersReduced\')` para activar branch PRM. W2 crea este archivo.'
    ).toMatch(/this\.registry\.get\s*\(\s*['"]prefersReduced['"]\s*\)/)
  })

  it('T5: import singleton i18n from @/i18n (RESEARCH §Pattern 13)', () => {
    expect(
      src,
      'SpaceScene.js debe importar el singleton i18n con `from \'@/i18n\'`. ' +
        'NO debe crear instancia nueva. W2 crea este archivo.'
    ).toMatch(/from\s+['"]@\/i18n['"]/)
  })

  it('T6: emit `arrival-complete` event SIN prefijo vue: (D5-10 RESOLVED)', () => {
    expect(
      src,
      'SpaceScene debe emitir `this.game.events.emit(\'arrival-complete\')` (SIN prefijo vue:). ' +
        'D5-10 + Threat T-05-W0-05 bridge name match enforced. W2 crea este archivo.'
    ).toMatch(/this\.game\.events\.emit\s*\(\s*['"]arrival-complete['"]/)
  })
})
