---
phase: 3
slug: chapter-3-end-to-end
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `03-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.6 |
| **Config file** | inferido desde `vite.config.js` (sin `vitest.config.js` separado) |
| **Setup global** | `tests/setup.js` — mocks IO, ResizeObserver, matchMedia, scrollIntoView |
| **Quick run command** | `npm run test:run -- tests/<archivo>` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~6s (full suite Phase 2 baseline: 147 tests / 5.71s) |

---

## Sampling Rate

- **After every task commit:** `npm run test:run -- tests/i18n/parity.test.js` (siempre — paridad i18n) + el test file del componente/archivo tocado por la task.
- **After every plan wave:** `npm run test:run` (suite completa — actualmente 147 tests + nuevos Phase 3).
- **Before `/gsd-verify-work`:** Full suite verde.
- **Max feedback latency:** ~6s quick / ~10s full suite (estimación lineal por escalado de tests Phase 3).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-XX | 01 | 0 | CON-05 | — | shape exporta 7 chapters con `{ id, year, era, eraKey, titleKey, avatarSrc, palette? }` | unit/arch | `npm run test:run -- tests/data/chapters.test.js` | ❌ W0 | ⬜ |
| 03-01-XX | 01 | 0 | CON-06 | — | shape exporta proyectos con D3-03 fields (incluye Phase 5 phaser fields opcionales) | unit/arch | `npm run test:run -- tests/data/projects.test.js` | ❌ W0 | ⬜ |
| 03-01-XX | 01 | 0 | CON-03 | T-CON-03 | `contact.js` shape `{ email, linkedinUrl, githubUrl, otherUrl? }` + URLs hardcoded (no user input) | unit | `npm run test:run -- tests/data/contact.test.js` | ❌ W0 | ⬜ |
| 03-01-XX | 01 | 0 | ART-06 | — | cada chapter con bust tiene `palette: [hex, ...]` no vacío | arch | incluido en `chapters.test.js` | ❌ W0 | ⬜ |
| 03-02-XX | 02 | 1 | CON-03 | T-CON-03 | `ContactHUD.vue` renderiza 3 iconos con href correcto + `rel="noopener noreferrer"` en externos | component | `npm run test:run -- tests/components/ContactHUD.test.js` | ❌ W0 | ⬜ |
| 03-02-XX | 02 | 1 | CON-01/02 | — | `Chapter3Content.vue` renderiza bio + project cards cuando hay proyectos ch3 | component | `npm run test:run -- tests/components/Chapter3Content.test.js` | ❌ W0 | ⬜ |
| 03-02-XX | 02 | 1 | — | — | `ProjectCard.vue` renderiza con shape mínimo D3-03 + estilo skeumorphic | component | `npm run test:run -- tests/components/ProjectCard.test.js` | ❌ W0 | ⬜ |
| 03-03-XX | 03 | 2 | SEO-01..04 | T-SEO-INJ | `useHead` invocado con meta `og:*`, link `hreflang`, script JSON-LD Person; valores reactivos al locale | unit/arch | `npm run test:run -- tests/seo/head-tags.test.js` | ❌ W0 | ⬜ |
| 03-04-XX | 04 | 3 | ART-01/05 | T-ART-PRIV | `public/assets/ch{N}-bust.png` existe para N=0..6 (post-generación); foto privada NO en repo | arch/smoke | `npm run test:run -- tests/assets/bust-naming.test.js` | ❌ W0 | ⬜ |
| (cross-cut) | * | * | I18N-02 (extend) | — | paridad de keys `bio.*`, `projects.*`, `seo.*`, `contact.*`, `chapters.*.title` entre `es.json` y `en.json` | unit | `npm run test:run -- tests/i18n/parity.test.js` | ✅ (extensible) | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Files que el primer wave debe crear/extender para que las samplings posteriores tengan algo que correr:

- [ ] `tests/data/chapters.test.js` — verifica shape CON-05 + ART-06 palette field
- [ ] `tests/data/projects.test.js` — verifica shape CON-06 + chapterEra matching
- [ ] `tests/data/contact.test.js` — verifica shape CON-03 (email + linkedinUrl + githubUrl)
- [ ] `tests/components/ContactHUD.test.js` — verifica CON-03: 3 links + rel + href
- [ ] `tests/components/Chapter3Content.test.js` — verifica CON-01/02: bio + cards visibles
- [ ] `tests/components/ProjectCard.test.js` — verifica render con shape mínimo D3-03
- [ ] `tests/seo/head-tags.test.js` — verifica `@unhead/vue` wiring: `useHead` called, og meta present, hreflang, JSON-LD script
- [ ] `tests/assets/bust-naming.test.js` — verifica existencia de `ch{N}-bust.png` en `public/assets/` (smoke post-art-wave)
- [ ] Extender `tests/i18n/parity.test.js` (existente) para cubrir las keys nuevas `bio.*`, `projects.*`, `seo.*`, `contact.*` (probablemente automático con `import.meta.glob` ya existente — verificar)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Avatar bust se ve como Rafael (no humano genérico) en los 7 chapters | ART-01 | Pixel art perception requiere juicio humano | Navegar ch0→ch6, verificar que el bust en cada chapter se reconoce como la misma persona envejeciendo |
| OG preview real en LinkedIn / Slack / Twitter | SEO-01 | Bots sociales no se mockean; requiere shared URL post-deploy | Después de Phase 6 deploy, compartir URL pública y verificar preview con título + descripción + screenshot correctos por locale |
| JSON-LD Person valida en Google Rich Results Test | SEO-02 | Google validator es servicio externo | Pegar URL post-deploy en `search.google.com/test/rich-results` y verificar Person schema parseado correctamente |
| Nested scroll-snap + overflow-y: auto en ch3 mobile (375×667) | D3-12 (research item) | Behavior cross-browser; iOS Safari deferred | DevTools mobile emulator + Chrome + Firefox: navegar ch3 con texto ES (más largo), verificar scroll interno + snap al siguiente chapter funciona sin fricción |
| Skeumorphic Web 2.0 cards se ven era-auténticos (no parodia) | D3-11 | Juicio estético perceptual | Visual review post-build de cards ch3 contra refs Web 2.0 era 2010-2013 |
| Hreflang switching SEO behavior | SEO-04 | Google needs server response; SPA toggles via URL or localStorage | Verificar `<link rel="alternate" hreflang="es"|"en">` presente + URLs locale-aware en `<head>` post-build |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (8 new test files listed above)
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set en frontmatter (post plan-checker PASS)

**Approval:** pending — planner fills tasks + plan-checker verifies Dimension 8 coverage.

---

## Notes

- **CONTENT-CHECKLIST gating:** Validaciones de bio + proyectos + paletas requieren input de Rafael primero. El planner emite `checkpoint:human-input` antes de autorizar waves que dependen del contenido textual.
- **Avatar bust generation (D3-05/06/07/08):** Es una wave de arte (pixelforge-mcp + Adobe MCP), no test programmatic puro. La verificación es smoke (archivos existen) + manual (verifican consistencia personaje).
- **Threat model integration:** T-CON-03 (open redirect en URLs contact), T-SEO-INJ (JSON-LD injection — mitigado por static schema), T-ART-PRIV (foto privada en build — mitigado por `.gitignore` Pitfall 5). Ver `03-RESEARCH.md §Dominio de Seguridad`.
