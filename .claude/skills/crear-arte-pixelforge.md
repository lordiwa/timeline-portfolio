---
name: crear-arte-pixelforge
description: >
  Genera assets de pixel art usando pixelforge-mcp (nano-banana-2 / Gemini flash-image).
  Usar cuando se pida: crear fondo, generar sprite, crear capa de parallax, generar asset
  estático de pixel art, crear frame idle de personaje.
  NO usar para walk cycles ni spritesheets animados — ver skill editar-arte-adobe.
---

# Skill: Crear arte con pixelforge-mcp

## Pre-requisito: cargar schema (deferred tools)

SIEMPRE ejecutar esto antes de cualquier tool de pixelforge:

```
ToolSearch(query="select:mcp__pixelforge__forge_background,mcp__pixelforge__forge_sprite,mcp__pixelforge__forge_animation,mcp__pixelforge__process_sprite,mcp__pixelforge__optimize_sprite", max_results=10)
```

Si devuelve `InputValidationError` o no encuentra las tools → pixelforge no está instalado.
Decirle al usuario que siga la sección de instalación del CLAUDE.md.

---

## Elegir la tool correcta

| Tipo de asset | Tool |
|---|---|
| Fondo opaco full-frame (cielo, suelo, montañas) | `forge_background` |
| Sprite con transparencia (personaje, prop, ítem) | `forge_sprite` |
| Frame idle de personaje | `forge_sprite` + `references:` |
| Walk cycle / animación | `forge_animation` ⚠️ (ver limitaciones) |
| Post-proceso bg removal / crop / split | `process_sprite` |
| Downscale nearest-neighbor | `optimize_sprite` |

---

## Reglas de prompts — errores ya documentados

### Capas de parallax intermedias: siluetas planas

Para capas con otras capas visibles detrás:

```
✅ PEDIR: "solid filled shape, no internal lineart, no outlines,
           no negative space inside the silhouette,
           single flat color or simple two-tone shading"

❌ EVITAR: "detailed", "with visible foliage", "with branches"
           (producen transparencias internas que rompen la profundidad)
```

### Parámetro `background` de forge_sprite — usar presets nombrados

```
❌ NO usar: "black", "white"  → Gemini ignora el color y el bg removal falla
✅ Presets válidos: "night", "forest", "sky", "dungeon", "ocean", "sand", "snow", "lava"
```

**Ejemplo verificado:**
- `background: "black"` → Gemini generó fondo blanco → bg removal falló
- `background: "night"` (= `#0A0A2E`) → **funcionó correctamente**

### Capas opacas full-frame → forge_background, NUNCA forge_sprite

`forge_sprite` aplica bg removal por defecto y puede dejar huecos.
Para fondos que deben cubrir toda la franja: usar `forge_background`.

---

## Resoluciones y dimensiones

- Resolución virtual del proyecto: **480×270** (16:9), zoom ×3 → 1440×810
- Pedir `aspect: "16:9"` o `size: "480x270"` / `"960x540"`
- Siempre aplicar `optimize_sprite` al final con nearest-neighbor para escalar a resolución exacta
- Para tileSprite seamless horizontal: el PNG necesita bordes izq/der que casen
  → si no son seamless, usar `image_generative_expand` del Adobe MCP (ver skill editar-arte-adobe)

---

## Costos

- `nano-banana-2` (flash-image): ~$0.03/imagen
- `pro-image`: ~$0.07/imagen
- Requiere billing habilitado en el proyecto Google Cloud de la GEMINI_API_KEY
- El free tier de `gemini.google.com` NO cubre imagen vía API

---

## Workflow completo para una capa de parallax

```
1. forge_background(
     description: "pixel art forest, solid filled tree silhouettes,
                   no outlines, flat dark green shapes,
                   seamless horizontal tile",
     outputPath: "public/assets/parallax/layer-04-mid-trees.png",
     aspect: "16:9"
   )

2. optimize_sprite(
     inputPath: "public/assets/parallax/layer-04-mid-trees.png",
     size: "480x270",
     outputPath: "public/assets/parallax/layer-04-mid-trees.png"
   )

3. Verificar en navegador: npm run dev
```

---

## ⚠️ Limitación crítica: animaciones / spritesheets

`forge_animation` genera frames **incoherentes entre sí** — el personaje deriva en proporciones, colores y silueta. No convergen aunque uses `references:`.

**Solución:**
- Generar solo el frame idle con `forge_sprite` + `references:`
- Animar con: Aseprite, Piskel (manual) o CSS/GSAP sobre el sprite estático
- **No iterar spritesheets con pixelforge** — es tiempo perdido

---

## Si pixelforge falla con "API key expired"

La key está revocada. Decirle al usuario:

```powershell
# 1) Ir a https://aistudio.google.com/apikey y crear una nueva key
# 2) En PowerShell NUEVA:
setx GEMINI_API_KEY "nueva-key-aqui"
# 3) Cerrar esa PowerShell, abrir una nueva
# 4) Reiniciar Claude Code completo (/exit → claude)
```
