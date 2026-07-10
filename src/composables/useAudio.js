// src/composables/useAudio.js
// Integración Vue del motor de audio procedural.
//
// Función principal: initAudioWatcher(scrollState)
//   - Observa scrollState.activeChapter
//   - Hace CROSSFADE equal-power de 2s al cambiar de era
//   - Solo activa si engine.isUnlocked() (el BootScreen llama unlock primero)
//
// playCurrentEra(n): inicia el track de era n (llamado por BootScreen post-unlock)
// muted: ref reactivo de estado mute
// toggle(): alterna mute/unmute + actualiza ref

import { ref, watch } from 'vue'
import { engine } from '@/audio/engine'
import { Sequencer } from '@/audio/sequencer'
import { TRACKS } from '@/audio/tracks'

// Duración del crossfade en segundos
const FADE_DURATION = 2.0

// Número de pasos para la curva equal-power (coseno/seno)
const CURVE_STEPS = 64

/** Genera curva equal-power descendente (cos) para fade-out */
function _fadeOutCurve() {
  const curve = new Float32Array(CURVE_STEPS)
  for (let i = 0; i < CURVE_STEPS; i++) {
    curve[i] = Math.cos((i / (CURVE_STEPS - 1)) * Math.PI * 0.5)
  }
  return curve
}

/** Genera curva equal-power ascendente (sin) para fade-in */
function _fadeInCurve() {
  const curve = new Float32Array(CURVE_STEPS)
  for (let i = 0; i < CURVE_STEPS; i++) {
    curve[i] = Math.sin((i / (CURVE_STEPS - 1)) * Math.PI * 0.5)
  }
  return curve
}

export function useAudio() {
  const muted = ref(engine.isMuted())
  // engine.isUnlocked() no es reactivo — este ref es la fuente de verdad para la UI;
  // todo unlock debe pasar por unlock() de este composable para que se refleje.
  const unlocked = ref(engine.isUnlocked())

  /** Unlock del AudioContext (llamar SOLO desde un handler de gesto de usuario). */
  async function unlock() {
    await engine.unlock()
    unlocked.value = true
  }

  // Sequencers activos: _current es el que suena ahora, _previous el que se desvanece
  let _currentSeq = null
  let _previousSeq = null
  let _activeEra = null

  /**
   * Inicia el track de la era n con crossfade equal-power.
   * Si no hay track previo: fade-in desde 0.
   * Si hay track previo: fade-out paralelo mientras el nuevo entra.
   * @param {number} n — índice de era (0-6)
   */
  function playCurrentEra(n) {
    if (typeof n !== 'number' || n < 0 || n > 6) return
    if (n === _activeEra) return // ya está sonando esta era

    if (!engine.isUnlocked()) return // no se puede reproducir sin unlock

    _activeEra = n

    const ctx = engine.getContext()
    const masterGain = engine.getMasterGain()
    const now = ctx.currentTime
    const fadeOut = _fadeOutCurve()
    const fadeIn = _fadeInCurve()

    // ── Fade-out del sequencer anterior ──────────────────────────────────
    if (_currentSeq) {
      const oldSeq = _currentSeq
      _previousSeq = oldSeq

      oldSeq.gainNode.gain.cancelScheduledValues(now)
      oldSeq.gainNode.gain.setValueAtTime(
        Math.max(oldSeq.gainNode.gain.value, 0.001),
        now
      )
      oldSeq.gainNode.gain.setValueCurveAtTime(fadeOut, now, FADE_DURATION)

      // Detener el scheduler (no las notas ya scheduled) después del fade
      setTimeout(() => {
        oldSeq.stop()
        if (_previousSeq === oldSeq) _previousSeq = null
      }, (FADE_DURATION + 0.3) * 1000)
    }

    // ── Fade-in del nuevo sequencer ───────────────────────────────────────
    const newSeq = new Sequencer(ctx, masterGain)
    newSeq.gainNode.gain.setValueAtTime(0, now)
    newSeq.gainNode.gain.setValueCurveAtTime(fadeIn, now, FADE_DURATION)

    newSeq.start(TRACKS[n])
    _currentSeq = newSeq
  }

  /** Detiene toda reproducción (sin fade). Usado en cleanup o tests. */
  function stopAll() {
    _currentSeq?.stop()
    _previousSeq?.stop()
    _currentSeq = null
    _previousSeq = null
    _activeEra = null
  }

  /**
   * Inicia el watcher de activeChapter.
   * Llamar desde App.vue setup() después de que el scrollState esté disponible.
   * @param {import('vue').Ref<number>} activeChapterRef
   */
  function initAudioWatcher(activeChapterRef) {
    watch(activeChapterRef, (n) => {
      if (!engine.isUnlocked()) return
      playCurrentEra(n)
    })
  }

  /** Fija mute/unmute manteniendo el ref reactivo en sincronía con el engine. */
  function setMuted(value) {
    muted.value = value
    engine.setMuted(value)
  }

  /** Alterna mute/unmute. Actualiza el ref reactivo y persiste. */
  function toggle() {
    setMuted(!muted.value)
  }

  return {
    muted,
    unlocked,
    unlock,
    setMuted,
    toggle,
    initAudioWatcher,
    playCurrentEra,
    stopAll,
  }
}
