// src/data/projects.js — CON-06 array canonical de proyectos.
// Shape D3-03 (locked): { id, chapterEra, year, titleKey, descKey, link, imageSrc, role, techStack, planetSprite, planetOrbit, planetColor }.
// Phase 5 fields (planetSprite, planetOrbit, planetColor): `null` en Phase 3; Phase 5 los pobla para ch6.
// Phase 3 SCOPE: solo proyectos ch3 Pink Parrot (1-3 desde CONTENT-CHECKLIST §2.2). Phase 4 añade ch2/ch4/ch5; Phase 5 añade ch6 con planet metadata.
// Convención de IDs: chN-<slug> o ppN (pink parrot N) — string corto único.
//
// Estado actual: PENDING — CONTENT-CHECKLIST §2.2 (Rafael llena nombres, descripciones, links ch3 Pink Parrot).
// Cuando Rafael entregue contenido, el executor añade 1-3 items siguiendo el shape D3-03 locked.

export const projects = [
  // PENDING — CONTENT-CHECKLIST §2.2 (proyectos ch3 Pink Parrot — 1 a 3 items)
  // Ejemplo de shape esperado (descomentar y llenar cuando Rafael entregue contenido):
  // {
  //   id: 'pp1',
  //   chapterEra: 3,
  //   year: 2013,
  //   titleKey: 'projects.pp1.title',
  //   descKey: 'projects.pp1.desc',
  //   link: null,          // URL del proyecto o null
  //   imageSrc: null,      // Phase 4 puede añadir
  //   role: null,          // e.g., 'UX Lead + Web Developer'
  //   techStack: null,     // e.g., ['CSS3', 'jQuery', 'PHP']
  //   planetSprite: null,  // Phase 5
  //   planetOrbit: null,   // Phase 5
  //   planetColor: null,   // Phase 5
  // },
]
