// tests/phaser/space-scene-rescue.test.js
//
// TASK-012 (2026-07-29) — rescate del climax ch6 (spec .planning/design/06-ch6-
// climax-terminal-ia.md §1 + §6 + §8). Cobertura (source-regex, mismo patrón
// que space-scene-shape.test.js):
//
//   RESCATE (spec §1.2 — recomposición del mundo en la banda visible):
//     T1: ARRIVAL_DURATION_MS = 2200 (3500 → 2200, arrival comprimido).
//     T2: PLANET_XS/YS/RADII con los 3 valores exactos citados en la spec
//         (ar-vr x=170/y=1425/r=56, remoose x=820/y=1455/r=62,
//         software-mind x=600/y=1566/r=90).
//     T3: los 2 drones que quedaban fuera de encuadre (y=1040, y=580) ya NO
//         aparecen — están reubicados a y=1418 (x=260) e y=1512 (x=340).
//
//   RETIRO (spec §1.3 tabla de rescate):
//     T4: _buildAsimovPanels y _scheduleHorizonGlitch fueron eliminados (no
//         solo dejados de llamar — código muerto real, no zombie).
//
//   UNÍSONO (spec §6):
//     T5: existe _buildUnisonStruts (reemplaza _buildConstructionBeams) con
//         haces desde el robot Y desde Rafael convergiendo sobre el mismo strut.
//     T6: el cursor-estrella compartido (247, 1600) recibe partículas de AMBAS
//         curvas (Rafael→cursor, robot→cursor) — "los dos escriben en el mismo
//         cursor", no una curva unidireccional Rafael→robot.
//
//   ASCII POSTFX + DEGRADACIÓN (spec §4 + §8):
//     T7: SpaceScene registra el pipeline 'AsciiPostFX' vía addPostPipeline +
//         camera.setPostPipeline, solo si renderer.gl existe.
//     T8: bridge DOM→Phaser: listeners 'ascii-progress' y 'token-tick'.
//     T9: probe de fps (game.loop.actualFps) evaluado a los 3s y cada 5s
//         (spec §8), con manejo de tier C (PostFX off).

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SCENE_PATH = resolve(process.cwd(), 'src/phaser/SpaceScene.js')
let src = ''
try { src = readFileSync(SCENE_PATH, 'utf8') } catch (_) { src = '' }

describe('SpaceScene rescate + unísono + ASCII (TASK-012)', () => {
  it('T1: ARRIVAL_DURATION_MS = 2200 (comprimido de 3500, spec §1.2)', () => {
    expect(src).toMatch(/ARRIVAL_DURATION_MS\s*=\s*2200/)
  })

  it('T2: PLANET_XS/YS/RADII con los valores exactos de la spec §1.2', () => {
    expect(src).toMatch(/PLANET_XS\s*=\s*\[\s*170,\s*820,\s*600\s*\]/)
    expect(src).toMatch(/PLANET_YS\s*=\s*\[\s*1425,\s*1455,\s*1566\s*\]/)
    expect(src).toMatch(/PLANET_RADII\s*=\s*\[\s*56,\s*62,\s*90\s*\]/)
  })

  it('T3: los 2 drones reubicados están en la banda visible (y=1418/x=260, y=1512/x=340), no en y=1040/y=580', () => {
    expect(src).toMatch(/x:\s*260,\s*y:\s*1418/)
    expect(src).toMatch(/x:\s*340,\s*y:\s*1512/)
    // Anti-regresión: las posiciones viejas fuera de encuadre no deben reaparecer
    // como definición de dron (grepeamos el patrón completo, no solo el número,
    // porque 1040/580 podrían aparecer legítimamente en otro contexto numérico).
    expect(src).not.toMatch(/x:\s*340,\s*y:\s*1040/)
    expect(src).not.toMatch(/x:\s*260,\s*y:\s*580/)
  })

  it('T4: _buildAsimovPanels y _scheduleHorizonGlitch fueron ELIMINADOS (código muerto real, spec §1.3)', () => {
    expect(src).not.toMatch(/_buildAsimovPanels/)
    expect(src).not.toMatch(/_scheduleHorizonGlitch/)
    expect(src).not.toMatch(/_glitchRect/)
  })

  it('T5: _buildUnisonStruts existe con haces desde robot Y desde Rafael (reemplaza _buildConstructionBeams)', () => {
    // La MENCIÓN histórica en comentarios es válida (documenta el reemplazo);
    // lo prohibido es la DEFINICIÓN del método viejo.
    expect(src).not.toMatch(/_buildConstructionBeams\s*\(\s*prefersReduced\s*\)\s*\{/)
    expect(src).toMatch(/_buildUnisonStruts/)
    expect(src).toMatch(/_startUnisonTimeline/)
    expect(src).toMatch(/UNISON_ROBOT_PT/)
    expect(src).toMatch(/UNISON_RAFAEL_PT/)
  })

  it('T6: cursor-estrella compartido — DOS curvas (Rafael→cursor, robot→cursor) alimentan las mismas partículas', () => {
    expect(src).toMatch(/CURSOR_STAR/)
    expect(src).toMatch(/_filamentCurveHuman/)
    expect(src).toMatch(/_filamentCurveRobot/)
    expect(src).not.toMatch(/_filamentCurve\s*=/) // la curva única vieja ya no existe
    expect(src).toMatch(/_cursorStar/)
  })

  it('T7: registra el pipeline AsciiPostFX vía addPostPipeline + camera.setPostPipeline, gateado por renderer.gl', () => {
    expect(src).toMatch(/import\s*\{\s*AsciiPostFX\s*\}\s*from\s*['"]\.\/AsciiPostFX\.js['"]/)
    expect(src).toMatch(/addPostPipeline\s*\(\s*['"]AsciiPostFX['"]/)
    expect(src).toMatch(/setPostPipeline\s*\(\s*['"]AsciiPostFX['"]/)
    expect(src).toMatch(/this\.game\.renderer\s*&&\s*this\.game\.renderer\.gl/)
  })

  it('T8: bridge DOM→Phaser — listeners "ascii-progress" y "token-tick"', () => {
    expect(src).toMatch(/this\.game\.events\.on\s*\(\s*['"]ascii-progress['"]/)
    expect(src).toMatch(/this\.game\.events\.on\s*\(\s*['"]token-tick['"]/)
  })

  it('T9: probe de performance evaluado a los 3s y cada 5s, con manejo de tier C (postFX off)', () => {
    expect(src).toMatch(/delay:\s*3000/)
    expect(src).toMatch(/delay:\s*5000/)
    expect(src).toMatch(/_evaluatePerfTier/)
    expect(src).toMatch(/resetPostPipeline/)
  })
})
