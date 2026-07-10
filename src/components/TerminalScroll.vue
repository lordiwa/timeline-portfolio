<!--
  TerminalScroll.vue — Era-signature component ch0 (Terminal 1995).

  Phase 6 refresh 2026-05-14: DOS demo reel auto-rotativo.
  2026-07-10: viñeta "El Experimento" — fork bomb infantil de Rafael, memoria real.

  Comportamiento:
  - BANNER inicial (one-time): muestra "Microsoft(R) MS-DOS(R) Version 6.22" + copyright + prompt
    con keyframes CSS reveal staggered (legacy, 4 .terminal-line spans).
  - Tras el banner: cycle auto-rotativo IDLE → TYPING_CD → PROMPT_CWD → TYPING_EXEC →
    LOADING (blackout) → PROGRAM (pixel art overlay) → EXIT (blackout) → CLS → next random program.
  - Tras 2 programas: viñeta "El Experimento" (1× por visita a ch0) — script data-driven
    [{text, cls}] con fases: SETUP → LOOP_BAT → FLOOD → CRASH → REBOOT → CLEANUP.
    Implementada como runner async independiente (runExperiment) invocado desde runCycle.
  - 3 programas iniciales (California Games II, Warcraft Orcs & Humans, Windows 95), elegidos
    al azar sin repeat consecutivo. Pixel art en /assets/ch0-{game,os}-*.png.
  - Lifecycle: cycle activo solo cuando ch0 es activeChapter (pattern Chapter6Content).
    Pause cuando scrollea fuera; reset al banner cuando vuelve.
  - PRM: bajo prefers-reduced-motion el typing salta a texto completo (sin char-by-char),
    delays acortados a ~50ms cada uno, image display 2s en lugar de 6s.
    La viñeta completa se abrevia a ~4s (flood 4 líneas, sin crash flicker).

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
// bootImg es OPCIONAL: si está presente, se muestra una pantalla intermedia entre LOADING
// (blackout) y PROGRAM (final). Útil para Windows 95 que tiene splash boot antes del desktop.
const programs = [
  { slug: 'california', dir: '\\GAMES\\CALGAMES',  exe: 'CALGAMES.EXE', img: '/assets/ch0-game-california.png' },
  { slug: 'warcraft',   dir: '\\GAMES\\WARCRAFT',  exe: 'WAR.EXE',      img: '/assets/ch0-game-warcraft.png' },
  {
    slug: 'win95',
    dir: '\\WINDOWS',
    exe: 'WIN',
    img: '/assets/ch0-os-win95.png',
    bootImg: '/assets/ch0-os-win95-loading.png',
  },
  { slug: 'tim',      dir: '\\GAMES\\TIM',      exe: 'TIM.EXE',    img: '/assets/ch0-game-tim.png' },
  { slug: 'myst',     dir: '\\GAMES\\MYST',     exe: 'MYST.EXE',   img: '/assets/ch0-game-myst.png' },
  { slug: 'stunts',   dir: '\\GAMES\\STUNTS',   exe: 'STUNTS.EXE', img: '/assets/ch0-game-stunts.png' },
  { slug: 'outworld', dir: '\\GAMES\\OUTWORLD', exe: 'OUT.EXE',    img: '/assets/ch0-game-outworld.png' },
  { slug: 'doom',     dir: '\\GAMES\\DOOM',     exe: 'DOOM.EXE',   img: '/assets/ch0-game-doom.png' },
  { slug: 'prince',   dir: '\\GAMES\\POP',      exe: 'PRINCE.EXE', img: '/assets/ch0-game-prince.png' },
]

// State machine.
// BANNER → IDLE → TYPING_CD → PROMPT_CWD → TYPING_EXEC → LOADING → [BOOT →] PROGRAM → EXIT → CLS → IDLE…
// Viñeta: IDLE…(2 programs)… → EXPERIMENT → CRASH_BLACKOUT → EXPERIMENT(reboot/cleanup) → CLS → IDLE…
const state = ref('BANNER')
const currentProgramIdx = ref(0)
const typedCd = ref('')
const typedExec = ref('')

// "El Experimento" — viñeta data-driven (memoria real Rafael, 1995).
// Script runner pushes lines to experimentLines; template renders them while state=EXPERIMENT.
const experimentLines = ref([])   // [{text: string, cls?: string}]
const isCrashFlicker = ref(false) // intensified crash flicker toggle (false under PRM)
let experimentDone = false        // session flag — resets in stopCycle() (once per ch0 visit)

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

// ─────────────────────────────────────────────────────────────────────────────
// El Experimento — viñeta scriptada, memoria real Rafael (1995).
// Guión auténtico DOS 6.22. Disparada 1× por visita a ch0, después de 2 programas.
//
// Diseño: script data-driven [{text, cls}] empujado por un runner async.
// Los dos últimos estados de la máquina de estados que se añaden son:
//   EXPERIMENT    — muestra experimentLines (phases 1-3, reboot, cleanup)
//   CRASH_BLACKOUT — blackout tras el crash de garbage ASCII
//
// PRM: sin flicker, flood a 4 líneas, delays mínimos (~4s total).
// ─────────────────────────────────────────────────────────────────────────────
async function runExperiment(myVersion) {
  if (myVersion !== cycleVersion || activeChapter.value !== 0) return

  experimentDone = true
  state.value = 'EXPERIMENT'
  experimentLines.value = []
  isCrashFlicker.value = false

  const prm = prefersReduced.value

  function alive() {
    return myVersion === cycleVersion && activeChapter.value === 0
  }

  // Pushes a single line and waits. Keeps last 22 lines (DOS scroll simulation).
  async function pushLine(text, cls = '') {
    if (!alive()) return
    experimentLines.value.push({ text, cls })
    if (experimentLines.value.length > 22) {
      experimentLines.value = experimentLines.value.slice(-22)
    }
    await delay(prm ? 80 : 300)
  }

  // ── PHASE 1: Crear archivo de 1 byte ──────────────────────────────────────
  await pushLine('C:\\> COPY CON A.DAT')
  if (!alive()) return
  await pushLine('1', 'terminal-exp-dim')
  if (!alive()) return
  await pushLine('^Z', 'terminal-exp-dim')
  if (!alive()) return
  await delay(prm ? 30 : 120)
  if (!alive()) return
  experimentLines.value.push({ text: '        1 file(s) copied', cls: '' })
  await delay(prm ? 80 : 300)
  if (!alive()) return

  // ── PHASE 2: Carpetas y copias ────────────────────────────────────────────
  const setupLines = [
    ['C:\\> MD LAB1', ''],
    ['C:\\> MD LAB2', ''],
    ['C:\\> COPY A.DAT LAB1', ''],
    ['        1 file(s) copied', ''],
    ['C:\\> COPY A.DAT LAB2', ''],
    ['        1 file(s) copied', ''],
    ['C:\\> COPY LAB1\\A.DAT LAB1\\B.DAT', ''],
    ['        1 file(s) copied', ''],
  ]
  for (const [text, cls] of setupLines) {
    await pushLine(text, cls)
    if (!alive()) return
  }

  // ── PHASE 3: CLONE.BAT — el loop fatal ───────────────────────────────────
  const batLines = [
    ['C:\\> COPY CON CLONE.BAT', ''],
    [':LOOP', 'terminal-exp-dim'],
    ['COPY LAB1\\*.DAT LAB2', 'terminal-exp-dim'],
    ['COPY LAB2\\*.DAT LAB1', 'terminal-exp-dim'],
    ['GOTO LOOP', 'terminal-exp-dim'],
    ['^Z', 'terminal-exp-dim'],
  ]
  for (const [text, cls] of batLines) {
    await pushLine(text, cls)
    if (!alive()) return
  }
  await delay(prm ? 30 : 120)
  if (!alive()) return
  experimentLines.value.push({ text: '        1 file(s) copied', cls: '' })
  await delay(prm ? 80 : 300)
  if (!alive()) return
  experimentLines.value.push({ text: 'C:\\> CLONE', cls: '' })
  await delay(prm ? 80 : 300)
  if (!alive()) return

  // ── PHASE 4: FLOOD — copias acelerando (delay decreciente) ───────────────
  const floodCount = prm ? 4 : 16
  for (let i = 0; i < floodCount; i++) {
    if (!alive()) return
    experimentLines.value.push({ text: '        1 file(s) copied', cls: 'terminal-exp-flood' })
    if (experimentLines.value.length > 22) {
      experimentLines.value = experimentLines.value.slice(-22)
    }
    // Accelerating: 280ms → ~15ms over 16 steps (last few nearly instant)
    const d = prm ? 55 : Math.max(15, 280 - i * 17)
    await delay(d)
  }
  if (!alive()) return

  // ── PHASE 5: CRASH — garbage ASCII CP437 + flicker ───────────────────────
  // Flicker intensificado solo fuera de PRM (clase CSS en el wrapper).
  if (!prm) isCrashFlicker.value = true
  experimentLines.value.push({ text: '▒▓█╬÷░╠╣║╗╝╚╔═╦╧╤╪┼', cls: 'terminal-exp-crash' })
  await delay(prm ? 50 : 130)
  if (!alive()) return
  experimentLines.value.push({ text: '╬▓▒░█║╠═╣╝╚╔╗╤╪╦┼÷  ', cls: 'terminal-exp-crash' })
  await delay(prm ? 50 : 85)
  if (!alive()) return
  experimentLines.value.push({ text: '█░▒▓╬═║╠╣╝╚╔╗╪┼÷╦╧  ', cls: 'terminal-exp-crash' })
  await delay(prm ? 50 : 170)
  if (!alive()) return
  isCrashFlicker.value = false

  // Freeze → blackout
  state.value = 'CRASH_BLACKOUT'
  await delay(prm ? 300 : 1100)
  if (!alive()) return

  // ── PHASE 6: REBOOT ───────────────────────────────────────────────────────
  state.value = 'EXPERIMENT'
  experimentLines.value = []

  const rebootSeq = [
    ['Starting MS-DOS...', 'terminal-exp-reboot'],
    ['HIMEM is testing extended memory... done.', 'terminal-exp-reboot'],
    ['MS-DOS is now running in High Memory Area.', 'terminal-exp-reboot'],
    ['C:\\>', ''],
  ]
  for (const [text, cls] of rebootSeq) {
    if (!alive()) return
    experimentLines.value.push({ text, cls })
    await delay(prm ? 60 : 230)
  }
  if (!alive()) return
  await delay(prm ? 150 : 700)
  if (!alive()) return

  // ── PHASE 7: CLEANUP — la lección ────────────────────────────────────────
  const cleanupSeq = [
    ['C:\\> DEL LAB1\\*.*', ''],
    ['All files in directory will be deleted!', 'terminal-exp-warning'],
    ['Are you sure (Y/N)?Y', ''],
    ['C:\\> DEL LAB2\\*.*', ''],
    ['All files in directory will be deleted!', 'terminal-exp-warning'],
    ['Are you sure (Y/N)?Y', ''],
    ['C:\\> DELTREE /Y LAB1', ''],
    ['Deleting lab1...', 'terminal-exp-dim'],
    ['C:\\> DELTREE /Y LAB2', ''],
    ['Deleting lab2...', 'terminal-exp-dim'],
    ['C:\\> DEL CLONE.BAT', ''],
  ]
  for (const [text, cls] of cleanupSeq) {
    if (!alive()) return
    experimentLines.value.push({ text, cls })
    if (experimentLines.value.length > 22) {
      experimentLines.value = experimentLines.value.slice(-22)
    }
    await delay(prm ? 80 : 280)
  }
  if (!alive()) return
  await delay(prm ? 250 : 900)
  if (!alive()) return

  // Volver al reel
  state.value = 'CLS'
  experimentLines.value = []
  isCrashFlicker.value = false
}

async function runCycle() {
  const myVersion = ++cycleVersion
  let localProgramCount = 0

  // Esperar reveal staggered del banner antes de arrancar el primer ciclo.
  await delay(prefersReduced.value ? 100 : 3500)
  if (myVersion !== cycleVersion || activeChapter.value !== 0) return

  while (myVersion === cycleVersion && activeChapter.value === 0) {
    // Viñeta trigger: después de 2 programas, 1× por visita a ch0.
    if (localProgramCount >= 2 && !experimentDone) {
      await runExperiment(myVersion)
      if (myVersion !== cycleVersion || activeChapter.value !== 0) break
    }

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

    // BOOT (opcional) — splash/loading screen antes del programa final.
    // Solo si el programa declaró bootImg (e.g. Windows 95 splash boot antes del desktop).
    if (program.bootImg) {
      state.value = 'BOOT'
      await delay(prefersReduced.value ? 800 : 2500)
      if (myVersion !== cycleVersion || activeChapter.value !== 0) break
    }

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

    localProgramCount++
  }
}

function stopCycle() {
  cycleVersion++ // invalida cualquier cycle en curso
  clearAllTimers()
  state.value = 'BANNER'
  typedCd.value = ''
  typedExec.value = ''
  lastProgramIdx = -1
  experimentDone = false   // reset para la siguiente visita a ch0
  experimentLines.value = []
  isCrashFlicker.value = false
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
const showExperiment = computed(() => state.value === 'EXPERIMENT')
const showCdLine = computed(() =>
  ['TYPING_CD', 'PROMPT_CWD', 'TYPING_EXEC', 'LOADING', 'BOOT', 'PROGRAM', 'EXIT'].includes(state.value),
)
const showCwdLine = computed(() =>
  ['PROMPT_CWD', 'TYPING_EXEC', 'LOADING', 'BOOT', 'PROGRAM', 'EXIT'].includes(state.value),
)
// Blackout durante LOADING/EXIT (reel normal) y CRASH_BLACKOUT (viñeta).
const showBlackout = computed(
  () => state.value === 'LOADING' || state.value === 'EXIT' || state.value === 'CRASH_BLACKOUT',
)
const showBootImage = computed(() => state.value === 'BOOT')
const showProgramImage = computed(() => state.value === 'PROGRAM')
// Cursor solo cuando no hay blackout, no hay img de programa, y no estamos en la viñeta.
const showCursor = computed(() => !showBlackout.value && !showProgramImage.value && !showExperiment.value)
</script>

<template>
  <div
    :class="['terminal-scroll', { 'terminal-scroll--crash': isCrashFlicker }]"
    role="presentation"
  >
    <pre class="terminal-output"
      ><span
        v-for="(line, idx) in bannerLines"
        v-show="showBanner"
        :key="idx"
        class="terminal-line"
        :style="{ animationDelay: line.delay + 's' }"
      >{{ t(line.key) }}</span><span
        v-if="showExperiment"
        class="terminal-exp-block"
      ><span
          v-for="(line, i) in experimentLines"
          :key="'exp-' + i"
          :class="['terminal-typed', 'terminal-exp-line', line.cls || '']"
        >{{ line.text }}</span></span><span
        v-show="!showBanner && !showExperiment && showCdLine"
        class="terminal-typed"
      >C:\&gt; {{ typedCd }}</span><span
        v-show="!showBanner && !showExperiment && showCwdLine"
        class="terminal-typed"
      >
C:{{ currentProgram.dir }}&gt; {{ typedExec }}</span><span
        v-show="showCursor"
        class="terminal-cursor"
        aria-hidden="true"
      >█</span></pre>

    <div v-if="showBlackout" class="terminal-blackout" aria-hidden="true" />

    <img
      v-if="showBootImage && currentProgram.bootImg"
      class="terminal-program-img"
      :src="currentProgram.bootImg"
      :alt="t('chapters.0.terminal.programs.' + currentProgram.slug + '.bootAlt')"
    />

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
  /* ── Bisel CRT: border-radius generoso + borde oscuro tipo carcasa ── */
  border-radius: 16px;
  border: 4px solid #1a1a1a;
  outline: 1px solid #0a0a0a;
  min-height: 220px;
  overflow: hidden;
  /* ── Inner box-shadow: ilusión de pantalla curva + bisel interior ── */
  box-shadow:
    inset 0 0 32px rgba(0, 0, 0, 0.7),
    inset 0 2px 8px rgba(255, 255, 255, 0.04),
    0 4px 18px rgba(0, 0, 0, 0.6);
}

/* ── Reflejo diagonal muy sutil arriba-izquierda (pantalla curva CRT) ── */
/* Estático — no necesita PRM. */
.terminal-scroll::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.035) 0%,
    rgba(255, 255, 255, 0.012) 28%,
    transparent 50%
  );
  border-radius: inherit;
  pointer-events: none;
  z-index: 3;
}

/* ── Flicker de fósforo — opacity imperceptible pero vivo (~8s) ── */
/* Apagado bajo prefers-reduced-motion. Solo afecta al wrapper del terminal,
   no al texto (evita reflows). */
.terminal-scroll::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 4;
  animation: phosphor-flicker 8s steps(1) infinite;
}

/* ── Crash flicker intensificado durante la viñeta (no PRM) ── */
.terminal-scroll--crash::after {
  animation: crash-flicker 0.12s steps(1) infinite;
}

@keyframes phosphor-flicker {
  0%   { opacity: 1; }
  6%   { opacity: 0.988; }
  7%   { opacity: 1; }
  34%  { opacity: 1; }
  34.5%{ opacity: 0.985; }
  35%  { opacity: 1; }
  61%  { opacity: 1; }
  61.4%{ opacity: 0.991; }
  61.8%{ opacity: 1; }
  88%  { opacity: 1; }
  88.3%{ opacity: 0.987; }
  88.7%{ opacity: 1; }
  100% { opacity: 1; }
}

@keyframes crash-flicker {
  0%  { opacity: 1; }
  33% { opacity: 0.35; }
  66% { opacity: 0.82; }
  100%{ opacity: 1; }
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

/* Cursor CRT cuadrado — blink steps(2) clásico DOS + glow de fósforo */
.terminal-cursor {
  display: inline-block;
  animation: terminal-cursor-blink 1s steps(2) infinite;
  text-shadow: 0 0 8px color-mix(in srgb, var(--c-fg) 70%, transparent);
}

/* Blackout layer durante LOADING/EXIT/CRASH_BLACKOUT — black instant (era DOS, no fade) */
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
 * "El Experimento" — viñeta styles
 * ───────────────────────────────────────────────────────────────────────── */

/* Wrapper transparente del bloque de experimentLines (display: contents) */
.terminal-exp-block {
  display: contents;
}

/* Contenido del BAT (líneas internas, ^Z) — gris para evocar stdin */
.terminal-exp-dim {
  color: var(--c-accent); /* #aaaaaa VGA light gray */
}

/* Líneas del flood — blanco puro, sin diferencia visual (son mensajes normales DOS) */
.terminal-exp-flood {
  color: var(--c-fg);
}

/* Garbage ASCII del crash — tinte rojo para señalizar corrupción */
.terminal-exp-crash {
  color: #ff5555;
}

/* Líneas de reboot — ámbar tipo BIOS, diferencia del prompt normal */
.terminal-exp-reboot {
  color: #cccc44;
}

/* "All files in directory will be deleted!" — advertencia DOS, amarillo */
.terminal-exp-warning {
  color: #ffff55;
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
 * El flicker de fósforo (::after) también se apaga aquí.
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
  .terminal-scroll::after {
    animation: none;
  }
  .terminal-scroll--crash::after {
    animation: none;
  }
}
</style>
