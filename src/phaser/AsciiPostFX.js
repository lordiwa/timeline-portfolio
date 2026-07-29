// src/phaser/AsciiPostFX.js — TASK-012 ch6 climax PostFXPipeline.
//
// Fuente de verdad: .planning/design/06-ch6-climax-terminal-ia.md §4. Render ASCII
// clásico por GPU: glifos PROCEDURALES en grilla 5x7 (bitmask float, técnica
// mattdesl `glsl-ascii-filter`), luminancia Rec.601, dither ordenado Bayer 4x4,
// wipe orgánico por fBm (no cortina lineal). GLSL 1.00 / WebGL1, sin texturas de
// fuente, sin extensiones — casa con el resto de la escena (SPACE_BG_FRAG).
//
// Uniforms controlados desde Vue vía bridge 'ascii-progress' (SpaceScene.js
// handleAsciiProgress): uMix (0..1 progreso del takeover), uMode (0 imagen /
// 1 binario / 2 rampa, interpolable), uTint (0..1 viraje a fósforo verde). uTime
// y uCell los gestiona SpaceScene (uCell degrada 8→12 en tier B de perf, spec §8).
//
// Nota de diseño (minimalismo): las funciones de ruido (hash2/vnoise/fbm3) están
// DUPLICADAS respecto a SPACE_BG_FRAG en vez de extraídas a un módulo compartido.
// Decisión deliberada: SPACE_BG_FRAG ya está probado y revisado en múltiples
// rondas; tocarlo para introducir una abstención compartida arriesga una
// regresión en un shader que funciona, a cambio de ~15 líneas de duplicación.

import Phaser from 'phaser'

const ASCII_FRAG = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform vec2  uResolution;
uniform float uMix;   // 0..1 progreso del takeover (wipe fBm)
uniform float uMode;  // 0 imagen / 1 binario / 2 rampa plena
uniform float uTint;  // 0..1 viraje a fósforo verde CRT
uniform float uCell;  // px por celda (8 tier A, 12 tier B)
uniform float uTime;

varying vec2 outTexCoord;

// ── Hash y noise (duplicado deliberado de SPACE_BG_FRAG — ver cabecera) ──────
float hash2(vec2 p) {
  p  = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 43.21);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash2(i),                hash2(i + vec2(1.0, 0.0)), f.x),
    mix(hash2(i + vec2(0.0,1.0)), hash2(i + vec2(1.0,1.0)), f.x),
    f.y
  );
}

float fbm3(vec2 p) {
  float v  = 0.50 * vnoise(p);
  p = p * 2.1 + vec2(5.3, 2.7);
  v += 0.25 * vnoise(p);
  p = p * 2.1 + vec2(5.3, 2.7);
  v += 0.125 * vnoise(p);
  return v;
}

// Luminancia perceptual Rec.601 (Codrops / Sawicki).
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Dither ordenado Bayer 4x4 — evita banding al cuantizar la luma a 7 niveles.
float bayer4(vec2 fragXY) {
  vec2 p = mod(fragXY, 4.0);
  float idx = p.x + p.y * 4.0;
  float m = 0.0;
  if (idx ==  0.0) m =  0.0; else if (idx ==  1.0) m =  8.0;
  else if (idx ==  2.0) m =  2.0; else if (idx ==  3.0) m = 10.0;
  else if (idx ==  4.0) m = 12.0; else if (idx ==  5.0) m =  4.0;
  else if (idx ==  6.0) m = 14.0; else if (idx ==  7.0) m =  6.0;
  else if (idx ==  8.0) m =  3.0; else if (idx ==  9.0) m = 11.0;
  else if (idx == 10.0) m =  1.0; else if (idx == 11.0) m =  9.0;
  else if (idx == 12.0) m = 15.0; else if (idx == 13.0) m =  7.0;
  else if (idx == 14.0) m = 13.0; else m =  5.0;
  return (m - 7.5) / 16.0;
}

// Glifo procedural: bitmask 5x7 empaquetada en float (técnica mattdesl).
float glyph(float n, vec2 p) {
  if (clamp(p.x, 0.0, 4.0) != p.x || clamp(p.y, 0.0, 6.0) != p.y) return 0.0;
  float bit = mod(floor(n / exp2(floor(p.y) * 5.0 + floor(p.x))), 2.0);
  return bit;
}

// Bitmask del dígito binario '0' y '1' en grilla 5x7 (columnas de abajo hacia arriba).
const float BM_ZERO = 15121.0; // aprox. contorno de "0"
const float BM_ONE  = 8548.0;  // aprox. trazo vertical de "1"

// Rampa por densidad de tinta (7 niveles: espacio . : + * # @), bitmask aproximado.
float rampBitmask(float idx) {
  if (idx < 1.0) return 0.0;
  if (idx < 2.0) return 128.0;
  if (idx < 3.0) return 4544.0;
  if (idx < 4.0) return 9320.0;
  if (idx < 5.0) return 31727.0;
  if (idx < 6.0) return 32767.0;
  return 1048575.0;
}

float glyphForLuma(float l, float mode, vec2 p, vec2 cellHash) {
  // Umbral en 1.5 (no 0.5): uMode viaja en {1: binario, 2: rampa} — nunca en
  // 0 (el driver DOM, Ch6Terminal.vue, no emite "imagen" como estado propio
  // del glifo; "imagen" ya ocurre fuera de esta función, vía uMix=0 en
  // takeover()). Bug encontrado en ronda 2 (2026-07-29, verificación visual
  // en Chrome headed real): con el umbral en 0.5, mode=1 ("binario" según el
  // driver) NO es < 0.5, así que caía siempre en la rama de rampa — la fase
  // binaria del takeover nunca se veía, pese a que el binario en el DOM
  // (.ch6-bits, AC4) funcionaba bien de forma independiente.
  if (mode < 1.5) {
    float bit = step(0.5, l);
    // Hormigueo temporal — algunas celdas oscilan 0<->1 (sensación de datos vivos).
    bit = abs(bit - step(0.985, fract(cellHash.x * 337.0 + uTime * 0.6)));
    return glyph(bit > 0.5 ? BM_ONE : BM_ZERO, p);
  }
  float idx = floor(l * 6.999);
  return glyph(rampBitmask(idx), p);
}

// Wipe orgánico del takeover: umbral por fBm, no cortina lineal.
float takeover(vec2 uv, float mix01) {
  float n = fbm3(uv * 3.0 + vec2(0.0, uTime * 0.02));
  return smoothstep(mix01 - 0.12, mix01, uv.y * 0.65 + n * 0.35);
}

void main() {
  vec2 fragXY  = outTexCoord * uResolution;
  vec2 cellPx  = floor(fragXY / uCell) * uCell;
  vec2 inCell  = (fragXY - cellPx) / uCell;
  vec3 src     = texture2D(uMainSampler, (cellPx + uCell * 0.5) / uResolution).rgb;
  float l      = clamp(luma(src) + bayer4(fragXY) * 0.08, 0.0, 1.0);
  float ink    = glyphForLuma(l, uMode, inCell * vec2(5.0, 7.0), cellPx);

  vec3 phosphor = vec3(0.30, 1.0, 0.62); // verde CRT — cita a ch0 (spec §7)
  vec3 glyphCol = mix(src * 1.35, phosphor * (0.35 + 0.65 * l), uTint);
  vec3 asciiCol = ink * glyphCol;

  float m     = takeover(outTexCoord, uMix);
  vec3 outCol = mix(texture2D(uMainSampler, outTexCoord).rgb, asciiCol, m);
  // Scanline sutil (2px), solo donde ya es ASCII.
  outCol *= 1.0 - 0.06 * m * step(0.5, mod(fragXY.y, 2.0));

  gl_FragColor = vec4(outCol, 1.0);
}
`

export class AsciiPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({ game, fragShader: ASCII_FRAG })
    // Estado plano (no Vue-reactive) — leído/escrito por SpaceScene vía bridge.
    this.uMix = 0
    this.uMode = 2
    this.uTint = 0
    this.uCell = 8
    this.uTime = 0
  }

  onPreRender(controller, shader, width, height) {
    controller = this.getController(controller)
    this.set1f('uMix', controller.uMix, shader)
    this.set1f('uMode', controller.uMode, shader)
    this.set1f('uTint', controller.uTint, shader)
    this.set1f('uCell', controller.uCell, shader)
    this.set1f('uTime', controller.uTime, shader)
    if (width && height) this.set2f('uResolution', width, height, shader)
  }

  onDraw(target) {
    this.set2f('uResolution', target.width, target.height)
    this.bindAndDraw(target)
  }
}
