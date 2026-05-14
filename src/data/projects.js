// src/data/projects.js — CON-06 array canonical de proyectos.
// Shape D3-03 (locked): { id, chapterEra, year, titleKey, descKey, link, imageSrc, role, techStack, planetSprite, planetOrbit, planetColor }.
// Phase 5 fields (planetSprite, planetOrbit, planetColor): `null` en Phases 3-4; Phase 5 los pobla para ch6.
// Convención de IDs: chN-<slug> o ppN (pink parrot N) — string corto único.
//
// Estado actual:
// - ch3 Pink Parrot (Phase 3 Plan 03-04): PENDING — CONTENT-CHECKLIST §2.2.
// - ch2 Flash era (Phase 4 Plan 04-03): 3 stubs aprobados por Rafael en gate W2
//   ("usa stubs"). Refresh con datos reales en CONTENT-CHECKLIST §2.1 + W5 sign-off.
// - ch4 AR/VR (Phase 4 Plan 04-04): pending §2.3.
// - ch5 Modern (Phase 4 Plan 04-05): pending §2.4.
// - ch6 Phaser scene (Phase 5): pending §2.5 + planet metadata.

export const projects = [
  // ─────────────────────────────────────────────────────────────────
  // ch2 — Flash era 2009 (BlueLizard / Matte CG / Joju Games)
  // Stubs Phase 4 W2 (D4-W2-02): titles = nombre estudio, descs = PENDING marker.
  // Rafael edita CONTENT-CHECKLIST §2.1 → executor refresca i18n keys post-W5.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ch2-bluelizard',
    chapterEra: 2,
    year: 2009,
    titleKey: 'projects.ch2-bluelizard.title',
    descKey: 'projects.ch2-bluelizard.desc',
    link: null,
    imageSrc: null,
    role: 'Gameplay Programmer',
    techStack: ['ActionScript 3', 'Flash CS5'],
    planetSprite: null,
    planetOrbit: null,
    planetColor: null,
  },
  {
    id: 'ch2-matte',
    chapterEra: 2,
    year: 2009,
    titleKey: 'projects.ch2-matte.title',
    descKey: 'projects.ch2-matte.desc',
    link: null,
    imageSrc: null,
    role: 'Gameplay Programmer',
    techStack: ['ActionScript 3'],
    planetSprite: null,
    planetOrbit: null,
    planetColor: null,
  },
  {
    id: 'ch2-joju',
    chapterEra: 2,
    year: 2009,
    titleKey: 'projects.ch2-joju.title',
    descKey: 'projects.ch2-joju.desc',
    link: null,
    imageSrc: null,
    role: 'Gameplay Programmer',
    techStack: ['ActionScript 3', 'Flash CS5'],
    planetSprite: null,
    planetOrbit: null,
    planetColor: null,
  },

  // ─────────────────────────────────────────────────────────────────
  // ch4 — AR/VR 2015-18 (Empresa propia AR/VR + Metrodigi)
  // Stubs Phase 4 W3 (D4-W3-01): titles=nombre estudio, descs=PENDING marker.
  // Rafael edita CONTENT-CHECKLIST §2.3 → executor refresca i18n keys post-W5.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ch4-arvr-own',
    chapterEra: 4,
    year: 2015,
    titleKey: 'projects.ch4-arvr-own.title',
    descKey: 'projects.ch4-arvr-own.desc',
    link: null,
    imageSrc: null,
    role: 'Founder / Tech Lead',
    techStack: ['Unity', 'ARKit', 'Vuforia'],
    planetSprite: null,
    planetOrbit: null,
    planetColor: null,
  },
  {
    id: 'ch4-metrodigi',
    chapterEra: 4,
    year: 2018,
    titleKey: 'projects.ch4-metrodigi.title',
    descKey: 'projects.ch4-metrodigi.desc',
    link: null,
    imageSrc: null,
    role: 'Frontend Engineer',
    techStack: ['React', 'WebGL'],
    planetSprite: null,
    planetOrbit: null,
    planetColor: null,
  },

  // PENDING — ch3 Pink Parrot (CONTENT-CHECKLIST §2.2)
  // Cuando Rafael entregue contenido, el executor añade 1-3 items shape D3-03.
]
