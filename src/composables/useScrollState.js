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

// TASK-014: thresholds finos para el IntersectionObserver de activeChapter.
// Con un solo threshold (el [0.6] shipped) el callback SOLO se dispara
// cuando la ratio target/root cruza 0.6 — para una sección multi-viewport
// (mecanismo nuevo, ScrollShell.vue `[data-viewports]`) esa ratio nunca
// llega a 0.6 porque intersectionRatio divide por la altura TOTAL del
// target, no del root, así que con un solo threshold el observer casi no
// re-dispara mientras la sección alta está en pantalla. Un array fino
// garantiza que el callback se re-evalúe con frecuencia suficiente en
// cualquier altura de sección; la decisión real de "activo" la toma
// `coverageOf()` más abajo, no el cruce de threshold en sí.
//
// MEDIUM (ronda de corrección de review): los thresholds son SIEMPRE
// target-relative (spec IntersectionObserver — cada valor se compara contra
// intersectionRatio, que divide por la altura del target). Eso significa
// que la granularidad de re-disparo, medida en px de scroll del ROOT, es
// `alturaTarget * pasoThreshold` — con un target de N viewports esa
// granularidad crece linealmente con N. El array [0.6] shipped medía 21
// pasos (0, 0.05, ..., 1) → para N=1 el paso es 0.05*1viewport = fino, pero
// para N=5 el paso es 0.05*5viewports = 25% de un viewport (~110px tarde
// para cruzar 0.6). Subir de 21 a 101 pasos (0, 0.01, ..., 1) reduce ese
// paso a 1/5 sin cambiar NADA para N=1 — el navegador ya colapsa (coalesce)
// los disparos de IntersectionObserver a como mucho uno por frame, así que
// más pasos no cuesta más callbacks reales, sólo permite que el que SÍ se
// dispara por frame esté más cerca del cruce real de coverageOf() >= 0.6.
// CONDICIÓN DURA verificada: 0.6 = 60/100 sigue siendo un valor EXACTO del
// array (igual que 12/20 lo era antes), así que el momento del flip de
// activeChapter para los 7 capítulos de 1 viewport de hoy queda IDÉNTICO al
// shipped — ver tests/composables/useScrollState.test.js.
const OBSERVER_THRESHOLDS = Array.from({ length: 101 }, (_, i) => i / 100)

// coverageOf(entry) — TASK-014: cuánto del VIEWPORT (root), no del target,
// cubre esta sección. `entry.intersectionRatio` (spec IntersectionObserver)
// siempre divide por la altura del TARGET: para una sección de 1 viewport
// eso coincide numéricamente con la cobertura del root (misma altura), pero
// para una sección multi-viewport (ScrollShell.vue `[data-viewports]`)
// jamás alcanza 0.6 aunque cubra el 100% del viewport, porque el target mide
// varias pantallas. `intersectionRect`/`rootBounds` (ambos parte estándar de
// IntersectionObserverEntry) permiten calcular la cobertura real del root;
// si no están disponibles (mocks de test más simples) cae a intersectionRatio,
// que es exacto para el caso de 1 viewport — cero cambio de comportamiento
// para los 7 capítulos shipped hoy.
//
// LOW (ronda de corrección de review): esta función es height-only — usa
// `rect.height / root.height` e ignora la intersección horizontal. Es una
// asunción segura HOY porque cada `.chapter-section` mide `width: 100%` y
// `.scroll-shell` declara `overflow-x: hidden` (ScrollShell.vue), así que
// la intersección horizontal siempre es completa (0% o 100%, nunca parcial)
// para cualquier sección de capítulo. Si algún capítulo futuro introduce
// scroll horizontal propio dentro de una sección, esta función necesita
// revisarse para incorporar el eje X.
function coverageOf(entry) {
  const rect = entry.intersectionRect
  const root = entry.rootBounds
  if (rect && root && typeof root.height === 'number' && root.height > 0) {
    return rect.height / root.height
  }
  return entry.intersectionRatio
}

export function useScrollState(shellRef) {
  const activeChapter = ref(0)
  const scrollProgress = ref(0)

  let observer = null
  let scrollListener = null
  let idleTimer = null

  // TASK-043 ronda 2 (ver JSDoc completo junto a scrollToChapter): estado del
  // "salto en vuelo" con snap apagado, a nivel de COMPOSABLE (no por-llamada).
  // { origSnap, scrollListener, scrollendListener, debounceTimer, safetyTimer } | null.
  // Compartido entre todas las llamadas a scrollToChapter de esta instancia
  // (tick clicks, deep-link, navigate() de ScrollShell) para poder detectar
  // llamadas superpuestas — ver HIGH-1 del review de ronda 1.
  let pendingRestore = null

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
  //
  // TASK-043 (2026-09-28, reportado por wrecker en m4to.com): el fix de arriba
  // (2026-07-10) ya no alcanza desde que ch3 pasó a multi-viewport (TASK-014,
  // 2026-07-27). `.chapter-section[data-viewports]` sigue siendo UN solo snap
  // point (`scroll-snap-align:start` + `scroll-snap-stop:always`, ver
  // ScrollShell.vue), pero ahora mide N*100dvh en vez de 1.
  //
  // HIPÓTESIS DE CAUSA (NO confirmada con medición en vivo — ver nota de
  // ronda 2 de review, 2026-09-29): con `scroll-snap-type:y mandatory` en el
  // shell, `stop:always` podría tratarse como una posta obligatoria para un
  // scrollTo() que tiene que ATRAVESAR ese punto (ej. ch2→ch5, ch3→ch4),
  // cortando el viaje en el borde de entrada de ch3 sin que el navegador lo
  // retome solo — consistente con el síntoma reportado por wrecker (highlight
  // avanza, `shell.scrollTop` queda clavado en el paso 1/8). Una medición en
  // Chrome real del código VIEJO (snap activo) para ch2→ch5 dio 1659ms sin
  // trabarse, así que esta hipótesis específica de "todo cruce de ch3 se
  // corta" NO quedó confirmada — puede ser un caso más acotado (combinación
  // con otro estado, viewport/timing específico) que no se reprodujo en esa
  // única medición. El fix de abajo es defensivo: apagar el snap durante
  // cualquier salto programático no tiene downside conocido (el snap se
  // restaura apenas el shell llega a destino, ver más abajo) y cubre la
  // hipótesis sin depender de reproducirla exactamente.
  //
  // Fix: apagar `scroll-snap-type` en el shell ANTES de scrollTo() y
  // restaurarlo cuando el scroll termina. Sin snap activo durante el viaje,
  // `scrollTo()` nativo (con su propia curva 'smooth') no puede quedar
  // atrapado en ningún snap point intermedio — el motor vuelve a snappear
  // normal (para wheel/touch/teclado) en cuanto el shell llega a destino. No
  // toca Chapter3Content.vue/ch3Progress.js: applyProgress() ahí SOLO lee
  // shell.scrollTop (listener pasivo), nunca lo escribe, así que no compite
  // con este scrollTo() en vuelo.
  //
  // RONDA 2 (HIGH-1 del review): el estado del "salto en vuelo" vive en
  // `pendingRestore`, a nivel de COMPOSABLE — no capturado por closure en cada
  // llamada. La versión de ronda 1 recapturaba `prevSnap` (ya 'none' en ese
  // momento) y acumulaba un listener+timer por cada llamada si dos saltos se
  // superponían (doble click en el timeline, o autorepeat de flecha vía
  // `navigate()` en ScrollShell.vue) — el snap quedaba apagado para siempre y
  // el restore del primer salto podía reactivarlo a mitad del segundo: el
  // bug original, pero autoinflingido por el propio fix. Ahora: si ya hay un
  // salto en vuelo, este NUEVO salto cancela sus listeners/timers (sin
  // restaurar el estilo — `cancelPendingListeners()`) y sigue usando el
  // `origSnap` que capturó el PRIMER salto del lote; sólo se restaura al
  // valor original de antes de que empezara el lote entero.
  //
  // MEDIUM-1: detección de fin primaria = 'scrollend' nativo cuando existe
  // (restore inmediato), o inactividad de scroll (debounce 150ms tras el
  // último evento 'scroll' del shell) donde no existe. Un timeout fijo NO
  // sirve de detección primaria — un salto largo sin 'scrollend' (Safari)
  // podría seguir animando más allá de un timeout corto y quedar reactivado
  // el snap a mitad de vuelo. El timer de 3000ms es sólo la red de
  // seguridad final (navegador que nunca vuelve a disparar 'scroll' ni
  // 'scrollend', o excepción no prevista).
  //
  // MEDIUM-3 (ronda 3 de review): el debounce de 'scroll' y 'scrollend' son
  // ramas EXCLUYENTES, no se registran los dos juntos (ver el `if/else`
  // dentro de scrollToChapter, más abajo). Con 'scrollend' disponible, un
  // main thread trabado más de 150ms en pleno viaje (ej. `createGame` de
  // ch6 a mitad de un salto largo, o `applyProgress` de ch3 en una máquina
  // lenta) retrasa el próximo evento 'scroll' sin que el scroll real haya
  // terminado — el debounce de 150ms disparaba igual y restauraba el snap
  // con la animación todavía en curso, el mismo bug que este fix existe
  // para evitar. 'scrollend' no tiene ese problema: lo dispara el
  // navegador cuando el compositor confirma el fin real del scroll,
  // inmune a que el hilo principal se trabe.
  //
  // LOW-1: si el shell YA está a menos de 1px del destino (ej. el deep-link
  // inicial a ch0 cuando scrollTop ya es 0), no se toca el snap para nada —
  // sin este guard, ese caso dejaba el snap en 'none' hasta que venciera el
  // fallback, sin que hubiera scroll real que lo restaurara antes.
  function cancelPendingListeners() {
    if (!pendingRestore) return
    const shell = shellRef.value
    if (shell) {
      if (pendingRestore.scrollListener) {
        shell.removeEventListener('scroll', pendingRestore.scrollListener)
      }
      if (pendingRestore.scrollendListener) {
        shell.removeEventListener('scrollend', pendingRestore.scrollendListener)
      }
    }
    clearTimeout(pendingRestore.debounceTimer)
    clearTimeout(pendingRestore.safetyTimer)
  }

  function finishPendingRestore() {
    if (!pendingRestore) return
    const shell = shellRef.value
    const { origSnap } = pendingRestore
    cancelPendingListeners()
    if (shell) shell.style.scrollSnapType = origSnap
    pendingRestore = null
  }

  function scrollToChapter(N, behavior = 'smooth') {
    const shell = shellRef.value
    const section = document.getElementById(`chapter-${N}`)
    if (!shell || !section) return

    const target = section.offsetTop

    // LOW-1: ya estamos ahí — no hay viaje que proteger, no tocar el snap.
    if (Math.abs(shell.scrollTop - target) < 1) {
      shell.scrollTo({ top: target, behavior })
      return
    }

    if (pendingRestore) {
      // Salto superpuesto: cancelamos la detección de fin del salto anterior
      // SIN restaurar el estilo — seguimos con el snap apagado y el mismo
      // origSnap capturado al principio del lote (HIGH-1).
      cancelPendingListeners()
    } else {
      pendingRestore = { origSnap: shell.style.scrollSnapType }
      shell.style.scrollSnapType = 'none'
    }

    // MEDIUM-3 (ronda 3 de review): el debounce de 'scroll' (150ms) SOLO se
    // registra cuando el navegador NO tiene 'scrollend'. Con 'scrollend'
    // disponible, el camino es scrollend + la red de seguridad de 3000ms —
    // sin el debounce de por medio. Motivo: si el main thread se traba más
    // de 150ms en pleno viaje (ej. `createGame` de ch6 a mitad de un salto
    // largo, o `applyProgress` de ch3 en una máquina lenta), el debounce
    // puede vencer con la animación de scroll TODAVÍA en curso — el próximo
    // evento 'scroll' llega tarde porque el hilo estuvo ocupado, no porque
    // el scroll haya terminado — y restaura el snap en vuelo, exactamente el
    // bug que este fix existe para evitar. 'scrollend' no tiene ese problema:
    // es el propio navegador confirmando el fin real del scroll, inmune a
    // que el main thread se trabe (el estado de scroll lo lleva el
    // compositor). Donde 'scrollend' no existe (Safari a la fecha de este
    // fix), el debounce sigue siendo la única señal de progreso disponible
    // — mejor que depender solo del timer fijo de 3000ms, que en un salto
    // largo puede vencer con el scroll todavía en curso.
    if ('onscrollend' in window) {
      pendingRestore.scrollendListener = finishPendingRestore
      shell.addEventListener('scrollend', finishPendingRestore, { once: true })
    } else {
      pendingRestore.scrollListener = () => {
        clearTimeout(pendingRestore.debounceTimer)
        pendingRestore.debounceTimer = setTimeout(finishPendingRestore, 150)
      }
      shell.addEventListener('scroll', pendingRestore.scrollListener, { passive: true })
    }

    pendingRestore.safetyTimer = setTimeout(finishPendingRestore, 3000)

    shell.scrollTo({ top: target, behavior })
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
        if (entry.isIntersecting && coverageOf(entry) >= 0.6) {
          const N = Number(entry.target.dataset.chapter)
          if (Number.isInteger(N)) activeChapter.value = N
        }
      }
    }, { root: el, threshold: OBSERVER_THRESHOLDS })
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
    // TASK-043 ronda 2: si el componente se desmonta con un salto en vuelo
    // (listeners de scroll/scrollend + timers de pendingRestore), limpiarlos
    // explícitamente — sin esto sobreviven al unmount (el shell puede seguir
    // vivo si sólo se reemplaza el composable, ej. en tests) y el timer de
    // 3s dispara sobre un shellRef ya null/desactualizado.
    finishPendingRestore()
    stopWatch()
  })

  return {
    activeChapter: readonly(activeChapter),
    scrollProgress: readonly(scrollProgress),
    scrollToChapter,
  }
}
