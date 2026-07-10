<!--
  DialUpScreen.vue — Pantalla de dial-up Windows 98 al entrar a ch1 (Task #24).

  Trigger: al hacer scroll a ch1 (chapter 1) por primera vez en la sesión.
  Guarda sessionStorage 'rm-dialup-seen' para no repetir en la misma sesión.

  Visual: ventana Win98 en CSS puro.
    - Bordes 3D outset 2px, gris #c0c0c0
    - Title bar degradado azul, texto blanco, botones _ □ ✕
    - Ícono animado de dos PCs conectándose (CSS)
    - Barra de progreso segmentada azul
    - Fuente: 'MS Sans Serif' → Tahoma → system

  Audio (si sound on y unlocked): modemDial() + modemHandshake() sincronizados.
  Duración total ~4s. Skippable con ✕, Cancelar, o ESC.

  PRM: versión estática 1.5s con fade, sin parpadeos ni animaciones CSS.
-->
<script setup>
import { ref, computed, watch, onBeforeUnmount, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { engine } from '@/audio/engine'
import { modemDial, modemHandshake } from '@/audio/sfx'

const { t } = useI18n()
const scrollState = inject('scrollState', null)
const prm = inject('prm', null)
const reducedMotion = computed(() => prm?.prefersReduced?.value ?? false)

// ── Estado de visibilidad ─────────────────────────────────────────────────────
const visible = ref(false)
const phase = ref('dialing')  // 'dialing' | 'verifying' | 'connected' | 'done'
const progress = ref(0)  // 0-100

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

// ── Icono de PCs parpadeando (animación CSS) ──────────────────────────────────
const iconBlink = ref(false)
let blinkInterval = null

function startIconBlink() {
  if (reducedMotion.value) return
  blinkInterval = setInterval(() => {
    iconBlink.value = !iconBlink.value
  }, 400)
}

function stopIconBlink() {
  if (blinkInterval) {
    clearInterval(blinkInterval)
    blinkInterval = null
  }
}

// ── Secuencia dial-up ─────────────────────────────────────────────────────────

function startSequence() {
  if (reducedMotion.value) {
    // PRM: versión estática breve con fade
    progress.value = 100
    phase.value = 'connected'
    after(1500, () => closeDone())
    return
  }

  startIconBlink()

  // Audio si disponible
  if (engine.isUnlocked() && !engine.isMuted()) {
    modemDial('5556432489')
    after(1400, () => modemHandshake())
  }

  // Progreso animado: 0 → 40% en 1.2s (dial)
  let prog = 0
  const step1 = setInterval(() => {
    prog = Math.min(prog + 3, 40)
    progress.value = prog
    if (prog >= 40) clearInterval(step1)
  }, 90)
  timers.push(step1)

  // Fase 'verifying' a ~1.3s
  after(1300, () => {
    phase.value = 'verifying'
    // Progreso 40 → 80% durante handshake (~2s)
    let p = 40
    const step2 = setInterval(() => {
      p = Math.min(p + 2, 80)
      progress.value = p
      if (p >= 80) clearInterval(step2)
    }, 80)
    timers.push(step2)
  })

  // Fase 'connected' a ~3.5s
  after(3500, () => {
    phase.value = 'connected'
    progress.value = 100
    stopIconBlink()
    iconBlink.value = true  // PCs encendidas al final
  })

  // Minimize + close a ~4.2s
  after(4200, () => closeDone())
}

// ── Cerrar ────────────────────────────────────────────────────────────────────

const minimizing = ref(false)

function closeDone() {
  stopIconBlink()
  minimizing.value = true
  after(300, () => {
    visible.value = false
    phase.value = 'done'
  })
}

function skip() {
  clearAllTimers()
  stopIconBlink()
  sessionStorage.setItem('rm-dialup-seen', '1')
  visible.value = false
  phase.value = 'done'
}

// ── Keyboard ESC ──────────────────────────────────────────────────────────────

function handleKeydown(e) {
  if (!visible.value) return
  if (e.key === 'Escape') skip()
}

document.addEventListener('keydown', handleKeydown)

// ── Watcher de chapter ───────────────────────────────────────────────────────

const seenKey = 'rm-dialup-seen'

if (scrollState) {
  watch(scrollState.activeChapter, (n, prev) => {
    // Trigger: entrar a ch1 por primera vez en la sesión
    if (n === 1 && n !== prev && !sessionStorage.getItem(seenKey)) {
      sessionStorage.setItem(seenKey, '1')
      visible.value = true
      phase.value = 'dialing'
      progress.value = 0
      minimizing.value = false
      startSequence()
    }
  })
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

onBeforeUnmount(() => {
  clearAllTimers()
  stopIconBlink()
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Transition name="dialup-fade">
    <div
      v-if="visible"
      class="dialup-scrim"
      role="dialog"
      aria-modal="true"
      :aria-label="t('dialup.title')"
      @click.self="skip"
    >
      <div
        class="dialup-window"
        :class="{ 'dialup-window--minimizing': minimizing }"
      >
        <!-- Title bar Win98 -->
        <div class="dialup-title-bar">
          <span class="dialup-title-bar__icon" aria-hidden="true">🌐</span>
          <span class="dialup-title-bar__text">{{ t('dialup.title') }}</span>
          <div class="dialup-title-bar__buttons" aria-hidden="true">
            <button class="win98-btn" tabindex="-1">_</button>
            <button class="win98-btn" tabindex="-1">□</button>
            <button
              class="win98-btn win98-btn--close"
              :aria-label="t('dialup.cancel')"
              tabindex="0"
              @click="skip"
            >✕</button>
          </div>
        </div>

        <!-- Cuerpo de la ventana -->
        <div class="dialup-body">
          <!-- Ícono de dos PCs conectándose (CSS pixel art) -->
          <div class="dialup-icon" aria-hidden="true">
            <div class="pc pc--left" :class="{ 'pc--lit': iconBlink || phase === 'connected' }">
              <div class="pc__screen"></div>
              <div class="pc__body"></div>
            </div>
            <div class="dialup-cable" :class="{ 'dialup-cable--active': phase !== 'dialing' }">
              <span>···</span>
            </div>
            <div class="pc pc--right" :class="{ 'pc--lit': phase === 'connected' }">
              <div class="pc__screen"></div>
              <div class="pc__body"></div>
            </div>
          </div>

          <!-- Texto de fase -->
          <p class="dialup-status">
            <template v-if="phase === 'dialing'">{{ t('dialup.dialing') }}</template>
            <template v-else-if="phase === 'verifying'">{{ t('dialup.verifying') }}</template>
            <template v-else>{{ t('dialup.connected') }}</template>
          </p>

          <!-- Barra de progreso segmentada Win98 -->
          <div class="dialup-progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
            <div
              v-for="i in 20"
              :key="i"
              class="dialup-progress__block"
              :class="{ 'dialup-progress__block--filled': i <= Math.ceil(progress / 5) }"
            />
          </div>

          <!-- Botón Cancelar -->
          <div class="dialup-actions">
            <button
              class="win98-action-btn"
              type="button"
              @click="skip"
            >{{ t('dialup.cancel') }}</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Scrim (fondo semitransparente — se ve ch1 detrás) ────────────────────── */
.dialup-scrim {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Ventana Win98 ─────────────────────────────────────────────────────────── */
.dialup-window {
  background: #c0c0c0;
  border-top: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
  border-right: 2px solid #808080;
  border-bottom: 2px solid #808080;
  box-shadow: 2px 2px 0 #000000;
  min-width: 280px;
  max-width: 340px;
  font-family: 'MS Sans Serif', Tahoma, 'Geneva', sans-serif;
  font-size: 11px;
}

.dialup-window--minimizing {
  animation: win98-minimize 0.28s ease-in forwards;
}

@keyframes win98-minimize {
  0%   { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.1) translateY(200px); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .dialup-window--minimizing {
    animation: none;
    opacity: 0;
    transition: opacity 0.2s;
  }
}

/* ── Title bar ────────────────────────────────────────────────────────────── */
.dialup-title-bar {
  background: linear-gradient(to right, #000080, #1084d0);
  color: #ffffff;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.dialup-title-bar__icon {
  font-size: 12px;
}

.dialup-title-bar__text {
  flex: 1;
}

.dialup-title-bar__buttons {
  display: flex;
  gap: 2px;
}

/* Botones de la title bar (_  □  ✕) */
.win98-btn {
  width: 16px;
  height: 14px;
  background: #c0c0c0;
  border-top: 1px solid #ffffff;
  border-left: 1px solid #ffffff;
  border-right: 1px solid #808080;
  border-bottom: 1px solid #808080;
  color: #000000;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  line-height: 1;
}

.win98-btn:active {
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-right: 1px solid #ffffff;
  border-bottom: 1px solid #ffffff;
}

.win98-btn--close {
  font-size: 10px;
  font-weight: bold;
}

/* ── Cuerpo ────────────────────────────────────────────────────────────────── */
.dialup-body {
  padding: 16px 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

/* ── Ícono de PCs (CSS) ───────────────────────────────────────────────────── */
.dialup-icon {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.pc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.pc__screen {
  width: 22px;
  height: 16px;
  background: #000040;
  border: 2px solid #808080;
  border-top-color: #ffffff;
  border-left-color: #ffffff;
}

.pc--lit .pc__screen {
  background: #000080;
  box-shadow: 0 0 4px #4444ff;
}

.pc__body {
  width: 18px;
  height: 10px;
  background: #c0c0c0;
  border: 1px solid #808080;
  border-top-color: #ffffff;
  border-left-color: #ffffff;
}

.dialup-cable {
  color: #808080;
  font-size: 10px;
  letter-spacing: -1px;
  font-family: monospace;
}

.dialup-cable--active {
  color: #000080;
}

/* ── Estado / texto ───────────────────────────────────────────────────────── */
.dialup-status {
  color: #000000;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
  text-align: center;
  margin: 0;
  min-height: 16px;
}

/* ── Barra de progreso Win98 (segmentada) ─────────────────────────────────── */
.dialup-progress {
  display: flex;
  gap: 2px;
  width: 100%;
  height: 16px;
  background: #ffffff;
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-right: 1px solid #ffffff;
  border-bottom: 1px solid #ffffff;
  padding: 2px;
}

.dialup-progress__block {
  flex: 1;
  height: 100%;
  background: #c0c0c0;
}

.dialup-progress__block--filled {
  background: #000080;
}

/* ── Botón de acción Win98 (Cancelar) ─────────────────────────────────────── */
.dialup-actions {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.win98-action-btn {
  background: #c0c0c0;
  border-top: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
  border-right: 2px solid #808080;
  border-bottom: 2px solid #808080;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 11px;
  padding: 3px 14px;
  cursor: pointer;
  color: #000000;
  min-width: 75px;
  text-align: center;
}

.win98-action-btn:active {
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-right: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  padding: 4px 13px 2px 15px;
}

/* ── Transición de entrada/salida ─────────────────────────────────────────── */
.dialup-fade-enter-active {
  transition: opacity 0.2s ease;
}
.dialup-fade-leave-active {
  transition: opacity 0.3s ease;
}
.dialup-fade-enter-from,
.dialup-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dialup-fade-enter-active,
  .dialup-fade-leave-active {
    transition: opacity 0.15s;
  }
}
</style>
