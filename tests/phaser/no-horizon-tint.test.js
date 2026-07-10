// tests/phaser/no-horizon-tint.test.js
//
// Regression guard (ERA-AGNT-02 bug fix — freeze ch6).
//
// Cobertura (2 tests de ausencia):
//   T1: NO match `cameras.main.setTint` — API ausente en Phaser 3.90
//   T2: NO match `.clearTint(` — API ausente en Phaser 3.90
//
// Rationale:
//   Phaser 3.90 eliminó setTint/clearTint de la Camera. Llamarlos lanzaba
//   TypeError dentro del game step (~12-17s tras entrar a ch6), matando el
//   RAF loop y congelando toda la escena permanentemente.
//   Fix: se usa Rectangle GameObject (setFillStyle/setVisible) en su lugar.
//   Este test evita que el error se reintroduzca.

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

describe('Phaser 3.90 camera API — NO setTint/clearTint (freeze prevention)', () => {
  it('T1: SpaceScene.js NO usa cameras.main.setTint() — API ausente en Phaser 3.90', () => {
    expect(
      src,
      'SpaceScene NO debe llamar `cameras.main.setTint(...)`. ' +
        'API eliminada en Phaser 3.90 — TypeError mata el game loop y congela la escena. ' +
        'Usar Rectangle GameObject con setFillStyle/setVisible en su lugar.'
    ).not.toMatch(/cameras\.main\.setTint/)
  })

  it('T2: SpaceScene.js NO usa .clearTint() en cámara — API ausente en Phaser 3.90', () => {
    expect(
      src,
      'SpaceScene NO debe llamar `.clearTint()` sobre la cámara. ' +
        'API eliminada en Phaser 3.90 — causa TypeError que mata el game loop.'
    ).not.toMatch(/\.clearTint\s*\(/)
  })
})
