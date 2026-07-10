<!--
  BootScreen.vue — Pantalla de arranque BIOS/DOS hiper-realista (Task #23).
  Primera puerta de entrada al portfolio. Unlock diegético del AudioContext.

  Secuencia (~6s, skippable con ESC/tecla/click en SKIP):
    Fase 'post'   (~3.5s): líneas BIOS apareciendo, memory count-up
    Fase 'choice' (∞):     menú DOS — S=Con sonido, M=Silenciado
    Fase 'boot'   (~1.5s): MS-DOS → RAFAEL.EXE → wipe CRT → reveal

  Visitantes recurrentes (localStorage rm-boot-seen):
    Versión corta — "PRESS ANY KEY" con preferencia recordada mostrada.
    ?boot=full fuerza la versión larga.

  Entorno test: se omite cuando import.meta.env.MODE === 'test'.
    Esto permite que los tests que montan App.vue funcionen sin un BootScreen
    bloqueante que requiere interacción.

  A11y: role="dialog" aria-modal, foco atrapado, todo texto HTML real.
  PRM: sin count-up ni parpadeos — texto estático ya impreso, fade en lugar de wipe.
-->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, inject, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { engine } from '@/audio/engine'
import { beep } from '@/audio/sfx'

// ── Props ─────────────────────────────────────────────────────────────────────
// testForceShow: permite renderizar el componente en tests unitarios.
// En App.vue nunca se pasa esta prop; el BootScreen usa el IS_TEST guard.
const props = defineProps({
  testForceShow: { type: Boolean, default: false },
})

// ── Guard de entorno de test ──────────────────────────────────────────────────
// En test (jsdom) el AudioContext no existe y el BootScreen no debe mostrarse.
// Excepto si testForceShow=true (para tests unitarios del propio BootScreen).
const IS_TEST = import.meta.env.MODE === 'test' && !props.testForceShow

const { t } = useI18n()
const audio = inject('audio', null)
const scrollState = inject('scrollState', null)
const prm = inject('prm', null)
const reducedMotion = computed(() => prm?.prefersReduced?.value ?? false)

// ── Estado de visibilidad ─────────────────────────────────────────────────────
const visible = ref(false)
const phase = ref('post')  // 'post' | 'choice' | 'boot' | 'done'
const shortVersion = ref(false)
const choiceHighlight = ref(0)  // 0=sound, 1=muted (para navegación con flechas)

// ── Líneas POST para la fase BIOS ────────────────────────────────────────────
const BIOS_LINES = [
  'RM-BIOS (C) 1995-2026 Matovelle Systems, Inc.',
  'Pentium(R) CPU at 133MHz',
  null,   // null = memory count-up
  'Detecting IDE drives ... RAFAEL-OS v7.0 FOUND',
  'Keyboard ... OK',
  'Mouse ... OK',
  'Imagination ... UNLIMITED',
  '',
  'Press any key to boot',
]

const visibleLines = ref([])
const memoryCount = ref(0)
const TARGET_MEMORY = 16384
const showCursor = ref(false)
const bootText = ref('')

// ── Timers para cleanup ───────────────────────────────────────────────────────
const timers = []
function after(ms, fn) {
  const id = setTimeout(fn, ms)
  timers.push(id)
  return id
}
function clearAllTimers() {
  timers.forEach(clearTimeout)
  timers.length = 0
}

// ── Wipe CRT (clase que activa la animación de colapso) ──────────────────────
const wipeActive = ref(false)

// ── Foco trap ────────────────────────────────────────────────────────────────
let firstFocusable = null
let lastFocusable = null
const dialogRef = ref(null)
const skipBtnRef = ref(null)

function trapFocus(e) {
  if (!dialogRef.value) return
  const focusables = dialogRef.value.querySelectorAll(
    'button, [href], input, [tabindex]:not([tabindex="-1"])'
  )
  if (!focusables.length) return
  firstFocusable = focusables[0]
  lastFocusable = focusables[focusables.length - 1]
  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault()
      lastFocusable.focus()
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault()
      firstFocusable.focus()
    }
  }
}

// ── Lógica de inicio ─────────────────────────────────────────────────────────

function checkReturn() {
  // ¿Visitante recurrente? (excepto si ?boot=full)
  const seen = localStorage.getItem('rm-boot-seen')
  const forceFullBoot = typeof window !== 'undefined'
    && window.location.search.includes('boot=full')
  return seen === '1' && !forceFullBoot
}

function startPost() {
  phase.value = 'post'
  visibleLines.value = []
  memoryCount.value = 0

  let delay = 0
  BIOS_LINES.forEach((line, idx) => {
    if (line === null) {
      // Memory count-up
      after(delay, () => {
        if (reducedMotion.value) {
          // PRM: mostrar inmediatamente el total
          visibleLines.value.push(`Memory Test : ${TARGET_MEMORY}K OK`)
          memoryCount.value = TARGET_MEMORY
        } else {
          visibleLines.value.push(`Memory Test : 0K`)
          const countSteps = 40
          const countInterval = 60
          for (let i = 1; i <= countSteps; i++) {
            after(delay + i * countInterval, () => {
              const v = Math.round((TARGET_MEMORY / countSteps) * i)
              memoryCount.value = v
              visibleLines.value[idx] = `Memory Test : ${v}K OK`
            })
          }
          delay += countSteps * countInterval
        }
      })
      delay += reducedMotion.value ? 0 : 2500
    } else {
      after(delay, () => {
        visibleLines.value.push(line)
      })
      delay += reducedMotion.value ? 0 : 300
    }
  })

  // Al terminar POST → fase choice (si PRM, ir directamente)
  after(delay + (reducedMotion.value ? 0 : 200), () => {
    phase.value = 'choice'
    showCursor.value = true
    nextTick(() => skipBtnRef.value?.focus())
  })
}

function startShortVersion() {
  phase.value = 'choice'
  shortVersion.value = true
  showCursor.value = true
  // No contar memoria, no mostrar líneas BIOS
  nextTick(() => skipBtnRef.value?.focus())
}

// ── Elección S / M ────────────────────────────────────────────────────────────

async function chooseSound(withSound) {
  // Unlock del AudioContext (primer gesto de usuario)
  await engine.unlock()
  engine.setMuted(!withSound)
  localStorage.setItem('rm-boot-seen', '1')

  if (withSound) {
    beep()
    // Pequeño delay para que el beep suene antes del fade
    after(150, () => {
      audio?.playCurrentEra?.(scrollState?.activeChapter?.value ?? 0)
    })
  }

  // Pasar a fase boot
  phase.value = 'boot'
  startBootSequence()
}

function startBootSequence() {
  if (reducedMotion.value) {
    // PRM: fade simple
    after(600, () => done())
    return
  }

  bootText.value = ''
  const bootLines = ['Starting MS-DOS...', 'C:\\> RAFAEL.EXE']
  let delay = 0

  bootLines.forEach((line) => {
    after(delay, () => { bootText.value += (bootText.value ? '\n' : '') + line })
    delay += 600
  })

  // Wipe CRT
  after(delay + 400, () => {
    wipeActive.value = true
  })

  // Done tras wipe (~600ms de animación)
  after(delay + 1050, () => done())
}

function done() {
  phase.value = 'done'
  visible.value = false
  document.removeEventListener('keydown', handleKeydown)
}

// ── Skip ───────────────────────────────────────────────────────────────────────

function skip() {
  // Si estamos en POST, ir a choice directamente
  if (phase.value === 'post') {
    clearAllTimers()
    visibleLines.value = [...BIOS_LINES.filter(l => l !== null), `Memory Test : ${TARGET_MEMORY}K OK`]
    memoryCount.value = TARGET_MEMORY
    phase.value = 'choice'
    shortVersion.value = false
    showCursor.value = true
    nextTick(() => skipBtnRef.value?.focus())
    return
  }
  // En cualquier otra fase: saltar todo, marcar como visto
  if (phase.value === 'choice' || phase.value === 'boot') {
    engine.setMuted(true)
    localStorage.setItem('rm-boot-seen', '1')
    done()
  }
}

// ── Keyboard handler ──────────────────────────────────────────────────────────

function handleKeydown(e) {
  if (!visible.value) return

  // Trap de foco
  trapFocus(e)

  if (phase.value === 'post') {
    // Cualquier tecla salta al choice (excepto Tab que ya es trapFocus)
    if (e.key !== 'Tab') skip()
    return
  }

  if (phase.value === 'choice') {
    if (e.key === 'Escape') { skip(); return }
    if (e.key === 's' || e.key === 'S') { chooseSound(true); return }
    if (e.key === 'm' || e.key === 'M') { chooseSound(false); return }
    if (e.key === 'Enter') { chooseSound(choiceHighlight.value === 0); return }
    if (e.key === 'ArrowDown') { choiceHighlight.value = 1; return }
    if (e.key === 'ArrowUp') { choiceHighlight.value = 0; return }
    // Visitantes recurrentes: cualquier tecla = continuar con preferencia actual
    if (shortVersion.value) {
      const currentMuted = engine.isMuted()
      chooseSound(!currentMuted)
    }
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  if (IS_TEST) return  // Guard: en test no mostramos el bootscreen

  visible.value = true
  document.addEventListener('keydown', handleKeydown)

  if (checkReturn()) {
    startShortVersion()
  } else {
    startPost()
  }
})

onBeforeUnmount(() => {
  clearAllTimers()
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- Guard de test y de "ya terminó" -->
  <div
    v-if="!IS_TEST && visible"
    ref="dialogRef"
    class="boot-screen"
    :class="{ 'boot-screen--wipe': wipeActive }"
    role="dialog"
    aria-modal="true"
    aria-label="Sistema BIOS — Matovelle Systems"
  >
    <!-- SKIP button — esquina superior derecha, siempre disponible en fase POST -->
    <button
      v-if="phase === 'post'"
      ref="skipBtnRef"
      class="boot-screen__skip"
      type="button"
      @click="skip"
    >{{ t('boot.skipLabel') }}</button>

    <!-- Fase POST: líneas BIOS apareciendo -->
    <div v-if="phase === 'post'" class="boot-screen__post">
      <!-- Logo Energy Star (esquina superior derecha, CSS) -->
      <div class="boot-screen__energy" aria-hidden="true">
        <span class="energy__box">⚡</span>
      </div>

      <p
        v-for="(line, i) in visibleLines"
        :key="i"
        class="boot-screen__line"
      >{{ line }}</p>
    </div>

    <!-- Fase CHOICE: menú DOS -->
    <div v-else-if="phase === 'choice'" class="boot-screen__choice">
      <div v-if="shortVersion" class="boot-screen__return">
        <!-- Visitante recurrente: versión corta -->
        <p class="boot-screen__line boot-screen__line--blink">
          {{ engine.isMuted() ? t('boot.returnVisitorOff') : t('boot.returnVisitorOn') }}
        </p>
        <p class="boot-screen__line boot-screen__line--dim">
          {{ t('boot.pressAnyKey') }}
        </p>
        <button
          ref="skipBtnRef"
          class="boot-screen__ghost-btn"
          type="button"
          @click="chooseSound(!engine.isMuted())"
        >{{ t('boot.pressAnyKey') }}</button>
      </div>

      <div v-else class="boot-screen__menu">
        <p class="boot-screen__line boot-screen__line--frame">
          ╔═══ RAFAEL.EXE ═══╗
        </p>
        <!-- Opción S -->
        <button
          :ref="choiceHighlight === 0 ? skipBtnRef : undefined"
          class="boot-screen__option"
          :class="{ 'boot-screen__option--active': choiceHighlight === 0 }"
          type="button"
          @mouseenter="choiceHighlight = 0"
          @click="chooseSound(true)"
        >
          <span class="option__arrow">{{ choiceHighlight === 0 ? '►' : ' ' }}</span>
          [S] {{ t('boot.startWithSound') }}
        </button>
        <!-- Opción M -->
        <button
          class="boot-screen__option"
          :class="{ 'boot-screen__option--active': choiceHighlight === 1 }"
          type="button"
          @mouseenter="choiceHighlight = 1"
          @click="chooseSound(false)"
        >
          <span class="option__arrow">{{ choiceHighlight === 1 ? '►' : ' ' }}</span>
          [M] {{ t('boot.startMuted') }}
        </button>
        <p class="boot-screen__line boot-screen__line--dim">
          {{ t('boot.soundHint') }}
        </p>
        <!-- Botón SKIP secundario en el menú -->
        <button
          :ref="choiceHighlight !== 0 ? skipBtnRef : undefined"
          class="boot-screen__skip boot-screen__skip--inline"
          type="button"
          @click="skip"
        >{{ t('boot.skipLabel') }}</button>
      </div>
    </div>

    <!-- Fase BOOT: MS-DOS loading -->
    <div v-else-if="phase === 'boot'" class="boot-screen__boot">
      <pre class="boot-screen__pre">{{ bootText }}<span
        v-if="!reducedMotion"
        class="boot-screen__cursor"
        aria-hidden="true"
      >█</span></pre>
    </div>
  </div>
</template>

<style scoped>
/* VT323 — fuente bitmap VGA (ya instalada como dependency @fontsource/vt323) */
@import '@fontsource/vt323/latin.css';

/* ── Overlay raíz ───────────────────────────────────────────────────────────── */
.boot-screen {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: #000000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 2rem;
  overflow: hidden;

  font-family: 'VT323', 'Courier New', monospace;
  font-size: 20px;
  line-height: 1.4;
  -webkit-font-smoothing: none;
  font-smooth: never;
  letter-spacing: 0.02em;
}

/* ── Wipe CRT: línea horizontal que colapsa → revela la app ─────────────────── */
.boot-screen--wipe {
  animation: crt-wipe 0.55s ease-in forwards;
}

@keyframes crt-wipe {
  0%   { clip-path: inset(0 0 0 0); opacity: 1; }
  60%  { clip-path: inset(49% 0 49% 0); opacity: 1; }
  100% { clip-path: inset(50% 0 50% 0); opacity: 0; }
}

/* ── PRM: sin animaciones, fade simple ──────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .boot-screen--wipe {
    animation: none;
    opacity: 0;
    transition: opacity 0.4s;
  }
}

/* ── Área de texto POST ─────────────────────────────────────────────────────── */
.boot-screen__post {
  width: 100%;
  position: relative;
}

.boot-screen__line {
  color: #aaffaa;      /* verde fósforo */
  margin: 0;
  padding: 0;
  white-space: pre;
}

.boot-screen__line--frame {
  color: #ffffff;
  margin-top: 2rem;
}

.boot-screen__line--dim {
  color: #557755;
  font-size: 16px;
  margin-top: 0.5rem;
}

.boot-screen__line--blink {
  color: #ffffff;
  animation: blink-cursor 1s step-end infinite;
}

@media (prefers-reduced-motion: reduce) {
  .boot-screen__line--blink {
    animation: none;
  }
}

/* ── Logo Energy Star (CSS) ─────────────────────────────────────────────────── */
.boot-screen__energy {
  position: absolute;
  top: 0;
  right: 0;
  width: 64px;
  height: 64px;
  border: 2px solid #aaffaa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

/* ── Menú choice ─────────────────────────────────────────────────────────────── */
.boot-screen__choice {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 3rem;
}

.boot-screen__menu {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.boot-screen__option {
  background: none;
  border: none;
  font-family: inherit;
  font-size: inherit;
  color: #aaffaa;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.5ch;
  white-space: pre;
  -webkit-font-smoothing: none;
}

.boot-screen__option--active {
  color: #ffffff;
}

.option__arrow {
  display: inline-block;
  width: 1ch;
  color: #ffffff;
}

/* Botón ghost para visitantes recurrentes — invisible, solo para a11y */
.boot-screen__ghost-btn {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

/* ── Fase boot / MS-DOS ─────────────────────────────────────────────────────── */
.boot-screen__boot {
  width: 100%;
}

.boot-screen__pre {
  font-family: inherit;
  font-size: inherit;
  color: #aaffaa;
  background: none;
  margin: 0;
  padding: 0;
  border: none;
  white-space: pre;
}

/* Cursor parpadeante */
.boot-screen__cursor {
  display: inline-block;
  color: #aaffaa;
  animation: blink-cursor 0.5s step-end infinite;
}

@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .boot-screen__cursor {
    animation: none;
    opacity: 1;
  }
}

/* ── Botón SKIP ──────────────────────────────────────────────────────────────── */
.boot-screen__skip {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: 1px solid #557755;
  color: #557755;
  font-family: inherit;
  font-size: 14px;
  padding: 4px 10px;
  cursor: pointer;
  -webkit-font-smoothing: none;
}

.boot-screen__skip:hover {
  border-color: #aaffaa;
  color: #aaffaa;
}

.boot-screen__skip--inline {
  position: static;
  margin-top: 1.5rem;
}

/* ── Visitante recurrente (versión corta) ─────────────────────────────────────── */
.boot-screen__return {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 2rem;
}
</style>
