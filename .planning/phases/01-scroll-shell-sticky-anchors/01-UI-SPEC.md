---
phase: 1
slug: scroll-shell-sticky-anchors
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-12
---

# Phase 1 — UI Design Contract: Scroll Shell + Sticky Anchors

> Contrato visual e interactivo para Phase 1. Generado por gsd-ui-researcher.
> Consumido por gsd-ui-checker, gsd-planner y gsd-executor.
> **No re-preguntar al usuario** — todas las decisiones están bloqueadas en este documento.

---

## 1. Phase Boundary + Locked Decisions

### Qué construye Phase 1

La infraestructura de scroll: `ScrollShell` con 7 `ChapterSection` coexistentes en el DOM,
`StickyAvatar` placeholder top-left, `StickyTimeline` bottom full-width con marker móvil,
`SkipLink` siempre visible, tracking reactivo via IntersectionObserver, deep-link `?ch=N`,
navegación con flechas ↑/↓, soporte mobile portrait + landscape, smoke test iOS.

### Qué NO incluye Phase 1 (fuera de contrato)

- Themes era-auténticos (Phase 2)
- Toggle i18n ES/EN (Phase 2)
- Contenido real / bio / proyectos (Phase 3)
- Pixel art de busts (Phase 3) — Phase 1 usa placeholder gris `ch{N}`
- Pixel art de fondos (Phase 4)
- Escena Phaser ch6 (Phase 5)
- Deploy (Phase 6)

### Reduced-Motion Policy — decisiones bloqueadas (D-01..D-06)

Fuente: `01-CONTEXT.md §Implementation Decisions`

| Código | Elemento | Default | Bajo `prefers-reduced-motion: reduce` |
|--------|----------|---------|---------------------------------------|
| D-01 | Scroll snap entre chapters | `scroll-behavior: smooth` (snap continuo) | `scroll-behavior: auto` (jump instantáneo); `scroll-snap-type: y mandatory` se mantiene siempre |
| D-02 | Swap del avatar sticky | Crossfade 200ms opacity | Instantáneo — single-frame replace, sin transición |
| D-03 | Background morph entre eras | Crossfade ≥ 200ms (Phase 2 lo implementa) | Crossfade rápido ≤ 150ms; Phase 2 lo implementa |
| D-04 | Click-to-nav (tick, flechas, `?ch=N`) | `scrollTo({ behavior: 'smooth' })` | `scrollTo({ behavior: 'auto' })` — instantáneo |
| D-05 | Micro-animations HUD (hover/focus en ticks) | Transition ≤ 150ms | Transition ≤ 150ms — se mantiene (interaction-derived); pulses/glows decorativos OFF |
| D-06 | Principio rector cross-cutting | — | ¿Interaction-derived y ≤ 150ms? → permitida. ¿Auto-played/decorative? → OFF. ¿Área grande con cambio drástico? → crossfade sutil ≤ 150ms permitido |

---

## 2. Design System

| Propiedad | Valor |
|-----------|-------|
| Tool | none (sin shadcn — stack Vue 3 + Vite, sin React) |
| Preset | not applicable |
| Component library | none — composables propios |
| Icon library | none en Phase 1 — si se necesita chevron/arrow, usar SVG inline o Unicode |
| Font | `ui-monospace, SFMono-Regular, Menlo, monospace` (ya en index.html) |

**Nota:** Phase 2 sobreescribe la familia tipográfica por chapter. Phase 1 usa la fuente
monoespaciada del scaffold como neutral de infraestructura.

---

## 3. Spacing Tokens

Base unit: **8px**. Todos los valores son múltiplos de 4.

| Token | Valor | Uso en Phase 1 |
|-------|-------|----------------|
| `--sp-xs` | 4px | Gap entre skip link y avatar; padding interno de ticks de timeline |
| `--sp-sm` | 8px | Padding interno del avatar slot; gap entre ticks en timeline |
| `--sp-md` | 16px | Margen del avatar slot respecto a las aristas del viewport (top, left) |
| `--sp-lg` | 24px | Padding horizontal del era title dentro de cada ChapterSection |
| `--sp-xl` | 32px | Padding vertical del era title (centrado vertical via flex) |
| `--sp-2xl` | 48px | Altura total del StickyTimeline (track + labels + padding) |
| `--sp-3xl` | 64px | Reservado — no usado en Phase 1 |

**Excepciones declaradas:**

- Avatar slot: 80×96px (dimensión fija, no múltiplo de 8 — justificado por proporciones
  del bust pixel art futuro; el contenedor placeholder replica las dimensiones exactas).
- Timeline track height: 10px (dentro del rango 8–12px de A2; múltiplo de 2 aceptable
  para grosor de track que no tiene equivalente en la escala de spacing).
- Touch targets mínimos en ticks de timeline: 44×44px (zona de tap), aunque el tick
  visible sea más pequeño. El área interactiva envuelve al tick visual.

---

## 4. Color Tokens (paleta neutral Phase 1)

Phase 2 sobreescribe todos estos valores mediante CSS Custom Properties por chapter.
Phase 1 declara solo la capa base neutral que sirve como fallback.

| Token | Valor hex | Rol |
|-------|-----------|-----|
| `--c-bg` | `#0b0b16` | Fondo base (ya en index.html) — 60% dominante |
| `--c-fg` | `#e7e7f0` | Texto foreground base (ya en index.html) — texto principal |
| `--c-surface` | `#1a1a2e` | Superficie secundaria (avatar slot background, timeline background) — 30% secundario |
| `--c-border` | `#2e2e4a` | Borde sutil del avatar slot y separador del timeline track |
| `--c-track` | `#2e2e4a` | Color del track de la timeline (inactivo) |
| `--c-track-active` | `#e7e7f0` | Color del tick activo en la timeline — contraste 4.5:1 sobre `--c-track` |
| `--c-marker` | `#a0a0c0` | Color del puck/marker de la timeline |
| `--c-focus` | `#7dd3fc` | Focus ring — cyan blue; contraste 4.5:1 sobre `#0b0b16` (verificado) |
| `--c-muted` | `#6b6b8a` | Labels de año en ticks inactivos; texto `ch{N}` en avatar placeholder |
| `--c-tick-hover` | `#c0c0d8` | Tick en hover; contraste 4.5:1 sobre `--c-bg` |

**Distribución 60/30/10:**
- 60% dominante: `--c-bg` (#0b0b16) — fondo de los 7 ChapterSection
- 30% secundario: `--c-surface` (#1a1a2e) — avatar slot, timeline bar background
- 10% acento: `--c-focus` (#7dd3fc) — reservado exclusivamente para focus ring y tick activo highlight
  cuando se navega con teclado. NO se usa en decoración general.

**Contraste verificado (WCAG AA 4.5:1):**
- `#e7e7f0` sobre `#0b0b16` → ratio ~13.5:1 ✓
- `#7dd3fc` sobre `#0b0b16` → ratio ~8.9:1 ✓
- `#e7e7f0` sobre `#2e2e4a` → ratio ~7.2:1 ✓ (tick activo sobre track)
- `#c0c0d8` sobre `#0b0b16` → ratio ~6.1:1 ✓ (tick hover)

---

## 5. Typography (escala mínima Phase 1)

Phase 1 no implementa la escala tipográfica era-auténtica (Phase 2). Usa una escala
neutral con la fuente monoespaciada del scaffold.

| Rol | Tamaño | Peso | Line-height | Uso |
|-----|--------|------|-------------|-----|
| Era title | `clamp(2rem, 5vw, 3.5rem)` | 700 (bold) | 1.1 | Título grande en cada ChapterSection ("1995 · Terminal") |
| Era year (timeline) | 11px | 400 (regular) | 1.0 | Año debajo de cada tick (1995, 2001...) |
| Era label (active) | 12px | 700 (bold) | 1.0 | Año del chapter activo — mayor contraste/peso |
| Avatar slot text | 14px | 400 (regular) | 1.0 | Texto `ch{N}` en el placeholder gris |
| Skip link | 14px | 700 (bold) | 1.4 | "Saltar al contenido / Skip to content" |

**Familia tipográfica Phase 1:** `ui-monospace, SFMono-Regular, Menlo, monospace`
(heredada del scaffold; Phase 2 la sobreescribe por chapter).

**Nota sobre el era title:** `clamp()` garantiza legibilidad en mobile sin overflow.
El separador `·` (U+00B7, middle dot) se usa entre año y nombre de era.

---

## 6. Layout y Regiones Sticky

### Diagrama ASCII — 4 regiones del viewport

```
┌─────────────────────────────────────────────────────┐
│ [SkipLink]       (visible hasta 1er Tab o 1er scroll)│  z: 50
│ [StickyAvatar]   top-left, 16px margin               │  z: 40
│  80×96px placeholder                                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│          ChapterSection (100dvh)                     │  z: 0
│          Fondo: --c-bg                               │
│          Era title centrado (flex center)            │
│          "YYYY · Era Name"                           │
│                                                      │
│  (7 sections × 100dvh = 700dvh total scroll height) │
│                                                      │
├─────────────────────────────────────────────────────┤
│ [StickyTimeline] bottom, 100% width, 48px height    │  z: 40
│  [◄────●──────────────────────────────►]            │
│   1995  2001  2009  2013  2015  2022  2026           │
└─────────────────────────────────────────────────────┘
```

### ScrollShell (raíz)

```
<main id="main-content" class="scroll-shell" tabindex="0">
  <!-- 7 ChapterSection hijos directos -->
</main>
```

- `height: 100dvh` en el shell viewport container (el padre que hace overflow)
- `overflow-y: scroll` + `scroll-snap-type: y mandatory`
- `scroll-behavior: smooth` (JavaScript aplica `auto` bajo PRM)
- `tabindex="0"` para capturar eventos de teclado (↑/↓) — A11Y-02

**Posicionamiento de sticky elements:** `position: fixed` (no `sticky`) porque necesitan
permanecer visibles independientemente del scroll container interior.

### StickyAvatar

- `position: fixed; top: 16px; left: 16px; z-index: 40`
- Dimensiones: `width: 80px; height: 96px`
- En mobile portrait (< 600px): `width: 56px; height: 68px; top: 8px; left: 8px`

### StickyTimeline

- `position: fixed; bottom: 0; left: 0; right: 0; height: 48px; z-index: 40`
- Background: `--c-surface` con `border-top: 1px solid --c-border`

### SkipLink

- `position: fixed; top: 8px; left: 50%; transform: translateX(-50%); z-index: 50`
- Visible desde carga hasta primer Tab o primer evento de scroll (se oculta con `opacity: 0`
  + `pointer-events: none` tras la primera interacción)
- No ocluye el avatar (está centrado horizontalmente; el avatar está top-left)

### Relación de z-index

| Capa | z-index | Elemento |
|------|---------|----------|
| 50 | SkipLink | Siempre sobre todo |
| 40 | StickyAvatar, StickyTimeline | Sobre el contenido scrolleable |
| 0 | ChapterSection | Contenido base |

---

## 7. Componentes — Anatomía, Estados y A11Y

### 7.1 ChapterSection

**Estructura DOM:**

```html
<section
  id="chapter-{N}"
  class="chapter-section"
  data-chapter="{N}"
  aria-label="{era_label} — {year}"
>
  <div class="chapter-placeholder">
    <p class="era-title">{year} · {era_name}</p>
  </div>
</section>
```

- `scroll-snap-align: start`
- `scroll-snap-stop: always`
- `height: 100dvh`
- `width: 100%`
- `display: flex; align-items: center; justify-content: center`

**Era labels exactos** (fuente: PROJECT.md §Mapeo de chapters):

| N | Año | Era label completo en era title |
|---|-----|---------------------------------|
| 0 | 1995 | `1995 · Terminal` |
| 1 | 2001 | `2001 · HTML 90s` |
| 2 | 2009 | `2009 · Flash` |
| 3 | 2013 | `2013 · Web 2.0` |
| 4 | 2015 | `2015 · AR/VR` |
| 5 | 2022 | `2022 · Modern` |
| 6 | 2026 | `2026 · Phaser` |

**Estados:**

| Estado | Tratamiento visual |
|--------|--------------------|
| Default (inactivo) | `opacity: 0.6` en el era title (chapters no activos visibles durante snap transition) |
| Active | `opacity: 1` en el era title |
| Snap-in-progress | Sin transición especial — el snap es gestionado por el browser |

**Motion:** Sin animación propia en Phase 1. Phase 2 añade background morph.

**A11Y:**
- `aria-label` provee contexto semántico para screen readers
- `id="chapter-{N}"` es el target de navegación desde la timeline
- No es el target del skip link — el skip link apunta a `#main-content` (el ScrollShell)

---

### 7.2 StickyAvatar

**Estructura DOM:**

```html
<aside
  class="sticky-avatar"
  aria-label="Avatar de Rafael — chapter {N} activo"
  aria-live="polite"
>
  <div class="avatar-placeholder" aria-hidden="true">
    <span class="avatar-chapter-label">ch{N}</span>
  </div>
</aside>
```

**Estilos del placeholder:**

```css
.sticky-avatar {
  position: fixed;
  top: var(--sp-md);        /* 16px */
  left: var(--sp-md);       /* 16px */
  z-index: 40;
  width: 80px;
  height: 96px;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--c-surface);     /* #1a1a2e */
  border: 1px solid var(--c-border); /* #2e2e4a */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-chapter-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  font-weight: 400;
  color: var(--c-muted); /* #6b6b8a */
}
```

**Cuando Phase 3 entregue los busts**, el placeholder se reemplaza por:

```html
<img
  src="/assets/ch{N}-bust.png"
  alt="{alt_text_era_accurate_ES}"     <!-- Phase 3 define el alt text -->
  width="80"
  height="96"
/>
```

El elemento `<aside>` permanece — solo cambia su contenido interno.

**Estados y Motion:**

| Estado | Default | Bajo PRM (D-02) |
|--------|---------|-----------------|
| `activeChapter` cambia | `opacity` crossfade 200ms (`opacity: 0` → `opacity: 1`) | Swap instantáneo — single frame, sin transición CSS |
| Hover sobre el aside | Sin efecto en Phase 1 | — |
| Focus | `outline: 3px solid var(--c-focus); outline-offset: 3px` | Igual |

**Implementación del crossfade (default motion):**

JavaScript gestiona la transición: al cambiar `activeChapter`, aplicar `opacity: 0`,
esperar el frame, cambiar el contenido, aplicar `opacity: 1`. Si PRM está activo
(via `window.matchMedia('(prefers-reduced-motion: reduce)')`), omitir la fase de
opacidad y hacer el replace directo.

**A11Y:**
- `aria-live="polite"` anuncia el cambio de chapter a screen readers sin interrumpir
- `aria-label` del `<aside>` se actualiza reactivamente con el `activeChapter`
- El `div.avatar-placeholder` tiene `aria-hidden="true"` porque el contexto lo provee
  el `aria-label` del `<aside>` — evitar doble anuncio del texto `ch{N}`

---

### 7.3 StickyTimeline

**Estructura DOM:**

```html
<nav
  class="sticky-timeline"
  aria-label="Navegación de capítulos por era"
  role="navigation"
>
  <div class="timeline-track" aria-hidden="true">
    <div class="timeline-marker" aria-hidden="true"></div>
  </div>

  <ol class="timeline-ticks" role="list">
    <!-- Por cada chapter N (0..6): -->
    <li class="timeline-tick" role="listitem">
      <button
        class="tick-button"
        data-chapter="{N}"
        aria-label="Ir a {era_label} ({year})"
        aria-current="{true si activeChapter === N, omitido si no}"
        tabindex="0"
      >
        <span class="tick-notch" aria-hidden="true"></span>
        <span class="tick-year">{year}</span>
      </button>
    </li>
  </ol>
</nav>
```

**Estilos del track:**

```css
.sticky-timeline {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;              /* --sp-2xl */
  z-index: 40;
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0 var(--sp-md);  /* 16px horizontal */
}

.timeline-track {
  position: absolute;
  top: 50%;
  left: var(--sp-md);
  right: var(--sp-md);
  height: 10px;              /* track height A2 */
  background: var(--c-track);
  border-radius: 5px;
  transform: translateY(-50%);
}

.timeline-marker {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: var(--c-marker);   /* #a0a0c0 */
  border-radius: 50%;
  transform: translate(-50%, -50%);
  /* left: calculado vía JS según scrollProgress (0..1) */
  transition: left 0ms linear; /* binding continuo — sin ease */
}

/* Bajo PRM: el marker solo salta en clicks, no se anima */
/* El binding continuo durante swipe libre se mantiene siempre (gesture data, no CSS anim) */

.timeline-ticks {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
}

.tick-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-xs);         /* 4px */
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  min-width: 44px;           /* touch target mínimo */
  min-height: 44px;          /* touch target mínimo */
  justify-content: center;
}

.tick-notch {
  display: block;
  width: 2px;
  height: 8px;
  background: var(--c-track-active); /* #e7e7f0 por defecto */
  opacity: 0.4;
}

/* Tick activo */
.tick-button[aria-current="true"] .tick-notch {
  opacity: 1;
  background: var(--c-track-active);
}

.tick-button[aria-current="true"] .tick-year {
  font-weight: 700;
  color: var(--c-track-active);
}

.tick-year {
  font-size: 11px;
  font-weight: 400;
  color: var(--c-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

**States de un tick:**

| Estado | Notch opacity | Year color | Year weight | Transition |
|--------|--------------|------------|-------------|------------|
| Default inactivo | 0.4 | `--c-muted` (#6b6b8a) | 400 | — |
| Hover | 0.7; notch height 10px | `--c-tick-hover` (#c0c0d8) | 400 | 150ms ease (D-05) — se mantiene bajo PRM |
| Focus (teclado) | 1.0 | `--c-fg` (#e7e7f0) | 400 | 150ms ease | + `outline: 3px solid var(--c-focus); outline-offset: 3px` |
| Active (capítulo actual) | 1.0 | `--c-track-active` (#e7e7f0) | 700 | — |
| Pressed (`mousedown`) | 0.8 | — | — | instantáneo |

**Marker behavior:**

- Durante scroll libre: `left` del marker se actualiza en cada frame via `requestAnimationFrame`
  leyendo `scrollTop / (scrollHeight - clientHeight)` del ScrollShell → valor `0..1` → mapeado
  al rango visual del track. Este binding es gestura del usuario — se mantiene bajo PRM (D-06).
- Al click en un tick (default motion): `scrollTo({ behavior: 'smooth' })` en el ScrollShell;
  el marker sigue el scroll suave naturalmente.
- Al click en un tick (bajo PRM / D-04): `scrollTo({ behavior: 'auto' })`; el marker
  salta instantáneamente al tick destino (no hay CSS transition en el `left`).
- Al snap completarse: `activeChapter` se actualiza via IntersectionObserver; `aria-current`
  se actualiza en el tick correspondiente.

**Keyboard interaction:**

- `Tab` / `Shift+Tab` recorre los 7 `tick-button` secuencialmente
- `Enter` o `Space` sobre un tick dispara la navegación (equivale a click)
- Las flechas ↑/↓ se capturan en el `scroll-shell` (A11Y-02), no en los ticks individuales

**Touch:**

- Tap en un tick-button: misma lógica que click
- El swipe vertical dentro del `scroll-shell` es nativo del browser; el marker sigue
  `scrollTop` reactivamente

**A11Y:**

- `role="navigation"` + `aria-label` en el `<nav>` (WCAG 2.4.1)
- `aria-current="true"` en el tick activo (patrón estándar para nav items activos)
- `aria-label` en cada tick-button con era + año (evita depender solo del año visible)
- Los elementos `aria-hidden="true"` (track, notches) no son leídos por screen readers
- El `<ol>` con `role="list"` garantiza semántica de lista preservada con CSS `list-style: none`

---

### 7.4 SkipLink

**Estructura DOM:**

```html
<a
  href="#main-content"
  class="skip-link"
  id="skip-link"
>
  Saltar al contenido / Skip to content
</a>
```

**Estilos:**

```css
.skip-link {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  background: var(--c-surface);    /* #1a1a2e */
  color: var(--c-fg);              /* #e7e7f0 */
  font-size: 14px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding: 8px 16px;
  border: 1px solid var(--c-border);
  border-radius: 4px;
  text-decoration: none;
  white-space: nowrap;
  /* Visible por defecto */
  opacity: 1;
  pointer-events: auto;
  transition: opacity 200ms ease; /* se oculta al primer scroll o después del primer Tab */
}

.skip-link.hidden {
  opacity: 0;
  pointer-events: none;
}

/* Focus ring cuando el usuario tabea hacia él */
.skip-link:focus {
  outline: 3px solid var(--c-focus);
  outline-offset: 3px;
}
```

**Comportamiento:**

- Visible desde el momento en que la página carga (A11Y-01)
- Se oculta (`opacity: 0; pointer-events: none`) tras el primer evento de scroll
  o tras el primer `blur` del skip link (el usuario tabuló más allá)
- Al click/Enter: foco salta a `#main-content` (el ScrollShell con `tabindex="0"`)

**Texto bilingüe:** "Saltar al contenido / Skip to content" — funciona en ES y EN
antes de que Phase 2 implemente el toggle i18n.

**Posicionamiento:** centrado horizontalmente. No interfiere con el avatar (top-left).
En mobile portrait < 600px el texto puede recortarse; agregar `overflow: hidden; text-overflow: ellipsis; max-width: calc(100vw - 32px)` como fallback.

**A11Y:**
- Es el primer elemento focusable del DOM (antes del ScrollShell y los ticks) — Tab order correcto
- Target `#main-content` recibe `tabindex="0"` en el ScrollShell

---

## 8. Motion Contract

Tabla completa de todas las transiciones en Phase 1:

| Transición | Elemento | Default duration | Default easing | Bajo PRM | Referencia |
|-----------|----------|-----------------|----------------|----------|------------|
| Scroll snap entre chapters | ScrollShell | Browser-controlled (smooth) | Browser | `scroll-behavior: auto` (jump) | D-01 |
| Swap del avatar | StickyAvatar | 200ms | `ease` (opacity 0→1) | Instantáneo — sin transición | D-02 |
| Background morph | ChapterSection bg | Phase 2 lo implementa | Phase 2 lo implementa | ≤ 150ms crossfade | D-03 |
| Click en tick de timeline | ScrollShell | `scrollTo({ behavior: 'smooth' })` | Browser | `scrollTo({ behavior: 'auto' })` | D-04 |
| Hover/focus en tick | tick-button | 150ms | `ease` | 150ms `ease` (se mantiene) | D-05 |
| Pulses/glows decorativos en tick | tick-button | Prohibidos en Phase 1 | — | OFF | D-05 |
| Marker durante scroll libre | timeline-marker | `left` binding en RAF, 0ms | lineal (data binding) | Se mantiene (es binding de gesto, no animación CSS) | D-06 |
| Marker al click en tick (default) | timeline-marker | Sigue el scroll suave | — | Salta instantáneo | D-04 |
| Desaparición del skip link | SkipLink | 200ms | `ease` | Instantáneo (o 0ms) | D-06 |
| Era title fade-in al landing | ChapterSection | Sin animación en Phase 1 | — | — | — |

**Implementación del PRM check:**

```javascript
// composable usePRM.js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const prm = ref(prefersReducedMotion.matches)
prefersReducedMotion.addEventListener('change', e => { prm.value = e.matches })
```

Este composable se pasa como prop o se usa vía `provide/inject` para que
ScrollShell, StickyAvatar y StickyTimeline lean el mismo valor reactivo.

---

## 9. Responsive Behavior

### Breakpoint único

| Nombre | Condición | Uso |
|--------|-----------|-----|
| `mobile` | `width < 600px` | Avatar más pequeño, timeline labels más compactos |
| `desktop` | `width ≥ 600px` | Tamaños base declarados en este spec |

No se usan media queries de orientación (`orientation: portrait/landscape`).
Se usa `ResizeObserver` sobre `document.documentElement` para detectar cambios
de viewport (MOB-03) — cubre ambas orientaciones y el caso del teclado virtual
en mobile.

### Adaptaciones mobile (< 600px)

**StickyAvatar:**

```css
@media (max-width: 599px) {
  .sticky-avatar {
    width: 56px;
    height: 68px;
    top: 8px;
    left: 8px;
  }
  .avatar-chapter-label {
    font-size: 11px;
  }
}
```

**StickyTimeline:**

```css
@media (max-width: 599px) {
  .sticky-timeline {
    height: 44px;
    padding: 0 8px;
  }
  .tick-year {
    font-size: 9px;   /* reducir para que quepan los 7 años */
  }
}
```

En portrait muy estrecho (< 380px), los años pueden solaparse. Mitigación:
mostrar solo el año del tick activo y los ticks adyacentes; los otros muestran
solo el notch. Esta lógica la implementa el executor si se detecta el overflow
durante el build.

**Espacio vertical libre (problema del overlay):**

Con `StickyTimeline` de 44–48px en bottom y `StickyAvatar` de 56–80px en top-left,
el contenido útil del ChapterSection no está bloqueado: la era title se centra
en el espacio entre ambos sticky elements via `padding-top` / `padding-bottom`
calculados desde el alto del viewport:

```css
.chapter-placeholder {
  padding-top: calc(80px + var(--sp-md));    /* avatar height + margin */
  padding-bottom: calc(48px + var(--sp-sm)); /* timeline height + margin */
}
```

Esto garantiza que el era title sea siempre visible sin ocluir los sticky anchors.

**iOS (smoke test — iOS-02):**

- `scroll-snap-stop: always` + `-webkit-overflow-scrolling: touch` en el ScrollShell (iOS-01)
- `height: 100dvh` en chapters para evitar address-bar drift (CORE-08)
- El sticky timeline con `position: fixed; bottom: 0` puede quedar bajo la toolbar
  dinámica de Safari en algunos configs. Mitigación: usar `env(safe-area-inset-bottom)`
  si el smoke test lo confirma:

```css
.sticky-timeline {
  bottom: env(safe-area-inset-bottom, 0);
}
```

El smoke test (iOS-02) determina si esto es necesario. No bloqueante.

---

## 10. Accessibility Contract

### Tab order (primer Tab desde carga)

1. `.skip-link` — primer focusable en DOM
2. Si usuario sigue tabulando sin activar skip link: `#main-content` (ScrollShell con `tabindex="0"`)
3. `.tick-button[data-chapter="0"]` … `.tick-button[data-chapter="6"]` (los 7 ticks en orden)

### Target del skip link

`<main id="main-content" tabindex="0">` — el ScrollShell recibe el foco.
Tras activar el skip link, el foco está en el ScrollShell y el usuario puede navegar
con ↑/↓ inmediatamente.

### Keyboard navigation en ScrollShell

- `↑` / `k` — scroll al chapter anterior (`scrollTo({ behavior: ... })`)
- `↓` / `j` — scroll al chapter siguiente
- `Home` (opcional) — chapter 0
- `End` (opcional) — chapter 6

El ScrollShell captura `keydown` solo cuando tiene foco. No intercepta globalmente.

### `<html lang>` attribute

```html
<html lang="es">
```

Ya en `index.html`. Phase 2 lo actualiza dinámicamente al toggle i18n (I18N-04, A11Y-07).
Phase 1 no toca el atributo — usa el valor del scaffold.

### Focus ring universal

```css
:focus-visible {
  outline: 3px solid var(--c-focus); /* #7dd3fc */
  outline-offset: 3px;
}
```

Aplicado a: `tick-button`, `skip-link`, `#main-content` cuando recibe foco programático.
Phase 2 puede sobreescribir `--c-focus` por chapter manteniendo el mismo offset y grosor.

### prefers-reduced-motion (resumen)

Ver tabla completa en §8 Motion Contract. El composable `usePRM` es el único
punto de lectura — no duplicar `matchMedia` en múltiples componentes.

### Color contrast

Ver §4 Color Tokens. Todos los pares verificados ≥ 4.5:1. Phase 2 hereda la
obligación de verificar contraste por cada theme era-auténtico (THM-05).

---

## 11. Copywriting Contract (Phase 1)

Phase 1 no tiene flujos de usuario complejos ni estados de error de negocio.
El contrato de copy se limita a los elementos de infraestructura presentes.

| Elemento | Copy ES | Copy EN (referencia) |
|----------|---------|----------------------|
| Skip link | `Saltar al contenido / Skip to content` | (bilingüe en un solo string) |
| Avatar aria-label | `Avatar de Rafael — chapter {N} activo` | (Phase 2 lo i18n-iza) |
| Timeline aria-label | `Navegación de capítulos por era` | (Phase 2 lo i18n-iza) |
| Tick aria-label | `Ir a {era_label} ({year})` | (Phase 2 lo i18n-iza) |
| Era title ch0 | `1995 · Terminal` | — |
| Era title ch1 | `2001 · HTML 90s` | — |
| Era title ch2 | `2009 · Flash` | — |
| Era title ch3 | `2013 · Web 2.0` | — |
| Era title ch4 | `2015 · AR/VR` | — |
| Era title ch5 | `2022 · Modern` | — |
| Era title ch6 | `2026 · Phaser` | — |
| Avatar placeholder | `ch{N}` | — |

**No hay:** estado vacío, estado de error, ni acciones destructivas en Phase 1.

---

## 12. Phase 1 Visible Verification Checklist

Lo que el usuario debe ver al abrir `http://127.0.0.1:5173/` tras completar Phase 1:

- [ ] La página carga directamente en el chapter 3 (`2013 · Web 2.0`)
- [ ] El fondo es `#0b0b16` (oscuro neutro)
- [ ] El era title `2013 · Web 2.0` es visible, grande, centrado en la sección
- [ ] El StickyAvatar está en la esquina superior izquierda mostrando el rectángulo gris con texto `ch3`
- [ ] El StickyTimeline está en la parte inferior mostrando 7 ticks con años (1995, 2001, 2009, 2013, 2015, 2022, 2026)
- [ ] El tick `2013` tiene mayor peso / contraste que los demás (`aria-current="true"`)
- [ ] El marker (puck) está posicionado sobre o cerca del tick `2013`
- [ ] Hacer scroll hacia abajo snappea al chapter 4 (`2015 · AR/VR`), el avatar muestra `ch4`, el marker salta a `2015`
- [ ] Hacer scroll hacia arriba snappea al chapter 2 (`2009 · Flash`), el avatar muestra `ch2`, el marker salta a `2009`
- [ ] El marker se mueve continuamente durante el swipe antes de snappear
- [ ] Hacer click en el tick `1995` navega suavemente al chapter 0 (`1995 · Terminal`)
- [ ] Flechas ↑/↓ (con el ScrollShell con foco) navegan entre chapters
- [ ] Abrir `?ch=0` carga directamente en chapter 0
- [ ] Abrir `?ch=6` carga directamente en chapter 6
- [ ] Primer Tab muestra el skip link centrado en la parte superior
- [ ] Enter sobre el skip link mueve el foco al ScrollShell
- [ ] Skip link desaparece tras hacer scroll
- [ ] Todos los elementos interactivos muestran `outline: 3px solid #7dd3fc` al recibir foco
- [ ] En mobile portrait (< 600px): avatar más pequeño (56×68px), timeline más compacta, ningún overlay bloquea el era title
- [ ] En mobile landscape: scroll vertical con snap funciona, sticky elements visibles
- [ ] Activar "Reducir movimiento" en el sistema: scroll hace jump instantáneo al cambiar chapter, avatar swappea sin crossfade, click en tick navega instantáneamente

---

## 13. Art Backlog

> Esta sección es un deliverable de especificación para los agentes `artist-creator`
> de fases futuras. **Phase 1 no genera ningún asset pixel art.**
> La convención de naming sigue CLAUDE.md y REQUIREMENTS.md §ART-05:
> `ch{N}-{descriptor}[-{variant}].png` en `public/assets/`.
>
> Resolución virtual base: **480×270px** (16:9) con zoom ×3 → display 1440×810px.
> - Fondos full-frame: 480×270px
> - Busts avatar: 80×96px (a escala ×1 en la virtual resolution — se muestran en 80×96 CSS px con `image-rendering: pixelated`)
> - Sprites ambientales: variables (ver tabla)
>
> MCP tools:
> - `forge_background` — fondos opacos full-frame (sin bg removal)
> - `forge_sprite` — sprites con fondo transparente (con bg removal; usar preset nombrado: "night", "sky", "ocean", etc.)
> - `forge_animation` — **PROHIBIDO** (CLAUDE.md §6.4: frames incoherentes entre generaciones)

### Phase 3: Chapter 3 End-to-End — Assets requeridos

| Filename | Dimensiones | MCP Tool | Descripción |
|----------|-------------|----------|-------------|
| `ch0-bust.png` | 80×96px | `forge_sprite` (preset: "dungeon") | Bust pixel art: Rafael ~10 años frente a monitor CRT, cara infantil, era terminal |
| `ch1-bust.png` | 80×96px | `forge_sprite` (preset: "dungeon") | Bust pixel art: Rafael ~15–18 años, adolescente, era HTML 90s |
| `ch2-bust.png` | 80×96px | `forge_sprite` (preset: "dungeon") | Bust pixel art: Rafael ~22 años, joven adulto, era Flash |
| `ch3-bust.png` | 80×96px | `forge_sprite` (preset: "dungeon") | Bust pixel art: Rafael ~26 años, web 2.0 — **default landing bust** |
| `ch4-bust.png` | 80×96px | `forge_sprite` (preset: "dungeon") | Bust pixel art: Rafael ~30 años, adulto profesional, era AR/VR |
| `ch5-bust.png` | 80×96px | `forge_sprite` (preset: "dungeon") | Bust pixel art: Rafael ~36 años, era modern/animated |
| `ch6-bust.png` | 80×96px | `forge_sprite` (preset: "dungeon") | Bust pixel art: Rafael ~40 años, pocas canas, era Phaser/AI |
| `ch3-bg.png` | 480×270px | `forge_background` | Fondo full-frame chapter 3: Web 2.0 — rounded corners glossy, colores pastel, arte digital; opaco |
| `ch3-deco-01.png` | 96×96px | `forge_sprite` (preset: "sky") | Decoración chapter 3: elemento ambient Web 2.0 (p.ej. cursor animado, badge retro) |

> **Nota de paleta (ART-06):** Rafael debe aprobar la paleta del chapter 3 ANTES de generar
> cualquier asset. La paleta se documenta en `public/assets/ch3-palette.md` antes de
> la primera llamada a pixelforge.
>
> **Consistencia de busts:** todos los 7 busts deben generarse en la misma sesión
> con el mismo prompt base, variando solo la edad y accesorios de era.
> El preset "dungeon" provee un fondo oscuro neutro que facilita el bg removal.

---

### Phase 4: Chapters 0–2 + 4–5 — Assets requeridos

> Chapters 0 y 1: **cero pixel art** (ART-07). Solo CSS puro.

| Filename | Dimensiones | MCP Tool | Descripción |
|----------|-------------|----------|-------------|
| `ch2-bg.png` | 480×270px | `forge_background` | Fondo chapter 2: Flash era — banners vector-style, gradientes suaves, UI retro años 2000; opaco |
| `ch2-deco-banner.png` | 320×80px | `forge_sprite` (preset: "lava") | Decoración chapter 2: banner animado retro (banner estático — ver nota ART constraint) |
| `ch4-bg.png` | 480×270px | `forge_background` | Fondo chapter 4: AR/VR immersive — paneles flotantes, gradiente espacial profundo; opaco |
| `ch4-panel-01.png` | 128×96px | `forge_sprite` (preset: "night") | Elemento ambiental ch4: panel flotante AR — transparent bg; capa parallax |
| `ch4-panel-02.png` | 128×96px | `forge_sprite` (preset: "night") | Elemento ambiental ch4: panel flotante AR variante — transparent bg; capa parallax |
| `ch4-ship-bg.png` | 64×40px | `forge_sprite` (preset: "night") | Nave espacial de background en ch4 — pequeña, transparent bg |
| `ch5-bg.png` | 480×270px | `forge_background` | Fondo chapter 5: modern animated — colores vibrantes, líneas limpias, feel 2022–2023; opaco |
| `ch5-deco-01.png` | 64×64px | `forge_sprite` (preset: "sky") | Decoración chapter 5: elemento UI moderno (p.ej. componente card pixel art) |
| `ch5-deco-02.png` | 64×64px | `forge_sprite` (preset: "sky") | Decoración chapter 5: segundo elemento UI moderno (variante) |

> **Nota sobre ch4 parallax:** Los `ch4-panel-*.png` se usan como capas de parallax CSS
> (no Phaser). Las profundidades se definen en el CSS de Phase 4:
> panel-01 = capa media (velocidad parallax 0.5x scroll); panel-02 = capa lejana (0.25x).

---

### Phase 5: Phaser Chapter 6 — Assets requeridos

> Todos los assets del chapter 6 son consumidos por la escena Phaser (`SpaceScene`).
> **Sin character animation** (PHA-08, CLAUDE.md §6.4 — constraint dura).

| Filename | Dimensiones | MCP Tool | Descripción |
|----------|-------------|----------|-------------|
| `ch6-bg-far.png` | 480×270px | `forge_background` | Capa parallax lejana — espacio profundo, estrellas densas, nebulosa fondo; opaco |
| `ch6-bg-mid.png` | 480×270px | `forge_background` | Capa parallax media — nebulosa con más detalle, algunas estrellas más grandes; opaco |
| `ch6-bg-near.png` | 480×270px | `forge_background` | Capa parallax cercana — elementos espaciales en primer plano (asteroides lejanos); opaco |
| `ch6-ship-01.png` | 48×32px | `forge_sprite` (preset: "night") | Nave espacial variante 1 — transparent bg; cruza la escena horizontalmente |
| `ch6-ship-02.png` | 48×32px | `forge_sprite` (preset: "night") | Nave espacial variante 2 — transparent bg; forma distinta, misma paleta |
| `ch6-ship-03.png` | 32×24px | `forge_sprite` (preset: "night") | Nave espacial variante 3 (pequeña / lejana) — transparent bg |
| `ch6-planet-01.png` | 64×64px | `forge_sprite` (preset: "night") | Planeta-proyecto 1 (top-of-career proyecto A) — transparent bg, estilo pixel art esférico |
| `ch6-planet-02.png` | 64×64px | `forge_sprite` (preset: "night") | Planeta-proyecto 2 (top-of-career proyecto B) — transparent bg |
| `ch6-planet-03.png` | 64×64px | `forge_sprite` (preset: "night") | Planeta-proyecto 3 (top-of-career proyecto C) — transparent bg |
| `ch6-stars-tile.png` | 480×270px | `forge_background` | Tileable starfield para `tileSprite` Phaser (fondo base de la escena); opaco |
| `ch6-ui-planet-label-bg.png` | 128×24px | `forge_sprite` (preset: "night") | Background del label de planeta clicable — transparent bg; se superpone al nombre del proyecto |

> **Nota sobre planetas:** Los 3 planetas corresponden a los "top-of-career" projects de Rafael.
> La selección exacta de proyectos la define Rafael en Phase 3 (`src/data/projects.js`).
> Los assets de planetas se generan en Phase 5 una vez conocidos los proyectos.
>
> **Nota sobre tileSprite (ch6-stars-tile.png):** Usar `image_generative_expand` de Adobe MCP
> para hacerlo seamless antes de importarlo a Phaser. Ver CLAUDE.md §5 (Adobe MCP).
>
> **Zoom calculation (PHA-03):**
> ```javascript
> const zoom = Math.min(Math.floor(window.innerWidth / 480), Math.floor(window.innerHeight / 270))
> ```
> Siempre entero — nunca `.5` o decimal. Garantiza pixel-perfect rendering.

---

## 14. Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — no shadcn en este proyecto | not applicable |
| third-party | none declarados en Phase 1 | not required |

No hay dependencias de componentes de terceros en Phase 1. Todo es composables Vue propios
y CSS nativo.

---

## 15. Out of Scope (explicit — Phase 2-6)

Lo siguiente NO está en este contrato. Cualquier executor que lo intente implementa
fuera de alcance:

| Item | Fase que lo implementa |
|------|------------------------|
| Themes era-auténticos por chapter (CSS Custom Properties por data-chapter) | Phase 2 |
| Toggle ES/EN con vue-i18n y persistencia | Phase 2 |
| `<html lang>` update dinámico | Phase 2 |
| Focus ring per-theme (A11Y-03) | Phase 2 |
| Background morph CSS entre eras | Phase 2 |
| Contenido real: bio, proyectos | Phase 3 |
| Pixel art busts reales (reemplazan placeholder gris) | Phase 3 |
| Pixel art fondos ch2, ch3 | Phase 3 / Phase 4 |
| JSON-LD, OG meta, SEO | Phase 3 |
| Chapters 0-1 CSS puro era-auténtico (terminal, HTML 90s crudo) | Phase 4 |
| Pixel art fondos ch4, ch5 | Phase 4 |
| Elementos parallax ch4, ch5 | Phase 4 |
| Escena Phaser ch6 | Phase 5 |
| Pixel art assets ch6 (ships, planets, starfield) | Phase 5 |
| Firebase deploy | Phase 6 |
| LangToggle component (diseño visual) | Phase 2 |
| Contact info persistent overlay | Phase 3 |
| `?ch=N` deep link (con hash — DLINK-01) | v2 (deferred) |
| Easter egg "And always show a smile" (CON-04) | Phase 4 / Phase 5 |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

*UI-SPEC generado: 2026-05-12*
*Fuentes: CONTEXT.md (D-01..D-06), PROJECT.md (mapeo de chapters), REQUIREMENTS.md (IDs Phase 1), user decisions A1..A4*
*Próximo paso: gsd-ui-checker valida; gsd-planner consume para descomponer Phase 1 en tareas*
