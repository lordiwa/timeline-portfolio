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
- **Commit hash post-regen:** {pending}

---

## ch5-bust.png — iter6 → iter7 (2026-05-15)

- **Versión guardada:** `old/ch5-bust-2026-05-15-iter6.png` (generado por commit `5834917`)
- **Razón del cambio:** Rafael 2026-05-15: "ch5 y ch6 menos canas y menos arrugas en ch5" — iter6 generó highlights claros en pelo/barba que leen como canas, y líneas sutiles leídas como arrugas. ch5 debe ser ~38 años sin signos de aging visibles.
- **Qué se intentará diferente:** prompt reforzado con anti-patrones repetidos múltiples veces ("ABSOLUTELY NO grey hairs ABSOLUTELY NO white strands ABSOLUTELY NO silver pixels") + "completely youthful" + "completely smooth flawless skin NO wrinkles NO forehead lines NO crow's feet NO eye bags NO age lines anywhere even pixel-level". Estrategia: redundancia de anti-patrones porque pixelforge ignoró el primer NO.
- **Commit hash post-regen:** `d97c7e7`
