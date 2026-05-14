---
phase: 04-chapters-0-2-4-5
plan: 01
status: complete
wave: 0
completed: 2026-05-13T23:50:00Z
commits:
  - fc3c8cf  # test(04-01): asset-naming guard + gitignore privacy (D4-02)
  - a4803b3  # art(04-01): ch3-bust anchor (validation gate aprobado)
  - 188f2d1  # art(04-01): 6 remaining busts (ch0/1/2/4/5/6) — D4-03 anchors aplicados
key_files:
  created:
    - public/assets/ch0-bust.png
    - public/assets/ch1-bust.png
    - public/assets/ch2-bust.png
    - public/assets/ch3-bust.png
    - public/assets/ch4-bust.png
    - public/assets/ch5-bust.png
    - public/assets/ch6-bust.png
    - tests/assets/asset-naming.test.js
    - scripts/remove-pixelforge-bg.mjs
  modified: []
requirements_satisfied:
  - ART-01  # 7 avatar busts pixel art existen (carry-forward Phase 3)
  - ART-04  # ch6-bust herencia para Phase 5
  - ART-05  # asset-naming convention enforced via test
  - A11Y-06 # alt-text wireup por chapter (placeholders i18n; W5 refresca con era-accurate copy)
tests:
  - tests/assets/asset-naming.test.js  # 4/4 PASS — wave-0-gate verde
suite_total: 264 PASS / 264
deviations:
  - id: D4-W0-01
    rule: "scripts/remove-pixelforge-bg.mjs no estaba en el plan original"
    why: "process_sprite + optimize_sprite de pixelforge no eliminaron el sky bg
          consistentemente (semi-transparency residual en edges). El script Node
          puro hace flood-fill desde 4 corners con detección de bg color +
          bluish-dominant constraint — más robusto. Reusable para los 6 busts
          siguientes y backgrounds futuros (W2/W3/W4 si pixelforge falla similar)."
    impact: "Adds 1 file to repo (~140 LOC). Helper temporal Phase 4 W0 — review
            si vale la pena retenerlo o moverlo a hidden script post-Phase 4."
  - id: D4-W0-02
    rule: "forge_sprite no expone parámetro `palette` array"
    why: "El plan asume `palette: paleta humana §5.6` como argument explícito,
          pero el schema MCP de forge_sprite (tras ToolSearch) solo expone
          background (preset enum) + style (preset enum). Workaround: embedded
          los 8 hex de §5.6 directamente en el `description` text con
          etiquetas explícitas (skin, hair, eyes, line-art, clothing)."
    impact: "Plan Pitfall 1 reformulado: §5.6 va inline en description.
            Confirmado funcional en los 7 busts (palette readable visualmente)."
  - id: D4-W0-03
    rule: "Override §5.6 — eye color verde, no brown hazel"
    why: "Durante validation gate ch3 (Task 3), Rafael verificó que sus ojos
          son verdes (#4a7c4a aprox) — §5.6 actualmente dice 'eye: #5a3a1f
          Brown hazel medio cálido'. El §5.6 fue derivado del análisis
          multimodal de las 6 fotos referencia + aprobado por Rafael 2026-05-14;
          el drift sugiere que el análisis subestimó el verde. TODO W5: refresh
          §5.6 con verdict 2026-05-13 — eye: #4a7c4a (override)."
    impact: "Los 7 busts generados con #4a7c4a en text. SUMMARY documenta el
            drift; CONTENT-CHECKLIST §5.6 sigue con #5a3a1f hasta W5 manual
            checklist (no afecta funcionalidad pero queda inconsistencia
            documentación-vs-code que W5 cierra)."
  - id: D4-W0-04
    rule: "Iteraciones por bust mayor a 1 (vs plan asume single-shot)"
    why: "ch3 anchor requirió 4 iteraciones hasta aprobación (v1 clean shaven
          → v2 con barba+chestnut → v3 darker hair+wider jaw → v4 con refMain
          como anchor primario: pelo desarreglado, barba poblada, t-shirt sin
          cuello, cara alargada). Los 6 restantes batch initial → review Rafael
          → 4 ajustes específicos (ch0 regordete+gorra JP, ch1+ch2 rapados, ch6
          menos envejecido) → v2 aprobado."
    impact: "+~7 forge_sprite calls extra (15 totales: 4 ch3 + 6 batch v1 + 4
            re-iter v2). Cada call ~$0.005 nano-banana, ~$0.075 total. Aceptable
            para asset 1-tiempo. W2/W3/W4 backgrounds heredarán refMain como
            identity master para chapters con figura humana."
  - id: D4-W0-05
    rule: "public/references/refMain.png NO documentado en plan/CONTEXT inicial"
    why: "Rafael agregó refMain.png como reference master durante validation gate
          ch3 ('refMain.png es un buen standard, basate más en ese'). Foto Rafael
          ~mid-30s con pelo desarreglado dark brown + barba completa + t-shirt
          olive — captura los identity markers definitivos. Usado como reference
          primaria en TODOS los 7 busts (no solo ch3)."
    impact: ".gitignore D4-02 entry `public/references/` ya cubre refMain.png
            (verified `git check-ignore`). Privacy gate intacta. UI-SPEC §7
            debería actualizarse para mencionar refMain como reference primaria
            (no solo las 6 fotos por edad). TODO W5 docs."
gates_resolved:
  - "Task 1 (checkpoint:human-input blocking) — pre-verificado por orchestrator:
     paleta §5.6 OK + 6 fotos referencia OK + pixelforge MCP OK"
  - "Task 3 (checkpoint:human-verify ch3 anchor) — Rafael aprobó v4 después de
     4 iteraciones (ajustes: barba, pelo más oscuro, quijada ancha, refMain
     como reference)"
  - "Task 5 (checkpoint:human-verify 7 busts) — Rafael aprobó v2 después de
     ajustes en ch0/ch1/ch2/ch6"
notes:
  identity_marker_set:
    eye: "#4a7c4a (verde — override §5.6)"
    hair_base: "#2a1810 (dark warm brown — mantiene §5.6)"
    hair_highlight: "#4a2818 (mid-tone warm brown — adaptado de §5.6 #5c3e2a)"
    skin_base: "#e8b894 (warm peach — §5.6)"
    skin_shadow: "#b58263 (warm tan — §5.6)"
    line_art: "#1a0f08 (warm near-black — §5.6)"
    clothing_primary: "#2a3540 (dark navy slate — §5.6)"
    clothing_accent: "#d4a447 (mustard — §5.6, opcional para ch1 hoodie)"
  per_chapter_diffs:
    ch0: "~11 años, regordete + cachetes baby-fat, gorra Jurassic Park clásica (T-Rex skeleton + texto blocky), camiseta a rayas 90s primary colors, sin barba"
    ch1: "~17 años, cabeza rapada (buzz cut), peach fuzz mustache shadow, hoodie gris dark"
    ch2: "~25 años, cabeza rapada (buzz cut adult, slightly more visible stubble than ch1), short scruff en mentón, t-shirt navy"
    ch3: "~29 años (anchor), pelo desarreglado dark brown wavy, barba poblada short-medium, t-shirt navy round neck — ANCHOR BIDIRECTIONAL"
    ch4: "~32 años, pelo desarreglado, barba completa similar a refMain, t-shirt"
    ch5: "~38 años, pelo desarreglado, barba medium-length denser, t-shirt"
    ch6: "~42 años (youthful look — no over-aged), pelo full dark sin gray, beard dark sin gray, t-shirt"
  ui_arch_clarification:
    sticky_avatar: "StickyAvatar.vue (top-left fixed, Phase 1) ya consume
                    chapters[activeChapter].avatarSrc — funcionará para los 7
                    automáticamente al hacer scroll"
    in_content_avatar: "Cada Chapter{N}Content embebe el avatar dentro de
                        aside.chN-meta. Estado:
                        - ch3 → Phase 3 (DONE)
                        - ch0, ch1 → Phase 4 W1 (Plan 04-02 DONE)
                        - ch2 → Phase 4 W2 (Plan 04-03 — próxima)
                        - ch4 → Phase 4 W3 (Plan 04-04)
                        - ch5 → Phase 4 W4 (Plan 04-05)
                        - ch6 → Phase 5 (futura — bust ya entregado para herencia)"
  cost_estimate:
    pixelforge_calls: 15
    estimated_total_usd: ~0.08
    duration_wall_clock: ~70 min (incluye 7 review-iter ciclos con Rafael)
---

# 04-01 SUMMARY — 7 avatar busts pixel art + asset-naming gate

**Wave 0 cierra ART-01 (deferred Plan 03-05 de Phase 3) + ART-04 (ch6-bust
herencia para Phase 5) + ART-05 (asset-naming convention enforced).**

## Lo entregado

- 7 PNGs `public/assets/ch{0..6}-bust.png` (96×96 RGBA, ~17KB cada uno, total ~118KB)
- Test arquitectural `tests/assets/asset-naming.test.js` (4/4 PASS — wave-0-gate
  GREEN)
- `.gitignore` ya contenía `public/references/` desde Phase 3 (D4-02 privacy
  preservada — `refMain.png` agregado por Rafael durante W0 también queda gitignored)
- Helper temporal `scripts/remove-pixelforge-bg.mjs` (workaround pixelforge
  bg-removal incompleto — ver D4-W0-01)

## Lo no entregado (deferred)

- Polish HSL/saturación de busts: **deferred a W5 manual checklist** si Rafael
  pide ajustes finos sobre la paleta uniforme
- Alt-text era-accurate por chapter en es.json/en.json: **deferred a W5**
  (keys actuales son placeholders Phase 3 — A11Y-06 alt-text wireup hecho,
  drafts §8.2 + ratificación Rafael en W5)
- §5.6 refresh con override eye verde + add refMain.png como reference primaria:
  **deferred a W5 docs update** (ver D4-W0-03 + D4-W0-05)

## Lecciones para W2/W3/W4

1. **Backgrounds opacos full-frame:** usar `forge_background` (NO `forge_sprite`
   para bg). pixelforge auto-removes nada en `forge_background`.
2. **Multi-layer ch4 (4 capas parallax):** generar layer-by-layer con `bg: "auto"`
   y validar transparencia post-call con `scripts/remove-pixelforge-bg.mjs`
   adaptado si bg removal falla.
3. **Identity coherence con Rafael:** SIEMPRE usar `refMain.png` como reference
   primaria + foto era específica + bust del chapter más cercano (ej. ch4
   referencia ch3-bust + ch5-bust).
4. **Iteración esperada por asset:** asumir 2-4 iteraciones. La primera
   generación capturará 70-80% del intent; los ajustes finales requieren
   re-prompting con DIFFs explícitos sobre lo observado.
5. **Bg removal pipeline:** si pixelforge `auto-process` deja bg parcial,
   correr `node scripts/remove-pixelforge-bg.mjs <path>` antes de revisar.
6. **Style preset:** `snes` funcionó bien para 16-bit chunky pixel art portrait.
   Para backgrounds ambient considerar `retro` o `clean` según era.

## Arquitectura confirmada (in-content avatar)

El avatar aparece en dos slots — los 7 PNGs solo se renderizan en chapters que
tienen `Chapter{N}Content` construido. El plan original asumía esto pero merece
explicitar para Rafael:

```
Chapter{N}Content estado actual (post-W0 Phase 4):
✅ ch0  Phase 4 W1 (04-02 DONE) — muestra ch0-bust
✅ ch1  Phase 4 W1 (04-02 DONE) — muestra ch1-bust
⏳ ch2  Phase 4 W2 (04-03 — PRÓXIMA WAVE)
✅ ch3  Phase 3 (DONE)         — muestra ch3-bust
⏳ ch4  Phase 4 W3 (04-04)
⏳ ch5  Phase 4 W4 (04-05)
🔮 ch6  Phase 5 (futura)
```

`StickyAvatar.vue` (Phase 1) sí muestra los 7 al hacer scroll porque solo lee
el array `chapters[activeChapter].avatarSrc` — funciona automáticamente.

## Smoke validation

```powershell
npm run test:run -- tests/assets/asset-naming.test.js  # → 4/4 PASS
npm run test:run                                       # → 264/264 PASS no regresión
npm run dev                                            # → scroll por 7 chapters,
                                                       #   StickyAvatar swappea OK
```
