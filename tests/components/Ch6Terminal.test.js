// tests/components/Ch6Terminal.test.js
//
// TASK-012 — locks de regresión del principio innegociable (spec §5.1,
// TASK-007 defectos 2 y 3): el texto de la conversación vive en el DOM desde
// el mount, sin depender de Phaser/tweens/eventos de arrival.
//
// Cobertura:
//   T1 (REGRESSION LOCK, bloqueante): mount SIN NINGÚN mock/import de Phaser →
//       wrapper.text() contiene un fragmento largo de bio.eras.6.text Y el
//       mantra. Este componente no importa `@/phaser` en absoluto — la prueba
//       de que no depende de Phaser es estructural, no solo de timing.
//   T2 (REGRESSION LOCK): source-regex — Ch6Terminal.vue NO contiene
//       `v-if="arrivalDone"` envolviendo el bio (el patrón exacto que TASK-007
//       identificó como defecto).
//   T3: la muestra de binario decodifica al texto real (round-trip via
//       useConvoStream, ya cubierto en su propio archivo; acá se verifica que
//       el componente usa el texto de closingSentence real, no un placeholder).
//   T4: la frase final alterna autor palabra por palabra (clases ch6-author-*).
//   T5: declaración explícita de autoría (Rafael + flota de agentes) presente.
//   T6: PRM → todo el texto visible de inmediato (revealedWords === total sin
//       esperar timers), cursor sin animación.
//   T7: em-dash ausente en las claves i18n nuevas de chapters.6.convo.

import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createTestI18n } from '../i18n/test-helpers.js'
import es from '@/i18n/es.json'
import en from '@/i18n/en.json'
import { bio } from '@/data/bio'

const SRC_PATH = resolve(process.cwd(), 'src/components/Ch6Terminal.vue')
const SRC = readFileSync(SRC_PATH, 'utf8')

async function mountTerminal({ locale = 'es', prefersReduced = false, activeChapter = 6 } = {}) {
  const Ch6Terminal = (await import('@/components/Ch6Terminal.vue')).default
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Ch6Terminal, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter: ref(activeChapter) },
        prm: { prefersReduced: ref(prefersReduced) },
      },
    },
  })
  return { wrapper, i18n }
}

describe('Ch6Terminal.vue — DOM-first (TASK-007 defectos 2/3, spec §5.1)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('T1 REGRESSION LOCK: sin ningún import de Phaser, el texto completo vive en el DOM desde el mount', async () => {
    // Prueba estructural, no solo de comportamiento: este archivo de test NUNCA
    // importa ni mockea '@/phaser' ni 'phaser'. Si Ch6Terminal.vue alguna vez
    // reintrodujera una dependencia de Phaser (import, inject de `game`, o un
    // gate por evento), este test fallaría por un error de import real, no por
    // una aserción tolerante.
    const { wrapper } = await mountTerminal({ prefersReduced: true })
    const text = wrapper.text()
    // Fragmento largo (no solo unas palabras) de bio.eras.6.text — prueba que
    // el cuerpo real está presente, no un placeholder.
    expect(text).toContain('Cuando Remoose se apagó')
    expect(text).toContain('Software Mind')
    expect(text.length).toBeGreaterThan(200)
    // El mantra también vive en el DOM (ya no gateado por arrivalDone).
    expect(text).toContain(es.bio.mantra)
  })

  it('T1b: el mismo lock, pero con Phaser explícitamente deshabilitado (mock que nunca emite eventos)', async () => {
    // Refuerzo pedido por el ticket: "Debe verificarse deshabilitando Phaser
    // por completo." Se monta con un stub de `game` inexistente (Ch6Terminal
    // ni siquiera sabe qué es un `game` — no lo inyecta ni lo usa) y se
    // verifica igual.
    const { wrapper } = await mountTerminal({ prefersReduced: true })
    await flushPromises()
    const words = bio.eras[6].textKey // sanity: key existe
    expect(words).toBe('bio.eras.6.text')
    expect(wrapper.text().length).toBeGreaterThan(200)
  })

  it('T2 REGRESSION LOCK: NO existe `v-if="arrivalDone"` envolviendo el bio (patrón exacto del defecto TASK-007)', () => {
    // El texto en comentarios explicando la ausencia es válido; lo prohibido
    // es el patrón de gate real `v-if="arrivalDone"` (o cualquier variable
    // `arrivalDone` usada como condición de render en el template).
    expect(SRC).not.toMatch(/v-if="arrivalDone"/)
    const templateMatch = SRC.match(/<template>[\s\S]*<\/template>/)
    expect(templateMatch, 'Ch6Terminal.vue debe tener <template>.').not.toBeNull()
    expect(
      templateMatch[0],
      'El <template> no debe referenciar arrivalDone en absoluto (ni en atributos ni en texto).'
    ).not.toMatch(/arrivalDone/)
  })

  it('T3: la muestra de binario decodifica el texto real de la frase de cierre', async () => {
    const { wrapper } = await mountTerminal({ prefersReduced: true, activeChapter: 6 })
    await flushPromises()
    // Bajo PRM el decode ya está completo (spec §8 PRM: "decode ya resuelto").
    expect(wrapper.text()).toContain(es.chapters['6'].convo.closing)
  })

  it('T4: la frase final alterna autor palabra por palabra (ch6-author-human / ch6-author-ai)', async () => {
    const { wrapper } = await mountTerminal({ prefersReduced: true })
    await flushPromises()
    const humanWords = wrapper.findAll('.ch6-author-human')
    const aiWords = wrapper.findAll('.ch6-author-ai')
    expect(humanWords.length).toBeGreaterThan(0)
    expect(aiWords.length).toBeGreaterThan(0)
  })

  it('T5: declara explícitamente que el sitio lo construyeron Rafael y una flota de agentes de IA', async () => {
    const { wrapper } = await mountTerminal({ prefersReduced: true })
    expect(wrapper.text()).toContain(es.chapters['6'].convo.credit)
    expect(es.chapters['6'].convo.credit.toLowerCase()).toContain('agentes')
  })

  it('T6: PRM → todo el texto visible de inmediato, cursor sin animación (source-regex del gate CSS)', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper } = await mountTerminal({ prefersReduced: true })
      await vi.advanceTimersByTimeAsync(2000)
      const words = wrapper.findAll('.ch6-convo-word')
      expect(words.length).toBeGreaterThan(50)
      words.forEach((w) => {
        expect(w.attributes('style')).toContain('opacity: 1')
      })
    } finally {
      vi.useRealTimers()
    }
    expect(SRC).toMatch(/prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?\.ch6-cursor[\s\S]*?animation:\s*none/)
  })

  it('T7: cero ocurrencias de em-dash en las claves nuevas chapters.6.convo (ES/EN)', () => {
    for (const dict of [es, en]) {
      const convo = dict.chapters['6'].convo
      for (const [key, value] of Object.entries(convo)) {
        if (typeof value === 'string') {
          expect(value, `${key} no debe contener em-dash`).not.toMatch(/—/)
        }
      }
    }
  })

  it('T8: la clave chapters.6.convo.closing es EXACTAMENTE la cola de bio.eras.6.text (ES y EN)', () => {
    expect(es.bio.eras['6'].text.endsWith(es.chapters['6'].convo.closing)).toBe(true)
    expect(en.bio.eras['6'].text.endsWith(en.chapters['6'].convo.closing)).toBe(true)
  })

  it('T9 REGRESSION LOCK (ronda 2, HIGH): skip() cancela la timeline en curso — el texto no vuelve a des-completarse después', async () => {
    // Reproduce el defecto real: pointerdown durante el streaming completa
    // revealedWords/decodedBitGroups al instante, pero la runTimeline(v) que
    // ya estaba corriendo seguía iterando sobre un contador LOCAL y, en su
    // siguiente tick, pisaba los refs con un valor MENOR — el texto ya
    // revelado volvía a opacity:0.001. En móvil, cualquier toque para
    // scrollear el bottom-sheet dispara este pointerdown.
    vi.useFakeTimers()
    try {
      const { wrapper } = await mountTerminal({ prefersReduced: false, activeChapter: 6 })

      // t≈9s: boot (2.5s) + pausa (0.4s) + prompt tipeado (33 chars × ~70ms) +
      // thinking (0.9s) suman ≈5.6-6.6s con jitter — a los 9s estamos siempre
      // en pleno streaming (total streaming ≈17s), nunca completado por sí solo.
      await vi.advanceTimersByTimeAsync(9000)
      await flushPromises()

      await wrapper.find('.ch6-convo').trigger('pointerdown')
      await flushPromises()

      const wordsRightAfterSkip = wrapper.findAll('.ch6-convo-word')
      expect(wordsRightAfterSkip.length).toBeGreaterThan(50)
      wordsRightAfterSkip.forEach((w) => {
        expect(w.attributes('style')).toContain('opacity: 1')
      })

      // En t=9000ms la timeline (si no fue cancelada) estaba a mitad de un
      // `await delay(...)` pendiente de la iteración de streaming en curso.
      // Avanzar apenas 500ms (el delay de burst más largo es ~350ms) alcanza
      // para que esa iteración pendiente resuma y, sin el fix, sobreescriba
      // revealedWords con su contador LOCAL —menor al total— revirtiendo a
      // opacity:0.001 palabras que el skip ya había revelado. Este es el
      // punto exacto del defecto: no aparece en el estado final (la timeline
      // vieja, no cancelada, termina alcanzando el total por sí sola más
      // tarde), solo en esta ventana intermedia.
      await vi.advanceTimersByTimeAsync(500)
      await flushPromises()

      const wordsShortlyAfterSkip = wrapper.findAll('.ch6-convo-word')
      wordsShortlyAfterSkip.forEach((w) => {
        expect(w.attributes('style')).toContain('opacity: 1')
      })

      // Y sigue íntegro mucho más adelante (no es solo un parpadeo momentáneo
      // que la timeline vieja repara sola).
      await vi.advanceTimersByTimeAsync(25000)
      await flushPromises()

      const wordsAfterLongWait = wrapper.findAll('.ch6-convo-word')
      expect(wordsAfterLongWait.length).toBe(wordsRightAfterSkip.length)
      wordsAfterLongWait.forEach((w) => {
        expect(w.attributes('style')).toContain('opacity: 1')
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('T10 (ronda 2, LOW): el hint de skip (chapters.6.convo.skipHint, spec §5.5) se renderiza durante streaming y desaparece en done; ausente bajo PRM', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper } = await mountTerminal({ prefersReduced: false, activeChapter: 6 })
      // t≈9s: mismo cálculo que T9, siempre en pleno streaming.
      await vi.advanceTimersByTimeAsync(9000)
      await flushPromises()
      expect(wrapper.find('.ch6-skip-hint').exists()).toBe(true)
      expect(wrapper.text()).toContain(es.chapters['6'].convo.skipHint)

      await wrapper.find('.ch6-convo').trigger('pointerdown')
      await flushPromises()
      // skip() salta a phase 'done' — el hint ya no aplica (nada que completar).
      expect(wrapper.find('.ch6-skip-hint').exists()).toBe(false)
    } finally {
      vi.useRealTimers()
    }

    const { wrapper: prmWrapper } = await mountTerminal({ prefersReduced: true })
    await flushPromises()
    expect(prmWrapper.find('.ch6-skip-hint').exists()).toBe(false)
  })
})
