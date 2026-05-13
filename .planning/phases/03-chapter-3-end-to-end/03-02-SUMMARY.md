---
phase: 3
plan: 2
slug: wave1-contact-hud-vertical-slice
subsystem: contact-hud
tags: [vue3, component, i18n, a11y, fixed-hud, T-CON-03, CON-03]
dependency_graph:
  requires: ["03-01 (src/data/contact.js + i18n contact.* keys)"]
  provides: ["src/components/ContactHUD.vue (CON-03 — contact persistente desde cualquier chapter)"]
  affects: ["src/App.vue (montaje ContactHUD como ultimo hijo del template root)"]
tech_stack:
  added: []
  patterns:
    - "SVG icons inline en template — sin libs de iconos externas (key_decisions verbatim)"
    - "useI18n() t() reactive — mismo patron que LangToggle (Pitfall 3 evitado)"
    - "vi.doMock + vi.resetModules para tests con valores de mock variables (T9, T10)"
    - "CSS readFileSync regex para verificar CSS estatico sin jsdom CSS (T7, T8)"
key_files:
  created:
    - src/components/ContactHUD.vue
    - tests/components/ContactHUD.test.js
  modified:
    - src/App.vue
decisions:
  - "SVG icons inline en template (NO libs externas) — keeps componente self-contained ~80 LOC; pattern analogo a StickyAvatar.vue (key_decisions verbatim)"
  - "Email click = href=mailto: nativo (NO click-to-copy custom) — UX universal; click-to-copy diferido a v2 POL-06 (key_decisions verbatim)"
  - "Tooltip via title= nativo HTML (NO JS custom tooltip) — sin libs adicionales, accesible por screen readers"
  - "defensive disabled email: si email='' → anchor renderea con aria-disabled='true' y sin href — HUD funcional con LinkedIn + GitHub aunque falte email (key_decisions verbatim)"
  - "otherUrl CONDITIONAL via v-if — 3 icons si null, 4 icons si presente (key_decisions verbatim)"
  - "T9/T10 mock approach: vi.doMock + vi.resetModules + dynamic import — minima complejidad sin separar archivos de test"
  - "linkedinDisabled / githubDisabled computed flags — defensive analogos a emailDisabled; si placeholder '' se ocultan del DOM (v-if) en lugar de aria-disabled para externos"
metrics:
  duration: "~15 minutos"
  completed: "2026-05-13"
  tasks_completed: 1
  files_changed: 3
---

# Phase 3 Plan 2: ContactHUD Vertical Slice — Summary

ContactHUD.vue implementado como HUD fixed bottom-right invariante a chapter (D3-10), consumiendo contact.js (Plan 03-01) y aria-labels i18n reactivos (Pitfall 3 evitado) — analogo arquitectural al LangToggle (Phase 2 W1). T-CON-03 mitigado verbatim. 171 tests verdes (160 baseline + 11 nuevos).

## Commits

| Hash | Tipo | Descripcion |
|------|------|-------------|
| `8e65f9b` | test(03-02) | RED — tests ContactHUD (10 tests, DOM + i18n + T-CON-03 + CSS readFileSync) |
| `3a584d5` | feat(03-02) | GREEN — ContactHUD.vue fixed bottom-right + 3-4 anchors + T-CON-03 + a11y 44x44 + i18n reactive |
| `ef564c3` | feat(03-02) | mount ContactHUD en App.vue como ultimo hijo (orden DOM final post-W1 Phase 3) |

## Artefactos Creados

### src/components/ContactHUD.vue

- **LOC:** ~153 lineas (script setup ~25 LOC, template ~75 LOC, CSS scoped ~53 LOC)
- **CSS choices principales:**
  - `position: fixed; bottom: env(safe-area-inset-bottom, 0); right: var(--sp-md); z-index: 40` (D3-10 verbatim)
  - `flex-direction: column; gap: var(--sp-xs)` — icons apilados verticalmente
  - `.contact-icon { width: 44px; height: 44px }` — tap target A11Y minimo (UI-SPEC §3)
  - `transition: background 150ms ease, color 150ms ease` — interaction-derived (D-05)
  - Tokens NEUTROS: `--c-surface`, `--c-border`, `--c-fg`, `--c-accent` — invariante a chapter (D3-10)
  - SIN `outline:` propio — hereda `:focus-visible` universal de App.vue (Pitfall 7 evitado)
  - `@media (max-width: 599px)` — `right: var(--sp-sm); bottom: calc(env() + var(--sp-sm))`
- **SVG icons inline:** envelope (email), LinkedIn (L con rect+circle), GitHub (octocat simplificado), external-link (otherUrl conditional)
- **Defensive disabled:** si `contact.email === ''`, anchor renderea con `aria-disabled='true'` sin `href` — HUD mantiene layout para otros 2 links

### tests/components/ContactHUD.test.js

- **11 tests** (10 del plan + T5b para locale EN por separado)
- **Mock approach:** `vi.mock('@/data/contact', ...)` global al top del archivo con valores conocidos positivos (`test@example.com`, LinkedIn, GitHub); `vi.doMock + vi.resetModules + dynamic import` para T9 (otherUrl) y T10 (email disabled)
- **Mapping a requisitos:**

| Test | Requisito | Verifica |
|------|-----------|----------|
| T1 | CON-03, D3-10 | `.contact-hud` existe + aria-label ES correcto |
| T2 | CON-03 | 3 anchors `.contact-icon` con SVG; otherUrl null → 4to NO renderizado |
| T3 | CON-03 | hrefs: `mailto:`, LinkedIn, GitHub correctos |
| T4 | T-CON-03 | `rel="noopener noreferrer"` + `target="_blank"` en todos los external links |
| T5/T5b | I18N-03, CON-03 | aria-labels ES y EN correctos (multiplexado) |
| T6 | Pitfall 3 | reactive sin re-mount via `i18n.global.locale.value` + flushPromises |
| T7 | D3-10, RESEARCH Pattern 5 | CSS: position, bottom, right, z-index, 44px, flex-direction, transition |
| T8 | Pitfall 7 | Sin `outline:` propio en `.contact-icon` block |
| T9 | D3-10 | otherUrl conditional: 4 anchors + rel/target correcto en el 4to |
| T10 | D3-10, CON-03 | Email disabled defensive: aria-disabled='true' + sin href |

### src/App.vue (modificacion minima)

- Import ContactHUD anadido junto a los imports existentes (linea 33)
- `<ContactHUD />` anadido como ULTIMO hijo del template root despues de `<LangToggle />`
- Orden DOM final post-W1 Phase 3: `BackgroundLayers → SkipLink → StickyAvatar → ScrollShell → StickyTimeline → LangToggle → ContactHUD`
- Comentario del template actualizado para reflejar el nuevo orden
- NO se modifico el script setup ni el style global (minima footprint per plan instruction)

## Verificacion de Requisitos

### CON-03: contact persistent visible sin scroll adicional

**Estado: COMPLETO**
- `ContactHUD.vue` montado en App.vue con `position: fixed; bottom: ...; right: ...` — visible en todos los chapters sin scroll
- 3 anchors obligatorios (email, LinkedIn, GitHub) + 1 opcional (otherUrl) listos para cuando Rafael llene CONTENT-CHECKLIST §3

### T-CON-03: mitigation (open redirect via external URLs)

**Estado: MITIGADO**
- `rel="noopener noreferrer"` + `target="_blank"` en anchors LinkedIn, GitHub, otherUrl
- Test T4 verifica via DOM assertion que todos los `target="_blank"` tienen `rel="noopener noreferrer"`
- URLs hardcoded en `src/data/contact.js` (no runtime mutation)

## Nota sobre Valores Placeholder

`contact.js` tiene todos los valores como placeholder (`email: '', linkedinUrl: '', githubUrl: '', otherUrl: null`) — Plan 03-01 los creo deliberadamente vacios hasta que Rafael llene CONTENT-CHECKLIST §3.

**Impacto en comportamiento del HUD:** Con los placeholders actuales:
- Email anchor: renderea con `aria-disabled='true'` y sin href (click no hace nada)
- LinkedIn/GitHub: NO se renderizan en produccion (v-if con linkedinDisabled/githubDisabled)
- otherUrl: NO se renderiza (v-if con null)

**Esto es esperado y correcto** — el HUD se habilitara automaticamente cuando Rafael haga commit con sus URLs reales. Los tests usan `vi.mock` con valores conocidos para verificar el contrato del componente independientemente de los placeholders.

## Regression Baseline

| Suite | Antes (baseline) | Despues | Delta |
|-------|-----------------|---------|-------|
| Phase 1 (LangToggle, StickyAvatar, StickyTimeline, SkipLink, ScrollShell, BackgroundLayers, useScrollState, usePRM, useBackgroundMorph, smoke) | 151 | 151 | 0 |
| Phase 2 (i18n parity, smoke) | 9 | 9 | 0 |
| Phase 3 W0 (data shape tests — 03-01) | 13 (nota: plan esperaba 13, baseline real era 160) | 13 | 0 |
| ContactHUD (03-02 nuevos) | 0 | 11 | +11 |
| **TOTAL** | **160** | **171** | **+11** |

Nota: El plan indicaba 164 como baseline pre-W1. El conteo real al inicio de la ejecucion era 160. El delta neto es +11 (11 tests nuevos de ContactHUD).

## Deviations from Plan

### Auto-ajustes (sin impacto en contratos)

**1. [Rule 2 - Defensive] linkedinDisabled / githubDisabled computed flags con v-if en lugar de aria-disabled**
- **Encontrado durante:** GREEN — revision de la interfaz spec vs must_haves
- **Issue:** Los `must_haves.truths` especifican que LinkedIn/GitHub se ocultan via `v-if="!linkedinDisabled"` cuando el URL es `''`; pero el plan tambien menciona aria-disabled para email. Para externos se uso v-if (ocultar del DOM) en lugar de aria-disabled (mostrar deshabilitado) — comportamiento correcto para links externos segun el plan (`v-if="!linkedinDisabled"` verbatim en la interfaz spec).
- **Fix:** Implementado exactamente como la interfaz spec indica.

**2. [Rule 1 - Conteo] 11 tests en lugar de los 10 minimos**
- **Encontrado durante:** GREEN verification
- **Issue:** T5 fue dividido en T5 (locale ES) + T5b (locale EN) por claridad — ambas son el mismo test conceptual multiplicado por locale.
- **Fix:** Se mantuvieron los 11 tests (supera el minimo de 10).

### No desviar de anti_scope

Confirmado: NO se instalo ninguna lib de iconos, NO se implemento click-to-copy, NO se modifico chapter-themes.css, NO se consumieron tokens [data-chapter].

## Conocidos Stubs

**ContactHUD visible pero sin links activos en produccion actual:**
El HUD se monta correctamente pero con `contact.js` en estado placeholder (`email: '', linkedinUrl: '', githubUrl: ''`):
- El anchor email renderea con `aria-disabled='true'` (no clikeable)
- Los anchors LinkedIn y GitHub NO se renderizan (v-if con valores vacios)
- Esto es **intencional y esperado** hasta que Rafael llene CONTENT-CHECKLIST §3

**Resolucion:** Rafael debe commitear sus datos reales en `src/data/contact.js` (tarea del executor de CONTENT-CHECKLIST, no de este plan).

## Pendiente para Planes Siguientes

| Plan | Tarea |
|------|-------|
| 03-03 (W2) | Chapter3Content + ProjectCard skeumorphic + integracion en section ch3 de ScrollShell |
| 03-04 (W3) | SEO via @unhead/vue — useHead en App.vue (NO modificar ContactHUD) |
| 03-05 (W4) | Avatar pixel art batch 7 busts (checkpoint:human-input bloqueante) |
| CONTENT-CHECKLIST §3 | Rafael llena email, LinkedIn URL, GitHub URL en src/data/contact.js — habilita los 3 links del HUD |

## Self-Check: PASSED

- [x] `src/components/ContactHUD.vue` existe (153 LOC)
- [x] `tests/components/ContactHUD.test.js` existe (11 tests verdes)
- [x] `src/App.vue` contiene `<ContactHUD />` como ultimo hijo del template root
- [x] Commits verificados: 8e65f9b (RED), 3a584d5 (GREEN), ef564c3 (mount App.vue)
- [x] Suite completa: 171 tests verdes (baseline 160 + 11 nuevos)
- [x] Build verde: `dist/assets/index-B5sR-pZ9.js` contiene string `contact-hud`
- [x] T-CON-03 mitigado: `rel="noopener noreferrer"` en cada external anchor
- [x] Pitfall 7 evitado: sin `outline:` propio en `.contact-icon`
- [x] Pitfall 3 evitado: aria-labels reactivos via `useI18n()` t()
- [x] D3-10 invariante: tokens neutros, sin consumo de [data-chapter]
