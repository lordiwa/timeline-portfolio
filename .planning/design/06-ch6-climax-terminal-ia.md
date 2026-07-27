# CH6 CLIMAX: "La misma linea" (terminal + IA, cierre circular)

Direccion de arte + especificacion tecnica. Autor: Researcher (direccion de arte panel).
Fecha: 2026-07-27. Consumidores: developer (implementacion), reviewer (verificacion),
TASK-007 (defectos 2 y 3 quedan resueltos por esta spec).

REGLA DE ESTILO DE ESTE DOCUMENTO Y DE TODO TEXTO PROPUESTO: prohibido el caracter
em-dash. Toda copy propuesta aqui ya cumple. Verificable por grep.

---

## 0. Tesis de direccion de arte

El sitio abre en 1995 con un nino frente a un prompt `C:\>` y un cursor `█` que
parpadea. El climax NO es una escena espacial mas grande: es el REGRESO a ese
prompt, tres decadas despues, cuando del otro lado del cursor ya no hay un
interprete de comandos sino una inteligencia. La escena espacial existente pasa a
ser el TELON: durante el capitulo se disuelve en texto (render ASCII por shader),
pasa por binario y termina siendo terminal puro. La imagen final del sitio es la
misma imagen inicial, madurada: un prompt, un cursor, y esta vez una respuesta.

Tres actos:

1. **LLEGADA** (0 a ~2.2s): descenso de camara existente, acortado y re-encuadrado.
   La postal final ahora contiene TODO (ver seccion 2: rescate).
2. **UNISONO** (~2.2s a ~8s): Rafael y el robot completan JUNTOS la megaestructura.
   No dos grupos: un mismo trabajo visible (seccion 6).
3. **RETORNO AL TERMINAL** (desde ~4s, solapado): la conversacion con la IA corre
   en DOM (siempre presente, seccion 5) mientras un PostFX pipeline convierte la
   escena en ASCII: primero imagen, luego binario, luego glifos plenos. El cierre
   "Cada etapa parecia un salto. Vista de lejos, era una sola linea." se decodifica
   desde binario, caracter por caracter, junto a un cursor `█` identico al de ch0.

Lo procedural es la ventaja: en un capitulo cuyo lenguaje es texto, no hace falta
ni un solo asset raster nuevo. Todo lo especificado aqui es GLSL, Canvas 2D,
tipografia y CSS.

---

## 1. Fixes obligatorios ANTES de cualquier arte nuevo (rescate)

Hallazgo confirmado: la banda de camara final es `scrollY = 1350`, viewport
`[1350, 1890]`. Quedan FUERA: planeta remoose (y=1080), planeta ar-vr (y=594),
dron y=1040, dron y=580. Ademas `computeZoom()` en `src/phaser/index.js:47` y su
copia en `Chapter6Content.vue:92` calculan contra `window.innerWidth/Height` en
vez del rect del host: medido, canvas 1536x864 dentro de host 1521x791 con offset
vertical de -72.8px. Gran parte del climax YA EXISTE y no se ve.

### 1.1 computeZoom contra el host (bug fix, no negociable)

```js
// createGame(parentEl, ...) ya recibe el host: usarlo.
function computeZoom(hostEl) {
  const r = hostEl.getBoundingClientRect()
  return Math.max(1, r.width / BASE_W, r.height / BASE_H)
}
```

- `Chapter6Content.vue` elimina su copia local y pasa `canvasHostRef.value` (o el
  factory exporta `computeZoom` y el componente la importa dentro del lazy chunk).
- `applyCanvasAnchor` y el ResizeObserver usan el MISMO rect (`offsetWidth/Height`
  del host, nunca `window`).
- Test de regresion: con host 1521x791 mockeado, zoom esperado
  `max(1, 1521/960, 791/540) = 1.5844`, canvas display 1521x855.6, exceso vertical
  64.6px recortado arriba por el anclaje bottom. Nunca mas offset fantasma.

### 1.2 Recomposicion del mundo: todo el climax en la banda visible

Decision: NO alargar el tour de camara (el arrival largo era parte del problema:
3.5s de nada interactivo). Se comprime el mundo util a la banda final.

- `ARRIVAL_DURATION_MS`: 3500 -> 2200. Ease igual (`Power2.easeOut`). PRM: corte
  instantaneo como hoy.
- Planetas: se mudan a la postal final como "mundos en construccion" orbitando el
  anillo. Nuevas posiciones world-space (banda [1350, 1890], margen 40px):
  - `ar-vr`: x=170, y=1425 (arriba-izquierda, radio reducido a 56)
  - `remoose`: x=820, y=1455 (arriba-derecha, radio 62)
  - `software-mind`: x=600, y=1566 (queda donde esta: ya era visible)
  - Radio: `PLANET_R` pasa a ser por-planeta (56/62/90). `software-mind` domina:
    es el presente. Hit areas y tooltips se conservan tal cual.
- Drones y=580 e y=1040: reubicar a y=1418 (x=260) e y=1512 (x=340). Los 5 drones
  quedan en cuadro.
- El descenso ahora atraviesa cielo vacio con nebulosas (el shader bg ya lo pinta)
  y aterriza en una postal DENSA. Eso es correcto: el vacio arriba hace mas rica
  la llegada.
- Los delivery bots (Amazon/Uber) se conservan: ya viven en banda visible y venden
  la era agentic con humor.

### 1.3 Que se rescata y que se retira

| Elemento existente | Veredicto | Motivo |
|---|---|---|
| Shader bg GLSL (nebulosas fBm + starfield) | RESCATAR intacto | Es la mejor pieza del capitulo; ademas alimenta el ASCII (seccion 4) |
| Planetas procedurales | RESCATAR + mudar | Seccion 1.2 |
| Anillo wireframe | RESCATAR + protagonizar | Es el objeto del unisono (seccion 6) |
| Filamento neural Rafael-robot | RESCATAR + extender | Semilla del unisono; se le suma el segundo tramo (seccion 6) |
| Paneles Asimov (`_buildAsimovPanels`) | RETIRAR | Texto dentro de Phaser: borroso, no accesible, no i18n. Sustituido por la conversacion DOM |
| Glitch de horizonte (flash fullscreen) | RETIRAR | Ruido sin significado; compite con el takeover ASCII |
| Ships loop 12s/18s | RESCATAR | Vida de fondo barata |
| Mantra gateado por `arrivalDone` | REEMPLAZAR | Pasa al DOM permanente (seccion 5.4) |

---

## 2. Composicion de la postal final (world y en [1350, 1890])

Lectura en Z (de fondo a frente):

1. Shader bg (depth 2): nebulosas + glow horizonte, sin cambios.
2. Anillo (depth 8) + laseres de construccion (depth 9).
3. Planetas ar-vr / remoose flanqueando arriba (depth 20-21), software-mind centro.
4. Drones + bots (depth 25), plataforma (30), heroes (35), filamento (36).
5. NUEVO cursor-estrella compartido (depth 37, seccion 6).
6. Ships (scrollFactor 0, depth 50).
7. PostFX ASCII sobre la camara entera (seccion 4).
8. DOM encima del canvas: panel de conversacion (seccion 5), z-index 40.

Focal points: desktop centra x=480 como hoy; portrait mantiene focal 30%
(robot x=190 y Rafael x=304 visibles). Los planetas mudados caen fuera del focal
portrait por diseno: en portrait la historia es heroes + conversacion, y los
planetas siguen accesibles via sr-only buttons y overlay.

---

## 3. Acto 1 y transiciones de camara

- Descenso 2200ms. Al completar: `arrival-complete` se sigue emitiendo (compat
  con tests), pero YA NADA de contenido depende de el (TASK-007 criterio 3).
- 300ms despues de arrival: arranca Acto 2 (unisono, tweens de struts).
- El Acto 3 (ASCII + conversacion DOM) NO espera a Phaser: el panel DOM monta con
  el componente y arranca su timeline propio a los 800ms de visibilidad de ch6
  (IntersectionObserver o `activeChapter === 6`, no eventos de Phaser). Si Phaser
  nunca bootea (WebGL roto, JS parcial), la conversacion existe igual.

---

## 4. ASCII + shader: la escena que se vuelve texto

### 4.1 Tecnica elegida (con fuentes)

Render ASCII clasico por GPU: dividir el framebuffer en celdas, calcular
luminancia por celda y sustituir cada celda por un glifo de una rampa ordenada
por densidad de tinta. Referencias reproducibles:

- Codrops "Efecto: Building Real-Time ASCII and Dithering Effects with WebGL
  Shaders" (ene 2026): glifos PROCEDURALES en grilla 5x7 dentro del fragment
  shader (cada caracter es una funcion que devuelve 0/1 por posicion), luminancia
  perceptual `dot(rgb, vec3(0.299, 0.587, 0.114))`, cada celda independiente ->
  100% GPU. <https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/>
- mattdesl `glsl-ascii-filter`: la misma idea minimalista, glifos por bitmask
  float. <https://github.com/mattdesl/glsl-ascii-filter>
- Adam Sawicki "ASCII Art in Pixel Shader": mapeo luminancia -> glifo con textura
  de fuente. <https://asawicki.info/news_1277_ascii_art_in_pixel_shader>
- Familia Acerola (video "I Tried Turning Games Into Text") y derivados: mejorar
  legibilidad con Difference-of-Gaussians + Sobel para dibujar ARISTAS como
  glifos direccionales (`| / \ _`). Repo ejemplo:
  <https://github.com/AbstractBorderStudio/Ascii_Shader>

Decision: glifos PROCEDURALES por bitmask (sin atlas de textura). Razones:
GLSL 1.00 compatible con el resto de la escena, cero assets, cero fetch de
fuente, y el 5x7 casa con la estetica chunky del sitio. El paso DoG+Sobel es
OPCIONAL de tier alto (seccion 8): la version base ya es bella porque la escena
subyacente es de alto contraste neon.

### 4.2 Integracion en Phaser 3.90

`PostFXPipeline` es el mecanismo oficial para post-proceso fullscreen:
se extiende `Phaser.Renderer.WebGL.Pipelines.PostFXPipeline` con un fragShader
propio y se aplica a la camara con `camera.setPostPipeline(AsciiPipeline)`.
Docs: <https://docs.phaser.io/api-documentation/class/renderer-webgl-pipelines-postfxpipeline>
y notas rex: <https://rexrainbow.github.io/phaser3-rex-notes/docs/site/postfx-pipeline/>

- Archivo nuevo: `src/phaser/AsciiPostFX.js`. Registro en `createGame` via
  `renderer.pipelines.addPostPipeline('AsciiPostFX', AsciiPostFX)` solo si
  `renderer.gl` existe.
- El pass corre a la resolucion del drawing buffer (960x540, el zoom es escala
  de presentacion), o sea 0.52 MP por frame: barato incluso en movil.
- Uniforms: `uMix` (0..1 progreso del takeover), `uMode` (0 imagen, 1 binario,
  2 rampa plena; interpolable), `uTime`, `uCell` (px por celda, default 8),
  `uTint` (0..1, cuanto se re-colorea a fosforo).
- Vue controla `uMix` via bridge event `ascii-progress` (game.events), emitido
  por el timeline de la conversacion DOM (el DOM manda, Phaser obedece; nunca al
  reves).

### 4.3 GLSL pseudocodigo de las funciones clave

```glsl
// Luminancia perceptual (Rec.601, igual que Codrops/Sawicki)
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Glifo procedural: bitmask 5x7 empaquetada en float (tecnica mattdesl).
// n = bitmask del caracter, p = posicion 0..4 x 0..6 dentro de la celda.
float glyph(float n, vec2 p) {
  // fuera de la caja del glifo
  if (clamp(p.x, 0.0, 4.0) != p.x || clamp(p.y, 0.0, 6.0) != p.y) return 0.0;
  float bit = mod(floor(n / exp2(floor(p.y) * 5.0 + floor(p.x))), 2.0);
  return bit;
}

// Rampa por densidad: espacio . : + * # @ (7 niveles) para uMode=2.
// Para uMode=1 (binario) la rampa colapsa a dos glifos: '0' y '1'.
float glyphForLuma(float l, float mode, vec2 p, vec2 cellHash) {
  if (mode < 0.5) {                      // binario
    float bit = step(0.5, l);
    // jitter temporal: algunas celdas oscilan 0<->1 (hormigueo de datos)
    bit = abs(bit - step(0.985, fract(cellHash.x * 337.0 + uTime * 0.6)));
    return glyph(bit > 0.5 ? BM_ONE : BM_ZERO, p);
  }
  float idx = floor(l * 6.999);          // 0..6
  return glyph(rampBitmask(idx), p);     // lookup constante if/else (GLSL 1.0)
}

// Dither ordenado Bayer 4x4 antes de cuantizar la luma:
// evita banding en las nebulosas al pasar a 7 niveles.
float bayer4(vec2 fragXY) {
  // matriz clasica /16, indexada con mod(fragXY, 4)
  ...
  return (m - 7.5) / 16.0;
}

// Wipe organico del takeover: umbral por fBm, no cortina lineal.
// Reutiliza vnoise/fbm3 YA presentes en SPACE_BG_FRAG (iquilezles.org/articles/fbm
// y /articles/warp para el domain warp opcional del borde).
float takeover(vec2 uv, float mix01) {
  float n = fbm3(uv * 3.0 + vec2(0.0, uTime * 0.02));
  // borde de 0.12 de ancho donde la imagen "hierve" en caracteres
  return smoothstep(mix01 - 0.12, mix01, uv.y * 0.65 + n * 0.35);
}

void main() {
  vec2 cellPx  = floor(gl_FragCoord.xy / uCell) * uCell;   // esquina de celda
  vec2 inCell  = (gl_FragCoord.xy - cellPx) / uCell;        // 0..1 dentro
  vec3 src     = texture2D(uMainSampler, (cellPx + uCell*0.5) / uResolution).rgb;
  float l      = clamp(luma(src) + bayer4(gl_FragCoord.xy) * 0.08, 0.0, 1.0);
  float ink    = glyphForLuma(l, uMode, inCell * vec2(5.0, 7.0), cellPx);
  // color: el glifo hereda el color de la escena, tintado hacia fosforo
  vec3 phosphor = vec3(0.30, 1.0, 0.62);                    // verde CRT
  vec3 glyphCol = mix(src * 1.35, phosphor * (0.35 + 0.65 * l), uTint);
  vec3 asciiCol = ink * glyphCol;                            // fondo negro
  float m      = takeover(gl_FragCoord.xy / uResolution, uMix);
  vec3 outCol  = mix(texture2D(uMainSampler, vUv).rgb, asciiCol, m);
  // scanline sutil (2px) solo donde ya es ASCII, opacidad 0.06
  outCol *= 1.0 - 0.06 * m * step(0.5, mod(gl_FragCoord.y, 2.0));
  gl_FragColor = vec4(outCol, 1.0);
}
```

Notas duras:
- `uCell = 8` a 960x540 da 120x67 celdas: leible y todavia "imagen". El modo
  binario usa `uCell = 10` (se interpola al cambiar de modo).
- El tinte fosforo: `uTint` va 0 -> 0.85 durante el takeover. Empezamos con los
  glifos HEREDANDO el color synthwave de la escena (elegancia: el texto ES la
  imagen, mismo cuadro cromatico) y solo al final viramos a verde CRT. Ese venteo
  cromatico es la cita a 1995 sin disfrazar todo el capitulo de 1995.
- Por que no queda "truco de novedad": (a) el ASCII nunca es filtro gratuito,
  llega motivado por la conversacion (causa visible), (b) preserva la paleta
  antes de virar, (c) el borde del wipe es organico (fBm), no un slider, y
  (d) termina en contenido real: el binario decodifica la tesis (seccion 5.3).

### 4.4 Estados del takeover

| Fase | uMix | uMode | uTint | Disparador |
|---|---|---|---|---|
| Escena pura | 0 | n/a | 0 | mount |
| Primeros tokens IA | 0 -> 0.45 | 2 (rampa) | 0 -> 0.3 | inicio streaming (DOM) |
| Parrafo 2 | 0.45 -> 0.8 | 2 -> 1 (binario) | 0.3 -> 0.6 | 45% del texto |
| Cierre | 0.8 -> 1.0 | 1 -> 2 | 0.6 -> 0.85 | frase final decodificando |
| Reposo final | 1.0 con uTime vivo | 2 | 0.85 | idle: la escena "respira" en texto |

PRM: `uMix` fijo 0.35, `uMode` 2, `uTime` congelado (igual que el bg hoy),
sin animacion de wipe. Resultado estatico y bello: escena synthwave con el tercio
inferior ya convertido en texto, como un grabado.

---

## 5. La conversacion con la IA (corazon del capitulo, DOM-first)

### 5.1 Principio innegociable (TASK-007 defectos 2 y 3)

El texto completo vive en el DOM desde el mount del componente, con
`bio.eras[6].textKey` como respuesta de la IA. Cero dependencia de
`arrival-complete`, de tweens, de WebGL o de Phaser. `innerText` del chapter es
no-vacio siempre. El streaming es un ENHANCEMENT visual sobre texto ya presente.

Implementacion del reveal accesible:
- Markup: `<section class="ch6-convo" aria-label="...">` con parrafos reales.
- Cada parrafo se parte en spans de token (split por espacios) SOLO en runtime
  y SOLO si `!prefersReduced && JS activo`; el fallback sin JS es el texto plano.
- Los spans arrancan `opacity: 0.001` (no `display:none`, no `visibility:hidden`):
  lectores de pantalla e indexadores ven todo el texto siempre; el ojo ve el
  streaming. `aria-live` NO se usa (el texto ya esta; no hay que anunciarlo dos
  veces).
- Lock de regresion (tests-after): render de `Chapter6Content` sin ningun evento
  Phaser -> `wrapper.text()` contiene un fragmento de `bio.eras.6.text` y el
  mantra. Segundo lock: grep de ausencia de `v-if="arrivalDone"` envolviendo bio.

### 5.2 Guion de la conversacion (auto-play, sin interaccion)

El panel es una terminal moderna: la estetica heredera de las TUI actuales
(cursor block, prompt glyph, tokens en streaming, latencia visible; ver
"The Terminal Renaissance" <https://hyperbliss.tech/blog/2026.04.04_terminal-renaissance/>
y la coleccion Awwwards de terminal aesthetics
<https://www.awwwards.com/inspiration_search/terminal/>).

Timeline (t = visibilidad de ch6, no Phaser):

1. `t+0.0s` DOM completo ya montado (todo el texto presente).
2. `t+0.8s` Banner de boot, 4 lineas con reveal escalonado, cita EXACTA del
   formato del banner ch0 (4 spans, delays 0 / 1.2 / 2.0 / 2.5 clavados a los de
   `TerminalScroll.vue` bannerLines):
   - ES: `MATOVELLE AGENT SHELL Version 31.0` / `(C) 1995-2026 una sola linea` /
     ` ` / `>`
   - EN: `MATOVELLE AGENT SHELL Version 31.0` / `(C) 1995-2026 one single line` /
     ` ` / `>`
3. `t+3.2s` El prompt del humano se auto-tipea (70ms/char con jitter, mismo
   `typeString` pattern de TerminalScroll):
   - ES: `> cuentame como llegaste hasta aqui`
   - EN: `> tell me how you got here`
4. `t+6s` Latencia VISIBLE de la IA: 900ms con indicador `▍▍▍` pulsante y una
   linea de estado tenue (ES: `pensando...` EN: `thinking...`). La latencia es
   parte de la estetica: la maquina delibera.
5. `t+7s` Streaming de la respuesta: `bio.eras.6.text` (143 palabras, 3
   parrafos) por tokens: cadencia base 45ms/token, burst de 2-4 tokens, pausa
   180-350ms en puntuacion (asi se siente sampling real, no marquesina). Total
   ~17s. Un `pointerdown` en el panel completa el streaming al instante (skip).
6. Durante el streaming, `ascii-progress` avanza el takeover (tabla 4.4).
7. La frase final (`Cada etapa parecia un salto. Vista de lejos, era una sola
   linea.`) NO llega por streaming normal: llega por DECODE binario (5.3).
8. `t_final` bajo la frase, ultima linea: prompt vacio `> ` + cursor `█` con
   blink `steps(2)` 1s, EXACTO al `.terminal-cursor` de ch0. El sitio termina
   como empezo: un cursor esperando. Debajo, el mantra ambar existente.

Autoria visual de tokens: el prompt humano en ambar `#ffd95c`, la respuesta IA
en cian `#4dffff` sobre `#eafcff` base. En la frase final los tokens ALTERNAN
ambar/cian palabra a palabra: la ultima linea la escriben los dos (seccion 6).

### 5.3 El binario significativo

El binario nunca es lluvia decorativa. Especificacion:

- Precomputar `bits = toBits(fraseFinal)` (UTF-8, 8 bits por byte, ES o EN segun
  locale). La frase ES tiene 66 chars -> 528 bits.
- Render: una franja `<div class="ch6-bits">` monoespaciada de 2 lineas encima
  de donde aparecera la frase. Se pinta el bitstream real (no random).
- Decode: cada grupo de 8 bits colapsa en su caracter con un microflash de 90ms,
  de izquierda a derecha, 24ms por grupo (~1.6s total). El caracter aparece en
  el lugar del grupo; los bits restantes se desplazan. La frase queda escrita y
  la franja binaria se apaga a opacity 0.18 y persiste (los datos siguen ahi
  debajo del lenguaje).
- PRM y no-JS: la frase visible directamente; franja binaria estatica al 0.18
  encima, ya "decodificada". El significado se conserva sin movimiento.
- Paridad ES/EN: el bitstream se computa del string del locale activo; al toggle
  de idioma se recomputa (funcion pura, testeable: `toBits('a') ===
  '01100001'`).

### 5.4 Layout del panel y mantra

- Desktop (>=1024): panel a la derecha, `width: min(46ch, 42vw)`,
  `max-height: 72vh`, scroll interno `overscroll-behavior: contain`, alineado a
  `right: 4vw; bottom: 10vh`. La escena (heroes a la izquierda del focal) queda
  visible: composicion en L.
- Portrait movil: bottom sheet `max-height: 52dvh` sobre el canvas, full-width,
  con handle visual; el canvas ya prioriza focal 30% (heroes visibles arriba).
- Landscape movil: como desktop pero `width: 52vw`.
- Fondo del panel: `rgba(4, 2, 14, 0.86)` + `backdrop-filter: blur(6px)` con
  fallback solido `rgba(4, 2, 14, 0.94)` (mismo patron @supports del
  ProjectOverlay). Border 1px `#4dffff` al 35%.
- Tipografia: VT323 para banner/prompt/cursor (la cita literal a ch0);
  el cuerpo de la respuesta en la monoespaciada del sistema
  (`ui-monospace, 'Cascadia Mono', Consolas, monospace`) a 15-17px: la voz de
  2026 no es la voz de 1995, conviven en el mismo panel. Cero fuentes nuevas
  (presupuesto bundle ya esta en rojo: 782KB woff2).
- Mantra: sale del gate `arrivalDone`. Se renderiza siempre dentro del flujo del
  panel (ultima linea, tras el cursor). El `v-if` se elimina; la animacion de
  fade pasa a CSS pura disparada por clase.
- Contraste verificable sobre shader (medir con tooling en review):
  - Cuerpo `#eafcff` sobre `rgba(4,2,14,0.86)` compuesto sobre el peor caso del
    shader (nebulosa cian clara): ratio computado >= 12:1. PASS AAA.
  - Ambar `#ffd95c` sobre idem: >= 9:1. PASS.
  - Cian `#4dffff` sobre idem: >= 10:1. PASS.
  - Regla: NINGUN texto se pinta directo sobre el canvas sin el scrim del panel.
    (La unica excepcion: tooltips Phaser existentes, que ya llevan bg solido.)

### 5.5 Claves i18n nuevas (paridad ES/EN, sin em-dash)

```
chapters.6.convo.boot1  ES/EN: "MATOVELLE AGENT SHELL Version 31.0"
chapters.6.convo.boot2  ES: "(C) 1995-2026 una sola linea"  EN: "(C) 1995-2026 one single line"
chapters.6.convo.boot3  " "
chapters.6.convo.boot4  ">"
chapters.6.convo.prompt ES: "cuentame como llegaste hasta aqui"  EN: "tell me how you got here"
chapters.6.convo.thinking ES: "pensando..."  EN: "thinking..."
chapters.6.convo.skipHint ES: "toca para completar"  EN: "tap to complete"
chapters.6.convo.aria   ES: "Conversacion con la IA: la historia de Rafael"
                        EN: "Conversation with the AI: Rafael's story"
```

La respuesta reutiliza `bio.eras.6.text` tal cual (ya existe en ambos locales y
no contiene em-dash). La frase final del decode se extrae como key propia
`chapters.6.convo.closing` duplicando la ultima oracion del bio para no partir
el parrafo por indices fragiles:
ES: `Cada etapa parecia un salto. Vista de lejos, era una sola linea.`
EN: `Every stage looked like a leap. Seen from afar, it was one single line.`

---

## 6. Humanos y robots al unisono (que se ve)

El unisono no son dos grupos coexistiendo: es UNA obra con dos manos. Tres
representaciones concretas, todas rescatando piezas existentes:

1. **Los struts del anillo se completan juntos.** Hoy el anillo tiene 16 struts
   y los `i % 4 == 0` estan en rosa (pendientes). Acto 2: por cada strut
   pendiente, DOS haces convergen SIMULTANEOS sobre el mismo strut: uno desde el
   robot (x=190,y=1544) y uno desde Rafael (x=304,y=1710). Cuando ambos haces
   tocan el strut (tween alpha 0->0.6, 600ms), el strut cambia rosa -> cian con
   un pulso de 2px. Cadencia: un strut cada 1.4s, 4 struts, ~6s total. El
   backlog se termina y lo terminan a cuatro manos. PRM: todos los struts ya en
   cian desde create, haces estaticos al 0.22.
2. **El cursor-estrella compartido.** El filamento neural existente (Rafael ->
   robot) gana un segundo tramo simetrico que sube de ambos hacia un unico punto
   sobre la plataforma (x=247, y=1600): un cuadrado 6x6 cian pulsante, el
   "cursor" de la escena. Las particulas del filamento (ya implementadas en
   `update()`) ahora fluyen de AMBOS origenes hacia el cursor. Es literal: los
   dos escriben en el mismo cursor. Cuando la conversacion DOM emite tokens, el
   cursor-estrella emite un destello de 80ms sincronizado (bridge event
   `token-tick`, throttled a max 6/s para no saturar tweens).
3. **La ultima linea alternada.** En el DOM, la frase final alterna color de
   autor palabra a palabra (5.2). La tesis la tipean juntos.

Que NO hacer: no anadir mas personajes, no separar "lado humano / lado robot"
en la composicion, no globos de dialogo dentro de Phaser.

---

## 7. Cierre circular con ch0: citar sin repetir

Inventario del lenguaje ch0 real (verificado en codigo; OJO: ch0 es DOS blanco
sobre negro, NO fosforo verde):

| Elemento ch0 (1995) | Cita en ch6 (2026) |
|---|---|
| Banner 4 lineas, reveal escalonado 0/1.2/2.0/2.5s | Banner AGENT SHELL, mismos 4 slots y delays |
| `C:\>` + comando auto-tipeado 80ms/char | `>` + prompt auto-tipeado 70ms/char |
| Cursor `█` blink `steps(2)` 1s | Identico, mismo keyframe (extraer a clase compartida `.crt-cursor`) |
| Blanco DOS `#ffffff` sobre negro | Se cita solo en el banner; el resto vira a cian/ambar synthwave: misma gramatica, otra decada |
| Blackout instantaneo (sin fade) | El decode binario usa microflashes instantaneos, no fades |
| VT323 | VT323 en banner/prompt/cursor unicamente |
| Fork bomb: el nino ROMPE la maquina | La IA CONSTRUYE con el adulto: mismo formato terminal, resultado invertido. No se verbaliza; queda para quien vio ch0 |
| Verde fosforo | Aparece SOLO en el tinte final del shader ASCII (uTint), como memoria del CRT generico, no de ch0 |

Regla de la cita: elementos estructurales identicos (ritmo, cursor, banner),
paleta y voz distintas. Repetir la estructura y cambiar el contenido es lo que
hace legible "tres decadas de distancia".

---

## 8. Presupuesto de performance y degradacion

Targets:
- Desktop: 60 fps sostenidos con PostFX activo.
- Movil medio (Adreno 6xx / A13): >= 40 fps; piso duro 30 fps.
- Coste PostFX: 1 pass fullscreen a 960x540 (0.52 MP), ~15-25 ALU ops/fragment:
  presupuesto trivial frente al bg fBm ya presente (3 octavas x 3 llamadas).
- DOM streaming: mutaciones batched por `requestAnimationFrame` (agrupar tokens
  del mismo frame); nunca un timer por token vivo simultaneo (patron Set de
  timers de TerminalScroll).

Escalera de degradacion (probe: promedio movil de `game.loop.actualFps` en
ventana de 120 frames, evaluado a los 3s y cada 5s):

| Tier | Condicion | Que cambia |
|---|---|---|
| A | fps >= 50 | Todo: ASCII 8px, DoG+Sobel opcional ON si se implementa, twinkle pleno |
| B | 35 <= fps < 50 | `uCell` 8 -> 12 (menos celdas), sin Sobel, bg fBm 3 -> 2 octavas (uniform `uOct`) |
| C | fps < 35 dos ventanas seguidas | PostFX OFF. El takeover pasa a CSS: el panel DOM crece y un gradiente oscuro cubre la escena; el binario y el decode viven en DOM asi que el cierre narrativo SE CONSERVA INTEGRO |
| Sin WebGL | `renderer.gl` null | Canvas2D fallback existente + conversacion DOM completa (ya independiente) |
| PRM | media query | Sin typing (texto completo), sin wipe (uMix 0.35 estatico), sin blink (cursor solido), struts completos, decode ya resuelto. Composicion estatica cuidada, no una pagina rota |

La clave del plan: como el corazon (conversacion + binario + cierre) es DOM, la
degradacion solo recorta espectaculo, nunca significado.

---

## 9. Mapa de implementacion por efecto

| Efecto | Enfoque | Archivo |
|---|---|---|
| Fix zoom/rect | JS | `src/phaser/index.js`, `Chapter6Content.vue` |
| Recomposicion mundo | JS constantes | `SpaceScene.js` (PLANET_XS/orbit map, DRONE_DEFS) |
| ASCII takeover | PostFXPipeline GLSL 1.0 | `src/phaser/AsciiPostFX.js` (nuevo) |
| Wipe organico | mismo shader (fbm3 reutilizado) | idem |
| Struts a cuatro manos | Phaser Graphics + tweens | `SpaceScene.js` `_buildUnisonStruts` (reemplaza `_buildConstructionBeams` timing) |
| Cursor-estrella | Phaser Graphics + filamento existente | `SpaceScene.js` |
| Panel conversacion | Vue + CSS puro | `Chapter6Content.vue` + `chapter-themes.css` |
| Streaming tokens | JS (rAF batch) sobre DOM presente | `useConvoStream.js` composable (nuevo) |
| Decode binario | JS puro + CSS | mismo composable, `toBits()` puro |
| Cursor/banner cita ch0 | CSS compartido | `chapter-themes.css` (`.crt-cursor`) |
| Bridge DOM->Phaser | game.events (`ascii-progress`, `token-tick`) | ambos lados, null-guard PHA-06 |

Orden sugerido de PRs (cada uno shippable):
1. Fixes seccion 1 (zoom + recomposicion) + tests de regresion del rect.
2. Panel DOM con texto siempre presente + mantra desgateado (cierra TASK-007
   defectos 2 y 3) + locks de innerText.
3. Streaming + binario + cita ch0.
4. AsciiPostFX + bridge + escalera de degradacion.
5. Unisono (struts + cursor-estrella).

## 10. Criterios de aceptacion del capitulo (verificables)

1. Con Phaser bloqueado (mock que nunca emite eventos), `innerText` de la
   section ch6 contiene >= 120 palabras del bio y el mantra.
2. A 1440x900 y 1366x768: los 3 planetas, los 5 drones y los 2 heroes estan
   dentro del encuadre final (screenshot).
3. Canvas display size cubre el host exacto (delta < 1px) en 1521x791, 1920x911,
   390x844 portrait y 844x390 landscape.
4. PRM ON: cero animaciones (auditoria de `animation`/tween activos), texto
   completo visible, composicion estatica con ASCII band.
5. Toggle ES/EN en mitad del streaming: el panel re-renderiza el locale nuevo
   sin duplicar timers (version counter como TerminalScroll `cycleVersion`).
6. Grep em-dash sobre `es.json`/`en.json` diffs: cero ocurrencias nuevas.
7. Contraste medido de los 3 colores de texto del panel sobre captura real del
   shader: todos >= 7:1.
8. 60 fps desktop con PostFX ON (trace de 10s, p95 frame time <= 16.7ms).

## 11. Fuentes

- Codrops, "Efecto: Real-Time ASCII and Dithering Effects with WebGL Shaders":
  <https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/>
- mattdesl, glsl-ascii-filter: <https://github.com/mattdesl/glsl-ascii-filter>
- Adam Sawicki, "ASCII Art in Pixel Shader": <https://asawicki.info/news_1277_ascii_art_in_pixel_shader>
- Acerola-derived ASCII con DoG + Sobel: <https://github.com/AbstractBorderStudio/Ascii_Shader>
- Phaser PostFXPipeline API: <https://docs.phaser.io/api-documentation/class/renderer-webgl-pipelines-postfxpipeline>
- Rex notes, Post FX pipeline: <https://rexrainbow.github.io/phaser3-rex-notes/docs/site/postfx-pipeline/>
- Inigo Quilez, fBm / domain warping / 2D SDF: <https://iquilezles.org/articles/>
  (en concreto <https://iquilezles.org/articles/warp/>)
- "The Terminal Renaissance": <https://hyperbliss.tech/blog/2026.04.04_terminal-renaissance/>
- Awwwards, terminal aesthetics: <https://www.awwwards.com/inspiration_search/terminal/>
