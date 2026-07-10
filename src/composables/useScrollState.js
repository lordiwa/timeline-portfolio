// src/composables/useScrollState.js
// Composable núcleo del scroll shell de Phase 1.
//
// Expone:
//   - activeChapter (ref<number>, readonly) — chapter activo según IntersectionObserver
//   - scrollProgress (ref<number 0..1>, readonly) — progreso de scroll dentro del shell
//   - scrollToChapter(N, behavior) — navegación programática
//
// Setup pattern crítico (PATTERN A del executor brief):
//   El composable se instancia en App.vue durante setup() ANTES de que el :ref del
//   template haya cableado el DOM element al ref. Si hiciéramos `onMounted(() => init(shellRef.value))`
//   el ref podría seguir siendo null (race con el :ref callback). Solución correcta:
//   `watch(shellRef, ..., { immediate: true, flush: 'post' })` — se dispara cuando el
//   ref cambia de null a element, sin importar el orden del lifecycle.
//
// Deep-link `?ch=N` (PATTERN B): siempre invoca `scrollToChapter(N, 'auto')` —
// nunca `getElementById(...).scrollIntoView(...)` directo — para mantener un solo
// canonical path spy-able desde tests.

import { ref, readonly, watch, onBeforeUnmount } from 'vue'
import { useRafFn } from '@vueuse/core'

export function useScrollState(shellRef) {
  const activeChapter = ref(0)
  const scrollProgress = ref(0)

  let observer = null
  let scrollListener = null
  let idleTimer = null

  // RAF loop bajo demanda: pause/resume según haya scroll activo.
  // useRafFn de vueuse acepta { immediate: false } para no arrancar hasta el primer scroll.
  const rafCtl = useRafFn(() => {
    const el = shellRef.value
    if (!el) return
    const denom = el.scrollHeight - el.clientHeight
    scrollProgress.value = denom > 0 ? el.scrollTop / denom : 0
  }, { immediate: false })

  function handleScroll() {
    rafCtl.resume()
    clearTimeout(idleTimer)
    // 150ms tras el último scroll event → pause el RAF para no quemar CPU.
    idleTimer = setTimeout(() => rafCtl.pause(), 150)
  }

  // PATTERN B: canonical method para navegación.
  // Usa shell.scrollTo (container-level) en lugar de section.scrollIntoView para
  // evitar el conflicto conocido entre scrollIntoView + scroll-snap-stop:always +
  // scroll-snap-type:y mandatory en Chrome: cuando hay que saltar múltiples snap
  // points (ej. ch0→ch5), scrollIntoView podía quedar atrapado en un punto
  // intermedio (ch1/ch2) y requerir un segundo clic. shell.scrollTo({top: section.offsetTop})
  // apunta al contenedor directamente, sin pasar por la lógica de snap-stop.
  function scrollToChapter(N, behavior = 'smooth') {
    const shell = shellRef.value
    const section = document.getElementById(`chapter-${N}`)
    if (!shell || !section) return
    shell.scrollTo({ top: section.offsetTop, behavior })
  }

  function parseInitialChapter() {
    // Sin deep-link la historia empieza por el principio: ch0 (1995), que además
    // empalma con el boot BIOS. (El default 3 era un atajo de desarrollo de ch3
    // que se quedó pegado — bug reportado por Rafael 2026-07-10.)
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('ch')
    if (raw === null || raw === '') return 0
    const N = Number(raw)
    if (!Number.isInteger(N) || N < 0 || N > 6) return 0
    return N
  }

  function initObserver(el) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          const N = Number(entry.target.dataset.chapter)
          if (Number.isInteger(N)) activeChapter.value = N
        }
      }
    }, { root: el, threshold: [0.6] })
    el.querySelectorAll('[data-chapter]').forEach(s => observer.observe(s))
  }

  function maybeApplyDeepLink() {
    const initial = parseInitialChapter()
    // Doble RAF: deja que el browser termine snap layout antes de scrollIntoView.
    // Está aquí (no dentro de scrollToChapter) porque otros callers
    // (tick click, keyboard) NO deben pagar 2 frames de latencia.
    //
    // Fix landing desync (2026-07-09): behavior 'auto' NO es "jump instantáneo" —
    // scrollIntoView({behavior:'auto'}) consulta el CSS scroll-behavior del
    // contenedor, y .scroll-shell declara `scroll-behavior: smooth` (App.vue).
    // Resultado: el landing 0→ch3 era un viaje ANIMADO de ~2s interrumpible
    // (cualquier layout/snap lo cortaba a mitad → contenido ch0 con theme ch3).
    // 'instant' fuerza el salto en un frame, inmune al CSS smooth — la intención
    // original documentada de este deep-link.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToChapter(initial, 'instant')
      })
    })
  }

  // PATTERN A: setup reactivo vía watch, NO onMounted.
  const stopWatch = watch(
    shellRef,
    (el) => {
      if (!el) return
      initObserver(el)
      scrollListener = handleScroll
      el.addEventListener('scroll', scrollListener, { passive: true })
      maybeApplyDeepLink()
    },
    { immediate: true, flush: 'post' }
  )

  onBeforeUnmount(() => {
    observer?.disconnect()
    if (scrollListener && shellRef.value) {
      shellRef.value.removeEventListener('scroll', scrollListener)
    }
    rafCtl.pause()
    clearTimeout(idleTimer)
    stopWatch()
  })

  return {
    activeChapter: readonly(activeChapter),
    scrollProgress: readonly(scrollProgress),
    scrollToChapter,
  }
}
