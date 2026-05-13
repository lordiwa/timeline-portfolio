---
phase: 2
slug: theme-system-i18n
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `02-RESEARCH.md` § Validation Architecture (líneas 1518-1587).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 + @vue/test-utils 2.4.10 + jsdom 29.1.1 |
| **Config file** | `vitest.config.js` (Phase 1 — verificar en Wave 0) |
| **Quick run command** | `npm run test:run -- {pattern}` (vitest --run, single pass) |
| **Full suite command** | `npm run test:run && npm run build` |
| **Estimated runtime** | ~10-15s suite + ~600ms build |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run -- {testFilePattern}` (fast feedback ~2-5s)
- **After every plan wave:** Run `npm run test:run && npm run build`
- **Before `/gsd-verify-work`:** Full suite verde + manual checklist `02-MANUAL-CHECKLIST.md` completo
- **Max feedback latency:** ~15 segundos (suite completa)

---

## Per-Task Verification Map

> Status pre-planner: tareas concretas las asigna el planner. Esta tabla mapea **requirements → archivos de test** (origen de Wave 0).
> El planner enlazará cada task a una row de este map al producir PLAN.md (Dimension 8 Nyquist).

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| THM-01 | `chapter-themes.css` existe con 7 `[data-chapter="N"]` blocks | unit (file/string match) | `npm run test:run -- tests/styles/themes-file` | ❌ W0 | ⬜ pending |
| THM-02 | `@layer` declaration con orden reset/themes/components/utilities | unit (string match) | `npm run test:run -- tests/styles/themes-file` | ❌ W0 | ⬜ pending |
| THM-03 | 7 themes: ch0/ch1 completos, ch2-6 stubs (5 props + font) | unit (CSS token parse) | `npm run test:run -- tests/styles/theme-tokens` | ❌ W0 | ⬜ pending |
| THM-04 (arch) | Cada `<section>` lleva su propio `data-chapter` hardcoded | unit (DOM walk) | `npm run test:run -- tests/components/ScrollShell.theme-isolation` | ❌ W0 | ⬜ pending |
| THM-04 (visual) | No bleed durante smooth-scroll transition | manual | `02-MANUAL-CHECKLIST.md` § visual diff | ❌ W0 (checklist) | ⬜ pending |
| THM-05 (docs) | Contrast tradeoffs documentados inline en `chapter-themes.css` | unit (regex match) | `npm run test:run -- tests/styles/contrast-docs` | ❌ W0 | ⬜ pending |
| THM-05 (external) | Real contrast values match documented | manual | axe DevTools / Pa11y / Lighthouse | ❌ W0 (checklist) | ⬜ pending |
| I18N-01 | vue-i18n@^11.x installed + `legacy: false` | unit (parse i18n setup) | `npm run test:run -- tests/i18n/setup` | ❌ W0 | ⬜ pending |
| I18N-02 | `en.json` + `es.json` tienen keys idénticos | unit (key parity) | `npm run test:run -- tests/i18n/parity` | ❌ W0 | ⬜ pending |
| I18N-03 | LangToggle: mount + click → toggle + localStorage persist | unit (mount + interact) | `npm run test:run -- tests/components/LangToggle` | ❌ W0 | ⬜ pending |
| I18N-04 | `<html lang>` updates on locale change | unit (watch + DOM mutation) | `npm run test:run -- tests/i18n/html-lang-watcher` | ❌ W0 | ⬜ pending |
| I18N-05 | Layout no se rompe con strings ES más largos | manual + CLS | `02-MANUAL-CHECKLIST.md` § layout shift + Lighthouse | ❌ W0 (checklist) | ⬜ pending |
| I18N-06 | `fallbackLocale: 'en'` + missing handler retorna marker en dev | unit (test marker output) | `npm run test:run -- tests/i18n/fallback` | ❌ W0 | ⬜ pending |
| A11Y-03 | Focus ring visible 3px on :focus-visible per chapter | unit + manual | `npm run test:run -- tests/styles/focus-ring` + tab through manual | ❌ W0 | ⬜ pending |
| A11Y-04 | Cubierto por THM-05 contrast verification | — | — | — | — |
| A11Y-07 | Cubierto por I18N-04 `<html lang>` reactive | — | — | — | — |
| BGMORPH-01 | `useBackgroundMorph` state machine: initial + watch + PRM branch + recovery + cleanup | unit (composable) | `npm run test:run -- tests/composables/useBackgroundMorph` | ❌ W0 | ⬜ pending |
| BGMORPH-02 | `BackgroundLayers.vue`: 2 layers + opacity + data-chapter bindings | unit (mount + assert) | `npm run test:run -- tests/components/BackgroundLayers` | ❌ W0 | ⬜ pending |
| I18N-EXT-SkipLink | SkipLink text reactivamente cambia con locale | unit (mount + switch) | `npm run test:run -- tests/components/SkipLink.i18n` | ❌ W0 (extiende Phase 1) | ⬜ pending |
| I18N-EXT-Timeline | StickyTimeline aria-labels reactivos | unit | `npm run test:run -- tests/components/StickyTimeline.i18n` | ❌ W0 (extiende Phase 1) | ⬜ pending |
| I18N-EXT-Avatar | StickyAvatar aria-label reactivo | unit | `npm run test:run -- tests/components/StickyAvatar.i18n` | ❌ W0 (extiende Phase 1) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 instala los stubs de test antes de implementar comportamiento. Cada item es un archivo nuevo (o extensión de uno existente) que falla intencionalmente hasta que la slice correspondiente lo satisface.

- [ ] `tests/styles/themes-file.test.js` — cubre THM-01, THM-02 (file existence + `@layer` order regex)
- [ ] `tests/styles/theme-tokens.test.js` — cubre THM-03 (per-chapter tokens present)
- [ ] `tests/styles/contrast-docs.test.js` — cubre THM-05 inline `/* contrast(...) */` comments
- [ ] `tests/styles/focus-ring.test.js` — cubre A11Y-03 universal :focus-visible
- [ ] `tests/components/ScrollShell.theme-isolation.test.js` — cubre THM-04 architectural (cada section tiene `data-chapter`)
- [ ] `tests/i18n/setup.test.js` — cubre I18N-01 (`legacy: false` + version check)
- [ ] `tests/i18n/parity.test.js` — cubre I18N-02
- [ ] `tests/i18n/html-lang-watcher.test.js` — cubre I18N-04 / A11Y-07
- [ ] `tests/i18n/fallback.test.js` — cubre I18N-06
- [ ] `tests/components/LangToggle.test.js` — cubre I18N-03
- [ ] `tests/components/BackgroundLayers.test.js` — cubre BackgroundLayers DOM contract
- [ ] `tests/composables/useBackgroundMorph.test.js` — cubre state machine + PRM mid-flight recovery
- [ ] `tests/components/SkipLink.i18n.test.js` — extiende Phase 1 SkipLink test
- [ ] `tests/components/StickyTimeline.i18n.test.js` — extiende Phase 1
- [ ] `tests/components/StickyAvatar.i18n.test.js` — extiende Phase 1
- [ ] `02-MANUAL-CHECKLIST.md` — cubre I18N-05 (layout shift), THM-04 visual, THM-05 external audit, A11Y-04 axe DevTools, mobile <600px

**Framework install:** None — Phase 1 ya instaló vitest + @vue/test-utils + jsdom.

**Spike pre-impl (R9):** Verificar que jsdom soporta `@layer` correctamente. Plan B: `@vitest/browser` + Playwright si el spike falla.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Theme bleed durante smooth-scroll | THM-04 | Solo se valida visualmente — el snap muestra mitades coherentes (no half-and-half en un mismo elemento) | Scroll ch0→ch6 secuencial en Chrome desktop; observar borde entre sections durante transition; capturar GIF si bleed detectado |
| Layout shift al toggle ES↔EN en mobile portrait | I18N-05 | CLS objetivo verificable solo con render real (chrome devtools mobile preset 375×667) | Toggle ES→EN→ES en cada chapter; Lighthouse mobile preset CLS < 0.1; ningún overflow horizontal |
| Contrast values reales contra los documentados inline | THM-05 + A11Y-04 | axe DevTools / Pa11y / Lighthouse necesitan render real con fonts cargadas | Run axe DevTools en cada `[data-chapter="N"]` body; cross-check los `/* contrast(fg,bg) = X:X */` inline; documentar discrepancias |
| Screen reader `<html lang>` reannounce | A11Y-07 (best-effort) | Comportamiento SR no es controlable por la web; NVDA/JAWS/VoiceOver handling varía | NVDA Windows: toggle ES↔EN; confirmar que el siguiente focus se anuncia en idioma correcto; documentar comportamiento observado como limitación si SR no reanuncia |
| FOUT/FOIT en primer load (R1) | D2-08 fonts pipeline | Network conditions reales | Chrome DevTools Network throttling "Slow 3G"; cargar la página; observar que texto aparece en system-safe fallback y luego swap a custom font sin FOIT (gracias a `font-display: swap`) |
| Visual A/B 200ms vs 300ms bg morph (Open-Q2-B) | D2-05 | Perceptual judgment | Locker el default con dev build; preferir 200ms si sync visual con avatar swap es nítido; si "se siente abrupto" subir a 300ms |

---

## Validation Sign-Off

- [ ] Todos los tasks del planner enlazan a una row del verification map (o a Wave 0 / manual checklist)
- [ ] Sampling continuity: no más de 3 tasks consecutivos sin automated verify
- [ ] Wave 0 cubre todos los ❌ W0 listados arriba antes de cerrar el wave
- [ ] No watch-mode flags en commands (todos usan `--run`)
- [ ] Feedback latency < 15s (suite completa) — verificado en CI/local
- [ ] `02-MANUAL-CHECKLIST.md` creado en Wave 0 y completo antes de `/gsd-verify-work 2`
- [ ] `nyquist_compliant: true` set en frontmatter una vez todos los items de arriba en verde

**Approval:** pending (frontmatter `status: draft`)
