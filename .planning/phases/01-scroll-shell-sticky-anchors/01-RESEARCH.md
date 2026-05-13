# Phase 1: Scroll Shell + Sticky Anchors — Research

**Researched:** 2026-05-12
**Domain:** Vertical scroll-snap + sticky-anchor UI infrastructure (Vue 3 + Vite, no Phaser in this phase)
**Confidence:** HIGH (todas las decisiones críticas verificadas contra MDN / Vue / VueUse docs / npm registry / WebKit Bugzilla)
**Mode:** MVP / SPIDR-aware

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01 … D-06 — Reduced-Motion Policy)

- **D-01 — Scroll snap bajo PRM:** `scroll-snap-type: y mandatory` siempre activo; bajo PRM se cambia `scroll-behavior: smooth` → `scroll-behavior: auto` (jump entre chapters, sin animación). No se cae a long-scroll plano.
- **D-02 — Swap del avatar sticky bajo PRM:** instantáneo, single-frame replace. Sin crossfade.
- **D-03 — Background morph entre eras bajo PRM:** crossfade rápido ≤ 150ms permitido (Phase 2 lo implementa). NO en Phase 1.
- **D-04 — Click-to-nav bajo PRM (timeline tick, ↑/↓, `?ch=N`):** instantáneo (`behavior: 'auto'`).
- **D-05 — HUD micro-animations bajo PRM:** transitions hover/focus ≤ 150ms mantenidas. Pulses/glows decorativos OFF.
- **D-06 — Principio rector:** ¿interaction-derived y ≤ 150ms? → permitida. ¿Auto-played / decorative? → OFF. ¿Área grande con cambio drástico? → crossfade sutil ≤ 150ms permitido.

### Claude's Discretion (resueltas en este RESEARCH.md)

- **Open-Q-A:** Runtime base (Vue/vueuse blocker). Tres caminos: upgrade Vue 3.5+, pin vueuse 10.x, o cero vueuse.
- **Open-Q-B:** Protocolo del smoke test iOS (hardware, checklist, timing, documentación, acceso desde mobile real).
- **Open-Q-C:** Phase 1 placeholder visual (3 estrategias).

### Deferred Ideas (OUT OF SCOPE)

- HUD focus styles era-themed (A11Y-03 — Phase 2).
- Scroll progress indicator separado de la timeline.
- Snap-to-mid-chapter scroll positions.
- Deep-link enriquecido URL hash `#ch-N` que actualiza al scrollear (DLINK-01/02 — v2).

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CORE-01 | ScrollShell vertical con `scroll-snap-type: y mandatory` | §Área 1 — CSS scroll-snap vertical |
| CORE-02 | 7 chapter sections coexisten en el DOM (sin Vue Router) | §Arquitectura (composición declarativa) |
| CORE-03 | `useScrollState` composable + IntersectionObserver | §Área 2 — IO pattern |
| CORE-04 | `scroll-snap-stop: always` por section | §Área 1 — scroll-snap-stop |
| CORE-05 | Default landing chapter 3; `?ch=N` override | §Área 3 — deep link |
| CORE-06 | Keyboard ↑/↓ sobre el ScrollShell focus | §Área 4 — keyboard nav |
| CORE-07 | Timeline sticky bottom con marker móvil + año + 7 ticks click-to-navigate | §Arquitectura + §Área 6 — sticky/fixed |
| CORE-08 | `100dvh` en chapters anti address-bar drift | §Área 1 — viewport units |
| CORE-09 | `prefers-reduced-motion` respetado | §Área 5 — composable PRM |
| CORE-10 | Sticky avatar slot top-left, swap reactivo | §Arquitectura + §Área 6 |
| CORE-11 | Timeline marker tracks `scrollProgress` 0..1 | §Área 2 — RAF + scroll math |
| MOB-01 | Portrait + landscape funcionales | §Área 7 — ResizeObserver |
| MOB-03 | `ResizeObserver` sobre `documentElement` (no `orientationchange`) | §Área 7 |
| iOS-01 | Stack base iOS: `scroll-snap-stop: always` + `-webkit-overflow-scrolling: touch` | §Área 1 |
| iOS-02 | Smoke test iOS confirmatorio (no bloqueante) | §Open-Q-B |
| A11Y-01 | Skip-to-content link | UI-SPEC §7.4 (locked) |
| A11Y-02 | `tabindex="0"` + keyboard nav | §Área 4 |
| A11Y-05 | PRM respetado | §Área 5 |

</phase_requirements>

---

<phase_constraints>

## Project Constraints (from CLAUDE.md)

- Comunicación en **español** con el usuario.
- Stack: Vue 3.5.34 (Composition API) + Vite 5.4 + Phaser 3.86 (Phaser **no** se carga en Phase 1).
- Sin TypeScript, sin Pinia, sin Vue Router (CLAUDE.md + REQUIREMENTS.md `Out of Scope`).
- Sin GSAP, Lenis, Locomotive Scroll en v1 (REQUIREMENTS.md `Out of Scope`).
- Resolución virtual 480×270, zoom ×3, `image-rendering: pixelated` global ya aplicado en `index.html`.
- Naming assets: `ch{N}-{descriptor}.png` en `public/assets/` (no se generan en Phase 1).
- OS dev: Windows 11 / PowerShell 5.1; paths con `\`; comandos PS.
- `vite.config.js` actual: `host: '127.0.0.1'`, `port: 5173`, `open: true`.

</phase_constraints>

---

## Summary (TL;DR)

Phase 1 construye la infraestructura de scroll vertical pura con Vue 3 + CSS scroll-snap-y + IntersectionObserver + RAF marker tracking. **Sin librerías de scroll** (CSS nativo basta). **Con `@vueuse/core` 14.3.0** — el "blocker" documentado en STATE.md ya no existe: el scaffold tiene Vue 3.5.34 instalado (caret semver `^3.4.0` resolvió a 3.5.x), por lo cual vueuse 14 es compatible directamente. La superficie de API que necesitamos de vueuse es pequeña (`usePreferredReducedMotion`, `useEventListener`, opcionalmente `useResizeObserver`) — total ~1–3 KB tree-shaken.

El UI-SPEC ya está locked: confirmamos el approach de `position: fixed` (no `sticky`) para avatar y timeline porque el overflow container es el ScrollShell, no el viewport. Aplica el caveat de WebKit (`transform` o `filter` en ancestros rompe `fixed`) — mitigación documentada abajo.

iOS no es gate. Vertical snap + `scroll-snap-stop: always` está bien soportado en Safari iOS; el bug histórico #243582 era específico de momentum horizontal. **Hay un bug nuevo (oct-2025) con `100dvh` en iOS Safari** que afecta overlays/backdrops — relevante para nuestro timeline en bottom; mitigación incluida abajo.

**Primary recommendation:** Camino A para Vue (Open-Q-A): el scaffold ya está en Vue 3.5.34 — instalar `@vueuse/core@14.3.0` directamente, sin upgrade ni pin antiguo, sin escribir composables propios. Esto desbloquea Phase 2 (`useStorage` para locale) y Phase 5 (`useEventListener` Phaser HMR boundaries) sin deuda futura.

---

## 1. Recommendations on the 3 Open Questions

### Open-Q-A — Vue runtime / vueuse blocker

**Hallazgo verificado** [VERIFIED: `npm list vue`]:

```text
mato-new-portfolio@0.0.1
+-- @vitejs/plugin-vue@5.2.4
|   `-- vue@3.5.34 deduped
`-- vue@3.5.34
```

El `package.json` declara `"vue": "^3.4.0"` pero `^3.4.0` permite cualquier `3.x.y` minor/patch ≥ 3.4.0 hasta < 4.0.0 — npm instaló 3.5.34. **No hay blocker.** `@vueuse/core@14.3.0` requiere `vue: ^3.5.0` [VERIFIED: `npm view @vueuse/core@latest peerDependencies`] y la instalación actual cumple.

**Análisis de los 3 caminos:**

| Camino | Pro | Contra | Veredicto |
|--------|-----|--------|-----------|
| **A. Vue 3.5.34 (actual) + @vueuse/core 14** | Cero migración; tree-shaking moderno; API estable; futuro Phase 2 (`useStorage` para locale persistence, `useMediaQuery` para PRM) y Phase 5 (`useEventListener` con cleanup auto) ya cubiertos | Añade ~890 KB no-empacado / ~1–3 KB tree-shaken por composable usado | **GANADOR** |
| B. Pin `@vueuse/core@10.x` | Conservador, compatible con Vue 3.4 | Vue ya está en 3.5.34 — pinear regresivamente es deuda gratis; vueuse 10 está en mantenimiento de seguridad solamente | Rechazado |
| C. Cero vueuse, composables propios | Cero dependencia | ~200 LOC adicionales (`useScrollState`, `useResizeObserver` wrapper, listener cleanup, media-query reactiva); cada composable requiere tests; reimplementa lo que vueuse ya hizo | Rechazado |

**Acción para el planner:**

1. Actualizar `package.json` → `"vue": "^3.5.0"` (refleja la realidad y previene downgrade futuro en `npm install` limpia).
2. `npm install @vueuse/core` (instala 14.3.0 latest, lo cual ya hicimos verificar).
3. No reescribir el lockfile innecesariamente.

**RECOMMENDATION: Camino A — bump `package.json` a `"vue": "^3.5.0"` (la versión real ya instalada es 3.5.34) e instalar `@vueuse/core@14.3.0`. El "blocker" de STATE.md se cierra porque la instalación real ya satisface el peer requirement; solo el manifiesto necesita reflejar la verdad. Cero re-trabajo en Phase 2/5.**

### Open-Q-B — iOS smoke test protocol

Vertical snap en iOS Safari está bien soportado [CITED: WebKit blog "Scroll Snapping with CSS Snap Points"]. El bug histórico #243582 es de **momentum horizontal** — confirmado por título textual en Bugzilla (`[iOS] CSS Scroll Snap disables momentum-based scrolling`) y por el research previo de PITFALLS.md. Con scroll vertical + `scroll-snap-stop: always` + `-webkit-overflow-scrolling: touch` el comportamiento esperado es nativo y robusto.

**Definición del protocolo:**

| Eje | Recomendación | Rationale |
|-----|---------------|-----------|
| **Hardware** | iPhone propio de Rafael preferido; iPad si está disponible | El sitio se publicará al mundo — un smoke test en hardware real es alto-ROI. Simulador NO reproduce momentum scrolling bugs [CITED: PITFALLS.md, MDN]. BrowserStack es plan B si Rafael no tiene iOS device. |
| **Acceso desde mobile** | Cambiar `vite.config.js` `host: '127.0.0.1'` → `host: true` (equivalente a `0.0.0.0`); usar IP local + abrir firewall puerto 5173 | Mobile en misma WiFi accede vía `http://<IP-LAN>:5173/` [CITED: Vite docs `server.host`]. Sin tunnel (ngrok/cloudflared) necesario — overkill para smoke test interno. |
| **Comando para descubrir IP** | `ipconfig` en PowerShell → buscar "IPv4 Address" del adaptador WiFi activo | [CITED: dev.to guide "Accessing Vite from another device"]. Documentar en STATE.md tras el test. |
| **Firewall Windows 11** | Allow inbound TCP 5173 en Windows Defender; o aceptar el prompt UAC que aparece al primer `npm run dev` post-cambio | El primer `npm run dev` con `host: true` dispara un prompt de firewall — Rafael solo necesita aceptar "Private networks". |
| **Checklist exacto del smoke test (10 ítems)** | Ver tabla "iOS Smoke Test Checklist" abajo | — |
| **Timing** | **Al final del walking-skeleton wave + repetir al final de Phase 1** (acceptance gate). Si surge un issue es-iOS-only, mitigar dentro de Phase 1; no es abort. | iOS-02 ya es NO-bloqueante por requirements. Hacerlo early (skeleton) ahorra re-trabajo; hacerlo al final confirma que sticky elements + timeline marker + PRM no se rompieron por capas posteriores. |
| **Documentación** | Marcado en checklist en `01-EXECUTION-LOG.md` con resultado por ítem + 1 screenshot por orientación si hay anomalía. Si todo pasa: una línea en STATE.md "iOS-02: PASS YYYY-MM-DD on iPhone <modelo> iOS <versión>". Sin video. | Smoke test ≠ full QA. Screenshots solo si hay algo que mostrar. |

**iOS Smoke Test Checklist (10 ítems):**

1. Carga `http://<IP-LAN>:5173/?ch=3` — aterriza directamente en ch3.
2. Swipe vertical hacia abajo — snappea a ch4 limpiamente (no skipping a último).
3. Swipe vertical hacia arriba — snappea a ch2 limpiamente.
4. Flick rápido — `scroll-snap-stop: always` impide skip de 2 chapters; máximo 1 por gesto.
5. StickyTimeline (bottom) visible y no se solapa con la Safari toolbar dinámica. Si se solapa: aplicar `bottom: env(safe-area-inset-bottom)` mitigation (UI-SPEC §9 lo prevé).
6. StickyAvatar (top-left) visible durante todo el scroll, swap entre ch3↔ch4 inmediato visible.
7. Click en tick `2009` — navega smooth a ch2.
8. Rotar a landscape — layout funcional, sticky elements en posición, snap sigue funcionando.
9. Rotar a portrait — mismo check.
10. Activar Settings → Accessibility → Motion → Reduce Motion. Recargar. Confirmar que el click en un tick es jump instantáneo (D-04).

**RECOMMENDATION: Hardware = iPhone propio de Rafael; acceso = `vite.config.js` con `host: true` + `npm run dev` + IP local desde `ipconfig` + aceptar prompt firewall Windows; timing = una vez al final del walking-skeleton y otra al final de Phase 1; checklist = 10 ítems arriba; documentación = línea en `01-EXECUTION-LOG.md` + screenshots solo si hay anomalía. El protocolo es NO-bloqueante: cualquier issue se mitiga dentro de la fase, no aborta.**

### Open-Q-C — Phase 1 placeholder visual strategy

El UI-SPEC §4, §7, §11, §12 ya **bloquea** la estética del placeholder: paleta neutra `#0b0b16` / `#e7e7f0` / `#1a1a2e`, avatar como rectángulo gris con texto `ch{N}`, timeline con 7 ticks + años + marker, era title `YYYY · {era_name}`. Mi rol aquí es confirmar o refinar dentro de los límites del UI-SPEC, no contradecirlo.

**Análisis de las 3 estrategias contra el UI-SPEC locked:**

| Estrategia | Contradice UI-SPEC | Phase 2 rework | Veredicto |
|------------|---------------------|----------------|-----------|
| 1. Color block + número grande de chapter, avatar gris, timeline numerada con marker | **NO** — calza 1:1 con UI-SPEC §11 (era titles "YYYY · {era_name}"), §7.2 (avatar placeholder gris con `ch{N}`), §7.3 (timeline con 7 ticks numerados y marker) | Mínimo: Phase 2 sobrescribe `--c-bg` por chapter vía `data-chapter="N"`; las 7 sections ya tienen el atributo correcto; tipografía cambia vía CSS Custom Property sin tocar templates Vue | **GANADOR** |
| 2. Era-tinted soft (background HSL por chapter) + silueta SVG por chapter en avatar | **SÍ** — el UI-SPEC §4 dice "neutral paleta + Phase 2 sobreescribe"; preview-tintar invadiría Phase 2 (THM-01..05); siluetas por chapter requieren generar 7 assets (Phase 3) | Alto: rework SVG → bust pixel art reales | Rechazado |
| 3. Timeline definitiva "neutra" + sections vacías con solo título | Parcialmente — el UI-SPEC ya da la timeline definitiva. Pero "sections vacías" contradice §7.1 que pide era title centrado y el ARIA label | Medio: las sections necesitan el era title para que el placeholder sea verificable visualmente; quitarlo y reañadirlo en Phase 2 es churn | Rechazado |

El UI-SPEC §12 ya es la verificación visual de Phase 1 — 18 checks, todos basados en estrategia 1.

**RECOMMENDATION: Estrategia 1 — exactamente lo que el UI-SPEC ya prescribe. Color block neutro `#0b0b16` por section + era title `YYYY · {era_name}` centrado (§5 typography clamp), avatar placeholder rectángulo gris `#1a1a2e` con borde `#2e2e4a` y texto `ch{N}` en `#6b6b8a` (§7.2), timeline con 7 ticks + años + notch + marker móvil (§7.3). Phase 2 sobreescribe via `[data-chapter="N"]` CSS Custom Properties sin tocar templates Vue (THM-01 ya está pensado para hookear ahí). Cero re-trabajo en templates — solo cambia el cascade CSS.**

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Scroll snap mechanics | Browser (CSS native) | — | `scroll-snap-type: y mandatory` es nativo, performance óptimo, sin lib |
| Active chapter tracking | Browser (IntersectionObserver) | Vue composable (`useScrollState`) | IO devuelve eventos; composable los wrapea en `ref` |
| Continuous scrollProgress tracking | Browser (RAF + scrollTop) | Vue composable | RAF reads `scrollTop / (scrollHeight - clientHeight)` cada frame durante swipe libre |
| Sticky element positioning | Browser (CSS `position: fixed`) | — | Avatar y timeline son `fixed` no `sticky` porque overflow está en ScrollShell, no en viewport |
| Keyboard navigation | Browser DOM + Vue composable | — | `@keydown.up.prevent` / `.down.prevent` sobre el ScrollShell que tiene `tabindex="0"` |
| `prefers-reduced-motion` reactivity | Browser (matchMedia) | `@vueuse/core` (`usePreferredReducedMotion`) | Una sola fuente reactiva, inyectada vía provide/inject |
| Deep link `?ch=N` parsing | Browser (`URLSearchParams`) | Vue lifecycle (`onMounted`) | Sin Vue Router; parseo manual en mount, `scrollIntoView` programático |
| Viewport responsive observer | Browser (ResizeObserver) | `@vueuse/core` (`useResizeObserver`) | Reemplaza `orientationchange` deprecado; reactivo vía vueuse wrapper |

---

## 2. Per-Area Technical Findings

### Área 1 — CSS scroll-snap mechanics on vertical

**Status:** HIGH confidence. Soporte universal en Chrome, Firefox, Safari (incluyendo iOS); el bug histórico (WebKit #243582) es **horizontal-only**.

**Propiedades clave (todas verificadas contra MDN):**

| Propiedad | Valor recomendado | Notas |
|-----------|-------------------|-------|
| `scroll-snap-type` | `y mandatory` | `mandatory` es estricto (D-01 confirma). `proximity` ya descartado en CONTEXT |
| `scroll-snap-align` | `start` | En cada `.chapter-section`. Alterna `center` solo si hubiera headers internos — no es el caso |
| `scroll-snap-stop` | `always` | CRÍTICO (CORE-04) — impide skip-multi-chapter en flicks rápidos. Soporte: Chrome 75+, Firefox 103+, Safari 15+ [CITED: MDN] |
| `scroll-behavior` | `smooth` default; JS lo cambia a `auto` bajo PRM | D-01 + D-04 lo gobiernan |
| `-webkit-overflow-scrolling` | `touch` | iOS-only inertia (iOS-01). Sigue siendo aceptado por WebKit aunque marcado legacy; sin él se pierde el "feel" momentum nativo |

**`100dvh` y la trampa nueva (oct-2025):**

El research SUPERSEDED de PITFALLS.md recomendó `100dvh` para evitar address-bar drift. Eso **sigue vigente para los chapters** (donde `100dvh` se usa como altura, y "dynamic" ES exactamente lo que queremos). **PERO**: hay un bug nuevo en iOS Safari post-octubre 2025 donde overlays/backdrops usando `100dvh` dejan un gap en el bottom [CITED: Apple Developer Forums thread 803987, 2025-10]. Esto NO afecta nuestro caso porque:

- ChapterSection usa `100dvh` como `height` interno → no es un overlay; el bug es de "no cubre full screen", no de "no funciona como altura de section". El section sigue alineando con snap puntos sin gap.
- StickyTimeline usa `position: fixed; bottom: 0`, no `height: 100dvh`.

**Mitigación opcional preventiva:** declarar fallback duplicado en cada `.chapter-section`:

```css
.chapter-section {
  height: 100vh; /* fallback older Safari */
  height: 100dvh; /* preferred, modern */
}
```

[VERIFIED: cascade CSS estándar — la segunda declaración gana en navegadores que la entienden]. Esto se llamaba "viewport unit defensive pattern" y es lo que recomienda MDN para `dvh`.

**`scroll-behavior: smooth` vs JS `scrollTo({behavior})`:** ambos coexisten sin conflicto. CSS `scroll-behavior` rige *user-initiated scroll* (snap entre chapters durante swipe); JS `scrollTo({behavior})` rige *programmatic scroll* (click en tick, flecha, `?ch=N`). Bajo PRM cambiamos ambos a `auto`/`'auto'` respectivamente (D-01, D-04).

**Confirmación negativa #243582:** El título textual en Bugzilla es `[iOS] CSS Scroll Snap disables momentum-based scrolling` y el contexto OP describe scroll horizontal. Múltiples fuentes confirman que vertical no está afectado [CITED: WebKit blog, MDN scroll-snap docs, css-tricks practical-css-scroll-snapping]. No hay evidencia de un bug vertical-only equivalente. **Confidence: HIGH.**

**Pitfall remanente (verificar en el smoke test iOS):** WebKit puede cachear snap points si los hijos del scroll container cambian estilo dinámicamente sin trigger de reflow [CITED: xjavascript.com blog]. En Phase 1 esto NO aplica (los 7 chapters son estáticos en estructura). Para Phase 2 cuando el theme cambie via `data-chapter`, será un punto a vigilar — fuera de scope acá.

### Área 2 — IntersectionObserver pattern for `activeChapter` + RAF for `scrollProgress`

**Two tracking mechanisms, dos use cases distintos:**

```javascript
// 1. activeChapter — DISCRETE, vía IntersectionObserver
// Disparado solo cuando un chapter "se vuelve activo"

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      // threshold: 0.6 = el chapter es "activo" cuando cubre >= 60% del viewport
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        activeChapter.value = Number(entry.target.dataset.chapter)
      }
    }
  },
  {
    root: scrollShellEl,           // el ScrollShell ES el root, NO viewport
    threshold: [0.6],              // único umbral; ambigüedad mínima en snap mandatory
    rootMargin: '0px',
  }
)

sectionEls.forEach(el => observer.observe(el))
```

**Decisiones tuning:**

- **`root` = ScrollShell, no `document`:** Como el ScrollShell es el overflow container y los chapters viven dentro, el IO necesita el ScrollShell como root para que `intersectionRatio` se mida contra esa "viewport interna". Si `root` fuera `null` (document), IO mediría contra el viewport del browser y los cálculos serían incorrectos cuando el ScrollShell no llena toda la pantalla.
- **`threshold: 0.6`:** Con `scroll-snap-type: y mandatory` un chapter está "siempre" al 100% post-snap. El 0.6 es el umbral durante el *swipe libre*; cuando el chapter destino cubre >60% del viewport del ScrollShell, ya es el activo. No usar múltiples thresholds (`[0.1, 0.5, 0.9]`) — añade ruido sin valor en este caso, porque snap es mandatory y la transición discrete-vs-continuous está ya separada (IO = discrete, RAF = continuous).
- **Disambiguación de "2 chapters parcialmente visibles durante snap":** Resuelto por construcción — solo el que cruza el threshold 0.6 dispara el callback. Si dos cruzan 0.6 simultáneamente (caso teórico imposible si chapters son `100dvh` y mandatory snap está activo), el último entry en `entries` array gana — comportamiento estable.

**`scrollProgress` — CONTINUOUS, vía RAF:**

```javascript
// 2. scrollProgress 0..1 — para el timeline marker durante el swipe libre

let rafId = null
const scrollProgress = ref(0)

function tick() {
  const el = scrollShellEl
  const maxScroll = el.scrollHeight - el.clientHeight
  scrollProgress.value = maxScroll > 0 ? el.scrollTop / maxScroll : 0
  rafId = requestAnimationFrame(tick)
}

// Start the RAF only when user is actively scrolling (passive listener)
let scrolling = false
scrollShellEl.addEventListener('scroll', () => {
  if (!scrolling) {
    scrolling = true
    rafId = requestAnimationFrame(function loop() {
      tick()
      // Stop the loop if scroll has been idle for >100ms
      // (más eficiente que correr RAF eternamente)
    })
  }
}, { passive: true })
```

**Decisiones tuning:**

- **RAF, no `scroll` listener directamente:** El `scroll` event en un container con snap dispara muchas veces durante un swipe + durante el snap easing. RAF coalesca a 60fps y desacopla del rate del scroll event.
- **Start/stop RAF:** Para ahorrar CPU cuando el usuario está idle. `vueuse/core` provee `useRafFn` con un toggle `pause/resume` que envuelve esto cleanly — recomendado usarlo.
- **Listener en `scrollShellEl`, NO `document`:** Mismo motivo que en IO — el scroll vive en el container, no en el viewport.
- **Coordinación IO + RAF:** Son independientes. IO actualiza `activeChapter` (para el bust + `aria-current` + label); RAF actualiza `scrollProgress` (para `left` del marker). En snap-complete, ambos convergen al mismo chapter — el marker queda visualmente en el tick. UI-SPEC §7.3 documenta esto explícitamente.

[CITED: Vue 3 reactive ref docs, MDN IntersectionObserver, MDN requestAnimationFrame]

### Área 3 — `?ch=N` deep link on load

```javascript
// En onMounted del ScrollShell
import { onMounted } from 'vue'

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const ch = params.get('ch')
  const N = Number(ch)
  const targetChapter = (Number.isInteger(N) && N >= 0 && N <= 6) ? N : 3 // default ch3

  const targetEl = document.getElementById(`chapter-${targetChapter}`)
  if (targetEl) {
    // CRITICAL: si lo hacemos antes de que las sections estén layouted,
    // el scrollIntoView se ejecuta contra dimensiones aún 0
    // Solución: doble requestAnimationFrame garantiza un paint completo previo
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        targetEl.scrollIntoView({ behavior: 'auto', block: 'start' }) // instant en load
      })
    })
  }
})
```

**Tuning:**

- **`behavior: 'auto'` en load:** Aterrizar instantáneamente sin animación es UX correcto — el usuario llegó con `?ch=N` esperando estar ahí. La animación suave en load es jarring.
- **Doble RAF antes de `scrollIntoView`:** Mitiga la race condition entre Vue mount → DOM paint → snap point calculation. Sin doble RAF, en algunos navegadores Safari iOS el `scrollIntoView` se ejecuta antes que el layout se asiente y el scroll queda mal posicionado.
- **Validación:** `Number.isInteger(N) && 0 <= N <= 6` — todo lo demás cae a default 3. Esto cubre `?ch=abc`, `?ch=99`, `?ch=-1`, `?ch=` (vacío), ausencia de `?ch`.

**Sincronización con IntersectionObserver:** El IO en `onMounted` se inicializa post-DOM. Si `scrollIntoView` se llama después de `initObserver` y el observer ya está observando, el evento de intersección se dispara naturalmente y `activeChapter.value = N` se actualiza. No hace falta forzar el state manualmente.

### Área 4 — Keyboard navigation ↑/↓ on `tabindex="0"` ScrollShell

```vue
<template>
  <main
    id="main-content"
    class="scroll-shell"
    tabindex="0"
    ref="shellEl"
    @keydown.up.prevent="navigateChapter(-1)"
    @keydown.down.prevent="navigateChapter(1)"
    @keydown.home.prevent="navigateChapter('home')"
    @keydown.end.prevent="navigateChapter('end')"
  >
    <!-- 7 chapter sections -->
  </main>
</template>

<script setup>
import { ref, inject } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

const reducedMotion = usePreferredReducedMotion()
const activeChapter = ref(3) // viene del composable useScrollState

function navigateChapter(delta) {
  let target
  if (delta === 'home') target = 0
  else if (delta === 'end') target = 6
  else target = Math.max(0, Math.min(6, activeChapter.value + delta))

  const behavior = reducedMotion.value === 'reduce' ? 'auto' : 'smooth' // D-04
  const el = document.getElementById(`chapter-${target}`)
  el?.scrollIntoView({ behavior, block: 'start' })
}
</script>
```

**Decisiones:**

- **`@keydown.up.prevent`** — `.prevent` impide el page-scroll del browser. Sin él, la flecha hace double-scroll (browser scrolls page + nuestro handler scrolls section).
- **Captura en el ScrollShell, NO global** — A11Y-02 lo pide. El ScrollShell debe tener foco (vía Tab o vía skip link). No interceptamos `↑/↓` globalmente porque rompería accesibilidad fuera del scroll (p.ej. el usuario navegando con teclado entre los tick buttons).
- **`Home` / `End` opcional** — UI-SPEC §10 los lista como opcionales. Vale la pena incluirlos: son un atajo natural ("ir al principio / al final"). 10 LOC.
- **Skip link interaction:** El skip link tiene `href="#main-content"`, el browser hace foco en `<main tabindex="0">`. Inmediatamente `↑/↓` ya funcionan. Sin re-focus manual.

### Área 5 — `prefers-reduced-motion` integration

**Implementación recomendada — vueuse + provide/inject:**

```javascript
// src/composables/usePRM.js
import { computed } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

export function usePRM() {
  const motion = usePreferredReducedMotion()
  // Devolvemos un boolean reactivo simple para uso en plantillas
  const prefersReduced = computed(() => motion.value === 'reduce')
  return { prefersReduced, motion }
}
```

**En `App.vue`:**

```javascript
// Provide once globally
import { provide } from 'vue'
import { usePRM } from './composables/usePRM'

const prm = usePRM()
provide('prm', prm)
```

**En cualquier componente hijo (StickyAvatar, StickyTimeline, ScrollShell):**

```javascript
import { inject } from 'vue'
const { prefersReduced } = inject('prm')

// uso:
const behavior = prefersReduced.value ? 'auto' : 'smooth'
```

**¿Por qué `provide/inject` y no prop drilling?** El PRM se consume en ScrollShell (`scroll-behavior`), StickyAvatar (swap mode), StickyTimeline (click-to-nav behavior), keyboard handler (`navigateChapter`). Pasar como prop por 4 niveles es churn. `provide/inject` es el patrón canónico Vue 3 para composables singleton.

**¿Por qué NO duplicar `matchMedia` en cada componente?** El UI-SPEC §8 lo dice explícitamente: "El composable `usePRM` es el único punto de lectura — no duplicar `matchMedia` en múltiples componentes". `usePreferredReducedMotion` de vueuse internamente usa un `matchMedia` con cleanup automático en unmount.

**CSS-side companion (default motion path):**

```css
/* Phase 1 mantiene el .smooth fallback en CSS por si JS aún no ha cargado */
.scroll-shell {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  .scroll-shell {
    scroll-behavior: auto;
  }
}
```

Doble defensa: CSS aplica `auto` antes de hydration de Vue; el JS lo aplica para los `scrollTo({behavior})` programáticos (D-04). Ambos caminos convergen.

**Avatar crossfade conditional (UI-SPEC §7.2 motion):** El crossfade default (200ms) NO se hace con CSS transition (porque el `src` cambia, no la `opacity` de un mismo elemento). Se hace con JS:

```javascript
// En StickyAvatar.vue
import { watch, inject } from 'vue'
const { prefersReduced } = inject('prm')

const opacity = ref(1)

watch(activeChapter, async (newCh) => {
  if (prefersReduced.value) {
    // D-02 — single frame replace
    currentSrc.value = `/assets/ch${newCh}-bust.png`
    return
  }
  // Default: fade out → swap src → fade in
  opacity.value = 0
  await nextTick()
  setTimeout(() => {
    currentSrc.value = `/assets/ch${newCh}-bust.png`
    opacity.value = 1
  }, 200)
})
```

En Phase 1 (placeholder gris, sin imagen real) lo que cambia es el texto `ch{N}`. Misma lógica.

[VERIFIED: `@vueuse/core` API `usePreferredReducedMotion` — vueuse.org docs]

### Área 6 — Sticky positioning vs `position: fixed`

**Confirmación de la elección del UI-SPEC: `position: fixed` es CORRECTO.**

**Rationale técnico:**

- `position: sticky` requiere que el elemento sea hijo del overflow container; "sticky" se entiende contra el scroll de su containing block. Si el ScrollShell es el overflow container y el avatar/timeline son hermanos del ScrollShell (no hijos), `position: sticky` no aplica.
- Si los hacemos hijos del ScrollShell (para usar `sticky`), serían parte del DOM scrolleable — sus dimensiones contarían en `scrollHeight` rompiendo nuestros cálculos de marker `scrollTop / (scrollHeight - clientHeight)`.
- `position: fixed` los saca completamente del flujo, los ancla al viewport físico del browser. Es lo que queremos.

**Caveats CRÍTICOS de `position: fixed`:**

| Caveat | Impacto | Mitigación |
|--------|---------|------------|
| Cualquier ancestor con `transform`, `filter`, `perspective`, `will-change` o `contain` distinto a `none` crea un nuevo containing block y `position: fixed` se ancla a ese ancestor, no al viewport | StickyAvatar / StickyTimeline aparecerían dentro del ScrollShell y se moverían con él (catastrófico) | Asegurar que `<html>`, `<body>`, `#app` y `<App>` raíz NO tienen ninguna de esas propiedades. El scaffold actual está limpio (verificado en `index.html`). Si Phase 2 añade `transform` a `App.vue` para algún animation hint, el avatar se rompe. ✅ **AGREGAR a anti-patterns** |
| Z-index stacking: `fixed` no genera stacking context por sí mismo, pero combinado con `z-index` sí | Si Phase 2 añade un `transform` a un sibling con `z-index`, puede tapar al avatar | UI-SPEC §6 ya define z-index map: skip(50) > avatar/timeline(40) > content(0). Respetar. |
| iOS Safari + `position: fixed` + virtual keyboard | No aplica en Phase 1 (no hay inputs) | — |
| iOS Safari toolbar dinámica | StickyTimeline en `bottom: 0` queda bajo la toolbar a veces | UI-SPEC §9 ya lo prevé con `bottom: env(safe-area-inset-bottom, 0)` aplicable post smoke test |

**Arquitectura DOM resultante:**

```html
<div id="app">
  <a class="skip-link" href="#main-content">…</a>          <!-- fixed top -->
  <aside class="sticky-avatar">…</aside>                    <!-- fixed top-left -->
  <main id="main-content" class="scroll-shell" tabindex="0"><!-- overflow-y: scroll -->
    <section id="chapter-0" data-chapter="0">…</section>
    <section id="chapter-1" data-chapter="1">…</section>
    <!-- … -->
    <section id="chapter-6" data-chapter="6">…</section>
  </main>
  <nav class="sticky-timeline">…</nav>                      <!-- fixed bottom -->
</div>
```

Skip-link, avatar, scroll-shell y timeline son **hermanos directos** dentro de `#app`. Avatar y timeline NO están dentro del ScrollShell.

[CITED: MDN `position: fixed`, MDN "Containing block"]

### Área 7 — ResizeObserver for orientation/viewport changes (MOB-03)

**Pattern recomendado — `useResizeObserver` de vueuse:**

```javascript
import { useResizeObserver } from '@vueuse/core'
import { ref } from 'vue'

const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)

// Observar el `<html>` element como proxy del viewport (MOB-03 lo pide explícitamente)
useResizeObserver(document.documentElement, (entries) => {
  const entry = entries[0]
  // contentRect refleja el tamaño post-layout, después de address bar in/out
  viewportWidth.value = entry.contentRect.width
  viewportHeight.value = entry.contentRect.height
})
```

**Debouncing:** Para el use case Phase 1 (recalcular `width` del marker, posición de sticky elements al rotar) NO hace falta debouncing — el browser ya throttea ResizeObserver a frame rate. Si más adelante (Phase 5 Phaser scene) hace falta `ScrollTrigger.refresh()` o un Phaser resize, ahí sí conviene debouncear 150ms.

**Dimensiones a re-leer:**

- **Avatar dimensiones (80×96 desktop / 56×68 mobile):** ya gestionadas por CSS `@media (max-width: 599px)` (UI-SPEC §9). El ResizeObserver no las cambia — es CSS.
- **Timeline tick positions:** los ticks usan flex `justify-content: space-between`. Reflejan auto-magicamente. No requieren recálculo JS.
- **Timeline marker `left` position:** se re-deriva cada frame por RAF (continuous), así que cualquier resize es picked up sin observador adicional.

**Conclusión:** Para Phase 1 el ResizeObserver es **defensivo** y reactivo a futuras adiciones de lógica (Phase 5 lo necesita en serio). El composable `useResizeObserver` se monta pero con un handler casi vacío. **Sin sobre-engineering.**

**¿Por qué NO `window.addEventListener('orientationchange', ...)`?** [CITED: MDN "Screen: orientationchange event (deprecated)"]:
- Deprecado, marca non-standard.
- En Android dispara antes de que las dimensiones de viewport hayan actualizado → valores stale.
- En iPad split-screen el reporte de orientación no corresponde con el aspect ratio real del pane.

ResizeObserver es objetivamente superior.

[CITED: VueUse `useResizeObserver` docs, MDN ResizeObserver]

### Área 8 — Vite dev server config for mobile testing

**Cambio requerido en `vite.config.js`:**

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,        // <-- antes: '127.0.0.1'. true === '0.0.0.0' (escucha en todas las interfaces)
    port: 5173,
    open: false        // <-- antes: true. En modo LAN abrir el browser local es spam; el dev abre manualmente
  }
})
```

[VERIFIED: Vite docs `server.host` — when `true`, listens on `0.0.0.0` exposing LAN]

**Discovery de IP desde PowerShell:**

```powershell
ipconfig | Select-String "IPv4"
# Ejemplo output:
#   IPv4 Address. . . . . . . . . . . : 192.168.1.42
```

Vite imprime ambas direcciones (`Local: http://localhost:5173`, `Network: http://192.168.1.42:5173`) al arrancar con `host: true`. Rafael copia la `Network` y la abre en el iPhone Safari estando en la misma WiFi.

**Firewall Windows 11:**

- Primer `npm run dev` con `host: true` después del cambio: Windows Defender muestra un prompt UAC pidiendo permitir Node.js en "Private networks". Aceptar.
- Si el prompt no aparece (firewall reglas pre-existentes), comando manual:

```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "Vite Dev Server 5173" `
  -Direction Inbound -Protocol TCP -LocalPort 5173 `
  -Action Allow -Profile Private
```

**Sin tunneling necesario:** ngrok/cloudflared serían overkill para un smoke test en misma red local. Solo conviene si Rafael quiere probar desde fuera de su red (no es el caso).

**Pitfall conocido:** Algunas redes WiFi corporativas tienen "client isolation" activado y bloquean tráfico entre dispositivos. Si el iPhone no carga `http://192.168.1.42:5173/`, probar con un hotspot del propio iPhone (Personal Hotspot) compartido a la Mac/PC y revertir el test desde el iPhone Safari.

[CITED: Vite docs server-options, dev.to "Accessing Vite from another device"]

---

## 3. SPIDR Slice Recommendations (atomic plan boundaries)

**Mode: MVP / vertical slice.** Goal: el planner produce 5–8 atomic plans cada uno entregable e independiente-mente verificable. La filosofía SPIDR (Spike, Path, Interface, Data, Rules) y Walking Skeleton primero.

### Walking Skeleton (Plan 1)

**Minimum viable end-to-end:** El usuario abre `http://127.0.0.1:5173/` y ve **algo** que demuestra el corazón del concepto: 7 chapters apilados verticalmente, snap funcional con scroll, y el placeholder más mínimo posible (header `Chapter N`).

**Includes:**
- Reemplazar el `App.vue` placeholder por un layout root con `<ScrollShell>` + 7 `<ChapterSection>` minimal (solo era title, sin avatar, sin timeline).
- `useScrollState` composable con `activeChapter` ref y IntersectionObserver wireado.
- CSS: `scroll-snap-type: y mandatory`, `scroll-snap-align: start`, `scroll-snap-stop: always`, `height: 100dvh` / `100vh` fallback.
- `100dvh` en chapters; `tabindex="0"` en ScrollShell (sin keyboard handlers todavía).
- Default landing chapter 3: hardcodeado vía `scrollIntoView` en `onMounted`.

**Verification:** Carga la página → scroll → snappea entre 7 chapters. F12 console: `useScrollState.activeChapter` cambia. Eso es todo. Sin avatar, sin timeline, sin reduced motion, sin keyboard, sin deep link.

**Why first:** Si el snap no funciona, todo lo demás es accesorio. **El walking skeleton elimina el riesgo más alto antes de invertir en features secundarios.** SPIDR recomienda este patrón.

### Plan 2 — Sticky Avatar (placeholder)

**Adds:**
- `<StickyAvatar>` componente con DOM exacto del UI-SPEC §7.2 (aside + div placeholder + span label).
- CSS `position: fixed; top: 16px; left: 16px` + paleta neutra UI-SPEC §4.
- Mobile breakpoint `< 600px` con dimensiones menores.
- Reactividad: el placeholder text `ch{N}` cambia con `activeChapter` (sin crossfade aún — viene en plan 4 con PRM).

**Verification:** Scroll → el ch label en avatar muta. Aria-label se actualiza.

### Plan 3 — Sticky Timeline + Marker

**Adds:**
- `<StickyTimeline>` componente DOM exacto del UI-SPEC §7.3 (nav + ol/li + 7 button + notch + year span + track + marker).
- 7 ticks con años 1995/2001/2009/2013/2015/2022/2026.
- Marker `left` derivado vía RAF + `scrollProgress` (Area 2 pattern).
- `aria-current` reactiva en el tick activo.
- Click handler en cada tick: `scrollIntoView({behavior: 'smooth'})` al chapter correspondiente.
- Hover state CSS (UI-SPEC §7.3 estados).

**Verification:** Scroll → marker se mueve smoothly. Click en `2009` → snappea a ch2. Tick `aria-current="true"` actualiza.

### Plan 4 — Reduced Motion + Avatar Crossfade

**Adds:**
- `usePRM` composable con `@vueuse/core` `usePreferredReducedMotion`.
- `provide('prm', prm)` en `App.vue`; `inject('prm')` donde haga falta.
- StickyAvatar crossfade JS 200ms default (D-02 default path).
- ScrollShell `scroll-behavior` switch (D-01).
- Timeline click-to-nav `behavior` switch (D-04).
- CSS `@media (prefers-reduced-motion: reduce)` fallback paralelo.

**Verification:** Toggle Windows Settings → Ease of Access → Display → "Show animations in Windows" OFF. (O en mobile: iOS Settings → Accessibility → Motion → Reduce Motion ON.) Recargar. Snap es jump instantáneo. Avatar swap instantáneo. Click en tick instantáneo.

### Plan 5 — Deep Link + Keyboard Navigation + Skip Link

**Adds:**
- `?ch=N` parsing en `onMounted` (Area 3 pattern + double-RAF).
- Validación 0..6 + default 3.
- Keyboard handlers `↑/↓/Home/End` en ScrollShell (Area 4).
- `<SkipLink>` componente DOM UI-SPEC §7.4 + hide-on-scroll/blur logic.
- Focus ring `:focus-visible` global UI-SPEC §10.

**Verification:** `?ch=0` → carga en ch0. `?ch=99` → carga en ch3 (fallback). Tab desde URL bar → skip link visible → Enter → foco en ScrollShell → ↓ → snappea a ch4. Skip link se oculta tras primer scroll.

### Plan 6 — Mobile Responsive + ResizeObserver + Vite Host

**Adds:**
- Media queries `< 600px` del UI-SPEC §9 (avatar, timeline).
- `useResizeObserver` reactivo (placeholder — Phase 5 lo usa de verdad).
- `vite.config.js` cambio `host: true`, `open: false`.
- Smoke test paso a paso documentado en `01-EXECUTION-LOG.md` con la checklist iOS de 10 ítems.

**Verification:** Resize DevTools a <600px → avatar y timeline shrink. Real iPhone vía LAN: checklist iOS run, marcar PASS/FAIL.

### Plan 7 (opcional, gate condicional) — iOS smoke test fixes

**Solo se crea si el smoke test detecta un issue iOS-specific.**

Posibles items:
- `env(safe-area-inset-bottom)` en timeline si toolbar solapa.
- Workaround específico si algún snap point se cachea mal en WebKit (forzar reflow vía `el.offsetHeight` lookup tras cualquier programmatic scroll).

**Verification:** Re-run smoke test → all 10 items PASS.

**Total esperado:** 6 plans (7 si hay issue iOS). Cada plan es un PR-sized commit con verificación independiente.

---

## 4. Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `prefers-reduced-motion` reactivo | `window.matchMedia` + listeners manuales | `@vueuse/core` `usePreferredReducedMotion` | 1.18 KB; cleanup automático en unmount; SSR-safe (no relevante aquí pero bueno) |
| ResizeObserver para Vue | `new ResizeObserver(...)` + `onBeforeUnmount` cleanup manual | `@vueuse/core` `useResizeObserver` | Cleanup automático; API reactiva consistente |
| RAF loop con pause/resume | `requestAnimationFrame` recursivo manual | `@vueuse/core` `useRafFn` | Provee `pause()`/`resume()` toggle; cleanup automático |
| Scroll-snap behavior | Cualquier librería (Lenis, Locomotive, GSAP) | CSS `scroll-snap-type: y mandatory` nativo | CONSTRAINT del proyecto + nativo es más liviano y robusto |
| Active section tracking | Manual `scroll` listener + `getBoundingClientRect` polling | IntersectionObserver | Async, performant, no jank en main thread |
| Routing | Vue Router | Composable `useScrollState` + `?ch=N` parsing | CONSTRAINT — Vue Router conflicta con scroll-snap (REQUIREMENTS §Out of Scope) |
| State management para `activeChapter` | Pinia | Module-level `ref` en composable | CONSTRAINT — Pinia overkill para un único integer (REQUIREMENTS §Out of Scope) |

**Key insight:** El stack del proyecto está deliberadamente "menos es más" — el constraint principal es no añadir maquinaria. vueuse es la única dependencia nueva justificada y es muy delgada cuando se tree-shake. Todo lo demás es Vue 3 nativo + CSS nativo + Web APIs nativas.

---

## 5. Common Pitfalls

### Pitfall 1: `position: fixed` se rompe si un ancestor tiene `transform`/`filter`

**What goes wrong:** En Phase 2 alguien añade `transform: scale(0.999)` a `<App>` raíz para "test smooth rendering". El avatar y la timeline súbitamente se mueven con el scroll porque ahora están anclados a `<App>`, no al viewport.

**Why:** Spec CSS — cualquier `transform`/`filter`/`perspective`/`will-change`/`contain` distinto a `none` crea un nuevo containing block.

**Avoid:** Documentar en `App.vue` (y en project rules) que el root container NO acepta esas propiedades. Phase 2 themes pueden usar `transform` solo dentro de elementos **dentro** del ChapterSection, nunca en ancestors del avatar/timeline.

**Warning signs:** Avatar visible "rebota" al hacer scroll. Timeline reposicionada al snap.

[CITED: MDN "Containing block"]

### Pitfall 2: IntersectionObserver con `threshold: 0.5` causa flicker en chapters de borde

**What goes wrong:** Si dos chapters cruzan el threshold 0.5 simultáneamente durante snap easing (caso teórico), `activeChapter` puede flickerear rapido.

**Why:** El callback se ejecuta async — el orden de entries no está garantizado entre browsers.

**Avoid:** Usar `threshold: 0.6` (mayoritario) — fuerza que solo un chapter cumpla el criterio en un momento dado. Con sections de `100dvh` mandatory snap, el chapter activo siempre cubre >60% post-snap.

**Warning signs:** Avatar label rápidamente alterna entre `ch3` y `ch4` cuando snappea de uno al otro.

### Pitfall 3: Race condition entre `scrollIntoView` y snap layout en `onMounted`

**What goes wrong:** `?ch=5` no aterriza en ch5; aterriza en ch0 o en una posición incorrecta.

**Why:** Vue mount → DOM insert → `onMounted` → `scrollIntoView` ejecuta antes de que el browser haya calculado los snap points / layout final.

**Avoid:** Doble `requestAnimationFrame` antes de `scrollIntoView` (Area 3 code). O usar `nextTick()` doble. O `setTimeout(..., 0)` (último recurso).

**Warning signs:** En iOS Safari (más lento layout), el `?ch=N` falla intermitentemente.

### Pitfall 4: RAF loop continuo aún cuando el usuario no está scrolleando

**What goes wrong:** El marker `left` se actualiza 60 veces/segundo aunque la página está idle → battery drain en mobile.

**Why:** RAF runs eternamente si se programa unconditionally.

**Avoid:** `useRafFn` de vueuse con start/stop; o bind a `scroll` event para iniciar el RAF, y stop tras N ms de idle (~100ms post-último scroll event).

**Warning signs:** iPhone battery se calienta mostrando la página sin tocar.

### Pitfall 5: Skip link target no recibe foco

**What goes wrong:** Enter en skip link → URL cambia a `#main-content` → pero el foco visualmente no se mueve.

**Why:** Por defecto, navegar a un fragmento solo scrollea; no transfiere foco salvo que el target sea naturally focusable (input, button, etc).

**Avoid:** El `<main>` tiene `tabindex="0"` — eso lo hace programmatically focusable. Y la navegación a `#main-content` con `tabindex` SÍ transfiere foco. UI-SPEC §10 lo confirma.

**Warning signs:** Tras Enter en skip link, presionar ↓ no hace nada (el foco quedó en el link, no en el shell).

### Pitfall 6: `100dvh` gap en iOS Safari post-octubre 2025 si se aplica a overlays

**What goes wrong:** Algún overlay futuro (Phase 3 contact-info overlay, Phase 5 project detail modal) con `height: 100dvh` deja un gap bottom en iOS Safari reciente.

**Why:** Bug reportado oct-2025 en iOS Safari [CITED: Apple Developer Forums 803987].

**Avoid:** Para overlays/backdrops específicamente, usar el pattern dual `height: 100vh; height: 100dvh;` o `height: 100%` cuando el container parent ya tiene `100dvh`. En Phase 1 NO aplica porque nuestros chapters usan `100dvh` como section height y nuestro timeline es `position: fixed; bottom: 0` (no usa height vh).

**Warning signs:** Reportes de "gap en bottom de overlays en iOS últimas versiones" cuando Phase 3/5 lleguen.

### Pitfall 7: Vite `host: true` no funciona si Windows Firewall bloquea

**What goes wrong:** Vite imprime `Network: http://192.168.1.42:5173` pero el iPhone Safari muestra "no se puede conectar".

**Why:** Windows Defender Firewall bloquea inbound conexiones a Node.js si no se aceptó el prompt UAC inicial.

**Avoid:** Aceptar el prompt al primer arranque, O crear regla manual con `New-NetFirewallRule` (Area 8).

**Warning signs:** Smoke test bloqueado en el paso 1.

---

## 6. Code Examples — Verified Patterns

### Composable `useScrollState`

```javascript
// src/composables/useScrollState.js
import { ref, readonly, onMounted, onBeforeUnmount } from 'vue'
import { useRafFn } from '@vueuse/core'

export function useScrollState(shellRef) {
  const activeChapter = ref(3) // default landing
  const scrollProgress = ref(0)
  let observer = null

  // RAF para scrollProgress continuous
  const { pause, resume } = useRafFn(() => {
    const el = shellRef.value
    if (!el) return
    const maxScroll = el.scrollHeight - el.clientHeight
    scrollProgress.value = maxScroll > 0 ? el.scrollTop / maxScroll : 0
  }, { immediate: false })

  // Trigger RAF solo cuando hay scroll activo
  let scrollTimeoutId = null
  function handleScroll() {
    resume()
    clearTimeout(scrollTimeoutId)
    scrollTimeoutId = setTimeout(() => pause(), 150)
  }

  function scrollToChapter(N, behavior = 'smooth') {
    const el = document.getElementById(`chapter-${N}`)
    el?.scrollIntoView({ behavior, block: 'start' })
  }

  onMounted(() => {
    const shell = shellRef.value
    if (!shell) return

    // IntersectionObserver
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            activeChapter.value = Number(entry.target.dataset.chapter)
          }
        }
      },
      { root: shell, threshold: [0.6] }
    )

    const sections = shell.querySelectorAll('[data-chapter]')
    sections.forEach(s => observer.observe(s))

    shell.addEventListener('scroll', handleScroll, { passive: true })

    // Deep-link parsing
    const params = new URLSearchParams(window.location.search)
    const ch = Number(params.get('ch'))
    const initial = (Number.isInteger(ch) && ch >= 0 && ch <= 6) ? ch : 3

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToChapter(initial, 'auto')
      })
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    shellRef.value?.removeEventListener('scroll', handleScroll)
    pause()
  })

  return {
    activeChapter: readonly(activeChapter),
    scrollProgress: readonly(scrollProgress),
    scrollToChapter,
  }
}
```

[VERIFIED: patrón derivado de Vue 3 docs + vueuse `useRafFn` API]

### Composable `usePRM`

```javascript
// src/composables/usePRM.js
import { computed } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

export function usePRM() {
  const motion = usePreferredReducedMotion()
  const prefersReduced = computed(() => motion.value === 'reduce')
  return { motion, prefersReduced }
}
```

[VERIFIED: vueuse.org/core/usePreferredReducedMotion/]

### `App.vue` shell

```vue
<script setup>
import { ref, provide } from 'vue'
import ScrollShell from './components/ScrollShell.vue'
import StickyAvatar from './components/StickyAvatar.vue'
import StickyTimeline from './components/StickyTimeline.vue'
import SkipLink from './components/SkipLink.vue'
import { useScrollState } from './composables/useScrollState'
import { usePRM } from './composables/usePRM'

const shellRef = ref(null)
const scrollState = useScrollState(shellRef)
const prm = usePRM()

provide('scrollState', scrollState)
provide('prm', prm)
</script>

<template>
  <SkipLink />
  <StickyAvatar />
  <ScrollShell ref="shellRef" />
  <StickyTimeline />
</template>

<style>
/* Global PRM CSS — fallback antes de hydration JS */
.scroll-shell { scroll-behavior: smooth; }

@media (prefers-reduced-motion: reduce) {
  .scroll-shell { scroll-behavior: auto; }
}
</style>
```

### `ScrollShell.vue` (esquema mínimo)

```vue
<script setup>
import { inject } from 'vue'
const { scrollToChapter, activeChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

function navigate(delta) {
  let target
  if (delta === 'home') target = 0
  else if (delta === 'end') target = 6
  else target = Math.max(0, Math.min(6, activeChapter.value + delta))
  scrollToChapter(target, prefersReduced.value ? 'auto' : 'smooth')
}

const chapters = [
  { id: 0, year: 1995, era: 'Terminal' },
  { id: 1, year: 2001, era: 'HTML 90s' },
  { id: 2, year: 2009, era: 'Flash' },
  { id: 3, year: 2013, era: 'Web 2.0' },
  { id: 4, year: 2015, era: 'AR/VR' },
  { id: 5, year: 2022, era: 'Modern' },
  { id: 6, year: 2026, era: 'Phaser' },
]
</script>

<template>
  <main
    id="main-content"
    class="scroll-shell"
    tabindex="0"
    @keydown.up.prevent="navigate(-1)"
    @keydown.down.prevent="navigate(1)"
    @keydown.home.prevent="navigate('home')"
    @keydown.end.prevent="navigate('end')"
  >
    <section
      v-for="ch in chapters"
      :key="ch.id"
      :id="`chapter-${ch.id}`"
      class="chapter-section"
      :data-chapter="ch.id"
      :aria-label="`${ch.era} — ${ch.year}`"
    >
      <div class="chapter-placeholder">
        <p class="era-title">{{ ch.year }} · {{ ch.era }}</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.scroll-shell {
  height: 100vh;
  height: 100dvh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
}

.chapter-section {
  height: 100vh;
  height: 100dvh;
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg);
  color: var(--c-fg);
}

.chapter-placeholder {
  padding-top: calc(80px + var(--sp-md));
  padding-bottom: calc(48px + var(--sp-sm));
}

.era-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
}
</style>
```

---

## 7. Risks / Unknowns

### Risk 1 — iOS Safari WebKit snap point cache invalidation (MEDIUM)

**Description:** WebKit cachea snap points en el primer layout y a veces no los recalcula cuando hijos cambian dinámicamente.

**Phase 1 impacto:** BAJO. Las 7 sections son estáticas en estructura.

**Phase 2 impacto:** MEDIO-ALTO. Cuando el theme cambie (background, font), si las dimensiones de algún elemento dentro del section cambian, podría invalidar snap. Mitigación documentada [CITED: xjavascript.com blog]: triggear reflow leyendo `el.offsetHeight` post-cambio.

**Decisión:** Documentar el pattern para Phase 2; en Phase 1 solo agregar el smoke test paso "scroll después de toggle PRM y verificar que snap sigue funcionando".

### Risk 2 — `?ch=N` race condition con snap points en iOS (LOW-MEDIUM)

**Description:** Sección "Pitfall 3" arriba. Mitigado con doble RAF.

**Decisión:** Aceptable con la mitigación; verificar en smoke test iOS (ítem nuevo: "Cargar `?ch=6` en iPhone Safari aterriza correctamente").

### Risk 3 — `@vueuse/core` package size (LOW)

**Description:** vueuse total es ~890 KB unpacked; con tree-shaking moderno Vite saca solo lo que se importa. Pero a algún dev podría darle ansiedad ver una dependencia "grande".

**Decisión:** Documentar en STATE.md que el tree-shaken footprint es ~3-5 KB (3 composables × 1-2 KB cada uno). Justificado.

### Risk 4 — `host: true` en `vite.config.js` y privacidad del LAN (LOW)

**Description:** Exponer `0.0.0.0:5173` significa que cualquier dispositivo en la WiFi puede acceder al dev server.

**Decisión:** Aceptable en desarrollo. Documentar en CLAUDE.md el cambio y la justificación. Si Rafael trabaja en una WiFi pública alguna vez (café, coworking), advertir que el dev server quedará expuesto. Para production no aplica (Firebase Hosting).

### Unknown 1 — Comportamiento real del flick rápido en iPhone Safari 17 / 18

**Description:** Aunque el bug #243582 es horizontal, no hay confirmación 100% verificada de que un flick vertical extra-rápido no haga skip de 2 chapters con `scroll-snap-stop: always`.

**Mitigación:** ESTE ES EL SMOKE TEST. Ítem 4 del checklist (10 ítems) lo verifica. Si falla, Plan 7 contiene el fallback (JS scroll intercept ya documentado en PITFALLS.md).

### Unknown 2 — Comportamiento de `aria-live="polite"` en avatar cuando el activeChapter cambia rápidamente durante un fast scroll

**Description:** Si el usuario scrollea rápido pasando por ch1→ch2→ch3→ch4→ch5 en 1 segundo, el screen reader podría narrate 5 era labels en sucesión, cosa que es ruido.

**Mitigación posible (no necesaria en Phase 1):** Debounce el `aria-label` update a 300ms post-snap-stable. **Decisión:** dejar como found UX issue para futuras phases si llega feedback de usuarios con screen readers. En Phase 1 mantener `aria-live="polite"` que UI-SPEC §7.2 dicta.

---

## 8. Verification Approach per CORE/MOB/iOS/A11Y Requirement

| Requirement | How verified |
|-------------|--------------|
| **CORE-01** ScrollShell vertical scroll-snap | Manual: scroll en desktop → snappea entre 7 chapters. Automated: `scrollShellEl.style.scrollSnapType === 'y mandatory'` |
| **CORE-02** 7 chapters coexisten en DOM | Automated: `document.querySelectorAll('[data-chapter]').length === 7`; no `v-if` en chapters |
| **CORE-03** `useScrollState` + IO | Automated: composable test (unit): mock IO entries → `activeChapter.value` actualiza |
| **CORE-04** `scroll-snap-stop: always` | Manual: flick rápido en mobile → solo avanza 1 chapter por gesto (smoke test ítem 4) |
| **CORE-05** Default ch3 + `?ch=N` override | Manual: carga `/` → ch3 visible. Carga `/?ch=0` → ch0 visible. Carga `/?ch=99` → ch3 visible (fallback) |
| **CORE-06** Keyboard ↑/↓ | Manual: Tab al ScrollShell → ↓ → snappea siguiente; ↑ → previo |
| **CORE-07** Timeline sticky bottom con marker + ticks click-nav | Manual: timeline visible siempre; click en tick `2009` → snap a ch2; marker se mueve mientras scrolleo |
| **CORE-08** `100dvh` chapters | Automated: `getComputedStyle(sectionEl).height` ≈ `window.innerHeight` ± 1px |
| **CORE-09** PRM respetado | Manual: activar PRM en SO → snap es jump instantáneo, avatar swap inmediato |
| **CORE-10** Sticky avatar slot top-left + swap reactivo | Manual: avatar visible always; cambia label al scrollear |
| **CORE-11** Timeline marker `scrollProgress` | Manual: hacer swipe parcial → marker se mueve continuamente; soltar → marker queda en posición proporcional |
| **MOB-01** Portrait + landscape | Manual: DevTools mobile emulator portrait → snap funciona; rotar a landscape → sigue funcionando |
| **MOB-03** ResizeObserver | Automated: composable test mock RO callback → reactive values actualizan |
| **iOS-01** `scroll-snap-stop: always` + `-webkit-overflow-scrolling: touch` | Automated CSS inspection + iOS smoke test ítem 5 |
| **iOS-02** Smoke test confirmatorio | Manual: 10-item checklist en iPhone real; documentar en EXECUTION-LOG. **NO-bloqueante** — anomalías se mitigan dentro de la fase |
| **A11Y-01** Skip link | Manual: Tab desde URL bar → skip link visible → Enter → foco en ScrollShell |
| **A11Y-02** `tabindex="0"` + keyboard nav | Manual: Tab al ScrollShell → outline visible; ↓ → snappea |
| **A11Y-05** PRM en transiciones | Manual: PRM ON → confirmar 4 transitions (snap, avatar, click-nav, hover ≤150ms se mantiene) |

---

## 9. Don't Hand-Roll — Stack Final

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue | 3.5.34 | Framework UI | Ya instalado, Composition API mandatoria |
| Vite | 5.4 | Build tool | Locked scaffold |
| @vueuse/core | 14.3.0 | `usePreferredReducedMotion`, `useResizeObserver`, `useRafFn` | Verified peer Vue ^3.5.0; tree-shaken footprint mínimo |

### Supporting
Ninguna otra librería se añade en Phase 1.

### Alternatives Rejected
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @vueuse/core 14 | @vueuse/core 10 | Innecesariamente regresivo — Vue ya está en 3.5 |
| @vueuse/core 14 | Composables custom | ~200 LOC añadidos; reimplementación; sin cleanup automático |
| CSS scroll-snap | GSAP ScrollTrigger / Lenis / Locomotive | CONSTRAINT del proyecto |
| Module-level `ref` para activeChapter | Pinia | CONSTRAINT del proyecto |
| `?ch=N` parsing manual | Vue Router | CONSTRAINT del proyecto |

### Installation

```powershell
# En el working directory
npm install @vueuse/core
# Update package.json manually: "vue": "^3.5.0"
# (refleja la realidad de la instalación — no requiere `npm install vue@^3.5.0` porque ya está)
```

### Version Verification

[VERIFIED: 2026-05-12 npm registry]
- `vue@latest`: 3.5.34 (matches installed)
- `@vueuse/core@latest`: 14.3.0, peer `vue: ^3.5.0` (satisfied)

---

## 10. Runtime State Inventory

Phase 1 es **greenfield** — sin estado runtime previo que migrar. Las categorías:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by repo inspection (no DBs, no datastores) | — |
| Live service config | None — Vite dev server local only | Cambiar `vite.config.js` `host` (NO data migration, solo edit config) |
| OS-registered state | None — verified (sin tasks, sin pm2, sin services) | Firewall rule Windows (one-time, manual o vía prompt UAC) |
| Secrets/env vars | None — no `.env` files; `GEMINI_API_KEY` para pixelforge fuera de Phase 1 | — |
| Build artifacts | `node_modules/` existente con `vue@3.5.34` e idéntico al manifest desired; no stale artifacts | `npm install @vueuse/core` regenera lockfile |

**Conclusión:** Phase 1 es código + config puros, sin runtime state migration.

---

## 11. Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Vite | ✓ | runtime detectable | — |
| npm | Install vueuse | ✓ | bundled with Node | — |
| Vue 3.5+ | vueuse peer dep | ✓ | 3.5.34 (verified `npm list vue`) | — |
| Vite 5+ | Dev server | ✓ | 5.4.x | — |
| iPhone o iPad para smoke test | iOS-02 | ⚠ assume sí (Rafael propio) | — | BrowserStack si no aplica |
| WiFi compartida PC ↔ iPhone | iOS smoke test acceso | assumed | — | Personal Hotspot del iPhone |
| Windows Defender firewall permite TCP 5173 | LAN access | requires action | — | `New-NetFirewallRule` (manual one-time) |

**Missing dependencies with no fallback:** Ninguna que bloquee Phase 1.

**Missing dependencies with fallback:** iPhone físico (BrowserStack como plan B).

---

## 12. Validation Architecture

`workflow.nyquist_validation: true` en `config.json` — incluyo esta sección.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **No instalado todavía** — requiere Wave 0 setup |
| Recomendado | Vitest (Vue 3 + Vite native, mismo runtime, fastest) |
| Config file | `vitest.config.js` (a crear en Wave 0) |
| Quick run command | `npm test -- --run` (post-Wave-0) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CORE-01 | ScrollShell tiene `scroll-snap-type: y mandatory` | unit (DOM inspection) | `vitest run tests/scroll-shell.test.js` | ❌ Wave 0 |
| CORE-02 | 7 sections coexisten | unit | `vitest run tests/scroll-shell.test.js` | ❌ Wave 0 |
| CORE-03 | `useScrollState` IO triggera `activeChapter` | unit (mock IO) | `vitest run tests/composables/useScrollState.test.js` | ❌ Wave 0 |
| CORE-04 | `scroll-snap-stop: always` aplicado | unit (CSS computed) | mismo | ❌ Wave 0 |
| CORE-05 | `?ch=N` parsing | unit | `vitest run tests/composables/useScrollState.test.js` (mock `location.search`) | ❌ Wave 0 |
| CORE-06 | Keyboard handlers preventDefault | unit (simulate keydown) | `vitest run tests/components/ScrollShell.test.js` | ❌ Wave 0 |
| CORE-07/11 | Timeline marker `left` derives from scrollProgress | unit (mock scroll) | `vitest run tests/components/StickyTimeline.test.js` | ❌ Wave 0 |
| CORE-08 | `100dvh` declared on sections | unit (CSS string check) | mismo | ❌ Wave 0 |
| CORE-09 | PRM switches behavior | unit (mock matchMedia) | `vitest run tests/composables/usePRM.test.js` | ❌ Wave 0 |
| CORE-10 | Avatar `aria-label` updates with activeChapter | unit (component) | `vitest run tests/components/StickyAvatar.test.js` | ❌ Wave 0 |
| MOB-01/03 | ResizeObserver wired | unit (mock RO) | `vitest run tests/composables/useScrollState.test.js` | ❌ Wave 0 |
| A11Y-01 | Skip link visible at mount | unit (component) | `vitest run tests/components/SkipLink.test.js` | ❌ Wave 0 |
| A11Y-02 | ScrollShell has `tabindex="0"` | unit | `vitest run tests/components/ScrollShell.test.js` | ❌ Wave 0 |
| A11Y-05 | PRM stops crossfade | unit | `vitest run tests/components/StickyAvatar.test.js` | ❌ Wave 0 |
| **iOS-01 / iOS-02** | Smoke test en hardware real | **manual-only** | — | N/A — checklist en EXECUTION-LOG |

**Manual-only justification para iOS:** El comportamiento de WebKit + scroll snap + momentum es un integration test que no se puede simular con JSDOM. iOS Safari requiere hardware real (PITFALLS.md confirma: simulator no reproduce el bug class).

### Sampling Rate

- **Per task commit:** `npm test -- --run` (rápido, < 5s post-Wave-0)
- **Per wave merge:** `npm test` (full suite, < 30s estimate)
- **Phase gate:** Full suite green + iOS smoke test PASS antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `package.json` add `"test": "vitest"` script y devDeps `vitest`, `@vue/test-utils`, `jsdom`
- [ ] `vitest.config.js` — JSDOM environment + Vue plugin
- [ ] `tests/setup.js` — global mocks: `IntersectionObserver`, `ResizeObserver`, `matchMedia`, `requestAnimationFrame`
- [ ] `tests/composables/useScrollState.test.js` — covers CORE-03/05/11/MOB-03
- [ ] `tests/composables/usePRM.test.js` — covers CORE-09/A11Y-05
- [ ] `tests/components/ScrollShell.test.js` — covers CORE-01/02/04/06/A11Y-02/CORE-08
- [ ] `tests/components/StickyAvatar.test.js` — covers CORE-10
- [ ] `tests/components/StickyTimeline.test.js` — covers CORE-07/11
- [ ] `tests/components/SkipLink.test.js` — covers A11Y-01

**Wave 0 install:**

```powershell
npm install --save-dev vitest @vue/test-utils jsdom
```

**Vitest config skeleton:**

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
  },
})
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | iOS Safari vertical snap está bien soportado (WebKit #243582 es horizontal-only) | §Área 1 | Si está mal, el smoke test detecta inmediato; mitigación = JS scroll intercept (ya en PITFALLS.md project-level) |
| A2 | `100dvh` post-octubre-2025 iOS bug NO afecta height de chapter sections (solo overlays/backdrops full-screen) | §Área 1 | Si afecta, fallback dual `height: 100vh; height: 100dvh;` ya provisto preventivamente |
| A3 | RAF coalesca scroll events sin perder fidelidad para el marker (60fps suficiente) | §Área 2 | Solo se sentiría si scroll es muy rápido; aceptable trade-off vs throttle scroll listener |
| A4 | `threshold: 0.6` en IO desambigua correctamente para 7 chapters de `100dvh` con mandatory snap | §Área 2 | Si dispara flicker, subir a 0.7 — trivial fix |
| A5 | El usuario Rafael tiene iPhone propio o acceso a uno (smoke test) | §Open-Q-B | Si no, fallback = BrowserStack o diferir iOS-02 (es NO-bloqueante) |
| A6 | Windows Defender prompt UAC al primer `npm run dev` con `host: true` será aceptado | §Área 8 | Si no aparece, comando `New-NetFirewallRule` documentado |

---

## Open Questions (post-research)

Las 3 Open Questions del CONTEXT.md tienen recomendación firme arriba. No queda nada para resolver con el usuario salvo:

1. **Confirmación implícita por el planner:** ¿Rafael tiene iPhone propio para el smoke test? Si NO, el planner añade un task que active BrowserStack o difiere iOS-02 a post-Phase-1 (sigue siendo no-bloqueante).

   - Recommendation: el planner pregunta inline en el PLAN.md como "user confirmation needed" antes del task de smoke test.

---

## Sources

### Primary (HIGH confidence)
- [VueUse `usePreferredReducedMotion`](https://vueuse.org/core/usePreferredReducedMotion/) — API + render component pattern
- [Vue 3 Composition API docs](https://vuejs.org/guide/reusability/composables) — composables singleton pattern, `provide/inject`
- [MDN `scroll-snap-type`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type), [`scroll-snap-stop`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-stop), [`scroll-snap-align`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-align)
- [MDN IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [MDN `position: fixed` Containing Block notes](https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block)
- [MDN ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver), [orientationchange deprecated note](https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientationchange_event)
- [Vite `server.host` docs](https://vite.dev/config/server-options) — `host: true` exposes LAN
- [WebKit Bugzilla #243582](https://bugs.webkit.org/show_bug.cgi?id=243582) — title confirms horizontal-only scope
- [WebKit Blog "Scroll Snapping with CSS Snap Points"](https://webkit.org/blog/4017/scroll-snapping-with-css-snap-points/)
- npm registry verification 2026-05-12: `vue@3.5.34`, `@vueuse/core@14.3.0` peer `vue: ^3.5.0`

### Secondary (MEDIUM confidence)
- [css-tricks "Practical CSS Scroll Snapping"](https://css-tricks.com/practical-css-scroll-snapping/)
- [dev.to "Accessing Vite from another device"](https://dev.to/mahmud-r-farhan/accessing-localhost-from-another-device-vite-nextjs-react-express-guide-4m2e)
- [xjavascript.com "Fixing CSS Scroll Snap Visual Glitches on iOS"](https://www.xjavascript.com/blog/css-scroll-snap-visual-glitches-on-ios-when-programmatically-setting-style-on-children/) — WebKit cache invalidation
- [Apple Developer Forums thread 803987](https://developer.apple.com/forums/thread/803987) — iOS Safari 100dvh overlay bug (oct-2025)

### Tertiary (LOW confidence)
- Ninguna afirmación crítica reposa solo en una sola fuente sin verificación.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — vueuse + Vue 3.5.34 verificados vía npm view + npm list
- Architecture (composables + composition): HIGH — Vue 3 official docs
- Scroll-snap mechanics (vertical): HIGH — MDN + WebKit blog + cross-verified
- iOS edge cases: MEDIUM — basados en docs y reports oct-2025 + mitigación preventiva
- Pitfalls: HIGH — la mayoría heredados del research project-level previo + verificación cruzada

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (30 días para Vue/vueuse stable; re-check si Vite 6 lanza o iOS Safari publica fix del 100dvh overlay bug)

---

*Phase: 01-scroll-shell-sticky-anchors*
*Research generated: 2026-05-12*
*Consumed by: gsd-planner para producir PLAN.md atomicas + gsd-discuss-phase si surge contradicción*
