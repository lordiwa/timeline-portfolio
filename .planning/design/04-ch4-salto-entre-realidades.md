# CH4 "El Salto Entre Realidades" — Direccion de arte + especificacion tecnica de shaders

> Autor: Researcher (direccion de arte y efectos tecnicos). Fecha: 2026-07-27.
> Objetivo declarado por Rafael: "que se sienta el salto entre realidades", nivel visual 10/10,
> el capitulo mas espectacular tecnicamente antes del climax de ch6/2026.
> Este documento es implementable sin volver a preguntar. Nada aqui es codigo de produccion:
> el GLSL es pseudocodigo de las funciones clave, con parametros iniciales concretos.

---

## 0. Resumen ejecutivo

El ch4 de hoy es un fondo decorativo: un canvas WebGL de 320x180 con estrellas, un vortice
2D y un swap de paleta cada 12-18 s, mezclado con `mix-blend-mode: screen` sobre PNGs.
Nada ocluye nada, el portal vive pegado en una esquina, y el "salto" es un cambio de color.
No hay profundidad, no hay optica, no hay momento.

La nueva direccion convierte ch4 en una experiencia de tres actos:

1. **Ponerse el visor** (entrada al capitulo): boot de headset coreografiado en beats,
   con iris binocular, barrel distortion y aberracion cromatica que se asientan.
2. **Habitar el vacio** (estado permanente): portal como tunel raymarcheado con volumen
   real, nebulosa por domain warping, godrays desde el portal, parallax multiplano
   calculado dentro del shader, y una "lente reveladora" que sigue el puntero y muestra
   la realidad siguiente en wireframe detras de la actual.
3. **El salto** (cada 12-18 s, se conserva el ciclo multiverso): onda de warp con
   feedback buffer (eco de la realidad anterior que se desvanece), rip cromatico y
   flash controlado.

Todo procedural: ruido, SDF, gradientes y geometria generada. Cero assets nuevos de
imagen obligatorios (los PNGs existentes de personaje y near se conservan como capas DOM).

Arquitectura: **WebGL crudo multi-pass en el mismo componente `Ch4PortalShader.vue`**
(reescrito). Ni Phaser (no hay escena Phaser en ch4 y un `Phaser.Game` extra cuesta
~1.2 MB de heap + loop propio) ni three.js (~150 KB gzip de bundle para un fullscreen
quad que WebGL crudo hace en 200 lineas; el proyecto ya tiene el patron probado).
Detalle de la decision en §3.

---

## 1. Diagnostico del estado actual (anti-referencia)

Archivo: `src/components/Ch4PortalShader.vue` (26.5 KB) + `src/components/Chapter4Content.vue`.

Que hay hoy y por que se queda corto:

| Elemento actual | Problema |
|---|---|
| Canvas fijo 320x180 upscaleado con `image-rendering: pixelated` | Un portal "premium" necesita gradientes suaves; a 320x180 el vortice se lee como ruido de bloques. La estetica pixel del sitio no obliga a pixelar el volumen: ch6 ya usa shader GLSL vivo con cuantizacion UV selectiva. |
| `mix-blend-mode: screen` en todo el canvas | Todo es aditivo: nada ocluye, nada tiene cuerpo. El portal jamas puede ser mas oscuro que el fondo, o sea jamas puede ser un agujero. |
| Portal 2D: `ring = smoothstep(dist)` + brazos `sin(angle*7)` | Es un disco plano con rayos. No hay interior, no hay volumen, no hay "otro lado". |
| Warp = crecimiento de un radio que intercambia dos paletas | El "salto entre realidades" se reduce a un color swap con flash. No queda rastro de la realidad anterior (sin feedback), no hay distorsion del espacio-tiempo mas alla de 0.065 UV. |
| Parallax solo en CSS (5 a 32 px de offset) | Dentro del shader las estrellas de las 3 escalas se mueven igual: el fondo es un poster. |
| Vigneta binocular CSS estatica | Buena idea, ejecucion plana: sin distorsion de lente, la "optica de headset" es solo oscurecer esquinas. |
| `.ch4-panel-column` con `margin-top: 20vh` + `overflow-y: auto` sin cota | **Defecto conocido**: el contenido mide 887 px dentro de un viewport de 791 px y se recorta. Fix obligatorio en §8. |

Lo que SI se conserva: el concepto multiverso (4 universos como data, `UNIVERSES` como
single source of truth compartida con los glifos DOM), el ciclo 12-18 s con jitter, el
evento `universe-change`, el lifecycle (RAF solo con `activeChapter===4`, cleanup, HMR
dispose, `webglcontextlost`), el whoosh de audio, y las capas DOM de personaje/near.

---

## 2. Direccion de arte

### 2.1 Concepto

"Estas dentro del visor de Rafael en 2015, mirando un agujero en el espacio por el que
se filtran otras realidades." Tres planos narrativos:

- **La realidad huesped**: el vacio synthwave donde flota el personaje. Oscura, calma,
  con suelo holografico y estrellas en 3 planos de profundidad.
- **El portal**: un tunel volumetrico que ES la transicion; no un dibujo de anillo sino
  un tubo con paredes de nebulosa que se pierde hacia dentro. Emite luz (godrays reales).
- **La realidad siguiente**: siempre presente pero oculta. Se insinua de dos formas:
  dentro del tunel (el color del fondo del tubo es la paleta del universo siguiente) y
  en la lente reveladora que sigue al puntero (§4.6).

### 2.2 Paleta

Se conservan los 4 universos y sus paletas exactas de `UNIVERSES` (synthwave cian y magenta,
tron verde fosforo, vaporwave lavanda y teal, void rojo profundo). Regla nueva de valor
tonal: el fondo del shader ya no es aditivo, asi que el rango util es 0.00 a 0.15 de
luminancia para el vacio, 0.15 a 0.45 para nebulosa y suelo, y solo el nucleo del portal,
los godrays y el frente de onda pueden superar 0.6. Esto garantiza el contraste del texto (§9).

### 2.3 Referentes de tecnica (no de estilo)

- Tuneles y volumen raymarcheado de Shadertoy (p. ej. "Wormhole Effect", "Orbiting
  Wormholes") y los articulos de raymarching de Inigo Quilez.
- Domain warping y fbm de iquilezles.org y The Book of Shaders (cap. 11 y 13).
- Godrays screen-space de GPU Gems 3 cap. 13 (Kenny Mitchell).
- Optica de headset real: el pipeline del Oculus SDK aplica barrel distortion inversa y
  desplaza los canales R/G/B radialmente distinto para compensar la aberracion cromatica
  de la lente. Nosotros aplicamos la version "sin corregir": el visitante ve lo que veria
  la camara dentro del visor. Es era-autentico para el CV1 de 2015 (incluye un rastro
  sutil de screen-door effect).
- Los sitios WebGL premiados (colecciones WebGL de Awwwards, estudios como Active Theory
  o Lusion) comparten un patron: un solo canvas fullscreen con 2 o 3 passes, interaccion
  de puntero con inercia, y post-proceso (grain, CA, viñeta) que unifica todas las capas.
  Ese "pegamento de post" es lo que hoy le falta a ch4: cada capa se ve pegada aparte.

---

## 3. Arquitectura de render

### 3.1 Decision: WebGL crudo multi-pass, mismo componente

- **No Phaser**: Phaser 3.90 soporta `PostFXPipeline` custom con GLSL (documentado en
  docs.phaser.io y las notas de rexrainbow), pero eso tiene sentido cuando ya existe una
  escena Phaser que postprocesar, como ch6. Instanciar un `Phaser.Game` en ch4 solo para
  un quad seria pagar loop, registry, scale manager y memoria por nada.
- **No three.js**: no esta instalado; anadirlo cuesta del orden de 150 KB gzip de bundle
  (el presupuesto de fuentes ya esta en rojo: 782 KB > 350 KB en tests). Un fullscreen
  quad con 3 programas y 3 FBOs es trivial en WebGL crudo y el proyecto ya domina ese
  patron (el propio Ch4PortalShader y el shader de SpaceScene).
- **Si WebGL1 con FBOs RGBA8**: los framebuffer objects son core en WebGL1; no se
  necesitan float textures ni extensiones. `mediump` en todo.

### 3.2 Grafo de passes

```
                 (medio res: canvas/2, cap 960x540)
PASS A "mundo"   -> FBO_A     escena del universo: tunel raymarcheado, nebulosa fbm,
                              starfield 3 planos con parallax, suelo, frente de onda
PASS B "eco"     -> FBO_B[i]  feedback ping-pong: mix(FBO_A, FBO_B[1-i] deformado, decay)
                 (full res, al canvas)
PASS C "optica"  -> screen    godrays desde el portal + barrel distortion + CA por canal
                              + viñeta binocular + grain + screen-door sutil
```

- El canvas pasa de atributos fijos `width=320 height=180` a dimensionarse por JS:
  `canvas.width = floor(clientWidth * dpr * scale)` con `scale` segun tier (§7).
- Se elimina `image-rendering: pixelated` y `mix-blend-mode: screen` del canvas.
  El canvas se vuelve **opaco** (es el fondo del capitulo) y las capas DOM
  (matrix/glifos/personaje/near/HUD) siguen encima por z-index, que es la oclusion
  correcta: el personaje TAPA el portal, cosa que hoy el blend aditivo no garantiza.
- La viñeta binocular CSS actual (`.ch4-vr-vignette`) se elimina: la reemplaza el Pass C
  (misma geometria de dos oculares mas nariz, pero ahora con distorsion y CA coherentes).
- `.ch4-holo-floor` CSS se elimina: el suelo ya existe dentro del shader (se conserva y
  mejora el suelo perspectivo del frag actual). Menos capas compuestas = mas fps.

### 3.3 Contrato del componente (se mantiene y extiende)

- Props/inyecciones: `scrollState.activeChapter`, `prm.prefersReduced` (igual que hoy).
- Emits: `universe-change (idx)` al midpoint de la onda (igual);
  nuevo `jump-progress (0..1)` durante la entrada, para que `Chapter4Content` orqueste
  HUD y paneles (§6) sin duplicar timers.
- `UNIVERSES` sigue exportado como single source of truth. Se le agrega por universo:
  `tunnelDensity` (float), `warpAmp` (float), `edgeTint` (vec3 para la lente reveladora).

---

## 4. Efectos: especificacion por efecto

Convenciones: `uv` en [0,1] origen top-left, `p` centrado y corregido por aspecto
(`p = (uv - 0.5) * vec2(aspect, 1.0)`), `PORTAL` = centro del portal en ese espacio.
Todos los numeros son valores iniciales de tuning, expuestos como uniforms.

### 4.0 Base de ruido (compartida por todo)

Value noise + fbm de 4 octavas, estandar iq / Book of Shaders cap. 11 y 13:

```glsl
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);                    // smoothstep de hermite
  return mix(mix(hash(i),             hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)),   hash(i+vec2(1,1)), u.x), u.y);
}

float fbm(vec2 p){                              // 4 octavas, lacunarity 2, gain 0.5
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * vnoise(p); p = p * 2.0 + 17.3; a *= 0.5; }
  return v;
}
```

### 4.1 Portal: tunel volumetrico raymarcheado (Pass A) — el efecto central

Tecnica: raymarch de densidad estilo "volumetric raymarching" (acumulacion de muestras a
lo largo del rayo, no interseccion dura), con el tubo definido en coordenadas polares y
paredes moduladas por fbm con domain warping (iq, articulo warp). 24 pasos en tier HIGH.

```glsl
// Espacio del tunel: origen en el portal, eje z hacia "dentro" de la pantalla.
// La camara mira levemente en diagonal (dirBias) para que el tubo no sea concentrico perfecto.
vec3 ro = vec3(p - PORTAL, 0.0);
vec3 rd = normalize(vec3((p - PORTAL) * 0.35 + pointer * 0.05, 1.0));

float densityAt(vec3 q, float t){
  float r     = length(q.xy);
  // pared del tubo: radio nominal 0.16 que respira y se retuerce con la profundidad
  float wall  = 0.16 + 0.05 * sin(q.z * 2.1 - t * 0.7);
  // domain warping: el angulo y la profundidad deforman el campo antes de evaluarlo
  vec2  polar = vec2(atan(q.y, q.x) * 1.59, q.z * 0.85 - t * 0.55); // 1.59 ~ 5/pi: 5 vetas
  vec2  warp  = vec2(fbm(polar + fbm(polar + t*0.1)), fbm(polar.yx - t*0.07));
  float walls = fbm(polar * 2.0 + warp * 1.7);
  // densidad maxima EN la pared, hueco en el centro (el "otro lado" se ve al fondo)
  return smoothstep(0.10, 0.02, abs(r - wall)) * (0.35 + 0.65 * walls);
}

vec3 marchTunnel(vec3 ro, vec3 rd, float t){
  vec3 acc = vec3(0.0); float trans = 1.0;
  for (int i = 0; i < STEPS; i++){              // STEPS: 24 HIGH / 16 MED / 0 LOW
    vec3  q = ro + rd * (float(i) * 0.11 + 0.05);
    float d = densityAt(q, t);
    vec3  c = mix(colVortex, colVortexNext, smoothstep(1.2, 2.6, q.z)); // fondo = sig. realidad
    acc   += c * d * trans * 0.16;
    trans *= 1.0 - d * 0.22;                    // absorcion
    if (trans < 0.05) break;
  }
  return acc;                                    // sumar sobre el fondo con mascara radial
}
```

Mascara de insercion: `portalMask = smoothstep(0.30, 0.24, length(p - PORTAL))`; dentro
de la mascara el tunel REEMPLAZA el fondo (esto crea el agujero que el blend aditivo
actual hace imposible). El anillo de borde se mantiene (smoothstep doble como hoy) pero
con grosor modulado por `fbm(angle*3.0 + t*0.4)` para que el borde hierva.

En tier LOW el tunel degrada al vortice 2D actual (ya escrito, costo casi nulo).

### 4.2 Nebulosa de fondo por domain warping (Pass A)

Reemplaza el "colBg plano + estrellas". Dos evaluaciones de fbm anidadas (patron
`f(p + f(p))` del articulo warp de iq), tenue, tintada con la paleta del universo:

```glsl
vec2  q   = uvL * 3.0;                          // uvL = uv con lensing aplicado (§4.3)
float n1  = fbm(q + vec2(t*0.02, 0.0));
float n2  = fbm(q + 4.0*vec2(n1, fbm(q + n1)) ); // warp anidado
vec3  neb = mix(colBg, colVortex * 0.30, smoothstep(0.35, 0.85, n2));
```

Luminancia resultante clampada a 0.15 fuera del portal (regla tonal §2.2).

### 4.3 Curvatura del espacio: lensing + pull (Pass A, se conserva mejorado)

El lensing gravitacional actual (`lensStr = k/(d*d + eps)`) funciona; se conserva con dos
mejoras: (a) el pull ahora tambien ROTA levemente el espacio cerca del portal
(`angle += 0.35 * smoothstep(0.4, 0.05, dist)`), vendiendo un vortice de espacio-tiempo,
y (b) la fuerza del lensing es uniform y sube 2.5x durante el frente de onda.

### 4.4 Starfield con parallax REAL en shader (Pass A)

Hoy las 3 escalas de estrellas se mueven igual. Ahora cada plano recibe el puntero
dividido por su profundidad, que es la definicion de parallax:

```glsl
// depth: 1.0 cercano, 2.2 medio, 4.0 lejano
vec2 layerUV(vec2 uv, float depth){
  return uv + (pointer + drift) * (0.035 / depth)   // parallax: cerca se mueve mas
            + vec2(0.0, t * 0.002 / depth);          // deriva vertical minima
}
stars += starGrid(layerUV(uvL, 4.0), 22.0) * 0.5;    // lejano: chico y tenue
stars += starGrid(layerUV(uvL, 2.2), 13.0) * 0.8;
stars += starGrid(layerUV(uvL, 1.0),  7.0) * 1.1;    // cercano: grande, con halo cruz
```

Al plano cercano se le agrega un glint de 4 puntas (dos rects finos en la celda) y un
falso bokeh: `size` de la estrella crece con `1.0 - focus(depth)` (§4.8). La escala
relativa entre planos + velocidad de parallax distinta es la "escala estereoscopica
insinuada": el cerebro infiere profundidad sin necesitar dos ojos.

### 4.5 Godrays desde el portal (Pass C) — GPU Gems 3 cap. 13

Radial sampling screen-space hacia el centro del portal, sobre el resultado del Pass B.
La "mascara de oclusion" es gratis: se muestrea solo la luminancia > umbral del propio
frame (el portal y el frente de onda son lo unico que supera 0.6 por la regla tonal).

```glsl
vec3 godrays(sampler2D src, vec2 uv, vec2 lightUV){
  vec2  delta = (lightUV - uv) * (1.0 / float(TAPS)) * DENSITY;  // TAPS 24/12/0, DENSITY 0.9
  vec3  acc   = vec3(0.0); float illum = 1.0; vec2 s = uv;
  for (int i = 0; i < TAPS; i++){
    s += delta;
    vec3 smp = max(texture2D(src, s).rgb - 0.45, 0.0);           // umbral: solo lo brillante
    acc += smp * illum * WEIGHT;                                  // WEIGHT 0.5
    illum *= DECAY;                                               // DECAY 0.95
  }
  return acc * EXPOSURE;                                          // EXPOSURE 0.25
}
```

Los rayos pulsan con la respiracion del portal y explotan (EXPOSURE x3, 400 ms, ease-out)
en el beat 2 de la entrada y en cada frente de onda.

### 4.6 Lente reveladora: edge detection que muestra la realidad de atras (Pass C)

El efecto interactivo firma del capitulo. Un circulo de radio 0.14 sigue el puntero con
inercia (lerp 0.06 por frame, en JS). Dentro del circulo, la escena se convierte en su
version wireframe con la paleta del universo SIGUIENTE: literalmente ves la realidad que
viene, escondida detras de la actual.

```glsl
// Sobel 3x3 sobre la luminancia del Pass B
float sobel(sampler2D src, vec2 uv, vec2 px){
  float tl=L(src,uv+px*vec2(-1, 1)), tc=L(src,uv+px*vec2(0, 1)), tr=L(src,uv+px*vec2(1, 1));
  float ml=L(src,uv+px*vec2(-1, 0)),                             mr=L(src,uv+px*vec2(1, 0));
  float bl=L(src,uv+px*vec2(-1,-1)), bc=L(src,uv+px*vec2(0,-1)), br=L(src,uv+px*vec2(1,-1));
  float gx = -tl - 2.0*ml - bl + tr + 2.0*mr + br;
  float gy = -tl - 2.0*tc - tr + bl + 2.0*bc + br;
  return clamp(length(vec2(gx, gy)) * 1.8, 0.0, 1.0);
}

float lens  = smoothstep(LENS_R, LENS_R - 0.05, length(p - lensPos));  // borde suave
vec3  wire  = edgeTintNext * sobel(bufB, uv, pixelSize) + colBgNext * 0.4;
color = mix(color, wire, lens * 0.9);
// borde de la lente: aro fino brillante + CA extra, como cristal
color += colVortexNext * smoothstep(0.012, 0.0, abs(length(p - lensPos) - LENS_R)) * 0.6;
```

En mobile (sin puntero) la lente hace una orbita lenta automatica alrededor del portal
(lissajous 23 s). Bajo PRM la lente no existe.

### 4.7 Feedback buffer: el eco de las realidades (Pass B)

Ping-pong de dos FBOs a media resolucion. En regimen normal el feedback es casi
invisible (decay 0.20: solo un sutil motion trail en las estrellas cercanas). Durante el
frente de onda el decay sube a 0.90 y el UV del frame anterior se muestrea con zoom-out
radial desde el portal: la realidad vieja queda "impresa" y se estira hacia el portal
mientras se desvanece durante ~600 ms despues del paso de la onda.

```glsl
vec2 fbUV   = uv + normalize(uv - portalUV) * FB_PULL * warpEnv;   // FB_PULL 0.012
vec3 prev   = texture2D(bufPrev, fbUV).rgb;
vec3 result = max(scene, prev * mix(0.20, 0.90, warpEnv));         // max: eco luminoso
// warpEnv: envolvente 0..1, ataque en el frente de onda, release exponencial ~600 ms
```

### 4.8 Depth of field por capas (barato, sin blur real)

Sin gaussian blur de pass extra. Dos mecanismos:
- En shader: el plano lejano de estrellas y la nebulosa se evaluan con una octava menos
  de fbm y estrellas con `smoothstep` mas ancho (borde blando = desenfoque percibido).
- En DOM: `.ch4-layer--matrix { filter: blur(1.5px); }` (capa lejana) y
  `.ch4-layer--near { filter: blur(0.75px); }` cuando tier HIGH. El personaje (plano
  focal) queda nitido. Costo: 2 capas con blur estatico, compuesto por GPU, aceptable;
  en tier MED/LOW se quita el filter.

### 4.9 Optica de headset (Pass C, el "pegamento")

Orden dentro del pass final: godrays -> barrel -> CA -> viñeta binocular -> grain -> SDE.

```glsl
// Barrel distortion, modelo Brown-Conrady simplificado (k1, k2)
vec2 barrel(vec2 uv, float k1, float k2){       // k1 0.07, k2 0.02 en reposo
  vec2  c  = uv - 0.5;
  float r2 = dot(c, c);
  return 0.5 + c * (1.0 + k1 * r2 + k2 * r2 * r2);
}

// Aberracion cromatica de lente: cada canal con radio distinto (como la optica real
// del CV1, que el SDK corrige por-canal; aca la dejamos visible a proposito)
vec3 caSample(sampler2D src, vec2 uv, float amt){   // amt 0.0035 reposo, x6 en beats
  vec2 dir = uv - 0.5;
  return vec3(texture2D(src, uv + dir * amt).r,
              texture2D(src, uv).g,
              texture2D(src, uv - dir * amt).b);
}

// Screen-door effect sutil (era CV1): rejilla subpixel a 0.03 de opacidad, solo HIGH
float sde = 1.0 - 0.03 * step(0.5, fract(gl_FragCoord.x * 0.5)) * step(0.5, fract(gl_FragCoord.y * 0.5));

// Grain animado (unifica todas las capas, mata el banding de gradientes)
color += (hash(uv * 1013.0 + fract(t) * 7.0) - 0.5) * 0.025;
```

La viñeta binocular replica la geometria CSS actual (dos elipses + nariz + marco) pero
dentro del shader, de modo que la distorsion barrel la curva junto con la imagen.
`k1/k2`, `amt` de CA y la apertura de la viñeta son uniforms animados por la coreografia (§6).

### 4.10 Suelo holografico perspectivo (Pass A, se conserva)

El suelo actual del frag (proyeccion `1/fT`, variantes por universo, celdas rotas en U3)
esta bien resuelto: se conserva tal cual, con un cambio: recibe el lensing (§4.3) para
que el suelo se hunda hacia el portal, y una linea de "horizonte de energia" en
`fT==0` que pulsa con la respiracion del portal.

---

## 5. Profundidad real: inventario de planos

De atras hacia adelante, con su mecanismo de movimiento:

| Plano | Medio | Parallax (factor puntero) |
|---|---|---|
| Nebulosa warp | shader | 0.008 (casi fija) |
| Estrellas depth 4.0 | shader | 0.009 |
| Estrellas depth 2.2 | shader | 0.016 |
| Tunel del portal | shader | fijo en espacio + rd sesgado por puntero (paraleaje interno propio) |
| Suelo holografico | shader | via lensing |
| Estrellas depth 1.0 | shader | 0.035 |
| `.ch4-layer--matrix` + glifos | DOM | 11-15 px (actual) + blur 1.5px |
| Personaje + visor glow | DOM | 20 px (actual), plano focal nitido |
| `.ch4-layer--near` | DOM | 32 px (actual) + blur 0.75px |
| HUD + contenido | DOM | 0 (pegado al "cristal del visor") |

Regla de coherencia: TODOS los offsets de puntero (shader y CSS) derivan del mismo par
`(--mx, --my)` con el mismo drift sinusoidal, como hoy. El shader lo recibe por uniform.
Que el HUD NO tenga parallax es deliberado: esta impreso en la lente, y ese contraste
(mundo que se mueve vs cristal que no) es el truco estereoscopico mas fuerte del capitulo.

---

## 6. El momento del salto: coreografia de entrada en beats

Disparo: `activeChapter` pasa a 4 (watch existente). El componente emite
`jump-progress` y `Chapter4Content` aplica clases por beat (`data-jump="boot|open|burst|lock"`).
Curvas: todas ease-out cubic salvo indicacion. Duracion total 1900 ms. Solo la primera
entrada por sesion de scroll ejecuta la secuencia completa; re-entradas usan una version
corta (beats 2-3, 700 ms) para no castigar al que scrollea arriba y abajo.

| Beat | t (ms) | Nombre | Que pasa |
|---|---|---|---|
| 0 | 0-350 | BOOT | Canvas en negro. HUD aparece linea a linea (stagger 60 ms) con texto de arranque; los dots de TRACKING se llenan de a uno. Viñeta binocular CERRADA (apertura 0.0: solo dos puntos de luz). Un tono corto de audio si esta desbloqueado. |
| 1 | 350-900 | OPEN | La viñeta se abre (apertura 0 -> 1, ease-out). `k1` de barrel baja de 0.30 a 0.07 (la imagen "se asienta" como al acomodarse el visor). CA `amt` hace pico 0.02 en t=400 y decae a 0.0035. El mundo (Pass A) hace fade-in de 0 a 1 durante el beat. |
| 2 | 900-1400 | BURST | Godrays EXPOSURE x3 -> x1 (ease-out 400 ms): el portal "enciende" la escena. Las capas DOM entran a su posicion con un scale stagger (matrix 1.06->1.0 en 900-1250, personaje 1.04->1.0 en 1000-1350, near 1.08->1.0 en 1050-1400): el espacio se abre en profundidad. |
| 3 | 1400-1900 | LOCK | HUD: FPS y LATENCY cuentan desde 0 hasta 72.4 / 11 ms (300 ms). Titulo hace type-in (o fade 250 ms). Paneles de contenido suben 16 px con fade (stagger 80 ms). Primer `nextShiftAt` se programa a t+8000 como hoy. |

PRM: sin beats. Crossfade unico de 300 ms de negro al frame estatico (§10).

Coreografia del warp de universo (se conserva el ciclo, se enriquece):

| Fase | t (ms) | Que pasa |
|---|---|---|
| Pre-flash | 0-120 | CA sube x6, el anillo del portal brilla 1.5x, micro zoom-in barrel (k1 +0.02). |
| Onda | 120-1320 | Radio del frente 0 -> 1.5 UV (como hoy, 1200 ms). Detras de la onda: paleta nueva + `warpEnv=1` en el feedback. Godrays burst al cruzar el centro de pantalla. `universe-change` al midpoint (sin cambio). |
| Eco | 1320-1900 | `warpEnv` release exponencial: el fantasma de la realidad vieja se estira hacia el portal y muere. CA vuelve a reposo. |

---

## 7. Presupuesto de performance y degradacion

### 7.1 Targets

- **Target: 60 fps** en GPU integrada moderna (Intel Iris Xe / Apple M1 / Ryzen Vega).
- **Suelo aceptable: 30 fps estables** en integradas viejas (Intel UHD 620) sin janks.
- Presupuesto de frame del shader: <= 4 ms en Iris Xe a 1080p logico.

### 7.2 Resolucion de render

- Pass A y B: **media resolucion** con techo. `w = min(canvasW/2, 960)`, `h = min(canvasH/2, 540)`.
  El volumen, la nebulosa y el feedback son de baja frecuencia: a media res + upscale
  linear no se percibe (tecnica estandar en sitios WebGL premiados y en volumetricos de juegos).
- Pass C: resolucion del canvas, con `dpr` cap: `dpr = min(devicePixelRatio, 1.5)`.
  El grain y el SDE del Pass C enmascaran el upscale.

### 7.3 Coste por efecto y tiers

| Efecto | HIGH | MED | LOW |
|---|---|---|---|
| Tunel raymarch (pasos) | 24 | 16 | 0 (vortice 2D actual) |
| fbm nebulosa (octavas) | 4 | 3 | 2 |
| Godrays (taps) | 24 | 12 | 0 (glow radial de 1 tap) |
| Feedback buffer | si | si | no |
| Lente Sobel (9 taps) | si | si | no |
| CA (3 taps) | si | si | si (es barata y es la firma) |
| Barrel + viñeta + grain | si | si | si |
| Blur DOM (§4.8) | si | no | no |
| SDE | si | no | no |

### 7.4 Seleccion y adaptacion de tier

- Arranque: HIGH si `hardwareConcurrency >= 8` o `deviceMemory >= 8`; MED en el resto;
  LOW si el contexto reporta `WEBGL_debug_renderer_info` con SwiftShader/llvmpipe
  (render por software) o si es mobile (`pointer: coarse` + viewport < 900 px).
- Adaptativo: media movil del delta de RAF sobre 90 frames. Si > 20 ms sostenido, bajar
  un tier (con histeresis: subir solo tras 10 s < 12 ms, maximo un cambio por 15 s).
  El cambio de tier es un swap de uniforms/defines, sin recompilar en caliente: compilar
  los 2 programas variantes (HIGH/MED comparten fuente con `#define STEPS`) al init.
- Sin WebGL: `supported=false` como hoy, y el fallback CSS de §10 toma el fondo.

### 7.5 Reglas de higiene (ya parcialmente vigentes, ahora obligatorias)

- RAF solo con `activeChapter===4` y `!document.hidden` (existente, conservar).
- `IntersectionObserver` NO necesario: activeChapter ya lo resuelve.
- Cero allocaciones por frame en JS (reusar arrays de uniforms).
- `powerPreference: 'high-performance'` en el context solo en tier HIGH; en LOW usar
  `'low-power'`.

---

## 8. Fix del defecto de layout (887 px en viewport de 791 px)

Causa: `.ch4-panel-column` tiene `margin-top: 20vh` + `overflow-y: auto` pero ninguna
cota de altura, asi que el flex item crece a su contenido (887 px) y desborda `.ch4-layout`
(que tiene `overflow: hidden`): el final del contenido queda cortado e inaccesible.

Fix especificado:

```css
.ch4-panel-column {
  margin-top: clamp(24px, 10vh, 96px);              /* antes: 20vh fijo */
  max-height: calc(
    100% - clamp(24px, 10vh, 96px)                  /* el margin-top */
    - var(--ch4-title-h, 72px)                      /* alto real del titulo (medido o approx) */
    - var(--sp-md)
  );
  overflow-y: auto;                                  /* ahora si scrollea DENTRO del viewport */
  overscroll-behavior: contain;                      /* no filtrar el scroll al scroll-snap */
  scrollbar-width: thin;
  scrollbar-color: rgba(0,255,255,0.35) transparent; /* scrollbar tematica, no la nativa gris */
}
```

Criterio de aceptacion: a 1366x768 y a 1920x791 el ultimo panel es alcanzable con scroll
interno y ningun contenido queda bajo el borde inferior. Anadir un fade-out gradiente de
24 px al fondo de la columna (mask-image) para indicar que hay mas contenido.

---

## 9. Legibilidad y contraste sobre el shader

- Regla tonal (§2.2): fuera del portal y sus godrays, el shader no supera luminancia
  0.45. La columna de contenido vive a la izquierda; el portal, a la derecha (81/75 %).
- `FloatingPanel` en ch4 debe llevar scrim propio: fondo minimo `rgba(6, 10, 30, 0.78)`
  + `backdrop-filter: blur(6px)` (con fallback sin blur: subir alpha a 0.86 via
  `@supports not (backdrop-filter: blur(1px))`).
- Verificacion: `--c-fg #b0d0ff` sobre el peor caso del scrim compuesto con el pico del
  shader (0.45 de luminancia bajo el panel) debe dar >= 4.5:1 (WCAG AA cuerpo). Con el
  scrim a 0.78 sobre luminancia 0.45 el fondo efectivo queda ~#131a35, contraste ~9.8:1. OK.
  QA debe medirlo con screenshot + picker en los 4 universos (el U1 verde es el mas claro).
- Flash del frente de onda: cap de 150 ms por encima de luminancia 0.6 en la zona de la
  columna de texto (la onda es radial desde la derecha: cruza la columna ya atenuada;
  ademas el scrim la amortigua).
- El titulo conserva su text-shadow doble; anadir `paint-order`/stroke no es necesario.

---

## 10. prefers-reduced-motion: fallback bello, no pantalla vacia

- El shader renderiza UN frame heroe estatico: `t = 7.3` (valor elegido para que la
  respiracion del portal este en maximo y el suelo tenga las lineas bien compuestas),
  con godrays activos, sin warp, sin feedback, sin lente, `pointer = (0,0)`.
  Es una ilustracion procedural, no un t=0 muerto como hoy.
- Un solo render y se libera el RAF (patron actual, conservar). Re-render solo en resize.
- La entrada es un crossfade de 300 ms (opacity CSS, permitido bajo PRM por ser fade corto;
  si se quiere ser estricto, salto directo sin fade).
- Sin ciclo de universos (conservar comportamiento actual). El HUD estatico con valores
  finales. Glifos DOM a opacity 0.3 estatica (regla PRM existente, conservar).
- Si ademas no hay WebGL: fondo CSS procedural estatico: gradiente radial doble
  (portal cian sobre navy) + el suelo holografico CSS actual en estatico + viñeta CSS.
  Nunca pantalla plana vacia.

---

## 11. Responsive

- **Desktop >= 900 px**: spec completa. Portal en (0.81, 0.75) del viewport como hoy.
- **Mobile portrait < 600 px**: portal reencuadrado a (0.50, 0.72) uniform `u_portal`
  (en portrait la esquina derecha lo saca de cuadro); tier LOW-MED; lente reveladora en
  orbita automatica (no hay puntero); parallax solo con drift autonomo; viñeta binocular
  reemplazada por viñeta simple oval (dos oculares en un ancho de 360 px se ven ridiculos);
  suelo shader activo (reemplaza al CSS que hoy se oculta en mobile, ahora con dignidad).
- **Mobile landscape / tablet 600-899 px**: portal en (0.78, 0.70), viñeta binocular SI
  (aspect lo permite), tier segun §7.4.
- Resize: recrear FBOs con debounce 200 ms; el canvas usa `clientWidth/Height` reales.

---

## 12. Textos, i18n y restricciones editoriales

- Nuevas strings del BOOT del HUD (beat 0): van por vue-i18n con paridad ES/EN.
  Propuesta (sin caracter em-dash, prohibido en todo texto del sitio):
  - `ch4.hud.boot1`: ES "INICIANDO SISTEMA OPTICO" / EN "OPTICAL SYSTEM BOOT"
  - `ch4.hud.boot2`: ES "CALIBRANDO SEGUIMIENTO" / EN "CALIBRATING TRACKING"
  - `ch4.hud.boot3`: ES "REALIDAD LISTA" / EN "REALITY READY"
  - Las etiquetas diegeticas del headset (TRACKING, FOV, BATTERY, SIGNAL, FPS, LATENCY,
    OCULUS RIFT CV1) permanecen en ingles en ambos locales: son la UI del dispositivo,
    igual que hoy, y asi lo mostraba el hardware real de 2015.
- Ningun string nuevo contiene em-dash. Verificable por grep en `src/i18n/locales/*.json`.

---

## 13. Plan de implementacion y criterios de aceptacion

Orden sugerido (cada item es committeable por separado):

1. **Fix layout §8** (independiente de todo, resuelve el defecto conocido). AC: contenido
   completo alcanzable a 1366x768 y 1920x791.
2. **Refactor del canvas**: resolucion dinamica + opaco + sin blend screen + Pass A con
   el contenido actual portado (paridad visual minima). AC: sin regresion de tests.
3. **Pass A nuevo**: tunel raymarcheado + nebulosa warp + parallax en shader + suelo
   mejorado. AC: portal con interior visible, estrellas con 3 velocidades de parallax.
4. **Pass C**: barrel + CA + viñeta shader + grain (+ borrar viñeta CSS). AC: la imagen
   completa se curva coherente al mover el puntero de borde a borde.
5. **Godrays** (Pass C). AC: rayos visibles pulsando desde el portal, sin banding grosero.
6. **Pass B feedback + warp enriquecido**. AC: eco visible ~600 ms tras cada salto.
7. **Lente reveladora Sobel**. AC: circulo siguiendo el puntero con wireframe del
   universo siguiente y aro brillante.
8. **Coreografia de entrada §6** + emit `jump-progress` + HUD boot i18n. AC: beats con
   los tiempos de la tabla, version corta en re-entrada, PRM crossfade.
9. **Tiers + adaptativo §7**. AC: forzando tier LOW por query param de debug, el frame
   time baja y el capitulo sigue siendo presentable.
10. **QA de contraste §9 + responsive §11** en los 4 universos x 3 breakpoints.

Criterio global de aceptacion estetica: capturar 1 screenshot por universo en beat LOCK
y validarlos con Rafael antes de dar el capitulo por cerrado (regla: nada es intencional,
arreglar en vez de suprimir).

---

## 14. Fuentes

Tecnicas de shader:
- Inigo Quilez, indice de articulos: https://iquilezles.org/articles/
- Inigo Quilez, domain warping: https://iquilezles.org/articles/warp/
- Inigo Quilez, raymarching de SDFs: https://iquilezles.org/articles/raymarchingdf/
- The Book of Shaders, ruido (cap. 11) y fbm (cap. 13): https://thebookofshaders.com/11/ y https://thebookofshaders.com/13/
- GPU Gems 3 cap. 13, "Volumetric Light Scattering as a Post-Process" (Kenny Mitchell):
  https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process
- Implementacion de referencia de godrays screen-space: https://github.com/math-araujo/screen-space-godrays
- Volumetric raymarching (acumulacion de densidad): https://mini.gmshaders.com/p/volumetric
  y https://blog.maximeheckel.com/posts/painting-with-math-a-gentle-study-of-raymarching/
- Shadertoy, tuneles/wormholes de referencia: https://www.shadertoy.com/view/wdtczs y
  https://www.shadertoy.com/view/3c3fRs

Optica de headset:
- Meta/Oculus, "Rendering to the Rift" (barrel distortion inversa + correccion de CA por canal):
  https://developers.meta.com/horizon/documentation/native/pc/dg-render/
- S. LaValle, "Correcting Optical Distortions" (modelo de Brown, transformada inversa):
  https://lavalle.pl/vr/node211.html
- Imagination Tech, coste de la correccion barrel por fragment en mobile VR:
  https://blog.imaginationtech.com/speeding-up-gpu-barrel-distortion-correction-in-mobile-vr/

Integracion Phaser (evaluada y descartada para ch4, valida para ch6):
- Phaser PostFXPipeline API: https://docs.phaser.io/api-documentation/class/renderer-webgl-pipelines-postfxpipeline
- Notas rexrainbow sobre PostFX pipelines: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/postfx-pipeline/

Referentes de mercado:
- Colecciones WebGL de Awwwards: https://www.awwwards.com/websites/webgl/ y
  https://www.awwwards.com/awwwards/collections/webgl-shaders-code/
