// PRNG determinista del QA Lab. Todo lo aleatorio de una pagina sale de aca.
// hashString: xmur3-like (string -> uint32). mulberry32: generador de 32 bits.

export function hashString(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

export function mulberry32(a) {
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRng(seed) {
  const next = mulberry32(hashString(String(seed)))
  const rng = {
    next,
    /** entero en [min, max] inclusive */
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    /** Fisher-Yates sobre una copia */
    shuffle(arr) {
      const a = arr.slice()
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
    sample: (arr, n) => rng.shuffle(arr).slice(0, n),
  }
  return rng
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

/** Semilla nueva para "nueva pagina". Es el unico punto con entropia del lab (no es contenido de pagina). */
export function newSeed() {
  const buf = new Uint32Array(6)
  globalThis.crypto.getRandomValues(buf)
  return Array.from(buf, (n) => ALPHABET[n % ALPHABET.length]).join('')
}
