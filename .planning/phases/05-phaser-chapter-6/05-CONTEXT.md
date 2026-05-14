# Phase 5: Phaser Chapter 6 - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 entrega **el chapter 6 como escena Phaser explorable** que cierra el viaje cronológico del sitio (era 2026, convergencia dev/QA/AI). Incluye:

- **Escena Phaser `SpaceScene`** con **arrival cinematográfico vertical descendente** (D5-02) ~3-4s al entrar a ch6: la cámara baja revelando 3 planetas-proyecto distribuidos verticalmente; al terminar el descenso queda **estática** con los 3 planetas visibles + 2 naves cruzando en loop horizontal. Sin atrapar input del scroll-snap global.
- **3 planetas-proyecto clickables** (D5-01): **Empresa propia AR/VR** (founder 2015-2018, arriba) → **Remoose Interactive** (Full Stack Vancouver 2023-presente, medio) → **Software Mind NA** (QA + AI/data science automation 2023-presente, fondo). Orden cronológico ascendente; Software Mind cierra el viaje al fondo del descenso. Click/tap en planeta abre overlay Vue con detalle.
- **Vibe lo-fi AI vaporwave/synthwave** (D5-04): gradient deep purple→cyan + planetas neon-orb con halo + naves abstractas glitchy/neural. Paleta locked: `#1a0e3d` (deep purple) + `#ff3ca6` (hot pink) + `#4dffff` (electric cyan) + `#ffd95c` (soft amber). Esto popula `chapters[6].palette` (hoy `[]`).
- **Easter egg mantra "And always show a smile"** (D5-03) — texto narrativo en Vue/HTML sobre el canvas que aparece con **fade-in al fin del arrival** (instantáneo bajo PRM). No requiere haber explorado los planetas; cierra narrativamente la llegada. CON-04 satisfecho.
- **Locale bridge** (PHA-06): `game.events.emit('locale-changed', locale)` cuando el toggle cambia; scene escucha y re-renderiza labels in-scene (nombres de planetas como tooltips en hover). Mantra + overlay del proyecto se renderizan en Vue/HTML (no necesitan bridge).
- **Project click bridge** (PHA-07): planet click → `game.events.emit('vue:show-project', id)` → Vue muestra `<ProjectOverlay>` con el detalle del proyecto (estilo synthwave, NO reusa ProjectCard skeumorphic Web 2.0 ni FloatingPanel AR/VR — son estructuralmente distintos).
- **Lifecycle limpio**: `shallowRef(Phaser.Game)` (PHA-01), `destroy(true, false)` en `onBeforeUnmount` (PHA-02), `import()` dinámico lazy cuando `activeChapter === 6` (PHA-04), `import.meta.hot.dispose()` guard HMR.
- **Integer scale + HiDPI**: `Phaser.Scale.NONE` + `zoom = Math.min(Math.floor(vw/480), Math.floor(vh/270))` (PHA-03). Sprites pixel-perfect en Retina (Success Criteria 4).
- **PRM-aware**: bajo `prefers-reduced-motion`, arrival = **instant cut** (planetas + naves aparecen ya posicionados sin animación de descenso); naves estáticas (no cruzando); mantra aparece sin fade. Parallax interno = sin diferencial.
- **Resize**: `ResizeObserver` sobre window con `ScrollTrigger.refresh()` (PHA-09) — recalcula zoom integer + reposiciona naves/planetas si el viewport cambia drásticamente.
- **Avatar ch6-bust**: heredado de Phase 4 W0 (D4-01); StickyAvatar lo consume automáticamente desde `chapters[6].avatarSrc`.

**Entregables canónicos:**
- `src/components/Chapter6Content.vue` — wrapper Vue del canvas + ProjectOverlay + mantra HTML.
- `src/components/PhaserChapter.vue` — encapsula la instancia Phaser (shallowRef, lifecycle, bridge events). Reusable conceptualmente aunque solo ch6 lo usa.
- `src/components/ProjectOverlay.vue` — overlay Vue estilo synthwave para los 3 planet-projects. Modal centrado, ESC cierra, click-outside cierra, close button visible, focus trap.
- `src/phaser/SpaceScene.js` — Phaser Scene con preload/create/update; maneja parallax descendente arrival, naves loop, planeta hit-areas, locale bridge listener.
- `src/phaser/index.js` — factory de `new Phaser.Game(config)` con shallowRef-friendly config.
- 3 planet sprites + 2 ship sprites + 1 background gradient/stars (pixelforge `forge_sprite`/`forge_background`).
- 3 nuevos items en `src/data/projects.js` con `chapterEra: 6` + campos `planetSprite/planetOrbit/planetColor` poblados (shape D3-03 locked).
- `chapters[6].palette` poblado con 4-5 hex de la paleta synthwave.
- `[data-chapter="6"]` block en `chapter-themes.css` finalizado (hoy stub).
- i18n keys nuevos: `projects.ch6-{ar-vr,remoose,software-mind}.{title,desc,role,techStack}`, `chapters.6.flavor`, `chapters.6.mantra` ("And always show a smile" / "Y siempre muestra una sonrisa" — Rafael ratifica copy), tooltips planet names, overlay UI strings.
- `Chapter6Content` montado en `ScrollShell.vue` reemplazando placeholder.

**Phase 5 NO incluye:**
- Pixel art assets de fases anteriores (Phase 4 ya hecho).
- Avatar ch6-bust (Phase 4 W0 D4-01).
- Deploy / firebase.json / cache headers (Phase 6 DEPLOY-*).
- Bug fix de chapter-overlap durante scroll (deferred Phase 4 2026-05-14) — Phase 5 verifica que ch6 no agrave + reporta hallazgos pero NO fix.
- iOS smoke test confirmatorio (Phase 1 Plan 07 deferred — Rafael no tiene hardware iOS).
- Backgrounds downscale ≤80KB cumulative (Phase 4 deferred polish, blocking Phase 6).
- Tercer idioma, deep linking, sound design (REQUIREMENTS.md v2).

**Critical blocking inputs:**

Phase 5 usa **checkpoint:human-input per wave** (heredado patrón D4-09 / D3-08). Inputs Rafael necesarios:
- **§2.5 proyectos ch6 (1-3 con copy ES+EN)**: AR/VR own + Remoose + Software Mind, con titles/descs/role/techStack. Si stubs OK (como ch2/ch4/ch5 Phase 4), executor genera placeholders y Rafael refresca post-execute.
- **§5.5 paleta ch6**: 4-5 hex synthwave. Default propuesto en D5-04 (deep purple `#1a0e3d` + hot pink `#ff3ca6` + cyan `#4dffff` + amber `#ffd95c`). Rafael ratifica o ajusta.
- **§5.6 paleta humana**: ya validada en Phase 4 W0 — no se re-pide.
- **Copy del mantra**: "And always show a smile" (EN) — Rafael define traducción ES ("Y siempre muestra una sonrisa" propuesto, ratifica).

</domain>

<decisions>
## Implementation Decisions

### Planet Content & Mapping

- **D5-01:** **3 planetas = Empresa propia AR/VR (2015-18) + Remoose Interactive (2023+) + Software Mind NA (2023+ AI/QA)**. Set "Convergencia 2026" elegido por Rafael. Orden vertical cronológico ascendente (más antiguo al inicio del descenso, más reciente al fondo). Software Mind cierra el viaje + concentra la narrativa "convergencia AI". `projects.js` recibe 3 items con `chapterEra: 6` + campos `planetSprite` (asset path), `planetOrbit` (posición Y normalizada 0..1 dentro del rango de descenso), `planetColor` (hex del halo neon-orb).

### Scroll & Camera Architecture

- **D5-02:** **Arrival cinematográfico una vez + escena estática post-arrival**. Al entrar a ch6 (detectado por `watch(activeChapter === 6)` en `Chapter6Content`), la cámara Phaser interna baja ~3-4s revelando los 3 planetas en secuencia mientras el parallax multi-capa (estrellas lejos, nebulae mid, planet-halos near) se desplaza con factor escalonado. Al terminar, la cámara queda estática mostrando los 3 planetas + naves cruzando en loop horizontal infinito (decorativo). **El scroll-snap global del documento no se altera** — el wheel/touch sigue funcionando para volver a ch5; ch6 es último chapter, no hay siguiente. No se captura input. Sin loop infinito de cámara (descartado por dificultar clickear planetas + capturar sensación de scroll). **Replay del arrival:** si el usuario sale a ch5 y vuelve, la escena se destruye (PHA-02) y al re-entrar la animación arrival se ejecuta de nuevo — comportamiento por diseño, no bug.

### Easter Egg Mantra

- **D5-03:** **Mantra aparece al fin del arrival cinematográfico**, con fade-in suave (~400ms) en Vue/HTML sobre el canvas. Bajo PRM, aparece instantáneamente sin fade. **Renderizado en HTML Vue** (no dentro de Phaser): mejor crispness, i18n directo vía `t('chapters.6.mantra')`, no necesita locale bridge. Posición: footer del `<section data-chapter="6">`, centrado, font Audiowide o similar synthwave-friendly (planner decide), tamaño `clamp(1rem, 3vw, 1.5rem)`. Todos los visitantes lo ven (no es gated por interacción). CON-04 satisfecho.

### Visual Concept (Vibe + Palette + Assets)

- **D5-04:** **Lo-fi AI vaporwave/synthwave**. Paleta locked propuesta:
  - `#1a0e3d` deep purple — bg gradient base
  - `#ff3ca6` hot pink — accent ships + planet highlights
  - `#4dffff` electric cyan — planet halos + tooltips + UI
  - `#ffd95c` soft amber — easter egg mantra + accent secundario
  - (opcional `#0a061f` near-black para starfield contrast)

  **Assets a generar (pixelforge + Adobe MCP post):**
  - `public/assets/ch6-bg.png` — `forge_background` (sin bg removal), gradient purple→cyan + estrellas sutiles, 480×270 base × zoom = export 1440×810. Si parallax interno multi-capa requiere capas separadas (stars-far + nebulae-mid), se generan 2-3 backgrounds adicionales: `ch6-bg-stars-far.png` + `ch6-bg-nebulae-mid.png`. Planner decide capas exactas en research.
  - `public/assets/ch6-planet-{ar-vr,remoose,software-mind}.png` — `forge_sprite` (con bg removal) estilo neon-orb con halo cyan/pink. ~96×96 base × zoom = 288×288 final. Adobe MCP post: `image_remove_background` si pixelforge no entrega alpha clean.
  - `public/assets/ch6-ship-{1,2}.png` — `forge_sprite` con bg removal, estilo abstracto glitchy/neural (NO naves realistas). Sprites pequeños ~32×24 base.
  - Naming sigue convención `ch{N}-{descriptor}[-{variant}].png` (ART-05).
  - Paleta enforced explícitamente en cada call (ART-06): `palette: chapter.palette` (D3-06 carry-forward).

- **D5-05:** **Naves: 2 unidades, loop horizontal con timing escalonado** (Claude's discretion derivada de D5-04). Ship 1 cruza de izquierda a derecha en banda superior cada ~12s; Ship 2 cruza de derecha a izquierda en banda inferior cada ~18s. Velocidades distintas refuerzan profundidad. Bajo PRM ambas estáticas en posición fija decorativa. Diseño "glitchy/neural" — no realistas; pueden ser geometría abstracta con efecto neon trail. Sin colisión, sin interacción (decorativas).

### Interaction Model

- **D5-06:** **Click/tap en planeta abre overlay Vue** (`<ProjectOverlay>`). Hit area generosa (planeta + halo cyan +~16px padding). En desktop: hover cambia cursor a pointer + tooltip Phaser con nombre del proyecto (asistido por locale bridge). En mobile/touch: tap directo abre overlay sin tooltip. **Keyboard accessibility (A11Y):** después del canvas, en el DOM, hay 3 botones HTML `<button>` invisibles (sr-only / opacity:0) con `aria-label` por proyecto que disparan el mismo `vue:show-project` event al recibir focus+Enter/Space. Esto permite tab-navigation por teclado sin tener que hacer focus management dentro de Phaser. ESC desde el canvas/overlay cierra el overlay activo.

### Project Overlay Component

- **D5-07:** **`<ProjectOverlay.vue>` nuevo** — NO reusa `ProjectCard` skeumorphic (Web 2.0 ch3) ni `FloatingPanel` (AR/VR ch4). Razones: (a) la era synthwave es estructuralmente distinta — neon halos + glass cyan + drop shadows magenta no encajan con gradients glossy ni glass holográfico; (b) UI de modal vs card es distinta interaction-wise. Specs:
  - `position: fixed; inset: 0; z-index: 50` (encima del canvas, debajo de LangToggle y StickyTimeline que viven con z superior).
  - Backdrop con `backdrop-filter: blur(8px)` + `background: rgba(26, 14, 61, 0.7)` (deep purple translúcido).
  - Card centrado, max-width `min(90vw, 560px)`, border 1px cyan `#4dffff` con `box-shadow: 0 0 24px rgba(77, 255, 255, 0.4), 0 0 48px rgba(255, 60, 166, 0.2)` (glow doble cyan + pink).
  - Close button: top-right del card, `aria-label="Close"` i18nificado, ESC también cierra, click-outside cierra. Focus trap interno (focus al close button al abrir, restore focus al planet button-trigger al cerrar).
  - Contenido: title (font Audiowide), year, role, techStack (chips estilo synthwave), descripción, link "Visit project →" si existe.
  - Mobile: `max-width: 100vw`, `height: 100vh` fullscreen modal con close grande arriba.
  - Animación: fade+scale `200ms ease-out` al abrir / `150ms ease-in` al cerrar. Bajo PRM: instant.

### Reduced Motion Policy (cross-cutting)

- **D5-08:** **PRM heuristic ch6** (extiende D-01..D-06 Phase 1 + D4-10 Phase 4):
  - Arrival cinematográfico: bajo PRM, **instant cut** — la cámara se posiciona directamente al estado final, los 3 planetas y naves visibles inmediatamente. Sin descenso animado.
  - Naves loop: bajo PRM, naves **estáticas** en posiciones decorativas fijas (no cruzando).
  - Parallax multi-capa: bajo PRM, **sin diferencial** (todas las capas estáticas / scroll factor 1.0).
  - Mantra fade-in: bajo PRM, **aparece sin fade** (`transition: none`).
  - Overlay open/close: bajo PRM, **instant** (sin scale/fade).
  - Phaser global flag: `this.tweens.timeScale = 0` bajo PRM si hay tweens automáticos que no se pudieron evitar (cinturón de seguridad).

### Chapter Overlay Layout Strategy

- **D5-09:** **Chapter6Content layout: canvas full-bleed dentro de `<section data-chapter="6">`**. Sin layout 2-col tipo ch3/ch4 — el chapter ES la escena Phaser. El canvas ocupa el viewport completo del chapter (100% width × 100dvh) menos el espacio reservado para sticky avatar top-left (~96px) y sticky timeline vertical-left (~120px) + LangToggle top-right (~80px). Wrapper Vue contiene `<div class="ch6-canvas-host">` donde Phaser monta + `<ProjectOverlay>` v-if + `<p class="ch6-mantra">` v-if. **Chapter overlap bug (Phase 4 deferred) vigilancia:** ch6 usa `position: relative; overflow: hidden` igual que ch4 — incluir test architectural en W5 que verifique `scroll-snap-stop: always` activo + stacking context no causa ch5 visible sobre ch6.

### Locale Bridge Granularity

- **D5-10:** **El bridge se usa solo para texto in-scene Phaser** (tooltips de nombres de planetas en hover desktop). El mantra + overlay del proyecto + UI de overlay (close, link, techStack) viven en Vue/HTML — i18n directo con `t()`, sin pasar por bridge. Listener en SpaceScene: `game.events.on('locale-changed', (locale) => { this.tooltips.forEach(t => t.setText(i18n.global.t(t.titleKey))) })`. Vue → Phaser: watch en `useI18n().locale`, emit del bridge event.

### Chapter6Content + Phaser Lifecycle Detail

- **D5-11:** **Mount on activeChapter === 6, destroy on activeChapter !== 6** (PHA-04 lazy). Patrón:
  ```js
  // Chapter6Content.vue
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
  Re-entry recrea instancia limpia → arrival se reproduce. Tests architectural: el `dispose` HMR funciona (`import.meta.hot?.dispose(() => game.value?.destroy(true, false))`).

### Claude's Discretion (gray areas no discutidas — research/planning resuelve)

- **Parallax internal multi-capa count**: 2-4 capas (stars-far / nebulae-mid / planet-halo-near opcional). Recommended 3 capas para depth sin sobrecargar. Planner decide en research si genera asset separados o usa una sola imagen + procedural starfield.
- **Easter egg copy ES exact wording**: "Y siempre muestra una sonrisa" propuesto; Rafael ratifica en W5 manual checklist (paralelo a alt-text ratification D4-11 pattern).
- **Tooltip styling in-Phaser**: Phaser Text con bg rect cyan glow o sprite custom. Recommended Phaser.GameObjects.Container con Rectangle + Text. No requiere asset pixelforge adicional.
- **Project overlay i18n keys naming**: `projects.ch6-ar-vr.title`, `projects.ch6-remoose.title`, etc. (D3-03 shape locked).
- **Planet sizes**: ~80-100px × zoom — visible sin saturar viewport. Halos extra 40px radius. Planner ajusta en testing.
- **Arrival duration**: 3-4s default; planner ajusta si user testing percibe fricción (más rápido) o falta de wow (más lento). Bajo 800ms se siente apurado; sobre 5s se siente lento.
- **Bridge event naming**: `locale-changed` y `vue:show-project` propuestos (PHA-06/07 los menciona). Planner verifica que no colisionen con eventos internos de Phaser.
- **ProjectOverlay close-on-route-change**: si Rafael presiona ↑ o click en otro tick de timeline mientras overlay está abierto, el overlay se cierra automáticamente (event listener en activeChapter). Planner implementa.
- **Phaser config**: `pixelArt: true`, `roundPixels: true`, `backgroundColor: '#1a0e3d'`, `transparent: false`, `physics: { default: 'none' }` (no se necesita física), `scene: [SpaceScene]`, `scale: { mode: Phaser.Scale.NONE }`. Bundle Phaser tree-shaken si Vite lo soporta — sino, full ~600KB minified gzipped ~150KB (acceptable solo en ch6 lazy).
- **Asset preload strategy**: `SpaceScene.preload()` carga sprites antes de crear; mostrar canvas vacío (background:transparent → muestra ch6-bg que ya está como CSS `--bg-image` vía BackgroundLayers D2-04) durante preload. NO loading spinner Phaser (anti-pattern del PROJECT.md). Si preload >800ms, mostrar mantra prematuramente o un dot pulsante en HTML/Vue.
- **Tests architectural** (vitest + jsdom):
  - `Chapter6Content` mount/unmount no leak (game.destroy called en watch);
  - i18n parity test extends a chapters.6.* + projects.ch6-*;
  - `--bg-image` declarado en `[data-chapter="6"]` apunta a `/assets/ch6-bg.png`;
  - Naming convention enforced en `tests/assets/asset-naming.test.js` (Phase 4) extends a ch6 assets;
  - Theme isolation test extends a ch6 block (no font/color bleed).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope + requirements
- `.planning/REQUIREMENTS.md` §PHASER (PHA-01..PHA-09) — single source of truth para la mecánica Phaser. Locked al detalle: `shallowRef`, `destroy(true,false)`, `Phaser.Scale.NONE` + `Math.floor`, `import()` lazy, locale bridge, project click bridge, cero character animation, `ResizeObserver`.
- `.planning/REQUIREMENTS.md` §CONTENT — CON-04 (mantra easter egg en ch6).
- `.planning/REQUIREMENTS.md` §ART — ART-04 (elementos ambientales ch6: ships, planetas) y ART-05 (naming), ART-06 (palette gate).
- `.planning/REQUIREMENTS.md` §A11Y — A11Y-05 (PRM), A11Y-06 (alt-text mantra), A11Y-07 (`<html lang>` ya gestionado por Phase 2).
- `.planning/REQUIREMENTS.md` Out of Scope — Lenis (locked OUT por intercept input + romper Phaser), Locomotive Scroll (idem), Pinia (overkill), Vue Router.
- `.planning/ROADMAP.md` §"Phase 5: Phaser Chapter 6" — Goal + 5 Success Criteria.
- `.planning/PROJECT.md` §Chapter 6 (Phaser) — escena explorable sin character animation, sin gameplay con objetivos/score.
- `.planning/STATE.md` — Phase 4 closed + deferred items relevantes (chapter overlap bug, backgrounds downscale).

### Phase 4 carry-forward (decisiones de pipeline pixel art + multi-layer parallax)
- `.planning/phases/04-chapters-0-2-4-5/04-CONTEXT.md` — D4-04 (high fidelity per chapter components), D4-06 (background strategy), D4-07 (parallax dentro de section, NO BackgroundLayers global), D4-08 (wave strategy por tipo), D4-09 (gate per wave), D4-10 (PRM heuristic per chapter), D4-11 (alt-text ratification pattern Rafael en checklist).
- `.planning/phases/04-chapters-0-2-4-5/04-RESEARCH.md` — patterns parallax + pixelforge prompt structure ya validadas.
- `src/components/ParallaxLayers.vue` — patrón de capas absolute positioned dentro del section + transform translateY scroll-driven. **NO se reusa directamente para Phaser** (la escena vive dentro de canvas, no DOM), pero el patrón conceptual de "factor escalonado por capa" sí aplica al parallax interno de Phaser.
- `src/components/FloatingPanel.vue` — patrón glass cyan AR/VR. **NO se reusa para ProjectOverlay** (era distinta) pero referencia visual para distinguir.

### Phase 3 carry-forward (data shape + i18n + avatar)
- `.planning/phases/03-chapter-3-end-to-end/03-CONTEXT.md` — D3-03 (project shape rico con campos Phaser pre-reservados `planetSprite/planetOrbit/planetColor`), D3-04 (chapters shape sin helpers, joins inline), D3-06 (palette governance doble fuente), D3-07 (prompt structure base + diff).
- `.planning/phases/03-chapter-3-end-to-end/CONTENT-CHECKLIST.md` §2.5 + §5.5 (proyectos ch6 + paleta ch6 — pending Rafael).

### Phase 2 carry-forward (motor visual + i18n)
- `.planning/phases/02-theme-system-i18n/02-CONTEXT.md` — D2-04 (BackgroundLayers crossfade era→era — Phase 5 declara `--bg-image: url('/assets/ch6-bg.png')` en `[data-chapter="6"]` para que el crossfade ch5→ch6 funcione antes/durante de que Phaser monte).
- `src/styles/chapter-themes.css` — `[data-chapter="6"]` stub a finalizar (palette + `--bg-image`).
- `src/i18n/es.json` + `en.json` — añadir keys `chapters.6.{title,era,flavor,mantra}`, `projects.ch6-{ar-vr,remoose,software-mind}.{title,desc,role,techStack}`, `ui.openProject` (ya existe), `ui.closeOverlay`, etc. con paridad enforced por test.

### Phase 1 carry-forward (mecánica scroll + PRM + sticky)
- `.planning/phases/01-scroll-shell-sticky-anchors/01-CONTEXT.md` §"Reduced-Motion Policy" — D-01..D-06; D-03 dicta crossfade ≤150ms bajo PRM.
- `src/composables/useScrollState.js` — `activeChapter` reactive (Chapter6Content lo consume vía inject para mount/destroy game).
- `src/composables/usePRM.js` — `prefersReduced` (SpaceScene + ProjectOverlay lo consumen).
- `src/components/StickyAvatar.vue` — consume `chapters[6].avatarSrc = '/assets/ch6-bust.png'` (ya generado Phase 4 W0 D4-01).
- `src/components/ScrollShell.vue` — el `<section :data-chapter="6">` recibe `<Chapter6Content />` reemplazando placeholder.

### Project / Stack
- `CLAUDE.md` — Phaser 3.86 ESM sin TS, pixelArt true, resolución base 480×270 zoom ×3, image-rendering pixelated, comunicación español, Windows 11 PowerShell 5.1.
- `.claude/agents/artist-creator.md` — pixelforge generation (forge_background sin bg removal para ch6-bg; forge_sprite con bg removal para planets + ships).
- `.claude/agents/artist-editor.md` — Adobe MCP post-process (remove_background, crop_and_resize a 480×270 base × zoom).
- `.claude/agents/frontend-dev.md` — Vue 3 + Phaser specialist; consulta este context para mount/lifecycle/bridge patterns.
- `.claude/skills/crear-arte-pixelforge.md` — pixelforge protocol + error cases.
- `.claude/skills/dev-vue3-phaser.md` — patterns Vue 3 + Phaser (shallowRef, lifecycle, integer scale).
- `package.json` — `phaser: ^3.86.0` ya instalado (no install necesario).

### Photo references
- (Phase 5 no requiere fotos — avatar ch6-bust generado en Phase 4 W0).

### Deferred items relevantes (vigilancia, no fix)
- Chapter overlap bug Phase 4 (registrado 2026-05-14): al scrollear desde ch3 chapters previos se overlapping. Phase 5 NO arregla pero el plan incluye test architectural defensivo para ch6 (D5-09).
- Backgrounds downscale ≤80KB Phase 4 (Phase 6 blocker): ch6-bg.png nuevo a generar con misma restricción de tamaño (target ≤80KB tras optimize/Adobe resize).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useScrollState.activeChapter`** (Phase 1 W2): ref reactive 0..6. Chapter6Content hace `watch(activeChapter)` para mount/destroy del Phaser.Game (D5-11).
- **`usePRM.prefersReduced`** (Phase 1 W3): ref reactive. SpaceScene consume vía closure capturado al crear scene (no inject — Phaser es sandbox aparte); el flag se pasa al constructor de la scene como prop o se lee desde un singleton módulo `src/composables/usePRM.js` directamente.
- **`useBackgroundMorph` + `BackgroundLayers`** (Phase 2 W3): el crossfade global `--bg-image` ya funciona. ch6 declara `--bg-image: url('/assets/ch6-bg.png')` en `[data-chapter="6"]` → BackgroundLayers crossfade ch5→ch6 antes/durante del mount Phaser. El canvas Phaser se monta encima del HTML BackgroundLayers (z-index >).
- **`StickyAvatar.vue`** (Phase 1+3+4): consume `chapters[6].avatarSrc` automáticamente cuando `activeChapter === 6`. No tocar.
- **`StickyTimeline.vue`** (Phase 1+2 redesign): el tick de ch6 ya existe; click navega a `#chapter-6`. No tocar.
- **`LangToggle.vue`** (Phase 2): el toggle ES/EN dispara watch sobre `i18n.global.locale` — SpaceScene escucha vía bridge event emitido desde Chapter6Content cuando detecta el cambio.
- **`ContactHUD.vue`** (Phase 3): visible en ch6 igual que en cualquier chapter. z-index ya por encima del canvas.
- **`src/data/projects.js`** (Phase 3): shape D3-03 con campos `planetSprite/planetOrbit/planetColor` ya reservados. Phase 5 pobla 3 items chapterEra:6 con esos campos.
- **`src/data/chapters.js`** (Phase 3): `chapters[6]` ya existe con `avatarSrc`, `palette: []`. Phase 5 pobla `palette` con D5-04 paleta.
- **`tests/assets/asset-naming.test.js`** (Phase 4): test architectural enforced `ch{N}-{descriptor}[-{variant}].png` — extiende automáticamente a ch6-bg/ch6-planet-*/ch6-ship-*.
- **`tests/i18n/parity.test.js`** (Phase 2 W0): keys nuevos ch6 enforced en ES+EN simultáneamente.

### Established Patterns
- **`<section :data-chapter="N">` v-for en ScrollShell.vue**: pattern de inserción por chapter sin tocar shell. Phase 5 reemplaza `<div v-else class="chapter-placeholder">` con `<Chapter6Content v-else-if="ch.id === 6" />`.
- **Provide/inject para shared state**: App.vue provee `scrollState`, `prm`, `bgMorph`. Chapter6Content inject (especialmente `scrollState` para mount/destroy + `prm` para configurar Phaser).
- **CSS Custom Props como vehículo de tematización**: `[data-chapter="6"]` block en `chapter-themes.css` finaliza tokens. El canvas Phaser tiene su propia color/palette interno (configurado en SpaceScene.create() leyendo `chapters[6].palette`).
- **Atomic commit per task**: `feat(05-NN):`, `test(05-NN):`, `docs(05-NN):`, `art(05-NN):` para assets pixel-art committed.
- **Joins inline data en computed**: `projects.filter(p => p.chapterEra === 6)` directamente en Chapter6Content para feed SpaceScene + ProjectOverlay.
- **Era-specific UI components**: Phase 4 D4-04 estableció el patrón "components dedicados por era" — Phase 5 sigue: `Chapter6Content`, `PhaserChapter`, `ProjectOverlay` son ch6-specific (no shared con otras eras).

### Integration Points
- **`src/components/ScrollShell.vue`**: añadir `import Chapter6Content from './Chapter6Content.vue'` + `<Chapter6Content v-else-if="ch.id === 6" />` reemplazando placeholder.
- **`src/styles/chapter-themes.css`**:
  - `[data-chapter="6"]`: actualizar paleta synthwave (D5-04) + añadir `--bg-image: url('/assets/ch6-bg.png')` para BackgroundLayers crossfade.
  - `@layer components`: añadir reglas para `.ch6-canvas-host`, `.ch6-mantra`, `.project-overlay` (synthwave glass + neon).
- **`src/data/chapters.js`**: poblar `chapters[6].palette` con array hex synthwave (D5-04).
- **`src/data/projects.js`**: añadir 3 items chapterEra:6 (ch6-ar-vr / ch6-remoose / ch6-software-mind) con shape D3-03 + campos Phaser poblados (`planetSprite: '/assets/ch6-planet-X.png'`, `planetOrbit: 0.2|0.5|0.8` Y-normalizado, `planetColor: '#XXXXXX'`).
- **`src/i18n/es.json` + `en.json`**: keys `chapters.6.{title,era,flavor,mantra}`, `projects.ch6-{ar-vr,remoose,software-mind}.{title,desc,role,techStack}` (techStack puede ir como array de strings i18n-agnostic en data file, o como i18n keys si Rafael quiere localizar términos técnicos), `ui.closeOverlay`, `ui.openProject` (ya existe).
- **`public/assets/`**: añadir `ch6-bg.png` + opcionalmente `ch6-bg-stars-far.png` + `ch6-bg-nebulae-mid.png` + `ch6-planet-ar-vr.png` + `ch6-planet-remoose.png` + `ch6-planet-software-mind.png` + `ch6-ship-1.png` + `ch6-ship-2.png` (8 assets nuevos worst case, 6 best case).
- **`src/phaser/index.js`** (NUEVO): factory `createGame(hostEl)` que devuelve `new Phaser.Game(config)`.
- **`src/phaser/SpaceScene.js`** (NUEVO): scene principal con preload (sprites), create (background + 3 planetas + 2 naves + tweens arrival + locale listener), update (loop ships).
- **`src/components/Chapter6Content.vue`** (NUEVO): wrapper Vue + watch(activeChapter) + ProjectOverlay + mantra HTML.
- **`src/components/PhaserChapter.vue`** (NUEVO opcional): si el planner prefiere encapsular Phaser separado de Chapter6Content; sino, todo dentro de Chapter6Content.
- **`src/components/ProjectOverlay.vue`** (NUEVO): modal Vue synthwave (D5-07).

</code_context>

<specifics>
## Specific Ideas

- **Software Mind NA tiene rol AI/data science automation desde 2023** — el planeta en el fondo del descenso es el cierre narrativo "convergencia hoy". Rafael lo seleccionó deliberadamente.
- **Remoose Interactive Vancouver remoto desde 2023** — full stack actual, anchor del "rol técnico convencional moderno".
- **Empresa propia AR/VR (2015-2018)** — founder/tech lead, anchor de entrepreneurship + visión.
- **Trio narrativo**: emprendimiento (AR/VR own) → rol técnico moderno (Remoose) → convergencia AI (Software Mind). Descenso cronológico ascendente refleja el viaje.
- **Vibe synthwave/vaporwave es identidad propia, no nostalgia** — era 2026 representada con estética que evoca futuro retro-AI, distinta del "outer space realista" típico de portfolios gamedev.
- **Mantra "And always show a smile"** viene del cierre de LinkedIn de Rafael — es marca personal verbal documentada en PROJECT.md tono del copy. Renderlo en HTML Vue (no Phaser) garantiza i18n + accesibilidad screen-reader sin esfuerzo extra.
- **Arrival cinematográfico ~3-4s** es el "wow" controlado del ch6 — Rafael prefirió este balance sobre loop infinito (descartado) o estática plana (descartado).
- **3 planetas distribuidos verticalmente** vs cluster horizontal — el descenso vertical requiere espaciado vertical; cada planeta ocupa una "banda" del viewport (~33% cada uno con padding).
- **Naves abstractas glitchy/neural** — encaja con tema AI/synthwave (no realistas tipo X-wing/TIE-fighter).

</specifics>

<deferred>
## Deferred Ideas

- **Sound design ch6** — REQUIREMENTS.md v2 POL-02. Música synthwave sutil + sfx al abrir planeta encajaría con la era pero queda fuera v1.
- **Easter egg Konami code o equivalente** — REQUIREMENTS.md v2 POL-04. Si Rafael quiere un segundo nivel de descubrimiento, se añade en v2.
- **Ships clickables con tooltip "skill bubble"** — idea conversation-only; no acordada. Si surge en plan-phase, queda fuera Phase 5 scope (decoración pura).
- **Planet hover con orbital animation** — si el planeta rota lentamente sobre sí mismo al hover, añadiría depth pero requiere asset spritesheet (limitación pixelforge documentada). Bajo PRM debería desactivarse. Diferido a v2 polish.
- **Más de 3 planetas** — si Rafael decide después que quiere 5-6 proyectos top, requiere re-discusión + más assets. Out of scope Phase 5.
- **Personalización in-scene (mouse-driven parallax depth)** — el parallax interno responde a scroll de cámara (D5-02), no a mouse. Mouse parallax es option C que Rafael descartó. Mantener fuera scope.
- **Chapter overlap bug fix (Phase 4 deferred)** — Phase 5 vigila + reporta; el fix dedicado queda fuera scope. Si la inserción de ch6 con canvas full-bleed agrava el bug, se documenta en W5 manual checklist para fix posterior (probablemente phase 5.1 o Phase 6).
- **Backgrounds downscale Phase 6 blocker** — ch6-bg.png hereda la misma restricción ≤80KB; planner añade target en plan W2 (asset generation). No es fix retroactivo de Phase 4 sino prevención para Phase 5.
- **iOS smoke test ch6** — Phase 1 Plan 07 deferred sigue siendo el bloqueador. Phase 5 features sensibles (Phaser canvas + bridge events + ResizeObserver) heredan el riesgo. Mitigaciones preventivas en W5 a la espera de hardware/BrowserStack.
- **Tercer idioma PT-BR/FR** — REQUIREMENTS.md v2 I18N3-01. Arquitectura escalable mantenida.
- **Deep linking #ch-6** — REQUIREMENTS.md v2 DLINK-01. No bloquea v1.
- **Animación de salida cuando se va de ch6** — si Rafael quiere que la cámara haga "ascend" cuando vuelves a ch5, requiere lifecycle distinto al `destroy(true,false)` en onBeforeUnmount. Out of scope; default es destroy clean.

</deferred>

---

*Phase: 05-phaser-chapter-6*
*Context gathered: 2026-05-14*
