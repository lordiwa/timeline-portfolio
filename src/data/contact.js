// src/data/contact.js — CON-03 datos de contacto hardcoded.
// Decisión D3-10: ContactHUD fixed bottom-right consume estos valores.
// Threat T-CON-03 (open redirect): URLs hardcoded en source code — NO user input runtime,
// NO localStorage, NO query-string. Compromiso: si Rafael cambia un URL, requiere
// commit + redeploy. Aceptable para portafolio estático.
// TASK-013: valores finales de Rafael (.planning/GUION-TEXTOS-FINAL.md PARTE 3).
// location es campo NUEVO (no existía en el shape D3-10 original).
// TASK-023: se eliminó el campo phone — pedido directo de Rafael 2026-07-28
// ("sacalo"), ver hand-off de TASK-023. El número que estaba cargado además
// era incorrecto; no se reemplaza por el correcto en un repo público indexable.

export const contact = {
  email: 'srparca@gmail.com',
  location: 'Quito, Ecuador',
  linkedinUrl: 'https://www.linkedin.com/in/rmatovelle/',
  githubUrl: 'https://github.com/lordiwa',
  otherUrl: null,        // opcional (Twitter/X, Mastodon, Bluesky, sitio personal) — Rafael no lo pidió
}
