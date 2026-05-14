---
phase: 05-phaser-chapter-6
plan: 05
subsystem: vue-overlay-a11y-synthwave
tags: [vue3, project-overlay, modal, focus-trap-manual, escape-key, click-outside, restore-focus, null-guard, synthwave, neon-glow, backdrop-filter, progressive-enhancement, mobile-fullscreen, prm-instant, tabnabbing-mitigation, dialog-aria, a11y, css-layers]

# Dependency graph
requires:
  - phase: 05-phaser-chapter-6
    plan: 01
    provides: "RED scaffolds tests/components/ProjectOverlay.test.js T1-T6 (incl. T6 null guard projectId inválido) + tests/a11y/focus-trap.test.js T1-T3 (Tab cycle / Shift+Tab cycle / restore focus)"
  - phase: 05-phaser-chapter-6
    plan: 04
    provides: "src/components/ProjectOverlay.vue STUB (W3) con API contract locked (props.projectId + emits.close) + Chapter6Content.vue ya consumiendo overlay vía v-if=activeProject :project-id @close + reglas Phase 5 W3 ch6 (.ch6-layout/.ch6-canvas-host/.ch6-mantra) en chapter-themes.css @layer components"
  - phase: 02-theme-system-i18n
    provides: "i18n keys ui.closeOverlay + ui.openProject + chapters.6.* + projects.ch6-*.title/desc; @layer components hook en chapter-themes.css"
  - phase: 03-chapter-3-end-to-end
    provides: "projects[] shape D3-03 con titleKey/descKey/year/role/techStack/link + 3 items ch6 (ar-vr / remoose / software-mind) poblados Phase 5 W0"
  - phase: 01-scroll-shell-sticky-anchors
    provides: "prm inject contract (prefersReduced ref) — usado defensive via inject('prm', null) aunque la lógica PRM efectiva vive en @media CSS Task 2"
provides:
  - "src/components/ProjectOverlay.vue (~226 LOC) — modal Vue synthwave neon-glow completo: role=dialog aria-modal aria-labelledby (conditional), close button siempre presente con i18n aria-label, focus trap manual ~30 LOC (querySelectorAll + first/last cycle), ESC keydown global + cleanup pareado, click-outside backdrop (target === root validation), restore focus al lastFocusedEl en unmount, null guard v-if=project sobre todo el card content (Warning 9 RESOLVED — threat T-05-W4-01 mitigation), link target=_blank con rel=noopener noreferrer (T-05-W4-02 tabnabbing mitigation)."
  - "src/styles/chapter-themes.css @layer components — bloque Phase 5 W4 ProjectOverlay (~182 líneas añadidas): .project-overlay backdrop fixed inset:0 z:50 + @supports backdrop-filter:blur(8px) progressive enhancement; .project-overlay__card glow doble box-shadow (cyan #4dffff + pink #ff3ca6) + animation overlay-enter 200ms; @keyframes overlay-enter scale 0.95→1; @media max-width 599px fullscreen mobile (100dvh iOS notch safe); @media prefers-reduced-motion animation:none (D5-08 + A11Y-05); .project-overlay__close/title/year/role/tech/desc/link tipografía + colores synthwave."
  - "Tests turned GREEN: tests/components/ProjectOverlay.test.js T1-T6 (6 tests: ESC close, backdrop click, content render, aria-label Cerrar, rel noopener noreferrer, null guard projectId inválido) + tests/a11y/focus-trap.test.js T1-T3 (3 tests: Tab cycle, Shift+Tab cycle, restore focus to lastFocusedEl). Total 9 tests RED→GREEN."
  - "Suite global: 424/424 tests GREEN — target del plan cumplido, todos los waves autonomous Phase 5 (W0-W4) cerrados sin regression. Última wave pendiente es W5 (Plan 05-06, checkpoint:human-verify Rafael manual sign-off)."
affects:
  - "05-06 W5 (manual checklist Rafael): puede ahora validar visualmente el slice end-to-end completo — npm run dev + scroll a ch6 + click planet → overlay synthwave aparece con glow doble cyan+pink + ESC/click-outside/close button cierran + Tab cycla focus dentro del card + restore focus al planet-button trigger al cerrar + projectId inválido no crashea + mobile fullscreen responsive + PRM instant."
  - "Phase 6 (deploy): Phase 5 cierra todos los waves autonomous. Phase 6 puede empezar el chunk size optimization (Phaser 341KB gzip lazy chunk, target ≤200KB → Vite manualChunks split) o cualquier deployment prep."

# Tech tracking
tech-stack:
  added: []  # zero new deps — manual focus trap evitó @vueuse/integrations (peer dep focus-trap ~8KB)
  patterns:
    - "Manual focus trap pattern ~30 LOC (Open Q3 RESOLVED — Don't Hand-Roll §10): querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex=\\\"-1\\\"])') + first/last cycle con preventDefault. Trade-off vs @vueuse/integrations useFocusTrap: para un scope de 3-5 focusables con tab order trivial (close → link), ~8KB peer dep `focus-trap` es desbalanceado. Manual es leaner, sin dep nueva, code review-able directo."
    - "Null guard wrapper pattern (Warning 9 RESOLVED — defensive engineering): `computed project = projects.find(...)` puede retornar undefined; template usa `<template v-if=\"project\">` envolviendo todo el card content. Close button queda FUERA del v-if para garantizar ≥1 focusable + UX cerrar incluso con projectId inválido. Test T6 mount('ch6-nonexistent') → no crash + .project-overlay__title NO existe + close button funcional. Threat T-05-W4-01 mitigation enforced via test."
    - "ESC keydown global pattern (D5-07 + RESEARCH §Pattern 10): `document.addEventListener('keydown', handleKeydown)` en onMounted PAREADO con `removeEventListener` en onBeforeUnmount (T-05-W4-04 listener leak mitigation). handleKeydown branch en e.key === 'Escape' → emit('close') y e.key === 'Tab' → trapTab(e). Pattern alternativo (sólo overlay-scoped keydown via @keydown.esc en root) fue evaluado — descartado porque requiere que el overlay tenga focus inicial, lo cual depende del setTimeout 0 que también dispara focus, creando race ambigüedad. Global document listener es más predecible."
    - "Click-outside discriminator pattern: `handleBackdropClick(e) { if (e.target === overlayRef.value) emit('close') }`. e.target apunta al elemento clickeado (deepest); si fue el card o cualquier hijo, no matchea root. Pattern WCAG compliant (modal pattern guidance) — alternativa con stopPropagation en .card sería más frágil porque requiere que TODO click handler interno proteja contra bubbling. Source-of-truth: RESEARCH §Pattern 10 lines 998-1002."
    - "Restore focus pattern (A11Y D5-07 + WCAG 2.1 Focus Order): `let lastFocusedEl = null` (NO ref — variable local component-scope, no necesita reactivity). onMounted captura `document.activeElement` (el planet-trigger sr-only button que abrió el modal). onBeforeUnmount invoca `lastFocusedEl?.focus()`. Optional chaining defensive — edge case test envs sin pre-focus. Cuando el overlay se cierra, keyboard/screen-reader user vuelve al planet button que lo abrió, sin perder navegación. Threat T-05-W4-06 (focus history leak) es 'accept' — lastFocusedEl es scope local, se descarta al unmount."
    - "Tabnabbing mitigation hardcoded (T-05-W4-02): link `target=\"_blank\"` siempre con `rel=\"noopener noreferrer\"` literal en template. Test T5 source-regex enforça presencia de ambos tokens. window.opener attack vector queda bloqueado — nuevo tab NO puede manipular el window del portafolio. Pattern es safe-by-default — no es un override condicional."
    - "Progressive enhancement @supports backdrop-filter (RESEARCH §Pattern 10): base rule sets `background: rgba(26, 14, 61, 0.7)` (sólido translúcido legible sin blur); @supports block override a `0.5 + backdrop-filter: blur(8px)` solo cuando el navegador soporta. Navegadores legacy (Safari <14 sin -webkit-backdrop-filter, Firefox <103) ven backdrop sólido sin blur — legible y sin layout shift. Vendor prefix `-webkit-backdrop-filter` incluido para Safari 9-14 stack."
    - "Scope NO scoped a [data-chapter=\"6\"] para .project-overlay rules (D5-07 + Pattern 10): el modal es position:fixed inset:0 z-index:50 ENCIMA del shell, fuera del scope chapter. Si fuera scoped, heredaría transform/position del section durante scroll-snap (CORE-04), rompiendo el inset:0 fixed. Trade-off: si Rafael añade ch7+ con su propio overlay, el patrón .project-overlay sería ambiguo — pero por ahora chapter 6 es exclusivo + el namespace `__card/__close/__title` mitiga colisiones futuras."
    - "Comment placement quirk (Vue Test Utils + jsdom): comentarios HTML como root del `<template>` (antes del primer elemento real) convierten al componente en multi-root → `wrapper.element` apunta al fragment intermedio NO al root del componente real → `focus()` en elementos children no surte efecto (parent chain detached). Pattern: comentarios DENTRO de elementos (después del opening tag) son safe. Aplicado en ProjectOverlay.vue — comentarios docstring-style se movieron dentro del `<div class=project-overlay>` y `<article class=card>`."

key-files:
  created:
    - ".planning/phases/05-phaser-chapter-6/05-05-SUMMARY.md (este archivo)"
  modified:
    - "src/components/ProjectOverlay.vue — reemplazo COMPLETO del stub W3 (85 LOC) por componente synthwave completo (226 LOC) con focus trap manual + ESC + click-outside + restore focus + null guard. API contract intacto (props.projectId String required + emits.close)."
    - "src/styles/chapter-themes.css — añadidas ~182 líneas al @layer components: bloque .project-overlay con @supports backdrop-filter + .project-overlay__card glow doble + @keyframes overlay-enter + @media mobile fullscreen + @media PRM + variants __close/__title/__year/__role/__tech/__desc/__link."
    - "tests/components/ProjectOverlay.test.js — Rule 1 bug fix: `attachTo: document.body` movido de adentro de `global` al top-level de mount options (Vue Test Utils v2 contract). Antes era no-op silencioso → componente quedaba detached → element.focus() fallaba en jsdom."
    - "tests/a11y/focus-trap.test.js — Rule 1 bug fix idéntico: `attachTo: document.body` movido al top-level."

decisions:
  - "Focus trap MANUAL ~30 LOC sobre @vueuse/integrations useFocusTrap (Open Q3 RESOLVED — Don't Hand-Roll §10): peer dep `focus-trap` ~8KB para un scope de 3-5 focusables con tab order trivial es desbalanceado. Pro manual: cero deps, code-review-able directo, copy verbatim de RESEARCH §Pattern 10 lines 979-995. Pro @vueuse: handle complex tab order automático (radio groups, contentEditable, iframes), arrow-key navigation. Decision driver: scope ch6 overlay es siempre [close, opt:link] = max 2 focusables; complejidad no justifica dep."
  - "Close button FUERA del v-if=project (Warning 9 RESOLVED): el close button siempre presente garantiza ≥1 focusable (focus trap no-op si focusables.length === 0 sería frágil) + UX (usuario PUEDE cerrar incluso con projectId inválido) + A11Y (modal sin close button no es un patrón válido WCAG). Trade-off vs poner todo dentro del v-if=project: este último crashearía el setTimeout 0 closeBtn.focus() porque closeBtnRef sería undefined."
  - "ESC key vía document.addEventListener en lugar de @keydown.esc local: global listener funciona desde cualquier focus position (incluso si el usuario clickeó fuera del overlay pero dentro del modal backdrop sin focus en card). Local @keydown.esc requeriría focus en el overlay primero — frágil con el setTimeout 0 race. Trade-off: listener leak risk si onBeforeUnmount falla → mitigado por addEventListener pareado + Vue garantía de unmount cuando v-if=false."
  - "aria-labelledby binding CONDICIONAL `:aria-labelledby=\"project ? \\`project-${projectId}-title\\` : null\"`: si project es undefined, NO setear aria-labelledby (sería referencia rota a un id que no existe en el DOM). Screen-readers se quejan de aria-labelledby con id no resolvable. Cuando project es undefined, el modal queda solo con role=dialog aria-modal=true sin labelledby — accesibilidad degradada gracefulmente."
  - "CSS scope global NO scoped a [data-chapter=\"6\"] para .project-overlay (D5-07 + Pattern 10): el modal vive position:fixed encima del shell. Scoped causaría inheritance issues con scroll-snap transform. Trade-off documentado vs riesgo de colisión namespace futura — namespace `__card/__close` mitiga."
  - "Comentarios docstring-style HTML reemplazados por comentarios dentro de elementos (no como root del template) tras descubrir multi-root issue Vue Test Utils + jsdom (Rule 1 secundario al fix de tests). Pattern documentado en tech-stack patterns para evitar re-cometerlo en futuros components que necesiten focus management."

metrics:
  duration: ~8min
  completed: 2026-05-14
  tasks_completed: 2
  files_modified: 4  # ProjectOverlay.vue + chapter-themes.css + 2 tests fix
  files_created: 1   # 05-05-SUMMARY.md
  tests_green_in_plan: 9  # ProjectOverlay T1-T6 + focus-trap T1-T3
  tests_total_suite: 424  # 424/424 GREEN — target del plan
  commits:
    - "08107e9 — feat(05-05): ProjectOverlay synthwave modal + manual focus trap + null guard (D5-07, Pattern 10)"
    - "128ffe8 — feat(05-05): synthwave CSS rules .project-overlay @layer components (D5-07 + Pattern 10)"
---

# Phase 5 Plan 05: W4 ProjectOverlay synthwave completo + focus trap manual + null guard Summary

**One-liner:** ProjectOverlay.vue reemplaza el stub W3 con modal Vue synthwave neon-glow completo (backdrop blur + double glow cyan/pink + focus trap manual ~30 LOC sin @vueuse dep + ESC + click-outside + restore focus + null guard v-if=project + tabnabbing mitigation + mobile fullscreen + PRM instant); chapter-themes.css recibe el bloque .project-overlay @layer components con @supports backdrop-filter progressive enhancement. Suite global 424/424 GREEN.

## What was built

### Task 1 — `src/components/ProjectOverlay.vue` (stub → componente completo)

**Reemplazo total** del stub W3 (85 LOC, mensaje "STUB · W4 replaces") por la implementación verbatim de RESEARCH §Pattern 10 lines 940-1059 (~226 LOC) con la adición crítica del **null guard `v-if="project"`** (Warning 9 RESOLVED — threat T-05-W4-01).

**API contract intacto** (locked desde W3):
- Props: `{ projectId: { type: String, required: true } }`
- Emits: `['close']`

**Lógica `<script setup>`:**
- Imports: `ref, onMounted, onBeforeUnmount, computed, inject, useTemplateRef` desde 'vue'; `useI18n` desde 'vue-i18n'; `projects` desde '@/data/projects'.
- `const project = computed(() => projects.find(p => p.id === props.projectId))` — `null` si no match.
- `overlayRef = useTemplateRef('overlay')` + `closeBtnRef = useTemplateRef('closeBtn')`.
- `let lastFocusedEl = null` (variable local component-scope, NO ref — no necesita reactivity).
- `handleKeydown(e)`: branch ESC → emit('close'); Tab → `trapTab(e)`.
- `trapTab(e)`: `overlayRef.value.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')`; primer/último focusable; Shift+Tab desde first → last; Tab desde last → first; ambos con `preventDefault`.
- `handleBackdropClick(e)`: `if (e.target === overlayRef.value) emit('close')` — discriminador click-outside vs click-inside.
- `onMounted`: `document.addEventListener('keydown', handleKeydown)` + `lastFocusedEl = document.activeElement` + `setTimeout(() => closeBtnRef.value?.focus(), 0)`.
- `onBeforeUnmount`: `document.removeEventListener('keydown', handleKeydown)` + `lastFocusedEl?.focus()` restore.

**Template:**
- Root `<div ref="overlay" class="project-overlay" role="dialog" aria-modal="true" :aria-labelledby="project ? \`project-${projectId}-title\` : null" @click="handleBackdropClick">`.
- `<article class="project-overlay__card">` contiene el contenido.
- **Close button SIEMPRE presente** (fuera del v-if=project): `<button ref="closeBtn" class="project-overlay__close" :aria-label="t('ui.closeOverlay')" @click="emit('close')">×</button>`. Garantiza ≥1 focusable + UX cerrar incluso con projectId inválido.
- **`<template v-if="project">` wrapper** (Warning 9 RESOLVED): contiene `<h2 :id="project-${projectId}-title">`, `<p year>`, `<p role>`, `<ul tech>`, `<p desc>`, y `<a v-if="project.link" target="_blank" rel="noopener noreferrer">`.

**`<style scoped>` vacío** — todo el styling vive en chapter-themes.css @layer components (Task 2). Separation of concerns: component = behavior + structure; theme CSS = visual styling.

**Commit:** `08107e9 — feat(05-05): ProjectOverlay synthwave modal + manual focus trap + null guard (D5-07, Pattern 10)`

### Task 2 — `src/styles/chapter-themes.css` (@layer components synthwave rules)

Añadidas ~182 líneas al `@layer components` block (después del bloque Phase 5 W3 ch6 `.ch6-layout/.ch6-canvas-host/.ch6-mantra`).

**Reglas globales NO scoped a `[data-chapter="6"]`** porque el modal es `position: fixed` y vive encima del shell — fuera del scope chapter. Si fuera scoped, heredaría transform/position del section durante scroll-snap rompiendo el inset:0 fixed.

**Reglas añadidas:**

| Selector | Propósito |
|---|---|
| `.project-overlay` | Backdrop fixed inset:0 z:50 + `rgba(26, 14, 61, 0.7)` deep purple translúcido (fallback) |
| `@supports backdrop-filter` | Progressive enhancement → `rgba 0.5 + backdrop-filter: blur(8px) + -webkit-backdrop-filter` |
| `.project-overlay__card` | `max-width: min(90vw, 560px)` + border cyan #4dffff + **box-shadow glow doble** (cyan 24px + pink 48px = D5-04 signature) + animation `overlay-enter 200ms ease-out` |
| `@keyframes overlay-enter` | `opacity 0→1 + scale 0.95→1` (200ms) |
| `@media (max-width: 599px)` | **Mobile fullscreen** — `100vw × 100dvh` (iOS notch safe) + `border-radius: 0` + sin border-left/right |
| `@media (prefers-reduced-motion: reduce)` | **PRM instant** — `animation: none` (D5-08 + A11Y-05) |
| `.project-overlay__close` | 32×32 transparent + border cyan + focus-visible outline amber #ffd95c |
| `.project-overlay__title` | Audiowide + cyan #4dffff + text-shadow neon + padding-right 48px (espacio close button) |
| `.project-overlay__year` | Amber #ffd95c secondary metadata |
| `.project-overlay__role` | #c0e0ff italic |
| `.project-overlay__tech` | Flex chips border cyan rounded (12px), font 0.75rem |
| `.project-overlay__desc` | Body text #c0e0ff line-height 1.5 |
| `.project-overlay__link` | Pink #ff3ca6 background + cyan focus-visible outline + active translateY(1px) micro-feedback |

**Commit:** `128ffe8 — feat(05-05): synthwave CSS rules .project-overlay @layer components (D5-07 + Pattern 10)`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tests W0 con `attachTo: document.body` dentro de `global` (no-op silencioso)**

- **Found during:** Task 1 verify — focus-trap.test.js T1/T2/T3 fallaron tras implementar correctamente el componente; ProjectOverlay.test.js T1-T6 estaban GREEN.
- **Diagnosis:** Investigado con repros mínimos:
  - Raw jsdom + `element.focus()` → ✓ funciona (`document.activeElement` se actualiza).
  - Vue Test Utils mount con componente trivial + `attachTo: document.body` AT TOP-LEVEL → ✓ funciona.
  - Vue Test Utils mount con `attachTo: document.body` DENTRO de `global` → ✗ wrapper queda detached (`wrapper.element.parentElement` es un div sin `data-v-app` standalone NO en `document.body`). `element.focus()` falla porque elemento detached no es focusable como activeElement.
- **Issue:** En Vue Test Utils v2.4.10 `attachTo` es una **mount option top-level**, NO una `global` option. Ponerlo dentro de `global` es ignorado silenciosamente — el helper de mount no warna ni throw. El test W0 lo tenía mal escrito en ambos archivos (`ProjectOverlay.test.js` y `focus-trap.test.js`).
- **Why Rule 1 (not Rule 4):**
  - Tests están claramente escritos con la INTENCIÓN de attachar al DOM (comentario `// attach DOM permite document.activeElement asserts` lo declara explícito).
  - El fix es trivial estructural (mover `attachTo` 1 nivel arriba), no implica decisión arquitectónica.
  - La alternativa (cambiar la implementación para que el focus trap NO requiera DOM attachment) sería incorrecta — focus trap real requiere DOM real, y los tests son la herramienta para validarlo.
- **Fix:** Movido `attachTo: document.body` del bloque `global` al top-level de `mount()` options en ambos archivos.
- **Files modified:** `tests/components/ProjectOverlay.test.js`, `tests/a11y/focus-trap.test.js`.
- **Commit:** `08107e9` (incluido en Task 1).

**2. [Rule 1 - Bug secundario] Comentarios HTML como root del `<template>` convierten componente en multi-root → wrapper.element apunta a fragment**

- **Found during:** Task 1 verify (debug del Rule 1 #1 anterior).
- **Issue:** En el primer write del componente puse comentarios HTML largos docstring-style ANTES del primer `<div>` dentro del `<template>`. Vue trata esto como un componente multi-root (comment node + div node). `wrapper.element` en Vue Test Utils para multi-root devuelve el contenedor intermedio (un comment node o el wrapper de mount), NO el `<div>` esperado.
- **Why Rule 1:** Es un bug de estructura del SFC que rompe el contract implícito con Vue Test Utils (single root). Auto-fix obvio: mover los comentarios DENTRO de los elementos (después del opening tag) o eliminarlos.
- **Fix:** Comentarios docstring movidos dentro del `<div class="project-overlay">` y `<article class="project-overlay__card">` como children adyacentes al primer elemento real.
- **Files modified:** `src/components/ProjectOverlay.vue` (durante el mismo Task 1 build, antes del commit).
- **Commit:** `08107e9` (single commit cubre Task 1 incluyendo este fix).

## Verified Contracts

### Tests turned GREEN by this Plan (9 tests)

| File | Tests | Status | Notes |
|---|---|---|---|
| `tests/components/ProjectOverlay.test.js` | T1-T6 | GREEN | T1 ESC emit close · T2 backdrop click emit close · T3 content render (Founder/Unity) · T4 aria-label="Cerrar" · T5 rel="noopener noreferrer" · T6 null guard projectId inválido no crash + no .project-overlay__title |
| `tests/a11y/focus-trap.test.js` | T1-T3 | GREEN | T1 Tab cycle last→first · T2 Shift+Tab cycle first→last · T3 onMount foca closeBtn + onUnmount restore lastFocusedEl |

### Suite global

```
Test Files  63 passed (63)
Tests       424 passed (424)
Duration    ~15s
```

**424/424 GREEN = target del plan cumplido (línea 53 prompt original).** Sin regression en ningún test pre-existente.

### Threat surface scan

Threats del `<threat_model>` cubiertos por mitigaciones implementadas:

| Threat ID | Mitigation Status | Evidence |
|---|---|---|
| T-05-W4-01 (DoS projectId inválido crash) | ✓ MITIGATED | `v-if="project"` wrapper + Test T6 GREEN |
| T-05-W4-02 (Tabnabbing target=_blank) | ✓ MITIGATED | `rel="noopener noreferrer"` hardcoded + Test T5 GREEN |
| T-05-W4-03 (XSS i18n strings) | ✓ ACCEPTED | vue-i18n escapa via `{{ t() }}`, sin `v-html` — strings commit-tracked en es.json/en.json |
| T-05-W4-04 (Listener leak document.keydown) | ✓ MITIGATED | `removeEventListener` en onBeforeUnmount pareado |
| T-05-W4-05 (Spoofing emit close) | ✓ ACCEPTED | emit scope-interno, otros components no acceden |
| T-05-W4-06 (Focus history leak) | ✓ ACCEPTED | `lastFocusedEl` variable local, descartada al unmount |

**No new threat surface introducido.** Todos los threats del plan cubiertos.

### Slice end-to-end manual check (referenced for W5 Plan 05-06)

Tras este plan, el slice end-to-end ch6 queda funcional para validación manual de Rafael (W5):

1. `npm run dev` → http://127.0.0.1:5173/
2. Scroll a ch6 (último tick de StickyTimeline o ↓ hasta el fondo).
3. Canvas Phaser visible con planets/ships/arrival camera + mantra HTML fade-in al fin del arrival.
4. **Click en cualquier planet** (ar-vr 0.2 / remoose 0.5 / software-mind 0.8) → bridge `show-project` → overlay synthwave aparece centrado con:
   - Backdrop blur deep purple #1a0e3d (rgba 0.5 + blur 8px en navegadores modernos; rgba 0.7 sólido en legacy).
   - Card border cyan #4dffff + glow doble box-shadow (cyan inner + pink outer).
   - Animación scale 0.95→1 + fade 200ms ease-out (instant bajo PRM).
   - Title h2 Audiowide cyan + text-shadow neon + year + role + techStack chips border cyan + descripción + (eventual) link "Ver proyecto →" pink.
   - Close button "×" 32×32 top-right border cyan, aria-label "Cerrar".
5. **ESC** desde cualquier focus → cierra el overlay. Focus restaurado al sr-only planet-button trigger originador.
6. **Click en backdrop** (fuera del card) → cierra. Focus restaurado.
7. **Click en close button** → cierra. Focus restaurado.
8. **Tab desde dentro del overlay**: cycla entre close button y (si existe) link. Shift+Tab cycla en reverso.
9. **Mobile responsive** (DevTools toggle <600px): card fullscreen 100vw × 100dvh, border-radius 0.
10. **A11Y DevTools tree**: dialog role detected + aria-modal + aria-labelledby binding correcto al h2 (cuando project existe).

(Notas para Plan 05-06: alt-text mantra ratificación + paleta ratificación + project content stubs review siguen su propio flujo — este plan NO bloquea ni desbloquea esos checkboxes.)

## Open Q3 RESOLVED — Manual focus trap vs @vueuse/integrations

**Decision:** Manual focus trap ~30 LOC (RESEARCH §Pattern 10 lines 979-995 verbatim).

**Rationale documented:**

| Criterio | Manual (~30 LOC) | @vueuse/integrations useFocusTrap |
|---|---|---|
| Bundle cost | 0 KB (inline) | ~8 KB (peer dep `focus-trap`) |
| Scope coverage | 3-5 focusables tab order trivial | radio groups, contentEditable, iframes, complex tab order |
| Code review-ability | Directo, ~30 líneas inline | Black box dep — review-able pero requiere context switch |
| Maintenance | Una sola pieza de código — fix directo | Versión semver de la dep — `npm update` puede regresar |
| WCAG 2.1 compliance | ✓ Focus Order requirement met | ✓ Same |
| Test surface | Custom test suite focus-trap.test.js (T1-T3) GREEN | Library test suite — confianza por reputación |

**Driver:** El scope de este overlay es siempre `[close_button, opt:link]` = max 2 focusables. La complejidad de `useFocusTrap` no se aprovecha. Manual es más leaner sin sacrificar el contract A11Y.

**Future consideration:** Si Phase 6+ añade un overlay con muchos focusables (form fields, dropdown menus, multiple sections), revaluar la decisión. Don't Hand-Roll §10 explicitly flags `useFocusTrap` como "consider when complex tab order > 5 elements".

## Known Stubs

| Stub | File | Status | Why |
|---|---|---|---|
| (none) | — | ✓ Stub W3 fully replaced | El stub ProjectOverlay (W3 Plan 05-04) fue reemplazado COMPLETO. Cero stubs nuevos introducidos. |

**Comment:** El `<style scoped>` del componente quedó vacío INTENCIONALMENTE — todo el styling vive en `chapter-themes.css @layer components` (Task 2). NO es un stub: es separation of concerns explícito.

## Deferred Issues

| Issue | Owner | Action |
|---|---|---|
| Vue Test Utils v2 multi-root issue con comentarios HTML como root del template — documentado en tech-stack patterns pero NO existe regla architectural test que prevenga futuras reocurrencias | Future refactor / Phase 6 polish | Considerar tests/architectural/sfc-template-single-root.test.js que valide que ningún componente con tests de focus tenga comentarios root antes del primer elemento. Por ahora con un solo caso documentado en patterns, está OK. |
| Stubs i18n para projects.ch6-*.{title,desc} (Rafael CONTENT-CHECKLIST §2.5 pending) | W5 Plan 05-06 | Cuando Rafael ratifique copy real ES+EN para los 3 proyectos ch6, los stubs se actualizan en es.json/en.json. El componente ya consume t(project.titleKey/descKey) — el cambio será una edición de strings, no de código Vue. |

## TDD Gate Compliance

Plan tipo `execute` (no `tdd` plan-level); per-task TDD = `true`. Gate sequence:

- **Task 1 commit `08107e9`:** `feat(05-05)` — implementación añade GREEN a 9 tests RED scaffolds W0 (ProjectOverlay T1-T6 + focus-trap T1-T3). Los tests existían pre-W4 como scaffolds RED (W0 territory). El feat commit los gira GREEN — válido bajo plan-level execute pattern (no requiere test() separate commit porque los tests no fueron escritos en este plan).
- **Task 2 commit `128ffe8`:** `feat(05-05)` — CSS rules añadidas. No tests específicos de CSS — themes-file.test.js T1-T4 + ScrollShell.theme-isolation.test.js T1-T3 ya estaban GREEN pre-task (verifican arquitectura general, no contenido específico del bloque .project-overlay). Test ProjectOverlay.test.js T2 (backdrop click) implicitamente valida que `.project-overlay` selector matchea (Test passes → componente renderea con la clase esperada).

REFACTOR commits: no necesarios — el código quedó en estado limpio post-GREEN.

**RED→GREEN gate verification:**
- Baseline RED pre-Task 1: `5 failed | 4 passed (9)` confirmado.
- Post-Task 1: `9 passed (9)` confirmado.
- Sequence válida.

## Self-Check: PASSED

- src/components/ProjectOverlay.vue (226 LOC synthwave completo): **FOUND** ✓
- src/styles/chapter-themes.css (con bloque .project-overlay @layer components añadido): **FOUND** ✓
- tests/components/ProjectOverlay.test.js (attachTo top-level fix): **FOUND** ✓
- tests/a11y/focus-trap.test.js (attachTo top-level fix): **FOUND** ✓
- .planning/phases/05-phaser-chapter-6/05-05-SUMMARY.md (este archivo): **FOUND** ✓
- Commit `08107e9` (Task 1): **FOUND** ✓
- Commit `128ffe8` (Task 2): **FOUND** ✓
- Suite global 424/424 GREEN: **VERIFIED** ✓

---

*Plan 05-05 completed 2026-05-14. Slice end-to-end ch6 ahora completo + listo para W5 manual checklist Rafael sign-off. Próximo plan: 05-06 (W5) — checkpoint:human-verify Rafael ratifica visualmente el render ch6 + mantra ES copy + paleta + posible refresh de stubs i18n.*
