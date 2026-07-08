# ch5 "Cine 2022" — Roster GROOMEADO de 100 personajes para pixellab

> **Fuente de verdad** de la tarea "poblar la multitud de ch5 con personajes de pixellab de
> espaldas, festejando". Creado 2026-07-07. **Groomeado 2026-07-07** (esta versión): se
> auditó viabilidad, se cortaron 14 inviables, se conservaron 61 y se añadieron 39 nuevos
> → **100 personajes viables**. Además se especificó la **animación idle de festejo (de
> espaldas)** y la **regla anti-repetición (ratio ≤ 1.2)**.

---

## 0. Qué cambió en el groom (resumen para IA en frío)

Rafael pidió (verbatim, parafraseado): *"groomea la tarea de crear 75 personajes, decide
cuáles son inviables — si necesitan muchos elementos del ambiente deben servir solos; después
de eliminar los que no sirven aumenta ideas en el mismo formato hasta 100 personajes; además,
a los que ya están puestos más los nuevos, hazles una animación idle de espaldas festejando,
moviéndose (que se mueva el público); y no deben repetirse los personajes en la escena en un
ratio mayor a 1.2"*.

Decisiones tomadas en el groom:

1. **Criterio de viabilidad** (§1): el sprite debe **leerse solo, de espaldas, de pie**, sin
   depender de props de entorno (trono, roca, rama, rival, macetas, pelota…). El público se ve
   por la **rotación `north`** = nuca/espalda, pequeño, en una sala oscura. Por eso:
   - Se **cortan** objetos cuya identidad es 100 % frontal (una cara/pantalla) → de espaldas
     quedan como una caja/mancha.
   - Se **cortan** criaturas **horizontales/acuáticas/colgantes** sin pose de pie.
   - Se **cortan** los que **necesitan** un objeto de escena para leerse (rival, rama, pelota).
   - Se **conservan con "rework"** los que solo tenían props *decorativos*: se les quita el
     entorno y se los deja de pie (nota `rework` en la tabla).
2. **14 cortados** (§2), **61 conservados** (§3), **39 nuevos** (§4) → **100 IN**.
3. **Animación** (§5): a los **100 nuevos + 25 existentes = 125** se les hace un idle de
   **festejo de espaldas** (`animate_character`, `v3`, `north`, ~1 gen c/u).
4. **Ratio ≤ 1.2** (§6): con **125 únicos** y ~146 asientos, `146/125 = 1.168 ≤ 1.2` ✔.
   `buildCrowd()` pasa a repartir con **bolsa barajada** (dif. de uso máx. 1 por personaje).
5. **Costo** (§7): ~225 generaciones de las 1995 disponibles. **Requiere OK de Rafael**
   antes de generar en masa (consume su cuota mensual).

---

## 1. Criterio de viabilidad (cómo se decidió cada corte)

Un personaje es **viable** si, reducido a **solo su cuerpo, de pie, visto de espaldas**, sigue
siendo reconocible y puede **levantar los brazos/apéndices para festejar**. Se evaluó cada spec
contra 4 filtros:

| Filtro | Descarta a… |
|---|---|
| **F1 — ¿tiene cuerpo de pie?** | Objetos sin piernas (monitor, tostadora, reloj) |
| **F2 — ¿se lee de espaldas?** | Los definidos por la cara/pantalla frontal (ojo, zoom-fantasma) |
| **F3 — ¿es vertical?** | Horizontales/acuáticos/colgantes (narval, axolotl, perezoso) |
| **F4 — ¿se sostiene sin el prop de escena?** | Los que necesitan rival/roca/rama/pelota |

Props **decorativos** (estrellas, luna, cubículo, tambores, monedas, flores al pie) **NO**
descalifican: se ignoran (van con fondo transparente). Solo descalifica cuando el prop **es** el
concepto.

---

## 2. CORTADOS (14) — inviables como espectador de pie, de espaldas

> Se documentan con su nº original y la razón. Sus specs verbatim quedan en el **Apéndice A**
> por si Rafael quiere rescatar/reformular alguno.

| orig# | slug | nombre | filtro | razón del corte |
|---|---|---|---|---|
| 3 | perro-demonio | Legión de perros demonio | F3 | Cuadrúpedo + concepto "legión"; no es un espectador de pie. |
| 4 | computadora-reptil | Computadora reptiliana | F1/F2 | Objeto; toda la identidad es la pantalla-cara frontal. De espaldas = caja. |
| 18 | caracol-motociclista | Caracol motociclista | F3 | Horizontal y bajo; no "está de pie" en una multitud. |
| 33 | perezoso-hiperactivo | Perezoso hiperactivo | F3/F4 | Su identidad **es** colgar de una rama (entorno + invertido). |
| 36 | narval-magico | Narval con cuerno mágico | F3 | Horizontal, acuático; cuerno frontal; sin pose de pie. |
| 37 | capibara-zen | Capibara zen | F4 | Sentado en loto **sobre una roca**; sin roca es un capibara genérico. |
| 38 | axolotl-aburrido | Axolotl inmortal | F3 | Horizontal, acuático relajado; sin pose vertical. |
| 43 | zoom-fantasma | Zoom fantasma glitcheado | F2 | Identidad = glitch de cara frontal + ícono; de espaldas = mancha blanca. |
| 51 | pulpo-jiujitsu | Pulpo del jiu-jitsu | F4 | Necesita un **rival implícito** para leerse; redundante con #9. |
| 59 | tostadora-poseida | Tostadora poseída | F1/F2 | Objeto sin piernas; ojos/tostadas frontales. De espaldas = caja de metal. |
| 60 | reloj-derretido | Reloj derretido con ansiedad | F1/F2 | Objeto derretido sin cuerpo; cara angustiada frontal. |
| 65 | ojo-piernas | Ojo gigante con piernas | F2 | Toda la identidad es el iris frontal; de espaldas = esfera blanca lisa. |
| 66 | ballena-globos | Ballena voladora con globos | F3/F4 | Flota **por** los globos (entorno) y es horizontal. |
| 72 | elefante-equilibrista | Elefante equilibrista | F4 | Todo el gag es equilibrarse **sobre la pelota**; sin ella es un elefante. |

---

## 3. CONSERVADOS (61) — renumerados 1–61

> `rework` = al crear el `description`, **omitir el prop de entorno** indicado y dejar al
> personaje **de pie, de espaldas, con brazos/apéndices libres** para festejar. Specs verbatim
> completas en el **Apéndice B** (con la nota de rework aplicada).

Estado: `pending` (nada), `queued` (creado, procesando), `anim` (animado), `done` (bajado + en CAST).

| # | slug | nombre | size | orig# | rework | pixellab_id | estado |
|---|------|--------|------|-------|--------|-------------|--------|
| 1 | pulga-gigante | Pulga gigante amable | 48 | 1 | erguida, de pie | — | pending |
| 2 | centauro-reversa | Centauro reversa | 48 | 2 | — | — | pending |
| 3 | androide-hippie | Androide espacial hippie | 48 | 5 | — | — | pending |
| 4 | simio-terno | Simio con terno | 40 | 6 | — | — | pending |
| 5 | mono-terno | Mono con terno | 32 | 7 | — | — | pending |
| 6 | alce-terno | Alce con terno | 48 | 8 | — | — | pending |
| 7 | pulpo-bibliotecario | Pulpo bibliotecario | 32 | 9 | erguido | — | pending |
| 8 | cactus-samurai | Cactus samurái | 40 | 10 | — | — | pending |
| 9 | tiburon-oficinista | Tiburón oficinista | 32 | 11 | sin cubículo | — | pending |
| 10 | gato-astronauta | Gato astronauta | 32 | 12 | de pie, no flotando | — | pending |
| 11 | rana-predicadora | Rana predicadora | 32 | 13 | sin púlpito; brazo alzado | — | pending |
| 12 | medusa-ballet | Medusa bailarina | 40 | 14 | erguida (hover) | — | pending |
| 13 | buho-detective | Búho detective | 32 | 15 | — | — | pending |
| 14 | dragon-vegano | Dragón vegano tímido | 40 | 16 | sin la verdura/escena | — | pending |
| 15 | esqueleto-dj | Esqueleto DJ | 32 | 17 | sin consola; manos arriba | — | pending |
| 16 | pinguino-luchador | Pingüino luchador | 32 | 19 | — | — | pending |
| 17 | zombi-vegetariano | Zombi vegetariano | 40 | 20 | — | — | pending |
| 18 | cerdo-banquero | Cerdo banquero avaro | 32 | 21 | sin montón de monedas | — | pending |
| 19 | erizo-punk | Erizo punk | 24 | 22 | — | — | pending |
| 20 | mantis-evangelista | Mantis evangelista | 40 | 23 | — | — | pending |
| 21 | cangrejo-boxeador | Cangrejo boxeador | 32 | 24 | erguido, guantes arriba | — | pending |
| 22 | sapo-opera | Sapo cantante de ópera | 32 | 25 | — | — | pending |
| 23 | alpaca-influencer | Alpaca influencer | 40 | 26 | — | — | pending |
| 24 | panda-contador | Panda contador | 32 | 27 | sin torres de papel | — | pending |
| 25 | nutria-pirata | Nutria pirata | 32 | 28 | sin barco | — | pending |
| 26 | cebra-codigobarras | Cebra código de barras | 32 | 29 | — | — | pending |
| 27 | pavo-real | Pavo real narcisista | 48 | 30 | de espaldas, abanico | — | pending |
| 28 | hipopotamo-tango | Hipopótamo tanguero | 40 | 31 | — | — | pending |
| 29 | loro-poliglota | Loro políglota | 32 | 32 | sin bocadillos | — | pending |
| 30 | mapache-gourmet | Mapache gourmet | 32 | 34 | — | — | pending |
| 31 | suricata-paranoico | Suricata paranoico | 32 | 35 | — | — | pending |
| 32 | virus-rockstar | Virus corona rockstar | 32 | 39 | patitas de pie | — | pending |
| 33 | cubrebocas-justiciero | Cubrebocas justiciero | 24 | 40 | capa de espaldas | — | pending |
| 34 | gel-musculoso | Gel desinfectante musculoso | 40 | 41 | — | — | pending |
| 35 | dona-cuarentena | Doña Cuarentena | 40 | 42 | sin macetas/gato | — | pending |
| 36 | papel-coronado | Papel higiénico coronado | 32 | 44 | sin trono | — | pending |
| 37 | jeringa-ninja | Jeringa vacunadora ninja | 24 | 45 | — | — | pending |
| 38 | termometro-ansioso | Termómetro ansioso | 32 | 46 | silueta fina alta | — | pending |
| 39 | toro-octagono | Toro octágono | 48 | 47 | — | — | pending |
| 40 | canguro-grappler | Canguro grappler | 48 | 48 | — | — | pending |
| 41 | oso-pesado | Oso peso pesado | 48 | 49 | — | — | pending |
| 42 | gallo-striker | Gallo de riña striker | 40 | 50 | — | — | pending |
| 43 | rinoceronte-noqueador | Rinoceronte noqueador | 48 | 52 | — | — | pending |
| 44 | cannabis-guardian | Cannabis guardián ancestral | 48 | 53 | silueta de hojas | — | pending |
| 45 | cogollo-boxeador | Cogollo boxeador | 40 | 54 | — | — | pending |
| 46 | maria-diva | María Juana diva | 48 | 55 | — | — | pending |
| 47 | porro-aventurero | Porro aventurero | 32 | 56 | mochila de espaldas | — | pending |
| 48 | planta-rasta | Planta rasta gigante | 48 | 57 | sin tambores | — | pending |
| 49 | semilla-bebe | Semilla bebé traviesa | 16 | 58 | — | — | pending |
| 50 | robot-jardinero | Robot jardinero | 40 | 61 | sin flores marchitas | — | pending |
| 51 | zanahoria-musculosa | Zanahoria musculosa | 32 | 62 | — | — | pending |
| 52 | champinon-copa | Champiñón con sombrero de copa | 32 | 63 | — | — | pending |
| 53 | escarabajo-aristocrata | Escarabajo aristócrata | 24 | 64 | erguido | — | pending |
| 54 | yeti-solar | Yeti con protector solar | 48 | 67 | — | — | pending |
| 55 | iguana-rockera | Iguana rockera | 40 | 68 | erguida, guitarra a la espalda | — | pending |
| 56 | momia-pijama | Momia en pijama | 40 | 69 | — | — | pending |
| 57 | girasol-vampiro | Girasol vampiro | 40 | 70 | sin luna de fondo | — | pending |
| 58 | koala-insomne | Koala insomne | 32 | 71 | de pie, sin tronco | — | pending |
| 59 | pez-globo-ansioso | Pez globo ansioso | 24 | 73 | patitas de pie | — | pending |
| 60 | aguila-alturas | Águila con miedo a las alturas | 32 | 74 | de pie, sin rama | — | pending |
| 61 | ornitorrinco-espia | Ornitorrinco espía | 32 | 75 | más erguido | — | pending |

---

## 4. NUEVOS (39) — numerados 62–100

> Escritos en el mismo formato que Rafael, **todos** ya nacen: de pie, verticales, silueta
> legible **de espaldas** (sombreros, capas, crestas, cuernos, mochilas, pelo, alas, colas) y
> con brazos/apéndices que **pueden alzarse para festejar**. Cero dependencia de entorno.
> Se prioriza lo **festivo** (gorritos, confeti, glowsticks, capas) porque el público está
> **animando frente a la pantalla**. Specs verbatim en el **Apéndice C**.

| # | slug | nombre | size | tema | pixellab_id | estado |
|---|------|--------|------|------|-------------|--------|
| 62 | lemur-raver | Lémur raver con glowsticks | 32 | animales | — | pending |
| 63 | zorro-broker | Zorro corredor de bolsa | 40 | animales | — | pending |
| 64 | cabra-metalera | Cabra heavy metal | 40 | animales | — | pending |
| 65 | flamenco-yoga | Flamenco yogui en una pata | 48 | animales | — | pending |
| 66 | tucan-reggaeton | Tucán reggaetonero | 32 | animales | — | pending |
| 67 | camaleon-influencer | Camaleón influencer | 32 | animales | — | pending |
| 68 | murcielago-barista | Murciélago barista | 32 | animales | — | pending |
| 69 | bisonte-motero | Bisonte motociclista | 48 | animales | — | pending |
| 70 | ardilla-culturista | Ardilla culturista | 32 | animales | — | pending |
| 71 | foca-comediante | Foca stand-up | 32 | animales | — | pending |
| 72 | camello-dj | Camello DJ del desierto | 40 | animales | — | pending |
| 73 | leon-karaoke | León de karaoke | 40 | animales | — | pending |
| 74 | gorila-muaythai | Gorila de Muay Thai | 48 | MMA | — | pending |
| 75 | tejon-enmascarado | Tejón wrestler enmascarado | 40 | MMA | — | pending |
| 76 | avestruz-kickboxer | Avestruz kickboxer | 48 | MMA | — | pending |
| 77 | tortuga-sumo | Tortuga sumo | 40 | MMA | — | pending |
| 78 | bong-jazz | Bong saxofonista de jazz | 40 | marihuana | — | pending |
| 79 | hoja-surfista | Hoja de siete puntas surfista | 40 | marihuana | — | pending |
| 80 | grinder-breakdancer | Grinder breakdancer | 32 | marihuana | — | pending |
| 81 | brownie-relajado | Brownie relajado | 24 | marihuana | — | pending |
| 82 | guante-mimo | Guante de látex mimo | 32 | COVID | — | pending |
| 83 | vacuna-heroe | Vial de vacuna superhéroe | 32 | COVID | — | pending |
| 84 | qr-menu | Código QR de menú andante | 32 | COVID | — | pending |
| 85 | masa-madre | Masa madre panadera | 32 | COVID | — | pending |
| 86 | nube-paraguas | Nube lluviosa con paraguas | 32 | absurdas | — | pending |
| 87 | muela-rey | Muela con corona de rey | 32 | absurdas | — | pending |
| 88 | volcan-hawaiano | Volcán bailarín hawaiano | 40 | absurdas | — | pending |
| 89 | fantasma-fiestero | Fantasma con gorrito de cumpleaños | 32 | absurdas | — | pending |
| 90 | pinata-andante | Piñata andante | 40 | absurdas | — | pending |
| 91 | cerebro-graduado | Cerebro con birrete | 32 | absurdas | — | pending |
| 92 | robot-serpentinas | Robot retro con serpentinas | 40 | absurdas | — | pending |
| 93 | pizza-rockera | Rebanada de pizza rockera | 32 | absurdas | — | pending |
| 94 | aguacate-galan | Aguacate galán | 32 | absurdas | — | pending |
| 95 | dado-suerte | Dado gigante de la suerte | 32 | absurdas | — | pending |
| 96 | sombrero-mago | Sombrero de mago viviente | 32 | absurdas | — | pending |
| 97 | globo-helio | Globo de helio con carita | 24 | absurdas | — | pending |
| 98 | cactus-disco | Cactus con bola de disco | 40 | absurdas | — | pending |
| 99 | taco-mariachi | Taco mariachi | 32 | absurdas | — | pending |
| 100 | estrella-fugaz | Estrella fugaz con bracitos | 32 | absurdas | — | pending |

---

## 5. Animación idle de festejo (de espaldas) — spec

**Objetivo:** que el público **se mueva** (que se sienta vivo festejando frente a la pantalla),
visto de **espaldas**.

- **Herramienta:** `mcp__pixellab__animate_character`.
- **Modo:** `v3` (custom, barato: **1 gen/dirección**). *(Si un personaje sale pobre, escalar:
  primero re-roll v3; solo héroes puntuales a `pro` con confirmación de costo.)*
- **`directions: ["north"]`** → solo la vista de espaldas (la única que usa el crowd). Esto
  evita animar las 8 direcciones (ahorra 7 gen por personaje).
- **`action_description`** (sin entorno, solo el movimiento): p.ej.
  `"cheering and celebrating, both arms raised and waving overhead, bouncing up and down excitedly"`.
  Variantes para no clonar el mismo baile en todos (rotar entre ~4):
  1. `"cheering, both arms pumping up and down overhead, bouncing on the spot"`
  2. `"clapping hands over the head while swaying side to side"`
  3. `"jumping up and down with fists raised, celebrating"`
  4. `"waving both arms overhead and shimmying shoulders"`
- **`frame_count: 8`** (bucle corto y liviano), `keep_first_frame: true`.
- **Alcance:** **125 personajes** = 100 nuevos + **25 existentes** (IDs en `list_characters`,
  ver Apéndice D). Rafael pidió explícitamente animar *"los que ya están puestos más los nuevos"*.
- **Costo:** ~125 gen (1 c/u, north).

### Render en la web (frontend, tarea #7)
El crowd hoy usa `north.png` estático. Opciones para animarlo:
- **A — GIF por personaje** (simple): bajar el `north` animado como **GIF** a
  `public/assets/ch5-cinema/{slug}.gif`; el `<img>` lo reproduce en bucle solo. Contra: ~146
  GIFs animándose; controlar peso/perf.
- **B — Spritesheet + CSS `steps()`** (más control): bajar el spritesheet horizontal de los 8
  frames; `background-image` + `animation: play .8s steps(8) infinite`. Permite **desfasar la
  fase** por asiento (ver §6, `animDelay`) para que **no latan todos igual** → se ve orgánico.
- **Decisión sugerida:** **B** si la perf lo permite (mejor desincronización y nitidez pixel);
  **A** como fallback rápido. En ambos, usar el `animDelay` por asiento que ya deja `buildCrowd`.

---

## 6. Regla anti-repetición (ratio ≤ 1.2) — spec + plan de `buildCrowd()`

**Interpretación:** el nº total de figuras en escena dividido por el nº de personajes **únicos**
no debe superar **1.2** (≤ 20 % de "relleno" por clonado), y los clones deben repartirse
**parejo** (que ningún personaje aparezca mucho más que otro).

**Aritmética actual:** `buildCrowd()` genera **~146 asientos** (suma de `count` por anillo).
Con **125 únicos**: `146 / 125 = 1.168 ≤ 1.2` ✔. *(Con solo 100 únicos daría 1.46 ✗ → por eso
conviene mantener los 25 existentes en el CAST, no reemplazarlos.)*

**Cambio en `buildCrowd()` (tarea #4):**
- **Antes:** `slug = CAST[(rng()*CAST.length)|0]` → muestreo **con reemplazo** ⇒ un personaje
  puede salir 5 veces y otro 0 (ratio real >> 1.2). ❌
- **Después:** **bolsa barajada** (Fisher–Yates con `mulberry32`): se baraja el CAST y se
  reparte 1 personaje por asiento; al agotar la bolsa se rebaraja. ⇒ cada personaje aparece
  `⌊146/125⌋..⌈146/125⌉` = **1 o 2 veces** (diferencia máx. **1**), y como `146 < 1.2×125`,
  solo **~21** aparecen 2 veces (repartidos, no contiguos). ✔
- **Guard de dev:** `console.assert(seats.length <= 1.2 * CAST.length, ...)` para que si alguien
  sube los anillos o baja el CAST rompiendo el ratio, salte en dev.
- **Bonus:** añadir `animDelay = rng() * DURACION` por asiento para desincronizar el festejo (§5).

*(Este cambio es reversible y **no** depende de los assets nuevos: mejora ya el reparto con los
25 actuales. Se implementa en el groom; el CAST se expande a 125 cuando los assets existan.)*

---

## 7. Costo y parámetros de creación (decididos)

- **Crear 100** × `standard` (1 gen c/u) = **100 gen**. Params: `mode:"standard"`,
  `n_directions:8` (necesitamos `north`), `view:"side"` (matchea a los 25), `body_type:"humanoid"`
  para **todos** (de pie), `size` por spec, outline/shading/detail = defaults.
- **Animar 125** × `v3` north (1 gen c/u) = **125 gen**.
- **Total ≈ 225 gen** de **1995** disponibles (Tier 1). Saldo 2026-07-07: `$10` + 1995 gen.
- **URL de descarga** (patrón verificado con los 25):
  `https://backblaze.pixellab.ai/file/pixellab-characters/{ACCOUNT}/{character-id}/rotations/north.png`
  `{ACCOUNT}` Rafael = `18d52b53-7235-434e-a62f-90a3d1e6d1f1` (igual, sacar la URL real del
  `rotations.north` / animación de cada `get_character` por si el segment difiere).

### Flujo de ejecución (tras OK de Rafael)
1. Encolar `create_character` en lotes (los 100). Guardar `character_id` en las tablas §3/§4.
2. Pollear `get_character` → `completed`.
3. `animate_character` v3 north festejo (los 100 + los 25). Guardar `animation`.
4. Bajar north animado (GIF/spritesheet) a `public/assets/ch5-cinema/{slug}.*`.
5. Expandir `CAST` a 125 en `Chapter5Content.vue`; render animado (§5); screenshot `?ch=5`.
6. Actualizar tests ch5 + decidir commit con Rafael.

---

## 8. Decisiones abiertas para Rafael (no bloqueantes salvo la ⚠️)
- ⚠️ **Luz verde para generar en masa** (~225 gen de tu cuota). Sin esto no se crea nada.
- **Paleta unificada** (16/32 colores) para coherencia de colección: ofrecida, pendiente. Si
  se quiere, pasarla como guía en cada `description` **antes** de crear.
- **Animar los 25 existentes** (beat-em-up) o solo los 100 nuevos: el groom asume **ambos**
  (lo pediste), pero los 25 son luchadores genéricos; si prefieres, se animan solo los 100 y el
  ratio sigue OK bajando asientos a ≤120.
- **Contenido de la pantalla** (la "tele" = cuadrado blanco): sigue pendiente, aparte de esto.

---

# Apéndices — specs verbatim

## Apéndice B — specs de los 61 CONSERVADOS (verbatim de Rafael + nota de rework)

> Usar como `description`. Donde diga **[rework]**, omitir ese prop de entorno y dejar al
> personaje de pie, de espaldas, con brazos libres.

**1. pulga-gigante — Pulga gigante amable** (48). Cuerpo ovalado marrón rojizo con degradado de dos tonos, seis patas delgadas en zigzag negro. Ojos enormes blancos con brillo de un solo píxel, cejas curvadas hacia arriba. Antenas como dos líneas rizadas. **[rework: erguida, de pie sobre las patas traseras.]**

**2. centauro-reversa — Centauro reversa** (48). Cabeza de caballo marrón arriba (crin en bloques escalonados café oscuro), cuerpo humano beige con piernas en pose erguida. Contraste claro entre el marrón animal y la piel. Hocico alargado en el tope de la silueta.

**3. androide-hippie — Androide espacial hippie** (48). Cuerpo plateado/gris de bloques metálicos, flores de 3-4 píxeles en rosa, amarillo y morado sobre el pecho. Gafas redondas multicolor, antena con una flor en la punta.

**4. simio-terno — Simio con terno** (40). Silueta negra-marrón de gorila con hombros anchos, terno gris oscuro con corbata roja de un píxel. Cara clara con ceño marcado. Reloj de bolsillo como punto dorado.

**5. mono-terno — Mono con terno** (32). Capuchino marrón claro con cara beige, terno azul ajustado, portafolios café diminuto. Postura encorvada y nerviosa. Gotita de sudor azul.

**6. alce-terno — Alce con terno** (48). Cuerpo marrón, astas enormes en café claro que ocupan el ancho superior del sprite (silueta muy reconocible). Terno negro con moño rojo. Hocico grande y oscuro.

**7. pulpo-bibliotecario — Pulpo bibliotecario con lentes** (32). Cabeza bulbosa morada, ocho tentáculos ondulados en dos tonos de púrpura, cada uno sosteniendo un librito de colores distintos. Lentes redondos blancos con marco negro. **[rework: erguido, cabeza arriba, tentáculos como "brazos".]**

**8. cactus-samurai — Cactus samurái** (40). Cuerpo verde vertical con espinas de píxeles amarillos, cinta blanca (hachimaki) con punto rojo. Katana como línea gris diagonal con mango marrón. Dos brazos-ramas en pose de combate.

**9. tiburon-oficinista — Tiburón oficinista con corbata** (32). Tiburón gris azulado con vientre blanco, camisa blanca, corbata roja floja. Ojeras oscuras, colmillos asomando. **[rework: sin cubículo de fondo.]**

**10. gato-astronauta — Gato astronauta desempleado** (32). Traje espacial blanco-gris con casco de burbuja (círculo con brillo diagonal), cara de gato naranja adentro. Cartelito de 8×8 en la pata. **[rework: de pie, no flotando.]**

**11. rana-predicadora — Rana predicadora** (32). Rana verde brillante con vientre crema, una pata alzada al cielo, ojos cerrados (líneas curvas). Túnica blanca opcional. **[rework: sin púlpito; el brazo alzado ya sirve de festejo.]**

**12. medusa-ballet — Medusa bailarina de ballet** (40). Campana cian claro con dithering translúcido, tutú rosa en abanico. Tentáculos finos ondulando. Puntos fosforescentes blancos. **[rework: erguida/hover vertical.]**

**13. buho-detective — Búho detective con pipa** (32). Búho café con gabardina beige, sombrero de detective marrón, ojos amarillos. Pipa con nube de humo gris. Silueta compacta y redonda.

**14. dragon-vegano — Dragón vegano tímido** (40). Dragón verde con mejillas rosadas, llamas naranjas suaves del hocico, alas pequeñas plegadas, ojos grandes tímidos. **[rework: sin la verdura/escena.]**

**15. esqueleto-dj — Esqueleto DJ** (32). Esqueleto blanco hueso con audífonos grandes rojos, gafas fluorescentes verdes. Costillas y brazos en pose de mezcla. **[rework: sin consola; manos arriba mezclando en el aire.]**

**16. pinguino-luchador — Pingüino luchador mexicano** (32). Pingüino negro-blanco con máscara de luchador roja, capa dorada ondeando. Pose de salto con aletas extendidas.

**17. zombi-vegetariano — Zombi vegetariano** (40). Piel verde grisácea, ropa rasgada café, un ojo colgando, zanahoria naranja en la mano. Postura tambaleante inclinada.

**18. cerdo-banquero — Cerdo banquero avaro** (32). Cerdo rosado rechoncho con monóculo, chaleco negro. Sonrisa avara curvada. **[rework: sin montón de monedas al pie.]**

**19. erizo-punk — Erizo punk** (24). Cuerpo café con púas erguidas como cresta mohawk rosa-neón y verde, chaqueta negra con tachuelas. Ceño rebelde.

**20. mantis-evangelista — Mantis religiosa evangelista** (40). Cuerpo verde delgado y vertical, patas delanteras juntas en oración, ojos brillantes con "halo" amarillo. Túnica blanca opcional. Silueta espigada.

**21. cangrejo-boxeador — Cangrejo boxeador** (32). Cuerpo rojo-anaranjado, dos guantes de boxeo rojos enormes en vez de pinzas, ojos en tallos. **[rework: erguido, guardia/guantes arriba.]**

**22. sapo-opera — Sapo cantante de ópera** (32). Sapo verde oscuro y ancho, garganta inflada, frac negro con moño blanco. Notas musicales blancas saliendo. Lágrima teatral azul.

**23. alpaca-influencer — Alpaca influencer** (40). Cuerpo esponjoso crema, flequillo café, aro de luz amarillo detrás de la cabeza. Palo selfie gris con teléfono.

**24. panda-contador — Oso panda contador** (32). Panda blanco-negro clásico, visera verde translúcida, calculadora gris. Ceño de agotamiento y bambú mordido. **[rework: sin torres de papeles.]**

**25. nutria-pirata — Nutria pirata** (32). Nutria marrón con parche negro, sombrero tricornio café, garfio plateado. Postura aventurera. **[rework: sin concha-barco.]**

**26. cebra-codigobarras — Cebra con rayas de código de barras** (32). Cuerpo blanco con rayas negras verticales de grosor variable (código de barras reconocible), números bajo las rayas. Ojos nerviosos.

**27. pavo-real — Pavo real narcisista** (48). Cuerpo azul-verde iridiscente, cola desplegada en abanico con "espejitos" cian con brillo blanco. **[rework: de espaldas, abanico desplegado hacia el espectador.]**

**28. hipopotamo-tango — Hipopótamo bailarín de tango** (40). Hipopótamo morado-gris voluminoso, rosa roja entre los dientes, una pata levantada en pose de tango. Silueta pesada pero elegante inclinada.

**29. loro-poliglota — Loro políglota confundido** (32). Loro multicolor (rojo, azul, amarillo en bloques), cabeza ladeada, ojos en espiral. **[rework: sin bocadillos de diálogo.]**

**30. mapache-gourmet — Mapache basurero gourmet** (32). Mapache gris con antifaz negro, gorro de chef blanco alto, bigote francés fino, plato con "restos gourmet". Pose orgullosa besándose los dedos.

**31. suricata-paranoico — Suricata vigilante paranoico** (32). Suricata beige erguida y delgada, binoculares negros, casco militar verde, silbato. Postura tiesa. Silueta vertical.

**32. virus-rockstar — Virus corona rockstar** (32). Esfera roja-magenta con picos-corona convertidos en cresta puntiaguda, gafas oscuras, micrófono gris. **[rework: dos patitas para estar de pie.]**

**33. cubrebocas-justiciero — Cubrebocas justiciero** (24). Mascarilla quirúrgica celeste con dos tirantes, capa roja pequeña ondeando, puños diminutos. Pose heroica. **[la capa lee perfecto de espaldas.]**

**34. gel-musculoso — Botella de gel desinfectante musculosa** (40). Frasco transparente-azulado con dispensador arriba, dos brazos musculosos, etiqueta "70%". Chorro de gel blanco.

**35. dona-cuarentena — Doña Cuarentena** (40). Anciana con bata rosa y pantuflas, pelo gris en moño, pan café en las manos. **[rework: sin macetas ni gato; solo la señora.]**

**36. papel-coronado — Papel higiénico coronado** (32). Rollo blanco cilíndrico con corona dorada de picos, cetro dorado diminuto. Papel desenrollándose como capa real. **[rework: sin trono.]**

**37. jeringa-ninja — Jeringa vacunadora ninja** (24). Jeringa transparente con líquido azul, envuelta en tela negra de ninja (solo ojos blancos), aguja plateada. Pose ágil en salto.

**38. termometro-ansioso — Termómetro ansioso** (32). Termómetro digital blanco vertical con pantalla "38°" en rojo, cara de pánico, gotas de sudor azules. Silueta fina y alta.

**39. toro-octagono — Toro octágono** (48). Toro humanoide marrón musculoso, cuernos blancos, orejas de coliflor, shorts de peleador rojos, tatuajes tribales negros. Pose de guardia.

**40. canguro-grappler — Canguro grappler** (48). Canguro café con guantes de MMA rojos, cinturón de campeón dorado, cola gruesa como apoyo. Piernas poderosas. Silueta vertical dinámica.

**41. oso-pesado — Oso pardo peso pesado** (48). Oso marrón colosal, shorts negros de pelea, cicatrices, oreja mordida. Postura dominante de brazos abiertos.

**42. gallo-striker — Gallo de riña striker** (40). Gallo con plumas rojas-naranjas erizadas, cresta roja, puños vendados blancos. Pose sobre una pata, con espolón. Silueta ágil.

**43. rinoceronte-noqueador — Rinoceronte noqueador** (48). Rinoceronte gris masivo, cuerno blanco, guantes rojos, shorts azules. Cabeza baja en pose de embestida. Silueta pesada y ancha.

**44. cannabis-guardian — Cannabis guardián ancestral** (48). Planta colosal verde con tronco marrón con rostro tallado, hojas de cannabis grandes de siete puntas (silueta icónica), aura verde y humo gris. **[rework: la silueta de hojas manda; sin escena.]**

**45. cogollo-boxeador — Cogollo boxeador** (40). Cogollo verde compacto con pelillos naranjas (tricomas), guantes de boxeo rojos, ojos relajados. Pose tranquila de guardia.

**46. maria-diva — María Juana diva** (48). Planta femenina verde con hojas de siete puntas, "pestañas" negras exageradas, labios rojos, pose glamurosa con una hoja en la cadera. Brillos de perfume.

**47. porro-aventurero — Porro aventurero** (32). Cigarro blanco-crema andante con puntita encendida naranja, mochila café, sombrero de explorador beige, bastón. Estela de humo gris. **[la mochila lee de espaldas.]**

**48. planta-rasta — Planta rasta gigante** (48). Marihuana verde con ramas convertidas en dreadlocks colgantes, gorro tricolor (rojo-amarillo-verde), hojas de siete puntas, expresión pacífica. **[rework: sin tambores.]**

**49. semilla-bebe — Semilla bebé traviesa** (16). Semilla café con vetas oscuras, dos brotes verdes pequeños como bracitos, cara pícara. Muy compacta y tierna.

**50. robot-jardinero — Robot jardinero melancólico** (40). Robot oxidado marrón-gris con regadera en la mano, ojos apagados azules. Gota de aceite. Postura encorvada. **[rework: sin flores marchitas al pie.]**

**51. zanahoria-musculosa — Zanahoria musculosa** (32). Zanahoria naranja con venas marcadas y bíceps, hojas verdes como cabello, pesas grises en las manos-raíz. Pose de flexión.

**52. champinon-copa — Champiñón con sombrero de copa** (32). Hongo con tallo blanco-crema, sombrero de copa negro cilíndrico, monóculo dorado, bastón fino. Pose aristocrática.

**53. escarabajo-aristocrata — Escarabajo aristócrata** (24). Escarabajo negro-azulado con caparazón brillante, peluca blanca empolvada, monóculo, bastón. Postura pomposa. **[rework: erguido, de pie.]**

**54. yeti-solar — Yeti con protector solar** (48). Yeti blanco peludo con manchas de crema solar blanca en nariz y hombros, gafas de sol negras, sombrilla colorida. Gotas de sudor azules.

**55. iguana-rockera — Iguana rockera** (40). Iguana verde con cresta erizada, guitarra eléctrica roja, chaqueta de cuero negra, lengua fuera. Notas musicales. **[rework: erguida; la guitarra a la espalda lee de espaldas.]**

**56. momia-pijama — Momia en pijama** (40). Momia con pijama de rayas azules-blancas en vez de vendas, pantuflas cafés, un vendaje suelto colgando, ojos somnolientos. Nubecita de bostezo.

**57. girasol-vampiro — Girasol vampiro** (40). Girasol de pétalos negros-morados oscuros, centro oscuro con dos colmillos blancos, tallo verde pálido, ojos rojos. **[rework: sin luna de fondo.]**

**58. koala-insomne — Koala insomne** (32). Koala gris con ojeras enormes moradas bajo ojos muy abiertos, nariz negra grande. Hojas verdes contadas flotando. **[rework: de pie, sin tronco de eucalipto.]**

**59. pez-globo-ansioso — Pez globo ansioso** (24). Pez globo amarillo-naranja inflado en esfera, espinas erizadas en todas direcciones, ojos saltones, gotas de sudor azules. **[rework: dos patitas para estar de pie.]**

**60. aguila-alturas — Águila con miedo a las alturas** (32). Águila café con cabeza blanca, alas pegadas al cuerpo, ojos de pánico. Líneas de temblor. **[rework: de pie temblando, sin rama.]**

**61. ornitorrinco-espia — Ornitorrinco espía secreto** (32). Ornitorrinco marrón con esmoquin negro, gafas de sol, audífono con cable de un píxel, pico anaranjado. **[rework: más erguido, no tan agachado.]**

---

## Apéndice C — specs de los 39 NUEVOS (verbatim)

> Mismo formato: paleta, silueta, tamaño, detalle que lea en baja resolución **y de espaldas**.
> Todos de pie, verticales, brazos/apéndices libres para festejar.

**62. lemur-raver — Lémur raver con glowsticks** (32). Lémur gris-blanco con cola larga anillada en blanco y negro (lee enorme de espaldas, curvada hacia arriba), dos glowsticks fluorescentes (verde y rosa) en las manos alzadas, orejas redondas. Chaleco negro. Brazos arriba = festejo natural.

**63. zorro-broker — Zorro corredor de bolsa** (40). Zorro naranja con tirantes rojos sobre camisa blanca arremangada, corbata suelta, cola tupida naranja de punta blanca (silueta de espaldas). Un puño al aire, teléfono viejo en la otra mano. Pelo peinado hacia atrás.

**64. cabra-metalera — Cabra heavy metal** (40). Cabra gris con cuernos curvos grandes (silueta top inconfundible), chaqueta de cuero negra con púas plateadas en la espalda, melena oscura. Mano haciendo cuernos metaleros al aire. Vaqueros rotos.

**65. flamenco-yoga — Flamenco yogui en una pata** (48). Flamenco rosa altísimo y delgado (silueta vertical llamativa), sobre una pata, cuello en curva elegante hacia arriba, alas abiertas como en saludo. Cinta morada de yoga en la pata alzada. Plumas de dos rosas.

**66. tucan-reggaeton — Tucán reggaetonero** (32). Tucán negro con pico enorme naranja-amarillo (silueta clave), cadenas de oro gruesas al cuello, gorra plana ladeada, brazos-alas cruzados o alzados. Colores saturados de plumaje.

**67. camaleon-influencer — Camaleón influencer** (32). Camaleón erguido cuyo cuerpo cambia de color en degradado (verde→rosa→azul por franjas), cola enroscada hacia arriba, cresta dorsal, ojos giratorios independientes. Palo selfie diminuto. Pose de "posando".

**68. murcielago-barista — Murciélago barista** (32). Murciélago morado oscuro de pie, alas plegadas como capa (lee de espaldas), delantal marrón con lazo atado atrás, gorrito, vaso de café para llevar en la mano. Orejas puntiagudas grandes.

**69. bisonte-motero — Bisonte motociclista** (48). Bisonte marrón oscuro con joroba y hombros enormes (silueta pesada de espaldas), chaqueta de cuero negra con parche en la espalda, pañuelo en la cabeza, cuernos cortos. Puño alzado. Barba de pelaje.

**70. ardilla-culturista — Ardilla culturista** (32). Ardilla café con cola gigante esponjosa (domina la silueta de espaldas), bíceps exagerados, una bellota-mancuerna en alto, cinturón de levantador. Pose de flexión mostrando músculo.

**71. foca-comediante — Foca stand-up comedian** (32). Foca gris erguida sobre la cola, micrófono de pie diminuto en una aleta, moño rojo, sonrisa. Aletas alzadas en gesto de remate de chiste. Cuerpo rechoncho brillante.

**72. camello-dj — Camello DJ del desierto** (40). Camello beige de pie con turbante colorido, dos jorobas (silueta clave de espaldas), audífonos grandes dorados, brazos alzados mezclando en el aire. Alforjas con patrón tribal.

**73. leon-karaoke — León de karaoke** (40). León dorado con melena enorme y despeinada (aro de silueta de espaldas), micrófono con cable en alto, esmoquin brillante con solapas, boca abierta cantando. Cola con borla. Pose dramática de balada.

**74. gorila-muaythai — Gorila de Muay Thai** (48). Gorila negro musculoso con shorts de Muay Thai satinados (rojo/dorado), mongkol (cinta ritual) en la cabeza, prajioud en los bíceps, espinilleras. Puños arriba en guardia. Hombros anchísimos.

**75. tejon-enmascarado — Tejón wrestler enmascarado** (40). Tejón gris-blanco (franja negra) con máscara de lucha libre colorida (verde/naranja), capa brillante ondeando (lee de espaldas), botas altas, cinturón de campeón. Brazos alzados como al entrar al ring.

**76. avestruz-kickboxer — Avestruz kickboxer** (48). Avestruz de piernas larguísimas y musculosas (silueta vertical cómica), cuerpo de plumas negras, cuello largo con cabecita, guantes de kickboxing rojos, vendas en las patas. Una rodilla en alto.

**77. tortuga-sumo — Tortuga sumo** (40). Tortuga verde enorme y baja con caparazón redondo (domina la espalda), mawashi (cinturón de sumo) grueso, moño de sumo (chonmage) en la cabeza. Brazos abiertos en pose de empuje. Patas gruesas plantadas.

**78. bong-jazz — Bong saxofonista de jazz** (40). Bong de vidrio alto azulado (silueta vertical translúcida con dithering), boina negra, gafas oscuras, sosteniendo un saxofón dorado. Dos patitas de pie. Notas musicales moradas. Humo suave.

**79. hoja-surfista — Hoja de siete puntas surfista** (40). Hoja de cannabis gigante de siete puntas (silueta icónica) como cuerpo, con bracitos y patitas, tabla de surf naranja al hombro/espalda, gafas de sol, collar de flores. Bronceado feliz.

**80. grinder-breakdancer — Grinder breakdancer** (32). Grinder metálico plateado (dos discos apilados, silueta cilíndrica) con brazos y piernas, gorra hacia atrás, cadena, pose de breakdance con un brazo al aire. Reflejos metálicos.

**81. brownie-relajado — Brownie relajado** (24). Brownie cuadrado café oscuro con textura de píxeles y "chispas" más oscuras, ojos entrecerrados relajados, dos patitas y bracitos, gorrito tejido tricolor. Pose chill con un pulgar arriba.

**82. guante-mimo — Guante de látex mimo** (32). Guante de látex celeste inflado (cinco dedos = silueta inconfundible) como cabeza/cuerpo, cara de mimo pintada (opcional), boina negra, tirantes. Brazos delgados alzados en gesto teatral.

**83. vacuna-heroe — Vial de vacuna superhéroe** (32). Vial de vacuna (frasco de vidrio con tapa metálica y líquido ámbar) con antifaz, capa roja ondeando (lee de espaldas), puños diminutos alzados, "V" en el pecho. Pose de vuelo heroico de pie.

**84. qr-menu — Código QR de menú andante** (32). Cuadrado de código QR blanco y negro (patrón reconocible, silueta cuadrada nítida) con dos ojos, bracitos y patitas de palo, boina de mesero y moñito. Un brazo saludando. Contraste puro alto.

**85. masa-madre — Masa madre panadera** (32). Masa de pan beige-dorada esponjosa y burbujeante (silueta orgánica ondulada) con gorro de chef blanco, delantal con lazo atrás, rodillo de amasar en una mano alzada. Sonrisa harinosa. Vaho de horno.

**86. nube-paraguas — Nube lluviosa con paraguas** (32). Nubecita gris rechoncha (silueta esponjosa) con carita, patitas de palo, sosteniendo un paraguas amarillo abierto (lee de espaldas), gotitas azules cayendo. Un brazo alzado con el paraguas.

**87. muela-rey — Muela con corona de rey** (32). Muela blanca (dos raíces = patitas, corona dental) con corona de rey dorada de picos, capa roja de armiño (lee de espaldas), cetro diminuto. Bracitos alzados. Brillo de esmalte.

**88. volcan-hawaiano — Volcán bailarín hawaiano** (40). Volcán marrón-gris cónico (silueta de montañita) con faldita hawaiana de hojas, collar de flores, brazos alzados hula, y **confeti/lava naranja saltando de la cima** como festejo. Cara sonriente.

**89. fantasma-fiestero — Fantasma con gorrito de cumpleaños** (32). Fantasma blanco-translúcido flotante (dithering en los bordes) con gorrito de cumpleaños cónico rayado (lee de espaldas), brazos ondulantes alzados, serpentinas alrededor. Sonrisa boba.

**90. pinata-andante — Piñata andante** (40). Piñata de burro/estrella de papel picado multicolor (flecos de colores = silueta festiva) con patitas, un palo colorido en la mano alzada, dulces cayendo. Muy saturada y festiva.

**91. cerebro-graduado — Cerebro con birrete** (32). Cerebro rosado arrugado (surcos legibles) con birrete negro de graduación y borla dorada (silueta top clave), lentes, diploma enrollado en alto. Dos patitas. Pose orgullosa.

**92. robot-serpentinas — Robot retro con serpentinas** (40). Robot de lata plateado cuadrado (antena, remaches, silueta boxy) con serpentinas y confeti saliendo del pecho, brazos telescópicos alzados, luces de colores parpadeantes. Ojos de foco felices.

**93. pizza-rockera — Rebanada de pizza rockera** (32). Rebanada de pizza triangular (borde dorado, pepperoni rojo, silueta de cuña) con bracitos y patitas, gafas de sol, guitarra pequeña al hombro, un brazo con cuernos de rock. Queso derretido en hilos.

**94. aguacate-galan — Aguacate galán** (32). Aguacate verde partido con hueso-corazón marrón brillante en el centro, ceja seductora, pecho abierto tipo galán, cadena de oro, brazos-hojas alzados. Silueta ovalada verde-negra.

**95. dado-suerte — Dado gigante de la suerte** (32). Dado blanco cúbico con puntos negros (silueta cúbica nítida, cara "6" arriba) con bracitos y patitas, sonrisa confiada, soplando sobre una mano como para la suerte, el otro brazo alzado.

**96. sombrero-mago — Sombrero de mago viviente** (32). Sombrero de mago cónico morado con estrellas y lunas doradas (silueta cónica alta) como cuerpo, ala ancha con bracitos que salen, varita en alto lanzando chispas. Ojos brillantes bajo el ala.

**97. globo-helio — Globo de helio con carita** (24). Globo rojo brillante (esfera con brillo diagonal, silueta redonda simple) con carita feliz, una cuerdita colgando, dos bracitos de palo alzados. Flota levemente. Nudo abajo.

**98. cactus-disco — Cactus con bola de disco** (40). Cactus verde vertical (dos brazos-ramas) con espejitos incrustados como bola de disco (destellos cian/blanco), gafas de sol, brazos alzados bailando. Maceta diminuta como pies. Puntos de espinas.

**99. taco-mariachi — Taco mariachi** (32). Taco doblado (tortilla dorada, relleno rojo-verde-marrón, silueta de media luna) con sombrero de mariachi enorme (silueta clave), bracitos, guitarrón pequeño, un brazo alzado gritando "¡ajúa!". Bordado.

**100. estrella-fugaz — Estrella fugaz con bracitos** (32). Estrella amarilla de cinco puntas (silueta clásica, brillo blanco) con carita feliz, bracitos y patitas, estela de brillos multicolor detrás, un brazo alzado. Rebota alegre.

---

## Apéndice A — specs verbatim de los 14 CORTADOS (por si Rafael los rescata)

3. **Legión de perros demonio** (16×16 c/u). Silueta de perro negro con contorno naranja-rojo, ojos rojos, cola de llama animable, patas con chispas amarillas. — *cortado (F3).*
4. **Computadora reptiliana** (32×32). Monitor CRT verde escamoso, pantalla con dos ojos reptilianos, lengua bífida roja. — *cortado (F1/F2).*
18. **Caracol motociclista** (32×24). Caracol verde-baba con concha en forma de moto, gafas oscuras, chaqueta de cuero, estela de velocidad. — *cortado (F3).*
33. **Perezoso hiperactivo** (32×32). Perezoso colgando de una rama, ojos vibrando, taza de café, líneas de movimiento. — *cortado (F3/F4).*
36. **Narval con cuerno mágico** (40×24). Cuerpo gris-azulado horizontal, colmillo en espiral, estela de brillos. — *cortado (F3).*
37. **Capibara zen maestro de yoga** (32×32). Capibara sentado en loto sobre roca, aura cian. — *cortado (F4).*
38. **Axolotl inmortal aburrido** (32×24). Axolotl rosa horizontal con branquias externas, sonrisa plana. — *cortado (F3).*
43. **Zoom fantasma glitcheado** (32×32). Fantasma con glitch de líneas cian/magenta, cara pixelada congelada, ícono mute. — *cortado (F2).*
51. **Pulpo del jiu-jitsu** (40×32). Pulpo con ocho brazos en llaves alrededor de un rival implícito, gi, cinturón negro. — *cortado (F4).*
59. **Tostadora poseída** (24×24). Tostadora con ojos rojos en la ranura, tostadas malignas saltando, chispas. — *cortado (F1/F2).*
60. **Reloj derretido con ansiedad** (32×24). Reloj de bolsillo derretido tipo Dalí, manecillas temblorosas, cara angustiada. — *cortado (F1/F2).*
65. **Ojo gigante con piernas** (24×32). Globo ocular con iris azul y venas rojas, dos piernas flacas. — *cortado (F2).*
66. **Ballena voladora con globos** (48×40). Ballena azul atada a globos multicolores, nubes. — *cortado (F3/F4).*
72. **Elefante equilibrista** (40×48). Elefante gris sobre una pelotita roja, trompa con sombrilla, una pata al aire. — *cortado (F4).*

---

## Apéndice D — IDs de los 25 personajes EXISTENTES (para animar el festejo)

> De `list_characters` 2026-07-07. Su `north.png` ya está en `public/assets/ch5-cinema/`.
> Para animarlos: `animate_character(character_id, mode="v3", directions=["north"], action_description=<festejo>)`.

| slug (asset) | character_id |
|---|---|
| monitor-frame | 4cb9d5be-d011-4809-ac06-d7847ff43715 |
| all-around | 0fa0505a-aea5-4bb6-b151-dd3d54a98864 |
| player-brawler | 7ce60664-8ba4-4d88-a6a2-022be7f8d663 |
| bboy-skater | 78582f06-50cd-49c7-a672-ef8ec6053904 |
| bboy-kungfu | 69e5f7e6-b6e4-4e0c-8a4d-703caf36cdf4 |
| ninja | cdcd6695-5246-455c-a97c-4e70361ffde0 |
| zoner | 8e742d41-dc16-4b62-8d01-7fec8f43d6e1 |
| female-1 | 6151ce32-3e4d-4b56-a67b-9b54237d1e94 |
| female-2 | a1ae9a19-9a6d-486e-8ebc-c707f3ef9f39 |
| female-3 | 68a52f8c-46a8-420e-919f-c18fd38f6c40 |
| balanced | 4618ae42-2ffa-4d89-91cd-7b11587a8193 |
| tank | edad47f8-ad2d-4885-9462-a69304c1c7fa |
| grappler | 787dd386-77de-4379-8aa6-9957a43ccb17 |
| eyeball | 314071c4-265c-428d-bb75-6caa859325fe |
| warden | bf3d2472-1377-42b0-9dc2-87c32cb7190c |
| charger | e09ba82f-b462-4d5b-bf10-a179547a5656 |
| shield-drone | b0aca2f8-efc9-413e-8676-3463293dc867 |
| empire-drone | e70ad1d9-ffaa-45f2-9281-3878bf6196c5 |
| idle-a | 53730fdb-10f1-4655-b870-1b31d84ec5d0 |
| attack1 | c18ee93e-590f-4adb-9f70-b16e84263382 |
| walk-a | 73dfc7b9-7d86-4bbd-b634-ed8fa0b4d5e1 |
| idle-b | 46dba912-1195-4f2d-aef0-9774771a8aa9 |
| fighter | 7ca7200c-bb07-47fe-b67f-ea948d4fac6b |
| flyer | 647819fd-b8f0-40ba-819f-3c3c0e085ed1 |
| monk | f6da571e-9e7c-4300-9250-2abb88133be0 |

> ⚠️ Nota: varios de los 25 (monitor-frame, eyeball, drones) **no son humanoides de pie**; si
> el festejo se ve raro en ellos, excluirlos del CAST animado (no todos tienen que quedar).
