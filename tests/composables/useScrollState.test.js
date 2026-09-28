// tests/composables/useScrollState.test.js
// Tests del composable useScrollState.
//
// Cobertura:
// - exports + interfaz pública (refs readonly + scrollToChapter)
// - default activeChapter=0, default scrollProgress=0
// - deep-link ?ch=N → scrollToChapter(N, 'instant') vía spy sobre HTMLElement.prototype.scrollIntoView
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

// Helper: verifica que shell.scrollTo fue llamado con el behavior esperado.
// scrollToChapter usa container.scrollTo({top: section.offsetTop, behavior}) —
// en JSDOM offsetTop siempre es 0, verificamos solo el behavior (es el contrato).
function assertNavigatedTo(N, behavior) {
  const section = document.getElementById(`chapter-${N}`)
  expect(section).not.toBeNull()
  const shell = document.querySelector('.scroll-shell')
  expect(shell).not.toBeNull()
  expect(shell.scrollTo).toHaveBeenCalledWith({ top: section.offsetTop, behavior })
}

describe('useScrollState', () => {
  // scrollIntoView ya está instalado como vi.fn() global en tests/setup.js.
  // Aquí solo limpiamos sus llamadas entre tests con mockClear en beforeEach.

  beforeEach(() => {
    // Reset IntersectionObserver mock instances entre tests.
    if (globalThis.MockIntersectionObserver) {
      globalThis.MockIntersectionObserver.reset()
    }
    // Limpiamos las llamadas previas de ambos mocks de scroll (preservando la misma función spy).
    HTMLElement.prototype.scrollIntoView.mockClear()
    HTMLElement.prototype.scrollTo.mockClear()
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
  it('with a null ref, returns readonly refs (activeChapter=0, scrollProgress=0) and does NOT wire IO yet', () => {
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
    expect(captured.activeChapter.value).toBe(0)
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
    assertNavigatedTo(0, 'instant')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 4: deep-link ?ch=99 (out of range) → fallback ch0
  // ─────────────────────────────────────────────────────────────────────────
  it('deep-link ?ch=99 falls back to scrollToChapter(0, "auto")', async () => {
    window.history.replaceState({}, '', '/?ch=99')
    const { wrapper } = makeWrapper()
    await waitForDeepLink()
    assertNavigatedTo(0, 'instant')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 5: deep-link ?ch=abc (invalid) → fallback ch0
  // ─────────────────────────────────────────────────────────────────────────
  it('deep-link ?ch=abc falls back to scrollToChapter(0, "auto")', async () => {
    window.history.replaceState({}, '', '/?ch=abc')
    const { wrapper } = makeWrapper()
    await waitForDeepLink()
    assertNavigatedTo(0, 'instant')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 6: deep-link ?ch= (empty) → fallback ch0
  // ─────────────────────────────────────────────────────────────────────────
  it('deep-link ?ch= (empty) falls back to scrollToChapter(0, "auto")', async () => {
    window.history.replaceState({}, '', '/?ch=')
    const { wrapper } = makeWrapper()
    await waitForDeepLink()
    assertNavigatedTo(0, 'instant')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 7: no query string → default ch0 (la historia empieza por el principio)
  // ─────────────────────────────────────────────────────────────────────────
  it('no query string defaults to scrollToChapter(0, "auto")', async () => {
    window.history.replaceState({}, '', '/')
    const { wrapper } = makeWrapper()
    await waitForDeepLink()
    assertNavigatedTo(0, 'instant')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 8: scrollToChapter(N, 'smooth') usa shell.scrollTo (container-level)
  //
  // Fix bug nav ch5 (2026-07-10): scrollIntoView + scroll-snap-stop:always
  // atrapaba el scroll en snap points intermedios al saltar varios capítulos.
  // shell.scrollTo({top: section.offsetTop, behavior}) apunta al contenedor
  // directamente y es inmune a ese conflicto.
  // ─────────────────────────────────────────────────────────────────────────
  it('scrollToChapter(2, "smooth") calls shell.scrollTo with {behavior:"smooth"} on the scroll container', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    // Limpiamos el spy del deep-link inicial.
    HTMLElement.prototype.scrollTo.mockClear()
    const shell = document.querySelector('.scroll-shell')
    // offsetTop de las sections es siempre 0 en JSDOM (sin layout real) — el
    // guard LOW-1 (ver TASK-043 abajo) trataría cualquier destino como
    // "ya estamos ahí" si scrollTop también fuera 0, así que lo alejamos.
    shell.scrollTop = 999
    get().state.scrollToChapter(2, 'smooth')
    expect(shell.scrollTo).toHaveBeenCalledTimes(1)
    expect(shell.scrollTo).toHaveBeenCalledWith({ top: expect.any(Number), behavior: 'smooth' })
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TASK-043 (2026-09-28, ronda 2 tras review): lock de regresión para el
  // salto a través de ch3 multi-viewport pineado. `.chapter-section[data-viewports]`
  // (ch3, TASK-014) sigue siendo un único snap point (`scroll-snap-align:start`
  // + `scroll-snap-stop:always`) pero mide N*100dvh — el fix apaga
  // `scroll-snap-type` en el shell durante cualquier salto programático y lo
  // restaura cuando el scroll se asienta (ver JSDoc de scrollToChapter para
  // la hipótesis de causa, no confirmada con medición en vivo, y el porqué
  // del fix defensivo de todos modos).
  //
  // Los tests arrancan desde el estado real de prod: `shell.style.scrollSnapType`
  // vacío (el snap vive en la hoja de estilos, `.scroll-shell` en ScrollShell.vue
  // — nunca se fija inline salvo por este mismo fix), NO 'y mandatory' inline
  // (eso NO es el estado shipped, corregido en esta ronda).
  // ─────────────────────────────────────────────────────────────────────────
  it('TASK-043: scrollToChapter apaga scroll-snap-type durante el viaje y lo restaura en "scrollend"', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    const shell = document.querySelector('.scroll-shell')
    expect(shell.style.scrollSnapType).toBe('')
    shell.scrollTop = 999 // lejos del destino (offsetTop=0 en JSDOM)

    get().state.scrollToChapter(5, 'smooth')

    // Durante el viaje: snap apagado — así un scrollTo() que atraviesa el
    // snap point de ch3 (N*100dvh, stop:always) no se corta en su borde.
    expect(shell.style.scrollSnapType).toBe('none')

    shell.dispatchEvent(new Event('scrollend'))

    // Al terminar: snap restaurado AL VALOR ORIGINAL (vacío, no 'none').
    expect(shell.style.scrollSnapType).toBe('')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TASK-043 (a): dos llamadas superpuestas + un solo 'scrollend' final
  // restauran el valor ORIGINAL de antes del lote — no 'none' (HIGH-1: la
  // versión de ronda 1 recapturaba 'none' como "original" en la segunda
  // llamada porque el estilo ya estaba apagado por la primera).
  // ─────────────────────────────────────────────────────────────────────────
  it('TASK-043 (a): dos scrollToChapter seguidos + un "scrollend" restauran el valor original, no "none"', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    const shell = document.querySelector('.scroll-shell')
    shell.scrollTop = 999

    get().state.scrollToChapter(4, 'smooth')
    expect(shell.style.scrollSnapType).toBe('none')
    get().state.scrollToChapter(6, 'smooth') // segundo click, primero sigue en vuelo

    expect(shell.style.scrollSnapType).toBe('none')
    shell.dispatchEvent(new Event('scrollend'))

    expect(shell.style.scrollSnapType).toBe('')
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Helper TASK-043 (ronda 3, MEDIUM-3): fuerza temporalmente la rama SIN
  // 'onscrollend' en window (ej. Safari) para poder testear el debounce de
  // 'scroll' — JSDOM trae 'onscrollend' en window por default, así que sin
  // este helper scrollToChapter toma siempre la rama scrollend/3000ms.
  // Restaura el descriptor original al final, sea cual sea el resultado.
  // ─────────────────────────────────────────────────────────────────────────
  function withoutScrollend(fn) {
    const desc = Object.getOwnPropertyDescriptor(window, 'onscrollend')
    delete window.onscrollend
    expect('onscrollend' in window).toBe(false)
    try {
      return fn()
    } finally {
      if (desc) Object.defineProperty(window, 'onscrollend', desc)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TASK-043 (b) (ronda 3, MEDIUM-3): SIN 'onscrollend' — el debounce/timer
  // del PRIMER salto no toca el estilo durante el segundo. Si el debounce de
  // 150ms del primero disparara igual (bug de ronda 1: no cancelaba su
  // propio timer al ser reemplazado), restauraría el snap a mitad del
  // segundo salto en vuelo.
  // ─────────────────────────────────────────────────────────────────────────
  it('TASK-043 (b) sin onscrollend: el debounce del primer salto no restaura el estilo mientras el segundo sigue en vuelo', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    const shell = document.querySelector('.scroll-shell')
    shell.scrollTop = 999

    withoutScrollend(() => {
      get().state.scrollToChapter(4, 'smooth')
      shell.dispatchEvent(new Event('scroll')) // scroll real del primer salto en curso

      get().state.scrollToChapter(6, 'smooth') // segundo click cancela el debounce del primero

      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      try {
        // Si el debounce del PRIMER salto sobreviviera, dispararía acá (150ms
        // desde su propio evento 'scroll') y restauraría el estilo de más.
        vi.advanceTimersByTime(150)
        expect(shell.style.scrollSnapType).toBe('none')
      } finally {
        vi.useRealTimers()
      }
    })
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIUM-3 (ronda 3): con 'onscrollend' disponible, un main thread trabado
  // más de 150ms en pleno viaje (createGame de ch6, applyProgress de ch3 en
  // máquina lenta) NO debe restaurar el snap de más — el debounce de
  // 'scroll' directamente no se registra en esta rama, así que ni siquiera
  // un evento 'scroll' tardío puede dispararlo.
  // ─────────────────────────────────────────────────────────────────────────
  it('MEDIUM-3: con onscrollend, un evento "scroll" NO restaura el estilo (el debounce de 150ms no se registra en esta rama)', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    const shell = document.querySelector('.scroll-shell')
    shell.scrollTop = 999
    expect('onscrollend' in window).toBe(true) // rama default de JSDOM

    get().state.scrollToChapter(4, 'smooth')
    expect(shell.style.scrollSnapType).toBe('none')

    // Simula el main thread trabado: el scroll real sigue en curso pero un
    // evento 'scroll' tardío llega solo — con la versión de ronda 2 (debounce
    // siempre registrado) esto hubiera arrancado un timer de 150ms que,
    // sin más eventos, restauraría el snap con la animación todavía viva.
    shell.dispatchEvent(new Event('scroll'))
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      vi.advanceTimersByTime(200) // > 150ms del debounce viejo
      expect(shell.style.scrollSnapType).toBe('none')
    } finally {
      vi.useRealTimers()
    }

    // El camino real de esta rama sigue siendo scrollend (o la red de 3s).
    shell.dispatchEvent(new Event('scrollend'))
    expect(shell.style.scrollSnapType).toBe('')

    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TASK-043 (c): no se acumulan listeners/timers entre llamadas superpuestas
  // — cada nueva llamada cancela los del salto anterior antes de agregar los
  // propios. Con 'onscrollend' (rama default de JSDOM) sólo se registra
  // 'scrollend'; forzando la rama sin 'onscrollend' (MEDIUM-3) sólo se
  // registra 'scroll' — nunca los dos juntos (spy de add/removeEventListener).
  // ─────────────────────────────────────────────────────────────────────────
  it('TASK-043 (c) con onscrollend: llamadas superpuestas no acumulan listeners de "scrollend" (y nunca registran "scroll")', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    const shell = document.querySelector('.scroll-shell')
    shell.scrollTop = 999
    const addSpy = vi.spyOn(shell, 'addEventListener')
    const removeSpy = vi.spyOn(shell, 'removeEventListener')

    get().state.scrollToChapter(4, 'smooth')
    get().state.scrollToChapter(5, 'smooth')
    get().state.scrollToChapter(6, 'smooth')

    const addScrollCalls = addSpy.mock.calls.filter(([type]) => type === 'scroll').length
    const addScrollendCalls = addSpy.mock.calls.filter(([type]) => type === 'scrollend').length
    const removeScrollendCalls = removeSpy.mock.calls.filter(([type]) => type === 'scrollend').length
    // Rama con scrollend: JAMÁS se registra 'scroll'.
    expect(addScrollCalls).toBe(0)
    // 3 llamadas → 3 'scrollend' listeners agregados, pero los 2 primeros
    // deben haberse removido al ser reemplazados (sólo el último queda vivo).
    expect(addScrollendCalls).toBe(3)
    expect(removeScrollendCalls).toBe(2)

    shell.dispatchEvent(new Event('scrollend'))
    // El listener final también se limpia al asentarse el último salto.
    expect(removeSpy.mock.calls.filter(([type]) => type === 'scrollend').length).toBe(3)

    wrapper.unmount()
  })

  it('TASK-043 (c) sin onscrollend: llamadas superpuestas no acumulan listeners de "scroll" (y nunca registran "scrollend")', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    const shell = document.querySelector('.scroll-shell')
    shell.scrollTop = 999

    withoutScrollend(() => {
      const addSpy = vi.spyOn(shell, 'addEventListener')
      const removeSpy = vi.spyOn(shell, 'removeEventListener')

      get().state.scrollToChapter(4, 'smooth')
      get().state.scrollToChapter(5, 'smooth')
      get().state.scrollToChapter(6, 'smooth')

      const addScrollendCalls = addSpy.mock.calls.filter(([type]) => type === 'scrollend').length
      const addScrollCalls = addSpy.mock.calls.filter(([type]) => type === 'scroll').length
      const removeScrollCalls = removeSpy.mock.calls.filter(([type]) => type === 'scroll').length
      // Rama sin scrollend: JAMÁS se registra 'scrollend'.
      expect(addScrollendCalls).toBe(0)
      // 3 llamadas → 3 'scroll' listeners agregados, pero los 2 primeros
      // deben haberse removido al ser reemplazados (sólo el último queda vivo).
      expect(addScrollCalls).toBe(3)
      expect(removeScrollCalls).toBe(2)

      // Fakeamos ANTES de dispatchear — el setTimeout(150ms) del debounce se
      // agenda dentro del listener de 'scroll', tiene que quedar faked para
      // poder avanzarlo sincrónicamente.
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      try {
        shell.dispatchEvent(new Event('scroll'))
        vi.advanceTimersByTime(150)
      } finally {
        vi.useRealTimers()
      }
      // El listener final también se limpia al asentarse el último salto
      // (esta vez vía debounce, no scrollend).
      expect(removeSpy.mock.calls.filter(([type]) => type === 'scroll').length).toBe(3)
    })

    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TASK-043 (d): destino igual a la posición actual (LOW-1) → el estilo no
  // se toca en absoluto — sin este guard, el deep-link inicial a ch0 (scroll
  // ya en 0) dejaba el snap en 'none' hasta que venciera el fallback.
  // ─────────────────────────────────────────────────────────────────────────
  it('TASK-043 (d): destino == posición actual no toca scroll-snap-type', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    const shell = document.querySelector('.scroll-shell')
    shell.scrollTop = 0 // == offsetTop del destino (siempre 0 en JSDOM)
    expect(shell.style.scrollSnapType).toBe('')

    get().state.scrollToChapter(0, 'smooth')

    expect(shell.style.scrollSnapType).toBe('')
    // El scroll igual se pide (no-op real, pero el contrato de la llamada
    // no cambia) — sólo el manejo del snap se salta.
    expect(shell.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TASK-043: red de seguridad — sin 'scrollend' ni más eventos 'scroll' (ej.
  // Safari, o un navegador que deja de disparar 'scroll' a mitad de camino),
  // el snap se restaura igual vía el timer largo de 3s, nunca queda apagado
  // para siempre.
  // ─────────────────────────────────────────────────────────────────────────
  it('TASK-043: sin "scrollend" ni más "scroll", el timer de red de seguridad (3s) restaura scroll-snap-type', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    const shell = document.querySelector('.scroll-shell')
    shell.scrollTop = 999

    // Fakeamos setTimeout/clearTimeout SOLO acá, después del mount+deep-link
    // (que ya se resolvió en tiempo real arriba) — así no interferimos con
    // flushPromises()/RAF de @vue/test-utils durante el setup del composable.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      get().state.scrollToChapter(4, 'smooth')
      expect(shell.style.scrollSnapType).toBe('none')

      vi.advanceTimersByTime(2999)
      expect(shell.style.scrollSnapType).toBe('none')

      vi.advanceTimersByTime(1)
      expect(shell.style.scrollSnapType).toBe('')
    } finally {
      vi.useRealTimers()
    }

    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 9: IO callback con intersectionRatio ≥ 0.6 actualiza activeChapter
  // ─────────────────────────────────────────────────────────────────────────
  it('IO callback with intersectionRatio >= 0.6 updates activeChapter', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    expect(get().state.activeChapter.value).toBe(0)
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
    expect(get().state.activeChapter.value).toBe(0)
    const io = globalThis.MockIntersectionObserver.instances[0]
    io.triggerEntries([
      {
        isIntersecting: true,
        intersectionRatio: 0.4,
        target: { dataset: { chapter: '5' } },
      },
    ])
    await flushPromises()
    expect(get().state.activeChapter.value).toBe(0) // sin cambio
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TASK-014 T12: capítulo multi-viewport (ScrollShell.vue `[data-viewports]`)
  // con intersectionRatio bajo (0.3 — 30% del target de 3 viewports es 1
  // viewport, matemáticamente < 0.6) PERO cobertura de root 1.0 (la sección
  // llena el viewport entero) → activeChapter SÍ debe actualizar. Antes de
  // TASK-014 esto no pasaba nunca: el shell dependía de intersectionRatio
  // (relativo al target) y una sección de varios viewports jamás cruzaba 0.6.
  // ─────────────────────────────────────────────────────────────────────────
  it('TASK-014: sección multi-viewport con intersectionRatio bajo pero coverage de root 1.0 SÍ actualiza activeChapter', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    expect(get().state.activeChapter.value).toBe(0)
    const io = globalThis.MockIntersectionObserver.instances[0]
    io.triggerEntries([
      {
        isIntersecting: true,
        intersectionRatio: 0.3, // 1 de 3 viewports del target — bajo a propósito
        intersectionRect: { height: 735 }, // el root entero está cubierto
        rootBounds: { height: 735 },
        target: { dataset: { chapter: '4' } },
      },
    ])
    await flushPromises()
    expect(get().state.activeChapter.value).toBe(4)
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TASK-014 T13: coverage de root bajo (< 0.6) NO actualiza activeChapter,
  // incluso si intersectionRatio (target-relative) fuera engañosamente alto
  // — la decisión real la toma coverageOf(), no intersectionRatio a secas.
  // ─────────────────────────────────────────────────────────────────────────
  it('TASK-014: coverage de root < 0.6 NO actualiza activeChapter aunque isIntersecting sea true', async () => {
    const { wrapper, get } = makeWrapper()
    await waitForDeepLink()
    expect(get().state.activeChapter.value).toBe(0)
    const io = globalThis.MockIntersectionObserver.instances[0]
    io.triggerEntries([
      {
        isIntersecting: true,
        intersectionRatio: 0.9,
        intersectionRect: { height: 200 }, // solo ~27% del root visible
        rootBounds: { height: 735 },
        target: { dataset: { chapter: '5' } },
      },
    ])
    await flushPromises()
    expect(get().state.activeChapter.value).toBe(0) // sin cambio
    wrapper.unmount()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIUM (ronda de corrección de review): el array de thresholds pasado al
  // IntersectionObserver real (no simulado — leído de `io.options.threshold`,
  // lo que el composable REALMENTE le pasó al constructor) debe tener paso
  // 0.01 (101 valores) en vez de 0.05 (21 valores), para que la granularidad
  // de re-disparo en capítulos multi-viewport no se degrade con N (ver
  // comentario largo en useScrollState.js junto a OBSERVER_THRESHOLDS).
  // CONDICIÓN DURA: 0.6 tiene que seguir siendo un valor EXACTO del array —
  // si dejara de serlo, el momento del flip de activeChapter para los 7
  // capítulos de 1 viewport de hoy (todos target-relative = root-relative)
  // se movería respecto al shipped.
  // ─────────────────────────────────────────────────────────────────────────
  it('MEDIUM fix: IntersectionObserver se construye con 101 thresholds (paso 0.01) e incluye 0.6 exacto', async () => {
    const { wrapper } = makeWrapper()
    await waitForDeepLink()
    const io = globalThis.MockIntersectionObserver.instances[0]
    const thresholds = io.options.threshold
    expect(thresholds).toHaveLength(101)
    expect(thresholds[0]).toBe(0)
    expect(thresholds[thresholds.length - 1]).toBe(1)
    expect(thresholds.some((t) => Math.abs(t - 0.6) < 1e-9)).toBe(true)
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
