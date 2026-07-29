<!--
  Ch6Terminal.vue — TASK-012 ch6 climax: la conversación con la IA (DOM-first).

  Principio innegociable (spec .planning/design/06-ch6-climax-terminal-ia.md §5.1,
  TASK-007 defectos 2 y 3): el texto completo vive en el DOM desde el MOUNT del
  componente. Cero dependencia de eventos de Phaser, de tweens o de WebGL. Este
  componente NO importa Phaser ni conoce su existencia — Chapter6Content.vue hace
  de puente reenviando los eventos Vue `ascii-progress` / `token-tick` hacia
  `game.value?.events.emit(...)` (bridge DOM → Phaser, spec §4.2/§6.2: "el DOM
  manda, Phaser obedece; nunca al revés").

  Render de los párrafos: SIEMPRE como texto real (spans de palabra con opacity
  0.001→1, NUNCA display:none/visibility:hidden) — lectores de pantalla e
  indexadores ven el texto completo desde el primer render, independientemente
  de si la timeline de streaming llegó a correr. El streaming es un ENHANCEMENT
  visual sobre texto que ya está presente (spec §5.1).

  Lifecycle de la timeline (boot → prompt → thinking → streaming → decoding →
  done): activo SOLO cuando ch6 es el capítulo activo del sitio (mismo patrón
  que TerminalScroll.vue en ch0 — pausa al salir, reinicia al volver). El TEXTO
  en sí no depende de esto; solo la coreografía de reveal.

  Cierre circular con ch0 (spec §7): `.ch6-cursor` reproduce EXACTAMENTE el
  keyframe / duración / timing-function / glifo de `.terminal-cursor` en
  TerminalScroll.vue (blink steps(2) 1s infinite, carácter '█'). Verificado por
  tests/components/Ch6Terminal.cursor-citation.test.js comparando ambos archivos.

  Autoría explícita (AC7, decisión de Rafael): `chapters.6.convo.credit` declara
  sin eufemismos que el sitio lo construyeron Rafael Y una flota de agentes de
  IA — no se suaviza ni se reinterpreta.
-->
<script setup>
import { ref, computed, inject, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { bio } from '@/data/bio'
import { toBits, splitWords, splitAuthorWords } from '@/composables/useConvoStream.js'

const emit = defineEmits(['ascii-progress', 'token-tick'])

const { t, locale } = useI18n()

const injectedScrollState = inject('scrollState', null)
const injectedPrm = inject('prm', null)
const activeChapter = injectedScrollState?.activeChapter ?? ref(6)
const prefersReduced = injectedPrm?.prefersReduced ?? ref(false)

// ── Contenido (i18n, reactivo a locale) ────────────────────────────────────
const fullText = computed(() => t(bio.eras[6].textKey))
const closingSentence = computed(() => t('chapters.6.convo.closing'))
// Cuerpo a streamear = texto completo MENOS la frase de cierre (que llega por
// decode binario, no por streaming normal — spec §5.2 paso 7).
const bodyText = computed(() => {
  const idx = fullText.value.lastIndexOf(closingSentence.value)
  return (idx >= 0 ? fullText.value.slice(0, idx) : fullText.value).replace(/\s+$/, '')
})
const bodyParagraphs = computed(() =>
  bodyText.value.split(/\n\n+/).map((p) => splitWords(p)),
)
// Grid paralelo a bodyParagraphs: el índice de orden global (0-based) de cada
// token de PALABRA (no-espacio); los separadores heredan el índice de la
// palabra anterior para que aparezcan junto a ella.
const wordIndexGrid = computed(() => {
  let n = 0
  return bodyParagraphs.value.map((tokens) =>
    tokens.map((tok) => {
      if (/\S/.test(tok)) {
        const idx = n
        n += 1
        return idx
      }
      return Math.max(0, n - 1)
    }),
  )
})
const totalWords = computed(() =>
  bodyParagraphs.value.reduce((acc, p) => acc + p.filter((tok) => /\S/.test(tok)).length, 0),
)
const closingParts = computed(() => splitAuthorWords(closingSentence.value))
const bits = computed(() => toBits(closingSentence.value))
// Offset de carácter (fin, exclusivo) de cada token dentro de closingSentence —
// decodedBitGroups cuenta CARACTERES (1 char = 1 grupo de 8 bits, ver
// useConvoStream.js), así que un token se revela cuando el decode ya cubrió
// todos sus caracteres, no cuando cubrió N tokens.
const closingEndOffsets = computed(() => {
  let acc = 0
  return closingParts.value.map((p) => {
    acc += p.text.length
    return acc
  })
})

// ── Estado de la timeline ───────────────────────────────────────────────────
const bootVisible = ref([false, false, false, false])
const typedPrompt = ref('')
const phase = ref('idle') // idle | boot | prompt | thinking | streaming | decoding | done
const revealedWords = ref(0)
const decodedBitGroups = ref(0) // grupos de 8 bits ya decodificados (0..bits.length/8)

const bootLines = [
  { key: 'chapters.6.convo.boot1' },
  { key: 'chapters.6.convo.boot2' },
  { key: 'chapters.6.convo.boot3' },
  { key: 'chapters.6.convo.boot4' },
]

const totalBitGroups = computed(() => Math.ceil(bits.value.length / 8))
const bitsDisplay = computed(() => {
  // Grupos ya "decodificados" se muestran como el carácter real; el resto
  // sigue siendo el bit crudo (0/1) — bitstream real, no relleno aleatorio
  // (spec §5.3).
  const chars = []
  for (let g = 0; g < totalBitGroups.value; g++) {
    const group = bits.value.slice(g * 8, g * 8 + 8)
    chars.push(g < decodedBitGroups.value ? closingSentence.value[g] : group)
  }
  return chars.join(' ')
})

function isWordRevealed(pi, ti) {
  return revealedWords.value > wordIndexGrid.value[pi][ti]
}

// ── Timers — patrón Set (TerminalScroll.vue) para cleanup atómico ─────────
const timers = new Set()
function delay(ms) {
  return new Promise((resolve) => {
    const tid = setTimeout(() => {
      timers.delete(tid)
      resolve()
    }, ms)
    timers.add(tid)
  })
}
function clearAllTimers() {
  for (const tid of timers) clearTimeout(tid)
  timers.clear()
}

let cycleVersion = 0
function alive(v) {
  return v === cycleVersion && activeChapter.value === 6
}

/** Bridge DOM → Phaser (spec §4.4 tabla de estados del takeover). */
function emitAsciiProgress(frac) {
  let mix, mode, tint
  if (frac < 0.45) {
    const t2 = frac / 0.45
    mix = t2 * 0.45
    mode = 2
    tint = t2 * 0.3
  } else if (frac < 1) {
    const t2 = (frac - 0.45) / 0.55
    mix = 0.45 + t2 * 0.35
    mode = 1
    tint = 0.3 + t2 * 0.3
  } else {
    mix = 0.8
    mode = 1
    tint = 0.6
  }
  emit('ascii-progress', { mix, mode, tint })
}

/**
 * Ronda 2 (2026-07-29) — faltaba la fila "Cierre" de la tabla §4.4: el
 * streaming (emitAsciiProgress de arriba) solo llega hasta mix=0.8/mode=1, y
 * nada volvía a emitir progreso durante el decode binario, así que el
 * takeover NUNCA alcanzaba mix=1.0 ni volvía a mode=2 (rampa) para el
 * "reposo final" — verificado visualmente en Chrome headed: el efecto ASCII
 * quedaba parado a medio camino, nunca "respirando" en texto al final como
 * describe la spec. `t` = progreso del decode binario (0..1).
 */
function emitClosingProgress(t) {
  emit('ascii-progress', { mix: 0.8 + t * 0.2, mode: 1 + t, tint: 0.6 + t * 0.25 })
}

async function typeString(str, setter, charDelayMs, v) {
  setter('')
  if (prefersReduced.value) {
    setter(str)
    return
  }
  for (let i = 0; i < str.length; i++) {
    if (!alive(v)) return
    setter(str.slice(0, i + 1))
    const jitter = (Math.random() - 0.5) * 30
    await delay(charDelayMs + jitter)
  }
}

async function runTimeline(v) {
  // ── BOOT (spec §5.2 paso 2) — 4 líneas, delays 0/1.2/2.0/2.5s citando
  // EXACTO el formato del banner ch0 (TerminalScroll.vue bannerLines). ──────
  phase.value = 'boot'
  const delays = prefersReduced.value ? [0, 0, 0, 0] : [0, 1.2, 2.0, 2.5]
  for (let i = 0; i < 4; i++) {
    if (!alive(v)) return
    await delay(delays[i] * 1000 - (i > 0 ? delays[i - 1] * 1000 : 0))
    if (!alive(v)) return
    bootVisible.value[i] = true
  }
  if (!alive(v)) return
  await delay(prefersReduced.value ? 50 : 400)

  // ── PROMPT humano auto-tipeado (spec §5.2 paso 3) — 70ms/char ────────────
  if (!alive(v)) return
  phase.value = 'prompt'
  await typeString(t('chapters.6.convo.prompt'), (s) => (typedPrompt.value = s), 70, v)
  if (!alive(v)) return

  // ── THINKING (spec §5.2 paso 4) — latencia visible ~900ms ────────────────
  phase.value = 'thinking'
  await delay(prefersReduced.value ? 50 : 900)
  if (!alive(v)) return

  // ── STREAMING (spec §5.2 paso 5) — burst 2-4 tokens, 45ms/token, pausa
  // 180-350ms en puntuación. Bajo PRM: texto completo instantáneo. ────────
  phase.value = 'streaming'
  if (prefersReduced.value) {
    revealedWords.value = totalWords.value
    emitAsciiProgress(1)
  } else {
    const flatWords = bodyParagraphs.value
      .flat()
      .filter((tok) => /\S/.test(tok))
    let revealed = 0
    while (revealed < totalWords.value) {
      if (!alive(v)) return
      const burst = 2 + Math.floor(Math.random() * 3) // 2..4
      revealed = Math.min(totalWords.value, revealed + burst)
      revealedWords.value = revealed
      emit('token-tick')
      emitAsciiProgress(revealed / totalWords.value)
      const lastWord = flatWords[revealed - 1] || ''
      const isPunct = /[.,;:!?]$/.test(lastWord)
      await delay(isPunct ? 180 + Math.random() * 170 : 45 * burst)
    }
  }
  if (!alive(v)) return

  // ── DECODING (spec §5.3) — el binario colapsa en la frase de cierre,
  // 24ms por grupo de 8 bits, izquierda a derecha. ─────────────────────────
  phase.value = 'decoding'
  if (prefersReduced.value) {
    decodedBitGroups.value = totalBitGroups.value
  } else {
    for (let g = 0; g < totalBitGroups.value; g++) {
      if (!alive(v)) return
      decodedBitGroups.value = g + 1
      // Fila "Cierre" de la spec §4.4 (antes sin cablear — emitClosingProgress
      // existía pero nunca se llamaba): el takeover sigue avanzando durante el
      // decode, mix 0.8→1.0 y mode 1→2, en vez de quedar congelado en 0.8.
      emitClosingProgress(decodedBitGroups.value / totalBitGroups.value)
      await delay(24)
    }
  }
  if (!alive(v)) return
  // "Reposo final" (spec §4.4): mix=1.0, mode=2, tint=0.85 — t=1 cierra la
  // rampa aunque prefersReduced haya saltado el loop de arriba.
  emitClosingProgress(1)

  // ── DONE (spec §5.2 paso 8) — cursor final + mantra. ─────────────────────
  await delay(prefersReduced.value ? 50 : 400)
  if (!alive(v)) return
  phase.value = 'done'
}

function skip() {
  if (phase.value !== 'streaming' && phase.value !== 'decoding') return
  revealedWords.value = totalWords.value
  decodedBitGroups.value = totalBitGroups.value
  // Skip salta directo al "reposo final" (spec §4.4), no al punto intermedio
  // 0.8/mode=1 — mismo estado que runTimeline alcanza al completar el decode.
  emitClosingProgress(1)
}

function startCycle() {
  const v = ++cycleVersion
  bootVisible.value = [false, false, false, false]
  typedPrompt.value = ''
  revealedWords.value = 0
  decodedBitGroups.value = 0
  phase.value = 'idle'
  runTimeline(v)
}

function stopCycle() {
  cycleVersion++
  clearAllTimers()
}

watch(
  activeChapter,
  (v) => {
    if (v === 6) {
      startCycle()
    } else {
      stopCycle()
    }
  },
  { immediate: true },
)

// version counter i18n toggle (patrón TerminalScroll cycleVersion): cambiar de
// locale a mitad de streaming no debe duplicar timers ni romper el conteo de
// palabras (spec §5.2 criterio 5) — reinicia la timeline con el texto nuevo.
watch(locale, () => {
  if (activeChapter.value === 6) startCycle()
})

onBeforeUnmount(() => {
  cycleVersion++
  clearAllTimers()
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cycleVersion++
    clearAllTimers()
  })
}
</script>

<template>
  <!-- `<aside>`, no `<section>`: el invariante del proyecto es exactamente 7
       `<section data-chapter="N">` de nivel de capítulo (ver
       tests/components/ScrollShell.theme-isolation.test.js). Este panel es un
       widget complementario dentro de ch6, no un capítulo nuevo. -->
  <aside
    class="ch6-convo"
    :aria-label="t('chapters.6.convo.aria')"
    @pointerdown="skip"
  >
    <pre class="ch6-convo-output"><span
        v-for="(line, i) in bootLines"
        :key="'boot-' + i"
        class="ch6-boot-line"
        :class="{ 'ch6-boot-line--visible': bootVisible[i] }"
      >{{ t(line.key) }}</span><span
        v-if="phase !== 'idle' && phase !== 'boot'"
        class="ch6-prompt-human"
      >&gt; {{ typedPrompt }}</span><span
        v-if="phase === 'thinking'"
        class="ch6-thinking"
      > {{ t('chapters.6.convo.thinking') }} ▍▍▍</span></pre>

    <p v-for="(para, pi) in bodyParagraphs" :key="'p-' + pi" class="ch6-convo-p">
      <span
        v-for="(tok, ti) in para"
        :key="ti"
        class="ch6-convo-word"
        :style="{ opacity: isWordRevealed(pi, ti) ? 1 : 0.001 }"
        >{{ tok }}</span
      >
    </p>

    <div
      v-if="phase === 'decoding' || phase === 'done'"
      class="ch6-bits"
      :class="{ 'ch6-bits--settled': phase === 'done' }"
      aria-hidden="true"
    >{{ bitsDisplay }}</div>

    <p class="ch6-closing">
      <span
        v-for="(w, i) in closingParts"
        :key="'c-' + i"
        class="ch6-closing-word"
        :class="'ch6-author-' + w.author"
        :style="{ opacity: phase === 'done' || decodedBitGroups >= closingEndOffsets[i] ? 1 : 0.001 }"
        >{{ w.text }}</span
      >
    </p>

    <p class="ch6-credit">{{ t('chapters.6.convo.credit') }}</p>

    <p class="ch6-prompt-final">&gt; <span class="ch6-cursor" aria-hidden="true">█</span></p>

    <p class="ch6-mantra">{{ t('chapters.6.mantra') }}</p>
  </aside>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * Panel de conversación — spec §5.4. Desktop: derecha, min(46ch,42vw), scroll
 * interno con fade (Lección técnica §7: la spec de diseño gana sobre "sin
 * scroll interno" cuando lo diseña a propósito con overflow contenido).
 * ───────────────────────────────────────────────────────────────────────── */
.ch6-convo {
  position: absolute;
  z-index: 40;
  right: 4vw;
  bottom: 10vh;
  width: min(46ch, 42vw);
  max-height: 72vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--sp-md, 16px);
  border-radius: 8px;
  border: 1px solid rgba(77, 255, 255, 0.35);
  background: rgba(4, 2, 14, 0.94);
  color: #eafcff;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: clamp(0.85rem, 1.4vw, 1.0625rem);
  line-height: 1.5;
}

@supports (backdrop-filter: blur(6px)) or (-webkit-backdrop-filter: blur(6px)) {
  .ch6-convo {
    background: rgba(4, 2, 14, 0.86);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
}

.ch6-convo-output {
  margin: 0 0 var(--sp-sm, 8px) 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'VT323', ui-monospace, monospace;
  font-size: 1.15em;
}

.ch6-boot-line {
  display: block;
  opacity: 0;
  transition: opacity 200ms ease-out;
}
.ch6-boot-line--visible {
  opacity: 1;
}

.ch6-prompt-human {
  display: block;
  color: #ffd95c;
}

.ch6-thinking {
  display: block;
  opacity: 0.7;
  font-style: italic;
}

.ch6-convo-p {
  margin: 0 0 var(--sp-sm, 8px) 0;
  color: #4dffff;
}

.ch6-convo-word {
  transition: opacity 120ms ease-out;
}

.ch6-bits {
  margin: 0 0 var(--sp-xs, 4px) 0;
  font-family: 'VT323', ui-monospace, monospace;
  font-size: 0.85em;
  letter-spacing: 0.03em;
  color: #4dffff;
  opacity: 0.55;
  word-break: break-all;
}
.ch6-bits--settled {
  opacity: 0.18;
}

.ch6-closing-word {
  transition: opacity 90ms linear;
}
.ch6-author-human {
  color: #ffd95c;
}
.ch6-author-ai {
  color: #4dffff;
}

.ch6-credit {
  margin: var(--sp-sm, 8px) 0 0 0;
  opacity: 0.85;
  font-size: 0.85em;
  font-style: italic;
}

.ch6-prompt-final {
  margin: var(--sp-xs, 4px) 0 0 0;
  font-family: 'VT323', ui-monospace, monospace;
}

/*
 * .ch6-cursor — cita deliberada de .terminal-cursor (TerminalScroll.vue, ch0
 * 1995): MISMO glifo '█', MISMA duración/timing-function/iteración de blink
 * (steps(2) 1s infinite). El círculo del sitio se cierra con el mismo cursor
 * con el que empezó. Verificado por Ch6Terminal.cursor-citation.test.js.
 */
.ch6-cursor {
  display: inline-block;
  animation: ch6-cursor-blink 1s steps(2) infinite;
}
@keyframes ch6-cursor-blink {
  50% { opacity: 0; }
}

/*
 * .ch6-mantra — spec §5.4: "el v-if se elimina; la animación de fade pasa a
 * CSS pura disparada por clase". Ya NO depende de arrivalDone/JS: la clase
 * está presente desde el mount y el fade es un keyframe CSS que corre una
 * vez al cargar la página (`both` conserva el estado final). PRM abajo.
 */
.ch6-mantra {
  margin: var(--sp-sm, 8px) 0 0 0;
  color: #ffd95c;
  text-shadow: 0 0 10px rgba(255, 217, 92, 0.5);
  animation: ch6-mantra-fade-in 500ms ease-out both;
}
@keyframes ch6-mantra-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/*
 * TASK-012 ronda 2 (2026-07-29) — corrección real de geometría, no cosmética.
 * La spec §5.4 pedía bottom-sheet full-bleed (right:0;left:0;bottom:0) en
 * portrait y full-height en landscape. Medido con el arnés (Chrome headed,
 * 390x844 y 844x390): ese full-bleed hace que el bounding box de `.ch6-convo`
 * INTERSECTE geométricamente con StickyTimeline (fixed left), ContactHUD
 * (fixed bottom-right/top-right en landscape) y LangToggle (fixed top-right)
 * — los tres fuera de la lista blanca de este ticket, así que la única
 * corrección posible desde este archivo es que EL PANEL deje espacio.
 * Lección técnica §7 ("la estética la manda la spec; el límite es la
 * navegación"): cuando hay conflicto, el límite geométrico gana, aunque
 * cambie el diseño full-bleed pedido. Insets calculados a partir de los
 * offsets fijos (--sp-xs/--sp-sm/--sp-md, en px, no vw) que usan esos tres
 * componentes — por ser px fijos, generalizan a cualquier ancho de viewport
 * móvil, no solo a los medidos.
 */
@media (max-width: 767px) and (orientation: portrait) {
  .ch6-convo {
    /* Despeja StickyTimeline (fixed left, ~64px de contenido + sp-xs). */
    left: 84px;
    /* Despeja ContactHUD (fixed right, icon 44px + sp-sm + borde). */
    right: 64px;
    /* Despeja GlobalMantra (fixed bottom, pill ~28px + sp-sm + safe-area). */
    bottom: calc(env(safe-area-inset-bottom, 0px) + 44px);
    width: auto;
    max-height: 52dvh;
    border-radius: 12px;
  }
}

@media (max-width: 900px) and (orientation: landscape) and (max-height: 480px) {
  .ch6-convo {
    width: 52vw;
    /* Despeja LangToggle (fixed top-right) — en landscape corto el panel
       queda muy cerca del borde superior si crece hasta max-height. */
    top: 68px;
    /* Despeja GlobalMantra (fixed bottom-center, pill ~30px) y ContactHUD
       (fixed bottom-right) — ambos comparten la franja inferior en un
       landscape tan corto. Medido: mantra llega hasta ~46px del borde. */
    bottom: 50px;
    max-height: none;
    /* Despeja ambos por el eje horizontal también: en 844x390 el panel a
       52vw llega a ~9.6vw del borde derecho, dentro de la franja de
       LangToggle/ContactHUD (~12vw). */
    right: 96px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ch6-boot-line {
    transition: none;
  }
  .ch6-convo-word,
  .ch6-closing-word {
    transition: none;
  }
  .ch6-cursor {
    animation: none;
    opacity: 1;
  }
  .ch6-mantra {
    animation: none;
  }
}
</style>
