---
name: editar-arte-adobe
description: >
  Post-procesa y manipula imágenes de pixel art usando el Adobe MCP.
  Usar cuando se pida: recortar asset, quitar fondo, hacer imagen seamless,
  armonizar paleta entre capas, escalar imagen, expandir bordes para tiling.
  El Adobe MCP NO genera pixel art — solo edita imágenes existentes.
---

# Skill: Editar arte con Adobe MCP

## Inicialización obligatoria

SIEMPRE llamar esto primero, antes de cualquier otra tool de Adobe:

```
adobe_mandatory_init()
```

Si devuelve que las capacidades generativas no están disponibles: es normal.
El Adobe MCP en este entorno **solo sirve para edición/post-proceso**, no para generación.

---

## Operaciones disponibles y cuándo usarlas

| Operación | Tool | Cuándo usar |
|---|---|---|
| Eliminar fondo | `image_remove_background` | Cuando `forge_sprite` dejó bg incorrecto |
| Recortar a dimensión exacta | `image_crop_and_resize` | Ajustar a 480×270, 960×540, etc. |
| Expandir imagen (outpaint) | `image_generative_expand` | Hacer seamless horizontal para tileSprite |
| Seleccionar objeto por descripción | `image_select_by_prompt` | Aislar elemento antes de recortar o enmascarar |
| Ajustar paleta (hue/sat/luz) | `image_adjust_hsl` | Armonizar colores entre capas generadas en llamadas distintas |
| Ajustar temperatura de color | `image_adjust_color_temperature` | Calentar/enfriar para consistencia visual entre capas |
| Escalar imagen | `image_crop_and_resize` | Alternativa a `optimize_sprite` si pixelforge no está disponible |

---

## Flujo completo: pixelforge → Adobe MCP → asset final

```
1. [pixelforge] forge_background / forge_sprite  →  PNG crudo

2. [Adobe] image_remove_background               →  Si el bg no quedó transparente
           (solo si aplica — usar cuando forge_sprite falló con bg removal)

3. [Adobe] image_crop_and_resize                 →  Ajustar a dimensión exacta del proyecto
           width: 480, height: 270               (o 960×540 para luego optimize_sprite)

4. [Adobe] image_generative_expand               →  Solo si necesita ser seamless horizontal
           (rellena los bordes para que el PNG tile correctamente en tileSprite de Phaser)

5. [Adobe] image_adjust_hsl                      →  Armonizar paleta si hay inconsistencia
           entre capa de cielo, mid-trees, suelo

6. [pixelforge] optimize_sprite                  →  Downscale nearest-neighbor al tamaño final
           (siempre el último paso antes de copiar al proyecto)

7. Copiar PNG a public/assets/parallax/ o public/assets/hero/
```

---

## Seamless horizontal para parallax tileSprite

El mayor uso de Adobe MCP en este proyecto es hacer fondos que se repitan horizontalmente sin costura:

```
1. Tener el PNG generado por pixelforge en disco
2. adobe_mandatory_init()
3. image_generative_expand(
     inputPath: "public/assets/parallax/layer-04-mid-trees.png",
     direction: "horizontal",  # o left/right según qué borde necesita relleno
     expansionAmount: 20       # % de expansión
   )
4. Verificar en el navegador que el tiling no muestra costura
5. Si sigue habiendo costura: repetir con mayor expansionAmount
```

---

## Armonizar paleta entre capas

Cuando dos capas generadas en llamadas distintas tienen tonos incompatibles:

```
1. adobe_mandatory_init()
2. image_adjust_hsl(
     inputPath: "public/assets/parallax/layer-03-far-trees.png",
     hueShift: 10,        # girar tono para acercar al cielo
     saturation: -15,     # desaturar capas lejanas (efecto profundidad)
     lightness: 0
   )
3. image_adjust_color_temperature(
     inputPath: "public/assets/parallax/layer-01-sky.png",
     temperature: -10     # enfriar cielo para contraste con árboles cálidos
   )
```

**Regla visual de profundidad:** capas lejanas más desaturadas y más frías/azuladas.
Capas próximas más saturadas y cálidas.

---

## Notas importantes

- El Adobe MCP **no genera pixel art nuevo** en este entorno — confirmado por `adobe_mandatory_init`.
- Si se pide generar arte nuevo → usar skill `crear-arte-pixelforge`.
- Stock search de Adobe no devuelve capas de pixel art utilizables para este proyecto.
- `image_generative_expand` (outpaint) sí funciona — es la única función generativa disponible.
