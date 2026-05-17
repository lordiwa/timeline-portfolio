---
name: feedback_validate-bust-colors-vs-ch3
description: "ANTES de declarar un bust regenerado como DONE, pixel-sample obligatorio piel/pelo/ojos vs ch3-bust.png. Pixelforge drifteea sistemáticamente aunque el prompt tenga hex codes; Rafael ya se enojó 2x por este error reiterado."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f2400c90-d41c-4ee0-a694-392d99c2cb34
---

ANTES de declarar un bust regenerado (ch4/ch5/ch6) como DONE, pixel-sample obligatorio de las zonas piel/pelo/ojos y comparar contra ch3-bust.png (la referencia ratificada). Si hay drift, aplicar Adobe MCP HSL zonal antes de commit / antes de mostrar a Rafael.

**Why:** Rafael 2026-05-15 (sesión post-clear): "why are you changing the eyes and hair color, i explicitly told you not to change that and use the base skin and hair color as well as eyes, why are you making this mistake over and over again?". Documentado también 2026-05-14 ("no, deben tener el mismo exacto color de piel y los ojos deben parecerse mas") — mismo error en sesiones consecutivas. Pixelforge interpreta hex codes en lenguaje natural y drifteea, especialmente en regeneraciones múltiples sucesivas (cada iter se aleja un poco más). HSL global aplicado post-genera no siempre alinea bien — necesita ser ZONAL con image_select_by_prompt.

**How to apply:** Después de CADA `mcp__pixelforge__forge_sprite` que produce un bust (ch4/ch5/ch6 — NOT ch0/ch1/ch2/ch3 que están ratificados):
1. Read ch3-bust.png + el nuevo PNG con visión multimodal.
2. Compará piel/pelo/ojos visualmente. Si NO son indistinguibles del ch3, hay drift.
3. Pixel-sample los hex de ch3 vs los del nuevo (con Adobe MCP o lectura visual).
4. Si drift > sutil:
   - `image_select_by_prompt(bodyParts:["Hair"])` + `image_adjust_hsl` shift hacia `#3D2B1A`/`#5C3D22`
   - `image_select_by_prompt(bodyParts:["Eyes"]` o `"iris"`) + HSL hacia `#4A7A6B`
   - `image_select_by_prompt(bodyParts:["Skin"]` o `"face"`) + HSL hacia `#D4956A`/`#B87A50`/`#8B5A35`
5. Validar visual una vez más vs ch3. Recién entonces commit.
6. NO declarar DONE / NO mostrar a Rafael hasta paso 5.

**Reference hex codes ch3 (PIXEL-SAMPLED REAL 2026-05-15 con PowerShell System.Drawing.Bitmap — NO INVENTADOS):**
- Piel highlights: `#FBB782` / `#FAB682` / `#FCBE89` (peach/cream claro, NO warm tan medium-brown)
- Piel midtones: `#ED9766` / `#EC9865` / `#EA9461` (peach medio cálido)
- Piel shadows: `#B35A48` / `#7A4A36` / `#623521` (warm brown shadow)
- Cabello tope oscuro: `#1A0805` / `#170906` / `#0E0100` (CASI NEGRO, con tint marrón muy sutil)
- Cabello tints marrones: `#442516` / `#2F180A` (marrón muy oscuro)
- Ojos iris highlight: `#8A9E86` / `#A8B19D` (verde-grisáceo claro, SAGE/olivo claro)
- Ojos iris shadow: `#48622D` / `#465424` (verde OLIVA oscuro — NO teal)
- Ropa navy: `#131D2A` / `#141C2A` / `#131D2B` (azul muy oscuro, casi negro azulado)

**REGISTRO CRÍTICO:** Los hex `#D4956A`/`#B87A50`/`#8B5A35` piel, `#3D2B1A`/`#5C3D22` pelo, `#4A7A6B` ojos previamente "documentados" en sesiones anteriores eran **INVENTADOS por un agente** y propagados como fact en memoria. Causaron drift sistemático en todos los regens. Rafael 2026-05-15 me detuvo: "para ya vi estan mal, que color tiene ch3 de piel, de ojos, de cabello? dime eso antes de seguir". El pixel-sample con PowerShell reveló los hex REALES. NUNCA confíes en hex "documentados" sin pixel-sample verification.

**Lección clave:** poner hex codes en el prompt de pixelforge **NO es suficiente**. Pixelforge los ignora o los reinterpreta. La validación pixel-sampling post-genera es obligatoria. La fix técnica conocida es Adobe HSL zonal — esto SÍ funciona y debe usarse rutinariamente, no como excepción.

Cross-ref: [[busts-status-2026-05-14]] (estado iteraciones), [[feedback_asset-iteration-process]] (proceso old/+CHANGELOG).
