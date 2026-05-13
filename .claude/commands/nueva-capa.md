# Comando: /project:nueva-capa

Genera una nueva capa de parallax completa usando el pipeline artist-creator → artist-editor.

Uso: `/project:nueva-capa [nombre-de-capa] [descripción del contenido]`

Ejemplo: `/project:nueva-capa layer-04-mid-trees "bosque de mediana distancia, siluetas de árboles"`

---

Ejecuta el siguiente flujo en secuencia:

1. **artist-creator**: Generar el PNG con `forge_background`
   - Nombre de archivo: `public/assets/parallax/$ARGUMENTS.png` (primer argumento)
   - Descripción del contenido: segundo argumento
   - Aplicar las reglas de siluetas planas si es capa intermedia (ver skills/crear-arte-pixelforge.md)
   - Aplicar `optimize_sprite` al finalizar

2. **artist-editor**: Post-procesar con Adobe MCP
   - `adobe_mandatory_init()`
   - `image_crop_and_resize` a 480×270 si las dimensiones no son exactas
   - `image_generative_expand` para hacer seamless horizontal si el fondo no tiene bordes que casen

3. **frontend-dev**: Integrar en la escena
   - Verificar si la capa ya existe en el array `LAYERS` de `ParallaxScene.js`
   - Si no existe, agregar con un scrollFactor apropiado
   - Correr `npm run dev` para confirmar que carga sin error

4. **qa**: Verificar visualmente
   - Confirmar que la capa se ve correctamente
   - Reportar cualquier artefacto visual
