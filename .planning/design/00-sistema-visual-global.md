# 00 — Sistema Visual Global (spec de dirección de arte)

> Versión 1.0, 2026-07-27. Autor: Researcher (rol director de arte), para TASK-005 y el
> rediseño signature. Este documento es el criterio de aceptación de todo ticket de arte
> y de CSS posterior. Ningún ticket de arte o de CSS arranca sin referenciarlo.
>
> Regla editorial transversal: ningún texto destinado al sitio (copies, aria-labels,
> títulos) puede contener el carácter em-dash. Usar coma, dos puntos o punto.

---

## 1. Diagnóstico de lo incumbente

Evidencia leída: `src/styles/chapter-themes.css` (71.8 KB), `src/App.vue`,
`src/components/{ScrollShell,StickyAvatar,StickyTimeline,ContactHUD,BootScreen,BackgroundLayers}.vue`,
`PROJECT.md`, `tasks/TASK-005.json`.

Los problemas son estructurales, no de gusto:

1. **Un solo archivo global concentra 7 sistemas visuales.** `chapter-themes.css` mezcla
   tokens de era (~200 líneas legítimas) con ~1.700 líneas de CSS de componentes de
   capítulo (`.flash-y2k-*`, `.flash-war-*`, `.ch4-panel`, overlay synthwave, etc.).
   Cada capítulo inventó su propio vocabulario de clases, easings, duraciones y sombras.
   No hay escala tipográfica, ni escala de duraciones, ni banda de z-index declarada como
   token: los valores están hardcodeados y repetidos.
2. **Duplicación declarada como deuda.** El propio archivo lo admite (línea 169):
   los bloques `:root[data-active-chapter="N"]` DUPLICAN verbatim los tokens de
   `[data-chapter="N"]`, con la instrucción manual "si cambias un token allá, cámbialo acá".
   Peor: tres eras (ch2, ch3, ch5) tienen EXCEPCIONES deliberadas donde el HUD usa una
   paleta distinta a la de su propia section, porque la section quedó con el stub viejo.
   Hay dos verdades por era y ninguna es canónica.
3. **La premisa vieja era "pixel art de cada época".** TASK-005 y los stubs de Phase 2
   derivan resolución de sprites por año (128px, 96px, 64px...). Eso produce 7 variaciones
   del mismo medio (pixel art) y por eso el sitio "no evoca lo que cada era representa":
   1995 y 2013 se ven como el mismo material con distinta paleta.
4. **Las transiciones son cambios de color, no saltos de era.** El morph actual es un
   crossfade de 200ms de `--c-bg` mas un velo radial de 420ms. Ambos son el MISMO efecto
   en los 6 cruces. La única transición con carácter propio es el drenado 2→3.
5. **El chasis no tiene identidad propia.** El redesign 2026-07-09 avanzó (vidrio +
   color-mix + hairlines) pero el chasis todavía hereda `--c-fg`/`--c-accent` de la era con
   parches (`--hud-fg` capturado a mano en StickyTimeline para inmunizarse del re-scope).
   ContactHUD declara ser "invariante" (D3-10) mientras StickyTimeline es era-reactivo:
   dos filosofías conviviendo.
6. **Presupuesto tipográfico reventado.** Hay 2 tests rojos porque el bundle .woff2 pesa
   782 KB (> 350 KB) tras añadir Cinzel. Hoy se cargan al menos 7 familias
   (VT323, Comic Neue, Press Start 2P, Lobster, Audiowide, Inter Variable, Cinzel).
7. **Conflicto de asset detectado:** `public/assets/ch5-hero.webp` es un fondo SaaS blanco
   (premisa vieja), pero la dirección shipped de ch5 es "cine oscuro" (paleta
   `#171009`/`#efe7db` en el CSS) y la nueva narrativa es broadcast/streaming pandémico.
   Ese asset pertenece a la era muerta del diseño y debe reemplazarse (proceso `old/` §6.5
   del CLAUDE.md).

## 2. POV de dirección de arte

El sitio no es un museo de pixel art: es una máquina del tiempo, y una máquina del tiempo
cara se reconoce porque el VEHÍCULO es siempre el mismo y lo que cambia es el mundo por la
ventana. La regla madre del rediseño es: **cada era se representa con el MEDIO de su
época, no con pixel art teñido de su época**. 1995 es fósforo y texto, no un dibujo de una
terminal; 2001 es HTML crudo de verdad (tablas, GIFs, azul enlace), no una ilustración de
GeoCities; 2009 es vector con tweens, 2013 es flat que nace de la muerte del vector, 2015
es profundidad y luz, 2021 es señal en vivo, y 2026 es la terminal de 1995 que volvió,
ahora conversando con una IA sobre WebGL. El pixel art generado queda como UTILERÍA dentro
de las eras que lo justifican (juegos de ch0, escena Phaser de ch6), no como material
universal. El chasis (avatar, timeline, HUDs, boot) es RAFAEL-OS: una sola identidad de
cabina, monoespaciada y de vidrio oscuro, que se refina imperceptiblemente con las décadas
pero jamás se disfraza de la era que muestra. Lujo aquí significa: un solo sistema de
tokens, una sola fuente de verdad por era, presupuestos de motion medibles que crecen
monotónicamente hasta el clímax de ch6, y transiciones que se sienten como cruzar una
puerta, no como un fade.

## 3. Arquitectura de archivos y capas

`chapter-themes.css` se disuelve. Nueva estructura:

```
src/styles/
  tokens.css       @layer tokens      Tokens globales invariantes + @property (§4)
  eras.css         @layer themes      7 bloques de era, UN bloque por era (§5)
  chassis.css      @layer chassis     Identidad RAFAEL-OS de los HUDs (§6)
  transitions.css  @layer transitions Sistema de cruces de era (§7)
```

Orden de capas (una sola declaración, en `main.js` o `tokens.css`):

```css
@layer reset, tokens, themes, chassis, components, transitions, utilities;
```

Reglas duras:

- Todo CSS de componente de capítulo (`.flash-y2k-*`, `.flash-war-*`, paneles ch4, cine
  ch5, overlay ch6) migra al `<style>` del `Chapter{N}Content.vue` correspondiente
  (scoped o con prefijo). Los archivos globales de `src/styles/` no pueden contener
  selectores de componentes de capítulo. Criterio verificable: `eras.css` <= 220 líneas
  y <= 9 KB; `tokens.css` <= 180 líneas.
- Los componentes consumen SOLO tokens semánticos (`--c-*`, `--fs-*`, `--sp-*`, `--dur-*`,
  `--ease-*`, `--z-*`, `--hud-*`). Prohibido introducir hex, ms o cubic-bezier literales
  en componentes; excepción: valores decorativos únicos dentro de un asset-scene
  (ej. gradiente interno de un blob), documentados con comentario.
- Se elimina la duplicación section/HUD con un selector de doble scope por era
  (ver §5): un bloque, dos ámbitos, cero mantenimiento espejo.
- Las tres "excepciones deliberadas" de paleta HUD (ch2/ch3/ch5) se resuelven al revés:
  la paleta REAL de la escena pasa a ser LA paleta de la era (se corrigen los stubs de
  section), y desaparece la excepción.

Técnicas modernas que este sistema usa y su soporte (verificado 2026): `@layer`,
`color-mix()`, `oklch()` y `@property` son baseline en los navegadores evergreen;
scroll-driven animations (`animation-timeline: view()/scroll()`) están en Chrome/Edge 115+
y Safari 18+, Firefox parcial: SIEMPRE detrás de `@supports (animation-timeline: scroll())`
con fallback estático. Fuentes: MDN y guías 2026 (links en §10).

## 4. Tokens globales invariantes (`tokens.css`, @layer tokens)

Estos tokens NO pueden ser sobreescritos por ninguna era. Son la firma física del sitio.

### 4.1 Tipografía (escala fluida)

| Token | Valor | Uso |
|---|---|---|
| `--fs-100` | `clamp(0.72rem, 0.65rem + 0.3vw, 0.8rem)` | metadatos, ticks timeline |
| `--fs-200` | `clamp(0.88rem, 0.8rem + 0.4vw, 1rem)` | UI, HUD, captions |
| `--fs-300` | `clamp(1rem, 0.92rem + 0.5vw, 1.125rem)` | cuerpo de prosa |
| `--fs-500` | `clamp(1.25rem, 1.1rem + 0.9vw, 1.6rem)` | subtítulos, h3 |
| `--fs-700` | `clamp(1.7rem, 1.3rem + 2.2vw, 2.6rem)` | h2 de era |
| `--fs-900` | `clamp(2.2rem, 1.6rem + 3.8vw, 3.8rem)` | título de era (display) |
| `--lh-tight` | `1.12` | display |
| `--lh-body` | `1.55` | prosa |
| `--measure` | `62ch` | ancho máximo de prosa |

Reglas ES/EN (el español mide 15-20% mas): min y max de cada `clamp()` en `rem`
(WCAG 1.4.4); ningún contenedor de texto con `width`/`height` fijos en px; títulos con
`text-wrap: balance` y prosa con `text-wrap: pretty`; botones y pills con `min-width`
fluido y `padding` en `em`; todo layout de texto se QA en español primero (es el caso
largo). Prohibido `white-space: nowrap` en strings traducibles.

Presupuesto de fuentes (fix de los 2 tests rojos): máximo 4 archivos woff2, subset
`latin`, total <= 350 KB. Asignación en §5.9. Cinzel sale del bundle.

### 4.2 Espaciado, grid y radios

Se conserva la escala shipped `--sp-xs..--sp-3xl` (4/8/16/24/32/48/64). Se añade:

| Token | Valor | Uso |
|---|---|---|
| `--content-max` | `72rem` | ancho máximo de layout de capítulo |
| `--inset-chapter-top` | `calc(96px + var(--sp-md))` | reserva del avatar fixed |
| `--inset-chapter-bottom` | `calc(44px + var(--sp-md) + env(safe-area-inset-bottom, 0px))` | reserva HUDs inferiores |
| `--r-hud` | ver §6 (derivado de `--era-progress`) | radios del chasis |
| `--r-card` | `10px` | superficies de contenido |

### 4.3 Bandas de z-index (formaliza el stacking ya existente)

| Token | Valor | Ocupante |
|---|---|---|
| `--z-bg` | `-1` | BackgroundLayers |
| `--z-content` | `0` | chapter sections |
| `--z-hud` | `40` | avatar, timeline, toggles, contact |
| `--z-veil` | `48` | era-veil |
| `--z-wipe` | `49` | EraTransition |
| `--z-skip` | `50` | SkipLink |
| `--z-boot` | `60` | BootScreen, DialUpScreen |

Prohibido cualquier z-index fuera de estos siete valores.

### 4.4 Duraciones y easings

| Token | Valor | Uso |
|---|---|---|
| `--dur-tap` | `90ms` | press/hover |
| `--dur-swap` | `200ms` | avatar swap, bg crossfade (contratos D2-05 intactos) |
| `--dur-theme` | `300ms` | re-tematizado del chasis |
| `--dur-enter` | `400ms` | stagger de entrada de contenido |
| `--dur-era` | `600ms` | interpolación de `--era-progress` y cruces (cap: 700ms) |
| `--dur-ambient` | `1200ms` | Ken Burns, drifts idle |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | default global |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | salidas |
| `--ease-era` | override por era (§5.8) | motion DE CONTENIDO de la era |

Bajo `prefers-reduced-motion: reduce`: `--dur-era: 150ms`, ambient y stagger a `0ms`,
y se mantienen los contratos existentes (avatar instant, morph 150ms). Toda animación
nueva nace dentro de un gate PRM; no hay excepciones.

### 4.5 Propiedades registradas (`@property`)

```css
@property --era-progress { syntax: '<number>'; inherits: true; initial-value: 0; }
@property --c-accent     { syntax: '<color>';  inherits: true; initial-value: #7dd3fc; }
@property --c-bg         { syntax: '<color>';  inherits: true; initial-value: #0b0b16; }

:root {
  transition:
    --era-progress var(--dur-era) var(--ease-standard),
    --c-accent var(--dur-theme) ease,
    --c-bg var(--dur-theme) ease;
}
```

`App.vue` ya estampa `html[data-active-chapter="N"]`; cada era declara
`--era-progress: N`. Al estar registrada como `<number>`, la propiedad INTERPOLA:
todo lo derivado con `calc()` en el chasis (glow, radio, scanlines, §6) se desliza
suavemente entre eras sin una línea de JS. Registrar los colores como `<color>` hace que
los `color-mix()` derivados transicionen en vez de saltar. Colores nuevos se definen en
`oklch()` (rampas perceptualmente uniformes) con fallback hex en la línea anterior;
`color-mix(in oklch, ...)` para estados derivados.

## 5. `eras.css`: contrato de override por era y escalera de fidelidad

### 5.1 Contrato

Cada era es UN solo bloque con doble scope (mata la duplicación del archivo viejo):

```css
/* patrón por era; ejemplo ch6 */
[data-chapter="6"],
:root[data-active-chapter="6"] {
  --era-progress: 6;
  --c-bg: #1a0e3d;
  --c-fg: #c0e0ff;
  --c-accent: #4dffff;
  --c-accent-2: #ff3ca6;
  --c-surface: #0a061f;
  --c-border: #4dffff;
  --c-focus: #ffd95c;
  --font-display: var(--stack-mono-var);
  --font-body: var(--stack-mono-var);
  --ease-era: linear(0, 0.3 12%, 0.8 30%, 1.05 50%, 0.98 70%, 1);
}
/* --bg-image SOLO en scope de section, nunca en :root (evita contaminar bg-layers) */
[data-chapter="6"] { --bg-image: url('/assets/ch6-bg.webp'); }
```

Una era puede sobreescribir EXACTAMENTE estos 11 tokens (`--era-progress`, 6 colores,
2 fuentes, `--ease-era`, `--bg-image`) y nada mas. El chasis NUNCA consume
`--font-body`/`--font-display` de la era (usa `--hud-font` propia, §6), lo que elimina la
excepción "HUD ilegible" del archivo viejo.

### 5.2 Escalera de fidelidad (una fila por era)

Columnas: paleta (fuente del hex en §5.3), MEDIO y tratamiento de superficie, presupuesto
de motion (verificable), tipografía, verbo del visitante. La fidelidad crece
monotónicamente en: número de colores, profundidad (capas), presupuesto de motion y
tecnología de render. ch6 recibe el mayor presupuesto técnico y de arte por ser el clímax
narrativo.

| Era | Año | Paleta (bg / fg / accents) | Medio + superficie | Presupuesto de motion (verificable) | Tipografía | Verbo |
|---|---|---|---|---|---|---|
| ch0 | 1995 | `#000000` / `#ffffff` / `#aaaaaa`, `#555555` (2 tintas + 2 grises VGA) | TEXTO. Fósforo sobre negro, todo es carácter tipeado; scanlines CRT sutiles (overlay CSS <= 8% alpha); curvatura NO (cara). Cero imágenes de fondo; los juegos pixel-art existentes viven como "capturas" enmarcadas en ASCII | Nivel 0: una sola animación (caret `steps(2)` 1s infinite) + reveal de texto por `steps()` al entrar. Cero transiciones con easing curvo, cero parallax, cero rAF | Mono bitmap (VT323, único uso) todo en la misma talla, sin jerarquía tipográfica (jerarquía por MAYÚSCULAS y sangría, como DOS) | LEER |
| ch1 | 2001 | `#000080` / `#ffffff` prosa / `#ffff00`, `#ff00ff` acentos, `#0000ee` links (web-safe canónicos) | HTML CRUDO. Tablas con border visible, `background` tiled 96px, GIFs, hr, bordes `outset` 3D de botón de sistema; sin border-radius, sin sombras suaves. Feo curado: máximo 2 elementos parpadeantes visibles a la vez, prosa siempre legible | Nivel 1: GIF loops + blink/marquee reconstruidos con CSS `steps()` (nada continuo); hover con cambio de estado instantáneo (0ms, como un :hover del 2001). Cero easing suave, cero parallax, cero rAF | Web-safe stack real: `'Comic Sans MS', 'Comic Neue'` para decorado, `Times New Roman` para prosa, `Verdana` para UI. Cero webfonts nuevas (0 KB) | LEER + CLICKEAR |
| ch2 | 2009 | `#050a18` / `#f8fcff` / `#5af2ff` cyan, `#b8ff3a` lime, `#0e1c34` surface (paleta Y2K shipped, derivada de la escena real) | VECTOR. Gradientes suaves, cromo, glows, blobs líquidos, esquinas redondeadas generosas: todo dibujado con CSS/SVG, NADA rasterizado en la UI (los sprites 64px quedan confinados al match-3) | Nivel 2: transiciones y keyframes CSS con overshoot (tween Flash: `--ease-era: cubic-bezier(0.34, 1.56, 0.64, 1)`); botones con estados animados; WebGL solo DENTRO del minigame al activarlo. Cero rAF fuera del juego | Verdana/Trebuchet para prosa + Press Start 2P SOLO como etiqueta decorativa (ya cargada); headers con letter-spacing amplio Y2K | JUGAR |
| ch3 | 2013 | `#1c100c` / `#f3e4d0` / `#ffa94d` ámbar, `#4a2e22` border (paleta ember shipped de la escena "muerte de Flash"; cielo real: índigo nocturno a oro de atardecer, ver §5.3) | ILUSTRACIÓN FLAT. El vector muere y nace el flat: capas de ilustración plana 2D (sky/mountains/path shipped), sin gradientes glossy, sombras largas planas, iconografía flat | Nivel 3: PRIMER parallax. Scroll-driven CSS (`animation-timeline: view()` bajo `@supports`, fallback: capas estáticas) sobre 3 capas; transiciones CSS. Cero rAF | Display serif de época para el "réquiem" (reemplazar Cinzel: subset agresivo de una serif variable o system `Georgia` + weight; decisión en ticket de fuentes) + `system-ui` para prosa (nacimiento del flat) | DESCUBRIR |
| ch4 | 2015 | `#0a0f2e` / `#b0d0ff` / `#00ffff` cyan (shipped; el glow real del portal tira a turquesa, confirmar con sampler, §5.3) | PROFUNDIDAD. 4 capas de alta resolución flotando en el vacío (shipped: portal/matrix/character/near), glow volumétrico, paneles translúcidos con blur: el espacio deja de ser plano | Nivel 4: parallax por scroll + parallax por PUNTERO (rAF acotado: solo corre durante `pointermove` + drift idle de 1 tween CSS); tilt 3D sutil en paneles (`transform: perspective`) | Audiowide (ya cargada) para display + `system-ui` para prosa; primeros pesos variables en display si el presupuesto §4.1 lo permite | EXPLORAR |
| ch5 | 2021 | `#171009` / `#efe7db` / `#818cf8` indigo + rojo REC `#ff3b30` como acento de señal (cine oscuro shipped; `ch5-hero.webp` es de la premisa vieja y SE RETIRA, ver §5.3) | BROADCAST. Señal en vivo: viñeta de cámara, grano de sensor sutil, overlays de UI de stream (REC, latencia, viewers), luz de estudio cálida sobre oscuridad pandémica; multitud de ventanitas remotas | Nivel 5: rAF CONTINUO acotado a la escena (una sola loop: grano + luz + actividad de la multitud), pausado cuando la section no está activa (IntersectionObserver ya disponible via scrollState) | Inter Variable (ya cargada, ÚNICA sans del bundle) en 2 ejes (wght, opsz); jerarquía por peso, no por familia | OBSERVAR |
| ch6 | 2026 | `#1a0e3d` / `#c0e0ff` / `#4dffff` cyan, `#ff3ca6` magenta, `#ffd95c` ámbar (D5-04 shipped, confirmada visualmente contra `ch6-bg.webp`: nebulosa magenta, horizonte cyan, cielo índigo) | LA TERMINAL VUELVE. WebGL Phaser full-scene (shipped) + overlay de terminal conversacional: el prompt de ch0 reaparece, ahora hablando con una IA; shaders (bloom/scanline shader en Phaser), luz real, física de drones/ships | Nivel 6 (MÁXIMO): WebGL continuo + shader post-proceso + física + tipografía kinética en el overlay. Presupuesto: 60fps desktop, 30fps mobile con degradación (desactivar post-proceso primero) | Mono VARIABLE kinética (una sola nueva webfont del presupuesto: mono variable con eje wght animable) que rima con la VT323 de ch0: el círculo se cierra | OPERAR (conversar con la IA, pilotar la escena) |

### 5.3 Procedencia de los hex (obligación TASK-005 AC#2)

Declaración honesta: este documento NO ejecutó pixel-sampling programático (rol
read-only). Los hex citados provienen de dos fuentes: (a) bloques CSS shipped que ya
fueron calibrados contra las escenas reales (`:root[data-active-chapter]` de
`chapter-themes.css`, paleta D5-04 de ch6, paleta Y2K de ch2, ember de ch3, cine de ch5),
y (b) verificación VISUAL de los assets `ch6-bg.webp`, `ch5-hero.webp`, `ch3-sky.webp` y
`ch4-portal.webp` realizada en esta sesión. Antes de generar arte nuevo, el ticket
implementador DEBE pixel-samplear y registrar archivo de origen por color, mínimo:

- ch3: cielo `ch3-sky.webp` (banda índigo superior, banda oro inferior, disco solar) y
  `ch3-bust.png` (piel/pelo/ojos, es LA referencia de busts según memoria del proyecto).
- ch4: halo real del portal en `ch4-portal.webp` (a ojo es mas turquesa que `#00ffff`).
- ch6: nebulosa y horizonte de `ch6-bg.webp` para validar `#ff3ca6`/`#4dffff`.
- ch5: NO samplear `ch5-hero.webp` (asset de la premisa vieja, se retira a
  `public/assets/old/` con entry en CHANGELOG según CLAUDE.md §6.5).
- ch0/ch1: exentos de sampling: son paletas canónicas de plataforma (VGA 16 y web-safe),
  no arte generado.

### 5.4 Regla anti-regresión de la escalera

Un PR viola la escalera si: (a) introduce rAF en ch0-ch3, (b) introduce parallax en
ch0-ch2, (c) introduce WebGL fuera de ch2-minigame y ch6, (d) le da a cualquier era un
presupuesto mayor que el de ch6, o (e) reintroduce pixel art como material de UI fuera de
la utilería diegética (juegos ch0, minigame ch2, escena ch6, busts del avatar).

## 6. El chasis: RAFAEL-OS (spec de `chassis.css`)

### 6.1 Concepto

El chasis es la CABINA de la máquina del tiempo y tiene una sola identidad transversal:
**RAFAEL-OS**, el sistema que arranca en el BootScreen. El boot no es un intro decorativo:
es el origen del chasis. Todo HUD es un remanente de ese OS: tipografía monoespaciada,
hairlines de fósforo, corner brackets, vidrio oscuro. La era jamás cambia la GEOMETRÍA ni
la FUENTE del chasis; solo lo tiñe y lo refina.

### 6.2 Tokens del chasis (invariantes, definidos una vez)

```css
@layer chassis {
  :root {
    --hud-font: ui-monospace, 'Cascadia Mono', 'SF Mono', Consolas, monospace;
    --hud-glass: color-mix(in oklch, var(--c-bg) 78%, transparent);
    --hud-line: color-mix(in oklch, var(--c-accent) 40%, transparent);
    --hud-fg: var(--c-fg);            /* capturado a nivel :root, ya inmune al re-scope */
    --hud-blur: 14px;
    /* Evolución continua con la década, derivada de --era-progress (0..6): */
    --hud-radius: calc(2px + var(--era-progress) * 1.5px);        /* 2px DOS -> 11px 2026 */
    --hud-scanline-alpha: calc(0.12 - var(--era-progress) * 0.018); /* CRT -> vidrio puro */
    --hud-glow: calc(2px + var(--era-progress) * 3px);            /* fósforo -> neón */
  }
}
```

Como `--era-progress` está registrada e interpola (§4.5), el chasis se desliza entre
estos estados en `--dur-era` sin JS: en 1995 es una cabina CRT de esquinas duras y
scanlines; en 2026 es vidrio neón pulido. UNA identidad, evolución continua, cero saltos.
Bajo PRM la transición de `--era-progress` dura 150ms (sigue siendo un cambio de estado
perceptible, no una animación).

### 6.3 Especificación por componente

- **BootScreen**: se conserva tal cual (es la pieza mas fuerte del sitio). Único ajuste:
  su tipografía pasa a `--hud-font` y sus colores a tokens, para que el visitante
  reconozca que los HUDs son el mismo OS que arrancó.
- **StickyAvatar** (80x96, contratos intactos): marco RPG shipped se conserva; los
  pseudo-elementos pasan a consumir `--hud-line`, `--hud-radius`, `--hud-glow`. El
  crossfade 200ms del bust no cambia.
- **StickyTimeline**: se conserva la espina de nodos shipped (pasado relleno / activo glow
  / futuro hueco). Cambios: el panel usa `--hud-glass`/`--hud-line`/`--hud-radius`; el
  hack local `--hud-fg` se borra (ya vive en `:root` del chasis); tipografía
  `--hud-font` y `--fs-100`. Los rombos siguen vistiendo el `--c-accent` de SU era
  (decisión correcta: cada nodo es una puerta a su tiempo).
- **ContactHUD + LangToggle + SoundToggle**: pierden su estatus "invariante con tokens
  neutros" (D3-10 queda superada por esta spec) y adoptan el material del chasis:
  mismo vidrio, misma hairline teñida por `--c-accent`, mismos radios. Tap targets 44px
  y focus-visible universales intactos.
- **Etiqueta de sistema**: un microtexto mono permanente en el borde del panel del
  timeline: `RAFAEL-OS v7.0 // {year}` donde `{year}` es el año de la era activa. Es el
  hilo diegético que une boot, chasis y navegación. (String traducible sin em-dash.)

### 6.4 Responsive del chasis

- Mobile portrait (<600px): timeline colapsa a rail de nodos sin texto de era (shipped),
  avatar 64x77 (misma proporción), ContactHUD horizontal bottom-right, SoundToggle y
  LangToggle en la fila superior. Nada del chasis pisa `--inset-chapter-*`.
- Landscape mobile (alto < 480px): avatar y timeline comparten el borde izquierdo;
  el timeline pierde el panel de vidrio y deja solo espina + nodos (menos superficie).
- `env(safe-area-inset-*)` en los cuatro HUDs fijos (ya presente en ContactHUD).

## 7. Transiciones entre eras: puertas, no fades

### 7.1 Sistema

Se conserva la arquitectura shipped (EraTransition z-49 + era-veil z-48 + morph 200ms de
fondo) pero EraTransition pasa a ser un sistema parametrizado por CRUCE, no un efecto
único. Un mapa de configuración por frontera (6 cruces hacia adelante, el reverso usa el
mismo efecto invertido). Presupuesto duro: <= 700ms por cruce, solo `transform`/`opacity`
(mas el pixel-dissolve shipped que ya es performante), PRM: todo cruce degrada a
crossfade 150ms sin excepciones. El disparador sigue siendo el cambio de
`activeChapter` (estado JS), NO scroll-driven: un cruce es un cambio de estado.

### 7.2 Tabla de cruces (cada uno usa el LENGUAJE DEL MEDIO de destino)

| Cruce | Nombre diegético | Efecto (implementable con lo shipped) |
|---|---|---|
| 0 → 1 | "Conectando" | Tear horizontal CRT: 3 bandas del viewport se desplazan en X 8-12px con `steps(3)` + flash blanco de 1 frame; DialUpScreen sigue cubriendo la primera visita. El pixel-dissolve usa bloques GRANDES (24px) color `#000080` |
| 1 → 2 | "Cargando plugin" | Barra de progreso falsa (2 segmentos, 300ms) en el borde inferior + cortina vector: un wipe de gradiente cyan con overshoot `--ease-era` de ch2. Bloques del dissolve: 16px |
| 2 → 3 | "La muerte de Flash" | SE CONSERVA el drenado de color shipped (es la transición signature). Sin cambios |
| 3 → 4 | "Ganando profundidad" | Punch de zoom: la capa saliente escala 1 → 1.06 y desenfoca (opacity out), la entrante entra desde scale 0.98; el dissolve usa bloques 8px teñidos del cyan del portal |
| 4 → 5 | "En vivo" | Corte de broadcast: 2 frames de negro + blip de overlay `REC` en la esquina + roll vertical de 6px (una sola vez). Es el cruce mas seco: así corta una señal |
| 5 → 6 | "Reboot" | Cita al BootScreen: 1 frame negro, caret parpadea 2 veces (240ms, `steps(2)`), y la escena synthwave inunda con el dissolve a bloques 4px. El círculo 1995-2026 se cierra con el mismo cursor |

Nota de monotonía: el tamaño de bloque del pixel-dissolve DECRECE (24 → 16 → 8 → 4 px)
conforme avanza la década: la resolución del mundo aumenta al viajar al futuro. Es la
misma pieza de código con un parámetro por cruce.

### 7.3 Dentro de cada capítulo

Los reveals internos usan scroll-driven animations CSS (`view()`) bajo
`@supports (animation-timeline: scroll())`, con el stagger shipped como fallback. Nada de
IntersectionObserver nuevo para decoración; el que existe (scrollState) queda para estado.

## 8. Riesgos y qué NO hacer

1. **NO reintentar los busts sin método.** El rework de junio 2026 fue revertido; la causa
   raíz documentada fue arte sin spec medible y hex inventados. Todo arte nuevo referencia
   §5.2/§5.3 y pixel-samplea contra `ch3-bust.png`.
2. **NO introducir GSAP, Framer, Tailwind ni React-anything.** Todo lo especificado se
   implementa con CSS plano + Vue + Phaser. Las técnicas citadas de sitios premiados
   (mask wipes, revelaciones por bloques) están traducidas aquí a CSS/It-shipped.
3. **NO usar la View Transitions API como base** de los cruces: EraTransition shipped ya
   cubre el caso same-document con control fino; VT API queda anotada como mejora opcional
   futura, no como dependencia.
4. **NO animar `filter`, `background-position` ni `box-shadow` en scroll** (jank);
   parallax y cruces solo con `transform`/`opacity`.
5. **NO dejar que ch1 sea feo de verdad.** "Feo curado": máximo 2 parpadeos simultáneos,
   prosa siempre en blanco legible sobre navy (el magenta `#ff00ff` queda para decorado,
   nunca para párrafos; corrige el tradeoff 3.2:1 del archivo viejo).
6. **NO añadir webfonts fuera del presupuesto** (4 archivos, <= 350 KB, subset latin).
   Cinzel sale; la mono variable de ch6 es la única alta nueva permitida.
7. **NO recrear la duplicación section/HUD**: si un token de era necesita un valor
   distinto para el chasis, el problema es del chasis (usa `--hud-*`), no de la era.
8. **NO omitir el gate PRM en nada animado**, incluida la interpolación de
   `--era-progress` (150ms bajo PRM) y los cruces (crossfade 150ms).
9. **Riesgo de soporte**: `@property` y scroll-driven animations no cubren Firefox ESR
   viejo; el sitio debe verse COMPLETO (estático) sin ellas: son capa de mejora.
   `color-mix(in oklch)` es baseline; si QA detecta un desvío de tono vs srgb en un
   derivado concreto, se fija ese derivado en hex sampleado.
10. **Riesgo de scope**: migrar 1.700 líneas de CSS de componentes a los
    `Chapter{N}Content.vue` puede romper especificidad (scoped vs global). Hacerlo era
    por era con screenshot-diff, no en un big-bang.

## 9. Orden de implementación sugerido (para el Orchestrator)

1. `tokens.css` + `@property` + bandas z + duraciones (cero cambio visual).
2. `eras.css` con bloques de doble scope; borrar la duplicación y las 3 excepciones
   (las sections adoptan la paleta real de su escena).
3. `chassis.css` + `--era-progress` (el chasis empieza a evolucionar solo).
4. Migración era por era del CSS de componentes a sus .vue (screenshot-diff por era).
5. `transitions.css` + mapa de cruces en EraTransition.
6. Tickets de arte por era (ch5 broadcast primero: su asset actual es de la premisa
   muerta), cada uno con sampling registrado.

## 10. Fuentes

- MDN: CSS scroll-driven animations y `animation-timeline`:
  https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- Josh Comeau, Scroll-Driven Animations (patrones y gates PRM):
  https://www.joshwcomeau.com/animation/scroll-driven-animations/
- Guía moderna de tokens con `@layer`/`@property`/oklch/color-mix:
  https://explainx.ai/blog/modern-css-features-2026-guide y
  https://www.frontendtools.tech/blog/css-variables-guide-design-tokens-theming-2025
- W3C Design Tokens (color module 2025.10, primitivos vs semánticos):
  https://www.designtokens.org/tr/drafts/color/
- Smashing Magazine, fluid typography con clamp (y advertencia WCAG 1.4.4):
  https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/
- Codrops, transiciones de máscara por bloques en scroll (referencia de lenguaje visual;
  aquí traducido a CSS/dissolve propio, sin GSAP):
  https://tympanus.net/codrops/2026/03/11/svg-mask-transitions-on-scroll-with-gsap-and-scrolltrigger/
- Awwwards, colección de transiciones entre secciones fullscreen:
  https://www.awwwards.com/awwwards/collections/transitions/
