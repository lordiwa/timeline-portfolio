---
phase: 4
slug: chapters-0-2-4-5
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `04-RESEARCH.md` §"Validation Architecture" (Nyquist Dimension 8).
> Per-task map se rellena durante plan-phase cuando cada PLAN.md aterriza sus tasks.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.x (jsdom env) |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npm run test -- --run <pattern>` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~12-18 seconds (current 216 tests, Phase 4 añade ~30-50 más) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run` filtrado al archivo de la task
- **After every plan wave:** Run `npm run test -- --run` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green + `npm run build` verde
- **Max feedback latency:** ~20 seconds (full suite)

---

## Per-Task Verification Map

> Plan-phase rellena esta tabla cuando cada PLAN.md aterriza sus tasks.
> Para Phase 4, las 6 waves D4-08 se desglosan en plans 04-01..04-06.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-*  | 01 | W0 | ART-01 (carry-forward), A11Y-06 | T-PRIVACY-01 | Fotos referencia NO commiteadas; 7 busts pixel-art consistentes | architectural + visual manual | `npm run test -- --run tests/assets/avatar-batch.test.js` | ❌ W0 | ⬜ pending |
| 04-02-*  | 02 | W1 | ART-07, THM-04, A11Y-04 | — | Ch0 + Ch1 100% CSS puro; theme isolation; PRM compliance | unit + architectural | `npm run test -- --run tests/components/Chapter0Content.test.js tests/components/Chapter1Content.test.js` | ❌ W0 | ⬜ pending |
| 04-03-*  | 03 | W2 | ART-02, A11Y-04 | T-XSS-CONTENT | Ch2 Flash banner skeumorphic + bg-image lazy + project cards bilingual | unit + i18n parity | `npm run test -- --run tests/components/Chapter2Content.test.js tests/i18n/parity.test.js` | ❌ W0 | ⬜ pending |
| 04-04-*  | 04 | W3 | ART-02, ART-03, A11Y-05 | — | Ch4 multi-layer parallax (factor escalonado) + FloatingPanel + PRM uniform-factor | unit (parallax math) + integration (IO) | `npm run test -- --run tests/components/ParallaxLayers.test.js tests/components/FloatingPanel.test.js` | ❌ W0 | ⬜ pending |
| 04-05-*  | 05 | W4 | ART-02, A11Y-05 | — | Ch5 hero bg + ScrollRevealCard (IntersectionObserver) + PRM instant-render | unit + architectural | `npm run test -- --run tests/components/Chapter5Content.test.js tests/components/ScrollRevealCard.test.js` | ❌ W0 | ⬜ pending |
| 04-06-*  | 06 | W5 | THM-04, THM-05, I18N-05, A11Y-04, A11Y-06, A11Y-07, CORE-09 | T-XSS-i18n | Integración cross-chapter; manual checklist Rafael sign-off; PRM full audit; contrast audit ch2/4/5 | manual + automated reuse | `npm run test -- --run` + `npm run build` + Rafael sign-off §10 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements (Test Infrastructure)

- [ ] `tests/assets/asset-naming.test.js` — regex `^ch[0-6]-(bust|bg|bg-stars-far|bg-planet-mid|fg-panels|fg-ships|hero)\.png$` sobre `public/assets/` recursivo
- [ ] `tests/components/ParallaxLayers.test.js` — translateY math con factor escalonado [0.2, 0.5, 0.8, 1.0] vía scrollProgress mock
- [ ] `tests/components/ScrollRevealCard.test.js` — IntersectionObserver mock; verifica fade+slide-in al entrar viewport; PRM skip transition
- [ ] `tests/components/Chapter1Content.test.js` — verifica `<marquee>` tag presence default + `<span>` static bajo PRM (v-if swap D4-05)
- [ ] `tests/components/Chapter0Content.test.js` — terminal scroll typing animation; PRM instant render
- [ ] `tests/components/FloatingPanel.test.js` — backdrop-filter fallback (background-color cuando blur not supported)
- [ ] `tests/i18n/avatar-busts-parity.test.js` — ratifica `avatar.busts.{0..6}.alt` existe en ambos es.json + en.json, no vacío, no PENDING-placeholder
- [ ] `tests/styles/contrast.test.js` — extiende existing contrast test con ch2/ch4/ch5 hex pairs post-§5 entry
- [ ] `tests/integration/theme-bleed.test.js` — architectural: parallax transforms ch4 NO se ven en ch3/ch5 viewport durante snap

*Wave 0 se ejecuta al inicio de cada wave de implementación (W1..W5); cada plan instala los tests que tocan sus archivos.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Avatar busts 7-batch consistency visual | ART-01 carry-forward, D4-01 | Pixelforge consistency NO es automatable cross-call; requiere ojo humano | Rafael visualiza cada bust en `public/assets/ch{N}-bust.png` lado a lado; valida edad reconocible (ch0 niño, ch1 adolescente, ch2/3 veintitantos, ch4 treinta, ch5 treinta-y-tantos, ch6 cuarenta); identity coherence (mismo personaje envejeciendo) |
| Parallax depth perceivable ch4 | ART-03, SC-1 | "Sensación de profundidad" es perceptual | Rafael scroll dentro de ch4 desktop + mobile portrait; valida que stars-far se mueven más lento que planet-mid que panels-fg que ships-near; PRM ON → todas las capas se mueven uniforme |
| Marquee + starfield ch1 era-accuracy | ART-07, SC-1 | Authenticity GeoCities/Angelfire requiere referencia subjetiva | Rafael compara con captura real archive.org de GeoCities mid-90s; valida marquee scroll + starfield twinkle + Comic Neue + tabla border legacy |
| Cursor parpadeante ch0 era-accuracy | ART-07, SC-1 | CRT P1 phosphor look + cursor steps subjective | Rafael valida steps animation + phosphor green-on-black + monospace font |
| Skeumorphic Flash banner ch2 | ART-02, SC-1 | "Vibe Flash era" subjective | Rafael compara con archive.org sites circa 2009 con SWF embedded banners |
| FloatingPanel glass aesthetic ch4 | ART-03 | backdrop-filter + holographic look subjective | Rafael valida en Chrome/Firefox/Safari; fallback background-color readable en Firefox legacy |
| ScrollRevealCard motion ch5 | SC-1 | "Modern animated" subjective | Rafael scroll-down ch5 desktop; valida fade+slide-in feels modern not jarring; PRM ON → instant render sin animation |
| Avatar busts alt text era-accurate ES/EN | A11Y-06 | Subjective era-accuracy (palabras concretas) | Rafael lee los 7 `avatar.busts.N.alt` en ambos idiomas; ratifica fidelity a la imagen generada (ej. "Rafael a los 10 años frente a un monitor CRT" si el bust muestra eso) |
| ES vs EN layout no-overflow | I18N-05 | Cross-browser visual | Rafael toggle ES↔EN en chapters 0-5 desktop + mobile 375×667; valida ningún text overflow / layout shift visible |
| Contrast 4.5:1 ch2/4/5 final paletas | A11Y-04, THM-05 | Subjective + axe audit | Rafael ejecuta axe DevTools en ch2/ch4/ch5 post-paleta-final entry §5.1/§5.3/§5.4 |
| iOS Safari real behavior (Plan 07 carry-forward) | iOS-01, iOS-02 | Hardware iOS no disponible | Mitigaciones preventivas documentadas en W5; verificación real diferida (BrowserStack o hardware iOS prestado) |
| Privacy `public/references/` NO en producción | T-PRIVACY-01, D4-02 | Deploy-time check | Phase 6 audit `firebase.json` ignore glob; W0 verifica `.gitignore` entry presente |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (per-task map rellenado en plan-phase)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (asset-naming, parallax math, IO mock, marquee swap, contrast extension, theme-bleed, avatar-busts-parity i18n)
- [ ] No watch-mode flags (todos los `npm run test` usan `--run`)
- [ ] Feedback latency < 20s (full suite goal)
- [ ] `nyquist_compliant: true` set in frontmatter
- [ ] Phase 4 RESEARCH.md §"Validation Architecture" tracebility: cada Phase 4 requirement (ART-02, ART-03, ART-04*, ART-07, A11Y-06) tiene al menos 1 test row + 1 manual gate row
- [ ] (* ART-04: scope dual — ch6 elementos a Phase 5; ch6-bust en Phase 4 W0; flag clarification en Traceability post-execute)

**Approval:** pending
