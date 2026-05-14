---
phase: 4
slug: chapters-0-2-4-5
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-13
inherits_from:
  - .planning/phases/01-scroll-shell-sticky-anchors/01-UI-SPEC.md
  - .planning/phases/02-theme-system-i18n/02-UI-SPEC.md
---

# Phase 4 — UI Design Contract: Chapters 0-2 + 4-5

> Contrato visual e interactivo para Phase 4. Generado por gsd-ui-researcher.
> Consumido por gsd-ui-checker, gsd-planner, gsd-executor y gsd-ui-auditor.
> **No re-preguntar al usuario** — todas las decisiones D4-01..D4-11 están bloqueadas
> en `04-CONTEXT.md`. Phase 4 las traduce a contrato visual prescriptivo.
> **Hereda Phase 1 + Phase 2 UI-SPEC**: spacing `--sp-*`, focus ring universal,
> motion contract D-01..D-06, 7 chapter color tokens en `chapter-themes.css`,
> 7 fuentes self-hosted en `/public/fonts/`, BackgroundLayers crossfade,
> ScrollShell + StickyAvatar + StickyTimeline + LangToggle + SkipLink.
> Phase 4 SOLO extiende — no re-implementa nada heredado.

---

## 1. Phase Boundary + Locked Decisions

### Qué construye Phase 4 (visualmente)

1. **5 chapters wrappers** — `Chapter0Content.vue`, `Chapter1Content.vue`,
   `Chapter2Content.vue`, `Chapter4Content.vue`, `Chapter5Content.vue` que replican
   el patrón canonical de `Chapter3Content.vue` (2-col desktop / stacked mobile)
   con styling era-auténtico por chapter.
2. **6 era-signature components** — `TerminalScroll` (ch0), `MarqueeBanner` (ch1),
   `FlashBanner` (ch2), `FloatingPanel` (ch4), `ParallaxLayers` (ch4 wrapper),
   `ScrollRevealCard` (ch5). Más `StarfieldBg` interno a ch1 (CSS-only).
3. **ProjectCard variants per chapter** declaradas en `chapter-themes.css @layer components`:
   `[data-chapter="2"]` Flash skeumorphic, `[data-chapter="4"]` glass holográfico,
   `[data-chapter="5"]` modern minimal flat. Phase 3 ya cargó `.project-card` base
   Web 2.0 + defaults `[data-chapter="3"]`.
4. **Batch 7 avatar busts pixel art** (`ch{0..6}-bust.png`) generados con pixelforge
   bajo paleta humana §5.6 + 6 fotos de referencia (D4-01, D4-03).
5. **Pixel art backgrounds** — `ch2-bg.png` (1 capa flat), `ch4-bg-stars-far.png` +
   `ch4-bg-planet-mid.png` + `ch4-fg-panels.png` + `ch4-fg-ships.png` (multi-layer),
   `ch5-hero.png` (1 capa). Total ~6 assets de fondo nuevos.
6. **i18n keys nuevos** — `chapters.N.flavor` (texto era ch0/ch1), `projects.{id}.{title,desc}`
   (ch2/ch4/ch5), `avatar.busts.N.alt` (refinados era-accurate ES+EN para 7 busts).

### Qué NO incluye Phase 4 (fuera de contrato)

- Ch3 polishing — landing ya cerrado (Phase 3 PASS-with-deferred-art)
- Ch6 escena Phaser + ships dinámicos + planet click bridges (Phase 5)
- Mantra easter egg "And always show a smile" (Phase 5, CON-04)
- Deploy + cache headers + firebase.json (Phase 6)
- iOS smoke test confirmatorio (deferred Phase 1 Plan 07)
- 7 fonts swap (Phase 2 lockeó)
- LangToggle, BackgroundLayers, ScrollShell, StickyAvatar, StickyTimeline, SkipLink,
  ContactHUD — heredados de Phase 1/2/3 sin modificación
- Vue Router, Pinia, Lenis, GSAP, AOS, custom cursors, dark/light toggle,
  glassmorphism global (excepto FloatingPanel ch4 que es era-authentic AR/VR)
- Container queries, CSS scroll-driven animations API native (`scroll-timeline`),
  bento grids, Lottie embeds

### Reduced-Motion Policy (cross-cutting D-01..D-06 heredada + D4-10 derivada)

Fuente: `01-UI-SPEC.md §1` + `02-UI-SPEC.md §1` + `04-CONTEXT.md §D4-10`.

| Código | Elemento | Default | Bajo `prefers-reduced-motion: reduce` |
|--------|----------|---------|---------------------------------------|
| D-01 | Scroll snap entre chapters | `scroll-behavior: smooth` | `scroll-behavior: auto` |
| D-02 | Swap del avatar sticky | Crossfade 200ms opacity | Instantáneo |
| D-03 | Background morph entre eras | Crossfade 200ms (sync con avatar) | Crossfade ≤ 150ms |
| D-04 | Click-to-nav (tick, flechas, `?ch=N`) | `scrollTo({ behavior: 'smooth' })` | `scrollTo({ behavior: 'auto' })` |
| D-05 | Micro-animations HUD (hover/focus) | Transition ≤ 150ms | Transition ≤ 150ms (se mantiene) |
| D-06 | Principio rector | Interaction-derived ≤150ms permitida; auto-played/decorative OFF |
| **D4-10a** | **Ch0 cursor parpadeante** | `@keyframes blink` 1s infinite | `animation: none` — cursor estático |
| **D4-10b** | **Ch1 `<marquee>` real** | Tag deprecated nativo (D4-05) | `v-if="!prefersReduced"` → swap a `<span>` estático centrado |
| **D4-10c** | **Ch1 starfield CSS twinkle** | `@keyframes twinkle` 3-4s infinite | `animation: none` — fondo estático |
| **D4-10d** | **Ch4 parallax 4 capas** | `translateY(scrollProgress * factor)` con factor 0.2/0.5/0.8/1.0 | Todas las capas factor 1.0 (sin diferencial = scroll natural sin depth effect) |
| **D4-10e** | **Ch5 ScrollRevealCard** | IntersectionObserver fade+slide-in 300ms | Instant render — `opacity:1; transform:none` desde el inicio |

**Principio rector D4-10**: cada component nuevo Phase 4 declara su rama PRM
EXPLÍCITA. No "asumir" que el CSS `@media (prefers-reduced-motion: reduce)` cubrirá
todo — algunos branches viven en Vue template (`v-if`) porque el tag legacy
(`<marquee>`) no respeta `animation-play-state`.

---

## 2. Design System

| Propiedad | Valor |
|-----------|-------|
| Tool | none (stack Vue 3 + Vite, sin React → shadcn no aplica) |
| Preset | not applicable |
| Component library | none — composables + components propios Vue Composition API |
| Icon library | none — emoji `🌐` (LangToggle Phase 2), SVG inline si Phase 4 necesita; GIFs "under construction" en ch1 son flavor text dentro de `MarqueeBanner` (no librería) |
| Fonts (7 self-hosted Phase 2 W4 — ver §4) | VT323, Comic Neue, Verdana/Trebuchet (system-safe), Lobster, Audiowide, Inter Variable, Press Start 2P |

**Sin instalación nueva en Phase 4.** Verificado en RESEARCH §Stack Estándar:
`vue@^3.5`, `vue-i18n@^11.4.2`, `@vueuse/core@^14.3.0` (provee `useIntersectionObserver`
para `ScrollRevealCard`), `@unhead/vue@^1.11.20`, `@fontsource/*` ya cubren todas las
capacidades de Phase 4. `useScrollState` y `usePRM` (Phase 1) + `useBackgroundMorph`
(Phase 2) están disponibles vía `provide/inject` desde App.vue.

---

## 3. Spacing Scale (heredada Phase 1, sin cambios)

Base unit: **8px**. Todos los valores son múltiplos de 4. Phase 4 **NO redefine**
ningún spacing token.

| Token | Valor | Uso en Phase 4 |
|-------|-------|----------------|
| `--sp-xs` | 4px | Gap interno tech-stack chips, micropadding banner notches |
| `--sp-sm` | 8px | Gap entre paragraphs flavor text ch0/ch1, padding interno FloatingPanel |
| `--sp-md` | 16px | Margen de cada `Chapter{N}Content` respecto al padding lateral del shell; padding ProjectCard variants |
| `--sp-lg` | 24px | Gap entre proyectos en lista vertical; padding-bottom del .ch{N}-bio |
| `--sp-xl` | 32px | Gap entre bio + projects list; gap interno ParallaxLayers cuando hay overlay text |
| `--sp-2xl` | 48px | (Phase 1 timeline height — invariante) |
| `--sp-3xl` | 64px | Padding-top extra ch4 ParallaxLayers para evitar solape con sticky avatar |

**Excepciones declaradas Phase 4 (todas justificadas inline):**

- **Avatar in-content `Chapter{N}Content`**: 160×192px desktop / 96×116px mobile —
  réplica del patrón Chapter3Content (D3-09). NO es múltiplo de 8 — heredado de las
  proporciones del bust pixel art (480×270 base × zoom). Aceptable, justificado.
- **`Chapter{N}Content` padding-left desktop**: 160px (D3-09 Opción A heredada) —
  espacio para StickyTimeline vertical-left (~120px width + margen). NO es token
  spacing — es padding de layout específico de chapter content.
- **`Chapter{N}Content` padding-left mobile (<600px)**: 60px — espacio para
  StickyTimeline mobile year-only (~44px width + margen).
- **Tap targets**: 44×44px en cualquier botón clicable (project links, marquee
  swap span en mobile). Heredado WCAG A11Y-03.
- **Multi-layer parallax ch4**: las 4 capas ocupan `inset: 0` del section (no
  spacing tokens — son full-bleed dentro de su `<section data-chapter="4">`).
- **Scroll-reveal threshold ch5**: `IntersectionObserver` threshold 0.2
  (20% visible) — no relacionado con spacing tokens.

---

## 4. Typography per Chapter

### 4.1 Fuentes heredadas Phase 2 W4 — sin cambios

| ch | Font family declarada en `[data-chapter="N"]` | Bundle (woff2 subset Latin Extended) | Estado Phase 4 |
|----|------|--------|----------------|
| 0 | `'VT323', ui-monospace, monospace` | ~25-40 KB | self-hosted Phase 2; usado por TerminalScroll + flavor text ch0 |
| 1 | `'Comic Neue', 'Comic Sans MS', cursive` | ~30-50 KB | self-hosted Phase 2; usado por MarqueeBanner + tabla legacy + flavor text ch1 |
| 2 | `'Verdana', 'Trebuchet MS', sans-serif` | 0 KB (system-safe) | system stack — Verdana en Win/Mac, Trebuchet fallback Android; FlashBanner + Chapter2Content consumen |
| 3 | `'Lobster', Georgia, serif` | ~30-50 KB | self-hosted Phase 2; NO Phase 4 scope |
| 4 | `'Audiowide', 'Eurostile', sans-serif` | ~30-50 KB | self-hosted Phase 2; usado por FloatingPanel titles + Chapter4Content + ParallaxLayers overlay |
| 5 | `'Inter Variable', system-ui, sans-serif` | ~80-120 KB | self-hosted Phase 2 (variable axis 100-900); ScrollRevealCard + Chapter5Content |
| 6 | `'Press Start 2P', monospace` | ~30-50 KB | self-hosted Phase 2; NO Phase 4 visual scope (solo bust ch6 W0) |

### 4.2 Tipográfica scale per chapter (NUEVO Phase 4)

Phase 4 declara los **tamaños concretos** de body/heading/microcopy por chapter,
ya que Phase 2 solo locó las font-families. Cada chapter usa **exactamente 3 tamaños**:
display (heading principal), body (texto bio + proyectos), microcopy (caption,
year label, tech-chip).

**Line-height defaults (heredados Phase 2 §5.4):**
- Body: 1.5 (WCAG AA legibility baseline)
- Heading: 1.2 (tightening era-display visual rhythm)
- Cursor monospace ch0: 1.0 (no leading extra — CRT feel)
- Marquee ch1: 1.0 (single-line text)

#### Ch0 — Terminal (1995, VT323)

| Rol | Tamaño | Weight | Line-height | Uso |
|-----|--------|--------|-------------|-----|
| Display (era title heredado) | `clamp(2rem, 5vw, 3.5rem)` | 400 | 1.1 | "1995 · Terminal" hereda Phase 1 era-title |
| Body | `20px` | 400 | 1.5 | Flavor text bio, output simulado terminal scroll (VT323 corre pequeño — 20px equivale visualmente a ~16px de sans-serif) |
| Microcopy | `16px` | 400 | 1.4 | Cursor label, year sticker, prompt prefix `$ ` |

Cursor parpadeante: ancho `0.6em`, alto `1em`, background `var(--c-fg)` (#00ff41),
`@keyframes blink` 1s infinite alternate. Bajo PRM: `animation: none`, cursor
estático visible.

#### Ch1 — HTML 90s (2001-04, Comic Neue)

| Rol | Tamaño | Weight | Line-height | Uso |
|-----|--------|--------|-------------|-----|
| Display | `clamp(1.75rem, 4.5vw, 3rem)` | 700 | 1.2 | Heading "Welcome to my homepage" GeoCities-style |
| Body | `18px` (mínimo — THM-05 compensation Phase 2 §4.2 ch1) | 400 | 1.5 | Tabla legacy text + flavor bilingüe + marquee content |
| Microcopy | `14px` | 700 | 1.3 | "Best viewed in Netscape 4", "Under construction", year badges |

**Importante (THM-05):** ch1 contrast 3.2:1 (magenta sobre navy) requiere
`font-size: 18px+` mínimo por compensación perceptual era-authentic tradeoff.
Locked Phase 2 §4.2.

#### Ch2 — Flash (2009, Verdana/Trebuchet system)

| Rol | Tamaño | Weight | Line-height | Uso |
|-----|--------|--------|-------------|-----|
| Display | `clamp(2rem, 5vw, 3.5rem)` | 700 | 1.2 | Heading FlashBanner "Flash Era — 2009" |
| Body | `16px` | 400 | 1.5 | Bio + project description |
| Microcopy | `13px` | 700 | 1.3 | Skeumorphic button labels ("Ver proyecto →"), tech-stack chips, year badges |

#### Ch4 — AR/VR (2015-18, Audiowide)

| Rol | Tamaño | Weight | Line-height | Uso |
|-----|--------|--------|-------------|-----|
| Display | `clamp(2rem, 5vw, 3.5rem)` | 400 (Audiowide solo tiene 400) | 1.2 | "AR/VR — 2015" heading sobre parallax |
| Body | `16px` | 400 | 1.5 | Bio + FloatingPanel descriptions |
| Microcopy | `13px` | 400 | 1.3 | Holographic captions, tech-stack chips cyan-bordered |

**Caveat Audiowide**: la fuente solo tiene weight 400. NO declarar 700 — el browser
sintetizará bold visualmente feo. Si jerarquía requiere peso, usar `text-transform:
uppercase` + `letter-spacing: 0.05em` en el display.

#### Ch5 — Modern (2022-23, Inter Variable)

| Rol | Tamaño | Weight | Line-height | Uso |
|-----|--------|--------|-------------|-----|
| Display | `clamp(2.5rem, 6vw, 4rem)` | 600 (semibold) | 1.1 | Heading "Modern Era — 2022-23" minimal flat |
| Body | `17px` | 400 | 1.6 (extra para modern minimalist breathing room) | Bio + project description |
| Microcopy | `13px` | 400 (regular) | 1.4 | Tech-stack pills, captions, year labels — diferenciación visual vs body via `letter-spacing: 0.02em` (NO weight extra, mantiene ≤2 weights) |

**Inter Variable advantage**: weight axis 100-900 continuo. Phase 4 ch5 usa solo
**2 weights**: 400 (body + microcopy) y 600 (display). Microcopy se diferencia del
body via `letter-spacing: 0.02em` (subtle tracking) en lugar de añadir un tercer
peso — cumple Dimension 4 contract estricto ≤2 weights/chapter sin sacrificar
jerarquía visual.

### 4.3 Tabla resumen — sizes/weights declarados Phase 4

**Total sizes/weights únicos en Phase 4 (no contando heredados Phase 1 era-title clamp):**

- Sizes: 8 únicos (13, 14, 16, 17, 18, 20px + clamp display + clamp ch5 display) — DENTRO del rango 3-4 sizes per chapter como exige el contrato de calidad UI.
- Weights: ≤2 por chapter (400/700 default; ch4 solo 400; ch5 400/600 — display 600, body + microcopy 400, microcopy diferencia via `letter-spacing: 0.02em`).

**Por chapter cumple 3 sizes × ≤2 weights** (Dimensión 4 Typography pass).

---

## 5. Color Tokens per Chapter (heredados Phase 2 — Phase 4 los finaliza con pixel art)

Phase 2 lockeó los 7 themes en `chapter-themes.css`. Phase 4 NO modifica
`--c-bg` / `--c-fg` / `--c-accent` / `--c-border` / `--c-focus` para ch0/ch1
(COMPLETOS Phase 2). Para ch2/ch4/ch5 (stubs Phase 2), Phase 4 PUEDE refinar
2-3 hex si la paleta humana §5.1/§5.3/§5.4 del CONTENT-CHECKLIST trae ajustes,
PERO los valores actuales son suficientes y la rama esperada es: **mantener
tokens, añadir `--bg-image` cuando pixel art landa**.

### 5.1 Per-chapter palette Phase 4 — distribución 60/30/10

| ch | 60% Dominante (`--c-bg`) | 30% Secundario | 10% Acento (`--c-accent`) reservado para |
|----|---------|----------------|------------------------------------------|
| 0 | `#000000` CRT black | `#003311` dim green (borders/dividers terminal output) | `#00ff41` phosphor green — reservado para: prompt prefix `$ `, cursor parpadeante, headings era flavor, tech-stack chip borders. NO se usa en body text (body es `--c-fg` también `#00ff41` por monochrome era) |
| 1 | `#000080` navy starfield | `#000040` (StarfieldBg deeper navy) + `#ffffff` pixel-white borders | `#ffff00` GeoCities yellow + `#ff00ff` magenta — yellow reservado para: marquee underline, "best viewed in" badges, "under construction" highlight. Magenta es `--c-fg` body por era-authenticity (Phase 2 lockeado). |
| 2 | `#2a1a4a` deep purple Flash bg + `ch2-bg.png` overlay vector style | `#1a0a3a` darker purple (FloatingPanel-style overlays, project card surface gradient base), `#8060c0` purple border | `#ff8800` orange Flash callout — reservado para: FlashBanner accents, button gradients glossy, year heading. `#ffaa00` amber para focus ring (heredado). |
| 4 | `#0a0f2e` deep space + multi-layer parallax stars + planet + panels + ships | `#142050` slightly lighter (FloatingPanel `rgba` translucent surface base), `#2050a0` mid blue border | `#00ffff` cyan AR holographic — reservado para: FloatingPanel border, holographic captions, tech chip borders, focus ring. NO se usa en body text (body es `#b0d0ff` ice blue). |
| 5 | `#ffffff` pure white + `ch5-hero.png` abstract gradient hero | `#f5f7fb` near-white (ScrollRevealCard card surface), `#e2e8f0` light gray border | `#6366f1` indigo — reservado para: scroll-reveal card title underline accent, "Ver proyecto" link color (no botón skeumorphic — modern minimal flat), focus ring, year label. |

### 5.2 Acento reserved-for — lista explícita per chapter (no "todos los interactivos")

**Ch0 `#00ff41`:**
- Prompt prefix `$ ` antes de cada simulated command
- Cursor parpadeante (1em block)
- Era heading "1995 · Terminal" (heredado Phase 1)
- Tech-stack chip borders (si chapter0 muestra "tech" del era — flavor MS-DOS/BASIC)

**Ch1 `#ffff00` (yellow) + `#ff00ff` (magenta):**
- Yellow: marquee underline, "Best viewed in Netscape 4" badge bg, "Under construction" inline highlight
- Magenta: body fg (era-authentic — Phase 2 lockeado, NO override)

**Ch2 `#ff8800`:**
- FlashBanner heading text
- Project card gradient: `linear-gradient(to bottom, #ff8800, color-mix(in srgb, #ff8800 70%, #000))`
- "Ver proyecto →" button bg
- Year heading "2009"

**Ch4 `#00ffff`:**
- FloatingPanel border (`border: 1px solid var(--c-accent)`)
- FloatingPanel heading underline accent
- Holographic captions sobre parallax layers
- Tech-stack chip borders
- Focus ring (heredado)

**Ch5 `#6366f1`:**
- ScrollRevealCard title accent underline (`border-bottom: 2px solid var(--c-accent)`)
- "Ver proyecto →" text-only link (modern flat — NO botón skeumorphic)
- Year heading
- Focus ring (heredado)

### 5.3 Contraste verificado per chapter (heredado Phase 2 — todos pasan WCAG AA o tradeoff documentado)

| ch | Pair | Ratio | Status |
|----|------|-------|--------|
| 0 | `#00ff41` sobre `#000000` | 15.3:1 | AAA — sin tradeoff |
| 1 | `#ff00ff` sobre `#000080` | 3.2:1 | **Tradeoff THM-05 documentado** — Phase 2 §4.2 inline comment + 18px+ body compensation |
| 2 | `#e0c0ff` sobre `#2a1a4a` | 12.6:1 | AAA |
| 4 | `#b0d0ff` sobre `#0a0f2e` | 11.8:1 | AAA |
| 5 | `#1a1a2e` sobre `#ffffff` | 14.2:1 | AAA |

### 5.4 Pending palette completion (Rafael blocking)

- **§5.1 paleta ch2 Flash** (5-8 hex): Phase 2 stub `#2a1a4a / #e0c0ff / #ff8800 / #8060c0 / #ffaa00` aceptable como mínimo viable; CONTENT-CHECKLIST §5.1 puede refinar 1-2 hex si Rafael lo decide. Locked en `chapters[2].palette` antes de W2 pixelforge call.
- **§5.3 paleta ch4 AR/VR** (5-8 hex): stub `#0a0f2e / #b0d0ff / #00ffff / #2050a0 / #00ffff` similar.
- **§5.4 paleta ch5 Modern** (5-8 hex): stub `#ffffff / #1a1a2e / #6366f1 / #e2e8f0 / #6366f1` similar.
- **§5.6 paleta humana avatar** (skin / hair / clothing tonos base): blocking para W0 batch.

**Rama esperada (recommended)**: Rafael ratifica los stubs Phase 2 como suficientes;
el ejecutor inicia las waves sin cambios CSS, solo añade `--bg-image: url(...)`
cuando el asset existe.

---

## 6. Component Catalog — Phase 4 nuevos (6 era-signature + 5 wrappers + 1 starfield)

### 6.1 TerminalScroll.vue (ch0)

**Propósito**: Output simulado tipo CRT con cursor parpadeante; revela líneas de
bio/era flavor en stages al hacer scroll DENTRO del chapter (no global). Stack:
HTML/CSS puro + minimal JS para typing animation opcional.

**DOM**:
```html
<div class="terminal-scroll" aria-label="Terminal output">
  <div class="terminal-line" v-for="(line, i) in lines" :key="i">
    <span class="terminal-prompt" aria-hidden="true">$ </span>
    <span class="terminal-text">{{ line }}</span>
  </div>
  <div class="terminal-cursor" aria-hidden="true"></div>
</div>
```

**Dimensiones**:
- Width: 100% del column content (dentro de `.ch0-content`)
- Min-height: 240px desktop / 180px mobile (espacio para 6-8 lines)
- Padding: `var(--sp-md)` (16px)

**Estados**:

| Estado | Tratamiento |
|--------|-------------|
| Default | Líneas reveladas instantáneamente (PRM compliance — no typing animation) |
| Cursor parpadeante (default motion) | `@keyframes blink` 1s infinite alternate; `opacity: 1 ↔ 0` |
| PRM (`@media`) | `animation: none` — cursor estático visible permanente |
| Focus (si interactivo, p.ej. botón "show more") | `:focus-visible` heredado 3px `--c-focus` (#00ff41) |

**Interaction contracts**:
- Typing speed (opcional, NO blocking): si executor decide animar typing, 30-50ms per char máx, total ≤2s para 6-8 lines. PRM: skip animation, render all instant.
- NO requiere typing — instant render acepta como primary path.

**i18n keys consumidos**: `chapters.0.flavor` (array de strings ES + EN), `chapters.0.terminalPrompt` (opcional, default `$ `).

**A11Y**:
- `aria-label="Terminal output"` (i18nificable a `t('ui.terminalAria')`)
- `aria-hidden="true"` en `terminal-prompt` + `terminal-cursor` (decorativo)
- Texto en `terminal-text` es leído por screen readers

### 6.2 MarqueeBanner.vue (ch1)

**Propósito**: `<marquee>` deprecated tag REAL (D4-05) con texto bilingüe;
PRM swap a `<span>` estático centrado vía `v-if`. Tabla legacy `border="1"`
para info layout; GIFs "under construction" tinteados; Comic Neue font.

**DOM (default motion)**:
```html
<div class="marquee-banner">
  <marquee
    v-if="!prefersReduced"
    behavior="scroll"
    direction="left"
    scrollamount="6"
    class="marquee-real"
    :aria-label="t('chapters.1.marqueeAria')"
  >
    {{ t('chapters.1.marqueeText') }}
  </marquee>
  <span v-else class="marquee-static">{{ t('chapters.1.marqueeText') }}</span>
</div>
```

**Dimensiones**:
- Width: 100% del column (con padding lateral del chapter)
- Height: 32-40px (single-line marquee)
- Border: `2px solid var(--c-border)` (#ffffff pixel-white era-authentic)
- Background: `var(--c-accent)` (#ffff00 yellow GeoCities) — yellow es accent reservado para este elemento + badges

**Speed**: `scrollamount="6"` (default `<marquee>` value; ~36px/frame ≈ 60fps friendly visualmente).

**Estados**:

| Estado | Tratamiento |
|--------|-------------|
| Default motion | `<marquee>` nativo scroll left infinite |
| PRM | `<span>` estático centered, mismo texto, mismo styling visual (sin scroll) |
| Focus (no aplica — `<marquee>` no focusable) | — |

**Interaction contract**:
- `<marquee>` no recibe focus, no tiene click handlers — flavor text only (D4-05).
- Bio/proyectos/contacto siguen accesibles via otros components (no se pierde info crítica).

**i18n keys**: `chapters.1.marqueeText`, `chapters.1.marqueeAria`.

**A11Y caveat (D4-05)**: marquee no es anunciable controladamente. Compensation
documented: contenido es flavor, no crítico.

### 6.3 StarfieldBg.vue (ch1, interno)

**Propósito**: Starfield decorativo dentro de `<section data-chapter="1">` (no
en BackgroundLayers global). CSS-only `radial-gradient` repetido + `animation:
twinkle`. PRM: animation none, fondo estático.

**DOM**:
```html
<div class="starfield-bg" aria-hidden="true"></div>
```

**Dimensiones**: `position: absolute; inset: 0; z-index: 0` dentro del section,
detrás del content (`z-index: 1+` para Chapter1Content).

**CSS**:
```css
.starfield-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(2px 2px at 20% 30%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 60% 70%, #fff 0%, transparent 100%),
    radial-gradient(1.5px 1.5px at 80% 20%, #fff 0%, transparent 100%),
    radial-gradient(1px 1px at 40% 50%, #c0c0d8 0%, transparent 100%),
    /* …repetir 8-12 gradients distribuidos */
    var(--c-bg, #000080);
  animation: twinkle 3s ease-in-out infinite alternate;
}

@keyframes twinkle {
  0%   { opacity: 1; }
  100% { opacity: 0.85; }
}

@media (prefers-reduced-motion: reduce) {
  .starfield-bg { animation: none; opacity: 1; }
}
```

**i18n**: no consume — decorativo `aria-hidden`.

### 6.4 FlashBanner.vue (ch2)

**Propósito**: Banner top-of-section con skeumorphic gradients vector style,
drop shadow, browser-chrome mock window-frame Flash era. Sirve como header del
ch2 sobre el bg pixel-art.

**DOM**:
```html
<header class="flash-banner">
  <div class="flash-banner-chrome" aria-hidden="true"></div>
  <h2 class="flash-banner-title">{{ t('chapters.2.bannerTitle') }}</h2>
  <p class="flash-banner-subtitle">{{ t('chapters.2.bannerSubtitle') }}</p>
</header>
```

**Dimensiones**:
- Width: 100% del column content (con padding lateral)
- Height: auto (compact ~120-160px)
- Padding: `var(--sp-lg)` (24px)
- Border-radius: 8px (Flash era squarer than Web 2.0)

**Visual contract** (skeumorphic Flash era 2009):
- Background: `linear-gradient(to bottom, #ff8800 0%, #cc6600 50%, #883300 100%)` (orange → darker → deep)
- Border: `2px solid #ffaa00` (amber accent)
- Box-shadow: `0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)` (drop + inset highlight top)
- Title font-family: Verdana/Trebuchet (heredado ch2)
- `flash-banner-chrome`: 3 pseudo-dots top-left simulando window controls (red/yellow/green 8×8 round), `position: absolute; top: 8px; left: 8px`

**Estados**: Static. No hover/active states (es header decorativo).

**i18n keys**: `chapters.2.bannerTitle`, `chapters.2.bannerSubtitle`.

### 6.5 FloatingPanel.vue (ch4)

**Propósito**: Glass holographic card AR/VR; `backdrop-filter: blur(12px)` con
fallback `background: rgba(...)` si no soportado, border `--c-accent` cyan,
box-shadow glow inset+outer. Carga 1 proyecto AR/VR cada uno.

**DOM**:
```html
<article class="floating-panel">
  <h3 class="floating-panel-title">{{ t(project.titleKey) }}</h3>
  <p class="floating-panel-desc">{{ t(project.descKey) }}</p>
  <ul v-if="project.techStack" class="floating-panel-tech">
    <li v-for="t in project.techStack" :key="t">{{ t }}</li>
  </ul>
  <a v-if="project.link" :href="project.link" class="floating-panel-link"
     target="_blank" rel="noopener noreferrer">
    {{ t('ui.openProject') }}
  </a>
</article>
```

**Dimensiones**:
- Width: `min(420px, 100%)` desktop / 100% mobile
- Padding: `var(--sp-lg)` (24px)
- Border-radius: 12px
- Min-height: 160px

**Visual contract** (glass holographic):
- Background: `rgba(20, 32, 80, 0.45)` (transparent, deeper purple-blue tint del ch4 secondary `#142050` con alpha)
- Backdrop-filter: `blur(12px) saturate(120%)`
- **Fallback** (no backdrop-filter support — caniuse 92%): `background: rgba(20, 32, 80, 0.85)` opaque + 8px blurred box-shadow pseudo-element
- Border: `1px solid var(--c-accent)` (#00ffff cyan)
- Box-shadow:
  - Outer glow: `0 0 24px rgba(0, 255, 255, 0.25)` (cyan halo)
  - Inset top highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.15)`

**Estados**:

| Estado | Tratamiento |
|--------|-------------|
| Default | Visible con backdrop blur estático |
| Hover | Outer glow intensifica a `rgba(0, 255, 255, 0.45)` — transition 150ms (D-05) |
| Focus-within | Heredado `:focus-visible` 3px `--c-focus` (#00ffff) en el `<a>` inside |
| Active (link pressed) | No depth effect — modern AR no es skeumorphic |
| PRM | Hover transition se mantiene (interaction-derived ≤150ms ok per D-06) |

**i18n keys**: consume `project.titleKey` y `project.descKey` (igual que ProjectCard).

### 6.6 ParallaxLayers.vue (ch4 wrapper)

**Propósito**: 3-4 capas absolute positioned DENTRO de `<section data-chapter="4">`
(NO en BackgroundLayers global). Cada capa con `<img>` (D4-07) `loading="lazy"` +
`transform: translateY(scrollProgressLocal * factor * 100vh)`.

**DOM**:
```html
<div class="parallax-layers" aria-hidden="true">
  <img v-for="layer in layers" :key="layer.name"
       :src="layer.src"
       :class="['parallax-layer', `parallax-layer--${layer.name}`]"
       :style="{ transform: `translateY(${offsetFor(layer.factor)}px)` }"
       loading="lazy"
       alt="" />
</div>
```

**Dimensiones**: `position: absolute; inset: 0; z-index: 0` dentro del section.
Cada `<img>` tiene `width: 100%; height: 120%` (overflow lateral para movimiento
vertical sin reveal de edge).

**Layer table (D4-06)**:

| Layer | Asset | Factor (default) | Factor (PRM) | Notes |
|-------|-------|------------------|--------------|-------|
| stars-far | `/assets/ch4-bg-stars-far.png` | 0.2 | 1.0 | Más lejana, mueve menos |
| planet-mid | `/assets/ch4-bg-planet-mid.png` | 0.5 | 1.0 | Mid plane |
| panels-fg | `/assets/ch4-fg-panels.png` | 0.8 | 1.0 | Foreground panels |
| ships-near | `/assets/ch4-fg-ships.png` | 1.0 | 1.0 | Más cercana (1-2 naves estáticas — sin character animation per PHA-08) |

**Interaction contract**:
- Scroll-progress source: `inject('scrollState').scrollProgress` (global ref 0..1 Phase 1 W2).
- Offset computation: `(scrollProgress - 0.5) * factor * 100` (vh units). Centro del scroll
  range = layers centered; ends = layers offset proportional to factor.
- PRM branch (JS-side): `if (prefersReduced.value) factor = 1.0` uniformly.
- Performance: cada layer `will-change: transform`. Compositor thread, 60fps target.

**A11Y**: `aria-hidden="true"` — decorativo. `alt=""` por consistency W3C.

### 6.7 ScrollRevealCard.vue (ch5)

**Propósito**: IntersectionObserver wrapper que aplica fade+slide-in al entrar
viewport del chapter (no global). PRM: instant render sin animation. Threshold ~0.2.

**DOM**:
```html
<article :class="['scroll-reveal-card', { 'is-revealed': isRevealed }]" ref="cardEl">
  <h3 class="scroll-reveal-card-title">{{ t(project.titleKey) }}</h3>
  <p class="scroll-reveal-card-desc">{{ t(project.descKey) }}</p>
  <ul v-if="project.techStack" class="scroll-reveal-card-tech">
    <li v-for="t in project.techStack" :key="t">{{ t }}</li>
  </ul>
  <a v-if="project.link" :href="project.link" class="scroll-reveal-card-link"
     target="_blank" rel="noopener noreferrer">
    {{ t('ui.openProject') }}
  </a>
</article>
```

**Dimensiones**:
- Width: `min(480px, 100%)` desktop / 100% mobile
- Padding: `var(--sp-lg)` (24px)
- Border-radius: 6px (modern minimalist — NOT 12px round)
- Background: `#f5f7fb` (Phase 4 §5.1 ch5 30% secondary)
- Border: `1px solid var(--c-border)` (#e2e8f0)
- Box-shadow: `0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)` (modern minimal — NOT skeumorphic depth)

**Reveal animation (default motion)**:
- Initial: `opacity: 0; transform: translateY(24px)`
- Revealed: `opacity: 1; transform: translateY(0)`
- Transition: `opacity 300ms ease, transform 300ms ease` (both)

**PRM branch**:
```css
@media (prefers-reduced-motion: reduce) {
  .scroll-reveal-card {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

**IntersectionObserver contract** (via `useIntersectionObserver` de @vueuse):
- threshold: 0.2 (revelado cuando 20% visible)
- once: false (re-trigger si user scrollea up + down, NO requerido strict por design — opcional)
- root: null (viewport — Phase 1 IO sobre el shell scroll container; ch5 IO sobre window viewport, scoped por el shell containerización)

**Title accent (ch5 era-authentic modern minimal)**:
- `border-bottom: 2px solid var(--c-accent)` (#6366f1 indigo)
- `padding-bottom: var(--sp-xs)` (4px)
- `display: inline-block` (border solo bajo el texto, no full-width)

**Estados**:

| Estado | Tratamiento |
|--------|-------------|
| Initial (not in viewport) | `opacity: 0; transform: translateY(24px)` |
| Revealed (in viewport ≥20%) | `opacity: 1; transform: none` (300ms transition) |
| Hover | Card translates up 2px + shadow intensifica — 150ms (D-05) |
| Focus-within | Heredado `:focus-visible` 3px `--c-focus` (#6366f1) en `<a>` |
| PRM | Instant render desde mount, sin transition |

**i18n keys**: consume `project.titleKey` y `project.descKey`.

### 6.8 Chapter{0,1,2,4,5}Content.vue wrappers

**Propósito**: Replicar el patrón canonical de `Chapter3Content.vue` per chapter
con era-specific styling. Layout 2-col desktop (200px aside meta + 1fr content) /
stacked mobile (<600px). Padding-left desktop 160px (StickyTimeline space-reservation
D3-09 Opción A heredada).

**Estructura común** (todos los 5):
```html
<div class="chN-layout">
  <aside class="chN-meta">
    <img class="chN-avatar" :src="chapter.avatarSrc" :alt="t('avatar.busts.N.alt')"
         width="160" height="192" loading="lazy" />
    <p class="chN-year">{{ chapter.year }}</p>
    <p class="chN-era">{{ t(chapter.eraKey) }}</p>
  </aside>
  <div class="chN-content">
    <!-- era-signature embed: TerminalScroll | MarqueeBanner | FlashBanner | ParallaxLayers+FloatingPanel | ScrollRevealCard -->
    <div class="chN-bio">
      <p>{{ t(bio.coreKey) }}</p>
    </div>
    <!-- Project list per chapter (ch0/ch1 no projects — flavor text only; ch2/ch4/ch5 sí) -->
    <div v-if="chNProjects.length > 0" class="chN-projects">
      <!-- ProjectCard variant per chapter OR FloatingPanel (ch4) OR ScrollRevealCard (ch5) -->
    </div>
  </div>
</div>
```

**Per-chapter projects rendering**:
- Ch0/Ch1: no `<ProjectCard>` — flavor text via TerminalScroll/MarqueeBanner cuenta la "pre-carrera".
- Ch2: `<ProjectCard v-for="p in ch2Projects" :project="p" />` con `[data-chapter="2"]` cascade variant.
- Ch4: `<FloatingPanel v-for="p in ch4Projects" :project="p" />` (component diferente, NO ProjectCard).
- Ch5: `<ScrollRevealCard v-for="p in ch5Projects" :project="p" />` (component diferente).

**Por qué ch4/ch5 no usan ProjectCard variant + por qué ch2 sí**:
- Ch2 Flash es **skeumorphic depth** — el patrón ProjectCard base (gradient + drop shadow + emboss) es directamente extensible con override de `--c-accent` y `linear-gradient` direction.
- Ch4 AR/VR es **glass holographic** — backdrop-filter blur + cyan border + glow inset+outer son tan estructuralmente distintos que un component dedicado (FloatingPanel) es más limpio que un variant de ProjectCard.
- Ch5 modern minimal es **flat + scroll-reveal interaction** — la interaction layer (IntersectionObserver) es la razón principal del component dedicado (ScrollRevealCard).

**Dimensions** (heredados D3-09):

| Breakpoint | Padding-left | Padding-top | Layout |
|------------|--------------|-------------|--------|
| Desktop ≥768px | 160px (StickyTimeline space) | `calc(96px + var(--sp-lg))` (StickyAvatar space) | grid 2-col `200px 1fr` |
| Mobile <600px | 60px (StickyTimeline mobile year-only space) | `calc(68px + var(--sp-sm))` | stacked, padding-bottom safe area |

**Height** (D3-12 carry-forward):
- Desktop: `height: 100%; overflow-y: hidden` (snap shell controla scroll global)
- Mobile: `height: auto; overflow-y: visible`; el `.chN-content` interno tiene `overflow-y: auto; max-height: calc(100dvh - 200px - env(safe-area-inset-bottom, 0px))` para ES 20-30% más largo sin truncar (D3-12).

**Per-chapter overrides en `chapter-themes.css @layer components`**:

Cada `Chapter{N}Content.vue` declara su `<style scoped>` PERO el grueso de styling
era-specific vive en `chapter-themes.css @layer components` como reglas
`[data-chapter="N"] .chN-...` para que el cascade respete el theme override
sin que `scoped` lo aísle demasiado.

### 6.9 ProjectCard variants per chapter (en `chapter-themes.css @layer components`)

Phase 3 ya cargó `.project-card` base + `[data-chapter="3"]` defaults Web 2.0
skeumorphic. Phase 4 añade:

```css
@layer components {
  /* [data-chapter="3"] hereda los defaults base — Phase 3 already in file */

  /* Ch2 Flash skeumorphic — orange→purple gradient + thicker border */
  [data-chapter="2"] .project-card {
    background:
      linear-gradient(
        to bottom,
        rgba(255, 136, 0, 0.18) 0%,
        rgba(128, 96, 192, 0.08) 50%,
        rgba(0, 0, 0, 0.1) 100%
      ),
      var(--c-surface, #1a0a3a);
    border: 2px solid var(--c-accent);  /* #ff8800 orange thicker */
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  [data-chapter="2"] .project-card-title {
    font-family: 'Verdana', 'Trebuchet MS', sans-serif;
    color: var(--c-fg);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  [data-chapter="2"] .project-card-link {
    background: linear-gradient(
      to bottom,
      var(--c-accent),
      color-mix(in srgb, var(--c-accent) 60%, #000)
    );
    border-radius: 4px;  /* Flash era squarer than Web 2.0 */
  }

  /* Ch4 — NO ProjectCard variant; FloatingPanel is the component (§6.5).
     If executor adds a fallback .project-card variant for ch4, follow this stub: */
  [data-chapter="4"] .project-card {
    background: rgba(20, 32, 80, 0.45);
    backdrop-filter: blur(12px) saturate(120%);
    border: 1px solid var(--c-accent);  /* cyan */
    box-shadow: 0 0 24px rgba(0, 255, 255, 0.25);
    /* NOT used in Phase 4 main path — FloatingPanel.vue is canonical */
  }

  /* Ch5 — NO ProjectCard variant; ScrollRevealCard is the component (§6.7).
     Stub fallback if needed: */
  [data-chapter="5"] .project-card {
    background: #f5f7fb;
    border: 1px solid var(--c-border);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    /* NOT used in Phase 4 main path — ScrollRevealCard.vue is canonical */
  }
}
```

---

## 7. Avatar 7-bust Visual Spec (D4-01, D4-03, ART-01)

### 7.1 Dimensiones y rendering

| Slot | Dimensión | Where | Notes |
|------|-----------|-------|-------|
| Sticky top-left | 80×96px desktop / 56×68px mobile | `StickyAvatar.vue` (Phase 1) | Display CSS — actual asset puede ser 80×96 o 160×192 con `image-rendering: pixelated` |
| In-content `Chapter{N}Content` | 160×192px desktop / 96×116px mobile | `aside.chN-meta` | Pattern Chapter3Content; pixel-perfect rendering |
| Source asset | 80×96px (480×270 virtual / pixelforge native output) | `public/assets/ch{N}-bust.png` | `image-rendering: pixelated` permite scale ×2 sin blur |

### 7.2 Palette governance (D3-06 + D4-03 carry-forward)

Cada bust usa la paleta humana `§5.6 CONTENT-CHECKLIST` replicada en
`chapters[N].palette` (skin tone, hair, clothing dominant per era). Cada call
pixelforge: `palette: chapter.palette` explícito (ART-06).

### 7.3 Aging progression markers per bust

| Bust | Edad | Era-specific identity markers | Photo anchor (D4-03) |
|------|------|------------------------------|----------------------|
| ch0-bust | ~10 (1995) | Cara infantil, pelo corto naturalmente desordenado, ropa casual años 90 (camiseta liso, sin marcas), expresión curiosa | aging-down 2011.jpg |
| ch1-bust | ~17 (2001) | Adolescente, pelo medio largo (era nu-metal/gamer adolescente), camiseta gráfica o solid color, expresión bromista | aging-down 2011.jpg |
| ch2-bust | ~22 (2009) | Joven adulto, pelo más definido, ojos un poco más maduros, posible polo o camiseta dev | leve aging-down 2011.jpg |
| ch3-bust | ~26 (2013) | Adulto profesional joven, expresión confiada, ropa profesional-casual | anchor 2011.jpg + 2016.jpeg |
| ch4-bust | ~30 (2015-18) | Adulto, gestualidad un poco más asentada, posible barba ligera o stubble | anchor 2016.jpeg + 2019.jpg |
| ch5-bust | ~36 (2022-23) | Madurez visible, primeras canas posibles, expresión reflexiva | anchor 2022.jpeg + 2024.jpg |
| ch6-bust | ~40 (2026) | Canas livianas visibles, expresión calma + maestría, ropa pixel art retro-futurista | anchor 2026.jpg + 2024.jpg |

**Style consistency markers (across the 7)**:
- Mismo estilo pixel art: 16-bit chunky, edges definidos, no antialiasing.
- Mismo skin tone base (palette humana §5.6).
- Mismo eye shape / nose / mouth structure (identity invariante).
- Solo edad + accesorios + ropa varían.

### 7.4 Pixel-perfect compositing

- `image-rendering: pixelated` aplicado globally en `index.html` `<style>` (heredado Phase 1).
- Display sizes son múltiplos enteros del source: 80→160 (×2), 56→— (mobile sticky usa native 80 scaled down 70%), 96→160 in-content desktop (×2 vertical), etc.
- `width` y `height` attributes en `<img>` declarados explícitamente (CLS prevention).

### 7.5 Bust 0 (W0 validation gate)

Antes del batch 6 restantes, W0 ejecuta **`ch3-bust` primero** como gate de validación:
- `forge_sprite` con `references: [2011.jpg]` + `palette: chapters[3].palette` (estos
  últimos pending §5.6 pero stub `#deb892, #4a3d2c, ...` puede servir).
- Verificar que el output es coherente con la foto antes de batch.
- Si NO coherente: iterar prompt; NO continuar al batch hasta tener un anchor sólido.

---

## 8. Accessibility Design Contracts

### 8.1 Focus rings per chapter (heredados Phase 2 §9.2)

Phase 4 NO modifica `:focus-visible` universal (`outline: 3px solid var(--c-focus);
outline-offset: 3px` heredado App.vue). Solo overridea `--c-focus` per chapter
via `[data-chapter="N"]` blocks (todos los hex ya lockeados Phase 2):

| Chapter | `--c-focus` | Contrast vs `--c-bg` |
|---------|-------------|----------------------|
| ch0 | `#00ff41` | 15.3:1 sobre `#000000` |
| ch1 | `#ffffff` | 8.6:1 sobre `#000080` |
| ch2 | `#ffaa00` | 8.4:1 sobre `#2a1a4a` |
| ch4 | `#00ffff` | 12.8:1 sobre `#0a0f2e` |
| ch5 | `#6366f1` | 5.2:1 sobre `#ffffff` |

**Todos cumplen WCAG AA ≥ 3:1 para outlines.** A11Y-03 satisfecho.

### 8.2 Alt text contract A11Y-06 (D4-11)

**Shape requerida** per bust (ES + EN paridad, refined en W5 ratificación Rafael):

| ch | ES draft | EN draft |
|----|----------|----------|
| 0 | "Rafael a los 10 años frente a un monitor CRT, era de comandos en terminal (1995)" | "Rafael at 10 in front of a CRT monitor, command-line era (1995)" |
| 1 | "Rafael adolescente a los 17, en una página web HTML 90s con marquees y fondo estrellado (2001)" | "Rafael as a teenager at 17, on a 90s HTML page with marquees and starry background (2001)" |
| 2 | "Rafael a los 22, programador de gameplay en la era Flash, banner vector colorido (2009)" | "Rafael at 22, gameplay programmer in the Flash era, colorful vector banner (2009)" |
| 3 | "Rafael a los 26, web 2.0 era diseñador y líder de equipo en Pink Parrot (2013)" | "Rafael at 26, web 2.0 era designer and team lead at Pink Parrot (2013)" |
| 4 | "Rafael a los 30, era AR/VR con paneles holográficos flotantes (2015-2018)" | "Rafael at 30, AR/VR era with floating holographic panels (2015-2018)" |
| 5 | "Rafael a los 36, era moderna animada, líder frontend (2022-2023)" | "Rafael at 36, modern animated era, frontend lead (2022-2023)" |
| 6 | "Rafael a los 40, era de convergencia QA + IA, ambiente espacial pixel art (2026)" | "Rafael at 40, QA + AI convergence era, pixel art space ambient (2026)" |

**Validation**:
- `tests/i18n/parity.test.js` (Phase 2 W0) enforza que cada key `avatar.busts.N.alt`
  en es.json tenga su contraparte en en.json.
- Rafael ratifica W5 manual checklist §A11Y-06 verbatim or revisa.

### 8.3 SkipLink + LangToggle invariantes (no tocar Phase 4)

Heredados Phase 1/2 sin modificación. Phase 4 chapters NO tematizan estos elementos
(HUD invariante).

### 8.4 Marquee a11y caveat (D4-05)

`<marquee>` no es focusable y no anuncia contenido controladamente.
**Compensation documented**: el contenido del marquee es FLAVOR text ("Welcome to
my GeoCities-style homepage", "Under construction") — bio/proyectos/contacto
crítico siguen accesibles via Chapter1Content body + ContactHUD persistente +
Avatar aria-label + Chapter title era-key.

### 8.5 Reduced motion respected (D4-10 explicit per component)

Ver §1 tabla D4-10a..e. Cada nuevo component documenta su rama PRM en su sección
(§6.1..§6.7). Test coverage en W1-W4 component test files.

### 8.6 Tab order Phase 4 (extiende Phase 1 §10)

Phase 4 NO añade focusables nuevos en el HUD invariante. Los focusables nuevos
son INSIDE chapter content (project links, FloatingPanel `<a>`, ScrollRevealCard `<a>`):

1. SkipLink (Phase 1)
2. LangToggle (Phase 2)
3. `#main-content` ScrollShell (Phase 1)
4. 7 timeline tick-buttons (Phase 1)
5. ContactHUD 3 iconos email/LinkedIn/GitHub (Phase 3)
6. **NUEVO Phase 4**: Project links inside chapter content (rendered según el chapter activo) — solo cuando el chapter está en viewport, dado scroll-snap.

---

## 9. Mobile + Responsive Behavior

### 9.1 Breakpoints (heredados Phase 1)

| Nombre | Condición | Uso |
|--------|-----------|-----|
| `mobile` | `width < 600px` | StickyAvatar + StickyTimeline shrink (heredado); Chapter{N}Content stacked + padding-left 60px |
| `desktop` | `width ≥ 600px` (mid-tier 768px+ para 2-col layout) | Chapter{N}Content 2-col 200px aside + 1fr content + padding-left 160px |

### 9.2 Per-chapter adaptaciones mobile

**Ch0 TerminalScroll**: font-size 18px (down from 20px), padding `var(--sp-sm)` (down from md), min-height 180px.

**Ch1 MarqueeBanner**: speed reduced (`scrollamount="4"` para que texto sea legible en pantalla pequeña). Tabla legacy mobile: full-width, padding 8px. GIF "under construction": max-width 80px.

**Ch1 StarfieldBg**: gradients reducidos a 6-8 (vs 10-12 desktop) para perf.

**Ch2 FlashBanner**: padding `var(--sp-md)` (down from lg), chrome dots removed (decorativo only); height shrinks proportional.

**Ch4 ParallaxLayers**: **3 layers max en mobile** (drop "ships-near" o merge con panels-fg). Performance budget per Pattern 1: 3 capas cómodas mobile, 4 con cuidado. PRM: igual rama (factor 1.0 uniform).

**Ch4 FloatingPanel**: width 100%, backdrop-blur reducido a `blur(6px)` (perf cost en Safari mobile).

**Ch5 ScrollRevealCard**: width 100%, padding `var(--sp-md)`, reveal animation se mantiene
(IntersectionObserver es performant en mobile).

### 9.3 Layout shift mitigation (I18N-05 + Pitfall 8 heredado)

ES corre 20-30% más largo que EN. Phase 4 specific concerns:

- **Ch0 TerminalScroll lines**: si lines ES vs EN difieren en cantidad, padding inferior se ajusta — usar `min-height: 240px` (desktop) para evitar CLS al locale toggle.
- **Ch1 MarqueeBanner**: marquee speed es consistente independiente del texto length (scrollamount fixed). Layout no shift.
- **Ch2/Ch4/Ch5 project cards**: `min-height` declarado en cada card (180px ch2, 200px ch4, 160px ch5) para que ES textos largos no causen reflow vs EN.
- **Avatar in-content + year + era labels**: dimensions hardcoded (`width: 160; height: 192;`), no shift.

### 9.4 iOS specific (heredado risk Phase 1 Plan 07 deferred)

Features sensibles a Safari iOS en Phase 4:
- `<marquee>` ch1 — soportado todos los browsers iOS (vestigio legacy estándar).
- Ch4 multi-layer parallax — `transform: translateY` runs OK; ojo con `will-change` que puede consumir memoria en iPad antiguo.
- Ch5 IntersectionObserver — soportado iOS 12.2+.
- Backdrop-filter ch4 FloatingPanel — soportado iOS 9+ con `-webkit-backdrop-filter`.

Mitigations preventivas documentadas; smoke test real diferido hasta hardware.

---

## 10. Performance Budgets

### 10.1 Bundle delta target Phase 4

**Pixel art assets nuevos (~13 total):**
- 7 busts × 80×96px (~5-15 KB cada bust ≈ 50-100 KB total)
- ch2-bg.png 480×270 (~30-60 KB)
- ch4-bg-stars-far / planet-mid / fg-panels / fg-ships × ~30-60 KB = 120-240 KB
- ch5-hero.png 480×270 (~30-60 KB)
- **Total estimated: ~230-460 KB**

Target: **≤ 500 KB** pixel art added. Si excede, primer recourse: `optimize_sprite`
con palette quantization más agresiva.

### 10.2 Fonts (NO Phase 4 changes)

Phase 2 ya cargó 6 woff2 subsets (~285.8 KB total) — invariante.

### 10.3 LCP (Largest Contentful Paint)

**ch3 default landing** (ya optimizado Phase 3) sigue siendo el LCP candidate.
Phase 4 NO degrada — ch3 no se toca.

**Per-chapter LCP candidates** (cuando el visitor scrollea a ese chapter):
- ch0: TerminalScroll first line texto (no asset blocking)
- ch1: MarqueeBanner content (no asset blocking, marquee es nativo)
- ch2: `ch2-bg.png` background-image (load on `[data-chapter="2"]` viewport)
- ch4: `ch4-bg-stars-far.png` (lazy-load, primer layer en aparecer)
- ch5: `ch5-hero.png` (lazy-load on viewport)

**Lazy loading strategy**:
- Avatar busts `Chapter{N}Content` aside: `loading="lazy"` declarado.
- ParallaxLayers `<img>`: `loading="lazy"`.
- BackgroundLayers (Phase 2 D2-04): consumed via CSS `background-image: var(--bg-image, none)` — preloaded by browser when section is in/near viewport.

### 10.4 Animation perf budget

- Ch1 starfield twinkle: opacity only — compositor thread.
- Ch4 parallax 4 layers: `transform: translateY` only + `will-change: transform`.
  Target 60fps desktop / 30fps mobile mínimo.
- Ch5 ScrollRevealCard: opacity + transform — 300ms transitions, only firing on
  intersection (not continuous).
- Ch0 cursor blink: opacity 1↔0 step animation — negligible.

---

## 11. Copywriting Contract

### 11.1 i18n keys nuevos Phase 4

Convención jerárquica heredada Phase 2: `{namespace}.{N}.{key}`.

**Chapter flavor + signature components**:

```
chapters.0.flavor          (array string ES + EN — texto bio terminal)
chapters.0.terminalPrompt  ("$ " — usually NO i18n needed, ES=EN)
chapters.1.marqueeText     (single string ES + EN)
chapters.1.marqueeAria     (label aria del marquee — D4-05 a11y compensation)
chapters.1.tableLabel      (label de tabla legacy "ME 101")
chapters.2.bannerTitle     (FlashBanner heading)
chapters.2.bannerSubtitle  (FlashBanner subtitle)
chapters.4.parallaxAria    (aria-label del ParallaxLayers — opcional)
```

**Projects ch2/ch4/ch5**:

```
projects.{id}.title        (project title)
projects.{id}.desc         (project description)
```

Where `{id}` examples:
- Ch2 Flash era: `bluelizard`, `matte`, `joju`
- Ch4 AR/VR era: `arvr-own`, `metrodigi`
- Ch5 Modern era: `bairesdev`, `number8`, `vivoenvivo`, `rocketsnail`, `remoose`

Rafael completa CONTENT-CHECKLIST §2.1/§2.3/§2.4 con title + desc por proyecto.

**Avatar busts (refined era-accurate)**: claves ya existen (`avatar.busts.{0..6}.alt`)
con valores placeholder Phase 2; Phase 4 W5 reemplaza con drafts §8.2 ratificados.

### 11.2 Primary CTA per chapter

Phase 4 NO introduce un primary CTA nuevo (no hay conversion flow). El existing
"Ver proyecto →" / "View project →" key `ui.openProject` (Phase 3) se reusa en
ch2 ProjectCard, ch4 FloatingPanel link, ch5 ScrollRevealCard link.

### 11.3 Empty state copy

Si no hay proyectos en un chapter (escenario actual de placeholder):
- **Default**: simplemente NO renderizar la sección de proyectos (`v-if="chNProjects.length > 0"` — patrón heredado Chapter3Content).
- No se muestra "no hay proyectos" — chapters 0/1 son flavor text only by design.

Si Rafael CONTENT-CHECKLIST §2.1/§2.3/§2.4 está vacío al execute, el wave entra
en checkpoint:human-input (D4-09) — el ejecutor NO renderiza placeholder "PENDING"
visible al user; espera a que Rafael complete.

### 11.4 Error state copy

Phase 4 NO tiene flujos con error (no forms, no submissions, no API calls).
Si una imagen falla en cargar (`ch{N}-bust.png` o background), el alt text es
suficiente — no se muestra "error" UI.

### 11.5 Destructive actions

Ninguna en Phase 4.

### 11.6 Tabla resumen copy keys

| Elemento | i18n key | ES (verbatim/draft) | EN (verbatim/draft) |
|----------|----------|---------------------|---------------------|
| Ch1 marquee aria | `chapters.1.marqueeAria` | `Banner decorativo era HTML 90s` | `Decorative banner — 90s HTML era` |
| Ch2 banner title | `chapters.2.bannerTitle` | `Era Flash · 2009` | `Flash Era · 2009` |
| Ch2 banner subtitle | `chapters.2.bannerSubtitle` | `BlueLizard / Matte CG / Joju Games` | `BlueLizard / Matte CG / Joju Games` |
| Ch4 parallax aria | `chapters.4.parallaxAria` | `Escena AR/VR con paneles flotantes` | `AR/VR scene with floating panels` |
| Open project (heredado) | `ui.openProject` | `Ver proyecto →` | `View project →` |

---

## 12. Motion Contract — Phase 4 additions

Tabla **complementaria** a Phase 1 §8 + Phase 2 §13.

| Transición | Elemento | Default duration | Default easing | Bajo PRM | Reference |
|-----------|----------|------------------|----------------|----------|-----------|
| Ch0 cursor blink | `.terminal-cursor` | 1s infinite alternate | step (binary opacity) | `animation: none` — cursor estático | D4-10a |
| Ch0 typing animation (opcional) | `.terminal-line` | 30-50ms per char | step | Instant render all lines | D4-10a |
| Ch1 starfield twinkle | `.starfield-bg` | 3s infinite alternate | ease-in-out | `animation: none` — fondo estático | D4-10c |
| Ch1 marquee scroll | `<marquee>` | nativo (≈infinite) | linear | swap a `<span>` estático vía `v-if` | D4-10b / D4-05 |
| Ch2 FlashBanner static | — | (no animation) | — | — | — |
| Ch4 parallax translateY | `.parallax-layer` | continuous (driven by scrollProgress) | linear data binding | factor 1.0 uniforme (sin diferencial) | D4-10d / D-06 |
| Ch4 FloatingPanel hover glow | `.floating-panel:hover` | 150ms | ease | 150ms (interaction-derived ok D-06) | D-05 |
| Ch5 ScrollRevealCard reveal | `.scroll-reveal-card.is-revealed` | 300ms | ease (opacity + transform) | instant (no transition) | D4-10e |
| Ch5 card hover lift | `.scroll-reveal-card:hover` | 150ms | ease | 150ms (D-06) | D-05 |
| Project link `:active` press | various | 80ms | ease | 80ms (D-06 interaction-derived) | D-05 |

**Importante**: Phase 4 NO añade animaciones decorativas autoplay (D-06 prohíbe).
Las únicas auto-played son cursor blink (ch0) + starfield twinkle (ch1) + marquee
nativo (ch1) — todas con rama PRM explícita.

---

## 13. Pixel Art Constraints

### 13.1 Resolution + rendering

- Virtual base: **480×270** (16:9), zoom ×3 (heredado CLAUDE.md).
- Display target: 1440×810 effective.
- `image-rendering: pixelated` global (heredado index.html Phase 1).
- Avatar busts: 80×96 native (or 96×96 if pixelforge defaults), displayed at 80×96 sticky / 160×192 in-content (×2 nearest neighbor).
- Backgrounds: 480×270 native (or 960×540 → `optimize_sprite` downscale to 480×270).

### 13.2 Aspect ratios per asset type

| Asset type | Aspect | Source dimension | Display dimension |
|------------|--------|------------------|-------------------|
| Avatar bust | 5:6 (portrait) | 80×96px | 80×96 sticky / 160×192 in-content |
| Background full-frame | 16:9 | 480×270px | 1440×810 (×3) o cover de section |
| Parallax layer (ch4) | 16:9 ó wider (ej. 480×324 con 20% overflow vertical para travel) | 480×270-324 | full-bleed inside section |

### 13.3 Palette governance per call (D3-06 carry-forward)

Cada `forge_*` call recibe `palette: chapter.palette` explícito desde
`src/data/chapters.js`. Rafael ratifica la paleta humana §5.6 y per-chapter
§5.1/§5.3/§5.4 antes de la wave.

### 13.4 Naming convention (ART-05)

`ch{N}-{descriptor}[-{variant}].png` en `public/assets/`. Validated by
`tests/assets/asset-naming.test.js` (W0 nuevo).

Patrones específicos Phase 4:
- `ch{0..6}-bust.png` — 7 avatar busts
- `ch2-bg.png` — Flash era background flat
- `ch4-bg-stars-far.png`, `ch4-bg-planet-mid.png`, `ch4-fg-panels.png`, `ch4-fg-ships.png` — parallax layers
- `ch5-hero.png` — Modern hero

### 13.5 Adobe MCP post-process

Aplicar `image_remove_background` para sprites si pixelforge no entrega alpha clean.
`image_crop_and_resize` para dimensiones exactas. `image_adjust_hsl` para harmonizar
paleta cross-bust.

---

## 14. Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — no shadcn en este proyecto (Vue 3, no React) | not applicable |
| third-party | none declarados en Phase 4 | not required |
| npm `@vueuse/core@^14.3.0` | `useIntersectionObserver` (Vue composable, MIT license) | not required (utility composable, no UI block) |
| pixelforge-mcp / Adobe MCP | Asset generation tools — NO UI components ingested into project | not applicable (assets are output files, not third-party code) |

**No third-party UI components.** Todos los components Phase 4 son propios
(TerminalScroll, MarqueeBanner, StarfieldBg, FlashBanner, FloatingPanel,
ParallaxLayers, ScrollRevealCard, Chapter{0,1,2,4,5}Content). Las únicas
dependencias externas son los assets pixel-art generados (output files commited),
las 7 fuentes self-hosted (Phase 2 ya verified OFL-1.1), y el utility composable
`useIntersectionObserver` de @vueuse/core.

---

## 15. Phase 4 Visible Verification Checklist (para checker + auditor)

Lo que el usuario debe ver al abrir `http://127.0.0.1:5173/` tras completar Phase 4:

### 15.1 Ch0 — Terminal (1995)
- [ ] Fondo `#000000`, foreground `#00ff41` phosphor green, font VT323 monoespaciada
- [ ] `TerminalScroll` renderiza 6-8 lines de flavor text con prompt `$ ` antes de cada
- [ ] Cursor parpadeante visible al final del output (1s blink default; estático PRM)
- [ ] Avatar in-content `ch0-bust.png` ~10 años visible (cuando W0 entregue asset)
- [ ] Heading "1995 · Terminal" en VT323

### 15.2 Ch1 — HTML 90s (2001)
- [ ] Fondo `#000080` navy + StarfieldBg twinkle (PRM: estático)
- [ ] Comic Neue font visible en body + tabla legacy `border="1"`
- [ ] `<marquee>` real scrolling left con texto bilingüe (PRM: `<span>` estático)
- [ ] Avatar in-content `ch1-bust.png` adolescente ~17 años visible
- [ ] Heading + GIFs "under construction" tinteados visibles
- [ ] Magenta `#ff00ff` sobre navy `#000080` con font-size ≥18px (compensation THM-05)

### 15.3 Ch2 — Flash (2009)
- [ ] Background `ch2-bg.png` full-frame visible (loaded via BackgroundLayers D2-04 vía `--bg-image`)
- [ ] `FlashBanner` header skeumorphic orange→purple gradient con chrome dots window mock
- [ ] 1-3 ProjectCards (BlueLizard/Matte/Joju) con variant `[data-chapter="2"]` orange-bordered Flash skeumorphic
- [ ] Verdana/Trebuchet font visible en body
- [ ] Avatar in-content `ch2-bust.png` ~22 años visible
- [ ] Focus ring `#ffaa00` amber sobre dark purple

### 15.4 Ch4 — AR/VR (2015-18)
- [ ] `ParallaxLayers` con 3-4 capas en movimiento diferencial al scroll (PRM: factor 1.0 uniforme)
- [ ] 1-3 `FloatingPanel` glass holográfico con `backdrop-filter: blur(12px)` + cyan border `#00ffff` + glow inset+outer
- [ ] Audiowide font visible en headings (weight 400 only)
- [ ] Avatar in-content `ch4-bust.png` ~30 años visible
- [ ] Tech-stack chips dentro de FloatingPanel con cyan border
- [ ] Focus ring `#00ffff` cyan visible al tab

### 15.5 Ch5 — Modern (2022-23)
- [ ] Background `ch5-hero.png` pixel art abstract/minimal visible
- [ ] 1-3 `ScrollRevealCard` modern flat (NO skeumorphic depth) que fade+slide-in al entrar viewport (PRM: instant)
- [ ] Card titles con indigo `#6366f1` underline accent (Inter Variable weight 600)
- [ ] Inter Variable font visible (weights 400/600 en diferentes roles; microcopy diferenciada via `letter-spacing: 0.02em`, NO weight extra)
- [ ] Avatar in-content `ch5-bust.png` ~36 años visible
- [ ] Box-shadow subtle modern minimal — NO embossed text shadows

### 15.6 Avatar batch (W0 — todos los 7 busts)
- [ ] StickyAvatar top-left swappea correctamente entre los 7 busts según `activeChapter`
- [ ] Cada bust muestra envejecimiento coherente (~10/17/22/26/30/36/40 reconocibles)
- [ ] Estilo pixel art consistente across los 7 (mismo skin tone base + identity invariante)
- [ ] Alt text ES/EN descriptivo era-accurate visible en DevTools accessibility tree

### 15.7 Cross-chapter integration
- [ ] Scroll ch0→ch5 muestra transformación visual inequívoca en cada salto (THM-04)
- [ ] BackgroundLayers crossfade entre eras 200ms default / 150ms PRM (D-03)
- [ ] Layout sin shifts al locale toggle ES/EN en cada chapter (I18N-05)
- [ ] ningún `data-chapter` filtra estilos a chapter adyacente durante snap
- [ ] StickyTimeline + StickyAvatar + LangToggle + ContactHUD visibles invariantes en los 5 chapters
- [ ] PRM activado: cursor ch0 estático, marquee ch1 swap `<span>`, starfield ch1 estático, parallax ch4 factor 1.0, scroll-reveal ch5 instant

### 15.8 A11Y
- [ ] Alt text bilingüe ratificado por Rafael en W5 visible (7 busts × ES/EN)
- [ ] Focus ring 3px solid `--c-focus` aplicado uniformemente (color cambia per chapter)
- [ ] Tab order: SkipLink → LangToggle → ScrollShell → 7 timeline ticks → ContactHUD → project links del chapter activo
- [ ] Marquee a11y caveat documentado (flavor text, no info crítica)
- [ ] No CLS al locale toggle (verificable Lighthouse)

---

## 16. Out of Scope (Phase 5+)

| Item | Fase que lo implementa |
|------|------------------------|
| Ch6 escena Phaser + parallax descendente + ships + planets-proyecto | Phase 5 (PHA-01..09) |
| Mantra easter egg "And always show a smile" en ch6 footer | Phase 5 (CON-04) |
| Phaser locale bridge | Phase 5 (PHA-06) |
| Phaser project click overlay | Phase 5 (PHA-07) |
| Firebase Hosting deploy + cache headers + firebase.json | Phase 6 (DEPLOY-*) |
| iOS smoke test confirmatorio | Deferred Phase 1 Plan 07 (hardware iOS pending) |
| 3er idioma PT-BR/FR | v2 (I18N3-01) |
| CSS scroll-driven animations API native | v2 (caniuse 2026 maduro pero Firefox flag — diferido) |
| Container queries para responsive themes | v2 |
| Era-authentic content forms beyond cards (Flash SWF embed actual, Lottie ch5) | v2 (EAP-01) |
| ProjectCard hover lift en mobile | Phase 3 deferred touch polish |
| Custom 404 GeoCities-style ch1 | v2 (POL-03) |
| Sound design | v2 (POL-02) |
| Bento grids, glassmorphism global (más allá de FloatingPanel ch4), custom cursors, dark/light toggle | OUT OF SCOPE permanente (REQUIREMENTS.md) |

---

## 17. Inheritance from Phase 1 + Phase 2 + Phase 3

Phase 4 **hereda y NO modifica** lo siguiente:

**De Phase 1 (`01-UI-SPEC.md`):**
- §3 Spacing Tokens (`--sp-*`)
- §4 Color Tokens base `:root` neutral fallback
- §6 Layout y Regiones Sticky (StickyAvatar top-left, StickyTimeline bottom)
- §7.1 ChapterSection DOM contract (hardcoded `data-chapter` en `ScrollShell.vue` líneas 74-86)
- §7.2 StickyAvatar
- §7.3 StickyTimeline
- §7.4 SkipLink
- §8 Motion Contract D-01..D-06
- §9 Responsive Behavior (breakpoint <600 + ResizeObserver)
- §10 Accessibility Contract base

**De Phase 2 (`02-UI-SPEC.md`):**
- §4.2 7 chapter color blocks (`[data-chapter="N"]` en `chapter-themes.css`)
- §5 Typography per chapter — 7 fonts self-hosted woff2
- §6 @layer cascade order (`reset, themes, components, utilities`)
- §7 BackgroundLayers component contract (2-layer crossfade vía `--bg-image`)
- §8 LangToggle component
- §9 Focus ring policy per chapter
- §10 Theme bleed prevention contract (THM-04)
- §11 Copywriting Contract i18n keys (Phase 4 EXTIENDE, no replace)
- §12 Mobile adaptations <600px (LangToggle icon-only + SkipLink overflow mitigation)
- §13 Motion Contract D-03 bg morph + LangToggle hover (Phase 4 EXTIENDE)

**De Phase 3 (`03-CONTEXT.md` D3-01..D3-12):**
- D3-01..04 data architecture (`src/data/{chapters,projects,bio,contact}.js`)
- D3-09 Opción A layout per-chapter (2-col desktop + padding-left 160px / stacked mobile padding-left 60px)
- D3-10 ContactHUD persistente (NO Phase 4 scope — heredado invariante)
- D3-11 ProjectCard skeumorphic Web 2.0 base (Phase 4 añade variants per chapter)
- D3-12 mobile ch3 abandona `100dvh` strict — Phase 4 chapters siguen el mismo patrón

**Phase 4 EXTIENDE Phase 3 sin re-implementar.** El executor que vea un component
Phase 1/2/3 NO lo modifica — solo añade keys i18n, variants en `chapter-themes.css
@layer components`, y components nuevos era-signature.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (§11 — i18n keys nuevos para 5 chapter flavor + 5 component arias + projects ch2/ch4/ch5 + alt-text refined; paridad enforced via tests/i18n/parity.test.js)
- [ ] Dimension 2 Visuals: PASS (§6 — 6 era-signature components + 5 wrappers + ProjectCard variants per chapter especificados con dimensiones, estados, interactions)
- [ ] Dimension 3 Color: PASS (§5 — 60/30/10 heredado Phase 2 con accent reserved-for explicit per chapter; contrast tradeoff ch1 documented from Phase 2)
- [ ] Dimension 4 Typography: PASS (§4 — 7 fonts heredadas Phase 2 + Phase 4 lockea 3 sizes × ≤2 weights per chapter)
- [ ] Dimension 5 Spacing: PASS (§3 — heredados Phase 1 `--sp-*` sin cambios; excepciones declaradas con justificación)
- [ ] Dimension 6 Registry Safety: PASS (§14 — no third-party UI components; @vueuse/core utility composable MIT; pixelforge/Adobe MCP son output tools no UI ingest)

**Approval:** pending (gsd-ui-checker validará las 6 dimensions)

---

*UI-SPEC generated: 2026-05-13*
*Sources: 04-CONTEXT.md (D4-01..D4-11), 04-RESEARCH.md (Patterns 1-10 + Architecture Map),
 03-CONTEXT.md (D3-09..D3-12 layout pattern carry-forward + D3-11 ProjectCard base),
 02-UI-SPEC.md (themes/fonts/layer cascade heredados), 01-UI-SPEC.md (spacing/motion/sticky heredados),
 REQUIREMENTS.md (ART-02/03/04/07, A11Y-06, cross-cutting CORE-09 PRM + THM-04 isolation + THM-05
 contrast + I18N-05 layout shift + A11Y-03 focus), PROJECT.md (era mapping + tono cálido-juguetón),
 chapter-themes.css (7 chapter blocks + `.project-card` base), Chapter3Content.vue (layout pattern canonical),
 src/data/chapters.js (palette per chapter + avatarSrc), src/i18n/es.json+en.json (key namespace existing).*

*Próximo paso: gsd-ui-checker valida las 6 dimensions; gsd-planner consume para descomponer
Phase 4 en 6 waves (W0 avatar batch + W1 ch0+ch1 paralelo + W2 ch2 + W3 ch4 multi-layer +
W4 ch5 + W5 integración + manual checklist).*
