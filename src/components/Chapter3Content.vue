<!--
  Chapter3Content.vue — TASK-009: rediseño total de ch3 "La muerte de Flash" (2013).

  Fuente de verdad: .planning/design/03-ch3-muerte-de-flash.md (complementa,
  sin reemplazar, .planning/design/00-sistema-visual-global.md).

  MIGRACIÓN AL MECANISMO MULTI-VIEWPORT (TASK-014, retomando este ticket tras
  su bloqueo): el rediseño flat de 2013 (commit 672ca4a) quedó atrapado en
  `.ch3-stage` con `overflow-y: auto` — un scroll anidado que competía con el
  scroll-snap mandatory del shell (medido: 4181px de contenido en 735px de
  viewport, 31 elementos fuera de pantalla). Este ticket mata ese scroll
  anidado adoptando `.chapter-stage` (utility sticky de ScrollShell.vue,
  documentada junto a `.chapter-section[data-viewports]` en ese archivo) como
  elemento ROOT de este componente, con `App.vue` pasando
  `:chapter-viewports="{ 3: CH3_VIEWPORTS }"` (constante importada de
  @/utils/ch3Progress.js, ver TASK-021 más abajo — App.vue ya no repite el
  número a mano).

  CONSECUENCIA ARQUITECTURAL (documentada para quien retome este archivo):
  `.chapter-stage` fija `height:100dvh; overflow:clip; position:sticky` — su
  contenido queda ANCLADO en pantalla durante TODO el recorrido de los N
  viewports de la sección (ver el comentario largo en ScrollShell.vue). Esto
  significa que el Acto 2 ("flujo normal" según la spec original, escrita
  ANTES de que existiera este mecanismo) no puede ser un scroll de documento
  normal dentro de este componente: cualquier contenido que exceda 100dvh
  queda recortado en silencio por `overflow:clip` (que además prohíbe todo
  scroll, programático incluido — ver ScrollShell.vue). La resolución elegida
  aquí: TODO ch3 (Acto 1 + Acto 2) se re-arquitecturó como una escena
  scrollytelling de un solo frame fijo (100dvh) donde el progreso de scroll
  DENTRO de la sección (no un contenedor interno) mapea a "cuál capa está
  activa" — el mismo patrón que ya usaban Apple/Pudding.cool para escenas
  ancladas multi-viewport. Han quedado 8 "capas" (`.ch3-layer`) apiladas
  absolutas dentro de `.ch3-scene`: el Acto 1 (drama del plugin, scrubbed
  0..1 vía `--ch3-p`, EXACTA misma lógica CSS que ya existía) + 7 "slides"
  de Acto 2 (hero, 5 beats, cierre) que hacen crossfade+translate según un
  progreso continuo (`continuousSlide`). Bajo `prefers-reduced-motion`, la
  capa `.ch3-stage` misma se desancla (position:static !important, SOLO para
  ch3, SOLO bajo PRM — ver el bloque `<style>`) y el Acto 2 vuelve a fluir
  normal, apilado y completo, honrando la instrucción de la spec ("el acto 2
  se renderiza completo y visible sin reveals") de una forma que el
  mecanismo pinned no permite sin ese override puntual.

  Guion visual en dos actos (spec §3):
  - Acto 1 (`.ch3-act1-*`): un navegador de 2013 con el stage de Flash de
    550x400 muriendo en pantalla al scrollear (degradado que se drena, capas
    que se despegan, vector que colapsa a flat) + un teléfono mostrando el
    puzzle de plugin faltante. Escenografía 100% procedural (CSS + SVG
    inline) — CERO imágenes nuevas. `--ch3-p` (0..1, progreso LOCAL del
    Acto 1) conserva exactamente las mismas fórmulas calc() que el commit
    672ca4a — sólo cambió de dónde viene el valor (antes: scroll interno de
    `.ch3-stage`; ahora: progreso de la sección dentro del shell).
  - Acto 2 (`.ch3-hero` + 5× beat slide + `.ch3-close`): el renacimiento
    flat de 2013 (Flat UI Colors, Open Sans, ghost buttons, iconos
    long-shadow). 5 beats (Ch3StoryBeat.vue) — uno por párrafo de
    bio.eras.3 — muestran SIEMPRE el numeral+kicker+lead sin click (defecto 4
    de TASK-007); un expansor "Seguir leyendo" profundiza I-IV, el beat V
    (el remate) va completo.

  Motion (spec §7 + AC#5 del ticket): el parallax del hero (factores 0.06,
  0.14, 0.26 sobre `--ch3-hy`) usa `animation-timeline: scroll(nearest
  block)` nativo detrás de `@supports (animation-timeline: scroll())`, con
  `animation-range-start/end` calculados una sola vez por JS (mount+resize,
  NO por frame — la animación en sí corre en el compositor cuando el
  navegador soporta la API) y fallback rAF cuando no. El resto del scrub
  (Acto 1 completo + el crossfade de los 7 slides del Acto 2) es rAF puro:
  requiere progreso custom-mapeado por tramos que `scroll()`/`view()` no
  expresan sin JS recalculando animation-range por elemento — documentado
  como decisión de alcance, no como omisión, en el hand-off de este ticket.
  PRM: el Acto 1 congela en `--ch3-p:0.4` (mismo criterio que 672ca4a) y NO
  se adjunta ningún listener de SCROLL (el Acto 2 fluye normal, ver arriba);
  SÍ se adjunta un IntersectionObserver liviano (ver `initPRMStepObserver()`)
  para sincronizar el roadmap con qué parte del flujo está en pantalla —
  única excepción, ver TASK-021 abajo.

  TASK-021 (pedido directo de Rafael, "scroll más sensible" + "roadmap paso a
  paso"): dos cambios sobre lo anterior, ninguno toca el guion visual ni el
  mecanismo pin/rAF/scroll-timeline de arriba.
  - Sensibilidad: `ACT2_STEP_VH` (@/utils/ch3Progress.js) reemplaza el costo
    implícito de 1.0 viewport/slide por 0.5 — cada slide del Acto 2 cuesta la
    mitad de scroll físico. El Acto 1 (cinemática scrubbed, no paginada)
    queda intacto a propósito — ver el comentario de esa constante para la
    medición completa. `TOTAL_UNITS`/`CH3_VIEWPORTS` se derivan de ella; el
    literal de `:chapter-viewports` en App.vue ya no se repite a mano, importa
    `CH3_VIEWPORTS` directo.
  - Roadmap: `Ch3Roadmap.vue`, un rail de 8 puntos clickeables (1 Acto 1 + 7
    slides del Acto 2) gateado por `isCh3Active` (ver más abajo) que muestra
    el paso actual, cuántos faltan, y permite saltar directo. `currentStep`
    (ref) es la fuente de verdad de qué punto está activo — la escribe
    `applyProgress()` en modo pin, o `initPRMStepObserver()` bajo PRM.
-->
<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'
import Ch3StoryBeat from './Ch3StoryBeat.vue'
import Ch3Roadmap from './Ch3Roadmap.vue'
import {
  ACT1_UNITS,
  ACT2_SLIDE_COUNT,
  ACT2_STEP_VH,
  TOTAL_UNITS,
  INERT_OPACITY_THRESHOLD,
  clamp,
  computeCh3Frame,
  stepToOverallVh,
} from '@/utils/ch3Progress'

const { t } = useI18n()

const chapter = chapters[3]
const ch3Projects = computed(() => projects.filter((p) => p.chapterEra === 3))

// bio.eras.3.text trae 5 párrafos separados por \n\n — uno por beat (spec §8).
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// ── PRM ──────────────────────────────────────────────────────────────────────
const prm = inject('prm', null)
const reduced = () => prm?.prefersReduced?.value ?? false

// ── Roadmap (TASK-021) — gate de montaje por capítulo activo ────────────────
// El position:fixed de Ch3Roadmap.vue viviría en el DOM todo el tiempo (los 7
// ChapterNContent.vue están SIEMPRE montados, ScrollShell sólo los desplaza
// con scroll) si no se gatea explícitamente — mismo bug que Chapter4Content.vue
// ya documenta para su propio position:fixed. `scrollState.activeChapter` (el
// mismo que usa StickyTimeline.vue para su aria-current) resuelve esto: sólo
// true mientras ch3 cubre >=60% del viewport (ver useScrollState.js), estable
// durante TODO el pin (no parpadea entre viewports internos). Fallback ref(3)
// si algún test monta el componente sin proveer 'scrollState' (mismo patrón
// que Chapter2Content.vue con su activeChapter).
const scrollState = inject('scrollState', null)
const activeChapterRef = scrollState?.activeChapter ?? ref(3)
const isCh3Active = computed(() => activeChapterRef.value === 3)

// ── Destape de la narrativa (spec §8, defecto 4 de TASK-007) ─────────────────
// Lead visible sin click = las primeras N oraciones del párrafo, partidas por
// el token literal ". " — NO regex. El beat V (índice 4, el remate) va
// siempre completo — spec §3 acto 2 punto 2.
const LEAD_SENTENCE_COUNT = [2, 2, 2, 2]

function splitLead(text, leadCount) {
  const sentences = text.split('. ')
  if (sentences.length <= leadCount) return { lead: text, rest: '' }
  const leadSentences = sentences.slice(0, leadCount)
  const last = leadSentences[leadSentences.length - 1]
  const lead = leadSentences.join('. ') + (last.endsWith('.') ? '' : '.')
  const rest = sentences.slice(leadCount).join('. ')
  return { lead, rest }
}

function lastSentence(text) {
  const sentences = text.split('. ')
  const last = sentences[sentences.length - 1] || text
  return last.endsWith('.') ? last : `${last}.`
}

const BEAT_META = [
  { key: 'flash', icon: 'flash', tone: 'residual' },
  { key: 'rebuild', icon: 'code', tone: 'accent' },
  { key: 'method', icon: 'sprint', tone: 'accent' },
  { key: 'edge', icon: 'megaphone', tone: 'accent' },
  { key: 'leap', icon: 'shield', tone: 'html5' },
]

const beats = computed(() =>
  BEAT_META.map((meta, i) => {
    const paragraph = bioParagraphs.value[i] || ''
    const full = i === BEAT_META.length - 1
    const { lead, rest } = full ? { lead: paragraph, rest: '' } : splitLead(paragraph, LEAD_SENTENCE_COUNT[i])
    return {
      ...meta,
      numeral: String(i + 1).padStart(2, '0'),
      kicker: t(`ch3.beats.${i}.kicker`),
      lead,
      rest,
      expandable: !full && rest.length > 0,
      full,
      reverse: i % 2 === 1,
    }
  })
)

const closingLine = computed(() => lastSentence(bioParagraphs.value[4] || ''))

// ── Roadmap (TASK-021) — 8 pasos: 0=Acto 1 completo, 1=hero, 2..6=beats 0..4,
// 7=cierre. Las etiquetas reutilizan las traducciones que YA existen
// (kickers de los beats) salvo 3 claves nuevas cortas (ch3.roadmap.act1/hero/
// close) — ver es.json/en.json.
//
// Corrección de comentario (LOW, review de cierre de TASK-021): el texto
// anterior decía que este array no repetía la cantidad de pasos "a mano"
// porque la derivaba de CH3_STEP_COUNT. Eso sobredeclara: el largo real sale
// de 3 entradas `{ label }` literales (act1, hero, close) más el spread de
// `BEAT_META.map(...)`, NO de una lectura directa de CH3_STEP_COUNT — así
// que si BEAT_META cambia de longitud sin que nadie toque este array, sí
// podrían divergir en teoría. El riesgo real es nulo porque T11
// (tests/utils/ch3Progress.test.js) lockea esa divergencia por otro camino
// (currentStep vs. CH3_STEP_COUNT); no se cambia el código, sólo el
// comentario.
const roadmapSteps = computed(() => [
  { label: t('ch3.roadmap.act1') },
  { label: t('ch3.roadmap.hero') },
  ...BEAT_META.map((_, i) => ({ label: t(`ch3.beats.${i}.kicker`) })),
  { label: t('ch3.roadmap.close') },
])

// currentStep — índice discreto del roadmap (0..7), actualizado sólo cuando
// applyProgress() detecta un cambio real (ver computeCh3Frame().currentStep)
// — evita re-render de Ch3Roadmap.vue en cada frame de rAF cuando el paso
// activo no cambió.
const currentStep = ref(0)

// Presupuesto de progreso (ACT1_UNITS, ACT2_SLIDE_COUNT, ACT2_STEP_VH,
// TOTAL_UNITS) y la matemática pura del scrub (clamp, computeCh3Frame,
// stepToOverallVh) viven en @/utils/ch3Progress.js — extraídas para poder
// testearlas sin DOM/scroll real (ver el comentario de ese archivo, incluye
// el hallazgo HIGH de esta sesión: continuousSlide sin piso, o el hero queda
// superpuesto al Acto 1).

// ── Refs de DOM ────────────────────────────────────────────────────────────
const stageRef = ref(null) // root .chapter-stage — TASK-014 contrato punto 2
const act1LayerRef = ref(null) // .ch3-act1-pin — capa completa del Acto 1, ver applyProgress()
const sceneRef = ref(null) // .ch3-act1-scene — target de --ch3-p (idéntico a 672ca4a)
const heroSkyRef = ref(null)
const heroHillBackRef = ref(null)
const heroHillFrontRef = ref(null)
const slideEls = ref([]) // 7 wrappers .ch3-slide, índice 0..6

function setSlideEl(el, index) {
  slideEls.value[index] = el || null
}

// ── Detección de soporte nativo (AC#5) — mutuamente excluyente con rAF ──────
const NATIVE_SUPPORTED = (() => {
  try {
    return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' &&
      CSS.supports('animation-timeline', 'scroll()')
  } catch {
    return false
  }
})()

let sectionEl = null
let shellEl = null
let raf = 0
let resizeRaf = 0

function applyProgress(overallVh) {
  const frame = computeCh3Frame(overallVh)

  // Acto 1 — --ch3-p LOCAL 0..1, mismas fórmulas CSS que 672ca4a.
  sceneRef.value?.style.setProperty('--ch3-p', frame.p1.toFixed(4))

  // La capa entera del Acto 1 se apaga apenas termina su scrub — ver el
  // comentario HIGH junto a computeCh3Frame() en ch3Progress.js (hallazgo de
  // verificación CDP real: sin esto, el bloque naranja HTML5 queda pintado
  // encima de todos los slides del Acto 2 para siempre).
  if (act1LayerRef.value) {
    act1LayerRef.value.style.opacity = frame.act1LayerOp.toFixed(3)
    act1LayerRef.value.style.pointerEvents = frame.act1LayerOp > INERT_OPACITY_THRESHOLD ? 'auto' : 'none'
  }

  // Acto 2 — un slide por índice (0=hero .. 6=cierre), opacity+translateY
  // ya resueltos por computeCh3Frame() (mismo hallazgo HIGH: el hero
  // quedaba superpuesto al Acto 1 si continuousSlide clampeaba su piso a 0).
  //
  // MEDIUM (ronda de corrección de review): `pointer-events: none` bloquea
  // click/hover pero NO saca del tab order — con el Acto 1 en pantalla, Tab
  // seguía alcanzando el CTA del hero, los 4 "Seguir leyendo" y los links de
  // ProjectCard en slides a opacity:0 (foco sin ninguna indicación visible,
  // WCAG 2.4.3/2.4.7; Enter podía togglear un acordeón invisible). `inert`
  // saca el subtree del tab order Y de la accessibility tree a la vez, con
  // el MISMO umbral (INERT_OPACITY_THRESHOLD, TASK-028 — antes un literal
  // numérico propio de este bloque, ver el comentario de esa constante en
  // ch3Progress.js) que ya gobierna pointer-events más arriba — un solo
  // booleano, dos efectos. Elección deliberada sobre `visibility: hidden`:
  // `inert` no toca layout/pintado (el crossfade sigue siendo
  // opacity+transform puro, sin repintar) y, a diferencia de `visibility:
  // hidden`, NO saca el texto del innerText — el AC#1 (leads de los 5 beats
  // sin click) sigue cumpliéndose para slides fuera de foco.
  frame.slides.forEach((slide, i) => {
    const el = slideEls.value[i]
    if (!el) return
    const isInert = slide.opacity <= INERT_OPACITY_THRESHOLD
    el.style.opacity = slide.opacity.toFixed(3)
    el.style.transform = `translateY(${slide.translateYpx.toFixed(1)}px)`
    el.style.pointerEvents = isInert ? 'none' : 'auto'
    el.inert = isInert
  })

  // Parallax del hero — sólo si rAF gobierna --ch3-hy (nativo lo posee si soportado).
  if (!NATIVE_SUPPORTED) {
    slideEls.value[0]?.style.setProperty('--ch3-hy', frame.heroLocalP.toFixed(4))
  }

  // Roadmap (TASK-021) — sólo escribe el ref si el paso discreto cambió,
  // para no forzar un re-render de Ch3Roadmap.vue en cada frame de rAF
  // (frame.currentStep es estable dentro de la meseta de cada slide).
  if (frame.currentStep !== currentStep.value) {
    currentStep.value = frame.currentStep
  }
}

function flushProgress() {
  raf = 0
  if (!sectionEl) return
  const rect = sectionEl.getBoundingClientRect()
  const vh = window.innerHeight || document.documentElement.clientHeight || 1
  const overallVh = clamp(-rect.top / vh, 0, TOTAL_UNITS)
  applyProgress(overallVh)
}

function onShellScroll() {
  if (!raf) raf = requestAnimationFrame(flushProgress)
}

// applyNativeHeroRange — AC#5: calcula UNA VEZ (mount + resize) el rango en
// píxeles absolutos del documento durante el que la escena del hero es
// relevante, y lo asigna a `animation-range-start/end` de las 3 capas de
// parallax. La animación en sí (--ch3-hy 0→1, spec §7) la corre el
// compositor nativo vía `scroll(nearest block)` (declarado en el <style>
// bajo @supports) — esta función NO corre por frame, sólo fija el rango.
//
// TASK-021: el margen a cada lado del cruce Acto1→hero (antes 0.5/1.5
// viewports fijos, asumiendo el costo implícito de 1.0 viewport/slide)
// ahora se expresa como 0.5×/1.5× ACT2_STEP_VH — con la nueva sensibilidad
// (0.5) el margen físico se reduce a la mitad (0.25/0.75 viewports), la
// misma proporción relativa al ritmo de los slides que tenía el original.
function applyNativeHeroRange() {
  if (!NATIVE_SUPPORTED || !sectionEl) return
  const vh = window.innerHeight || document.documentElement.clientHeight || 1
  const startPx = Math.max(0, sectionEl.offsetTop + (ACT1_UNITS - 0.5 * ACT2_STEP_VH) * vh)
  const endPx = sectionEl.offsetTop + (ACT1_UNITS + 1.5 * ACT2_STEP_VH) * vh
  for (const el of [heroSkyRef.value, heroHillBackRef.value, heroHillFrontRef.value]) {
    if (!el) continue
    el.style.animationRangeStart = `${startPx}px`
    el.style.animationRangeEnd = `${endPx}px`
  }
}

function onResize() {
  if (resizeRaf) cancelAnimationFrame(resizeRaf)
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0
    applyNativeHeroRange()
    if (!reduced()) onShellScroll()
  })
}

// goToStep — navegación paso a paso (TASK-021 AC#4): usada tanto por el CTA
// del hero ("La historia completa" → goToStep(2), el primer beat) como por
// cada punto del roadmap (Ch3Roadmap.vue @navigate). step 0 = Acto 1
// completo, 1..7 = los 7 slides del Acto 2 (hero, 5 beats, cierre) —
// stepToOverallVh() en @/utils/ch3Progress.js es la ÚNICA fuente de la
// conversión paso→progreso físico, para no tener dos fórmulas de scroll
// target divergiendo con el tiempo.
//
// Bajo PRM el Acto 2 fluye en flujo normal (ver <style> PRM) así que un
// scrollIntoView real funciona; en el modo pineado no hay un elemento al que
// "entrar" (todo vive en el mismo frame fijo), así que se salta el scroll
// del shell directo a la posición física que corresponde a ese paso.
function goToStep(step) {
  if (reduced()) {
    const target = step <= 0 ? sceneRef.value : slideEls.value[clamp(step - 1, 0, ACT2_SLIDE_COUNT - 1)]
    target?.scrollIntoView({ behavior: 'auto', block: 'start' })
    return
  }
  if (!shellEl || !sectionEl) return
  const vh = window.innerHeight || document.documentElement.clientHeight || 1
  const target = sectionEl.offsetTop + stepToOverallVh(step) * vh
  shellEl.scrollTo({ top: target, behavior: 'smooth' })
}

// ── Roadmap bajo PRM (TASK-021 AC#4 + AC#9) ─────────────────────────────────
// Sin el pin (Acto 2 fluye normal bajo PRM, ver <style>), no hay un
// `overallVh` continuo que leer — así que currentStep se sincroniza con
// scroll real vía IntersectionObserver en vez de computeCh3Frame(). Banda
// angosta al centro del viewport (rootMargin -45%/-45%): el primer elemento
// (Acto 1 o un slide) que la cruza es "el paso actual" — mismo patrón
// scrollspy que useScrollState.js usa para activeChapter, aplicado aquí a
// escala de paso en vez de capítulo. `targets[i]` es exactamente el índice
// de paso (targets[0]=Acto1=step0, targets[1..7]=slideEls[0..6]=step1..7).
let stepObserver = null
function initPRMStepObserver() {
  if (typeof IntersectionObserver === 'undefined') return
  const targets = [sceneRef.value, ...slideEls.value].filter(Boolean)
  stepObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const idx = targets.indexOf(entry.target)
        if (idx >= 0) currentStep.value = idx
      }
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  )
  targets.forEach((el) => stepObserver.observe(el))
}

onMounted(() => {
  sectionEl = stageRef.value?.closest('section') || null
  shellEl = stageRef.value?.closest('.scroll-shell') || null

  if (reduced()) {
    // PRM: cuadro estático del Acto 1 (mismo criterio que 672ca4a — a p=0.4
    // el botón ya perdió el brillo especular, ver fórmulas CSS abajo). El
    // Acto 2 no necesita valores de progreso: fluye completo vía CSS PRM.
    sceneRef.value?.style.setProperty('--ch3-p', '0.4')
    initPRMStepObserver()
    return
  }

  applyNativeHeroRange()
  applyProgress(0)
  if (shellEl) {
    shellEl.addEventListener('scroll', onShellScroll, { passive: true })
  }
  window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (resizeRaf) cancelAnimationFrame(resizeRaf)
  if (shellEl) shellEl.removeEventListener('scroll', onShellScroll)
  window.removeEventListener('resize', onResize)
  stepObserver?.disconnect()
})
</script>

<template>
  <div ref="stageRef" class="chapter-stage ch3-stage">
    <div class="ch3-scene">
      <!-- ══════════════════════════════════════════════════════════════════
           ACTO 1 — el plugin muere (scrubbed por el progreso de la sección)
           ══════════════════════════════════════════════════════════════════ -->
      <div ref="act1LayerRef" class="ch3-layer ch3-act1-pin" :class="{ 'is-reduced': reduced() }">
        <div ref="sceneRef" class="ch3-act1-scene">
          <h1 class="ch3-act1-title">{{ t('ui.deathOfFlash') }}</h1>

          <div class="ch3-act1-decor" aria-hidden="true">
            <div class="ch3-desktop"></div>

            <div class="ch3-browser">
              <div class="ch3-browser-tabs"><span class="ch3-browser-tab"></span></div>
              <div class="ch3-browser-omnibox"></div>
              <div class="ch3-browser-infobar">
                <span>{{ t('ch3.ui.infobar') }}</span>
                <span class="ch3-ghost-btn ch3-ghost-btn--tiny">{{ t('ch3.ui.runOnce') }}</span>
              </div>

              <div class="ch3-flash-stage">
                <div class="ch3-flash-btn">
                  <span class="ch3-flash-shadow"></span>
                  <span class="ch3-flash-bevel"></span>
                  <span class="ch3-flash-fill"></span>
                  <span class="ch3-flash-desat"></span>
                  <span class="ch3-flash-specular"></span>
                  <span class="ch3-flash-play">&#9654;</span>
                </div>
                <svg class="ch3-wireframe" viewBox="0 0 100 72">
                  <rect x="4" y="4" width="92" height="64" rx="2" />
                  <circle cx="4" cy="4" r="2" /><circle cx="96" cy="4" r="2" />
                  <circle cx="96" cy="68" r="2" /><circle cx="4" cy="68" r="2" />
                  <circle cx="50" cy="36" r="2" />
                </svg>
                <div class="ch3-flat-block"></div>
              </div>
            </div>

            <div class="ch3-phone">
              <div class="ch3-phone-screen">
                <svg class="ch3-puzzle" viewBox="0 0 40 40">
                  <path d="M4 10h6a3 3 0 1 1 0 6H4v6h6a3 3 0 1 1 0 6H4a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z" />
                </svg>
                <p class="ch3-phone-note">{{ t('ch3.ui.phoneNote') }}</p>
              </div>
            </div>

            <div class="ch3-act1-cue"><span class="ch3-act1-cue-arrow">&#8964;</span></div>
          </div>

          <div class="ch3-act1-white" aria-hidden="true"></div>
          <div class="ch3-act1-accent" aria-hidden="true"></div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════
           ACTO 2 — el renacimiento flat, 7 slides (hero + 5 beats + cierre)
           ══════════════════════════════════════════════════════════════════ -->
      <div :ref="(el) => setSlideEl(el, 0)" class="ch3-layer ch3-slide ch3-hero">
        <div class="ch3-hero-parallax" aria-hidden="true">
          <div ref="heroSkyRef" class="ch3-hero-sky"></div>
          <div ref="heroHillBackRef" class="ch3-hero-hill ch3-hero-hill--back"></div>
          <div ref="heroHillFrontRef" class="ch3-hero-hill ch3-hero-hill--front"></div>
          <span class="ch3-hero-cloud ch3-hero-cloud--a"></span>
          <span class="ch3-hero-cloud ch3-hero-cloud--b"></span>
        </div>
        <div class="ch3-hero-copy">
          <h2 class="ch3-hero-title">{{ t('ch3.hero.title') }}</h2>
          <p class="ch3-hero-sub">{{ t('ch3.hero.sub') }}</p>
          <button type="button" class="ch3-ghost-btn" @click="goToStep(2)">{{ t('ch3.hero.cta') }}</button>
        </div>
      </div>

      <div
        v-for="(beat, i) in beats"
        :key="beat.key"
        :ref="(el) => setSlideEl(el, i + 1)"
        class="ch3-layer ch3-slide"
      >
        <Ch3StoryBeat
          :numeral="beat.numeral"
          :kicker="beat.kicker"
          :icon="beat.icon"
          :tone="beat.tone"
          :lead="beat.lead"
          :rest="beat.rest"
          :expandable="beat.expandable"
          :full="beat.full"
          :reverse="beat.reverse"
        />
      </div>

      <div :ref="(el) => setSlideEl(el, 6)" class="ch3-layer ch3-slide ch3-close-slide">
        <footer class="ch3-close">
          <svg class="ch3-close-badge" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M24 8l14 5-2 15q0 8-12 12Q12 36 12 28L10 13z" />
            <path d="M18 23l6 6 8-10" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <p class="ch3-close-line">{{ closingLine }}</p>
        </footer>

        <div v-if="ch3Projects.length > 0" class="ch3-projects">
          <ProjectCard v-for="project in ch3Projects" :key="project.id" :project="project" />
        </div>
      </div>
    </div>

    <!-- Roadmap paso a paso (TASK-021) — fuera de .ch3-scene a propósito:
         position:fixed (ver Ch3Roadmap.vue), gateado por isCh3Active para no
         quedar en el DOM (y por lo tanto visible) mientras otro capítulo está
         activo. -->
    <Ch3Roadmap
      v-if="isCh3Active"
      :steps="roadmapSteps"
      :current-index="currentStep"
      @navigate="goToStep"
    />
  </div>
</template>

<style>
/* ─────────────────────────────────────────────────────────────────────────
 * @property — --ch3-p (progreso 0..1 del scrub del Acto 1, idéntico a
 * 672ca4a) + --ch3-hy (progreso 0..1 del parallax del hero, NUEVO — permite
 * que la capa nativa de scroll-driven animations (AC#5) la anime vía
 * @keyframes cuando el navegador soporta animation-timeline).
 * ───────────────────────────────────────────────────────────────────────── */
@property --ch3-p {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}
@property --ch3-hy {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

@layer components {
  /* ───────────────────────────────────────────────────────────────────────
   * Tokens locales de ch3 — Flat UI Colors (Designmodo, 2013), spec §4.
   * ─────────────────────────────────────────────────────────────────────── */
  .ch3-stage {
    --ch3-text-2: #34495e; /* Wet Asphalt — subtítulo hero, texto secundario */
    --ch3-residual: #e74c3c; /* Alizarin — acento residual de Flash, solo beat I */
    --ch3-html5: #e34f26; /* color oficial HTML5 — solo beat V y cierre */
    --ch3-long-shadow: rgba(44, 62, 80, 0.15);
    --ch3-close-bg: #2c3e50; /* Midnight Blue — franja de cierre, puente a ch4 */
    --ch3-white: #ecf0f1; /* Clouds — mismo tono que --c-bg de la era */

    /* TASK-009 (retomando TASK-014): .ch3-stage COEXISTE con `.chapter-stage`
     * (utility global de ScrollShell.vue) en el MISMO elemento — no redeclara
     * position/height/overflow (ese contrato es de `.chapter-stage`), sólo
     * aporta tokens + tipografía. */
    box-sizing: border-box;
    color: var(--c-fg);
    font-family: var(--font-body);
  }

  /* .ch3-scene — llena el frame de 100dvh que `.chapter-stage` fija; contiene
   * las 8 capas apiladas (Acto 1 + 7 slides del Acto 2). background propio
   * para que nunca se vea transparencia entre capas durante un crossfade.
   *
   * HIGH (ronda de corrección de review, AC#5): `overflow: hidden` aquí
   * establece un "scroll container" — mismo mecanismo exacto que
   * ScrollShell.vue documenta como lección pagada (ver su comentario largo
   * junto a `.chapter-section[data-viewports]`) y por el que ese archivo usa
   * `overflow: clip` en vez de `hidden`. `animation-timeline: scroll(nearest
   * block)` (más abajo, bloque `@supports`) resuelve al scroll container
   * ANCESTRO más cercano — con `hidden` acá, ese ancestro es `.ch3-scene`
   * mismo, cuyo contenido (8 capas absolutas con `inset:0`, exactamente del
   * tamaño del contenedor) tiene rango de scroll vertical CERO. Timeline con
   * rango cero = timeline inerte: `--ch3-hy` nunca se mueve de su
   * `initial-value: 0` y el parallax del hero queda congelado en navegadores
   * con soporte nativo (Chrome/Edge/Safari 18+) — el fallback rAF no
   * escribe `--ch3-hy` cuando `NATIVE_SUPPORTED` es true (ver <script>), así
   * que no hay red de seguridad. `overflow: clip` recorta visualmente igual
   * que `hidden` (mismo fix anti-bleed) pero NO establece scroll container,
   * así que la resolución de `nearest block` sigue subiendo por la cadena de
   * ancestros (`.chapter-stage` y `.chapter-section[data-viewports]` ya son
   * `clip` en ScrollShell.vue) hasta `.scroll-shell`, el único scroller real
   * del sitio — ahí el rango de `animation-range-start/end` que calcula
   * `applyNativeHeroRange()` (ver <script>) sí tiene recorrido. */
  .ch3-scene {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: clip;
    background: var(--c-bg);
  }

  /* .ch3-layer — capa apilada absoluta, base compartida por el Acto 1 y los
   * 7 slides del Acto 2. Sin transition CSS a propósito: el opacity/transform
   * se escribe por frame en scrub 1:1 con el scroll (mismo criterio que
   * --ch3-p) — una transition pelearía contra esa escritura y produciría
   * lag en vez de scrub ajustado.
   *
   * MEDIUM (ronda de corrección de review): SIN `will-change` acá a
   * propósito. La spec §7 fija un presupuesto de motion de máximo 12
   * elementos animados concurrentes — `will-change: opacity, transform` en
   * las 8 capas de esta clase (Acto 1 + 7 slides), sumado a las capas del
   * botón glossy y del parallax del hero, se iba a ~16. Las escrituras por
   * frame de `applyProgress()` (opacity/transform inline) no requieren
   * promoción a layer permanente: el compositor promueve igual en cuanto
   * detecta la escritura activa, `will-change` sólo evita el frame de
   * promoción inicial — costo despreciable para 8 capas full-viewport que
   * ya escriben desde el primer frame post-mount. El presupuesto real queda
   * en las capas que sí lo necesitan: las 4 del botón glossy (línea ~640) y
   * las 3 del parallax del hero (líneas ~825-840). */
  .ch3-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* .ch3-slide — slides genéricos del Acto 2 (hero y cierre declaran su
   * propio display/flex más abajo con sus propias clases; éste es el caso
   * base que consumen los 5 beats). */
  .ch3-slide {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--sp-lg);
    box-sizing: border-box;
  }

  /* ═══════════════════════════════════════════════════════════════════════
   * ACTO 1 — escenografía procedural del plugin muerto. Tokens locales:
   * "asset-scene" documentado (spec sistema visual §3).
   * ═══════════════════════════════════════════════════════════════════════ */
  .ch3-act1-pin {
    --ch3-desk: #2b2d31;
    --ch3-chrome: #3a3d42;
    --ch3-chrome-border: #4a4d52;
    --ch3-infobar-bg: #fdf3d0;
    --ch3-infobar-fg: #6b5d1f;
    --ch3-flash-a: #b3151d;
    --ch3-flash-b: #7a0c12;
    --ch3-flash-specular-c: rgba(255, 255, 255, 0.35);
    --ch3-dead-gray: #7f8c8d;
    --ch3-puzzle-gray: #8e8e93;
    --ch3-wire: #3498db;
    --ch3-flat-red: #e74c3c;
  }

  .ch3-act1-scene {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: var(--ch3-desk);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ch3-act1-title {
    position: relative;
    z-index: 3;
    margin: 0 0 clamp(220px, 30vh, 320px);
    font-family: var(--font-body);
    font-weight: 300;
    font-size: var(--fs-700);
    color: #f3f4f6;
    text-align: center;
    letter-spacing: -0.01em;
    /* La capa ENTERA (.ch3-act1-pin) se apaga vía JS (applyProgress(),
     * act1LayerOp) apenas termina el Acto 1 — no hace falta un opacity local
     * aquí también (evita una segunda fuente de verdad para el mismo apagado,
     * ver el comentario HIGH junto a act1LayerOp en <script>). */
  }

  .ch3-act1-decor {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2xl);
    padding-top: 8vh;
    /* Fade de todo el chrome (navegador + teléfono) hacia el final del scrub —
       spec §3 tramo p 0.70-0.85. */
    opacity: calc(1 - max(0, (var(--ch3-p) - 0.7) * 6.5));
  }

  /* ── Navegador 2013 (CSS puro) ────────────────────────────────────────── */
  .ch3-browser {
    position: relative;
    width: min(620px, 62vw);
    border: 1px solid var(--ch3-chrome-border);
    background: var(--ch3-chrome);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  }
  .ch3-browser-tabs {
    display: flex;
    gap: 6px;
    padding: 8px 10px 0;
  }
  .ch3-browser-tab {
    width: 96px;
    height: 22px;
    background: #4a4d52;
    border-radius: 4px 4px 0 0;
  }
  .ch3-browser-omnibox {
    height: 26px;
    margin: 0 8px 8px;
    background: #24262a;
    border: 1px solid var(--ch3-chrome-border);
    border-radius: 3px;
  }
  .ch3-browser-infobar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-sm);
    padding: 8px 12px;
    background: var(--ch3-infobar-bg);
    color: var(--ch3-infobar-fg);
    font-family: var(--font-body);
    font-size: var(--fs-200);
  }

  /* ── Stage de Flash 550x400 + botón glossy de 4 capas (spec §3.3) ──────── */
  .ch3-flash-stage {
    position: relative;
    width: min(550px, 56vw);
    aspect-ratio: 550 / 400;
    margin: var(--sp-lg) auto;
    background: #1c1e21;
    border: 1px solid var(--ch3-chrome-border);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ch3-flash-btn {
    position: relative;
    width: 46%;
    aspect-ratio: 1;
    border-radius: 50%;
  }
  .ch3-flash-shadow,
  .ch3-flash-bevel,
  .ch3-flash-fill,
  .ch3-flash-desat,
  .ch3-flash-specular {
    position: absolute;
    inset: 0;
    border-radius: 50%;
  }
  /* MEDIUM (ronda de corrección de review, spec §7): `will-change` sólo en
   * las 4 capas que efectivamente animan (shadow/bevel/desat opacity,
   * specular opacity+transform) — la spec fija "4 capas del botón glossy"
   * explícitamente. `.ch3-flash-fill` (abajo) es el degradado estático de
   * fondo, nunca cambia tras el mount: no necesita promoción a layer. */
  .ch3-flash-shadow,
  .ch3-flash-bevel,
  .ch3-flash-desat {
    will-change: opacity;
  }
  .ch3-flash-shadow {
    box-shadow: 0 18px 34px rgba(0, 0, 0, 0.55);
    opacity: calc(1 - var(--ch3-p) * 2.5);
  }
  .ch3-flash-bevel {
    box-shadow:
      inset 0 2px 0 rgba(255, 255, 255, 0.25),
      inset 0 -3px 6px rgba(0, 0, 0, 0.4),
      0 0 0 2px var(--ch3-chrome-border);
    opacity: calc(1 - (var(--ch3-p) - 0.1) * 2.5);
  }
  .ch3-flash-fill {
    background: radial-gradient(circle at 38% 32%, var(--ch3-flash-a), var(--ch3-flash-b));
  }
  .ch3-flash-desat {
    background: var(--ch3-dead-gray);
    opacity: calc((var(--ch3-p) - 0.15) * 4);
  }
  .ch3-flash-specular {
    will-change: opacity, transform;
    background: radial-gradient(circle at 34% 26%, var(--ch3-flash-specular-c), transparent 55%);
    opacity: calc(1 - (var(--ch3-p) - 0.3) * 3);
    transform:
      translateY(calc(max(0px, (var(--ch3-p) - 0.3) * 60vh)))
      rotate(calc(min(0deg, (var(--ch3-p) - 0.3) * -13deg)));
  }
  .ch3-flash-play {
    position: relative;
    z-index: 1;
    color: #fdece9;
    font-size: clamp(1.6rem, 5vw, 2.4rem);
    opacity: calc(1 - var(--ch3-p) * 2);
  }

  .ch3-wireframe {
    position: absolute;
    inset: 14%;
    fill: none;
    stroke: var(--ch3-wire);
    stroke-width: 1;
    stroke-dasharray: 3 2;
    opacity: min((var(--ch3-p) - 0.4) * 10, (0.7 - var(--ch3-p)) * 10);
  }
  .ch3-wireframe circle {
    stroke-dasharray: none;
    fill: var(--ch3-wire);
  }

  .ch3-flat-block {
    position: absolute;
    inset: 30%;
    background: var(--ch3-flat-red);
    opacity: min(max(0, (var(--ch3-p) - 0.4) * 5), 1);
  }

  /* ── Teléfono 2013: el plugin nunca llegó aquí (siempre visible, estático) ── */
  .ch3-phone {
    flex-shrink: 0;
    width: min(120px, 14vw);
    aspect-ratio: 9 / 18;
    padding: 8px 6px;
    border-radius: 16px;
    background: #0b0b0d;
    border: 1px solid #2a2c30;
  }
  .ch3-phone-screen {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #1c1e21;
    border-radius: 4px;
    padding: var(--sp-xs);
    text-align: center;
  }
  .ch3-puzzle {
    width: 34%;
    fill: var(--ch3-puzzle-gray);
  }
  .ch3-phone-note {
    margin: 0;
    color: #cfd2d6;
    font-family: var(--font-body);
    font-size: 0.6rem;
    line-height: 1.3;
  }

  /* ── Cue de scroll (se apaga apenas el usuario empieza a scrollear) ─────── */
  .ch3-act1-cue {
    position: absolute;
    bottom: 6vh;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    opacity: calc(1 - var(--ch3-p) * 8);
  }
  .ch3-act1-cue-arrow {
    display: inline-block;
    color: var(--ch3-dead-gray);
    font-size: 1.6rem;
    animation: ch3-cue-pulse 2.5s ease-in-out infinite;
  }
  @keyframes ch3-cue-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  /* ── Renacimiento: blanqueo + acento HTML5 (spec §3 tramo p 0.85-1.00) ──── */
  /* MEDIUM (review de cierre de TASK-025): decorativas + aria-hidden, pero
   * SIN `pointer-events:none` seguían siendo hit-testeables aun con opacity
   * calculada en 0 (calc() puede dar negativo; el navegador clampea el
   * PINTADO a 0 pero el hit-test por defecto no distingue). Medido con CDP
   * real (Chrome headed) en overallVh=0: `elementFromPoint()` sobre el
   * centro de `.ch3-act1-title` devolvía `.ch3-act1-accent`, invisible,
   * en vez del título — exactamente la clase de artefacto que este ticket
   * vino a matar (AC#1: "ningún elemento lo tapa", prueba geométrica). Sin
   * handlers propios (ambas son puramente decorativas), así que
   * `pointer-events:none` no quita ninguna interacción real. */
  .ch3-act1-white,
  .ch3-act1-accent {
    position: absolute;
    z-index: 4;
    pointer-events: none;
  }
  .ch3-act1-white {
    inset: 0;
    background: var(--ch3-white);
    opacity: calc((var(--ch3-p) - 0.85) * 6.5);
  }
  .ch3-act1-accent {
    inset: 30%;
    background: var(--ch3-html5);
    opacity: calc((var(--ch3-p) - 0.9) * 10);
  }

  /* ═══════════════════════════════════════════════════════════════════════
   * ACTO 2 — el renacimiento flat (7 slides pineados con crossfade)
   * ═══════════════════════════════════════════════════════════════════════ */

  /* Ghost button — compartido por hero CTA + beat "Seguir leyendo" (spec §6) */
  .ch3-ghost-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.7em 1.4em;
    border: 2px solid var(--c-accent);
    border-radius: 3px;
    background: transparent;
    color: var(--c-accent);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: background var(--dur-theme) ease, color var(--dur-theme) ease, transform var(--dur-tap) ease;
  }
  .ch3-ghost-btn:hover,
  .ch3-ghost-btn:focus-visible {
    background: var(--c-accent);
    color: #ffffff;
  }
  .ch3-ghost-btn:active { transform: translateY(1px); }
  .ch3-ghost-btn--tiny {
    padding: 0.3em 0.8em;
    font-size: 0.6rem;
    cursor: default;
    pointer-events: none;
  }

  /* ── Hero (spec §3 acto 2.1) — slide índice 0 ────────────────────────────── */
  .ch3-hero {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--inset-chapter-top) var(--sp-lg) var(--sp-2xl);
    box-sizing: border-box;
  }
  /* HIGH (ronda de corrección de review, AC#5): mismo motivo que `.ch3-scene`
   * arriba — `overflow: hidden` acá era el ancestro MÁS CERCANO de las 3
   * capas de parallax (más cerca que `.ch3-scene`), así que era el que
   * ganaba la resolución de `nearest block` con rango cero. `clip` conserva
   * el recorte visual sin establecer scroll container. */
  .ch3-hero-parallax { position: absolute; inset: 0; pointer-events: none; overflow: clip; }
  .ch3-hero-sky { position: absolute; inset: 0; background: #d6eaf8; }
  .ch3-hero-hill {
    position: absolute;
    left: -5%;
    width: 110%;
    height: 45%;
    will-change: transform;
  }
  .ch3-hero-hill--back {
    bottom: 8%;
    background: #a9cce3;
    clip-path: polygon(0% 60%, 20% 30%, 45% 55%, 68% 20%, 100% 50%, 100% 100%, 0% 100%);
    transform: translateY(calc(var(--ch3-hy, 0) * -84px));
  }
  .ch3-hero-hill--front {
    bottom: 0%;
    height: 32%;
    background: #7fb3d5;
    clip-path: polygon(0% 70%, 22% 35%, 50% 65%, 74% 25%, 100% 55%, 100% 100%, 0% 100%);
    transform: translateY(calc(var(--ch3-hy, 0) * -156px));
  }
  .ch3-hero-sky { transform: translateY(calc(var(--ch3-hy, 0) * -36px)); will-change: transform; }
  .ch3-hero-cloud {
    position: absolute;
    top: 18%;
    width: 64px;
    height: 22px;
    background: #ffffff;
    border-radius: 999px;
    box-shadow: 10px 8px 0 var(--ch3-long-shadow);
    animation: ch3-cloud-drift linear infinite;
  }
  .ch3-hero-cloud--a { left: -10%; animation-duration: 90s; }
  .ch3-hero-cloud--b { top: 32%; left: -20%; width: 44px; height: 16px; animation-duration: 120s; animation-delay: -40s; }
  @keyframes ch3-cloud-drift {
    from { transform: translateX(-10vw); }
    to { transform: translateX(120vw); }
  }
  .ch3-hero-copy {
    position: relative;
    z-index: 1;
    max-width: 44rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-md);
  }
  .ch3-hero-title {
    margin: 0;
    font-family: var(--font-body);
    font-weight: 300;
    font-size: clamp(2.6rem, 6vw, 4.4rem);
    line-height: 1.12;
    letter-spacing: -0.01em;
    color: var(--c-fg);
    text-wrap: balance;
  }
  .ch3-hero-sub {
    margin: 0;
    font-family: var(--font-body);
    font-weight: 400;
    font-size: clamp(1.15rem, 2.4vw, 1.5rem);
    color: var(--ch3-text-2);
    text-wrap: pretty;
  }

  /* AC#5 — mejora progresiva nativa del parallax del hero: el compositor
   * anima --ch3-hy 0→1 sin JS por frame cuando el navegador soporta
   * animation-timeline; el rango absoluto (animation-range-start/end) lo
   * calcula applyNativeHeroRange() una sola vez (mount+resize). rAF NO
   * escribe --ch3-hy cuando este bloque está activo (mutuamente excluyente,
   * ver NATIVE_SUPPORTED en <script>). */
  @supports (animation-timeline: scroll()) {
    .ch3-hero-sky,
    .ch3-hero-hill--back,
    .ch3-hero-hill--front {
      animation: ch3-hero-hy-drift linear both;
      animation-timeline: scroll(nearest block);
    }
  }
  @keyframes ch3-hero-hy-drift {
    from { --ch3-hy: 0; }
    to { --ch3-hy: 1; }
  }

  /* ── Beats — Ch3StoryBeat.vue (alcanza su nodo raíz + descendientes porque
       este <style> NO es scoped) ────────────────────────────────────────── */
  .ch3-beat {
    display: flex;
    align-items: center;
    gap: var(--sp-2xl);
    padding: var(--sp-2xl) var(--sp-lg);
    max-width: var(--content-max);
    margin: 0 auto;
  }
  .ch3-beat--alt { flex-direction: row-reverse; }

  .ch3-beat-icon { position: relative; flex-shrink: 0; width: 88px; height: 88px; }
  .ch3-beat-icon-shadow {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    clip-path: polygon(50% 50%, 100% 0%, 135% 35%, 35% 135%, 0% 100%);
    background: var(--ch3-long-shadow);
    transform: translate(7px, 7px);
  }
  .ch3-beat-icon-svg {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    padding: 20%;
    box-sizing: border-box;
    color: var(--c-accent);
  }
  .ch3-beat--residual .ch3-beat-icon-svg { color: var(--ch3-residual); }
  .ch3-beat--html5 .ch3-beat-icon-svg { color: var(--ch3-html5); }
  .ch3-beat-icon-tone2 { opacity: 0.6; }

  .ch3-beat-copy { flex: 1; min-width: 0; max-width: var(--measure); }
  .ch3-beat-numeral {
    margin: 0;
    font-family: var(--font-body);
    font-weight: 300;
    font-size: clamp(3rem, 7vw, 5rem);
    line-height: 1;
    color: var(--c-border);
  }
  .ch3-beat-kicker {
    margin: 0 0 var(--sp-xs);
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--c-accent);
  }
  .ch3-beat--residual .ch3-beat-kicker { color: var(--ch3-residual); }
  .ch3-beat--html5 .ch3-beat-kicker { color: var(--ch3-html5); }
  .ch3-beat-lead {
    margin: 0;
    font-family: var(--font-body);
    font-weight: 400;
    font-size: 1.0625rem;
    line-height: 1.7;
    color: var(--c-fg);
    text-wrap: pretty;
  }
  .ch3-beat-more { margin-top: var(--sp-sm); }
  .ch3-beat-rest {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ch3-beat-rest.is-open { grid-template-rows: 1fr; }
  .ch3-beat-rest > p {
    overflow: hidden;
    margin: var(--sp-sm) 0 0;
    font-family: var(--font-body);
    font-size: 1.0625rem;
    line-height: 1.7;
    color: var(--c-fg);
  }

  /* ── Cierre del capítulo — slide índice 6, puente cromático a ch4 ───────── */
  .ch3-close-slide {
    flex-direction: column;
    gap: var(--sp-lg);
    background: var(--ch3-close-bg);
  }
  .ch3-close {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-md);
    padding: var(--sp-lg);
    text-align: center;
  }
  .ch3-close-badge { width: 40px; height: 40px; color: var(--ch3-html5); }
  .ch3-close-line {
    margin: 0;
    max-width: var(--measure);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: var(--fs-500);
    line-height: 1.4;
    color: #ffffff;
    text-wrap: balance;
  }

  .ch3-projects {
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
    max-width: var(--content-max);
    margin: 0 auto;
    padding: 0 var(--sp-lg) var(--sp-xl);
  }
  .ch3-projects .project-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--r-card); padding: var(--sp-md); }
  .ch3-projects .project-card-title { font-family: var(--font-body); font-weight: 600; color: var(--c-fg); border-bottom: 2px solid var(--c-accent); padding-bottom: var(--sp-xs); display: inline-block; }
  .ch3-projects .project-card-desc,
  .ch3-projects .project-card-role { font-family: var(--font-body); color: var(--c-fg); }
  .ch3-projects .project-card-link { color: var(--c-accent); background: none; box-shadow: none; text-decoration: none; }
  .ch3-projects .project-card-link:hover { text-decoration: underline; }

  /* ─────────────────────────────────────────────────────────────────────────
   * PRM — Acto 1 congela en su cuadro estático (--ch3-p:0.4, fijado por JS al
   * montar, sin listener de scroll); el Acto 2 abandona el mecanismo pineado
   * y fluye COMPLETO en flujo normal (spec §7 "sin reveals"), único override
   * puntual y aislado de `.chapter-stage` que autoriza este archivo — sólo
   * afecta a `.ch3-stage` (ningún otro capítulo lleva esta clase) y sólo
   * bajo PRM. Ver el comentario largo al inicio de este archivo.
   * ───────────────────────────────────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .ch3-stage {
      position: static !important;
      height: auto !important;
      min-height: 100%;
      overflow: visible !important;
      display: block !important;
    }
    .ch3-scene {
      position: static;
      height: auto;
      overflow: visible;
    }
    .ch3-layer {
      /* HIGH (hallazgo de verificación CDP en esta sesión): `position:
       * static` acá rompía la cadena de containing block para los
       * descendientes `position: absolute` de cada capa (`.ch3-hero-
       * parallax`, que no tiene ningún wrapper posicionado propio entre
       * ella y `.ch3-hero` === `.ch3-layer`) — sin un ancestro posicionado,
       * ese `inset:0` resolvía contra el initial containing block (el
       * viewport de `.scroll-shell`, que NUNCA scrollea porque el scroll
       * real es interno) en vez de contra su propio slide, y el paisaje
       * del hero quedaba pegado arriba de TODO el capítulo (confirmado con
       * screenshot real: montañas del hero superpuestas al título del
       * Acto 1). `position: relative` participa en el flujo normal
       * EXACTAMENTE igual que `static` (sin top/left no se desplaza) pero
       * SÍ establece containing block para los hijos absolutos — fix de
       * una palabra que preserva el resto del comportamiento intacto. */
      position: relative !important;
      width: auto;
      opacity: 1 !important;
      transform: none !important;
      pointer-events: auto !important;
      will-change: auto;
    }
    .ch3-act1-pin { height: 100vh; height: 100dvh; }
    .ch3-act1-scene { height: 100%; }
    .ch3-act1-title { opacity: 1 !important; }
    .ch3-act1-cue,
    .ch3-act1-cue-arrow,
    .ch3-hero-cloud {
      animation: none !important;
    }
    .ch3-hero-sky,
    .ch3-hero-hill--back,
    .ch3-hero-hill--front {
      animation: none !important;
      transform: none !important;
    }
    .ch3-hero { min-height: 78vh; }
    .ch3-close-slide { min-height: auto; }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * Responsive (spec §6) — mobile <768px apila a 1 columna; landscape mobile
   * (alto<500px) reduce el stage del Acto 1 y oculta el teléfono.
   * ───────────────────────────────────────────────────────────────────────── */
  @media (max-width: 767px) {
    .ch3-act1-decor { flex-direction: column; gap: var(--sp-lg); }
    .ch3-browser,
    .ch3-flash-stage { width: min(420px, 82vw); }
    .ch3-beat,
    .ch3-beat--alt { flex-direction: column; text-align: center; gap: var(--sp-md); }
    .ch3-beat-icon { margin: 0 auto; }
  }
  /* LOW (ronda de corrección de review): `width: min(550px, 78vw)` sólo
   * limitaba por ancho — en un viewport MUY bajo (ej. 844x390) el resultado
   * seguía siendo ~550px de ancho, y por `aspect-ratio: 550/400` eso da
   * ~400px de alto: más que el viewport entero. Medido con CDP real (Chrome
   * headed, no headless): `.ch3-browser` quedaba de 555px de alto en un
   * viewport de 390px, recortado ~67px arriba y ~98px abajo por el
   * `overflow: hidden` de `.ch3-act1-scene`. `62vh` como tercer argumento de
   * `min()` agrega el límite que faltaba (a 390px de alto, 62vh≈242px →
   * stage de ~176px de alto, que sí entra junto al chrome del navegador). */
  @media (max-height: 499px) and (orientation: landscape) {
    .ch3-phone { display: none; }
    .ch3-flash-stage { width: min(550px, 78vw, 62vh); }
    .ch3-act1-decor { gap: var(--sp-md); }
  }
}
</style>
