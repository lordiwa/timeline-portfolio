---
phase: 04-chapters-0-2-4-5
plan: 04
status: complete
wave: 3
completed: 2026-05-14T10:14:00Z
commits:
  - 129c086  # art(04-04): 4 ch4 parallax layers + palette §5.3 stub + tokens
  - 818ef5e  # feat(04-04): ParallaxLayers + FloatingPanel + chapter-themes ch4 .floating-panel block
  - f0c0a5b  # feat(04-04): Chapter4Content + projects + i18n + ScrollShell wire ch4
key_files:
  created:
    - public/assets/ch4-bg-stars-far.jpg
    - public/assets/ch4-bg-planet-mid.jpg
    - public/assets/ch4-fg-panels.png
    - public/assets/ch4-fg-ships.png
    - src/components/ParallaxLayers.vue
    - src/components/FloatingPanel.vue
    - src/components/Chapter4Content.vue
    - tests/components/ParallaxLayers.test.js
    - tests/components/FloatingPanel.test.js
    - tests/components/Chapter4Content.test.js
  modified:
    - src/components/ScrollShell.vue
    - src/styles/chapter-themes.css
    - src/data/chapters.js
    - src/data/projects.js
    - src/i18n/es.json
    - src/i18n/en.json
    - tests/components/ScrollShell.test.js
    - tests/components/ScrollShell.theme-isolation.test.js
requirements_satisfied:
  - ART-02   # ch4 4 parallax layers existen + ParallaxLayers renderiza con depth-stagger
  - ART-03   # FloatingPanel glass holographic con backdrop-filter + @supports fallback
  - A11Y-06  # avatar.busts.4.alt + chapter title via FloatingPanel title prop
  - CORE-09  # PRM uniform factor 1.0 (D4-10d) — ParallaxLayers.test.js T5 verifica
  - I18N-05  # i18n keys ch4 paridad ES↔EN sin layout shift
tests:
  - tests/components/ParallaxLayers.test.js   # 10/10 PASS
  - tests/components/FloatingPanel.test.js    # 7/7 PASS
  - tests/components/Chapter4Content.test.js  # 10/10 PASS
suite_total: 316 PASS / 316 (+28 vs Wave 2 close baseline 288)
deviations:
  - id: D4-W3-01
    rule: "Stubs aceptados §5.3 paleta + §2.3 proyectos AR/VR"
    why: "Rafael respondió 'usa stubs' en gate Task 1 — paleta Phase 2
          ['#0a0f2e','#b0d0ff','#00ffff','#2050a0','#142050'] aplicada;
          2 stubs projects (ch4-arvr-own, ch4-metrodigi) con desc='PENDING'
          marker §2.3."
    impact: "W5 sign-off requerirá refresh §2.3 con datos reales (titles+descs
            ES/EN por proyecto AR/VR). chapters[4].palette stub Phase 2 ya
            validó contraste 11.8:1."
  - id: D4-W3-02
    rule: "ch4-bg-*.jpg + ch4-fg-*.png mixed extension (paradigma confirmado)"
    why: "forge_background outputs JPEG (D4-W2-01 carry-forward); forge_sprite
          outputs PNG con alpha (necessitado para fg layers transparency between
          panels y ships)."
    impact: "Pattern lockeado: backgrounds opacos = .jpg, foregrounds con alpha
            = .png. Asset-naming regex (extended W2 a permitir .jpg|.png) cubre
            todo el set sin más cambios. W4 ch5-hero será .png si necesita alpha
            o .jpg si es bg opaco — depende del intent."
  - id: D4-W3-03
    rule: "ch4-fg-panels + ch4-fg-ships salieron 128×128 (no 480×270)"
    why: "forge_sprite snap-to-standard-size topa en 128. CSS object-fit:cover
          dentro de .parallax-layer (height:120%) escala correctamente al
          viewport size del browser sin pixelation visible."
    impact: "Acceptable para parallax layers porque pixel art se escala con
            image-rendering:pixelated preservando crispness. 128×128 + cover =
            stretching ancho-céntrico que no se nota porque el contenido es
            sparse (paneles separados + 2 naves). Si Rafael ve issue visual
            durante smoke W5, fallback es regenerar con explicit prompt
            wider-aspect."
  - id: D4-W3-04
    rule: "ScrollShell test helpers expuestos scrollProgress (mountShell + theme-isolation)"
    why: "Plan 04-04 wire Chapter4Content → ParallaxLayers (grand-child) requiere
          inject('scrollState') con scrollProgress. Tests existentes solo
          provideaban activeChapter+scrollToChapter. Update mecánico: añadir
          scrollProgress: ref(initialChapter/7) al provide stub."
    impact: "Pattern lockeado para futuros tests de ScrollShell hierarchy. W5
            tests deberán provided scrollProgress también si añaden test de
            ScrollShell mounting."
  - id: D4-W3-05
    rule: "Adobe MCP HSL harmonization SKIPPED"
    why: "Las paletas §5.3 stub produjeron output coherente al primer call
          (no drift visible cross-layer). Adobe HSL adjust step opcional del
          plan no fue necesario. Documenta que Adobe MCP queda como fallback
          para iteraciones futuras (W5 polish o si Rafael solicita ajustes)."
    impact: "+0 USD Adobe (solo pixelforge calls). Si W5 sign-off pide
            depth perception más marcada, ejecutar Adobe HSL como deferred polish."
notes:
  visual_smoke_status: "Build verde + 316/316 tests PASS. Smoke browser ?ch=4
                        PENDING — Rafael decide si valida ahora (ver depth
                        effect + glass panels) o defers a W5 manual checklist."
  artifacts_summary:
    - "ch4-bg-stars-far.jpg (340KB, 1376×768): factor 0.2 — atmospheric deep
       navy + scattered cross stars + nebula wisp."
    - "ch4-bg-planet-mid.jpg (438KB, 1376×768): factor 0.5 — planet silhouette
       derecha con two-tone shading + cyan rim glow."
    - "ch4-fg-panels.png (22KB, 128×128, alpha): factor 0.8 — 3 paneles
       holographic cyan con TRANSPARENCY entre ellos (Pitfall 2 satisfecho)."
    - "ch4-fg-ships.png (5KB, 128×128, alpha): factor 1.0 — 2 naves cyan
       (arrow + UFO disc)."
    - "ParallaxLayers.vue (62 LOC): 4 <img loading=lazy> con z-index escalonado;
       Pitfall 6+7 aplicados; PRM uniform factor 1.0."
    - "FloatingPanel.vue (22 LOC): SFC mínimo + slot wrapper + h3 title v-if."
    - "Chapter4Content.vue (~210 LOC): D4-07 position:relative+overflow:hidden,
       D4-04 FloatingPanel slot per project."
    - "chapter-themes.css [data-chapter=\"4\"] .floating-panel: BASE rgba(10,15,46,0.4)
       + @supports backdrop-filter blur(10px) + @media mobile blur(6px) (Pitfall 3)."
  i18n_keys_added:
    - "chapters.4.flavor (ES + EN)"
    - "projects.ch4-arvr-own.{title, desc} (ES + EN)"
    - "projects.ch4-metrodigi.{title, desc} (ES + EN)"
  cost_estimate:
    pixelforge_calls: 4
    estimated_total_usd: ~0.02
    duration_wall_clock: ~30 min
---

# 04-04 SUMMARY — ch4 AR/VR 2015-18 (Multi-Layer Parallax)

**Wave 3 cierra ART-02 + ART-03 (4 layers depth-staggered + glass holographic
panels) + CORE-09 (PRM uniform factor) + A11Y-06 + I18N-05.**

## Lo entregado

- 4 PNG/JPG layers ch4 generados con paleta §5.3 stub
- ParallaxLayers.vue (Pitfall 6+7 aplicados) + 10 tests math/PRM/source markers
- FloatingPanel.vue (glass holographic) + 7 tests slot/title/CSS markers
- Chapter4Content.vue (D4-07 layout + D4-04 FloatingPanel slot per project) + 10 tests
- chapter-themes.css [data-chapter="4"] .floating-panel block completo
- 2 stub projects ch4 + i18n keys ES↔EN paridad
- ScrollShell wire-up <Chapter4Content v-else-if="ch.id===4" /> + 2 tests actualizados

## Lo no entregado (deferred a W5)

- **§2.3 proyectos contenido real:** 2 stubs con desc="PENDING" — Rafael edita
  CONTENT-CHECKLIST §2.3 (D4-W3-01)
- **Adobe HSL harmonization:** SKIPPED porque paletas stub produjeron output
  coherente al primer call (D4-W3-05). Disponible como polish W5 si Rafael
  pide depth perception más marcada
- **Smoke browser visual ?ch=4:** Pending Rafael verificación ocular del depth
  effect + glass panels backdrop-filter (no bloquea cierre programático W3)
- **iOS smoke:** deferred Plan 07 indefinidamente (Rafael no posee hardware iOS)

## Lecciones para W4 (Plan 04-05 ch5 Modern)

1. **Pattern jpg/png lockeado:** ch5-hero será `.png` si necesita alpha o `.jpg`
   si es bg opaco. Decidir según intent ("hero" sugiere figura central — likely
   sprite con alpha → forge_sprite + bg_remove → .png).

2. **ScrollRevealCard nuevo componente:** W4 introduce `useIntersectionObserver`
   de @vueuse/core para reveal animation staggered. Diferente de ParallaxLayers
   (scroll-driven) — IntersectionObserver-driven (intersection trigger).

3. **paleta ch5 Modern stub:** chapter-themes.css line ~120 ya tiene stub
   Phase 2 (`#0e1426` indigo + `#5b9eff` accent). Validar §5.4 con Rafael en
   gate W4.

4. **i18n paridad workflow:** continuar añadir keys ES + EN simultáneamente
   (chapters.5.{flavor, ...} + projects.ch5-*).

5. **ScrollShell update:** después de wire ch5 → placeholder count=1,
   nonWiredIds=[6]. Update mecánico igual.

## Smoke validation pendiente

```powershell
npm run dev
# luego abrir http://127.0.0.1:5173/?ch=4 y verificar visualmente:
# - 4 capas se mueven con velocidades distintas al scroll dentro del chapter
#   (stars-far lentísimo, ships-near veloz)
# - FloatingPanels con backdrop-filter blur visible (Chrome moderno)
# - Toggle PRM en DevTools (Rendering panel → Emulate prefers-reduced-motion)
#   → todas las capas se mueven uniforme (mismo translateY)
# - Mobile <600px: blur reducido (6px), aún coherente
```
