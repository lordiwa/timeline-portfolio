---
name: project-phase-5-visual-review-pending
description: Phase 5 cerrada PASS-with-observations 2026-05-14; visual review cross-chapter pendiente (ch3+ se ve roto según Rafael).
metadata: 
  node_type: memory
  type: project
  originSessionId: 12ecb221-ea5c-4124-9ef0-bc4f0ec91ee9
---

Phase 5 ejecutada 2026-05-14 con 6/6 plans + 424/424 tests GREEN + build PASS, **pero Rafael reportó visual error**: "el diseño en general de todo el sitio a partir de ch3 se ve roto o mal hecho o no hay nada como en el de phaser. ya salió hay que arreglar igual visualmente". Phaser sale visible en ch6 pero hay regresiones visuales en varios chapters anteriores.

**Why:** los tests del workflow son source-regex + jsdom — verifican contratos de código y bridge names, NO render real. Pasaron 424/424 mientras el render visual tenía issues. Generator self-evaluation blind spot clásico de Anthropic harness research, aplicable a este proyecto (Phaser/CSS multi-chapter complejo). 28 commits Phase 5 cambiaron: chapter-themes.css (+295 líneas, mostly `[data-chapter="6"]` scoped), Chapter6Content.vue (nuevo), ProjectOverlay.vue (nuevo + reglas globales `.project-overlay` fixed-z50), ScrollShell.vue (+4 líneas Chapter6Content wire), data/i18n aditivos.

**How to apply:**
- Cuando inicie nueva sesión y Rafael diga "arreglar visualmente" o similar: arrancar por preguntarle qué chapter específico se ve mal + screenshot/console errors antes de tocar nada (memoria [[feedback_verify-before-suggest]]).
- Auditar cada `src/components/Chapter{N}Content.vue` + el `[data-chapter="N"]` block en chapter-themes.css contra el intent original (revisar SUMMARY.md de su Phase).
- Hipótesis primarias a chequear:
  1. ProjectOverlay rule `.project-overlay { position:fixed }` sin v-if guard CSS — el componente sí tiene `v-if="activeProject"` defensivo pero si el v-if falla, el modal pintaría sobre todo el sitio. Verificar.
  2. CSS @layer components reordering — Phase 5 añadió mucho dentro de `@layer components`; alguna cascada pudo cambiar.
  3. `--c-bg`/`--c-fg` token shift en ch6 podría sangrar si BackgroundLayers o ScrollShell `var(--c-bg)` está leyendo el activeChapter incorrectamente.
  4. Chapter6Content.vue monta `watch(activeChapter, immediate:true)` — si el ResizeObserver dispara crashes en ch3-5 (game.value null pero observer activo en document.documentElement), podría romper rendering. Hay null-guard `if (!game.value) return` así que probablemente no, pero verificar.
- Opciones de routing: (a) nueva phase "Visual Polish & Chapter Review" planeada con `/gsd-spec-phase` + `/gsd-discuss-phase`, o (b) batch de gap-closure plans 06-XX usando `/gsd-execute-phase 5 --gaps-only` tras crear los plans manualmente.
- Lazy chunk Phaser 341 KB gzip vs target 200 KB W3 también deferred (carry-forward Phase 6 deploy budget).
- §10 formal sign-off del `05-MANUAL-CHECKLIST.md` también pendiente — Rafael puede firmarlo cuando quiera independiente de los fixes visuales.

Sesión 2026-05-14 termina con 31 commits en master desde `5383823`. Suite 424/424. Phase 5 ROADMAP=[~]Closed PASS-with-observations + STATE Deferred Items actualizados.
