// src/data/contact.js — CON-03 datos de contacto hardcoded.
// Decisión D3-10: ContactHUD fixed bottom-right consume estos valores.
// Threat T-CON-03 (open redirect): URLs hardcoded en source code — NO user input runtime,
// NO localStorage, NO query-string. Compromiso: si Rafael cambia un URL, requiere
// commit + redeploy. Aceptable para portafolio estático.
// TASK-013: valores finales de Rafael (.planning/GUION-TEXTOS-FINAL.md PARTE 3).
// phone/location son campos NUEVOS (no existían en el shape D3-10 original) —
// decisión explícita de Rafael de mostrar el teléfono en un HUD siempre visible
// pese al riesgo de scraping; ver hand-off de TASK-013 para la discusión completa.

export const contact = {
  email: 'srparca@gmail.com',
  phone: '[REDACTADO]',
  location: 'Quito, Ecuador',
  linkedinUrl: 'https://www.linkedin.com/in/rmatovelle/',
  githubUrl: 'https://github.com/lordiwa',
  otherUrl: null,        // opcional (Twitter/X, Mastodon, Bluesky, sitio personal) — Rafael no lo pidió
}
