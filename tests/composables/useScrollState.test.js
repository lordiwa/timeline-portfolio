// tests/composables/useScrollState.test.js
// Tests del composable useScrollState.
//
// Cobertura:
// - exports + interfaz pública (refs readonly + scrollToChapter)
// - default activeChapter=3, default scrollProgress=0
// - deep-link ?ch=N → scrollToChapter(N, 'auto') vía spy sobre HTMLElement.prototype.scrollIntoView
// - validación de rangos (?ch=99, ?ch=abc, ?ch=, missing → fallback ch3)
// - scrollToChapter(N, 'smooth') invoca scrollIntoView correcto
// - IntersectionObserver actualiza activeChapter cuando intersectionRatio ≥ 0.6
// - cleanup en onBeforeUnmount (disconnect + remove listener)
//
// Wrapper template canónico (PATTERN C): incluye 7 <section id="chapter-N"> stubs
// para que document.getElementById('chapter-N') funcione en jsdom.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, defineComponent, isReadonly } from 'vue'
import { useScrollState } from '@/composables/useScrollState'

// Helper: wrapper component con 7 chapter stubs.
// Devuelve el wrapper + un getter al objeto `exposed` que captura el estado del composable.
function makeWrapper() {
  let exposed = null
  const Comp = defineComponent({
    setup() {
      const shellRef = ref(null)
      const state = useScrollState(shellRef)
      exposed = { shellRef, state }
      return { shellRef }
    },
    template: `
      <div>
        <main ref="shellRef" class="scroll-shell">
          <section id="chapter-0" data-chapter="0"></section>
          <section id="chapter-1" data-chapter="1"></section>
          <section id="chapter-2" data-chapter="2"></section>
          <section id="chapter-3" data-chapter="3"></section>
          <section id="chapter-4" data-chapter="4"></section>
          <section id="chapter-5" data-chapter="5"></section>
          <section id="chapter-6" data-chapter="6"></section>
        </main>
      </div>
    `,
  })
  const wrapper = mount(Comp, { attachTo: document.body })
  return { wrapper, get: () => exposed }
}

// Helper: espera a que el deep-link se aplique.
// Cadena de espera:
// 1. flushPromises() — drena microtasks pendientes (incluido el watch flush:post
//    del composable, que es lo que programa los RAFs internos de maybeApplyDeepLink).
// 2. Doble RAF — espera los 2 RAFs internos de maybeApplyDeepLink antes del scrollToChapter.
// 3. flushPromises() — drena cualquier microtask producido por el callback final.
async function waitForDeepLink() {
  await flushPromises()
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  await flushPromises()
}

// Helper: verifica que scrollIntoView fue llamado sobre el #chapter-N con el behavior esperado.
function assertNavigatedTo(N, behavior) {
  const el = document.getElementById(`chapter-${N}`)
  expect(el).not.toBeNull()
  expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior, block: 'start' })
}

describe('useScrollState', () => {
  // scrollIntoView ya está instalado como vi.fn() global en tests/setup.js.
  // Aquí solo limpiamos sus llamadas entre tests con mockClear en beforeEach.

  beforeEach(() => {
    // Reset IntersectionObserver mock instances entre tests.
    if (globalThis.MockIntersectionObserver) {
      globalThis.MockIntersectionObserver.reset()
    }
    // Limpiamos las llamadas previas (preservando la misma función spy).
    HTMLElement.prototype.scrollIntoView.mockClear()
    // Reset query string a vacío por default.
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: export + interfaz pública
  // ─────────────────────────────────────────────────────────────────────────
  it('exports useScrollState as a function', () => {
    expect(typeof useScrollState).toBe('function')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2: default refs + null ref no cablea nada
  // ─────────────────────────────────────────────────────────────────────────
  it('with a null ref, returns readonly refs (activeChapter=3, scrollProgress=0) and does NOT wire IO yet', () => {
    // Llamamos useScrollState fuera de un componente Vue para verificar el
    // estado inicial puro. Necesitamos un setup mínimo porque onBeforeUnmount
    // requiere instancia. Usamos un componente que NO renderiza shellRef.
    let captured = null
    const Comp = defineComponent({
      setup() {
        const shellRef = ref(null)
        captured = useScrollState(shellRef)
        return {}
      },
      template: '<div></div>',
    })
    const w = mount(Comp)
    expect(captured.activeChapter.value).toBe(3)
    expect(captured.scrollProgress.value).toBe(0)
    expect(isReadonly(captured.activeChapter)).toBe(true)
    expect(isReadonly(captured.scrollProgress)).toBe(true)
    expect(typeof captured.scrollToChapter).toBe('function')
    // Sin shellRef.value, el IO NO se cablea.
    expect(globalThis.MockIntersectionObserver.instances.length).toBe(0)
    w.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 3: deep-link ?ch=0
  // ─────────────────────────────────────────────────────────────────────────
  it('deep-link ?ch=0 invokes scrollToChapter(0, "auto")', async () => {
    window.history.replaceState({}, '', '/?ch=0')
    const { wrapper } = makeWrapper()
    await waitForDeepLink()
    assertNavigatedTo(0, 'auto')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 4: deep-link ?ch=99 (out of range) → fallback ch3
  // ─────────────────────────────────────────────────────────────────────────
  it('deep-link ?ch=99 falls back to scrollToChapter(3, "auto")', async () => {
    window.history.replaceState({}, '', '/?ch=99')
    const { wrapper } = makeWrapper()
    await waitForDeepLink()
    assertNavigatedTo(3, 'auto')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 5: deep-link ?ch=abc (invalid) → fallback ch3
  // ─────────────────────────────────────────────────────────────────────────
  it('deep-link ?ch=abc falls back to scrollToChapter(3, "auto")', async () => {
    window.history.replaceState({}, '', '/?ch=abc')
    const { wrapper } = makeWrapper()
    await waitForDeepLink()
    assertNavigatedTo(3, 'auto')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 6: deep-link ?ch= (empty) → fallback ch3
  // ─────────────────────────────────────────────────────────────────────────
  it('deep-link ?ch= (empty) falls back to scrollToChapter(3, "auto")', async () => {
    window.history.replaceState({}, '', '/?ch=')
    const { wrapper } = makeWrapper()
    await waitForDeepLink()
    assertNavigatedTo(3, 'auto')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 7: no query string → default ch3
  // ─────────────────────────────────────────────────────────────────────────
  it('no query string defaults to scrollToChapter(3, "auto")', async () => {
    window.history.replaceState({}, '', '/')
    const { wrapper } = makeWrapper()
    await waitForDeepLink()
    assertNavigatedTo(3, 'auto')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 8: scrollToChapter(N, 'smooth') invoca scrollIntoView correcto
  // ─────────────────────────────────────────────────────────────────────────
  it('scrollToChapter(2, "smooth") calls scrollIntoView with {behavior:"smooth", block:"start"} on #chapter-2', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    // Limpiamos el spy del deep-link inicial.
    HTMLElement.prototype.scrollIntoView.mockClear()
    get().state.scrollToChapter(2, 'smooth')
    const ch2 = document.getElementById('chapter-2')
    expect(ch2.scrollIntoView).toHaveBeenCalledTimes(1)
    expect(ch2.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 9: IO callback con intersectionRatio ≥ 0.6 actualiza activeChapter
  // ─────────────────────────────────────────────────────────────────────────
  it('IO callback with intersectionRatio >= 0.6 updates activeChapter', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    expect(get().state.activeChapter.value).toBe(3)
    // Disparar IO con un entry simulando section 4 visible.
    const io = globalThis.MockIntersectionObserver.instances[0]
    expect(io).toBeDefined()
    io.triggerEntries([
      {
        isIntersecting: true,
        intersectionRatio: 0.7,
        target: { dataset: { chapter: '4' } },
      },
    ])
    await flushPromises()
    expect(get().state.activeChapter.value).toBe(4)
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 10: IO callback con intersectionRatio < 0.6 NO cambia activeChapter
  // ─────────────────────────────────────────────────────────────────────────
  it('IO callback with intersectionRatio < 0.6 does NOT update activeChapter', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    expect(get().state.activeChapter.value).toBe(3)
    const io = globalThis.MockIntersectionObserver.instances[0]
    io.triggerEntries([
      {
        isIntersecting: true,
        intersectionRatio: 0.4,
        target: { dataset: { chapter: '5' } },
      },
    ])
    await flushPromises()
    expect(get().state.activeChapter.value).toBe(3) // sin cambio
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 11: cleanup en onBeforeUnmount
  // ─────────────────────────────────────────────────────────────────────────
  it('cleanup on unmount: disconnects observer and removes scroll listener', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    const io = globalThis.MockIntersectionObserver.instances[0]
    const disconnectSpy = vi.spyOn(io, 'disconnect')
    const shellEl = get().shellRef.value
    const removeListenerSpy = vi.spyOn(shellEl, 'removeEventListener')
    wrapper.unmount()
    expect(disconnectSpy).toHaveBeenCalled()
    expect(removeListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})
