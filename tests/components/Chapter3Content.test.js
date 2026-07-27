// tests/components/Chapter3Content.test.js
// Reescrito TASK-009 (2026-07-27) — rediseño total de ch3 "La muerte de Flash".
//
// El concepto Kingdom New Lands (pixel art medieval, iter11) se retiró
// completo; ver .planning/design/03-ch3-muerte-de-flash.md. Cobertura:
// - T1 DOM: Acto 1 (pin + escenografía procedural) + Acto 2 (hero + 5 beats
//   Ch3StoryBeat + cierre) montan.
// - T2 REGRESSION LOCK (defecto 4 de TASK-007, AC bloqueante de TASK-009):
//   el lead de los 5 beats está SIEMPRE visible en el texto renderizado sin
//   un solo click, y el total supera holgadamente los 91 caracteres.
// - T3 REGRESSION LOCK: el patrón viejo (emblemas .ch3-mark + modal
//   .ch3-panel gateando la narrativa) no vuelve.
// - T4: el expansor "Seguir leyendo" existe en los beats I-IV, NO en el beat
//   V (remate completo); togglear revela el resto del párrafo en el DOM.
// - T5 REGRESSION LOCK: bounce-easing (cubic-bezier con parámetro Y fuera de
//   [0,1]) no aparece en el source; Inter/Cinzel/Lobster tampoco.
// - T6 REGRESSION LOCK: los assets Kingdom (ch3-sky.webp, ch3-parchment.webp,
//   etc.) ya no se referencian.
// - T7: reactividad de locale (es→en) sin re-mount.
// - T8: PRM no crashea el mount.
// - T9: sin em-dash en el texto nuevo (copy ch3.* + fallback de eras.css).
// - T10 REGRESSION LOCK (MEDIUM, ronda de corrección): con el Acto 1 en
//   pantalla (estado de montaje inicial, overallVh=0 — mismo escenario
//   reportado por el reviewer), los controles de los slides del Acto 2 a
//   opacity:0 (CTA del hero, "Seguir leyendo" de los 4 beats con expansor)
//   quedan fuera del tab order vía `inert`, no sólo de pointer-events.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter3Content from '@/components/Chapter3Content.vue'
import Ch3StoryBeat from '@/components/Ch3StoryBeat.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({ projects: [] }))

function mountCh3({ locale = 'es', prefersReduced = false } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter3Content, {
    global: {
      plugins: [i18n],
      provide: { prm: { prefersReduced: { value: prefersReduced } } },
      attachTo: document.body,
    },
  })
  return { wrapper, i18n }
}

const CH3_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter3Content.vue'),
  'utf8'
)

const EM_DASH = String.fromCharCode(0x2014)

describe('Chapter3Content.vue (TASK-009 — La muerte de Flash, rediseño flat 2013)', () => {
  // ── T1: DOM de los dos actos ─────────────────────────────────────────────
  it('T1 Acto 1: .ch3-act1-pin + .ch3-act1-scene + H1 accesible + escenografía aria-hidden', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-act1-pin').exists()).toBe(true)
    expect(wrapper.find('.ch3-act1-scene').exists()).toBe(true)
    const h1 = wrapper.find('.ch3-act1-title')
    expect(h1.element.tagName).toBe('H1')
    expect(h1.text().length).toBeGreaterThan(0)
    expect(wrapper.find('.ch3-act1-decor').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.ch3-flash-stage').exists()).toBe(true)
    expect(wrapper.find('.ch3-phone').exists()).toBe(true)
  })

  it('T1 Acto 2: hero + 5 Ch3StoryBeat + cierre', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-hero').exists()).toBe(true)
    expect(wrapper.find('.ch3-hero-title').text().length).toBeGreaterThan(0)
    const beats = wrapper.findAllComponents(Ch3StoryBeat)
    expect(beats.length).toBe(5)
    expect(wrapper.find('.ch3-close').exists()).toBe(true)
    expect(wrapper.find('.ch3-close-line').text().length).toBeGreaterThan(0)
  })

  it('T1 no hay ningún <section> anidado (evita romper el conteo arquitectural de ScrollShell)', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.findAll('section').length).toBe(0)
  })

  // ── T2: REGRESSION LOCK — narrativa destapada sin click (defecto 4 TASK-007) ──
  it('T2 los 5 leads + beat V completo están en el texto renderizado SIN ningún click', () => {
    const { wrapper } = mountCh3()
    const text = wrapper.text()
    // Cada beat expone su lead como texto plano — probamos con un fragmento
    // largo (>25 chars) del inicio de cada párrafo real de bio.eras.3 (ES).
    const leadFragments = [
      'La muerte de Flash parecía solo eso',
      'Llevaba Pink Parrot entre el entusiasmo',
      'Fue en ese desorden donde el ágil',
      'La publicidad digital de esa era todavía',
      'Fue una época de crecer en todos los frentes',
    ]
    for (const fragment of leadFragments) {
      expect(text, `falta el fragmento "${fragment}" en el texto sin click`).toContain(fragment)
    }
  })

  it('T2 innerText total supera holgadamente los 91 caracteres del baseline pre-rediseño', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.text().length).toBeGreaterThan(500)
  })

  // ── T3: REGRESSION LOCK — el gate por click no vuelve ───────────────────
  it('T3 no existen .ch3-mark ni .ch3-panel (patrón de emblemas+modal retirado)', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-mark').exists()).toBe(false)
    expect(wrapper.find('.ch3-panel').exists()).toBe(false)
  })

  // ── T4: expansor — profundización opcional, nunca condición de acceso ──
  it('T4 beats I-IV tienen expansor "Seguir leyendo"; el beat V (remate) no', () => {
    const { wrapper } = mountCh3()
    const beats = wrapper.findAllComponents(Ch3StoryBeat)
    for (let i = 0; i < 4; i++) {
      expect(beats[i].find('.ch3-beat-more').exists(), `beat ${i} debería tener expansor`).toBe(true)
    }
    expect(beats[4].find('.ch3-beat-more').exists(), 'beat V (remate) no debería tener expansor').toBe(false)
  })

  it('T4 click en "Seguir leyendo" revela el resto del párrafo y togglea aria-expanded', async () => {
    const { wrapper } = mountCh3()
    const beat0 = wrapper.findAllComponents(Ch3StoryBeat)[0]
    const btn = beat0.find('.ch3-beat-more')
    expect(btn.attributes('aria-expanded')).toBe('false')
    const restBefore = beat0.find('.ch3-beat-rest').text()
    await btn.trigger('click')
    await flushPromises()
    expect(btn.attributes('aria-expanded')).toBe('true')
    // El resto ya estaba en el DOM (grid-rows: 0fr colapsado, no v-if) — lo
    // que cambia es la clase is-open, no la presencia del texto.
    expect(beat0.find('.ch3-beat-rest').classes()).toContain('is-open')
    expect(restBefore.length).toBeGreaterThan(0)
  })

  // ── T5: REGRESSION LOCK — bounce-easing + fuentes anacrónicas retiradas ──
  it('T5 ningún cubic-bezier con parámetro Y fuera de [0,1] (bounce-easing retirado)', () => {
    const matches = [...CH3_SOURCE.matchAll(/cubic-bezier\(([^)]+)\)/g)]
    expect(matches.length).toBeGreaterThan(0)
    for (const m of matches) {
      const params = m[1].split(',').map((n) => parseFloat(n.trim()))
      const [, y1, , y2] = params
      expect(y1, `cubic-bezier(${m[1]}) tiene Y1 fuera de [0,1]`).toBeGreaterThanOrEqual(0)
      expect(y1).toBeLessThanOrEqual(1)
      expect(y2, `cubic-bezier(${m[1]}) tiene Y2 fuera de [0,1]`).toBeGreaterThanOrEqual(0)
      expect(y2).toBeLessThanOrEqual(1)
    }
  })

  it('T5 Inter / Cinzel / Lobster no se usan en ch3 (anacronismos retirados)', () => {
    expect(CH3_SOURCE).not.toMatch(/Inter Variable/)
    expect(CH3_SOURCE).not.toMatch(/Cinzel/)
    expect(CH3_SOURCE).not.toMatch(/Lobster/)
  })

  it('T5 image-rendering: pixelated no aparece (2013 es vector, no pixel art)', () => {
    expect(CH3_SOURCE).not.toMatch(/image-rendering:\s*pixelated/)
  })

  // ── T6: REGRESSION LOCK — assets Kingdom New Lands retirados ────────────
  it('T6 los assets Kingdom (sky/far/mountains/path/window/parchment/marks) ya no se referencian', () => {
    const retired = [
      'ch3-sky.webp', 'ch3-far.png', 'ch3-mountains.png', 'ch3-path.png',
      'ch3-window.png', 'ch3-parchment.webp', 'ch3-flash-fallen.png',
      'ch3-mark-rebuild.png', 'ch3-mark-standard.png', 'ch3-mark-orb.png',
      'ch3-html5-future.png',
    ]
    for (const asset of retired) {
      expect(CH3_SOURCE, `${asset} no debería seguir referenciado`).not.toContain(asset)
    }
  })

  // ── T7: reactividad de locale ────────────────────────────────────────────
  it('T7 toggle locale es→en actualiza el hero sin re-mount', async () => {
    const { wrapper, i18n } = mountCh3({ locale: 'es' })
    const titleEs = wrapper.find('.ch3-hero-title').text()
    i18n.global.locale.value = 'en'
    await flushPromises()
    const titleEn = wrapper.find('.ch3-hero-title').text()
    expect(titleEn.length).toBeGreaterThan(0)
    expect(titleEn).not.toBe(titleEs)
  })

  // ── T8: PRM no rompe el mount ────────────────────────────────────────────
  it('T8 monta sin errores bajo prefers-reduced-motion', () => {
    expect(() => mountCh3({ prefersReduced: true })).not.toThrow()
  })

  // ── T9: sin em-dash en el copy nuevo ─────────────────────────────────────
  it('T9 ningún texto nuevo (ch3.* i18n) contiene el carácter em-dash', () => {
    const es = JSON.parse(readFileSync(resolve(process.cwd(), 'src/i18n/es.json'), 'utf8'))
    const en = JSON.parse(readFileSync(resolve(process.cwd(), 'src/i18n/en.json'), 'utf8'))
    const flatten = (obj) => JSON.stringify(obj)
    expect(flatten(es.ch3)).not.toContain(EM_DASH)
    expect(flatten(en.ch3)).not.toContain(EM_DASH)
  })

  // ── T10: REGRESSION LOCK — controles invisibles fuera del tab order ─────
  it('T10 con el Acto 1 en pantalla, el CTA del hero y los 4 "Seguir leyendo" son inert (no tabulables)', () => {
    const { wrapper } = mountCh3()
    // Estado de montaje por defecto: overallVh=0 (Acto 1 en pantalla, ningún
    // slide del Acto 2 activo) — el escenario exacto reportado por el
    // reviewer: "con el Acto 1 en pantalla, Tab alcanza el CTA del hero...".
    const heroCta = wrapper.find('.ch3-hero .ch3-ghost-btn')
    expect(heroCta.exists()).toBe(true)
    // `inert` es un atributo heredado por comportamiento (bloquea foco en todo
    // el subtree) pero la IDL property sólo refleja el elemento que la tiene
    // seteada — se verifica en el ancestro real `.ch3-slide` (`.ch3-hero`
    // mismo), no en el botón.
    const heroSlide = heroCta.element.closest('.ch3-slide')
    expect(heroSlide?.inert, 'slide del hero debería ser inert con el Acto 1 en pantalla').toBe(true)

    const beats = wrapper.findAllComponents(Ch3StoryBeat)
    for (let i = 0; i < 4; i++) {
      const btn = beats[i].find('.ch3-beat-more')
      expect(btn.exists(), `beat ${i} debería tener expansor`).toBe(true)
      // El expansor vive dentro del slide (.ch3-layer.ch3-slide) al que
      // applyProgress() le asigna `.inert` — buscamos el ancestro real.
      const slideEl = btn.element.closest('.ch3-slide')
      expect(slideEl?.inert, `slide del beat ${i} debería ser inert con el Acto 1 en pantalla`).toBe(true)
    }
  })
})
