---
phase: 04-chapters-0-2-4-5
plan: 03
status: complete
wave: 2
completed: 2026-05-14T09:13:00Z
commits:
  - a073a32  # art(04-03): ch2-bg.jpg + palette §5.1 stub + --bg-image declaration
  - 4cce03f  # feat(04-03): ch2 Flash era — FlashBanner + Chapter2Content + projects + i18n + ScrollShell wire
key_files:
  created:
    - public/assets/ch2-bg.jpg
    - src/components/FlashBanner.vue
    - src/components/Chapter2Content.vue
    - tests/components/FlashBanner.test.js
    - tests/components/Chapter2Content.test.js
  modified:
    - src/components/ScrollShell.vue
    - src/styles/chapter-themes.css
    - src/data/chapters.js
    - src/data/projects.js
    - src/i18n/es.json
    - src/i18n/en.json
    - tests/components/ScrollShell.test.js
    - tests/assets/asset-naming.test.js
requirements_satisfied:
  - ART-02   # ch2 background pixel-art existe + --bg-image wired
  - A11Y-06  # avatar.busts.2.alt + bannerTitle/bannerSubtitle alt-text wireup
  - I18N-05  # i18n keys ch2 paridad ES↔EN sin layout shift (Verdana font igual ambos locales)
tests:
  - tests/components/FlashBanner.test.js  # 10/10 PASS (T1 DOM + T2 i18n + T3 skeumorphic CSS + T4 chrome dots)
  - tests/components/Chapter2Content.test.js  # 14/14 PASS (T1-T7)
suite_total: 288 PASS / 288 (+24 vs Wave 0 close baseline 264)
deviations:
  - id: D4-W2-01
    rule: "ch2-bg.jpg en lugar de ch2-bg.png (extension change)"
    why: "pixelforge.forge_background outputs JPEG bytes (signature FFD8FFE0)
          aunque el outputPath llamado fue .png. Renombrar a .jpg refleja el
          formato real, evita download fake-PNG, y permite mejor compresión
          para bg opacos full-frame (no requiere alpha). Test asset-naming
          actualizado para permitir (.png|.jpg)."
    impact: "Plan original asume ch2-bg.png en chapter-themes.css. Cambio
            propagado: chapter-themes.css declara url('/assets/ch2-bg.jpg'),
            asset-naming regex extendido. Mismo patrón aplicará para ch4-bg-*
            (W3) y otros backgrounds opacos."
  - id: D4-W2-02
    rule: "Stubs aceptados para §5.1 paleta + §2.1 proyectos"
    why: "Rafael respondió 'usa stubs' en gate Task 1 — paleta Phase 2 stub
          ['#2a1a4a','#e0c0ff','#ff8800','#8060c0','#ffaa00'] aplicada verbatim;
          3 stub projects (ch2-bluelizard/matte/joju) con desc='PENDING' marker.
          El plan contemplaba este fallback explícitamente."
    impact: "Cierre W5 requerirá refresh §2.1 con datos reales (titles + descs
            ES/EN por proyecto Flash era). chapters[2].palette usa stub Phase 2
            que ya validó contraste 12.6:1 en Phase 2 W3 — sin riesgo a11y."
  - id: D4-W2-03
    rule: "ch2-bg.jpg 627KB (1376×768) — DEFERRED downscale a W5 polish"
    why: "pixelforge.forge_background outputs imagen alta-res (1376×768)
          mientras el viewport pixel-art objetivo es 480×270. optimize_sprite
          tiene ceiling 128px, no puede downscale a 480. Adobe MCP requiere
          upload (overhead). Pragmatic: deferred a W5 + dejar nota en
          MANUAL-CHECKLIST."
    impact: "Performance budget: 627KB extra carga en ch2 — aceptable para dev,
            mandatory fix W5 antes de Phase 6 deploy. CSS background-size cover
            renderiza correctamente al viewport size del browser. Workaround
            options para W5: (a) Adobe MCP upload+downscale+download, (b)
            instalar sharp temporalmente, (c) downloadr manual via system
            ImageMagick."
  - id: D4-W2-04
    rule: "ScrollShell.test.js T3+T4 actualizados (count placeholder 4→3)"
    why: "Plan 04-03 wire ch2 — los tests existentes asumían ch2 caía en
          placeholder. Update mecánico: nonWiredIds 2,4,5,6 → 4,5,6 +
          placeholder count 4 → 3."
    impact: "Pattern recurrente: cada wave que wire un chapter actualiza este
            test. W3 (ch4) → nonWiredIds 5,6, count=2. W4 (ch5) → nonWiredIds 6,
            count=1. Phase 5 ch6 → count=0 (no más placeholders)."
notes:
  visual_smoke_status: "Build verde + 288/288 tests PASS. Smoke browser
                        ?ch=2 PENDING — Rafael decide si valida ahora o
                        defers a W5 manual checklist (no bloquea cierre W2)."
  artifacts_summary:
    - "ch2-bg.jpg: Flash era 2009 background (browser chrome retro IE/Firefox 3
       + orange→purple banner gradient + glossy Web 2.0 buttons + vector
       decorative shapes). Visual capturó intent §Pattern 5 W2."
    - "FlashBanner.vue: 26 LOC (script + template; CSS externalizado convención
       Phase 3). 10/10 tests PASS."
    - "Chapter2Content.vue: 165 LOC (template + style scoped layout-only +
       D3-09 Opción A heredado + D3-12 mobile heredado + FlashBanner embed +
       ch2-flavor entre bio y projects). 14/14 tests PASS."
    - "chapter-themes.css: +90 LOC en @layer components (.flash-banner +
       .flash-banner-chrome + .flash-banner-title + .flash-banner-subtitle +
       .project-card variant ch2 + .project-card-title variant + .project-card-link
       variant)."
  i18n_keys_added:
    - "chapters.2.flavor (ES + EN)"
    - "chapters.2.bannerTitle (ES + EN)"
    - "chapters.2.bannerSubtitle (ES + EN — mismo string ambos: 'BlueLizard / Matte CG / Joju Games' nombres propios)"
    - "projects.ch2-bluelizard.{title, desc} (ES + EN)"
    - "projects.ch2-matte.{title, desc} (ES + EN)"
    - "projects.ch2-joju.{title, desc} (ES + EN)"
  cost_estimate:
    pixelforge_calls: 1
    estimated_total_usd: ~0.005
    duration_wall_clock: ~25 min
---

# 04-03 SUMMARY — ch2 Flash era 2009

**Wave 2 cierra ART-02 (ch2 background pixel-art) + I18N-05 (paridad ch2 sin
layout shift) + A11Y-06 (alt-text wireup ch2 banner+avatar).**

## Lo entregado

- `public/assets/ch2-bg.jpg` (1376×768, ~627KB — defer downscale a W5)
- `src/components/FlashBanner.vue` (header skeumorphic Flash era — chrome dots
  mac-style + orange→deep gradient + emboss text-shadow)
- `src/components/Chapter2Content.vue` (wrapper layout 2-col D3-09 + D3-12
  mobile + FlashBanner embed + bio + flavor + projects filtrados ch2)
- `chapter-themes.css [data-chapter="2"]` extensions: --bg-image, .flash-banner
  block + variant .project-card ch2 (orange-purple gradient)
- 3 stubs proyectos en `projects.js`: ch2-bluelizard, ch2-matte, ch2-joju
- i18n keys ES↔EN paridad: chapters.2.{flavor, bannerTitle, bannerSubtitle} +
  projects.ch2-{bluelizard,matte,joju}.{title, desc}
- ScrollShell wire-up `<Chapter2Content v-else-if="ch.id === 2" />`
- 2 test files nuevos (24 tests netos) + 2 tests existentes actualizados

## Lo no entregado (deferred a W5)

- **ch2-bg.jpg downscale 480×270:** pixelforge.optimize_sprite topa en 128px;
  necesita Adobe MCP upload/download cycle o sharp install (D4-W2-03)
- **§2.1 proyectos contenido real:** 3 stubs con desc="PENDING" — Rafael edita
  CONTENT-CHECKLIST §2.1 con titles/descs ES/EN reales (D4-W2-02)
- **Smoke browser visual ?ch=2:** Pending Rafael verificación ocular (no bloquea
  cierre programático W2 — build verde + 288/288 tests PASS lo cubre
  funcionalmente)

## Lecciones para W3 (Plan 04-04 ch4 AR/VR multi-layer)

1. **forge_background output is JPEG:** todos los backgrounds opacos usar `.jpg`
   extension nativa. Para ch4 esto aplica a `ch4-bg-stars-far.jpg` y
   `ch4-bg-planet-mid.jpg` (los `fg-*` deben ser PNG con alpha).

2. **Naming dual `.png|.jpg`:** asset-naming test ya soporta ambos. ch4-fg-panels
   (alpha-needed) → png, ch4-fg-ships (alpha-needed) → png, ch4-bg-* (opacos) → jpg.

3. **Multi-layer parallax:** generar 4 layers separados, NO en un solo call.
   Cada call captura mejor un slice (stars-far es minimalista, planet-mid es
   focal, panels glass holográficos, ships sprites).

4. **CSS layering en chapter-themes:** convención Phase 3-4 = era-styling vive
   en `chapter-themes.css @layer components` bajo `[data-chapter="N"]`. Layout
   SFC-local en `<style scoped>`. Aplicar mismo patrón a ParallaxLayers.vue +
   FloatingPanel.vue.

5. **i18n paridad workflow:** parity test catches missing keys cross-locale.
   Añadir keys EN siempre que se añadan ES (W3 keys: chapters.4.{flavor,
   bannerTitle, bannerSubtitle, ...} si aplican + projects.ch4-*).

6. **ScrollShell.test.js placeholder count:** después de wire ch4 → count=2,
   nonWiredIds=[5,6]. Update mecánico igual que W2.

## Smoke validation pendiente

```powershell
npm run dev
# luego abrir http://127.0.0.1:5173/?ch=2 — confirmar visualmente:
# - Banner Flash naranja con chrome dots top-left
# - Background ch2-bg.jpg crossfade aplicado al entrar
# - Project cards orange-purple gradient skeumorphic
# - Toggle ES↔EN funcional
```
