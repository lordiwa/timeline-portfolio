# Phase 4: Chapters 0-2 + 4-5 — Research

**Investigado:** 2026-05-13
**Dominio:** Multi-layer parallax sin libs · pixelforge batch consistency · era-authentic CSS components (terminal/marquee/Flash/glass/scroll-reveal) · A11Y-06 alt-text bilingüe · scroll-driven animations cross-browser
**Confianza global:** HIGH para stack base (todo verificado contra el código existente y npm); MEDIUM-HIGH para parallax pattern (verificado contra Chrome dev blog + Builder.io 2026); MEDIUM para pixelforge `references:` con foto JPG (no pixel-art) como anchor — el comportamiento exacto se valida en W0 con un primer bust de prueba.

---

## Resumen

Phase 4 cierra el arco visual de 5 chapters: ch0 (terminal CRT 1995) + ch1 (HTML 90s 2001) son **CSS-only puros** (ART-07 locked); ch2 (Flash 2009), ch4 (AR/VR 2015) y ch5 (Modern 2022) reciben **pixel art era-auténtico** (ART-02 backgrounds, ART-03 parallax + paneles ch4). Adicionalmente, W0 consolida el **batch 7 busts** (D4-01) usando las 6 fotos de referencia ya entregadas por Rafael (D4-03 mapping). El cross-cutting más delicado es PRM (D4-10): cada chapter tiene una rama explícita de "motion reducido" derivada del principio rector D-06 de Phase 1 — interaction-derived ≤150ms permitido, decorative OFF, área grande crossfade sutil permitido.

Cinco hallazgos críticos: **(1)** `<marquee>` sigue funcionando en Chrome/Firefox/Safari/iOS Safari como vestigio legacy, **pero el atributo `behavior` y `direction` no son controlables por CSS animation-play-state** — la única vía PRM real es swap a `<span>` estático vía `v-if` (D4-05 ya lo lockea, research confirma). **(2)** Multi-layer parallax con `translateY(scrollProgress * factor)` corre a 60fps en compositor thread; mobile soporta **3 capas cómodamente, 4 con cuidado** (debajo de "5 layers" budget de Chrome dev). Mantener cada capa con `will-change: transform` y composited (no `top/left`). **(3)** CSS scroll-driven animations (`scroll-timeline`, `view-timeline`) por fin tienen soporte cross-browser en 2026 (Chrome 115+, Safari 26, Firefox tras flag), pero **NO los adoptamos en Phase 4** — el patrón IntersectionObserver + transform JS es más portable, ya está cableado vía `useScrollState.scrollProgress` (Phase 1 W2), y `useScrollState` ya fue verificado en producción Phase 3. **(4)** Pixelforge `references:` acepta paths locales para visual consistency — sirve para pasar `2011.jpg` como anchor del personaje, pero como NO está oficialmente documentado para fotos no-pixel-art (solo "sprites existentes" en el README), **W0 ejecuta un bust de prueba primero** (ch3 anchor near-2011) y valida que el output es coherente con la foto antes de batch-ear los 6 restantes. **(5)** El gate de naming `ch{N}-{descriptor}.png` (SC-2) se valida con un test arquitectural sobre `public/assets/` (similar a `tests/seo/head-tags.test.js` pero sobre filesystem).

**Recomendación primaria:** Plan en **6 waves estrictamente secuenciales** como D4-08 lockea (W0 avatars → W1 ch0+ch1 paralelo CSS → W2 ch2 → W3 ch4 multi-layer → W4 ch5 → W5 integración + a11y). Wave 0 lleva un sub-paso de validación con bust de prueba (D4-03 anchor ch3 con 2011.jpg) antes de batch-ear los 6 restantes. Cada wave de art (W2/W3/W4) tiene **TWO sub-stages**: (a) `artist-creator` genera assets; (b) `frontend-dev` cablea components + tema en `chapter-themes.css` + datos en `chapters.js`. PRM heuristic (D4-10) se aplica como una rama `v-if="!prefersReduced"` o `@media (prefers-reduced-motion: reduce)` por chapter — documentada explícitamente en cada component.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Avatar Pipeline**
- D4-01: Batch 7 busts completo en Phase 4 Wave 0 (consolida Plan 03-05 deferred de Phase 3, incluye ch3 y ch6).
- D4-02: Fotos de referencia viven en `public/references/` + entry en `.gitignore`. Vite las sirve en dev local. **Caveat Phase 6:** firebase.json `ignore` glob para `public/references/` o deploy script borra `dist/references/` antes de subir.
- D4-03: Foto→bust por proximidad de edad (Rafael nacido 1984) — ch0 (1995, ~11): aging-down de 2011.jpg (~27); ch1 (2001, ~17): aging-down de 2011.jpg (~27); ch2 (2009, ~25): 2011.jpg leve aging-down; ch3 (2013, ~29): anchor 2011 + slight aging-up; ch4 (2015-18, ~32): 2016.jpg (~32) anchor casi exacto; ch5 (2022-23, ~38): 2022.jpeg (~38) anchor exacto; ch6 (2026, ~42): 2026.jpg (~42) anchor exacto. 2019.jpg (~35) + 2024.jpg (~40) como identity-anchors auxiliares en cada call.

**Era-Authentic UI Components**
- D4-04: High fidelity per chapter — components dedicados: `TerminalScroll.vue` (ch0), `MarqueeBanner.vue` (ch1), `FlashBanner.vue` (ch2), `FloatingPanel.vue` (ch4), `ParallaxLayers.vue` (ch4 wrapper 3-4 capas), `ScrollRevealCard.vue` (ch5). ProjectCard shared con variants `[data-chapter="N"] .project-card` per era.
- D4-05: `<marquee>` real deprecated en ch1 a propósito (era-authenticity). Bajo PRM: swap a `<span>` estático centrado vía `v-if` en template. Flavor text NO crítico (bio/proyectos/contacto persistente accesibles por otros componentes).

**Pixel Art Background Strategy**
- D4-06: Ch2 flat 1 capa `ch2-bg.png` (`forge_background`) / ch4 multi-layer 3-4 (`ch4-bg-stars-far.png`, `ch4-bg-planet-mid.png`, `ch4-fg-panels.png`, `ch4-fg-ships.png`) / ch5 hero 1 capa `ch5-hero.png` (`forge_background`). Total: ~5-6 assets nuevos. `optimize_sprite` downscale nearest-neighbor antes de commit. Adobe MCP para crop/HSL/expand si necesita.
- D4-07: Ch4 parallax DENTRO de `<section data-chapter="4">` (4 divs absolute positioned con `translateY`), NO en BackgroundLayers global (D2-04 es solo para crossfade era→era de una imagen).

**Wave Strategy**
- D4-08: W0 avatars → W1 ch0+ch1 paralelo CSS → W2 ch2 → W3 ch4 → W4 ch5 → W5 integración.
- D4-09: checkpoint:human-input per wave (NO hard gate global). W0 gate §5.6 + fotos; W2 gate §2.1 + §5.1; W3 gate §2.3 + §5.3; W4 gate §2.4 + §5.4; W1 SIN gate.

**Reduced Motion Policy (cross-cutting Phase 1 D-03 heredada)**
- D4-10: PRM heuristic per chapter — ch0 cursor parpadeante off; ch1 marquee→span estático + starfield estático; ch4 parallax todas las capas factor 1.0 (sin diferencial); ch5 scroll-reveal instant render; avatar swap ya instant bajo PRM (Phase 1).

**A11Y-06 Alt Text Authoring**
- D4-11: Claude deriva drafts era-accurate ES + EN; Rafael ratifica en W5 manual checklist. Tono: ES "Rafael a los X años frente a [contexto]" / EN "Rafael at X in front of [context]".

### Claude's Discretion

- Ch1 starfield implementation: CSS radial-gradient repetido vs canvas 2D minimal. **Recommended CSS-only.**
- Ch4 parallax scroll-progress source: `useScrollState.scrollProgress` (Phase 1 W2) vs IntersectionObserver per section. **Recommended scrollProgress global** (ya cableado en App.vue via provide).
- Pixelforge palette governance: D3-06/D3-07 ya lockean — `chapters[N].palette` array replica §5 humano + cada call pasa `palette: chapter.palette` explícito.
- Adobe MCP post-process per asset según necesidad.
- Ship sprites count en ch4: 1, 2 ó 3 naves. **Recommended 2.**
- Order generación batch 7 busts W0: secuencial con identity-anchors. **Recommended ch3-anchor primero (test validation), después batch resto.**
- iOS smoke test Phase 4: Plan 07 Phase 1 deferred sigue siendo bloqueador. Phase 4 NO añade nuevos gates iOS pero features sensibles a Safari (marquee, parallax, scroll-reveal, backdrop-filter) heredan riesgo. Mitigaciones preventivas en W5.

### Deferred Ideas (OUT OF SCOPE)

- Ch6 escena Phaser + ship animation + planet click bridges (Phase 5).
- Mantra easter egg ch6 "And always show a smile" (Phase 5).
- iOS smoke test confirmatorio (deferred Phase 1 Plan 07).
- Deploy + firebase.json + cache headers (Phase 6).
- Era-authentic content forms beyond cards (v2 EAP-01).
- Tercer idioma PT-BR/FR (v2 I18N3-01).
- Replan ch3 con proyectos reales (si Rafael completa §2.2 — opcional fold-in W5).
- Bento / glassmorphism / custom cursors / dark-light / Lenis (OUT OF SCOPE permanente).
- ProjectCard hover lift en mobile (Phase 3 deferred touch polish).
- CSS scroll-driven animations API native (`scroll-timeline`/`view-timeline`) — NO se adopta en Phase 4 (ver §State of the Art).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Descripción | Soporte en research |
|----|-------------|---------------------|
| ART-02 | 5 fondos full-frame (chapters 2-6) generados con `forge_background` sin bg removal | Pattern 5 (pixelforge background protocol) + W2/W3/W4 prompt structure §Code Examples |
| ART-03 | Elementos ambientales chapter 4 (AR/VR era): paneles flotantes, parallax layers de profundidad | Pattern 1 (multi-layer parallax sin libs) + Pattern 7 (FloatingPanel backdrop-filter) + D4-07 |
| ART-04 | Elementos ambientales chapter 6 (Phaser): caveat — ART-04 contenido es Phase 5; ch6-bust SÍ en Phase 4 W0 (D4-01) | Pattern 4 (pixelforge bust batch — ch6 incluido) |
| ART-07 | Chapters 0-1 cero pixel art (HTML/CSS puro) | Pattern 2 (TerminalScroll CSS-only) + Pattern 3 (MarqueeBanner + starfield CSS-only) — sin llamadas a pixelforge para fondos ch0/ch1 |
| A11Y-06 | Alt text en avatar busts con descripción era-accurate en ambos idiomas | Pattern 8 (A11Y-06 alt-text template + i18n parity test extension) |
| CORE-09 (cross-cutting) | prefers-reduced-motion respetado global | D4-10 PRM heuristic per chapter + Pattern 1/2/3/6 cada uno con su branch PRM documentado |
| THM-04 (cross-cutting) | No theme bleed durante snap transitions | Pattern 9 (theme isolation con parallax activo + scroll-reveal) |
| I18N-05 (cross-cutting) | Layout testeado con ambos idiomas (ES ~20-30% más largo que EN) | Pattern 10 (i18n bulk add 5 chapters × N keys) |
</phase_requirements>

---

## Architectural Responsibility Map

| Capacidad | Tier primario | Tier secundario | Justificación |
|-----------|---------------|-----------------|---------------|
| Ch0 terminal scroll + cursor parpadeante | `TerminalScroll.vue` (CSS-only animation) | `chapter-themes.css [data-chapter="0"]` (tokens) | CSS-only puro (ART-07); no JS state machine; PRM via `@media` |
| Ch1 marquee bilingue + starfield | `MarqueeBanner.vue` (template branch v-if PRM) | `chapter-themes.css [data-chapter="1"]` | `<marquee>` deprecated real (D4-05); PRM swap a `<span>` vía Vue template (NO via CSS animation-play-state — no aplica al tag legacy) |
| Ch2 flash banner full-frame | `FlashBanner.vue` (skeumorphic CSS) + asset `ch2-bg.png` (pixelforge) | BackgroundLayers (D2-04 crossfade vía `--bg-image`) | 1 capa full-frame opaca → `forge_background`; Bg consume `--bg-image` del [data-chapter="2"] block |
| Ch4 multi-layer parallax | `ParallaxLayers.vue` (4 divs absolute + `transform: translateY`) | `useScrollState.scrollProgress` (Phase 1 W2 inject) + `usePRM` | Self-contained en `<section data-chapter="4">` (D4-07); NO en BackgroundLayers; PRM branch JS-side aplica factor 1.0 a todas las capas |
| Ch4 floating glass panels | `FloatingPanel.vue` (backdrop-filter blur + border `--c-accent`) | `chapter-themes.css [data-chapter="4"]` | Backdrop-filter con fallback `background-color` sólido si no soporta (mobile/Safari < 17 ya tiene support — caniuse 92%) |
| Ch4 ship sprites | Asset `ch4-fg-ships.png` (pixelforge `forge_sprite` con alpha) o capa full-frame opaca | Adobe MCP `image_remove_background` si bg quedó | Constraint NO character animation (CLAUDE.md §6.4): naves estáticas o movimiento simple via CSS `translate` continuo |
| Ch5 hero pixel art | Asset `ch5-hero.png` (pixelforge `forge_background`) | BackgroundLayers (D2-04 vía `--bg-image`) | 1 capa full-frame; mismo path que ch2 |
| Ch5 scroll-reveal cards | `ScrollRevealCard.vue` (IntersectionObserver wrapper) | `usePRM` (PRM branch: instant render) | Único IO por chapter para todos los cards; PRM rama: setear `opacity: 1` + `transform: none` desde el inicio |
| Avatar busts batch (7) | `artist-creator` agent → pixelforge `forge_sprite` con `references:` + `palette:` | Adobe MCP post-process (crop, palette adjust) | D4-03 mapping; W0 valida ch3 anchor primero antes del batch |
| A11Y-06 alt-text bilingüe | `src/i18n/{es,en}.json` keys `avatar.busts.N.alt` | `tests/i18n/parity.test.js` (ya existe) | Test parity ya enforza paridad; Phase 4 W5 refina contenido era-accurate |
| Theme isolation con parallax/scroll-reveal | `<section :data-chapter="N">` (cada section es boundary) | `useBackgroundMorph` (D2-04 — solo crossfade era→era de bg-image) | Parallax y scroll-reveal viven DENTRO de su section, no se escapan al snap container porque transforms son local-scope CSS |
| Asset naming gate | `tests/assets/asset-naming.test.js` (nuevo W0) | filesystem `public/assets/` | Test arquitectural lista `public/assets/*.png` y verifica regex `ch[0-6]-[a-z-]+\.png` |

---

## Stack Estándar

### Core — librerías a instalar en Phase 4

**Ninguna.** Phase 4 no añade dependencias nuevas — todo el stack necesario está cableado desde Phase 1-3:

| Librería existente | Versión actual | Uso en Phase 4 |
|--------------------|----------------|----------------|
| `vue` | `^3.5.0` | Composition API + `defineAsyncComponent` si se necesita lazy load |
| `vue-i18n` | `^11.4.2` | `t('chapters.N.flavor')`, `t('avatar.busts.N.alt')`, `t('projects.{id}.{title,desc}')` |
| `@vueuse/core` | `^14.3.0` [VERIFIED: `npm view @vueuse/core version` → 14.3.0] | `useIntersectionObserver` para `ScrollRevealCard.vue` |
| `@unhead/vue` | `^1.11.20` | Sin cambios — App.vue ya cableado |
| `@fontsource/*` | varios | Las 6 fonts era-auténticas YA self-hosted Phase 2 W4 (VT323/Comic Neue/Verdana-Trebuchet/Lobster/Audiowide/Inter Variable/Press Start 2P) |
| `vitest` + `@vue/test-utils` | `^4.1.6` / `^2.4.10` | Tests architectural + component (incluye fs.readFileSync sobre fuentes Vue) |
| `jsdom` | `^29.1.1` | Already setup en tests/setup.js (mocks IntersectionObserver, ResizeObserver, matchMedia) |

**Sin instalación nueva.** Verificado: `package.json` no requiere additions para Phase 4. [VERIFIED: package.json source 2026-05-13]

### No usar (rechazado explícitamente)

| Alternativa | Razón |
|-------------|-------|
| GSAP / Lenis / Locomotive / AOS / Motion for Vue | OUT OF SCOPE permanente (REQUIREMENTS.md §Out of Scope). Phase 1 D-01..D-06 ya documentó la mecánica scroll nativa. |
| `vue3-parallaxy` / `vue-parallax` / `@parallaxy/vue` | Add weight + dependency churn. Patrón con `translateY` + `useScrollState.scrollProgress` (Phase 1) es ~30 LOC. |
| CSS `scroll-timeline` / `view-timeline` (native scroll-driven) | Soporte 2026 OK (Chrome 115+, Safari 26, Firefox flag) PERO requiere fallback para Firefox stable → maintenance overhead. `useScrollState.scrollProgress` ya cableado, verificado Phase 1+3, portable a TODOS los browsers. **Diferido a v2 si emerge presión.** [CITED: caniuse.com/?search=animation-timeline] |
| `vue-intersection-observer` npm package | `useIntersectionObserver` de @vueuse/core ya está disponible (14.3.0). Cero peso adicional. |
| Pinia / Vue Router / `@vueuse/head` (deprecated → unhead) | OUT OF SCOPE permanente. |

---

## Architecture Patterns

### Diagrama de flujo de datos — Phase 4

```
Rafael (CONTENT-CHECKLIST + 6 fotos en public/references/)
  ├── §5.1 paleta ch2 ──────────→ src/data/chapters.js [chapter id:2].palette + chapter-themes.css [data-chapter="2"]
  ├── §5.3 paleta ch4 ──────────→ src/data/chapters.js [chapter id:4].palette + chapter-themes.css [data-chapter="4"]
  ├── §5.4 paleta ch5 ──────────→ src/data/chapters.js [chapter id:5].palette + chapter-themes.css [data-chapter="5"]
  ├── §5.6 paleta avatar humana → input pixelforge palette param (W0)
  ├── §2.1 proyectos ch2 (1-3) ─→ src/data/projects.js + src/i18n/{es,en}.json projects.{id}.{title,desc}
  ├── §2.3 proyectos ch4 (1-3) ─→ idem
  ├── §2.4 proyectos ch5 (1-3) ─→ idem
  ├── 2011.jpg / 2016.jpg / 2019.jpg / 2022.jpeg / 2024.jpg / 2026.jpg
  │   └── public/references/ (gitignored — privacy gate D4-02)
  └── ratifica W5 alt-text bilingüe (avatar.busts.N.alt)

artist-creator agent (W0) — pixelforge batch 7 busts
  ┌──────────────────────────────────────────────────────────────────────┐
  │ Step 0 — Validation: forge_sprite(ch3-bust) con references:           │
  │   ["public/references/2011.jpg"], palette: chapter.palette,           │
  │   verify output coherent con foto antes de batch                      │
  │ Step 1..7 — secuencial con identity-anchors:                          │
  │   ch0 → references: [2011.jpg, ch3-bust.png], DIFF aging-down ~11     │
  │   ch1 → references: [2011.jpg, ch3-bust.png], DIFF teen ~17           │
  │   ch2 → references: [2011.jpg, ch3-bust.png], DIFF ~25 Flash era      │
  │   ch3 (ya hecho en Step 0 — anchor ~29 = 2011 +slight aging-up)       │
  │   ch4 → references: [2016.jpg, ch3-bust.png, 2019.jpg], DIFF ~32      │
  │   ch5 → references: [2022.jpeg, 2019.jpg, 2024.jpg], DIFF ~38         │
  │   ch6 → references: [2026.jpg, 2024.jpg], DIFF ~42 distinguished      │
  │ Adobe MCP post: crop 80×96 (or 96×96) + palette HSL adjust si drift   │
  │ Outputs → public/assets/ch{N}-bust.png (committed)                    │
  └──────────────────────────────────────────────────────────────────────┘

artist-creator agent (W2) — pixelforge ch2 bg
  forge_background("Flash 2009 era, vector banner+browser chrome+gradients",
                   palette: chapters[2].palette, outputPath: ch2-bg.png)
  Adobe MCP: image_crop_and_resize 480×270 (or 960×540 → optimize_sprite 480×270)

artist-creator agent (W3) — pixelforge ch4 multi-layer (4 calls)
  forge_background(stars-far,    palette: chapters[4].palette) → ch4-bg-stars-far.png
  forge_background(planet-mid,   palette: chapters[4].palette) → ch4-bg-planet-mid.png
  forge_background(panels-fg,    palette: chapters[4].palette) → ch4-fg-panels.png
  forge_sprite(ships,            palette: chapters[4].palette) → ch4-fg-ships.png
                                                                + process_sprite(bg_remove)
  Adobe MCP per layer: image_adjust_hsl (paleta harmony) + image_crop_and_resize 480×270

artist-creator agent (W4) — pixelforge ch5 hero
  forge_background("Modern 2022 minimal, abstract gradient",
                   palette: chapters[5].palette) → ch5-hero.png

frontend-dev agent (W1) — ch0+ch1 paralelo
  ┌─ src/components/TerminalScroll.vue (ART-07 CSS-only)  ←─ chapter-themes.css [data-chapter="0"]
  └─ src/components/MarqueeBanner.vue  (ART-07 CSS-only)  ←─ chapter-themes.css [data-chapter="1"]
  Insertados en ScrollShell.vue como <Chapter0Content>/<Chapter1Content> v-if="ch.id === N"

frontend-dev agent (W2/W3/W4) — wire components
  ┌─ Chapter2Content.vue (FlashBanner + project cards skeumorphic Flash variant)
  ├─ Chapter4Content.vue (ParallaxLayers + FloatingPanel + project cards glass variant)
  └─ Chapter5Content.vue (ScrollRevealCard + project cards modern flat variant)

frontend-dev agent (W5) — integración
  src/data/projects.js — añade items ch2/ch4/ch5
  src/i18n/{es,en}.json — añade keys flavor + projects + alt-text refined
  tests/ — adds: tests/components/Chapter{0,1,2,4,5}Content.test.js
                 tests/components/ParallaxLayers.test.js
                 tests/components/ScrollRevealCard.test.js
                 tests/assets/asset-naming.test.js
                 tests/components/MarqueeBanner.test.js (incluye PRM branch swap test)
  Rafael firma 04-MANUAL-CHECKLIST.md verdict PASS

ScrollShell.vue — reemplazo de placeholder genérico
  ANTES: <div v-else class="chapter-placeholder">{{ ch.year }} · {{ ch.era }}</div>
  DESPUÉS:
    <Chapter0Content v-if="ch.id === 0" />
    <Chapter1Content v-else-if="ch.id === 1" />
    <Chapter2Content v-else-if="ch.id === 2" />
    <Chapter3Content v-else-if="ch.id === 3" />  (ya existe)
    <Chapter4Content v-else-if="ch.id === 4" />
    <Chapter5Content v-else-if="ch.id === 5" />
    <div v-else class="chapter-placeholder">...</div>  (solo ch6 placeholder)
```

### Estructura de archivos nuevos en Phase 4

```
src/
├── components/
│   ├── Chapter0Content.vue        ← layout ch0 + TerminalScroll embed
│   ├── Chapter1Content.vue        ← layout ch1 + MarqueeBanner embed
│   ├── Chapter2Content.vue        ← layout ch2 + FlashBanner embed
│   ├── Chapter4Content.vue        ← layout ch4 + ParallaxLayers + FloatingPanel embeds
│   ├── Chapter5Content.vue        ← layout ch5 + ScrollRevealCard embeds
│   ├── TerminalScroll.vue         ← ch0 — terminal CRT con cursor parpadeante
│   ├── MarqueeBanner.vue          ← ch1 — <marquee> + starfield CSS + GIFs construction
│   ├── FlashBanner.vue            ← ch2 — banner skeumorphic Flash
│   ├── ParallaxLayers.vue         ← ch4 — wrapper 4 capas absolute con translateY
│   ├── FloatingPanel.vue          ← ch4 — vidrio holográfico backdrop-filter
│   └── ScrollRevealCard.vue       ← ch5 — IO wrapper fade+slide-in
public/
├── assets/
│   ├── ch0-bust.png               ← W0 (D4-01 batch 7 busts)
│   ├── ch1-bust.png
│   ├── ch2-bust.png
│   ├── ch2-bg.png                 ← W2 (ART-02)
│   ├── ch3-bust.png
│   ├── ch4-bust.png
│   ├── ch4-bg-stars-far.png       ← W3 (ART-03)
│   ├── ch4-bg-planet-mid.png      ← W3
│   ├── ch4-fg-panels.png          ← W3
│   ├── ch4-fg-ships.png           ← W3
│   ├── ch5-bust.png
│   ├── ch5-hero.png               ← W4 (ART-02)
│   ├── ch6-bust.png               ← W0 (Phase 5 lo hereda)
│   ├── hero/                      (vacío — reservado Phase 5)
│   └── parallax/                  (vacío — reservado Phase 5)
└── references/                    ← .gitignored (D4-02)
    ├── 2011.jpg ... 2026.jpg
tests/
├── assets/
│   └── asset-naming.test.js       ← W0 — regex ch{0-6}-{descriptor}.png
├── components/
│   ├── Chapter0Content.test.js    ← W1
│   ├── Chapter1Content.test.js    ← W1 (incluye PRM branch marquee→span)
│   ├── Chapter2Content.test.js    ← W2
│   ├── Chapter4Content.test.js    ← W3
│   ├── Chapter5Content.test.js    ← W4
│   ├── TerminalScroll.test.js     ← W1
│   ├── MarqueeBanner.test.js      ← W1 (PRM swap + starfield off)
│   ├── FlashBanner.test.js        ← W2
│   ├── ParallaxLayers.test.js     ← W3 (translateY computation + PRM factor=1)
│   ├── FloatingPanel.test.js      ← W3
│   └── ScrollRevealCard.test.js   ← W4 (IO mock + PRM instant render)
```

### Pattern 1: Multi-Layer Parallax sin libs externas (ART-03, D4-07)

**Qué hace:** 4 capas absolute positioned dentro de `<section data-chapter="4">` cada una con `transform: translateY(scrollProgress * factorN * sectionHeight)`. Compositor-thread, 60fps target, mobile-friendly hasta 4 capas. Bajo PRM, todas las capas a factor 1.0 (sin diferencial = scroll natural).

**Por qué este approach (vs CSS scroll-timeline):** `useScrollState.scrollProgress` ya cableado y verificado Phase 1 W2. Portable a TODOS los browsers (incluyendo Firefox stable que aún tiene `scroll-timeline` behind a flag en 2026). `transform: translateY` corre en compositor thread (no triggers layout/paint). [VERIFIED: Chrome dev blog "Performant Parallaxing", Builder.io 2026 guide]

**Source code:**

```vue
<!-- src/components/ParallaxLayers.vue -->
<script setup>
import { inject, computed } from 'vue'

const { scrollProgress } = inject('scrollState')
const { prefersReduced } = inject('prm')

// 4 capas con factor escalonado. Bajo PRM, factor uniforme 1.0 (sin parallax diferencial).
// D4-06 layer naming: stars-far / planet-mid / panels-fg / ships-near (factor ascendente
// crea profundidad espacial — capas lejanas se mueven menos que las cercanas).
const layers = [
  { src: '/assets/ch4-bg-stars-far.png',  factor: 0.2, name: 'stars' },
  { src: '/assets/ch4-bg-planet-mid.png', factor: 0.5, name: 'planet' },
  { src: '/assets/ch4-fg-panels.png',     factor: 0.8, name: 'panels' },
  { src: '/assets/ch4-fg-ships.png',      factor: 1.0, name: 'ships' },
]

// scrollProgress (Phase 1 W2) es global 0..1 sobre el shell completo.
// El offset translateY se calcula como (scrollProgress - 0.5) * factor * 100 (vh units)
// — usar (-0.5) crea movimiento bidireccional alrededor del centro del chapter
// (la sensación de pasar a través de las capas).
function getTransform(factor) {
  if (prefersReduced.value) {
    // D4-10: bajo PRM, factor 1.0 uniforme = scroll natural sin depth effect
    return `translateY(${(scrollProgress.value - 0.5) * 100}vh)`
  }
  return `translateY(${(scrollProgress.value - 0.5) * factor * 100}vh)`
}
</script>

<template>
  <div class="parallax-layers" aria-hidden="true">
    <div
      v-for="layer in layers"
      :key="layer.name"
      :class="['parallax-layer', `parallax-layer--${layer.name}`]"
      :style="{
        backgroundImage: `url('${layer.src}')`,
        transform: getTransform(layer.factor),
      }"
    ></div>
  </div>
</template>

<style scoped>
/* aria-hidden + pointer-events:none — capas decorativas, screen readers no anuncian.
   Click pasa al contenido del FloatingPanel encima. */
.parallax-layers {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.parallax-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  /* will-change: transform — hint al compositor (Chrome dev blog).
     SOLO en estas 4 capas, no global — will-change agresivo perjudica si está en todo. */
  will-change: transform;
}
/* Las 4 capas con z-index escalonado para layering visual.
   Ships near tiene z-index más alto pero igual está bajo el FloatingPanel del Chapter4Content (z=2). */
.parallax-layer--stars  { z-index: 0; }
.parallax-layer--planet { z-index: 1; }
.parallax-layer--panels { z-index: 2; }
.parallax-layer--ships  { z-index: 3; }
</style>
```

**Performance budget Phase 4 (verificado):**
- Mobile soporta 3 capas cómodamente, 4 con cuidado (Builder.io 2026: "mobile devices struggle beyond 3 layers"). **4 layers ch4 está en el límite** — si W3 visual review reporta jank mobile, fallback a 3 layers (omitir ships o consolidar panels + ships en 1 capa). Documentar como fallback option en plan.
- Cada PNG 480×270 nearest-neighbor pixelated ≈ 30-100KB. Total ch4 ~200-400KB assets.
- LCP impact: ch3 sigue siendo default landing (`activeChapter: 3` Phase 1 PATTERN B); ch4 assets son loaded `loading="lazy"` (cuando el browser entra al viewport). **Pero CSS `background-image` no respeta `loading="lazy"`** — para mitigar, usar `<img>` posicionados absolute en lugar de background-image, O preload solo cuando `activeChapter >= 3` (a la izquierda del ch4).

[VERIFIED: Chrome dev blog "Performant Parallaxing" + Builder.io 2026 guide + caniuse `will-change` Universal]

### Pattern 2: TerminalScroll ch0 — cursor parpadeante CSS-only + PRM (ART-07)

**Qué hace:** Output simulado tipo CRT terminal con cursor blinking via CSS `steps()` animation. Content reveal staggered con `animation-delay`. Bajo PRM, sin parpadeo + render instantáneo del content completo.

**Source code:**

```vue
<!-- src/components/TerminalScroll.vue -->
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
// El contenido viene del i18n para bilingual. Los "comandos" son flavor text.
// Keys nuevas Phase 4: ch0.terminal.{prompt,line1,line2,line3,line4}
const lines = [
  { key: 'ch0.terminal.line1', delay: 0 },
  { key: 'ch0.terminal.line2', delay: 1.5 },
  { key: 'ch0.terminal.line3', delay: 3 },
  { key: 'ch0.terminal.line4', delay: 4.5 },
]
</script>

<template>
  <div class="terminal-scroll" role="presentation">
    <pre class="terminal-output">
<span v-for="(line, idx) in lines" :key="idx" class="terminal-line" :style="{ animationDelay: line.delay + 's' }">
{{ t(line.key) }}
</span><span class="terminal-cursor" aria-hidden="true">█</span>
    </pre>
  </div>
</template>

<style scoped>
.terminal-scroll {
  font-family: 'VT323', ui-monospace, monospace;  /* Ya self-hosted Phase 2 W4 */
  color: var(--c-fg);    /* #00ff41 phosphor green del [data-chapter="0"] */
  background: var(--c-bg); /* #000000 */
  padding: var(--sp-lg);
}
.terminal-output {
  font-size: clamp(1rem, 2vw, 1.4rem);
  line-height: 1.4;
  margin: 0;
}
.terminal-line {
  display: block;
  opacity: 0;
  animation: terminal-reveal 0.4s steps(20, end) forwards;
}
@keyframes terminal-reveal {
  to { opacity: 1; }
}
/* Cursor parpadeante steps(2) — clásico CRT square cursor */
.terminal-cursor {
  display: inline-block;
  animation: terminal-cursor-blink 1s steps(2) infinite;
}
@keyframes terminal-cursor-blink {
  50% { opacity: 0; }
}
/* D4-10 PRM branch — sin parpadeo, sin staggered reveal */
@media (prefers-reduced-motion: reduce) {
  .terminal-line  { opacity: 1; animation: none; }
  .terminal-cursor { animation: none; opacity: 1; }
}
</style>
```

[VERIFIED: VT323 ya self-hosted Phase 2 W4 confirmado en package.json]

### Pattern 3: MarqueeBanner ch1 — `<marquee>` real + starfield CSS (ART-07, D4-05)

**Qué hace:** `<marquee>` deprecated real con texto bilingüe. Starfield CSS-only via `radial-gradient` repetido. Bajo PRM (D4-10): swap a `<span>` estático centrado vía `v-if` en template (NO via CSS animation-play-state — el atributo `behavior` de `<marquee>` no es CSS animation, no se puede pausar con `animation-play-state`).

**Crítico — por qué v-if y no CSS:**
- `<marquee>` es un tag legacy con scrolling driven by intrinsic browser behavior (no CSS animation).
- `animation-play-state: paused` SOLO afecta `@keyframes` animations; **no afecta a `<marquee>`**.
- La única vía PRM real es: (a) Vue template swap con `v-if`, (b) JS `marquee.stop()` (DOM API legacy), o (c) CSS `transform: none !important` (no funciona — marquee no usa transforms).
- **Recommended (a)** v-if — es declarativo, testeable (snapshot test), y match con el patrón Phase 1 D-04 (instant swap bajo PRM).

[VERIFIED: MDN marquee element deprecated docs + WebSearch 2026 — "marquee tag still works in iOS Safari but deprecated, cannot be controlled via CSS animation-play-state"]

**Source code:**

```vue
<!-- src/components/MarqueeBanner.vue -->
<script setup>
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { prefersReduced } = inject('prm')
// Phase 4 i18n keys nuevas: ch1.marquee.{greeting,construction}
</script>

<template>
  <div class="marquee-banner" :data-prm="prefersReduced ? 'reduce' : 'normal'">
    <!-- D4-10 PRM branch — span estático centrado en lugar de marquee scroll.
         v-if swap es la ÚNICA vía real bajo PRM (CSS animation-play-state no aplica a <marquee>) -->
    <!-- eslint-disable-next-line vue/no-deprecated-html-element-is — D4-05 era-authenticity intentional -->
    <marquee
      v-if="!prefersReduced"
      behavior="scroll"
      direction="left"
      scrollamount="5"
      class="marquee-banner__scroll"
    >
      {{ t('ch1.marquee.greeting') }} ★ {{ t('ch1.marquee.construction') }} ★
    </marquee>
    <span v-else class="marquee-banner__static">
      {{ t('ch1.marquee.greeting') }} — {{ t('ch1.marquee.construction') }}
    </span>

    <!-- Starfield CSS-only — radial-gradient repetido (NO box-shadow — perf reason).
         Bajo PRM: animation: none via media query. -->
    <div class="marquee-banner__starfield" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.marquee-banner {
  font-family: 'Comic Neue', 'Comic Sans MS', cursive;  /* Phase 2 W4 self-hosted */
  background: var(--c-bg);  /* #000080 navy */
  color: var(--c-accent);   /* #ffff00 yellow */
  padding: var(--sp-md);
  position: relative;
  overflow: hidden;
}
.marquee-banner__scroll {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--c-fg);  /* #ff00ff magenta */
}
.marquee-banner__static {
  display: block;
  font-size: 1.2rem;
  text-align: center;
  font-weight: bold;
  color: var(--c-fg);
}
/* Starfield CSS-only — radial-gradient pattern repeated.
   Performance: opacity + transform animation only (NO box-shadow animation, evita repaints).
   2 layers de stars con tamaños diferentes crea pseudo-3D twinkle.  */
.marquee-banner__starfield {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image:
    radial-gradient(2px 2px at 20% 30%, white 50%, transparent 100%),
    radial-gradient(1px 1px at 40% 70%, white 50%, transparent 100%),
    radial-gradient(1.5px 1.5px at 60% 20%, white 50%, transparent 100%),
    radial-gradient(1px 1px at 80% 50%, white 50%, transparent 100%),
    radial-gradient(2px 2px at 10% 80%, #ffffaa 50%, transparent 100%),
    radial-gradient(1px 1px at 50% 50%, white 50%, transparent 100%);
  background-size: 200px 200px;
  background-repeat: repeat;
  animation: starfield-twinkle 4s ease-in-out infinite alternate;
}
@keyframes starfield-twinkle {
  from { opacity: 0.7; }
  to   { opacity: 1.0; }
}
/* D4-10 PRM — starfield estático sin twinkle */
@media (prefers-reduced-motion: reduce) {
  .marquee-banner__starfield { animation: none; opacity: 1; }
}
</style>
```

[VERIFIED: tobiasahlin.com "How to animate box-shadow with silky smooth performance" — avoid box-shadow animation, use opacity/transform only]

### Pattern 4: Pixelforge batch 7 busts con consistencia cross-call (D4-01, D4-03)

**Qué hace:** 7 calls a `forge_sprite` secuenciales con `references:` array conteniendo 1-2 fotos de Rafael + el `ch3-bust.png` ya generado como ancla de personaje bidirectional. `palette:` enforced via `chapters[N].palette` (D3-06 carry-forward).

**Por qué secuencial y no batch único:** pixelforge no garantiza consistencia perfecta cross-call (CLAUDE.md §6.4 documentado). Secuencial permite (a) validar el primer bust antes de batch, (b) re-generar si un bust drifteó, (c) usar el output de un bust como reference del siguiente.

**Por qué ch3 primero (D4-03 mapping):** ch3 está cerca de la edad ~29 (2013 - 1984), foto 2011.jpg (~27) + slight aging-up — el anchor visual más estable. Una vez locked, sirve como reference bidirectional (aging-down para ch0/1/2 y aging-up para ch4/5/6).

**Pre-requisitos antes de ejecutar W0:**
- `chapters[N].palette` poblada para los 7 chapters (§5.6 paleta avatar humana — paleta base skin/hair/clothing).
- 6 fotos en `public/references/` (ya entregadas) + `.gitignore` entry verificado.
- `BASE_PROMPT_AVATAR` template aprobado por planner (D3-07 carry-forward).
- ToolSearch para cargar pixelforge tools (deferred — CLAUDE.md §4.1).

**Source:**

```
BASE_PROMPT_AVATAR (template — planner finaliza con §5.6 humana):
  "pixel art character bust portrait, 16-bit style, [skin tone from §5.6],
   [build, facial features from photo references], warm friendly expression,
   pixelated clean edges, 96x96 px output, transparent background applied,
   consistent character identity — same person aging through different eras"

DIFFS per chapter (D4-03 mapping — Rafael nacido 1984):
  ch0 (1995, ~11): "age ~11 years old, short dark hair, simple childhood
                    clothing (striped t-shirt), wide curious eyes, slight baby face"
  ch1 (2001, ~17): "age ~17 years old, slightly longer hair, casual 2000s
                    teen clothing (band tee or hoodie), faint adolescent features"
  ch2 (2009, ~25): "age ~25 years old, casual programmer clothing 2009 era
                    (graphic tee, jeans), clean shaven or light stubble, young adult"
  ch3 (2013, ~29): "age ~29 years old, semi-professional Web 2.0 era clothing,
                    light beard or clean shaven, confident expression"  ← ANCHOR
  ch4 (2015-18, ~32): "age ~32 years old, professional attire (button-down or polo),
                       short beard, mature expression"
  ch5 (2022-23, ~38): "age ~38 years old, well-groomed beard, modern professional
                       attire"
  ch6 (2026, ~42): "age ~42 years old, distinguished, full beard,
                    confident leadership expression"

EXECUTION FLOW (W0):

Step 0 — Validation bust (ch3 anchor):
  forge_sprite(
    description: BASE_PROMPT_AVATAR + " " + DIFF_ch3,
    background: "sky",        // preset nombrado (NO "black"/"white" — CLAUDE.md §6.2)
    references: ["public/references/2011.jpg"],  // foto principal anchor edad ~27
    palette: chapters[3].palette,   // §5.6 humana
    outputPath: "public/assets/ch3-bust.png",
    size: 96  // pixelforge default
  )
  process_sprite(bg_remove)
  optimize_sprite(96x96)
  Adobe MCP: image_crop_and_resize 96×96 si necesita ajuste

  ★ HUMAN GATE: Rafael revisa visualmente el ch3-bust antes de continuar.
    Si drift de identity (no se parece) → re-prompt con foto adicional como ref
    o ajuste de DIFF_ch3. Re-iterar hasta aprobación.
    Solo después de aprobación: continuar con Step 1.

Step 1 — ch0:
  forge_sprite(
    description: BASE_PROMPT_AVATAR + " " + DIFF_ch0,
    background: "sky",
    references: ["public/references/2011.jpg", "public/assets/ch3-bust.png"],
    palette: chapters[0].palette,  // OJO: ch0 palette es ['#000000', '#00ff41']
                                   // pero la PALETTE del personaje viene de §5.6 humana,
                                   // no de la palette del chapter. Planner clarifica:
                                   // ¿usar chapters[N].palette (chapter ambient) o
                                   // §5.6 paleta humana base?
    outputPath: "public/assets/ch0-bust.png"
  )
  process_sprite(bg_remove) + optimize_sprite + Adobe crop

Steps 2-7: idem con references escalonadas según D4-03.
  ch4 → references: [2016.jpg, ch3-bust.png, 2019.jpg]   (anchor primario + ch3 + auxiliar)
  ch5 → references: [2022.jpeg, 2019.jpg, 2024.jpg]      (anchor + 2 auxiliares)
  ch6 → references: [2026.jpg, 2024.jpg]                  (anchor + auxiliar)
```

**Open Question crítica para el planner — palette mapping ambient vs human:** En CONTEXT.md D3-06/D4-03 dicen "palette: chapter.palette explícito". Pero `chapters[0].palette = ['#000000', '#00ff41']` (terminal CRT) — un bust humano usando esa paleta sería literalmente verde fosforescente. La intención real es:
- **Si pixelforge `palette` constraint la imagen completa:** el bust ch0 sería verde fósforo (no humano) — incoherente.
- **Si pixelforge `palette` constraint solo "color accents":** el bust ch0 usa palette humana §5.6 + algunos accents verdes.

**Recommended interpretation:** `palette` field en `chapters.js` mantiene su rol como **chapter ambient palette** (para backgrounds W2/W3/W4). Para los busts, usar la **paleta humana §5.6** directamente como `palette` argument (la misma para los 7 busts → garantiza consistency de skin/hair/clothing). **Planner valida con Rafael en W0 antes de generar.**

[VERIFIED: pixelforge-mcp README — `references:` parameter; D3-06 chapter.palette explícito; CLAUDE.md §6.2 presets bg nombrados]

[ASSUMED: que pixelforge acepta paths a fotos JPG (no-pixel-art) como `references:` — el README solo documenta "sprites existentes". W0 Step 0 valida empíricamente con ch3-bust + 2011.jpg.]

### Pattern 5: Pixelforge ch2/ch5 backgrounds + ch4 multi-layer (ART-02, ART-03)

**Qué hace:** Backgrounds full-frame opacos con `forge_background` (NO `forge_sprite` — `forge_background` no aplica bg removal, correcto para full-frame opacos según CLAUDE.md §6.3 + Pitfall 3 carry-forward). Ch4 multi-layer son 4 calls separadas (3 backgrounds opacos + 1 sprite con alpha para ships).

**Concrete prompts (planner refina con paletas finales W2/W3/W4):**

```
W2 — ch2-bg.png:
  forge_background(
    description: "pixel art 2009 Flash era banner with vector gradients,
                  glossy buttons, browser chrome (Internet Explorer or Firefox 3 era),
                  retro Web 2.0 aesthetic, solid filled shapes, NO outlines,
                  flat shading, era-authentic 2009 vibe",
    palette: chapters[2].palette,  // §5.1 (skeumorphic purples + orange accents)
    aspect: "16:9",
    outputPath: "public/assets/ch2-bg.png"
  )
  optimize_sprite(size: "480x270", inputPath, outputPath)

W3 — ch4 4 layers:
  forge_background(
    description: "pixel art deep space, distant stars, dark nebula background,
                  solid filled silhouettes, NO outlines, deep blue-black,
                  scattered tiny bright pixels representing far stars",
    palette: chapters[4].palette,  // §5.3 (deep space blues + cyan)
    aspect: "16:9",
    outputPath: "public/assets/ch4-bg-stars-far.png"
  )
  // → far layer, scroll factor 0.2

  forge_background(
    description: "pixel art planet on horizon, large planet/moon silhouette
                  mid-distance, simple two-tone shading, NO surface detail,
                  solid filled curved silhouette",
    palette: chapters[4].palette,
    aspect: "16:9",
    outputPath: "public/assets/ch4-bg-planet-mid.png"
  )
  // → mid layer, scroll factor 0.5

  forge_background(
    description: "pixel art holographic floating panels foreground, semi-translucent
                  cyan glass panels with subtle grid pattern, AR/VR HUD aesthetic,
                  solid filled shapes with thin glow borders",
    palette: chapters[4].palette,
    aspect: "16:9",
    outputPath: "public/assets/ch4-fg-panels.png"
  )
  // → near layer (background), factor 0.8

  forge_sprite(  // ships con alpha para overlay
    description: "pixel art 2 retro spaceships flying through space, side view,
                  solid filled silhouettes with simple shading, NO detailed cockpit
                  windows, NO internal lineart",
    background: "night",  // preset nombrado per CLAUDE.md §6.2
    palette: chapters[4].palette,
    references: ["public/assets/ch4-bg-stars-far.png"],  // ancla de paleta cross-layer
    outputPath: "public/assets/ch4-fg-ships.png"
  )
  process_sprite(bg_remove)  // limpiar el "night" bg → alpha
  optimize_sprite(480x270)
  // → near layer (foreground), factor 1.0

  Adobe MCP per layer:
    image_adjust_hsl(saturation: -X)  // capas lejanas más desaturadas (regla profundidad)
    image_adjust_color_temperature(temperature: -5)  // capas lejanas más frías

W4 — ch5-hero.png:
  forge_background(
    description: "pixel art modern minimal abstract gradient landscape,
                  flat shading, simple geometric shapes, contemporary 2022 aesthetic,
                  NO outlines, solid filled gradient areas",
    palette: chapters[5].palette,  // §5.4 (modern indigo + neutrals)
    aspect: "16:9",
    outputPath: "public/assets/ch5-hero.png"
  )
  optimize_sprite(480x270)
```

**Crítico — capas intermedias parallax (CLAUDE.md §6.1):** Las capas mid y near pueden necesitar transparencias internas si tienen detalles que dejan ver capas detrás. CLAUDE.md §6.1 dice:
- ✅ "solid filled shape, no internal lineart, no outlines, no negative space"
- ❌ "detailed, with visible foliage, with branches"

**Esto NO se aplica a las 4 capas ch4 igual:**
- `stars-far`: capa de fondo opaca, sin necesidad de transparencias internas (sirve como base).
- `planet-mid`: capa opaca cubriendo todo el frame (con planeta en parte central, resto deep space).
- `panels-fg`: paneles **diseñados con transparencias entre ellos** — esta capa SÍ necesita "no internal lineart" + "semi-translucent" coordinado con el "transparent area where the layer-below shows through" — o usar `forge_sprite` con bg removal para esta capa.
- `ships-near`: sprites con alpha (forge_sprite + process_sprite bg_remove).

**Recommended:** `panels-fg` usar `forge_sprite` + process_sprite bg_remove (NO forge_background) para garantizar transparencia entre paneles. Esto cambia D4-06 sutilmente — planner valida en plan.

[VERIFIED: CLAUDE.md §6.1/§6.2/§6.3 + crear-arte-pixelforge.md skill]

### Pattern 6: ScrollRevealCard ch5 — IntersectionObserver wrapper (D4-04)

**Qué hace:** Wrapper que aplica `fade+slide-in` cuando el card entra al viewport. Usa `useIntersectionObserver` de @vueuse/core (ya disponible). Bajo PRM: instant render (no fade, no slide).

**Performance pattern crítico:** un único `IntersectionObserver` por **chapter** (no uno por card) — pasa `entries[]` array al callback y mapeamos a cards. Cleanup automático vía vueuse.

**Source code:**

```vue
<!-- src/components/ScrollRevealCard.vue -->
<script setup>
import { ref, inject, onMounted, onBeforeUnmount } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps({
  threshold: { type: Number, default: 0.15 },
  delay: { type: Number, default: 0 },  // staggered reveal (ms)
})

const { prefersReduced } = inject('prm')
const cardEl = ref(null)
// Si PRM, arranca "isRevealed: true" desde el inicio — no IO trigger
const isRevealed = ref(prefersReduced.value)

const { stop } = useIntersectionObserver(
  cardEl,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !isRevealed.value) {
      setTimeout(() => { isRevealed.value = true }, props.delay)
      stop()  // single-shot reveal, sin re-trigger en scroll up/down
    }
  },
  { threshold: props.threshold }
)

onBeforeUnmount(stop)
</script>

<template>
  <div
    ref="cardEl"
    class="scroll-reveal-card"
    :class="{ 'scroll-reveal-card--revealed': isRevealed }"
  >
    <slot />
  </div>
</template>

<style scoped>
.scroll-reveal-card {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 400ms ease, transform 400ms ease;
}
.scroll-reveal-card--revealed {
  opacity: 1;
  transform: translateY(0);
}
/* D4-10 PRM — instant render, no transition.
   Pero como ya seteamos isRevealed: prefersReduced.value en script,
   este CSS branch garantiza incluso si scroll happens before paint. */
@media (prefers-reduced-motion: reduce) {
  .scroll-reveal-card {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
```

**Browser support 2026:** `IntersectionObserver` es universal (caniuse 99%+). `useIntersectionObserver` cleanup via vueuse maneja el lifecycle. [VERIFIED: vueuse.org useIntersectionObserver docs]

### Pattern 7: FloatingPanel ch4 — backdrop-filter glass (D4-04)

**Qué hace:** Glass holográfico con `backdrop-filter: blur(...)` para vidrio AR/VR. Combinado con multi-layer parallax detrás (Pattern 1).

**Browser support 2026:** caniuse 92%. Safari/iOS desde 9 con `-webkit-` prefix. Safari ≥17 sin prefix. Fallback: `background-color: rgba(...)` sólido si no soporta. [VERIFIED: caniuse css-backdrop-filter]

**Performance overhead:** backdrop-filter trigger compositor work — combinado con 4 parallax layers detrás puede saturar mobile GPU. Mitigación: limitar `backdrop-filter: blur(...)` a ≤ 6px en mobile (`@media (max-width: 599px)`).

**Source code:**

```vue
<!-- src/components/FloatingPanel.vue -->
<script setup>
defineProps({ title: { type: String, default: '' } })
</script>

<template>
  <div class="floating-panel">
    <h3 v-if="title" class="floating-panel__title">{{ title }}</h3>
    <slot />
  </div>
</template>

<style scoped>
.floating-panel {
  position: relative;
  z-index: 4;  /* encima del ParallaxLayers (z-index máximo 3) */
  padding: var(--sp-lg);
  background-color: rgba(10, 15, 46, 0.4);  /* fallback opaco si no soporta backdrop-filter */
  border: 1px solid var(--c-accent);  /* #00ffff cyan del [data-chapter="4"] */
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3),       /* outer glow holographic */
              inset 0 1px 0 rgba(255, 255, 255, 0.1);  /* inner highlight */
  color: var(--c-fg);
  /* backdrop-filter — feature detection via @supports */
}
@supports ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {
  .floating-panel {
    background-color: rgba(10, 15, 46, 0.15);  /* más translúcido cuando hay blur */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);       /* Safari ≤17 prefix */
  }
}
/* Mobile — reducir blur para perf (4 parallax layers + backdrop blur satura GPU) */
@media (max-width: 599px) {
  @supports ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {
    .floating-panel {
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
  }
}
.floating-panel__title {
  font-family: 'Audiowide', 'Eurostile', sans-serif;  /* Phase 2 W4 self-hosted */
  color: var(--c-accent);
  margin: 0 0 var(--sp-sm) 0;
}
</style>
```

### Pattern 8: A11Y-06 alt-text bilingüe era-accurate (A11Y-06, D4-11)

**Qué hace:** Construye alt-text era + edad + contexto visual para los 7 busts en ES + EN. Test parity ya existe (`tests/i18n/parity.test.js` T3 verifica `avatar.busts.N.alt` en ambos archivos).

**Template authoring (Claude deriva drafts, Rafael ratifica W5):**

```javascript
// Patrón: "{Rafael at|a los} {edad}{años|} {en|in} {contexto era}, {detalle visual}"

// ES
{
  "avatar.busts.0.alt": "Rafael a los 10 años en 1995, frente a un monitor CRT con prompt de MS-DOS",
  "avatar.busts.1.alt": "Rafael a los 17 años en 2001, navegando GeoCities en un PC con Windows 98",
  "avatar.busts.2.alt": "Rafael a los 22 años en 2009, programando ActionScript Flash en una laptop",
  "avatar.busts.3.alt": "Rafael a los 26 años en 2013, era Web 2.0 — UX y desarrollo en Pink Parrot",
  "avatar.busts.4.alt": "Rafael a los 30 años en 2015, con cascos VR mostrando ambiente AR/VR",
  "avatar.busts.5.alt": "Rafael a los 36 años en 2022, líder técnico en una scene minimalista modernidad",
  "avatar.busts.6.alt": "Rafael a los 40 años en 2026, mirando hacia adelante, convergencia QA + AI"
}

// EN (paridad enforced)
{
  "avatar.busts.0.alt": "Rafael at 10 in 1995, in front of a CRT monitor with an MS-DOS prompt",
  "avatar.busts.1.alt": "Rafael at 17 in 2001, browsing GeoCities on a Windows 98 PC",
  "avatar.busts.2.alt": "Rafael at 22 in 2009, coding ActionScript Flash on a laptop",
  "avatar.busts.3.alt": "Rafael at 26 in 2013, Web 2.0 era — UX and dev at Pink Parrot",
  "avatar.busts.4.alt": "Rafael at 30 in 2015, wearing a VR headset in an AR/VR environment",
  "avatar.busts.5.alt": "Rafael at 36 in 2022, technical leader in a minimalist modern scene",
  "avatar.busts.6.alt": "Rafael at 40 in 2026, looking forward, QA + AI convergence"
}
```

**Test extension (W5):** Añadir a `tests/i18n/parity.test.js` un T4 que valida que cada `avatar.busts.N.alt` NO contenga "PENDING" o "Placeholder" (los actuales son placeholders W5 los reemplaza). Test guard contra commit accidental de placeholder text.

### Pattern 9: Theme isolation con parallax + scroll-reveal activos (THM-04 carry-forward)

**Qué hace:** Verifica que durante el snap entre ch3↔ch4 o ch4↔ch5, los parallax layers de ch4 y los scroll-reveal cards de ch5 NO "se filtran" visualmente al otro chapter.

**Por qué NO se filtra (mechanism):**
- Cada `<section data-chapter="N">` tiene `overflow: hidden` implícito (snap container es el `.scroll-shell` ancestor).
- `ParallaxLayers.vue` tiene `position: absolute; inset: 0` DENTRO del section → restringido al bounding box del section.
- `ScrollRevealCard.vue` es child del Chapter5Content → DENTRO del section.
- Theme tokens (`--c-bg`, `--c-fg`, etc.) son CSS Custom Props bound a `[data-chapter="N"]` selector — cada section los resuelve independientemente.
- BackgroundLayers global (D2-04) es 2 layers con z-index: -1, crossfade entre eras vía `--bg-image` — NO compite con parallax interno de ch4.

**Test approach (W5):**

```javascript
// tests/components/ScrollShell.theme-isolation-phase4.test.js
// Verifica que durante snap ch4→ch3, los parallax layers no aparecen en ch3's bounding box.
// Mock: scrollState.activeChapter = 4, scrollProgress = 0.5 → ParallaxLayers translateY = 0
// Mock: scrollState.activeChapter = 3 (snap), scrollProgress = 0.4 → componentes ch3 still visible

it('T1 — ch4 ParallaxLayers does not bleed visually into ch3 viewport during snap', () => {
  // Mount ScrollShell with mock scrollState
  // Verify .parallax-layers parent's overflow:hidden contains the layers
  expect(wrapper.find('[data-chapter="4"] .parallax-layers').exists()).toBe(true)
  expect(wrapper.find('[data-chapter="3"] .parallax-layers').exists()).toBe(false)
})

it('T2 — ch5 ScrollRevealCard does not trigger reveal when ch3 is active', () => {
  // IntersectionObserver mocked to never fire when section not in viewport
  // → ScrollRevealCard remains opacity:0 if scroll never reaches ch5
})
```

### Pattern 10: i18n bulk add 5 chapters × N keys (I18N-05 cross-cutting)

**Qué hace:** Estructura jerárquica nueva en `es.json`/`en.json` para 5 chapters × ~5 keys cada uno (flavor, project titles/descs, alt-text refinados, era-specific copy).

**Estructura propuesta:**

```json
{
  "chapters": {
    "0": {
      "title": "Pre-carrera: niñez digital",
      "era": "Terminal",
      "flavor": "1995. Monitor CRT phosphor. Mi primer prompt de comandos."
    },
    "1": {
      "title": "Pre-carrera tardío: HTML 90s",
      "era": "HTML 90s crudo",
      "flavor": "GeoCities, Angelfire, tablas anidadas y marquees por doquier."
    },
    "2": {
      "title": "Flash era: gameplay programmer",
      "era": "Flash",
      "flavor": "ActionScript, vector graphics, banners animados."
    },
    "3": { ... },
    "4": {
      "title": "AR/VR: empresa propia + Metrodigi",
      "era": "AR/VR",
      "flavor": "Capas flotantes, profundidad espacial, AR aplicado a publicidad."
    },
    "5": {
      "title": "Modern: streaming, QA, frontend lead",
      "era": "Modern",
      "flavor": "Streaming deportes, QA al frente, lead frontend en Vue."
    },
    "6": { ... }
  },
  "ch0": {
    "terminal": {
      "line1": "C:\\> whoami",
      "line2": "Rafael Matovelle, 10 years old, 1995",
      "line3": "C:\\> cat about.txt",
      "line4": "Mi primera computadora. Mi primer 'Hello World'."
    }
  },
  "ch1": {
    "marquee": {
      "greeting": "★ Bienvenido a mi página web!! ★",
      "construction": "🚧 ESTE SITIO ESTÁ EN CONSTRUCCIÓN 🚧"
    }
  },
  "projects": {
    "pp1": { ... },           // ch3 ya existe
    "ch2-bluelizard": { "title": "...", "desc": "..." },
    "ch2-matte": { "title": "...", "desc": "..." },
    "ch2-joju": { "title": "...", "desc": "..." },
    "ch4-arvr-company": { "title": "...", "desc": "..." },
    "ch4-metrodigi": { "title": "...", "desc": "..." },
    "ch5-bairesdev": { "title": "...", "desc": "..." },
    "ch5-number8": { "title": "...", "desc": "..." },
    "ch5-vivoenvivo": { "title": "...", "desc": "..." },
    "ch5-rocketsnail": { "title": "...", "desc": "..." },
    "ch5-remoose": { "title": "...", "desc": "..." }
  },
  "avatar": {
    "busts": {
      "0": { "alt": "Rafael a los 10 años en 1995, frente a un monitor CRT con prompt de MS-DOS" },
      "1": { ... },
      ...
    }
  }
}
```

**I18N-05 layout test:** El layout ES corre ~20-30% más largo que EN — terminal scroll ch0, marquee text ch1, flavor text ch2-5, project descs son los puntos de riesgo. Test: mount cada Chapter{N}Content con locale='es' y luego locale='en', snapshot el `.outerHTML.length` (proxy del texto longitud) para detectar overflow visual antes del manual check W5.

### Anti-Patterns a Evitar

- **Usar `box-shadow` para animar starfield twinkle:** `box-shadow` triggers repaint, mata 60fps. Usar `opacity` solo. [VERIFIED: tobiasahlin.com performance guide]
- **`animation-play-state: paused` para pausar `<marquee>`:** No funciona — `<marquee>` no es CSS animation. La única vía PRM es `v-if` swap a `<span>` estático (D4-05). [VERIFIED: MDN marquee deprecated + WebSearch 2026]
- **CSS `scroll-timeline`/`view-timeline` native en Phase 4:** Soporte 2026 OK pero Firefox stable detrás de flag. Diferir a v2 si emerge presión real. `useScrollState.scrollProgress` es portable a TODOS los browsers. [VERIFIED: caniuse animation-timeline]
- **`top`/`left` para parallax:** Triggers layout/paint. Usar `transform: translateY(...)` para correr en compositor thread. [VERIFIED: Chrome dev blog "Performant Parallaxing"]
- **`forge_sprite` con `background: "black"` o `"white"`:** Gemini ignora el color y bg removal falla. Usar presets nombrados. [VERIFIED: CLAUDE.md §6.2]
- **`forge_background` para sprites con alpha (ships):** `forge_background` no aplica bg removal. Para ships con transparencia usar `forge_sprite` + `process_sprite(bg_remove)`. [VERIFIED: CLAUDE.md §6.3]
- **Múltiples `IntersectionObserver` instances (uno por card) en ch5:** Memory leak risk. Single observer per chapter + map entries to cards. [VERIFIED: GitHub issue AnimateItNow#896]
- **`will-change: transform` en TODOS los elementos:** Agresivo perjudica perf. SOLO en las 4 parallax layers ch4. [VERIFIED: MDN will-change docs]
- **Generar character animation con `forge_animation`:** Frames incoherentes. CLAUDE.md §6.4. NO se intenta animar personaje.
- **Backdrop-filter sin `@supports` fallback:** Safari < 17 requiere `-webkit-` prefix; mobile sin GPU adecuado puede no soportar bien. `@supports` + fallback `background-color: rgba(...)` opaco.
- **Bulk add i18n keys sin update parity test:** Cada key en `es.json` MUST tener par en `en.json` o el test parity rompe. Test ya cableado.

---

## No Hand-Roll

| Problema | No construir | Usar en cambio | Por qué |
|----------|-------------|----------------|---------|
| Multi-layer parallax with depth | Custom RAF loop reading `scrollY` listener | `inject('scrollState').scrollProgress` (Phase 1 W2 ya cableado) + CSS `transform: translateY(scrollProgress * factor * 100vh)` | Composable global single source of truth; pause/resume RAF bajo demanda ya implementado |
| IntersectionObserver para scroll-reveal | Custom IO setup por card | `useIntersectionObserver` (@vueuse/core ^14.3.0) | Cleanup automático, evita memory leaks (Issue #896) |
| Bg removal de ships ch4 | Custom canvas image processing | `process_sprite(bg_remove)` (pixelforge) + Adobe MCP `image_remove_background` fallback | Pipeline documentado y verificado Phase 1 |
| Character age morphing 7 busts | Animations / 3D model rig | pixelforge `forge_sprite` + `references:` array + paleta humana §5.6 | pixelforge no soporta animación coherente; única vía estática |
| Alt-text bilingüe parity check | Manual diff scripts | `tests/i18n/parity.test.js` (ya existe Phase 2 W0) | Auto-enforced en cada commit |
| Asset naming validation | grep en CI | `tests/assets/asset-naming.test.js` regex `ch[0-6]-[a-z-]+\.png` | Test arquitectural detecta drift en boot |
| Theme isolation per chapter | Iframe / shadow DOM | `[data-chapter="N"]` selector + CSS Custom Props cascade (Phase 2 D2-06) | Ya implementado y testeado Phase 2 W2 |
| Locale switching for i18n | Manual mutations | `useI18n()` + `locale` ref reactive (Phase 2) | Ya cableado; nuevas keys heredan reactividad |

---

## Pitfalls Comunes

### Pitfall 1: pixelforge palette mapping ambient vs human (W0)

**Qué sale mal:** Si el planner pasa `palette: chapters[0].palette` (que es `['#000000', '#00ff41']` terminal CRT) a `forge_sprite` para generar el bust ch0, pixelforge interpretará que el personaje debe ser **negro y verde fósforo** — no humano. Bust incoherente.

**Por qué ocurre:** `chapters[N].palette` está diseñada para los **backgrounds** (ambient era) — no para los busts humanos. Los busts necesitan la paleta humana base (§5.6 skin/hair/clothing) constante.

**Cómo evitar:** En W0, el `artist-creator` agent NO usa `chapters[N].palette` para los busts. Usa la `paleta humana §5.6` (un único array de 5-8 hex con skin/hair/clothing tones) para los 7 busts. Esto garantiza consistency cross-chapter del personaje.

**Recomendación al planner:** Añadir un campo separado en `chapters.js` o vivir solo en §5.6 humana (no duplicado). **Recommended:** dejar `chapters[N].palette` para backgrounds, y usar la paleta humana §5.6 directamente desde `CONTENT-CHECKLIST.md` en el W0 task description. Documentar explícitamente en el plan W0.

**Señales de alerta:** Bust ch0 generado con colores de terminal CRT en lugar de skin/hair humanos.

### Pitfall 2: `panels-fg` ch4 capa intermedia con outlines genera transparencias falsas

**Qué sale mal:** Si la capa `ch4-fg-panels.png` se genera con `forge_background` (opaca full-frame), los paneles holográficos cubren toda la pantalla — no se ve la capa de planet/stars detrás. Si se genera con `forge_sprite` (alpha) pero con "detailed panels with internal lineart", las transparencias internas dejan ver el planet en zonas incorrectas (rompe la composición espacial).

**Por qué ocurre:** CLAUDE.md §6.1 documenta exactamente esto — capas intermedias necesitan "solid filled shapes, no internal lineart" cuando se quieren transparencias **entre objetos** (no dentro de ellos).

**Cómo evitar:** Para `ch4-fg-panels`, usar `forge_sprite` + `process_sprite(bg_remove)` con prompt explícito: "2-3 floating panels positioned around the frame, transparent space between panels, solid filled glass panels with thin glow borders, NO internal grid pattern, NO detailed UI elements inside panels".

**Señales de alerta:** Panels.png muestra transparencias dentro del panel mismo (el planet se ve "a través" del cristal del panel en lugar de "entre" los paneles).

### Pitfall 3: Multi-layer parallax + backdrop-filter combina overhead mobile

**Qué sale mal:** Ch4 carga 4 parallax layers (`will-change: transform`) + 1-3 FloatingPanel con `backdrop-filter: blur(10px)` — total GPU work satura mobile Snapdragon 7xx y A12 iPhone, jank visible <30fps.

**Por qué ocurre:** Cada `backdrop-filter: blur(N)` triggers compositor work proporcional al área del panel × N². Combinado con 4 transform layers updating cada frame → GPU bottleneck.

**Cómo evitar:**
- Mobile media query: `backdrop-filter: blur(6px)` (vs 10px desktop).
- Si W3 visual review reporta jank, fallback options: (a) reducir parallax a 3 layers, (b) eliminar backdrop-filter en mobile (solo `background-color: rgba(...)`), (c) ambos.
- `will-change: transform` SOLO en las 4 parallax layers, NO en FloatingPanel ni Chapter4Content.

**Señales de alerta:** Mobile devtools FPS counter <40fps en ch4. Visual lag en scroll.

### Pitfall 4: pixelforge no acepta foto JPG como `references:` (W0)

**Qué sale mal:** El planner asume que pixelforge `references:` acepta paths a `public/references/2011.jpg` (foto real no-pixel-art). Si pixelforge solo acepta sprites pre-generados, el batch falla o genera busts sin anchor visual.

**Por qué ocurre:** El README de pixelforge-mcp documenta `references:` como "pass existing sprites to match visual style" — no clarifica si fotos JPG sirven como anchor estilístico.

**Cómo evitar:**
- W0 Step 0 (validation bust ch3): generar el primer bust usando `references: ["public/references/2011.jpg"]` y verificar visualmente que el output es coherente con la foto.
- Si falla: alternative path → describir la foto **verbalmente** en el `description:` ("based on a man in his early 20s, brown hair, slight build, friendly expression") + usar otras referencias auxiliares conocidas como anchors.

**Señales de alerta:** ch3-bust generado en W0 Step 0 no se parece ni remotamente a Rafael; pixelforge devuelve error sobre formato de references.

### Pitfall 5: `<marquee>` PRM swap test requiere mock de `prefersReduced`

**Qué sale mal:** Test `MarqueeBanner.test.js` con `prefersReduced: true` no detecta el swap a `<span>` estático porque el inject no está mockeado.

**Por qué ocurre:** `usePRM` se inyecta via `provide('prm', usePRM())` en App.vue. Los tests aislados de `MarqueeBanner` no tienen ese provide.

**Cómo evitar:** Mock pattern (ya usado en Phase 3 tests):

```javascript
const wrapper = mount(MarqueeBanner, {
  global: {
    provide: {
      prm: { prefersReduced: computed(() => true) }  // o false para test default
    }
  }
})

expect(wrapper.find('marquee').exists()).toBe(false)  // bajo PRM, no hay <marquee>
expect(wrapper.find('.marquee-banner__static').exists()).toBe(true)  // hay <span>
```

**Señales de alerta:** Test pasa con `prefersReduced: true` pero `<marquee>` sigue en DOM (el inject default está cayendo en `prefersReduced: false`).

### Pitfall 6: `scrollProgress` global vs per-section parallax offset

**Qué sale mal:** Si ParallaxLayers usa `scrollProgress` global (0..1 sobre el shell completo de 7 chapters), el offset translateY de las capas ch4 será mismo a chapter 0 (scrollProgress=0) que a chapter 4 (scrollProgress=0.57).

**Por qué ocurre:** `useScrollState.scrollProgress` es global. Pero las 4 capas ch4 solo son visibles cuando `activeChapter === 4` — el cálculo de translateY debe ser relativo al **scroll-progress dentro del chapter 4**, no del shell completo.

**Cómo evitar:** Dos opciones:
- **Opción A (recommended):** Calcular `localProgress` en ParallaxLayers: `localProgress = (scrollProgress * 7) - 4` cuando `activeChapter === 4` (mapear 0..1 global a 0..1 local del ch4). Necesita el `activeChapter` también.
- **Opción B:** Cada section ch4 tiene su propio IntersectionObserver con `threshold: [0, 0.1, 0.2, ..., 1]` que reporta `intersectionRatio` 0..1 directamente. Más reactive pero más memory.

**Recommended Opción A:** `localProgress = clamp((scrollProgress * 7) - 4, 0, 1)`. Si fuera del rango, ParallaxLayers no actualiza (no visible).

**Señales de alerta:** Las parallax capas se mueven en chapter 0 (cuando ch4 no está visible).

### Pitfall 7: `loading="lazy"` no funciona en `background-image` CSS

**Qué sale mal:** Ch4 tiene 4 background-image PNGs (~200-400KB total). Si están declarados via CSS `background-image: url('...')` con `loading="lazy"` esperado, los assets se cargan al boot (no lazy) — afecta LCP.

**Por qué ocurre:** `loading="lazy"` SOLO funciona en `<img>` y `<iframe>` tags, NO en CSS `background-image`. [VERIFIED: MDN loading attribute]

**Cómo evitar:** En `ParallaxLayers.vue`, usar `<img>` posicionados absolute en lugar de `background-image`:

```vue
<div v-for="layer in layers" class="parallax-layer">
  <img :src="layer.src" loading="lazy" alt="" aria-hidden="true" />
</div>
```

Con CSS `.parallax-layer img { width: 100%; height: 100%; object-fit: cover; }`.

O preload solo cuando `activeChapter >= 3` (proximity-based) — más complejo pero más eficaz.

**Señales de alerta:** Network panel muestra ch4 PNGs cargados al boot inicial cuando landing es ch3.

### Pitfall 8: Asset naming drift (SC-2)

**Qué sale mal:** Un commit accidental añade `public/assets/ch4_ships.png` (underscore en lugar de hyphen) o `ch4-bg.png` (descriptor genérico no específico). Test `asset-naming.test.js` no existe → drift llega a producción.

**Por qué ocurre:** ART-05 dicta `ch{N}-{descriptor}[-{variant}].png` pero no hay enforcement automático.

**Cómo evitar:** Test arquitectural W0 (antes de pixel art commits):

```javascript
// tests/assets/asset-naming.test.js
import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ASSET_NAMING_REGEX = /^ch[0-6]-[a-z]+(-[a-z]+)*\.png$/

describe('Asset naming convention (ART-05)', () => {
  it('T1 — todos los .png en public/assets/ matchean ch{N}-{descriptor}[-{variant}].png', () => {
    const assetsDir = resolve(process.cwd(), 'public/assets')
    const files = readdirSync(assetsDir).filter(f => f.endsWith('.png'))
    const invalid = files.filter(f => !ASSET_NAMING_REGEX.test(f))
    expect(invalid).toEqual([])
  })
})
```

Test corre en cada `npm run test:run` — drift detected en CI antes del merge.

**Señales de alerta:** Test rompe en CI por `ch4_ships.png` o similar.

---

## Runtime State Inventory

Phase 4 NO es rename/refactor. Es feature build adding new components + assets. Skip Runtime State Inventory (no applicable to greenfield feature delivery).

---

## Code Examples

### Ejemplo 1: Chapter4Content.vue — ensamble parallax + glass panels

```vue
<!-- src/components/Chapter4Content.vue -->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'
import ParallaxLayers from './ParallaxLayers.vue'
import FloatingPanel from './FloatingPanel.vue'

const { t } = useI18n()
const chapter = chapters[4]
const ch4Projects = computed(() => projects.filter(p => p.chapterEra === 4))
</script>

<template>
  <div class="ch4-layout">
    <!-- Parallax background — z-index 0..3 internamente -->
    <ParallaxLayers />

    <!-- Content overlay — z-index 4+ (encima de parallax) -->
    <div class="ch4-content">
      <FloatingPanel :title="t(chapter.titleKey)">
        <p class="ch4-flavor">{{ t('chapters.4.flavor') }}</p>
        <p class="ch4-bio">{{ t(bio.coreKey) }}</p>
      </FloatingPanel>

      <FloatingPanel v-for="project in ch4Projects" :key="project.id">
        <ProjectCard :project="project" />
      </FloatingPanel>
    </div>
  </div>
</template>

<style scoped>
.ch4-layout {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;  /* contiene ParallaxLayers absolute */
}
.ch4-content {
  position: relative;
  z-index: 4;  /* encima de las parallax layers */
  padding: var(--sp-lg);
  padding-top: calc(96px + var(--sp-lg));  /* espacio para StickyAvatar */
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;  /* permitir scroll interno si content excede viewport (era D3-12 carry pattern) */
}
@media (max-width: 599px) {
  .ch4-content {
    padding: var(--sp-md);
    padding-top: calc(68px + var(--sp-sm));
  }
}
</style>
```

### Ejemplo 2: Chapter5Content.vue con ScrollRevealCard staggered

```vue
<!-- src/components/Chapter5Content.vue -->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'
import ScrollRevealCard from './ScrollRevealCard.vue'

const { t } = useI18n()
const chapter = chapters[5]
const ch5Projects = computed(() => projects.filter(p => p.chapterEra === 5))
</script>

<template>
  <div class="ch5-layout">
    <div class="ch5-content">
      <ScrollRevealCard :threshold="0.2" :delay="0">
        <h1 class="ch5-title">{{ t(chapter.titleKey) }}</h1>
        <p class="ch5-flavor">{{ t('chapters.5.flavor') }}</p>
        <p class="ch5-bio">{{ t(bio.coreKey) }}</p>
      </ScrollRevealCard>

      <ScrollRevealCard
        v-for="(project, idx) in ch5Projects"
        :key="project.id"
        :threshold="0.2"
        :delay="100 * (idx + 1)"
      >
        <ProjectCard :project="project" />
      </ScrollRevealCard>
    </div>
  </div>
</template>

<style scoped>
.ch5-layout {
  width: 100%;
  height: 100%;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  image-rendering: pixelated;
}
.ch5-content {
  padding: var(--sp-lg);
  padding-top: calc(96px + var(--sp-lg));
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-lg);
}
.ch5-title {
  font-family: 'Inter Variable', system-ui, sans-serif;  /* Phase 2 W4 */
  font-size: 2.5rem;
  color: var(--c-fg);
  margin: 0 0 var(--sp-sm) 0;
}
.ch5-flavor {
  font-size: 1.2rem;
  color: var(--c-accent);
  margin: 0 0 var(--sp-md) 0;
}
.ch5-bio {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--c-fg);
}
</style>
```

### Ejemplo 3: Test pattern — ParallaxLayers (translateY computation + PRM)

```javascript
// tests/components/ParallaxLayers.test.js
import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'
import { mount } from '@vue/test-utils'
import ParallaxLayers from '@/components/ParallaxLayers.vue'

function mountParallax({ scrollProgress = 0.5, prefersReduced = false } = {}) {
  return mount(ParallaxLayers, {
    global: {
      provide: {
        scrollState: { scrollProgress: ref(scrollProgress) },
        prm: { prefersReduced: computed(() => prefersReduced) },
      }
    }
  })
}

describe('ParallaxLayers.vue', () => {
  it('T1 — renderiza 4 capas con clases correctas', () => {
    const wrapper = mountParallax()
    expect(wrapper.findAll('.parallax-layer--stars').length).toBe(1)
    expect(wrapper.findAll('.parallax-layer--planet').length).toBe(1)
    expect(wrapper.findAll('.parallax-layer--panels').length).toBe(1)
    expect(wrapper.findAll('.parallax-layer--ships').length).toBe(1)
  })

  it('T2 — scrollProgress 0.5 + no-PRM aplica factor diferencial per layer', () => {
    const wrapper = mountParallax({ scrollProgress: 0.5 })
    // scrollProgress 0.5 → (0.5 - 0.5) = 0 → translateY(0vh) for all layers
    const stars = wrapper.find('.parallax-layer--stars')
    expect(stars.attributes('style')).toContain('translateY(0vh)')
  })

  it('T3 — scrollProgress 0 + no-PRM aplica factor diferencial', () => {
    const wrapper = mountParallax({ scrollProgress: 0 })
    // (0 - 0.5) * factor * 100 = -50 * factor
    const stars = wrapper.find('.parallax-layer--stars')   // factor 0.2 → -10vh
    const ships = wrapper.find('.parallax-layer--ships')    // factor 1.0 → -50vh
    expect(stars.attributes('style')).toContain('translateY(-10vh)')
    expect(ships.attributes('style')).toContain('translateY(-50vh)')
  })

  it('T4 — PRM aplica factor 1.0 uniforme (sin parallax diferencial)', () => {
    const wrapper = mountParallax({ scrollProgress: 0, prefersReduced: true })
    const stars = wrapper.find('.parallax-layer--stars')   // (0-0.5)*100 = -50vh
    const ships = wrapper.find('.parallax-layer--ships')   // mismo -50vh
    expect(stars.attributes('style')).toContain('translateY(-50vh)')
    expect(ships.attributes('style')).toContain('translateY(-50vh)')
  })

  it('T5 — aria-hidden="true" en el wrapper (decorative)', () => {
    const wrapper = mountParallax()
    expect(wrapper.find('.parallax-layers').attributes('aria-hidden')).toBe('true')
  })

  it('T6 — CSS will-change: transform present para compositor hint', () => {
    const wrapper = mountParallax()
    // Verificar source via readFileSync que .parallax-layer tiene will-change
    // (no aplicable a runtime CSS scoped — el test es source-level)
    // Alternative: snapshot test del rendered class names
    expect(wrapper.find('.parallax-layer').exists()).toBe(true)
  })
})
```

---

## Environment Availability

| Dependencia | Requerida por | Disponible | Versión | Fallback |
|-------------|--------------|-----------|---------|----------|
| Node.js | Build, tests | ✓ | v24.14.1 | — |
| npm | Sin instalaciones nuevas Phase 4 | ✓ | incluido | — |
| pixelforge-mcp | W0 batch 7 busts + W2/W3/W4 backgrounds | ⚠ Verificar `/project:verificar-mcps` antes de cada wave de art | nano-banana-2 | Si falla → CLAUDE.md §4.2 instalación limpia |
| Adobe MCP | Post-proceso: crop, palette HSL, bg removal fallback | ⚠ Verificar `adobe_mandatory_init()` | — | Crop manual con Pillow/Sharp Node script si Adobe MCP down |
| 6 fotos referencia | W0 batch busts | ✓ | en `public/references/` | — (D4-02 ya satisfecho) |
| `CONTENT-CHECKLIST.md` §5.6 paleta humana | W0 input pixelforge palette param | ❌ Pendiente Rafael | — | checkpoint:human-input W0 |
| `CONTENT-CHECKLIST.md` §2.1 + §5.1 ch2 | W2 input | ❌ Pendiente | — | checkpoint:human-input W2 |
| `CONTENT-CHECKLIST.md` §2.3 + §5.3 ch4 | W3 input | ❌ Pendiente | — | checkpoint:human-input W3 |
| `CONTENT-CHECKLIST.md` §2.4 + §5.4 ch5 | W4 input | ❌ Pendiente | — | checkpoint:human-input W4 |
| 5 fonts era-auténticas | W1/W2/W3/W4/W5 (consume via chapter-themes.css) | ✓ Self-hosted Phase 2 W4 | varios | — |

**Dependencias bloqueantes sin fallback:**
- §5.6 paleta humana — bloquea W0 inicio
- §5.1/§5.3/§5.4 paletas y §2.1/§2.3/§2.4 proyectos — bloquean W2/W3/W4 respectivamente
- pixelforge MCP funcional — bloquea W0/W2/W3/W4 (sin pixel art generation, las waves de art entran en checkpoint y se ejecuta solo el wiring CSS)

**Dependencias con fallback:**
- Adobe MCP: scripts Node con Pillow/Sharp alternativa
- iOS smoke test: Plan 07 Phase 1 sigue deferred; mitigaciones preventivas (backdrop-filter mobile blur reducido, parallax 4→3 layers si jank)

---

## Validation Architecture

### Test Framework

| Propiedad | Valor |
|-----------|-------|
| Framework | Vitest ^4.1.6 |
| Config | Inferido desde `vite.config.js` (sin vitest.config.js separado) |
| Setup global | `tests/setup.js` — mocks IO, ResizeObserver, matchMedia, scrollIntoView |
| Quick run | `npm run test:run -- tests/components/Chapter{N}Content.test.js` (por chapter touched) |
| Full suite | `npm run test:run` (suite actual ~151 tests + Phase 4 adds ~50-70 tests) |

### Mapa Requirements → Tests

| REQ-ID | Comportamiento | Tipo de test | Comando automatizable | Archivo existe |
|--------|----------------|-------------|----------------------|----------------|
| ART-02 | 5 backgrounds full-frame (ch2-bg, ch5-hero, ch4 4 layers) con naming correcto en `public/assets/` | arch/smoke | `npm run test:run -- tests/assets/asset-naming.test.js` | ❌ W0 |
| ART-03 | ParallaxLayers renderiza 4 capas con factor escalonado | unit/component | `npm run test:run -- tests/components/ParallaxLayers.test.js` | ❌ W3 |
| ART-04 | ch6-bust.png existe con naming correcto | arch/smoke | incluido en asset-naming.test.js | ❌ W0 |
| ART-07 | Chapter0Content.vue y Chapter1Content.vue NO contienen `<img>` con src de `/assets/ch[01]-bg*` ni `parallax/*` | arch/source | `npm run test:run -- tests/components/Chapter[01]Content.test.js` (regex source-level) | ❌ W1 |
| A11Y-06 | i18n keys `avatar.busts.{0..6}.alt` no son "PENDING"/"Placeholder" + paridad ES/EN | unit | `npm run test:run -- tests/i18n/parity.test.js` (extender T4) | ✅ extensible |
| CORE-09 PRM cross-cutting | Cada component nuevo (TerminalScroll/MarqueeBanner/ParallaxLayers/ScrollRevealCard) tiene rama PRM | unit/component | `npm run test:run -- tests/components/<Name>.test.js` con prefersReduced mock | ❌ W1/W3/W4 |
| THM-04 theme isolation | `<section data-chapter="N">` boundary contiene parallax + scroll-reveal sin leak | component | `npm run test:run -- tests/components/ScrollShell.theme-isolation-phase4.test.js` | ❌ W5 |
| I18N-02 parity | Todas las nuevas keys (ch0.terminal.*, ch1.marquee.*, projects.ch*, etc.) tienen par ES/EN | unit | `npm run test:run -- tests/i18n/parity.test.js` (T1 ya cubre flatten) | ✅ |
| I18N-05 layout ES vs EN | Snapshot length comparison `.outerHTML` per chapter ES vs EN | component | `npm run test:run -- tests/components/Chapter{0,1,2,4,5}Content.test.js` (T-i18n-layout) | ❌ W5 |
| Marquee deprecated D4-05 | MarqueeBanner.vue contiene `<marquee>` tag (era-authenticity intentional) + v-if PRM swap | unit/component | `npm run test:run -- tests/components/MarqueeBanner.test.js` | ❌ W1 |
| ScrollRevealCard PRM | Bajo PRM, cards aparecen con opacity:1 desde mount (no IO trigger) | unit/component | `npm run test:run -- tests/components/ScrollRevealCard.test.js` | ❌ W4 |
| Backdrop-filter @supports | FloatingPanel.vue contiene `@supports` block + fallback `background-color` opaco | arch/source | `npm run test:run -- tests/components/FloatingPanel.test.js` (T-CSS-supports) | ❌ W3 |

### Tasa de Muestreo

- **Por commit de task:**
  - `npm run test:run -- tests/i18n/parity.test.js` (siempre — paridad i18n)
  - Test file del componente tocado
  - `npm run test:run -- tests/assets/asset-naming.test.js` después de cualquier commit en `public/assets/`
- **Por wave merge:**
  - W0: `tests/assets/asset-naming.test.js` + `tests/components/StickyAvatar.test.js` (verifica 7 busts loadable)
  - W1: `tests/components/Chapter{0,1}Content.test.js` + `tests/components/TerminalScroll.test.js` + `tests/components/MarqueeBanner.test.js`
  - W2: `tests/components/Chapter2Content.test.js` + `tests/components/FlashBanner.test.js`
  - W3: `tests/components/Chapter4Content.test.js` + `tests/components/ParallaxLayers.test.js` + `tests/components/FloatingPanel.test.js`
  - W4: `tests/components/Chapter5Content.test.js` + `tests/components/ScrollRevealCard.test.js`
  - W5: suite completa + ScrollShell.theme-isolation-phase4.test.js + parity.test.js extensions
- **Phase gate:** suite completa verde antes de `/gsd-verify-work`

### Gaps Wave 0

- [ ] `tests/assets/asset-naming.test.js` — regex `ch[0-6]-[a-z]+(-[a-z]+)*\.png` sobre `public/assets/`
- [ ] `tests/components/StickyAvatar.test.js` extender — añadir test que verifica que los 7 PNG `ch{N}-bust.png` existen post-W0 (filesystem smoke)

### Gaps Wave 1

- [ ] `tests/components/Chapter0Content.test.js` — mount + verifica DOM + ART-07 (no `<img>` /assets/ch0-bg*) + flavor i18n key existe
- [ ] `tests/components/Chapter1Content.test.js` — idem ch1 + ART-07 (no pixel art bg)
- [ ] `tests/components/TerminalScroll.test.js` — verifica cursor parpadeante CSS + PRM branch (`@media` rule en source)
- [ ] `tests/components/MarqueeBanner.test.js` — verifica `<marquee>` present default + v-if swap a `<span>` bajo PRM mock + starfield class present + PRM `@media` source-level

### Gaps Wave 2

- [ ] `tests/components/Chapter2Content.test.js` — DOM contract + ART-02 (`/assets/ch2-bg.png` referenced o `--bg-image` set)
- [ ] `tests/components/FlashBanner.test.js` — skeumorphic CSS gradient + drop shadows present

### Gaps Wave 3

- [ ] `tests/components/Chapter4Content.test.js` — ensamble ParallaxLayers + FloatingPanel + cards filter
- [ ] `tests/components/ParallaxLayers.test.js` — 4 layers + translateY factor + PRM factor=1
- [ ] `tests/components/FloatingPanel.test.js` — backdrop-filter @supports + fallback + border accent cyan

### Gaps Wave 4

- [ ] `tests/components/Chapter5Content.test.js` — ScrollRevealCard staggered delays + `--bg-image` ch5
- [ ] `tests/components/ScrollRevealCard.test.js` — IO mock fire + PRM instant render + delay timing

### Gaps Wave 5

- [ ] `tests/components/ScrollShell.theme-isolation-phase4.test.js` — verificar que parallax + scroll-reveal no leak entre sections
- [ ] `tests/i18n/parity.test.js` extender T4 — verifica que `avatar.busts.{0..6}.alt` no contienen "PENDING" o "Placeholder"
- [ ] Layout shift tests (I18N-05) — snapshot length compare ES vs EN per Chapter{N}Content
- [ ] `04-MANUAL-CHECKLIST.md` — Rafael ratifica alt-text, visual review parallax ch4, scroll-reveal ch5, marquee ch1 era-authenticity feel

---

## Security Domain

> `security_enforcement` no está explícitamente en `config.json`. Se trata como enabled.

### Categorías ASVS Aplicables

| Categoría ASVS | Aplica | Control estándar |
|----------------|--------|-----------------|
| V2 Authentication | No | Portafolio estático sin login |
| V3 Session Management | No | Sin sesiones; localStorage solo locale |
| V4 Access Control | No | Sitio público |
| V5 Input Validation | Parcial | Validación de project shape en ProjectCard (ya implementado Phase 3) |
| V6 Cryptography | No | Sin secretos en cliente |

### Patrones de amenaza relevantes para este stack

| Patrón | STRIDE | Mitigación estándar |
|--------|--------|---------------------|
| Foto privada de Rafael en build (`public/references/`) | Disclosure | `.gitignore` entry (D4-02 ya satisfecho) + Phase 6 firebase.json ignore glob |
| XSS via flavor text inyectado | Tampering | i18n `t()` retorna texto plano interpolado seguro; **NO usar `v-html`** en ningún Chapter{N}Content.vue |
| Pixelforge call con paleta hex no validada | Injection-adjacent | Paletas vienen de `chapters[N].palette` constante en código; cero user-input runtime |
| External link en project.link | Phishing | `rel="noopener noreferrer"` + `target="_blank"` (ya implementado ProjectCard Phase 3) |
| `<marquee>` tag legacy con content i18n | Tampering | El content es `t('ch1.marquee.greeting')` plano + interpolación; no permite raw HTML |
| Backdrop-filter SVG injection (CSS-only) | N/A | backdrop-filter usa función `blur(px)` con const numérico; no acepta user input |

---

## Fuentes

### Primarias (confianza HIGH)
- `package.json` — Vue ^3.5.0, vue-i18n ^11.4.2, @vueuse/core ^14.3.0, @unhead/vue ^1.11.20, vitest ^4.1.6 [VERIFIED 2026-05-13]
- `src/composables/useScrollState.js` — `scrollProgress` reactive 0..1 readonly, provisto via inject('scrollState')
- `src/composables/usePRM.js` — `prefersReduced` computed, provisto via inject('prm')
- `src/composables/useBackgroundMorph.js` — 2-layer crossfade D2-04, DEFAULT_DURATION_MS=200, PRM_DURATION_MS=150
- `src/styles/chapter-themes.css` — 7 themes con `[data-chapter="N"]`, ch0/ch1 completos, ch2/4/5 stubs
- `src/data/chapters.js` — shape locked D3-04, palette arrays ch0/ch1 lockeadas, ch2-6 pending §5
- `src/components/Chapter3Content.vue` — layout 2-col/stacked pattern para replicar
- `src/components/ProjectCard.vue` — skeumorphic base, validator de shape, T-CON-03 rel="noopener noreferrer"
- `src/i18n/{es,en}.json` + `tests/i18n/parity.test.js` — parity test T1/T2/T3 ya cableado
- `CLAUDE.md §6.1..6.4` — errores críticos pixelforge documentados
- `.claude/skills/crear-arte-pixelforge.md` — protocolo pixelforge
- `.claude/skills/editar-arte-adobe.md` — Adobe MCP workflow
- `.planning/phases/03-chapter-3-end-to-end/03-RESEARCH.md` — Pattern 3 (forge_sprite references), Pattern 6 (skeumorphic Web 2.0)
- MDN [marquee element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/marquee) — deprecated docs

### Secundarias (confianza MEDIUM)
- [Builder.io "The best way to create a parallax scrolling effect in 2026"](https://www.builder.io/blog/parallax-scrolling-effect) — mobile devices struggle beyond 3 layers; desktop 8-10 OK
- [Chrome Developers "Performant Parallaxing"](https://developer.chrome.com/blog/performant-parallaxing) — transform compositor thread vs top/left repaint
- [caniuse css-backdrop-filter](https://caniuse.com/css-backdrop-filter) — 92% support 2026, Safari ≥17 sin -webkit-
- [caniuse animation-timeline scroll-driven](https://caniuse.com/mdn-css_properties_animation-timeline_scroll) — Chrome 115+, Safari 26, Firefox flag
- [MDN scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [VueUse useIntersectionObserver](https://vueuse.org/core/useintersectionobserver/) — composable cleanup automático
- [Tobias Ahlin "How to animate box-shadow with silky smooth performance"](https://tobiasahlin.com/blog/how-to-animate-box-shadow/) — usar opacity/transform NO box-shadow
- [pixelforge-mcp README](https://github.com/freema/pixelforge-mcp) — `references:` parameter visual consistency
- [github.com/AnujShrivastava01/AnimateItNow#896](https://github.com/AnujShrivastava01/AnimateItNow/issues/896) — single IO instance pattern

### Terciarias (confianza LOW — validar empíricamente)
- WebSearch "marquee tag iOS Safari support 2026 working still" — iOS Safari 3.2+ supports marquee; deprecated pero funciona; **validar en hardware real** (iOS smoke test deferred Phase 1 Plan 07)
- WebSearch "pixelforge-mcp references parameter character consistency" — README dice "pass existing sprites" sin clarificar si fotos JPG sirven → **W0 Step 0 valida empíricamente**

---

## Open Questions

1. **Pixelforge `references:` acepta JPG fotos no-pixel-art como anchor estilístico?**
   - Qué sabemos: README documenta `references:` para "match visual style". Phase 3 RESEARCH A4 ya identificó esto como assumption.
   - Qué no está claro: si el parser solo acepta PNG pixel-art o también JPG fotos.
   - Recomendación: W0 Step 0 (ch3 anchor con 2011.jpg) valida empíricamente antes de batch.

2. **Palette ambient vs palette humana en `forge_sprite` para busts**
   - Qué sabemos: `chapters[N].palette` son ambient eras (terminal CRT, navy GeoCities, Flash purple, etc.) — incompatibles con humano.
   - Qué no está claro: si pixelforge `palette` constraint es estricto o sugerencia.
   - Recomendación: **Usar paleta humana §5.6 directa** como `palette` arg para los 7 busts. Documentar en plan W0.

3. **Mobile 4 parallax layers + backdrop-filter es viable en Snapdragon 7xx / iPhone A12?**
   - Qué sabemos: Builder.io 2026 "mobile struggle beyond 3 layers". backdrop-filter agrega compositor work.
   - Qué no está claro: Performance real en hardware de Rafael (no tiene iOS) y mobile Android.
   - Recomendación: W3 visual review FPS counter desktop devtools; si jank, fallback 3 layers ó disable backdrop-filter mobile.

4. **CSS `background-image` lazy loading workaround**
   - Qué sabemos: `loading="lazy"` no funciona en CSS bg-image. 4 ch4 PNGs ~200-400KB total cargan al boot.
   - Qué no está claro: cuándo el browser realmente fetcha el bg-image (al parse del CSS o al primer paint del element).
   - Recomendación: usar `<img>` posicionados absolute en ParallaxLayers en lugar de background-image. Más control sobre loading=lazy.

5. **iOS Safari `<marquee>` real behavior en 2026**
   - Qué sabemos: WebSearch dice iOS Safari 3.2+ supports marquee.
   - Qué no está claro: posibles flags de iOS Safari moderno que deshabiliten marquee.
   - Recomendación: Phase 4 W5 documenta mitigación preventiva en MANUAL-CHECKLIST: si iOS no renderiza marquee, fallback ya está (PRM-style swap to span).

6. **Local scrollProgress vs global scrollProgress para ParallaxLayers**
   - Qué sabemos: `scrollProgress` global es 0..1 sobre los 7 chapters.
   - Qué no está claro: si recalcular local en cada render es better que IntersectionObserver per section.
   - Recomendación: local calc `(scrollProgress * 7) - 4` clamp 0..1. Cero overhead vs IO. Documentar en ParallaxLayers.vue.

---

## State of the Art

| Approach antiguo | Approach actual | Cuándo cambió | Impacto |
|------------------|-----------------|---------------|---------|
| GSAP ScrollTrigger para parallax vertical | `transform: translateY(scrollProgress * factor)` con composable nativo | Always (Vue 3 + composables) | Cero libs, 60fps compositor thread |
| AOS / Locomotive / Lenis para scroll-reveal | `useIntersectionObserver` (@vueuse/core) | Vue 3 Composition API era | Cero libs, cleanup auto |
| `<marquee>` deprecated para texto scroll | CSS `@keyframes translateX` (cross-browser) | HTML5 deprecation 2014+ | Phase 4 D4-05 usa `<marquee>` REAL a propósito (era-authenticity); el approach moderno se diferiría a v2 si la era-feel no convence |
| CSS `scroll-timeline` / `view-timeline` native | `useScrollState.scrollProgress` JS-driven | 2024-2026 (Chrome 115+, Safari 26, Firefox flag) | Phase 4 NO adopta native scroll-driven — Firefox stable aún detrás de flag; portable JS approach gana hoy. Re-evaluar en 2027. |
| Box-shadow para starfield twinkle | Opacity-only via `@keyframes` sobre radial-gradient backgrounds | Tobias Ahlin perf guide | Sin repaint thrash |
| Multiple IO instances per card | Single IO per chapter con entries[] map | Vue 3 + AnimateItNow#896 docs | Memory leak prevention |

**Deprecated/obsoleto:**
- `vue-meta@2`: No usar. `@unhead/vue@^1.11.20` ya es el estándar (Phase 3).
- `@vueuse/head`: Sunset/redirected a `@unhead/vue`.
- CSS `transition: background-image`: NO funciona, no es interpolable; usar 2-layer opacity crossfade (D2-04 ya implementado).
- `forge_animation` para character: incoherent frames, no usar para busts (CLAUDE.md §6.4).

---

## Assumptions Log

| # | Claim | Sección | Riesgo si es incorrecto |
|---|-------|---------|------------------------|
| A1 | pixelforge `forge_sprite` acepta `references:` con paths JPG no-pixel-art (fotos de Rafael) | Pattern 4 + Pitfall 4 | Si NO acepta: W0 Step 0 falla → planner pivota a "describir foto verbalmente en description:" + references solo de busts ya generados |
| A2 | `chapters[N].palette` ambient NO debe usarse para busts; usar paleta humana §5.6 directa | Pattern 4 + Pitfall 1 | Si planner usa ambient palette: busts incoherentes (ch0 verde fósforo) — recomienda re-prompt con palette humana |
| A3 | Mobile (Snapdragon 7xx / A12 iPhone) puede sostener 4 parallax layers + 1-3 backdrop-filter @ 6px sin jank <40fps | Pattern 1 + Pattern 7 + Pitfall 3 | Si jank: W3 fallback a 3 layers + disable backdrop-filter mobile |
| A4 | `<marquee>` deprecated tag SIGUE renderizando en Chrome/Firefox/Safari/iOS Safari en 2026 (legacy compat) | Pattern 3 + D4-05 | Si un browser modernos deshabilita marquee: PRM-style `<span>` swap es el fallback default (D4-05 ya cubre) |
| A5 | `localProgress = clamp((scrollProgress * 7) - 4, 0, 1)` mapea correctamente el progreso global al ch4 local | Pitfall 6 + Pattern 1 | Si rangos no calzan: parallax aparece en chapters incorrectos — W3 visual smoke detecta |
| A6 | `loading="lazy"` aplicable cuando ParallaxLayers usa `<img>` posicionados absolute en lugar de background-image | Pitfall 7 | Si performance no mejora: preload manual basado en `activeChapter >= 3` |
| A7 | Asset naming regex `^ch[0-6]-[a-z]+(-[a-z]+)*\.png$` cubre todos los casos correctos (ch4-fg-ships.png, ch4-bg-stars-far.png) | Pitfall 8 + Validation Architecture | Si regex muy estricto: rechaza nombres válidos; si muy laxo: deja drift pasar. Ajustar W5. |
| A8 | Rafael ratifica alt-text bilingüe drafts en W5 con cambios mínimos (lo que Claude propone es ~80% accurate) | Pattern 8 + D4-11 | Si Rafael reescribe completo: extender W5 iteration; no blocking estructural |

---

## Project Constraints (from CLAUDE.md)

- **Comunicación con Claude:** español (preferencia del usuario).
- **OS desarrollo:** Windows 11 + PowerShell 5.1 — comandos PS, paths con `\`.
- **NO instalar `pixel-mcp` (Aseprite)** salvo pedido explícito.
- **DogSprite MCP no existe** — alucinación documentada, no mencionarlo.
- **Multi-agente system:** planner orquesta; artist-creator → pixelforge; artist-editor → Adobe MCP; frontend-dev → Vue/Phaser; qa → verifica.
- **Naming convention:** `ch{N}-{descriptor}[-{variant}].png` en `public/assets/` (ART-05 — Phase 4 enforces vía `tests/assets/asset-naming.test.js`).
- **Pixelforge presets bg nombrados:** `"night"`, `"forest"`, `"sky"`, `"dungeon"`, `"ocean"`, `"sand"`, `"snow"`, `"lava"` — NUNCA `"black"`/`"white"` (CLAUDE.md §6.2).
- **`forge_background` para opacos, `forge_sprite` para alpha** (CLAUDE.md §6.3).
- **NO character animation** — `forge_animation` produce frames incoherentes (CLAUDE.md §6.4).
- **NO usar `--env GEMINI_API_KEY=...`** — usar `setx` (CLAUDE.md §4.3).
- **Comandos disponibles:** `/project:verificar-mcps`, `/project:nueva-capa [nombre] [descripción]`.
- **Resolución virtual:** 480×270 (16:9), zoom ×3, `pixelArt: true`.
- **Capas intermedias parallax:** "solid filled shapes, no internal lineart, no outlines" (CLAUDE.md §6.1).

---

## Metadata

**Desglose de confianza:**
- Stack base (Vue/vue-i18n/vueuse/unhead/vitest): HIGH — todo verificado contra `package.json` + npm registry
- Parallax multi-layer pattern: MEDIUM-HIGH — Chrome dev blog + Builder.io 2026 verifican performance budget (4 layers límite mobile); ParallaxLayers.vue test pattern verificable
- Pixelforge `references:` con foto JPG (A1): MEDIUM-LOW — assumption explícita, W0 Step 0 valida empíricamente
- Pixelforge palette humana §5.6 (A2): MEDIUM — recomendación derivada del análisis de `chapters[N].palette` ambient — planner valida con Rafael en W0
- Marquee deprecated cross-browser 2026: MEDIUM — WebSearch + MDN confirman support legacy en Chrome/FF/Safari/iOS Safari, pero "may cease at any time"
- CSS scroll-driven NO adoptarlo: HIGH — caniuse confirma Firefox stable detrás de flag
- Backdrop-filter mobile performance combinada con parallax (A3): MEDIUM — necesita visual review hardware Rafael (Windows desktop) + iOS deferred
- A11Y-06 alt-text drafts (A8): MEDIUM — Rafael ratifica W5; ~80% accurate típico

**Research date:** 2026-05-13
**Valid until:** ~2026-06-13 (30 días — stack estable, pixelforge depende de Gemini API activa)

---

*Phase: 04-chapters-0-2-4-5*
*Research date: 2026-05-13*
