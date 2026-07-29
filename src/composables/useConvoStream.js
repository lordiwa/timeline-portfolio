// src/composables/useConvoStream.js — TASK-012 ch6 climax.
//
// Funciones PURAS (testeables sin montar Vue) que sostienen la conversación
// DOM-first de ch6 (spec .planning/design/06-ch6-climax-terminal-ia.md §5).
// La orquestación con estado (timers, refs) vive en Ch6Terminal.vue, siguiendo
// el mismo patrón que TerminalScroll.vue (timeline inline en el componente,
// no en un composable con estado) — precedente ya establecido en el proyecto.
//
// Exports:
//   - toBits(str)      : bitstream real UTF-8 (8 bits/byte) — spec §5.3.
//   - splitWords(text)  : tokeniza un párrafo en palabras + separadores (para
//                         el streaming por spans, spec §5.1).
//   - splitAuthorWords(sentence): alterna autor palabra por palabra para la
//                         frase de cierre (spec §5.2 "la tesis la tipean juntos").

/**
 * Bitstream real de un string, 8 bits por CARÁCTER (no UTF-8 multibyte). Pura y
 * determinística — spec §5.3: "el binario nunca es lluvia decorativa... se
 * computa del string del locale activo", y la spec cuantifica su propio
 * ejemplo como "la frase ES tiene 66 chars -> 528 bits" (66 * 8), es decir 1
 * byte por carácter, no la codificación UTF-8 real (que sería > 1 byte para
 * tildes). Simplificación deliberada: todo el alfabeto usado en el cierre
 * (ES/EN + tildes españolas á é í ó ú ñ ü) cae dentro de Latin-1 (0-255), así
 * que `charCodeAt & 0xFF` es reversible exacto para este dataset y evita que
 * el decode visual (grupo de 8 bits por grupo) tropiece con caracteres
 * multi-byte a mitad de reveal. No es aleatorio ni relleno: decodificar cada
 * grupo de 8 bits reproduce el carácter original.
 *
 * @param {string} str
 * @returns {string} bitstream, longitud = 8 * str.length
 */
export function toBits(str) {
  return Array.from(str)
    .map((ch) => (ch.charCodeAt(0) & 0xff).toString(2).padStart(8, '0'))
    .join('')
}

/**
 * Decodifica un bitstream (múltiplo de 8 bits) de vuelta a string. Inverso
 * exacto de toBits — usado por los tests para probar que el bitstream
 * mostrado en pantalla es significativo (round-trip), no dígitos al azar.
 *
 * @param {string} bits
 * @returns {string}
 */
export function fromBits(bits) {
  const charCount = Math.floor(bits.length / 8)
  let out = ''
  for (let i = 0; i < charCount; i++) {
    out += String.fromCharCode(parseInt(bits.slice(i * 8, i * 8 + 8), 2))
  }
  return out
}

/**
 * Tokeniza un párrafo en palabras + separadores (espacios) preservando el
 * texto exacto al concatenar de vuelta. Usado para envolver cada palabra en
 * un span de streaming (spec §5.1) sin perder ni introducir espacios.
 *
 * @param {string} text
 * @returns {string[]} tokens; join('') === text
 */
export function splitWords(text) {
  return text.split(/(\s+)/).filter((s) => s.length > 0)
}

/**
 * Reparto de autoría palabra por palabra para la frase de cierre (spec §5.2 +
 * GUION-TEXTOS-FINAL.md "Reparto de palabras para la alternancia: impares
 * humano, pares IA"). Los separadores (espacios) heredan la autoría de la
 * palabra que los precede para que el espaciado no rompa el span.
 *
 * @param {string} sentence
 * @returns {{ text: string, author: 'human'|'ai' }[]}
 */
export function splitAuthorWords(sentence) {
  const tokens = splitWords(sentence)
  let wordIdx = 0
  let lastAuthor = 'human'
  return tokens.map((tok) => {
    if (/\S/.test(tok)) {
      // Impar (1º, 3º...) = humano; par (2º, 4º...) = IA — spec GUION-TEXTOS-FINAL.
      lastAuthor = wordIdx % 2 === 0 ? 'human' : 'ai'
      wordIdx += 1
      return { text: tok, author: lastAuthor }
    }
    return { text: tok, author: lastAuthor }
  })
}
