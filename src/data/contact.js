// src/data/contact.js — CON-03 datos de contacto hardcoded.
// Decisión D3-10: ContactHUD fixed bottom-right consume estos valores.
// Threat T-CON-03 (open redirect): URLs hardcoded en source code — NO user input runtime,
// NO localStorage, NO query-string. Compromiso: si Rafael cambia un URL, requiere
// commit + redeploy. Aceptable para portafolio estático.
// Source: CONTENT-CHECKLIST §3 — Rafael no ha llenado aún; valores son placeholders.
// Rafael reemplaza estos valores en CONTENT-CHECKLIST §3 y el executor actualiza aquí.

export const contact = {
  email: '',            // CONTENT-CHECKLIST §3 — Rafael fills (e.g., 'rafael@example.com')
  linkedinUrl: '',      // CONTENT-CHECKLIST §3 — e.g., 'https://www.linkedin.com/in/rafael-matovelle'
  githubUrl: '',        // CONTENT-CHECKLIST §3 — e.g., 'https://github.com/rafael-matovelle'
  otherUrl: null,       // CONTENT-CHECKLIST §3 — opcional (Twitter/X, Mastodon, Bluesky, sitio personal)
}
