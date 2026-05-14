---
phase: 05-phaser-chapter-6
plan: 06
subsystem: docs-manual-gate
tags: [manual-checklist, verification-draft, human-verify, sign-off, phase-close, w5, deferred-polish-tracking, phaser-chunk-size, mantra-ratification]

# Dependency graph
requires:
  - phase: 05-phaser-chapter-6
    plan: 01
    provides: "W0 scaffolding: data layer + theme synthwave + i18n + 17 test scaffolds + mantra-parity tests + stubs i18n PENDING patrón D4-09"
  - phase: 05-phaser-chapter-6
    plan: 02
    provides: "W1 8 assets PNG ch6 + Adobe MCP JPEG q7 envelope para 3 bgs (cumulative 87KB < 80KB cada uno)"
  - phase: 05-phaser-chapter-6
    plan: 03
    provides: "W2 src/phaser/{index,SpaceScene}.js factory + scene completa con 3-layer parallax + arrival + ships loop + locale bridge + PRM cinturón"
  - phase: 05-phaser-chapter-6
    plan: 04
    provides: "W3 Chapter6Content.vue + ProjectOverlay stub + ScrollShell wire + chapter-themes.css ch6 + chapter-overlap defensive Pattern 12"
  - phase: 05-phaser-chapter-6
    plan: 05
    provides: "W4 ProjectOverlay synthwave completo + manual focus trap + null guard + tabnabbing mitigation + mobile fullscreen + PRM CSS"
  - phase: 04-chapters-0-2-4-5
    plan: 06
    provides: "Format analog 04-MANUAL-CHECKLIST.md (13 secciones + §13 sign-off) y 04-VERIFICATION.md (verdict draft + tests + build)"
  - phase: 02-theme-system-i18n
    plan: 06
    provides: "Format analog 02-MANUAL-CHECKLIST.md (verdict block estructurado + tabla de cobertura REQ + commit del checklist firmado)"
provides:
  - ".planning/phases/05-phaser-chapter-6/05-MANUAL-CHECKLIST.md — 13 secciones derivadas de 05-VALIDATION.md §Manual-Only Verifications (HiDPI/arrival/ships/locale tooltips/overlay UX/keyboard/PRM OS/transitions/chapter-overlap datapoint/bundle/ch6-bg budget/mantra ES/vibe synthwave) + §10 sign-off block estructurado + tabla de cobertura REQ por sección"
  - ".planning/phases/05-phaser-chapter-6/05-VERIFICATION.md — programmatic verification draft con 424/424 tests verde + build verde + asset budget table + threat mitigation status + deviations + deferred items + recommendation pending Rafael §10 sign-off"
  - "Pre-verified §10 bundle size: initial 64.07 KB gzip / lazy Phaser 341.20 KB gzip (deferred polish documentado — target W3 era ≤200KB)"
  - "Pre-verified §11 ch6-bg ≤80KB: 27 KB ✓ + cumulative 3 bgs 87 KB ✓"
affects:
  - "Rafael (next session): ejecuta 13 secciones del manual checklist en browser real + sistema PRM real + juicio estético synthwave + firma §10"
  - "Executor (post sign-off): si verdict PASS o PASS-with-observations — actualiza STATE.md cierra Phase 5 + ROADMAP.md marca [x] + commit final docs(phase-05) + opcional commit separado i18n(05-06) refresh mantra ES / projects.ch6-*.desc"
  - "Phase 6 (deploy + polish): arranca con items deferred carry-forward — chunk size lazy split optimization (Vite manualChunks), chapter-overlap bug root cause analysis, backgrounds downscale Phase 4 (~1.65MB), iOS smoke (Plan 07) sigue deferred"

# Tech tracking
tech-stack:
  added: []  # zero new deps — Plan W5 es 100% docs artifacts + medición build existente
  patterns:
    - "Manual checklist artifact-only pattern (Phase 4 W5 + Phase 2 W5 carry-forward): plan no ejecuta verificación visual; prepara artefactos + Rafael ejecuta + firma §10 → executor cierra phase post-firma"
    - "Pre-verification of measurable criteria: §11 ch6-bg ≤80KB y §10 bundle size son medibles automáticamente — executor pre-mide y documenta valores reales en MANUAL-CHECKLIST + VERIFICATION; Rafael solo ratifica visualmente, no re-mide"
    - "13-section coverage map (1:1 con 05-VALIDATION.md `Manual-Only Verifications` 13 filas): cada manual-only behavior tiene una § dedicada con criterio PASS/FAIL claro + status checkbox + notas free-text"
    - "Verdict draft pre-poblado con valores reales: VERIFICATION.md draft incluye 424/424 tests + build artifact sizes + threat mitigation matrix completa — Rafael solo añade `verdict: ...` y commit"
    - "Deferred items carry-forward documentation: bundle chunk 341KB gzip ⚠ + chapter-overlap bug Phase 4 + stubs i18n PENDING + .sr-only utility local + iOS smoke + backgrounds downscale Phase 4 — todos documentados en VERIFICATION.md `Deferred Items` para Phase 6 planning input"

key-files:
  created:
    - ".planning/phases/05-phaser-chapter-6/05-MANUAL-CHECKLIST.md (13 secciones + §10 sign-off block + tabla cobertura REQ; ~775 líneas)"
    - ".planning/phases/05-phaser-chapter-6/05-VERIFICATION.md (programmatic results + build artifact sizes + asset budget + threat mitigation + deviations + deferred + recommendation; ~223 líneas)"
    - ".planning/phases/05-phaser-chapter-6/05-06-SUMMARY.md (este archivo)"
  modified: []  # zero source code changes — plan W5 es artifact-only

decisions:
  - "Mantra ES copy NO refrescado por executor — Rafael no propuso alternativa pre-W5; el default `'Y siempre muestra una sonrisa'` queda en es.json hasta que Rafael ratifique o pida alternativa en §12 del manual checklist post-firma"
  - "i18n stubs `projects.ch6-*.desc` PENDING NO refrescados por executor — Rafael no actualizó CONTENT-CHECKLIST §2.5 pre-W5; el refresh queda como commit separado post-firma si Rafael provee copy real (patrón D4-09 carry-forward)"
  - "§10 bundle size status documentado como ⚠ Observations: target W3 plan era ≤200KB gzip; medido 341.20KB gzip. Documentado como deferred polish Phase 6 (Vite manualChunks split Phaser internals). Lazy split itself funciona ✓ — el initial 64.07KB gzip NO contiene Phaser. Decisión defendible: el riesgo es performance del primer load de ch6, no del initial site load — ch6 es el último chapter cronológico, el usuario llega allí tras explorar 0-5. Acceptable trade-off para v1; optimization deferida"
  - "§11 ch6-bg ≤80KB pre-verified ✓ por executor (27 KB medido 2026-05-14): Rafael ratifica visualmente que el archivo no tiene degradación JPEG q7 visible durante §13 vibe check; no necesita re-medir tamaño"
  - "§9 chapter-overlap bug NO se fixea en Plan 05-06 (out of scope): es solo datapoint para root cause analysis posterior. Las defensive rules aplicadas en W3 (Pattern 12 `.ch6-layout` SIN clipping) deberían PREVENIR contribución desde ch6, pero el bug origen vive en chapters previos (3-5). Phase 6 polish dedicado"
  - "Self-check assertion timing: build run para capturar números reales del bundle ANTES de write VERIFICATION.md — evita drift entre números documentados y archivo real. Commit del SUMMARY.md viene después del commit del checklist + verification para mantener atomic tasks separados"

metrics:
  duration: ~5min
  completed: 2026-05-14
  tasks_completed: 1
  files_modified: 0
  files_created: 3  # MANUAL-CHECKLIST + VERIFICATION + 05-06-SUMMARY
  tests_green_in_plan: 0  # plan es docs artifacts only — no nuevos tests
  tests_total_suite: 424  # baseline post Plan 05-05 mantenido
  commits:
    - "7afe94e — docs(05-06): generate manual checklist + verification draft (W5)"
---

# Phase 5 Plan 06: W5 Manual Checklist + Verification Draft Summary

**One-liner:** Generación de `05-MANUAL-CHECKLIST.md` (13 secciones + §10 sign-off block) y `05-VERIFICATION.md` draft (424/424 tests verde + build artifact sizes + asset budget + threat mitigation + deviations + deferred items + recommendation pending Rafael) — plan artifact-only sin source code, pre-verifica §10 bundle + §11 ch6-bg budget, deja todo listo para que Rafael ejecute los 13 items personalmente y firme §10.

## What was built

### Task 1 — `05-MANUAL-CHECKLIST.md` (13 secciones + §10 sign-off)

**13 secciones derivadas 1:1 de `05-VALIDATION.md §Manual-Only Verifications`** (13 filas en la tabla). Cada section tiene:

- Título numerado (§1..§13) + REQ-ID tracking + decision source (D5-NN).
- Descripción del comportamiento esperado (1-2 párrafos).
- Steps específicos numerados — comandos PowerShell + DevTools snippets + URLs concretas.
- Criterio PASS/FAIL claro.
- Status checkbox: `[ ] ✓ Pass · [ ] ⚠ Observations · [ ] ✗ Fail`.
- Notas free-text de Rafael.

**Secciones:**

| § | Behavior | REQ | Source | Tipo |
|---|----------|-----|--------|------|
| §1 | HiDPI pixel-perfect rendering | PHA-03 + SC-4 | D5-02/03 | visual |
| §2 | Arrival cinematográfico timing percibido ~3-4s | PHA-05 + D5-02 | D5-02 | percibido |
| §3 | 2 ships loop horizontal escalonado | D5-05 | D5-05 | visual |
| §4 | Locale tooltips ES↔EN sin reload | PHA-06 + SC-2 | D5-10 | functional |
| §5 | Project overlay UX completo (desktop click + tap mobile + focus trap + ESC/backdrop/close + restore focus) | PHA-07 + SC-1 + A11Y | D5-06/07 | UX |
| §6 | Keyboard navigation post-canvas (3 sr-only buttons + Tab cronológico + Enter) | A11Y-02 + D5-06 | D5-06 | A11Y real |
| §7 | PRM-aware behaviors completas (arrival instant + ships estáticas + parallax uniforme + mantra sin fade + overlay sin scale) | A11Y-05 + D5-08 | D5-08 | A11Y OS-real |
| §8 | ch5↔ch6 transitions sin leak (3 ciclos navegación, performance.memory, canvas duplicado check) | SC-3 + PHA-02 | D5-11 | reliability |
| §9 | Chapter-overlap bug Phase 4 datapoint (NO fix — solo registrar Caso A/B/C) | CORE-04 | D5-09 | datapoint |
| §10 | Bundle size verification (lazy split + chunk size 341KB gzip ⚠ vs target 200KB) | PHA-04 | (build) | metric |
| §11 | ch6-bg.png ≤80KB cumulative budget (pre-verified ✓ 27 KB) | (Phase 6 carry) | (D5-04 + W1) | metric pre-verified |
| §12 | Mantra ES copy ratification ("Y siempre muestra una sonrisa" default) | CON-04 + A11Y-06 | D5-03 | linguistic |
| §13 | Visual vibe synthwave coherence (bg + planets + ships + overlay + mantra) | D5-04 | D5-04 | aesthetic |

**§10 sign-off block estructurado** con:
- Tabla "Resultado por sección" (13 filas + checkboxes).
- Verdict template explicit:
  ```
  Verdict: [ ] PASS   [ ] PASS-with-observations   [ ] FAIL
  ```
- Sub-decisions: `Mantra ES decision`, `Vibe synthwave decision`,
  `Chapter-overlap §9 caso (A/B/C)`, `Bundle §10 chunk lazy`.
- Firma: Rafael Matovelle · srparca@gmail.com + fecha.
- Notas free-text.
- Instrucciones post-firma para executor (STATE.md / ROADMAP.md update + opt commits separados refresh).

**Tabla de cobertura Phase 5 (REQ-IDs)** con 26 filas mapeando cada REQ a:
- Plan donde se implementó
- Test file programático (status verde)
- Manual gate sección correspondiente (status pending Rafael)

### Task 1 (cont.) — `05-VERIFICATION.md` draft

**Programmatic results table:**
- 5 planes Phase 5 (05-01..05-05) cada uno con slice + status + new tests delta + suite total.
- Trayectoria: 352 (Phase 4 baseline) → 367 (W0 +15 GREEN) → 371 (W1 +4) → 395 (W2 +24) → 415 (W3 +20) → **424 (W4 +9)** target plan cumplido.

**Build status:**
- `npm run build` ✓ verde (~7.30s).
- Initial bundle: `index-BM952g00.js` 182.51 KB raw / **64.07 KB gzip** (NO Phaser).
- Lazy chunk: `index-Cwpq6ORW.js` 1,482.41 KB raw / **341.20 KB gzip** (Phaser detectado).
- CSS: 33.77 KB raw / 6.27 KB gzip.
- Fonts woff/woff2: 12 files entre 5-85 KB.

**PHA-04 lazy split verified ✓** — initial bundle confirmed sin Phaser.

**⚠ Chunk size:** 341 KB gzip excede target W3 plan ≤200 KB. Documentado como deferred polish Phase 6 (Vite `manualChunks` opt).

**Asset budget verification (ch6):** tabla con 9 assets ch6 — todos PASS (3 bgs 25-34 KB, 3 planets ≤11 KB, 2 ships ≤1 KB, 1 bust 15 KB). Cumulative ~118 KB.

**Manual gate status:** referencia a 05-MANUAL-CHECKLIST.md §10 sign-off pending Rafael; §11 + §10 pre-verified por executor.

**Requirements coverage:** tabla 30+ filas mapeando cada REQ a plan + test programático + manual gate §N.

**Threat mitigation status:** tabla con 25+ threats Phase 5 (W0 hasta W5) — todos MITIGATED o ACCEPTED con evidence trail.

**Deviations documentadas:** 22 deviations summary (D5-01-01 a D5-05-04) extraídas de SUMMARY de cada plan.

**Deferred items:** 6 items carry-forward para Phase 6 (chunk size + chapter-overlap + i18n stubs + .sr-only utility + iOS smoke + backgrounds downscale).

**Recommendation:** Programmatic gate PASS · Manual gate pending Rafael §10 · Verdict draft pending firma.

## Pre-verified Measurements (executor side)

**§10 Bundle size (pre-measured 2026-05-14):**
- Initial: 64.07 KB gzip ✓ NO Phaser
- Lazy: 341.20 KB gzip ⚠ excede target 200 KB → deferred polish Phase 6

**§11 ch6-bg ≤80KB budget (pre-measured 2026-05-14):**
- `ch6-bg.png` = 27,234 bytes (~27 KB) ✓
- `ch6-bg-stars-far.png` = 25,673 bytes (~25 KB) ✓
- `ch6-bg-nebulae-mid.png` = 34,519 bytes (~34 KB) ✓
- Cumulative: 87,426 bytes (~85 KB) ✓ — cada archivo bajo 80KB individual

Rafael ratifica §11 PASS sin re-medir (pre-verified marked checkbox).
Rafael decide §10 verdict (PASS / Observations / FAIL) según juicio sobre deferred polish.

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate 05-MANUAL-CHECKLIST.md + 05-VERIFICATION.md draft** — `7afe94e` (docs)

Total: 1 commit. Plan W5 es artifact-only — no source code modifications.

## Files Created/Modified

### Docs (3 archivos nuevos)

- `.planning/phases/05-phaser-chapter-6/05-MANUAL-CHECKLIST.md` (~775 líneas)
- `.planning/phases/05-phaser-chapter-6/05-VERIFICATION.md` (~223 líneas)
- `.planning/phases/05-phaser-chapter-6/05-06-SUMMARY.md` (este archivo)

### Source code: NINGUNO

Plan 05-06 W5 NO modifica ningún archivo fuente. NO refresh de i18n
(Rafael no propuso alternativa de mantra pre-W5 ni CONTENT-CHECKLIST §2.5).
NO update de STATE.md ni ROADMAP.md (esperan firma de Rafael).

## Decisions Made

1. **Mantra ES copy NO refrescado en este plan:**
   - El plan ofrecía la opción opcional de refrescar `chapters.6.mantra` ES si Rafael propuso alternativa pre-W5 (§success_criteria línea 30 del plan).
   - Rafael no proporcionó alternativa pre-execución → default `"Y siempre muestra una sonrisa"` se mantiene.
   - Si Rafael propone alternativa en §12 del checklist, executor commit-eará el refresh post-firma (commit separado `i18n(05-06): refresh ch6 mantra ES per Rafael ratification`).

2. **i18n stubs `projects.ch6-*.desc` NO refrescados:**
   - Patrón D4-09 carry-forward — stubs PENDING aceptables hasta CONTENT-CHECKLIST §2.5 fill.
   - Rafael no actualizó CONTENT-CHECKLIST §2.5 pre-W5 → stubs permanecen.
   - Si Rafael provee copy real post-firma, executor commit-eará refresh separado.

3. **§10 bundle size status como deferred polish Observation (no FAIL):**
   - Target W3 plan: ≤200 KB gzip. Actual: 341.20 KB gzip (~71% over).
   - Razón: el chunk lazy contiene Phaser completo + dependencies (~1.48 MB raw → 341 KB gzip).
   - Mitigación posible: Vite `build.rollupOptions.output.manualChunks` para split Phaser internals (Scene/GameObjects/Loader/Physics separados).
   - **Defensa para no bloquear v1:**
     - Lazy split itself funciona ✓ — initial 64 KB gzip NO contiene Phaser.
     - ch6 es el último chapter cronológico; usuario llega tras explorar 0-5.
     - Performance cost solo al entrar ch6, no al site load inicial.
     - Acceptable trade-off para v1 — optimization deferida Phase 6.
   - Rafael decide en §10 si verdict es PASS-with-observations o FAIL.

4. **§11 ch6-bg ≤80KB pre-verified ✓ por executor (no Rafael):**
   - Medible automáticamente con `node -e "fs.statSync(...).size"`.
   - 27 KB << 80 KB target.
   - Rafael solo ratifica visualmente que no hay degradación JPEG q7 visible (durante §13 vibe check).

5. **§9 chapter-overlap bug Phase 4 datapoint NO se fixea aquí:**
   - Out of scope (D5-09 explícito: ch6 vigila NO fix).
   - Pattern 12 mitigation en W3 (`.ch6-layout` SIN clipping) debería PREVENIR que ch6 contribuya.
   - Rafael documenta UNO de 3 casos en §9:
     - Caso A: NO reproduce en ch6 (mitigation working) — datapoint útil para Phase 6 root cause analysis.
     - Caso B: Reproduce igual → fix está en otro lado.
     - Caso C: Agrava en ch6 → critical datapoint, fix dedicated Phase 6.

6. **Self-check timing:** ejecutó `npm run test:run` + `npm run build` ANTES de write VERIFICATION.md → números en el archivo son del estado real del HEAD pre-commit. Sin drift entre archivo y código.

## Deviations from Plan

### Auto-fixed Issues

**Ninguno.** Plan ejecutado exactamente como escrito.

Cero deviations Rule 1/2/3/4 introducidas. El plan es 100% artifact-only —
no hay código que pueda romperse, no hay tests que necesiten ajuste, no
hay deps que instalar.

**Skipped optional refresh (no es deviation — es plan explicitamente
condicional):**

- i18n mantra ES refresh: condicional al "Si Rafael ratifica mantra ES copy
  diferente al default" — Rafael NO ratificó alternativa pre-execución → skip.
- i18n `projects.ch6-*.desc` refresh: condicional al "Si CONTENT-CHECKLIST
  §2.5 fue actualizado por Rafael en paralelo (patrón D4-09)" — §2.5 NO
  actualizado pre-execución → skip.

Ambos quedan disponibles como commits separados post-firma de Rafael en §10.

## Issues Encountered

**Ninguno.** Suite pre-existente (424/424 GREEN) no fue tocada — el plan solo lee
estado existente para documentarlo en el VERIFICATION.md draft.

**LF/CRLF warnings al git add:** sistema Windows convierte LF→CRLF al stagear los `.md` files. Sin impacto funcional — git stores LF, working copy mantiene CRLF según `core.autocrlf`. Warning normal del workflow Windows.

## User Setup Required

**Rafael (post-execute):** ejecutar 13 secciones de `05-MANUAL-CHECKLIST.md`
personalmente en:
- Browser real (Chrome/Firefox/Edge — anotar versión en sign-off).
- Monitor HiDPI/Retina o DevTools "Device pixel ratio: 2".
- Sistema con PRM activable (Windows Settings o DevTools Rendering panel).
- Mobile emulator DevTools 375×667.
- iOS smoke deferred (Plan 07 carry-forward — Rafael no tiene hardware iOS).

Y firmar §10 sign-off con verdict explícito (PASS / PASS-with-observations / FAIL).

## Threat Flags

**No new threat surface introduced** por este plan (artifact-only).

Threats del `<threat_model>` del plan 05-06 cubiertos:

| Threat ID | Status | Evidence |
|-----------|--------|----------|
| T-05-W5-01 (Repudiation verdict) | ✓ MITIGATED | §10 sign-off block incluye name + date + commit log preserva auditoría |
| T-05-W5-02 (Chunk size >200KB) | ⚠ FLAGGED deferred | §10 documenta 341KB; executor evalúa pre-Phase 6 si Vite manualChunks opt |
| T-05-W5-03 (i18n parity drift on refresh) | ✓ PRE-MITIGATED | `tests/i18n/parity.test.js` T1 + `tests/i18n/mantra-parity.test.js` T1-T3 auto-detectan drift al refresh post-firma |
| T-05-W5-04 (screenshots layout expose) | ✓ ACCEPTED | Screenshots opcionales solo §9 chapter-overlap; público no PII |
| T-05-W5-05 (Spoofing verdict post-sign-off) | ✓ MITIGATED | Git commit history is immutable; verdict change requires new commit + dated rationale |

## Known Stubs

Ninguno nuevo introducido por este plan. Stubs heredados (no resueltos en W5 por diseño):

| Stub | File | Why | Plan que lo resolverá |
|------|------|-----|------------------------|
| `projects.ch6-{ar-vr,remoose,software-mind}.desc` PENDING | `src/i18n/{es,en}.json` | Rafael CONTENT-CHECKLIST §2.5 pending fill (patrón D4-09 carry-forward) | Refresh post §10 sign-off si Rafael actualiza §2.5; o Phase 6 polish; o queda como v1 stub |
| `.sr-only` utility duplicado local en Chapter6Content.vue | `src/components/Chapter6Content.vue` `<style scoped>` | Future refactor cuando aparezca segundo consumer (Plan 05-04 deferred) | Phase 6 polish opcional |

Estos stubs NO impiden cierre de Phase 5 — son polish/content fills opcionales documentados en VERIFICATION.md `Deferred Items`.

## Self-Check: PASSED

### Files verified to exist

| File | Status |
|------|--------|
| .planning/phases/05-phaser-chapter-6/05-MANUAL-CHECKLIST.md | FOUND |
| .planning/phases/05-phaser-chapter-6/05-VERIFICATION.md | FOUND |
| .planning/phases/05-phaser-chapter-6/05-06-SUMMARY.md (este archivo) | FOUND |

### Commits verified

| Hash | Verified | Message |
|------|----------|---------|
| 7afe94e | FOUND | docs(05-06): generate manual checklist + verification draft (W5) |

### Suite state verified (baseline mantained)

- Pre-Plan 05-06: 424 passed | 0 failed (63 test files).
- Post-Plan 05-06: 424 passed | 0 failed (sin cambios — plan artifact-only).
- Sin regression introducida.

### Build state verified

- `npm run build` ✓ verde (executed para capturar números reales).
- Initial chunk: 64.07 KB gzip — NO Phaser (verified via grep absence).
- Lazy chunk: 341.20 KB gzip — Phaser detected (manualChunks future opt).

### Artifacts content verified

- 05-MANUAL-CHECKLIST.md: 13 secciones + §10 sign-off block + tabla cobertura REQ ✓
- 05-VERIFICATION.md: programmatic results + build + asset budget + threats + deviations + deferred + recommendation ✓
- Pre-verified §10 + §11 con números reales medidos 2026-05-14 ✓

**Self-Check: PASSED**

---

*Plan 05-06 completed 2026-05-14T19:48Z. Slice-end-to-end: Phase 5 ahora awaiting Rafael §10 sign-off en `05-MANUAL-CHECKLIST.md`. Post-firma, executor procede a actualizar STATE.md (Phase 5 closed + verdict) + ROADMAP.md ([x] complete) + commit final docs(phase-05) + opcional commits separados refresh i18n mantra / projects.ch6-*.desc según ratificación Rafael.*
