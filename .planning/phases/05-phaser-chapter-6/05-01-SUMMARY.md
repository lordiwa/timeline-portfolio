---
phase: 05-phaser-chapter-6
plan: 01
subsystem: testing
tags: [vitest, scaffolding, phaser, vue3, i18n, synthwave, data-layer, tdd, red-tests]

# Dependency graph
requires:
  - phase: 02-theme-system-i18n
    provides: chapter-themes.css [data-chapter=N] motor + i18n parity test infrastructure
  - phase: 03-chapter-3-end-to-end
    provides: chapters.js shape D3-04 + projects.js shape D3-03 con planet* fields reservados
  - phase: 04-chapters-0-2-4-5
    provides: asset-naming.test.js regex enum + Chapter{N}Content patterns + stub-fill D4-09
provides:
  - "chapters[6].palette = ['#1a0e3d','#ff3ca6','#4dffff','#ffd95c'] (D5-04 synthwave locked)"
  - "3 items chapterEra=6 con planet fields poblados (D5-01 mapping)"
  - "[data-chapter=6] theme block finalizado synthwave + --bg-image"
  - "i18n keys ch6: chapters.6.{flavor,mantra}, projects.ch6-*.{title,desc}, ui.closeOverlay (ES+EN paridad)"
  - "ASSET_NAMING_REGEX extendido a 8 descriptors ch6 (bg + 2 parallax opt + 3 planets + 2 ships)"
  - "17 test scaffolds RED para PHA-01..09 + CON-04 + A11Y-05/06 + chapter-overlap defensive + mantra parity"
affects:
  - "05-02 W1 (asset generation): ch6-assets.test.js T1-T4 vuelve green tras forge_background + forge_sprite"
  - "05-03 W2 (Phaser factory + SpaceScene): 17 source-regex tests vuelven green tras src/phaser/{index,SpaceScene}.js"
  - "05-04 W3 (Chapter6Content): 13 integration tests vuelven green tras src/components/Chapter6Content.vue"
  - "05-05 W4 (ProjectOverlay): 9 tests vuelven green tras src/components/ProjectOverlay.vue"
  - "05-06 W5 manual checklist: Rafael ratifica copy mantra ES + vibe synthwave"

# Tech tracking
tech-stack:
  added: []  # No new packages — reusa @fontsource/audiowide (ya instalado para ch4) + vitest infrastructure
  patterns:
    - "source-regex testing via readFileSync (extendido a src/phaser/ + src/components/Chapter6Content.vue + ProjectOverlay.vue)"
    - "RED-scaffold-W0 → green-W{N} pattern: 17 contratos contractuales pre-implementación"
    - "Conditional test gates (ch6-assets T5/T6 single-layer fallback)"
    - "Bridge emit name match guard (locale-bridge T5 + chapter-overlap T1 source-regex verifica match exacto)"

key-files:
  created:
    - "tests/assets/ch6-assets.test.js (T1-T4 mandatorios + T5/T6 conditional 80KB budget)"
    - "tests/i18n/mantra-parity.test.js (T1-T3 ES non-empty + EN non-empty + distinct)"
    - "tests/phaser/factory.test.js (T1-T6 PHA-01..03 config shape)"
    - "tests/phaser/scale.test.js (T1-T3 BASE_W/BASE_H/computeZoom defensive)"
    - "tests/phaser/space-scene-shape.test.js (T1-T6 extends + preload + create + registry + i18n + emit)"
    - "tests/phaser/no-character-animation.test.js (T1-T3 anti-pattern PHA-08)"
    - "tests/phaser/locale-bridge.test.js (T1-T5; T5 NEW Blocker 3 bridge emit name match)"
    - "tests/phaser/prm.test.js (T1-T3 D5-08 instant cut + tweens.timeScale=0 cinturón)"
    - "tests/components/Chapter6Content.test.js (T1-T4 PHA-01..04 lifecycle)"
    - "tests/components/Chapter6Content-lazy.test.js (T1-T2 PHA-04 await import string literal)"
    - "tests/components/Chapter6Content-bridge.test.js (T1-T3 show-project + arrival-complete + reset)"
    - "tests/components/Chapter6Content-resize.test.js (T1-T2 useResizeObserver document.documentElement)"
    - "tests/components/Chapter6Content-prm.test.js (T1-T2 createGame opt + @media PRM mantra)"
    - "tests/components/ProjectOverlay.test.js (T1-T6; T6 NEW Warning 9 null guard)"
    - "tests/a11y/keyboard-planet-buttons.test.js (T1-T3 3 sr-only buttons + Tab order cronológico)"
    - "tests/a11y/focus-trap.test.js (T1-T3 Tab cycle + focus restore)"
    - "tests/integration/chapter-overlap-ch6.test.js (T1-T4; T1 Warning 5 target ScrollShell.vue)"
  modified:
    - "src/data/chapters.js (chapters[6].palette poblada D5-04 synthwave)"
    - "src/data/projects.js (+3 items chapterEra=6 con shape D3-03 + planet* fields)"
    - "src/styles/chapter-themes.css ([data-chapter=6] finalizado synthwave + --bg-image + Audiowide font)"
    - "src/i18n/es.json (+chapters.6.flavor +chapters.6.mantra +projects.ch6-* +ui.closeOverlay)"
    - "src/i18n/en.json (+paridad ES↔EN enforced por parity.test.js)"
    - "tests/assets/asset-naming.test.js (ASSET_NAMING_REGEX extendido a 8 descriptors ch6)"
    - "tests/data/chapters.test.js (T6/T7/T8 palette ch6 D5-04 enforce)"
    - "tests/data/projects.test.js (T5..T9 ch6 count, ids, planet poblado, orbit range, sprite regex)"
    - "tests/styles/fonts-loaded.test.js (T3+T5 actualizados — ch6 reusa Audiowide; Press Start 2P reserva)"

key-decisions:
  - "Audiowide font para ch6 sustituye 'Press Start 2P' stub Phase 2 (D5-04 synthwave vibe)"
  - "Stub titleKey 'Empresa propia AR/VR' / 'Remoose Interactive' / 'Software Mind NA' aplicados (patrón D4-09 ch2/ch4/ch5); Rafael refresca via CONTENT-CHECKLIST §2.5 post-W5"
  - "ch6-bg.png en formato PNG (no JPG) — pixelforge Phase 5 outputs paleta indexada D5-04 4-color, mejor compresión PNG para gradients lisos"
  - "Tests T5/T6 ch6-assets son conditional (fallback single-layer Open Q4 RESOLVED): si parallax layers no existen, test pasa GREEN sin assertion"
  - "Threat T-05-W0-05 mitigated via locale-bridge T5 + chapter-overlap T1: bridge emit name match guard contra drift 'vue:' prefix"

patterns-established:
  - "Conditional asset test gates (T5/T6) — RED→GREEN pattern donde missing asset es válido (fallback aplicado)"
  - "Bridge emit name match guard — locale-bridge T5 + space-scene-shape T6 verifican que Chapter6Content y SpaceScene usan EXACTAMENTE el mismo event name (sin prefijo vue: per D5-10)"
  - "RED scaffold defensive (chapter-overlap T2) — bloque CSS no existe aún, test pasa con .toBeNull()"
  - "Anti-pattern source-regex guard — tests/phaser/no-character-animation.test.js verifica AUSENCIA de patterns prohibidos (PHA-08)"
  - "createTestI18n + vi.mock('@/phaser') + dynamic import — pattern para integration tests que dependen de archivos no existentes en W0 (defensive try/catch import)"

requirements-completed:
  - CON-04
  - ART-05
  - ART-06
  - A11Y-05
  - A11Y-06
  - PHA-01
  - PHA-02
  - PHA-03
  - PHA-04
  - PHA-05
  - PHA-06
  - PHA-07
  - PHA-08
  - PHA-09

# Metrics
duration: 15min
completed: 2026-05-14
---

# Phase 5 Plan 01: W0 Scaffolding Synthwave Convergence Summary

**W0 scaffolding del Phase 5 Phaser: data layer ch6 + theme synthwave + i18n keys + 17 test scaffolds RED que describen los contratos PHA-01..09 + CON-04 + A11Y-05/06 + chapter-overlap defensive + mantra parity, listos para volverse green en waves 1-5.**

## Performance

- **Duration:** ~15 min (4 tasks atomic commits)
- **Started:** 2026-05-14T18:20:49Z
- **Completed:** 2026-05-14T18:35:17Z
- **Tasks:** 4 / 4
- **Files modified:** 9 modificados + 17 creados = 26 files total
- **Tests added:** 17 archivos test scaffold (3 verdes inmediato + 14 RED esperando W1-W5)
- **Suite global:** 367 passed | 38 failed (todas failures son W0 scaffolds + W1 asset existence — esperadas)

## Accomplishments

- **Data layer ch6 poblada (D5-01 + D5-04):** `chapters[6].palette` con 4 hex synthwave + 3 items `chapterEra=6` con `planetSprite`/`planetOrbit`/`planetColor` mapeados según orden cronológico (ar-vr 0.2 hot-pink, remoose 0.5 cyan, software-mind 0.8 amber).
- **Theme block ch6 finalizado:** `[data-chapter="6"]` con paleta synthwave + `--bg-image: url('/assets/ch6-bg.png')` (BackgroundLayers crossfade ch5→ch6 listo) + font Audiowide (cambia stub Phase 2 Press Start 2P, reusa paquete @fontsource/audiowide ya instalado para ch4).
- **i18n keys ch6 + paridad enforced:** ES y EN con `chapters.6.{flavor,mantra}`, `projects.ch6-{ar-vr,remoose,software-mind}.{title,desc}`, `ui.closeOverlay`. Mantra D5-03 locked ES="Y siempre muestra una sonrisa" / EN="And always show a smile". Parity test T1 + mantra-parity T1-T3 verdes.
- **Regex asset-naming extendido (Pitfall 11 mitigation):** acepta 8 nuevos descriptors ch6 (bg, bg-stars-far, bg-nebulae-mid, planet-{ar-vr,remoose,software-mind}, ship-[12]) ANTES de generar assets. Sin offenders activos.
- **17 test scaffolds RED creados** que describen el contracto completo del Phase 5: Phaser factory (PHA-01..03), SpaceScene (PHA-05), anti-character-animation (PHA-08), locale bridge (PHA-06 + T5 NEW name match), PRM (D5-08), Chapter6Content lifecycle (PHA-01..04), bridge (PHA-07), resize (PHA-09), prm CSS (D5-08), ProjectOverlay (CON-04 + T6 NEW null guard), A11Y keyboard buttons + focus trap, chapter-overlap defensive (T1 ScrollShell.vue Warning 5 RESOLVED).

## Task Commits

Each task was committed atomically:

1. **Task 1: Extender asset-naming regex + crear ch6-assets.test.js** — `e59d188` (test)
2. **Task 2: Poblar data layer ch6 (chapters palette + 3 projects) + tests data** — `06bbe56` (feat)
3. **Task 3: Finalizar [data-chapter=6] theme + i18n keys ES↔EN + mantra-parity test** — `34914ab` (feat)
4. **Task 4: 15 test scaffolds RED para Phaser + Chapter6Content + ProjectOverlay + a11y + chapter-overlap** — `67032b8` (test)

**Plan metadata:** [pendiente — commit final con 05-01-SUMMARY.md]

## Files Created/Modified

### Source (data + theme + i18n)
- `src/data/chapters.js` — `chapters[6].palette` poblada con 4 hex synthwave D5-04
- `src/data/projects.js` — +3 items `chapterEra=6` con shape D3-03 completo + planet* fields
- `src/styles/chapter-themes.css` — `[data-chapter="6"]` finalizado synthwave + `--bg-image` + Audiowide
- `src/i18n/es.json` — +`chapters.6.flavor`, +`chapters.6.mantra`, +3 `projects.ch6-*`, +`ui.closeOverlay`
- `src/i18n/en.json` — paridad EN ↔ ES

### Test files creados (17 archivos)
- `tests/assets/ch6-assets.test.js` (T1-T6, T5/T6 conditional)
- `tests/i18n/mantra-parity.test.js` (T1-T3, GREEN tras Task 3)
- `tests/phaser/factory.test.js` (T1-T6)
- `tests/phaser/scale.test.js` (T1-T3)
- `tests/phaser/space-scene-shape.test.js` (T1-T6)
- `tests/phaser/no-character-animation.test.js` (T1-T3)
- `tests/phaser/locale-bridge.test.js` (T1-T5 — T5 NEW Blocker 3)
- `tests/phaser/prm.test.js` (T1-T3)
- `tests/components/Chapter6Content.test.js` (T1-T4)
- `tests/components/Chapter6Content-lazy.test.js` (T1-T2)
- `tests/components/Chapter6Content-bridge.test.js` (T1-T3)
- `tests/components/Chapter6Content-resize.test.js` (T1-T2)
- `tests/components/Chapter6Content-prm.test.js` (T1-T2)
- `tests/components/ProjectOverlay.test.js` (T1-T6 — T6 NEW Warning 9)
- `tests/a11y/keyboard-planet-buttons.test.js` (T1-T3)
- `tests/a11y/focus-trap.test.js` (T1-T3)
- `tests/integration/chapter-overlap-ch6.test.js` (T1-T4 — T1 Warning 5)

### Test files modificados
- `tests/assets/asset-naming.test.js` — `ASSET_NAMING_REGEX` extendido + comment header
- `tests/data/chapters.test.js` — +T6/T7/T8 ch6 palette enforcement
- `tests/data/projects.test.js` — +T5..T9 ch6 count/ids/planet/orbit/sprite
- `tests/styles/fonts-loaded.test.js` — T3+T5 actualizados a Audiowide para ch6

## Decisions Made

1. **Audiowide font para ch6** (sustituye stub Press Start 2P de Phase 2):
   - D5-04 lockea "lo-fi AI vaporwave/synthwave" — Audiowide encaja con la estética; Press Start 2P es 8-bit retro pixel, no vapor/synthwave.
   - `@fontsource/audiowide` YA instalado para ch4, no requiere npm install adicional.
   - Actualicé `tests/styles/fonts-loaded.test.js` T3+T5 para reflejar la nueva intención sin romper test architectural (Press Start 2P queda como reserva para descomposición futura).

2. **ch6-bg.png en formato PNG (no JPG):**
   - Plan original mencionaba `forge_background` con output JPEG. Phase 5 W0 anticipa que `forge_background` con paleta D5-04 4-color (paleta indexada synthwave) entrega mejor compresión PNG que JPEG (gradients lisos + pocos colores).
   - Regex enum extendido acepta `ch6-bg.png` específicamente.

3. **ch6-assets.test.js T5/T6 como conditional skip silent:**
   - Open Q4 RESOLVED dicta single-layer fallback aceptable si parallax stars-far + nebulae-mid no se generan (artista decide en W1 si vale 2 capas extra vs 1 sola).
   - T5/T6 verifican size budget SOLO si el archivo existe; si no existe, pass silent.

4. **fonts-loaded.test.js T3 actualizado (Press Start 2P → reserva):**
   - El test architectural existente esperaba que `@fontsource/press-start-2p` se importara para ch6. Como ch6 ahora usa Audiowide, Press Start 2P queda en deps + main.js como reserva sin chapter consumidor.
   - Decisión de remover `@fontsource/press-start-2p` queda fuera scope Phase 5 (ownership Phase 2 — requiere D-decision separada).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tests/styles/fonts-loaded.test.js T5 esperaba Press Start 2P para ch6**

- **Found during:** Task 3 (al cambiar `--font-body` de `'Press Start 2P'` a `'Audiowide'` en `[data-chapter="6"]` per D5-04)
- **Issue:** El test architectural existente `tests/styles/fonts-loaded.test.js` T5 + T3 esperaba que ch6 usara `'Press Start 2P'`. Como el plan explícitamente cambia la font de ch6 a `'Audiowide'` (D5-04 synthwave vibe), el test bloqueaba el commit de Task 3.
- **Fix:** Actualicé fonts-loaded.test.js T3 (lista de expectedPackages reorganiza ch4→Audiowide, ch6→Audiowide; press-start-2p marcado como reserva) + T5 (mapping ch6 ahora Audiowide). Comentarios añadidos explicando la decisión.
- **Files modified:** `tests/styles/fonts-loaded.test.js`
- **Verification:** `npm run test -- --run tests/styles/fonts-loaded.test.js` → 6/6 GREEN
- **Committed in:** `34914ab` (parte del task 3 commit)
- **Rationale:** Plan explícito sobre cambio de font; el test architectural existente era contrato Phase 2 stub que Phase 5 finaliza. La actualización del test es decisión consciente, no drift.

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Sin scope creep. La actualización del test fue forced por la decisión explícita D5-04 (Audiowide font); el test architectural Phase 2 sirvió como gate que confirmó la decisión conscientemente.

## Issues Encountered

**Numbering colisión con tests/data preexistentes:** Los archivos `tests/data/chapters.test.js` y `tests/data/projects.test.js` ya existían con T1-T5 + T1-T4 respectivamente. El plan describía "T1-T5 / T1-T3" para esos tests; opté por EXTENDER (T6/T7/T8 chapters, T5..T9 projects) en vez de sobreescribir, preservando los contratos broader Phase 3 y añadiendo los específicos Phase 5. Convención de numeración coherente con expansion-pattern Phase 4.

**LF/CRLF warnings al commit:** Sistema Windows convierte LF→CRLF al stagear. Sin impacto funcional — los tests pasan idénticamente en ambas codificaciones. Warning normal del workflow Windows + git autocrlf.

## User Setup Required

Ninguno. W0 scaffolding es 100% código + tests; W1 (pixelforge asset generation) requerirá Rafael ratificar vibe synthwave en checkpoint manual.

## Threat Flags

Ninguno nuevo más allá de los ya listados en plan `<threat_model>`:
- T-05-W0-01 (i18n drift): mitigated por parity.test.js T1 + mantra-parity.test.js T1-T3.
- T-05-W0-02 (asset naming drift): mitigated por asset-naming.test.js T1 con regex enum extendido.
- T-05-W0-05 (bridge name drift): mitigated por locale-bridge.test.js T5 (NEW per Blocker 3) que verifica match exacto `'locale-changed'` entre SpaceScene listener y Chapter6Content emitter.

## Known Stubs

Stubs intencionales aplicados (patrón D4-09 ya establecido ch2/ch4/ch5):

- `src/i18n/es.json` y `en.json`:
  - `projects.ch6-ar-vr.desc` → "PENDING — Rafael refresca via CONTENT-CHECKLIST §2.5: empresa AR/VR..."
  - `projects.ch6-remoose.desc` → "PENDING — Rafael refresca §2.5: full stack remoto..."
  - `projects.ch6-software-mind.desc` → "PENDING — Rafael refresca §2.5: QA + AI..."
- **Razón:** mismo patrón aprobado en Phase 4 W2/W3/W4 (Rafael ratifica stubs "usa stubs" en gate W). Refresh con copy real post-W5 manual checklist sign-off.
- **Plan que lo resolverá:** 05-06 W5 (Rafael CONTENT-CHECKLIST §2.5).

Titles ES/EN poblados con nombre real del proyecto (no stub):
- "Empresa propia AR/VR" / "Own AR/VR Company"
- "Remoose Interactive" / "Remoose Interactive"
- "Software Mind NA" / "Software Mind NA"

## Self-Check: PASSED

### Files verified to exist

| File | Status |
|------|--------|
| tests/assets/ch6-assets.test.js | FOUND |
| tests/i18n/mantra-parity.test.js | FOUND |
| tests/phaser/factory.test.js | FOUND |
| tests/phaser/scale.test.js | FOUND |
| tests/phaser/space-scene-shape.test.js | FOUND |
| tests/phaser/no-character-animation.test.js | FOUND |
| tests/phaser/locale-bridge.test.js | FOUND |
| tests/phaser/prm.test.js | FOUND |
| tests/components/Chapter6Content.test.js | FOUND |
| tests/components/Chapter6Content-lazy.test.js | FOUND |
| tests/components/Chapter6Content-bridge.test.js | FOUND |
| tests/components/Chapter6Content-resize.test.js | FOUND |
| tests/components/Chapter6Content-prm.test.js | FOUND |
| tests/components/ProjectOverlay.test.js | FOUND |
| tests/a11y/keyboard-planet-buttons.test.js | FOUND |
| tests/a11y/focus-trap.test.js | FOUND |
| tests/integration/chapter-overlap-ch6.test.js | FOUND |

### Commits verified

| Hash | Verified |
|------|----------|
| e59d188 | FOUND (test: extender asset-naming regex + ch6-assets.test.js) |
| 06bbe56 | FOUND (feat: poblar data layer ch6) |
| 34914ab | FOUND (feat: finalizar [data-chapter=6] theme + i18n + mantra-parity) |
| 67032b8 | FOUND (test: 15 test scaffolds RED) |

### Suite state verified

- Baseline (pre-Plan 05-01): 352 tests passed | 0 failed (46 files)
- Final (post-Plan 05-01): 367 tests passed | 38 failed (63 files)
- Net new tests: +53 (+15 GREEN inmediatos + +38 RED esperados W1-W5)
- Suite Phase 1-4 (preexistente): SIN regresión (367 - 352 = +15 new GREEN tests = data ch6 + mantra parity + chapter-overlap T1/T2 + fonts T3/T5 ch6 + theme-tokens T7 ch6 7-token completo + data T6/T7/T8 chapters + T5..T9 projects)
- 38 RED tests son TODOS Phase 5 W0 scaffolds esperando W1-W5 implementación + ch6-assets esperando W1 forge calls.

**Self-Check: PASSED**
