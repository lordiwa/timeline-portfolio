---
phase: 2
plan: 2
subsystem: i18n-ui-chrome
slug: wave1-lang-toggle-vertical-slice
wave: 1
tags: [i18n, lang-toggle, a11y, vue-i18n, reactive, pitfall-3, tdd, phase-1-components]
dependency_graph:
  requires:
    - "Plan 02-01 (W0, i18n-motor) — vue-i18n@11.4.2, src/i18n/index.js, es.json/en.json, watcher <html lang> en App.vue, 85 tests verdes"
  provides:
    - "src/components/LangToggle.vue — botón pill fixed top-right con toggle ES↔EN, persist localStorage, mobile icon-only @media 599px"
    - "App.vue extendido — <LangToggle /> como último hijo del template root (orden: SkipLink → StickyAvatar → ScrollShell → StickyTimeline → LangToggle)"
    - "SkipLink.vue i18nificado — t('ui.skipLink') reemplaza string bilingue hardcoded"
    - "StickyTimeline.vue i18nificado — t('ui.timeline.navAria') + t('ui.timeline.tickAria', { era, year }) con interpolación reactiva"
    - "StickyAvatar.vue i18nificado — t('avatar.ariaTemplate', { chapter: activeChapter }) con interpolación reactiva"
    - "ScrollShell.vue i18nificado — t('chapters.' + ch.id + '.title') en :aria-label de cada <section>"
    - "tests/i18n/test-helpers.js — helper createTestI18n({ locale }) exportable para toda la suite"
  affects:
    - "Plan 02-03 (W2, chapter-themes): todos los componentes ya usan tokens neutros; LangToggle hereda focus-visible universal de App.vue"
    - "Plan 02-05 (W4, fuentes self-hosted): LangToggle usa font-family: var(--font-body, ui-monospace); Phase 2 solo swapa la variable"
    - "Plan 03+ (contenido): scroll de chapters ya anuncia title bilingue via aria-label reactivo de ScrollShell"
tech_stack:
  added:
    - "(ninguno nuevo — todo construido sobre vue-i18n@11.4.2 instalado en W0)"
  patterns:
    - "useI18n() en lugar de inject manual — RESEARCH §935: el plugin vue-i18n inyecta globalmente; NO se provide/inject manualmente (Pitfall resuelto)"
    - "locale.value = next ANTES de persistLocale(next) — reactividad vue-i18n re-evalúa todos los t() en el mismo tick antes del side-effect de localStorage"
    - "createTestI18n helper centralizado — extraído a tests/i18n/test-helpers.js (>5 LOC duplicados en 4 test files justificó extracción)"
    - "readFileSync raw-source CSS asserts — patrón heredado de Phase 1 (StickyAvatar.test.js); aplicado en LangToggle.test.js para Pitfall 7 (no outline propio)"
    - "flushPromises() para reactive (Pitfall 3) — el binding t() es reactivo vía Composition API; mutar i18n.global.locale.value + flushPromises() propaga sin re-mount"
    - "::before con content:'🌐' en @media 599px — emoji unicode como pseudo-element; NO SVG (UI-SPEC §8.3 locked choice)"
key_files:
  created:
    - src/components/LangToggle.vue
    - tests/components/LangToggle.test.js
    - tests/i18n/test-helpers.js
  modified:
    - src/App.vue (import LangToggle + <LangToggle /> como último hijo)
    - src/components/SkipLink.vue (useI18n + t('ui.skipLink'))
    - src/components/StickyTimeline.vue (useI18n + t(navAria) + t(tickAria, interpolación))
    - src/components/StickyAvatar.vue (useI18n + t(ariaTemplate, { chapter }))
    - src/components/ScrollShell.vue (useI18n + t('chapters.' + id + '.title'))
    - tests/components/SkipLink.test.js (createTestI18n en mount + 2 tests i18n nuevos)
    - tests/components/StickyTimeline.test.js (createTestI18n en mount + 3 tests i18n nuevos)
    - tests/components/StickyAvatar.test.js (createTestI18n en mount + 2 tests i18n nuevos)
    - tests/components/ScrollShell.test.js (createTestI18n en mount + 2 tests i18n nuevos)
decisions:
  - "createTestI18n helper en tests/i18n/test-helpers.js — 4 test files comparten el setup de 6+ LOC; extraer evita drift entre suites si los parámetros de createI18n cambian"
  - "localStorage spy con vi.spyOn(Storage.prototype, 'setItem') en lugar de vi.mock('@/i18n') — valida el side-effect real que ocurre en producción, menos magic que el mock de módulo"
  - "Assertion multiplexing: mount separado por locale (mountWithI18n({ locale: 'es' }) + mountWithI18n({ locale: 'en' })) en lugar de regex tolerante — más explícito y fácil de debuggear"
  - "NO migrar array chapters[] a src/data/chapters.js — decisión locked de PATTERNS.md §4; Phase 3 con CON-05 lo consolida cuando llegue contenido real"
  - "NO i18nificar <p class='era-title'>{{ ch.year }} · {{ ch.era }}</p> — Phase 3/4 lo i18nifica cuando llegue contenido visible real; Phase 2 solo cubre aria-labels"
  - "Tests T2b añadido en LangToggle.test.js (locale=en → active='EN', inactive='ES') — cubre el caso inverso no previsto en el plan original; minor deviation Rule 2 (completeness)"
metrics:
  duration_minutes: 45
  completed_at: "2026-05-13T12:10:00.000Z"
  tasks_completed: 2
  files_created: 3
  files_modified: 9
  tests_added: 19
  tests_passing: 104
  baseline_before: 85
  baseline_after: 104
  css_bundle_kb: 5.46
  js_bundle_kb: 130.30
---

# Phase 2 Plan 02: Wave 1 Lang Toggle + i18n UI Chrome Summary

**One-liner:** LangToggle.vue fixed top-right (pill ES|EN, persistencia localStorage, mobile icon-only 🌐) + 4 componentes Phase 1 i18nificados con useI18n() reactivo — toggle locale propaga a todos los aria-labels sin recarga, Pitfall 3 evitado, suite sube de 85 a 104 tests verdes.

## Qué se construyó

### 1. `src/components/LangToggle.vue` — botón pill i18n visible

**LOC aproximados:** ~90 (script 30, template 10, style 50)

**Estructura DOM:**
```html
<button class="lang-toggle" :aria-label="t('ui.langToggle.aria')" @click="toggle">
  <span class="lang-active">ES</span>
  <span class="lang-sep" aria-hidden="true">|</span>
  <span class="lang-inactive">EN</span>
</button>
```

**Lógica toggle:**
```javascript
const { locale, t } = useI18n()
function toggle() {
  const next = locale.value === 'es' ? 'en' : 'es'
  locale.value = next      // vue-i18n reactivity → t() re-evalúa todo
  persistLocale(next)      // localStorage.setItem('portfolio.locale', next)
}
```

**CSS principales (UI-SPEC §8.2):**
- `position: fixed; top: var(--sp-md); right: var(--sp-md)` — simétrico al avatar top-left
- `z-index: 40` — mismo nivel que avatar/timeline
- `border-radius: 999px` — pill
- `min-width: 44px; min-height: 44px` — tap target a11y
- `transition: background 150ms ease, color 150ms ease` — interaction-derived (D-05)
- **Sin `outline:` propio** — Pitfall 7 evitado; hereda el `:focus-visible` universal de App.vue

**Mobile @media (max-width: 599px) — UI-SPEC §8.3:**
- `.lang-sep { display: none }` + `.lang-inactive { display: none }` — icon-only
- `::before { content: '🌐'; font-size: 14px }` — emoji unicode como ícono
- `padding: var(--sp-sm)` — shrinks pill
- `.lang-active { font-size: 11px }` — reduce label
- `min-width/min-height: 44px` mantenidos — tap target preservado

### 2. Componentes Phase 1 i18nificados (diff mínimo)

Cada componente recibió exactamente 2 líneas en `<script setup>` y 1-2 cambios en template:

| Componente | Import añadido | Cambio template |
|---|---|---|
| SkipLink.vue | `import { useI18n } from 'vue-i18n'` + `const { t } = useI18n()` | `>{{ t('ui.skipLink') }}</a>` |
| StickyTimeline.vue | ídem | `:aria-label="t('ui.timeline.navAria')"` + `:aria-label="t('ui.timeline.tickAria', { era: ch.era, year: ch.year })"` |
| StickyAvatar.vue | ídem | `:aria-label="t('avatar.ariaTemplate', { chapter: activeChapter })"` |
| ScrollShell.vue | ídem | `:aria-label="t('chapters.' + ch.id + '.title')"` |

**NO tocados:** el state machine de opacity de StickyAvatar (líneas 33-77), el array `chapters[]` inline (Phase 3 consolida), el `<p class="era-title">{{ ch.year }} · {{ ch.era }}</p>` (Phase 3/4 i18nifica visible text).

### 3. `src/App.vue` — extensión mínima

- Import: `import LangToggle from './components/LangToggle.vue'`
- Template: `<LangToggle />` como último hijo (orden final: SkipLink → StickyAvatar → ScrollShell → StickyTimeline → LangToggle)

### 4. Tests añadidos/extendidos

**Nuevo `tests/components/LangToggle.test.js` — 10 tests:**

| Test | Verifica |
|---|---|
| T1 | DOM contract: button.lang-toggle + aria-label + 3 spans |
| T2 | locale=es → active='ES', inactive='EN' |
| T2b | locale=en → active='EN', inactive='ES' (extra no planificado) |
| T3 | Click toggle: locale es→en, aria-label cambia |
| T4 | persist: localStorage.setItem('portfolio.locale', 'en') |
| T5 | Texts swap: tras click active='EN', inactive='ES' |
| T6 | Aria reactive (Pitfall 3): mutar locale.value → aria actualiza sin re-mount |
| T7 | CSS: position:fixed, top/right --sp-md, z-index:40, 44px tap, 999px radius |
| T8 | CSS: sin outline: propio en .lang-toggle (Pitfall 7) |
| T9 | CSS mobile @media 599px: .lang-sep/.lang-inactive display:none + ::before '🌐' |

**`tests/i18n/test-helpers.js` — helper exportable:**
- `createTestI18n({ locale })` con los JSON de producción — usado en los 4 test files de componentes Phase 1

**Tests extendidos en Phase 1 (9 nuevos):**

| Test file | Tests añadidos | REQ-IDs |
|---|---|---|
| SkipLink.test.js | +2 (i18n texto es/en, reactive Pitfall 3) | I18N-05 |
| StickyTimeline.test.js | +3 (nav aria es/en, tick aria interpolación, reactive) | I18N-05 |
| StickyAvatar.test.js | +2 (ariaTemplate con chapter, reactive toggle) | I18N-05 |
| ScrollShell.test.js | +2 (aria-label desde chapters.N.title es/en, reactive) | I18N-03, I18N-05 |

## Phase 1 Regression Baseline — confirmado

Todos los test files del baseline Phase 1 siguen verdes post-W1:

| Test file | Tests | Estado |
|---|---|---|
| tests/components/SkipLink.test.js | 10 (8 orig + 2 nuevos) | VERDE |
| tests/components/StickyTimeline.test.js | 16 (13 orig + 3 nuevos) | VERDE |
| tests/components/StickyAvatar.test.js | 12 (10 orig + 2 nuevos) | VERDE |
| tests/components/ScrollShell.test.js | 18 (orig + 2 nuevos) | VERDE |
| tests/composables/useScrollState.test.js | 11 | VERDE |
| tests/composables/usePRM.test.js | (sin modificar) | VERDE |
| tests/smoke.test.js | (sin modificar) | VERDE |
| tests/i18n/*.test.js (W0) | 18 | VERDE |
| **Total suite** | **104** | **VERDE** |

**COUNT total: 104 (era 85) — cero regresión funcional.**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Test T2b (locale=en invertido)**

- **Encontrado durante:** Task 2.1, al escribir T2
- **Problema:** El plan especifica T2 con locale='es' → active='ES', inactive='EN'. El caso inverso (locale='en' → active='EN', inactive='ES') no estaba en el plan original pero es igualmente crítico para verificar la bidireccionalidad del template.
- **Fix:** Añadido test T2b inline en la misma suite.
- **Files modified:** `tests/components/LangToggle.test.js`
- **Commit:** `11e9885` (RED) / `7554fff` (GREEN)

### Sin otras desviaciones

El plan se ejecutó prácticamente verbatim. Los 4 componentes Phase 1 recibieron el diff mínimo especificado en PATTERNS.md. El helper createTestI18n se extrajo a `tests/i18n/test-helpers.js` (umbral >5 LOC duplicados cumplido: 6 LOC por test file × 4 files = 24 LOC evitados).

## Decisiones tomadas

1. **createTestI18n en tests/i18n/test-helpers.js sí** — 4 test files comparten el mismo boilerplate (createI18n + legacy:false + locale + fallbackLocale + messages). Extracción evita drift y reduce LOC.

2. **Assertion multiplexing con mount separado** — Cada locale se monta en su propia instancia en lugar de mutar mid-test. Más legible, evita dependencia de orden.

3. **vi.spyOn(Storage.prototype, 'setItem')** para T4 — valida el side-effect real del `localStorage.setItem` que hace `persistLocale()` internamente, sin mockear el módulo entero.

4. **NO ScrollShell.test.js de cero** — El archivo ya existía de Phase 1 con 18 tests. Se extendió con 2 tests i18n reactivos en lugar de crear uno nuevo.

## Stubs conocidos

**Ningún stub crítico.** El LangToggle es completamente funcional: el botón existe en el DOM, persiste en localStorage, el `<html lang>` muta via el watcher de App.vue (del Plan 02-01), y todos los aria-labels reaccionan al toggle.

Los `<p class="era-title">{{ ch.year }} · {{ ch.era }}</p>` siguen en inglés/neutral porque Phase 2 NO i18nifica el visible text de las sections (solo aria-labels). Esto es intencional y documentado en el plan (`anti_scope`): Phase 3 lo resolverá con contenido real.

## Pending para W2 (Plan 02-03)

- `chapter-themes.css` con motor de themes completo — tokens `--c-bg`, `--c-fg`, etc. por `[data-chapter="N"]`
- Themes ch0/ch1 completos + stubs ch2-6
- El LangToggle NO necesita cambios para W2 — ya usa los tokens neutros que el theme override sobreescribirá automáticamente vía la cascade CSS

## Self-Check: PASSED

Verificación de claims antes de cerrar:

- ENCONTRADO: `src/components/LangToggle.vue` existe (commit `7554fff`)
- ENCONTRADO: `tests/components/LangToggle.test.js` existe (commit `11e9885`)
- ENCONTRADO: `tests/i18n/test-helpers.js` existe (commit `fbdc011`)
- ENCONTRADO: `src/App.vue` contiene `<LangToggle />` como último hijo (commit `7554fff`)
- ENCONTRADO: `src/components/SkipLink.vue` contiene `t('ui.skipLink')` (commit `317bcbb`)
- ENCONTRADO: `src/components/StickyTimeline.vue` contiene `t('ui.timeline.navAria')` + `t('ui.timeline.tickAria'` (commit `317bcbb`)
- ENCONTRADO: `src/components/StickyAvatar.vue` contiene `t('avatar.ariaTemplate'` (commit `317bcbb`)
- ENCONTRADO: `src/components/ScrollShell.vue` contiene `t('chapters.'` (commit `317bcbb`)
- ENCONTRADO: commits en git log — `11e9885`, `7554fff`, `fbdc011`, `317bcbb`
- Suite global: 104 tests verdes (verificado: `npm run test:run` → 104 passed)
- Build: verde (dist/assets/index-CYJboqQi.css 5.46 kB, dist/assets/index-CuUKtR0F.js 130.30 kB)
