// src/data/chapters.js — CON-05 single source of truth para los 7 chapters.
// Shape: { id, year, era, eraKey, titleKey, avatarSrc, palette }.
// Decisiones:
//   - D3-04 (locked): shape básico + assets refs; sin helper functions. Joins inline.
//   - D3-06 (locked): palette field doble fuente — CONTENT-CHECKLIST §5 (humano) + replica aquí (programmatic).
//     Cada call a forge_sprite en Plan 03-05 pasa `palette: chapter.palette` explícito (ART-06).
// Consumers Phase 3: Chapter3Content (vía chapters[3]); StickyAvatar (vía avatarSrc cuando se reemplace placeholder); Plan 03-05 (pixelforge palette param).
// Consumers Phase 1 (legacy, NO MIGRADOS aquí): ScrollShell.vue + StickyTimeline.vue duplican el array inline;
//   consolidación queda para Phase 4.
// Paletas ch0 + ch1 extraídas de src/styles/chapter-themes.css.
// Paletas ch2..ch6: arrays vacíos hasta CONTENT-CHECKLIST §5.1-5.5 (Plan 03-05 bloquea en checkpoint:human-input).

export const chapters = [
  {
    id: 0,
    year: 1995,
    era: 'Terminal',
    eraKey: 'chapters.0.era',
    titleKey: 'chapters.0.title',
    avatarSrc: '/assets/ch0-bust.png',
    // Terminal CRT: negro + verde fósforo P1 (de chapter-themes.css --c-bg + --c-fg)
    palette: ['#000000', '#00ff41'],
  },
  {
    id: 1,
    year: 2001,
    era: 'HTML 90s',
    eraKey: 'chapters.1.era',
    titleKey: 'chapters.1.title',
    avatarSrc: '/assets/ch1-bust.png',
    // GeoCities/Angelfire: navy + magenta + amarillo + blanco (de chapter-themes.css)
    palette: ['#000080', '#ff00ff', '#ffff00', '#ffffff'],
  },
  {
    id: 2,
    year: 2009,
    era: 'Flash',
    eraKey: 'chapters.2.era',
    titleKey: 'chapters.2.title',
    avatarSrc: '/assets/ch2-bust.png',
    // PENDING — CONTENT-CHECKLIST §5.1 (Rafael aprueba paleta Flash era)
    palette: [],
  },
  {
    id: 3,
    year: 2013,
    era: 'Web 2.0',
    eraKey: 'chapters.3.era',
    titleKey: 'chapters.3.title',
    avatarSrc: '/assets/ch3-bust.png',
    // PENDING — CONTENT-CHECKLIST §5.2 (Rafael aprueba paleta Web 2.0 — chapter landing)
    palette: [],
  },
  {
    id: 4,
    year: 2015,
    era: 'AR/VR',
    eraKey: 'chapters.4.era',
    titleKey: 'chapters.4.title',
    avatarSrc: '/assets/ch4-bust.png',
    // PENDING — CONTENT-CHECKLIST §5.3 (Rafael aprueba paleta AR/VR)
    palette: [],
  },
  {
    id: 5,
    year: 2022,
    era: 'Modern',
    eraKey: 'chapters.5.era',
    titleKey: 'chapters.5.title',
    avatarSrc: '/assets/ch5-bust.png',
    // PENDING — CONTENT-CHECKLIST §5.4 (Rafael aprueba paleta Modern animated)
    palette: [],
  },
  {
    id: 6,
    year: 2026,
    era: 'Phaser',
    eraKey: 'chapters.6.era',
    titleKey: 'chapters.6.title',
    avatarSrc: '/assets/ch6-bust.png',
    // PENDING — CONTENT-CHECKLIST §5.5 (Rafael aprueba paleta Phaser space)
    palette: [],
  },
]
