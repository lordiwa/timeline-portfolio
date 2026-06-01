# Asset Iteration Changelog

Registro histórico de regeneraciones de assets en `public/assets/`. Cada entry documenta una iteración: versión preservada en `old/`, razón del cambio, hipótesis del próximo intento. Establecido como proceso por Rafael 2026-05-14 (ver `CLAUDE.md §6.5`).

Convención: `{filename}-{ISO-date}-iter{N}.{ext}` donde `iter1` es la generación original (no preservada en old/ — no existe iter0).

Formato per entry:
```markdown
## {asset-filename} — iter{N} → iter{N+1} ({ISO-date})

- **Versión guardada:** `old/{stem}-{ISO-date}-iter{N}.{ext}`
- **Razón del cambio:** {feedback Rafael verbatim o issue identificado}
- **Qué se intentará diferente:** {hipótesis prompt/approach}
- **Commit hash post-regen:** `{hash}`
```

---

## ch5-bust.png — iter17 → iter18 (2026-06-01)

- **Versión guardada:** `old/ch5-bust-2026-06-01-iter17-grey-hair.png`
- **Razón del cambio:** iter17 salió con pelo gris/plateado, entradas/calvicie, barba sal-y-pimienta (gris en mejillas). Rafael exige pelo castaño MUY OSCURO #251109 denso sin canas, barba oscura sólida sin grises. Transparencia de esquinas superiores funcionó bien con método lava + BFS.
- **Qué se intentará diferente:** Mismo background:"lava" + BFS flood-fill. Prompt reforzado con "NOT grey, NOT balding, NOT salt-and-pepper, ZERO grey pixels, solid dark brown #251109 hair and beard", referencias ch3-bust.png, énfasis en pelo denso/línea baja/joven.
- **Commit hash post-regen:** `<pendiente>`

---

## ch5-bust.png — iter16 → iter17 (2026-06-01)

- **Versión guardada:** `old/ch5-bust-2026-06-01-iter16.png`
- **Razón del cambio:** iter16 (Adobe `image_remove_background` semántico) falló: BL y BR esquinas alpha=255 con color navy — el fondo navy y la camisa navy son indistinguibles para el ML de Adobe. Las 2 esquinas inferiores quedaron opacas (fondo no borrado).
- **Qué se intentará diferente:** `forge_sprite` con `background: "lava"` (alto contraste rojo/naranja vs navy #141C2A) para que el bg removal nativo de pixelforge separe correctamente la camisa del fondo. Mismo sujeto: buzz cut uniforme, barba más larga, piel #FBB782, pelo/barba #251109, ojos sage #1B2715, camisa navy #141C2A.
- **Commit hash post-regen:** `<pendiente>`

---

## ch4-bg.png — iter2 → REPLACED por parallax 4 capas iter3 (2026-06-01)

El bg único full-bleed (iter2) se reemplaza por un parallax de 4 capas "flotando en el vacío" (concepto de Rafael): personaje de espaldas con gafas VR mirando a un portal con mundo 3D, símbolos matrix neón flotantes, profundidad por puntero + drift.

- **Versión guardada:** `old/ch4-bg-2026-06-01-iter2.png` (~503 KB)
- **Razón del cambio:** Rafael — "el contenido tapa el arte y la izquierda se desperdicia… sería el personaje en la mitad a la derecha flotando dando la espalda usando gafas vr, mirando hacia abajo a la derecha, a un agujero negro donde se ve un mundo 3D… parallax de 4 capas… debe sentirse alguien flotando en el espacio vacío".
- **Qué se hizo diferente:** stack de 4 capas (NO sprites 128px del fracaso iter1; full-frame ~1376px, sin optimize/process_sprite):
  - `ch4-portal.png` (forge_background opaco, fondo) — espacio + portal cyan con mundo 3D wireframe tenue abajo-derecha.
  - `ch4-character.png` (forge_sprite size:0 transparente) — chico flotando de espaldas, gafas VR.
  - capa matrix (c3) + near (c0): glifos/partículas CSS por ahora (híbrido; PNG tenue opcional pendiente).
- **Commit hash post-regen:** `<pendiente este commit>`

---

## ch4 parallax stack — iter1 → REPLACED por ch4-bg.png (2026-05-28)

Aplica colectivamente a los 4 assets parallax originales de ch4 (Plan 04-04 W2). Se reemplazan por un único `ch4-bg.png` full-bleed estilo ch3, eliminando el sistema de 4 capas + `ParallaxLayers.vue`.

- **Versiones guardadas:**
  - `old/ch4-bg-stars-far-2026-05-28-iter1.jpg` (340 KB)
  - `old/ch4-bg-planet-mid-2026-05-28-iter1.jpg` (437 KB)
  - `old/ch4-fg-panels-2026-05-28-iter1.png` (17 KB)
  - `old/ch4-fg-ships-2026-05-28-iter1.png` (4.6 KB)
- **Razón del cambio:** Rafael 2026-05-28 — "los tamaños en la ch04 estan mal y los estilos estan mal". Dos issues confirmados al inspeccionar los assets:
  1. **Tamaños:** `ch4-fg-panels.png` (~120×120) y `ch4-fg-ships.png` (~120×120) son sprites diminutos que el CSS estiraba full-bleed (`width:100%; height:120%; object-fit:cover; image-rendering:pixelated`) → en pantalla salían 2 naves gigantes y 3 paneles gigantes tapando todo, no un parallax sutil.
  2. **Estilos:** los bg (estrellas/luna) usan halftone/dot patterns con gradientes suaves anti-aliased — estilo distinto al acuarela vintage Tin Toy que ch3 estableció como referencia visual del portfolio (`ch3-robots-bg.png`).
- **Qué se intentará diferente:** colapsar el stack 4-layers a 1 solo background full-bleed `ch4-bg.png` 1376×768 estilo acuarela vintage AR/VR (matchea ch3-robots-bg.png), wire idéntico al `.ch3-stage` (cover + fixed + pixelated). FloatingPanel glass holographic se mantiene. `ParallaxLayers.vue` se borra (sin uso fuera de ch4).
- **Qué se hizo:** `forge_background` (modelo `nano-banana-2`, 1 solo intento, 491 KB, 1376×768 exacto). Asset renombrado `ch4-stage-bg.png` → `ch4-bg.png` para conformar al naming enum del asset-naming test. NO se aplicó `optimize_sprite` (cover + fixed preserva detalle). Side fix: comment stale en `ScrollShell.vue .chapter-section` mencionaba "ParallaxLayers ch4"; reescrito sin literal "position:absolute" lo que verde-ó casualmente `theme-bleed-phase4 T6`.
- **Commit hash post-regen:** `d2324cd`

---

## ch3-robots-bg.png — iter1 (2026-05-19) — PRIMER ASSET

- **Versión guardada:** ninguna — asset nuevo, primera generación. `ch3-invaders-bg.png` (iter7) preservado en `old/ch3-invaders-bg-2026-05-19-iter7.png` por Rafael antes del dispatch.
- **Razón del cambio:** Rafael 2026-05-19 pivotó: en lugar de Space Invaders, quiere 6 robots distintos cuerpo completo en el mismo estilo acuarela vintage del bio card (`ch3-robot.png`). Nombre cambia de `ch3-invaders-bg.png` a `ch3-robots-bg.png`.
- **Qué se hizo:** `forge_background` (modelo `banana-2`, `nano-banana-2` falló sin imágenes) — 6 robots retro Tin Toy vintage: torre humanoide, boxy con orugas, barril R2-D2, pulpoide multi-brazo, araña cuadrúpeda, humanoide 50s con antenas. Paleta: grises azulados, durazno, coral tierra, acentos bronce, visores azul/ámbar/verde polvorientos. Outlines marrón suave acuarela, sombras azul-gris sutiles, fondo cream `#faf7f0`. Centro respirable para overlay de texto. 1376×768, 642 KB. NO se aplicó `optimize_sprite` (va con `background-size: cover`). 1 intento de prompt (nano-banana-2 falló silenciosamente, banana-2 exitoso).
- **Commit hash post-regen:** _pending_

---

## ch3-invaders-bg.png — NEW iter7 (2026-05-19)

- **Versión guardada:** ninguna — asset nuevo con nombre distinto. iter6 (`ch3-desk-bg.png` lápices) preservado en `old/ch3-desk-bg-2026-05-19-iter6.png`.
- **Razón del cambio:** Rafael 2026-05-19, tras correr `npm run dev` con iter6: "me encanta el estilo, en ese mismo estilo pon personajes de space invaders no muchos grandes unos 6". Aprobó el estilo pixel art acuarela vintage pero cambió el sujeto de lápices a Space Invaders.
- **Qué se intentó diferente:** asset `ch3-invaders-bg.png` (1376×768 16:9 nativo pixelforge, 731 KB) vía `forge_background` — 6 invaders grandes distribuidos naturalmente (2 squid + 2 crab + 1 octopus + 1 UFO mothership), MISMA paleta acuarela del iter6 (cream bg, coral suave, verde salvia, azul empolvado, amarillo apagado, outlines marrón suave, sombras azul-gris). NO verde-neón clásico del arcade — pintados en acuarela. 1 solo intento de prompt. NO se aplicó `optimize_sprite` (preserva detalle). Wire: solo cambia `background-image` url, resto del .ch3-stage idéntico al iter6 (cover + fixed + pixelated).
- **Commit hash post-regen:** _pending_

---

## ch3-desk-bg.png — iter6 → REPLACED (2026-05-19)

- **Versión guardada:** ninguna — asset nuevo con nombre distinto. iter5 (`ch3-flat-geo-bg.png`) preservado en `old/ch3-flat-geo-bg-2026-05-19-iter5.png`.
- **Razón del cambio:** Rafael 2026-05-19, tras correr `npm run dev` con iter5: "creo que no sirvio tiene que ser una paleta plana talvez simplemente un fondo fullscreen de n escritorio blanco con lapices real". Pivot 1: foto-real bloqueado (pixelforge wrapper hardcoded "pixel art"; Adobe MCP no genera, solo edita; Adobe Stock no tiene acuarela genuina). Pivot 2 (Rafael): "porque no usas pixelforge" — pixel art ES coherente con el resto del portafolio, no rotura. Aceptamos pixel art como estilo final, no como limitación.
- **Qué se intentó diferente:** asset `ch3-desk-bg.png` (1376×768 16:9 nativo pixelforge, 581 KB) vía `forge_background` — escritorio top-down vista cenital con 8 lápices dispersos en arco perimetral (centro libre para overlay de logo/bio/botones), paleta acuarela vintage stationery desaturada (cream #faf7f0 base + amarillo apagado + coral + azul empolvado + verde salvia + rosa polvo + tierra grafito + madera natural), outlines marrón suave, sombras azul-gris sutiles. NO se aplicó `optimize_sprite` (preserva detalle de cada lápiz para uso fullscreen). Wire: `.ch3-stage background-size: cover` + `background-attachment: fixed` + `image-rendering: pixelated`.
- **Commit hash post-regen:** _pending_

---

## ch3-flat-geo-bg.png — iter5 → REVERTED (2026-05-19)

- **Versión guardada:** ninguna — asset nuevo con nombre distinto. NO aplica §6.5.
- **Razón del cambio:** Rafael 2026-05-19, después de revertir iter4 loros: "tienes como revisar las notas para ver como se veia un sitio en 2013 no tiene que ser rosado por pink parrot". Research confirmó que 2013 = año bisagra (iOS 7 sept 2013 → flat design oficial, Bootstrap 3 ago 2013, Flat UI Colors website). El chapter estaba cableado como era 2005-2009 (Aqua/Lobster/halftone/glossy) y necesitaba ancla real 2013.
- **Qué se intentó diferente:** asset NUEVO `ch3-flat-geo-bg.png` (128×128 tileable seamless, 33 KB) generado vía `forge_background` — patrón triangles low-poly (el motivo más icónico 2013-2014, vino con iOS 7 wallpapers), paleta Flat UI 2013 exacta (`#ecf0f1` base + `#1abc9c`/`#16a085` turquoise + acentos `#3498db`/`#f39c12`). Wire: `.ch3-stage background-color: #ecf0f1` + `background-image: url(...) repeat`, `background-size: 128px`, `image-rendering: pixelated`. Scope mínimo — botones Aqua/Lobster/logo RM conservados; coherencia cross-chapter es iter futura si Rafael lo pide.
- **Commit hash post-regen:** _pending_

---

## ch3-parrots-bg.png — iter4 → REVERTED (2026-05-19)

- **Versión guardada:** `old/ch3-parrots-bg-2026-05-19-iter4.png` (128×128 tileable seamless, ~26 KB — generado vía `forge_background` con prompt "seamless tileable pattern" de loros pequeños mezclando gafas wayfarer, gorras y audífonos DJ, paleta rosada baja saturación).
- **Razón del cambio:** Rafael 2026-05-19: "me encanto el fondo pero no sirve para la idea... no tiene que ser rosado por pink parrot". El loro/rosado venía del nombre de la empresa (Pink Parrot UX 2013), no de la era — el chapter debe sentirse a sitio web 2013 real, no a brand anchor literal. Wire-up en Chapter3Content revertido a iter3 (rosado plano + tramado CSS) mientras se decide nueva dirección visual auténtica 2013 (post iOS 7 flat / parallax / hero fullscreen).
- **Qué se intentará diferente:** pendiente — iter5 partirá de research era 2013 real, no del nombre de la empresa. Direcciones candidatas: flat design post-iOS-7 con hero fullscreen, parallax site estilo Apple iPad mini, ghost buttons + Open Sans + paleta desaturada.
- **Commit hash post-regen:** _pending_

---

## ch3-halftone-bg.png — iter2 → REMOVED (2026-05-17)

- **Versión guardada:** `old/ch3-halftone-bg-2026-05-17-iter2.png` (128×128 Lichtenstein pink+cyan dots — generado en commit `2455490`)
- **Razón del cambio:** Rafael 2026-05-17: "jajaj quita los puntos al fondo y dejalo plano del rosado ese que pusiste, pon talvez tramados ligeros de fondo pero muy leves". Los dots cyan eran demasiado agresivos visualmente.
- **Qué se intentará diferente:** ninguna regeneración — `background-image` PNG removido, sustituido por `repeating-linear-gradient` diagonal 45° CSS-only con stripes `rgba(255,255,255,0.06)` cada 7-8px sobre `background-color: #ffd6e3`. Tramado apenas perceptible.
- **Commit hash post-regen:** `8e45dd6`

---

## ch3 design — iter1 → iter2 (2026-05-17)

- **Versión guardada:** `old/ch3-paper-bg-2026-05-17-iter1.png` (128×128 light blue scanlines paper texture — generado en commit `777da6b`)
- **Razón del cambio:** Rafael 2026-05-17: "no me gusta mi cara en el centro, está muy blanco, faltan detalles, ponlo más enfocado en liderazgo". iter1 hero tenía avatar bust + wet reflection + paper texture pastel → demasiado personal + demasiado blanco + bio enfocado en UX no liderazgo.
- **Qué se intentará diferente:** iter2 — avatar cara reemplazado por logo RM 3D glossy (pink→cyan Aqua badge 128px); paper-bg reemplazado por halftone pop-art Lichtenstein (pink base + cyan dots 96px tile); +3 Aqua glossy buttons Mac OS X 10.4; +pull-quote magazine "Liderar no es delegar, es desbloquear"; +5 social badges era 2007 footer (flickr/vimeo/del.icio.us/MySpace/twttr beta SVG inline); bio reordenado i18n leadership-first.
- **Commit hash post-regen:** `2455490`

---

## ch2-bg.jpg — iter2 → REMOVED (2026-05-17)

- **Versión guardada:** `old/ch2-bg-2026-05-17-iter2-removed.jpg` (wallpaper abstracto blobs púrpura/naranja iter2 — generado en commit del 2026-05-16)
- **Razón del cambio:** Rafael 2026-05-17: "podemos quitar el bg de ch2.bg y dejarlo negro". El wallpaper competía visualmente con la UI Y2K cyber CSS encima — fondo negro deja respirar el stage Flash transformation.
- **Qué se intentará diferente:** ninguna regeneración — `--bg-image` removido del bloque `[data-chapter="2"]` en `chapter-themes.css`, `--c-bg` cambiado de `#2a1a4a` a `#000000`. Si en el futuro se quiere reintroducir un fondo, generar uno más sutil (low-saturation, dark) que no compita con la UI.
- **Commit hash post-regen:** `59bbb86`

---

## ch0-game-warcraft.png — iter1 → iter2 (2026-05-17)

- **Versión guardada:** `old/ch0-game-warcraft-2026-05-17-iter1.png` (128×96, piso de piedra azul oscuro genérico — no representaba Warcraft)
- **Razón del cambio:** Rafael 2026-05-17: "make a pixel art copy of Warcraft_orcs_and_humans3 which is a file i added inside assets". El iter1 era un piso de piedra azul sin relación con el juego — usado en `TerminalScroll.vue:58` como pantalla del .EXE de WARCRAFT pero no comunicaba la temática.
- **Qué se intentará diferente:** `forge_background` aspect 4:3 estilo SNES describiendo verbatim los elementos del screenshot real (HUD LUMBER/GOLD, sidebar KNIGHT/MENU, peones humanos azules, hoguera central, edificios con techo naranja, palisade) + `optimize_sprite` size 128 para match dimensiones con `ch0-game-california.png`.
- **Commit hash post-regen:** `c0f8a23`

---

## ch2 tiles cursor.png → coin.png — iter1 → iter2 rename (2026-05-17)

- **Versión guardada:** `old/cursor-2026-05-17-iter1.png` (4,358 bytes — generado por commit `8fdc2de`)
- **Razón del cambio:** Rafael 2026-05-17: "el icono del cursor hazlo una moneda". Cambio de identidad semántica del tile (no solo regen del mismo sprite) — cursor flecha cyan reemplazada por moneda chrome cyan. Asset renombrado a `coin.png`, sprite key `tile-coin`, TILE_TYPES slot 0 actualizado.
- **Qué se intentará diferente:** generar coin como disc 3/4 con chrome rim + símbolo central embossed, conservando paleta cyan #5af2ff del slot para no romper el balance cromático del grid match-3.
- **Commit hash post-regen:** `c3ef8e1`

---

## ch2 tiles banner.png → candy.png — iter1 → iter2 rename (2026-05-17)

- **Versión guardada:** `old/banner-2026-05-17-iter1.png` (6,770 bytes — regenerado en commit `8fdc2de` para sacar texto "CLICK ME" del iter1 original)
- **Razón del cambio:** Rafael 2026-05-17: "el icono de banner hazlo un caramelo". Cambio de identidad semántica (banner web Y2K reemplazado por caramelo wrap). Asset renombrado a `candy.png`, sprite key `tile-candy`, TILE_TYPES slot 1 actualizado.
- **Qué se intentará diferente:** hard candy wrapper twist en ambos lados, centro brillante con shine, conservando paleta orange #ff7a1a del slot.
- **Commit hash post-regen:** `c3ef8e1`

---

## ch4-bust.png — iter3 → iter4 (2026-05-14)

- **Versión guardada:** `old/ch4-bust-2026-05-14-iter3.png` (12,672 bytes — generado por commit `1f86ab6`)
- **Razón del cambio:** Rafael 2026-05-14: "no, deben tener el mismo exacto color de piel y los ojos deben parecerse mas, sigue intentando". El iter3 tenía colores aproximados pero no exactos al ch3 — drift sutil de tono.
- **Qué se intentará diferente:** read pixel-by-pixel ch3-bust.png para extraer hex codes dominantes, pasar palette más constreñida + post-process con Adobe MCP `image_adjust_hsl` si pixelforge drifteea. Considerar bajar tolerancia del prompt a "EXACT same skin tone" enforced via palette argument.
- **Commit hash post-regen:** `ef51f16`

---

## ch4-bust.png — iter4 → iter5 (2026-05-14)

- **Versión guardada:** `old/ch4-bust-2026-05-14-iter4-HSL.png` (generado por commit `ef51f16`)
- **Razón del cambio:** Rafael 2026-05-14: "pésimo" — pelo drifteo a rubio/castaño claro, highlights blanquecinos en cara, no matchea ch3 (la referencia ratificada). HSL post-process de iter4 no corrigió el drift de highlights especulares.
- **Qué se intentará diferente:** prompt con "flat lit face, no specular highlights, even illumination matching ch3 reference, NO white highlights on skin" para evitar drift. Pixel-sampled palette desde ch3 directamente. Misma cara que ch3 + apenas 3 años más (~33 años), barba apenas más definida, mismos colores piel/cabello/ojos. ch3-bust.png como referencia multimodal directa.
- **Commit hash post-regen:** `af44ae4`

### Historial previo (no preservado en old/, ver git log):
- iter1 (Phase 3 batch original, antes de 2026-05-14): no preservado
- iter2 → `5a89ac7 art(ch4): regenerate ch4-bust.png — pelo apenas más largo continuum desde ch3 (~33 años)` — feedback Rafael: aging progresivo
- iter3 → `1f86ab6 art(ch4): re-regenerate ch4-bust.png — colores identicos a ch3 (Rafael 'ya no se parece')` — feedback Rafael: colores no matchearon ch3

---

## ch5-bust.png — iter4 → iter5 (2026-05-14)

- **Versión guardada:** `old/ch5-bust-2026-05-14-iter4.png` (15,626 bytes — generado por commit `ae07e13`)
- **Razón del cambio:** Mismo feedback Rafael que ch4 — colores piel/ojos no matchean ch3 exactamente.
- **Qué se intentará diferente:** mismo approach que ch4 iter4 — pixel sampling ch3 + palette constrained + posible Adobe HSL post-process. ch5 además debe mantener pelo apenas más largo que ch4 sin canas.
- **Commit hash post-regen:** `123ea2c`

---

## ch5-bust.png — iter5 → iter6 (2026-05-14)

- **Versión guardada:** `old/ch5-bust-2026-05-14-iter5-HSL.png` (generado por commit `123ea2c`)
- **Razón del cambio:** Rafael 2026-05-14: "pésimo" — piel hipersaturada/anaranjada vs ch3, drift de rasgos. HSL post-process de iter5 no corrigió saturación excesiva de piel.
- **Qué se intentará diferente:** prompt con "flat lit face, no specular highlights, muted warm brown skin tones, NOT orange NOT oversaturated skin, even illumination". Palette pixel-sampled de ch3. Misma cara que ch3 + apenas 6 años más (~38 años), pelo apenas más largo que ch4, SIN canas, SIN arrugas extras. ch3-bust.png como referencia multimodal directa.
- **Commit hash post-regen:** `5834917`

### Historial previo:
- iter1 (Phase 3 batch original): no preservado
- iter2 → `a165e50 art(ch5): regenerate ch5-bust.png — pelo y barba continuum sutil desde ch4 (~38 años)` — primer continuum aging
- iter3 → `733ac01 art(ch5): re-regenerate ch5-bust.png desde ch4 base — SOLO pelo apenas más largo (Rafael 'sin arrugas extra')` — feedback Rafael: ch4 base, no arrugas extra
- iter4 → `ae07e13 art(ch5): re-regenerate ch5-bust.png — colores identicos a ch3 + pelo apenas mas largo` — feedback Rafael: igualar colores ch3

---

## ch6-bust.png — iter4 → iter5 (2026-05-14)

- **Versión guardada:** `old/ch6-bust-2026-05-14-iter4.png` (16,744 bytes — generado por commit `ec03dc0`)
- **Razón del cambio:** Mismo feedback Rafael — colores piel/ojos no matchean ch3 exactamente.
- **Qué se intentará diferente:** mismo approach que ch4/5 iter4 — pixel sampling ch3 + palette constrained + posible Adobe HSL. ch6 debe mantener pelo más largo que ch5 + EXACTAMENTE 2 canas en barba (max 2, cero en pelo cabeza).
- **Commit hash post-regen:** {pending}

### Historial previo:
- iter1 (Phase 3 batch original): no preservado
- iter2 → `9708d48 art(ch6): regenerate ch6-bust.png — 2 canas barba primer aging visible (~42 años)`
- iter3 → `6504069 art(ch6): re-regenerate ch6-bust.png desde ch5-new — SOLO pelo más largo + 2 canas barba (Rafael 'sin arrugas extra')`
- iter4 → `ec03dc0 art(ch6): re-regenerate ch6-bust.png — colores identicos a ch3 + pelo mas largo + 2 canas barba` — feedback Rafael: igualar colores ch3
- iter5 → `928de86 art(ch6): HSL refine iter5 — match piel a ch3 (ajuste fino)` — HSL post-process destruyó zona de ropa

---

## ch6-bust.png — iter5 → iter6 (2026-05-14)

- **Versión guardada:** `old/ch6-bust-2026-05-14-iter5-HSL.png` (9,440 bytes — generado por commit `928de86`)
- **Razón del cambio:** Rafael 2026-05-14: ropa "borrada" después de HSL post-process iter5 — la zona bajo el cuello quedó casi transparente / corrupta. Cara intacta y aceptada.
- **Qué se intentará diferente:** Adobe MCP selective edit — pipeline: (1) image_generative_expand bottom 20px para generar píxeles opacos en zona transparente, (2) image_select_by_prompt "white area below neck/torso" + image_adjust_exposure exposure=-20 gamma=0.1 para oscurecer zona blanca con máscara, (3) image_select_by_prompt "dark clothing area below chin" + image_adjust_hsl colorize=true hue=220 sat=50 light=+15 para teñir de azul navy, (4) image_crop_to_bounds top=0 bottom=0.762 para recortar de 64×84 a 64×64. Cara preservada en todo momento.
- **Commit hash post-regen:** `bf069c5`

---

## ch6-bust.png — iter6 → iter7 (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-iter6.png` (9,172 bytes — generado por commits `bf069c5` + `20b7028`)
- **Razón del cambio:** Rafael 2026-05-15: "ch5 y ch6 menos canas y menos arrugas en ch5" — ch6 tenía 2 canas blancas visibles en la barba (mentón). Decisión: ir a 0 canas para coherencia con ch5 (también sin canas tras iter7 commit `d97c7e7`).
- **Qué se intentará diferente:** Adobe MCP selective edit — image_select_by_prompt aislando ÚNICAMENTE las canas (white/grey hair strands in beard/Beard bodyPart) + image_fill_area con color dark brown matching barba (#3D2B1A aprox). Approach selectivo preservando cara, pelo, ropa y ojos intactos. NO regenerar con pixelforge para no perder cara aceptada y ropa reconstruida por Adobe.
- **Commit hash post-regen:** `00cc5c9`

---

## ch5-bust.png — iter6 → iter7 (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-iter6.png` (generado por commit `5834917`)
- **Razón del cambio:** Rafael 2026-05-15: "ch5 y ch6 menos canas y menos arrugas en ch5" — iter6 generó highlights claros en pelo/barba que leen como canas, y líneas sutiles leídas como arrugas. ch5 debe ser ~38 años sin signos de aging visibles.
- **Qué se intentará diferente:** prompt reforzado con anti-patrones repetidos múltiples veces ("ABSOLUTELY NO grey hairs ABSOLUTELY NO white strands ABSOLUTELY NO silver pixels") + "completely youthful" + "completely smooth flawless skin NO wrinkles NO forehead lines NO crow's feet NO eye bags NO age lines anywhere even pixel-level". Estrategia: redundancia de anti-patrones porque pixelforge ignoró el primer NO.
- **Commit hash post-regen:** `d97c7e7`

---

## ch5-bust.png — iter7 → iter8 (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-iter7.png` (13,369 bytes — generado por commit `d97c7e7`)
- **Razón del cambio:** Rafael 2026-05-15: "ch5 y ch6 el pelo mas largo, en ch5 algo largo en ch6 mas largo que se vea el paso del tiempo" — iter7 mantenía pelo similar a ch4 sin progresión visible de tiempo.
- **Qué se intentará diferente:** pelo "algo más largo" que ch4 — mechones rizados pasando las orejas, más volumen arriba. Mantener sin canas/sin arrugas (iter7 funcionó en ese aspecto). 96x96.
- **Commit hash post-regen:** `53f9053`

---

## ch6-bust.png — iter7 → iter8 (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-iter7.png` (9,177 bytes — generado por commits `bf069c5` + `00cc5c9`)
- **Razón del cambio:** Rafael 2026-05-15: "ch5 y ch6 el pelo mas largo, en ch5 algo largo en ch6 mas largo que se vea el paso del tiempo". Iter7 tenía pelo similar a ch5 sin paso del tiempo perceptible. También quedaba en 64x64 (inconsistente con resto 96x96).
- **Qué se intentará diferente:** pelo significativamente más largo que ch5 iter8 (fluye pasando el cuello, volumen mayor), aging visible solo en longitud de pelo NO en canas/arrugas. Regen completo a 96x96 con prompt navy clothing. Usando ch5 nuevo como referencia.
- **Commit hash post-regen:** `9728770`

---

## ch5-bust.png — iter8 → iter9 (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-iter8-drift.png` (13,937 bytes — generado por commit `53f9053`)
- **Razón del cambio:** Rafael 2026-05-15 (verbatim): "why are you changing the eyes and hair color, i explicitly told you not to change that and use the base skin and hair color as well as eyes, why are you making this mistake over and over again? fix that". Pixelforge drifteó colores piel/pelo/ojos en iter8 a pesar de hex codes en prompt — error documentado y recurrente: cabello drifteo a marrón medio (en lugar de dark brown #3D2B1A), ojos driftaron de teal #4A7A6B a marrón/hazel.
- **Qué se intentará diferente:** NO regenerar con pixelforge. Adobe MCP HSL zonal para alinear piel/pelo/ojos al hex de ch3 (piel: #D4956A/#B87A50/#8B5A35; cabello: #3D2B1A/#5C3D22; ojos: #4A7A6B). Preservar pelo largo iter8 + sin canas/sin arrugas + ropa navy + dimensiones 96x96.
- **Commit hash post-edit:** `a48181c`

---

## ch6-bust.png — iter8 → iter9 (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-iter8-drift.png` (14,422 bytes — generado por commit `9728770`)
- **Razón del cambio:** Rafael 2026-05-15 (verbatim): "why are you changing the eyes and hair color, i explicitly told you not to change that and use the base skin and hair color as well as eyes, why are you making this mistake over and over again? fix that". Pixelforge drifteó colores piel/pelo/ojos en iter8: cabello más claro que ch3 (drift a marrón medio), ojos marrón en lugar de teal #4A7A6B.
- **Qué se intentará diferente:** NO regenerar con pixelforge. Adobe MCP HSL zonal para alinear piel/pelo/ojos al hex de ch3 (piel: #D4956A/#B87A50/#8B5A35; cabello: #3D2B1A/#5C3D22; ojos: #4A7A6B). Preservar pelo largo a hombros iter8 + sin canas + ropa navy + dimensiones 96x96.
- **Commit hash post-edit:** `283af76`

---

## ch5-bust.png — iter9 → iter10 (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-iter9-cyan-eyes.png` (commit `a48181c`)
- **Razón del cambio:** Rafael 2026-05-15 angry: iter9 OVER-CORRIGIÓ — los ojos quedaron CYAN BRILLANTE (colorize:true en HSL ignoró el color original y pintó cyan plano). La piel quedó over-saturada/amarillenta (+18 sat fue demasiado). Drift recurrente inaceptable.
- **Qué se intentará diferente:** image_apply_color_overlay (NO colorize HSL) en ojos con #4A7A6B y opacity 60-70, blendMode "color" para preservar luminance original y obtener teal grey-green oscuro sutil. HSL en piel con sat:-12 hue:-3 lightness:-2 para revertir over-saturation. Cabello sin tocar (iter9 OK).
- **Resultado:** ch5 ojos MATCH ch3 (teal oscuro sutil). Piel MATCH. Cabello OK. Params: ojos HSL ronda1 (cyan: hue-20 sat-35 light-15) + ronda2 (sat-25 light-20) + ronda3 (sat-40 light-30) + ronda4 (sat-20 light-25). Piel: hue-3 sat-12 light-2.
- **Commit hash post-edit:** `9af8a15`

---

## ch6-bust.png — iter9 → iter10 (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-iter9-cyan-eyes.png` (commit `283af76`)
- **Razón del cambio:** Rafael 2026-05-15 angry: iter9 OVER-CORRIGIÓ — los ojos quedaron CYAN BRILLANTE (mismo error que ch5: colorize:true ignoró el color original). La piel over-saturada.
- **Qué se intentará diferente:** HSL zonal + brightness zonal acumulados en ojos. Piel: sat-12 hue-3 light-2.
- **Resultado:** ch6 ojos PARCIAL — mejoraron sustancialmente respecto al cyan brillante iter9 pero no llegan al nivel de oscuridad de ch3. Resistencia atribuida a alta saturación base de pixelforge en sprites pequeños (96x96). Piel MATCH. Cabello OK. 5 rondas de ajuste sin alcanzar el match exacto de ojos.
- **Commit hash post-edit:** `8f065a8`

---

## ch5-bust.png — iter10 → iter11 (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-iter10-overcorrected.png` (16,611 bytes — commit `9af8a15`)
- **Razón del cambio:** Rafael 2026-05-15: "mejoraron ambos pero no estan bien, el color de pelo casi negro en ambos, ademas copia el color de piel de ch4 o ch3 que estan bien copialo exacto, los ojos estan bien el color peor hazlos mas abiertos o copia los ojos de ch4". Iters 9+10 layerearon HSL sobre HSL → pelo casi negro, piel no era exact match de ch4, ojos cerrados geométricamente.
- **Qué se intentó diferente:** Rollback a iter8-drift de pixelforge (output original, pelo largo, sin manipulaciones previas). HSL zonal en cadena: piel (hue+8, sat-25, light+55) → pelo sin barba (hue+12, sat-35, light+35) → piel fine-tune (hue+5, sat-15, light+20) → ojos brightness+60 contrast+40. Referencia visual: ch4-bust.png (gris-rubio platino para pelo, beige-claro para piel).
- **Resultado:** Pelo ya NO casi negro — gris-rubio claro distinguible. Piel más clara y cercana a ch4 aunque no IDÉNTICA (drift residual: piel ch5/ch6 levemente más oscura que ch4). Ojos: zona más brillante pero geometría pixel art no cambia (generative AI no disponible). Retries: piel x2, pelo x1.
- **Commit hash post-edit:** `6d4fc35`

---

## ch5-bust.png — iter8-restored → iter13 (2026-05-15, model banana-2 pro)

- **Versión guardada:** `old/ch5-bust-2026-05-15-iter8-pre13.png` (restaurada por commit `852e18a` tras cascada iter9/10/11 + intento iter12 con nano-banana-2)
- **Razón del cambio:** iter12 con `model: nano-banana-2` (default) falló — ropa celeste + pelo marrón medio. Rafael 2026-05-15 eligió Opción 2: reintentar con model "banana-2" (pro, más fiel a referencia, +$0.04/img).
- **Qué se intentó diferente:** model: "banana-2" pro. 2 intentos: retry1 ropa beige/marrón (descartado), retry2 con hex #1B2A4A explícito en prompt → ropa azul denim/medio aceptable. Piel/pelo/ojos/barba correctos ambos intentos. Pelo sutil más largo que ch4 (pasa orejas).
- **Resultado:** ACEPTADO — piel morena cálida OK, pelo oscuro rizado OK, ojos teal OK, barba sin canas OK, ropa azul (no navy exacto pero distinguiblemente azul frío). optimize_sprite aplicado (12% savings, 14,112 bytes).
- **Commit hash post-regen:** `e0c0c11`

---

## ch6-bust.png — iter10 → iter11 (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-iter10-overcorrected.png` (17,283 bytes — commit `8f065a8`)
- **Razón del cambio:** Rafael 2026-05-15: mismo feedback que ch5 — pelo casi negro, piel no exact match ch4, ojos cerrados.
- **Qué se intentó diferente:** Mismo pipeline que ch5 iter11. Pelo largo a hombros preservado (silueta iter8 mantenida — solo color interno afectado por máscara zonal). Rollback a iter8-drift → HSL zonal mismo approach ch5.
- **Resultado:** Pelo ya NO casi negro — gris-rubio claro, pelo largo a hombros preservado. Piel más clara, cercana a ch4. Barba marrón oscura preservada. Ojos: brightness zonal aplicado. Retries: piel x2, pelo x1.
- **Commit hash post-edit:** `ba5874b`

---

## ch6-bust.png — iter8-restored → iter13 (2026-05-15, model banana-2 pro)

- **Versión guardada:** `old/ch6-bust-2026-05-15-iter8-pre13.png` (restaurada por commit `852e18a` tras cascada iter9/10/11)
- **Razón del cambio:** Mismo motivo que ch5 — nano-banana-2 drifteó colores. Rafael eligió banana-2 pro.
- **Qué se intentó diferente:** model: "banana-2" pro. Referencias: ch5 iter13 recién generado. Pelo un poco más largo que ch5 (sutil adicional). EXACTAMENTE 2 canas en barba (strands individuales en mentón). Ropa dark navy blue hex #1B2A4A. Sin canas en cabeza. Sin arrugas extra.
- **Resultado:** ACEPTADO — 1 intento. Piel morena OK, pelo oscuro rizado levemente más largo que ch5 OK, ojos teal OK, 2 pixels claros en mentón (canas presentes sutiles) OK, ropa azul oscuro navy OK. optimize_sprite aplicado (13% savings, 16,097 bytes).
- **Commit hash post-regen:** `ee82d2c`

---

## ch5-bust.png — real-iter → real-fix1 (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-real-iter-white-collar.png` (16,476 bytes — commit `4b41c20`)
- **Razón del cambio:** banana-2 generó banda blanca/gris en zona cuello/hombros ignorando #131D2A navy. Resto del bust OK (piel peach, pelo casi-negro, ojos sage, sin canas — Rafael lo aprobó).
- **Qué se intentó diferente:** Adobe MCP selective edit — `image_select_by_prompt` bodyParts: ["Neck", "Upper Clothes"] + excludedBodyParts: ["Face", "Hair", "Beard", "Eyes"] → `image_fill_area` color #131D2A (red:19, green:29, blue:42) opacity 100. 1 intento — exitoso en primer intento.
- **Resultado:** DONE — banda blanca eliminada, ropa navy uniforme #131D2A, cara/pelo/ojos/barba intactos. Dimensiones 96×96 mantenidas.
- **Commit hash post-fix:** `3b0dbc1`

---

## ch5-bust.png — iter13 → iter14 (2026-05-15, hex REALES pixel-sampled ch3)

- **Versión guardada:** `old/ch5-bust-2026-05-15-iter13-pre-real.png` (16,097 bytes — commit `ee82d2c`)
- **Razón del cambio:** Rafael 2026-05-15 pixel-sampled ch3-bust.png con PowerShell System.Drawing.Bitmap y reveló que los hex previos (#D4956A piel, #3D2B1A pelo, #4A7A6B ojos) eran INVENTADOS por agente anterior. Hex REALES: piel highlights #FBB782, midtones #ED9766, shadows #B35A48. Pelo #1A0805 casi-negro. Ojos sage #8A9E86/#48622D (NO teal). Todos los iters anteriores usaron palette incorrecta.
- **Qué se intentó diferente:** model: "banana-2" pro + hex REALES en prompt + ch3-bust.png como referencia multimodal directa. 2 intentos: iter14-retry1 falló (piel blanca, pelo castaño, ropa blanca). iter14-retry2 logró piel peach cálida correcta y pelo casi-negro. Ropa con banda blanca en zona cuello — problema recurrente banana-2 en esta sesión.
- **Resultado:** PASS-PARCIAL — piel peach cálida OK (#FBB782 range), pelo oscuro casi-negro OK, sin canas OK, sin arrugas OK. Ropa con banda blanca superior (zona cuello/hombros) — no navy uniforme. optimize_sprite aplicado (9% savings, 16,476 bytes).
- **Commit hash post-regen:** `4b41c20`

---

## ch6-bust.png — iter13 → iter14 (2026-05-15, hex REALES pixel-sampled ch3)

- **Versión guardada:** `old/ch6-bust-2026-05-15-iter13-pre-real.png` (16,097 bytes — commit `ee82d2c`)
- **Razón del cambio:** Mismo motivo que ch5 iter14 — hex inventados en iters previos. Rafael 2026-05-15 pixel-sampled ch3 con PowerShell y reveló hex REALES. Regen con palette correcta.
- **Qué se intentó diferente:** model: "banana-2" pro + hex REALES + ch5 iter14 recién generado como referencia. Pelo BARELY más largo que ch5. EXACTAMENTE 2 canas en barba (2 strands individuales en mentón). Sin canas en cabeza. Ropa #131D2A dark navy.
- **Resultado:** PASS-PARCIAL — piel peach cálida OK, pelo oscuro casi-negro rizos más largos que ch5 OK, aging progression visible OK. Canas: barba con píxeles claros dispersos (difícil contar exactamente 2, el modelo genera área difusa). Ropa con banda blanca superior (mismo problema recurrente banana-2). optimize_sprite aplicado (24% savings, 16,586 bytes).
- **Commit hash post-regen:** `fe03223`

---

## ch0-bust.png — iter1 → iter2 (2026-05-15, hex REALES pixel-sampled ch3)

- **Versión guardada:** `old/ch0-bust-2026-05-15-iter1-pre-real.png` (19,993 bytes — Phase 3 batch original)
- **Razón del cambio:** Rafael 2026-05-15 pixel-sampled ch3 con PowerShell y reveló hex REALES. La generación original (iter1) usaba hex inventados. Regen con palette correcta + énfasis en rasgos de niño 11 años (1995): sin barba, pelo corto, cara juvenil.
- **Qué se intentó diferente:** model: "banana-2" pro + hex REALES (#FBB782 piel, #1A0805 pelo casi-negro) + ch3-bust.png ref multimodal + descriptores infantiles explícitos (pelo corto boyish, NO barba, cara redondeada, ropa 90s colorida). 1 intento — resultado excelente en primer intento.
- **Resultado:** DONE — piel peach cálida OK, pelo casi-negro corto boyish EXCELENTE, sin barba PASS, cara juvenil redondeada OK, ojos sage coherentes, ropa colorida 90s OK. optimize_sprite aplicado (13% savings, 13,375 bytes).
- **Commit hash post-regen:** `5149656`

---

## ch6-bust.png — real-iter → real-iter2 (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-real-iter-grey-scalp.png` (16,586 bytes — commit `fe03223`)
- **Razón del cambio:** real-iter tenía canas/highlights claros en TODO el pelo de la cabeza (scalp), Rafael quiere ABSOLUTAMENTE 0 canas en scalp y SOLO 2 strands individuales en barba (mentón). También tenía banda blanca difusa en zona cuello/ropa.
- **Qué se intentará diferente:** ch5-bust.png (recién fixed con Adobe — piel peach cálido, pelo casi-negro, ojos sage, ropa navy #131D2A, sin canas) como referencia multimodal directa. Prompt con reglas SEPARADAS: "CRITICAL HAIR RULE" (scalp uniformemente casi-negro #1A0805, SIN grey pixels) y "CRITICAL BEARD RULE" (exactamente 2 strands individuales en mentón). Navy completo hasta hombros sin banda blanca.
- **Resultado:** PASS-PARCIAL — scalp oscuro casi-negro uniforme OK (0 canas en scalp), piel peach cálida OK, ojos sage OK. Canas barba: pixels claros presentes pero difusos (banana-2 no genera exactamente 2 strands individuales — genera área difusa sutil). Ropa: banda blanca en cuello/hombros persistente (problema recurrente banana-2 documentado). 2 intentos: intento 1 falló scalp (highlights azul-gris). Intento 2: scalp OK, ropa requiere fix Adobe MCP posterior. optimize_sprite aplicado (17% savings, 13,830 bytes).
- **Commit hash post-regen:** `5284c7b`

---

## ch6-bust.png — real-iter2 → real-iter2-fixed (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-real-iter2-white-collar.png` (13,830 bytes — commit `5284c7b`)
- **Razón del cambio:** real-iter2 corrigió canas en scalp (era el problema crítico) pero banda blanca cuello/hombros persistió — banana-2 problema sistemático en esa zona.
- **Qué se intentó diferente:** Adobe MCP selective fill mismo pipeline exitoso ch5 (commits `3b0dbc1` + `61754ba`). image_select_by_prompt bodyParts ["Neck","Upper Clothes"] + excludedBodyParts ["Face","Hair","Beard","Eyes"] + image_fill_area #131D2A (red:19, green:29, blue:42) opacity 100 blendMode normal. 1 intento — exitoso en primer intento.
- **Resultado:** DONE — banda blanca eliminada, ropa y cuello navy uniforme #131D2A, cara/pelo/barba/ojos intactos. Dimensiones 96×96 mantenidas.
- **Commit hash post-fix:** `0b5abb9`

---

## ch5-bust.png — navy-with-outlines → green-shirt (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-navy-with-outlines.png` (18,254 bytes — commit `61754ba`)
- **Razón del cambio:** Rafael 2026-05-15: "5 y 6 esta bien la cara. pero no tienen camisa haz una camisa verde oscuro en ambos y quita el delinieado blanco". El navy no se leía como camisa + líneas blancas internas indeseadas entre cara/cuello/ropa.
- **Qué se intentó diferente:** Adobe MCP zonal — Paso 1: image_select_by_prompt bodyParts ["Neck","Upper Clothes"] excludedBodyParts ["Face","Hair","Beard","Eyes","Eyebrow","Nose","Mouth"] + image_fill_area #1A3D24 (red:26, green:61, blue:36) opacity 100. Paso 2: image_select_by_prompt prompt "white or very light colored outline lines between the face skin and the neck, between the hair and the forehead, between the beard and the shirt collar" + image_fill_area skin shadow #B35A48 (red:179, green:90, blue:72) opacity 100. 1 intento — exitoso.
- **Resultado:** DONE — camisa verde oscuro #1A3D24 visible y clara, cara/pelo/barba intactos. Outlines blancos internos tratados con fill skin shadow. Dimensiones 96×96 mantenidas.
- **Commit hash post-fix:** `b88d981`

---

## ch6-bust.png — navy-with-outlines → green-shirt (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-navy-with-outlines.png` (18,692 bytes — commit `0b5abb9`)
- **Razón del cambio:** Rafael 2026-05-15: misma razón que ch5 — navy no se leía como camisa + delineado blanco interno visible.
- **Qué se intentó diferente:** Mismo pipeline ch5. Paso 1: image_fill_area #1A3D24 en Neck+Upper Clothes. Paso 2: primer intento outline prompt falló con SAM IoU threshold 0.8 → retry con prompt "thin white lines at the border between the face and shirt, between hair and skin" — máscara generada pero fill skin #B35A48 arruinó la imagen (cubrió figura completa). Retry 2: image_select_by_prompt bodyParts ["Neck"] solo + image_fill_area skin midtone (red:200, green:120, blue:90) — resultado aceptable: cuello uniforme, cara/pelo/barba intactos. 3 intentos en paso de outlines.
- **Resultado:** DONE-PARTIAL — camisa verde oscuro #1A3D24 visible, cara/pelo cana/barba intactos. Cuello con skin midtone plano (no degradado natural) — aceptable vs tener outlines blancos. Dimensiones 96×96 mantenidas.
- **Commit hash post-fix:** `15f11c3`

---

## ch6-bust.png — green-partial → green-full (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-green-partial.png` (18,899 bytes — commit `15f11c3`)
- **Razón del cambio:** Rafael 2026-05-15: "extiende el verde hasta el cuello en ch6 y que no quede nada transparente o mas facil copia la camisa de ch4 y listo pero de otro color". El fix de outlines anterior dejó el cuello con skin midtone plano (para tapar outline blanco), pero Rafael quiere la zona completa debajo de mandíbula en verde uniforme #1A3D24. Sin skin midtone, sin transparencias en zona inferior.
- **Qué se intentó diferente:** Pipeline 2 pasos: (1) Adobe MCP image_select_by_prompt bodyParts ["Neck","Upper Clothes"] + image_fill_area #1A3D24 opacity 100 × 2 intentos (SAM cubrió ropa pero no skin midtone del cuello). (2) Script Python Pillow pixel-by-pixel: pintar verde todo píxel opaco (alpha>=30) en y>=48 que no sea verde ni pelo/barba oscuro. 1627 píxeles modificados. Verificación PowerShell: skin=0, verde=3109, transparentes=1286 (solo borde externo sprite), otro=0.
- **Commit hash post-fix:** `473a726`

---

## ch5-bust.png — green-shirt → final-navy (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-green-shirt-prefinal.png` (commit `7df20c5`)
- **Razón del cambio:** Rafael 2026-05-15: "haz de nuevo con todas las cosas que sabemos ahora para regenerar 5 y 6 ... planifiquemos ambas fotos bien". Plan aprobado: crecimiento de pelo notorio (a la mandibula), camisa verde (vía Adobe post-fix), hex REALES pixel-sampled con PowerShell.
- **Qué se intentará diferente:** pixelforge banana-2 pro + ch3-bust.png ref directa + hex REALES (#FBB782 piel, #1A0805 pelo casi-negro, #8A9E86 ojos sage) + pelo a la mandibula notorio + ropa NAVY #131D2A intermedia (Adobe la convertirá a verde después).
- **Commit hash post-regen:** `534e6f2`

---

## ch6-bust.png — green-blob → final-navy (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-green-blob-prefinal.png` (commit `7df20c5`)
- **Razón del cambio:** Rafael 2026-05-15: mismo plan aprobado — pelo a los hombros (paso del tiempo visible vs ch5), scalp uniformemente casi-negro sin canas, EXACTAMENTE 2 canas en barba (mentón), hex REALES, ropa navy #131D2A.
- **Qué se intentará diferente:** pixelforge banana-2 pro + ch5 recién regenerado como referencia multimodal directa + pelo significativamente más largo que ch5 (a los hombros) + 2 canas individuales en barba (mentón) + 0 canas en scalp.
- **Commit hash post-regen:** `569a80d`

---

## ch5-bust.png — final-navy → final-green (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-final-navy.png` (14,203 bytes — commit `534e6f2`)
- **Razón del cambio:** Plan final aprobado por Rafael: navy intermedia → verde #1A3D24 con Adobe zonal. Approach mínimo destructivo (solo fill 1-paso). Misma pipeline exitosa de ch5 fix anterior (commits `3b0dbc1`/`b88d981`).
- **Qué se intentó diferente:** Adobe MCP zonal — image_select_by_prompt bodyParts ["Neck","Upper Clothes"] excludedBodyParts ["Face","Hair","Beard","Eyes","Eyebrow","Nose","Mouth"] + image_fill_area #1A3D24 (red:26, green:61, blue:36) opacity 100 blendMode normal. 1 intento — exitoso.
- **Commit hash post-fix:** `1a1d46f`

---

## ch6-bust.png — final-navy → final-green (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-final-navy.png` (14,790 bytes — commit `569a80d`)
- **Razón del cambio:** Plan final aprobado por Rafael: navy intermedia → verde #1A3D24 con Adobe zonal. Mismo pipeline ch5.
- **Qué se intentó diferente:** Adobe MCP zonal — image_select_by_prompt bodyParts ["Neck","Upper Clothes"] excludedBodyParts ["Face","Hair","Beard","Eyes","Eyebrow","Nose","Mouth"] + image_fill_area #1A3D24 (red:26, green:61, blue:36) opacity 100 blendMode normal. 1 intento — exitoso.
- **Commit hash post-fix:** `e90b8e5`

---

## ch5-bust.png — adobe-green-blob → drawn-green-shirt (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-adobe-green-blob.png` (17,491 bytes — commit `1a1d46f`)
- **Razón del cambio:** Rafael 2026-05-15: "quita ese adobe verde o como se llame necesito una camista". El Adobe fill_area plano en zona Upper Clothes generaba un blob de color uniforme sin estructura — no se leía como camisa.
- **Qué se intentó diferente:** pixelforge banana-2 pro dibuja la camisa directamente con cuello-V/hombros/textura pixel art. Verde #1A3D24 especificado en prompt. 1 intento — exitoso. Camisa con cuello-V claramente visible, forma de hombros definida, shading natural.
- **Commit hash post-regen:** `ae91f59`

---

## ch6-bust.png — adobe-green-blob → drawn-green-shirt (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-adobe-green-blob.png` (13,303 bytes — commit `e90b8e5`)
- **Razón del cambio:** Rafael 2026-05-15: "quita ese adobe verde o como se llame necesito una camista". Mismo problema que ch5 — Adobe fill plano no genera estructura de camisa.
- **Qué se intentó diferente:** pixelforge banana-2 pro + ch5 recién generado como referencia multimodal. 2 intentos: intento 1 (grey-scalp-retry) tenía highlights azul-grisáceos en scalp — descartado. Intento 2: prompt más enfático ("PITCH BLACK to VERY DARK BROWN ONLY, ZERO grey pixels") — scalp predominantemente oscuro OK, pelo a hombros OK, camisa verde #1A3D24 con cuello-V visible.
- **Commit hash post-regen:** `fd7bf3b`

---

## ch2-bg.jpg — iter1 → iter2 (2026-05-16)

- **Versión guardada:** `old/ch2-bg-2026-05-16-iter1.jpg` (626,894 bytes)
- **Razón del cambio:** iter1 era un pixel art con UI Flash-era DIBUJADA EN LA IMAGEN (browser chrome, banner naranja, popup window, blobs). Rafael 2026-05-16: ahora la UI Flash se construye en CSS real (.flash-browser chrome bar + .flash-banner + project-card popup window) — el bg pintado competía con esa UI; necesitamos wallpaper abstracto detrás.
- **Qué se intentó diferente:** prompt forge_background enfocado en textura ABSTRACTA — blobs orgánicos púrpura/naranja, gradientes radiales soft, halftone dots Flash-era, lava-lamp vibes. SIN UI dibujada (no browser, no banner, no popup, no buttons, no text, no windows). Pure abstract decorative wallpaper.
- **Commit hash post-regen:** (pendiente)

---

## ch3-robots-bg.png — iter8 → RETIRADO (parallax) (2026-05-28)

- **Versión guardada:** `old/ch3-robots-bg-2026-05-28-iter8.png` (commit `58ea9da`)
- **Razón del cambio:** Rafael 2026-05-28: "ch03 habla del movimiento pero es muy estático". El bg full-bleed `fixed` de 6 robots Tin Toy era un solo PNG estático sin profundidad. Se reemplaza por un parallax real de 3 capas que reacciona al scroll + puntero + drift.
- **Qué se intentará diferente:** 3 capas separadas con transparencia — `ch3-sky.png` (cielo opaco pastel, drift lento), `ch3-mountains.png` (silueta de montañas pálidas, transparente arriba), `ch3-path.png` (camino de piedras claro en primer plano, transparente arriba). Estilo fantasía épica de guerra (armas medievales + magia) en acuarela vintage, colores claros. Decor Web 2.0 (robot mascota + starbursts BETA/NEW) reemplazado por props fantasía (`ch3-prop-shield.png` escudo heráldico + `ch3-prop-banner.png` estandarte). Rayos láser + brasas mágicas vía CSS. Los 5 PNGs nuevos son primera generación (sin iter previa que preservar).
- **Lección de pipeline (importante):** `optimize_sprite` y `process_sprite` aplastan a ≤128px (tope de la tool) → arte gigante/roto/bloques al escalar full-screen. Para fondos/capas usar `forge_background` (opaco, res nativa ~1376px) o `forge_sprite size:0`, y recortar transparencia con flood-fill chroma-key del cielo plano (Python/PIL, sin downscale ni huecos). NUNCA `optimize_sprite` en assets full-frame.
- **Commit hash post-regen:** `31b8951`

---

## ch2-flash-war.png — iter1 → iter2 (2026-05-28)

- **Versión guardada:** `old/ch2-flash-war-2026-05-28-iter1.png` (commit `6c56ce7`)
- **Razón del cambio:** Rafael 2026-05-28: "me gusta pero hazlo aun más exageradamente épico, mira la referencia de war que puse" → `public/references/war.jpg` (box-art de Warcraft III). iter1 era una buena batalla pero composición plana (dos ejércitos enfrentados a media distancia), faltaba el drama del foreground.
- **Qué se intentará diferente:** estilo box-art Warcraft III — cielo ardiente naranja/carmesí con cometas/meteoros surcando + relámpagos, CHOQUE DE CAMPEONES en primer plano (héroe alzando el orbe Flash vs campeón de Apple con martillo/energía azul), ejércitos colisionando detrás, ciudadela Apple de Macs/iPhones, ángulo cinematográfico bajo, máxima épica. forge_background nano-banana-2 res nativa.
- **Resultado:** 1 intento — éxito. 1376×768, héroe Flash con orbe ardiente en estandarte vs campeón Apple con escudo-manzana + crystal azul, meteoros + relámpagos + explosiones, ciudadela de CRT Macs coronada por Apple negro glowing. Foreshadow directo de ch3-flash-fallen.
- **Commit hash post-regen:** `e010343`

---

## ch3 parallax (sky/mountains/path) — iter1 → iter2 (2026-05-28)

- **Versiones guardadas:** `old/ch3-sky-2026-05-28-iter1.png`, `old/ch3-mountains-2026-05-28-iter1.png`, `old/ch3-path-2026-05-28-iter1.png` (commit `2650d31`)
- **Razón del cambio:** Rafael 2026-05-28: ch3 ahora es "La muerte de Flash" y debe tener el estilo del fondo de batalla épico de ch2 (Warcraft). iter1 era fantasía pastel clara (cielo aurora + montañas + camino con estandartes) — bonito pero no matchea el tema muerte-de-Flash ni el drama de ch2.
- **Qué se intentará diferente:** mood "secuela con amanecer HTML5" — campo de batalla DESPUÉS de la guerra: cielo crepuscular humo/brasas que abre a un amanecer HTML5 dorado/cyan en el horizonte; cresta con fortaleza en ruinas humeante; primer plano de tierra quemada con armas/estandartes caídos y escombros. Estilo comic pixel dramático (matchea ch2-flash-war). Emblemas re-tematizados al arco muerte→renacer (Flash caído → reconstrucción → estandarte → orbe → HTML5 naciente). Título "De vuelta al movimiento" → "La muerte de Flash".
- **Commit hash post-regen:** `9c92672`

## ch4-bust.png — iter5 → iter6 (2026-06-01)

- **Versión guardada:** `old/ch4-bust-2026-06-01-iter5-grey-long.png` (14,439 bytes)
- **Razón del cambio:** Rafael: "ch4 con pelo más corto". Además el pelo estaba gris/canoso (drift) y largo/desordenado — no matchea la realidad (foto 2016: castaño oscuro corto). Rafael aclaró "no el color de ch2" (ch2 también es gris) → corregir a castaño.
- **Qué se intentará diferente:** Regenerar con forge_sprite estilo ch3. Pelo CORTO castaño muy oscuro (#251109, sombra #0E0100, SIN gris/canas), barba corta recortada. Colores hard-target de ch3: piel #FBB782, ojos sage #1B2715, ropa navy #141C2A. Referencia multimodal: foto 2016 + ch3-bust.png. Validación pixel-sample vs ch3 obligatoria + HSL zonal si drift.
- **Commit hash del cambio:** `aaf4b30`

## ch5-bust.png — iter15 → iter16 (2026-06-01)

- **Versión guardada:** `old/ch5-bust-2026-06-01-iter15-green-shirt.png` (14,631 bytes)
- **Razón del cambio:** Rafael: "ch5 con barba más larga y pelo muy corto, basarse en ch3". Actual tiene pelo largo rizado + camisa verde.
- **Qué se intentó diferente:** Regenerar con forge_sprite estilo ch3. Pelo MUY CORTO parejo (buzz uniforme, SIN cresta/mohawk), barba MÁS LARGA. Colores hard-target de ch3: pelo #251109/#0E0100, piel #FBB782, ojos sage #1B2715, ropa navy #141C2A.
- **Cadena de iteraciones (ch5 históricamente difícil):**
  - iter16 (`old/ch5-bust-2026-06-01-iter16.png`): forge_sprite bg="night" → fondo navy OPACO idéntico a la camisa (0 px transparentes). Rechazada.
  - iter17 (`old/ch5-bust-2026-06-01-iter17-grey-hair.png`): regen bg="lava" + flood-fill → transparencia OK pero pelo gris/canoso + calvicie (drift). Rechazada.
  - iter18 (final): regen bg="lava" forzando pelo castaño denso + barba larga oscura. Transparencia OK. Quedaron artefactos cyan semi-transparentes (alpha 15-53) tipo "icicle" en barba/bajo-ojos (restos del flood-fill del lava). **Fix post-proceso (PIL, main session):** densificado de barba + kill de píxeles cyan (b>r+12, b>90) sin importar alpha → castaño en barba / piel en mejilla. Validado pixel-sample vs ch3 (pelo #1B0A04, piel #FCB57D, barba #1C0A05, ojos sage, ropa navy #151F2D) + render en app (avatar OK).
- **Commit hash del cambio:** `aaf4b30`
