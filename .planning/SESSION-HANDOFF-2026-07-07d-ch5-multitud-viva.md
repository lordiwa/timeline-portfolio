# SESSION HANDOFF — 2026-07-07 (d/e/f) · ch5 cine: multitud VIVA + webp

> Para retomar tras `/clear`. Comunicación con Rafael en **español**.
> Dev: `npm run dev` → **puerto 5174**. `?ch=5` NO salta solo: recargar y hacer **clic en el
> sidebar "2022 Modern"** (a veces 2 veces; la nav scroll-shell es intermitente).

## Estado: ch5 CERRADO y funcionando (pusheado a origin/master)

Commits de esta sesión (sobre `46eb617`):
- `543fda4` — festejo **125/125** + render animado + slideshow de pantalla.
- `3c6c209` — **multitud viva**: 6 estados por personaje (idle espaldas/frente, giro der/izq,
  media vuelta, festejo) que cambian al azar cada 1.5–3s, modelo **acción→reposo**.
- `efa6225` — clamp **trapezoidal** de la multitud a la alfombra (fix "canguro flotando sobre mesa").
- `d1763d2` — **tira webp combinada** por personaje: fin del titileo + peso 17M→3.9M.

## Cómo funciona ch5 (arquitectura final)

`src/components/Chapter5Content.vue`:
- Sala de cine (bg `bg-hall-v3.png`) con **125 personajes pixellab** repartidos por la alfombra.
- **Cada personaje = UN `<div>` con una tira webp** `public/assets/ch5-cinema/live/{slug}.webp`:
  frames **0-7 = rotación** (8 direcciones, horario desde norte) + **8.. = festejo**. El
  `background-image` NUNCA cambia (por eso ya no titila); solo se mueve `background-position-x`.
- **Máquina de estados** (runtime, no reactivo) en UN bucle `requestAnimationFrame` que escribe el
  DOM directo. Fase `act` (ejecuta 1 gesto una vez) → `rest` (quieto 1.5–3s) → elige otro.
  Respeta `prefers-reduced-motion`.
- **Pantalla** `.cine-screen`: slideshow cross-fade (4.5s) de 5 escenas de época **online/vacías**
  (box/mma/concierto/lab/covid) en `screen/*.webp` — pandemia 2022, recintos sin público.
- Manifest: `src/data/ch5CrowdManifest.json` = `{slug: {w,h,ff,festStart:8}}`.

## Infra (en `.planning/ch5-cinema/`)
- `all_ids.tsv` — 125 `slug\tcharacter_id` (**tiene CRLF** → hacer `.strip()` del id o la URL sale con `\r` = 400).
- `scripts/build_rotation_sheets.py` — baja las 8 rotaciones del zip → `rot/{slug}.png` (tira 8 frames).
- `scripts/anim_poll.sh` + `build_sheets.py` — festejo → `anim/{slug}.png`.
- `scripts/build_live_sheets.py` — combina rot+anim en `live/{slug}.webp` (lossless) + regenera manifest.
- ⚠️ **`rot/` y `anim/` PNG se BORRARON** (peso). Son regenerables **gratis** desde pixellab (la descarga
  no gasta generaciones). Rebuild de live: `build_rotation_sheets.py` + `anim_poll.sh` → `build_live_sheets.py`.
- `screen-backups-crowd/` — versiones CON público de las escenas (backup de Rafael, no se despliegan).

## Ajustes finos posibles (si Rafael los pide)
- Velocidad de giro: `turn` = 3–4.6 dir/s. Reposo entre gestos: 1.5–3s. Giro rotR/rotL = 180° (4 unidades).
- Probabilidad de estados: hoy los 6 son uniformes (festejo podría hacerse más raro).
- Composición: `Fy=52`, clamp `y≥63`, clamp trapezoidal semiancho 24%→44%.

## Pendientes del proyecto (fuera de ch5)
- **Contenido real:** `contact.js` vacío + `projects.js` stubs PENDING (input de Rafael).
- **Deploy Firebase (Phase 6):** aún falta; ya se aligeró ch5. Revisar bundle de fuentes + otros bg.
- Tests ch5: desactualizados por `showText=false`.
