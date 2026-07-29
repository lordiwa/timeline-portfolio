// tests/components/Ch6Terminal.cursor-citation.test.js
//
// TASK-012 (spec §7 "Cierre circular con ch0: citar sin repetir") — AC5 del
// ticket: "el cierre termina en un prompt cuyo cursor de bloque es
// visualmente identico al de ch0 1995, y esa cita es deliberada y verificable
// comparando ambos componentes."
//
// Este test NO edita TerminalScroll.vue ni Chapter0Content.vue (prohibido por
// el ticket) — solo los LEE para extraer las propiedades del keyframe/cursor
// y compararlas contra Ch6Terminal.vue.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CH0_TERMINAL_SRC = readFileSync(
  resolve(process.cwd(), 'src/components/TerminalScroll.vue'),
  'utf8',
)
const CH6_TERMINAL_SRC = readFileSync(
  resolve(process.cwd(), 'src/components/Ch6Terminal.vue'),
  'utf8',
)

describe('Cita circular ch0 → ch6: cursor de bloque idéntico (spec §7, AC5)', () => {
  it('ambos usan el glifo de bloque "█" como cursor', () => {
    expect(CH0_TERMINAL_SRC).toMatch(/class="terminal-cursor"[\s\S]{0,40}>█</)
    expect(CH6_TERMINAL_SRC).toMatch(/class="ch6-cursor"[\s\S]{0,40}>█</)
  })

  it('ambos animan el cursor con steps(2) 1s infinite (blink DOS clásico)', () => {
    const ch0Anim = CH0_TERMINAL_SRC.match(/\.terminal-cursor\s*\{[^}]*animation:\s*([^;]+);/)
    const ch6Anim = CH6_TERMINAL_SRC.match(/\.ch6-cursor\s*\{[^}]*animation:\s*([^;]+);/)
    expect(ch0Anim, 'TerminalScroll.vue debe declarar animation en .terminal-cursor').not.toBeNull()
    expect(ch6Anim, 'Ch6Terminal.vue debe declarar animation en .ch6-cursor').not.toBeNull()

    const parse = (decl) => ({
      duration: decl.match(/(\d+(?:\.\d+)?m?s)/)[1],
      timing: decl.match(/steps\(\s*\d+\s*\)/)?.[0].replace(/\s+/g, ''),
      iteration: /infinite/.test(decl),
    })
    const ch0 = parse(ch0Anim[1])
    const ch6 = parse(ch6Anim[1])

    expect(ch6.duration).toBe(ch0.duration)
    expect(ch6.timing).toBe(ch0.timing)
    expect(ch6.iteration).toBe(true)
    expect(ch0.iteration).toBe(true)
    expect(ch0.timing).toBe('steps(2)')
  })

  it('ambos keyframes ocultan el cursor exactamente al 50% (mismo patrón de blink)', () => {
    const ch0Keyframe = CH0_TERMINAL_SRC.match(/@keyframes\s+terminal-cursor-blink\s*\{([^}]*)\}/)
    const ch6Keyframe = CH6_TERMINAL_SRC.match(/@keyframes\s+ch6-cursor-blink\s*\{([^}]*)\}/)
    expect(ch0Keyframe).not.toBeNull()
    expect(ch6Keyframe).not.toBeNull()
    // El regex de captura no anida llaves: el grupo termina en la PRIMERA
    // '}' que cierra la regla interna 50% {...}, no en la del @keyframes.
    expect(ch0Keyframe[1].replace(/\s+/g, '')).toBe('50%{opacity:0;')
    expect(ch6Keyframe[1].replace(/\s+/g, '')).toBe('50%{opacity:0;')
  })

  it('ambos apagan la animación (cursor sólido) bajo prefers-reduced-motion', () => {
    expect(CH0_TERMINAL_SRC).toMatch(
      /prefers-reduced-motion:\s*reduce[\s\S]*?\.terminal-cursor\s*\{[\s\S]*?animation:\s*none/,
    )
    expect(CH6_TERMINAL_SRC).toMatch(
      /prefers-reduced-motion:\s*reduce[\s\S]*?\.ch6-cursor[\s\S]*?animation:\s*none/,
    )
  })
})
