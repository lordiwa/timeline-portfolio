// tests/phaser/prm.test.js
//
// Phase 5 W0 — RED scaffold para PRM behavior in SpaceScene (D5-08 + A11Y-05).
//
// Cobertura (3 tests source-regex):
//   T1: SpaceScene lee `this.registry.get('prefersReduced')` para decidir branch
//   T2: PRM branch sets `cameras.main.setScroll(...)` DIRECTO sin tween (instant cut)
//   T3: PRM cinturón: `this.tweens.timeScale = 0` presente como safety en branch PRM
//
// Rationale (D5-08):
//   - Arrival cinematográfico: PRM → instant cut, NO tween de descenso.
//   - Ships loop: PRM → estáticos (no cruzando).
//   - Mantra fade-in: PRM → instant (sin fade animation).
//   - Cinturón de seguridad: `tweens.timeScale = 0` en branch PRM para abortar tweens
//     declarados fuera de control directo (defensive).
//
// RED scaffold W0 — verde tras W2 crea SpaceScene.js con branch PRM.

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

describe('SpaceScene PRM behavior (D5-08 + A11Y-05) — RED W0 → verde W2', () => {
  it('T1: SpaceScene lee this.registry.get(\'prefersReduced\') (branch decision)', () => {
    expect(
      src,
      'SpaceScene debe leer `this.registry.get(\'prefersReduced\')` para activar branch PRM. ' +
        'W2 crea este archivo.'
    ).toMatch(/this\.registry\.get\s*\(\s*['"]prefersReduced['"]\s*\)/)
  })

  it('T2: PRM branch usa cameras.main.setScroll DIRECTO sin tween (instant cut D5-08)', () => {
    // Buscar combinación: prefersReduced (branch flag) + setScroll (instant cam position)
    // dentro del mismo contexto.
    expect(
      src,
      'SpaceScene PRM branch debe usar `this.cameras.main.setScroll(...)` para posicionar cámara ' +
        'INSTANT sin tween. D5-08 dicta arrival cinematográfico = instant cut bajo PRM. W2 crea este archivo.'
    ).toMatch(/prefersReduced[\s\S]*?(this\.cameras\.main\.setScroll|cameras\.main\.setScroll)/)
  })

  it('T3: PRM cinturón — this.tweens.timeScale = 0 presente (defensive global tween abort)', () => {
    expect(
      src,
      'SpaceScene PRM branch debe declarar `this.tweens.timeScale = 0` como cinturón de seguridad. ' +
        'D5-08: aborta tweens declarados fuera de control directo. W2 crea este archivo.'
    ).toMatch(/this\.tweens\.timeScale\s*=\s*0/)
  })
})
