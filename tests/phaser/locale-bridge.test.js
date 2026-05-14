// tests/phaser/locale-bridge.test.js
//
// Phase 5 W0 — RED scaffold para locale bridge (PHA-06 + D5-10).
//
// Cobertura (5 tests, T5 nuevo per Blocker 3 — bridge emit name match):
//   T1: SpaceScene.js registra listener `this.game.events.on('locale-changed', ...)`
//       (nombre SIN prefijo `vue:` per D5-10 RESOLVED).
//   T2: cleanup en SHUTDOWN — Phaser.Scenes.Events.SHUTDOWN listener con `game.events.off`.
//   T3: handler re-translates `tooltipTexts` usando `i18n.global.t(...)`.
//   T4: Chapter6Content.vue declara `game.value?.events.emit` (defensive null-guard).
//   T5: Bridge emit name match — Chapter6Content.vue emite 'locale-changed' EXACT
//       (sin prefijo vue:). Threat T-05-W0-05 mitigation. Si los nombres divergen,
//       el bridge queda silenciosamente roto.
//
// RED scaffold W0 — verde tras W2 (SpaceScene) + W3 (Chapter6Content).

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SCENE_PATH = resolve(process.cwd(), 'src/phaser/SpaceScene.js')
const CH6_PATH = resolve(process.cwd(), 'src/components/Chapter6Content.vue')

let sceneSrc = ''
let ch6Src = ''
try { sceneSrc = readFileSync(SCENE_PATH, 'utf8') } catch (_) { sceneSrc = '' }
try { ch6Src = readFileSync(CH6_PATH, 'utf8') } catch (_) { ch6Src = '' }

describe('Phaser locale bridge (PHA-06 + D5-10) — RED W0 → verde W2/W3', () => {
  it('T1: SpaceScene registra listener `this.game.events.on(\'locale-changed\', ...)`', () => {
    expect(
      sceneSrc,
      'SpaceScene debe registrar listener `this.game.events.on(\'locale-changed\', ...)`. ' +
        'Nombre SIN prefijo vue: per D5-10. W2 crea este archivo.'
    ).toMatch(/this\.game\.events\.on\s*\(\s*['"]locale-changed['"]/)
  })

  it('T2: cleanup SHUTDOWN — game.events.off(\'locale-changed\', ...)', () => {
    expect(
      sceneSrc,
      'SpaceScene debe declarar `this.events.on(Phaser.Scenes.Events.SHUTDOWN, ...)` que llama ' +
        '`this.game.events.off(\'locale-changed\', ...)`. W2 crea este archivo.'
    ).toMatch(/Phaser\.Scenes\.Events\.SHUTDOWN/)
    expect(
      sceneSrc,
      'SHUTDOWN cleanup debe llamar `this.game.events.off(\'locale-changed\', ...)`. W2 crea este archivo.'
    ).toMatch(/this\.game\.events\.off\s*\(\s*['"]locale-changed['"]/)
  })

  it('T3: handler re-translates tooltips via i18n.global.t(...)', () => {
    expect(
      sceneSrc,
      'Handler locale-changed debe llamar `i18n.global.t(...)` para re-translate tooltips. W2 crea este archivo.'
    ).toMatch(/i18n\.global\.t\s*\(/)
  })

  it('T4: Chapter6Content.vue declara `game.value?.events.emit` defensive null-guard', () => {
    expect(
      ch6Src,
      'Chapter6Content.vue debe emitir locale change con `game.value?.events.emit(...)` ' +
        '(optional chaining defensive null-guard). W3 crea este archivo.'
    ).toMatch(/game\.value\?\.events\.emit/)
  })

  it('T5: Chapter6Content.vue emite EXACTAMENTE \'locale-changed\' (Threat T-05-W0-05)', () => {
    // Blocker 3 RESOLVED: el nombre del evento emitido desde Chapter6Content DEBE coincidir
    // EXACTO con el listener registrado en SpaceScene. Sin esto el bridge queda silenciosamente
    // roto en runtime (PHA-06 violation).
    expect(
      ch6Src,
      'Chapter6Content.vue debe emitir `game.value?.events.emit(\'locale-changed\', ...)` ' +
        'EXACTO (sin prefijo vue:). Match contra listener en SpaceScene.js. ' +
        'Threat T-05-W0-05 mitigation. W3 crea este archivo.'
    ).toMatch(/game\.value\?\.events\.emit\s*\(\s*['"]locale-changed['"]/)
  })
})
