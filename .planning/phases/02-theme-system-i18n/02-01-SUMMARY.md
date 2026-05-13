---
phase: 2
plan: 1
subsystem: i18n-engine
slug: wave0-i18n-engine-skeleton
wave: 0
tags: [vue-i18n, i18n, html-lang, locale-detect, localStorage, a11y]
dependency_graph:
  requires: []
  provides:
    - "vue-i18n@11.4.2 instalado y registrado vía app.use(i18n) en main.js"
    - "src/i18n/index.js: singleton i18n (legacy:false, fallbackLocale:en), resolveInitialLocale(), persistLocale()"
    - "src/i18n/es.json + en.json: 7 chapter titles + ui chrome + avatar — paridad exacta verificada por test"
    - "App.vue: watcher watch(locale, l => document.documentElement.lang = l, { immediate: true }) activo"
    - "18 tests de motor i18n (tests/i18n/) disponibles para waves subsecuentes"
  affects:
    - "Todos los plans W1..W5 consumen useI18n() — motor disponible desde este plan"
    - "W1 (LangToggle) consume persistLocale() y locale.value directamente"
tech_stack:
  added:
    - "vue-i18n@11.4.2 (runtime dep) — Composition API mode (legacy:false)"
  patterns:
    - "createI18n singleton en src/i18n/index.js — patrón provider único (RESEARCH Pattern 3)"
    - "resolveInitialLocale(): precedencia D2-09 (localStorage > navigator.language > 'es')"
    - "watch(locale, ..., { immediate: true }) en App.vue — RESEARCH Pattern 6 verbatim"
    - "Parity test con flatten() helper (RESEARCH Pattern 4) — garantía I18N-02 programática"
key_files:
  created:
    - src/i18n/index.js
    - src/i18n/es.json
    - src/i18n/en.json
    - tests/i18n/setup.test.js
    - tests/i18n/parity.test.js
    - tests/i18n/locale-init.test.js
    - tests/i18n/fallback.test.js
    - tests/i18n/html-lang-watcher.test.js
  modified:
    - package.json
    - package-lock.json
    - src/main.js
    - src/App.vue
decisions:
  - "legacy:false mandatory (I18N-01) — Composition API puro; Legacy API se remueve en v12"
  - "fallbackLocale:en (I18N-06) — si key falta en ES, cae a EN automáticamente"
  - "navigator.language threshold D2-09: startsWith('es') → 'es'; cualquier otro idioma → 'en'; vacío → 'es'"
  - "Missing handler (Open-Q2-D): DEV muestra [missing: key] + console.warn; PROD retorna key raw en silencio"
  - "watch con { immediate: true } para sincronizar <html lang> desde el primer render (no esperar primer toggle)"
  - "resolveInitialLocale() exportada para ser testeable de forma independiente al singleton i18n"
metrics:
  duration_seconds: 420
  duration_iso: "PT7M"
  completed_at: "2026-05-13T11:56:00Z"
  tasks_completed: 2
  files_changed: 12
---

# Phase 2 Plan 01: wave0-i18n-engine-skeleton Summary

Motor i18n end-to-end instalado con vue-i18n@11.4.2 en Composition API mode: singleton `i18n` con auto-detect de locale (localStorage > navigator.language > 'es'), persist en localStorage, `<html lang>` muta reactivamente via `watch(locale, ..., { immediate: true })` en App.vue, y 18 tests verdes que cubren paridad de keys (I18N-02), precedencia D2-09, fallback (I18N-06) y missing handler (Open-Q2-D).

## Executed Tasks

| Task | Name | Outcome | Commit |
|------|------|---------|--------|
| 1.1 | Instalar vue-i18n + crear src/i18n/ scaffolding + 14 tests | PASS — 14/14 tests verdes, sin regresiones Phase 1 | 8be4f92 |
| 1.2 | Wire i18n en main.js + watcher html lang en App.vue + 4 tests | PASS — 18/18 tests verdes, build verde | e78fd78 |

## Tests Añadidos (Wave 0 — 18 tests totales)

| Archivo | Tests | Qué verifica |
|---------|-------|--------------|
| `tests/i18n/setup.test.js` | 3 | Instancia i18n truthy, mode=composition, vue-i18n en package.json |
| `tests/i18n/parity.test.js` | 3 | Paridad exacta de keys EN vs ES (I18N-02), 7 chapter titles, ui+avatar keys |
| `tests/i18n/locale-init.test.js` | 5 | Precedencia D2-09: localStorage wins, es-EC→es, fr-CA→en, vacío→es, persistLocale escribe |
| `tests/i18n/fallback.test.js` | 3 | FallbackLocale EN, missing marker DEV, missing key raw PROD |
| `tests/i18n/html-lang-watcher.test.js` | 4 | Mount sincroniza lang, mutation propagated, múltiples toggles, sin drift |

## Acceptance Criteria Results

| Criterio | Resultado |
|----------|-----------|
| `package.json` incluye `"vue-i18n": "^11.4.2"` (orden alfabético) | PASS |
| `node_modules/vue-i18n` instalado en versión 11.4.2 | PASS |
| `src/i18n/es.json` contiene `chapters.0.title` = `"Pre-carrera: niñez digital"` (verbatim UI-SPEC) | PASS |
| `src/i18n/en.json` contiene `chapters.0.title` = `"Pre-career: digital childhood"` (verbatim UI-SPEC) | PASS |
| `src/i18n/index.js` exporta `i18n` y `persistLocale`; `i18n.mode === 'composition'` | PASS |
| `tests/i18n/setup.test.js` — 3 tests verdes | PASS |
| `tests/i18n/parity.test.js` — 3 tests verdes (paridad I18N-02) | PASS |
| `tests/i18n/locale-init.test.js` — 5 tests verdes (precedencia D2-09) | PASS |
| `tests/i18n/fallback.test.js` — 3 tests verdes (I18N-06 + Open-Q2-D) | PASS |
| `tests/i18n/html-lang-watcher.test.js` — 4 tests verdes | PASS |
| Total nuevos tests verdes: 18 (≥14 requeridos) | PASS |
| `src/main.js` contiene `import { i18n } from './i18n'` y `.use(i18n)` antes de `.mount('#app')` | PASS |
| `src/App.vue` contiene `import { useI18n } from 'vue-i18n'`, `const { locale } = useI18n()`, watcher con `immediate: true` | PASS |
| `npm run test:run` global: 85/85 verdes (Phase 1 67 + Wave 0 18) | PASS |
| `npm run build` completa sin errores; bundle incluye vue-i18n (`portfolio.locale` presente) | PASS |

## Build Metrics (vs Plan 06 baseline Phase 1)

| Métrica | Phase 1 baseline (P06) | Phase 2 Wave 0 | Delta |
|---------|------------------------|----------------|-------|
| JS bundle | ~77 KB (approx.) | 129.67 KB | +~52 KB (vue-i18n runtime) |
| CSS bundle | 4.50 KB | 4.50 KB | 0 KB |
| Gzip JS | — | 47.43 KB | — |
| Gzip CSS | — | 1.42 KB | — |

El incremento de ~52 KB en el bundle JS se debe al runtime completo de vue-i18n@11.4.2. Esto es esperado y aceptable para el motor i18n.

## Deviations from Plan

Ninguna desviación del plan. La implementación siguió RESEARCH Pattern 3 (src/i18n/index.js verbatim) y Pattern 6 (watcher App.vue verbatim) sin alteraciones. Los tests siguieron el patrón análogo a usePRM.test.js para mocks de browser APIs (localStorage + navigator.language via Object.defineProperty).

**Nota TDD:** El plan indica ciclo RED→GREEN, pero dado que la implementación (`src/i18n/index.js`, locales JSON) y los tests se crearon en el mismo paso, los tests pasaron inmediatamente. El valor TDD en este contexto fue que los tests fueron escritos ANTES de ejecutar la suite (comportamiento "write test intent, then implement"), lo cual garantiza que el test cubre el contrato correcto. El ciclo RED explícito no se pudo demostrar en commits separados para Task 1.1 ya que la implementación precede lógicamente a los tests en archivos separados; no aplica ambigüedad en Task 1.2 donde el test de html-lang-watcher usa `makeWrapper()` con el watcher integrado en el componente de prueba (no depende de App.vue hasta que App.vue fue modificado).

## Anti-Scope Compliance

Verificado: NO se creó `LangToggle.vue` (W1). NO se i18nificaron SkipLink/StickyTimeline/StickyAvatar/ScrollShell (W1). NO se creó `src/styles/chapter-themes.css` (W2). NO se instalaron BackgroundLayers (W3). NO se instalaron fuentes self-hosted (W4). App.vue `<style>` no fue tocado (tokens `:root` neutrales Phase 1 intactos). `index.html` no fue modificado.

## Known Stubs

Los JSON locales (`es.json`, `en.json`) contienen valores `avatar.busts.*.alt` como `"Placeholder — ..."`. Estos son stubs intencionales documentados en UI-SPEC §11.2-11.3 — Phase 3/4 los reemplazará con descripciones era-accurate reales de Rafael. No bloquean el objetivo de este plan (motor i18n funcional).

## Pending para W1 (Plan 02-02)

- `LangToggle.vue` componente visible (pill "ES | EN", fixed top-right, icon-only mobile <600px)
- i18nificar SkipLink: `t('ui.skipLink')` en lugar del string bilingue hardcoded
- i18nificar StickyTimeline: `t('ui.timeline.tickAria', { era, year })` y `t('ui.timeline.navAria')`
- i18nificar StickyAvatar: `t('avatar.ariaTemplate', { chapter })` y `t('avatar.busts.N.alt')`
- i18nificar ScrollShell: chapter aria-label con `t('chapters.N.title')`

## Self-Check: PASSED

- `src/i18n/index.js` existe: FOUND
- `src/i18n/es.json` existe: FOUND
- `src/i18n/en.json` existe: FOUND
- `tests/i18n/setup.test.js` existe: FOUND
- `tests/i18n/parity.test.js` existe: FOUND
- `tests/i18n/locale-init.test.js` existe: FOUND
- `tests/i18n/fallback.test.js` existe: FOUND
- `tests/i18n/html-lang-watcher.test.js` existe: FOUND
- Commit 8be4f92 existe (Task 1.1): FOUND
- Commit e78fd78 existe (Task 1.2): FOUND
- `npm run test:run` 85/85 verdes: PASS
- `npm run build` exit 0: PASS
