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
import { defineComponent, h, ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter3Content from '@/components/Chapter3Content.vue'
import Ch3StoryBeat from '@/components/Ch3StoryBeat.vue'
import Ch3Roadmap from '@/components/Ch3Roadmap.vue'
import {
  CH3_STEP_COUNT,
  ACT1_UNITS,
  DECOR_FADE_P1_START,
  DECOR_FADE_RATE,
  P1_COMPLETE_VH,
  stepToOverallVh,
} from '@/utils/ch3Progress'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({ projects: [] }))

function mountCh3({ locale = 'es', prefersReduced = false, activeChapter } = {}) {
  const i18n = createTestI18n({ locale })
  const provide = { prm: { prefersReduced: { value: prefersReduced } } }
  // TASK-021: scrollState es opcional — cuando se provee, isCh3Active
  // (Chapter3Content.vue) lo usa para gatear el montaje de Ch3Roadmap.vue.
  // Sin proveerlo, el fallback ref(3) del componente asume "activo" (mismo
  // patrón defensivo que Chapter2Content.vue).
  if (activeChapter !== undefined) {
    provide.scrollState = { activeChapter: ref(activeChapter), scrollToChapter: vi.fn() }
  }
  const wrapper = mount(Chapter3Content, {
    global: {
      plugins: [i18n],
      provide,
      attachTo: document.body,
    },
  })
  return { wrapper, i18n }
}

// Harness — envuelve Chapter3Content en <main class="scroll-shell"><section>
// para que sectionEl/shellEl (Chapter3Content.vue onMounted, vía
// stageRef.closest('section')/closest('.scroll-shell')) resuelvan a
// elementos reales, igual que la topología real de ScrollShell.vue. mount()
// standalone (mountCh3 arriba) SIEMPRE deja sectionEl/shellEl en null (no
// hay ningún <section> ancestro — ver T1 "no hay ningún <section> anidado"),
// así que goToStep() nunca llega a shellEl.scrollTo en esos tests. Este
// harness es el único caso de esta suite que SÍ ejercita esa rama.
const Harness = defineComponent({
  render() {
    return h('main', { class: 'scroll-shell' }, [h('section', {}, [h(Chapter3Content)])])
  },
})

function mountHarness({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Harness, {
    global: {
      plugins: [i18n],
      provide: { prm: { prefersReduced: { value: false } } },
      attachTo: document.body,
    },
  })
  return wrapper
}

// mountHarnessAttached — TASK-030 ronda 2, MEDIUM-2: `attachTo` va como
// opción de mount() de NIVEL SUPERIOR (contrato de Vue Test Utils v2), no
// dentro de `global` — mountHarness() de arriba lo pone ahí desde hace
// tiempo y @vue/test-utils lo ignora en silencio (no lanza, no conecta el
// wrapper al `document.body` real). Sin la clave en el lugar correcto,
// `document.activeElement` nunca refleja `.focus()` porque el elemento no
// cuelga del document real (jsdom exige conexión real para enfocar). Los
// tests de foco de esta ronda necesitan `document.activeElement` real —
// mismo patrón ya usado por tests/a11y/focus-trap.test.js — así que se
// resuelve acá en un helper propio en vez de tocar mountHarness() (arriba)
// y arriesgar el comportamiento de T1-T18, que no dependen de foco real.
function mountHarnessAttached({ reduced = false } = {}) {
  const i18n = createTestI18n({ locale: 'es' })
  const wrapper = mount(Harness, {
    attachTo: document.body,
    global: {
      plugins: [i18n],
      provide: { prm: { prefersReduced: { value: reduced } } },
    },
  })
  return wrapper
}

const CH3_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter3Content.vue'),
  'utf8'
)

const EM_DASH = String.fromCharCode(0x2014)

describe('Chapter3Content.vue (TASK-009 — La muerte de Flash, rediseño flat 2013)', () => {
  // ── T1: DOM de los dos actos ─────────────────────────────────────────────
  it('T1 Acto 1: .ch3-act1-pin + .ch3-act1-scene + H1 accesible + escenografía aria-hidden salvo el play', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-act1-pin').exists()).toBe(true)
    expect(wrapper.find('.ch3-act1-scene').exists()).toBe(true)
    const h1 = wrapper.find('.ch3-act1-title')
    expect(h1.element.tagName).toBe('H1')
    expect(h1.text().length).toBeGreaterThan(0)
    // TASK-030 (feedback Rafael): `.ch3-act1-decor` dejó de llevar
    // aria-hidden en el contenedor (adentro vive el botón de play, real y
    // focusable) — cada pieza puramente decorativa lo lleva individualmente.
    expect(wrapper.find('.ch3-act1-decor').attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.find('.ch3-desktop').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.ch3-phone').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.ch3-wireframe').attributes('aria-hidden')).toBe('true')
    const playBtn = wrapper.find('.ch3-flash-btn')
    expect(playBtn.exists()).toBe(true)
    expect(playBtn.element.tagName).toBe('BUTTON')
    expect(playBtn.attributes('aria-hidden')).toBeUndefined()
    expect(playBtn.attributes('aria-label')?.length).toBeGreaterThan(0)
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
      'Y entonces Flash se murió',
      'Me tocó reconstruir en Pink Parrot',
      'En ese desorden, el ágil dejó de ser teoría de slides',
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

  // ── T15: REGRESSION LOCK (TASK-028) — el umbral de pointer-events/inert
  // vive en UNA sola constante importada, no como literal repetido.
  //
  // CORRECCIÓN (review de cierre de TASK-028): la versión anterior de este
  // lock era `expect(CH3_SOURCE).not.toMatch(/0\.05/)` — un negativo GLOBAL
  // sobre el SFC entero (script + template + CSS + comentarios). Dos
  // problemas reales, no hipotéticos:
  //   1. Falso positivo: "0.05" como substring es vocabulario normal de
  //      este proyecto (letter-spacing: 0.05em en BootScreen.vue y
  //      chapter-components.css, opacity 0.055/0.052 en Chapter5Content.vue,
  //      delays 0.05s en Chapter2Content.vue) — cualquiera de esos idioms
  //      aterrizando algún día en el CSS de ch3 pone este test rojo por la
  //      razón EQUIVOCADA. (Señal de que ya molestaba: los comentarios de
  //      esta sesión tuvieron que esquivar escribir el número literal.)
  //   2. Sub-lockea el AC#6: si un call site se reemplaza por un literal
  //      DISTINTO de 0.05 (ej. `slide.opacity <= 0.1`), el string "0.05"
  //      nunca aparece y el test queda VERDE — exactamente el drift que el
  //      AC#6 pide atrapar, sin atraparlo.
  //
  // Fix: aserciones POSITIVAS por call site, ancladas al comparador exacto
  // (identificador + operador + INERT_OPACITY_THRESHOLD) — atrapan tanto
  // "volvió el literal 0.05" como "lo reemplazaron por OTRO literal",
  // porque en cualquiera de los dos casos el texto exacto del comparador
  // deja de matchear. No hace falta compilar el `<style scoped>` real (la
  // lección de LECCIONES-TECNICAS.md §4 aplica a contratos de CASCADA CSS,
  // no a esto): el contrato acá es "qué identificador usa la expresión JS",
  // visible directamente en el source sin resolver especificidad ninguna.
  //
  // Plantado en rojo: cambié el call site de `slide.opacity` a un literal
  // DISTINTO (`slide.opacity <= 0.1`, dejando `act1LayerOp >
  // INERT_OPACITY_THRESHOLD` intacto) — el segundo `toMatch` falló, sin
  // tocar el import ni el string "0.05" (el escenario que la versión
  // anterior del lock dejaba pasar en verde). Restaurado antes de commitear.
  it('T15 REGRESSION LOCK: el umbral de pointer-events/inert usa INERT_OPACITY_THRESHOLD en AMBOS call sites, no un literal propio', () => {
    expect(CH3_SOURCE).toMatch(
      /import\s*\{[^}]*INERT_OPACITY_THRESHOLD[^}]*\}\s*from\s*['"]@\/utils\/ch3Progress['"]/
    )
    expect(CH3_SOURCE).toMatch(/act1LayerOp\s*>\s*INERT_OPACITY_THRESHOLD/)
    expect(CH3_SOURCE).toMatch(/slide\.opacity\s*<=\s*INERT_OPACITY_THRESHOLD/)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// TASK-021 — roadmap paso a paso (AC#3/AC#4) + gate de montaje por capítulo
// activo. La matemática pura (currentStep, stepToOverallVh, ACT2_STEP_VH)
// ya está exhaustivamente testeada en tests/utils/ch3Progress.test.js — acá
// sólo se verifica el WIRING: que Chapter3Content.vue efectivamente monta/
// oculta el roadmap según el capítulo activo y que un click en un punto
// efectivamente llama shellEl.scrollTo con el target físico correcto
// (dirección 1 de la sincronización bidireccional del AC#4 — la dirección
// 2, scroll real → roadmap, sólo es verificable con layout real, ver la
// verificación CDP del hand-off de este ticket, Lección 2 de
// .planning/LECCIONES-TECNICAS.md: jsdom no hace layout).
describe('Chapter3Content.vue — TASK-021 roadmap (gate + wiring)', () => {
  it('T11 el roadmap monta con CH3_STEP_COUNT puntos cuando ch3 es el capítulo activo (o sin scrollState provisto, default)', () => {
    const { wrapper } = mountCh3()
    const roadmap = wrapper.findComponent(Ch3Roadmap)
    expect(roadmap.exists()).toBe(true)
    expect(roadmap.props('steps').length).toBe(CH3_STEP_COUNT)
    expect(roadmap.props('currentIndex')).toBe(0) // overallVh=0 al montar → paso 0 (Acto 1)
  })

  it('T12 REGRESSION LOCK: el roadmap NO monta cuando otro capítulo está activo (evita el bleed de position:fixed documentado en Chapter4Content.vue)', () => {
    const { wrapper } = mountCh3({ activeChapter: 5 })
    expect(wrapper.findComponent(Ch3Roadmap).exists()).toBe(false)
  })

  it('T13 el roadmap vuelve a montar si activeChapter cambia a 3 en caliente (reactividad del gate)', async () => {
    const i18n = createTestI18n({ locale: 'es' })
    const activeChapter = ref(1)
    const wrapper = mount(Chapter3Content, {
      global: {
        plugins: [i18n],
        provide: {
          prm: { prefersReduced: { value: false } },
          scrollState: { activeChapter, scrollToChapter: vi.fn() },
        },
      },
    })
    expect(wrapper.findComponent(Ch3Roadmap).exists()).toBe(false)
    activeChapter.value = 3
    await flushPromises()
    expect(wrapper.findComponent(Ch3Roadmap).exists()).toBe(true)
  })

  it('T14 click en un punto del roadmap navega: shellEl.scrollTo(target físico de stepToOverallVh(paso)) (AC#4, dirección click→scroll)', async () => {
    // tests/setup.js ya mockea HTMLElement.prototype.scrollTo (jsdom no lo
    // implementa) — se limpia antes de este test para aislar sus llamadas de
    // cualquier otro test previo de la suite.
    HTMLElement.prototype.scrollTo.mockClear()
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    try {
      const wrapper = mountHarness()
      const roadmap = wrapper.findComponent(Ch3Roadmap)
      const dots = roadmap.findAll('.ch3-roadmap-dot')
      await dots[4].trigger('click') // paso 4 = beat índice 2 ("el método")
      expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledTimes(1)
      const call = HTMLElement.prototype.scrollTo.mock.calls[0][0]
      expect(call.behavior).toBe('smooth')
      // sectionEl.offsetTop es 0 en jsdom (sin layout real) — el target es
      // directamente stepToOverallVh(4) * 800px.
      expect(call.top).toBeCloseTo(stepToOverallVh(4) * 800, 5)
      expect(stepToOverallVh(4)).toBeGreaterThan(ACT1_UNITS) // sanity: paso 4 cae en el Acto 2
    } finally {
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
    }
  })

  // ── T16-T18: TASK-030 (feedback Rafael) — el botón de play del Acto 1
  // deja de ser decoración y dispara el mismo recorrido que el CTA del hero
  // y los puntos del roadmap (goToStep → shellEl.scrollTo). Mismo harness y
  // mismo mock de scrollTo que T14, arriba.
  it('T16 click en .ch3-flash-btn navega a step 1: shellEl.scrollTo(target físico de stepToOverallVh(1))', async () => {
    HTMLElement.prototype.scrollTo.mockClear()
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    try {
      const wrapper = mountHarness()
      await wrapper.find('.ch3-flash-btn').trigger('click')
      expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledTimes(1)
      const call = HTMLElement.prototype.scrollTo.mock.calls[0][0]
      expect(call.behavior).toBe('smooth')
      expect(call.top).toBeCloseTo(stepToOverallVh(1) * 800, 5)
    } finally {
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
    }
  })

  it('T17 REGRESSION LOCK: .ch3-flash-btn es un <button type="button"> con aria-label no vacío (antes era un <div> decorativo)', () => {
    const { wrapper } = mountCh3()
    const btn = wrapper.find('.ch3-flash-btn')
    expect(btn.element.tagName).toBe('BUTTON')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.attributes('aria-label')?.trim().length).toBeGreaterThan(0)
  })

  it('T18 la capa del Acto 1 (act1LayerRef) queda `inert` cuando su opacidad cae bajo INERT_OPACITY_THRESHOLD, para sacar el play del tab order al desvanecerse', async () => {
    // jsdom no hace layout real (Lección 2 de LECCIONES-TECNICAS.md, citada
    // también en T14) — flushProgress() lee sectionEl.getBoundingClientRect()
    // directo, así que se mockea acá en vez de simular scrollTop físico.
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    try {
      const wrapper = mountHarness()
      const act1Layer = wrapper.find('.ch3-act1-pin').element
      // Al montar (overallVh=0) el Acto 1 está a opacidad plena → no inert.
      expect(act1Layer.inert).toBe(false)

      const sectionEl = wrapper.find('section').element
      // Bien pasado el último paso del Acto 2 → act1LayerOp cae bajo el
      // umbral (mismo mecanismo que T10, acá exercitando la transición).
      const overallVh = stepToOverallVh(CH3_STEP_COUNT - 1) + 2
      sectionEl.getBoundingClientRect = () => ({ top: -overallVh * 800, bottom: 0, left: 0, right: 0, width: 0, height: 0 })
      sectionEl.dispatchEvent(new Event('scroll'))
      wrapper.find('.scroll-shell').element.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => setTimeout(resolve, 20)) // deja correr el rAF mockeado (setTimeout 16ms, ver tests/setup.js)
      expect(act1Layer.inert, 'act1LayerRef debería quedar inert lejos del Acto 1').toBe(true)
    } finally {
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
    }
  })

  // ── T19-T23: ronda 2 de review (feedback Rafael) ────────────────────────
  it('T19 REGRESSION LOCK (LOW-6/AC2): tras el click en .ch3-flash-btn, cuando el scroll llega al hero, currentStep avanza a 1 y el roadmap lo refleja', async () => {
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    try {
      const wrapper = mountHarness()
      const sectionEl = wrapper.find('section').element
      await wrapper.find('.ch3-flash-btn').trigger('click')
      // shellEl.scrollTo está mockeado (jsdom no anima scroll real, ver
      // tests/setup.js) — se simula el efecto que produciría: la posición
      // física del paso 1 (mismo patrón de mock que T18, arriba).
      sectionEl.getBoundingClientRect = () => ({
        top: -stepToOverallVh(1) * 800,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
      })
      wrapper.find('.scroll-shell').element.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => setTimeout(resolve, 20))
      const roadmap = wrapper.findComponent(Ch3Roadmap)
      expect(roadmap.props('currentIndex')).toBe(1)
    } finally {
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
    }
  })

  it('T20 MEDIUM-1 REGRESSION LOCK: .ch3-act1-decor (con el botón de play adentro) queda `inert` en cuanto SU PROPIO fade toca 0, ANTES de que act1LayerOp/act1LayerRef lo hagan', async () => {
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    try {
      const wrapper = mountHarness()
      const sectionEl = wrapper.find('section').element
      // Mismo overallVh que T19 de ch3Progress.test.js: decorOp ya en 0,
      // act1LayerOp todavía arriba del umbral (ni siquiera empezó su fade,
      // que arranca recién en ACT1_FADE_START).
      const decorZeroVh = (DECOR_FADE_P1_START + 1 / DECOR_FADE_RATE) * P1_COMPLETE_VH
      sectionEl.getBoundingClientRect = () => ({
        top: -decorZeroVh * 800,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
      })
      wrapper.find('.scroll-shell').element.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(
        wrapper.find('.ch3-act1-decor').element.inert,
        'el decor debería quedar inert en cuanto su propio fade (decorOp) toca 0'
      ).toBe(true)
      expect(
        wrapper.find('.ch3-act1-pin').element.inert,
        'la capa entera NO debería estar inert todavía acá — act1LayerOp sigue arriba del umbral'
      ).toBe(false)
    } finally {
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
    }
  })

  it('T21 MEDIUM-2 REGRESSION LOCK: tras playAct1 (modo pin), cuando el scroll llega al hero el foco se mueve al CTA del hero en vez de quedar huérfano en <body>', async () => {
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    try {
      const wrapper = mountHarnessAttached()
      const sectionEl = wrapper.find('section').element
      const playBtn = wrapper.find('.ch3-flash-btn')
      playBtn.element.focus()
      await playBtn.trigger('click')
      sectionEl.getBoundingClientRect = () => ({
        top: -stepToOverallVh(1) * 800,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
      })
      wrapper.find('.scroll-shell').element.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => setTimeout(resolve, 20))
      const heroCta = wrapper.find('.ch3-hero .ch3-ghost-btn').element
      expect(document.activeElement).toBe(heroCta)
      wrapper.unmount() // LOW (ronda 3): attachTo: document.body deja nodos colgados si no se desmonta
    } finally {
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
    }
  })

  it('T22 REGRESSION LOCK: si currentStep llega a 1 por scroll MANUAL (sin pasar por playAct1), el foco NO se roba — pendingFocusStep sólo se arma dentro de playAct1', async () => {
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    try {
      const wrapper = mountHarnessAttached()
      const sectionEl = wrapper.find('section').element
      const heroCta = wrapper.find('.ch3-hero .ch3-ghost-btn').element
      const otherEl = wrapper.find('.ch3-act1-title').element
      otherEl.tabIndex = -1
      otherEl.focus()
      expect(document.activeElement).toBe(otherEl) // sanity: el foco arranca en otro lado

      // Mismo destino físico que T21/T19 (paso 1 = hero), pero SIN haber
      // pasado por playAct1() — nadie armó pendingFocusStep.
      sectionEl.getBoundingClientRect = () => ({
        top: -stepToOverallVh(1) * 800,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
      })
      wrapper.find('.scroll-shell').element.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => setTimeout(resolve, 20))

      const roadmap = wrapper.findComponent(Ch3Roadmap)
      expect(roadmap.props('currentIndex')).toBe(1) // el paso sí avanzó...
      expect(document.activeElement, 'el foco no debería moverse solo porque currentStep llegó a 1 sin pasar por playAct1').not.toBe(heroCta)
      expect(document.activeElement).toBe(otherEl)
      wrapper.unmount()
    } finally {
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
    }
  })

  it('T23 MEDIUM-2 bajo PRM: playAct1 también mueve el foco al CTA del hero cuando el IntersectionObserver confirma currentStep===1 (rama scrollIntoView)', async () => {
    globalThis.MockIntersectionObserver.reset()
    const wrapper = mountHarnessAttached({ reduced: true })
    const playBtn = wrapper.find('.ch3-flash-btn')
    playBtn.element.focus()
    // Bajo PRM, goToStep() resuelve por scrollIntoView (jsdom lo ignora, no
    // hace nada real) — currentStep lo mueve initPRMStepObserver(), no
    // applyProgress(), así que se simula la intersección real del hero
    // (targets[1] en ese observer) cruzando el centro del viewport.
    await playBtn.trigger('click')
    const heroEl = wrapper.find('.ch3-hero').element
    // Varios hijos de Chapter3Content.vue (Ch3StoryBeat, etc.) traen su
    // PROPIO IntersectionObserver para reveals — el stepObserver de
    // initPRMStepObserver() no es necesariamente el último instanciado, así
    // que se ubica por CONTENIDO (el único que observa `sceneRef` + los 7
    // slides, heroEl entre ellos) en vez de asumir orden de instanciación.
    const stepObserver = globalThis.MockIntersectionObserver.instances.find((inst) => inst.observed.has(heroEl))
    expect(stepObserver, 'debería existir un IntersectionObserver observando el slide del hero (initPRMStepObserver)').toBeTruthy()
    stepObserver.triggerEntries([{ isIntersecting: true, target: heroEl }])
    await flushPromises()
    const heroCta = wrapper.find('.ch3-hero .ch3-ghost-btn').element
    expect(document.activeElement).toBe(heroCta)
    wrapper.unmount()
  })

  it('T24 MEDIUM-3 REGRESSION LOCK (camino b, el que más duele): click en play + remar hacia atrás (currentStep nunca llega a 1) + click en el roadmap a un paso lejano NO deja el flag robar el foco en tránsito ni al llegar a destino', async () => {
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    try {
      const wrapper = mountHarnessAttached()
      const sectionEl = wrapper.find('section').element
      const heroCta = wrapper.find('.ch3-hero .ch3-ghost-btn').element

      // 1) click en play — arma pendingFocusStep=1, dispara el primer
      // shellEl.scrollTo (mockeado, no mueve nada real — ver tests/setup.js).
      await wrapper.find('.ch3-flash-btn').trigger('click')

      // 2) el usuario "rema hacia atrás y cancela" el scroll suave: currentStep
      // NUNCA llega a 1 (el flag sigue armado, sin nadie que lo limpie salvo
      // el fix de esta ronda).

      // 3) click en un punto lejano del roadmap (paso 4) — MISMO patrón que
      // T14: el smooth scroll nuevo hacia el paso 4 ATRAVIESA currentStep=1
      // en tránsito antes de asentarse en destino. Sin el fix, el watcher
      // dispara en pleno vuelo al cruzar el paso 1 y roba el foco al CTA del
      // hero — que después queda inert cuando el scroll sigue de largo.
      const roadmap = wrapper.findComponent(Ch3Roadmap)
      const dots = roadmap.findAll('.ch3-roadmap-dot')
      await dots[4].trigger('click') // paso 4 = beat índice 2 (mismo dot que T14)

      // Simula el tránsito: primero se cruza el paso 1 (hero)...
      sectionEl.getBoundingClientRect = () => ({
        top: -stepToOverallVh(1) * 800,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
      })
      wrapper.find('.scroll-shell').element.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(
        document.activeElement,
        'el foco NO debería saltar al CTA del hero de sólo PASAR por currentStep=1 en tránsito hacia otro destino'
      ).not.toBe(heroCta)

      // ...y después se asienta en el paso 4 real (destino del click).
      sectionEl.getBoundingClientRect = () => ({
        top: -stepToOverallVh(4) * 800,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
      })
      wrapper.find('.scroll-shell').element.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(roadmap.props('currentIndex')).toBe(4) // aterrizó donde el click pidió
      // NOTA: el foco puede terminar huérfano en <body> acá — el botón de
      // play original queda `inert` en cuanto decorOp cruza el umbral (lejos
      // ya del paso 4), y eso es el MISMO comportamiento de un usuario que
      // tabulea al botón y scrollea lejos a mano SIN clickear nada (fuera
      // del alcance de MEDIUM-3). Lo que este lock protege puntualmente es
      // que el flag NO añada un robo de foco extra hacia el CTA del hero.
      expect(document.activeElement, 'el foco no debería haber sido robado al CTA del hero, que ya no es el paso activo').not.toBe(heroCta)
      wrapper.unmount()
    } finally {
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
    }
  })
})
