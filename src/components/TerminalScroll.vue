<!--
  TerminalScroll.vue — Era-signature component ch0 (Terminal 1995).

  Phase 6 refresh 2026-05-14: DOS demo reel auto-rotativo.

  Comportamiento:
  - BANNER inicial (one-time): muestra "Microsoft(R) MS-DOS(R) Version 6.22" + copyright + prompt
    con keyframes CSS reveal staggered (legacy, 4 .terminal-line spans).
  - Tras el banner: cycle auto-rotativo IDLE → TYPING_CD → PROMPT_CWD → TYPING_EXEC →
    LOADING (blackout) → PROGRAM (pixel art overlay) → EXIT (blackout) → CLS → next random program.
  - 3 programas iniciales (California Games II, Warcraft Orcs & Humans, Windows 95), elegidos
    al azar sin repeat consecutivo. Pixel art en /assets/ch0-{game,os}-*.png.
  - Lifecycle: cycle activo solo cuando ch0 es activeChapter (pattern Chapter6Content).
    Pause cuando scrollea fuera; reset al banner cuando vuelve.
  - PRM: bajo prefers-reduced-motion el typing salta a texto completo (sin char-by-char),
    delays acortados a ~50ms cada uno, image display 2s en lugar de 6s.

  ART-07 reinterpretación: el guard original prohibía pixel art *ambiental* (background ch0).
  Las imágenes ch0-game-* / ch0-os-* son *contenido narrativo dinámico de program-launch*,
  no decoración del chapter. T6 ART-07 (regex /ch0-bg/ y /parallax\//) sigue verde sin tocar.

  Tokens CSS heredados del [data-chapter="0"] cascade:
  - --c-fg: #ffffff (DOS bright white, VGA color 15)
  - --c-bg: #000000 (DOS black)
  - --c-accent: #aaaaaa (VGA light gray, color 7)
  - --font-body: 'VT323', ui-monospace, monospace (self-hosted Phase 2 W4)
-->
<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Banner inicial — 4 líneas i18n con keyframes reveal staggered (mantiene T1: 4 .terminal-line spans)
const bannerLines = [
  { key: 'chapters.0.terminal.line1', delay: 0 },
  { key: 'chapters.0.terminal.line2', delay: 1.2 },
  { key: 'chapters.0.terminal.line3', delay: 2.0 },
  { key: 'chapters.0.terminal.line4', delay: 2.5 },
]

// Inject scrollState (activeChapter) + prm (prefersReduced) desde App.vue.
// Fallback per-prop: algunos tests proveen scrollState con shape parcial (e.g. solo
// scrollProgress sin activeChapter), así que inject con default-object no protege
// contra ese caso. Usar `?? ref(default)` per-prop garantiza fallback aunque el
// provider exista pero le falte la prop específica.
const injectedScrollState = inject('scrollState', null)
const injectedPrm = inject('prm', null)
const activeChapter = injectedScrollState?.activeChapter ?? ref(0)
const prefersReduced = injectedPrm?.prefersReduced ?? ref(false)

// Lista de programas — sincronizada con assets ch0-game-{slug}.png y ch0-os-{slug}.png.
// Cada slug debe matchear el regex extendido en tests/assets/asset-naming.test.js.
const programs = [
  { slug: 'california', dir: '\\GAMES\\CALGAMES',  exe: 'CALGAMES.EXE', img: '/assets/ch0-game-california.png' },
  { slug: 'warcraft',   dir: '\\GAMES\\WARCRAFT', exe: 'WAR.EXE',      img: '/assets/ch0-game-warcraft.png' },
  { slug: 'win95',      dir: '\\WINDOWS',          exe: 'WIN',          img: '/assets/ch0-os-win95.png' },
]

// State machine.
// BANNER → IDLE → TYPING_CD → PROMPT_CWD → TYPING_EXEC → LOADING → PROGRAM → EXIT → CLS → IDLE…
const state = ref('BANNER')
const currentProgramIdx = ref(0)
const typedCd = ref('')
const typedExec = ref('')

// Timers tracking — Set para cleanup atómico en pause/unmount/HMR.
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

// Random shuffle sin repeat consecutivo (Math.random mockeable para T9).
let lastProgramIdx = -1
function pickNextProgram() {
  if (programs.length <= 1) return 0
  let idx
  do {
    idx = Math.floor(Math.random() * programs.length)
  } while (idx === lastProgramIdx)
  lastProgramIdx = idx
  return idx
}

// Auto-typing char-por-char con jitter humano. Bajo PRM, salta al string completo instant.
async function typeString(str, setter, charDelayMs) {
  setter('')
  if (prefersReduced.value) {
    setter(str)
    return
  }
  for (let i = 0; i < str.length; i++) {
    setter(str.slice(0, i + 1))
    const jitter = (Math.random() - 0.5) * 60
    await delay(charDelayMs + jitter)
  }
}

// cycleVersion invalida cycles en curso al pausar (activeChapter change → ver watch abajo).
// Cada step verifica `myVersion === cycleVersion` antes de mutar state.
let cycleVersion = 0

async function runCycle() {
  const myVersion = ++cycleVersion

  // Esperar reveal staggered del banner antes de arrancar el primer ciclo.
  await delay(prefersReduced.value ? 100 : 3500)
  if (myVersion !== cycleVersion || activeChapter.value !== 0) return

  while (myVersion === cycleVersion && activeChapter.value === 0) {
    const idx = pickNextProgram()
    currentProgramIdx.value = idx
    const program = programs[idx]

    // IDLE — prompt limpio con cursor blink
    state.value = 'IDLE'
    typedCd.value = ''
    typedExec.value = ''
    await delay(prefersReduced.value ? 100 : 800)
    if (myVersion !== cycleVersion || activeChapter.value !== 0) break

    // TYPING_CD — auto-tipea "CD \GAMES\WARCRAFT"
    state.value = 'TYPING_CD'
    await typeString(`CD ${program.dir}`, (v) => (typedCd.value = v), 80)
    if (myVersion !== cycleVersion || activeChapter.value !== 0) break

    // PROMPT_CWD — muestra nuevo prompt "C:\GAMES\WARCRAFT>"
    state.value = 'PROMPT_CWD'
    await delay(prefersReduced.value ? 50 : 250)
    if (myVersion !== cycleVersion || activeChapter.value !== 0) break

    // TYPING_EXEC — auto-tipea "WAR.EXE"
    state.value = 'TYPING_EXEC'
    await typeString(program.exe, (v) => (typedExec.value = v), 80)
    if (myVersion !== cycleVersion || activeChapter.value !== 0) break

    // LOADING — blackout breve (DOS-auténtico, no fade)
    state.value = 'LOADING'
    await delay(prefersReduced.value ? 50 : 400)
    if (myVersion !== cycleVersion || activeChapter.value !== 0) break

    // PROGRAM — pixel art overlay ~6s (PRM 2s)
    state.value = 'PROGRAM'
    await delay(prefersReduced.value ? 2000 : 6000)
    if (myVersion !== cycleVersion || activeChapter.value !== 0) break

    // EXIT — blackout breve
    state.value = 'EXIT'
    await delay(prefersReduced.value ? 50 : 200)
    if (myVersion !== cycleVersion || activeChapter.value !== 0) break

    // CLS — reset al prompt vacío
    state.value = 'CLS'
    typedCd.value = ''
    typedExec.value = ''
    await delay(prefersReduced.value ? 50 : 300)
  }
}

function stopCycle() {
  cycleVersion++ // invalida cualquier cycle en curso
  clearAllTimers()
  state.value = 'BANNER'
  typedCd.value = ''
  typedExec.value = ''
  lastProgramIdx = -1
}

// Lifecycle: arranca al mount si ch0 ya está activo (deep-link ?ch=0).
onMounted(() => {
  if (activeChapter.value === 0) runCycle()
})

// Pausa cycle al salir de ch0, reanuda al volver (pattern Chapter6Content).
watch(activeChapter, (newCh) => {
  if (newCh === 0) {
    if (state.value === 'BANNER') runCycle()
  } else {
    stopCycle()
  }
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

// Computed flags para template.
const currentProgram = computed(() => programs[currentProgramIdx.value])
const showBanner = computed(() => state.value === 'BANNER')
const showCdLine = computed(() =>
  ['TYPING_CD', 'PROMPT_CWD', 'TYPING_EXEC', 'LOADING', 'PROGRAM', 'EXIT'].includes(state.value),
)
const showCwdLine = computed(() =>
  ['PROMPT_CWD', 'TYPING_EXEC', 'LOADING', 'PROGRAM', 'EXIT'].includes(state.value),
)
const showBlackout = computed(() => state.value === 'LOADING' || state.value === 'EXIT')
const showProgramImage = computed(() => state.value === 'PROGRAM')
</script>

<template>
  <div class="terminal-scroll" role="presentation">
    <pre class="terminal-output"
      ><span
        v-for="(line, idx) in bannerLines"
        v-show="showBanner"
        :key="idx"
        class="terminal-line"
        :style="{ animationDelay: line.delay + 's' }"
      >{{ t(line.key) }}</span><span
        v-show="!showBanner && showCdLine"
        class="terminal-typed"
      >C:\&gt; {{ typedCd }}</span><span
        v-show="!showBanner && showCwdLine"
        class="terminal-typed"
      >
C:{{ currentProgram.dir }}&gt; {{ typedExec }}</span><span
        v-show="!showBlackout && !showProgramImage"
        class="terminal-cursor"
        aria-hidden="true"
      >█</span></pre>

    <div v-if="showBlackout" class="terminal-blackout" aria-hidden="true" />

    <img
      v-if="showProgramImage"
      class="terminal-program-img"
      :src="currentProgram.img"
      :alt="t('chapters.0.terminal.programs.' + currentProgram.slug + '.alt')"
    />
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * TerminalScroll — DOS COMMAND.COM monochrome terminal, era ch0 (1995)
 * Tokens via cascade [data-chapter="0"]: --c-fg #ffffff (DOS white),
 * --c-bg #000000 (DOS black). Refresh Rafael 2026-05-14.
 * Font: 'VT323' ya self-hosted Phase 2 W4 (declarado en [data-chapter="0"])
 * ───────────────────────────────────────────────────────────────────────── */
.terminal-scroll {
  position: relative;
  font-family: 'VT323', ui-monospace, monospace;
  color: var(--c-fg);
  background: var(--c-bg);
  padding: var(--sp-lg);
  border: 1px solid var(--c-border);
  border-radius: 4px;
  min-height: 220px;
  overflow: hidden;
}

.terminal-output {
  font-size: clamp(1rem, 2vw, 1.4rem);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Banner staggered reveal — keyframe terminal-reveal (legacy ch0 banner).
   El animation-delay se aplica inline desde el script (4 líneas escalonadas). */
.terminal-line {
  display: block;
  opacity: 0;
  animation: terminal-reveal 0.4s steps(20, end) forwards;
}

/* Líneas tipeadas dinámicamente durante el cycle — sin keyframes (state-driven JS) */
.terminal-typed {
  display: block;
  opacity: 1;
}

/* Cursor CRT cuadrado — blink steps(2) clásico DOS */
.terminal-cursor {
  display: inline-block;
  animation: terminal-cursor-blink 1s steps(2) infinite;
}

/* Blackout layer durante LOADING/EXIT — black instant (era DOS, no fade) */
.terminal-blackout {
  position: absolute;
  inset: 0;
  background: #000000;
  z-index: 1;
}

/* Pixel art overlay durante PROGRAM — fullscreen del terminal wrapper */
.terminal-program-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  background: #000000;
  z-index: 2;
}

/* ─────────────────────────────────────────────────────────────────────────
 * @keyframes terminal-reveal — staggered fade-in del banner
 * ───────────────────────────────────────────────────────────────────────── */
@keyframes terminal-reveal {
  to { opacity: 1; }
}

/* ─────────────────────────────────────────────────────────────────────────
 * @keyframes terminal-cursor-blink — parpadeo tipo CRT con steps(2)
 * ───────────────────────────────────────────────────────────────────────── */
@keyframes terminal-cursor-blink {
  50% { opacity: 0; }
}

/* ─────────────────────────────────────────────────────────────────────────
 * D4-10a PRM branch — sin parpadeo, banner reveal instantáneo.
 * El typing dinámico también respeta PRM via prefersReduced.value en script.
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .terminal-line {
    opacity: 1;
    animation: none;
  }
  .terminal-cursor {
    animation: none;
    opacity: 1;
  }
}
</style>
