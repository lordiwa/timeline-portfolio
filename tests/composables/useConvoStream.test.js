// tests/composables/useConvoStream.test.js
//
// TASK-012 — funciones puras de la conversación DOM-first de ch6 (spec §5.3 +
// §5.2). Cobertura:
//   T1: toBits/fromBits son inversas exactas (round-trip) — el binario mostrado
//       en pantalla es significativo, no dígitos al azar (AC4 del ticket).
//   T2: toBits('a') === '01100001' (caso citado en la spec §5.3, verbatim).
//   T3: toBits produce longitud múltiplo de 8 y varía por locale (ES vs EN
//       tienen distinto texto → distinto bitstream — paridad ES/EN spec §5.3).
//   T4: splitWords preserva el texto exacto al recomponer (join('') === original).
//   T5: splitAuthorWords alterna humano/IA empezando en humano (impar=humano,
//       par=IA — GUION-TEXTOS-FINAL.md, reparto de palabras verbatim).

import { describe, it, expect } from 'vitest'
import { toBits, fromBits, splitWords, splitAuthorWords } from '@/composables/useConvoStream.js'

describe('toBits / fromBits — bitstream significativo (spec §5.3)', () => {
  // Nota de alcance: toBits es 8 bits/CARÁCTER (Latin-1, charCodeAt & 0xFF), no
  // UTF-8 multibyte real — coincide con la propia aritmética de la spec ("66
  // chars -> 528 bits" = 66*8, no la codificación UTF-8 de esas tildes, que
  // pesaría más bytes). Válido para el dataset real (frase de cierre ES/EN,
  // tildes españolas incluidas: á é í ó ú ñ ü caen en 0-255). NO se usa para
  // el mantra con emoji (fuera de Latin-1, no es parte del bitstream de ch6).
  it('T1: round-trip — fromBits(toBits(str)) === str para texto ES/EN con acentos', () => {
    const samples = [
      'Cada etapa parecía un salto. Vista de lejos, era una sola línea.',
      'Every stage felt like a leap. Seen from far enough away, it was a single line.',
    ]
    for (const s of samples) {
      expect(fromBits(toBits(s))).toBe(s)
    }
  })

  it("T2: toBits('a') === '01100001' (caso citado verbatim en la spec ch6 §5.3)", () => {
    expect(toBits('a')).toBe('01100001')
  })

  it('T3: longitud = 8 * chars y bitstream distinto entre locale ES y EN', () => {
    const es = 'Cada etapa parecía un salto. Vista de lejos, era una sola línea.'
    const en = 'Every stage felt like a leap. Seen from far enough away, it was a single line.'
    const bitsEs = toBits(es)
    const bitsEn = toBits(en)
    expect(bitsEs.length).toBe(es.length * 8)
    expect(bitsEn.length).toBe(en.length * 8)
    expect(bitsEs).not.toBe(bitsEn)
  })
})

describe('splitWords — tokeniza sin perder ni introducir texto', () => {
  it('T4: join(\'\') de los tokens === texto original, para párrafos multi-línea', () => {
    const text = 'Hola  mundo\ncon varios   espacios.'
    const tokens = splitWords(text)
    expect(tokens.join('')).toBe(text)
    expect(tokens.length).toBeGreaterThan(1)
  })
})

describe('splitAuthorWords — alternancia humano/IA palabra por palabra (spec §5.2)', () => {
  it('T5: primera palabra humano, segunda IA, alternando (GUION-TEXTOS-FINAL.md verbatim)', () => {
    const sentence = 'No sé qué va a pasar, pero siento que nací exactamente para este momento.'
    const parts = splitAuthorWords(sentence)
    const words = parts.filter((p) => /\S/.test(p.text))
    const authors = words.map((w) => w.author)
    // Reparto citado en GUION-TEXTOS-FINAL.md: No(h) sé(ia) qué(h) va(ia) a(h) pasar,(ia) ...
    expect(authors[0]).toBe('human')
    expect(authors[1]).toBe('ai')
    expect(authors[2]).toBe('human')
    expect(authors[3]).toBe('ai')
    // Alternancia estricta en toda la frase.
    for (let i = 1; i < authors.length; i++) {
      expect(authors[i]).not.toBe(authors[i - 1])
    }
    // Reconstruye el texto exacto.
    expect(parts.map((p) => p.text).join('')).toBe(sentence)
  })
})
