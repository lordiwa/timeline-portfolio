# Phase 1: Scroll Shell + Sticky Anchors - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Construir la infraestructura de scroll vertical del portafolio: un `ScrollShell` que contiene 7 chapter sections coexistentes en el DOM con CSS `scroll-snap-type: y mandatory`, dos anclajes sticky permanentes (avatar pixel-art top-left + timeline bottom con marker móvil + año + click-to-navigate), tracking reactivo del chapter activo vía IntersectionObserver, deep-link `?ch=N`, navegación con flechas ↑/↓, soporte para ambas orientaciones mobile sin overlay bloqueante, y smoke test confirmatorio en hardware iOS real (no es gate bloqueante).

Phase 1 NO incluye: themes era-auténticos por chapter (Phase 2), i18n (Phase 2), contenido real / bio / proyectos (Phase 3), pixel art de los busts (Phase 3), pixel art de fondos (Phase 4), escena Phaser ch6 (Phase 5), deploy (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Reduced-Motion Policy (cross-cutting — Phases 2-6 heredan)

Política rectora bajo `prefers-reduced-motion: reduce`: las transiciones *interaction-derived* ≤ 150ms están permitidas; las animaciones *auto-played / decorative* están OFF; las transiciones de área visual grande mantienen un crossfade sutil para evitar cuts bruscos.

- **D-01 — Scroll snap bajo PRM:** `scroll-snap-type: y mandatory` se mantiene siempre; bajo PRM cambia `scroll-behavior: smooth` a `scroll-behavior: auto` (jump instantáneo entre chapters, sin animación suave). El usuario sigue navegando chapter-a-chapter discretamente — no se cae a long-scroll plano ni a `proximity`.
- **D-02 — Swap del avatar sticky bajo PRM:** instantáneo, single-frame replace. Sin crossfade, sin opacity transition, sin slide. Coherente con el resto de la política bajo PRM y aceptable porque el avatar es un elemento visual pequeño (esquina top-left).
- **D-03 — Background morph entre eras bajo PRM:** crossfade rápido ≤ 150ms permitido. Justificación explícita del usuario: el background es de área grande y el cambio entre eras (terminal verde → 90s crudo → Flash → etc.) es lo bastante drástico para que un cut duro resulte jarring incluso para perfiles vestibulares. Phase 2 implementa transición default más larga y un branch `@media (prefers-reduced-motion: reduce)` que la baja a ≤ 150ms.
- **D-04 — Click-to-nav bajo PRM (timeline tick, flecha ↑/↓, query `?ch=N`):** instantáneo (`behavior: 'auto'`). Locked por CORE-11; confirmado aquí.
- **D-05 — HUD micro-animations bajo PRM:** transitions de hover y focus ≤ 150ms mantenidas (interaction-derived, no decoración). Decorative pulses, glows o highlights animados sobre el tick activo de la timeline están OFF — el estado activo se distingue por color/contraste estático.
- **D-06 — Principio rector documentado:** ante cualquier futura animación cross-cutting (ch4 paneles flotantes, ch5 micro-interactions, ch6 Phaser parallax), aplicar la heurística: ¿es interaction-derived y ≤ 150ms? → permitida. ¿Es auto-played o decorative? → OFF bajo PRM. ¿Es área grande con cambio drástico? → crossfade sutil permitido.

### Claude's Discretion (gray areas no discutidas — research/planning resuelve)

El usuario eligió focalizar la discusión en PRM. Las siguientes áreas quedan abiertas y serán resueltas por el `gsd-phase-researcher` y el `gsd-planner` durante `/gsd-plan-phase`. Cada una debe quedar documentada en RESEARCH.md / PLAN.md con la decisión tomada:

- **Open-Q-A — Runtime base (Vue/vueuse blocker):** STATE.md flag — `@vueuse/core 14.3.0` pide Vue 3.5+ pero el scaffold está pineado en `^3.4.0`. Tres caminos viables:
  1. Upgrade Vue a 3.5+ e instalar `@vueuse/core` para `useResizeObserver`, `useIntersectionObserver`, `useEventListener`, `useStorage`, `useMediaQuery`.
  2. Pinear `@vueuse/core` a una versión anterior compatible con Vue 3.4.
  3. Cero `@vueuse/core` — escribir `useScrollState`, `useResizeObserver` wrapper, listeners de teclado, y media-query handlers manualmente (composables propios, ~200 LOC adicionales).

  Restricción: lo que se elija acá rige también Phase 2 (i18n composable, locale toggle) y Phase 5 (Phaser HMR boundaries). Recomendar el camino con menos deuda futura.

- **Open-Q-B — Protocolo del smoke test iOS:** iOS-02 ya no es gate bloqueante (REQUIREMENTS.md §iOS), pero hay que definir:
  - Qué hardware se usa (iPhone/iPad propio, BrowserStack, prestado de un amigo).
  - Qué exactamente verifica el test (vertical snap chapter-a-chapter, sticky elements visibles sin solaparse con Safari's bottom toolbar dynamic, ambas orientaciones).
  - Cuándo corre en la fase (al final como acceptance check, en mitad como early signal, iterativo en cada PR).
  - Cómo se documenta el resultado (checklist + screenshots, grabación de pantalla, simplemente "OK" en STATE.md).

- **Open-Q-C — Phase 1 placeholder visual:** Phase 1 NO construye themes (Phase 2), ni contenido real (Phase 3), ni pixel art (Phase 3-4). Pero las 7 chapter sections + el sticky avatar slot + la sticky timeline deben renderear *algo* para verificar la mecánica. Tres estrategias:
  1. Solo bloques de color distintos + número grande de chapter en cada section; avatar slot con un placeholder gris sized; timeline con 7 dots numerados y marker.
  2. Era-tinted soft (background con un tinte HSL diferente por chapter ya hintando el theme), avatar slot con silueta SVG/emoji por chapter, timeline mostrando año (1995..2026) por tick.
  3. Construir ya la timeline definitiva (forma final que Phase 2 solo teme) con un look "neutro" que aguanta cualquier theme, y las sections vacías salvo título grande.

  Recomendar la estrategia que minimiza re-trabajo en Phase 2 sin invadir su scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 — fuente de verdad
- `.planning/PROJECT.md` — concepto canónico post-pivote vertical+sticky, key decisions, constraints, audiencia, mapeo de eras por chapter
- `.planning/REQUIREMENTS.md` §CORE / §MOBILE / §iOS / §A11Y — los 17 IDs de Phase 1 (CORE-01..11, MOB-01, MOB-03, iOS-01, iOS-02, A11Y-01, A11Y-02, A11Y-05) y la nota de pivote 2026-05-12 en la coverage section
- `.planning/ROADMAP.md` §"Phase 1: Scroll Shell + Sticky Anchors" — goal, success criteria, requirements list
- `.planning/STATE.md` — blockers vigentes (vueuse, content readiness, palette governance) y log del pivote

### Cross-cutting (Phase 2-6 heredan políticas definidas aquí)
- `.planning/ROADMAP.md` §"Phase 2: Theme System + i18n" — el morph de background entre eras (Open-Q-C y D-03) cae en su scope; la política PRM definida aquí debe respetarse
- `.planning/ROADMAP.md` §"Phase 5: Phaser Chapter 6" — la sub-success-criteria 5 de Phase 5 ya dice "naves estáticas o velocidad mínima bajo PRM"; consistencia con D-06

### Proyecto / OS / Stack
- `CLAUDE.md` — comunicación en español, Windows 11 / PowerShell 5.1, stack Vue 3 + Vite 5 + Phaser 3.86, naming `ch{N}-{descriptor}.png` en `public/assets/`, anti-patterns ya documentados (no character animation, no Vue Router, no Pinia, no Lenis/Locomotive/GSAP en v1)

### Research project-level (consultar como referencia, marcados SUPERSEDED post-pivote)
- `.planning/research/STACK.md` — recomendaciones de stack (Vue 3 + Vite + vue-i18n v11 + IntersectionObserver patterns) son aún vigentes; recomendaciones de GSAP/Lenis/Locomotive están obsoletas, no usar
- `.planning/research/PITFALLS.md` — pitfalls genéricos sobre theme bleed, layout shift de i18n, Phaser memory leaks, `100dvh` para evitar address-bar drift siguen vigentes; el pitfall principal (WebKit #243582 horizontal momentum) ya NO aplica
- `.planning/research/ARCHITECTURE.md` — patrón "scroll IS the navigation, no Vue Router" sigue válido reframed a vertical; structure tree es referencial pero no autoritativo post-pivote
- `.planning/research/FEATURES.md` — table-stakes a11y/i18n/JSON-LD/OG son vigentes; recomendaciones de "scroll cue horizontal", "portrait overlay" están obsoletas
- `.planning/research/SUMMARY.md` — síntesis horizontal-era; usar PROJECT.md / REQUIREMENTS.md como fuente canónica en lugar de SUMMARY

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Greenfield para Phase 1.** El scaffold actual tiene solo:
  - `src/main.js` — entry point standard (`createApp(App).mount('#app')`)
  - `src/App.vue` — placeholder de 25 líneas con `<main class="shell">` + título + párrafo
  - `index.html` — sets `html, body` con `min-height: 100vh`, `background: #0b0b16`, monospace font, e `image-rendering: pixelated` global para `img`/`canvas`
  - `vite.config.js` — `host: 127.0.0.1`, `port: 5173`, `open: true`
  - `package.json` — `vue@^3.4.0`, `phaser@^3.86.0`, `vite@^5.4.0`, `@vitejs/plugin-vue@^5.0.0`
- **Nothing to reuse — todo el código de Phase 1 se escribe nuevo.** El placeholder de `App.vue` se reemplaza completamente por la composición ScrollShell + StickyAvatar + StickyTimeline + 7 ChapterSection.

### Established Patterns
- **`image-rendering: pixelated` global** en `index.html` para que cualquier `img` o `canvas` que se agregue después conserve el aspecto pixel-art sin smoothing del navegador. Aplica al avatar sticky y a cualquier asset futuro.
- **Vite dev server en `127.0.0.1:5173`** — no `localhost`. Si Rafael accede desde un mobile real en la misma red para smoke test, hay que cambiar a `0.0.0.0` o usar tunnel; documentar en Open-Q-B.
- **Sin TypeScript, sin Pinia, sin Vue Router** — patrones declarativos puros con composables.

### Integration Points
- **`#app` mount target** en `index.html` (línea 24). El componente raíz es `App.vue`; ScrollShell vivirá dentro de App.vue.
- **`public/assets/`** existe y vacío; convención de naming `ch{N}-{descriptor}.png` definida en CLAUDE.md y REQUIREMENTS.md §ART-05. Phase 1 no genera assets pero deja la estructura preparada para que el avatar sticky pueda apuntar a `public/assets/ch{N}-bust.png` cuando Phase 3 los genere.
- **Default landing chapter 3** — `useScrollState` debe inicializar `activeChapter` en `3` y hacer `scrollIntoView` programático del chapter 3 al mount (o usar `?ch=N` si está presente).

</code_context>

<specifics>
## Specific Ideas

- **Layout sticky confirmado por el usuario (2026-05-12):** avatar pixel-art bust sticky en **top-left** (esquina superior izquierda); timeline horizontal sticky en **bottom** (parte inferior, full-width). Entre ambos, el contenido del chapter activo scrollea verticalmente y el background morfea entre eras al cambiar de chapter activo.
- **Avatar slot es único — swap por `activeChapter`:** un solo elemento DOM que cambia su `src` (o renderiza diferentes layers, decidirá el planner) según el chapter activo. No es una galería ni un carousel; es un slot fijo con contenido reactivo. Ver D-02 para política PRM.
- **Timeline marker tracks `scrollProgress` (0..1):** el marker se mueve continuamente mientras el usuario hace scroll libre dentro del rango entre dos snap points; al snappear, jumpea al tick del chapter activo. Bajo PRM, el jump es instantáneo (consecuencia de D-01) pero el tracking continuo durante el swipe libre se mantiene (es data binding de gesto manual, no animación CSS).
- **Tradeoff explícito aceptado:** la política PRM tiene una inconsistencia deliberada — avatar swap es instantáneo (D-02) pero background morph permite crossfade ≤150ms (D-03). El usuario diferencia por *visual weight*: elementos chicos toleran cuts duros; elementos full-screen necesitan suavizado mínimo.
- **iOS no es gate bloqueante** — el WebKit bug #243582 era específico de momentum horizontal; con scroll vertical el snap está bien soportado en Safari iOS. El smoke test queda como confirmación, no como abort criteria (ver Open-Q-B).

</specifics>

<deferred>
## Deferred Ideas

- **HUD focus styles era-themed (A11Y-03 Phase 2):** el usuario no lo mencionó pero está en REQUIREMENTS — focus `outline` visible que varía por chapter sin perder contraste 4.5:1. Phase 2 lo implementa; Phase 1 puede dejar un focus ring neutral (color de browser default o un outline simple).
- **Scroll progress indicator separado de la timeline:** algunas referencias visuales podrían mostrar una barra horizontal de progreso global *además* de la timeline; el usuario solo pidió la timeline. No se duplica.
- **Snap-to-mid-chapter scroll positions:** algunos sitios permiten "freeze" mid-chapter (ej. tras un click en CTA). v1 es snap mandatory chapter-a-chapter; no se considera mid-chapter snap en Phase 1.
- **Deep-link enriquecido (URL hash `#ch-N` que actualiza al scrollear):** declarado v2 en REQUIREMENTS §DLINK-01/02. Confirmado deferido a v2.

</deferred>

---

*Phase: 1-scroll-shell-sticky-anchors*
*Context gathered: 2026-05-12*
