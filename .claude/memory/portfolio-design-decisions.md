---
name: portfolio-design-decisions
description: "Decisiones de diseño y narrativa del portafolio (post-pivote a vertical + sticky avatar/timeline, 2026-05-12)"
metadata: 
  node_type: memory
  type: project
  originSessionId: a3c05cd2-f639-4218-a425-7b76018cf2c6
---

## Concepto canónico (post-pivote 2026-05-12)

**Portafolio vertical de 7 chapters cronológicos (1995 → 2026)** con dos anclajes sticky permanentes:

- **Avatar pixel-art bust sticky top-left** — un solo slot que swappea entre 7 busts según `activeChapter`; muestra el envejecimiento ~10 → 40 años del usuario.
- **Timeline sticky bottom** — marker móvil + año/era + 7 ticks click-to-navigate. Reemplaza el HUD de dots clásicos.

El contenido del medio scrollea verticalmente; el background morfea entre eras (themes era-auténticos por chapter); el avatar y la timeline permanecen visibles durante todo el recorrido.

**Why:** El pivote vino de horizontal porque (a) vertical es scroll nativo en mobile (portrait y landscape ambos OK, sin overlay bloqueante), (b) iOS lo soporta sin el bug WebKit #243582 que afectaba momentum horizontal, (c) la novedad visual se concentra en los dos anclajes sticky en lugar de en un eje de scroll inusual.

**How to apply:** Toda decisión de UX, requirements, planning debe asumir vertical + sticky anchors. Las referencias a "horizontal", "swipe lateral", "overlay portrait" en docs antiguos están superadas. La timeline ES el HUD; no hay dots separados.

## Idioma
**Bilingüe ES/EN con toggle real (no auto-translate).** Persistencia en localStorage. Actualiza `<html lang>`. Layout testeado con ambos idiomas porque ES corre ~20-30% más largo que EN.

## Vibe visual
**Era-auténtico por chapter** (no estilo único global). El sitio mismo es la demo:
- ch0 terminal verde (1995)
- ch1 HTML 90s crudo (2001-2004)
- ch2 Flash vector (2009)
- ch3 Web 2.0 / arte digital (2013) — **default landing**
- ch4 AR/VR immersive (2015-2018)
- ch5 modern animated (2022-2023)
- ch6 Phaser escena vertical descendente (2026)

Pixel-art entra desde ch2; ch0-1 son HTML/CSS puro.

## Narrativa principal
El arco de roles del usuario:
1. **Desarrollador** (game dev → AR/VR → fullstack)
2. **QA Engineer** (Python, AWS, automation, lead)
3. **Líder** (front-end lead, QA lead, copropietario de VivoEnVivo)
4. **Ahora: AI** — convergencia: aplicar IA para que esos tres mundos se unan

Subrayar la experiencia en **juegos e interacción** como sello distintivo.

**How to apply:** El landing (ch3) no debe ser "Hola soy fullstack" — debe contar la convergencia. Los proyectos por chapter respaldan el arco de roles. Mantra "And always show a smile" es easter egg al llegar a ch6.

## Anti-features ya definidas (no pedir confirmación)
- No character animation pixel art (limitación pixelforge)
- No gameplay con objetivos/score en ch6
- No CMS / backend dinámico
- No blog / artículos largos
- No bento grids, no glassmorphism, no custom cursors, no loading screens elaborados, no múltiples "hire me" CTAs, no dark/light toggle (themes cambian por chapter)
- No Vue Router, no Pinia, no Lenis, no Locomotive Scroll en v1
