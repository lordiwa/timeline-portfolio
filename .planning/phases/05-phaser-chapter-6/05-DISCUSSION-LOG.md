# Phase 5: Phaser Chapter 6 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 05-phaser-chapter-6
**Areas discussed:** Planet trio (planeta-proyectos), Scroll model (scroll vs cámara Phaser), Easter egg (mantra "And always show a smile"), Visual vibe (paleta + naves + planetas)

---

## Planet Trio (planeta-proyectos)

| Option | Description | Selected |
|--------|-------------|----------|
| Convergencia 2026 | Software Mind NA + Remoose Interactive + Empresa propia AR/VR. Narrativa: cierra el viaje en la era actual + un anchor de emprendimiento. Alineado con 'convergencia dev/QA/líder + AI'. | ✓ |
| Liderazgo a través del tiempo | Pink Parrot + number8 Lead QA + Software Mind NA. Narrativa: 3 momentos de leadership a lo largo de la carrera. | |
| Stack moderno + AI | RocketSnail + BairesDev R&D + Software Mind NA. Narrativa: tres pilares técnicos modernos que convergen. | |
| Career arc completo | Empresa propia AR/VR + VivoEnVivo + Software Mind NA. Narrativa: dos emprendimientos + rol actual. | |

**User's choice:** Convergencia 2026 (recomendado).
**Notes:** Locked como D5-01 en CONTEXT.md. Orden vertical cronológico ascendente: AR/VR (2015-18, arriba) → Remoose (2023+, medio) → Software Mind (2023+, fondo). El descenso cinematográfico revela en orden histórico, cerrando con Software Mind + mantra.

---

## Scroll Model (scroll vs cámara Phaser)

| Option | Description | Selected |
|--------|-------------|----------|
| Arrival cinematográfico + estática | Cámara desciende UNA VEZ (~3-4s) revelando los 3 planetas; queda estática post-arrival con naves cruzando en loop. Scroll del documento normal, sin atrapar input. | ✓ |
| Loop infinito Tyrian-style | Cámara desciende continuamente en loop infinito con naves spawneando. Más 'wow gamer' pero dificulta clickear planetas. | |
| Estática 1-viewport con parallax por mouse | Sin descenso. Los 3 planetas todos visibles, parallax responde a mouse. Más simple pero pierde 'descendente'. | |
| Document scroll DRIVE la cámara Phaser | Wheel del documento se proxea a la cámara Phaser. Complejo, requiere romper scroll-snap mandatory. | |

**User's choice:** Arrival cinematográfico + estática (recomendado).
**Notes:** Locked como D5-02 en CONTEXT.md. Re-entry (volver a ch5 y volver a ch6) recrea instancia limpia + reproduce arrival — comportamiento por diseño, no bug.

---

## Easter Egg (mantra "And always show a smile")

| Option | Description | Selected |
|--------|-------------|----------|
| Tras explorar los 3 planetas | Footer escondido se revela cuando el visitante abrió los 3 planet-overlays. Gamificación. | |
| Fin del arrival cinematográfico | Al terminar el descenso de la cámara, el texto aparece con fade-in suave. Todos lo ven. | ✓ |
| Oculto en el planeta Software Mind | El planeta de Software Mind trae el mantra dentro de su overlay. | |
| Banner Phaser que cruza al cargar ch6 | Texto pixel-art que cruza la pantalla horizontalmente al iniciar el arrival. | |

**User's choice:** Fin del arrival cinematográfico.
**Notes:** Locked como D5-03 en CONTEXT.md. Renderizado en HTML Vue sobre el canvas (mejor crispness e i18n directo, no requiere locale bridge). Bajo PRM aparece instantáneamente sin fade. CON-04 satisfecho.

---

## Visual Vibe (paleta + naves + planetas)

| Option | Description | Selected |
|--------|-------------|----------|
| Outer space realista pixel-art (Tyrian) | Fondo negro estrellado, planetas con biome, naves clase patrol. Paleta cyan/magenta/ámbar sobre negro. | |
| Lo-fi AI vaporwave/synthwave | Gradients violet→cyan, planetas neon-orb con halo, naves abstractas glitchy/neural. Paleta deep purple + hot pink + cyan + amber. Identidad 'futuro retro-AI'. | ✓ |
| Estación cyberpunk con paneles holo | Cámara desciende a través de estación con paneles holo + terminales AI. Riesgo: solapa visual con ch4. | |
| Espacio AI 'convergence' (data nodes + órbitas) | Planetas conectados por líneas neural network + 'data ships' tipo paquetes-de-datos. Más abstracto. | |

**User's choice:** Lo-fi AI vaporwave/synthwave (recomendado).
**Notes:** Locked como D5-04 en CONTEXT.md. Paleta: `#1a0e3d` deep purple + `#ff3ca6` hot pink + `#4dffff` electric cyan + `#ffd95c` soft amber. Encaja con era 2026 + convergencia AI. Distinta del 'outer space realista' típico de portfolios gamedev — más identidad propia.

---

## Claude's Discretion

Items derivados de las 4 decisiones lockeadas, anotados en CONTEXT.md `<decisions>` y `<canonical_refs>`:

- **D5-05** Naves: 2 unidades, loop horizontal escalonado (~12s + ~18s); estáticas bajo PRM.
- **D5-06** Interaction model: click/tap abre overlay; hover desktop muestra tooltip Phaser con nombre del planeta; mobile tap directo; keyboard via 3 buttons HTML sr-only post-canvas con `aria-label`; ESC cierra overlay.
- **D5-07** ProjectOverlay nuevo (no reusa ProjectCard skeumorphic ni FloatingPanel AR/VR): backdrop blur synthwave + glow doble cyan+pink + focus trap + click-outside cierra + mobile fullscreen.
- **D5-08** PRM heuristic: arrival = instant cut; naves estáticas; parallax sin diferencial; mantra sin fade; overlay sin scale/fade; Phaser `timeScale = 0` cinturón de seguridad.
- **D5-09** Layout: canvas full-bleed dentro de section, sin layout 2-col tipo ch3/ch4; test architectural defensivo para chapter overlap bug (Phase 4 deferred).
- **D5-10** Locale bridge granularity: solo tooltips in-Phaser usan bridge; mantra + overlay viven en Vue/HTML con `t()` directo.
- **D5-11** Lifecycle pattern: `watch(activeChapter)` mount/destroy con `import()` lazy; HMR guard via `import.meta.hot?.dispose()`.
- Parallax internal multi-capa count: 2-4 capas, recommended 3 (planner decide en research).
- Easter egg copy ES: "Y siempre muestra una sonrisa" propuesto, Rafael ratifica en W5 manual checklist.
- Tooltip styling in-Phaser: Container con Rectangle + Text (no asset adicional).
- Arrival duration: 3-4s default, planner ajusta si user testing percibe fricción.
- Bridge event naming: `locale-changed` + `vue:show-project` (PHA-06/07).
- Phaser config: pixelArt true, roundPixels true, backgroundColor `#1a0e3d`, physics none, scale NONE.
- Asset preload strategy: SpaceScene.preload sin spinner Phaser; background HTML BackgroundLayers visible durante preload.
- Tests architectural: mount/unmount no leak, i18n parity ch6, `--bg-image` declarado, naming convention extends, theme isolation extends ch6.

## Deferred Ideas

Anotados en CONTEXT.md `<deferred>`:

- Sound design ch6 (REQUIREMENTS.md v2 POL-02).
- Easter egg Konami o segundo nivel (v2 POL-04).
- Ships clickables con tooltip "skill bubble" (out of scope, decoración pura).
- Planet hover con orbital animation (limitación pixelforge spritesheets; diferido v2 polish).
- Más de 3 planetas (requiere re-discusión + más assets).
- Personalización in-scene (mouse-driven parallax depth) — opción C descartada.
- Chapter overlap bug fix (Phase 4 deferred) — Phase 5 vigila + reporta; fix dedicado fuera scope.
- Backgrounds downscale ≤80KB (Phase 6 blocker; ch6-bg.png hereda restricción).
- iOS smoke test ch6 (Phase 1 Plan 07 deferred; mitigaciones preventivas en W5).
- Tercer idioma PT-BR/FR (v2 I18N3-01).
- Deep linking #ch-6 (v2 DLINK-01).
- Animación de salida ascend cuando se va de ch6 (out of scope; default destroy clean).
