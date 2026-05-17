---
name: reference-photos-available
description: "Las 7 fotos de referencia de Rafael (1995-2026) están en public/references/ — gitignored, listas para artist-creator visión multimodal."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 12ecb221-ea5c-4124-9ef0-bc4f0ec91ee9
---

Las fotos de referencia personales de Rafael están en `public/references/` (gitignored por privacy gate D4-02 — `.gitignore` entry `public/references/`). Disponibles para que `artist-creator` agent las lea con Read tool (visión multimodal) ANTES de prompt forge_sprite para coherencia facial cross-chapter:

| Archivo | Edad aprox | Era / Chapter target | Notas |
|---|---|---|---|
| `public/references/ch01refs/95.png` (87 KB) | ~11 años (1995) | ch0 Terminal | B&N. Bowl cut, cachetón, cejas prominentes casi horizontales, ojos serios, nariz ancha. SIN gorra. Foto agregada 2026-05-14. |
| `public/references/2011.jpg` | ~27 años | ch3 Web 2.0 | Color. |
| `public/references/2016.jpg` | ~32 años | ch4 AR/VR | Color. Cejas gruesas confirmed, ojos almendrados marrón cálido, nariz ancha redondeada. |
| `public/references/2019.jpg` | ~35 años | ch4 AR/VR (tardío) | Color. |
| `public/references/2022.jpeg` | ~38 años | ch5 Modern | Color. Cejas con leve caída exterior, ojos miel-marrón, undercut con cabello ondulado. |
| `public/references/2024.jpg` | ~40 años | ch5 Modern (tardío) | Color. |
| `public/references/2026.jpg` | ~42 años | ch6 Convergencia | Color. |

**Features faciales signature recurrentes (derivados de visión multimodal 95.png + 2016 + 2022 — 2026-05-14):**
- **Cejas:** gruesas, oscuras, casi rectas con arco muy bajo. Juntas hacia el entrecejo. Rasgo más dominante.
- **Cara:** redonda cachetona en infancia; ovalada con mejillas moderadas en adultez.
- **Ojos:** almendrados, marrón cálido / hazel.
- **Nariz:** ancha en la base, punta redondeada.
- **Pelo:** oscuro casi negro; evolución bowl cut niño → undercut con ondulado adulto.

**Por qué importa:** desbloquea [[project_phase-3-execution-status]] Plan 03-05 (batch 7 busts ch0..ch6). Ya hay un bust ch0 generado fielmente desde 95.png (commit `55670fe`). Los 6 restantes (ch1..ch6) pueden generarse con artist-creator leyendo las refs correspondientes + paleta humana §5.6 (`['#e8b894','#b58263','#2a1810','#5c3e2a','#1a0f08','#d4a447','#5a3a1f','#1a0f08']` — clothing-1 cambiado a black warm tras feedback Rafael 2026-05-14).

**Cómo usar:** en cada dispatch artist-creator para un bust ch{N}:
1. Read tool sobre la ref edad-correspondiente
2. Describir lo visto (cara/cejas/ojos/pelo/expresión)
3. Adaptar proporciones a edad target del chapter
4. Mantener features signature recurrentes (cejas prominentes, ojos almendrados) para que se lea como la misma persona envejeciendo
5. Decoración era-signature por chapter (gorra JP en ch0, cabeza rapada en ch1, barba en ch3+, etc.) per Phase 3 §5.6
