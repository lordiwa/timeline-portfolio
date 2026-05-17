---
phase: 04.2-ch2-minigame-match3
plan: 01
type: execute
wave: 0
depends_on: ["04.1-ch2-flash-y2k"]
files_created:
  - src/phaser/ch2/index.js
  - src/phaser/ch2/MatchScene.js
  - src/components/Ch2MiniGame.vue
  - tests/components/Ch2MiniGame.test.js
files_modified:
  - src/components/FlashHomePanel.vue
  - src/styles/chapter-themes.css
autonomous: false
---

# Phase 04.2 — ch2 mini-advergame match-3 (iter4)

## Goal

Embed un mini-juego match-3 60-segundos en el HOME panel del ch2 Y2K stage,
debajo del FlashBanner. Phaser instance separada de ch6, lazy-loaded cuando
el HOME panel está activo, destroyed cuando el usuario navega fuera.

Tematización Flash advergame era 2009: tiles cursor / banner / gem / joystick / star.

## Decisiones locked

| ID | Decisión | Razón |
|---|---|---|
| MG-01 | Match-3 6x6 grid | Rafael 2026-05-17: clásico, más espacio para combos |
| MG-02 | Timer 60s acumulado | Era-auténtico arcade short-loop |
| MG-03 | 5 tile types: cursor, banner, gem, joystick, star | Rafael — iconos Flash genéricos sobre brands específicas |
| MG-04 | Tiles renderizados con Phaser Graphics primitives | v1 sin assets externos; pixel-art sprites en commit futuro si quiere |
| MG-05 | Phaser instance separada (NO reuse factory ch6) | Aislamiento total, sin riesgo de cross-interferencia |
| MG-06 | Mini-game vive en HOME panel debajo del FlashBanner (coexiste) | Rafael 2026-05-17 |
| MG-07 | Lazy import Phaser sólo si activePanel='home' | No carga ~1.5MB Phaser cuando user está en ABOUT/WORK/CONTACT |
| MG-08 | Score formula: 3-match=30, 4-match=60, 5+match=120 + cascada×2 | Standard match-3 reward curve |
| MG-09 | prefers-reduced-motion: gameplay activo, tweens reemplazados por instant transitions | A11y mantenida sin matar la experiencia |
| MG-10 | End screen: "TIME UP · SCORE: NNN · YOU SHIPPED N GAMES" + Restart button | Era-flavor + replayability |
| MG-11 | Game canvas size: 360×420 (6 col × 60px tile width, 6 row × 60px tile + 60 header) | Cabe cómodo debajo del banner ~140px + flavor + game ~440px en 100dvh-status |

## Must-haves

- `<Ch2MiniGame>` lazy-imports `src/phaser/ch2/index.js` sólo cuando `panel === 'home'`.
- `MatchScene` ejecuta match-3 standard:
  - swap adyacentes via pointer down → adjacent pointer down
  - match detection 3+ row/col
  - clear → score → gravity (cascade) → refill from top → re-check
  - timer 60s decrementa, final overlay con score + restart
- Cleanup determinista: `onBeforeUnmount` + watch(panel) destroyed game si user sale.
- Tests: mount/unmount, panel toggle, Phaser factory mock.
- Build pasa, tests no regresionan.

## Anti-features (NO en esta iter)

- Sprites pixel-art para tiles (deferred — Graphics primitives v1).
- Audio del juego (deferred — depende del audio system general).
- Power-ups / combos especiales (deferred — solo basic match + cascade).
- Leaderboard / persistencia score (deferred — sesión-only).

## Threat model

| Threat | Mitigation |
|---|---|
| Phaser 1.5MB bundle siempre cargado | Lazy import dynamic gated por panel state |
| Cross-instance interference ch2 ↔ ch6 | Separate factory + nuevo Phaser.Game instance |
| Game runs while user is in another panel (CPU waste) | Watch panel → game.scene.pause/resume |
| Layout shift on canvas mount | Reserved space en CSS (height fijo del frame) |
| Match-3 deadlock (no possible moves) | Auto-shuffle si detect deadlock |
