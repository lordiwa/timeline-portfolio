// src/data/projects.js — CON-06 array canonical de proyectos.
// Shape D3-03 (locked): { id, chapterEra, year, titleKey, descKey, link, imageSrc, role, techStack, planetSprite, planetOrbit, planetColor }.
// Phase 5 fields (planetSprite, planetOrbit, planetColor): `null` en Phases 3-4; Phase 5 los pobla para ch6.
// Convención de IDs: chN-<slug> o ppN (pink parrot N) — string corto único.
//
// TASK-013: contenido final de Rafael (.planning/GUION-TEXTOS-FINAL.md PARTE 2).
// 13 proyectos totales. La tarjeta "Empresa propia AR/VR" de ch6 (id ch6-ar-vr)
// SE ELIMINA de este data source — Rafael decidió que ese proyecto queda solo
// en ch4 (ch4-arvr-own). Remoose sí queda en ch5 Y ch6 con ángulos distintos
// a propósito (ch5-remoose = el producto y la sociedad; ch6-remoose = la
// puerta a la IA). La i18n key `projects.ch6-ar-vr.*` queda intacta (no se
// borra) porque varios tests la mockean como fixture — ver hand-off TASK-013.

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
  // ch3 — Pink Parrot 2013 (agencia de publicidad digital, transición Flash→web)
  // TASK-013: reusa la i18n key `projects.pp1.*` — reservada para este proyecto
  // desde Phase 3 (comentario original: "nombre proyecto #1 Pink Parrot").
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'pp1',
    chapterEra: 3,
    year: 2013,
    titleKey: 'projects.pp1.title',
    descKey: 'projects.pp1.desc',
    link: null,
    imageSrc: null,
    role: 'UX Lead',
    techStack: ['CSS3', 'jQuery', 'PHP'],
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

  // ─────────────────────────────────────────────────────────────────
  // ch5 — Modern 2022-23 (BairesDev / number8 / VivoEnVivo / RocketSnail / Remoose)
  // 5 stubs Phase 4 W4 (D4-W4-01): titles=nombre empresa, descs=PENDING marker.
  // Rafael edita CONTENT-CHECKLIST §2.4 → executor refresca i18n keys post-W5.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ch5-bairesdev',
    chapterEra: 5,
    year: 2022,
    titleKey: 'projects.ch5-bairesdev.title',
    descKey: 'projects.ch5-bairesdev.desc',
    link: null,
    imageSrc: null,
    role: 'Frontend Lead',
    techStack: ['Vue 3', 'TypeScript', 'Vitest'],
    planetSprite: null,
    planetOrbit: null,
    planetColor: null,
  },
  {
    id: 'ch5-number8',
    chapterEra: 5,
    year: 2022,
    titleKey: 'projects.ch5-number8.title',
    descKey: 'projects.ch5-number8.desc',
    link: null,
    imageSrc: null,
    role: 'Senior Frontend Engineer',
    techStack: ['React', 'TypeScript'],
    planetSprite: null,
    planetOrbit: null,
    planetColor: null,
  },
  {
    id: 'ch5-vivoenvivo',
    chapterEra: 5,
    year: 2022,
    titleKey: 'projects.ch5-vivoenvivo.title',
    descKey: 'projects.ch5-vivoenvivo.desc',
    link: null,
    imageSrc: null,
    role: 'Frontend Engineer',
    techStack: ['Vue', 'WebRTC'],
    planetSprite: null,
    planetOrbit: null,
    planetColor: null,
  },
  {
    id: 'ch5-rocketsnail',
    chapterEra: 5,
    year: 2023,
    titleKey: 'projects.ch5-rocketsnail.title',
    descKey: 'projects.ch5-rocketsnail.desc',
    link: null,
    imageSrc: null,
    role: 'Frontend Engineer',
    techStack: ['Vue 3', 'Pinia'],
    planetSprite: null,
    planetOrbit: null,
    planetColor: null,
  },
  {
    id: 'ch5-remoose',
    chapterEra: 5,
    year: 2023,
    titleKey: 'projects.ch5-remoose.title',
    descKey: 'projects.ch5-remoose.desc',
    link: null,
    imageSrc: null,
    role: 'QA + Frontend',
    techStack: ['Vue', 'Playwright'],
    planetSprite: null,
    planetOrbit: null,
    planetColor: null,
  },

  // ─────────────────────────────────────────────────────────────────
  // ch6 — Convergencia 2026: 2 planetas-proyecto Phaser scene
  // TASK-013: ch6-ar-vr (Empresa propia AR/VR) SE ELIMINÓ de este data source
  // — Rafael decidió que ese proyecto queda solo en ch4 (ch4-arvr-own); la
  // escena Phaser ahora orbita 2 planetas, no 3 (ver hand-off TASK-013).
  //   ch6-remoose (2023+, full stack)     → planetOrbit:0.5 cyan #4dffff
  //   ch6-software-mind (2023+, QA+AI)    → planetOrbit:0.8 amber #ffd95c
  // Phase 5 W0 — extiende artefacto Phase 3 (CON-06). Ownership permanece en Phase 3.
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'ch6-remoose',
    chapterEra: 6,
    year: 2023,
    titleKey: 'projects.ch6-remoose.title',
    descKey: 'projects.ch6-remoose.desc',
    link: null,
    imageSrc: null,
    role: 'Full Stack Engineer',
    techStack: ['Vue 3', 'Vite', 'TypeScript'],
    planetSprite: '/assets/ch6-planet-remoose.png',
    planetOrbit: 0.5,
    planetColor: '#4dffff',
  },
  {
    id: 'ch6-software-mind',
    chapterEra: 6,
    year: 2023,
    titleKey: 'projects.ch6-software-mind.title',
    descKey: 'projects.ch6-software-mind.desc',
    link: null,
    imageSrc: null,
    role: 'QA Specialist · AI/Data Science Automation',
    techStack: ['Python', 'AWS', 'Playwright'],
    planetSprite: '/assets/ch6-planet-software-mind.png',
    planetOrbit: 0.8,
    planetColor: '#ffd95c',
  },
]
