// tests/phaser/ascii-postfx.test.js
//
// TASK-012 — forma del pipeline AsciiPostFX (spec §4). Cobertura (source-regex,
// mismo patrón que factory.test.js / scale.test.js — instanciar la clase real
// requiere un contexto WebGL que jsdom no provee, así que se verifica la FORMA
// del contrato, igual que el resto de los tests de Phaser en este proyecto):
//
//   T1: extiende Phaser.Renderer.WebGL.Pipelines.PostFXPipeline.
//   T2: uniforms del contrato spec §4.2 presentes (uMix, uMode, uTint, uCell,
//       uTime, uResolution).
//   T3: glifos procedurales por bitmask (técnica mattdesl, spec §4.1) — sin
//       atlas de textura, sin sampler2D de fuente.
//   T4: luminancia Rec.601 (dot(rgb, vec3(0.299, 0.587, 0.114))) y dither Bayer.
//   T5: wipe orgánico por fBm (no cortina lineal) — reutiliza smoothstep sobre
//       ruido, no un simple corte por Y.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PATH = resolve(process.cwd(), 'src/phaser/AsciiPostFX.js')
let src = ''
try { src = readFileSync(PATH, 'utf8') } catch (_) { src = '' }

describe('AsciiPostFX (TASK-012 spec §4)', () => {
  it('T1: extiende Phaser.Renderer.WebGL.Pipelines.PostFXPipeline', () => {
    expect(src).toMatch(/class\s+AsciiPostFX\s+extends\s+Phaser\.Renderer\.WebGL\.Pipelines\.PostFXPipeline/)
  })

  it('T2: uniforms del contrato (uMix, uMode, uTint, uCell, uTime, uResolution)', () => {
    for (const uniform of ['uMix', 'uMode', 'uTint', 'uCell', 'uTime', 'uResolution']) {
      expect(src, `debe declarar el uniform ${uniform}`).toMatch(new RegExp(`uniform\\s+\\w+\\s+${uniform}`))
    }
  })

  it('T3: glifos procedurales por bitmask (sin atlas de textura de fuente)', () => {
    expect(src).toMatch(/float\s+glyph\s*\(/)
    // Solo debe existir el sampler de la escena (uMainSampler) — cero samplers
    // adicionales de un atlas de fuente.
    const samplerMatches = src.match(/uniform\s+sampler2D/g) || []
    expect(samplerMatches.length).toBe(1)
  })

  it('T4: luminancia Rec.601 + dither Bayer', () => {
    expect(src).toMatch(/dot\s*\(\s*c\s*,\s*vec3\s*\(\s*0\.299\s*,\s*0\.587\s*,\s*0\.114\s*\)\s*\)/)
    expect(src).toMatch(/bayer4/)
  })

  it('T5: wipe orgánico por fBm (smoothstep sobre ruido, no cortina lineal por Y)', () => {
    expect(src).toMatch(/function\s+takeover|float\s+takeover\s*\(/)
    expect(src).toMatch(/fbm3/)
    expect(src).toMatch(/smoothstep/)
  })
})
