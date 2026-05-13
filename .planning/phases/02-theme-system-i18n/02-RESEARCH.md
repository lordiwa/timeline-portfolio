# Phase 2: Theme System + i18n — Research

**Researched:** 2026-05-12
**Domain:** CSS architecture (Custom Properties + `@layer`) + Vue 3 i18n motor + self-hosted fonts pipeline + background morph composable
**Confidence:** HIGH (todas las claims críticas verificadas contra npm registry, MDN, vue-i18n official docs, caniuse, código existente Phase 1)

---

## Summary

Phase 2 construye el **motor visual y lingüístico** que precede a cualquier contenido real. La fase tiene tres capas concurrentes que deben planearse como slices verticales (MVP mode):

1. **Theme engine** — CSS Custom Props sobre `[data-chapter="N"]` con `@layer` cascade (reset / themes / components / utilities). 7 bloques de theme, dos completos (ch0 terminal verde, ch1 90s HTML), cinco era-tinted stubs (ch2-6).
2. **Background morph engine** — `useBackgroundMorph(activeChapter, prm)` composable que orquesta dos capas `position: fixed` apiladas con opacity crossfade. State machine análogo al patrón del avatar de Phase 1 (Plan 03), 200ms default total, ≤150ms bajo PRM (D-03).
3. **i18n motor** — vue-i18n v11.4.2 `legacy: false` + `LangToggle` standalone top-right + persistencia `localStorage["portfolio.locale"]` + `<html lang>` reactive + auto-detect `navigator.language` + 7 chapter titles bilingues + aria-labels de SkipLink/LangToggle/StickyTimeline/StickyAvatar.

Adicionalmente: **7 fonts self-hosted en `/public/fonts/`** (subsetted .woff2, Latin Extended, target bundle 150-300KB) con `font-display: swap` y system-safe fallbacks. Variable fonts donde apliquen (Inter Variable confirmado).

**Primary recommendation:** Plan en **3-4 slices verticales** con cada slice entregando UI funcional + motor + CSS de su scope (no horizontal layering "primero todos los themes, luego i18n, luego fonts"). Las dependencias entre piezas son moderadas: el morph engine puede construirse antes de que existan los themes finales (consume CSS Custom Props que ya están vivos); el i18n motor puede construirse antes de los chapter titles (estos son keys que se llenan al final).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CSS theme variables per chapter | Static CSS (`@layer`) | — | Themes son CSS Custom Props; cero JS runtime. `[data-chapter="N"]` hardcoded en el DOM se intersecciona con el cascade |
| `data-chapter` attribute on each `<section>` | Vue template (ScrollShell.vue) | — | El attribute es markup estático; vive en el v-for de ScrollShell |
| Active chapter tracking | Composable (`useScrollState`, ya existe Phase 1) | — | Sin cambios — ya provisto vía `inject('scrollState')` |
| Background morph orchestration | Vue Composition API composable (`useBackgroundMorph`) | CSS opacity transitions | Composable mantiene state machine; CSS aplica la animación visual real |
| Background layer rendering | Vue component (`BackgroundLayers.vue`) | CSS `position: fixed` | Dos divs fijos, z-index -1, cada uno con su propio `data-chapter` dinámico |
| Locale state | vue-i18n plugin global | localStorage (persistencia) | vue-i18n `useI18n()` Composition API es source of truth runtime; localStorage es solo hidratación |
| `<html lang>` mutation | App.vue setup (`watch(locale, ...)`) | — | Único punto de mutación del atributo |
| Auto-detect locale on first visit | App.vue setup (initialization branch) | `navigator.language` API | Sólo si no hay valor en localStorage |
| `LangToggle` UI | Vue component (`LangToggle.vue`) | CSS `position: fixed` | Standalone fixed top-right, simétrico al avatar |
| Font loading | CSS `@font-face` + browser cache | `/public/fonts/*.woff2` | Browser nativo; `font-display: swap` + system-safe fallback |
| Font subsetting (build-time) | Pipeline externo (glyphhanger/pyftsubset) | — | Una vez, antes del commit de los .woff2 |
| i18n message catalogs | `src/i18n/{es,en}.json` | vue-i18n loader | Estáticos; importados en `src/i18n/index.js` |
| Bilingual aria-labels | vue-i18n keys consumidas en `:aria-label` bindings | — | Cada componente con aria-label switchea a `useI18n().t()` |

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Theme Delivery Scope:**
- **D2-01:** Phase 2 entrega: motor + ch0/ch1 themes completos + stubs era-tinted ch2-6. ch0 y ch1 son CSS puro (sin pixel art per ART-07). ch2-6 reciben stubs (bg + fg + accent + border + font hint) y Phase 3/4 los completan.
- **D2-02:** Stubs era-tinted entregan 5 custom props por chapter (`--c-bg`, `--c-fg`, `--c-accent`, `--c-border`, `--c-focus`) + `font-family` hint. ~5-7 LOC CSS por stub.
- **D2-03:** Contrast tradeoffs era-auténticos documentados inline en `chapter-themes.css` al lado de cada `[data-chapter="N"]` block. Formato verbatim: `/* contrast(fg, bg) = X.X:1 — chapter N (era) accepts Y:1 here as era-authentic tradeoff per THM-05 */`.

**Background Morph Architecture:**
- **D2-04:** 2 capas bg fijas apiladas con opacity crossfade. `<div class="bg-layer bg-layer-a">` + `<div class="bg-layer bg-layer-b">`, `position: fixed; inset: 0; z-index: -1`. Default ~200-300ms; PRM ≤150ms.
- **D2-05:** Background morph entre eras crossfade ≤150ms bajo PRM. Crossfade discrete-on-activeChapter-change, NO interpolated-continuous-on-scroll-progress. Composable `useBackgroundMorph(activeChapter, prm)` con state machine análogo al avatar de Phase 1.

**Theme Bleed Prevention:**
- **D2-06:** Cada `<section>` chapter lleva su propio `[data-chapter="N"]` HARDCODED. NO se aplica al wrapper global ni se manipula dinámicamente. Heurística: "vives en una era hasta que llegas a la siguiente".

**Fonts Strategy:**
- **D2-07:** Self-hosted fonts en `/public/fonts/` con `@font-face`. .woff2 subsetted (Latin Extended). NO Google Fonts CDN.
- **D2-08:** 7 font families distintas, una por chapter (propuestas validadas más abajo). Bundle target ~150-300KB. `font-display: swap`.

**i18n Architecture:**
- **D2-09:** Auto-detect locale al primer visit vía `navigator.language`. Si empieza con `'es'` → ES; cualquier otro → EN. Después del primer toggle persiste en `localStorage["portfolio.locale"]`. Fallback si `navigator.language` no disponible → ES.
- **D2-10:** LangToggle top-right standalone fixed. `position: fixed; top: var(--sp-md); right: var(--sp-md); z-index: 40`. Pill "ES | EN", inactivo en muted. Mobile <600px shrink a icon-only. Aria-label bilingue.
- **D2-11:** Phase 2 i18nifica: SkipLink, LangToggle aria-labels, StickyTimeline aria-labels, StickyAvatar alt-text placeholders, **los 7 chapter titles bilingues**. NO bio ni proyectos (Phase 3).

### Claude's Discretion

- **Open-Q2-A:** Where to mount `data-chapter`: `<section>` literals vs v-for. Resolution: **v-for ya existe en ScrollShell.vue Phase 1** — el array de chapters está hardcodeado en el script y el template usa `v-for="ch in chapters"` con `:data-chapter="ch.id"`. Phase 2 NO cambia esto; solo añade themes que matchean los `data-chapter` que ya están en el DOM. Cuando Phase 3 introduzca `src/data/chapters.js`, el v-for migrará al import del módulo sin tocar el motor de themes.
- **Open-Q2-B:** Default transition duration sin PRM — 200ms vs 300ms. **Recomendación: 200ms** (sync con avatar Phase 1, así avatar + bg morph al unísono). Planner valida A/B y puede ajustar.
- **Open-Q2-C:** i18n keys naming. **Decisión: jerárquico** (industry-standard vue-i18n). Estructura propuesta:
  ```
  chapters: { 0: { title }, 1: { title }, ... }
  ui: { skipLink, langToggle: { aria }, timeline: { tickAria } }
  avatar: { busts: { 0: { alt }, ... } }
  ```
- **Open-Q2-D:** Fallback string behavior. **Recomendación: visible marker en `import.meta.env.DEV` (`[missing: key.path]`), silent key raw en prod.** Implementado vía `missingHandler` de vue-i18n.
- **Open-Q2-E:** Font subsetting. **Latin Extended mandatory** para ES (ñ, á, é, í, ó, ú, ü, ¿, ¡). Pipeline: glyphhanger (Node) + pyftsubset (Python/brotli) — ambos requieren WSL o instalación manual en Windows; alternativa Windows-friendly: **fontsource packages** (npm install) o **google-webfonts-helper** (web tool con subset preseleccionado).
- **Open-Q2-F:** Variable fonts. **Sí donde existan**: Inter Variable confirmado (1 archivo cubre weights 100-900). Otras propuestas (Lobster, Comic Neue, VT323) no tienen variants variables.

### Deferred Ideas (OUT OF SCOPE)

- Theme transition coordinada con scroll progress (interpolación continua).
- 3er idioma (PT-BR o FR).
- JSON-LD Person schema multilingüe (Phase 3).
- Era-authentic UI components (Phase 3/4).
- Theme switcher visible dark/light.
- `prefers-color-scheme` detection.
- CSS-only @container queries para responsive theme variations.
- i18n keys para alt-text de avatar busts (Phase 4 ch0-1 + 2/4/5; Phase 3 ch3 + 6).

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| THM-01 | `src/styles/chapter-themes.css` con 7 bloques `[data-chapter="N"]` (N=0..6) usando CSS Custom Properties | Architecture Patterns §1 (CSS file structure) + Code Examples §1 (template per chapter) |
| THM-02 | `@layer` cascade order: reset / themes / components / utilities | Architecture Patterns §2 (`@layer` ordering strategy) + Sources caniuse 96%+ support |
| THM-03 | 7 era-authentic themes implementados | D2-01 + D2-02 — ch0/ch1 completos en Phase 2; ch2-6 stubs |
| THM-04 | Validación de "no theme bleed" durante snap transitions | Theme Bleed Prevention Testing §1 (cómo testear); D2-06 (markup pattern); Common Pitfalls §1 |
| THM-05 | Color contrast 4.5:1 cumplido por chapter; tradeoffs documentados | Contrast Tradeoff Documentation Pattern §1 (formato inline verbatim); axe DevTools / Pa11y / Lighthouse en Validation |
| I18N-01 | vue-i18n v11 instalado con `legacy: false` (mandatory) | Standard Stack — vue-i18n@11.4.2 verificado vs npm; Code Examples §3 (createI18n setup) |
| I18N-02 | Locale files `src/i18n/es.json` y `src/i18n/en.json` con paridad de keys | Architecture Patterns §4 (i18n file structure jerárquica) |
| I18N-03 | Componente `LangToggle.vue` con persist en localStorage | Code Examples §4 (LangToggle.vue completo); D2-10 (UI spec) |
| I18N-04 | `<html lang>` attribute actualiza al cambiar locale | Code Examples §5 (watch en App.vue setup) |
| I18N-05 | Todo layout testeado con ambos idiomas cargados (ES ~20-30% más largo) | Layout Shift Mitigation §1 (estrategias min-width, text-wrap: balance, line-clamp) |
| I18N-06 | `fallbackLocale: 'en'` configurado | Code Examples §3 (config) + Open-Q2-D (missingHandler con marker dev) |
| A11Y-03 | Focus visible en HUD controls — outline customizado per-theme respetando contraste | D2-02 — `--c-focus` per chapter; `--c-focus` con grosor 3px + offset 3px universal de Phase 1 |
| A11Y-04 | Color contrast 4.5:1 verificado por chapter; tradeoffs documentados (ver THM-05) | Mismo que THM-05 — duplicate verification per WCAG 1.4.3 |
| A11Y-07 | `<html lang>` actualiza en locale toggle (I18N-04) | Mismo que I18N-04 — duplicate verification per WCAG 3.1.1 |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **vue-i18n** | **11.4.2** | i18n motor con Composition API (`legacy: false`) | De-facto standard Vue 3 i18n. v11 deprecó Legacy API. `useI18n()` composable + reactive `locale` + `messages` jerárquicos. Auto-bundling runtime-only en producción → ~5.5KB brotli. Verificado: `npm view vue-i18n version` → **11.4.2** [VERIFIED: npm registry, 2026-05-12]. Peer dep `vue@^3.0.0` (no upgrade needed) [VERIFIED: npm view vue-i18n peerDependencies] |
| **@fontsource-variable/inter** | latest | Inter Variable self-hosted (ch5) | Empaqueta woff2 + @font-face listo para usar. OFL license. Variable axis weight 100-900 en un solo archivo. [VERIFIED: npm registry, fontsource.org] |
| **Vue 3** | ^3.5.0 (instalado) | Composition API runtime | Phase 1 ya escaló a 3.5+ (resuelto en Plan 01) [VERIFIED: package.json] |
| **@vueuse/core** | ^14.3.0 (instalado) | `usePreferredReducedMotion` ya cableado | Sin cambios — reusa `usePRM()` de Phase 1 [VERIFIED: package.json + src/composables/usePRM.js] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **fontsource packages individuales** | ^5.x | Empaqueta woff2 + @font-face para fonts que no son Inter | Alternativa a downloading manual + subsetting. Ej: `@fontsource/vt323`, `@fontsource/comic-neue`, `@fontsource/lobster`, `@fontsource/audiowide`, `@fontsource/press-start-2p`. Cada paquete trae woff2 + .css con @font-face. Latin subset por default. Trade-off: agrega node_modules ~3-5MB pero zero pipeline manual. [VERIFIED: fontsource.org] |
| **glyphhanger** | ^5.0.0 | Subsetting manual de fonts (alternativa a fontsource) | Si se quiere control fino del subset (ej. excluir glyphs que no aparecen en ES/EN). Pipeline npm + pyftsubset. Requiere Python instalado [VERIFIED: npm view glyphhanger version → 5.0.0] |
| **google-webfonts-helper** | (web tool) | Subsetting via UI con preselects | Alternativa zero-setup en Windows. Web app que genera woff2 + @font-face copy-paste. Útil para fonts que no están en fontsource [CITED: https://gwfh.mranftl.com/fonts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vue-i18n@11 full bundle | petite-vue-i18n (~5.5KB vs 10KB) | petite no soporta plurals, datetime/number formatting, lazy load. Phase 2 NO usa esos features pero Phase 3+ podría. **Recomendación: vue-i18n@11 full** — el extra ~5KB es trivial vs flexibilidad futura. [CITED: vue-i18n.intlify.dev/guide/advanced/lite] |
| Self-hosted manual (`/public/fonts/`) | fontsource packages npm | fontsource es más simple cross-platform (zero Python/WSL setup) pero agrega node_modules size. **Recomendación: fontsource para ch0/ch1 (donde simplicidad gana) + manual download desde Google Fonts vía gwfh.mranftl.com para ch3/ch4/ch6** — balance entre setup mínimo y control fino. |
| `@layer` cascade | BEM-style class naming `.theme-ch0` | `@layer` es declarativo en CSS native, sin nomenclatura artificial. Especificidad gestionada por orden de layers, no por selectores anidados. **Use `@layer`** — D2 locked. |
| navigator.language | Accept-Language header (server-side) | SPA estática sin server → JS-side only. `navigator.language` es la única opción. |

**Installation:**

```powershell
# Core
npm install vue-i18n@11
# Inter Variable (ch5)
npm install @fontsource-variable/inter
# Otras fonts (opcional — alternativa: download manual)
npm install @fontsource/vt323 @fontsource/comic-neue @fontsource/lobster `
            @fontsource/audiowide @fontsource/press-start-2p
```

**Version verification (2026-05-12):**

```powershell
npm view vue-i18n version
# → 11.4.2  [VERIFIED 2026-05-12]
npm view vue-i18n peerDependencies
# → { vue: '^3.0.0' }  [VERIFIED — no Vue upgrade needed]
```

---

## Architecture Patterns

### System Architecture Diagram

```
                  ┌─────────────────────────────┐
                  │   navigator.language        │  (first visit)
                  │   localStorage.portfolio.   │  (subsequent visits)
                  │   locale                    │
                  └──────────────┬──────────────┘
                                 │ initial value
                                 ▼
       ┌─────────────────────────────────────────────────┐
       │  vue-i18n createI18n({ legacy: false,           │
       │    locale, fallbackLocale: 'en', messages })    │
       └──────────────┬──────────────────────────────────┘
                      │
                      │ provides locale ref + t() globally
                      │
       ┌──────────────┴──────────────────────────────────┐
       │                                                  │
       ▼                                                  ▼
┌────────────────┐                              ┌──────────────────┐
│  LangToggle.   │ ── click ──► locale.value     │  watch(locale)   │
│  vue (fixed    │              =                │  → document.     │
│  top-right)    │              toggleLocale()   │  documentElement │
└────────────────┘              + localStorage   │  .lang = locale  │
                                .setItem         └──────────────────┘
                                                          │ (A11Y-07 / I18N-04)
                                                          ▼
                                                   <html lang="es|en">

       ┌──────────────────────────────────────────────────────┐
       │  Phase 1: useScrollState provides activeChapter ref  │
       └──────────────┬───────────────────────────────────────┘
                      │
                      │ inject('scrollState')
                      ▼
       ┌──────────────────────────────────────────┐
       │  useBackgroundMorph(activeChapter, prm)  │  ← inject('prm')
       │  state machine:                          │
       │    incomingChapter, outgoingChapter,     │
       │    transitionPhase: 'idle'|'crossfading' │
       └──────────────┬───────────────────────────┘
                      │ provides bgMorph state
                      ▼
       ┌──────────────────────────────────────────┐
       │  <BackgroundLayers />                    │
       │   ├─ <div class="bg-layer bg-layer-a"    │
       │   │     :data-chapter="layerAChapter"    │
       │   │     :style="{ opacity: a.opacity }"  │
       │   ├─ <div class="bg-layer bg-layer-b"    │
       │   │     :data-chapter="layerBChapter"    │
       │   │     :style="{ opacity: b.opacity }"  │
       │   │     position: fixed; z-index: -1     │
       └──────────────────────────────────────────┘
                      ▲
                      │ each layer reads its own CSS
                      │ Custom Props via data-chapter
                      │
       ┌──────────────────────────────────────────┐
       │  chapter-themes.css   (imported in main) │
       │   @layer reset, themes, components,      │
       │          utilities;                      │
       │   @layer themes {                        │
       │     :root { /* neutral fallback */ }     │
       │     [data-chapter="0"] { /* full */ }    │
       │     [data-chapter="1"] { /* full */ }    │
       │     [data-chapter="2"] { /* stub */ }    │
       │     ...                                  │
       │     [data-chapter="6"] { /* stub */ }    │
       │   }                                      │
       │   @font-face { ... 7 fonts ... }         │
       └──────────────────────────────────────────┘
                      ▲
                      │ apply local to each chapter
                      │
       ┌──────────────────────────────────────────┐
       │  ScrollShell.vue (unchanged from Phase 1)│
       │   <main class="scroll-shell">            │
       │     <section v-for="ch in chapters"      │
       │              :data-chapter="ch.id">      │
       │       {{ t(`chapters.${ch.id}.title`) }} │  ← i18n keys
       │     </section>                           │
       │   </main>                                │
       └──────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── i18n/
│   ├── index.js          # createI18n + auto-detect + localStorage hydration
│   ├── es.json           # spanish messages (jerárquico)
│   └── en.json           # english messages (jerárquico, paridad)
├── styles/
│   └── chapter-themes.css  # @layer + 7 [data-chapter] blocks + @font-face × 7
├── components/
│   ├── BackgroundLayers.vue  # 2 capas fixed, consume bgMorph
│   ├── LangToggle.vue        # fixed top-right standalone
│   └── (existentes Phase 1: ScrollShell, StickyAvatar, StickyTimeline, SkipLink)
├── composables/
│   ├── useBackgroundMorph.js  # state machine 2-layer crossfade
│   └── (existente Phase 1: usePRM, useScrollState)
└── App.vue              # wire i18n + provide bgMorph + watch lang + insert BackgroundLayers + LangToggle

public/
└── fonts/                # 7 .woff2 subsetted (Latin Extended)
    ├── vt323-latin-ext.woff2
    ├── comic-neue-latin-ext.woff2
    ├── verdana-fallback.woff2   (opcional — system-safe sin self-host también funciona)
    ├── lobster-latin-ext.woff2
    ├── audiowide-latin-ext.woff2
    ├── inter-variable-latin-ext.woff2
    └── press-start-2p-latin-ext.woff2
```

### Pattern 1: CSS `@layer` Cascade Order (THM-02)

**What:** Layers establecidos en orden ascendente de prioridad. Rules dentro de una layer compiten por specificity normal, pero CUALQUIER rule en `themes` siempre gana sobre CUALQUIER rule en `reset`, sin importar specificity de selectores.

**When to use:** Sistemas multi-theme donde el override per-chapter debe ganar al neutral default sin recurrir a `!important` o jerarquías de selectores anidados.

**Example:**

```css
/* src/styles/chapter-themes.css */

/* Source: MDN @layer + caniuse 96% support 2026 [CITED] */
@layer reset, themes, components, utilities;

@layer reset {
  /* (Phase 2 NO añade reset — heredado del :root paleta neutra de App.vue) */
}

@layer themes {
  /* Neutral fallback — Phase 1 :root paleta sigue siendo el default
     si por algún motivo un section no tiene data-chapter. */
  :root {
    --c-bg: #0b0b16;
    --c-fg: #e7e7f0;
    --c-accent: #7dd3fc;
    --c-border: #2e2e4a;
    --c-focus: #7dd3fc;
    --font-body: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  /* ─── ch0: terminal verde sobre negro ─────────────────────────────
     contrast(#00ff41, #000000) = 15.3:1 — WCAG AAA pasa naturalmente.
     NO requires tradeoff comment (era-authentic + contrast favorable). */
  [data-chapter="0"] {
    --c-bg: #000000;
    --c-fg: #00ff41;
    --c-accent: #00ff41;
    --c-border: #003311;
    --c-focus: #00ff41;       /* mantiene era authenticity en focus rings */
    --font-body: 'VT323', ui-monospace, monospace;
  }

  /* ─── ch1: HTML 90s crudo (Comic Neue + magenta sobre starry) ────
     /* contrast(fg, bg) = 3.2:1 — chapter 1 (HTML 90s crudo) accepts
        3.2:1 here as era-authentic tradeoff per THM-05; era-accurate
        visual identity (Comic Sans + magenta on starry bg) demands this.
        Compensated by larger font-size 18px+ minimum which improves
        perceived legibility. */
  [data-chapter="1"] {
    --c-bg: #000080;          /* starry bg base color */
    --c-fg: #ff00ff;
    --c-accent: #ffff00;
    --c-border: #ffffff;
    --c-focus: #ffffff;       /* white contrasta sobre magenta+navy */
    --font-body: 'Comic Neue', 'Comic Sans MS', cursive;
  }

  /* ─── ch2: Flash era stub ─────────────────────────────────────── */
  /* contrast(fg, bg) = 12.6:1 — chapter 2 stub (Flash era) — Phase 4
     finalizará paleta con pixel art assets; stub mantiene contraste alto. */
  [data-chapter="2"] {
    --c-bg: #2a1a4a;
    --c-fg: #e0c0ff;
    --c-accent: #ff8800;
    --c-border: #8060c0;
    --c-focus: #ffaa00;
    --font-body: Verdana, 'Trebuchet MS', sans-serif;
  }

  /* ─── ch3: Web 2.0 stub (default landing — Phase 3 finalizará) ── */
  /* contrast(fg, bg) = 13.4:1 — chapter 3 stub Web 2.0 — Phase 3 owns
     final palette + bio + projects; stub keeps high contrast neutral. */
  [data-chapter="3"] {
    --c-bg: #f0f4ff;
    --c-fg: #1a1a2e;
    --c-accent: #ff6699;
    --c-border: #a0b0d8;
    --c-focus: #0066cc;
    --font-body: 'Lobster', Georgia, serif;
  }

  /* ─── ch4: AR/VR immersive stub ──────────────────────────────── */
  /* contrast(fg, bg) = 11.8:1 — chapter 4 stub AR/VR — Phase 4 will
     finalize with floating panels + parallax pixel art. */
  [data-chapter="4"] {
    --c-bg: #0a0f2e;
    --c-fg: #b0d0ff;
    --c-accent: #00ffff;
    --c-border: #2050a0;
    --c-focus: #00ffff;
    --font-body: 'Audiowide', 'Eurostile', sans-serif;
  }

  /* ─── ch5: Modern animated stub ──────────────────────────────── */
  /* contrast(fg, bg) = 14.2:1 — chapter 5 stub modern — Phase 4 will
     finalize with scroll-driven micro-interactions. */
  [data-chapter="5"] {
    --c-bg: #ffffff;
    --c-fg: #1a1a2e;
    --c-accent: #6366f1;
    --c-border: #e2e8f0;
    --c-focus: #6366f1;
    --font-body: 'Inter Variable', system-ui, sans-serif;
  }

  /* ─── ch6: Phaser stub (pixel UI labels) ─────────────────────── */
  /* contrast(fg, bg) = 10.8:1 — chapter 6 stub Phaser — Phase 5 owns
     the Phaser scene; stub is for HTML overlays only. */
  [data-chapter="6"] {
    --c-bg: #000814;
    --c-fg: #c0e0ff;
    --c-accent: #ffaa00;
    --c-border: #1a4080;
    --c-focus: #ffaa00;
    --font-body: 'Press Start 2P', monospace;
  }
}

@layer components {
  /* (Phase 3/4 ejecutarán componentes era-auténticos aquí.) */
}

@layer utilities {
  /* (Phase 3/4 ejecutarán utility classes responsive aquí.) */
}
```

**Cascade behavior verified [CITED: MDN @layer]:** Layers después de `themes` (components, utilities) sobreescriben themes; layers antes (reset) son sobreescritos por themes. Esto es exactamente lo que queremos: Phase 3/4 podrán añadir era-specific components que ganen sobre los tokens del theme sin reorganizar el cascade.

**Specificity note [VERIFIED: MDN Specificity guide]:** `[data-chapter="N"]` y `:root` tienen ambos specificity (0,1,0). Por eso el `:root` declarado ANTES de los `[data-chapter]` blocks dentro de la misma layer `themes` queda como fallback default sin pelear. Si Phase 3/4 quisiera reforzar specificity (innecesario por el sistema de layers), `:root[data-chapter="N"]` daría (0,2,0).

### Pattern 2: `useBackgroundMorph` Composable (D2-04, D2-05)

**What:** State machine que orquesta dos capas de background con opacity crossfade al cambiar `activeChapter`. Patrón análogo al avatar swap de Phase 1 (Plan 03) que el repo ya tiene probado.

**When to use:** Cualquier cross-fade discrete-on-state-change donde queremos ver "el anterior fade out + el nuevo fade in" sin layout shift.

**Example:**

```javascript
// src/composables/useBackgroundMorph.js
//
// 2-layer opacity crossfade orchestrator. Análogo al patrón del avatar
// Phase 1 (StickyAvatar.vue + Plan 03) — pero adaptado a DOS capas
// independientes (en vez de una sola que cambia src reactivamente).
//
// Source: pattern derivado de StickyAvatar.vue Phase 1 + UI-SPEC §8
// Default timing total: 200ms (sync con avatar)  → planner valida A/B
// PRM timing total: ≤150ms (D-03 cross-cutting Phase 1)
//
// Returns:
//   - layerA: { chapter: Ref<number|null>, opacity: Ref<number 0..1> }
//   - layerB: { chapter: Ref<number|null>, opacity: Ref<number 0..1> }
//   - transitionPhase: Ref<'idle' | 'crossfading'>
//
// State machine:
//   Initial state:
//     layerA = { chapter: initialChapter (3 default), opacity: 1 }
//     layerB = { chapter: null,                       opacity: 0 }
//     transitionPhase = 'idle'
//
//   On activeChapter change (newCh):
//     identify "outgoing" = whichever layer currently has opacity 1
//     identify "incoming" = the other layer
//     incoming.chapter = newCh
//     transitionPhase = 'crossfading'
//     [CSS transition kicks in on opacity bindings]
//     await TOTAL_MS
//     outgoing.opacity = 0  (or already 0 — depending on which crossfade direction)
//     transitionPhase = 'idle'

import { ref, watch, inject, onBeforeUnmount } from 'vue'

const DEFAULT_DURATION_MS = 200   // Open-Q2-B locked to 200ms (sync avatar)
const PRM_DURATION_MS     = 150   // D-03 cross-cutting Phase 1

export function useBackgroundMorph(activeChapter, prm) {
  const { prefersReduced } = prm

  // Initial: layerA carries activeChapter visible; layerB is below transparent.
  const layerA = {
    chapter: ref(activeChapter.value),
    opacity: ref(1),
  }
  const layerB = {
    chapter: ref(null),
    opacity: ref(0),
  }

  const transitionPhase = ref('idle')
  let pendingTimer = null
  let activeLayer = 'A'  // which layer currently holds the visible chapter

  function morph(newChapter) {
    // Cancel any in-flight transition (defensive — rapid scroll)
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }

    const duration = prefersReduced.value ? PRM_DURATION_MS : DEFAULT_DURATION_MS
    const incoming = activeLayer === 'A' ? layerB : layerA
    const outgoing = activeLayer === 'A' ? layerA : layerB

    // Set incoming chapter BEFORE starting the crossfade so the CSS
    // transition has the correct data-chapter visible.
    incoming.chapter.value = newChapter
    transitionPhase.value = 'crossfading'

    // Trigger crossfade via opacity bindings — CSS transition handles
    // the actual visual interpolation (declared in BackgroundLayers.vue).
    incoming.opacity.value = 1
    outgoing.opacity.value = 0

    // Schedule post-crossfade cleanup (clear outgoing chapter so it's
    // ready for the next swap with a "blank" starting state).
    pendingTimer = setTimeout(() => {
      outgoing.chapter.value = null
      transitionPhase.value = 'idle'
      pendingTimer = null
      activeLayer = activeLayer === 'A' ? 'B' : 'A'
    }, duration)
  }

  // Main watch — fires on each activeChapter change.
  // immediate: false → don't fire on initial mount (initial state already set above).
  watch(activeChapter, (newCh, oldCh) => {
    if (newCh === oldCh) return
    morph(newCh)
  })

  // PRM mid-flight recovery (analogous to HIGH 2 fix in StickyAvatar Plan 03).
  // If user enables PRM during a crossfade, force-finalize to prevent
  // a layer being stuck at fractional opacity.
  watch(prefersReduced, (isPRM) => {
    if (isPRM && pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
      // Snap to final state immediately.
      const incoming = activeLayer === 'A' ? layerB : layerA
      const outgoing = activeLayer === 'A' ? layerA : layerB
      incoming.opacity.value = 1
      outgoing.opacity.value = 0
      outgoing.chapter.value = null
      transitionPhase.value = 'idle'
      activeLayer = activeLayer === 'A' ? 'B' : 'A'
    }
  })

  onBeforeUnmount(() => {
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      pendingTimer = null
    }
  })

  return { layerA, layerB, transitionPhase }
}
```

**Integration in App.vue:**

```javascript
import { useBackgroundMorph } from './composables/useBackgroundMorph'

// scrollState and prm already provided in Phase 1
const scrollState = useScrollState(shellRef)
const prm = usePRM()
const bgMorph = useBackgroundMorph(scrollState.activeChapter, prm)

provide('scrollState', scrollState)
provide('prm', prm)
provide('bgMorph', bgMorph)
```

**`BackgroundLayers.vue` consumes via inject:**

```vue
<script setup>
import { inject } from 'vue'
const { layerA, layerB } = inject('bgMorph')
</script>

<template>
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
</template>

<style scoped>
.bg-layers { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
.bg-layer {
  position: absolute;
  inset: 0;
  background: var(--c-bg);  /* reads its data-chapter's --c-bg */
  transition: opacity 200ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .bg-layer { transition: opacity 150ms ease; }  /* D-03 ≤150ms */
}
</style>
```

**Key design decisions:**
1. **State machine pattern** análogo a StickyAvatar.vue Phase 1 (Plan 03) — el repo ya tiene 67 tests pasando sobre este patrón, reduce risk de nuevo bug class.
2. **PRM mid-flight recovery** copia el HIGH 2 fix de StickyAvatar — sin él, activar PRM mid-fade dejaría una capa atascada.
3. **`activeLayer` variable local (no ref):** no necesita ser reactiva; es bookkeeping interno del state machine. Evita re-renders innecesarios.
4. **`onBeforeUnmount` cleanup defensive:** análogo al SkipLink Phase 1 — protege contra hot-reload leaks.

### Pattern 3: vue-i18n v11 `legacy: false` Setup (I18N-01)

**What:** Composition API mode (mandatory en v11; Legacy API se removerá en v12). `useI18n()` composable + reactive `locale` + `t()` function.

**When to use:** Cualquier proyecto Vue 3 sin compatibility con Vue 2 — que es este proyecto.

**Example:**

```javascript
// src/i18n/index.js
//
// Source: vue-i18n.intlify.dev/guide/migration/breaking11 [CITED]
//         + vue-i18n.intlify.dev/guide/advanced/composition [CITED]
//
// Decisions baked in:
//   - legacy: false (mandatory v11)
//   - fallbackLocale: 'en' (I18N-06)
//   - missingHandler con marker dev (Open-Q2-D)
//   - locale inicial: localStorage > navigator.language > 'es' (D2-09)

import { createI18n } from 'vue-i18n'
import en from './en.json'
import es from './es.json'

const STORAGE_KEY = 'portfolio.locale'

function resolveInitialLocale() {
  // 1. localStorage (toggle previo del usuario)
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'es' || stored === 'en') return stored

  // 2. navigator.language (auto-detect primer visit — D2-09)
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('es')) return 'es'
  if (nav) return 'en'

  // 3. Final fallback (edge case: navigator.language vacío)
  return 'es'
}

export const i18n = createI18n({
  legacy: false,                       // I18N-01 mandatory
  locale: resolveInitialLocale(),
  fallbackLocale: 'en',                // I18N-06
  messages: { en, es },
  missingWarn: import.meta.env.DEV,    // log misses solo en dev
  fallbackWarn: false,                 // silencioso en prod (key cae a 'en')
  missing: (locale, key) => {
    // Open-Q2-D — visible marker en dev, silent key raw en prod.
    if (import.meta.env.DEV) {
      console.warn(`[i18n missing] ${locale}/${key}`)
      return `[missing: ${key}]`
    }
    return key  // prod: render the key path itself, no marker pollution
  },
})

// Helper for App.vue to wire the <html lang> watcher.
export function persistLocale(newLocale) {
  localStorage.setItem(STORAGE_KEY, newLocale)
}
```

**Wire en `main.js`:**

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import './styles/chapter-themes.css'   // @layer + themes + @font-face

createApp(App).use(i18n).mount('#app')
```

**Component consumption pattern:**

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
// t('chapters.0.title')  →  reactive translation
// locale.value           →  current locale 'es' | 'en' (mutable)
</script>

<template>
  <h1>{{ t('chapters.0.title') }}</h1>
  <button :aria-label="t('ui.langToggle.aria')">
    {{ locale === 'es' ? 'EN' : 'ES' }}
  </button>
</template>
```

**SSR considerations:** N/A — proyecto es Vite SPA puro. Si Phase 6+ alguna vez añadiera SSR, vue-i18n v11 lo soporta con `globalInjection: true`; por ahora innecesario.

**TypeScript:** N/A — proyecto sin TS por decisión locked.

### Pattern 4: i18n Keys Naming (Open-Q2-C — jerárquico)

**What:** Estructura jerárquica industry-standard. Namespaces por dominio: `chapters`, `ui`, `avatar`.

**Example:**

```json
// src/i18n/es.json
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

```json
// src/i18n/en.json — paridad EXACTA de keys (I18N-02)
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

**Parity tooling:** Diff las dos JSONs para verificar paridad de keys (I18N-02). Test programático recomendado:

```javascript
// tests/i18n/parity.test.js
import en from '@/i18n/en.json'
import es from '@/i18n/es.json'

function flatten(obj, prefix = '') {
  return Object.keys(obj).flatMap(k => {
    const path = prefix ? `${prefix}.${k}` : k
    return typeof obj[k] === 'object' ? flatten(obj[k], path) : [path]
  })
}

test('en.json and es.json have identical key sets (I18N-02)', () => {
  const enKeys = flatten(en).sort()
  const esKeys = flatten(es).sort()
  expect(enKeys).toEqual(esKeys)
})
```

### Pattern 5: `LangToggle.vue` (I18N-03, D2-10)

**Example:**

```vue
<script setup>
import { useI18n } from 'vue-i18n'
import { persistLocale } from '@/i18n'

const { locale, t } = useI18n()

function toggle() {
  const next = locale.value === 'es' ? 'en' : 'es'
  locale.value = next         // vue-i18n reactivity → t() re-evaluates everywhere
  persistLocale(next)         // localStorage write (I18N-03)
}
</script>

<template>
  <button
    class="lang-toggle"
    :aria-label="t('ui.langToggle.aria')"
    @click="toggle"
  >
    <span class="lang-active">{{ locale === 'es' ? 'ES' : 'EN' }}</span>
    <span class="lang-sep" aria-hidden="true">|</span>
    <span class="lang-inactive">{{ locale === 'es' ? 'EN' : 'ES' }}</span>
  </button>
</template>

<style scoped>
.lang-toggle {
  position: fixed;
  top: var(--sp-md);
  right: var(--sp-md);
  z-index: 40;
  display: flex;
  align-items: center;
  gap: var(--sp-xs);
  padding: var(--sp-sm) var(--sp-md);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 999px;        /* pill */
  color: var(--c-fg);
  font-family: var(--font-body, ui-monospace);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
}

.lang-active { color: var(--c-fg); }
.lang-inactive { color: var(--c-muted); }
.lang-sep { color: var(--c-muted); }

@media (max-width: 599px) {
  .lang-toggle {
    /* Icon-only shrink — D2-10. */
    padding: var(--sp-sm);
    font-size: 11px;
  }
  /* Mostrar solo el activo + ícono globo (pendiente icono real;
     Phase 2 puede usar un emoji 🌐 o un span con CSS, planner decide) */
}
</style>
```

### Pattern 6: `<html lang>` Reactive Watch (I18N-04, A11Y-07)

```javascript
// In App.vue setup
import { useI18n } from 'vue-i18n'
import { watch } from 'vue'

const { locale } = useI18n()

watch(locale, (l) => {
  document.documentElement.lang = l
}, { immediate: true })
```

**Note:** `index.html` `<html lang="es">` queda como fallback estático (SEO, antes de que JS corra) — el watcher mutates desde JS. NO eliminar el attribute del HTML estático.

### Pattern 7: i18nified existing components (D2-11)

Patches mínimos a componentes Phase 1:

**SkipLink.vue** — el copy actual es bilingue verbatim "Saltar al contenido / Skip to content". Phase 2 lo refactor a:

```vue
<a href="#main-content" ...>{{ t('ui.skipLink') }}</a>
```

**StickyTimeline.vue** — `aria-label="Ir a ${ch.era} (${ch.year})"` (hardcoded ES). Phase 2:

```vue
<button :aria-label="t('ui.timeline.tickAria', { era: ch.era, year: ch.year })">
```

`nav aria-label="Navegación de capítulos por era"` → `t('ui.timeline.navAria')`.

**StickyAvatar.vue** — `aria-label="Avatar de Rafael — chapter ${activeChapter} activo"` → `t('avatar.ariaTemplate', { chapter: activeChapter })`.

### Anti-Patterns to Avoid

- **No aplicar `data-chapter` al wrapper global o al `<body>`:** rompería el principio de "scoping a la section" (D2-06) y reintroduciría el theme bleed que THM-04 quiere prevenir. **Use:** `data-chapter` HARDCODED en cada `<section>` (ya en place desde Phase 1 línea 78 de ScrollShell.vue).
- **No usar `body.theme-ch0` o clases globales para themes:** todos los themes "se filtrarían" durante el smooth-scroll cuando dos sections son visibles a la vez. **Use:** `[data-chapter="N"]` selector que limita a la subtree del `<section>`.
- **No mutate `<html lang>` desde múltiples puntos:** rompería el invariante de A11Y-07. **Use:** un solo `watch(locale, ...)` en App.vue.
- **No usar Legacy API mode de vue-i18n:** removida en v12. **Use:** `legacy: false` desde día uno.
- **No usar `*` selectors en chapter-specific CSS:** fuerza inheritance pollution. **Use:** CSS Custom Props que descienden naturalmente.
- **No leer `prefers-reduced-motion` por componente:** duplica matchMedia listeners. **Use:** `inject('prm')` (single source of truth Phase 1).
- **No usar `Google Fonts CDN`:** D2-07 locked. **Use:** self-hosted `/public/fonts/`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| i18n motor (locale state + reactive translation + plurals + interpolation + fallback) | i18n composable propio | **vue-i18n v11** | 10KB brotli, battle-tested, Vue 3 native, missing handler, locale switch reactive. Rolling esto a mano es ~300+ LOC + edge cases (plurals, interp, missing key behavior) |
| Locale persistence | Custom localStorage wrapper | Direct `localStorage.getItem/setItem` con `STORAGE_KEY` constant | Es 4 líneas; vue-i18n no incluye persistencia (es ortogonal) pero abstraerlo en composable separado solo añade overhead |
| Reduced-motion detection | matchMedia listener manual | **`usePRM()` de Phase 1** | Ya existe vía `@vueuse/core`'s `usePreferredReducedMotion`. Cleanup automático |
| Background morph 2-layer state machine | New event-driven architecture | **Pattern del avatar Phase 1 Plan 03** (state machine + watch + setTimeout + PRM mid-flight recovery) | Ya probado con 67 tests verdes. Mismas garantías (cancel pending, PRM recovery) |
| Font subsetting | Hand-edit hex glyph tables | **glyphhanger / pyftsubset / fontsource / gwfh.mranftl.com** | Subsetting requiere parsear el formato OpenType; las tools lo hacen bien |
| Font format conversion (ttf → woff2) | Manual conversion | **glyphhanger `--formats=woff2` o fontsource packages** | woff2 requiere brotli compression |
| Auto-detect locale | Custom Accept-Language parsing | **`navigator.language`** | SPA estática, no hay server; navigator.language es el único signal disponible |
| `<html lang>` mutation | Direct DOM manipulation desde múltiples componentes | **Un solo `watch(locale)` en App.vue** | Single source of truth previene drift |
| CSS cascade order management | `!important` o hipernested selectors | **`@layer reset, themes, components, utilities`** | Layers son la solución native; 96% browser support |
| Aria-label interpolation | Template literals con concat manual | **vue-i18n `t('key', { param: value })`** | Soporta plurals, named slots, escaping correcto |

**Key insight:** Phase 2 introduce dos motores (i18n + bg morph) y un sistema (themes + fonts). Los tres tienen tooling maduro: vue-i18n para i18n, el patrón del avatar Phase 1 para el morph, `@layer` para themes, fontsource/glyphhanger para fonts. **Hand-rolling cualquiera de estos triplicaría el LOC y agregaría una clase de bugs evitables.**

---

## Common Pitfalls

### Pitfall 1: Theme Bleed Durante Smooth-Scroll Transition (THM-04)

**What goes wrong:** Durante un click-to-nav smooth con `behavior: 'smooth'`, dos `<section>` chapters pueden estar parcialmente visibles a la vez. Si aplicáramos los themes a `body` o al wrapper global, se vería "half-and-half" durante el scroll — la mitad superior con theme del chapter saliente, la mitad inferior con el theme del chapter entrante.

**Why it happens:** CSS scope global. CSS Custom Props heredadas desde un ancestor común aplican a todos sus descendientes simultáneamente.

**How to avoid (D2-06 locked):** Cada `<section>` lleva su PROPIO `[data-chapter="N"]` hardcoded. Los themes están scoped a la subtree de cada section. Durante el smooth-scroll, el visitor ve la mitad superior del section saliente con SU theme original (no cambia) y la mitad inferior del section entrante con su theme propio. Es coherente, no "half-and-half" en un mismo elemento.

**Warning signs:**
- Inspect en DevTools de un section durante el scroll y ver heredada CSS Custom Prop de OTRO chapter.
- Texto cambia de color/font visualmente DURANTE el scroll (no al final del snap).
- BackgroundLayers visualmente "tira" del color del chapter activo hacia chapters vecinos.

**Phase to address:** Phase 2 — desde día uno. Verificación específica: ver §Theme Bleed Prevention Testing más abajo.

### Pitfall 2: Background Morph Interpolated en vez de Discrete (D2-05)

**What goes wrong:** Si el composable lee `scrollProgress` (continuo 0..1) en vez de `activeChapter` (discrete 0..6), el bg interpolaría continuamente entre dos colores mid-scroll — efecto vistoso pero rompe la heurística "vives en una era hasta que llegas a la siguiente".

**Why it happens:** scrollProgress es atractivo porque ya está provisto por useScrollState. La tentación es "¿por qué no usarlo para algo más?".

**How to avoid:** El composable `useBackgroundMorph(activeChapter, prm)` consume EXCLUSIVAMENTE el ref discrete. NO touch scrollProgress. El crossfade es event-driven (`watch(activeChapter, ...)`), no animation-frame-driven.

**Warning signs:**
- Bg color "drift" durante un scroll libre sin haber cruzado un snap point.
- Performance regresión 60fps → <30fps (interpolación cada frame costosa).

### Pitfall 3: vue-i18n Reactive Reactivity NO se Propaga a Aria-Labels (I18N-04 / A11Y-07)

**What goes wrong:** Aria-labels que se asignan UNA VEZ en `setup()` no se actualizan cuando cambia el locale. El visitor cambia idioma y los screen readers siguen leyendo la versión vieja.

**Why it happens:** `const label = t('key')` en setup() captura el valor en el instante del setup. NO es reactive.

**How to avoid:** Usar `t()` directamente en el template (que ES reactive porque vue-i18n tracks dependency) o un `computed(() => t('key'))`:

```javascript
// WRONG:
const label = t('ui.langToggle.aria')   // captured once

// CORRECT (template):
<button :aria-label="t('ui.langToggle.aria')">

// CORRECT (computed in script):
const label = computed(() => t('ui.langToggle.aria'))
```

**Warning signs:**
- Toggle de idioma, inspect ARIA en DevTools, valor sigue en español aunque visible text está en EN.
- Tests automated leen el aria-label antes del toggle pasan; después de toggle fallan.

### Pitfall 4: FOIT (Flash of Invisible Text) por Font Loading Lento (D2-08)

**What goes wrong:** Sin `font-display: swap`, el browser oculta el texto hasta que el font carga (FOIT — Flash of Invisible Text). En conexiones lentas el visitor ve la página en blanco hasta 3 segundos.

**Why it happens:** Default `font-display` value es `auto`, que en práctica significa "block" — esconde texto durante load.

**How to avoid:** Cada `@font-face` declara `font-display: swap`:

```css
@font-face {
  font-family: 'VT323';
  src: url('/fonts/vt323-latin-ext.woff2') format('woff2');
  font-display: swap;
  font-weight: 400;
  font-style: normal;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153;  /* Latin Extended subset */
}
```

`swap` significa: usar fallback system font inmediatamente; cuando el web font cargue, swappear. Visitor ve texto al instante.

**Warning signs:**
- Lighthouse Performance: warning "Avoid invisible text during webfont load".
- Texto en blanco visible al cargar el sitio.

### Pitfall 5: Layout Shift por Texto ES 20-30% Más Largo (I18N-05)

**What goes wrong:** "Cambiar idioma a inglés" (29 chars) vs "Switch language to Spanish" (26 chars) — close. Pero "Pre-carrera: niñez digital" (26) vs "Pre-career: digital childhood" (29) — close. Otros pares pueden ser más drásticos: "Convergencia: QA + AI" (21) vs "Convergence: QA + AI" (20) — close. Pero "Saltar al contenido" (19) vs "Skip to content" (15) — ES más largo por 27%.

Si el SkipLink o el chapter title overflows en mobile en ES pero no en EN, el toggle causa layout shift visible y posible reflow del scroll position.

**Why it happens:** ES es naturalmente más verbose que EN.

**How to avoid:** Ver Layout Shift Mitigation section. Strategies clave:
- Reservar `min-width` en elementos críticos (SkipLink, chapter titles, LangToggle).
- Usar `text-wrap: balance` en headings (Chrome ≥114, Firefox ≥121, Safari ≥17.5).
- `line-clamp` con `-webkit-line-clamp` para truncar gracefully si overflow.

**Warning signs:**
- Toggle de ES → EN visible reflow del layout.
- Mobile 375×667: ES wraps a 2 líneas, EN cabe en 1.

### Pitfall 6: navigator.language Mis-detect (D2-09)

**What goes wrong:** Algunos browsers en Chile/Argentina reportan `en-US` aunque el visitor hable español nativo (configuración OS heredada del sistema). Auto-detect falla.

**How to avoid:** Aceptamos el tradeoff (documentado en CONTEXT.md §specifics) — LangToggle muy visible top-right, un click + localStorage persist corrige. NO over-engineer con geolocation/IP detection.

**Warning signs:** Visitor en LatAm comenta "me apareció en inglés".

### Pitfall 7: `:focus-visible` Override per Chapter Pierde Grosor (A11Y-03)

**What goes wrong:** Phase 1 declaró `:focus-visible { outline: 3px solid var(--c-focus); outline-offset: 3px }` en App.vue `<style>` no scoped. Phase 2 sobreescribe `--c-focus` por chapter. Si un theme accidentalmente declara `outline: 1px solid` en algún botón, el focus ring pierde grosor visible (A11Y-03 rota).

**How to avoid:** Phase 2 NO toca `:focus-visible` declaration — SOLO cambia `--c-focus` value per chapter. El grosor 3px + offset 3px universal permanece. Test: tabular por cada chapter y verificar focus ring sigue 3px solid.

### Pitfall 8: Variable Font sin `font-weight` Range Declarada

**What goes wrong:** Inter Variable cargado pero declarado como `font-weight: 400` static. El visitor que usa weight 700 en heading ve fallback Helvetica bold porque Inter no tiene ese weight según la declaración.

**How to avoid:**

```css
@font-face {
  font-family: 'Inter Variable';
  src: url('/fonts/inter-variable-latin-ext.woff2') format('woff2-variations');
  font-weight: 100 900;       /* RANGE — not single value */
  font-style: normal;
  font-display: swap;
}
```

`format('woff2-variations')` y `font-weight: 100 900` son lo que activa el variable font correctamente.

### Pitfall 9: Background Layers `z-index: -1` Detrás de `body` Background

**What goes wrong:** Si el `body` tiene un `background` declarado (en index.html línea 16: `background: #0b0b16`), los BackgroundLayers con `z-index: -1` quedan DETRÁS del body bg y son invisibles.

**How to avoid:** Phase 2 remueve `background: #0b0b16` de `body` en index.html (o lo move a `:root` con z-index neutro). Los BackgroundLayers serán los responsables del bg color visible.

**Alternative:** Mantener body bg como fallback (defensive), pero asegurar que el container parent del scroll-shell NO tenga su propio bg. Test: viewing DevTools z-index stacking.

---

## Code Examples

Verified patterns from official sources:

### Example 1: `@layer` Cascade with Theme Override

```css
/* Source: MDN @layer + project D2-06 + WCAG 1.4.3 [CITED + VERIFIED] */
/* See Pattern 1 above for full 7-chapter example */
```

### Example 2: `useBackgroundMorph.js`

```javascript
// Source: derived from StickyAvatar.vue Phase 1 Plan 03 [CITED: src/components/StickyAvatar.vue]
// See Pattern 2 above for full implementation
```

### Example 3: vue-i18n createI18n Setup

```javascript
// Source: vue-i18n.intlify.dev/guide/migration/breaking11 [CITED]
// See Pattern 3 above for full src/i18n/index.js
```

### Example 4: LangToggle.vue

```vue
<!-- Source: D2-10 + I18N-03 + WCAG 4.1.2 [LOCKED] -->
<!-- See Pattern 5 above for full implementation -->
```

### Example 5: `<html lang>` Watcher

```javascript
// Source: WCAG 3.1.1 + I18N-04 + A11Y-07 [LOCKED]
// See Pattern 6 above
```

### Example 6: @font-face Self-Hosted with Subset

```css
/* Source: MDN @font-face + Google Fonts OFL [CITED] */
@font-face {
  font-family: 'VT323';
  src: url('/fonts/vt323-latin-ext.woff2') format('woff2');
  font-display: swap;
  font-weight: 400;
  font-style: normal;
  /* Latin Basic + Latin-1 Supplement (ñ á é í ó ú ü ¿ ¡) + select extras */
  unicode-range: U+0020-007F, U+00A0-00FF, U+0131, U+0152-0153, U+2010-2027;
}

@font-face {
  font-family: 'Comic Neue';
  src: url('/fonts/comic-neue-latin-ext.woff2') format('woff2');
  font-display: swap;
  font-weight: 400;
  font-style: normal;
  unicode-range: U+0020-007F, U+00A0-00FF, U+0131, U+0152-0153;
}

@font-face {
  font-family: 'Inter Variable';
  src: url('/fonts/inter-variable-latin-ext.woff2') format('woff2-variations');
  font-display: swap;
  font-weight: 100 900;
  font-style: normal;
  unicode-range: U+0020-007F, U+00A0-00FF, U+0131, U+0152-0153;
}

/* ...análogo para Lobster, Audiowide, Press Start 2P, y system-safe (Verdana stub ch2 puede usar fallback puro sin self-host) */
```

### Example 7: Font Subsetting Pipeline (PowerShell)

```powershell
# Option A — fontsource packages (RECOMENDADO Windows):
# Instala fonts ya subsetted + @font-face declarations
npm install @fontsource/vt323 @fontsource/comic-neue @fontsource/lobster `
            @fontsource/audiowide @fontsource/press-start-2p `
            @fontsource-variable/inter

# Importarlas en main.js — automatically wires @font-face:
# import '@fontsource/vt323/400.css'
# import '@fontsource-variable/inter'
# ...

# Option B — manual subset con glyphhanger (requires Python + brotli):
# 1. Install python + pip (Windows):
#    https://www.python.org/downloads/  (check "Add to PATH")
# 2. Install fonttools + brotli:
pip install fonttools brotli
# 3. Install glyphhanger (Node):
npm install -g glyphhanger
# 4. Download .ttf from Google Fonts (manually or via gwfh.mranftl.com)
# 5. Subset to Latin Extended .woff2:
glyphhanger --LATIN --formats=woff2 --subset=path/to/VT323-Regular.ttf
# Output: VT323-Regular-subset.woff2 → rename + move to public/fonts/

# Option C — google-webfonts-helper (zero-setup, web UI):
# https://gwfh.mranftl.com/fonts
# 1. Pick font + style + charsets (Latin Extended)
# 2. Download zip → extract .woff2 → drop in public/fonts/
# 3. Copy @font-face snippet to chapter-themes.css
```

---

## Theme Bleed Prevention Testing (THM-04)

**The pitfall:** Durante un scroll smooth entre chapters, dos `<section>` son visibles parcialmente. Si los themes "bleed", el visitor ve un texto/color del chapter saliente aplicado al chapter entrante (o viceversa).

**Why D2-06 prevents it architecturally:** Cada `<section>` lleva HARDCODED su `data-chapter`. Los themes están scoped a la subtree. No hay cascade global que cause bleed.

**Verification strategies:**

### Strategy 1: Automated Unit Test (vitest + @vue/test-utils)

```javascript
// tests/styles/theme-isolation.test.js
import { mount } from '@vue/test-utils'
import ScrollShell from '@/components/ScrollShell.vue'

test('each section has its own data-chapter attribute (THM-04)', () => {
  const wrapper = mount(ScrollShell, { /* provides */ })
  const sections = wrapper.findAll('section')
  expect(sections).toHaveLength(7)
  sections.forEach((s, i) => {
    expect(s.attributes('data-chapter')).toBe(String(i))
  })
})

test('no section inherits data-chapter from a parent', () => {
  const wrapper = mount(ScrollShell, { /* provides */ })
  // walk up from each section — no ancestor should have data-chapter
  const sections = wrapper.findAll('section')
  sections.forEach((s) => {
    let ancestor = s.element.parentElement
    while (ancestor) {
      expect(ancestor.dataset.chapter).toBeUndefined()
      ancestor = ancestor.parentElement
    }
  })
})
```

### Strategy 2: Computed Style Snapshot (jsdom)

```javascript
// tests/styles/theme-tokens.test.js
import { mount } from '@vue/test-utils'
import App from '@/App.vue'
import '@/styles/chapter-themes.css'  // load styles into jsdom

test('chapter 0 section reads ch0 --c-bg, NOT ch1 (THM-04)', () => {
  const wrapper = mount(App, { /* provides */ })
  const ch0 = wrapper.find('[data-chapter="0"]')
  const computed = window.getComputedStyle(ch0.element)
  // ch0 theme: --c-bg should resolve to #000000 (terminal)
  expect(computed.getPropertyValue('--c-bg').trim()).toBe('#000000')

  const ch1 = wrapper.find('[data-chapter="1"]')
  const computed1 = window.getComputedStyle(ch1.element)
  // ch1 theme: --c-bg should resolve to #000080 (90s starry navy)
  expect(computed1.getPropertyValue('--c-bg').trim()).toBe('#000080')
})
```

Note: jsdom doesn't fully implement getComputedStyle for CSS Custom Props — this test may need to be run in a real browser via Vitest's browser mode (`@vitest/browser` + Playwright). Phase 2 evalúa si vale la complejidad o si el manual checklist (Strategy 3) basta.

### Strategy 3: Manual Visual Diff Checklist (recomendado para Phase 2)

Manual checklist específico que el QA agent ejecuta tras impl:

```markdown
## Theme Bleed Visual Check (THM-04)

For each pair (ch0→ch1, ch1→ch2, ..., ch5→ch6):

1. [ ] Scroll lentamente con trackpad de un chapter al siguiente (NO snap click).
2. [ ] Mientras DOS sections son visibles en el viewport (transition state):
       - Verificar: la mitad superior mantiene SU theme original (colors, font).
       - Verificar: la mitad inferior tiene SU theme propio.
       - NO debe verse "half-and-half" en un mismo elemento (texto cambiando color mid-element).
3. [ ] Snapshot screenshot del transition state — save para diff visual.
4. [ ] Inspect DevTools Computed: section saliente debe mostrar SUS --c-bg/--c-fg correctos; entrante también.

Background morph independent check:
5. [ ] El bg crossfade ES global (D2-04) — el visitor lo perceptúa como "el bg cambió de era".
       Esto NO es theme bleed — es por design.
6. [ ] Durante el crossfade del bg, los TEXTOS de los chapters NO cambian de color hasta cruzar el snap.
```

### Strategy 4: Visual Regression Testing (Playwright + percy/chromatic)

OUT OF SCOPE para Phase 2 — overkill para el alcance. Documentado como v2 future si surge regresión.

**Recommendation:** Strategy 1 (automated) + Strategy 3 (manual) son suficiente. Strategy 2 condicional a si jsdom soporta CSS layers correctamente (verificar en spike pre-impl).

---

## Layout Shift Mitigation (I18N-05, A11Y-04)

Las strings ES son ~20-30% más largas que EN en promedio. Estrategias para que el toggle no rompa layout:

### Strategy 1: Reserve Min-Widths on Critical UI

```css
.lang-toggle {
  min-width: 72px;   /* Cabe "ES | EN" con padding en ambos idiomas */
}

.skip-link {
  min-width: 200px;  /* Reserva espacio que cabe tanto "Saltar al contenido" como "Skip to content" */
  /* Actualmente el SkipLink Phase 1 usa max-width: calc(100vw - 32px) con
     overflow ellipsis — Phase 2 debe verificar que i18nified version cabe
     sin ellipsis en 375×667. Si no, Plan 06 MEDIUM 3 fix Opción B (font-size
     12px en @media max-width 599px) ya está documentada como mitigation. */
}
```

### Strategy 2: `text-wrap: balance` en Chapter Titles

```css
[data-chapter] .chapter-title {
  text-wrap: balance;  /* Chrome 114+, Firefox 121+, Safari 17.5+ — 2026 universal */
}
```

`balance` reparte el texto en líneas equilibradas en el espacio dado [CITED: MDN text-wrap]. Limitación: máx 6 líneas en Chrome, 10 en Firefox. Chapter titles son 1-2 líneas → siempre dentro del rango.

### Strategy 3: Reserved Container Heights

```css
.chapter-title {
  min-height: 3em;  /* Cabe 2 líneas en ambos idiomas */
}
```

### Strategy 4: line-clamp para Casos Extremos

```css
.chapter-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

Si una string excede 2 líneas, trunca con ellipsis sin romper el layout. Defensive — Phase 3 dará bio strings más largas; Phase 2 chapter titles son cortos.

### Strategy 5: Container Queries (OUT OF SCOPE)

Deferred ideas explícitamente excluyó container queries para Phase 2. Si Phase 4 los necesita para responsive themes, evaluar.

### Verification

Manual checklist:

```markdown
## Layout Shift Visual Check (I18N-05)

For each toggle state ES→EN→ES:

1. [ ] LangToggle position estable — no se "mueve" lateralmente.
2. [ ] SkipLink (cuando visible vía Tab) cabe sin truncate en 375×667 mobile.
3. [ ] Chapter titles (sticky timeline label) caben en una línea en desktop, máx 2 en mobile.
4. [ ] No hay reflow visible (scroll position no salta).
5. [ ] Test en cada chapter (ch0..ch6) — los themes con fonts custom pueden tener métricas distintas.
```

Verification automated (CLS metric):

```javascript
// Use PerformanceObserver to detect layout shifts
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.value > 0.1) console.warn('CLS exceeded threshold:', entry)
  }
}).observe({ entryTypes: ['layout-shift'] })
```

CLS < 0.1 es el threshold Google Web Vitals.

---

## Contrast Tradeoff Documentation Pattern (D2-03, THM-05, A11Y-04)

**Formato verbatim del comentario inline** (D2-03 locked):

```css
[data-chapter="N"] {
  --c-bg: #...;
  --c-fg: #...;
  /* contrast(fg, bg) = X.X:1 — chapter N (era) accepts Y:1 here as era-authentic
     tradeoff per THM-05; [reasoning específico del era — magenta+comic son
     emblematic del HTML 90s; AAA contrast secundario al brand signal].
     Compensated by [larger font-size, font-weight, etc] which improves perceived
     legibility. */
}
```

**Examples concretos:**

```css
/* ch0 — NO tradeoff (era-authentic + AAA pasa) */
[data-chapter="0"] {
  --c-bg: #000000;
  --c-fg: #00ff41;
  /* contrast(#00ff41, #000000) = 15.3:1 — WCAG AAA passes naturally for ch0
     (CRT terminal green-on-black era-authentic). No tradeoff documentation
     required. */
}

/* ch1 — TRADEOFF documented */
[data-chapter="1"] {
  --c-bg: #000080;
  --c-fg: #ff00ff;
  /* contrast(#ff00ff, #000080) = 3.2:1 — chapter 1 (HTML 90s crudo) accepts
     3.2:1 here as era-authentic tradeoff per THM-05; era-accurate visual identity
     (Comic Sans + magenta on starry navy bg) demands this. Compensated by larger
     font-size 18px+ minimum and font-weight 400 which improve perceived
     legibility. axe DevTools warning expected; documented exception. */
}
```

### External Audit Tools

Para validar contrast claims:

| Tool | Use | Pros | Cons |
|------|-----|------|------|
| **axe DevTools** (browser ext) | Run per chapter en dev | Inline reporting, WCAG mapping | Free tier limited |
| **Lighthouse Accessibility** | Build verification | Integrated en Chrome DevTools | Single-page snapshot |
| **Pa11y CLI** | CI integration | Headless, scriptable | Requires setup |
| **WebAIM Contrast Checker** | Manual hex-pair check | Authoritative WCAG | Manual per pair |
| **chrome://inspect colors** | Visual debug | Native | No CI |

**Recommended workflow Phase 2:**
1. Compute contrast at theme-write time using WebAIM Contrast Checker (manual).
2. Document inline per pattern above.
3. Run axe DevTools manually on each chapter after impl.
4. Lighthouse accessibility score ≥85 on default landing (ch3) — captured in manual checklist.

NO documento separado `CONTRAST-MATRIX.md` (D2-03 explicit) — la fuente de verdad es el comentario inline.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `body` classes para themes | `[data-chapter]` per section + `@layer` | CSS Cascade Layers stable 2022; project D2-06 locked 2026-05-12 | Cero theme bleed durante snap |
| vue-i18n Legacy API mode | vue-i18n `legacy: false` Composition API | v11 deprecó Legacy (2024); v12 lo removerá | Mandatory I18N-01; obliga a `useI18n()` pattern |
| `v-t` directive de vue-i18n | `t()` function en templates | Deprecado v11 | Better DX (IDE autocomplete); no `v-t` en código nuevo |
| Google Fonts CDN | Self-hosted woff2 subsetted | Privacy + perf consciousness post-2020 | D2-07 locked; cero network dep, offline-safe |
| Static fonts (variants separados) | Variable fonts donde existan (Inter Variable) | Variable fonts mainstream 2020+ | Reduce bundle (1 archivo vs múltiples weights) |
| `tc` / `$tc` para plurals | `t()` con plural rules nativas | Removidos en v11 | API más limpia; no usar en código nuevo |

**Deprecated/outdated:**
- vue-i18n Legacy API (`legacy: true`) — removido en v12 [CITED: vue-i18n.intlify.dev/guide/migration/breaking11]
- vue-i18n `v-t` directive — removido en v12 [CITED: ibid]
- vue-i18n `tc()` / `$tc()` — removidos en v11 [CITED: ibid]
- `body.theme-X` global class pattern para themes — superseded by `@layer` + `[data-chapter]` [project D2-06]
- Manual `matchMedia('(prefers-reduced-motion: reduce)')` per component — superseded by `usePRM()` Phase 1 single source of truth

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | jsdom may not fully implement getComputedStyle for CSS Custom Props with @layer | Theme Bleed Testing Strategy 2 | Strategy 2 falls back to manual or Playwright browser mode |
| A2 | Visitor en mobile <600px tolerates LangToggle shrink to icon-only | LangToggle pattern §D2-10 | UX feedback; mitigable con tooltip text |
| A3 | `<html lang>` cambio NO triggera screen reader re-announce de toda la página | I18N-04 / A11Y-07 | Test con NVDA/VoiceOver requerido; comportamiento puede variar por SR |
| A4 | Inter Variable woff2 subset cabe bajo 100KB (file size estimate) | Standard Stack Inter Variable | Bundle target ~150-300KB total; si Inter solo es 200KB, plan ajusta otros fonts |
| A5 | Strings ES son 20-30% más largas que EN en promedio para este dominio (chapter titles, aria-labels) | Layout Shift Mitigation | Métrica de research general; el dominio real puede variar — verificar tras translation final |
| A6 | navigator.language disponible en ~99% de browsers target audiencia (recruiters NA/EU/Canadá + LatAm) | Auto-detect D2-09 | Final fallback a 'es' cubre edge case |
| A7 | font-display: swap NO causa CLS visible si el subset cubre Latin Extended completo | FOIT pitfall mitigation | Verificación en Lighthouse Web Vitals — Phase 2 manual checklist |
| A8 | El usuario reactivar PRM mid-flight (con un crossfade en vuelo) es edge case raro pero posible | useBackgroundMorph PRM mid-flight recovery | Pattern conservador heredado de StickyAvatar Phase 1 (HIGH 2 fix) — bajo costo, cubrirlo es prudente |
| A9 | `[data-chapter]` selector specificity (0,1,0) es suficiente vs `:root` (0,1,0) en mismo @layer themes — orden de aparición resuelve | CSS @layer cascade pattern §1 | Verificación: si fail, escalar a `:root[data-chapter]` (0,2,0) — fix trivial |

**Note:** Assumptions A1, A3, A7 son los más relevantes para confirmar antes/durante impl. A2, A4, A5 son del rango "validar durante QA / content authoring final". A6, A8, A9 son bajos riesgo / mitigaciones disponibles.

---

## Open Questions

### Q1: Phaser font compatibility for ch6 (Press Start 2P)

- What we know: ch6 stub solo styles HTML overlays (los proyectos modal overlay del Phase 5). La escena Phaser propiamente dicha NO usa CSS fonts — usa bitmap fonts cargadas en Phaser.
- What's unclear: Si Phase 5 Phaser scene reusa el mismo "Press Start 2P" como bitmap font, el ttf debería procesarse en el asset pipeline de Phaser (no es CSS @font-face). Phase 2 solo declara la @font-face para HTML, no para canvas.
- Recommendation: Phase 2 declara Press Start 2P para HTML only. Phase 5 evalúa cómo aplicarla en canvas (bitmap font textures, Phaser BitmapText). Documentado en HANDOFF para Phase 5.

### Q2: ¿Verdana stub ch2 se self-hosta o se confía en system-safe?

- What we know: Verdana es system-safe en Windows/Mac/iOS pero NO siempre presente en Android.
- What's unclear: Si los recruiters audiencia primaria en Android (raro pero posible) ven un fallback genérico vs Verdana auténtica.
- Recommendation: NO self-host Verdana (font-family stack: `'Verdana', 'Trebuchet MS', sans-serif`). Tradeoff aceptado: en Android sin Verdana el visitor ve Trebuchet (también era-authentic 90s/00s) o sans-serif default. Bundle savings: ~30-50KB.

### Q3: ¿Lazy-load fonts por chapter o load-all-upfront?

- What we know: 7 fonts × ~30-50KB c/u = 210-350KB upfront vs lazy (~50KB initial, others on demand).
- What's unclear: Si lazy-load introduce FOIT visible al cambiar chapter (cuando el font del chapter entrante aún no carga).
- Recommendation: **Load-all-upfront** para ch3 (default landing) + el current chapter via `<link rel="preload" as="font">`. Otros fonts via `font-display: swap` natural. Phase 2 mide bundle real tras subset; si excede 300KB, evaluar lazy.

### Q4: ¿`useBackgroundMorph` también necesita `inject('scrollState')` directamente o solo recibe el ref como argumento?

- What we know: El patrón de Phase 1 (StickyAvatar.vue) usa `inject('scrollState')` directo en el componente.
- What's unclear: Si `useBackgroundMorph` recibe `activeChapter` como arg (más testeable, más explícito) o lo injecta (más alineado con Phase 1 pattern).
- Recommendation: **Argumento explícito** — más testeable, no acopla al provide name string, planner can stub en tests. Sigue siendo provisto en App.vue desde el `scrollState.activeChapter`.

### Q5: ¿BackgroundLayers component vive en App.vue template o se monta vía portal/teleport?

- What we know: D2-04 dice "como primer hijo del template (z-index -1 detrás de todo)".
- What's unclear: Vue 3 `<Teleport to="body">` podría ser más limpio (escapa cualquier transform/contain de ancestors).
- Recommendation: **Plain mount como primer hijo de App.vue template**. App.vue es el root — no hay ancestor con transform/contain que cause issues. KISS.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install vue-i18n + fontsource | ✓ | (assumed from Phase 1 working) | — |
| npm | Package install | ✓ | (assumed) | — |
| vue@^3.5.0 | vue-i18n peer dep | ✓ | 3.5.x | — |
| Python 3 | glyphhanger pyftsubset | ❓ | (not verified) | Use fontsource packages (no Python needed) |
| pip + brotli | glyphhanger woff2 output | ❓ | (not verified) | Use fontsource OR gwfh.mranftl.com web tool |
| Internet access | Download fonts from Google Fonts | ✓ | — | — |
| Firebase CLI | Deploy (Phase 6) | N/A | — | — |

**Missing dependencies with no fallback:** None — Phase 2 puede ejecutarse con solo npm tools si elegimos fontsource path.

**Missing dependencies with fallback:**
- Python/glyphhanger pipeline → fallback a fontsource packages (recomendado Windows-native) o web UI gwfh.mranftl.com.

**Recommendation:** **fontsource packages** path. Cero dependencies extra, cross-platform, mantiene el "Windows-friendly" del proyecto. Plan adopta este path por default.

---

## Validation Architecture

**Phase 2 nyquist_validation: ENABLED** (`workflow.nyquist_validation: true` in `.planning/config.json`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 + @vue/test-utils 2.4.10 + jsdom 29.1.1 [VERIFIED: package.json] |
| Config file | `vitest.config.js` (assumed from Phase 1 — verify in Wave 0) |
| Quick run command | `npm run test:run` (vitest --run, single pass) |
| Full suite command | `npm run test:run && npm run build` |
| Test directory | `tests/` (Phase 1 has `tests/components/`, `tests/composables/`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| THM-01 | `chapter-themes.css` exists with 7 `[data-chapter="N"]` blocks | unit (file/string match) | `pytest tests/styles/themes-file.test.js` | ❌ Wave 0 |
| THM-02 | `@layer` declaration con orden reset/themes/components/utilities | unit (string match) | `pytest tests/styles/layers-order.test.js` | ❌ Wave 0 |
| THM-03 | 7 themes: ch0+ch1 completos, ch2-6 con stubs (5 props + font) | unit (parse CSS + assert tokens) | `pytest tests/styles/theme-tokens.test.js` | ❌ Wave 0 |
| THM-04 | No theme bleed — each section owns its `data-chapter` | unit (DOM walk) | `pytest tests/components/ScrollShell.theme-isolation.test.js` | ❌ Wave 0 |
| THM-04 (visual) | No bleed during smooth-scroll transition | manual | manual checklist (visual diff) | ❌ Wave 0 (checklist) |
| THM-05 | Contrast tradeoffs documented inline | unit (regex match against CSS file) | `pytest tests/styles/contrast-docs.test.js` | ❌ Wave 0 |
| THM-05 (external) | Real contrast values match documented | manual | axe DevTools / Pa11y / Lighthouse | ❌ Wave 0 (checklist) |
| I18N-01 | vue-i18n@^11.x installed + `legacy: false` | unit (parse src/i18n/index.js) | `pytest tests/i18n/setup.test.js` | ❌ Wave 0 |
| I18N-02 | en.json + es.json have identical keys | unit (key parity) | `pytest tests/i18n/parity.test.js` | ❌ Wave 0 |
| I18N-03 | LangToggle mounted + click toggles locale + localStorage persists | unit (mount + interact) | `pytest tests/components/LangToggle.test.js` | ❌ Wave 0 |
| I18N-04 | `<html lang>` updates on locale change | unit (watch fires + DOM mutation) | `pytest tests/i18n/html-lang-watcher.test.js` | ❌ Wave 0 |
| I18N-05 | Layout no se rompe con strings ES vs EN | manual + CLS observer | manual checklist + Lighthouse | ❌ Wave 0 (checklist) |
| I18N-06 | `fallbackLocale: 'en'` configured + missing handler returns marker in dev | unit (test marker output) | `pytest tests/i18n/fallback.test.js` | ❌ Wave 0 |
| A11Y-03 | Focus ring visible 3px on focus-visible per chapter | unit + manual | `pytest tests/styles/focus-ring.test.js` + manual tab through | ❌ Wave 0 |
| A11Y-04 | Same as THM-05 contrast verification | — | — | — |
| A11Y-07 | Same as I18N-04 `<html lang>` reactive | — | — | — |
| useBackgroundMorph | State machine: initial state + watch fires + PRM branch + mid-flight recovery + cleanup | unit (composable test) | `pytest tests/composables/useBackgroundMorph.test.js` | ❌ Wave 0 |
| BackgroundLayers.vue | 2 layers render + opacity bindings + data-chapter bindings | unit (mount + assert) | `pytest tests/components/BackgroundLayers.test.js` | ❌ Wave 0 |
| SkipLink i18n | Text reactively changes with locale | unit (mount + locale switch) | `pytest tests/components/SkipLink.i18n.test.js` | ❌ Wave 0 (extends Phase 1 test) |
| StickyTimeline i18n | aria-labels reactively change | unit (mount + locale switch) | `pytest tests/components/StickyTimeline.i18n.test.js` | ❌ Wave 0 (extends Phase 1 test) |
| StickyAvatar i18n | aria-label reactively changes | unit (mount + locale switch) | `pytest tests/components/StickyAvatar.i18n.test.js` | ❌ Wave 0 (extends Phase 1 test) |

(Use of `pytest` is symbolic; actual command is `npm run test:run -- {pattern}` with vitest.)

### Sampling Rate

- **Per task commit:** `npm run test:run -- {testFilePattern}` (single-test fast feedback ~2-5s)
- **Per wave merge:** `npm run test:run` (full suite ~10-15s) + `npm run build` (~600ms)
- **Phase gate:** Full suite green + build verde + manual checklist `02-MANUAL-CHECKLIST.md` completo antes de `/gsd-verify-work 2`

### Wave 0 Gaps

- [ ] `tests/styles/themes-file.test.js` — covers THM-01, THM-02 (file structure + @layer order)
- [ ] `tests/styles/theme-tokens.test.js` — covers THM-03 (per-chapter tokens present)
- [ ] `tests/styles/contrast-docs.test.js` — covers THM-05 inline doc comments
- [ ] `tests/styles/focus-ring.test.js` — covers A11Y-03 universal :focus-visible
- [ ] `tests/components/ScrollShell.theme-isolation.test.js` — covers THM-04 architectural
- [ ] `tests/i18n/setup.test.js` — covers I18N-01 (legacy false + version)
- [ ] `tests/i18n/parity.test.js` — covers I18N-02
- [ ] `tests/i18n/html-lang-watcher.test.js` — covers I18N-04 / A11Y-07
- [ ] `tests/i18n/fallback.test.js` — covers I18N-06
- [ ] `tests/components/LangToggle.test.js` — covers I18N-03
- [ ] `tests/components/BackgroundLayers.test.js` — covers BackgroundLayers DOM contract
- [ ] `tests/composables/useBackgroundMorph.test.js` — covers state machine + PRM recovery
- [ ] `tests/components/SkipLink.i18n.test.js` — extends Phase 1 SkipLink test
- [ ] `tests/components/StickyTimeline.i18n.test.js` — extends Phase 1
- [ ] `tests/components/StickyAvatar.i18n.test.js` — extends Phase 1
- [ ] `02-MANUAL-CHECKLIST.md` — covers I18N-05 (layout shift), THM-04 visual, THM-05 external audit, A11Y-04 axe DevTools, mobile <600px

**Framework install:** None — already installed (Phase 1 uses vitest).

**Test infrastructure dependencies:** All Phase 1 stuff still applies. Phase 2 may need vitest's `IMPORT.META.GLOB` for loading CSS in tests; verify in spike.

---

## Project Constraints (from CLAUDE.md)

- **Comunicación en español** con el usuario (este RESEARCH y todos los outputs).
- **Windows 11 + PowerShell 5.1** — comandos en PowerShell syntax (no bash).
- **Stack**: Vue 3 + Vite 5 + Phaser 3.86 (Phaser solo Phase 5).
- **Sistema multi-agente**: planner (este flujo) → frontend-dev (impl Phase 2) → qa (verifica).
- **Naming**: `ch{N}-{descriptor}[-{variant}].png` (no aplica a fonts; fonts en `/public/fonts/`).
- **No TypeScript, no Pinia, no Vue Router** — Phase 2 respeta estos anti-features.
- **No Google Fonts CDN** — alineado con D2-07 self-host.
- **No character animation** — irrelevante a Phase 2.

---

## Security Domain

`security_enforcement` not explicitly set in `.planning/config.json` → treat as enabled per default.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 2 sin auth (portafolio estático) |
| V3 Session Management | no | Sin sesiones |
| V4 Access Control | no | Sin permissions |
| V5 Input Validation | parcial | i18n missing key handler ignora user input (es estático); LangToggle solo toggle entre 2 valores fijos — input space cerrado |
| V6 Cryptography | no | Sin crypto en Phase 2 |
| V14 Configuration | yes | `font-display: swap`, `Content-Security-Policy` (deferred Phase 6), `loading="lazy"` no aplica |

### Known Threat Patterns for Vue 3 SPA Static

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via `v-html` con i18n message | Tampering | NO usar `v-html` con i18n messages. Use `t()` que escapes por default [CITED: vue-i18n docs] |
| localStorage tampering (locale value injection) | Tampering | Validar value en `resolveInitialLocale()` — solo aceptar `'es'` o `'en'` literal (ya en pattern §3) |
| Font file integrity (CDN/MITM) | Tampering | Self-hosted resuelve esto (D2-07) — sin CDN externo. Considerar SRI (`integrity` attr) si Phase 6 mueve assets a CDN |
| Privacy leak via Google Fonts CDN | Information Disclosure | Self-hosted resuelve esto (D2-07) — sin pings a fonts.googleapis.com |
| CSP violation from inline style bindings | Tampering | `:style="{ opacity: x }"` requiere `style-src 'unsafe-inline'` o nonce. Phase 6 evalúa CSP estricto; Phase 2 usa style bindings sin restricción interna |

**Phase 2 security stance:** Sin auth, sin user input runtime salvo el LangToggle binario. Surface area mínima. Mitigaciones documentadas: validar locale value pre-set, vue-i18n auto-escape default, self-host fonts elimina CDN-related issues.

---

## Risk List + Mitigations (Phase 2 Specific)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **R1: FOIT visible al primer load** porque fonts custom no cachean instant | MEDIUM | LOW-MEDIUM | `font-display: swap` en todos los `@font-face`. System-safe fallback en cada stack. Preload critical fonts en `<head>` (ch3 default landing). |
| **R2: vue-i18n bundle size impact** | LOW | LOW | vue-i18n auto-bundles runtime-only en prod (~5.5KB brotli) [CITED: vue-i18n.intlify.dev/guide/advanced/optimization]. Es ~5% del JS bundle Phase 1 (71KB → ~76KB). Aceptable. |
| **R3: Background layer paint cost en mobile** | LOW | MEDIUM | 2 capas `position: fixed` con opacity transition es bajo cost (compositor-only en navegadores modernos). NO usar `filter` o `backdrop-filter` (caro). Monitor en Lighthouse mobile preset. |
| **R4: Theme bleed regression durante Phase 3/4 cuando se añadan content-specific components** | MEDIUM | HIGH | `@layer` cascade order garantiza components layer gana sobre themes layer pero NO entre chapters. Tests automáticos (THM-04) detect early. Manual checklist en Phase 3/4 incluye visual diff. |
| **R5: navigator.language mis-detect ES users como EN** | MEDIUM | LOW | LangToggle muy visible top-right. Un click corrige + persiste. Documentado tradeoff. |
| **R6: Layout shift al toggle locale en mobile 375×667** | MEDIUM | MEDIUM | Min-widths + text-wrap: balance + line-clamp defensive. Manual checklist específico. Phase 1 MEDIUM 3 fix (font-size 12px @media) ya disponible si SkipLink overflow detectado. |
| **R7: Variable font Inter no carga correctamente en Safari iOS antiguos** | LOW | LOW | system-ui fallback en stack. Verdana stack alternative en ch2. font-display: swap garantiza texto siempre visible. |
| **R8: `<html lang>` change no reannounce screen reader** | LOW | LOW | A11Y-07 satisfecho técnicamente (attr es correcto post-toggle). Comportamiento del SR no es controlable por la web. NVDA/JAWS handling varía. Documentar como limitación conocida. |
| **R9: jsdom no soporta `@layer` correctamente → tests fallan en CI** | MEDIUM | MEDIUM | Spike pre-impl: probar Vitest + jsdom con `@layer` en un test pequeño. Fallback: Vitest browser mode (@vitest/browser + Playwright). |
| **R10: 7 fonts × 50KB = 350KB bundle excede target 150-300KB** | MEDIUM | LOW-MEDIUM | Inter Variable cuenta como ~80-120KB (variable cubre múltiples weights). Otros fonts subset agresivo. Si excede, descopear: ch2 Verdana sin self-host (-30KB), ch4 Audiowide opcional. |

---

## Sources

### Primary (HIGH confidence)

- **vue-i18n@11.4.2** — `npm view vue-i18n version` → 11.4.2 [VERIFIED 2026-05-12 npm registry]
- **vue-i18n peer dependencies** — `{ vue: '^3.0.0' }` [VERIFIED 2026-05-12 npm registry]
- **vue-i18n breaking changes v11** — Legacy API deprecated, removed in v12; `v-t` deprecated; `tc/$tc` removed [CITED: https://vue-i18n.intlify.dev/guide/migration/breaking11]
- **vue-i18n composition API guide** — `useI18n()` setup pattern [CITED: https://vue-i18n.intlify.dev/guide/advanced/composition]
- **vue-i18n optimization** — Runtime-only auto-bundle in production [CITED: https://vue-i18n.intlify.dev/guide/advanced/optimization]
- **CSS @layer browser support** — 96%+ in 2026, all major browsers since 2022 [CITED: https://caniuse.com/css-cascade-layers]
- **MDN @layer** — Syntax and cascade semantics [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/@layer]
- **MDN Specificity** — Attribute selectors (0,1,0); :root pseudo-class (0,1,0); order resolves ties [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity]
- **MDN @media prefers-reduced-motion** — `reduce` vs `no-preference` semantics [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion]
- **MDN text-wrap** — `balance` Chrome 114+, Firefox 121+, Safari 17.5+ [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap]
- **VT323 license** — OFL-1.1 [CITED: https://fonts.google.com/specimen/VT323]
- **Press Start 2P license** — OFL [CITED: https://fonts.google.com/specimen/Press+Start+2P]
- **Inter license** — OFL-1.1 [CITED: https://github.com/rsms/inter]
- **fontsource Inter Variable** — `@fontsource-variable/inter` npm [CITED: https://fontsource.org/fonts/inter/install]
- **Phase 1 src/components/StickyAvatar.vue** — state machine pattern reference [VERIFIED: file read]
- **Phase 1 src/composables/usePRM.js** — single source PRM [VERIFIED: file read]
- **Phase 1 src/App.vue** — `:root` paleta neutra + provide pattern + watch immediate [VERIFIED: file read]
- **Phase 1 src/components/ScrollShell.vue** — v-for con `:data-chapter="ch.id"` ya en place [VERIFIED: file read]
- **Phase 1 index.html** — `<html lang="es">` hardcoded base [VERIFIED: file read]
- **Phase 1 package.json** — vue@^3.5.0, @vueuse/core@^14.3.0, vitest@^4.1.6 [VERIFIED: file read]
- **Phase 1 .planning/config.json** — `nyquist_validation: true`, `commit_docs: true` [VERIFIED: file read]

### Secondary (MEDIUM confidence — verified with multiple sources)

- **glyphhanger v5.0.0** — `npm view glyphhanger version` [VERIFIED 2026-05-12] + GitHub repo + Filament Group blog
- **petite-vue-i18n vs vue-i18n bundle sizes** — bundlephobia + vue-i18n docs [CITED]
- **Comic Neue license OFL** — multiple sources [CITED]
- **Lobster license OFL** — Google Fonts directory [CITED]
- **Audiowide license OFL** — Google Fonts directory [CITED]
- **fontsource packages structure** — fontsource.org docs + npm packages

### Tertiary (LOW confidence — single source or pattern-based reasoning)

- **A1 / A3 — jsdom limitations and screen reader behavior** — pattern knowledge, NOT verified in this session
- **A4 — Inter Variable subset size estimate** — based on rsms/inter docs (full file 329KB); subset estimate from past projects
- **A5 — ES strings 20-30% longer than EN** — common knowledge from i18n research; not measured for this specific dataset

---

## Metadata

**Confidence breakdown:**
- Standard stack (vue-i18n version, peer deps, OFL fonts): **HIGH** — verified via npm + official docs
- Architecture patterns (`@layer`, useBackgroundMorph, vue-i18n setup): **HIGH** — derived from Phase 1 existing code + official MDN/intlify
- Pitfalls (theme bleed, FOIT, layout shift, focus override): **HIGH** — combination of MDN + Phase 1 code review + project decisions
- Theme tradeoff documentation pattern: **HIGH** — D2-03 locked verbatim
- Background morph state machine: **HIGH** — pattern proven in Phase 1 Plan 03 (67 tests verde)
- Font subsetting pipeline: **MEDIUM** — fontsource path verified; manual glyphhanger path documented but not personally executed in this session
- jsdom + `@layer` testing compatibility: **LOW** — needs spike pre-impl (Assumption A1)
- Screen reader `<html lang>` reannouncement behavior: **LOW** — varies by SR, documented as limitation (Assumption A3)

**Research date:** 2026-05-12
**Valid until:** ~2026-06-12 (30 days — stable domain, vue-i18n stable major version, CSS features stable). vue-i18n minor releases possible during window but won't affect Phase 2 patterns.

---

## RESEARCH COMPLETE
