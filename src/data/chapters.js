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
    // §5.1 stub Phase 2 (Rafael aprobó "usa stubs" en gate W2 — refresh
    // real hex post-W5 si Rafael decide ajustar paleta Flash era)
    palette: ['#2a1a4a', '#e0c0ff', '#ff8800', '#8060c0', '#ffaa00'],
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
    // §5.3 stub Phase 2 (Rafael aprobó "usa stubs" en gate W3 — refresh
    // real hex post-W5 si Rafael decide ajustar paleta AR/VR)
    palette: ['#0a0f2e', '#b0d0ff', '#00ffff', '#2050a0', '#142050'],
  },
  {
    id: 5,
    year: 2022,
    era: 'Modern',
    eraKey: 'chapters.5.era',
    titleKey: 'chapters.5.title',
    avatarSrc: '/assets/ch5-bust.png',
    // §5.4 stub Phase 2 (Rafael aprobó "usa stubs" en gate W4 — refresh
    // real hex post-W5 si Rafael decide ajustar paleta Modern)
    palette: ['#ffffff', '#1a1a2e', '#6366f1', '#e2e8f0', '#f5f7fb'],
  },
  {
    id: 6,
    year: 2026,
    era: 'Phaser',
    eraKey: 'chapters.6.era',
    titleKey: 'chapters.6.title',
    avatarSrc: '/assets/ch6-bust.png',
    // §5.5 Phase 5 W0 — paleta synthwave D5-04 locked (deep purple + hot pink + cyan + amber).
    // Source: 05-CONTEXT §Decisions D5-04. NOTA: este edit extiende artefacto Phase 3 (CON-05);
    // ownership del req permanece en Phase 3 — Phase 5 sólo pobla el slot reservado.
    palette: ['#1a0e3d', '#ff3ca6', '#4dffff', '#ffd95c'],
  },
]
