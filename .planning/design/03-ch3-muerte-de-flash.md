# CH3 (2013) · La muerte de Flash · Direccion de arte

Autor: researcher (direccion de arte, 2026-07-27)
Estado: propuesta lista para implementar. Rafael autorizo cambio total de estilo
("no temas cambiar el estilo, eso solo es una maqueta de lo que visualizo ahi").
Anti-referencia: `src/components/Chapter3Content.vue` (iter11 Kingdom New Lands).
Ticket relacionado: `tasks/TASK-007.json` defecto 4 (270 palabras gateadas por clicks).

---

## 1. POV de direccion de arte

Al entrar a ch3 el sitio deja de ser un videojuego y se convierte en LA WEB DE 2013:
llegas mirando un navegador de la epoca con el rectangulo de Flash bloqueado, y al
scrollear ese rectangulo muere en pantalla (el degradado se drena, el gloss se
despega capa por capa, el vector queda desnudo) hasta que el fondo revienta en
blanco y aparece el flat design que definio ese anio: tipografia enorme y liviana,
espacio en blanco, ghost buttons, iconos long shadow, parallax de scroll como
novedad tecnica. La era no se ilustra con pixel art: la era USA SU PROPIO MEDIO.
La muerte y el renacimiento de la carrera de Rafael se cuentan con el mismo gesto
grafico con que la web entera paso de skeuomorfismo a flat en 2013 (iOS 7, Metro,
Flat UI Colors, Bootstrap 3). Evoca 2013 sin parodia porque no disfraza: reproduce
el lenguaje visual dominante de ese anio con rigor de fecha (nada posterior a 2013
en fuentes, paleta ni componentes) y lo pone al servicio de un unico drama: el
plugin muere, la web abierta lo reemplaza, y Rafael salta con ella.

## 2. Que muere de la implementacion actual

Se retira COMPLETO el concepto Kingdom New Lands de ch3 (era una maqueta):

- Capas `ch3-sky/far/mountains/path`, agua espejo, ripples, brasas, ceniza,
  pajaros, haze, ventana rota `ch3-window.png`, pergamino `ch3-parchment.webp`,
  emblemas `ch3-flash-fallen / mark-rebuild / mark-standard / mark-orb /
  html5-future`. Archivar en `public/assets/old/` con entry en CHANGELOG.md
  (espiritu CLAUDE.md 6.5: retiro documentado, no sobrescritura silenciosa).
- Fuentes Cinzel 700/900 + Cinzel Decorative 900 (epico medieval, anacronico):
  quitar los imports de `src/main.js` si ningun otro chapter las usa (grep dice
  que son "ch3"). Bonus: probablemente arregla el test rojo del bundle .woff2
  (782KB > 350KB) que entro justo al agregar Cinzel.
- Inter en `.ch3-hint-cta`: Inter es de 2017, anacronica para 2013. Fuera de ch3.
- Lobster en el theme stub `[data-chapter="3"]`: fuera del theme ch3 (verificar
  su otro uso en `.project-card-title` antes de quitar el import global).
- Bounce easing en 3 lugares (hallazgo de disenio abierto): `cubic-bezier(0.2,
  0.9, 0.3, 1.2)` del panel (linea ~946) y `cubic-bezier(0.2, 0.9, 0.3, 1.25)`
  de `ch3-arrive-mark` (lineas ~1121 y ~1125). El flat 2013 no rebota: se
  reemplazan por las curvas de la seccion 7. Cero overshoot en todo ch3.
- Parallax de puntero (`--mx/--my`): fuera. El parallax de 2013 era de SCROLL.
- Borrar el archivo muerto `src/components/Chapter3Content.web2-fallback.vue.bak`.

Meta de peso: Chapter3Content.vue nuevo bajo 25 KB (hoy 46.3 KB). Si ayuda,
extraer `Ch3PluginDeath.vue` (acto 1) y `Ch3StoryBeat.vue` (beats del acto 2).

## 3. La muerte de Flash: guion visual en dos actos

Estructura: `.ch3-stage` sigue siendo el scroll container. El acto 1 es una escena
PINNED (sticky 100dvh sobre ~220vh de recorrido, mismo truco sticky +
margin-bottom negativo ya usado hoy) donde el scroll SCRUBEA la muerte. El acto 2
fluye normal con reveals de entrada. ch3 es el chapter landing: lo primero que ve
un visitante del sitio es el acto 1.

### Acto 1 · El plugin (scroll 0 a ~220vh, pinned)

Escenografia procedural (CSS/SVG, cero imagenes):

1. Fondo: escritorio 2013 gris grafito `#2b2d31`, sin textura.
2. Ventana de navegador de 2013 (CSS puro): barra de tabs gris claro, omnibox,
   y una infobar amarilla palida arriba con el texto de epoca "Se bloqueo el
   complemento Adobe Flash Player" + ghost button "Ejecutar esta vez".
3. Dentro del viewport del navegador, centrado: EL RECTANGULO. Stage de Flash de
   550x400 (el tamanio default historico de Flash), borde 1px `#4a4d52`, con un
   boton glossy skeuomorfico gigante en su centro (CSS en 4 capas apilables:
   sombra proyectada, bevel/borde, degradado rojo Flash `#b3151d` a `#7a0c12`,
   brillo especular blanco al 35%). El boton dice PLAY con triangulo.
4. A la derecha del navegador, mas pequenio, un telefono 2013 (frame CSS negro
   redondeado) mostrando la misma pagina: donde va el stage hay SOLO la pieza de
   puzzle gris `#8e8e93` (icono missing plugin, SVG inline de un path) y el texto
   chico "El plugin nunca llego aqui". El drama es mobile: en el telefono Flash
   ya estaba muerto.

Scrub por tramos del recorrido (progreso p de 0 a 1 del pin):

- p 0.00-0.15: quieto. Cue de scroll: chevron `#8e8e93` con pulso de opacidad
  (sin rebote). El titulo H1 "La muerte de Flash" ya esta en el DOM (accesible).
- p 0.15-0.40: EL DEGRADADO SE APAGA. La capa de brillo especular baja opacity
  1 a 0; el degradado rojo desatura hacia `#7f8c8d` (se anima un overlay gris
  con opacity 0 a 1, nunca filter). La infobar amarilla parpadea una vez.
- p 0.40-0.70: EL VECTOR COLAPSA A FLAT. Las capas del boton se despegan en
  orden (especular, bevel, sombra): cada una translateY(0 a 18vh) +
  rotate(0 a -4deg) + opacity 1 a 0, escalonadas. Debajo queda el esqueleto:
  wireframe SVG del boton con puntos de control bezier visibles (circulos y
  handles cyan `#3498db`) que tambien se desvanece, dejando un rectangulo FLAT
  rojo `#e74c3c` puro, sin borde, sin sombra.
- p 0.70-0.85: el stage 550x400 y el navegador entero pierden chrome: bordes y
  barras fade a 0. Queda el rectangulo flat solo sobre el gris.
- p 0.85-1.00: RENACIMIENTO. El fondo gris sube a blanco `#ecf0f1` (overlay), el
  rectangulo rojo se reencuadra como bloque de acento del hero del acto 2 y
  cambia a naranja HTML5 `#e34f26` (crossfade de dos capas, no transition de
  background-color animada por paint: son dos elementos superpuestos con
  opacity). Entra el hero flat.

Nota de autenticidad: el bloqueo agresivo del plugin es iconografia 2015-2021,
pero la pieza de puzzle / brick de plugin faltante en mobile es exactamente 2013
(Adobe mato Flash mobile en 2011; iOS nunca lo tuvo). Por eso el telefono muestra
el brick y el desktop muestra el stage aun vivo que muere al scrollear.

### Acto 2 · La web flat (flujo normal, ~5 secciones)

Landing page de 2013 canonica, tipo Bootstrap 3 recien salido (agosto 2013):

1. HERO: fondo `#ecf0f1`, titulo enorme y liviano (Open Sans 300) "2013. La web
   aprende a moverse sin plugin.", subtitulo 400, un ghost button "La historia
   completa" que hace smooth-scroll al primer beat. Detras, paisaje SVG flat de
   3 capas (cielo plano `#d6eaf8`, colinas geometricas `#a9cce3` y `#7fb3d5`,
   primer plano `#5499c7`) con parallax de scroll diferencial y 2 nubes flat
   long-shadow derivando en loop lento. Es la firma tecnica: parallax de scroll,
   la novedad de 2013.
2. BEATS I a V: los 5 parrafos de `bio.eras.3` como 5 secciones zig-zag
   (icono long shadow a un lado, texto al otro, alternando), sobre franjas
   full-bleed que alternan `#ecf0f1` y `#ffffff`. Ver seccion 8 para el destape.
3. Cierre del chapter: franja `#2c3e50` con la frase final del beat V destacada
   en blanco y el badge HTML5 naranja, puente cromatico hacia ch4.

## 4. Paleta (hex definitivos)

Referencia historica: Flat UI Colors de Designmodo, publicada en 2013. Es LA
paleta del anio, no una aproximacion.

Acto 1 (la muerte):

| Rol | Hex |
|---|---|
| Escritorio / fondo | `#2b2d31` |
| Chrome navegador | `#3a3d42` sobre `#2b2d31`, bordes `#4a4d52` |
| Infobar aviso | fondo `#fdf3d0`, texto `#6b5d1f` |
| Rojo Flash vivo (degradado) | `#b3151d` a `#7a0c12`, especular `rgba(255,255,255,0.35)` |
| Gris muerte / missing plugin | `#7f8c8d`, puzzle `#8e8e93` |
| Wireframe bezier | `#3498db` |
| Flat resultante | `#e74c3c` |

Acto 2 (el renacimiento, Flat UI Colors):

| Rol | Hex |
|---|---|
| Fondo base (Clouds) | `#ecf0f1` |
| Superficie carta | `#ffffff` |
| Texto (Midnight Blue) | `#2c3e50` |
| Texto secundario (Wet Asphalt) | `#34495e` |
| Acento / links / ghost buttons (Peter River) | `#3498db`, hover `#2980b9` |
| Residuo Flash (Alizarin) | `#e74c3c` (solo beat I) |
| Renacer HTML5 (color oficial HTML5) | `#e34f26` (solo beat V y cierre) |
| Bordes | `#bdc3c7` |
| Long shadow | `rgba(44,62,80,0.15)` |

Tokens en `src/styles/chapter-themes.css` (actualizar AMBOS bloques, el
`[data-chapter="3"]` y su duplicado `:root[data-active-chapter="3"]`, hoy en
ember/oro Kingdom):

```css
--c-bg: #ecf0f1;  --c-fg: #2c3e50;  --c-accent: #3498db;
--c-border: #bdc3c7;  --c-focus: #2980b9;  --c-surface: #ffffff;
--font-body: 'Open Sans', 'Segoe UI', 'Helvetica Neue', sans-serif;
/* contrast(#2c3e50, #ecf0f1) = 9.9:1 aprox, AA/AAA ok */
```

El HUD global hereda flat claro. El acto 1 es oscuro pero dura un viewport; si el
HUD se ve duro sobre el, es aceptable (el acto 1 es la unica excepcion y corta).

## 5. Tipografia (autentica de 2013, cero anacronismos)

- Familia unica: **Open Sans** (Steve Matteson, 2011; la webfont dominante de
  2013 en Google Fonts). Self-host via `@fontsource/open-sans`, subsets latin +
  latin-ext (enie y tildes), SOLO pesos 300, 400, 600, 700. Presupuesto: ~110KB
  woff2 total, compensado de sobra al quitar Cinzel/Cinzel Decorative.
- Prohibidas en ch3: Inter (2017), Cinzel, Lobster, cualquier variable font
  (las variable fonts no existian en 2013).
- Codigo (snippet AS3/JS opcional del beat I): stack de sistema
  `Consolas, Menlo, monospace`. Sin fuente extra.

Escala (ratio 1.25, base 16px):

| Uso | Peso | Tamanio |
|---|---|---|
| Hero display | 300 | `clamp(2.6rem, 6vw, 4.4rem)`, line-height 1.12, letter-spacing -0.01em |
| Subtitulo hero | 400 | `clamp(1.15rem, 2.4vw, 1.5rem)`, `#34495e` |
| Numeral beat (01..05) | 300 | `clamp(3rem, 7vw, 5rem)`, color `#bdc3c7` |
| Kicker seccion | 700 | 0.8rem, uppercase, letter-spacing 0.12em, color del acento del beat |
| Titulo beat | 600 | `clamp(1.4rem, 3vw, 1.9rem)` |
| Cuerpo | 400 | 1.0625rem, line-height 1.7, max 68ch |
| Ghost button | 600 | 0.85rem, uppercase, letter-spacing 0.08em |

Los numerales finos gigantes 01..05 son gesto 2013 puro y reemplazan a los
numerales romanos Cinzel actuales.

## 6. Superficie, grid y layout

- Superficie FLAT: sin degradados en acto 2 (los degradados murieron en acto 1,
  es literal), sin sombras difusas grandes. Cartas blancas con borde 1px
  `#bdc3c7` y radius 3px (Bootstrap 3 usaba 4px; 3 esta en epoca). Sombra
  permitida: `0 1px 2px rgba(0,0,0,0.06)` maximo.
- Ghost buttons: transparentes, borde 2px del acento, texto acento; hover
  invierte (fondo acento, texto blanco), transition 0.2s ease.
- Iconos: SVG flat 2 tintas dentro de badge circular con LONG SHADOW a 45
  grados (poligono oscuro `rgba(44,62,80,0.15)` clipeado al circulo). Icono por
  beat: I rectangulo Flash roto, II llaves de codigo `</>`, III tablero de
  sprints, IV megafono, V escudo HTML5.
- Grid: container `max-width: 1140px` con gutter 30px (el container 1170 de
  Bootstrap 3 menos padding), 12 columnas mentales. Beats en 2 columnas
  (5/7 icono/texto, alternando lado). Franjas full-bleed alternando Clouds y
  blanco.
- Breakpoints: bajo 768px todo apila a 1 columna (mobile portrait); landscape
  mobile (alto < 500px): el acto 1 reduce el stage a `min(550px, 78vw)` x
  proporcional y el telefono se oculta (`display:none`), el pin se acorta a
  ~160vh. El acto 2 no tiene pin, fluye.
- `image-rendering: pixelated` FUERA de todo ch3 (hoy esta en `.ch3-stage`):
  2013 es vector nitido, no pixel.

## 7. Presupuesto de motion (verificable)

Implementacion: CSS scroll-driven animations (`animation-timeline: scroll()` /
`view()`) detras de `@supports (animation-timeline: scroll())`; fallback al
patron rAF `--sx` que ya existe en el componente (soporte global ~84% a mediados
de 2026: Chrome/Edge 115+, Safari 18+, Firefox aun parcial, por eso el fallback
es obligatorio). Solo se anima `transform` y `opacity`. `will-change` unicamente
en las 3 capas parallax del hero y las 4 capas del boton glossy. Maximo 12
elementos animados concurrentes en pantalla.

| Elemento | Trigger | Movimiento | Curva / velocidad |
|---|---|---|---|
| Scrub acto 1 (drenado, peel, blanqueo) | scroll pin 220vh | segun tramos p de la seccion 3 | scrubbed lineal (la "curva" es el dedo del usuario) |
| Capas peel del boton (x3) | scroll p 0.40-0.70 | translateY 0 a 18vh, rotate 0 a -4deg, opacity 1 a 0, stagger 0.08 de p | scrubbed |
| Parallax hero capa cielo | scroll acto 2 | translateY = -0.06 x deltaScroll px | scrubbed |
| Parallax hero colinas | scroll | factor -0.14 | scrubbed |
| Parallax hero primer plano | scroll | factor -0.26 | scrubbed |
| Nubes flat (x2) | tiempo | translateX loop, 90s y 120s | linear infinite |
| Reveal de cada beat | entrada en viewport (`view()` 0% a 30%, fallback IntersectionObserver + clase) | opacity 0 a 1, translateY 24px a 0, 0.5s | `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out quint, SIN rebote) |
| Hover ghost button / carta | hover | color/bg swap, translateY -2px | 0.2s ease |
| Expansor de beat (seccion 8) | click | grid-template-rows 0fr a 1fr, 0.35s | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Cue de scroll acto 1 | tiempo | opacity 0.4 a 1 pulso 2.5s | ease-in-out, sin translate |

Curvas permitidas en ch3: `ease`, `ease-out`, `cubic-bezier(0.22, 1, 0.36, 1)`.
Ninguna curva con parametro fuera de [0,1] en Y (eso es rebote y queda prohibido,
cierra el hallazgo de bounce-easing).

PRM (`prefers-reduced-motion: reduce`), regla dura ya establecida en el proyecto:
todo lo anterior `animation: none / transition: none`. Estado estatico: el acto 1
se muestra en su cuadro final de p=0.15 (plugin bloqueado, boton ya sin brillo,
telefono con puzzle: la muerte se entiende quieta), sin pin largo (el pin baja a
100vh exacto), y el acto 2 se renderiza completo y visible sin reveals. Nada de
contenido depende de una animacion para existir en el DOM.

## 8. Destape de la narrativa (TASK-007 defecto 4)

Principio: el que solo scrollea LEE LA HISTORIA; el que interactua profundiza.

- Cada beat (seccion zig-zag) muestra SIEMPRE visible: numeral 01..05, kicker,
  titulo corto, y el LEAD del parrafo (su primera o primeras dos oraciones,
  ~40-60% del parrafo). Son texto plano en el flow: innerText no vacio sin un
  solo click, indexable, accesible. Cumple la AC de TASK-007 para ch3.
- Ghost button "Seguir leyendo" (aria-expanded, foco visible `#2980b9`) expande
  EL RESTO del parrafo inline (acordeon grid-rows, sin modal, sin backdrop).
  Colapsado por defecto en los beats I a IV; el beat V (la sintesis del salto)
  va COMPLETO siempre visible, sin expansor: es el remate del chapter.
- El split lead/resto se hace por indice de oracion en un array por locale (no
  parsear con regex el texto i18n), claves nuevas tipo `ch3.beats[n].leadCount`.
- Se elimina el modal pergamino, las flechas, los dots y el estado
  visited/activeStory: el scroll ES la navegacion. Menos codigo, menos KB.
- Interaccion extra opcional (barata, muy 2013): en el beat I, un toggle de dos
  tabs "AS3 / JS" con el mismo snippet de 4 lineas en ambos lenguajes, como
  guinio a reconstruir las animaciones con reglas nuevas. Decorativo,
  aria-hidden en el codigo, no bloquea nada.

Copy nuevo propuesto (sin caracter em-dash, ES con EN ~15-20% mas corto):

| Key | ES | EN |
|---|---|---|
| hero.title | 2013. La web aprende a moverse sin plugin. | 2013. The web learns to move without a plugin. |
| hero.sub | Flash muere en el celular y mi carrera salta con la web. | Flash dies on mobile and my career jumps with the web. |
| beats.1.kicker | EL FINAL | THE END |
| beats.2.kicker | RECONSTRUIR | REBUILD |
| beats.3.kicker | EL METODO | THE METHOD |
| beats.4.kicker | EL LIMITE | THE EDGE |
| beats.5.kicker | EL SALTO | THE LEAP |
| ui.readMore | Seguir leyendo | Keep reading |
| ui.readLess | Cerrar | Close |
| ui.phoneNote | El plugin nunca llego aqui | The plugin never made it here |
| ui.infobar | Se bloqueo el complemento Adobe Flash Player | The Adobe Flash Player plugin was blocked |
| ui.runOnce | Ejecutar esta vez | Run this time |

Nota: los textos existentes de `bio.eras.3` en es.json contienen guiones largos
heredados; TASK-007 solo prohibe introducirlos en texto NUEVO. No tocar la bio
desde este trabajo.

## 9. Arte: inventario y origen (Higgsfield APAGADO)

Todo el capitulo es procedural. NINGUNA imagen es bloqueante:

| Pieza | Origen |
|---|---|
| Navegador 2013 + infobar + tabs | CSS puro |
| Stage Flash 550x400 + boton glossy 4 capas | CSS puro (gradientes + inset shadows) |
| Pieza de puzzle missing plugin | SVG inline, 1 path, `#8e8e93` |
| Telefono 2013 | CSS (border-radius + bordes) |
| Wireframe bezier con handles | SVG inline (path + circles) |
| Paisaje flat 3 capas + nubes | SVG inline (poligonos planos) |
| 5 iconos long shadow | SVG inline, 2 tintas + poligono sombra 45 grados |
| Badge HTML5 del cierre | SVG inline (escudo abstracto, NO el logo oficial con marca) |
| Snippet AS3/JS | texto + monospace de sistema |

pixelforge: OPCIONAL y no bloqueante, un unico easter egg: dentro del stage de
Flash, antes de morir, un mini banner pixel-art congelado (guinio de continuidad
con ch2, `forge_sprite`, preset "night"). Si no convence en la primera pasada,
se descarta sin reemplazo. Adobe MCP: solo si ese sprite necesita crop/ajuste.
Ningun otro asset nuevo. Los assets Kingdom se archivan (seccion 2).

## 10. Checklist de aceptacion para el developer

1. Sin ningun click, el innerText de la section ch3 contiene los 5 leads + beat
   V completo (AC TASK-007). Verificar en ES y EN.
2. Acto 1 completo con teclado ignorable: es decorativo (aria-hidden en la
   escenografia), el H1 real esta en el DOM desde el inicio.
3. PRM: cuadro estatico legible, cero animaciones, contenido 100% visible.
4. Viewports verificados: 1440x900, 1366x768, 390x844 portrait, 844x390
   landscape, en ES y EN (ES es 15-20% mas largo: los leads ES no deben romper
   el zig-zag; max-width 68ch lo absorbe).
5. Ningun texto nuevo contiene el caracter em-dash (grep sobre el diff de
   es.json/en.json y los componentes).
6. Sin bounce: grep de `cubic-bezier` en ch3 no devuelve ningun parametro Y
   fuera de [0,1].
7. Borrado `Chapter3Content.web2-fallback.vue.bak`; imports de Cinzel/Cinzel
   Decorative removidos si nadie mas los usa; test de bundle de fuentes en
   verde o mejorado.
8. Tokens de `[data-chapter="3"]` y `:root[data-active-chapter="3"]`
   actualizados en espejo (regla de duplicacion verbatim del archivo).
9. Scroll-driven con `@supports` + fallback rAF: probar en un navegador sin
   `animation-timeline` (Firefox) y confirmar paridad funcional.
10. 60fps en el scrub del acto 1 (DevTools performance: solo compositor, sin
    layout/paint en el pin).

## 11. Fuentes

- Tendencias web 2013 (flat, parallax): https://www.creativebloq.com/web-design/2013-trends-121310199
- Flat design vs skeuomorfismo, iOS 7: https://webdesign.tutsplus.com/flat-design-ios-7-skeuomorphism-and-all-that--webdesign-14335a
- Ghost buttons nacen con iOS 7 (2013): https://uxplanet.org/buttons-in-ui-design-the-evolution-of-style-and-best-practices-56536dc5386e
- Long shadow design 2013: https://graphicdesignjunction.com/2013/07/long-shadow-examples/
- Flash EOL y bloqueo del plugin: https://www.macrumors.com/2021/01/12/adobe-flash-era-is-officially-over/ y https://www.newsweek.com/adobe-flash-player-end-life-last-day-memes-jokes-tributes-social-media-1558240
- Scroll-driven animations (spec y soporte): https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations y https://www.joshwcomeau.com/animation/scroll-driven-animations/
- Paleta Flat UI Colors (Designmodo, 2013): https://flatuicolors.com
