// src/config/seo.js — SEO static configuration (D3 SEO-02 + SEO-04)
//
// Source values: CONTENT-CHECKLIST §4.3 (Person schema fields) + §3 (sameAs URLs).
// Si Rafael NO ha llenado el CONTENT-CHECKLIST, valores son strings vacíos o null
// — el JSON-LD queda sintácticamente válido pero semánticamente incompleto.
// Rafael completa via commits a este archivo cuando entregue contenido.
//
// siteUrl PLACEHOLDER: Phase 6 (Firebase Hosting) confirma dominio final.
// Hasta entonces todos los enlaces OG/JSON-LD apuntan a https://SITE_URL.
// Documentado en plan 03-04 notes.site_url_placeholder.
//
// RESEARCH Pattern 2 verbatim — @unhead/vue@^1.11.20 (LOCKED — Vite 5 compat).
// NO modificar siteUrl hasta Phase 6 deploy (T-SITE-URL-LEAK aceptado).

export const seoConfig = {
  siteUrl: 'https://SITE_URL',   // Phase 6 — Rafael confirma dominio

  // Person schema (JSON-LD) — RESEARCH Pattern 2 verbatim
  name: 'Rafael Matovelle',
  jobTitle: '',                    // CONTENT-CHECKLIST §4.3 — Rafael fills (e.g., 'Full Stack Engineer & QA Specialist')
  worksFor: '',                    // CONTENT-CHECKLIST §4.3 — Rafael fills (e.g., 'Software Mind North America')
  address: {
    addressLocality: 'Quito',
    addressCountry: 'EC',
  },
  sameAs: [
    // CONTENT-CHECKLIST §3 — Rafael fills LinkedIn + GitHub URLs (hardcoded por T-CON-03)
    '',  // LinkedIn
    '',  // GitHub
    // Opcional: otherUrl si Rafael decide incluir Twitter/Mastodon/Bluesky
  ].filter(Boolean),               // remove empty strings — JSON-LD sameAs is array of URLs
  knowsLanguage: ['es', 'en'],
}

// Helper para construir el Person schema completo desde el config.
// Centralizado aquí para que App.vue useHead() lo invoque inline.
// JSON-LD es STATIC (no locale-aware): schema.org tolera name/jobTitle en un solo idioma.
// textContent (no innerHTML) — safe por T-SEO-INJ (T-XSS-HEAD mitigated por @unhead/vue).
export function buildPersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': seoConfig.siteUrl,
    name: seoConfig.name,
    jobTitle: seoConfig.jobTitle,
    url: seoConfig.siteUrl,
    image: `${seoConfig.siteUrl}/og-image.png`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: seoConfig.address.addressLocality,
      addressCountry: seoConfig.address.addressCountry,
    },
    worksFor: seoConfig.worksFor
      ? { '@type': 'Organization', name: seoConfig.worksFor }
      : undefined,
    sameAs: seoConfig.sameAs,
    knowsLanguage: seoConfig.knowsLanguage,
  }
}
