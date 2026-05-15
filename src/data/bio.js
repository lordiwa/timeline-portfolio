// src/data/bio.js — CON-01 ref a i18n.
//
// Era-specific bio (Phase 6 visual content refresh — Rafael 2026-05-14):
// Cada chapter renderiza solo su época. Shape original `bio.coreKey` (D3-02)
// queda backward-compat apuntando a `bio.core` = summary 1-línea + mantra.
//
// Eras mapping (ratificado 2026-05-14):
//   ch0 (1995, ~7-11 años): DOS + California Games + Warcraft/SC/Magic
//   ch1 (2001, ~14-22 años): HTML/JS/Perl/C++ autodidacta + competitivo SC/WC + BLG QA
//   ch2 (2009, ~25 años): Flash era — BlueLizard/Matte/Joju + advergames
//   ch3 (2013, ~29 años): Pink Parrot UX + ágil ★ LANDING
//   ch4 (2015-18, ~31-34): AR/VR independiente Ecuador BTL + Metrodigi líder
//   ch5 (2022+, ~38): number8 + BairesDev R&D + VivoEnVivo + RocketSnail + Remoose
//   ch6 (2026, ~42): Software Mind data science + IA y agentes + cierre
//
// Mantra global "And always with a smile. 😄" — footer cross-chapter (bio.mantra).

export const bio = {
  // D3-02 backward-compat: tests/data/bio.test.js T1 valida coreKey === 'bio.core'.
  // bio.core en i18n es un summary corto + mantra (para usos no-chapter).
  coreKey: 'bio.core',

  // Era-specific: cada chapter referencia su key via bio.eras[chapter.id].textKey.
  eras: {
    0: { textKey: 'bio.eras.0.text' },
    1: { textKey: 'bio.eras.1.text' },
    2: { textKey: 'bio.eras.2.text' },
    3: { textKey: 'bio.eras.3.text' },
    4: { textKey: 'bio.eras.4.text' },
    5: { textKey: 'bio.eras.5.text' },
    6: { textKey: 'bio.eras.6.text' },
  },

  // Mantra global (footer cross-chapter) — Rafael 2026-05-14: "en todas las fechas".
  mantraKey: 'bio.mantra',
}
