# Phase 2: Theme System + i18n - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Construir el **motor visual y lingüístico** del portafolio antes de cualquier contenido real. Phase 2 entrega: (a) arquitectura CSS Custom Properties + `@layer` cascade (reset/themes/components/utilities) + selector `[data-chapter="N"]` por section como vehículo de theme aplicación; (b) los **temas COMPLETOS de ch0 (terminal verde sobre negro, monoespaciado) y ch1 (HTML 90s crudo: tablas, marquee, Comic-Sans-equivalent libre, fondo estrellado)** porque son CSS puro sin pixel art (ART-07); (c) **stubs era-tinted para ch2-6** con bg + fg + accent + border + font hint sin pixel art aún (Phase 3/4 enchufan paletas finales + assets); (d) **motor background morph** con 2 capas apiladas fixed con opacity crossfade driven by `activeChapter`; (e) **motor i18n** con vue-i18n v11 (`legacy: false`), `LangToggle` top-right standalone, persist en `localStorage["portfolio.locale"]`, `<html lang>` reactivo, `fallbackLocale: 'en'`, auto-detect vía `navigator.language` en primer visit; (f) strings i18nificados: UI chrome (SkipLink ya bilingue, LangToggle aria-labels, timeline aria-labels) **+ los 7 chapter titles bilingues** que muestra la timeline. Self-hosted fonts en `/public/fonts/`: 7 distintas (una por chapter) — ch0 mono terminal style, ch1 Comic Neue, ch2 Verdana/Trebuchet vibe, ch3 Lobster/Georgia Web 2.0 glossy, ch4 futuristic geometric, ch5 Inter Variable, ch6 pixel font UI.

**Phase 2 NO incluye:** bio core ni proyectos por chapter (CON-01..06 → Phase 3 + CONTENT-CHECKLIST en producción por Rafael en paralelo), pixel art de fondos (ART-02/03/04 → Phase 3 ch3 + Phase 4 ch2/4/5), avatar busts (ART-01 → Phase 3), escena Phaser (PHA-* → Phase 5), JSON-LD/OG/SEO (SEO-01..04 → Phase 3), deploy (DEPLOY-* → Phase 6). El theme de **ch3 NO se finaliza en Phase 2** — su stub era-tinted basta hasta que Phase 3 ejecute con paleta + pixel art aprobados.

</domain>

<decisions>
## Implementation Decisions

### Theme Delivery Scope

- **D2-01:** Phase 2 entrega: **motor + ch0/ch1 themes completos + stubs era-tinted ch2-6**. ch0 y ch1 son CSS puro (sin pixel art per ART-07) → se finalizan visualmente acá. ch2-6 reciben stubs (bg + fg + accent + border + font hint) y Phase 3/4 los completan cuando llegue el contenido + arte. Decisión driven by: (a) eficiencia — ch0/ch1 dependen del motor que Phase 2 owns; (b) handoff limpio — Phase 3/4 enchufan arte sin re-inventar arquitectura.

- **D2-02:** Stubs era-tinted para ch2-6 entregan **5 custom props por chapter + font hint**: `--c-bg`, `--c-fg`, `--c-accent`, `--c-border`, `--c-focus` (override del neutral si era lo requiere para contraste); y `font-family` hint era-distintivo con fallback system-safe (ej. ch2 'Verdana, sans-serif'; ch3 'Georgia, serif'; ch5 'system-ui, sans-serif'). NO bordes/buttons/UI styles finales — eso es Phase 3/4. ~5-7 LOC CSS por chapter stub.

- **D2-03:** **Contrast tradeoffs era-auténticos (THM-05, A11Y-04) documentados inline en `chapter-themes.css`** al lado de cada `[data-chapter="N"]` block. Formato verbatim: `/* contrast(fg, bg) = X.X:1 — chapter N (era) accepts Y:1 here as era-authentic tradeoff per THM-05 */`. Vive con el código, mantenible al cambiar paletas, fuente de verdad para auditoría externa. NO documento canonical `CONTRAST-MATRIX.md` separado.

### Background Morph Architecture

- **D2-04:** **2 capas bg fijas apiladas con opacity crossfade** — Decisión arquitectural locked. `<div class="bg-layer bg-layer-a">` + `<div class="bg-layer bg-layer-b">` con `position: fixed; inset: 0; z-index: -1` (detrás de las sections). Cada capa lee sus propias CSS Custom Props vía un `data-chapter` propio (dinámico, driven by orchestrator). Al cambiar `activeChapter`, la capa "outgoing" fade-out (opacity 1→0) y la "incoming" fade-in (0→1). Default transition: ~200-300ms (planner decide exacto siguiendo patrón Plan 03 Phase 1 avatar = 200ms total). Bajo PRM (D-03 cross-cutting Phase 1): ≤150ms. Future-proof: cuando llegue `--bg-image: url(...)` de Phase 3/4, las dos capas la swappean sin cambiar arquitectura.

- **D2-05:** **Cross-cutting heritage de Phase 1 (D-03):** background morph entre eras crossfade ≤150ms bajo PRM. Default sin PRM más largo (200-300ms — planner decide; recomendación: alinear con avatar Phase 1 timing para que ambos morfeen al unísono). Crossfade es **discrete-on-activeChapter-change**, NO interpolated-continuous-on-scroll-progress. Implementación: JS-orchestrated composable `useBackgroundMorph(activeChapter, prm)` que devuelve `{ incomingChapter, outgoingChapter, transitionPhase }` siguiendo el patrón del state machine del avatar (Phase 1 Plan 03).

### Theme Bleed Prevention (THM-04)

- **D2-06:** **Cada `<section>` chapter lleva su propio `[data-chapter="N"]` HARDCODED**. NO se aplica el attribute al wrapper global ni se manipula dinámicamente. Los CSS Custom Props del theme aplican local a la section y a sus children. Durante smooth-scroll entre chapters, la section saliente mantiene su theme hasta SALIR del viewport completamente — no hay theme bleed. El background morph global (D2-04) es independiente y orquestado por activeChapter en el wrapper de las 2 capas. Heurística: "vives en una era hasta que llegas a la siguiente". Cero bleed durante el scroll-snap transition.

### Fonts Strategy

- **D2-07:** **Self-hosted fonts en `/public/fonts/`** con `@font-face` declarations en CSS. .woff2 subsetted (Latin Extended + ES/EN chars necesarios). Zero network dependency, offline-safe, privacy-friendly, Firebase Hosting cache headers controlables. NO Google Fonts CDN.

- **D2-08:** **7 font families distintas, una por chapter** — máxima diferenciación era-auténtica. Propuestas iniciales (researcher/planner valida y lockea exactos):
  - ch0: VT323 (Google Fonts, libre — evoca CRT terminal) o Press Start 2P
  - ch1: Comic Neue (libre, replacement moderno de Comic Sans MS propietary)
  - ch2: Verdana o Trebuchet MS (system-safe; planner decide si self-host por consistencia iOS donde no están)
  - ch3: Lobster (cursive Web 2.0 emblematic) + Georgia fallback serif
  - ch4: Eurostile / Bank Gothic / Audiowide (display futuristic geometric)
  - ch5: Inter Variable (modern, weights/styles flexibles)
  - ch6: PixelOperator o Press Start 2P (pixel font UI labels)

  Bundle target: ~150-300KB subsetted .woff2 total. `font-display: swap` para FOUT controlado con system-safe fallback en cada `@font-face`.

### i18n Architecture

- **D2-09:** **Auto-detect locale al primer visit vía `navigator.language`**. Si `navigator.language` empieza con `'es'` (es-EC, es-ES, es-MX, etc) → ES default; cualquier otro → EN default. Después del primer toggle manual del visitor, persiste en `localStorage["portfolio.locale"]`. Audiencia primaria (recruiters NA/EU/Canadá) cae en EN automáticamente; audiencia secundaria (LatAm) cae en ES automáticamente — friction zero para ambas. Fallback final: si `navigator.language` no está disponible (edge case) → ES.

- **D2-10:** **LangToggle top-right standalone fixed**: `<button class="lang-toggle">` con `position: fixed; top: var(--sp-md); right: var(--sp-md); z-index: 40`. Simétrico al avatar top-left. Visible siempre en todos los chapters. Estilo pill "ES | EN" con el inactivo en color muted. Mobile portrait <600px: shrinks a icon-only (🌐 o similar) + tooltip. Aria-label bilingue ("Cambiar idioma a inglés / Switch language to Spanish"). NO integrado a la timeline sticky bottom (ya densa con marker + año + chapter label + 7 ticks). NO en mini-HUD compuesto (overkill para v1).

- **D2-11:** **Phase 2 i18nifica: UI chrome + los 7 chapter titles bilingues**. Specifically:
  - SkipLink ("Saltar al contenido / Skip to content" — ya bilingue verbatim en Plan 06 Phase 1, ahora pasa por vue-i18n)
  - LangToggle aria-labels (bilingue para WCAG)
  - StickyTimeline aria-labels (ej. "Chapter 1, year 2001 / Capítulo 1, año 2001" — usando interpolación vue-i18n con `t('timeline.tick', { chapter: N, year: Y })`)
  - StickyAvatar alt-text per chapter (placeholder hasta Phase 3 con descripción era-accurate; A11Y-06 cubre el contenido final)
  - **Los 7 chapter titles** (ej. ch0 "Pre-carrera: niñez digital / Pre-career: digital childhood") porque la timeline sticky bottom muestra `año + label del chapter activo` según CORE-11
  - NO bio ni proyectos (Phase 3 + CONTENT-CHECKLIST)

### Claude's Discretion (gray areas no discutidas — research/planning resuelve con justificación documentada)

- **Open-Q2-A — Where to mount `data-chapter` attribute:** Phase 1 ScrollShell.vue already exists. ¿`<section>` literals con `data-chapter="N"` hardcoded directamente en ScrollShell.vue template, o un v-for sobre `chapters.value` array que renderea cada section con su data-chapter? V-for permite array-driven configuration (alineado con CON-05 `src/data/chapters.js` que Phase 3 introduce); literals son simples pero menos flexibles. Planner decide siguiendo el patrón de ScrollShell.vue actual.

- **Open-Q2-B — Theme transition duration default (sin PRM):** entre 200ms (alinea con avatar Phase 1) y 300ms (más fluído, hace sentir el morph). 400ms+ jarringly slow. Recomendación: 200ms (avatar sync). Planner valida A/B visualmente en dev y lockea.

- **Open-Q2-C — i18n keys naming convention:** ¿Jerárquico tipo `chapters.0.title`, `timeline.tick.label`, `langToggle.aria` (Recommended por escalability)? ¿O flat `ch0_title`, `tick_label_es`? Convención industry-standard para vue-i18n es jerárquico. Planner lockea + documenta en RESEARCH.md.

- **Open-Q2-D — Fallback string behavior bajo gaps de content authoring (I18N-06):** `fallbackLocale: 'en'` ya está locked, pero ¿qué pasa visualmente si una key falta en EN también (gap durante content authoring de Phase 3)? Opciones: render key string raw, render visible marker `[missing: chapters.3.bio]`, render placeholder genérico. Recommended: visible marker en dev mode (`import.meta.env.DEV`), silent fallback a key raw en prod. Planner decide.

- **Open-Q2-E — Font subsetting strategy:** ¿Latin Basic solo o Latin Extended (incluye caracteres acentuados ES como ñ, á, é, í, ó, ú, ü, ¿, ¡)? Mandatory Latin Extended para ES. Planner lockea pipeline (glyphhanger / fonttools).

- **Open-Q2-F — Variable fonts donde aplica:** Inter Variable es variable font (un solo archivo cubre weights 100-900). ¿Other chapters get variable variants donde existen (ej. JetBrains Mono Variable para ch0 si decidimos JBM en vez de VT323)? Recommended sí, reduce bundle.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 2 — fuente de verdad
- `.planning/PROJECT.md` §"Mapeo de chapters" — 7 chapters con eras + edades + audiencia primaria/secundaria; tono cálido-juguetón; **default landing en ch3** (Phase 3 lo polishe completo; Phase 2 stub era-tinted basta)
- `.planning/REQUIREMENTS.md` §THEME / §I18N / §A11Y — los 14 IDs de Phase 2 (THM-01..05, I18N-01..06, A11Y-03, A11Y-04, A11Y-07) y la coverage section. Constraints LOCKED: vue-i18n v11 `legacy: false`, CSS Custom Props + `[data-chapter="N"]`, `@layer` order reset/themes/components/utilities, `<html lang>` reactive, `fallbackLocale: 'en'`, persist `localStorage["portfolio.locale"]`
- `.planning/ROADMAP.md` §"Phase 2: Theme System + i18n" — goal, success criteria (5 items), requirements list, dependency Phase 1
- `.planning/STATE.md` — current position + decisions log + parallel workflow context (`portfolio-parallel-workflow` memory)
- `.planning/REQUIREMENTS.md` §OUT OF SCOPE — anti-Vue-Router, anti-Pinia, anti dark/light toggle, anti Lenis/Locomotive, anti bento grids, anti glassmorphism, anti custom cursors, anti loading screen

### Cross-cutting (heredado de Phase 1 — APLICA EN Phase 2)
- `.planning/phases/01-scroll-shell-sticky-anchors/01-CONTEXT.md` §"Reduced-Motion Policy" — D-01..D-06 PRM heurística. **CRÍTICO: D-03 dicta que background morph entre eras es crossfade ≤150ms bajo PRM**, default más larga sin PRM. Phase 2 implementa esta política via composable `useBackgroundMorph(activeChapter, prm)` con `transition` CSS que tiene branch `@media (prefers-reduced-motion: reduce)`. Phase 2 también puede sobreescribir `--c-focus` por theme manteniendo grosor 3px + offset 3px del focus ring universal (D-05 cross-cutting). El avatar swap (D-02) sigue siendo instantáneo bajo PRM — distinto del bg morph.
- `.planning/phases/01-scroll-shell-sticky-anchors/01-SUMMARY.md` (a leer si planner necesita ver el final shape de Phase 1) y `01-PLAN-toolchain-setup.md` para package.json baseline; `01-PLAN-walking-skeleton.md` para layout root de App.vue + ScrollShell + StickyAvatar + StickyTimeline + SkipLink ya en place

### Project / OS / Stack
- `CLAUDE.md` — comunicación en español, Windows 11 / PowerShell 5.1, stack Vue 3.5+ + Vite 5 + Phaser 3.86, `image-rendering: pixelated` global en index.html, naming `ch{N}-{descriptor}.png` en `public/assets/`, sistema multi-agente activo
- Memoria GSD: `[[portfolio-parallel-workflow]]` (Rafael produce contenido P3 en paralelo a impl P2), `[[rafael-no-ios-device]]` (smoke tests iOS bloqueados — Phase 2 no tiene gates iOS críticos pero la consciencia importa), `[[portfolio-design-decisions]]` (bilingüe ES/EN, retro 16-bit, narrativa convergencia dev/QA/líder + AI)

### Code existente post-Phase 1
- `src/App.vue` — current root: `:root` declara paleta neutra Phase 1 (`--c-bg #0b0b16`, `--c-fg #e7e7f0`, `--c-focus #7dd3fc`, etc) que Phase 2 OVERRIDE por `[data-chapter="N"]`; comentario explícito en línea 73-75 anticipa el override. `useScrollState(shellRef)` + `useResizeObserver(documentElement)` + `usePRM()` ya provistos
- `src/components/ScrollShell.vue` — owner del DOM de las 7 sections; Phase 2 mete `data-chapter="N"` hardcoded en cada section
- `src/components/StickyTimeline.vue` — owner de marker + año + label del chapter activo; Phase 2 inyecta `useI18n()` para los chapter titles y aria-labels
- `src/composables/usePRM.js` — single source of truth para `prefers-reduced-motion`; el composable `useBackgroundMorph` lo consume vía `inject('prm')`
- `index.html` — `<html lang="es">` hardcoded; Phase 2 lo hace reactive via watch en App.vue (set `document.documentElement.lang = locale.value`)
- `package.json` — `vue@^3.5.0`, `@vueuse/core@^14.3.0` ya disponibles (Vue 3.5+ blocker resuelto en Plan 01 Phase 1). Phase 2 añade: `vue-i18n@^11.x` (mandatory I18N-01)

### Research project-level (consultar marcado SUPERSEDED post-pivote 2026-05-12)
- `.planning/research/STACK.md` — vue-i18n v11 recomendado, ratificado por I18N-01
- `.planning/research/FEATURES.md` — table-stakes a11y/i18n/JSON-LD vigentes (JSON-LD es Phase 3 scope)
- `.planning/research/PITFALLS.md` — layout shift de i18n bajo strings ES más largos (~20-30% que EN, I18N-05) vigente

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`:root` palette in App.vue** (líneas 76-98) — paleta neutra Phase 1 (`--c-bg`, `--c-fg`, `--c-surface`, `--c-border`, `--c-track`, `--c-marker`, `--c-focus`, `--c-muted`, `--c-tick-hover` + spacing scale `--sp-*`). Phase 2 NO la elimina — la mantiene como **fallback default** (`:root`) y la sobreescribe per chapter via `[data-chapter="N"]` selector. Lo neutral sigue siendo el "Phase 1 placeholder theme" que aparece si por algún motivo un section no tiene data-chapter (defensive).
- **Focus ring universal `:focus-visible`** en App.vue (líneas 117-120) — `outline: 3px solid var(--c-focus); outline-offset: 3px`. Phase 2 puede sobreescribir `--c-focus` por chapter manteniendo grosor/offset (alineado con A11Y-03 "focus visible que varía por chapter sin perder contraste").
- **PRM defensive CSS** en App.vue (líneas 100-109) — `.scroll-shell { scroll-behavior: smooth }` + `@media (prefers-reduced-motion: reduce) { .scroll-shell { scroll-behavior: auto } }`. Patrón aplicable a otras transiciones cross-cutting de Phase 2.
- **`usePRM()` composable** ya provee `{ motion, prefersReduced }`. Phase 2 inyecta `inject('prm')` en cualquier componente que necesite branch PRM (ej. `useBackgroundMorph`).
- **`useResizeObserver(document.documentElement)` cableado** en App.vue (líneas 46-54) — viewportWidth/viewportHeight refs no consumidos en Phase 1 pero Phase 5 los promoverá. Phase 2 puede ignorarlos.

### Established Patterns
- **Composable + provide/inject** para state cross-componente (Phase 1 patrón W2/W3): `provide('scrollState', useScrollState(...))`, `provide('prm', usePRM())`. Phase 2 sigue el mismo: `provide('bgMorph', useBackgroundMorph(...))`, `provide('i18n', ...)` o uso directo de `useI18n()` de vue-i18n en cada componente.
- **CSS Custom Props como vehículo de tematización** ya in place (paleta `--c-*` en `:root`). Phase 2 escala el patrón a 7 themes vía `[data-chapter="N"]`.
- **`<style>` NO scoped a nivel de App.vue** cuando se necesita aplicar a componentes hijos (patrón establecido en Plan 06 para `:focus-visible`). Phase 2 declara los themes en un `chapter-themes.css` separado importado en `main.js` (NO en `<style>` scoped por design — los selectors `[data-chapter="N"]` necesitan alcance global).
- **Crossfade state machine pattern** establecido en Plan 03 Phase 1 (avatar swap, 200ms total via CSS opacity transition + JS setTimeout). Phase 2 `useBackgroundMorph` reusa el patrón.
- **`provide` typed via TS** NO aplica — proyecto sin TypeScript.
- **No Vue Router, no Pinia, no Pinia plugins** — composables + provide/inject + localStorage es la regla.

### Integration Points
- **App.vue template root** — Phase 2 inserta `<BackgroundLayers />` componente (las 2 capas apiladas) como primer hijo del template (z-index -1 detrás de todo). Orden DOM resultante: BackgroundLayers → SkipLink → StickyAvatar → ScrollShell → StickyTimeline → LangToggle.
- **`<html lang="es">` en index.html** — Phase 2 instala un watcher en App.vue setup: `watch(locale, l => document.documentElement.lang = l, { immediate: true })`. Único punto de mutación del attribute.
- **`main.js`** — Phase 2 cambia de `createApp(App).mount('#app')` a `createApp(App).use(i18n).mount('#app')`. Importa `chapter-themes.css` antes de mount.
- **`public/fonts/`** — Phase 2 crea estructura y popula con .woff2 subsetted. Naming: `vt323.woff2`, `comic-neue.woff2`, `lobster.woff2`, etc.
- **localStorage key `portfolio.locale`** — único namespace persistente que Phase 2 escribe. Read en App.vue setup para hidratación de locale inicial (con fallback a navigator.language).
- **ScrollShell.vue** — Phase 2 cambia el template para que cada section tenga `:data-chapter="N"` (o hardcoded "0", "1", ...) y `id="chapter-N"`. Phase 2 también inyecta el chapter title bilingüe (vía `useI18n()` `t('chapters.${N}.title')`) como heading visible.

</code_context>

<specifics>
## Specific Ideas

- **Cross-era morph coordinado pero independiente:** el background morfea via `useBackgroundMorph(activeChapter, prm)` con duration ~200-300ms; el avatar swap (Phase 1 Plan 03) usa 200ms total. Recomendación inicial: **alinear bg morph a 200ms para que avatar y bg morfeen al unísono** — Rafael perceptúa "el cambio de era" como un solo evento visual coherente. Planner valida A/B y puede ajustar a 300ms si "se siente abrupto".
- **Auto-detect via navigator.language NO es perfecto** — algunos browsers en Chile/Argentina reportan `en-US` aunque el usuario hable ES. Mitigación: el LangToggle es muy visible top-right; un mis-detect se corrige con un click + localStorage persist. Aceptable trade-off.
- **Lobster (ch3 Web 2.0):** Lobster es el font emblemático de Web 2.0 era (Twitter logo 2009-2012, marketing sites mid-2010s). Pareja sugerida: Lobster para headings + Georgia para body. Phase 3 finaliza pero Phase 2 ya entrega el hint.
- **ch1 Comic Neue:** replacement libre de Comic Sans MS (que es propietary de Microsoft). Visualmente casi idéntico. `Comic Neue, "Comic Sans MS", cursive` da fallback amplio.
- **ch0 terminal verde:** `#00FF00` sobre `#000000` da contrast 15.3:1 — pasa WCAG AAA. NO requiere documentar tradeoff en CSS (es naturalmente OK).
- **ch1 magenta/Comic on starry bg:** ESTE sí va a romper 4.5:1 según paleta exacta. Comentario inline obligatorio: `/* contrast(fg, bg) = 3.2:1 — ch1 (HTML 90s crudo) accepts 3.2:1 here as era-authentic tradeoff per THM-05; era-accurate visual identity (Comic Sans + magenta on starry bg) demands this. Compensated by larger font-size 18px+ minimum which improves perceived legibility. */`. Phase 2 lockea el copy específico.
- **El crossfade es entre 2 capas siempre — incluso al primer load (incoming desde transparente).** No hay caso especial "primer render" — la capa "outgoing" arranca con opacity 0 y data-chapter = null o "0", la "incoming" arranca con opacity 1 y data-chapter = initialChapter (3 por default landing CORE-05). En subsequent swaps, las capas swap roles.

</specifics>

<deferred>
## Deferred Ideas

- **Theme transition coordinada con scroll progress (interpolación continua):** NO en Phase 2. La interpolación continua entre dos chapter colors mid-scroll suena visualmente fluido pero es complejo (lerp RGBA, fonts no interpolables, perf con RAF), no decide el visitor's perception meaningfully. Si surgiera demand en v2, vivir como POL-05 en `REQUIREMENTS.md v2`.
- **3er idioma (PT-BR o FR):** REQUIREMENTS v2 §I18N3-01 ya tracked. Phase 2 architecture es scalable (vue-i18n fácil añadir un locale; `chapters.N.title` keys ya jerárquicos), pero NO se implementa.
- **JSON-LD Person schema multilingüe (SEO-02):** Phase 3 owns. Phase 2 i18n motor permite que Phase 3 lo agregue trivialmente — `<script type="application/ld+json">` con el JSON renderizado per-locale.
- **Era-authentic UI components (botones Web 2.0 glossy, Flash banners, AR/VR floating panels):** NO en Phase 2 stubs. Phase 3/4 ejecutan UI components era-auténticos cuando llegue contenido + arte. Phase 2 deja `--c-accent` ready para que Phase 3/4 lo consuma.
- **Theme switcher visible (dark/light por encima del chapter theme):** OUT OF SCOPE per PROJECT.md / REQUIREMENTS.md — explícitamente rejected ("Theme cambia por chapter — añadir otro eje de variación dobla la combinatoria de testing por nada").
- **Static `prefers-color-scheme` detection:** No relevante porque chapter themes overrride cualquier preferencia OS-level del visitor. NO mencionar en CSS.
- **CSS-only @container queries para responsive theme variations:** posible en v2 si Phase 4 quiere themes responsivos (ej. ch4 AR/VR layout colapsa diferente en mobile portrait vs landscape). Phase 2 NO usa container queries.
- **i18n keys para alt-text de avatar busts (A11Y-06):** Phase 4 owns (porque ch0-1 + 2/4/5 alt-texts son specific al era + edad de Rafael — A11Y-06 está mapeado a Phase 4). Phase 3 owns ch3 + 6 alt-texts. Phase 2 sets up el namespace `avatar.busts.N.alt` listo para consumirse.

</deferred>

---

*Phase: 02-theme-system-i18n*
*Context gathered: 2026-05-12*
