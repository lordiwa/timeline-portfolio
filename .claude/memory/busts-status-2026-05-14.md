---
name: busts-status-2026-05-14
description: Estado de los 7 busts ch0-ch6 tras sesión 2026-05-14. Iter6 aplicado a ch4/ch5/ch6. Pendiente verificación visual Rafael. ch6 quedó en 64×64 vs resto 96×96 — issue de aspect ratio en CSS container 80×96 pendiente de evaluar.
metadata: 
  node_type: memory
  type: project
  originSessionId: 12ecb221-ea5c-4124-9ef0-bc4f0ec91ee9
---

Estado de los busts al cierre del segundo round 2026-05-14 (post-clear):

| Bust | Estado | Dim | Commit último | Acción próxima |
|---|---|---|---|---|
| ch0 | ✅ Ratificado | 96×96 | (Phase 3) | No tocar |
| ch1 | ✅ Ratificado | 96×96 | (Phase 3) | No tocar |
| ch2 | ✅ Ratificado | 96×96 | (Phase 3) | No tocar |
| ch3 | ✅ Ratificado — **REFERENCIA VISUAL** | 96×96 | (Phase 3) | No tocar |
| ch4 | ⏳ iter5 regenerado matcheando ch3 | 96×96 | `af44ae4` | Verificación Rafael |
| ch5 | ⏳ iter6 regenerado matcheando ch3 | 96×96 | `5834917` | Verificación Rafael |
| ch6 | ⏳ iter6 ropa fixed con Adobe selective | 64×64 ⚠️ | `bf069c5` | Verificación Rafael + posible upscale 96×96 |

**Why:** Round 2 después de session handoff. Estrategia que funcionó:
- **ch4/ch5 (artist-creator + pixelforge):** pasar `references: ["public/assets/ch3-bust.png"]` directamente + prompt con "FLAT even lighting, no specular shine, NO white highlights on face or forehead" + hex codes pixel-sampled de ch3 + anti-patrones explícitos ("NO orange NOT oversaturated"). En **una sola generación** sin necesidad de HSL post-process.
- **ch6 (artist-editor + Adobe MCP):** pipeline selectivo `image_generative_expand(bottom:20)` → `image_select_by_prompt(white area below neck)` → `image_adjust_exposure(-20)` → `image_select_by_prompt(dark area below)` → `image_adjust_hsl(colorize blue navy)` → `image_crop_to_bounds`. Preservó cara intacta y reconstruyó ropa azul navy. **Pitfall:** `image_fill_area` no puede crear píxeles opacos sobre alpha=0; requiere `image_generative_expand` primero.

**How to apply (próxima sesión):**

1. **Verificar visualmente con Rafael** scroll ch3→ch4→ch5→ch6 en `http://localhost:5175/`. Los 4 deben leerse como misma persona envejeciendo sutilmente.
2. **Si Rafael ratifica:** marcar busts como done, archivar handoff, actualizar memoria a status FINAL.
3. **Si Rafael nota inconsistencia ch6 (más pixelado por upscale 64→80):** dispatch artist-editor para upscale `ch6-bust.png` a 96×96 con `image_crop_and_resize` (nearest-neighbor para preservar pixel-art) o `image_generative_expand` para padding a 96×96 (preserva detalle).
4. **Si Rafael rechaza ch4 o ch5:** la nueva estrategia funcionó en una shot — re-leer prompt exacto en commit message + ajustar variable específica (no rehacer pipeline completo).

**Lecciones técnicas confirmadas:**

- **Pasar referencia visual directamente como `references` array a `forge_sprite`** + hex codes en prompt es decisivamente más efectivo que palette argument solo. La combinación "anti-patrón nombrado explícito (NO orange NO oversaturated NO specular) + hex codes + referencia visual" elimina drift en una generación.
- **Adobe MCP no puede arreglar zonas alpha=0** con `image_fill_area` directo. Workflow correcto: `image_generative_expand` → `image_select_by_prompt` → `image_adjust_*`. Documentado en commit `bf069c5`.
- **HSL iter5 destruyó dimensiones** (96×96 → 64×64) por algún side effect. Si se usa HSL post-process en el futuro, verificar dimensiones después.

Cross-ref: [[feedback_asset-iteration-process]] (proceso old/ + CHANGELOG), [[reference-photos-available]] (refs personales, NO usar para busts), [[project_phase-5-visual-review-pending]] (Phase 5 still PASS-with-observations).
