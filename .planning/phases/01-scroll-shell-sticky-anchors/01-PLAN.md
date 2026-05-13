---
phase: 1
plan: 0
slug: scroll-shell-sticky-anchors
type: index
mode: mvp
walking_skeleton: true
created: 2026-05-13
last_revised: 2026-05-12
total_plans: 7
waves: 7
gap_closure: false
requirements_covered: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CORE-09, CORE-10, CORE-11, MOB-01, MOB-03, iOS-01, iOS-02, A11Y-01, A11Y-02, A11Y-05]
---

# Phase 1 — Scroll Shell + Sticky Anchors · Plan Index

## Phase Goal (User Story)

**As a** visitante del portafolio de Rafael (recruiter, founder o miembro de la comunidad gamedev),
**I want to** abrir el sitio en cualquier dispositivo (desktop, tablet, iPhone en portrait o landscape) y recorrer los 7 chapters cronológicos (1995 → 2026) con scroll vertical snap, viendo siempre el avatar pixel-art top-left y la timeline bottom con click-to-nav, deep-link `?ch=N`, navegación con flechas y soporte completo de `prefers-reduced-motion`,
**so that** entienda en 30 segundos —sin leer una sola viñeta de CV— que está mirando a alguien que vivió tres décadas de tecnología, mientras la mecánica de scroll no rompe en ningún dispositivo conocido y mi accesibilidad vestibular se respeta.

## Walking Skeleton

Phase 1 es **greenfield** y este es el primer deliverable funcional del proyecto. El walking skeleton (Plan 1) entrega la mecánica núcleo end-to-end: 7 chapter sections + snap vertical + landing en ch3 + deep-link `?ch=N`. A partir de ahí, cada plan añade un slice vertical adicional (sticky avatar → sticky timeline → PRM → keyboard/skip → mobile/iOS).

Las decisiones arquitectónicas (Vue 3.5 + @vueuse/core 14, `position: fixed` para anclas, IntersectionObserver para `activeChapter`, RAF para `scrollProgress`, sin Vue Router/Pinia/GSAP/Lenis) están todas locked en el RESEARCH.md y UI-SPEC.md de esta fase. Phase 2 (themes + i18n) construirá encima sin renegociar nada.

## Atomic Plans

| Plan | Slug | Wave | Autonomous | Depende de | Objetivo (1 línea) |
|------|------|------|------------|------------|--------------------|
| 01 | `toolchain-setup` | W0 | yes | — | Bump Vue a ^3.5.0, instalar @vueuse/core + Vitest, scaffold de directorios, `host: true` en Vite |
| 02 | `walking-skeleton` | W1 | yes | W0 | ScrollShell + 7 ChapterSection + snap vertical + deep-link `?ch=N` + landing en ch3 (composable setup vía `watch(shellRef, ..., {immediate, flush:'post'})` para evitar race con null ref) |
| 03 | `usePRM-composable` | W2 | yes | W1 | `usePRM` composable + switch `scroll-behavior` smooth↔auto bajo PRM (D-01) |
| 04 | `sticky-avatar-placeholder` | W3 | yes | W2 | StickyAvatar component + IO-driven `activeChapter` update + crossfade JS **200ms TOTAL** (100+100, no 400) con short-circuit PRM (D-02) + watcher de PRM-mid-flight recovery |
| 05 | `sticky-timeline-marker` | W4 | yes | W3 | StickyTimeline con marker RAF + 7 ticks click-to-nav + keyboard ↑/↓/j/k/Home/End (D-04, A11Y-02). `bottom: env(safe-area-inset-bottom, 0)` aplicado preventivamente desde day 1 |
| 06 | `skiplink-a11y-polish` | W5 | yes | W4 | SkipLink (con `window.addEventListener` nativo, NO useEventListener, para evitar flake jsdom) + focus ring universal + ResizeObserver placeholder + mobile breakpoint < 600px |
| 07 | `ios-smoke-test` | W6 | **no** (checkpoint:human-verify) | W5 | Rafael corre la checklist iOS de 10 ítems en su iPhone; VERIFICA que el env(safe-area-inset-bottom) preventivo del Plan 05 funcionó (no re-aplica); pre-condition: viewport-fit=cover en index.html |

## Wave Structure

```
W0: 01-PLAN-toolchain-setup           ← bloqueante para todos
W1: 02-PLAN-walking-skeleton          ← walking skeleton funcional E2E
W2: 03-PLAN-usePRM-composable
W3: 04-PLAN-sticky-avatar-placeholder
W4: 05-PLAN-sticky-timeline-marker
W5: 06-PLAN-skiplink-a11y-polish
W6: 07-PLAN-ios-smoke-test            ← gate humano (checkpoint)
```

Cada wave depende exclusivamente de la anterior porque cada plan construye sobre el componente/composable del plan previo (StickyTimeline necesita `activeChapter` reactivo de StickyAvatar's IO, el polish de a11y necesita ya el avatar y timeline en su lugar, etc.). No hay paralelización intra-fase porque la mayoría de plans son ≤ 30 minutos y secuencializarlos mantiene la quality bar más alta para un ejecutor solo (Claude).

## Requirements Coverage Matrix (18/18)

Cada requirement de Phase 1 está cubierto por al menos un plan; muchos están cubiertos en múltiples plans cuando el comportamiento se construye incrementalmente.

| Requirement | Definición resumida | Plan(es) que lo cubren |
|-------------|---------------------|-----------------------|
| **CORE-01** | ScrollShell vertical con `scroll-snap-type: y mandatory` | 02 (walking skeleton) |
| **CORE-02** | 7 chapter sections coexisten en el DOM, sin v-if entre ellos | 02 (walking skeleton) |
| **CORE-03** | Composable `useScrollState` + IntersectionObserver para `activeChapter` | 02 (declara composable con stub) → 04 (cablea IO y `activeChapter` reactivo) |
| **CORE-04** | `scroll-snap-stop: always` en cada section | 02 |
| **CORE-05** | Default landing chapter 3 + `?ch=N` override | 02 |
| **CORE-06** | Navegación con flechas ↑/↓ (Home/End opcionales) | 05 |
| **CORE-07** | Timeline sticky bottom con marker + año + 7 ticks click-to-navigate | 05 |
| **CORE-08** | `height: 100dvh` en chapters anti address-bar drift (con fallback `100vh`) | 02 |
| **CORE-09** | `prefers-reduced-motion` respetado globalmente | 03 (composable) → 04 (avatar swap + mid-flight recovery) → 05 (click-to-nav) |
| **CORE-10** | Sticky avatar slot top-left, swap reactivo (un solo container) | 04 |
| **CORE-11** | Timeline marker tracks `scrollProgress` (0..1) via RAF | 05 |
| **MOB-01** | Mobile portrait y landscape funcionales | 06 (breakpoints) → 07 (smoke test confirma) |
| **MOB-03** | `ResizeObserver` sobre `document.documentElement` (no `orientationchange`) | 06 |
| **iOS-01** | Stack base iOS: `scroll-snap-stop: always` + `-webkit-overflow-scrolling: touch` + `env(safe-area-inset-bottom)` preventivo en StickyTimeline | 02 (snap-stop + overflow CSS) → 05 (env safe-area preventivo) → 07 (smoke test valida en hardware real) |
| **iOS-02** | Smoke test iOS confirmatorio (no bloqueante) | 07 |
| **A11Y-01** | Skip-to-content link al inicio del DOM | 06 |
| **A11Y-02** | ScrollShell con `tabindex="0"` + keyboard navigation | 02 (tabindex) → 05 (handlers) |
| **A11Y-05** | PRM respetado en todas las transiciones | 03 (fundamento) → 04 (avatar crossfade 200ms total + mid-flight recovery) → 05 (click-to-nav) |

**Total:** 18 IDs × ≥1 plan cada uno → **18/18 cobertura completa**.

## Anti-Scope (NO en Phase 1)

Confirmado contra UI-SPEC §15 y REQUIREMENTS:

- ❌ Themes era-auténticos por chapter (Phase 2 / THM-01..05)
- ❌ Toggle ES/EN con vue-i18n (Phase 2 / I18N-01..06)
- ❌ Background morph CSS entre eras (Phase 2 / D-03)
- ❌ Contenido real: bio, proyectos (Phase 3 / CON-01..06)
- ❌ Pixel art busts reales (Phase 3 / ART-01) — Phase 1 usa placeholder gris `ch{N}`
- ❌ Pixel art fondos (Phase 3-4 / ART-02..04)
- ❌ Escena Phaser ch6 (Phase 5 / PHA-01..09) — Phaser NO se importa en Phase 1
- ❌ Firebase deploy (Phase 6 / DEPLOY-01..04)
- ❌ Deep-link enriquecido con URL hash `#ch-N` (v2 / DLINK-01..02)
- ❌ HUD focus styles era-themed (Phase 2 / A11Y-03)
- ❌ Vue Router, Pinia, GSAP, Lenis, Locomotive Scroll (constraint duro del proyecto)
- ❌ Scroll progress indicator separado de la timeline (deferred — no se duplica)
- ❌ Easter egg "And always show a smile" (CON-04 → Phase 4/5)

## UI-SPEC Compliance

Todos los plans consumen el `01-UI-SPEC.md` como contrato visual locked. Cualquier executor que encuentre un conflicto real entre PLAN.md y UI-SPEC.md debe surface-arlo como blocker, NO override silenciosamente. El UI-SPEC §12 (Visible Verification Checklist, 18 ítems) es el gate visual final de Phase 1.

## Blockers Surfaced

**Ninguno bloquea el inicio de Phase 1.** Notas:

- **STATE.md "Vue version blocker":** RESOLVED por RESEARCH RECOMMENDATION A. El scaffold ya tiene `vue@3.5.34` instalado (el caret `^3.4.0` resolvió a `3.5.x`). El Plan 01 solo refleja la realidad en el manifest.
- **iPhone disponibility para iOS-02:** Asumido (Rafael propio). Si no disponible al llegar al Plan 07, fallback documentado = BrowserStack o diferir iOS-02 (es no-bloqueante per requirements). El Plan 07 incluye un confirmación inline.
- **Test framework no instalado:** Resuelto por Wave 0 (Plan 01) — instala Vitest + @vue/test-utils + jsdom y crea setup mock de IntersectionObserver/ResizeObserver/matchMedia/RAF.

## Verification Strategy

| Nivel | Cuándo | Cómo |
|-------|--------|------|
| **Unit (Vitest)** | Por cada plan que añade composable o component | `npm test -- --run` post-Wave-0; archivos específicos listados en `<verify>` de cada plan |
| **Manual visual (DevTools)** | Por cada plan que toca UI | Steps específicos en cada plan; convergen en UI-SPEC §12 al final |
| **Smoke test iOS** | Plan 07 (gate humano) | 10-item checklist en iPhone real, logged en `01-EXECUTION-LOG.md` |
| **UI-SPEC §12 checklist** | Antes de cerrar Phase 1 | Los 18 visible verification items deben pasar; ejecuta `/gsd-verify-work` |

## Revision History

**Iteration 2 (2026-05-12):** Aplicadas correcciones surgicales tras `gsd-plan-checker` PASS_WITH_CONCERNS:

- **Plan 02 (walking-skeleton):** composable setup vía `watch(shellRef, {immediate, flush:'post'})` en lugar de `onMounted` (BLOCKER 1 — race con null ref). Deep-link `?ch=N` ahora siempre llama `scrollToChapter(N, 'auto')` público (BLOCKER 2 — alineado con tests). Test wrapper template incluye los 7 stubs `<section id="chapter-N">` (BLOCKER 4 — sin esos stubs, getElementById retorna null y los tests 3-7 fallan).
- **Plan 03 (usePRM):** Test 5 (readonly computed) eliminado por ambigüedad (MEDIUM 2 — Vue's computed sin setter emite warning, no throw; era test de framework, no de nuestro código). De 5 a 4 tests.
- **Plan 04 (sticky-avatar):** crossfade timing corregido a **200ms TOTAL** (transition: opacity 100ms + setTimeout 100ms = 100+100 = 200ms, alineado con UI-SPEC §8) en lugar de 400ms perceptible (HIGH 1). Añadido watcher dedicado sobre `prefersReduced` que cancela timer pending y restaura opacity=1 cuando PRM toggle activa mid-flight (HIGH 2 — antes el avatar podía quedar invisible). De 8 a 10 tests.
- **Plan 05 (sticky-timeline):** Test 11 de preventDefault eliminado por ambigüedad (BLOCKER 3 — Vue Test Utils `trigger` no expone spy verificable de preventDefault; `.prevent` es declarativo framework). De 11 a 10 tests en ScrollShell. `bottom: env(safe-area-inset-bottom, 0)` aplicado preventivamente desde day 1 (HIGH 4 — graceful fallback a 0, evita un re-test loop en Plan 07). Manual checklist añade verificación de marker tracking durante click smooth-scroll vs PRM jump (HIGH 3). De 12 a 13 tests en StickyTimeline.
- **Plan 06 (skiplink):** `useEventListener` reemplazado por `window.addEventListener` nativo en `onMounted` (HIGH 5 — más determinístico en jsdom). Handler `handleScrollOnce` expuesto vía `defineExpose` para test invocation directa (evita flake de dispatchEvent jsdom). Manual checklist añade verificación de overflow del SkipLink en viewport 375×667 con mitigación documentada (MEDIUM 3).
- **Plan 07 (ios-smoke-test):** Mitigación `env(safe-area-inset-bottom)` cambiada de "aplicar post-FAIL" a "verificar que el preventivo del Plan 05 funcionó" (HIGH 4). Pre-condition de `viewport-fit=cover` en index.html añadida a Task 7.1 (sin ese flag, env() retorna 0 en iOS).

Wave assignment, plan count, slugs, anti-scope, UI-SPEC §7.1–§7.4 lock y coverage matrix (18/18) sin cambios.

## Next Steps

1. Ejecutar plans secuencialmente: `npm run dev` + Vitest watchers ayudan a feedback rápido.
2. Cualquier nuevo Open Question que surja durante execution → registrar en `01-EXECUTION-LOG.md`, NO mutar plans en flight.
3. Al completar Plan 07 con smoke test PASS → `/gsd-verify-work 1` para cerrar la fase y pasar a Phase 2.

---

*Plan index generado: 2026-05-13. Iteration 2: 2026-05-12 (gsd-plan-checker fixes). Fuentes consumidas: 01-RESEARCH.md (HIGH confidence), 01-UI-SPEC.md (LOCKED), 01-CONTEXT.md (D-01..D-06 locked), REQUIREMENTS.md §CORE/§MOBILE/§iOS/§A11Y, ROADMAP.md §Phase 1, PROJECT.md mapeo de chapters, CLAUDE.md project conventions.*
