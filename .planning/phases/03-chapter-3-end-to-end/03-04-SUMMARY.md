---
phase: 3
plan: 4
subsystem: seo
tags: [unhead, seo, og-meta, json-ld, hreflang, reactive-head, tdd]
dependency_graph:
  requires: ["03-01"]
  provides: ["seo-head-tags", "og-meta", "json-ld-person", "hreflang"]
  affects: ["src/main.js", "src/App.vue", "src/config/seo.js"]
tech_stack:
  added: ["@unhead/vue@1.11.20"]
  patterns: ["createHead+app.use", "useHead reactive functions", "resolveTags() testing", "renderDOMHead testing"]
key_files:
  created:
    - src/config/seo.js
    - public/og-image.png
    - tests/seo/head-tags.test.js
    - tests/seo/json-ld.test.js
  modified:
    - package.json
    - package-lock.json
    - src/main.js
    - src/App.vue
decisions:
  - "@unhead/vue@^1.11.20 LOCKED (NO v2/v3) — peerDeps: vue>=2.7||>=3 sin restriccion Vite; v2/v3 requieren Vite>=6 incompatible con Vite 5.4 del proyecto"
  - "JSON-LD Person schema STATIC en src/config/seo.js — no locale-aware, no user input runtime (T-SEO-INJ mitigado)"
  - "OG meta via JS useHead (NO static injection dist/index.html) — deferred a Phase 6; bots LinkedIn/Slack no ven hasta Phase 6"
  - "siteUrl placeholder https://SITE_URL — Phase 6 confirma dominio real Firebase Hosting"
  - "og-image.png: placeholder 1x1 PNG (68 bytes) — Rafael reemplaza con screenshot 1200x630 post-Plan 03-05"
  - "Tests head-tags usan resolveTags() para T1 (title) + renderDOMHead(@unhead/dom) para T2-T5 (DOM meta/link/script) — DomPlugin no activo por defecto en jsdom sin watcher cycle"
metrics:
  duration: "~30 min"
  completed: "2026-05-13T22:07:52Z"
  tasks_completed: 2
  files_changed: 8
---

# Phase 3 Plan 4: Wave 3 SEO — @unhead/vue + useHead reactive (SEO-01..04) Summary

**One-liner:** Instala `@unhead/vue@1.11.20` y cablea `useHead` en `App.vue` con title/og:*/hreflang/JSON-LD Person reactivos al locale ES↔EN via `() => t(key)`.

---

## Objetivo

Cubrir SEO-01 (OG meta tags), SEO-02 (JSON-LD Person schema), SEO-03 (title + description reactive al locale), SEO-04 (hreflang ES/EN/x-default). Base de "findability + sharing" del portafolio.

---

## Task 4.1: Dependencia + config + placeholder

### Dependencia instalada

```
@unhead/vue@1.11.20
```

**Pre-install verify:** `npm view @unhead/vue@1.11.20 peerDependencies` retorno `{ vue: '>=2.7 || >=3' }` sin restriccion Vite — COMPATIBLE con Vite 5.4. Version pin confirmado (RESEARCH Pitfall 1).

**Post-install verify:** `npm ls @unhead/vue` confirma `@unhead/vue@1.11.20`.

### src/config/seo.js

- `export const seoConfig` con: `siteUrl: 'https://SITE_URL'` (placeholder Phase 6), `name: 'Rafael Matovelle'`, `address: { Quito, EC }`, `knowsLanguage: ['es', 'en']`, `sameAs: [].filter(Boolean)` (URLs PENDING CONTENT-CHECKLIST §3), `jobTitle/worksFor: ''` (PENDING §4.3).
- `export function buildPersonSchema()` — retorna objeto schema.org Person completo con `worksFor` condicional (undefined si vacio), `sameAs` array.
- Header comment ~16 LOC referenciando D3 SEO-02, RESEARCH Pattern 2, CONTENT-CHECKLIST §4.3, Phase 6 pending.

### public/og-image.png

- Placeholder 1x1 PNG transparente (68 bytes) generado via `Buffer.from(base64, 'base64')` en Node.js.
- Rafael reemplaza con screenshot 1200x630 post-Plan 03-05 cuando ch3 este polished visualmente.

### Build post-Task 4.1

```
dist/assets/index-fZRtnjsV.css   10.24 kB
dist/assets/index-B5sR-pZ9.js    135.95 kB (antes de Task 4.2)
✓ built in 1.51s
```

**Commit:** `8689142` — `feat(03-04): install @unhead/vue@1.11.20 + src/config/seo.js + public/og-image.png placeholder`

---

## Task 4.2: TDD RED → GREEN — main.js + App.vue + tests

### TDD Gate Compliance

**RED commit:** `57162e7` — `test(03-04): RED — tests SEO head-tags (5) + json-ld (6) = 11 tests`
- `json-ld.test.js`: 6 tests PASABAN (buildPersonSchema ya existia en Task 4.1)
- `head-tags.test.js`: 5 tests FALLABAN (App.vue sin useHead)

**GREEN commit:** `5dbf2fb` — `feat(03-04): GREEN — useHead reactive SEO completo en App.vue + createHead en main.js`
- 11/11 tests verdes post-GREEN

### src/main.js diff

```javascript
// ANTES
createApp(App).use(i18n).mount('#app')

// DESPUES (orden: createHead → i18n → head → mount)
import { createHead } from '@unhead/vue'
const app = createApp(App)
const head = createHead()
app.use(i18n)
app.use(head)
app.mount('#app')
```

### src/App.vue useHead block

Añadido al final del `<script setup>` (despues de `useResizeObserver`):

```javascript
import { useHead } from '@unhead/vue'
import { seoConfig, buildPersonSchema } from './config/seo'
// ...
const { locale, t } = useI18n()  // t añadido para reactividad SEO

useHead({
  title: () => t('seo.title'),          // REACTIVE — function
  meta: [
    { name: 'description',        content: () => t('seo.description') },
    { property: 'og:title',       content: () => t('seo.title') },
    { property: 'og:description', content: () => t('seo.description') },
    { property: 'og:image',       content: `${seoConfig.siteUrl}/og-image.png` },  // STATIC
    { property: 'og:type',        content: 'website' },
    { property: 'og:url',         content: seoConfig.siteUrl },
  ],
  link: [
    { rel: 'alternate', hreflang: 'es',        href: seoConfig.siteUrl },
    { rel: 'alternate', hreflang: 'en',        href: `${seoConfig.siteUrl}?lang=en` },
    { rel: 'alternate', hreflang: 'x-default', href: seoConfig.siteUrl },
  ],
  script: [
    { type: 'application/ld+json', textContent: JSON.stringify(buildPersonSchema()) },
  ],
})
```

- `title/description/og:title/og:description`: functions `() => t(key)` — REACTIVAS al locale
- `og:image/og:type/og:url`: strings estáticos
- `hreflang`: 3 links estáticos (es, en, x-default)
- `script JSON-LD`: `textContent` (NO innerHTML) — T-SEO-INJ + T-XSS-HEAD mitigados

### Tests añadidos

| Archivo | Tests | Estrategia | Cubre |
|---------|-------|------------|-------|
| `tests/seo/json-ld.test.js` | 6 (T1-T6) | Unitario puro sobre `buildPersonSchema()` | SEO-02 |
| `tests/seo/head-tags.test.js` | 5 (T1-T5) | Mount App.vue + `resolveTags()` (T1) + `renderDOMHead()` (T2-T5) | SEO-01, SEO-03, SEO-04 |

**Nota testing:** `@unhead/vue` v1.x en jsdom con `createHead()` NO inyecta tags al DOM automaticamente sin el watcher cycle del `DomPlugin`. Solucion:
- T1 (title): usa `head.resolveTags()` — API programatica de unhead, verifica tags resueltos sin DOM
- T2-T5 (meta/link/script): usa `renderDOMHead(head, { document })` de `@unhead/dom` para forzar inyeccion DOM antes de `querySelector`

### Build post-Task 4.2

```
dist/assets/index-0_OhHjgk.js    155.34 kB | gzip: 56.36 kB
dist/assets/index-fZRtnjsV.css   10.24 kB  | gzip: 2.66 kB
✓ built in 856ms
```

Crecimiento bundle: +19.39 KB raw / +6.79 KB gzip — dentro del rango esperado del plan (5-8 KB gzip).

---

## Resultados finales

| Metrica | Valor |
|---------|-------|
| Tests baseline pre-plan | 171 |
| Tests nuevos SEO | 11 |
| Total post-plan | **182** |
| Regresiones | 0 |
| Build | Verde |
| @unhead/vue version | 1.11.20 (locked ^1.11.20) |
| Bundle JS gzip delta | +6.79 KB |

---

## Deviaciones del Plan

### Auto-fixed: Estrategia de tests head-tags ajustada (Rule 1)

**Encontrado durante:** Task 4.2 GREEN fase  
**Problema:** `@unhead/vue@1.11.20` con `createHead()` en jsdom no inyecta tags al `document.head` automaticamente — el plugin de Vue registra los head entries pero sin el `DomPlugin` + watcher cycle, los tags no se materializan en el DOM hasta que se llame `renderDOMHead()` explicitamente.  
**Fix:** T1 (title) usa `head.resolveTags()` (API programatica de unhead) en vez de `document.head.querySelector('title')`. T2-T5 usan `renderDOMHead(head, { document })` de `@unhead/dom` antes de los `querySelector` assertions.  
**Archivos modificados:** `tests/seo/head-tags.test.js`  
**Commits:** contenido en `5dbf2fb` (GREEN commit)

---

## Known Stubs

| Stub | Archivo | Razon |
|------|---------|-------|
| `seo.title` ES | `src/i18n/es.json` | CONTENT-CHECKLIST §4.1 — Rafael llena (≤60 chars) |
| `seo.title` EN | `src/i18n/en.json` | CONTENT-CHECKLIST §4.1 — Rafael llena (≤60 chars) |
| `seo.description` ES | `src/i18n/es.json` | CONTENT-CHECKLIST §4.1 — Rafael llena (≤155 chars) |
| `seo.description` EN | `src/i18n/en.json` | CONTENT-CHECKLIST §4.1 — Rafael llena (≤155 chars) |
| `seoConfig.jobTitle` | `src/config/seo.js` | CONTENT-CHECKLIST §4.3 — Rafael llena |
| `seoConfig.worksFor` | `src/config/seo.js` | CONTENT-CHECKLIST §4.3 — Rafael llena |
| `seoConfig.sameAs[]` | `src/config/seo.js` | CONTENT-CHECKLIST §3 — Rafael llena LinkedIn + GitHub URLs |
| `seoConfig.siteUrl` | `src/config/seo.js` | Phase 6 (Firebase Hosting) — dominio real pendiente |
| `public/og-image.png` | `public/og-image.png` | Placeholder 1x1; Rafael reemplaza con screenshot 1200x630 post-Plan 03-05 |

**Impacto en objetivo del plan:** ninguno — el bundle compila y los tests verifican el shape del schema. Los campos vacion generan JSON-LD valido sintacticamente (worksFor = undefined = omitido por JSON.stringify). Cuando Rafael llene es.json + seoConfig.js, no se requiere re-run de este plan.

---

## Pendientes (NO blocking este plan)

### Rafael debe completar (CONTENT-CHECKLIST)

1. **§4.1 SEO copy (ES + EN):** Actualizar `seo.title` y `seo.description` en `src/i18n/es.json` + `en.json` (≤60 / ≤155 chars respectivamente).
2. **§4.3 Person schema:** Actualizar `jobTitle`, `worksFor` en `src/config/seo.js`.
3. **§3 sameAs URLs:** Añadir LinkedIn + GitHub URLs en `seoConfig.sameAs[]` de `src/config/seo.js`.
4. **§4.2 OG image:** Post-Plan 03-05 (avatars pixel art), hacer screenshot 1200x630 del portfolio y reemplazar `public/og-image.png`.

### Wave 4 (Plan 03-05)

- Avatar pixel art batch: 7 busts (ch0-ch6) — incluye `ch3-bust.png` que reemplaza broken-img de `Chapter3Content.vue` (Plan 03-03)
- StickyAvatar placeholder reemplazado con bust real del capitulo activo

### Phase 6 (DEPLOY)

- Reemplazar `siteUrl: 'https://SITE_URL'` en `src/config/seo.js` con dominio real Firebase Hosting
- OG inject post-build en `dist/index.html` (script Node o vite-prerender-plugin) para crawlers LinkedIn/Slack que no ejecutan JS
- Verificacion manual: Google Rich Results Test (search.google.com/test/rich-results) con URL post-deploy
- Verificacion manual: LinkedIn/Slack URL share preview

---

## Commits del Plan

| Hash | Tipo | Descripcion |
|------|------|-------------|
| `8689142` | feat | install @unhead/vue@1.11.20 + src/config/seo.js + public/og-image.png placeholder |
| `57162e7` | test | RED — tests SEO head-tags (5) + json-ld (6) = 11 tests |
| `5dbf2fb` | feat | GREEN — useHead reactive SEO completo en App.vue + createHead en main.js |

---

## Self-Check: PASSED

- [x] `src/config/seo.js` existe: `FOUND`
- [x] `public/og-image.png` existe: `FOUND` (68 bytes)
- [x] `src/main.js` contiene `createHead`: `FOUND`
- [x] `src/App.vue` contiene `useHead`: `FOUND`
- [x] `tests/seo/head-tags.test.js` existe: `FOUND`
- [x] `tests/seo/json-ld.test.js` existe: `FOUND`
- [x] Commit `8689142` existe en git log: `FOUND`
- [x] Commit `57162e7` existe en git log: `FOUND`
- [x] Commit `5dbf2fb` existe en git log: `FOUND`
- [x] Suite 182 tests verdes: `CONFIRMED`
- [x] Build verde: `CONFIRMED`
