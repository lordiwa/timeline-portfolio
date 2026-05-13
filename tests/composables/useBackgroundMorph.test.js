// tests/composables/useBackgroundMorph.test.js
// Tests del composable useBackgroundMorph (Plan 02-04, Wave 3).
//
// Cobertura (8 tests — behavior block del plan):
//   T1 — initial state: layerA={chapter:3, opacity:1}, layerB={chapter:null, opacity:0}, transitionPhase='idle'
//   T2 — watch fires on chapter change (default motion): mid-flight state + 200ms timer finaliza
//   T3 — activeLayer flips: tras morph 3→4, siguiente morph usa la layer anterior como outgoing
//   T4 — PRM branch — 150ms duration: timer expira a los 150ms (no 200ms)
//   T5 — PRM mid-flight recovery: activar PRM durante crossfade snap-finaliza sin esperar timer
//   T6 — rapid scroll defensive: 3 cambios en flight, solo el último timer queda activo
//   T7 — cleanup onBeforeUnmount: clearTimeout llamado al desmontar mid-fade
//   T8 — same-chapter noop: mutar al mismo valor no dispara crossfade (if newCh === oldCh guard)
//
// Patrones usados:
//   - defineComponent wrapper para instanciar composable en lifecycle real (usePRM.test.js pattern)
//   - vi.useFakeTimers() + vi.advanceTimersByTime() + flushPromises() (StickyAvatar.test.js pattern)
//   - vi.spyOn(globalThis, 'clearTimeout') para T7

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, defineComponent } from 'vue'
import { useBackgroundMorph } from '@/composables/useBackgroundMorph'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: instancia useBackgroundMorph dentro de un component lifecycle real.
// Retorna { wrapper, activeChapter, prefersReduced, morphState } para mutar + assert.
// ─────────────────────────────────────────────────────────────────────────────
function makeWrapper({ initialChapter = 3, initialPRM = false } = {}) {
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(initialPRM)
  let exposed = null

  const Comp = defineComponent({
    setup() {
      exposed = useBackgroundMorph(activeChapter, { prefersReduced })
      return () => null
    },
  })
  const wrapper = mount(Comp, { attachTo: document.body })
  return { wrapper, activeChapter, prefersReduced, get morphState() { return exposed } }
}

describe('useBackgroundMorph composable', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T1 — initial state
  // ───────────────────────────────────────────────────────────────────────────
  it('T1 initial state: layerA={chapter:3, opacity:1}, layerB={chapter:null, opacity:0}, transitionPhase="idle"', () => {
    const { morphState } = makeWrapper({ initialChapter: 3 })
    const { layerA, layerB, transitionPhase } = morphState

    expect(layerA.chapter.value).toBe(3)
    expect(layerA.opacity.value).toBe(1)
    expect(layerB.chapter.value).toBeNull()
    expect(layerB.opacity.value).toBe(0)
    expect(transitionPhase.value).toBe('idle')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T2 — watch fires on chapter change (default motion)
  // ───────────────────────────────────────────────────────────────────────────
  it('T2 default motion: chapter change triggers crossfade; 200ms timer finalizes state', async () => {
    vi.useFakeTimers()
    const { activeChapter, morphState } = makeWrapper({ initialChapter: 3, initialPRM: false })
    const { layerA, layerB, transitionPhase } = morphState

    // Estado inicial
    expect(layerA.chapter.value).toBe(3)
    expect(transitionPhase.value).toBe('idle')

    // Cambiar chapter → debe disparar crossfade
    activeChapter.value = 4
    await flushPromises()

    // Mid-fade: transitionPhase debería ser 'crossfading'
    expect(transitionPhase.value).toBe('crossfading')
    // layerB (incoming para el primer morph) debe tener chapter 4 y opacity 1
    expect(layerB.chapter.value).toBe(4)
    expect(layerB.opacity.value).toBe(1)
    // layerA (outgoing) debe tener opacity 0
    expect(layerA.opacity.value).toBe(0)

    // A 199ms el timer aún no disparó
    vi.advanceTimersByTime(199)
    await flushPromises()
    // outgoing.chapter (layerA) sigue siendo 3 (timer pending)
    expect(layerA.chapter.value).toBe(3)
    expect(transitionPhase.value).toBe('crossfading')

    // Tras los últimos 1ms (200ms totales) → el timer dispara
    vi.advanceTimersByTime(1)
    await flushPromises()
    // outgoing.chapter limpiado a null, transitionPhase vuelve a 'idle'
    expect(layerA.chapter.value).toBeNull()
    expect(transitionPhase.value).toBe('idle')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T3 — activeLayer flips tras cada morph
  // ───────────────────────────────────────────────────────────────────────────
  it('T3 activeLayer flips: after morph 3→4 + 200ms, next morph 4→5 uses layerA as incoming', async () => {
    vi.useFakeTimers()
    const { activeChapter, morphState } = makeWrapper({ initialChapter: 3, initialPRM: false })
    const { layerA, layerB, transitionPhase } = morphState

    // Primer morph: 3 → 4 (layerB = incoming, layerA = outgoing)
    activeChapter.value = 4
    await flushPromises()
    vi.advanceTimersByTime(200)
    await flushPromises()

    // Post-primer-morph: layerB visible (opacity 1, chapter 4), layerA limpiada (null, opacity 0)
    expect(layerB.chapter.value).toBe(4)
    expect(layerB.opacity.value).toBe(1)
    expect(layerA.chapter.value).toBeNull()
    expect(transitionPhase.value).toBe('idle')

    // Segundo morph: 4 → 5. Ahora activeLayer='B', entonces:
    // incoming = layerA (que era outgoing antes, ahora recibe el nuevo chapter)
    // outgoing = layerB (que tenía chapter 4, se va a opacity 0)
    activeChapter.value = 5
    await flushPromises()

    expect(transitionPhase.value).toBe('crossfading')
    expect(layerA.chapter.value).toBe(5)   // incoming
    expect(layerA.opacity.value).toBe(1)
    expect(layerB.opacity.value).toBe(0)   // outgoing
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T4 — PRM branch — duración 150ms (no 200ms)
  // ───────────────────────────────────────────────────────────────────────────
  it('T4 PRM branch: timer fires at 150ms (NOT 200ms) when prefersReduced=true from mount', async () => {
    vi.useFakeTimers()
    const { activeChapter, morphState } = makeWrapper({ initialChapter: 3, initialPRM: true })
    const { layerA, layerB, transitionPhase } = morphState

    activeChapter.value = 4
    await flushPromises()

    // Debe estar crossfading
    expect(transitionPhase.value).toBe('crossfading')

    // A 149ms el timer aún no disparó
    vi.advanceTimersByTime(149)
    await flushPromises()
    expect(layerA.chapter.value).toBe(3) // outgoing chapter sigue siendo 3

    // Al ms 150 el timer dispara
    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(layerA.chapter.value).toBeNull()
    expect(transitionPhase.value).toBe('idle')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T5 — PRM mid-flight recovery
  // ───────────────────────────────────────────────────────────────────────────
  it('T5 PRM mid-flight recovery: enabling PRM mid-fade snap-finalizes immediately without waiting for timer', async () => {
    vi.useFakeTimers()
    const { activeChapter, prefersReduced, morphState } = makeWrapper({ initialChapter: 3, initialPRM: false })
    const { layerA, layerB, transitionPhase } = morphState

    // Iniciar crossfade
    activeChapter.value = 4
    await flushPromises()

    // Verificar que estamos mid-fade
    expect(transitionPhase.value).toBe('crossfading')
    expect(layerA.opacity.value).toBe(0) // outgoing

    // Activar PRM durante el crossfade
    prefersReduced.value = true
    await flushPromises()

    // Snap-finaliza sin esperar el timer: state limpio
    expect(transitionPhase.value).toBe('idle')
    expect(layerB.opacity.value).toBe(1)    // incoming snap a opacity 1
    expect(layerA.opacity.value).toBe(0)    // outgoing snap a opacity 0
    expect(layerA.chapter.value).toBeNull() // outgoing.chapter limpiado

    // El timer ya no existe — avanzar 200ms no debe cambiar nada
    vi.advanceTimersByTime(200)
    await flushPromises()
    expect(transitionPhase.value).toBe('idle')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T6 — rapid scroll defensive (clearTimeout entre morphs consecutivos)
  // ───────────────────────────────────────────────────────────────────────────
  it('T6 rapid scroll defensive: 3 rapid chapter changes only keep the last pending timer', async () => {
    vi.useFakeTimers()
    const { activeChapter, morphState } = makeWrapper({ initialChapter: 3, initialPRM: false })
    const { layerA, layerB, transitionPhase } = morphState

    // 3 cambios rápidos sin avanzar el timer
    activeChapter.value = 4
    await flushPromises()
    activeChapter.value = 5
    await flushPromises()
    activeChapter.value = 6
    await flushPromises()

    // Debe estar en crossfading con el último chapter (6) en incoming
    expect(transitionPhase.value).toBe('crossfading')

    // Avanzar 200ms → solo el último timer dispara (los anteriores fueron clear'd)
    vi.advanceTimersByTime(200)
    await flushPromises()
    expect(transitionPhase.value).toBe('idle')

    // La layer incoming debe tener chapter 6
    // Tras 3 morphs con flip, no sabemos exactamente qué layer es incoming sin
    // rastrear el estado interno — pero podemos verificar que UNA de las layers
    // tiene chapter 6 y la otra tiene null.
    const chapterValues = [layerA.chapter.value, layerB.chapter.value]
    expect(chapterValues).toContain(6)
    expect(chapterValues).toContain(null)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T7 — cleanup onBeforeUnmount
  // ───────────────────────────────────────────────────────────────────────────
  it('T7 cleanup onBeforeUnmount: clearTimeout called with pendingTimer when unmounted mid-fade', async () => {
    vi.useFakeTimers()
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const { wrapper, activeChapter } = makeWrapper({ initialChapter: 3, initialPRM: false })

    // Iniciar crossfade para que haya un pendingTimer
    activeChapter.value = 4
    await flushPromises()

    // Desmontar mid-fade → onBeforeUnmount debe llamar clearTimeout
    wrapper.unmount()

    // En Node.js/jsdom, setTimeout retorna un objeto Timeout (no un número primitivo).
    // Verificamos que clearTimeout fue llamado con algo (el timer object o número).
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T8 — same-chapter noop (guard if newCh === oldCh)
  // ───────────────────────────────────────────────────────────────────────────
  it('T8 same-chapter noop: mutating activeChapter to same value keeps transitionPhase="idle"', async () => {
    const { activeChapter, morphState } = makeWrapper({ initialChapter: 3, initialPRM: false })
    const { layerA, layerB, transitionPhase } = morphState

    // Mutar al mismo valor
    activeChapter.value = 3
    await flushPromises()

    // No debe haber cambio — guard if (newCh === oldCh) return
    expect(transitionPhase.value).toBe('idle')
    expect(layerA.chapter.value).toBe(3)
    expect(layerA.opacity.value).toBe(1)
    expect(layerB.chapter.value).toBeNull()
    expect(layerB.opacity.value).toBe(0)
  })
})
