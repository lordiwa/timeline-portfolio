---
phase: 05-phaser-chapter-6
plan: 03
subsystem: phaser-integration
tags: [phaser-3.86, vue3, integer-scale, locale-bridge, prm, synthwave, ch6, factory-pattern, anti-character-animation]

# Dependency graph
requires:
  - phase: 05-phaser-chapter-6
    plan: 01
    provides: "17 source-regex test scaffolds RED (factory T1-T6, scale T1-T3, space-scene-shape T1-T6, no-character-animation T1-T3, locale-bridge T1-T5, prm T1-T3) + chapters[6].palette + 3 projects ch6 con planet metadata"
  - phase: 05-phaser-chapter-6
    plan: 02
    provides: "8 assets PNG en public/assets/ch6-* (bg + 2 parallax + 3 planets + 2 ships); 3 backgrounds JPEG q7 compressed ≤80KB"
  - phase: 02-theme-system-i18n
    provides: "i18n singleton en src/i18n/index.js exportable como `{ i18n }`"
  - phase: 03-chapter-3-end-to-end
    provides: "projects[].chapterEra/planetSprite/planetOrbit/planetColor shape D3-03"
provides:
  - "src/phaser/index.js — factory `createGame(parentEl, { prefersReduced })` exportada; Phaser.Scale.NONE + integer Math.floor zoom + pixelArt:true + roundPixels:true + physics:none + parent DOM node + preBoot registry PRM (Pattern 9 Option B)"
  - "src/phaser/SpaceScene.js — class extends Phaser.Scene con preload (8 keys) + create (parallax/planets/ships/arrival/listeners) + handleLocaleChange; PRM cinturón (tweens.timeScale=0); cero character animation (PHA-08)"
  - "Locale bridge listener `game.events.on('locale-changed', ...)` + cleanup en Phaser.Scenes.Events.SHUTDOWN — bridge half que SpaceScene aporta (mirror Chapter6Content.vue queda RED hasta Plan 05-04)"
  - "Bridge event 'arrival-complete' + 'show-project' emit (sin prefijo `vue:` — D5-10 RESOLVED + Threat T-05-W0-05 mitigation)"
  - "PRM branch instant cut + ships estáticas + scrollFactor 1.0 uniforme bajo prefers-reduced-motion (D5-08)"
  - "Tests turned GREEN: 21 tests source-regex (factory T1-T6, scale T1-T3, space-scene-shape T1-T6, no-character-animation T1-T3, locale-bridge T1-T3, prm T1-T3); 3 quedan RED esperando W3 (locale-bridge T4/T5 Chapter6Content.vue)"
affects:
  - "05-04 W3 (Chapter6Content.vue): puede ahora `import { createGame } from '@/phaser'` (dynamic import string-literal) y emitir bridge events; locale-bridge T4/T5 vuelven GREEN tras W3 wire del emit"
  - "05-05 W4 (ProjectOverlay.vue): puede consumir el `show-project` event vía Chapter6Content middleware"
  - "Phase 6 deploy: bundle Phaser split en chunk separado activable post W3 dynamic import"

# Tech tracking
tech-stack:
  added: []  # phaser ^3.86.0 ya estaba en package.json desde scaffold inicial
  patterns:
    - "Factory pattern para Phaser.Game (createGame factory function — no top-level new Phaser.Game side effect)"
    - "Phaser.Scale.NONE + Math.floor integer zoom + `|| 1` defensive fallback (PHA-03)"
    - "Registry PRM (Pattern 9 Option B): preBoot callback setea game.registry.set('prefersReduced', ...) — accesible cross-scene sin prop drilling ni Vue composables"
    - "i18n singleton import en Phaser scene (Pattern 13): `import { i18n } from '@/i18n'` + `i18n.global.t(...)` — pure read-only, sin reactividad duplicada"
    - "Locale bridge listener + SHUTDOWN cleanup explícito: game.events vive en game-level event bus, requiere off() explícito (no se limpia automáticamente con scene.destroy())"
    - "PRM cinturón de seguridad: `this.tweens.timeScale = 0` al final del create() bajo PRM — aborta tweens declarados fuera de control directo (D5-08 safety net)"
    - "Anti-pattern source-regex enforcement: tests/phaser/no-character-animation.test.js verifica AUSENCIA de this.anims.create / spritesheet+frames / playAnimation; obliga a parafrasear comentarios para evitar regex collision"
    - "ESM Node + Vite compat: import path con extensión explícita `.js` para que `node -e \"import('...')\"` smoke test funcione (Vite resolver también lo acepta)"

key-files:
  created:
    - "src/phaser/index.js (80 líneas) — factory createGame() + computeZoom()"
    - "src/phaser/SpaceScene.js (298 líneas) — class SpaceScene completa con preload/create/handleLocaleChange"
    - ".planning/phases/05-phaser-chapter-6/05-03-SUMMARY.md (este archivo)"
  modified: []

key-decisions:
  - "3-layer parallax implementado (best case Pattern 7): stars-far scrollFactor 0.2 + nebulae-mid 0.5 + bg main 1.0. Defensive: this.textures.exists() check en create() permite fallback single-layer si W1 hubiera entregado menos capas. Bajo PRM todas a 1.0 (D5-08 sin diferencial)."
  - "Tooltip in-Phaser como Phaser.GameObjects.Text (NO Container con Rectangle): simpler implementation, suficiente para D5-10 — font Audiowide cyan #4dffff on backgroundColor #1a0e3d deep purple. Estilo synthwave consistente sin asset extra."
  - "PRM heuristic completo D5-08 implementado: (a) arrival instant cut via cameras.main.setScroll directo; (b) ships estáticas en posiciones decorativas fijas; (c) parallax layers scrollFactor 1.0 uniforme; (d) tweens.timeScale=0 cinturón de seguridad."
  - "HMR ownership confirmado en Chapter6Content.vue (NOT factory): el factory module se mantiene como pure function sin state de instancia — cada call retorna nueva instance. HMR guard `import.meta.hot?.dispose(...)` vive en el componente Vue (Plan 05-04) que owns el lifecycle. Separación de responsabilidades evita doble cleanup."
  - "Bridge events SIN prefijo `vue:`: 'show-project', 'arrival-complete', 'locale-changed' — D5-10 RESOLVED. Tests T6 space-scene-shape + T1 locale-bridge enforcement match exacto contra Chapter6Content.vue del W3 (Threat T-05-W0-05 mitigation)."
  - "Sort de this.projectsData por planetOrbit ascendente en create(): garantiza orden cronológico (0.2 ar-vr → 0.5 remoose → 0.8 software-mind) independiente del orden de declaración en projects.js. Defensive — si el array se reordena por insertion en plans futuros, la scene mantiene el mapping vertical correcto."
  - "Reescritura de comentarios anti-pattern (regex collision fix): el header inicial usaba palabras literales 'this.anims.create', 'spritesheet con frames', 'playAnimation' que matchearon los regex de absence en no-character-animation.test.js. Parafraseado a 'Phaser anim system', 'atlas multi-cell', 'anim play calls' — comentario sigue siendo accionable, regex passa GREEN."

patterns-established:
  - "Factory module without state: createGame() retorna nueva instance cada call, sin singleton interno — el lifecycle owner (componente Vue) decide cuándo crear/destruir"
  - "Registry-based PRM (Pattern 9 Option B): preBoot callback + game.registry.set para pasar flags a scenes sin import composables Vue desde Phaser sandbox"
  - "Source-regex anti-pattern testing: enforce AUSENCIA de patterns prohibidos en código de producción + obliga a parafrasear documentación para evitar false-positive regex matches en comentarios"
  - "Bridge event naming convention sin prefijo: ratificar D5-10 con tests T6 space-scene-shape + T5 locale-bridge que verifican match exacto entre emisor (SpaceScene) y consumidor (Chapter6Content) — Threat T-05-W0-05 mitigation"

requirements-completed:
  - PHA-01  # factory shape correct (Phaser.Scale.NONE + integer zoom + pixelArt + roundPixels)
  - PHA-03  # integer scale formula (Math.floor + Math.min + || 1 defensive)
  - PHA-05  # SpaceScene preload + create + planets + ships + arrival camera
  - PHA-06  # locale bridge half (SpaceScene side — Chapter6Content emit en W3)
  - PHA-07  # planet click bridge (show-project event con projectId)
  - PHA-08  # cero character animation (anti-pattern enforced por regex absence)
  - A11Y-05 # PRM heuristic instant cut + ships estáticas + tweens.timeScale=0
  - ART-04  # 3 planets + 2 ships sprites instanciados según shape

# Verification
self_check: PASSED
commits:
  - "1da7431 feat(05-03): crear src/phaser/index.js factory Phaser.Game"
  - "3fbae96 feat(05-03): crear src/phaser/SpaceScene.js — Phaser scene completa ch6"
tests_status: "tests/phaser/* 24/26 green (locale-bridge T4/T5 RED esperado hasta W3). Suite global 395 passed | 10 failed (baseline W1 371/34 → +24 GREEN net). Las 10 RED restantes son TODAS scaffolds W3/W4/W5 (Chapter6Content* + ProjectOverlay + a11y + chapter-overlap ScrollShell wire)."

# Metrics
duration: 12min
completed: 2026-05-14
---

# Phase 5 Plan 03: W2 Phaser Factory + SpaceScene Summary

**El "corazón Phaser" de Chapter 6 implementado en `src/phaser/`: factory module + SpaceScene completa con 3-layer parallax + 3 planets distribuidos verticalmente + 2 ships horizontal loop + camera arrival tween + locale bridge + PRM heuristic D5-08 cinturón completo + cero character animation (PHA-08). 24/26 tests phaser GREEN; 2 RED esperan Plan 05-04 Chapter6Content.vue.**

## Performance

- **Duration:** ~12 min (2 tasks atomic commits)
- **Started:** 2026-05-14T19:03:35Z
- **Completed:** 2026-05-14T19:08:58Z
- **Tasks:** 2 / 2
- **Files created:** 2 (src/phaser/index.js + src/phaser/SpaceScene.js)
- **Files modified:** 0
- **Lines of code:** 378 total (80 factory + 298 scene)
- **Tests turned GREEN:** 21 (factory 6 + scale 3 + space-scene-shape 6 + no-character-animation 3 + locale-bridge T1-T3 + prm 3) net = +24 vs W1 baseline (incluye locale-bridge T1-T3 que estaban RED)

## Accomplishments

- **Factory module limpio (`src/phaser/index.js`):** `createGame(parentEl, { prefersReduced })` exportado como named function. Config Phaser 3.86 completa: type AUTO, Scale.NONE + Math.floor integer zoom + autoCenter CENTER_BOTH, pixelArt:true + roundPixels:true, backgroundColor synthwave deep purple, physics:none (tree-shake ~30KB), parent como DOM node directo (anti race-condition), preBoot callback registra prefersReduced en game.registry (Pattern 9 Option B). Header documenta "stay on Phaser 3.x" (Pitfall 14 mitigation) + JSDoc completo.

- **SpaceScene completa (`src/phaser/SpaceScene.js`):** Class extends Phaser.Scene con constructor que inicializa `tooltipTexts[]`, `planets[]`, `projectsData[]`. preload() carga 8 keys (ch6-bg + 2 parallax opt + 3 planets + 2 ships) con `load.on('loaderror')` silent fallback para parallax opcional. create() implementa:
  - **3-layer parallax** (Pattern 7 best case): stars-far scrollFactor 0.2, nebulae-mid 0.5, bg main 1.0. `this.textures.exists()` defensive check permite fallback single-layer.
  - **3 planets distribuidos verticalmente** (D5-01): Y = planetOrbit * 810 + 135, sort ascendente por planetOrbit garantiza orden cronológico. Hit area Circle radius+16px halo (D5-06). Tooltip Audiowide cyan-on-deep-purple visible solo desktop hover. Click emit 'show-project' sin prefijo vue:.
  - **2 ships horizontal loop** (D5-05 + Pattern 8): ship1 LTR 12s con onRepeat reset x=-50; ship2 RTL 18s con setFlipX(true) + onRepeat reset x=BASE_W+50. Estáticas en x=120/x=360 bajo PRM.
  - **Camera arrival** (D5-02 + Pattern 7): tween scrollY 0→675 duration 3500ms Power2.easeOut onComplete emit 'arrival-complete'. Bajo PRM: cameras.main.setScroll DIRECTO sin tween + emit instant.
  - **Locale bridge listener** (Pattern 5 + D5-10): `this.game.events.on('locale-changed', handler)` + cleanup explícito en `Phaser.Scenes.Events.SHUTDOWN` con `game.events.off`. handleLocaleChange re-traduce tooltipTexts.visible via `i18n.global.t(titleKey)`.
  - **PRM cinturón** (D5-08): `this.tweens.timeScale = 0` al final del create() si prefersReduced — safety net contra tweens que escapen al check directo.

- **Singleton i18n import:** `import { i18n } from '@/i18n'` desde el módulo Phaser — pure read-only, sin instanciar nueva i18n (RESEARCH Pattern 13). El singleton respeta el state Vue tras reactivity flush; el listener locale-changed dispara después de eso.

- **Anti-pattern enforcement (PHA-08):** Cero `this.anims.create`, cero atlas multi-cell con frames, cero `playAnimation`/`anims.play()`, cero captura de wheel/touchmove (Pitfall 6). Tests/phaser/no-character-animation.test.js T1-T3 GREEN.

- **Bridge event naming sin prefijo (D5-10 RESOLVED):** Tres eventos `'show-project'` / `'arrival-complete'` / `'locale-changed'` SIN prefijo `vue:` (Threat T-05-W0-05 bridge name match enforced por tests source-regex T6 space-scene-shape + T1 locale-bridge).

## Task Commits

Each task was committed atomically:

1. **Task 1: Crear src/phaser/index.js factory** — `1da7431` (feat)
2. **Task 2: Crear src/phaser/SpaceScene.js scene completa** — `3fbae96` (feat)

## Files Created/Modified

### Source (Phaser module nuevo)

- `src/phaser/index.js` — Factory `createGame()` + `computeZoom()` + Pattern 9 Option B registry PRM (80 líneas)
- `src/phaser/SpaceScene.js` — Class SpaceScene completa con preload + create + handleLocaleChange (298 líneas)

### Test files modificados

Ninguno — todos los tests phaser/* ya existían como RED scaffolds W0 (Plan 05-01). Este plan los pone GREEN sin tocar el test code.

## Decisions Made

1. **3-layer parallax implementado (Pattern 7 best case Open Q4 RESOLVED):**
   - W1 entregó las 3 capas (`ch6-bg.png`, `ch6-bg-stars-far.png`, `ch6-bg-nebulae-mid.png`).
   - Implementé scrollFactor escalonado 0.2 / 0.5 / 1.0 — profundidad sintética durante arrival.
   - Defensive `this.textures.exists()` check permite fallback single-layer si plans futuros eliminan las opt layers.
   - Bajo PRM (D5-08): todas las capas scrollFactor 1.0 (sin diferencial).

2. **Tooltip styling: Phaser.GameObjects.Text simple (NO Container + Rectangle):**
   - Plan menciona ambas opciones (Container con Rectangle + Text encima, o Text simple con backgroundColor).
   - Opté por `add.text()` con `backgroundColor: '#1a0e3d'` + `color: '#4dffff'` + `padding: { x: 6, y: 3 }` — fontFamily Audiowide.
   - Razón: simpler implementation, suficiente vibe synthwave, sin asset pixelforge adicional. Si Rafael feedback W5 pide visual upgrade, el switch a Container es trivial.

3. **PRM heuristic completo D5-08 confirmado:**
   - **Arrival:** `cameras.main.setScroll(0, CAMERA_FINAL_Y)` DIRECTO + emit 'arrival-complete' instant. NO tween.
   - **Ships:** posiciones fijas decorativas (x=120 / x=360). NO tweens.
   - **Parallax:** todas las capas scrollFactor 1.0 uniforme (NO diferencial).
   - **Cinturón:** `this.tweens.timeScale = 0` al final del create() — aborta tweens que escaparan al PRM check.

4. **HMR ownership confirmado en Chapter6Content.vue (NOT factory) — Warning 6 RESOLVED:**
   - El factory module NO mantiene state de instancia — cada call a `createGame()` retorna una nueva `Phaser.Game`.
   - El HMR guard `import.meta.hot?.dispose(...)` vive en `src/components/Chapter6Content.vue` (Plan 05-04) que es el lifecycle owner.
   - Separación de responsabilidades: factory = pure function (input → instance); componente Vue = lifecycle controller.
   - Verificado en tests: factory.test.js NO espera HMR; Chapter6Content.test.js (W3) sí lo exigirá.

5. **Sort defensive de projectsData por planetOrbit en create():**
   - `this.projectsData.sort((a, b) => a.planetOrbit - b.planetOrbit)` garantiza orden cronológico ascendente (0.2 ar-vr → 0.5 remoose → 0.8 software-mind).
   - Independiente del orden de inserción en `src/data/projects.js`. Si plans futuros re-orden array, la scene mantiene el mapping vertical correcto.
   - Costo: O(n log n) sobre 3 items = trivial.

6. **Comentario anti-pattern parafraseado (regex collision fix):**
   - El header inicial usaba palabras literales prohibidas: "this.anims.create", "spritesheet con frames", "playAnimation".
   - tests/phaser/no-character-animation.test.js T1-T3 son regex de AUSENCIA — matchean tanto código como comentarios.
   - Parafraseé a "Phaser anim system", "atlas multi-cell", "anim play calls" — comentario sigue accionable, regex pasa GREEN.
   - Pattern reusable: cualquier test de anti-pattern source-regex obliga a documentar la prohibición SIN usar las palabras literales prohibidas.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Comentario anti-pattern colisión con regex de ausencia**

- **Found during:** Task 2 (primer run de `npm run test:run -- tests/phaser/no-character-animation.test.js`)
- **Issue:** El header de comentarios de `SpaceScene.js` inicialmente listaba los anti-patterns prohibidos con sus nombres literales (`this.anims.create`, `spritesheet con frames`, `playAnimation`). El test `no-character-animation.test.js` T1/T2/T3 hace `expect(src).not.toMatch(/.../)` que matchea tanto código como comentarios — bloqueó 3 tests que debían pasar GREEN.
- **Fix:** Reescribí el header de comentarios con paráfrasis equivalentes (`Phaser anim system`, `atlas multi-cell`, `anim play calls`) que no matchean los regex. El comentario sigue siendo accionable para humanos.
- **Files modified:** `src/phaser/SpaceScene.js` (header comentario)
- **Verification:** `npm run test:run -- tests/phaser/no-character-animation.test.js` → 3/3 GREEN
- **Committed in:** `3fbae96` (parte del task 2 commit)
- **Rationale:** Pattern establecido — futuros tests source-regex de anti-pattern requieren documentación parafraseada. Sin scope creep — el fix es interno al archivo del task.

**2. [Rule 3 - Blocking] Import path sin extensión rompe Node ESM resolver**

- **Found during:** Smoke test post-Task 2 (`node -e "import('./src/phaser/index.js')..."`)
- **Issue:** `import { SpaceScene } from './SpaceScene'` (sin `.js`) funciona en Vite/Vitest pero falla en Node puro ESM resolver con `Cannot find module './SpaceScene'`.
- **Fix:** Cambié a `import { SpaceScene } from './SpaceScene.js'` — funciona idénticamente en Vite resolver + cumple Node ESM spec.
- **Files modified:** `src/phaser/index.js` (1 línea)
- **Verification:** factory.test.js sigue 6/6 GREEN; key_links pattern `import.*SpaceScene.*from.*SpaceScene` sigue matcheando.
- **Committed in:** `3fbae96` (parte del task 2 commit)
- **Rationale:** Best practice ESM con extensión explícita. El smoke test del plan asume entorno Vite (alias @ funciona), pero la extensión explícita es estrictamente mejor — no afecta a Vite.

**Total deviations:** 2 auto-fixed (ambas Rule 3 - blocking sobre regex collision + ESM resolver)
**Impact on plan:** Sin scope creep. Ambos fixes son refinamientos internos del task que pongo en práctica patterns reusables para Phase 5+.

## Issues Encountered

**Suite global verification:** 395 passed | 10 failed (baseline W1 = 371 passed | 34 failed). Net delta: +24 GREEN, -24 RED. Los 10 fallos restantes son TODOS scaffolds esperando waves siguientes:

| File RED restante | Wave que lo resolverá |
|---|---|
| tests/phaser/locale-bridge.test.js T4, T5 | W3 (Chapter6Content.vue) |
| tests/components/Chapter6Content.test.js (T1-T4) | W3 |
| tests/components/Chapter6Content-lazy.test.js (T1, T2) | W3 |
| tests/components/Chapter6Content-bridge.test.js (T1-T3) | W3 |
| tests/components/Chapter6Content-resize.test.js (T1, T2) | W3 |
| tests/components/Chapter6Content-prm.test.js (T1, T2) | W3 |
| tests/components/ProjectOverlay.test.js (T1-T6) | W4 |
| tests/a11y/keyboard-planet-buttons.test.js (T1-T3) | W3 |
| tests/a11y/focus-trap.test.js (T1-T3) | W4 |
| tests/integration/chapter-overlap-ch6.test.js T3, T4 | W3 |

Cero regresiones de Plans 01-02 o Phases 0-4.

**Smoke `node -e "import(...)"`:** falla con `Cannot find package '@/i18n'` porque Node puro NO conoce el alias `@` de Vite. NO bloqueante — el plan asume entorno Vite/Vitest donde el alias funciona. Documentado pero no escalado a deviation.

**LF/CRLF warnings:** Sistema Windows convierte LF→CRLF al stagear. Sin impacto funcional. Warning normal del workflow Windows + git autocrlf.

## User Setup Required

Ninguno. W2 es 100% código + tests; W5 (manual checklist) verificará vibe synthwave del rendering Phaser real.

## Threat Flags

Ninguno nuevo más allá del threat register original `<threat_model>` del PLAN:

- **T-05-W2-04 (Phaser captura wheel/touchmove):** mitigated — cero `this.input.mouse.preventDefault*`, cero listeners en `wheel`/`touchmove`. Verificado por absence del pattern en `src/phaser/SpaceScene.js`.
- **T-05-W2-05 (character animation memory bloat):** mitigated — PHA-08 enforced por `tests/phaser/no-character-animation.test.js` T1-T3 GREEN.
- **T-05-W2-07 (drift en nombre de evento Phaser ↔ Vue):** mitigated — `space-scene-shape.test.js` T6 + `locale-bridge.test.js` T1 verifican match exacto `'arrival-complete'` y `'locale-changed'` (sin prefijo `vue:`).

## Known Stubs

Ninguno. El módulo Phaser está completo en su scope W2. Los stubs de copy (`projects.ch6-*.desc` PENDING) heredados de W0 quedan tracked en Plan 05-01 SUMMARY — su refresh es responsabilidad del W5 manual checklist con Rafael, no de este plan.

## Self-Check: PASSED

### Files verified to exist

| File | Status |
|------|--------|
| src/phaser/index.js | FOUND (80 líneas) |
| src/phaser/SpaceScene.js | FOUND (298 líneas) |
| .planning/phases/05-phaser-chapter-6/05-03-SUMMARY.md | FOUND (este archivo) |

### Commits verified

| Hash | Verified | Message |
|------|----------|---------|
| 1da7431 | FOUND | feat(05-03): crear src/phaser/index.js factory Phaser.Game |
| 3fbae96 | FOUND | feat(05-03): crear src/phaser/SpaceScene.js — Phaser scene completa ch6 |

### Tests verified

- **tests/phaser/factory.test.js:** 6/6 GREEN (PHA-01 + PHA-03 factory shape contracts)
- **tests/phaser/scale.test.js:** 3/3 GREEN (BASE_W=480 + BASE_H=270 + Math.min+Math.floor+|| 1 defensive)
- **tests/phaser/space-scene-shape.test.js:** 6/6 GREEN (PHA-05 extends + preload 6 keys + create + registry + singleton i18n + emit arrival-complete sin prefijo)
- **tests/phaser/no-character-animation.test.js:** 3/3 GREEN (PHA-08 anti-pattern absence enforced)
- **tests/phaser/locale-bridge.test.js:** 3/5 GREEN (T1/T2/T3 SpaceScene side; T4/T5 esperando W3 Chapter6Content.vue — by design)
- **tests/phaser/prm.test.js:** 3/3 GREEN (D5-08 registry.get + setScroll directo + tweens.timeScale=0)

**Suite global:** 395 passed | 10 failed (baseline W1: 371 | 34). Delta: +24 GREEN net.

**Self-Check: PASSED**
