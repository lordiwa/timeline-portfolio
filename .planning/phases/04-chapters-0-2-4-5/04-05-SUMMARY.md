---
phase: 04-chapters-0-2-4-5
plan: 05
status: complete
wave: 4
completed: 2026-05-14T10:26:00Z
commits:
  - a0b437c  # art(04-05): ch5-hero.jpg + palette §5.4 stub + --bg-image
  - c7a7eb2  # feat(04-05): ScrollRevealCard + chapter-themes ch5 .scroll-reveal-card + project-card flat
  - e059580  # feat(04-05): Chapter5Content + projects ch5 + i18n + ScrollShell wire ch5
key_files:
  created:
    - public/assets/ch5-hero.jpg
    - src/components/ScrollRevealCard.vue
    - src/components/Chapter5Content.vue
    - tests/components/ScrollRevealCard.test.js
    - tests/components/Chapter5Content.test.js
  modified:
    - src/components/ScrollShell.vue
    - src/styles/chapter-themes.css
    - src/data/chapters.js
    - src/data/projects.js
    - src/i18n/es.json
    - src/i18n/en.json
    - tests/components/ScrollShell.test.js
requirements_satisfied:
  - ART-02   # ch5-hero.jpg pixel-art existe + --bg-image wired
  - A11Y-06  # avatar.busts.5.alt + chapter title in ScrollRevealCard header
  - CORE-09  # PRM defensive double (JS init isRevealed=true + CSS @media instant render)
  - I18N-05  # i18n keys ch5 paridad ES↔EN sin layout shift
tests:
  - tests/components/ScrollRevealCard.test.js  # 9/9 PASS
  - tests/components/Chapter5Content.test.js   # 10/10 PASS
suite_total: 334 PASS / 334 (+18 vs Wave 3 close baseline 316)
deviations:
  - id: D4-W4-01
    rule: "Stubs aceptados §5.4 paleta + §2.4 proyectos Modern (5 items)"
    why: "Rafael respondió 'usa stubs' en gate Task 1 — paleta Phase 2 stub
          ['#ffffff','#1a1a2e','#6366f1','#e2e8f0','#f5f7fb'] aplicada;
          5 stubs projects (ch5-{bairesdev,number8,vivoenvivo,rocketsnail,remoose})
          con desc='PENDING' marker §2.4 + roles/techStacks comunes."
    impact: "W5 sign-off requerirá refresh §2.4 con datos reales (titles+descs
            ES/EN + techStacks reales por empresa). chapters[5].palette stub
            Phase 2 ya validó contraste 14.2:1 (white #ffffff sobre dark #1a1a2e)."
  - id: D4-W4-02
    rule: "ch5-hero.jpg 246KB (1376×768) — DEFERRED downscale a W5 polish"
    why: "Mismo issue D4-W2-03 carry-forward: forge_background outputs alta-res
          alta-byte; pixelforge.optimize_sprite topa en 128px. CSS background-size
          cover renderiza correctamente al viewport size del browser."
    impact: "Cumulative bg payload Phase 4 = ch2-bg.jpg (627KB) + ch4-bg-stars-far.jpg
            (340KB) + ch4-bg-planet-mid.jpg (438KB) + ch5-hero.jpg (246KB) = ~1.65MB
            total backgrounds. W5 deberá downscale TODOS antes de Phase 6 deploy
            (target ≤80KB cada uno via Adobe MCP upload+downscale o sharp install)."
  - id: D4-W4-03
    rule: "ScrollShell.test.js update placeholder count 2→1"
    why: "Plan 04-05 wire ch5 → solo ch6 mantiene placeholder. Update mecánico
          igual que W2 (4→3) y W3 (3→2)."
    impact: "Pattern lockeado por wave. Phase 5 wire ch6 → count=0 (no más placeholder)
            + ScrollShell.test.js T4 retornará 0 .era-title elements."
notes:
  visual_smoke_status: "Build verde + 334/334 tests PASS. Smoke browser ?ch=5
                        PENDING — Rafael decide si valida ahora (ver staggered
                        reveal cards + bg modern minimal + PRM toggle) o defers
                        a W5 manual checklist."
  artifacts_summary:
    - "ch5-hero.jpg (246KB, 1376×768): Modern SaaS minimal — white dominante
       + indigo abstract circles + dark navy bottom horizon. forge_background
       output JPEG (D4-W2-01 pattern)."
    - "ScrollRevealCard.vue (45 LOC): vueuse useIntersectionObserver +
       PRM defensive double JS+CSS. Single-shot reveal con stop()."
    - "Chapter5Content.vue (~180 LOC): 1 ScrollRevealCard header (delay=0) +
       N projects ScrollRevealCard staggered delay=100*(idx+1)."
    - "chapter-themes.css [data-chapter=\"5\"]: --bg-image: url(/assets/ch5-hero.jpg)
       + .scroll-reveal-card BASE+--revealed+@media PRM + .project-card variant
       modern flat (white surface + light box-shadow + Inter font + no skeumorphic)."
  i18n_keys_added:
    - "chapters.5.flavor (ES + EN)"
    - "projects.ch5-bairesdev.{title, desc} (ES + EN)"
    - "projects.ch5-number8.{title, desc} (ES + EN)"
    - "projects.ch5-vivoenvivo.{title, desc} (ES + EN)"
    - "projects.ch5-rocketsnail.{title, desc} (ES + EN)"
    - "projects.ch5-remoose.{title, desc} (ES + EN)"
  staggered_delays:
    "ScrollRevealCard delays per index": "header=0, project[0]=100ms, project[1]=200ms, project[2]=300ms, project[3]=400ms, project[4]=500ms"
    "Total cascade duration": "500ms (last card revealed) + 300ms transition = ~800ms total reveal sequence"
    "PRM behavior": "todos los cards instant render desde mount (PRM defensive JS init=true + CSS @media transition:none)"
  cost_estimate:
    pixelforge_calls: 1
    estimated_total_usd: ~0.005
    duration_wall_clock: ~25 min
---

# 04-05 SUMMARY — ch5 Modern 2022-23 (ScrollRevealCard Staggered)

**Wave 4 cierra ART-02 + CORE-09 (PRM defensive double) + A11Y-06 + I18N-05.**

## Lo entregado

- `public/assets/ch5-hero.jpg` (modern SaaS minimal pixel-art)
- ScrollRevealCard.vue (vueuse IO-driven, single-shot, PRM defensive JS+CSS) + 9 tests
- Chapter5Content.vue (header + 5 projects staggered) + 10 tests
- chapter-themes.css [data-chapter="5"] tokens completos + .scroll-reveal-card +
  .project-card modern flat + .project-card-link text-only modern
- 5 stubs projects ch5 + 12 i18n keys ES↔EN paridad
- ScrollShell wire-up <Chapter5Content v-else-if="ch.id===5" />
- ScrollShell.test.js T4+T3 actualizados

## Lo no entregado (deferred a W5)

- **§2.4 proyectos contenido real:** 5 stubs con desc="PENDING" — Rafael edita
  CONTENT-CHECKLIST §2.4 (D4-W4-01)
- **bg downscale TODOS los chapters Phase 4 a ≤80KB:** cumulative ~1.65MB
  bg payload (D4-W4-02 + D4-W2-03 carry-forward). Mandatory antes Phase 6 deploy
- **Smoke browser visual ?ch=5:** Pending Rafael verificación ocular (staggered
  reveal + PRM toggle DevTools)
- **iOS smoke:** deferred Plan 07 indefinidamente

## Lecciones para W5 (Plan 04-06 cierre Phase 4)

1. **Cierre integration tests:** W5 entrega theme-bleed integration test +
   layout-shift test + 04-MANUAL-CHECKLIST.md + 04-VERIFICATION.md.
   Pattern conocido: clonar Phase 2 W5 manual-checklist structure + verificar
   theme isolation cross-chapters cuando Rafael scrollea de ch0→ch5.

2. **Bg downscale es bloqueador W5/Phase 6:** ch2-bg.jpg + ch4-bg-*.jpg + ch5-hero.jpg
   suman ~1.65MB. 3 opciones para resolver (decide W5):
   (a) Adobe MCP upload + image_crop_and_resize + download — cleanest pero
       requiere ciclo upload/download por archivo
   (b) Install sharp temporalmente — más simple, downscale local
   (c) System ImageMagick — assumes presente en Win11

3. **i18n alt-text refresh A11Y-06:** ya están todos los avatar.busts.N.alt
   placeholders Phase 1; W5 §8.2 pide refresh con era-accurate copy
   (RAFAEL-driven content + ratificación).

4. **§5.6 paleta humana update (D4-W0-03 carry-forward):** override eye color
   verde sobre brown hazel — W5 actualiza CONTENT-CHECKLIST §5.6 + UI-SPEC §7.

5. **ScrollShell.test.js placeholder count 1→0:** Phase 5 wire ch6, eliminar
   placeholder por completo.

## Smoke validation pendiente

```powershell
npm run dev
# luego abrir http://127.0.0.1:5173/?ch=5 y verificar visualmente:
# - Background pixel-art ch5-hero modern minimal
# - Header ScrollRevealCard aparece con fade+slide-in al entrar viewport
# - 5 cards aparecen staggered (delay 100ms, 200ms, ..., 500ms)
# - Toggle ES↔EN funcional
# - DevTools Rendering → Emulate prefers-reduced-motion → cards instant render
#   sin animation (PRM defensive double activo)
```
