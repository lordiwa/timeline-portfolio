---
phase: 2
plan: 3
subsystem: theme-system
slug: wave2-chapter-themes-css
wave: 2
tags: [css, themes, @layer, chapter-themes, tokens, a11y, focus-ring, tdd]
dependency_graph:
  requires:
    - "Plan 02-01 (W0, vue-i18n setup) — vue-i18n@11.4.2 instalado, <html lang> watcher en App.vue"
    - "Plan 02-02 (W1, i18n-components) — LangToggle.vue montado en App.vue; ScrollShell i18nificado con aria-labels reactivos; data-chapter en sections ya en place desde Phase 1"
    - "Phase 1 (01-03) — :focus-visible universal 3px solid var(--c-focus) declarado en App.vue global <style>"
  provides:
    - "src/styles/chapter-themes.css — motor de themes con @layer reset/themes/components/utilities + 7 [data-chapter=\"N\"] blocks (ch0/ch1 completos + ch2-6 stubs era-tinted)"
    - "src/main.js — import './styles/chapter-themes.css' antes del mount (cascade order correcto)"
    - "22 tests arquitecturales verdes en tests/styles/ + tests/components/ScrollShell.theme-isolation.test.js"
  affects:
    - "Plan 02-04 (W3, BackgroundLayers + useBackgroundMorph) — consumes [data-chapter] DOM pattern + --c-bg tokens ya definidos"
    - "Plan 02-05 (W4, self-hosted fonts) — chapter-themes.css ya declara --font-body stacks con fallback system-safe; W4 solo añade @font-face + ./styles/fonts.css import"
    - "W5 (manual checklist) — A11Y-04 axe audit de contrast + DevTools Computed panel verify de --c-bg resolution per chapter"
tech_stack:
  added:
    - "(ninguno nuevo — CSS puro, sin dependencias NPM nuevas)"
  patterns:
    - "PATTERN @layer cascade: `@layer reset, themes, components, utilities;` establece orden ASCENDENTE de prioridad. themes sobreescribe reset; components sobreescribe themes; utilities tiene la última palabra. Phase 3/4 poblarán components + utilities sin tocar themes."
    - "PATTERN per-section [data-chapter] override: CSS Custom Props descienden naturalmente al .chapter-section child. ScrollShell.vue ya tiene `background: var(--c-bg); color: var(--c-fg);` en su CSS scoped — consume los tokens override sin modificar el componente."
    - "PATTERN contrast tradeoff comment (THM-05 + D2-03): ch1 documenta inline el ratio 3.2:1 con justificación era-authentic y mitigación legibility. Los otros 6 chapters pasan AAA ≥10:1 sin tradeoff."
    - "PATTERN readFileSync raw-source asserts: todos los tests verifican el texto fuente CSS directamente (no computed styles). jsdom NO resuelve @layer cascade + CSS Custom Props heredados — limitación documentada en plan `notes.jsdom_limitation`. Validación computed-style → W5 §1 manual DevTools."
    - "PATTERN Pitfall 7 avoidance: chapter-themes.css NO declara outline: en ningún chapter block. Solo override --c-focus por chapter. El grosor (3px) y offset (3px) del :focus-visible universal de App.vue permanecen intactos en todos los chapters."
key_files:
  created:
    - src/styles/chapter-themes.css
    - tests/styles/themes-file.test.js
    - tests/styles/theme-tokens.test.js
    - tests/styles/contrast-docs.test.js
    - tests/styles/focus-ring.test.js
    - tests/components/ScrollShell.theme-isolation.test.js
    - .planning/phases/02-theme-system-i18n/02-03-SUMMARY.md
  modified:
    - src/main.js (import './styles/chapter-themes.css' añadido antes del mount)
decisions:
  - "CSS sin alineación de columnas (--c-bg: #000000, no --c-bg:      #000000): los tests de theme-tokens.test.js verifican substring match estándar; la alineación visual rompería T8/T9. Formato estándar CSS elegido. [Regla 1 auto-fix durante RED phase]"
  - "Tests architectural-only (no computed style): jsdom assumption A1 del plan limita la verificación a DOM markup + source text. Computed-style → W5 §1 DevTools manual."
  - "ch0 también tiene comentario informativo de contraste (15.3:1 AAA sin tradeoff) — D2-03 dice no requiere pero documentar positivamente ayuda al auditor humano. No viola ningún test."
  - "A11Y-04 NO reclamado en W2 — ver plan `notes.a11y_04_scope`. El axe/Pa11y/Lighthouse audit es W5 §4 manual."
metrics:
  duration_minutes: 18
  completed_at: "2026-05-13T12:17:00Z"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
  tests_added: 22
  tests_passing: 126
---

# Phase 2 Plan 03: Chapter Themes CSS — Motor Visual Summary

**One-liner:** `chapter-themes.css` con `@layer reset, themes, components, utilities` + 7 bloques `[data-chapter="N"]` (ch0 terminal verde, ch1 HTML-90s magenta/navy con tradeoff THM-05 verbatim, ch2-6 stubs era-tinted), wired en `main.js` antes del mount — 22 tests arquitecturales verdes, suite 126/126.

## Qué se construyó

### 1. `src/styles/chapter-themes.css` — 150 LOC, motor visual completo

Estructura del archivo (en este orden):

1. **Header comment bloque** — propósito, 7 themes, ch0/ch1 completos, ch2-6 stubs, source of truth UI-SPEC §4.2, REQ-IDs THM-01..05.
2. **`@layer reset, themes, components, utilities;`** — declaración en la primera línea no-comentario. Orden ASCENDENTE de prioridad (THM-02).
3. **`@layer themes { ... }`** con los 7 chapter blocks:

| Chapter | Era | --c-bg | --c-fg | Estado |
|---------|-----|--------|--------|--------|
| ch0 | Terminal 1995 | `#000000` | `#00ff41` | COMPLETO — 15.3:1 AAA |
| ch1 | HTML 90s crudo | `#000080` | `#ff00ff` | COMPLETO — 3.2:1 tradeoff THM-05 |
| ch2 | Flash era 2009 | `#2a1a4a` | `#e0c0ff` | Stub — 12.6:1 AAA |
| ch3 | Web 2.0 2013 | `#f0f4ff` | `#1a1a2e` | Stub — 13.4:1 AAA |
| ch4 | AR/VR 2015-18 | `#0a0f2e` | `#b0d0ff` | Stub — 11.8:1 AAA |
| ch5 | Modern 2022-24 | `#ffffff` | `#1a1a2e` | Stub — 14.2:1 AAA |
| ch6 | Phaser/AI 2025+ | `#000814` | `#c0e0ff` | Stub — 10.8:1 AAA |

4. **`@layer components {}`** — vacío con comment "Phase 3/4 reservado para era-authentic UI components".
5. **`@layer utilities {}`** — vacío con comment "Phase 3/4 reservado para utility classes responsive".

**Comentario THM-05 ch1 verbatim (D2-03 mandatorio):**
```
/* contrast(#ff00ff, #000080) = 3.2:1 — chapter 1 (HTML 90s crudo) accepts 3.2:1 here
   as era-authentic tradeoff per THM-05; era-accurate visual identity (Comic Sans +
   magenta on starry navy) demands this. Compensated by larger font-size 18px+ minimum
   which improves perceived legibility. */
```

### 2. `src/main.js` — import wired antes del mount

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import './styles/chapter-themes.css'   // W2: @layer cascade + 7 themes era-auténticos

createApp(App).use(i18n).mount('#app')
```

Vite bundlea CSS imports en orden de declaración — el cascade se parsea antes del primer render.

### 3. Tests arquitecturales — 22 tests verdes (Task 3.1 + 3.2)

| Archivo | Tests | REQ-IDs | Qué verifica |
|---------|-------|---------|--------------|
| `tests/styles/themes-file.test.js` | 4 | THM-01, THM-02 | Existencia, @layer declaration regex, wrapper themes, 7 selectors únicos |
| `tests/styles/theme-tokens.test.js` | 9 | THM-03 | 6 tokens por chapter (T1-T7) + verbatim ch0/ch1 (T8-T9) |
| `tests/styles/contrast-docs.test.js` | 3 | THM-05 | ch1 tradeoff verbatim presente; ch0 y ch2-6 sin tradeoff phrase |
| `tests/styles/focus-ring.test.js` | 3 | A11Y-03, Pitfall 7 | App.vue 3px intacto; chapter-themes.css sin outline; LangToggle sin outline |
| `tests/components/ScrollShell.theme-isolation.test.js` | 3 | THM-04 | 7 sections con data-chapter correcto; ningún ancestor tiene data-chapter; ids chapter-N |

**NOTA jsdom_limitation:** Todos los tests verifican source text (readFileSync) o DOM markup. jsdom NO resuelve `@layer` cascade + CSS Custom Props heredados — validación computed-style deferred a W5 §1 manual (DevTools Computed panel). Ver plan `notes.jsdom_limitation`.

**NOTA A11Y-04:** No reclamado en W2. El axe/Pa11y/Lighthouse external audit es W5 §4 manual. W2 documenta contrast inline (THM-05) pero no audita externamente. Ver plan `notes.a11y_04_scope`.

## Verificación

### Automatizada

```
npm run test:run && npm run build
```

- **22/22** tests nuevos de W2 passing.
- **126/126** suite completa passing (104 previos Phase1+W0+W1 + 22 nuevos W2).
- `npm run build` → OK, 1.34s, CSS 6.66 kB / 1.99 kB gzip, JS 130.30 kB / 47.64 kB gzip.
  Bundle CSS creció de ~4.5 kB (Phase 1 baseline) a ~6.66 kB (+2.16 kB) — dentro del rango esperado (~2KB extras).

### Bundle delta

| Artefacto | Antes (W1) | Después (W2) | Delta |
|-----------|-----------|--------------|-------|
| CSS (gzip) | ~1.2 kB est | 1.99 kB | +~0.8 kB |
| CSS (raw) | ~4.5 kB est | 6.66 kB | +2.16 kB |
| JS (gzip) | ~47 kB | 47.64 kB | +~0.6 kB |

### Manual (pendiente W5)

- DevTools: scrollear ch0 → ch6, cada section muestra `--c-bg`/`--c-fg` distintos.
- Ch0: fondo `#000000` + texto `#00ff41` (terminal verde fosforescente).
- Ch1: fondo `#000080` + texto `#ff00ff` (magenta navy).
- Ch2-6: era-tinted distinguibles con fallback system-safe fonts (cursive ch1, serif ch3, etc.).
- Computed panel: `<section data-chapter="3">` → `--c-bg` resuelve a `#f0f4ff`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Regla 1 - Bug] Formato CSS estándar en lugar de alineación de columnas**
- **Encontrado durante:** Task 3.1, fase GREEN — T8/T9 de theme-tokens.test.js fallaron porque `--c-bg:      #000000` (con múltiples espacios de alineación) no matchea `--c-bg: #000000` (un espacio).
- **Issue:** El plan menciona "verbatim de UI-SPEC §4.2" pero los tests verifican con `toContain('--c-bg: #000000')` (un espacio). La UI-SPEC también usa alineación visual pero el test espera forma compacta.
- **Fix:** Reescribir chapter-themes.css con formato CSS estándar (un espacio después del colon) en lugar de alineación de columnas. Preserva todos los valores hex verbatim y comentarios.
- **Archivos modificados:** `src/styles/chapter-themes.css` (segunda versión)
- **Impacto:** Ninguno en funcionalidad. Los valores hex son idénticos. El CSS resultante es más idiomático.

## Authentication Gates

Ninguno.

## Known Stubs

ch2-6 son stubs arquitecturales intencionales — la paleta y fuentes están declaradas verbatim de UI-SPEC §4.2, pero el pixel art y el contenido definitivo llegan en Phase 3 (ch3 Web 2.0) y Phase 4 (ch2/4/5) y Phase 5 (ch6). No bloquean el objetivo del plan (motor de themes visual). Ver plan `<objective>` para delimitación.

## Threat Flags

Ninguno. chapter-themes.css es un archivo CSS de override de tokens — no introduce endpoints, auth paths, file access patterns ni schema changes.

## Pending para W3 (Plan 02-04)

- `BackgroundLayers.vue` — 2 capas apiladas `position: fixed; inset: 0; z-index: -1` con opacity crossfade.
- `useBackgroundMorph(activeChapter, prm)` — composable que orquesta el crossfade entre eras.
- Remover `body { background: #0b0b16; }` de `index.html` si existe (W3 usa background layers).
- Las secciones ya consumen `--c-bg` / `--c-fg` via CSS scoped de ScrollShell — W3 añade el bg morph encima sin modificar el patrón [data-chapter].

## Commits

- `a4d9163` — feat(02-03): crear chapter-themes.css con @layer cascade + 7 theme blocks
- `1e8751e` — test(02-03): focus ring universal preservado + theme isolation arquitectural

## Self-Check: PASSED

Verificación post-SUMMARY:

- src/styles/chapter-themes.css existe (FOUND, ~150 LOC).
- src/main.js contiene `import './styles/chapter-themes.css'` (FOUND).
- tests/styles/themes-file.test.js existe (FOUND, 4 tests).
- tests/styles/theme-tokens.test.js existe (FOUND, 9 tests).
- tests/styles/contrast-docs.test.js existe (FOUND, 3 tests).
- tests/styles/focus-ring.test.js existe (FOUND, 3 tests).
- tests/components/ScrollShell.theme-isolation.test.js existe (FOUND, 3 tests).
- Commit `a4d9163` existe en git log (FOUND).
- Commit `1e8751e` existe en git log (FOUND).
- Suite Vitest 126/126 verde, build Vite OK.
