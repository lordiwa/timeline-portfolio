# Phase 5: Phaser Chapter 6 - Research

**Researched:** 2026-05-14
**Domain:** Phaser 3.86 + Vue 3.5 + Vite 5 lazy integration, scroll-snap-friendly canvas, pixel-art synthwave scene, locale bridge, lifecycle without leaks
**Confidence:** HIGH (lifecycle / destroy / lazy / scale) · MEDIUM (asset prompts synthwave) · LOW (chapter-overlap bug root cause — heredado pendiente Phase 4)

---

## RESEARCH COMPLETE

## Summary

Phase 5 mete Phaser dentro de un shell Vue 3 + scroll-snap **ya construido**. El reto técnico no es Phaser per se — es la **convivencia limpia**: lazy-load, destroy sin leaks, recrear en re-entry, no atrapar input del scroll-snap del documento, y mantener pixel-art crispness en HiDPI mientras un canvas full-bleed convive con HTML BackgroundLayers + StickyAvatar + StickyTimeline + LangToggle + ContactHUD que ya están z-stacked sobre él.

Los 11 locked decisions D5-01..D5-11 dejan la mayoría de gray-areas resueltas. La research se concentra en (1) **rellenar el "cómo" técnico** de los patterns mandatados (shallowRef, destroy(true,false), import.meta.hot.dispose, lazy import, Scale.NONE + integer zoom, locale bridge, project click bridge); (2) **decidir tradeoffs no-discutidos** (parallax count, tooltip styling in-Phaser, focus trap library, bridge event naming) que D5 entrega a la discreción del planner; y (3) **levantar bloqueos antes de que se conviertan en bugs** (chapter-overlap heredado de Phase 4, package.json pinning vs Phaser 4.x publicado, asset size budget Phase 6 blocker).

**Primary recommendation:** Adoptar el shape del **template oficial Phaser-Vue** ([`phaserjs/template-vue`](https://github.com/phaserjs/template-vue)) pero con **3 endurecimientos** que el template oficial no aplica (ese template asume "siempre montado", Phase 5 monta/desmonta on demand):

1. `shallowRef(Phaser.Game)` (PHA-01) en lugar de `ref()` — Vue NO puede deep-watch el game tree (rompe game loop).
2. `destroy(true, false)` (PHA-02) — segundo arg explícito `noReturn=false` para que los core plugins **permanezcan** registrados y la re-instanciación en re-entry sea limpia.
3. `import.meta.hot?.dispose(() => game.value?.destroy(true, false))` (PHA-02) — el template oficial no incluye esto y en dev acumula instancias en cada HMR.

**Versión locked:** Phaser **3.86.0** (npm view confirma 3.86 → 3.90+ existen en la rama 3.x; el `^3.86.0` del package.json permite minors 3.x pero NO el major Phaser 4.x publicado 2026-04-30). El upgrade a Phaser 4 es out-of-scope Phase 5 — discusión separada si surge demand v2.

**Hallazgos que afectan el plan:**

- El template oficial Phaser+Vue+Vite usa `ref()` + `destroy(true)` (un solo arg). PHA-01/02 son más estrictos y técnicamente correctos para el caso de uso mount/unmount repetitivo. **Justificación documentada en Pattern 1.**
- El EventBus oficial = `new Phaser.Events.EventEmitter()` exportado como singleton. **Phase 5 puede reusar este patrón** O `game.events` directamente (segundo es preferido — un canal menos, ya está dentro del game lifecycle).
- jsdom NO renderea WebGL ni Canvas 2D real. Tests architectural Phase 5 verifican **forma** del lifecycle (calls a destroy, watchers, lazy import, bridge event names) NO el rendering. Smoke visual queda como W5 manual checklist (heredado patrón D4-11).
- Chapter-overlap bug Phase 4 deferred — Phase 5 con canvas full-bleed corre **mismo riesgo arquitectural** que ch4 (overflow:hidden + position:relative dentro de un section snap). Mitigación: aplicar same patrón pero **declarar el `<canvas>` como sibling, no child de un .ch6-layout intermedio con overflow:hidden** — esto reduce el stacking context que se sospecha causa el overlap.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D5-01 — Planet Content & Mapping:** 3 planetas = Empresa propia AR/VR (2015-18, arriba) + Remoose Interactive (2023+, medio) + Software Mind NA (2023+ AI/QA, fondo). Orden vertical cronológico ascendente. `projects.js` recibe 3 items con `chapterEra: 6` + campos `planetSprite` (asset path), `planetOrbit` (Y normalizado 0..1), `planetColor` (hex del halo).

- **D5-02 — Scroll & Camera Architecture:** Arrival cinematográfico una vez (~3-4s) + escena estática post-arrival con 2 naves loop horizontal. Scroll-snap del documento NO se altera (ch6 NO captura wheel/touch). Re-entry recrea instancia, arrival se reproduce.

- **D5-03 — Easter Egg Mantra:** "And always show a smile" / "Y siempre muestra una sonrisa" fade-in (~400ms) en Vue/HTML al fin del arrival, instant bajo PRM. Renderizado en HTML (no Phaser). Footer del `<section data-chapter="6">`, centrado, font synthwave-friendly, tamaño `clamp(1rem, 3vw, 1.5rem)`. CON-04 satisfecho.

- **D5-04 — Visual Concept (Vibe + Palette + Assets):** Lo-fi AI vaporwave/synthwave. Paleta locked:
  - `#1a0e3d` deep purple — bg gradient base
  - `#ff3ca6` hot pink — accent ships + planet highlights
  - `#4dffff` electric cyan — planet halos + tooltips + UI
  - `#ffd95c` soft amber — easter egg mantra + accent secundario
  - (opcional `#0a061f` near-black para starfield contrast)

  Assets: `ch6-bg.png` + opcional `ch6-bg-stars-far.png` + `ch6-bg-nebulae-mid.png` + 3 planet sprites + 2 ship sprites.

- **D5-05 — Naves:** 2 unidades loop horizontal escalonado (~12s + ~18s); estáticas bajo PRM. Diseño glitchy/neural — no realistas. Sin colisión, sin interacción.

- **D5-06 — Interaction Model:** Click/tap planeta → overlay Vue. Hover desktop → tooltip Phaser con nombre del proyecto (locale bridge). Mobile/touch → tap directo. Keyboard A11Y: 3 `<button>` sr-only post-canvas con `aria-label` per proyecto, mismo `vue:show-project` event. ESC desde canvas/overlay cierra.

- **D5-07 — ProjectOverlay:** NUEVO componente, NO reusa ProjectCard ni FloatingPanel. Synthwave glass + neon halos. `position: fixed; inset: 0; z-index: 50`. Backdrop `backdrop-filter: blur(8px)` + `rgba(26, 14, 61, 0.7)`. Card centrado, max-width `min(90vw, 560px)`, border 1px cyan + double glow cyan+pink. Close button top-right, ESC cierra, click-outside cierra, focus trap. Mobile fullscreen. Animación fade+scale 200ms ease-out / 150ms ease-in; instant bajo PRM.

- **D5-08 — PRM heuristic ch6 (extiende D-01..D-06 Phase 1 + D4-10 Phase 4):**
  - Arrival: instant cut bajo PRM.
  - Naves loop: estáticas bajo PRM.
  - Parallax multi-capa: sin diferencial bajo PRM.
  - Mantra fade-in: sin fade bajo PRM.
  - Overlay open/close: instant bajo PRM.
  - Phaser global flag: `this.tweens.timeScale = 0` cinturón de seguridad.

- **D5-09 — Chapter Overlay Layout Strategy:** Canvas full-bleed dentro de `<section data-chapter="6">`. Sin layout 2-col tipo ch3/ch4 — el chapter ES la escena Phaser. Canvas ocupa 100% × 100dvh menos espacio reservado para sticky avatar top-left (~96px), sticky timeline vertical-left (~120px), LangToggle top-right (~80px). Wrapper Vue contiene `<div class="ch6-canvas-host">` + `<ProjectOverlay>` v-if + `<p class="ch6-mantra">` v-if. **Test architectural defensivo** para chapter-overlap bug Phase 4 deferred.

- **D5-10 — Locale Bridge Granularity:** Solo texto in-scene Phaser usa bridge (tooltips de nombres de planetas en hover desktop). Mantra + overlay viven Vue/HTML — i18n directo. Listener en SpaceScene: `game.events.on('locale-changed', (locale) => { ... })`. Vue → Phaser: watch en `useI18n().locale`, emit del bridge event.

- **D5-11 — Chapter6Content + Phaser Lifecycle Detail:** Mount on activeChapter === 6, destroy on activeChapter !== 6 (PHA-04 lazy). Patrón:
  ```js
  watch(activeChapter, async (v) => {
    if (v === 6 && !game.value) {
      const { createGame } = await import('@/phaser')  // lazy bundle
      game.value = createGame(canvasHostRef.value)
    } else if (v !== 6 && game.value) {
      game.value.destroy(true, false)
      game.value = null
    }
  }, { immediate: true })
  ```
  Re-entry recrea instancia → arrival se reproduce. HMR guard via `import.meta.hot?.dispose(() => game.value?.destroy(true, false))`.

### Claude's Discretion

- Parallax internal multi-capa count: 2-4 capas (stars-far / nebulae-mid / planet-halo-near opcional). Recommended 3 capas para depth sin sobrecargar. Planner decide.
- Easter egg copy ES exact wording: "Y siempre muestra una sonrisa" propuesto; Rafael ratifica en W5 manual checklist (paralelo a alt-text ratification D4-11 pattern).
- Tooltip styling in-Phaser: Phaser Text con bg rect cyan glow o sprite custom. Recommended `Phaser.GameObjects.Container` con Rectangle + Text. No requiere asset pixelforge adicional.
- Project overlay i18n keys naming: `projects.ch6-ar-vr.title`, `projects.ch6-remoose.title`, `projects.ch6-software-mind.title`, etc. (D3-03 shape locked).
- Planet sizes: ~80-100px × zoom — visible sin saturar viewport. Halos extra 40px radius. Planner ajusta en testing.
- Arrival duration: 3-4s default; planner ajusta si user testing percibe fricción.
- Bridge event naming: `locale-changed` y `vue:show-project` propuestos. Planner verifica que no colisionen con eventos internos de Phaser.
- ProjectOverlay close-on-route-change: si Rafael presiona ↑ o click en otro tick mientras overlay está abierto, el overlay se cierra automáticamente (event listener en activeChapter).
- Phaser config: `pixelArt: true`, `roundPixels: true`, `backgroundColor: '#1a0e3d'`, `transparent: false`, `physics: { default: 'none' }`, `scene: [SpaceScene]`, `scale: { mode: Phaser.Scale.NONE }`.
- Asset preload strategy: `SpaceScene.preload()` carga sprites. NO loading spinner Phaser. Si preload >800ms, mostrar mantra prematuramente o dot pulsante HTML.
- Tests architectural (vitest + jsdom): `Chapter6Content` mount/unmount no leak; i18n parity extends a chapters.6.* + projects.ch6-*; `--bg-image` declarado en `[data-chapter="6"]`; naming convention enforced en `tests/assets/asset-naming.test.js`; theme isolation extends a ch6.

### Deferred Ideas (OUT OF SCOPE)

- Sound design ch6 (POL-02 v2).
- Easter egg Konami code o equivalente (POL-04 v2).
- Ships clickables con tooltip "skill bubble".
- Planet hover con orbital animation (requiere spritesheet — pixelforge limitation).
- Más de 3 planetas.
- Personalización in-scene mouse-driven parallax depth (Rafael descartó).
- Chapter overlap bug fix Phase 4 deferred — Phase 5 vigila + reporta, NO fix.
- Backgrounds downscale Phase 6 blocker — ch6-bg.png hereda restricción ≤80KB.
- iOS smoke test ch6 — Phase 1 Plan 07 deferred sigue siendo el bloqueador.
- Tercer idioma PT-BR/FR (I18N3-01 v2).
- Deep linking #ch-6 (DLINK-01 v2).
- Animación de salida cuando se va de ch6.

</user_constraints>

---

## Project Constraints (from CLAUDE.md)

- **Comunicación en español** (output user-facing). Código, paths, comandos en inglés.
- **Windows 11 / PowerShell 5.1** — sintaxis PS para comandos del usuario; bash via tool para POSIX.
- **Phaser 3.86 ESM, sin TypeScript** — JavaScript puro, import/export ESM.
- **Resolución virtual 480×270 (16:9), zoom ×3** → 1440×810 render target.
- **`image-rendering: pixelated` global** en index.html para canvas + img.
- **Vite dev server `127.0.0.1:5173`** — no `localhost`.
- **NUNCA usar `--env GEMINI_API_KEY=...`** en `claude mcp add` — guarda key en texto plano (.claude.json). Usar `setx` y heredar.
- **Capas de parallax intermedias = siluetas planas sin outlines** (Pitfall 6.1 CLAUDE.md). NO aplica directo a sprites Phaser (in-canvas, no son DOM/CSS), pero **sí** aplica al concepto: los sprites de naves/planetas se ven sobre el bg, NO requieren transparencia interna que rompa la lectura.
- **`forge_sprite` con `background:` = preset nombrado** (`"night"`, `"forest"`, `"sky"`, `"dungeon"`, etc.). NUNCA `"black"` / `"white"` — bg removal falla con esos.
- **Capas opacas full-frame → `forge_background`**, NUNCA `forge_sprite`.
- **Spritesheets animados pixelforge no son confiables** — frames derivan entre sí. Solo idle estático. PHA-08 (zero character animation) ya lock-in este constraint.
- **DogSprite MCP no existe** — fue alucinación documentada. No mencionar.
- **No instalar pixel-mcp (Aseprite)** salvo pedido explícito.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PHA-01 | `PhaserChapter.vue` mantiene `Phaser.Game` en `shallowRef` (NO `ref`/`reactive` — rompe game loop) | Pattern 1: shallowRef rationale + jsdom test pattern verifies no `reactive()` ni `ref()` mention. |
| PHA-02 | `game.destroy(true, false)` en `onBeforeUnmount`; `import.meta.hot.dispose()` guard para HMR en dev | Pattern 1: destroy semantics confirmed via Phaser source (`removeCanvas=true`, `noReturn=false` preserva plugins core). HMR guard pattern. |
| PHA-03 | `Phaser.Scale.NONE` con `zoom = Math.min(Math.floor(vw/480), Math.floor(vh/270))` | Pattern 3: integer scale formula + HiDPI handling via `pixelArt: true` + `roundPixels: true`. |
| PHA-04 | Phaser se importa con `import()` dinámico y se monta solo cuando `activeChapter === 6` (lazy bundle) | Pattern 2: lazy `import('phaser')` via factory `createGame()`, Vite tree-shaking limitations documented. |
| PHA-05 | `SpaceScene` con **parallax vertical descendente** multi-capa, naves cruzando, **3 planetas-proyecto** distribuidos verticalmente | Pattern 7: camera scrollY tween arrival + multi-layer `scrollFactor`. Pattern 8: ships horizontal loop tween. |
| PHA-06 | Locale bridge: `game.events.emit("locale-changed", locale)`; scene escucha y re-renderiza labels | Pattern 5: Vue watch on `useI18n().locale` + scene listener `this.game.events.on('locale-changed', ...)`. |
| PHA-07 | Project click bridge: planet click → `game.events.emit("vue:show-project", id)` → Vue overlay muestra detalle | Pattern 6: planet `setInteractive() + pointerdown` + Vue listener via `game.events.on('vue:show-project', ...)`. |
| PHA-08 | Cero character animation (constraint cerrado por limitación pixelforge) | Already locked by D5 + CLAUDE.md §6.4 — research confirms no spritesheet animation needed. |
| PHA-09 | `ResizeObserver` + recalc para recalcular escena en window resize | Pattern 4: `useResizeObserver` (@vueuse/core 14.3 disponible) + manual `game.scale.resize()` + zoom recompute. |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Phaser game instance + scene rendering | Phaser canvas (browser, GPU) | — | Es el corazón del chapter; canvas WebGL maneja sprites/tweens/loop. |
| Mount/unmount Phaser based on chapter | Vue 3 reactivity (watch on activeChapter) | — | Vue es el orquestador; Phaser no sabe del scroll-snap. |
| Lazy bundle splitting | Vite build-time (dynamic import) | Browser runtime | Vite separa el chunk al detectar `import('phaser')`. |
| Pixel art crispness HiDPI | Phaser `pixelArt: true` + CSS `image-rendering: pixelated` | Browser canvas scaling | Phaser configura el canvas internal res; CSS evita smoothing al display. |
| Project overlay UI | Vue (HTML/CSS) | — | DOM accessibility + screen readers + focus trap viven mejor en HTML que dentro del canvas. |
| Easter egg mantra rendering | Vue (HTML) | CSS transition | Texto + i18n directo sin pasar por bridge; CSS `transition: opacity` para fade. |
| Locale awareness (toggle ES/EN) | Vue (vue-i18n singleton) | Phaser scene (event listener) | Vue emite, Phaser reacciona; Phaser no consume vue-i18n directo en runtime (singleton import OK pero ya es overkill). |
| Keyboard accessibility (3 planets) | Vue (sr-only `<button>` post-canvas) | DOM focus + Enter handler | Phaser no soporta focus DOM-style; HTML buttons resuelven Tab navigation. |
| Resize handling (window + viewport change) | Vue (`useResizeObserver`) + Phaser (`game.scale.resize`) | — | Vue detecta cambio, llama Phaser API para recomputar zoom integer + repositioning. |
| HMR dispose in dev | Vite `import.meta.hot.dispose` | — | Solo dev — destruye game instance antes de reload módulo. |
| Background era→era crossfade | HTML BackgroundLayers (D2-04) | CSS opacity transition | Independiente de Phaser; el canvas vive encima con su propio `backgroundColor` Phaser. |
| 2 naves loop horizontal | Phaser scene tweens (`repeat: -1`) | — | Decorative — vive in-canvas, sin interacción Vue. |
| Planet click → overlay | Phaser `setInteractive()` + `pointerdown` → emit `vue:show-project` | Vue listener mostrando `<ProjectOverlay>` | Bidireccional: Phaser detecta, Vue presenta. |
| Tooltip hover desktop | Phaser scene (in-canvas Text + Rectangle) | game.events `locale-changed` listener | Vive in-canvas porque sigue al cursor del mouse en pixel-coords. Solo desktop (no-touch). |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `phaser` | `^3.86.0` (currently installed; resolves to 3.86.x latest minor — NOT 4.x major) | Game engine para escena ch6 | Locked en CLAUDE.md + PHA-* requirements. Phaser 4.0.0 publicado 2026-04-30 está disponible pero ES OUT OF SCOPE Phase 5 (major upgrade requires re-validation). [VERIFIED: `npm view phaser version` returns 4.1.0 latest, `phaser@3` last published 3.x is 3.90.0+. Package.json `^3.86.0` permite 3.x minors no 4.x.] |
| `vue` | `^3.5.0` (currently 3.5.x) | Framework UI host de Phaser | Ya instalado Phase 1. `shallowRef` (PHA-01) requiere Vue 3 — no API en Vue 2. |
| `vue-i18n` | `^11.4.2` | i18n para tooltips bridge + overlay + mantra | Ya instalado Phase 2 (D2-09). `useI18n().locale` ref es la fuente del bridge. |
| `@vueuse/core` | `^14.3.0` | `useResizeObserver` (PHA-09), `usePreferredReducedMotion` (PRM) | Ya instalado. Cero JS extra para listeners + cleanup. |
| `vite` | `^5.4.0` | Build + dev server + HMR | Ya instalado. `import.meta.hot.dispose()` API documentada [CITED: vite.dev/guide/api-hmr]. |

[VERIFIED: `npm view phaser version` → 4.1.0 (2026-04-30 modified). `phaser@^3` latest minor 3.x es 3.90+. El proyecto está pinned `^3.86.0` → solo 3.x minors. Confirmar con `npm ls phaser` antes de plan execution si Rafael ya hizo `npm update`.]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vueuse/core` `useFocusTrap` | `^14.3.0` (same package) | Focus trap en `<ProjectOverlay>` | D5-07 mandate: focus al close button al abrir, restore focus al planet-button al cerrar. `useFocusTrap` evita re-implementar tab cycling manual. [CITED: vueuse.org/integrations/useFocusTrap/] **Caveat:** `useFocusTrap` desde @vueuse/integrations requiere `focus-trap` peer dependency — verificar antes de añadirla. **Alternativa manual:** ~30 LOC con keydown listener + `tabindex` querySelectorAll — recommended si añadir `focus-trap` introduce 8KB extra. Planner decide en plan-phase. |
| (no extras) | — | — | Phaser 3.86 ya incluye: Camera (arrival tween), GameObjects (sprites/text/rect), Tweens (ship loop), Events (bridge), Scale (NONE mode), Input (pointerdown/over). |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `shallowRef(game)` (PHA-01 locked) | `ref(game)` con `toRaw(ref.value)` en cada acceso (template oficial Phaser-Vue usa esto) | `shallowRef` es más limpio + más correcto: Vue NUNCA intenta reactive-track el game tree. Con `ref` + `toRaw()`, un acceso accidental sin `toRaw()` (e.g. en debug logging, console.log que dispara getters) puede causar performance hit. Verificado en source [CITED: github.com/phaserjs/template-vue/blob/main/src/PhaserGame.vue líneas 5-6, 32]. PHA-01 locked es la elección correcta. |
| `game.destroy(true)` (template oficial usa esto) | `game.destroy(true, false)` (PHA-02 locked) | `destroy(true)` deja `noReturn` default a `false` — funcionalmente equivalente al locked. Pero PHA-02 explicita el segundo arg para **legibilidad + intent**: "preservamos core plugins porque re-instanciamos en re-entry" (D5-02). [VERIFIED via Phaser Game.js source: `if (noReturn === undefined) { noReturn = false; }`.] |
| `defineAsyncComponent(() => import('./PhaserChapter.vue'))` | `import('@/phaser')` direct en `watch(activeChapter)` (D5-11 locked) | `defineAsyncComponent` envuelve un componente Vue completo en suspense — más overhead. El locked pattern (importar la **factory** `createGame`) es más liviano: el chunk Phaser es lazy pero el component `Chapter6Content.vue` se mounta normalmente, el bundle Phaser solo se baja cuando `activeChapter === 6`. |
| `Phaser.Scale.FIT` (auto-scale to parent) | `Phaser.Scale.NONE` + integer zoom (PHA-03 locked) | `FIT` interpola fraccional → rompe pixel-art crispness (sub-pixel blur). PHA-03 mandate `NONE` + `Math.floor` garantiza pixel-perfect en HiDPI. **Default Phaser:** `Scale.FIT` — debe sobreescribirse explícitamente. |
| `EventBus` singleton (`new Phaser.Events.EventEmitter()` exportado, template oficial) | `game.events` directamente (recommended PHA-06/07 locked) | Singleton EventBus es **separado del game lifecycle** — sobrevive a destroy(). Si el bus tiene listeners de Vue, esos listeners persisten orfanados tras destroy. `game.events` se destruye automáticamente con `game.destroy()` → cleanup automático. **Pero:** Vue → Phaser direction (e.g. `watch(locale, l => game.value.events.emit('locale-changed', l))`) **debe defensive-check `game.value`** porque el watcher puede dispararse cuando `game.value === null`. |
| `Phaser.Game.config.fps.target = 30` | Default 60 (D5 implicit) | 30 fps reduce battery drain en mobile pero ch6 no tiene animaciones complejas — el cost-saving es marginal y el feel se degrada. Default OK. |

**Installation:**

```powershell
# Verificar versión instalada actual antes de cualquier cosa:
npm ls phaser
# Esperado: phaser@3.86.x (o un 3.x minor superior si npm update fue corrido)

# No requiere install nuevos para Phase 5 — Phaser 3.86 y vue-i18n ya están.
# Si se decide usar @vueuse/integrations useFocusTrap:
npm install @vueuse/integrations focus-trap
# Caveat: focus-trap es peer dep separado, ~8KB minified. Planner valida si vale la pena vs manual ~30 LOC.
```

**Version verification:** [VERIFIED 2026-05-14 via `npm view phaser version` and `npm view phaser@3 versions --json`]
- Phaser latest published: **4.1.0** (2026-04-30) — out of scope, major upgrade.
- Phaser 3.x latest in installed range `^3.86.0`: **3.86.0** is currently pinned. Running `npm update` brings to latest 3.x minor (verify before execute).
- Vue 3.5.x compatible con `shallowRef` API: HIGH confidence (shallowRef desde Vue 3.0). [CITED: vuejs.org/api/reactivity-advanced.html#shallowref]
- Vite 5.4 `import.meta.hot.dispose` API estable. [CITED: vite.dev/guide/api-hmr#hot-dispose-cb]

---

## Architecture Patterns

### System Architecture Diagram

```
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  User scrolls / clicks tick → ScrollShell → IntersectionObserver        │
   │                            ↓                                              │
   │              useScrollState.activeChapter ref ──┐                        │
   │                                                  │                        │
   │  ┌────────────────── App.vue (provide) ─────────┴───────────────┐       │
   │  │  scrollState · prm · bgMorph · i18n singleton                  │       │
   │  └──────┬──────────────────────────────────────────────┬─────────┘       │
   │         ↓ inject('scrollState')                        ↓ inject('prm')   │
   │  ┌─────────────────────────────────────────────────────────────────┐    │
   │  │  Chapter6Content.vue                                              │    │
   │  │  ──────────────────────                                           │    │
   │  │  watch(activeChapter, async (v) => {                              │    │
   │  │    if (v === 6 && !game.value) {                                  │    │
   │  │      const { createGame } = await import('@/phaser')  ──╮        │    │
   │  │      game.value = createGame(canvasHostEl, { prm })     │ Vite   │    │
   │  │    } else if (v !== 6 && game.value) {                  │ splits │    │
   │  │      game.value.destroy(true, false)                    │ chunk  │    │
   │  │      game.value = null                                  │        │    │
   │  │    }                                                    │        │    │
   │  │  })                                                     │        │    │
   │  │                                                         ↓        │    │
   │  │   ┌─ <div class="ch6-canvas-host" ref="canvasHostEl"> ─────────┐ │    │
   │  │   │                                                              │ │    │
   │  │   │   Phaser canvas → SpaceScene                                 │ │    │
   │  │   │   ───────────────────────                                     │ │    │
   │  │   │   preload: ch6-bg.png · planet sprites · ship sprites        │ │    │
   │  │   │   create:  bg + 3 planets + 2 ships + camera tween arrival   │ │    │
   │  │   │   create:  game.events.on('locale-changed', updateTooltips)  │ │    │
   │  │   │   update:  ships horizontal tween (auto via tweens manager)  │ │    │
   │  │   │                                                              │ │    │
   │  │   │   planet.on('pointerdown') → game.events.emit(               │ │    │
   │  │   │      'vue:show-project', planetId)                           │ │    │
   │  │   │                                                              │ │    │
   │  │   │   tween.onComplete → game.events.emit('vue:arrival-complete')│ │    │
   │  │   └──────────────────────────────────────────────────────────────┘ │    │
   │  │                  ↑ canvas full-bleed                                │    │
   │  │                                                                     │    │
   │  │   ┌─ <p class="ch6-mantra" v-if="arrivalDone"> ────────────────┐  │    │
   │  │   │   {{ t('chapters.6.mantra') }}                              │  │    │
   │  │   │   ← fade-in 400ms (instant bajo PRM)                        │  │    │
   │  │   └──────────────────────────────────────────────────────────────┘  │    │
   │  │                                                                     │    │
   │  │   ┌─ <button v-for=3 class="sr-only" @click=emit > ──────────────┐ │    │
   │  │   │   aria-label="Open project: AR/VR own / Remoose / Software"  │ │    │
   │  │   │   keyboard A11Y — fires same 'vue:show-project' event        │ │    │
   │  │   └─────────────────────────────────────────────────────────────┘ │    │
   │  │                                                                     │    │
   │  │   ┌─ <ProjectOverlay v-if="activeProject" :project="..."/> ────┐ │    │
   │  │   │   modal Vue synthwave + focus trap + ESC cierra              │ │    │
   │  │   │   listens game.events('vue:show-project') via watch           │ │    │
   │  │   └─────────────────────────────────────────────────────────────┘ │    │
   │  └─────────────────────────────────────────────────────────────────┘    │
   │                                                                          │
   │  ┌─ Globals (encima del canvas via z-index) ──────────────────────────┐ │
   │  │  StickyAvatar (z>canvas) · StickyTimeline (z>canvas)               │ │
   │  │  LangToggle (z>canvas) → watch(i18n.locale, l =>                   │ │
   │  │     game.value?.events.emit('locale-changed', l))                  │ │
   │  │  ContactHUD (z>canvas)                                              │ │
   │  └────────────────────────────────────────────────────────────────────┘ │
   │                                                                          │
   │  HMR (dev only):                                                        │
   │  if (import.meta.hot) {                                                 │
   │     import.meta.hot.dispose(() => game.value?.destroy(true, false))    │
   │  }                                                                      │
   └──────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── components/
│   ├── Chapter6Content.vue       ← NEW: watch(activeChapter) lifecycle + ProjectOverlay + mantra
│   ├── PhaserChapter.vue         ← OPTIONAL: encapsula canvas host + shallowRef game (planner decide si separar)
│   ├── ProjectOverlay.vue        ← NEW: modal synthwave + focus trap (D5-07)
│   └── ScrollShell.vue           ← edit: añade <Chapter6Content v-else-if="ch.id === 6" />
├── phaser/                       ← NEW directory (separado de src/scenes/ del scaffold legacy)
│   ├── index.js                  ← factory createGame(hostEl, { prm }) → returns shallowRef-friendly Phaser.Game
│   └── SpaceScene.js             ← Phaser Scene: preload + create + camera tween + bridges
├── data/
│   ├── projects.js               ← edit: añadir 3 items chapterEra=6 con planetSprite/planetOrbit/planetColor
│   └── chapters.js               ← edit: chapters[6].palette = ['#1a0e3d', '#ff3ca6', '#4dffff', '#ffd95c']
├── i18n/
│   ├── es.json                   ← edit: añadir chapters.6.{flavor,mantra} + projects.ch6-*.{title,desc,role}
│   └── en.json                   ← edit: paridad enforced por tests/i18n/parity.test.js
├── styles/
│   └── chapter-themes.css        ← edit: [data-chapter="6"] finalizar palette + --bg-image + add .ch6-* + .project-overlay components
public/assets/
├── ch6-bg.png                    ← NEW: forge_background full-frame synthwave gradient
├── ch6-planet-ar-vr.png          ← NEW: forge_sprite neon-orb cyan halo
├── ch6-planet-remoose.png        ← NEW: forge_sprite neon-orb pink halo
├── ch6-planet-software-mind.png  ← NEW: forge_sprite neon-orb amber halo
├── ch6-ship-1.png                ← NEW: forge_sprite abstract glitchy
├── ch6-ship-2.png                ← NEW: forge_sprite abstract glitchy
└── (opcional, si planner decide multi-layer parallax)
    ├── ch6-bg-stars-far.png      ← optional second layer (scrollFactor ~0.2)
    └── ch6-bg-nebulae-mid.png    ← optional third layer (scrollFactor ~0.5)
tests/
├── components/
│   ├── Chapter6Content.test.js   ← NEW: mount/unmount lifecycle assertions (jsdom-friendly: no real WebGL)
│   ├── ProjectOverlay.test.js    ← NEW: ESC closes, click-outside closes, focus trap, i18n labels
│   └── ScrollShell.theme-isolation-phase5.test.js ← extiende ch6 al test ya existente
├── phaser/
│   └── space-scene-shape.test.js ← NEW: source-level regex matches — shallowRef, destroy(true,false), import.meta.hot.dispose, scale NONE, Math.floor zoom
├── assets/
│   └── asset-naming.test.js      ← edit: extend regex enum a ch6-bg/ch6-planet-*/ch6-ship-*
├── data/
│   ├── projects.test.js          ← edit: assert 3 items chapterEra=6 con planetSprite/Orbit/Color populated
│   └── chapters.test.js          ← edit: assert chapters[6].palette.length >= 4
└── i18n/
    └── parity.test.js            ← (sin cambios — extiende automáticamente con nuevas keys)
```

### Pattern 1: Phaser 3.86 + Vue 3 Lifecycle (shallowRef + destroy + HMR)

**What:** Mount/unmount controlled, no-leak, re-instantiable Phaser game inside a Vue 3 component.

**When to use:** Cuando el game vive dentro de un component que se monta/desmonta — exactamente el caso ch6 (activeChapter watch).

**Source pattern (template oficial reinforced con PHA-01/02 strictness):**

```js
// src/phaser/index.js — factory
// Source: derived from github.com/phaserjs/template-vue + PHA-01/02 strictness
import Phaser from 'phaser'
import { SpaceScene } from './SpaceScene'

const BASE_W = 480
const BASE_H = 270

function computeZoom() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return Math.min(Math.floor(vw / BASE_W), Math.floor(vh / BASE_H)) || 1
  // `|| 1` defensive — si viewport < 480×270 (extreme mobile), zoom=0
  // produciría 0×0 canvas. Mínimo 1 (acepta downscale visible vs invisible).
}

export function createGame(parentEl, { prefersReduced } = {}) {
  // Capture PRM flag al crear, scene init data lo recibe (Pattern 9).
  return new Phaser.Game({
    type: Phaser.AUTO,         // WebGL si disponible, fallback Canvas2D
    parent: parentEl,           // DOM node, NO id string — más estricto, evita race con Vue ref
    width: BASE_W,
    height: BASE_H,
    zoom: computeZoom(),
    pixelArt: true,             // disable image smoothing (PHA-03 partial)
    roundPixels: true,          // sub-pixel snapping (avoid blur on tween positions)
    backgroundColor: '#1a0e3d', // deep purple D5-04
    transparent: false,         // canvas opaco — bg synthwave dentro del game, no detrás
    physics: { default: 'none' },
    scale: {
      mode: Phaser.Scale.NONE,  // PHA-03 — NO auto-scale, integer zoom manual
      autoCenter: Phaser.Scale.CENTER_BOTH, // centrar canvas en parent
    },
    scene: [SpaceScene],
    callbacks: {
      preBoot: (game) => {
        // Pass PRM flag to scene via game.registry — accessible from any scene.
        game.registry.set('prefersReduced', !!prefersReduced)
      },
    },
  })
}
```

```vue
<!-- src/components/Chapter6Content.vue — lifecycle owner -->
<script setup>
// PHA-01: shallowRef NUNCA ref/reactive
// PHA-02: destroy(true, false) + import.meta.hot.dispose
// PHA-04: dynamic import — Vite separates chunk
// D5-11: watch(activeChapter) immediate

import { shallowRef, ref, watch, onBeforeUnmount, inject, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { activeChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')
const { locale } = useI18n()

// PHA-01: shallowRef — Vue NEVER reactive-tracks game tree.
const game = shallowRef(null)
const canvasHostRef = useTemplateRef('canvasHost')

// Bridge state (Vue-side)
const arrivalDone = ref(false)         // mantra fade-in trigger
const activeProject = ref(null)        // overlay open/closed

// D5-11 — watch immediate to handle initial mount if activeChapter starts at 6
// (deep-link ?ch=6).
watch(activeChapter, async (v) => {
  if (v === 6 && !game.value) {
    if (!canvasHostRef.value) {
      // Defensive: si el watcher dispara antes que el DOM mount
      // (raro con flush:'post' pero posible), esperar tick.
      await nextTick()
    }
    // PHA-04: lazy import — Vite genera chunk separado, bajado on demand.
    const { createGame } = await import('@/phaser')
    game.value = createGame(canvasHostRef.value, { prefersReduced: prefersReduced.value })

    // Bridge IN: Phaser → Vue
    game.value.events.on('vue:show-project', (projectId) => {
      activeProject.value = projectId
    })
    game.value.events.on('vue:arrival-complete', () => {
      arrivalDone.value = true
    })
  } else if (v !== 6 && game.value) {
    // PHA-02: destroy(true, false) — canvas removed, plugins preserved for re-entry.
    game.value.destroy(true, false)
    game.value = null
    arrivalDone.value = false      // reset mantra
    activeProject.value = null      // close overlay if open
  }
}, { immediate: true, flush: 'post' })

// PHA-06: Vue → Phaser locale bridge.
// Defensive null-check — locale watcher fires anytime, game.value may be null.
watch(locale, (l) => {
  game.value?.events.emit('locale-changed', l)
})

// PHA-02: HMR — Vite dispose API.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.value?.destroy(true, false)
    game.value = null
  })
}

// Defensive: si el component se desmonta sin pasar por watch
// (e.g. parent v-if=false), aún destruir.
onBeforeUnmount(() => {
  game.value?.destroy(true, false)
  game.value = null
})
</script>

<template>
  <div class="ch6-layout">
    <div ref="canvasHost" class="ch6-canvas-host" aria-hidden="true" />

    <!-- D5-06: 3 sr-only buttons for keyboard A11Y -->
    <button
      v-for="p in ch6Projects"
      :key="p.id"
      type="button"
      class="ch6-planet-trigger sr-only"
      :aria-label="t('ui.openProject') + ': ' + t(p.titleKey)"
      @click="activeProject = p.id"
    />

    <!-- D5-03: mantra HTML/Vue -->
    <p v-if="arrivalDone" class="ch6-mantra">
      {{ t('chapters.6.mantra') }}
    </p>

    <!-- D5-07: overlay Vue (synthwave) — separate component -->
    <ProjectOverlay
      v-if="activeProject"
      :project-id="activeProject"
      @close="activeProject = null"
    />
  </div>
</template>
```

**Critical claims:**
- [VERIFIED via Phaser source `src/core/Game.js`]: `destroy(removeCanvas, noReturn)`. `removeCanvas=true` → `CanvasPool.remove(this.canvas)` + `canvas.parentNode.removeChild(canvas)`. `noReturn=false` (default) → `Phaser.Plugins.PluginCache` permanece, así `new Phaser.Game()` posterior funciona sin re-registrar plugins.
- [VERIFIED via vuejs.org/api/reactivity-advanced.html#shallowref]: `shallowRef` solo reactiviza el `.value` top-level — el contenido (en este caso el Phaser.Game tree) NO se proxifica.
- [VERIFIED via Phaser template-vue]: el template oficial usa `ref(game)` con `toRaw()` en accesos. PHA-01 es más estricto (mejor decisión para este caso).
- [CITED: vite.dev/guide/api-hmr]: `import.meta.hot.dispose(cb)` se llama antes de aplicar nueva versión del módulo. Multiple calls a `dispose` en mismo módulo se sobreescriben — consolidar en una llamada.

**Pitfalls (ver §Common Pitfalls):** Race condition con DOM ref · Watcher dispara antes que canvas exista · Listener leak en game.events si Vue listener no se remueve · HMR sin dispose acumula instancias.

### Pattern 2: Lazy Bundle Phaser via Dynamic import()

**What:** Solo bajar el chunk Phaser cuando el usuario llegue a ch6, no en initial bundle.

**When to use:** Siempre — Phaser es ~600KB minified (~150KB gzip estimado). Si bundleeas en initial, todos los visitantes pagan ese cost incluso si nunca scrollean a ch6.

**Source pattern:**

```js
// En Chapter6Content.vue (ver Pattern 1 línea ~25):
const { createGame } = await import('@/phaser')
```

**Vite behavior:** Vite detecta el dynamic import string-literal y genera un chunk separado en build (`dist/assets/phaser-[hash].js`). En dev, el chunk se sirve on demand. [CITED: vitejs.dev/guide/features.html#dynamic-import]

**What NOT to do:**

```js
// ❌ INCORRECTO — bundle Phaser en initial chunk:
import Phaser from 'phaser'
import { SpaceScene } from './SpaceScene'
// Even if `new Phaser.Game()` no se llama, el import top-level evaluates Phaser.

// ❌ INCORRECTO — variable dynamic import (Vite no puede split):
const lib = activeChapter.value === 6 ? 'phaser' : 'lodash'
await import(lib)  // Vite warning: cannot analyze import

// ✅ CORRECTO — string-literal dynamic import:
await import('@/phaser')
// Vite analyzes string at build time, splits chunk.
```

**Tree-shaking caveats:**

Phaser 3.86 es un **UMD bundle monolítico** internamente — NO tree-shakeable a nivel de subsystems (e.g., no se puede dejar fuera `Phaser.Physics` aunque no se use). Bundle estimated ~600KB minified / ~150KB gzipped. [LOW confidence — no verifiqué número exacto contra `npm view phaser dist.unpackedSize`. La cifra oficial reportada en docs y benchmarks varía 500-800KB minified según features enabled. Recomendar **medir tras build con `npm run build` + verificar tamaño del chunk phaser-*.js**.]

[VERIFIED: `npm view phaser dist.unpackedSize` = 107MB (uncompressed, incluye src + types + examples — NO es el bundle final). El bundle real producido por Vite (tree-shaken hasta donde Phaser permite + minified) es órdenes de magnitud menor. Medir post-build.]

**Recommended action en plan:** Wave de verificación incluye `npm run build` + check del chunk Phaser size + reportar el número actual en `05-MANUAL-CHECKLIST`. Si > 300KB gzip, considerar lazy-load del SpaceScene también (segundo nivel de splitting).

### Pattern 3: Integer Scale + HiDPI Pixel-Perfect

**What:** Pixel-art crispness en Retina (devicePixelRatio > 1) sin sub-pixel blur.

**Why this matters:** Default `Phaser.Scale.FIT` interpola fraccional cuando viewport no es múltiplo exacto de base resolution → bordes blurrosos en pixel art. Crítico para Phase 5 Success Criteria #4.

**Source pattern:**

```js
// src/phaser/index.js (continuación de Pattern 1)
const BASE_W = 480
const BASE_H = 270

function computeZoom() {
  const vw = window.innerWidth   // CSS px, NO device px
  const vh = window.innerHeight
  return Math.min(
    Math.floor(vw / BASE_W),
    Math.floor(vh / BASE_H)
  ) || 1                          // fallback 1× si viewport < base res
}

new Phaser.Game({
  width: BASE_W,                  // canvas INTERNAL res (Phaser-coords)
  height: BASE_H,
  zoom: computeZoom(),            // CSS-display multiplier (integer)
  pixelArt: true,                 // disable image smoothing in WebGL/Canvas2D
  roundPixels: true,              // snap tween positions to integer pixels
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
})
```

**Three orthogonal mechanisms (must coexist):**

1. **Phaser internal:** `pixelArt: true` → Phaser sets `texture.minFilter = NEAREST` y `maxFilter = NEAREST` (WebGL) o `imageSmoothingEnabled = false` (Canvas2D). [CITED: phaser.io docs Game Config]
2. **Phaser tween:** `roundPixels: true` → sprite/camera positions se redondean a integer pixels antes del render. Sin esto, tween 0.5px causa anti-aliasing visible en pixel art.
3. **CSS display:** index.html ya tiene `image-rendering: pixelated` global (CLAUDE.md §1) → aplica al `<canvas>` element cuando el browser lo upscale al display size. Sin esto, el OS smoothing del canvas final blurrea el pixel art incluso si Phaser internal es nearest-neighbor.

**Verification test (architectural, source-level):**

```js
// tests/phaser/space-scene-shape.test.js — Pattern 3 verification
import { readFileSync } from 'node:fs'
const src = readFileSync('src/phaser/index.js', 'utf8')

it('PHA-03: Phaser.Scale.NONE + integer Math.floor zoom', () => {
  expect(src).toMatch(/Phaser\.Scale\.NONE/)
  expect(src).toMatch(/Math\.floor\s*\(/)
  expect(src).toMatch(/pixelArt:\s*true/)
  expect(src).toMatch(/roundPixels:\s*true/)
})
```

### Pattern 4: ResizeObserver — Recalculate Zoom + Reposition on Viewport Change (PHA-09)

**What:** Recomputar el zoom integer + reposicionar planetas/naves si el viewport cambia (rotation mobile, browser window resize, dev-tools toggle).

**Source pattern:**

```js
// En Chapter6Content.vue setup (continuación de Pattern 1)
import { useResizeObserver } from '@vueuse/core'

useResizeObserver(document.documentElement, () => {
  if (!game.value) return  // defensive — solo aplica cuando activeChapter === 6

  // Recompute integer zoom.
  const vw = window.innerWidth
  const vh = window.innerHeight
  const newZoom = Math.min(Math.floor(vw / 480), Math.floor(vh / 270)) || 1

  if (newZoom !== game.value.scale.zoom) {
    game.value.scale.setZoom(newZoom)
    // game.scale.resize(newW, newH) NO se necesita porque Scale.NONE mantiene
    // BASE_W × BASE_H constante — solo el zoom multiplier cambia el display size.
  }

  // Reposition planets/ships if relative to viewport — generally NOT needed
  // because Phaser coords son base (480×270) constantes; solo el zoom externo cambia.
  // Pero si la scene usa game.scale.width/height para layouts, sí emit event:
  game.value.events.emit('viewport-resized')
})
```

**Why `document.documentElement` not `window`:** Pattern Phase 1 (`useResizeObserver(document.documentElement)` en App.vue) ya establecido — más consistente con dvh/svh behavior en mobile que `window.innerWidth`. [VERIFIED: src/App.vue líneas 46-54 según 01-CONTEXT.md.]

**Debounce/throttle:** `useResizeObserver` de @vueuse/core ya throttle internamente. NO se necesita lodash debounce. [CITED: vueuse.org/core/useResizeObserver/]

**PRM consideration:** Sin animación al resize — el zoom cambia instantáneamente (es un re-render del frame siguiente). No requiere branch PRM.

### Pattern 5: Locale Bridge Vue → Phaser (PHA-06)

**What:** Cuando Rafael cambia ES↔EN, los tooltips in-Phaser (nombres de planetas en hover desktop) deben re-render con el nuevo label.

**Source pattern:**

```js
// === Vue side === (Chapter6Content.vue setup, ver Pattern 1)
import { useI18n } from 'vue-i18n'
const { locale } = useI18n()

// Watch locale, emit a Phaser. Defensive null-check.
watch(locale, (l) => {
  game.value?.events.emit('locale-changed', l)
})

// === Phaser side === (src/phaser/SpaceScene.js)
import { i18n } from '@/i18n'  // singleton export from Phase 2

export class SpaceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpaceScene' })
    this.tooltipTexts = []     // accumulate refs to Phaser Text objects for re-translation
  }

  create() {
    // ... create planets, ships, bg ...

    this.planets.forEach((planet, idx) => {
      const tooltip = this.add.text(0, 0, '', {
        fontFamily: 'Audiowide',  // already loaded Phase 2 W4 self-hosted
        fontSize: '12px',
        color: '#4dffff',
        backgroundColor: '#1a0e3d',
        padding: { x: 6, y: 3 },
      }).setVisible(false).setDepth(100)

      planet.on('pointerover', () => {
        if (this.sys.game.device.input.touch) return  // skip on touch (D5-06)
        tooltip.setText(i18n.global.t(this.projectsData[idx].titleKey))
        tooltip.setPosition(planet.x + 20, planet.y - 20)
        tooltip.setVisible(true)
      })
      planet.on('pointerout', () => tooltip.setVisible(false))

      // Store ref + the key for re-translation on locale change.
      this.tooltipTexts.push({ tooltip, titleKey: this.projectsData[idx].titleKey })
    })

    // Listen for locale change from Vue.
    this.game.events.on('locale-changed', this.handleLocaleChange, this)

    // CLEANUP: remove listener when scene shuts down (defensive — game.destroy()
    // does call scene.shutdown which cleans events, but explicit is safer).
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('locale-changed', this.handleLocaleChange, this)
    })
  }

  handleLocaleChange(locale) {
    // Only the currently-visible tooltip needs update; others get fresh text
    // on next pointerover. Defensive: update all just in case.
    this.tooltipTexts.forEach(({ tooltip, titleKey }) => {
      if (tooltip.visible) {
        tooltip.setText(i18n.global.t(titleKey))
      }
    })
  }
}
```

**i18n singleton access:** Phase 2 W0 establece `src/i18n/index.js` que exporta el i18n instance. Importarlo directo desde SpaceScene es OK — es un singleton, no causa reactividad duplicada. **Alternativa:** pasar `i18n` via `scene.scene.start('SpaceScene', { i18n })` data — overkill, el singleton import es estándar Vue.

**Cleanup:** Phaser `scene.shutdown` se llama al `game.destroy()`. Los listeners en `this.game.events` (cross-scene) requieren remove explícito porque viven en el game-level event bus, no scene-level. Pattern verificado contra Phaser source.

### Pattern 6: Project Click Bridge Phaser → Vue (PHA-07)

**What:** Click/tap en planet sprite → emit event → Vue muestra `<ProjectOverlay>` con detalle.

**Source pattern:**

```js
// === Phaser side === (SpaceScene.js — continuación Pattern 5)
this.planets.forEach((planet, idx) => {
  // setInteractive con hit area generosa (D5-06 mandate +~16px padding)
  const halo = 16  // px in base coords; visual halo in art is rendered separately
  planet.setInteractive(
    new Phaser.Geom.Circle(planet.width / 2, planet.height / 2, planet.width / 2 + halo),
    Phaser.Geom.Circle.Contains
  )

  // Cursor change on hover (desktop only — touch no tiene cursor).
  planet.on('pointerover', () => {
    if (!this.sys.game.device.input.touch) {
      this.input.setDefaultCursor('pointer')
    }
  })
  planet.on('pointerout', () => {
    this.input.setDefaultCursor('default')
  })

  // Click → bridge event a Vue.
  planet.on('pointerdown', () => {
    this.game.events.emit('vue:show-project', this.projectsData[idx].id)
  })
})

// === Vue side === (Chapter6Content.vue, ver Pattern 1):
game.value.events.on('vue:show-project', (projectId) => {
  activeProject.value = projectId  // ref triggers <ProjectOverlay v-if="activeProject">
})
```

**Mobile/touch:** Phaser `setInteractive` + `pointerdown` recibe touch events automáticamente (Phaser Input Manager normaliza pointer events). Sin código extra. [CITED: phaser.io docs Input.Pointer.]

**Keyboard accessibility (D5-06):** los `<button class="sr-only">` post-canvas en el template Vue emiten el mismo event:

```vue
<button
  v-for="p in ch6Projects"
  :key="p.id"
  type="button"
  class="ch6-planet-trigger sr-only"
  :aria-label="t('ui.openProject') + ': ' + t(p.titleKey)"
  @click="activeProject = p.id"
/>
```

Esto permite Tab navigation desde StickyTimeline → 3 planet buttons → ProjectOverlay close button (cuando abierto). Una vez focus está en el button, Enter/Space lo activa (default browser behavior — no requiere keydown listener custom).

**sr-only CSS:** patrón estándar — Phase 2 ya lo establece para SkipLink. Reusable:

```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.sr-only:focus-visible {
  /* Restore visible for keyboard users */
  position: static;
  width: auto; height: auto;
  clip: auto;
  /* Add visual focus ring per chapter theme */
}
```

**Verificar:** Phase 2 SkipLink ya tiene este pattern (`tests/components/SkipLink.test.js`). Confirmar antes de implementar — recommended reusar la misma clase global (no duplicar).

### Pattern 7: Parallax Vertical Descendente Arrival (PHA-05 + D5-02)

**What:** Cámara Phaser desciende ~3-4s revelando 3 planetas distribuidos verticalmente, con multi-capa parallax (stars-far, nebulae-mid, planet-halo-near).

**Source pattern:**

```js
// === SpaceScene.js create() ===
create() {
  const prefersReduced = this.registry.get('prefersReduced')

  // Layer 1: stars-far — scrollFactor 0.2 (parallax depth illusion)
  // En Phaser, scrollFactor 0..1 controla cómo el sprite se mueve relativo a la cámara.
  // 0 = sticky to camera (HUD-like); 1 = world-space (full parallax); 0.2 = lejos.
  this.add.image(240, 135, 'ch6-bg-stars-far')
    .setScrollFactor(0.2)
    .setOrigin(0.5, 0.5)
    .setDisplaySize(480, 270 * 4)  // 4× height para cubrir descenso

  // Layer 2: nebulae-mid — scrollFactor 0.5
  this.add.image(240, 135, 'ch6-bg-nebulae-mid')
    .setScrollFactor(0.5)
    .setOrigin(0.5, 0.5)
    .setDisplaySize(480, 270 * 4)

  // 3 planets — world-space (scrollFactor 1.0 default), distributed vertically.
  // planetOrbit (0..1) maps to Y position in [0..arrivalDescent].
  const ARRIVAL_DESCENT = 270 * 3  // 3 viewport heights of vertical descent

  this.projectsData.forEach((proj, idx) => {
    const planet = this.add.sprite(
      240,                                          // center X
      proj.planetOrbit * ARRIVAL_DESCENT + 135,     // Y derived from data
      `ch6-planet-${proj.id.replace('ch6-', '')}`   // texture key
    )
    planet.setScrollFactor(1.0)  // world-space — camera reveals as it descends
    // ... setInteractive (ver Pattern 6) ...
    this.planets.push(planet)
  })

  // Cámara arrival: scroll Y de 0 a ARRIVAL_DESCENT en ~3-4s
  this.cameras.main.setScroll(0, 0)

  if (prefersReduced) {
    // D5-08: instant cut bajo PRM
    this.cameras.main.setScroll(0, ARRIVAL_DESCENT - 135)
    this.game.events.emit('vue:arrival-complete')
  } else {
    this.tweens.add({
      targets: this.cameras.main,
      scrollY: ARRIVAL_DESCENT - 135,  // -135 para centrar el último planet en viewport
      duration: 3500,                   // ~3.5s default; planner ajusta (Claude's discretion D5)
      ease: 'Power2.easeOut',           // empieza rápido, slow al final — feels cinematic
      onComplete: () => {
        this.game.events.emit('vue:arrival-complete')
        // Mantra fade-in se dispara en Vue (ver Pattern 1).
      },
    })
  }
}
```

**Why scrollFactor and not manual translateY:** `scrollFactor` es la API nativa de Phaser camera + sprite — más performant que mover sprites manualmente en `update()`. Phaser optimiza el render con scrollFactor pre-computed en cada frame. [CITED: phaser.io API docs `GameObject.setScrollFactor`.]

**Multi-layer count (Claude's discretion D5):**

| Count | Layers | Tradeoff |
|-------|--------|----------|
| 1 | Solo `ch6-bg.png` | Simple; sin parallax depth durante arrival — siente más estático. |
| 2 | `ch6-bg.png` (1.0) + `ch6-bg-stars-far.png` (0.2) | Mínimo depth perceivable; 1 asset extra. |
| 3 (**recommended**) | stars-far (0.2) + nebulae-mid (0.5) + bg-main (1.0 — donde viven los planetas) | Profundidad sintética sin sobrecargar pixelforge generation. |
| 4 | stars-far + nebulae-mid + planet-halo-mid + bg-main | Overkill — el halo "near" no añade percepción significativa vs 3-layer. |

**Recommendation:** 3 layers. Asset count: `ch6-bg-stars-far.png` + `ch6-bg-nebulae-mid.png` + `ch6-bg.png` (the main bg with planets-area placeholder — pero los planetas son sprites separados). **Si el planner decide reducir a 1 layer**, el bg single-image sigue funcionando (es scrollFactor 1.0 con suficiente height para cubrir el descenso).

### Pattern 8: 2 Ships Horizontal Loop (D5-05)

**What:** 2 ship sprites cruzando horizontalmente, escalonadas en velocidad (~12s + ~18s), continúan tras arrival mientras la escena está estática.

**Source pattern:**

```js
// === SpaceScene.js create() — después de crear planets ===

const prefersReduced = this.registry.get('prefersReduced')

const ship1 = this.add.image(-50, 80, 'ch6-ship-1')
  .setScrollFactor(0)   // sticky-to-camera — ships cruzan el viewport visible
  .setDepth(50)         // encima de bg, debajo de planets

const ship2 = this.add.image(530, 200, 'ch6-ship-2')
  .setScrollFactor(0)
  .setDepth(50)
  .setFlipX(true)       // ship2 mira a la izquierda

if (prefersReduced) {
  // D5-08: estáticas, posiciones decorativas fijas
  ship1.setX(120)        // banda superior, posición arbitraria visualmente OK
  ship2.setX(360)        // banda inferior
} else {
  this.tweens.add({
    targets: ship1,
    x: 530,              // off-screen right (480 + ship width buffer)
    duration: 12000,     // ~12s left-to-right
    repeat: -1,          // infinito
    onRepeat: () => { ship1.setX(-50) },  // reset al comenzar nuevo loop
    ease: 'Linear',
  })

  this.tweens.add({
    targets: ship2,
    x: -50,              // off-screen left
    duration: 18000,     // ~18s right-to-left (más lento — mayor profundidad)
    repeat: -1,
    onRepeat: () => { ship2.setX(530) },
    ease: 'Linear',
  })
}
```

**PRM safety net:**

```js
// Si por alguna razón un tween escapa al PRM check, este flag para todos:
if (prefersReduced) {
  this.tweens.timeScale = 0   // D5-08 — cinturón de seguridad
}
```

**Performance:** 2 sprites son trivial — no requiere object pooling. Tweens manager de Phaser handles 100s sin problema.

### Pattern 9: PRM Detection Inside Phaser Scene

**What:** SpaceScene necesita saber `prefersReduced` para branch arrival animation + ship loop. Phaser scene es JS sandbox aparte — no puede inject Vue composables.

**Three options + recommendation:**

| Option | How | Pros | Cons |
|--------|-----|------|------|
| A. Closure capture al crear | `createGame(host, { prefersReduced: prm.value })` (Pattern 1) | Simple, explícito. | Snapshot — si Rafael cambia PRM mid-session, scene no reacciona (cierre + re-mount lo recompone). |
| B. `game.registry` | `game.registry.set('prefersReduced', prm.value)` en `preBoot` callback. Scene lee con `this.registry.get('prefersReduced')` | Phaser-native, no requiere prop drilling. | Aún snapshot — si PRM cambia mid-session, scene no reacciona. |
| C. Singleton import + watch | `import { prefersReduced } from '@/composables/usePRM-singleton'` + watch global. | Reactivo. | Sobre-engineering — caso extremo (PRM rara vez cambia mid-session), añade complejidad por marginal benefit. |

**Recommended: Option B (`game.registry`)** — pattern usado en Pattern 1 source. Es Phaser-idiomático + suficiente para el caso (PRM rara vez toggle mid-session; el re-mount cuando el usuario sale a otro chapter y vuelve recompone).

**Caveat for "PRM mid-session change":** Documentar en `05-MANUAL-CHECKLIST` que cambiar PRM mientras se está EN ch6 NO afecta hasta salir y volver. Trade-off aceptable (escenario raro). Si surge demand, upgradeable a Option C en polish.

### Pattern 10: Vue ProjectOverlay synthwave + Focus Trap (D5-07)

**What:** Modal Vue con backdrop blur, glow cyan+pink, ESC cierra, click-outside cierra, focus trap, restore focus.

**Source pattern (manual focus trap — sin @vueuse/integrations dependency):**

```vue
<!-- src/components/ProjectOverlay.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, inject, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { projects } from '@/data/projects'

const props = defineProps({
  projectId: { type: String, required: true },
})
const emit = defineEmits(['close'])

const { t } = useI18n()
const { prefersReduced } = inject('prm')

const project = computed(() =>
  projects.find((p) => p.id === props.projectId)
)

const overlayRef = useTemplateRef('overlay')
const closeBtnRef = useTemplateRef('closeBtn')
let lastFocusedEl = null  // for restore-on-close

// === ESC closes ===
function handleKeydown(e) {
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'Tab') {
    // Focus trap: cycle within overlay
    trapTab(e)
  }
}

function trapTab(e) {
  if (!overlayRef.value) return
  const focusables = overlayRef.value.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

// === click-outside backdrop closes ===
function handleBackdropClick(e) {
  if (e.target === overlayRef.value) {
    emit('close')
  }
}

onMounted(() => {
  lastFocusedEl = document.activeElement  // remember who opened us
  // Focus close button (or first focusable in overlay).
  setTimeout(() => closeBtnRef.value?.focus(), 0)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  // Restore focus to the planet-button that opened us.
  lastFocusedEl?.focus()
})
</script>

<template>
  <div
    ref="overlay"
    class="project-overlay"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="`project-${projectId}-title`"
    @click="handleBackdropClick"
  >
    <article class="project-overlay__card">
      <button
        ref="closeBtn"
        type="button"
        class="project-overlay__close"
        :aria-label="t('ui.closeOverlay')"
        @click="emit('close')"
      >
        <span aria-hidden="true">×</span>
      </button>

      <h2 :id="`project-${projectId}-title`" class="project-overlay__title">
        {{ t(project.titleKey) }}
      </h2>
      <p class="project-overlay__year">{{ project.year }}</p>
      <p class="project-overlay__role">{{ project.role }}</p>
      <ul class="project-overlay__tech">
        <li v-for="tech in project.techStack" :key="tech">{{ tech }}</li>
      </ul>
      <p class="project-overlay__desc">{{ t(project.descKey) }}</p>
      <a
        v-if="project.link"
        :href="project.link"
        target="_blank"
        rel="noopener noreferrer"
        class="project-overlay__link"
      >
        {{ t('ui.openProject') }} →
      </a>
    </article>
  </div>
</template>
```

**Backdrop CSS (en chapter-themes.css @layer components):**

```css
.project-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 14, 61, 0.7); /* deep purple translúcido */
  /* Fallback: no-blur navigators ven el rgba sólido. */
}

@supports ((backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px))) {
  .project-overlay {
    background: rgba(26, 14, 61, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

.project-overlay__card {
  max-width: min(90vw, 560px);
  background: #1a0e3d;
  border: 1px solid #4dffff;
  border-radius: 8px;
  padding: var(--sp-lg);
  box-shadow:
    0 0 24px rgba(77, 255, 255, 0.4),    /* glow cyan */
    0 0 48px rgba(255, 60, 166, 0.2);    /* glow pink secundario */
  animation: overlay-enter 200ms ease-out;
}

@keyframes overlay-enter {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@media (max-width: 599px) {
  .project-overlay__card {
    max-width: 100vw;
    height: 100vh;
    height: 100dvh;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-overlay__card {
    animation: none;
  }
}

.project-overlay__close {
  position: absolute;
  top: var(--sp-sm);
  right: var(--sp-sm);
  background: transparent;
  border: 1px solid #4dffff;
  color: #4dffff;
  width: 32px; height: 32px;
  border-radius: 4px;
  font-size: 1.2rem;
  cursor: pointer;
}

.project-overlay__title {
  font-family: 'Audiowide', sans-serif;
  color: #4dffff;
  text-shadow: 0 0 8px rgba(77, 255, 255, 0.5);
}

/* ... resto de styling ... */
```

**ProjectOverlay close on chapter change:** Pattern 1 ya lo maneja — el watch reset `activeProject = null` cuando `activeChapter !== 6`.

### Pattern 11: Easter Egg Mantra Fade-In (D5-03)

**Source pattern:**

```vue
<!-- En Chapter6Content.vue template -->
<p
  v-if="arrivalDone"
  class="ch6-mantra"
>
  {{ t('chapters.6.mantra') }}
</p>
```

```css
/* chapter-themes.css @layer components — ch6 block */
[data-chapter="6"] .ch6-mantra {
  position: absolute;
  bottom: calc(80px + env(safe-area-inset-bottom, 0));  /* above StickyTimeline */
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Audiowide', sans-serif;
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: #ffd95c;                                       /* soft amber D5-04 */
  text-shadow: 0 0 12px rgba(255, 217, 92, 0.6);
  opacity: 0;
  animation: mantra-fade-in 400ms ease-out forwards;
  pointer-events: none;
  text-align: center;
  white-space: nowrap;
  z-index: 40;                                          /* above canvas, below overlay */
}

@keyframes mantra-fade-in {
  from { opacity: 0; transform: translate(-50%, 8px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}

@media (prefers-reduced-motion: reduce) {
  [data-chapter="6"] .ch6-mantra {
    animation: none;
    opacity: 1;
  }
}
```

**i18n keys to add:**

```json
{
  "chapters": {
    "6": {
      "title": "...",
      "era": "...",
      "flavor": "...",
      "mantra": "Y siempre muestra una sonrisa"  // ES
    }
  }
}
```

```json
{
  "chapters": {
    "6": {
      "title": "...",
      "era": "...",
      "flavor": "...",
      "mantra": "And always show a smile"  // EN
    }
  }
}
```

**Trigger source:** `arrivalDone` Vue ref toggled by `game.events.on('vue:arrival-complete', ...)` (Pattern 1).

### Pattern 12: Canvas Full-Bleed Layout + Chapter Overlap Bug Vigilance (D5-09)

**What:** El canvas ocupa el viewport completo del chapter pero los sticky globals (avatar, timeline, lang toggle) se mantienen visibles z-stacked encima.

**Critical concern:** Phase 4 deferred chapter-overlap bug (STATE.md). Hipótesis: `position: relative + overflow: hidden` en `.ch4-layout` crea stacking context que el scroll-snap NO rompe limpio entre sections. ch6 con canvas full-bleed corre **mismo riesgo**.

**Mitigation strategy:**

```vue
<!-- Chapter6Content.vue template -->
<div class="ch6-layout">
  <div ref="canvasHost" class="ch6-canvas-host" aria-hidden="true" />

  <!-- sr-only buttons + mantra + overlay (ver Pattern 1) -->
</div>
```

```css
/* chapter-themes.css */
[data-chapter="6"] {
  /* ... palette y bg-image already declared ... */
}

[data-chapter="6"] .ch6-layout {
  position: relative;
  /* NO overflow: hidden aquí — testing si esto reduce el chapter-overlap risk
     vs ch4-layout que SÍ tiene overflow:hidden. */
  /* Phaser canvas se inserta como child del .ch6-canvas-host;
     no necesitamos overflow:hidden porque el canvas YA es contenido,
     no es absolute-positioned escapando del flow. */
  width: 100%;
  height: 100%;
}

[data-chapter="6"] .ch6-canvas-host {
  position: absolute;
  inset: 0;
  /* Canvas mounted aquí toma 100% × 100% del host. */
}

[data-chapter="6"] .ch6-canvas-host canvas {
  /* Phaser inserta <canvas> aquí — image-rendering ya global en index.html */
  display: block;
}
```

**Test architectural defensivo (W5):**

```js
// tests/components/ScrollShell.theme-isolation-phase5.test.js (extend de Phase 4 equivalent)
it('ch6 section has scroll-snap-stop: always + scroll-snap-align: start', () => {
  // Source-level regex match en ScrollShell.vue OR computed style en jsdom mount.
  // Si pasa, el browser NO debería skip-frame ch6 durante scroll rápido.
})

it('ch6 .ch6-layout does NOT create stacking context that traps ch5 visible (Phase 4 chapter-overlap vigilance)', () => {
  // Verify: no position:relative + overflow:hidden combo en .ch6-layout (mitigation),
  // OR if combo presente, document it as known-risk and validate via manual checklist.
})

it('canvas element gets image-rendering: pixelated from global rule', () => {
  // index.html sets `canvas, img { image-rendering: pixelated }` globally.
  // Phase 5 doesn't need to override.
})
```

**Why this matters:** Si el bug se reproduce en ch6, el `<ProjectOverlay>` puede aparecer parcialmente cubierto por ch5 still visible. Si el bug NO se reproduce, sirve como datapoint negativo para refinar el root cause hypothesis del Phase 4 deferred item.

### Pattern 13: i18n Singleton Access from Phaser Scene

**What:** SpaceScene (JS sandbox) necesita resolver `t('projects.ch6-ar-vr.title')` para tooltips.

**Source pattern:**

```js
// src/i18n/index.js (Phase 2 W0 already exports the instance)
import { createI18n } from 'vue-i18n'
export const i18n = createI18n({ legacy: false, ... })

// In Phaser scene:
import { i18n } from '@/i18n'

// Usage:
const label = i18n.global.t('projects.ch6-ar-vr.title')
```

**Why this is safe:** `i18n.global` is the singleton entry — works outside Vue components. [CITED: vue-i18n.intlify.dev/guide/advanced/composition.html#global]

**Watcher dependency:** Phaser scene listens to `game.events('locale-changed')` (Pattern 5) — when triggered, it re-reads `i18n.global.t(...)` which already has the new locale set (Vue's watch fires after locale changes, so by the time the bridge event arrives, `i18n.global.t()` returns the new language).

**Verification test:**

```js
// tests/phaser/space-scene-shape.test.js
it('SpaceScene imports i18n singleton from @/i18n', () => {
  expect(readFileSync('src/phaser/SpaceScene.js', 'utf8')).toMatch(
    /import\s+\{?\s*i18n\s*\}?\s+from\s+['"]@\/i18n['"]/
  )
})
```

### Anti-Patterns to Avoid

- **DO NOT** use `ref(game)` instead of `shallowRef(game)`. The game.scene.systems tree contains thousands of nested objects. `ref()` proxifies the entire tree → Vue reactivity tracker walks all properties on every access → game loop slows to ~5fps in dev. **Verify in jsdom test:** source regex match `shallowRef` (NOT `ref(`) for game variable.

- **DO NOT** call `game.destroy(true, true)` (`noReturn=true`). This destroys core plugin registry. Next `new Phaser.Game()` will fail or behave unexpectedly. The default `noReturn=false` (or explicit per PHA-02) is correct.

- **DO NOT** put SpaceScene logic inside `setup()` of Chapter6Content.vue. Phaser scene is a JS class extending `Phaser.Scene` — it must live in its own module (`src/phaser/SpaceScene.js`) so the bundle splitter sees the import in the factory only.

- **DO NOT** mount the canvas to a parent element by `id` string. Pattern 1 uses `parent: parentEl` (DOM node ref). Using `parent: 'game-container'` (string) requires Phaser to `document.getElementById()` after mount — race condition with Vue's ref binding.

- **DO NOT** use Phaser physics. `physics: { default: 'none' }` is explicit in Pattern 1 config. Adds ~30KB to bundle for unused systems.

- **DO NOT** initialize i18n inside SpaceScene. Use the singleton import. Creating a new i18n instance breaks locale sync with Vue.

- **DO NOT** use `EventBus` singleton (template oficial pattern) — use `game.events` directly. EventBus survives `game.destroy()` and orphans Vue listeners on re-entry. `game.events` is destroyed automatically.

- **DO NOT** capture `wheel` or `touchmove` events on the canvas. Phaser default doesn't (it captures `pointerdown/up/move`), but if the planner adds custom input plugins, ensure none preventDefault on scroll-related events — would break the scroll-snap of the document (D5-02 mandate).

- **DO NOT** generate planet sprites with character animation. Pixelforge `forge_animation` produces incoherent frames (CLAUDE.md §6.4). `forge_sprite` for static idle planet is correct.

- **DO NOT** use Phaser `<marquee>`-equivalent for the mantra. Mantra MUST be HTML/Vue (D5-03) — better i18n, screen reader access, font crispness.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resize observation | Custom `window.addEventListener('resize')` + debounce | `useResizeObserver` from `@vueuse/core` (Pattern 4) | Cleanup, throttle, dvh handling — vueuse already does it. Already in project. |
| Pointer events (mouse + touch normalization) | Custom listeners on canvas | Phaser `setInteractive() + pointerdown/over/out` (Pattern 6) | Phaser's Input Manager handles touch + mouse unification + multi-touch. |
| Camera tweens | Manual `requestAnimationFrame` + lerp | `this.tweens.add({ targets: this.cameras.main, ... })` (Pattern 7) | Phaser's Tweens manager handles easing, pause/resume on scene shutdown, PRM-compatible `timeScale=0`. |
| Locale-aware text in canvas | Custom translation lookups + manual re-render | vue-i18n `i18n.global.t()` + bridge event (Pattern 5, 13) | Singleton already exists; bridge is 3 LOC; no parallel translation system. |
| Focus trap in modal | Custom keydown + manual tabindex shuffling | Pattern 10 (manual ~30 LOC) OR `@vueuse/integrations` `useFocusTrap` | Manual is simple if scope is small (4-5 focusables). useFocusTrap if pulls focus-trap (8KB) which may be overkill. Planner decides. |
| HMR cleanup | Manual `window.addEventListener('beforeunload')` | `import.meta.hot.dispose()` (Pattern 1) | Vite-native, fires before module replacement (not before page unload). Correct lifecycle hook. |
| Project lookup by id | Custom getter on `projects.js` | `projects.find(p => p.id === activeProject)` inline computed (D3-04 inline-joins pattern) | No helpers — Phase 3 D3-04 locked. |
| Integer scale math | Custom Math.min + Math.floor every render | Compute once at game create + on resize (Pattern 3, 4) | Performance — recompute only when viewport changes, not 60fps. |
| Image loading state UI | Custom loading spinner inside canvas | NO spinner — preload happens fast (~200ms typical); if >800ms, show mantra prematurely or HTML dot pulser (D5 Claude's discretion) | Anti-pattern documented in PROJECT.md. |
| Class-based modal management | Pinia/Vuex state for activeProject | Local `ref(null)` in Chapter6Content.vue (Pattern 1) | Single-component scope; Pinia is out-of-scope (REQUIREMENTS.md). |

**Key insight:** Phaser is a full game framework. **Use its APIs first.** Don't reimplement tweens, input handling, scaling, or event emitters in JS land — they exist, are tested, and integrate with the game loop. Phase 5 is mostly about **adapter** code (lazy import, lifecycle, bridge events, focus trap, overlay component) — the in-canvas logic is mostly out-of-the-box Phaser idioms.

---

## Runtime State Inventory

> Phase 5 is **mostly greenfield** (adds new files). Few rename/refactor concerns, but a couple of audit-worthy items.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by inspection of `src/data/*.js` (no DB, no localStorage keys reference "phaser" or "ch6"). `portfolio.locale` localStorage key (Phase 2) is locale-agnostic. | None |
| Live service config | None — there is no external service deployment yet. Phase 6 will configure Firebase Hosting; ch6 assets are static `public/assets/*`. | None |
| OS-registered state | None — no Windows Task Scheduler, no pm2, no launchd entries referencing this project. | None |
| Secrets/env vars | `GEMINI_API_KEY` (used by pixelforge-mcp). Phase 5 needs it active for asset generation. NOT a rename — same key, same name. Verified env via CLAUDE.md §4.2. | Confirm `echo $env:GEMINI_API_KEY` returns key before W2 asset generation. |
| Build artifacts | `node_modules/phaser/` will be reinstalled if `npm ci` from clean. If Rafael ran `npm update` recently, Phaser might be on a newer 3.x minor than 3.86.0 — verify with `npm ls phaser`. | Run `npm ls phaser` at the start of plan to log the actual installed minor. Update if needed. |

**Phase 5 introduces NEW state, doesn't refactor:** new directories (`src/phaser/`), new components (`Chapter6Content`, `PhaserChapter` if separated, `ProjectOverlay`), new assets (`public/assets/ch6-*.png`), new data items (3 projects in `projects.js`), new i18n keys. Nothing renamed.

**One audit-worthy detail — legacy `src/scenes/` references:** `dev-vue3-phaser.md` skill references `src/scenes/ParallaxScene.js` (legacy scaffold pattern). Phase 5 introduces `src/phaser/` instead. The skill doc could mislead future agents. **Recommendation:** Plan a task to update `dev-vue3-phaser.md` after Phase 5 execution to reflect actual structure (W5 Polish wave).

---

## Common Pitfalls

### Pitfall 1: Reactive Game Object — Game Loop Slowdown
**What goes wrong:** Using `ref(new Phaser.Game(...))` or `reactive({ game })` causes Vue to proxify the entire Phaser game tree (scene → systems → cameras → all GameObjects). Every property access in Phaser's 60fps loop triggers Vue's reactivity tracker → ~5fps in dev, possibly broken in prod.
**Why it happens:** Vue 3 default reactivity is deep; `ref(obj)` wraps with `Proxy` recursively for nested objects on access.
**How to avoid:** Use `shallowRef(game)` (PHA-01 locked). `shallowRef` only reactivizes `.value` top-level — assigning `game.value = new Phaser.Game(...)` triggers component re-render once, but Phaser internals are NOT proxified.
**Warning signs:** Dev tools show "thousands of triggered effects" per second; Vue DevTools shows the game tree as a giant proxied object; fps drops dramatically.

### Pitfall 2: Watcher Fires Before Canvas DOM Ref Exists
**What goes wrong:** `watch(activeChapter, ..., { immediate: true })` fires synchronously during component setup. If the template hasn't mounted yet, `canvasHostRef.value === null` → `new Phaser.Game({ parent: null })` fails silently or errors.
**Why it happens:** Vue setup runs before mount.
**How to avoid:** Add `flush: 'post'` to the watch options (runs after DOM update) AND defensive `await nextTick()` inside the handler if needed. Pattern 1 source applies both.
**Warning signs:** Console error "Phaser cannot append canvas to null parent" or empty canvas; works on second activeChapter change but not initial mount with `?ch=6` deep-link.

### Pitfall 3: HMR Accumulates Game Instances in Dev
**What goes wrong:** Edit `SpaceScene.js` → Vite HMR reloads the module → new game instance created → old instance still has its canvas in DOM + still running its loop. After 5 edits: 5 ghost games, browser fps drops.
**Why it happens:** Default Vite HMR replaces the module's exports without calling lifecycle cleanup of importers.
**How to avoid:** Add the `import.meta.hot.dispose()` block in Chapter6Content.vue (Pattern 1). Calls `game.destroy(true, false)` before the new module version takes effect.
**Warning signs:** Multiple `<canvas>` elements in DOM inspector; fps degradation after dev edits; only fixes after full page reload.

### Pitfall 4: `destroy(true, true)` Breaks Re-Entry
**What goes wrong:** Using `noReturn=true` destroys core plugin registry. The next `new Phaser.Game()` fails or behaves oddly because plugins (loader, tweens, animation manager) are gone.
**Why it happens:** Phaser docs document `noReturn` poorly; defaults to false but devs often copy code that uses `true`.
**How to avoid:** Always `destroy(true, false)` (PHA-02 explicit). Verify via source-level test.
**Warning signs:** Second visit to ch6 shows empty canvas; console error about missing plugins; "this.add is not a function" in SpaceScene.create().

### Pitfall 5: Locale Toggle While in ch6 — Tooltips Show Old Language
**What goes wrong:** Rafael toggles ES↔EN while a tooltip is visible. Tooltip stays in the previous language because `setText` was set once on pointerover.
**Why it happens:** Tooltips are static Phaser.Text objects — they don't re-translate themselves.
**How to avoid:** Pattern 5's `handleLocaleChange` callback iterates all tooltipTexts and re-translates VISIBLE ones. Hidden tooltips will re-translate naturally on next pointerover.
**Warning signs:** Rafael reports tooltip says "AR/VR own" in ES mode or "Empresa propia AR/VR" in EN mode after toggle.

### Pitfall 6: Canvas Captures Wheel/Touch — Breaks Scroll-Snap
**What goes wrong:** Phaser scene calls `this.input.mouse.preventDefaultWheel = true` (or similar default) → wheel events don't bubble → user can't scroll OUT of ch6.
**Why it happens:** Phaser's default Input Manager behavior on some configurations.
**How to avoid:** D5-02 mandates "no scroll capture". Verify in SpaceScene.create() that NO `this.input.mouse.preventDefault*` calls are made. Phaser default for `pointerdown` is non-preventing — should be OK without intervention, but verify in test.
**Warning signs:** User scrolls down to ch6, then can't scroll up — must click ch5 tick in StickyTimeline.

### Pitfall 7: HiDPI Blur — pixelArt:true Not Enough Without CSS pixelated
**What goes wrong:** Phaser renders pixel-perfect internally (nearest-neighbor), but the canvas is upscaled by the browser to the device pixel ratio with default smoothing → visible blur on Retina.
**Why it happens:** Phaser controls the GPU/canvas internal pipeline; CSS controls the display upscaling separately.
**How to avoid:** index.html ALREADY has global `image-rendering: pixelated` for `canvas, img` (CLAUDE.md §1). Verify it applies to the Phaser canvas (no scoped overrides in Chapter6Content's `<style scoped>`).
**Warning signs:** Pixel art looks crisp at 100% browser zoom but blurry at 125% / Retina display; sprites have soft edges only on certain devices.

### Pitfall 8: ResizeObserver Fires During Mount — Infinite Loop
**What goes wrong:** Rare but real — `useResizeObserver(document.documentElement)` fires once at mount, computes new zoom, calls `game.scale.setZoom()` which triggers a canvas re-layout which fires another resize observation → loop.
**Why it happens:** Observers re-fire when observed element's box changes due to actions taken in the callback.
**How to avoid:** Check `newZoom !== game.value.scale.zoom` BEFORE calling `setZoom()` (Pattern 4 source). The early return breaks the loop.
**Warning signs:** Console error "ResizeObserver loop completed with undelivered notifications"; canvas flickers on mount.

### Pitfall 9: Pixelforge Generates `ch6-bg.png` with Internal Transparency
**What goes wrong:** Used `forge_sprite` instead of `forge_background` for the full-frame bg → bg removal step left transparent gaps → starfield is patchy.
**Why it happens:** Common confusion documented in CLAUDE.md §6.3.
**How to avoid:** `forge_background` for opaque full-frame (no alpha needed). `forge_sprite` only for planet/ship sprites with transparency.
**Warning signs:** ch6-bg.png shows as patchy when viewed on a colored background; PNG file has "RGBA" channel mode despite no transparency needed.

### Pitfall 10: Pixelforge `background:"black"` Fails Bg Removal on Sprites
**What goes wrong:** Generated planet sprite with `background: "black"` → bg removal step ignored Gemini's actual generated bg color → got white halo around planet.
**Why it happens:** Documented in CLAUDE.md §6.2. Gemini doesn't respect literal color names "black"/"white".
**How to avoid:** Use preset names: `"night"`, `"sky"`, `"ocean"` etc. For synthwave: `"night"` (= `#0A0A2E`) maps closest to deep purple `#1a0e3d`.
**Warning signs:** Sprite has visible rectangular halo; alpha channel in PNG is mostly opaque white with the planet inside.

### Pitfall 11: Asset Naming Convention Drift
**What goes wrong:** Committed `ch6-spaceship-1.png` (descriptor "spaceship") instead of `ch6-ship-1.png` (Phase 5 spec). `tests/assets/asset-naming.test.js` enum doesn't include "spaceship" → test fails.
**Why it happens:** Phase 4 W0 test was scoped to ch0-ch5 assets. Phase 5 must EXTEND the enum to include ch6-bg, ch6-planet-*, ch6-ship-*. If extension is forgotten or done incorrectly, asset additions fail T1.
**How to avoid:** First task in Phase 5 asset generation wave: extend `tests/assets/asset-naming.test.js` regex enum BEFORE generating assets. Test goes red intentionally → assets get generated with correct names → test goes green.
**Warning signs:** T1 fails after `art()` commit; offender list shows the new asset name.

### Pitfall 12: Phase 6 Asset Size Blocker — ch6-bg.png > 80KB
**What goes wrong:** `forge_background` outputs JPEG-quality PNG ~300-500KB. Deploy bundle becomes Phase 6 blocker (cumulative budget exceeded).
**Why it happens:** Default pixelforge resolution + PNG compression leaves room. STATE.md "Deferred Items > Polish — Phase 4 Backgrounds downscale ≤80KB cumulative ~1.65MB" already documents the issue for ch2/ch4/ch5; ch6 inherits.
**How to avoid:** Apply `optimize_sprite` (nearest-neighbor downscale to exact size) + Adobe MCP `image_crop_and_resize` to target dimensions. For ch6-bg (480×270 base × zoom 3 = 1440×810 final), reasonable target ≤80KB. **Consider JPG instead of PNG** for the bg: full-frame opaque, no alpha needed, gradient compresses better as JPG. (ch2-bg.jpg and ch5-hero.jpg already use JPG — D4-W2-01.)
**Warning signs:** Asset size > 80KB; cumulative budget tracked in `05-MANUAL-CHECKLIST`.

### Pitfall 13: Chapter Overlap Bug Reproduces in ch6 (Phase 4 Deferred)
**What goes wrong:** Phase 4 bug: scrolling forward past ch3 leaves prior chapters visible overlaid on current. If ch6 with full-bleed canvas + `position: relative + overflow: hidden` triggers same stacking context issue, the `<ProjectOverlay>` shows over a ghost ch5 visible.
**Why it happens:** Hypothesized cause in STATE.md — `position: relative + overflow: hidden` on `.chN-layout` creates stacking context that doesn't fully release during scroll-snap transition.
**How to avoid (mitigation — NOT fix):** Avoid `overflow: hidden` on `.ch6-layout` (canvas content doesn't escape — no need to clip). Test with Pattern 12 architectural test. **Document findings in W5 checklist:** if bug reproduces in ch6, capture screenshot and update STATE.md deferred item with reproduction confidence. If bug DOES NOT reproduce in ch6 (different layout), that's a useful datapoint for root cause analysis.
**Warning signs:** Visual artifact during scroll from ch5 → ch6; previous chapter visible through canvas; only fixes on snap completion.

### Pitfall 14: Phaser 4.x Auto-Upgrade During npm install
**What goes wrong:** Rafael runs `npm install some-other-pkg` and `phaser` resolves to 4.1.0 because of `latest` dist-tag, breaking everything.
**Why it happens:** `package.json: "phaser": "^3.86.0"` is safe (caret blocks major upgrade), BUT if Rafael edits to `"^4.0.0"` or runs `npm install phaser@latest` it jumps to 4.x. The package-lock.json should pin exact resolution.
**How to avoid:** Verify `package-lock.json` has phaser resolved to 3.86.x range. If not, `npm install phaser@^3.86.0` to lock. Add explicit version note in 05-PLAN documentation.
**Warning signs:** `npm ls phaser` shows 4.x; Phaser API errors in console (e.g., changed scene init signature in v4).

---

## Asset Pipeline Concretions

### Required Assets (8 worst-case, 6 best-case)

Naming convention enforced by `tests/assets/asset-naming.test.js` (extends regex enum):

```js
// Phase 5 additions to regex enum (must be done in W2 BEFORE generation):
/^ch[0-6]-(bust|bg|bg-stars-far|bg-planet-mid|fg-panels|fg-ships|hero|bg-nebulae-mid|planet-ar-vr|planet-remoose|planet-software-mind|ship-1|ship-2)\.(png|jpg)$/
```

### Asset 1: `ch6-bg.png` (or `.jpg`)

**Tool:** `forge_background` (NOT forge_sprite — opaque full-frame, no alpha)
**Dimensions:** 480×270 base × zoom 3 = export 1440×810
**Target size:** ≤80KB (Phase 6 budget; consider JPG)

**Prompt template:**

```
forge_background({
  description: "lo-fi synthwave pixel art deep space background, vertical gradient from deep purple (#1a0e3d) at top to electric cyan (#4dffff) at bottom, with subtle scattered stars and faint nebulae clouds, vaporwave aesthetic, no characters, no text, no UI elements, smooth gradient with grain, pixel art 16-bit style, no outlines",
  outputPath: "public/assets/ch6-bg.png",
  aspect: "16:9",
  palette: ["#1a0e3d", "#ff3ca6", "#4dffff", "#ffd95c", "#0a061f"]
})
```

**Adobe MCP post-process (if needed):**

```
image_crop_and_resize(target: 1440x810, mode: "fit")
```

**Optimize:**

```
optimize_sprite(inputPath: ..., size: "1440x810", outputPath: same)
```

**Final verification:** size ≤80KB, no internal transparency (cat -X check), visible gradient + stars.

### Asset 2: `ch6-bg-stars-far.png` (optional, if 3-layer parallax chosen)

**Tool:** `forge_background`
**Dimensions:** 480×270 base, designed to TILE vertically (will be displayed 4× tall to cover camera descent)
**Target size:** ≤50KB

**Prompt template:**

```
forge_background({
  description: "lo-fi pixel art star field, deep space background with tiny scattered white and cyan stars, transparent dark purple void background (#0a061f), seamless vertical tile, no horizon, no objects, very sparse stars (about 30-50 dots), pixel art style, no outlines",
  outputPath: "public/assets/ch6-bg-stars-far.png",
  aspect: "16:9",
  palette: ["#0a061f", "#4dffff", "#ffd95c", "#ffffff"]
})
```

**Caveat:** "transparent dark purple void" — `forge_background` outputs opaque. Si necesitas transparencia (para layering), generar dos pasadas: (a) starfield over neutral bg with `forge_background`, (b) use Adobe MCP `image_remove_background` masking only the dark purple → leaves stars on alpha. **Alternativa más simple:** opaque starfield + render con `setBlendMode(Phaser.BlendModes.ADD)` en Phaser para que se "sume" sobre la capa más lejana — pixel-perfect synthwave glow.

### Asset 3: `ch6-bg-nebulae-mid.png` (optional, if 3-layer chosen)

**Tool:** `forge_background`
**Dimensions:** 480×270, tile vertically
**Target size:** ≤60KB

**Prompt template:**

```
forge_background({
  description: "lo-fi synthwave pixel art nebulae cloud, soft pink (#ff3ca6) and cyan (#4dffff) volumetric clouds floating in deep purple void, ethereal vaporwave aesthetic, low contrast, drifting fog, pixel art 16-bit, no defined edges, no outlines",
  outputPath: "public/assets/ch6-bg-nebulae-mid.png",
  aspect: "16:9",
  palette: ["#1a0e3d", "#ff3ca6", "#4dffff"]
})
```

**Phaser usage:** `setBlendMode(Phaser.BlendModes.SCREEN)` to additive-blend on top of stars layer.

### Asset 4-6: `ch6-planet-{ar-vr,remoose,software-mind}.png`

**Tool:** `forge_sprite` (with bg removal)
**Dimensions:** 96×96 base × zoom 3 = export 288×288
**Target size:** ≤30KB each

**Prompt templates (one per planet — distinct halo color):**

```
forge_sprite({
  description: "pixel art neon-orb planet, glowing electric cyan (#4dffff) circular halo around a solid purple sphere (#1a0e3d), abstract synthwave aesthetic, no atmospheric details, no continents, no rings, simple circular shape with bright halo glow, vaporwave style, 16-bit pixel art, no outlines",
  outputPath: "public/assets/ch6-planet-ar-vr.png",
  background: "night",     // PRESET — NOT "black" (Pitfall 10)
  size: "96x96",
  palette: ["#1a0e3d", "#4dffff", "#ff3ca6"]
})

// Repeat for remoose (pink halo accent):
description: "... glowing hot pink (#ff3ca6) circular halo ..."

// Repeat for software-mind (amber halo accent, slightly larger/more luminous for "convergence" cierre narrativo):
description: "... glowing soft amber (#ffd95c) and cyan circular halo, slightly larger and more vibrant than other planets, AI-themed pulsating glow ..."
```

**Adobe MCP post:**

```
image_remove_background  // if pixelforge alpha is unclean
image_crop_and_resize(target: 288x288, mode: "exact")
```

**Verify:** PNG has alpha channel; halo bleeds slightly past the sprite bounding box (don't crop too tight); planet diameter ~80px within 96px frame (16px padding for halo glow).

### Asset 7-8: `ch6-ship-{1,2}.png`

**Tool:** `forge_sprite` (with bg removal)
**Dimensions:** 32×24 base × zoom 3 = export 96×72
**Target size:** ≤15KB each

**Prompt templates:**

```
forge_sprite({
  description: "small abstract pixel art spaceship, glitchy neural design, neon cyan (#4dffff) and pink (#ff3ca6) accents, no realistic spacecraft details, fragmented geometric shapes, low-fi AI synthwave aesthetic, 16-bit pixel art, simple silhouette facing right, no engine trail",
  outputPath: "public/assets/ch6-ship-1.png",
  background: "night",
  size: "32x24",
  palette: ["#4dffff", "#ff3ca6", "#1a0e3d"]
})

// Ship 2: mirrored variant or slightly different geometry
description: "... facing right, different geometry from ship-1 (more triangular), with subtle digital glitch artifacts ..."
```

**Phaser usage:** `setFlipX(true)` on ship 2 to make it face left during right-to-left loop.

### Asset Generation Order (W2)

1. **Extend `tests/assets/asset-naming.test.js`** regex enum FIRST (test goes red).
2. **Generate `ch6-bg.png`** (largest, most important — sets vibe).
3. **Visual review:** Rafael ratifies bg matches synthwave vibe before generating planets (avoid wasted regenerations).
4. **Generate 3 planet sprites** with consistent halo style (one prompt template, one planet at a time).
5. **Generate 2 ship sprites.**
6. **Adobe MCP post-process** any sprite needing cleaner alpha.
7. **Run `optimize_sprite`** on all to nearest-neighbor target size.
8. **Verify size budget** (cumulative ≤500KB for ch6 — sub-budget within Phase 6's ≤1.65MB overall).
9. **Asset naming test** goes green.
10. **Commit:** `art(05-XX): generate ch6 synthwave assets (bg + 3 planets + 2 ships)`.

### Seed/locking for consistency

Pixelforge does **not** expose `seed` parameter in current MCP schema. Regenerations are stochastic. **Mitigation:** generate each planet ONE AT A TIME with explicit palette + "neon-orb glowing halo" descriptor pattern. If Rafael wants to refresh one planet, regenerate just that planet with same prompt — visual style is constrained enough by palette + descriptor that stochasticity is bounded.

[LOW confidence: stochasticity bound is not strictly verifiable without empirical testing — observed in Phase 4 generation that planet sprites varied 20-30% between generations even with same prompt + palette. Plan should include a "regenerate budget" of 1-2 retries per asset.]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Phaser.Game` in `ref()` with deep proxy | `shallowRef(Phaser.Game)` | Best practice since Vue 3 (2020); Phaser community converged ~2022 | game loop runs at native 60fps |
| Manual `window.addEventListener('resize')` + debounce | `useResizeObserver` from `@vueuse/core` | Vue 3 ecosystem standard since 2021 | Less boilerplate, automatic cleanup |
| Static i18n via `app.config.globalProperties.$t` (Options API) | `useI18n()` composable + `i18n.global.t()` singleton (vue-i18n 9+, mandatory in v11 with `legacy: false`) | vue-i18n v9 (2021), v11 enforces `legacy: false` | Composition API native, works in JS modules (e.g., Phaser scenes) |
| Webpack require() lazy-load | `import()` dynamic import (ES2020 spec) + Vite chunk splitting | Vite 4+ (2023) | Native browser ES modules, no bundler wrapper |
| Vue Router `<RouterView>` per page | scroll-snap section v-for + `watch(activeChapter)` lifecycle | Per-project — pivote 2026-05-12 (STATE.md) | NO Vue Router (out-of-scope per REQUIREMENTS.md) |
| Sticky overlays via Vue Teleport | Local component with `position: fixed; z-index: 50` (D5-07 ProjectOverlay) | Phase 5 ch6 uses local fixed positioning | Simpler — modal lives in normal DOM tree, ESC/focus handled inline |
| Pinia for cross-component state | provide/inject + local refs (`activeProject = ref(null)`) | Per-project (REQUIREMENTS.md OUT OF SCOPE) | Less indirection; sufficient for single-flag scope |
| Phaser 2 (deprecated) | Phaser 3.86 (current 3.x) | Phaser 3.0 released 2018; project chose 3.86 in scaffold | Modern API, WebGL2 support |

**Deprecated/outdated:**

- **Phaser CE (Community Edition)** — fork of Phaser 2, no longer maintained. NOT used here.
- **`vue-i18n` legacy mode** — `legacy: true` flag deprecated in v11. Phase 2 uses `legacy: false` (D2-09).
- **`document.title = ...` direct mutation for locale-aware titles** — Phase 3 uses `@unhead/vue`. Phase 5 doesn't touch titles (canvas chapter, no per-chapter SEO meta beyond initial landing).
- **`window.addEventListener('orientationchange')`** — replaced by `useResizeObserver(document.documentElement)` (Phase 1 D-MOB-03 carry-forward).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite build + tests | ✓ (assumed — Phases 1-4 ran) | (Rafael's existing) | — |
| npm | Package management | ✓ | (existing) | — |
| Phaser 3.86 | Game engine (PHA-*) | ✓ (in package.json `^3.86.0`) | 3.86.x range | None — required |
| Vue 3.5 | Framework | ✓ | 3.5.x | — |
| Vite 5 | Build + HMR + dynamic imports | ✓ | 5.4.x | — |
| Vitest 4 | Test runner | ✓ | 4.1.6 | — |
| jsdom 29 | Test environment for Vue components | ✓ | 29.1.1 | — |
| `@vueuse/core` 14.3 | useResizeObserver + usePreferredReducedMotion | ✓ | 14.3.0 | — |
| `vue-i18n` 11 | i18n bridge | ✓ | 11.4.2 | — |
| pixelforge-mcp | Asset generation | ✓ (per CLAUDE.md §4 + STATE.md) | (heredado Phase 4 funcional) | If fails: Rafael provides hand-drawn pixel art OR skip ch6 asset generation, use placeholder colored circles in Phaser (`Graphics.fillCircle`) — degrades vibe but unblocks code execution. |
| Adobe MCP | Asset post-process | ✓ (per CLAUDE.md §5) | (heredado Phase 4 funcional) | If fails: skip Adobe post-process steps. Pixelforge raw output may have unclean alpha — visual quality degraded but not blocking. |
| `GEMINI_API_KEY` env var | pixelforge backend | ✓ (assumed — Phase 4 W0-W4 used it) | — | If revoked: see CLAUDE.md §4.2 reinstall flow. |
| `focus-trap` (peer of `@vueuse/integrations`) | Optional for ProjectOverlay D5-07 focus trap | ✗ (not installed) | — | Manual focus trap ~30 LOC (Pattern 10). Recommended fallback to manual unless plan-phase decides extra dep justified. |
| Hardware iOS device | iOS smoke test confirmatorio | ✗ (per Memory `rafael-no-ios-device`) | — | Plan 07 Phase 1 already deferred. Phase 5 mitigations preventive only (matches D4 pattern). |

**Missing dependencies with no fallback:**
- None — all hard requirements available.

**Missing dependencies with fallback:**
- `focus-trap`: planner decides if to install or use manual implementation.
- iOS smoke: deferred globally, not Phase 5-specific.

---

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 + jsdom 29.1.1 + `@vue/test-utils` 2.4.10 |
| Config file | `vitest.config.js` (jsdom env, globals true, setup `./tests/setup.js`) |
| Quick run command | `npm run test:run -- tests/components/Chapter6Content.test.js` (single file) |
| Full suite command | `npm run test:run` |
| Per-task target | <5s for single-file test; <30s for suite during dev |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PHA-01 | `shallowRef(game)` used, not `ref()` | unit (source-level regex) | `npm run test:run -- tests/phaser/space-scene-shape.test.js` | ❌ Wave 0 |
| PHA-02 | `destroy(true, false)` called in `onBeforeUnmount` + HMR dispose | unit (source-level regex + mount/unmount mock) | `npm run test:run -- tests/components/Chapter6Content.test.js` | ❌ Wave 0 |
| PHA-03 | `Phaser.Scale.NONE` + `Math.floor` zoom math present in factory | unit (source-level regex) | `npm run test:run -- tests/phaser/space-scene-shape.test.js` | ❌ Wave 0 |
| PHA-04 | Phaser imported with `await import('phaser')` or `await import('@/phaser')`, NOT top-level | unit (source-level regex) | `npm run test:run -- tests/components/Chapter6Content.test.js` | ❌ Wave 0 |
| PHA-05 | SpaceScene file exists; mentions 3 planets + 2 ships + camera scrollY tween | unit (source-level regex) | `npm run test:run -- tests/phaser/space-scene-shape.test.js` | ❌ Wave 0 |
| PHA-06 | Vue watch on locale emits `locale-changed`; scene mentions listener for it | unit (source-level regex) | `npm run test:run -- tests/phaser/space-scene-shape.test.js` | ❌ Wave 0 |
| PHA-07 | Planet click emits `vue:show-project`; Vue listens via `game.events.on` | unit (source-level regex on both files) | `npm run test:run -- tests/components/Chapter6Content.test.js` + `tests/phaser/space-scene-shape.test.js` | ❌ Wave 0 |
| PHA-08 | NO `spritesheet` keyword nor `anims.create` in SpaceScene (verifies no character animation) | unit (source-level regex negative) | `npm run test:run -- tests/phaser/space-scene-shape.test.js` | ❌ Wave 0 |
| PHA-09 | `useResizeObserver(document.documentElement)` present in Chapter6Content | unit (source-level regex) | `npm run test:run -- tests/components/Chapter6Content.test.js` | ❌ Wave 0 |
| CON-04 | Mantra i18n keys exist in both ES/EN | unit (i18n parity already covers) | `npm run test:run -- tests/i18n/parity.test.js` | ✅ (will extend automatically) |
| ART-04 / ART-05 | Asset names match Phase 5 enum regex; 6-8 ch6-* assets exist | unit (extends `tests/assets/asset-naming.test.js`) | `npm run test:run -- tests/assets/asset-naming.test.js` | ✅ (extend regex) |
| ART-06 | `chapters[6].palette` length >= 4 + matches synthwave hex | unit | `npm run test:run -- tests/data/chapters.test.js` | ✅ (extend assertion) |
| A11Y-05 | PRM branch present in Chapter6Content + SpaceScene + mantra CSS | unit (source-level regex) | `npm run test:run -- tests/components/Chapter6Content.test.js` + `tests/styles/...` | ❌ Wave 0 |
| A11Y-06 | If alt-text needed (canvas has aria-hidden — likely N/A for canvas; mantra has no img) | manual (no img alt-text relevant for canvas) | W5 manual checklist | — |
| D5-09 | Chapter overlap defensive test: `.ch6-layout` does NOT have `overflow: hidden` (mitigation) | unit (source-level regex on Chapter6Content `<style scoped>`) | `npm run test:run -- tests/components/Chapter6Content.test.js` | ❌ Wave 0 |
| D5-11 | Watch pattern uses `import('@/phaser')` lazily | unit | Same as PHA-04 | ❌ Wave 0 |
| Smoke visual | Arrival cinematográfico, planet click, mantra fade, overlay synthwave, naves loop | manual | `05-MANUAL-CHECKLIST.md` (W5) | manual — Rafael executes |

### Sampling Rate

- **Per task commit:** `npm run test:run -- <specific-file>` (~5s).
- **Per wave merge:** `npm run test:run` (~30-60s — ~250 tests post-Phase 5).
- **Phase gate:** Full suite green + manual checklist signed before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `tests/components/Chapter6Content.test.js` — mount/unmount lifecycle, lazy import, destroy call, HMR dispose, PRM branch, resize observer, click bridge listener registration
- [ ] `tests/components/ProjectOverlay.test.js` — ESC closes, click-outside closes, focus trap, restore focus, i18n labels, PRM instant render branch, mobile fullscreen
- [ ] `tests/phaser/space-scene-shape.test.js` — source-level regex match: shallowRef, destroy(true,false), Scale.NONE, Math.floor, no spritesheet, locale-changed listener, vue:show-project emit, 3 planets, 2 ships, camera tween
- [ ] `tests/components/ScrollShell.theme-isolation-phase5.test.js` — extiende isolation test a ch6 (no font/color bleed from ch5; canvas does not cover sticky elements)
- [ ] No new test infrastructure needed — vitest + jsdom + @vue/test-utils already set up

*(No framework install needed — existing test infrastructure covers all phase requirements. Phase 5 only adds new test files in existing categories.)*

### Phaser-specific testing caveat

jsdom does **NOT** implement WebGL or full Canvas2D rendering. Tests of `SpaceScene.create()` body that try to render sprites will fail (jsdom-mocked WebGL returns null context). **Strategy:** Phase 5 tests verify **shape** (source regex), **lifecycle** (mount/unmount Vue assertions), and **bridge** (event emit/listen call expectations using `vi.spyOn(game.events, 'emit')` with a mocked game). Actual sprite/tween rendering is verified manually in W5 visual checklist. This is the same pattern Phase 4 used for ParallaxLayers (also no real rendering in jsdom).

---

## Code Examples

### Common Operation 1: Mount Phaser game lazily on activeChapter watch (Pattern 1 verbatim)

```js
// src/components/Chapter6Content.vue setup
watch(activeChapter, async (v) => {
  if (v === 6 && !game.value) {
    if (!canvasHostRef.value) await nextTick()
    const { createGame } = await import('@/phaser')
    game.value = createGame(canvasHostRef.value, { prefersReduced: prefersReduced.value })
    game.value.events.on('vue:show-project', (id) => { activeProject.value = id })
    game.value.events.on('vue:arrival-complete', () => { arrivalDone.value = true })
  } else if (v !== 6 && game.value) {
    game.value.destroy(true, false)
    game.value = null
    arrivalDone.value = false
    activeProject.value = null
  }
}, { immediate: true, flush: 'post' })

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.value?.destroy(true, false)
    game.value = null
  })
}
```

### Common Operation 2: Create planets with interactive hit area (Pattern 6 verbatim)

```js
// src/phaser/SpaceScene.js create()
this.projectsData.forEach((proj, idx) => {
  const planet = this.add.sprite(240, proj.planetOrbit * ARRIVAL_DESCENT + 135, 'ch6-planet-' + proj.id.replace('ch6-', ''))
  planet.setScrollFactor(1.0)
  planet.setInteractive(
    new Phaser.Geom.Circle(planet.width / 2, planet.height / 2, planet.width / 2 + 16),
    Phaser.Geom.Circle.Contains
  )
  planet.on('pointerover', () => {
    if (!this.sys.game.device.input.touch) this.input.setDefaultCursor('pointer')
  })
  planet.on('pointerout', () => this.input.setDefaultCursor('default'))
  planet.on('pointerdown', () => {
    this.game.events.emit('vue:show-project', proj.id)
  })
})
```

### Common Operation 3: Integer scale zoom on resize (Pattern 4 verbatim)

```js
// src/components/Chapter6Content.vue
useResizeObserver(document.documentElement, () => {
  if (!game.value) return
  const newZoom = Math.min(
    Math.floor(window.innerWidth / 480),
    Math.floor(window.innerHeight / 270)
  ) || 1
  if (newZoom !== game.value.scale.zoom) {
    game.value.scale.setZoom(newZoom)
    game.value.events.emit('viewport-resized')
  }
})
```

### Common Operation 4: Locale bridge with safe defensive emit (Pattern 5 verbatim)

```js
// Vue side
watch(locale, (l) => {
  game.value?.events.emit('locale-changed', l)
})

// Phaser side (in SpaceScene.create())
this.game.events.on('locale-changed', (l) => {
  this.tooltipTexts.forEach(({ tooltip, titleKey }) => {
    if (tooltip.visible) tooltip.setText(i18n.global.t(titleKey))
  })
})

this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
  this.game.events.off('locale-changed')
})
```

### Common Operation 5: Source-level architectural test for shallowRef + destroy semantics

```js
// tests/components/Chapter6Content.test.js (selected assertions)
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const src = readFileSync('src/components/Chapter6Content.vue', 'utf8')

describe('Chapter6Content lifecycle architecture (PHA-01/02/04/09)', () => {
  it('PHA-01: uses shallowRef for game, NOT ref or reactive', () => {
    expect(src).toMatch(/shallowRef\s*\(/)
    expect(src).not.toMatch(/\bref\s*\(\s*new\s+Phaser/)  // not direct ref(new Phaser(...))
    expect(src).not.toMatch(/\breactive\s*\(.*game/)
  })

  it('PHA-02: destroy(true, false) with explicit second arg', () => {
    expect(src).toMatch(/\.destroy\s*\(\s*true\s*,\s*false\s*\)/)
  })

  it('PHA-04: Phaser imported dynamically, NOT top-level', () => {
    // Top-level: import Phaser from 'phaser' — should NOT match
    expect(src).not.toMatch(/^import\s+Phaser\s+from\s+['"]phaser['"]/m)
    // Dynamic: await import('@/phaser') or import('phaser') — SHOULD match
    expect(src).toMatch(/await\s+import\s*\(\s*['"]@?\/?phaser['"]?\s*\)/)
  })

  it('HMR dispose registered', () => {
    expect(src).toMatch(/import\.meta\.hot\?\.dispose|import\.meta\.hot\.dispose/)
  })

  it('PHA-09: useResizeObserver on document.documentElement', () => {
    expect(src).toMatch(/useResizeObserver\s*\(\s*document\.documentElement/)
  })

  it('D5-09 mitigation: .ch6-layout does NOT use overflow:hidden combined with position:relative', () => {
    // Scoped style check — if .ch6-layout has overflow: hidden, document as known risk
    // Goal: avoid the combo that may trigger chapter-overlap bug
    const styleBlock = src.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] || ''
    // Either no overflow:hidden, OR explicit comment justifying it
    // (Plan-phase decides exact form)
  })
})
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | [ASSUMED] Phaser 3.86 bundle gzipped is ~150KB (range 100-250KB observed in benchmarks). | Pattern 2 | If much larger (>300KB gzip), initial chunk concerns even with lazy-load; planner should measure post-build. |
| A2 | [ASSUMED] `forge_sprite` with `background: "night"` reliably enables clean alpha removal for synthwave-themed sprites with cyan/pink halos. Pattern tested in Phase 4 with different palettes; synthwave gradient may have different bg removal behavior. | Asset Pipeline Pitfall 10 | If `"night"` preset doesn't work for synthwave assets, fallback to `"sky"` or `"ocean"` preset; worst case Adobe MCP `image_remove_background` cleanup. |
| A3 | [ASSUMED] Chapter overlap bug (Phase 4 deferred) reproduces architecturally similarly in ch6. Hypothesis based on `position:relative + overflow:hidden` stacking context theory in STATE.md. Not empirically reproduced yet in ch6. | Pattern 12, Pitfall 13 | If bug doesn't reproduce in ch6, my mitigation (avoiding overflow:hidden) is unnecessary defensive. If it DOES reproduce, mitigation may be insufficient — root cause needs proper fix in Phase 5 follow-up. |
| A4 | [ASSUMED] Rafael's identification of 3 projects in D5-01 (AR/VR own, Remoose, Software Mind) is final. No second-guessing the selection. | User Constraints | Locked decision — not assumed. Removed from this log. |
| A5 | [ASSUMED] Mantra ES translation "Y siempre muestra una sonrisa" is acceptable to Rafael. D5-03 marks this for W5 ratification. | Pattern 11 | If Rafael wants different phrasing, change is trivial (single i18n key). Already a known checklist item, not a research assumption that needs separate confirmation. Removing. |
| A6 | [ASSUMED] `@vueuse/integrations` `useFocusTrap` adds ~8KB (focus-trap peer dep). Not verified against actual package size. | ProjectOverlay, Don't Hand-Roll | If larger (e.g., 20KB+), manual implementation strongly preferred. Planner can verify via `npm view @vueuse/integrations dist-size`. |
| A7 | [ASSUMED] HiDPI rendering with `pixelArt: true` + `roundPixels: true` + CSS `image-rendering: pixelated` produces pixel-perfect on Retina without additional `devicePixelRatio` math in zoom calc. Phaser 3.86 internally handles dPR. [VERIFIED partial: Phaser docs confirm; not empirically tested on Retina in this project yet.] | Pattern 3, Pitfall 7 | If Retina still shows blur, may need to multiply `zoom` by `window.devicePixelRatio` and adjust BASE_W/H accordingly. Mitigation: W5 manual checklist explicitly tests Retina device. |
| A8 | [ASSUMED] Pixelforge stochasticity for planet sprite generations is bounded by palette + descriptor consistency such that 1-2 regenerations per asset is sufficient. Based on Phase 4 observation. | Asset Pipeline | If unbounded variance, more regenerations needed; could blow out time budget for W2. Mitigation: budget 30min per asset (3 planets + 2 ships = 2.5h max for asset gen wave). |
| A9 | [ASSUMED] Asset budget ≤80KB for ch6-bg achievable via JPG + nearest-neighbor downscale (consistent with Phase 4 ch2-bg.jpg at 627KB → target reduction; Phase 4 deferred polish item documents this). | Pitfall 12, Pipeline | If unachievable for synthwave gradient + stars (JPG compression artifacts visible), may need to switch to WebP or accept >80KB. Worst case: Phase 6 deploy blocker carries over from ch2/4/5. |
| A10 | [ASSUMED] No regression risk to Phases 1-4 from inserting `<Chapter6Content>` in ScrollShell.vue. Pattern matches ch0-ch5 insertion exactly. | Integration Points | If insertion breaks ch5 or causes layout reflow, smoke checklist catches. Existing 240+ tests guard regressions. |

**Items needing explicit user confirmation in discuss-phase or W5:**
- A2 (synthwave bg removal preset) — may need empirical test
- A3 (chapter overlap reproduction in ch6) — manual W5 reproduction step
- A7 (Retina pixel-perfect) — manual W5 device test (Rafael has Retina display?)
- A8 (pixelforge variance budget) — anyone reviewing W2 should be aware

---

## Open Questions for Planner (RESOLVED)

> All 11 questions resolved during planning step 8 (2026-05-14). Decisions adopted per Recommendations below, with Q5 explicit override documented inline.

1. **Component split: `Chapter6Content.vue` only, OR + separate `PhaserChapter.vue`?**
   - What we know: D5-11 shows the watch pattern in Chapter6Content directly. Separating PhaserChapter would isolate the canvas+lifecycle from the overlay+mantra logic.
   - What's unclear: Is the separation worth the cross-component wiring (props + emits)? Phase 4 separated ParallaxLayers from Chapter4Content because parallax was reusable conceptually; ch6 Phaser is uniquely ch6.
   - Recommendation: Single `Chapter6Content.vue` for v1. Less indirection, fewer files. Split only if PhaserChapter becomes reusable in a future v2 chapter.
   - **RESOLVED:** Adopted recommendation — single `Chapter6Content.vue` (no separate `PhaserChapter.vue`). Codified in Plan 05-04 frontmatter `files_modified`.

2. **Tooltip styling in-Phaser: Text + Rectangle Container, OR custom sprite?**
   - What we know: Locked discretion in D5. Recommended `Phaser.GameObjects.Container` with `Rectangle` (bg) + `Text` (label).
   - What's unclear: Whether a custom sprite asset (pre-rendered tooltip background) would look more polished vs procedural. Custom sprite adds 1 more pixelforge generation.
   - Recommendation: Procedural Container — cyan rect + glow stroke + Text. Pixel-art consistency via `Phaser.Display.Color` palette tokens. 0 extra assets.
   - **RESOLVED:** Adopted recommendation — procedural `Phaser.GameObjects.Container` (Rectangle + Text). 0 extra pixelforge generations. Codified in Plan 05-03 Task 2.

3. **Manual focus trap (~30 LOC) vs `@vueuse/integrations` useFocusTrap (+`focus-trap` peer ~8KB)?**
   - What we know: Both work for D5-07. Manual is documented in Pattern 10.
   - What's unclear: How much variance the project has tolerated for adding deps (Phase 2 added 6 fontsource packages; package philosophy seems neutral).
   - Recommendation: Manual implementation — single overlay with 4-5 focusables, easy enough to write inline. Avoid dep churn. Plan can pivot to dep if implementation gets brittle.
   - **RESOLVED:** Adopted recommendation — manual focus trap (~30 LOC) over `@vueuse/integrations` useFocusTrap. Codified in Plan 05-05 Task 1 + Don't Hand-Roll §10 rationale.

4. **3-layer parallax (stars-far + nebulae-mid + bg) vs 1-layer simple bg?**
   - What we know: Recommended 3-layer. 1-layer is fallback if asset generation budget is tight.
   - What's unclear: Whether Rafael's "wow ~3-4s" arrival impression depends on multi-layer depth or single rich bg is sufficient.
   - Recommendation: Plan with 3-layer as default; W2 generates `ch6-bg.png` first, visual review, then decides whether to generate additional layers. If `ch6-bg.png` alone with subtle starfield baked-in feels rich enough, skip the extra 2.
   - **RESOLVED:** Adopted recommendation — 3-layer default with single-layer fallback. Plan 05-02 Task 3 makes parallax layers conditional; SpaceScene loaderror handler enables fallback. Plan 05-01 ch6-assets.test.js T5/T6 verify size ≤80KB conditionally if generated.

5. **Bridge event naming: `locale-changed` and `vue:show-project` — do they collide with Phaser internals?**
   - What we know: Phaser internal events use namespaced names (`Phaser.Scenes.Events.START`, `Phaser.Cameras.Scene2D.Events.POST_RENDER`, etc.). Custom strings unlikely to collide.
   - What's unclear: Whether `locale-changed` matches any third-party plugin we might add. Safe to verify via grep on Phaser source.
   - Recommendation: Use `vue:locale-changed` and `vue:show-project` (prefix `vue:`) to make the cross-boundary intent explicit and namespace-safe. Update Pattern 5 and 6 source accordingly.
   - **RESOLVED:** Event names used are `locale-changed`, `show-project`, `arrival-complete` (WITHOUT `vue:` prefix). The initial RESEARCH recommendation proposed `vue:` prefix for cross-boundary clarity, but D5-10 in CONTEXT.md (locked) uses non-prefixed names, and CONTEXT.md takes precedence over RESEARCH recommendations. The project internal bridge only emits/listens to these 3 names — no collision risk with current Phaser plugins. If a future phase introduces a plugin using these generic names, refactor to `vue:` prefix is feasible (single-place change in SpaceScene listener + Chapter6Content emit watch). Codified in Plan 05-03 Task 2 SpaceScene listener registration + Plan 05-04 Task 1 Chapter6Content emit.

6. **Default arrival duration: 3000ms vs 3500ms vs 4000ms?**
   - What we know: D5 says "~3-4s default; planner ajusta". 3500ms (Pattern 7) is a midpoint.
   - What's unclear: Without user testing, hard to predict perceived friction. 800ms = rushed; 5s+ = lazy.
   - Recommendation: Start at 3500ms; document the value as a constant `ARRIVAL_DURATION_MS = 3500` in SpaceScene so it's tunable by single edit if Rafael feels it. PRM branch already bypasses entirely.
   - **RESOLVED:** Adopted recommendation — 3500ms ease Power2.easeOut default; constant `ARRIVAL_DURATION_MS` in SpaceScene. W5 manual checklist §2 ratifies; single-edit tunable. Codified in Plan 05-03 Task 2.

7. **`ProjectOverlay` close-on-route-change: who owns it?**
   - What we know: D5 Claude's discretion — overlay closes when activeChapter !== 6.
   - What's unclear: Could be in Chapter6Content (watch activeChapter, set activeProject=null) OR in ProjectOverlay (its own watch).
   - Recommendation: Chapter6Content owns it (single source of truth — same watcher that destroys game also resets activeProject). Pattern 1 source already does this implicitly.
   - **RESOLVED:** Adopted recommendation — Chapter6Content owns close-on-route-change. Single watcher resets activeProject and arrivalDone when activeChapter !== 6. Codified in Plan 05-04 Task 1 + tests/components/Chapter6Content-bridge.test.js T3.

8. **HMR dispose: also reset `arrivalDone` and `activeProject` to prevent UI inconsistency post-HMR?**
   - What we know: `import.meta.hot.dispose` destroys game. But `arrivalDone = true` ref persists — new game instance starts fresh but mantra still showing.
   - What's unclear: Visual edge case in dev only. Probably not blocking.
   - Recommendation: Reset both in the dispose handler. 2 extra lines, cleaner dev experience. Pattern 1 source already does this.
   - **RESOLVED:** Adopted recommendation — HMR dispose handler resets game.value=null AND arrivalDone=false AND activeProject=null. The HMR guard lives in Chapter6Content.vue (Plan 05-04), NOT in the factory module (by design: lifecycle ownership is the component's, not the module's). Codified in Plan 05-04 Task 1.

9. **Asset commit strategy: 6 assets in one commit, or 1 commit per asset?**
   - What we know: Convention in Phase 4 was 1 commit per asset (`art(04-NN): ch4-bg-stars-far`).
   - What's unclear: Plan can decide either pattern.
   - Recommendation: 1 commit per asset for granular git history, easier rollback if a specific asset turns out bad.
   - **RESOLVED:** Adopted recommendation — 1 commit per asset (`art(05-02): ch6-{asset}`). Codified in Plan 05-02 task done criteria.

10. **Tests for `--bg-image` URL declaration in ch6 chapter-themes.css?**
    - What we know: D2-04 BackgroundLayers consumes `--bg-image: url('/assets/ch6-bg.png')` for crossfade ch5→ch6. ch6 ALSO has its own bg INSIDE Phaser canvas.
    - What's unclear: Do we want the HTML BackgroundLayers crossfade DURING the moment Phaser is loading + mounting? It might look weird (HTML bg visible briefly, then canvas replaces it).
    - Recommendation: YES, declare `--bg-image` for ch6 — covers the preload window (~200ms) gracefully. The Phaser canvas opaque bg (`backgroundColor: '#1a0e3d'`) takes over once mounted. Add architectural test verifying the declaration matches `/assets/ch6-bg.png`.
    - **RESOLVED:** Adopted recommendation — Plan 05-01 Task 3 declares `--bg-image: url('/assets/ch6-bg.png')` in `[data-chapter="6"]`. Verified by tests/styles/themes-file.test.js T4 (Phase 2) auto-extending to ch6.

11. **Phaser 4.x upgrade — out of scope confirmed, but document the decision somewhere?**
    - What we know: Phaser 4.1.0 published 2026-04-30. Our package.json pin `^3.86.0` blocks it. Phase 5 stays on 3.86.
    - What's unclear: Where to document the deliberate stay-on-3.x decision so a future executor doesn't accidentally upgrade.
    - Recommendation: Add comment in `src/phaser/index.js` factory: `// Phaser locked to 3.86.x range — Phaser 4.x upgrade out-of-scope per Phase 5 plan. Re-evaluate if v2 demand surfaces.` Mention in `05-PLAN` summary.
    - **RESOLVED:** Adopted recommendation — comment in src/phaser/index.js documents stay-on-3.x decision (Pitfall 14 mitigation). Codified in Plan 05-03 Task 1 behavior + done criteria.

---

## Sources

### Primary (HIGH confidence)
- **Phaser source code** [VERIFIED via `curl https://raw.githubusercontent.com/phaserjs/phaser/master/src/core/Game.js`] — `Game.destroy(removeCanvas, noReturn)` implementation confirms PHA-02 semantics. `CanvasPool.remove(this.canvas)` + `canvas.parentNode.removeChild(canvas)` when `removeCanvas=true`. Plugin registry preserved when `noReturn=false`.
- **Phaser official template `phaserjs/template-vue`** [VERIFIED via `curl https://raw.githubusercontent.com/phaserjs/template-vue/main/src/PhaserGame.vue`] — Source of `EventBus` singleton pattern + `ref(game)` + `destroy(true)` baseline. PHA-01/02 are stricter (more correct) variants.
- **vue-i18n v11 docs** [CITED: vue-i18n.intlify.dev/guide/advanced/composition.html#global] — `i18n.global.t()` singleton access from non-component JS modules.
- **Vue 3 reactivity docs** [CITED: vuejs.org/api/reactivity-advanced.html#shallowref] — `shallowRef` semantics: only `.value` reactive, contents not proxified.
- **Vite HMR API docs** [CITED: vite.dev/guide/api-hmr#hot-dispose-cb] — `import.meta.hot.dispose(cb)` fires before module replacement.
- **`@vueuse/core` useResizeObserver** [CITED: vueuse.org/core/useResizeObserver/] — throttled, auto-cleanup.
- **npm registry** [VERIFIED 2026-05-14 via `npm view phaser version` → 4.1.0; `npm view phaser@3 versions --json` → 3.86.0+ available in 3.x range] — Phaser version current state.
- **Phaser 3 API docs (general structural references)** [CITED: phaser.io/docs] — Scale.NONE, setInteractive, setScrollFactor, tweens. Specific version pages (3.86 deep links) returned 522 on fetch — content matches general 3.x documentation though.

### Secondary (MEDIUM confidence)
- WebSearch results on "Phaser 3 Vue 3 shallowRef game instance lifecycle" — community wisdom converges on shallowRef pattern; multiple blog posts/StackOverflow answers consistent.
- WebSearch results on "Phaser destroy true false semantics" — multiple discourse.phaser.io threads concur with source-confirmed semantics.

### Tertiary (LOW confidence — flagged for validation)
- Phaser bundle size estimate (~150KB gzip / ~600KB minified). Verified package.unpackedSize is 107MB (includes src + types + examples — NOT bundle). Actual bundled size depends on tree-shaking by Vite. **Action:** measure post-build in plan execution.
- Pixelforge stochasticity bound (1-2 regenerations typical) — based on Phase 4 anecdote, not empirically measured for synthwave palette specifically.
- `@vueuse/integrations` useFocusTrap pulls focus-trap ~8KB peer dep — number not verified against bundle analyzer.

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — versions verified via npm view; libraries are project-established (Phase 2-4 use them).
- **Architecture patterns 1-13:** HIGH for shallowRef + destroy + lazy import + HMR + scale + bridge events (verified against Phaser source and official template). MEDIUM for parallax descent + ships loop (idiomatic Phaser, no peculiarities expected). MEDIUM-LOW for "tooltip styling in-Phaser" because exact visual fidelity is empirical.
- **Asset pipeline:** MEDIUM — Pattern verified in Phase 4 (ch2/ch4/ch5 generated successfully), but synthwave palette specifically introduces unknowns (palette compliance + `"night"` preset bg removal for cyan/pink halos). Plan should budget for 1-2 regeneration attempts per asset.
- **Pitfalls 1-14:** HIGH for technical pitfalls (1-11 — all verified against source or docs). MEDIUM for asset-related pitfalls (12-13 — based on Phase 4 deferred items). LOW for chapter overlap bug (Pitfall 13) — root cause is itself a hypothesis pending investigation.
- **Validation architecture:** HIGH — vitest + jsdom + source-level regex approach is the same pattern used Phase 4 successfully (existing tests/ tree shows 45+ tests passing).

**Research date:** 2026-05-14
**Valid until:** 2026-06-13 (30 days for stable patterns; ~14 days for asset pipeline guidance if pixelforge behavior changes)

**Phaser version monitor:** Phaser 3.x continues minor releases (3.90+ exists). Phase 5 stays on `^3.86.0` semver — automatic minor upgrades are safe. Phaser 4.x is a hard out-of-scope for v1.

**Re-research triggers:**
- If `phaser` version on npm gets a 3.x major-breaking change (unlikely — semver guarantee).
- If pixelforge MCP schema changes (e.g., adds `seed` parameter) — would unlock asset consistency improvements.
- If chapter overlap bug Phase 4 gets a root cause fix — Pattern 12 mitigation becomes obsolete or redundant.
- If Vue 3.6 or Vite 6 introduces HMR API breaking changes — Pitfall 3 mitigation might need adjustment.
