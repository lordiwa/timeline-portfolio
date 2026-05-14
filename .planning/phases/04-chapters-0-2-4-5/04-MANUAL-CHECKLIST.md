# Phase 4 — Manual Verification Checklist

> Ejecutado por Rafael al cerrar Phase 4. Cada §N tiene un objetivo verifiable
> + criterios de PASS + espacio para observaciones. §13 firma sign-off final.
> Generado por Plan 04-06 W5 Task 3.

---

## §1 — Avatar busts 7-batch consistency visual (ART-01, D4-01)

**Objetivo:** Validar que los 7 busts pixel-art representan al mismo personaje envejeciendo coherentemente.

**Cómo verificar:**
1. Abre los 7 PNGs lado a lado:
   ```powershell
   Start-Process public\assets\ch0-bust.png
   Start-Process public\assets\ch1-bust.png
   Start-Process public\assets\ch2-bust.png
   Start-Process public\assets\ch3-bust.png
   Start-Process public\assets\ch4-bust.png
   Start-Process public\assets\ch5-bust.png
   Start-Process public\assets\ch6-bust.png
   ```
2. Para cada bust valida:
   - **Identity:** ¿Es reconociblemente Rafael (ref refMain.png + 2011/2016/2022/2026)?
   - **Aging:** ch0 (~11) → ch1 (~17) → ch2 (~25) → ch3 (~29) → ch4 (~32) → ch5 (~38) → ch6 (~42).
   - **Era markers:** ch0 gorra Jurassic Park, ch1+ch2 cabeza rapada, ch3-6 barba progresiva.
   - **Style consistency:** mismo nivel detalle pixel-art SNES (16-bit chunky).

**Criterios de PASS:** ≥6 de 7 busts cumplen identity + aging + era + style.

**Observaciones Rafael:**
```
[ ]
```

---

## §2 — Parallax depth perceivable ch4 (ART-03, SC-1)

**Objetivo:** Las 4 capas de ch4 se mueven con velocidades distintas (depth effect).

**Cómo verificar:**
1. `npm run dev` → http://127.0.0.1:5173?ch=4
2. Scroll dentro de ch4 — observa: stars-far lentísimo / planet-mid medio /
   panels-fg rápido / ships-near el más rápido.
3. DevTools → Rendering → "Emulate prefers-reduced-motion" → re-scroll.
   Bajo PRM, todas las capas se mueven uniforme (sin depth differential).
4. Mobile 375×667: depth aún perceptible (puede ser menos pronunciado).

**Criterios de PASS:** Depth perceptible default; uniform bajo PRM.

**Observaciones:**
```
[ ]
```

---

## §3 — Marquee + starfield ch1 era-accuracy (ART-07, SC-1)

**Objetivo:** Feel GeoCities/Angelfire 90s.

**Cómo verificar:**
1. `?ch=1` → observa `<marquee>` left-scroll bilingüe + starfield twinkle +
   tabla legacy `border="1"` + Comic Neue + magenta sobre navy.
2. Toggle PRM → marquee swap a `<span>` estático; starfield estático.
3. Comparar mentalmente con archive.org circa 1999.

**Criterios de PASS:** Feel reconocible "página personal 90s" + PRM swap funcional.

**Observaciones:**
```
[ ]
```

---

## §4 — Cursor parpadeante ch0 era-accuracy (ART-07, SC-1)

**Objetivo:** CRT P1 phosphor look + cursor steps animation.

**Cómo verificar:**
1. `?ch=0` → texto VT323 verde fósforo (#00ff41) sobre negro + cursor
   parpadeante steps + 4 líneas terminal staggered (0/1.5/3/4.5s delay).
2. PRM → cursor estático, líneas instant render.

**Criterios de PASS:** Feel "MS-DOS prompt 1995" + PRM compliance.

**Observaciones:**
```
[ ]
```

---

## §5 — FlashBanner ch2 era-accuracy (ART-02, SC-1)

**Objetivo:** Skeumorphic Flash era 2009 vibe.

**Cómo verificar:**
1. `?ch=2` → FlashBanner orange→deep gradient + chrome dots + bg ch2-bg.jpg
   + project cards orange-purple + Verdana font.
2. Comparar con archive.org circa 2009.

**Criterios de PASS:** Feel "Flash banner 2009" + bg pixel-art coherente §5.1.

**Observaciones:**
```
[ ]
```

---

## §6 — FloatingPanel glass aesthetic ch4 (ART-03)

**Objetivo:** AR/VR glass holographic + backdrop-filter blur.

**Cómo verificar:**
1. `?ch=4` → FloatingPanels con bg semi-transparente cyan + border cyan +
   backdrop-filter blur (Chrome moderno) + box-shadow glow + Audiowide font.
2. Firefox sin backdrop-filter: fallback opaque background readable.
3. Mobile <600px: blur reducido a 6px (Pitfall 3).

**Criterios de PASS:** Glass feel + fallback funcional cross-browser.

**Observaciones:**
```
[ ]
```

---

## §7 — ScrollRevealCard motion ch5 (SC-1)

**Objetivo:** Modern reveal animation + PRM compliance.

**Cómo verificar:**
1. `?ch=5` → scroll dentro del chapter:
   - Header card fade+slide-in 300ms.
   - 5 cards staggered 100/200/300/400/500ms delay.
   - Modern flat aesthetic (no skeumorphic).
2. PRM → todos los cards instant render desde mount (sin transition).

**Criterios de PASS:** Reveal modern + PRM instant funcional.

**Observaciones:**
```
[ ]
```

---

## §8 — Avatar busts alt text era-accurate ratification (A11Y-06, D4-11)

**Objetivo:** Rafael ratifica drafts del ejecutor capturan correctamente cada bust.

**Cómo verificar:**
1. Abre `src/i18n/es.json` y `en.json` → busca `avatar.busts`.
2. Para cada chapter (0..6):
   - Lee ES alt-text + mira `public/assets/chN-bust.png`.
   - Valida que la descripción match al bust (edad, contexto era, expresión).
   - Lee EN paridad — confirma fidelity.
3. Si necesita refinar: edita directamente el JSON. parity.test.js T4 garantiza
   no romper paridad ni reintroducir placeholders.

**Criterios de PASS:** Los 7 alt-text ES + EN reflejan fielmente los busts.

**Observaciones:**
```
[ ]
```

---

## §9 — ES vs EN layout no-overflow (I18N-05)

**Objetivo:** ES ~20-30% más largo que EN no debe romper layouts.

**Cómo verificar:**
1. `npm run dev` → para ch0/1/2/3/4/5 en ambos idiomas (LangToggle top-right):
   - Desktop 1440×900: text overflow visible? layout shift al toggle?
   - Mobile 375×667 (DevTools): tabla ch1, FlashBanner ch2, FloatingPanels ch4,
     ScrollRevealCards ch5 se ajustan?
2. Atención especial: terminal lines ch0 (VT323 corre estrecho), techStack ch4,
   ScrollRevealCard ch5 cards (5 × 100ms staggered).

**Criterios de PASS:** ningún text overflow visible + no layout shift CLS al toggle.

**Observaciones:**
```
[ ]
```

---

## §10 — Contrast audit 4.5:1 ch2/ch4/ch5 (A11Y-04, THM-05)

**Objetivo:** Verificar WCAG AA 4.5:1 en chapters cuya paleta se finalizó W2/W3/W4.

**Cómo verificar:**
1. Chrome DevTools → Lighthouse → Accessibility audit en `?ch=2`, `?ch=4`, `?ch=5`.
   O usar axe DevTools extension.
2. Verificar no issues de contrast para text/foreground pairs.
3. ch4 FloatingPanel: backdrop-filter puede reducir contrast aparente —
   verificar 4.5:1 contra `rgba(10, 15, 46, 0.4)` fallback (escenario sin blur).
4. ch1 magenta-on-navy ya documentado tradeoff Phase 2 (3.2:1 + 18px+ exempt).

**Criterios de PASS:** No issues nuevos en ch2/4/5. Tradeoffs documentados quedan documentados.

**Observaciones:**
```
[ ]
```

---

## §11 — Privacy public/references/ exclusion (T-04-01, D4-02)

**Objetivo:** Las 6 fotos + refMain.png NO están commiteadas al repo.

**Cómo verificar:**
```powershell
# 1. Listar archivos en public/references/ (existen en disco)
Get-ChildItem public\references\

# 2. Verificar que git las trata como ignored
git check-ignore public/references/2011.jpg
git check-ignore public/references/refMain.png
# Ambos deberían retornar el path

# 3. Confirmar NO están en git history
git log --all --full-history -- public/references/2011.jpg
git log --all --full-history -- public/references/refMain.png
# Ambos deberían retornar vacío
```

**Criterios de PASS:** los 3 checks confirmados; las fotos viven en disk local pero git las ignora.

**Observaciones:**
```
[ ]
```

---

## §12 — iOS preventive mitigations documented (Plan 07 deferred)

**Objetivo:** Documentar qué pasaría en iOS Safari sin hardware para test.

**Riesgos heredados:**
- `<marquee>` ch1: legacy support iOS 3.2+; fallback PRM-swap pronto si Apple lo deshabilita.
- Parallax 4 layers ch4 + backdrop-filter: posible jank Snapdragon 7xx / A12 iPhone.
  Mobile blur reducido a 6px (Pitfall 3) preventivo.
- IntersectionObserver ch5: soportado iOS 12.2+.

**Acción:** No-op. Solo confirmar que el código tiene las mitigaciones preventivas.

**Observaciones:**
```
[iOS smoke test deferred Plan 07 Phase 1 — Rafael NO posee hardware iOS]
```

---

## §13 — Sign-off

| Field | Value |
|-------|-------|
| Reviewer | Rafael Matovelle |
| Date | YYYY-MM-DD |
| Verdict | [ ] PASS / [ ] PASS-with-observations / [ ] FAIL |
| Observations summary | |

**Si verdict = PASS-with-observations:** detallar items §N con polish opcional para Phase 5+ o post-merge.

**Si verdict = FAIL:** detallar items §N que requieren iteración inmediata
(re-execute W0/W1/W2/W3/W4 plan correspondiente).

**Si verdict = PASS:** planner-actor actualiza STATE.md + ROADMAP.md marcando
Phase 4 como cerrada.
