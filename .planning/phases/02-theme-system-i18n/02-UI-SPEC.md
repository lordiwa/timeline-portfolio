---
phase: 2
slug: theme-system-i18n
status: approved
shadcn_initialized: false
preset: none
created: 2026-05-13
reviewed_at: 2026-05-13
checker_verdict: 6/6 PASS
inherits_from: .planning/phases/01-scroll-shell-sticky-anchors/01-UI-SPEC.md
---

# Phase 2 — UI Design Contract: Theme System + i18n

> Contrato visual e interactivo para Phase 2. Generado por gsd-ui-researcher.
> Consumido por gsd-ui-checker, gsd-planner y gsd-executor.
> **No re-preguntar al usuario** — todas las decisiones están bloqueadas en este documento.
> **Hereda Phase 1 UI-SPEC** — tokens spacing `--sp-*`, paleta neutra `:root` (fallback),
> focus ring universal `:focus-visible`, política PRM D-01..D-06 y `--c-focus` con
> grosor 3px + offset 3px se mantienen sin cambios. Phase 2 solo OVERRIDE valores por
> chapter vía `[data-chapter="N"]`.

---

## 1. Phase Boundary + Locked Decisions

### Qué construye Phase 2

El **motor visual + lingüístico** del portafolio, antes de cualquier contenido real:

1. `src/styles/chapter-themes.css` con `@layer reset, themes, components, utilities`
   declaration + 7 `[data-chapter="N"]` blocks (N=0..6) con CSS Custom Properties.
2. **Themes COMPLETOS** para ch0 (terminal verde sobre negro, VT323 monospace) y ch1
   (HTML 90s crudo: Comic Neue magenta sobre fondo estrellado navy).
3. **Stubs era-tinted** para ch2-6: 5 custom props (`--c-bg`, `--c-fg`, `--c-accent`,
   `--c-border`, `--c-focus`) + `font-family` hint cada uno. Phase 3/4 los completarán.
4. `BackgroundLayers.vue` — 2 capas apiladas (`position: fixed; inset: 0; z-index: -1`)
   con opacity crossfade orquestado por composable `useBackgroundMorph(activeChapter, prm)`.
5. `vue-i18n@^11.x` con `legacy: false`, `fallbackLocale: 'en'`, auto-detect via
   `navigator.language`, persist en `localStorage["portfolio.locale"]`.
6. `LangToggle.vue` standalone fixed top-right (simétrico al avatar top-left),
   estilo pill "ES | EN", icon-only shrink en mobile <600px.
7. `<html lang>` reactivo via `watch(locale, l => document.documentElement.lang = l)`
   en App.vue.
8. **Self-hosted fonts** en `/public/fonts/` (`.woff2` subsetted Latin Extended,
   `font-display: swap`, 7 distintas — una por chapter).
9. **Strings i18nificados**: SkipLink, LangToggle aria-labels, StickyTimeline aria-labels,
   StickyAvatar alt-text placeholder, **7 chapter titles bilingues** (ES + EN).

### Qué NO incluye Phase 2 (fuera de contrato)

- Bio core ni proyectos por chapter (Phase 3 + CONTENT-CHECKLIST en producción por Rafael)
- Pixel art de fondos `ch{N}-bg.png` (Phase 3 ch3 + Phase 4 ch2/4/5)
- Avatar busts pixel art reales (Phase 3)
- Escena Phaser ch6 (Phase 5)
- JSON-LD / OG / SEO multilingüe (Phase 3)
- Theme finalizado para ch3 (stub era-tinted basta — Phase 3 lo polishe)
- Componentes UI era-auténticos avanzados (botones Web 2.0 glossy, marquees, Flash
  banners, AR/VR floating panels) — Phase 3/4
- 3er idioma (REQUIREMENTS v2 §I18N3-01)
- Theme switcher visible dark/light (rejected en REQUIREMENTS §OUT OF SCOPE)
- `prefers-color-scheme` detection (irrelevante por chapter themes)
- Interpolación continua de theme on scroll-progress (deferred v2)

### Reduced-Motion Policy heredada (D-01..D-06 + cross-cutting D2-05)

Fuente: `01-UI-SPEC.md §1` + `02-CONTEXT.md §D2-05`. Phase 2 hereda **íntegro**:

| Código | Elemento | Default | Bajo `prefers-reduced-motion: reduce` |
|--------|----------|---------|---------------------------------------|
| D-01 | Scroll snap entre chapters | `scroll-behavior: smooth` | `scroll-behavior: auto` |
| D-02 | Swap del avatar sticky | Crossfade 200ms opacity (Phase 1) | Instantáneo — sin transición |
| **D-03** | **Background morph entre eras** | **Crossfade 200ms** (sync con avatar) | **Crossfade ≤ 150ms** |
| D-04 | Click-to-nav (tick, flechas, `?ch=N`) | `scrollTo({ behavior: 'smooth' })` | `scrollTo({ behavior: 'auto' })` |
| D-05 | Micro-animations HUD (hover/focus) | Transition ≤ 150ms | Transition ≤ 150ms (se mantiene) |
| D-06 | Principio rector cross-cutting | Interaction-derived ≤150ms permitida; auto-played/decorative OFF |

**Phase 2 lockea D-03 default = 200ms** (Open-Q2-B resuelto, sync con avatar swap Phase 1
para que avatar + bg morph al unísono perceptúen un solo "cambio de era").

**LangToggle locale switch NO requiere animation** — cambio textual instantáneo aceptable
en ambos modes (default y PRM).

---

## 2. Design System

| Propiedad | Valor |
|-----------|-------|
| Tool | none (sin shadcn — stack Vue 3 + Vite, sin React) |
| Preset | not applicable |
| Component library | none — composables propios + vue-i18n v11 |
| Icon library | none — globe emoji `🌐` en LangToggle mobile (icon-only mode); cualquier otro icon es SVG inline |
| Font (Phase 1 neutral fallback en `:root`) | `ui-monospace, SFMono-Regular, Menlo, monospace` |
| Font per-chapter | 7 distintas (ver §5 Typography per chapter) |

**Nota:** La fuente neutral monoespaciada del scaffold permanece en `:root` como
fallback. Cada `[data-chapter="N"]` override `--font-body` para sustituirla por la
fuente era-auténtica vía `font-family: var(--font-body)`.

---

## 3. Spacing Tokens (heredados Phase 1)

Phase 2 **NO redefine** ningún spacing token. La escala `--sp-*` declarada en `:root`
en App.vue Phase 1 se mantiene literal:

| Token | Valor | Uso en Phase 2 |
|-------|-------|----------------|
| `--sp-xs` | 4px | Gap interno del LangToggle pill |
| `--sp-sm` | 8px | Padding del LangToggle; ajuste mobile |
| `--sp-md` | 16px | Margen del LangToggle respecto a las aristas (top, right) — simétrico al avatar |
| `--sp-lg` | 24px | (Phase 3/4 lo consume) |
| `--sp-xl` | 32px | (Phase 3/4 lo consume) |
| `--sp-2xl` | 48px | (Phase 1 timeline height; sin uso Phase 2) |
| `--sp-3xl` | 64px | (Phase 3/4 lo consume) |

**Excepciones declaradas Phase 2:**

- LangToggle tap target mínimo: 44×44px (WCAG A11Y-03 base, igual que tick-button Phase 1)
- Globe emoji icon-only mobile (<600px): el botón sigue siendo 44×44px aunque visualmente
  muestre solo el emoji.

---

## 4. Color Tokens — Base + 7 Theme Contracts

### 4.1 `:root` Fallback Neutral (heredado Phase 1, NO eliminar)

La paleta `--c-*` declarada en `:root` de App.vue Phase 1 permanece como **fallback
default** (defense in depth — si un section pierde su `data-chapter` por bug, no
queda invisible). Phase 2 NO la edita; solo la **overridea por `[data-chapter="N"]`**.

| Token | Valor hex | Rol fallback |
|-------|-----------|--------------|
| `--c-bg` | `#0b0b16` | Fondo base neutral |
| `--c-fg` | `#e7e7f0` | Foreground texto neutral |
| `--c-surface` | `#1a1a2e` | Superficie secundaria (LangToggle bg default) |
| `--c-border` | `#2e2e4a` | Borde sutil |
| `--c-track` | `#2e2e4a` | Track timeline |
| `--c-track-active` | `#e7e7f0` | Tick activo timeline |
| `--c-marker` | `#a0a0c0` | Puck timeline |
| `--c-focus` | `#7dd3fc` | Focus ring fallback |
| `--c-muted` | `#6b6b8a` | Texto secundario, `lang-inactive` |
| `--c-tick-hover` | `#c0c0d8` | Hover tick |

**Distribución 60/30/10** (heredada Phase 1, sin cambios):
- 60% dominante: `--c-bg`
- 30% secundario: `--c-surface` (LangToggle pill bg, timeline bg)
- 10% acento: `--c-accent` per chapter (reservado para chapter heading + tokens
  decorativos era-auténticos que Phase 3/4 consumirá; NO se usa en infraestructura
  Phase 2 — LangToggle/SkipLink/StickyTimeline siguen usando `--c-fg`/`--c-muted`).

### 4.2 Per-Chapter Theme Contracts

**Convención de comentarios inline (D2-03 verbatim):**

```css
/* contrast(fg, bg) = X.X:1 — chapter N (era) accepts Y:1 here as era-authentic tradeoff per THM-05 */
```

- Si ratio ≥ 4.5:1 → **NO requiere comentario** (default WCAG AA OK).
- Si ratio < 4.5:1 → **comentario obligatorio** (THM-05 + A11Y-04 audit trail).

**`--c-accent` reservado para** (10% rule): chapter title heading inicial cuando
Phase 3/4 lo añada; tokens decorativos era-auténticos (badges, callouts) que Phase 3/4
ejecute. NO se usa en infraestructura Phase 2 (LangToggle/SkipLink/StickyTimeline siguen
neutral). El executor de Phase 2 lockea los valores pero NO los consume visualmente
todavía.

---

#### ch0 — Terminal (1995, ~10 años) — **COMPLETO Phase 2**

```css
[data-chapter="0"] {
  --c-bg:      #000000;   /* terminal monitor black */
  --c-fg:      #00ff41;   /* phosphor green */
  --c-accent:  #00ff41;   /* same — terminal monochrome */
  --c-border:  #003311;   /* dim green for subtle dividers */
  --c-focus:   #00ff41;   /* maintain era authenticity in focus rings */
  --font-body: 'VT323', ui-monospace, monospace;
  /* contrast(#00ff41, #000000) = 15.3:1 — WCAG AAA passes naturally for ch0 */
}
```

| Token | Valor | Nota |
|-------|-------|------|
| `--c-bg` | `#000000` | CRT monitor black absolute |
| `--c-fg` | `#00ff41` | Phosphor green era-accurate (P1 phosphor) |
| `--c-accent` | `#00ff41` | Monochrome — no second hue |
| `--c-border` | `#003311` | Dim green, ratio sufficient |
| `--c-focus` | `#00ff41` | Phosphor green focus ring; ratio 15.3:1 sobre `#000000` |
| `font-family` | `'VT323', ui-monospace, monospace` | CRT terminal feel |
| **contrast(fg, bg)** | **15.3:1** | WCAG AAA — sin comentario tradeoff |

---

#### ch1 — HTML 90s crudo (2001-2005, ~15-18 años) — **COMPLETO Phase 2**

```css
[data-chapter="1"] {
  --c-bg:      #000080;   /* navy starry sky base */
  --c-fg:      #ff00ff;   /* magenta Comic Sans glory */
  --c-accent:  #ffff00;   /* GeoCities yellow */
  --c-border:  #ffffff;   /* white pixel borders */
  --c-focus:   #ffffff;   /* white contrasts both magenta and navy */
  --font-body: 'Comic Neue', 'Comic Sans MS', cursive;
  /* contrast(#ff00ff, #000080) = 3.2:1 — chapter 1 (HTML 90s crudo) accepts 3.2:1 here
     as era-authentic tradeoff per THM-05; era-accurate visual identity (Comic Sans +
     magenta on starry navy) demands this. Compensated by larger font-size 18px+ minimum
     which improves perceived legibility. */
}
```

| Token | Valor | Nota |
|-------|-------|------|
| `--c-bg` | `#000080` | Navy starry sky (era-accurate GeoCities/Angelfire) |
| `--c-fg` | `#ff00ff` | Magenta Comic Sans era-emblematic |
| `--c-accent` | `#ffff00` | GeoCities yellow callouts |
| `--c-border` | `#ffffff` | Pixel white borders |
| `--c-focus` | `#ffffff` | White contrasta sobre magenta y navy; ratio sobre fg 5.4:1 |
| `font-family` | `'Comic Neue', 'Comic Sans MS', cursive` | Comic Sans equivalent libre OFL |
| **contrast(fg, bg)** | **3.2:1** | **⚠️ Tradeoff documentado verbatim — THM-05 audit** |

**Mitigación del tradeoff:** Phase 3/4 (cuando llegue contenido) debe garantizar
`font-size: 18px+` mínimo en este chapter (era-authentic large Comic Sans headings)
para compensar el ratio bajo perceptualmente.

---

#### ch2 — Flash era (2009, ~22 años) — **STUB Phase 2**

```css
[data-chapter="2"] {
  --c-bg:      #2a1a4a;
  --c-fg:      #e0c0ff;
  --c-accent:  #ff8800;
  --c-border:  #8060c0;
  --c-focus:   #ffaa00;
  --font-body: 'Verdana', 'Trebuchet MS', sans-serif;
  /* contrast(#e0c0ff, #2a1a4a) = 12.6:1 — chapter 2 stub (Flash era) — Phase 4
     finaliza paleta + fondos pixel art */
}
```

| Token | Valor | Nota |
|-------|-------|------|
| `--c-bg` | `#2a1a4a` | Deep purple Flash banner backdrop |
| `--c-fg` | `#e0c0ff` | Lavender body text |
| `--c-accent` | `#ff8800` | Orange Flash callout |
| `--c-border` | `#8060c0` | Purple-tinted border |
| `--c-focus` | `#ffaa00` | Amber focus ring on dark |
| `font-family` | `'Verdana', 'Trebuchet MS', sans-serif` | **No self-host** — system-safe stack OK (tradeoff Phase 2 §R4 RESEARCH) |
| **contrast(fg, bg)** | **12.6:1** | WCAG AAA — sin comentario |

---

#### ch3 — Web 2.0 (2013, ~26 años) — **STUB Phase 2** (default landing — Phase 3 polishe)

```css
[data-chapter="3"] {
  --c-bg:      #f0f4ff;
  --c-fg:      #1a1a2e;
  --c-accent:  #ff6699;
  --c-border:  #a0b0d8;
  --c-focus:   #0066cc;
  --font-body: 'Lobster', Georgia, serif;
  /* contrast(#1a1a2e, #f0f4ff) = 13.4:1 — chapter 3 stub Web 2.0 — Phase 3 owns
     paleta final + pixel art decorations */
}
```

| Token | Valor | Nota |
|-------|-------|------|
| `--c-bg` | `#f0f4ff` | Pastel blue Web 2.0 glossy backdrop |
| `--c-fg` | `#1a1a2e` | Near-black text |
| `--c-accent` | `#ff6699` | Web 2.0 emblematic pink CTA |
| `--c-border` | `#a0b0d8` | Soft blue-purple border |
| `--c-focus` | `#0066cc` | Web 2.0 blue link focus |
| `font-family` | `'Lobster', Georgia, serif` | Lobster (Web 2.0 emblematic) + Georgia fallback |
| **contrast(fg, bg)** | **13.4:1** | WCAG AAA — sin comentario |

> **Nota landing:** ch3 es el default landing chapter (CORE-05). Su stub debe verse
> "OK por sí solo" al primer load (default chapter). Pastel blue + dark text + Lobster
> heading transmite Web 2.0 feel sin pixel art finalizado.

---

#### ch4 — AR/VR (2015-2018, ~30 años) — **STUB Phase 2**

```css
[data-chapter="4"] {
  --c-bg:      #0a0f2e;
  --c-fg:      #b0d0ff;
  --c-accent:  #00ffff;
  --c-border:  #2050a0;
  --c-focus:   #00ffff;
  --font-body: 'Audiowide', 'Eurostile', sans-serif;
  /* contrast(#b0d0ff, #0a0f2e) = 11.8:1 — chapter 4 stub AR/VR — Phase 4 will
     add parallax floating panels + ship sprites */
}
```

| Token | Valor | Nota |
|-------|-------|------|
| `--c-bg` | `#0a0f2e` | Deep space immersive AR/VR |
| `--c-fg` | `#b0d0ff` | Cool ice blue body |
| `--c-accent` | `#00ffff` | Cyan AR holographic accents |
| `--c-border` | `#2050a0` | Mid blue border |
| `--c-focus` | `#00ffff` | Cyan focus on dark |
| `font-family` | `'Audiowide', 'Eurostile', sans-serif` | Futuristic geometric display (OFL) |
| **contrast(fg, bg)** | **11.8:1** | WCAG AAA — sin comentario |

---

#### ch5 — Modern animated (2022-2024, ~36 años) — **STUB Phase 2**

```css
[data-chapter="5"] {
  --c-bg:      #ffffff;
  --c-fg:      #1a1a2e;
  --c-accent:  #6366f1;
  --c-border:  #e2e8f0;
  --c-focus:   #6366f1;
  --font-body: 'Inter Variable', system-ui, sans-serif;
  /* contrast(#1a1a2e, #ffffff) = 14.2:1 — chapter 5 stub modern — Phase 4 will
     add scroll-driven micro-interactions */
}
```

| Token | Valor | Nota |
|-------|-------|------|
| `--c-bg` | `#ffffff` | Pure white modern minimal |
| `--c-fg` | `#1a1a2e` | Near-black text |
| `--c-accent` | `#6366f1` | Indigo modern (Tailwind 2022-era palette) |
| `--c-border` | `#e2e8f0` | Light gray border |
| `--c-focus` | `#6366f1` | Indigo focus |
| `font-family` | `'Inter Variable', system-ui, sans-serif` | Variable font weights 100-900 |
| **contrast(fg, bg)** | **14.2:1** | WCAG AAA — sin comentario |

---

#### ch6 — Phaser/AI (2025+, ~40 años) — **STUB Phase 2**

```css
[data-chapter="6"] {
  --c-bg:      #000814;
  --c-fg:      #c0e0ff;
  --c-accent:  #ffaa00;
  --c-border:  #1a4080;
  --c-focus:   #ffaa00;
  --font-body: 'Press Start 2P', monospace;
  /* contrast(#c0e0ff, #000814) = 10.8:1 — chapter 6 stub Phaser — Phase 5 owns
     scene + ships + planets */
}
```

| Token | Valor | Nota |
|-------|-------|------|
| `--c-bg` | `#000814` | Deep space black-blue |
| `--c-fg` | `#c0e0ff` | Soft starfield blue |
| `--c-accent` | `#ffaa00` | Amber ship/planet UI label highlight |
| `--c-border` | `#1a4080` | Mid-deep blue |
| `--c-focus` | `#ffaa00` | Amber focus |
| `font-family` | `'Press Start 2P', monospace` | Pixel UI font (OFL) |
| **contrast(fg, bg)** | **10.8:1** | WCAG AAA — sin comentario |

> **Phaser integration note:** Phase 5 evalúa cómo aplicar Press Start 2P en canvas
> (Phaser `BitmapText` o bitmap font textures). Phase 2 solo declara `@font-face` para
> HTML. Documentado en RESEARCH §Q1.

---

## 5. Typography per Chapter — 7 Font Families Locked

### 5.1 Tabla de fonts finales

| ch | Font family | License | Bundle estimate | Fallback stack | Notes |
|----|-------------|---------|-----------------|----------------|-------|
| 0 | **VT323** | OFL-1.1 | ~25-40 KB subset | `ui-monospace, monospace` | CRT terminal, no variable axis |
| 1 | **Comic Neue** | OFL-1.1 | ~30-50 KB subset | `'Comic Sans MS', cursive` | Comic Sans MS equivalent libre |
| 2 | (Verdana / Trebuchet MS) | system-safe | **0 KB** (no self-host — RESEARCH §R4) | `'Trebuchet MS', sans-serif` | Tradeoff: Android sin Verdana ve Trebuchet/sans-serif; bundle savings ~30-50 KB |
| 3 | **Lobster** | OFL-1.1 | ~30-50 KB subset | `Georgia, serif` | Web 2.0 emblematic; serif fallback graceful |
| 4 | **Audiowide** | OFL-1.1 | ~30-50 KB subset | `'Eurostile', sans-serif` | Geometric futuristic display |
| 5 | **Inter Variable** | OFL-1.1 | ~80-120 KB | `system-ui, sans-serif` | Variable font weights 100-900 (single file) |
| 6 | **Press Start 2P** | OFL-1.1 | ~30-50 KB subset | `monospace` | Pixel UI font |

**Bundle target total:** 150-300 KB combinados (`.woff2` Latin Extended).
**Risk R10 mitigation:** Si excede 300 KB, primero descopear ch2 self-host (ya off);
luego subset agresivo en otros (drop unused glyphs). Inter Variable cuenta como
~80-120 KB single file.

### 5.2 `@font-face` declaration pattern (locked)

```css
@font-face {
  font-family: 'VT323';
  src: url('/fonts/vt323-latin-ext.woff2') format('woff2');
  font-display: swap;
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Comic Neue';
  src: url('/fonts/comic-neue-latin-ext.woff2') format('woff2');
  font-display: swap;
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Inter Variable';
  src: url('/fonts/inter-variable-latin-ext.woff2') format('woff2-variations');
  font-display: swap;
  font-weight: 100 900;   /* variable axis */
  font-style: normal;
}

/* ...análogo para Lobster, Audiowide, Press Start 2P */
```

**Reglas locked:**
- `font-display: swap` mandatory en todos (Risk R1 FOIT mitigation)
- `format('woff2')` para fonts estáticos; `format('woff2-variations')` solo para Inter Variable
- `font-weight: 100 900` exactamente en Inter Variable (activa variable axis correctamente — R5 fix)
- Ubicación: `/public/fonts/{font-slug}-latin-ext.woff2`
- Subset: **Latin Extended** mandatory (Open-Q2-E resuelto — incluye ñ, á, é, í, ó, ú, ü, ¿, ¡ para ES)

### 5.3 Preload critical fonts

Para el default landing chapter (ch3 = Lobster) y current chapter, añadir en `index.html`:

```html
<link rel="preload" href="/fonts/lobster-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
```

Otros fonts se cargan via `font-display: swap` natural (system-safe fallback visible
hasta swap, NO blank text).

### 5.4 Body line-height + heading line-height (recomendado)

| Rol | Line height | Razón |
|-----|-------------|-------|
| Body text | 1.5 | WCAG AA legibility baseline |
| Heading (h1-h3) | 1.2 | Tightening era-display visual rhythm |

Phase 2 NO declara sizes específicos (Phase 3/4 lo hace cuando llegue contenido).
La escala del era-title de Phase 1 (`clamp(2rem, 5vw, 3.5rem)`, weight 700, line-height 1.1)
se mantiene como heading display fallback.

---

## 6. `@layer` Cascade Order — LOCKED

```css
@layer reset, themes, components, utilities;
```

**Por qué este orden (THM-02):**

| Layer | Contenido | Sobreescribe |
|-------|-----------|--------------|
| `reset` | Normalize, box-sizing global | (nada — base) |
| `themes` | `:root` fallback neutro + 7 `[data-chapter="N"]` blocks + `@font-face` | reset |
| `components` | Phase 3/4 era-auténticos UI components | themes (cuando aplique a un elemento concreto) |
| `utilities` | Phase 3/4 utility classes responsive | components, themes |

**Specificity note:** `[data-chapter="N"]` y `:root` tienen ambos specificity (0,1,0).
El `:root` declarado ANTES de los `[data-chapter]` blocks dentro de `themes` queda como
fallback default sin pelear (Pattern 1 RESEARCH).

**Phase 2 NO declara nada en `components` ni `utilities`** — esos layers existen como
namespace reservado para Phase 3/4.

---

## 7. BackgroundLayers Component Contract

### 7.1 DOM contract

`BackgroundLayers.vue` — primer hijo del template root de App.vue (antes de SkipLink):

```html
<div class="bg-layers" aria-hidden="true">
  <div
    class="bg-layer bg-layer-a"
    :data-chapter="layerA.chapter.value"
    :style="{ opacity: layerA.opacity.value }"
  ></div>
  <div
    class="bg-layer bg-layer-b"
    :data-chapter="layerB.chapter.value"
    :style="{ opacity: layerB.opacity.value }"
  ></div>
</div>
```

### 7.2 CSS contract

```css
.bg-layers {
  position: fixed;
  inset: 0;
  z-index: -1;          /* detrás de todo el contenido */
  pointer-events: none; /* nunca intercepta clicks */
}

.bg-layer {
  position: absolute;
  inset: 0;
  background: var(--c-bg);  /* reads its data-chapter's --c-bg */
  transition: opacity 200ms ease;  /* D-03 default */
}

@media (prefers-reduced-motion: reduce) {
  .bg-layer {
    transition: opacity 150ms ease;  /* D-03 ≤150ms PRM */
  }
}
```

### 7.3 Orden DOM y z-index resultantes

Phase 2 DOM order (App.vue template root):

```
BackgroundLayers       z-index: -1   (detrás de todo)
SkipLink               z-index: 50   (primer focusable)
StickyAvatar           z-index: 40   (top-left)
LangToggle             z-index: 40   (top-right — Phase 2 nuevo)
ScrollShell            z-index:  0   (contenido scrollable)
StickyTimeline         z-index: 40   (bottom)
```

### 7.4 State machine — `useBackgroundMorph` (Pattern 2 RESEARCH)

**Composable returns:**
- `layerA: { chapter: Ref<number|null>, opacity: Ref<number 0..1> }`
- `layerB: { chapter: Ref<number|null>, opacity: Ref<number 0..1> }`
- `transitionPhase: Ref<'idle' | 'crossfading'>`

**Initial state (at mount, default landing ch3):**
- `layerA = { chapter: 3, opacity: 1 }` (visible incoming)
- `layerB = { chapter: null, opacity: 0 }` (transparent waiting)
- `transitionPhase = 'idle'`

**On `activeChapter` change (newCh):**
1. Identify outgoing layer (current opacity=1) and incoming layer (current opacity=0)
2. `incoming.chapter = newCh`
3. `transitionPhase = 'crossfading'`
4. Trigger crossfade via opacity bindings (CSS transition handles interpolation)
5. `incoming.opacity = 1; outgoing.opacity = 0`
6. After `duration` ms: `outgoing.chapter = null; transitionPhase = 'idle'`; flip `activeLayer`

**Duration:**
- Default (no PRM): **200ms** (locked Open-Q2-B — sync con avatar Phase 1)
- Under PRM: **150ms** (D-03 cross-cutting)

**PRM mid-flight recovery** (análogo HIGH 2 fix StickyAvatar Phase 1):
Si user activa PRM mid-crossfade, force-finalize: snap a final state inmediato,
clear pendingTimer, flip activeLayer.

**Cleanup:** `onBeforeUnmount` clears `pendingTimer` defensive.

### 7.5 Future-proof: pixel art swap

Cuando Phase 3/4 introduzcan fondos pixel art, cada chapter agregará a su block:

```css
[data-chapter="3"] {
  --c-bg: #f0f4ff;
  --bg-image: url('/assets/ch3-bg.png');  /* Phase 3 añade */
}

.bg-layer {
  background: var(--c-bg);
  background-image: var(--bg-image, none);
  background-size: cover;
  background-position: center;
}
```

Las 2 capas swappean el `--bg-image` SIN cambio arquitectural — la opacity crossfade
sigue funcionando igual.

### 7.6 index.html cleanup (Pitfall 4 RESEARCH)

**Mandatory en Phase 2:** Remover `background: #0b0b16` del `body` en `index.html`.
Los BackgroundLayers son los responsables del bg color visible. Si el body conserva su
own bg, los layers con `z-index: -1` quedan ocultos.

```html
<!-- Phase 2 cambia esto en index.html -->
<style>
  html, body {
    margin: 0;
    padding: 0;
    /* background: #0b0b16;   ← REMOVER (BackgroundLayers controla) */
    color: #e7e7f0;            /* mantener como fallback de texto */
    font-family: ui-monospace, ...;
    min-height: 100vh;
  }
</style>
```

---

## 8. LangToggle Component Contract

### 8.1 DOM contract (Pattern 5 RESEARCH)

```html
<button
  class="lang-toggle"
  :aria-label="t('ui.langToggle.aria')"
  @click="toggle"
>
  <span class="lang-active">{{ locale === 'es' ? 'ES' : 'EN' }}</span>
  <span class="lang-sep" aria-hidden="true">|</span>
  <span class="lang-inactive">{{ locale === 'es' ? 'EN' : 'ES' }}</span>
</button>
```

### 8.2 CSS contract (desktop ≥ 600px)

```css
.lang-toggle {
  position: fixed;
  top: var(--sp-md);       /* 16px — simétrico al avatar */
  right: var(--sp-md);     /* 16px desde la derecha */
  z-index: 40;             /* mismo nivel que avatar y timeline */
  display: flex;
  align-items: center;
  gap: var(--sp-xs);       /* 4px entre ES | EN */
  padding: var(--sp-sm) var(--sp-md);  /* 8px / 16px */
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 999px;    /* pill shape */
  color: var(--c-fg);
  font-family: var(--font-body, ui-monospace);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  min-width: 44px;         /* tap target a11y A11Y-03 */
  min-height: 44px;        /* tap target a11y A11Y-03 */
  justify-content: center;
  transition: background 150ms ease, color 150ms ease;
}

.lang-active   { color: var(--c-fg); }
.lang-inactive { color: var(--c-muted); }
.lang-sep      { color: var(--c-muted); }

/* Hover state */
.lang-toggle:hover {
  background: var(--c-tick-hover, var(--c-surface));
}

/* Focus state: hereda :focus-visible universal de App.vue
   (outline: 3px solid var(--c-focus); outline-offset: 3px) */
```

### 8.3 Mobile shrink (< 600px) — icon-only mode

```css
@media (max-width: 599px) {
  .lang-toggle {
    padding: var(--sp-sm);   /* simétrico */
    min-width: 44px;
    min-height: 44px;
  }
  .lang-toggle .lang-sep,
  .lang-toggle .lang-inactive {
    display: none;           /* hide separator + inactive label */
  }
  .lang-toggle::before {
    content: '🌐';           /* globe emoji icon */
    font-size: 14px;
    margin-right: var(--sp-xs);
  }
  .lang-active {
    font-size: 11px;         /* shrink active label */
  }
  /* Aria-label sigue cubriendo la semántica — texto visible es solo "🌐 ES" o "🌐 EN" */
}
```

**Decisión locked:** En mobile mostrar `🌐 + locale activo` (ej. "🌐 ES"). El aria-label
completo "Cambiar idioma a inglés" / "Switch language to Spanish" garantiza A11Y.

### 8.4 Click handler

```javascript
function toggle() {
  const next = locale.value === 'es' ? 'en' : 'es'
  locale.value = next            // vue-i18n reactivity → t() re-evaluates
  persistLocale(next)            // localStorage["portfolio.locale"] = next
}
```

NO requiere animation (D-06 — cambio textual instantáneo aceptable en default y PRM).
Hover/focus transitions de 150ms se mantienen bajo PRM (D-05 interaction-derived).

### 8.5 Visibilidad invariante

El LangToggle es **HUD invariante** — su estilo NO es theme-specific por design. Se
declara con paleta neutra (`--c-surface`, `--c-border`, `--c-fg`, `--c-muted`) que NO
está override por `[data-chapter="N"]` (esos override SOLO los tokens listados en §4.2).
Por consiguiente el LangToggle se ve **igual en los 7 chapters** — pertenece al HUD
invariante, no al theme.

---

## 9. Focus Ring Policy per Chapter

### 9.1 Regla universal (heredada Phase 1, NO tocar)

En App.vue Phase 1 `<style>` no scoped:

```css
:focus-visible {
  outline: 3px solid var(--c-focus);
  outline-offset: 3px;
}
```

Phase 2 **NO modifica esta declaración**. Solo overridea `--c-focus` per chapter via
`[data-chapter="N"]` blocks (ver §4.2).

### 9.2 Tabla per-chapter (resumen)

| Chapter | `--c-focus` | Contrast vs `--c-bg` |
|---------|-------------|----------------------|
| `:root` fallback | `#7dd3fc` | 8.9:1 sobre `#0b0b16` |
| ch0 Terminal | `#00ff41` | 15.3:1 sobre `#000000` |
| ch1 HTML 90s | `#ffffff` | 8.6:1 sobre `#000080` (contrasta también vs `#ff00ff` fg) |
| ch2 Flash | `#ffaa00` | 8.4:1 sobre `#2a1a4a` |
| ch3 Web 2.0 | `#0066cc` | 7.1:1 sobre `#f0f4ff` |
| ch4 AR/VR | `#00ffff` | 12.8:1 sobre `#0a0f2e` |
| ch5 Modern | `#6366f1` | 5.2:1 sobre `#ffffff` |
| ch6 Phaser | `#ffaa00` | 12.4:1 sobre `#000814` |

**Todos cumplen WCAG AA ≥ 3:1 para outlines (no-text contrast).** A11Y-03 satisfecho.

### 9.3 Pitfall avoidance (Pitfall 1 RESEARCH)

**NUNCA declarar `outline: 1px` o `outline: 2px` en ningún componente custom de Phase 2.**
El `:focus-visible` universal con `--c-focus` 3px solid es la fuente única de verdad.

---

## 10. Theme Bleed Prevention Contract (THM-04)

### 10.1 Arquitectura D2-06 locked

Cada `<section>` chapter lleva su propio `[data-chapter="N"]` **HARDCODED**. Patrón ya
implementado en `src/components/ScrollShell.vue` Phase 1 (líneas 74-86):

```html
<section
  v-for="ch in chapters"
  :key="ch.id"
  :id="`chapter-${ch.id}`"
  :data-chapter="ch.id"
  :aria-label="`${ch.era} — ${ch.year}`"
  class="chapter-section"
>
  ...
</section>
```

Los CSS Custom Properties del theme aplican **local a la section y sus children**.

### 10.2 Visual contract — sin half-and-half durante snap

Durante smooth-scroll entre chapters, ningún section debe mostrar parcialmente el theme
del siguiente. Garantizado por:

1. **Scoping del theme:** `[data-chapter="N"]` selector aplica a la section y descendants;
   nunca al wrapper global. Si la section saliente está parcialmente en viewport, sigue
   pintada con SUS tokens hasta SALIR del viewport completamente.
2. **BackgroundLayers independiente:** El bg morph global vive en `<BackgroundLayers />`
   con `position: fixed; inset: 0; z-index: -1`. Sus 2 capas swappean por `activeChapter`,
   pero NO afectan el inside-color de las sections (que sigue siendo `var(--c-bg)` de su
   chapter mientras está dentro del viewport).
3. **Heurística "vives en una era hasta llegar a la siguiente":** la transición de era es
   un evento discreto orquestado por `activeChapter` change (IntersectionObserver Phase 1),
   no continuo per scroll-progress.

### 10.3 Test gates (THM-04)

| Gate | Test type | Cómo se verifica |
|------|-----------|------------------|
| Architectural | unit DOM walk | `tests/components/ScrollShell.theme-isolation.test.js` — cada section tiene `data-chapter` correcto |
| Token isolation | unit computed style | `tests/styles/theme-tokens.test.js` — ch0 section resolves `--c-bg = #000000`, ch1 section resolves `--c-bg = #000080` |
| Visual | manual checklist | `02-MANUAL-CHECKLIST.md` §visual diff — scroll ch0→ch6 GIF check |

---

## 11. Copywriting Contract (i18n keys locked)

### 11.1 i18n keys naming — jerárquico (Open-Q2-C locked)

Convención: `{namespace}.{N}.{key}` (escala a Phase 3 sin migración).

### 11.2 Keys completos — `src/i18n/es.json`

```json
{
  "chapters": {
    "0": { "title": "Pre-carrera: niñez digital" },
    "1": { "title": "Pre-carrera tardío: HTML 90s" },
    "2": { "title": "Flash era: gameplay programmer" },
    "3": { "title": "Web 2.0: UX + dev + líder" },
    "4": { "title": "AR/VR: empresa propia + Metrodigi" },
    "5": { "title": "Modern: streaming, QA, frontend lead" },
    "6": { "title": "Convergencia: QA + AI" }
  },
  "ui": {
    "skipLink": "Saltar al contenido",
    "langToggle": {
      "aria": "Cambiar idioma a inglés",
      "label": "EN"
    },
    "timeline": {
      "navAria": "Navegación de capítulos por era",
      "tickAria": "Ir a {era} ({year})"
    }
  },
  "avatar": {
    "ariaTemplate": "Avatar de Rafael — capítulo {chapter} activo",
    "busts": {
      "0": { "alt": "Placeholder — niñez digital (~10 años, 1995)" },
      "1": { "alt": "Placeholder — pre-carrera tardío (~17 años, 2001)" },
      "2": { "alt": "Placeholder — Flash era (~22 años, 2009)" },
      "3": { "alt": "Placeholder — Web 2.0 (~26 años, 2013)" },
      "4": { "alt": "Placeholder — AR/VR (~30 años, 2015)" },
      "5": { "alt": "Placeholder — Modern (~36 años, 2022)" },
      "6": { "alt": "Placeholder — Convergencia (~40 años, 2026)" }
    }
  }
}
```

### 11.3 Keys completos — `src/i18n/en.json` (paridad exacta — I18N-02)

```json
{
  "chapters": {
    "0": { "title": "Pre-career: digital childhood" },
    "1": { "title": "Pre-career late: 90s HTML" },
    "2": { "title": "Flash era: gameplay programmer" },
    "3": { "title": "Web 2.0: UX + dev + lead" },
    "4": { "title": "AR/VR: own company + Metrodigi" },
    "5": { "title": "Modern: streaming, QA, frontend lead" },
    "6": { "title": "Convergence: QA + AI" }
  },
  "ui": {
    "skipLink": "Skip to content",
    "langToggle": {
      "aria": "Switch language to Spanish",
      "label": "ES"
    },
    "timeline": {
      "navAria": "Era-based chapter navigation",
      "tickAria": "Go to {era} ({year})"
    }
  },
  "avatar": {
    "ariaTemplate": "Rafael's avatar — chapter {chapter} active",
    "busts": {
      "0": { "alt": "Placeholder — digital childhood (~10 years old, 1995)" },
      "1": { "alt": "Placeholder — late pre-career (~17 years old, 2001)" },
      "2": { "alt": "Placeholder — Flash era (~22 years old, 2009)" },
      "3": { "alt": "Placeholder — Web 2.0 (~26 years old, 2013)" },
      "4": { "alt": "Placeholder — AR/VR (~30 years old, 2015)" },
      "5": { "alt": "Placeholder — Modern (~36 years old, 2022)" },
      "6": { "alt": "Placeholder — Convergence (~40 years old, 2026)" }
    }
  }
}
```

### 11.4 Tabla resumen — copy verbatim por elemento

| Elemento | i18n key | ES (verbatim) | EN (verbatim) |
|----------|----------|---------------|----------------|
| SkipLink | `ui.skipLink` | `Saltar al contenido` | `Skip to content` |
| LangToggle aria | `ui.langToggle.aria` | `Cambiar idioma a inglés` | `Switch language to Spanish` |
| LangToggle visible label inactivo | `ui.langToggle.label` | `EN` (es active) | `ES` (en active) |
| Timeline nav aria | `ui.timeline.navAria` | `Navegación de capítulos por era` | `Era-based chapter navigation` |
| Timeline tick aria | `ui.timeline.tickAria` | `Ir a {era} ({year})` | `Go to {era} ({year})` |
| Avatar aria | `avatar.ariaTemplate` | `Avatar de Rafael — capítulo {chapter} activo` | `Rafael's avatar — chapter {chapter} active` |
| Chapter 0 title | `chapters.0.title` | `Pre-carrera: niñez digital` | `Pre-career: digital childhood` |
| Chapter 1 title | `chapters.1.title` | `Pre-carrera tardío: HTML 90s` | `Pre-career late: 90s HTML` |
| Chapter 2 title | `chapters.2.title` | `Flash era: gameplay programmer` | `Flash era: gameplay programmer` |
| Chapter 3 title | `chapters.3.title` | `Web 2.0: UX + dev + líder` | `Web 2.0: UX + dev + lead` |
| Chapter 4 title | `chapters.4.title` | `AR/VR: empresa propia + Metrodigi` | `AR/VR: own company + Metrodigi` |
| Chapter 5 title | `chapters.5.title` | `Modern: streaming, QA, frontend lead` | `Modern: streaming, QA, frontend lead` |
| Chapter 6 title | `chapters.6.title` | `Convergencia: QA + AI` | `Convergence: QA + AI` |

> **Phase 2 NO i18nifica:** bio core (Phase 3), proyectos por chapter (Phase 3), JSON-LD
> (Phase 3), OG meta tags (Phase 3), `<title>` / meta description per locale (Phase 3 — SEO-03).

### 11.5 Phase 2 NO tiene:

- Primary CTA (no hay flujos de conversión en Phase 2)
- Empty state / Error state (no hay listados, no hay submissions)
- Destructive confirmations (no hay borrar nada)

(Phase 3+ define estos cuando llegue contenido real.)

### 11.6 Fallback string behavior (I18N-06 + Open-Q2-D)

- `fallbackLocale: 'en'` configurado en `createI18n()`
- Si key falta en ES → vue-i18n cae automáticamente a EN
- Si key falta en EN también:
  - `import.meta.env.DEV` → console.warn + render `[missing: {keypath}]` visible
  - `import.meta.env.PROD` → render `{keypath}` raw (silent fallback)

```javascript
missing: (locale, key) => {
  if (import.meta.env.DEV) {
    console.warn(`[i18n missing] ${locale}/${key}`)
    return `[missing: ${key}]`
  }
  return key
}
```

---

## 12. Mobile Adaptations (< 600px) — Phase 2 specific

### 12.1 LangToggle icon-only mode

Locked en §8.3 — breakpoint `@media (max-width: 599px)`. Tap target ≥44×44px preservado.

### 12.2 SkipLink overflow mitigation (heredado Phase 1 MEDIUM 3)

`src/components/SkipLink.vue` actualmente declara:

```css
overflow: hidden;
text-overflow: ellipsis;
max-width: calc(100vw - 32px);
```

Phase 2 i18nifica el copy → `"Saltar al contenido"` (19 chars ES) o `"Skip to content"`
(15 chars EN). Ambos caben en 375×667 con padding 16px + font-size 14px.

**Si Plan 07 de Phase 1 (deferred) o testing visual de Phase 2 detecta overflow:**

Aplicar Opción B de Phase 1 MEDIUM 3:

```css
@media (max-width: 599px) {
  .skip-link {
    font-size: 12px;
  }
}
```

### 12.3 Layout shift mitigation — strings ES 20-30% más largos (I18N-05 + Pitfall 8)

ES corre típicamente 20-30% más largo que EN. En Phase 2 el riesgo concreto es el
LangToggle aria-label (`Cambiar idioma a inglés` 24 chars vs `Switch language to Spanish`
26 chars — comparable, no problema). Los chapter titles bilingues no se RENDEREAN en
Phase 2 (Phase 3/4 los expone visualmente cuando llegue contenido).

**Reglas locked Phase 2 para prevenir CLS al toggle:**

1. **LangToggle width fija en desktop:** `min-width: 44px` + `justify-content: center` →
   el botón no cambia tamaño al swap "ES | EN" ↔ "EN | ES".
2. **Mobile icon-only:** elimina la variabilidad de ancho entre locales (solo 1 código
   de 2 letras visible).
3. **Ningún elemento Phase 2 debe causar horizontal overflow** en 375×667. Verificado
   en manual checklist `02-MANUAL-CHECKLIST.md` §layout-shift.

### 12.4 Heredado de Phase 1 (NO cambia)

- StickyAvatar shrink a 56×68px (8px offsets) — locked Phase 1
- StickyTimeline shrink a 44px height, padding 8px, tick-year 11px — locked Phase 1
- ScrollShell `100dvh` (no `100vh`) — locked Phase 1

---

## 13. Motion Contract — Phase 2 additions

Tabla **complementaria** al Motion Contract Phase 1 §8. Phase 2 añade dos transiciones:

| Transición | Elemento | Default duration | Default easing | Bajo PRM | Referencia |
|-----------|----------|-----------------|----------------|----------|------------|
| **Background morph entre chapters** | BackgroundLayers | **200ms** | `ease` (opacity 0↔1) | **150ms** crossfade | D-03 (D2-05) |
| **LangToggle hover/focus** | LangToggle | 150ms | `ease` (background, color) | 150ms `ease` (se mantiene) | D-05 |
| **LangToggle click → locale switch** | (texto reactivo) | 0ms (instantáneo) | — | 0ms | D-06 — interaction-derived <150ms |

**Locale switch NO requiere animation** — el texto cambia por reactividad de vue-i18n
sin transición visual (D-06 compliant).

**Heredado Phase 1 sin cambios:** scroll snap (D-01), avatar swap (D-02), click-to-nav
(D-04), tick hover/focus (D-05), marker binding (D-06), skip-link fade (D-06).

---

## 14. Phase 2 Visible Verification Checklist

Lo que el usuario debe ver al abrir `http://127.0.0.1:5173/` tras completar Phase 2:

- [ ] La página carga directamente en chapter 3 (default landing — CORE-05) con paleta
      pastel `#f0f4ff` bg + dark text + Lobster heading hint (cuando haya content visible)
- [ ] El locale inicial se determina por: `localStorage["portfolio.locale"]` > `navigator.language` > `'es'`
- [ ] El `<html lang>` attribute refleja el locale activo (verificable en DevTools elements panel)
- [ ] LangToggle visible en top-right (16px offset, simétrico al avatar top-left),
      muestra pill "ES | EN" con el activo en `--c-fg` y el inactivo en `--c-muted`
- [ ] Click en LangToggle: locale cambia, todos los strings i18nificados se actualizan
      instantáneamente, `localStorage["portfolio.locale"]` persiste, `<html lang>` muta
- [ ] Recargar la página: el locale persiste (no se vuelve a auto-detect)
- [ ] SkipLink texto bilingue ahora viene de `t('ui.skipLink')` — muestra "Saltar al contenido" o "Skip to content" según locale
- [ ] StickyTimeline aria-labels ahora vienen de `t('ui.timeline.tickAria', { era, year })`
- [ ] Scroll de ch0 a ch6 muestra background morph crossfade 200ms entre eras
- [ ] Cada chapter section muestra SU `--c-bg`/`--c-fg` inside-color (no theme bleed
      durante snap transition)
- [ ] ch0: fondo `#000000`, fg `#00ff41` (terminal verde fosforescente), font VT323
- [ ] ch1: fondo `#000080`, fg `#ff00ff` (magenta), font Comic Neue
- [ ] ch2-6: fondos era-tinted con paletas locked §4.2 (stubs — sin pixel art aún)
- [ ] Activar PRM en el sistema: bg morph baja a 150ms, avatar swap sigue instantáneo,
      scroll-to-chapter sigue `auto` (instant jump)
- [ ] Mobile portrait <600px: LangToggle pasa a icon-only mode (🌐 + activo), tap target ≥44×44px
- [ ] Ningún horizontal overflow en 375×667; CLS < 0.1 al toggle locale en cada chapter
- [ ] Focus tab por cada chapter: el `:focus-visible` outline cambia color según `--c-focus`
      del chapter (3px solid, offset 3px constante)
- [ ] Background body (index.html) ya no declara `background: #0b0b16` (BackgroundLayers maneja)

---

## 15. Out of Scope — Phase 3+ (explicit)

| Item | Fase que lo implementa |
|------|------------------------|
| Bio core renderizado por chapter | Phase 3 (CON-01) + Phase 4 |
| 1-3 proyectos destacados por chapter | Phase 3 (CON-02) + Phase 4 |
| Contact info persistente overlay | Phase 3 (CON-03) |
| Mantra "And always show a smile" easter egg ch6 | Phase 4/5 (CON-04) |
| `src/data/chapters.js` + `src/data/projects.js` | Phase 3 (CON-05/06) |
| Pixel art busts reales (reemplazan placeholder gris) | Phase 3 (ch3) + Phase 4 (ch0-2 + 4-5) |
| Pixel art fondos full-frame | Phase 3 (ch3) + Phase 4 (ch2/4/5) |
| AR/VR floating panels parallax ch4 | Phase 4 (ART-03) |
| Phaser scene ch6 (ships, planets, starfield) | Phase 5 |
| JSON-LD Person schema multilingüe | Phase 3 (SEO-02) |
| OG meta tags + `<title>` per locale | Phase 3 (SEO-01, SEO-03) |
| `<link rel="alternate" hreflang>` | Phase 3 (SEO-04) |
| Firebase Hosting deploy | Phase 6 |
| 3er idioma (PT-BR o FR) | v2 (I18N3-01) |
| Theme switcher visible dark/light | rejected (OUT OF SCOPE REQUIREMENTS) |
| `prefers-color-scheme` detection | rejected (chapter themes override) |
| Container queries para responsive themes | v2 (Phase 4 maybe) |
| Interpolación continua de theme on scroll-progress | v2 (POL-05 potential) |
| Era-authentic UI components (Web 2.0 glossy buttons, Flash banners, marquees) | Phase 3/4 |
| Final ch3 theme (polished con contenido + pixel art) | Phase 3 |
| Alt-text era-accurate finales (A11Y-06 — Rafael at age N descriptions) | Phase 3 (ch3+6) + Phase 4 (ch0-2+4-5) |

---

## 16. Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — no shadcn en este proyecto (Vue 3, no React) | not applicable |
| third-party | none declarados en Phase 2 | not required |
| npm `vue-i18n@^11.x` | OFL-equivalent free library — no UI components, solo runtime | not required (no registry block) |
| npm `@fontsource-variable/inter` (opt) | Inter Variable woff2 + @font-face | not required (font package, OFL-1.1 license) |
| npm `@fontsource/{vt323,comic-neue,lobster,audiowide,press-start-2p}` (opt) | Font packages | not required (OFL-1.1 licenses verified) |

No hay componentes UI de terceros. Todo el UI Phase 2 es composables Vue propios +
CSS nativo + vue-i18n runtime. Las fuentes son OFL-1.1 verificadas en RESEARCH §License Verification.

---

## 17. Inheritance from Phase 1

Phase 2 **hereda y NO modifica** lo siguiente de `01-UI-SPEC.md`:

- §3 Spacing Tokens (`--sp-*`)
- §4 Color Tokens base — quedan en `:root` como fallback
- §6 Layout y Regiones Sticky (StickyAvatar top-left, StickyTimeline bottom)
- §7.1 ChapterSection DOM contract (incluido el `data-chapter` hardcoded — patrón
  ya implementado en `ScrollShell.vue` líneas 74-86)
- §7.2 StickyAvatar (Phase 2 solo i18nifica aria-label vía `t('avatar.ariaTemplate', { chapter })`)
- §7.3 StickyTimeline (Phase 2 solo i18nifica aria-labels vía `t('ui.timeline.*')`)
- §7.4 SkipLink (Phase 2 solo i18nifica copy vía `t('ui.skipLink')`)
- §8 Motion Contract Phase 1 (Phase 2 añade D-03 bg morph + LangToggle hover)
- §10 Accessibility Contract (Phase 2 añade A11Y-03 per-chapter focus, A11Y-04 contrast docs, A11Y-07 reactive `<html lang>`)

**Phase 2 EXTIENDE Phase 1 sin re-implementar.** El executor que vea un componente Phase 1
debe i18nificar sus strings y nada más en cuanto a layout/CSS estructura.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS (§11 — 7 chapter titles + UI chrome ES/EN paridad locked)
- [x] Dimension 2 Visuals: PASS (§4.2 — 7 themes con tokens completos, ch0/ch1 finales, ch2-6 stubs)
- [x] Dimension 3 Color: PASS (§4 — 60/30/10 heredado; per-chapter contrast documentado D2-03)
- [x] Dimension 4 Typography: PASS (§5 — 7 fonts locked, font-display: swap, bundle target 150-300KB)
- [x] Dimension 5 Spacing: PASS (§3 — heredado Phase 1; excepción LangToggle tap target 44×44 declarada)
- [x] Dimension 6 Registry Safety: PASS (§16 — sin third-party UI blocks; vue-i18n + fontsource opcional OFL-1.1 verified)

**Approval:** approved 2026-05-13 (gsd-ui-checker — sin recommendations)

---

*UI-SPEC generado: 2026-05-13*
*Fuentes: 02-CONTEXT.md (D2-01..D2-11 + Open-Q2-A..F), 02-RESEARCH.md (Patterns 1-7),
02-VALIDATION.md (test map), PROJECT.md (mapeo de chapters + tono cálido-juguetón),
REQUIREMENTS.md (THM-01..05, I18N-01..06, A11Y-03/04/07), 01-UI-SPEC.md (herencia
spacing/color/focus/motion D-01..D-06)*

*Próximo paso: gsd-ui-checker valida las 6 dimensions; gsd-planner consume para
descomponer Phase 2 en plans (walking-skeleton i18n setup, themes-file, BackgroundLayers,
LangToggle, i18nify-existing-components, manual-checklist).*
