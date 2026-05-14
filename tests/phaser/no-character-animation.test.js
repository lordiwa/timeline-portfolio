// tests/phaser/no-character-animation.test.js
//
// Phase 5 W0 — RED scaffold anti-pattern guard (PHA-08).
//
// Cobertura (3 tests):
//   T1: NO match `this.anims.create` — no character animation system
//   T2: NO match `spritesheet.*frames` — no spritesheet frames (pixelforge no entrega frames coherentes)
//   T3: NO match `playAnimation` — no anim.play() calls
//
// Rationale (CLAUDE.md §6.4 + RESEARCH §Anti-Patterns):
//   pixelforge.forge_animation entrega frames incoherentes entre sí — cada frame es generación
//   nueva. Phase 5 evita character animation: ships usan tween position-based (Pattern 8),
//   no spritesheet frame stepping.
//
// RED scaffold W0 — verde tras W2 crea SpaceScene.js (sin anims). Si W2 introduce anims, este
// test ROMPE — guarda contra drift.

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

describe('PHA-08: NO character animation in SpaceScene — RED W0 → verde W2', () => {
  it('T1: SpaceScene.js NO usa this.anims.create() — animation system forbidden', () => {
    if (src.length === 0) {
      // W2 aún no creó el archivo. RED expected. Marker explicit:
      expect(
        src,
        'src/phaser/SpaceScene.js debe existir (W2 lo crea). RED esperado en W0.'
      ).not.toBe('')
      return
    }
    expect(
      src,
      'SpaceScene NO debe llamar `this.anims.create()`. PHA-08 forbids character animation. ' +
        'Use tween position-based para ships (Pattern 8).'
    ).not.toMatch(/this\.anims\.create/)
  })

  it('T2: SpaceScene.js NO usa spritesheet con frames — pixelforge incoherente cross-frame', () => {
    if (src.length === 0) {
      expect(src, 'src/phaser/SpaceScene.js debe existir (W2 lo crea). RED esperado en W0.').not.toBe('')
      return
    }
    expect(
      src,
      'SpaceScene NO debe usar `spritesheet(... { frames }`. pixelforge no entrega frames coherentes ' +
        '(cada frame es generación nueva). Use single sprites + tweens.'
    ).not.toMatch(/spritesheet[\s\S]{0,80}frames/)
  })

  it('T3: SpaceScene.js NO usa playAnimation / anim.play()', () => {
    if (src.length === 0) {
      expect(src, 'src/phaser/SpaceScene.js debe existir (W2 lo crea). RED esperado en W0.').not.toBe('')
      return
    }
    expect(
      src,
      'SpaceScene NO debe llamar `playAnimation(...)` ni `anims.play(...)`. PHA-08 forbids.'
    ).not.toMatch(/playAnimation|anims\.play\s*\(/)
  })
})
