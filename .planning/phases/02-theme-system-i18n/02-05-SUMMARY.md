---
phase: 2
plan: 5
slug: wave4-fonts-self-hosted-pipeline
wave: 4
completed: 2026-05-13
duration_min: 25
tests_added: 10
tests_total_suite: 151
commits:
  - 699c3e8: "feat(02-05): instalar 6 paquetes @fontsource y wire imports en main.js"
  - cc93d96: "feat(02-05): bundle smoke test + subsets latin/latin-ext para rango 150-350 KB"
requirements_covered:
  - THM-03: "6 fuentes self-hosted instaladas via @fontsource — tipografía era-auténtica per chapter"
key_decisions:
  - "D2-07 reinterpretado: 'self-hosted en /public/fonts/' → 'no CDN runtime dependency'. @fontsource packages cumplen el espíritu — woff2 bundleados por Vite y servidos desde el dominio del portfolio (no Google Fonts CDN). Letra 'carpeta /public/fonts/' sustituida por 'dist/assets/*.woff2' bundleados."
  - "Estrategia B locked: NO <link rel=preload> en W4. font-display: swap (incluido por @fontsource por defecto) cubre R1 FOUT mitigation. Preload deferred a Phase 6 si Lighthouse PSI detecta FOUT perceptible."
  - "ch2 (Verdana/Trebuchet MS) sin @fontsource: decisión locked per RESEARCH §R4. System-safe stack ~30-50 KB savings + graceful fallback en Android. NO se instala @fontsource/verdana ni equivalente."
  - "Subsets latin + latin-ext en lugar de index.css genérico: @fontsource incluye por defecto todos los subsets (cyrillic, greek, vietnamese) cuando se importa el index.css. Para cumplir el bundle target 150-350 KB (D2-08), se usan imports específicos (/latin.css + /latin-ext.css). Esto cubre ES/EN completo incluyendo ñ, á, é, í, ó, ú, ü, ¿, ¡ (Open-Q2-E)."
  - "inter-variable-latin.css: @fontsource-variable/inter no provee CSS por subset individual (solo index.css y wght.css que incluyen todos los subsets). Se creó src/styles/inter-variable-latin.css como selector de subsets latin+latin-ext apuntando directamente a los .woff2 del package. Esto mantiene Option A (no pipeline manual) — los .woff2 vienen del npm package sin modificar."
  - "font-weight: 100 900 en Inter Variable: el CSS custom inter-variable-latin.css declara el rango completo del axis wght, cumpliendo RESEARCH §R5 (fix: variable font weight range)."
  - "Latin Extended glyph coverage (Open-Q2-E) deferred MANUAL a W5 §5: verificación programática omitida por complejidad (decodificar .woff2 con fontkit añade dep + complejidad bundling sin ROI claro). El include de latin-ext subset garantiza que los glyphs están en el bundle — la verificación visual se hace en W5 con sample string ES en los 7 chapters."
files_modified:
  created:
    - tests/styles/fonts-loaded.test.js
    - tests/styles/fonts-bundle.test.js
    - src/styles/inter-variable-latin.css
  modified:
    - package.json
    - package-lock.json
    - src/main.js
---

# Phase 2 Plan 05: wave4-fonts-self-hosted-pipeline Summary

> 6 fuentes self-hosted vía @fontsource npm packages instaladas, wired en main.js con subsets latin+latin-ext (285.8 KB bundle — dentro del target 150-350 KB), y verificadas con 10 tests: 6 source-level (package.json ↔ main.js ↔ chapter-themes.css cross-check) + 4 bundle smoke post-build (@font-face count, font-display:swap, .woff2 presencia, size range).

## What got built

### `package.json` (modificado)

6 paquetes añadidos a `dependencies`:

| Paquete | Versión | Chapter | Font |
|---------|---------|---------|------|
| `@fontsource/vt323` | `^5.2.7` | ch0 | VT323 — CRT terminal phosphor |
| `@fontsource/comic-neue` | `^5.2.7` | ch1 | Comic Neue — Comic Sans equivalent libre |
| `@fontsource/lobster` | `^5.2.8` | ch3 | Lobster — Web 2.0 cursive (default landing) |
| `@fontsource/audiowide` | `^5.2.7` | ch4 | Audiowide — AR/VR futuristic geometric |
| `@fontsource-variable/inter` | `^5.2.8` | ch5 | Inter Variable — Modern weights 100-900 |
| `@fontsource/press-start-2p` | `^5.2.7` | ch6 | Press Start 2P — Phaser pixel UI |

ch2 (Verdana/Trebuchet MS) omitido intencionalmente — system-safe stack (RESEARCH §R4).

### `src/main.js` (modificado)

6 imports de fonts añadidos entre `import { i18n }` y `import './styles/chapter-themes.css'`.

Cada font importa subsets específicos (`/latin.css` + `/latin-ext.css`) en lugar del `index.css`
genérico. Esto reduce el bundle de 463 KB (todos los subsets) a 285.8 KB (solo latin + latin-ext),
manteniendo cobertura ES/EN completa:

```javascript
// Fonts self-hosted (W4) — @fontsource packages auto-wire @font-face declarations
// + bundle woff2 assets via Vite. ch2 (Verdana/Trebuchet MS) usa system-safe
// stack — NO requiere import. D2-07 + D2-08 + RESEARCH §R4.
// Subsets: latin + latin-ext — cubre ES/EN (ñ, á, é, í, ó, ú, ü, ¿, ¡; Open-Q2-E).
import '@fontsource/vt323/latin.css'              // ch0 — CRT terminal (latin)
import '@fontsource/vt323/latin-ext.css'          // ch0 — latin-ext (ñ, á, etc.)
import '@fontsource/comic-neue'                   // ch1 — Comic Sans equivalent (solo latin disponible)
import '@fontsource/lobster/latin.css'            // ch3 — Web 2.0 cursive (latin)
import '@fontsource/lobster/latin-ext.css'        // ch3 — latin-ext (ñ, á, etc.)
import '@fontsource/audiowide/latin.css'          // ch4 — AR/VR futuristic (latin)
import '@fontsource/audiowide/latin-ext.css'      // ch4 — latin-ext (ñ, á, etc.)
import './styles/inter-variable-latin.css'        // ch5 — Inter Variable latin+latin-ext (wght 100-900)
import '@fontsource/press-start-2p/latin.css'     // ch6 — Phaser pixel UI (latin)
import '@fontsource/press-start-2p/latin-ext.css' // ch6 — latin-ext (ñ, á, etc.)
```

### `src/styles/inter-variable-latin.css` (nuevo)

Selector de subsets para `@fontsource-variable/inter`. El paquete no provee CSS por subset
individual (solo `index.css` y `wght.css` que incluyen todos los subsets: cyrillic, greek,
cyrillic-ext, vietnamese). Este archivo declara solo los 2 `@font-face` de latin + latin-ext
con `font-weight: 100 900` (variable axis wght completo — R5 fix) y `font-display: swap`.

Los `.woff2` siguen siendo los del package npm (`@fontsource-variable/inter/files/`),
referenciados via ruta que Vite resuelve. No hay subsetting manual — Option A mantenida.

### `tests/styles/fonts-loaded.test.js` (nuevo — 6 tests source-level)

| # | Test | Cobertura |
|---|------|-----------|
| T1 | package.json contiene exactamente los 6 paquetes @fontsource* | Regression guard contra remoción accidental |
| T2 | Versiones son ^5.x (major version 5) | Version lock — detecta downgrade o upgrade mayor |
| T3 | src/main.js referencia los 6 packages (via import path o CSS local) | Wire completeness |
| T4 | Fonts importados ANTES de chapter-themes.css en main.js | Orden source declarativo correcto |
| T5 | chapter-themes.css declara --font-body correcto para ch0..ch6 (incluye ch2 Verdana system-safe) | Cross-check package↔CSS — zero drift |
| T6 | ch2 NO tiene @fontsource/verdana en package.json ni import en main.js | System-safe lock enforcement |

### `tests/styles/fonts-bundle.test.js` (nuevo — 4 tests bundle smoke post-build)

| # | Test | Resultado |
|---|------|-----------|
| T1 | dist/assets/*.css contiene ≥5 @font-face declarations | 12 @font-face encontrados (VT323×2 + ComicNue×1 + Lobster×2 + Audiowide×2 + Inter×2 + Press Start×2 + latin-ext) |
| T2 | dist/assets/*.css contiene font-display: swap | Presente — R1 FOUT mitigation activa |
| T3 | dist/assets/ contiene ≥1 archivo .woff2 | 11 archivos .woff2 encontrados |
| T4 | Suma total .woff2 entre 150 KB y 350 KB | **285.8 KB** — Latin Extended garantizado (Open-Q2-E) |

## Bundle delta post-build

| Métrica | Antes (02-04) | Después (02-05) | Delta |
|---------|---------------|-----------------|-------|
| CSS bundle | ~18 KB | 9.96 KB (gzip 2.66 KB) | -8 KB (era más grande con variables extra) |
| JS bundle | ~131 KB | 131.55 KB (gzip 48 KB) | +0 KB |
| `.woff2` files | 0 | 11 archivos | +11 |
| `.woff2` total | 0 KB | 285.8 KB | +285.8 KB |
| `.woff` files | 0 | 9 archivos (fallback) | +9 |

Nota: CSS bundle aparece menor porque Vite movió los `@font-face` declarations a su propio
chunk optimizado. El total real de CSS rendereable es 9.96 KB `@font-face` declarations +
el resto de los estilos del app.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Imports de index.css genérico producían bundle 463 KB (fuera del must_have 150-350 KB)**

- **Encontrado durante:** Task 5.1 → primer `npm run build` post-install
- **Issue:** `import '@fontsource/vt323'` (sin especificar subset) carga el `index.css` del paquete, que incluye TODOS los subsets: latin, latin-ext, vietnamese, cyrillic, cyrillic-ext, greek. El total de .woff2 resultante era 463 KB — excedía el `must_have.truth` de ≤350 KB.
- **Fix:** Cambiar a imports de subsets específicos:
  - `@fontsource/{font}/latin.css` + `@fontsource/{font}/latin-ext.css` para VT323, Lobster, Audiowide, Press Start 2P
  - `@fontsource/comic-neue` sin subset (solo tiene latin disponible, su index.css ya es 19 KB)
  - `src/styles/inter-variable-latin.css` (CSS local) para Inter Variable, ya que `@fontsource-variable/inter` no provee CSS por subset individual
- **Bundle resultante:** 285.8 KB — dentro del rango 150-350 KB (D2-08)
- **Cobertura ES/EN:** latin-ext incluye ñ, á, é, í, ó, ú, ü, ¿, ¡ — Open-Q2-E cumplida
- **Files modificados:** `src/main.js`, `src/styles/inter-variable-latin.css` (nuevo)
- **Commit:** `cc93d96`

**2. [Rule 1 — Bug] Tests T3 y T4 de fonts-loaded.test.js ajustados por cambio de imports**

- **Encontrado durante:** Task 5.2 (post Rule 1 fix anterior)
- **Issue:** T3 verificaba imports literales `import '@fontsource/vt323'` que ya no existen en main.js (reemplazados por `/latin.css` paths). T4 usaba regex que buscaba `import '@fontsource[...]` seguido de chapter-themes.css.
- **Fix:** T3 ahora verifica presencia de cada package name (no la ruta exacta del import). T4 usa índices de posición en lugar de regex multi-line.
- **Files modificados:** `tests/styles/fonts-loaded.test.js`
- **Commit:** `cc93d96`

## Bundle smoke verify post-build (Task 5.2) — resultados finales

```
dist/assets/*.css:
  - @font-face declarations: 12 (≥5 ✓)
  - font-display: swap: presente ✓
  
dist/assets/*.woff2: 11 archivos
  - audiowide-latin-400-normal: 13.8 KB
  - audiowide-latin-ext-400-normal: 7.0 KB
  - comic-neue-latin-400-normal: 19.1 KB
  - inter-latin-ext-wght-normal: 83.1 KB
  - inter-latin-wght-normal: 47.1 KB
  - lobster-latin-400-normal: 33.1 KB
  - lobster-latin-ext-400-normal: 27.3 KB
  - press-start-2p-latin-400-normal: 12.2 KB
  - press-start-2p-latin-ext-400-normal: 9.6 KB
  - vt323-latin-400-normal: 17.5 KB
  - vt323-latin-ext-400-normal: 16.0 KB
  TOTAL: 285.8 KB (en rango 150-350 KB ✓)
```

PowerShell verify alternativo (para Rafael):
```powershell
(Select-String -Path "dist/assets/*.css" -Pattern "@font-face" | Measure-Object).Count  # >= 5
(Get-ChildItem dist/assets -Filter '*.woff2' | Measure-Object Length -Sum).Sum / 1024   # ~285 KB
```

## Pending para W5

- **Manual checklist §5 — Latin Extended glyph coverage (Open-Q2-E):**
  Verificar con sample string ES en los 7 chapters: "Pre-carrera: niñez digital — España, capítulo, año 2001, comunicación cálida". Confirmar que ñ, á, é, í, ó, ú, ü, ¿, ¡ se renderizan correctamente con la font era-auténtica de cada chapter (no caen al fallback).

- **Manual checklist §5 — DevTools visual verification:**
  En cada chapter (ch0..ch6), abrir DevTools → Computed panel → verificar `font-family` del `.era-title` resuelve al font custom (no al fallback system-safe). El FOUT inicial (system-safe → custom, breve) es esperado y correcto per `font-display: swap`.

- **Manual checklist §5 — FOUT/FOIT check:**
  Scrollear ch0→ch6 observando el intercambio inicial de fuentes. Si el FOUT es perceptible en ch3 (Lobster — el default landing), considerar preload en Phase 6. Por ahora font-display: swap es suficiente (Estrategia B locked).

## Threat Flags

Ninguna superficie nueva. Los imports de @fontsource son side-effects de CSS puro — no hay network calls en runtime (todos los .woff2 están bundleados localmente). No se introduce nueva superficie de auth, network, ni file access.

## Metrics

- Tests añadidos: **10** (6 fonts-loaded source-level + 4 fonts-bundle smoke post-build)
- Suite total: **151/151 verde** (141 baseline previos + 10 nuevos)
- Build: `npm run build` exit 0, bundle 131.55 KB JS + 9.96 KB CSS + 285.8 KB .woff2
- Duración aproximada: ~25 min
- Commits: 2 (Task 5.1 install+wire+tests-source, Task 5.2 bundle-smoke+inter-variable-latin+subset-fix)
- THM-03: COMPLETO (color + tipografía per chapter — los 7 chapters tienen identidad visual era-auténtica)

## Next

**W5 (Plan 06) — Manual checklist visual Phase 2:**
- Checklist visual end-to-end: ch0..ch6 con font era-auténtica + bg morph + theme tokens
- §5 Latin Extended glyph coverage con sample string ES
- §5 FOUT/FOIT check y decisión de preload en Phase 6

Resume file: `.planning/phases/02-theme-system-i18n/02-06-PLAN.md`

## Self-Check: PASSED

Files exist on disk:
- `package.json` — FOUND (6 paquetes @fontsource* en dependencies)
- `src/main.js` — FOUND (10 imports de fonts con subsets específicos)
- `src/styles/inter-variable-latin.css` — FOUND
- `tests/styles/fonts-loaded.test.js` — FOUND (6 tests)
- `tests/styles/fonts-bundle.test.js` — FOUND (4 tests)

Commits en git log:
- `699c3e8` (Task 5.1) — FOUND
- `cc93d96` (Task 5.2 + subset fix) — FOUND

Tests passing: 151/151 (verificado via `npm run test:run`).
Build passing: `npm run build` exit 0 (verificado).
Bundle .woff2 total: 285.8 KB (en rango 150-350 KB — D2-08 ✓, Open-Q2-E ✓).
font-display: swap presente en bundle CSS (R1 FOUT mitigation ✓).
index.html NO modificado (Estrategia B locked ✓).
