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
- **Commit hash post-regen:** {pending}

### Historial previo (no preservado en old/, ver git log):
- iter1 (Phase 3 batch original, antes de 2026-05-14): no preservado
- iter2 → `5a89ac7 art(ch4): regenerate ch4-bust.png — pelo apenas más largo continuum desde ch3 (~33 años)` — feedback Rafael: aging progresivo
- iter3 → `1f86ab6 art(ch4): re-regenerate ch4-bust.png — colores identicos a ch3 (Rafael 'ya no se parece')` — feedback Rafael: colores no matchearon ch3

---

## ch5-bust.png — iter4 → iter5 (2026-05-14)

- **Versión guardada:** `old/ch5-bust-2026-05-14-iter4.png` (15,626 bytes — generado por commit `ae07e13`)
- **Razón del cambio:** Mismo feedback Rafael que ch4 — colores piel/ojos no matchean ch3 exactamente.
- **Qué se intentará diferente:** mismo approach que ch4 iter4 — pixel sampling ch3 + palette constrained + posible Adobe HSL post-process. ch5 además debe mantener pelo apenas más largo que ch4 sin canas.
- **Commit hash post-regen:** {pending}

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
