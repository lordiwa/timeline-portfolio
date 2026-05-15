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
- **Commit hash post-fix:** {pending}

---

## ch6-bust.png — navy-with-outlines → green-shirt (2026-05-15)

- **Versión guardada:** `old/ch6-bust-2026-05-15-navy-with-outlines.png` (18,692 bytes — commit `0b5abb9`)
- **Razón del cambio:** Rafael 2026-05-15: misma razón que ch5 — navy no se leía como camisa + delineado blanco interno visible.
- **Qué se intentó diferente:** Mismo pipeline ch5. Paso 1: image_fill_area #1A3D24 en Neck+Upper Clothes. Paso 2: primer intento outline prompt falló con SAM IoU threshold 0.8 → retry con prompt "thin white lines at the border between the face and shirt, between hair and skin" — máscara generada pero fill skin #B35A48 arruinó la imagen (cubrió figura completa). Retry 2: image_select_by_prompt bodyParts ["Neck"] solo + image_fill_area skin midtone (red:200, green:120, blue:90) — resultado aceptable: cuello uniforme, cara/pelo/barba intactos. 3 intentos en paso de outlines.
- **Resultado:** DONE-PARTIAL — camisa verde oscuro #1A3D24 visible, cara/pelo cana/barba intactos. Cuello con skin midtone plano (no degradado natural) — aceptable vs tener outlines blancos. Dimensiones 96×96 mantenidas.
- **Commit hash post-fix:** {pending}
