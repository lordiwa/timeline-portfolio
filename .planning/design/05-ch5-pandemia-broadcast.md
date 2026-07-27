# CH5 · "LA TRANSMISIÓN" — Dirección de arte, era pandemia/remoto (2020-2024)

> Autor: researcher (dirección de arte) · 2026-07-27
> Ámbito: `src/components/Chapter5Content.vue`, bloque ch5 de `src/styles/chapter-themes.css`
> Resuelve: TASK-007 defecto 1 (`showText = false`, 180 palabras muertas) SIN pegar texto encima de la escena.
> Nota de estilo: ninguna cadena de UI propuesta aquí contiene em-dash. Ver §9 por el em-dash preexistente del contenido.

---

## 1. POV de dirección de arte

Al entrar a ch5 no ves "pixel art de la pandemia": ves un cuarto oscuro iluminado solo por una pantalla, que es el recuerdo sensorial universal de 2020-2022. En la pantalla, recintos vacíos transmitiendo EN VIVO (box, MMA, concierto, laboratorio); en la sala, una multitud de 125 avatares que solo puede reunirse así, como se reunió todo el mundo esos años: mirando juntos a distancia. La escena no imita la época, usa el MEDIO de la época: el chrome de broadcast (badge LIVE, lower-third, contador de espectadores, subtítulos, panel lateral de stream) es el lenguaje visual legítimo de 2020-2022, y es exactamente lo que permite que 180 palabras de carrera convivan con la escena sin taparla, porque en un broadcast el overlay ES parte de la imagen. El ancla autobiográfica lo vuelve honesto en vez de nostalgia barata: Rafael fue copropietario de VivoEnVivo, una plataforma de streaming de eventos y deportes de contacto en Ecuador durante la pandemia. La pantalla del cine no es decorado: es su propia transmisión.

**Decisión de integración del texto (elegida y defendida):** el texto vive en un **panel lateral de transmisión** (el sidebar de stream: info del canal + feed con timestamps), no como bloque flotante. Se descartaron: proyectarlo en la pantalla (mide `min(17vw, 300px)`, ilegible sin destruir la composición del hall), subtítulos rotativos como carrier único (180 palabras tardarían ~54s en ciclar y un visitante que scrollea se las pierde, violando el AC de TASK-007), y créditos de cine (pasivos, sin jerarquía de lectura). El sidebar de stream es el único formato de 2020-2022 diseñado nativamente para texto largo junto a video en vivo: Twitch, YouTube Live y Zoom lo normalizaron. El scroll (permitido por el AC: "sin hacer un solo click") es la interacción que lo revela en desktop; en mobile es el layout natural de app de streaming.

---

## 2. La multitud de 125 personajes: SE CONSERVA, se gradúa

La multitud es el activo más valioso del capítulo y su ingeniería ya es correcta (un solo rAF, una tira webp por personaje, solo se muta `background-position-x`, layout determinista mulberry32, oleadas de festejo, reduced-motion respetado). **No se toca el sistema. Se corrige la fotografía.**

Por qué hoy se ve ruidosa: 125 personajes son 125 paletas sin relación entre sí, con `brightness` 0.5-1.0 y `sizeMul` 0.66-1.30. Eso es confeti, no público.

Correcciones (todas baratas, ninguna toca el bucle rAF):

1. **Grade unificador de sala.** Un overlay `div.cine-crowd-grade` sobre la zona de público (`inset: 0`, `z-index` encima de `.cine-audience`, `pointer-events: none`) con `mix-blend-mode: soft-light` y `background` = color dominante de la escena activa (reutilizar `sceneMeta[screenIdx].glowColor`, alpha 0.35). Se actualiza 1 vez cada 4.5s con `transition: background-color 800ms ease`. Efecto: las 125 paletas se subordinan a UNA luz, la de la pantalla. Es el fix número uno del ruido.
2. **Rango de brillo cinematográfico.** En `buildCrowd()`: `bright` pasa de `0.5 + t * 0.5` a `0.42 + t * 0.26` (rango 0.42-0.68). Nadie a plena luz en un cine. Los detalles de cada personaje se leen menos y la MASA se lee más: eso es lo bello de una multitud.
3. **Jitter de tamaño contenido.** `sizeMul` pasa de `0.66 + rng() * 0.64` a `0.85 + rng() * 0.30`. La perspectiva la dan los anillos (baseH ya crece con t), no el random. Menos "canguro gigante junto a hormiga".
4. **Desaturación leve global.** En `.cine-audience`: `filter: saturate(0.82)` (estático, una vez, sin costo por frame). El color pleno queda reservado a la pantalla.
5. **Festejo se conserva intacto** (es el alma de "multitud viva" que pidió Rafael), y se le suma un flash de pantalla sincronizado: al disparar `triggerCelebrationWave()`, la clase `.is-flash` en `.cine-screen-light` sube su opacity a 0.12 durante 600ms. La causa (pantalla) y el efecto (festejo) quedan conectados y la escena gana lógica interna.

Nada de esto rompe el manifest, los sheets, ni el layout PRNG. Si una captura muestra que el soft-light aplana demasiado, el fallback es `mix-blend-mode: multiply` con alpha 0.22.

---

## 3. La pantalla ("la tele"): se conserva geometría, se viste de broadcast

La pantalla y su slideshow (box, mma, concierto, lab, covid) se quedan donde están: están alineadas con la pantalla pintada de `bg-hall-v3.webp` y moverlas o agrandarlas desalinearía el fondo. Lo que cambia es que deja de ser "slideshow" y pasa a ser **señal en vivo**:

1. **Chrome dentro de la pantalla** (hijos de `.cine-screen`, CSS puro):
   - Badge `EN VIVO` arriba-izquierda: rect 4px radius, fondo `#d92626`, punto blanco pulsante 2s ease-in-out, texto blanco 7px ui-monospace uppercase. A esta escala es un chip icónico, no texto de lectura.
   - Scanlines: `repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0 1px, transparent 1px 3px)`, `opacity: 0.5`.
   - Viñeta interna: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)`.
   - Barra de señal inferior: línea 2px `#818cf8` al 100% de ancho con un shimmer sutil (gradiente animado 6s linear). No es barra de progreso falsa: es "señal", honesta.
2. **Glitch de compresión en cada cambio de escena** (el compression artifact de la época): al avanzar `screenIdx`, aplicar 140ms la clase `.is-glitch` a `.cine-screen`: animación `steps(3)` que combina `clip-path: inset()` desplazado + `filter: saturate(2) hue-rotate(12deg)` + `transform: translateX(±2px)`. Procedural, cero assets. Omitido bajo reduced-motion.
3. **Lower-third fuera de la pantalla** (esquina inferior-izquierda de la escena, z sobre el público): identifica QUÉ se transmite. Formato broadcast clásico: barra `#0d1018` alpha 0.88, filete izquierdo 3px `#d92626`, texto `#f2ede3`. Contenido por escena (i18n nuevo, claves `chapters.5.broadcast.*`):
   - box: `EN VIVO · Velada de box, recinto sin público`
   - mma: `EN VIVO · MMA, octágono a puerta cerrada`
   - concierto: `EN VIVO · Concierto transmitido, butacas vacías`
   - lab: `EN VIVO · Laboratorio, turno continuo`
   - covid: `EN VIVO · Cadena nacional, quédate en casa`
   Entra con translateY(8px)+fade 420ms `cubic-bezier(0.22, 1, 0.36, 1)`, permanece, y cross-fadea al cambiar la escena. Bajo reduced-motion: visible estático, sin animación de entrada.
4. La luz dinámica existente (`screenGlowStyle`, cono de proyector, motas) se conserva tal cual: ya es correcta y barata.

---

## 4. El texto: panel lateral de transmisión (mata `showText = false`)

`const showText = false` se ELIMINA. El bloque `<template v-if="showText">` se reemplaza por el **panel de transmisión**, montado SIEMPRE en el DOM (innerText nunca vacío, lectores de pantalla e indexadores lo ven sin depender de timers ni Phaser).

### 4.1 Anatomía (desktop y landscape)

Columna derecha, `position: absolute; right: 0; top: 0; bottom: 0`, ancho `clamp(320px, 36vw, 460px)`:

```
┌────────────────────────────────┐
│ ● EN VIVO   2020-2024          │  header: badge + año (chapter.year)
│ La era remota                  │  título (chapter.titleKey, 22px/1.2)
│ 125 espectadores conectados    │  contador, indigo #818cf8, 13px mono
├────────────────────────────────┤
│ [2020]  En number8 lideré...   │  feed: 3 párrafos de bio.eras.5,
│ [2019-2024]  En paralelo...    │  cada uno con timestamp mono a la
│ [2022+]  En RocketSnail...     │  izquierda, como mensajes fijados
├────────────────────────────────┤
│ CANALES DE LA ERA              │  label 12px caps
│ [number8] [BairesDev] [Vivo…]  │  5 ProjectCard como tarjetas "canal"
└────────────────────────────────┘
```

- Superficie: `background: rgba(10, 12, 20, 0.82)` + `backdrop-filter: blur(12px)`; borde izquierdo 1px `rgba(129, 140, 248, 0.25)`. Con blur, el peor caso de fondo (pantalla blanca pura detrás) da un fondo efectivo ~`#363840`: contraste con el texto `#f2ede3` = **8.9:1 en el peor caso**, y ~15:1 sobre la sala oscura típica. Verificable con cualquier checker WCAG usando `#f2ede3` sobre `#363840`.
- El contador "125 espectadores conectados" debe derivarse de `seats.length` (no hardcodear): el chiste es que los espectadores SON la multitud.
- Los timestamps del feed (`[2020]`, `[2019-2024]`, `[2022+]`) van como i18n keys nuevas, no parseados del texto.
- ProjectCard: la variante ch5 "modern flat" actual asume fondo blanco; necesita restyle a "canal" oscuro (superficie `#1a1626`, borde `rgba(129,140,248,0.3)`, hover borde `#818cf8`). Ver §5 tokens.

### 4.2 Comportamiento scroll (desktop)

La section ch5 pasa a `200dvh` con la escena en `position: sticky; top: 0; height: 100dvh` (patrón scrollytelling estándar; los sitios premiados integran texto largo en escena exactamente así: revelación progresiva controlada por el usuario). Beat 1: escena completa, panel asomado 56px por la derecha (affordance: se ve el borde con el badge EN VIVO girado 90°, invita a scrollear). Beat 2: al entrar el segundo viewport (IntersectionObserver sobre un sentinel, umbral 0.15), clase `.is-open` en el panel: `transform: translateX(0)` en 560ms `cubic-bezier(0.22, 1, 0.36, 1)`; la escena baja a `filter: brightness(0.85)` con transition 560ms para ceder protagonismo sin apagarse. La multitud sigue viva detrás y a la izquierda (64% del ancho mínimo).

Si el scroll-snap del shell no admite sections de 200dvh sin romper los otros capítulos (verificarlo en `App.vue`), fallback aprobado: section se queda en 100dvh y el panel monta abierto de entrada con ancho `clamp(300px, 32vw, 420px)`. El texto es visible sin ninguna interacción en ambas variantes.

- Sin JS o con reduced-motion: panel abierto, sin translate, sin dimming animado. El contenido nunca depende de la animación.

### 4.3 Mobile portrait

Layout de app de streaming de 2020 (el usuario lo reconoce sin explicación): la escena se convierte en "player" fijo arriba, 16:9, `position: sticky; top: 0`; debajo, en flujo normal, el header del canal, el feed (3 párrafos a ancho completo, 16px/1.65) y los canales en columna. La section crece a su altura natural (>100dvh). La multitud completa se ve dentro del player (la escena ya es responsive por porcentajes). Landscape mobile usa el layout desktop con panel a `min(46vw, 400px)`.

### 4.4 Jerarquía de lectura final

1. Pantalla (única fuente de luz saturada) → 2. Lower-third (nombra la transmisión) → 3. Multitud (masa unificada, movimiento de fondo) → 4. Panel (texto, aparece cuando el usuario lo pide con scroll). Ni el texto ni la escena ganan: el panel nunca cubre la pantalla ni el centro de la multitud; la escena nunca pone luz saturada dentro del área de lectura.

---

## 5. Paleta, tipografía, superficie, grid

### Paleta (hex verificables)

| Rol | Hex | Uso |
|---|---|---|
| Fondo sala profundo | `#0b0910` | base bajo bg-hall (ya cerca del actual `#04040a`, unificar) |
| Superficie panel | `rgba(10, 12, 20, 0.82)` | glass del sidebar |
| Superficie tarjeta canal | `#1a1626` | ProjectCard oscura |
| Texto primario | `#f2ede3` | feed, títulos (8.9:1 peor caso, ~15:1 típico) |
| Texto secundario | `#a89f92` | timestamps, metadata (4.6:1 sobre panel típico, AA) |
| Acento indigo | `#818cf8` | contador, links, hover, barra de señal (continuidad con HUD ch5) |
| LIVE red | `#d92626` | badge EN VIVO, filete lower-third (blanco sobre él: 4.9:1, AA bold) |
| Glow por escena | `sceneMeta` existentes | luz de sala y grade de multitud |

Actualizar el bloque `[data-chapter="5"]` de `chapter-themes.css` (hoy stub white-SaaS, contradice la escena): `--c-bg: #0b0910; --c-fg: #f2ede3; --c-accent: #818cf8; --c-surface: #1a1626; --c-border: #3a3247; --c-focus: #818cf8`. Y duplicar verbatim en `:root[data-active-chapter="5"]` según la regla de mantenimiento del propio archivo (los valores actuales del HUD, madera `#171009`, pueden migrar a estos para coherencia; decisión de bajo riesgo, mismo nivel de oscuridad).

### Tipografía (cero fuentes nuevas: el bundle ya está pasado de presupuesto)

- Cuerpo y títulos: `'Inter Variable', system-ui, sans-serif` (ya cargada para ch5).
- Chrome broadcast (badges, timestamps, contador, lower-third): `ui-monospace, 'Cascadia Mono', 'Consolas', monospace` (la misma familia que los HUDs, sin peso extra de bundle).
- Escala: 12px caps `letter-spacing: 0.08em` (labels), 13px mono (timestamps/contador), 16px/1.65 (feed), 22px/1.2 peso 650 (título del canal). Sin cambios entre ES y EN; el feed envuelve libre, sin alturas fijas, así el ES 15-20% más largo solo alarga el scroll interno del panel (que en desktop usa `overflow-y: auto` con scrollbar fina `rgba(129,140,248,0.3)` si excede).

### Grid

Panel: padding 28px, gap vertical 20px entre bloques, medida de texto máx. `52ch`. Lower-third: bottom 6%, left 4%, `max-width: 42vw`, `padding: 8px 14px 8px 12px`. Nada se posiciona en la franja central x 40-60% / y 30-50% (reservada a pantalla + cono).

---

## 6. Presupuesto de motion (verificable)

| Pieza | Motor | Curva | Frecuencia | Costo estimado |
|---|---|---|---|---|
| Multitud (giros/festejo) | rAF existente, escribe solo `backgroundPositionX` | máquina de estados propia | continuo; escrituras solo al cambiar frame | <2ms/frame ya medido en producción actual; SIN CAMBIOS |
| Grade de multitud | CSS transition en `background-color` de 1 overlay | ease 800ms | 1 vez / 4.5s | 1 paint de capa, despreciable |
| Crossfade pantalla | CSS opacity (existente) | ease-in-out 1s | 1 vez / 4.5s | compositor |
| Glitch de escena | CSS animation por clase | steps(3), 140ms | 1 vez / 4.5s | compositor + 1 paint |
| Lower-third | CSS translateY+opacity | cubic-bezier(0.22, 1, 0.36, 1), 420ms | 1 vez / 4.5s | compositor |
| Panel `.is-open` | CSS translateX + brightness escena | misma curva, 560ms | 1 vez por visita | compositor + 1 paint del filter |
| Badge LIVE, señal, motas, flicker | CSS keyframes (mayoría existentes) | ease-in-out lentas | continuo | compositor |

Reglas: prohibido animar layout (top/left/width/height) en runtime; prohibido añadir un segundo rAF (todo lo nuevo es CSS + clases via IntersectionObserver); NO reescribir la multitud a canvas: 125 nodos DOM con mutación de background-position están muy por debajo del umbral donde el batching en canvas paga (ese umbral es de miles de sprites según la literatura de performance de canvas), y el sistema actual ya existe, funciona y respeta reduced-motion. `prefers-reduced-motion: reduce`: multitud congelada (ya implementado), sin glitch, sin flash de festejo, sin oleada (ya implementado), panel y lower-third estáticos y visibles, motas ocultas (ya implementado).

---

## 7. Arte necesario y origen (Higgsfield APAGADO: solo pixelforge, Adobe post, y procedural)

| Pieza | Origen | Nota |
|---|---|---|
| Chrome broadcast completo (badges, lower-third, panel, barra señal) | CSS/HTML puro | cero assets |
| Scanlines, viñeta, glass | CSS gradients + backdrop-filter | cero assets |
| Glitch de compresión | CSS steps + clip-path (+ opcional SVG `feTurbulence`+`feDisplacementMap` si se quiere ruido real) | procedural, cero IA |
| Ruido de señal sutil sobre pantalla (opcional) | SVG `feTurbulence` inline como filter | procedural |
| Multitud + sheets | YA EXISTEN (pixellab pipeline) | no tocar |
| 5 escenas de pantalla | YA EXISTEN (`screen/*.webp`) | no regenerar |
| `bg-hall-v3.webp` regrade (solo si el grade CSS produce banding) | Adobe MCP `image_adjust_hsl` / temperatura | aplicar proceso §6.5 de CLAUDE.md (old/ + CHANGELOG) antes de sobrescribir |
| Escena de pantalla extra "estadio vacío VivoEnVivo" (opcional, nice-to-have) | pixelforge `forge_background`, preset "night" | mismo tamaño que las 5 existentes; NO usar optimize_sprite |

Nada en esta dirección requiere generación de imagen no-pixel.

---

## 8. Criterios de aceptación de la dirección (para QA)

1. `innerText` de la section ch5 contiene los 3 párrafos de `bio.eras.5` sin ningún click, en ES y EN, desktop y mobile (capturas 1440x900, 1366x768, 390x844 portrait, 844x390 landscape).
2. `showText` no existe más en el código; test de regresión que falle si el panel deja de montar bio (TASK-007 AC 7).
3. Contraste medido: `#f2ede3` sobre captura real del panel con la escena más brillante detrás >= 8.9:1.
4. El panel nunca cubre `.cine-screen` ni más del 40% del ancho en desktop.
5. FPS de la escena con panel abierto: sin regresión respecto a hoy (el rAF no cambió).
6. Con `prefers-reduced-motion: reduce`: todo el texto visible, cero animación nueva.
7. Ninguna cadena nueva (ES/EN/i18n/aria) contiene em-dash.

---

## 9. FLAG para Rafael (decisión de contenido, no de código)

Al destapar `bio.eras.5.text` se vuelve visible un em-dash preexistente en el ES, párrafo 1: "...comportamiento estadístico — bugs que se parecen más a sesgos...". La regla del sitio prohíbe em-dash en texto visible. Opciones para Rafael: (a) reemplazar por dos puntos ("estadístico: bugs que..."), (b) coma, (c) mantenerlo como excepción consciente. Revisar también el párrafo equivalente en `en.json` (bio.eras.5) antes de pintar. No lo cambio yo: es su voz.

---

## Fuentes

- Estética 2020s / compresión / espacios digitales: https://aesthetics.fandom.com/wiki/Category:2020s · https://madg.com/blog/the-graphic-design-trends-that-have-defined-the-2020s-so-far/ · https://www.creativebloq.com/design/a-quarter-century-of-design-the-25-biggest-creative-moments-of-the-last-25-years
- Lower thirds (convención broadcast): https://en.wikipedia.org/wiki/Lower_third · overlays de stream: https://www.streamscheme.com/twitch-graphics/
- Texto largo integrado en escena (scrollytelling premiado): https://www.awwwards.com/awwwards/collections/storytelling/ · https://www.vev.design/blog/scrollytelling-website/ · https://reallygooddesigns.com/scrollytelling-website-examples/
- Performance de muchos sprites (por qué NO migrar a canvas a esta escala): https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/ · https://seblee.me/2011/02/html5-canvas-sprite-optimisation/ · https://www.sitepoint.com/html5-gaming-benchmarking-sprite-animations/
