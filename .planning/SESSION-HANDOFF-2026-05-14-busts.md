# Session Handoff — Busts ch0-ch6 + StickyAvatar wire (2026-05-14)

> Snapshot del estado de la sesión antes de `/clear` para que la próxima sesión retome sin perder contexto.
> Generado tras 6+ iteraciones de regeneración de busts y feedback acumulado de Rafael.

---

## TL;DR — Estado al cierre

**ch3 SIGUE siendo la referencia visual** (Rafael correction 2026-05-14 23:25 UTC: "no es ch6 la referencia, sigue siendo ch3, solo dije que ch6 la imagen está bien").
- ch6 **imagen** (la cara) ✅ bien — caso particular que funciona
- ch6 **ropa** ❌ "borrada" / corrupta — debe arreglarse SIN tocar la cara
- ch4 y ch5 ❌ "pésimos" — deben regenerarse matcheando ch3 (la referencia)
- ch0, ch1, ch2, ch3 ✅ no tocar (Rafael lo dejó explícito en sesión)

**La estrategia "match ch3"** sigue siendo válida — el problema fue que pixelforge drifteea y HSL global no es suficiente para corregir highlights. Próxima sesión: enfocarse en técnicas Adobe MCP selectivas + posiblemente re-generar con prompts que excluyan specular highlights.

---

## Estado de cada bust (paths absolutos)

| Asset | Path | Estado | Acción próxima |
|---|---|---|---|
| `ch0-bust.png` | `public/assets/ch0-bust.png` | ✅ Ratificado (younger version del ch1) | No tocar |
| `ch1-bust.png` | `public/assets/ch1-bust.png` | ✅ Ratificado (Phase 3 original) | No tocar |
| `ch2-bust.png` | `public/assets/ch2-bust.png` | ✅ Ratificado (Phase 3 original) | No tocar |
| `ch3-bust.png` | `public/assets/ch3-bust.png` | ✅ Ratificado (Phase 3 original) — **REFERENCIA VISUAL** | No tocar |
| `ch4-bust.png` | `public/assets/ch4-bust.png` | ❌ "Pésimo" — drift de highlights y colores | **Regenerar matcheando ch3** |
| `ch5-bust.png` | `public/assets/ch5-bust.png` | ❌ "Pésimo" — mismo issue que ch4 | **Regenerar matcheando ch3** |
| `ch6-bust.png` | `public/assets/ch6-bust.png` | ⚠️ Cara bien, ropa borrada | **Arreglar SOLO la ropa, preservar cara** |

---

## Próximos pasos concretos (próxima sesión)

### Paso 1: Arreglar la ropa de ch6 sin tocar la cara

**Approach recomendado:** Adobe MCP `image_select_by_prompt` para seleccionar SOLO la ropa, luego `image_fill_area` o `image_generative_expand` para reconstruirla. NO regenerar todo el bust con pixelforge (eso pierde la cara que está bien).

Aplicar proceso `old/` + CHANGELOG (CLAUDE.md §6.5):
```bash
git mv public/assets/ch6-bust.png "public/assets/old/ch6-bust-2026-05-14-iter5-HSL.png"
```
Append CHANGELOG: "ropa borrada por HSL post-process, regenerar SOLO clothing zone preservando cara".

ch3 SIGUE siendo la referencia general; ch6 solo necesita su ropa restaurada.

### Paso 2: Regenerar ch4 + ch5 matcheando ch3 (NO ch6)

Dispatch `artist-creator` con:
- Read `public/assets/ch3-bust.png` como BASE visual (referencia ratificada)
- Pixel sampling de los hex codes ch3 (skin/hair/eyes — los del agente previo fueron: piel `#D4956A`/`#B87A50`/`#8B5A35`, cabello `#3D2B1A`/`#5C3D22`, ojos teal verde `#4A7A6B`)
- ch4 = ch3 + apenas envejecido (~33 años): mismos colores, barba apenas más definida
- ch5 = ch3 + apenas envejecido más (~38 años): mismos colores, pelo apenas más largo que ch4
- **Considerar:** agregar "flat lit face, no specular highlights, even illumination matching ch3" al prompt para evitar el drift de highlights que ocurrió en iter4

Aplicar proceso `old/` + CHANGELOG para ch4 y ch5.

### Paso 3: Verificación visual

Refresca `npm run dev`, scroll ch3→ch4→ch5→ch6 y observa StickyAvatar top-left. Los 4 deben leerse como "misma persona envejeciendo poquito a poquito" con ch6 como anchor final.

---

## Lo que NO debe cambiarse (instrucciones Rafael literales)

- "no cambies ch1,2,3 los avatares" — ch1/ch2/ch3 INTACTOS
- ch0 bust ya ratificado (younger version del ch1 después de varias iters)
- ch6 cara está bien — preservar al arreglar la ropa
- Bio era-specific + TerminalScroll DOS demo reel + StickyAvatar img real wire — TODOS commited y funcionando, no tocar
- 428/428 tests verde — no romper

---

## Pitfalls aprendidos (no repetir)

1. **No usar refs adultos (2011-2026.jpg) si Rafael pide consistencia visual** — causaron drift undercut + barba densa. Usar SOLO el bust de referencia que Rafael ratifique.
2. **pixelforge drifteea colores aunque hex codes en palette/prompt** — Gemini interpreta colores en lenguaje natural. Solo pixel sampling + HSL post-process da control real.
3. **HSL global no puede arreglar drift de highlights** — pixelforge ilumina la cara con highlights distintos al ref; HSL global ajusta tono pero no redistribuye highlights. Para esto: `image_select_by_prompt` + `image_adjust_dark_portions` zonal, o regenerar con prompt "flat lit face, no specular".
4. **Override eye color verde** está ratificado (memoria §5.6 Phase 4 W0) pero memoria diff lo lista como "Pending docs update". El bust ch3 confirma ojos teal verde-grisáceo `#4A7A6B`, NO marrón hazel `#5a3a1f`. Usar verde en futuros prompts.
5. **artist-creator con `tools:` restrictivo SÍ tiene MCP pixelforge** — solo `gsd-executor` los pierde (bug #13898). Confirmado funcional en esta sesión.

---

## Estado del repo al hacer el handoff

Branch: `master` (post-clear retoma desde acá)
Tests: 428/428 verde
Build: verde
Working tree: clean (todos los cambios commited)

Últimos commits relevantes (newest first):
```
928de86 art(ch6): HSL refine iter5 — match piel a ch3 (ajuste fino)
123ea2c art(ch5): HSL refine iter5 — match piel a ch3 (saturation correction)
ef51f16 art(ch4): HSL refine iter4 — match piel/cabello a ch3 (hue/saturation correction)
c9fdd69 art(ch6): regenerate ch6-bust.png iter5 — pixel-sampled colors from ch3 + pelo más largo + 2 canas barba
d7d0dfa art(ch5): regenerate ch5-bust.png iter5 — pixel-sampled colors from ch3 + pelo apenas más largo
026059e art(ch4): regenerate ch4-bust.png iter4 — pixel-sampled colors from ch3 + barba apenas más definida
09e32c0 process(assets): establecer proceso 'old/' + CHANGELOG.md para iteraciones
6fae8b6 feat(avatar): StickyAvatar wire a img real cross-chapter (resuelve 'no sale la cara' ch6)
dd8e954 feat(ch0): bio era-specific protagonista + terminal como signature
fa52ba6 feat(ch0): BOOT state opcional pre-PROGRAM para Windows 95 splash loading
```

`public/assets/old/` contiene iter3/iter4 previas como reversible fallback. `CHANGELOG.md` documenta los porqués.

---

## Si la próxima sesión necesita revertir TODO el trabajo de busts ch4/5/6 de esta sesión

Volver al estado pre-iter4 (cuando ch4 había sido ratificado como "perfecto" por Rafael):
```bash
git checkout 6fae8b6 -- public/assets/ch4-bust.png  # iter3 (commit pre-iter4 era el HSL)
# ch4 iter3 corresponde a 5a89ac7 antes del re-regen — pero ese commit es PRE-iter3 también
# Si quieres el ch4 que Rafael dijo "perfecto", es el de commit 5a89ac7
git checkout 5a89ac7 -- public/assets/ch4-bust.png
```

Alternative: copiar desde `public/assets/old/ch4-bust-2026-05-14-iter3.png`:
```bash
cp public/assets/old/ch4-bust-2026-05-14-iter3.png public/assets/ch4-bust.png
```
