---
phase: 5
slug: phaser-chapter-6
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.1.6 (Phase 1 W0 baseline) |
| **Config file** | `vite.config.js` (test block) — established Phase 1; no install needed |
| **Quick run command** | `npm run test -- --run tests/phaser tests/i18n tests/assets` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~30s (Phase 4 baseline 151 tests ~22s; Phase 5 adds ~25-35 tests) |

**Special note (Phaser + jsdom):** jsdom no renderea WebGL. Tests Phase 5 verifican shape (source-level regex), lifecycle (mount/unmount), y bridge (event emit/listen calls), NO actual rendering. Smoke visual queda como W5 manual checklist (patrón Phase 4 D4-11). Esta limitación es esperada — no es un gap de cobertura sino una división deliberada entre programmatic + manual gates.

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run <touched-test-files>` (Vitest auto-detecta cambios; ejecutar solo el subset de tests asociados al task)
- **After every plan wave:** Run `npm run test:run` (suite completa)
- **Before `/gsd-verify-work`:** Full suite verde + `npm run build` verde
- **Max feedback latency:** ~30s (full suite); ~5s (quick subset)

---

## Per-Task Verification Map

> Skeleton — el planner refinará durante step 8 con task IDs reales y file paths exactos. La tabla cubre las áreas de cobertura derivadas de RESEARCH.md §Validation Architecture.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-XX | 01 | 0 | ART-05 | — | naming convention enforced para ch6 assets | architectural | `npm run test -- tests/assets/asset-naming.test.js` | ❌ W0 (extend regex) | ⬜ pending |
| 05-01-XX | 01 | 0 | I18N-02 | — | i18n parity ch6 keys ES↔EN | architectural | `npm run test -- tests/i18n/parity.test.js` | ✅ (auto-extends) | ⬜ pending |
| 05-02-XX | 02 | 1 | CON-05/06, ART-06 | — | `chapters[6].palette` poblada + 3 projects chapterEra=6 shape D3-03 | unit | `npm run test -- tests/data/chapters.test.js tests/data/projects.test.js` | ❌ W0 | ⬜ pending |
| 05-02-XX | 02 | 1 | THM-01..05 | — | `[data-chapter="6"]` block en chapter-themes.css con paleta synthwave + `--bg-image` | architectural | `npm run test -- tests/themes/theme-isolation.test.js` | ✅ (extends) | ⬜ pending |
| 05-03-XX | 03 | 2 | ART-04/05/06 | — | 6 assets ch6 existen + naming + sizes correctos (bg ≤80KB Phase 6 budget) | architectural | `npm run test -- tests/assets/ch6-assets.test.js` | ❌ W0 | ⬜ pending |
| 05-04-XX | 04 | 3 | PHA-01 | — | `src/phaser/index.js` factory usa `shallowRef`-compatible config + no fugas | unit (source regex + mock) | `npm run test -- tests/phaser/factory.test.js` | ❌ W0 | ⬜ pending |
| 05-04-XX | 04 | 3 | PHA-03 | — | `Phaser.Scale.NONE` + `Math.floor` zoom integer | unit (source regex) | `npm run test -- tests/phaser/scale.test.js` | ❌ W0 | ⬜ pending |
| 05-04-XX | 04 | 3 | PHA-05 | — | `SpaceScene` exporta + define preload/create con 3 planet sprite refs + 2 ships + camera tween + parallax layers | unit (source regex) | `npm run test -- tests/phaser/space-scene-shape.test.js` | ❌ W0 | ⬜ pending |
| 05-04-XX | 04 | 3 | PHA-08 | — | Cero `addSpriteAnimation\|playAnimation\|spritesheet.*frames` en SpaceScene (anti-character-animation) | architectural | `npm run test -- tests/phaser/no-character-animation.test.js` | ❌ W0 | ⬜ pending |
| 05-05-XX | 05 | 4 | PHA-02 | — | `Chapter6Content.vue` mount/destroy llama `game.destroy(true, false)` sin leak; watcher cleanup correcto | integration (jsdom + mock Phaser) | `npm run test -- tests/components/Chapter6Content.test.js` | ❌ W0 | ⬜ pending |
| 05-05-XX | 05 | 4 | PHA-04 | — | Bundle phaser tree-shaken; `import()` dinámico verificado en source | architectural (source regex) | `npm run test -- tests/components/Chapter6Content-lazy.test.js` | ❌ W0 | ⬜ pending |
| 05-05-XX | 05 | 4 | PHA-06 | — | locale watch emite `game.events.emit('vue:locale-changed', locale)`; null-guard `game.value?.events` presente | integration | `npm run test -- tests/phaser/locale-bridge.test.js` | ❌ W0 | ⬜ pending |
| 05-05-XX | 05 | 4 | PHA-07 | — | Planet pointerdown emite `vue:show-project` con id; 3 buttons sr-only en DOM con aria-label disparan mismo handler | integration | `npm run test -- tests/components/Chapter6Content-bridge.test.js tests/a11y/keyboard-planet-buttons.test.js` | ❌ W0 | ⬜ pending |
| 05-05-XX | 05 | 4 | PHA-09, MOB-03 | — | `ResizeObserver` montado sobre host + `game.scale.resize` invocado on resize | integration | `npm run test -- tests/components/Chapter6Content-resize.test.js` | ❌ W0 | ⬜ pending |
| 05-05-XX | 05 | 4 | A11Y-05 | — | PRM detectado → `arrival` tween skipped (camera.scrollY directo a final); ships position estática; mantra sin fade | integration (PRM mock) | `npm run test -- tests/phaser/prm.test.js tests/components/Chapter6Content-prm.test.js` | ❌ W0 | ⬜ pending |
| 05-06-XX | 06 | 5 | CON-04 | — | `<ProjectOverlay>` close ESC + click-outside + focus trap; restore focus a sr-only button trigger | integration | `npm run test -- tests/components/ProjectOverlay.test.js tests/a11y/focus-trap.test.js` | ❌ W0 | ⬜ pending |
| 05-06-XX | 06 | 5 | CORE-04 | — | ch6 NO regresa el chapter-overlap-bug (Phase 4 deferred datapoint): `scroll-snap-stop: always` activo + no `overflow:hidden` agresivo en `.ch6-layout` | architectural | `npm run test -- tests/integration/chapter-overlap-ch6.test.js` | ❌ W0 | ⬜ pending |
| 05-06-XX | 06 | 5 | A11Y-06 | — | Mantra ES/EN strings presentes en `chapters.6.mantra` + alt-text ch6-bust (refresh post Phase 4 if needed) | architectural | `npm run test -- tests/i18n/mantra-parity.test.js` | ✅ (extends) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling continuity check:** ningún tramo de 3 tasks consecutivas queda sin automated verify (todos los tasks Phase 5 tienen un test asociado).

---

## Wave 0 Requirements

> El planner crea estos archivos durante W0 — tests scaffolded RED antes de implementación:

- [ ] `tests/assets/ch6-assets.test.js` — verifica existencia + naming + sizes de los 6-8 assets pixel-art ch6
- [ ] `tests/data/chapters.test.js` (extend o new) — `chapters[6].palette.length >= 4`, hex válidos
- [ ] `tests/data/projects.test.js` (extend o new) — exactamente 3 items `chapterEra === 6`, shape D3-03 completo con campos Phaser poblados (`planetSprite`, `planetOrbit`, `planetColor`)
- [ ] `tests/phaser/factory.test.js` — source regex de `src/phaser/index.js` (config shape, integer scale formula, `pixelArt: true`, `roundPixels: true`, `physics: 'none'`)
- [ ] `tests/phaser/scale.test.js` — source regex confirma `Phaser.Scale.NONE` + `Math.floor`
- [ ] `tests/phaser/space-scene-shape.test.js` — source regex de `src/phaser/SpaceScene.js` (preload assets refs, create planet/ship spawns, camera tween config, parallax layer scrollFactor)
- [ ] `tests/phaser/no-character-animation.test.js` — architectural regex anti-pattern
- [ ] `tests/phaser/locale-bridge.test.js` — integration mock game.events
- [ ] `tests/phaser/prm.test.js` — integration mock game.registry.get('prefersReduced')
- [ ] `tests/components/Chapter6Content.test.js` — mount/unmount jsdom + Phaser mock
- [ ] `tests/components/Chapter6Content-lazy.test.js` — source regex confirma `import()` dinámico
- [ ] `tests/components/Chapter6Content-bridge.test.js` — integration event listener
- [ ] `tests/components/Chapter6Content-resize.test.js` — integration ResizeObserver
- [ ] `tests/components/Chapter6Content-prm.test.js` — integration PRM heuristic
- [ ] `tests/components/ProjectOverlay.test.js` — integration ESC + click-outside + focus trap
- [ ] `tests/a11y/keyboard-planet-buttons.test.js` — 3 sr-only buttons + aria-label + dispatch
- [ ] `tests/a11y/focus-trap.test.js` — restore focus
- [ ] `tests/integration/chapter-overlap-ch6.test.js` — defensive architectural test (datapoint para root cause analysis del bug deferred Phase 4)
- [ ] `tests/i18n/mantra-parity.test.js` (o extend parity.test.js) — `chapters.6.mantra` ES+EN

**Asset-naming regex extend:** `tests/assets/asset-naming.test.js` (Phase 4 W0) ya cubre ch6-* via patrón `^ch[0-6]-[a-z0-9-]+(-[a-z0-9-]+)?\.(png|jpg|jpeg|webp)$`. Verificar que ch6 assets match sin cambios al test.

**i18n parity:** `tests/i18n/parity.test.js` (Phase 2 W0) auto-extends a cualquier key nuevo en es.json/en.json. Cero código nuevo necesario.

**Theme isolation:** `tests/themes/theme-isolation.test.js` (Phase 2 W3) auto-extends si `[data-chapter="6"]` añade tokens. Verificar que no leak a chapters adyacentes.

---

## Manual-Only Verifications

> Estos cubren rendering, percepción visual, mobile/HiDPI real, y bug visual chapter overlap. Vinculados al W5 manual checklist firmado por Rafael (patrón Phase 4 D4-11).

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pixel-perfect rendering en HiDPI/Retina | PHA-03, Success Criteria 4 | jsdom no renderea WebGL ni evalúa devicePixelRatio | Abrir `http://localhost:5173/?ch=6` en monitor Retina (Mac) o Windows con DPR>1; verificar bordes nítidos de planetas + ships (sin blur); zoom integer matchea `Math.floor(vw/480, vh/270)` |
| Arrival cinematográfico ~3-4s con easing | PHA-05, D5-02 | Visual perception + timing tuning | Recargar ch6 (cold mount); confirmar descenso cámara visible + planetas revelados secuencialmente + naves loop empieza solo post-arrival |
| 2 ships loop horizontal escalonado | D5-05 | Visual + timing | Esperar 30s después de arrival; ship 1 LTR ~12s, ship 2 RTL ~18s, sin overlap chocante |
| Locale toggle in-Phaser tooltips | PHA-06, Success Criteria 2 | UI rendering | Cambiar locale ES↔EN mientras hover sobre cada planeta; tooltip text cambia sin recargar página |
| Project overlay open/close on planet click + tap mobile | PHA-07, Success Criteria 1 | Touch input + visual | Click desktop + tap mobile sobre cada uno de los 3 planetas; overlay abre con detalle correcto; ESC + click-outside + close button todos cierran |
| Keyboard navigation post-canvas | A11Y-02, D5-06 | Focus visible + screen reader behavior | Tab desde LangToggle hasta los 3 buttons sr-only; Enter abre overlay; focus restore al close |
| PRM-aware behaviors | A11Y-05, D5-08 | PRM system flag detection | Sistema → prefers-reduced-motion: reduce; recargar ch6; arrival instant cut + ships estáticos + mantra sin fade |
| ch5↔ch6 transitions sin canvas duplicado / WebGL errors | Success Criteria 3 | Console monitoring | Navegar ch5→ch6→ch5→ch6→ch5→ch6 (3 ciclos); DevTools Console sin errores WebGL; performance.memory no crece indefinidamente |
| Chapter overlap bug (vigilancia, no fix) | CORE-04, deferred Phase 4 | Visual bug específico | Scroll desde ch3 → ch6 sequential; documentar SI ch6 agrava o no el bug existente (datapoint Phase 5.x o Phase 6 root cause) |
| Bundle size verification | PHA-04 | Build-time metric | `npm run build`; verificar que `dist/assets/*phaser*` chunk existe + tamaño ≤200KB gzipped (research estimate ~150KB; >200KB = investigar) |
| ch6-bg.png ≤80KB cumulative budget | Phase 6 blocker | Build artifact size | `ls -la public/assets/ch6-bg.*`; tamaño file ≤80KB tras optimize + Adobe MCP resize |
| Mantra ES copy ratification | CON-04, A11Y-06 | Linguistic preference Rafael | Rafael verifica "Y siempre muestra una sonrisa" suena natural en español; ajusta si prefiere alternativa |
| Visual vibe synthwave coherence | D5-04 | Aesthetic judgment | Rafael verifica que el render conjunto (bg + planetas + ships + overlay) transmite "lo-fi AI vaporwave"; refresh assets si vibe drift |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (planner ratifica durante step 8 con task IDs concretos)
