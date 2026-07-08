# SESSION HANDOFF — 2026-07-07 (c) · ch5 cine: composición + animación de festejo

> Para retomar tras `/clear`. Comunicación con Rafael en **español**.
> Dev: `npm run dev` → **puerto 5174** (5173 ocupado). `?ch=5` NO salta solo:
> hay que **clic en el sidebar "2022 Modern"** (la sección es scroll-shell).

## Estado (commits en master)
- `0c6ebcb` — 125 sprites estáticos + fondo gran hall (bg-hall-v3).
- `e3a4240` — **WIP actual**: composición afinada con Rafael + **103/125 spritesheets** de festejo.

## Qué está hecho
1. **125 personajes estáticos** en `public/assets/ch5-cinema/{slug}.png` (25 beat-em-up + 100 temáticos).
2. **Fondo:** `bg-hall-v3.png` (gran salón, pantalla pintada al centro) cableado en `.ch5-cine`.
3. **Composición (iterada EN VIVO con Rafael, en `Chapter5Content.vue > buildCrowd`):**
   - Sprites **anclados por los PIES**: `.cine-char { transform: translate(-50%,-100%) }` → `y` = línea del piso.
   - Multitud **pequeña, baja, LLENA, contenida en la alfombra**: `Fy=48`, `rx=8+t*18`, `ry=15+t*35`,
     `halfA=34+t*18`, `baseH=30+t*109`, `count=max(9, round(12+16*(1-t)))`, **clamp `y=[60,100]%`**,
     scatter angular `halfA*0.34` + radial `±0.22` + jitter x `±4`, `sizeMul=0.66+rng*0.64`.
   - **Guard de ratio relajado a 1.8** (multitud densa; bolsa barajada reparte parejo).
   - **`.cine-screen` movida a `top:38%`, `width:min(17vw,300px)`** para caer sobre la pantalla pintada
     del hall (una sola pantalla). Ahí irá el slideshow (TASK 3b).
   - **Último feedback de Rafael:** "dentro de la alfombra, no a los extremos, centro denso, más lleno"
     → ya aplicado. **Falta su OK final** (le mostré screenshot; la sesión se cortó por /clear).
     Detalle menor pendiente: 2-3 sprites "sueltos" en los bordes por el scatter (se pueden jalar
     bajando el jitter/`halfA` si lo pide).
4. **Animación de festejo (TASK 2):** 103/125 spritesheets en `public/assets/ch5-cinema/anim/{slug}.png`
   (v3, dirección `north`, **9 frames**, tira horizontal). **Faltan 22** (los beat-em-up, ver abajo).

## ⚠️ Aprendizajes CLAVE (no reaprender)
- **pixellab tiene límite de 8 JOBS CONCURRENTES.** El "incidente" de fallos NO era aleatorio: era el
  límite de slots (por eso lotes ≤8 rinden y >8 rechazan con "8/8 used"). **Disparar SIEMPRE en olas de ≤8**
  y esperar a que completen antes de la siguiente.
- **Animación v3 north = 1 gen** (temáticos). **Beat-em-up cuestan 2-8 gen** por animación (otra creación).
- **Descarga de animación:** ZIP en `https://api.pixellab.ai/mcp/characters/{id}/download` →
  `{slug}/animations/festejo/north/frame_000.png … frame_008.png`. El script `build_sheets.py` baja el zip,
  extrae los frames north y arma la tira horizontal.
- **Fallos de animación:** algunos jobs fallan/quedan lentos; el patrón es recomputar "sin sheet" y reintentar.

## Infra de continuación (en `.planning/ch5-cinema/`)
- **`all_ids.tsv`** — 125 `slug\tcharacter_id` (ids finales, funcionan). **Fuente de verdad.**
- **`scripts/anim_poll.sh`** — `bash anim_poll.sh <max_seg> slug=id ...` → pollea el zip y ARMA los
  spritesheets a `public/assets/ch5-cinema/anim/{slug}.png` (usa build_sheets.py). Correr en background.
- **`scripts/build_sheets.py`** — baja zip + arma un spritesheet (usa Pillow, en `C:\Python\Python37`).
- **`scripts/poll_dl.sh`** — descarga `north.png` estáticos (para backfill, ya no se necesita).
- **`IDS.tsv`** — 100 temáticos, status done.
- **NOTA:** los scripts referencian rutas del scratchpad de ESTA sesión
  (`...\dea28548-...\scratchpad\build_sheets.py`). Tras /clear el scratchpad cambia → **actualizar el path
  de `BS=` dentro de `anim_poll.sh`** al nuevo scratchpad, o copiar los scripts allí. `build_sheets.py`
  y el `DEST` usan rutas absolutas de `D:\timeline-portfolio` (OK).

## TAREA A — Terminar animación (22 restantes, todos beat-em-up)
Olas de ≤8 `animate_character(character_id, mode="v3", directions=["north"], frame_count=8,
keep_first_frame=true, action_description=<rotar 4 variantes de festejo>)`. Variantes:
1. `cheering, both arms pumping up and down overhead, bouncing on the spot`
2. `clapping hands over the head while swaying side to side`
3. `jumping up and down with fists raised, celebrating`
4. `waving both arms overhead and shimmying shoulders`

Flujo por ola: recomputar "sin sheet" = `for slug id in all_ids: [ -f anim/$slug.png ] || echo`,
tomar ≤8, `animate_character`, lanzar `anim_poll.sh` en background, al terminar recomputar y repetir
hasta 125/125. (all-around estaba en vuelo al cortar.)

Faltan: all-around ninja zoner female-1 female-2 female-3 balanced tank grappler eyeball warden
charger shield-drone empire-drone idle-a attack1 walk-a idle-b fighter flyer monk.
(⚠️ varios NO son humanoides de pie: monitor-frame[ya], eyeball, shield-drone, empire-drone — si el
festejo se ve raro, Rafael dijo "125 sin excepción", pero se puede excluir del CAST animado si molesta.)

## TAREA B — Cablear el render animado (el crowd sigue ESTÁTICo `<img>`)
Enfoque **validado** (Opción B, spritesheet + CSS `steps`): cada sprite es un `<div>` con
`background-image: url(/assets/ch5-cinema/anim/{slug}.png)`, tamaño natural del frame, y
`@keyframes { to { background-position-x: calc(-9 * var(--fw)) } }` con `animation: … .9s steps(9) infinite`
y `animation-delay: -{seat.animDelay}s` (buildCrowd ya calcula `animDelay`). Mantener anclaje por pies
(`translate(-50%,-100%) scale(seat.h/fw)`) y el `filter` de brightness/drop-shadow.
- **`--fw`** = ancho de frame por slug (los frames son cuadrados; `fw = ancho_sheet/9`). Generar un
  **manifest** `slug→fw` (script Pillow: leer cada `anim/{slug}.png`, `fw = width/9`) e importarlo.
- Como los 125 tendrán sheet, TODOS los asientos usan el render animado (sin fallback).
- Validar perf con ~180 sprites animados (fps, jank al scroll). Screenshot `?ch=5`.

## TAREA C — TASK 3b: contenido de la pantalla (pixelforge)
Rafael: la `.cine-screen` cicla **varias escenas de la época** — box, MMA, conciertos,
científicos/lab, COVID. Generar ~5 escenas 16:9 con `forge_background` (aspect 16:9, style snes,
model nano-banana-2) y **ciclarlas dentro de `.cine-screen`** como slideshow (cross-fade CSS/JS ~4-5s).
pixelforge YA reconecta en esta ruta (schemas deferred vía ToolSearch `select:mcp__pixelforge__forge_background`).

## Deuda
- **Commit por hito** (pref. de Rafael). Al terminar cada tarea, commit atómico.
- **Tests ch5:** 6/7 rojos por `showText=false` — actualizar al cerrar diseño.
- **anim-test.html** ya borrado. Candidatos de fondo rechazados ya borrados.
- Saldo pixellab: quedaba amplio (~1800+ gen); las 22 anims beat-em-up cuestan ~2-8 c/u.
