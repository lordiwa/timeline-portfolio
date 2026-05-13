# Phase 3: Chapter 3 End-to-End — Research

**Investigado:** 2026-05-13
**Dominio:** Pixel art portrait generation, Vue 3 SEO, nested scroll UX, Web 2.0 skeumorphic CSS
**Confianza global:** MEDIUM-HIGH (stack verificado; hallazgos críticos sobre @unhead/vue v1 vs v3 y scroll-snap nested son HIGH)

---

## Resumen

Phase 3 entrega el landing polished del portafolio: el chapter 3 (Web 2.0, 2013) que recibe al recruiter. Involucra cinco dominios técnicos distintos que el planner debe coordinar: (1) pipeline de pixel art para generar 7 busts consistentes usando `forge_sprite` con el parámetro `references:`; (2) arquitectura de datos con 4 archivos `src/data/*.js` separados; (3) componentes nuevos (`Chapter3Content`, `ContactHUD`, `ProjectCard`) con layout 2-col / stacked; (4) SEO completo con `@unhead/vue@^1.11.20` (no v3 — incompatible con Vite 5); y (5) resolución del comportamiento de scroll-snap anidado en mobile (D3-12).

**Recomendación primaria:** Usar `@unhead/vue@^1.11.20` (no v3 — requiere Vite ≥6.4.2). Generar los 7 busts con `forge_sprite` + `references:` (archivo del bust anterior como ancla visual). La OG image se produce con un screenshot manual post-execute de ch3 (no build-time automation — innecesario para este scope). El nested scroll de D3-12 se implementa como `overflow-y: auto` en el contenido interno de ch3 mobile, sin JS adicional; el scroll chaining al outer snap container ocurre nativamente cuando el scroll interno está agotado.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Data Architecture**
- D3-01: Archivos separados en `src/data/`: `chapters.js`, `projects.js`, `bio.js`, `contact.js`
- D3-02: Texto bilingual vive en `src/i18n/es.json` + `en.json`. Data files solo llevan refs (`titleKey`, `descKey`) + datos no-traducibles
- D3-03: Project shape rico preparado para Phase 5 Phaser: `{ id, chapterEra, year, titleKey, descKey, link?, imageSrc?, role?, techStack?, planetSprite?, planetOrbit?, planetColor? }`. Campos planet* son null en Phase 3
- D3-04: `chapters.js` shape básico + assets refs: `{ id, year, era, eraKey, titleKey, avatarSrc, themeColor? }`. Sin helper functions — joins inline

**Pixel Art Pipeline**
- D3-05: Batch 7 busts en Phase 3. Blocking input: 7 paletas + age refs aprobadas antes de execute
- D3-06: Paleta doble fuente: CONTENT-CHECKLIST §5 + `chapters.js` field `palette: ['#...', '#...']`. Cada call a pixelforge pasa `palette: chapter.palette` explícito
- D3-07: Prompt structure base + diff per chapter. `BASE_PROMPT_AVATAR` template invariante. Diffs incrementales: `age, hair_state, era_clothing, accessories`
- D3-08: Anchor visual: 1 foto real de Rafael ~30 años en `public/assets/.refs/rafael-age30.{jpg,png}` + entry en `.gitignore`. Solo pixelforge la consume; los outputs `ch{N}-bust.png` SÍ se commitean

**Layout & UI**
- D3-09: Ch3 layout 2 columnas desktop ≥768px / stacked mobile <600px. Opción A: avatar ch3 a `left: 140px+` (después del timeline ~120px de ancho) — default recomendado
- D3-10: ContactHUD: `position: fixed; bottom: env(safe-area-inset-bottom, 0); right: var(--sp-md); z-index: 40`. 3 iconos clicables, tap target 44×44, `rel="noopener noreferrer"`. Invariante a chapter
- D3-11: Project cards skeumorphic Web 2.0 explícito: gradient glossy, `box-shadow: inset 0 1px 0 rgba(255,255,255,0.5)`, `text-shadow: 0 1px 0 rgba(255,255,255,0.7)`, `border-radius: 12-16px`. Lobster para titles
- D3-12: Ch3 mobile abandona `height: 100dvh` strict; permite `overflow-y: auto` interno. Fallback si causa fricción: `line-clamp` con botón "leer más"

### Claude's Discretion
- SEO implementation: librería, JSON-LD strategy, OG image source — planner elige con justificación
- Mantra easter egg ch6 (CON-04): default deferred a Phase 5; planner puede entregar placeholder si quiere
- StickyTimeline panel theming override: opcional, no blocking

### Deferred Ideas (OUT OF SCOPE)
- Pixel art de fondos otros chapters (Phase 4)
- Phaser ch6 (Phase 5)
- Deploy (Phase 6)
- Texto de bio/proyectos (Rafael llena CONTENT-CHECKLIST)
- iOS Safari verification (deferred precedent Phase 1 Plan 07)
- Mantra easter egg ch6 visual design (Phase 5 si difiere Phase 3)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Descripción | Soporte en research |
|----|-------------|---------------------|
| CON-01 | Bio core ~1-2 párrafos renderizada en ch3 con estilo de era | `bio.js` + i18n keys `bio.*`; componente `Chapter3Content` |
| CON-02 | 1-3 proyectos Pink Parrot mapeados a ch3 | `projects.js` filtrado por `chapterEra: 3`; componente `ProjectCard` |
| CON-03 | Contact info persistente y accesible desde cualquier chapter | Componente `ContactHUD` fixed bottom-right; `contact.js` |
| CON-04 | Mantra "And always show a smile" easter egg ch6 | Diferido a Phase 5 por decisión del planner (D3-12 CONTEXT) |
| CON-05 | `src/data/chapters.js` fuente única de verdad | Research §Architecture Patterns — data shape definitivo |
| CON-06 | `src/data/projects.js` con locale-aware copy + asset refs | Research §Architecture Patterns — project shape rico D3-03 |
| ART-01 | 7 retratos bust consistentes, solo edad cambia | Research §Pixel Art Pipeline — `references:` parameter + BASE_PROMPT + diffs |
| ART-05 | Naming `ch{N}-{descriptor}[-{variant}].png` en `public/assets/` | Convención locked desde Phase 1; bust = `ch{N}-bust.png` |
| ART-06 | Palette governance: paleta por chapter antes de generar | Research §Pixel Art Pipeline — `palette:` param + CONTENT-CHECKLIST gate |
| SEO-01 | OG meta tags (`og:title`, `og:description`, `og:image`, `og:type`) | Research §SEO — `@unhead/vue@^1.11.20` + `useHead` |
| SEO-02 | JSON-LD Person schema en `<head>` | Research §SEO — `useHead({ script: [{ type: 'application/ld+json', textContent: '...' }] })` |
| SEO-03 | `<title>` y meta description por locale | Research §SEO — `useHead` reactive con `locale` ref de vue-i18n |
| SEO-04 | `<link rel="alternate" hreflang>` para ES y EN | Research §SEO — `useHead({ link: [{ rel: 'alternate', hreflang: 'es', href: '...' }] })` |
</phase_requirements>

---

## Mapa de Responsabilidad Arquitectural

| Capacidad | Tier primario | Tier secundario | Justificación |
|-----------|---------------|-----------------|---------------|
| Datos bio/proyectos/contacto | `src/data/*.js` (estático) | `src/i18n/*.json` (texto) | Separación dato-texto establecida en Phase 2; joins inline por D3-04 |
| SEO meta tags reactivos | Browser (head DOM, `@unhead/vue`) | — | SPA sin SSR; las meta tags se inyectan via JS en el cliente; crawlers sociales ven el `<head>` estático del build |
| JSON-LD schema | Browser (`useHead` script tag) | `index.html` (stub estático opcional) | Crawlers de Google ejecutan JS limitado; los bots de LinkedIn/Slack no; solución pragmática: JSON-LD en el `<head>` del bundle pre-rendered |
| Pixel art generation | pixelforge-mcp (Gemini) | Adobe MCP (post-proceso) | Tool contracts establecidos; `forge_sprite` + bg removal para busts |
| Layout ch3 | `Chapter3Content.vue` (scoped CSS) | `chapter-themes.css` (tokens) | El layout 2-col/stacked es específico de ch3; usa tokens Phase 2 como base |
| ContactHUD | `ContactHUD.vue` (fixed, z-40) | `contact.js` (data) | Análogo arquitectural a LangToggle; invariante a chapter; posición fija viewport |
| Scroll nested ch3 mobile | CSS puro (`overflow-y: auto` en child) | JS fallback opcional si friction | El scroll chaining natural del browser es suficiente; no requiere JS de scroll-chaining |

---

## Stack Estándar

### Core — librerías a instalar en Phase 3

| Librería | Versión | Propósito | Por qué este |
|----------|---------|-----------|--------------|
| `@unhead/vue` | `^1.11.20` | Gestión reactiva del `<head>`: title, meta, JSON-LD, hreflang | Única librería Vue 3 native para head management compatible con Vite 5; v3 requiere Vite ≥6.4.2 |

> **CRITICAL:** Las versiones `@unhead/vue@2.x` y `@unhead/vue@3.x` requieren `vue >=3.5.18` (v2) y `vite >=6.4.2` (v3). El proyecto usa Vite `^5.4.0`. Usar **exactamente** `@unhead/vue@^1.11.20` (`peerDependencies: { vue: '>=2.7 || >=3' }`, sin restricción de Vite). [VERIFIED: npm registry]

### Stack existente reutilizado (no instalar)

| Librería | Versión actual | Uso en Phase 3 |
|----------|---------------|----------------|
| `vue-i18n` | `^11.4.2` | `useI18n()` + `t()` para todo el texto de bio/proyectos/contacto |
| `@vueuse/core` | `^14.3.0` | `useRafFn`, `useResizeObserver` ya disponibles |
| `@fontsource/lobster` | `^5.2.8` | Ya instalado en Phase 2 — titles Web 2.0 en project cards |
| `vitest` | `^4.1.6` | Framework de tests existente |

### No usar

| Alternativa rechazada | Razón |
|----------------------|-------|
| `@unhead/vue@^2` o `@unhead/vue@^3` | Requieren Vite ≥6.4.2; proyecto en Vite 5 |
| `vue-meta` | Mantenimiento bajo; legacy; no recomendado para vue-i18n v11 |
| `@vueuse/head` | Sunset/deprecated; redirected a `@unhead/vue` |
| Mutación manual `document.title` via watcher | Funciona para title pero no provee API unificada para JSON-LD ni hreflang |

**Instalación Phase 3:**
```bash
npm install @unhead/vue@^1.11.20
```

**Verificación de versión:**
```bash
npm view @unhead/vue version
# output esperado: 1.11.20
npm view @unhead/vue peerDependencies
# output esperado: { vue: '>=2.7 || >=3' }
```

[VERIFIED: npm registry — `@unhead/vue@1.11.20` peerDependencies: `{ vue: '>=2.7 || >=3' }`]

---

## Architecture Patterns

### Diagrama de flujo de datos — Phase 3

```
Rafael (CONTENT-CHECKLIST)
  ├── Bio ES/EN ──────────────────→ src/i18n/es.json / en.json
  ├── Proyectos ch3 ───────────────→ src/i18n/*.json (text) + src/data/projects.js (refs/meta)
  ├── Contacto ────────────────────→ src/data/contact.js
  ├── Paletas (7 chapters + avatar)→ src/data/chapters.js (palette field) + CONTENT-CHECKLIST §5
  └── Foto ~30 años ───────────────→ public/assets/.refs/rafael-age30.jpg (.gitignored)

pixelforge-mcp (artist-creator agent)
  foto ~30 años + BASE_PROMPT + diff(ch3)
  ├── forge_sprite(ch0-bust) → public/assets/ch0-bust.png
  ├── forge_sprite(ch1-bust) → public/assets/ch1-bust.png
  ├── forge_sprite(ch2-bust) → public/assets/ch2-bust.png
  ├── forge_sprite(ch3-bust) → public/assets/ch3-bust.png  ← landing bust
  ├── forge_sprite(ch4-bust) → public/assets/ch4-bust.png
  ├── forge_sprite(ch5-bust) → public/assets/ch5-bust.png
  └── forge_sprite(ch6-bust) → public/assets/ch6-bust.png

src/data/chapters.js  ←── canonical list (reemplaza arrays hardcoded en 3 componentes)
  ↓ import en ScrollShell, StickyTimeline, StickyAvatar

src/data/projects.js  ←── filtrado por chapterEra en Chapter3Content
  ↓ import en Chapter3Content (Phase 3), otras secciones (Phase 4)

App.vue (useHead wired via @unhead/vue createHead)
  ├── SEO: title + description (reactive, locale-aware)
  ├── SEO: og:title / og:description / og:image / og:type
  ├── SEO: JSON-LD Person schema (static, injected as script)
  └── SEO: hreflang ES/EN alternate links

ContactHUD.vue (fixed bottom-right, z-40, invariante)
  └── contact.js → email mailto: + LinkedIn + GitHub links

Chapter3Content.vue (insertado en <section data-chapter="3">)
  ├── StickyAvatar → img src="/assets/ch3-bust.png"
  ├── bio i18n keys → t('bio.core')
  └── ProjectCard × 1-3 (data de projects.js filtrada)
```

### Estructura de archivos nuevos en Phase 3

```
src/
├── data/
│   ├── chapters.js          ← CON-05: array canonical de 7 chapters
│   ├── projects.js          ← CON-06: array de proyectos por era
│   ├── bio.js               ← expone bioKey ref a i18n
│   └── contact.js           ← email, linkedinUrl, githubUrl, otherUrl?
├── components/
│   ├── Chapter3Content.vue  ← layout 2-col/stacked + bio + cards
│   ├── ContactHUD.vue       ← fixed bottom-right, 3 iconos
│   └── ProjectCard.vue      ← skeumorphic Web 2.0 reutilizable
public/
├── assets/
│   ├── ch0-bust.png         ← ART-01 (7 archivos)
│   ├── ch1-bust.png
│   ├── ch2-bust.png
│   ├── ch3-bust.png
│   ├── ch4-bust.png
│   ├── ch5-bust.png
│   ├── ch6-bust.png
│   └── .refs/               ← .gitignored — foto privada de Rafael
│       └── rafael-age30.jpg
└── og-image.png             ← 1200×630 screenshot manual post-execute
```

### Pattern 1: Data files con refs a i18n (D3-01/D3-02)

**Qué hace:** Separa metadatos no-traducibles de texto traducible. Los data files llevan keys que vue-i18n resuelve.

**Cuándo usar:** Siempre — es el contrato establecido en D3-01/D3-02.

```javascript
// src/data/chapters.js — CON-05
// Source: D3-04 locked decision (03-CONTEXT.md)
export const chapters = [
  { id: 0, year: 1995, era: 'Terminal',  eraKey: 'chapters.0.title', avatarSrc: '/assets/ch0-bust.png', palette: ['#000000', '#00ff41'] },
  { id: 1, year: 2001, era: 'HTML 90s',  eraKey: 'chapters.1.title', avatarSrc: '/assets/ch1-bust.png', palette: ['#000080', '#ff00ff', '#ffff00'] },
  { id: 2, year: 2009, era: 'Flash',     eraKey: 'chapters.2.title', avatarSrc: '/assets/ch2-bust.png', palette: [] }, // §5.1 pendiente Rafael
  { id: 3, year: 2013, era: 'Web 2.0',   eraKey: 'chapters.3.title', avatarSrc: '/assets/ch3-bust.png', palette: [] }, // §5.2 pendiente Rafael
  { id: 4, year: 2015, era: 'AR/VR',     eraKey: 'chapters.4.title', avatarSrc: '/assets/ch4-bust.png', palette: [] }, // §5.3 pendiente Rafael
  { id: 5, year: 2022, era: 'Modern',    eraKey: 'chapters.5.title', avatarSrc: '/assets/ch5-bust.png', palette: [] }, // §5.4 pendiente Rafael
  { id: 6, year: 2026, era: 'Phaser',    eraKey: 'chapters.6.title', avatarSrc: '/assets/ch6-bust.png', palette: [] }, // §5.5 pendiente Rafael
]
```

```javascript
// src/data/projects.js — CON-06
// Source: D3-03 locked decision (03-CONTEXT.md)
// Phase 3: solo los proyectos ch3 tienen contenido real (del CONTENT-CHECKLIST)
// Phase 4 añade ch0-2,4,5; Phase 5 añade planet* fields para ch6
export const projects = [
  {
    id: 'pp-project-1',
    chapterEra: 3,           // ← join key con chapters.js
    year: 2013,
    titleKey: 'projects.pp1.title',
    descKey: 'projects.pp1.desc',
    link: null,              // Rafael llena desde CONTENT-CHECKLIST §2.2
    imageSrc: null,          // opcional — asset si existe
    role: null,              // 'UX Lead', etc.
    techStack: null,         // ['Photoshop', 'CSS3', 'jQuery']
    planetSprite: null,      // Phase 5: sprite del planeta en ch6
    planetOrbit: null,       // Phase 5: radio de órbita
    planetColor: null,       // Phase 5: color del planeta
  },
  // ... más proyectos ch3 desde CONTENT-CHECKLIST §2.2
]
```

```javascript
// src/data/contact.js — CON-03
// Source: D3-10 (ContactHUD shape)
export const contact = {
  email: '',            // Rafael llena — CONTENT-CHECKLIST §3
  linkedinUrl: '',      // Rafael llena
  githubUrl: '',        // Rafael llena
  otherUrl: null,       // opcional 4to slot
}
```

```javascript
// src/data/bio.js
// bio text vive en i18n; este archivo solo exporta la key
export const bio = {
  coreKey: 'bio.core',   // → t('bio.core') en el componente
}
```

### Pattern 2: @unhead/vue — SEO completo (SEO-01..04)

**Qué hace:** Gestiona `<head>` reactivo (title, meta, JSON-LD, hreflang) con un único punto de montaje en `App.vue`. [VERIFIED: unhead.unjs.io/docs + npm registry]

**Setup en `main.js`:**

```javascript
// main.js
import { createApp } from 'vue'
import { createHead } from '@unhead/vue'
import { i18n } from './i18n'
import App from './App.vue'

const app = createApp(App)
const head = createHead()
app.use(i18n)
app.use(head)
app.mount('#app')
```

**`App.vue` — montaje reactivo con locale:**

```javascript
// App.vue <script setup> — SEO reactive wiring
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t, locale } = useI18n()
const siteUrl = 'https://rafael.matovelle.dev'  // Rafael confirma URL final

// Título y descripción reactivos al locale
useHead({
  title: () => t('seo.title'),
  meta: [
    { name: 'description', content: () => t('seo.description') },
    // OG (SEO-01)
    { property: 'og:title',       content: () => t('seo.title') },
    { property: 'og:description', content: () => t('seo.description') },
    { property: 'og:image',       content: `${siteUrl}/og-image.png` },
    { property: 'og:type',        content: 'website' },
    { property: 'og:url',         content: siteUrl },
  ],
  // hreflang (SEO-04)
  link: [
    { rel: 'alternate', hreflang: 'es', href: siteUrl },
    { rel: 'alternate', hreflang: 'en', href: `${siteUrl}?lang=en` },
    { rel: 'alternate', hreflang: 'x-default', href: siteUrl },
  ],
  // JSON-LD Person schema (SEO-02)
  script: [
    {
      type: 'application/ld+json',
      textContent: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': siteUrl,
        name: 'Rafael Matovelle',        // Rafael confirma nombre público
        jobTitle: '',                     // Rafael llena — CONTENT-CHECKLIST §4.3
        url: siteUrl,
        image: `${siteUrl}/og-image.png`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Quito',
          addressCountry: 'EC',
        },
        worksFor: {
          '@type': 'Organization',
          name: '',                        // Rafael llena — CONTENT-CHECKLIST §4.3
        },
        sameAs: [
          '',                              // LinkedIn URL — CONTENT-CHECKLIST §3
          '',                              // GitHub URL — CONTENT-CHECKLIST §3
        ],
        knowsLanguage: ['es', 'en'],
      }),
    },
  ],
})
```

> **Nota sobre SPA y crawlers:** Los bots de LinkedIn y Slack **no ejecutan JavaScript** — solo leen el HTML crudo. La OG image en el `<head>` del `index.html` generado por `npm run build` estará vacía salvo que se use prerendering. La solución pragmática para este scope (portafolio personal estático sin CDN/Edge) es editar el `index.html` del dist manualmente o con un pequeño script post-build para inyectar las meta tags estáticas. Ver §Pitfalls — Pitfall 3. [VERIFIED: prerender.io docs + thomashunter.name]

### Pattern 3: forge_sprite con `references:` para consistencia de personaje (ART-01)

**Qué hace:** Usa el bust del chapter anterior como referencia visual para mantener coherencia de personaje. [VERIFIED: github.com/freema/pixelforge-mcp README]

**Protocol para los 7 busts:**

```
Paso 1: Derivar BASE_PROMPT_AVATAR con artist-creator ANTES del batch.
        El planner lockea el BASE_PROMPT en 03-PLAN.md antes de delegar.

BASE_PROMPT_AVATAR (template, planner completa con info de Rafael):
  "pixel art character bust portrait, 16-bit style, [skin tone: from CONTENT-CHECKLIST §5.6],
   [build: from CONTENT-CHECKLIST], [facial features: consistent], warm and friendly expression,
   pixelated clean edges, 96x96 pixel resolution, transparent background will be applied,
   consistent character identity across all ages — same person aging"

Paso 2: Por cada chapter, derivar el DIFF:
  ch0 (age ~10): "age: around 10 years old, short dark hair, simple childhood clothing, 
                  wide curious eyes, slight baby face"
  ch1 (age ~15): "age: around 15 years old, slightly longer hair, casual 2000s teen clothing"
  ch2 (age ~22): "age: around 22 years old, [hair from Rafael], casual programmer clothing 2009 era"
  ch3 (age ~26): "age: around 26 years old, [hair], semi-professional Web 2.0 era clothing,
                  light beard or clean shaven per photo"
  ch4 (age ~30): "age: around 30 years old, anchor age per reference photo, professional attire"
  ch5 (age ~36): "age: around 36 years old, slightly grayed temples, modern professional attire"
  ch6 (age ~40): "age: around 40 years old, distinguished, some gray hair, confident expression"

Paso 3: forge_sprite call pattern:
  - ch0 (PRIMER BUST — sin references):
    forge_sprite(
      description: BASE_PROMPT + " " + DIFF_ch0,
      background: "sky",           ← preset nombrado, NO "white" o "black"
      outputPath: "public/assets/ch0-bust.png",
      palette: chapters[0].palette,
    )
    process_sprite(bg_remove) + optimize_sprite(96x96)

  - ch3 (ANCHOR — usar foto de Rafael si pixelforge soporta references como URL):
    forge_sprite(
      description: BASE_PROMPT + " " + DIFF_ch3,
      background: "sky",
      references: ["public/assets/.refs/rafael-age30.jpg"],  ← foto privada como guía
      outputPath: "public/assets/ch3-bust.png",
      palette: chapters[3].palette,
    )
    process_sprite(bg_remove) + optimize_sprite(96x96)

  - ch1..ch6 restantes: usar references: ["public/assets/ch3-bust.png"] como ancla de personaje
    (el ch3 anchor al ~30 años sirve como referencia bidireccional: aging-down y aging-up)
```

**CRÍTICO — Presets de background para `forge_sprite`:**

```
✅ USAR: "night", "forest", "sky", "dungeon", "ocean", "sand", "snow", "lava"
❌ NUNCA: "black", "white" → Gemini ignora el color y bg removal falla

Para busts humanos con ropa visible: "sky" es el preset más neutral
Para personaje joven (ch0/ch1): "forest" o "sky"
Para eras oscuras (ch4/ch6): "night" o "dungeon" como contexto
```

[VERIFIED: `.claude/skills/crear-arte-pixelforge.md` + CLAUDE.md §6.2]

### Pattern 4: Layout ch3 — 2-col / stacked (D3-09)

**Qué hace:** Coloca avatar+meta izq (fija relativa al chapter, no al viewport) y bio+projects der (scrolleable en mobile).

```css
/* Chapter3Content.vue <style scoped> */
/* Desktop ≥ 768px: dos columnas */
.ch3-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--sp-lg);
  padding-left: 160px; /* D3-09 Opción A: dejar espacio al StickyTimeline ~120px + margen */
  padding-right: var(--sp-lg);
  height: 100%;         /* ch3 desktop conserva 100dvh heredado del .chapter-section */
  overflow-y: hidden;
}

/* Columna izquierda: avatar meta — no hace scroll independiente */
.ch3-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
}

/* Columna derecha: bio + projects — scroll interno solo en mobile */
.ch3-content {
  overflow-y: hidden;   /* desktop: no scroll interno */
}

/* Mobile < 600px: stacked + scroll interno */
@media (max-width: 599px) {
  .ch3-layout {
    grid-template-columns: 1fr;
    padding-left: 60px; /* espacio para StickyTimeline mobile (year only ~44px) */
    height: auto;       /* D3-12: abandona 100dvh strict en mobile */
  }

  .ch3-content {
    overflow-y: auto;   /* D3-12: scroll interno permitido */
  }
}
```

**Nota sobre scroll-snap + nested overflow-y en mobile (D3-12):**

El comportamiento investigado es: cuando el `overflow-y: auto` del `.ch3-content` está agotado (user llegó al final del scroll interno), el evento de scroll **propaga al outer snap container** de forma natural en Chrome y Firefox modernos. Este "scroll chaining" ocurre sin JS adicional. El `scroll-snap-stop: always` del `.chapter-section` solo se activa cuando el snap container externo recibe el evento — es decir, DESPUÉS de que el scroll interno se agotó. [VERIFIED: MDN CSS scroll-snap docs + W3C CSSWG issue #9187]

**Caveat cross-browser:** El comportamiento de nested scroll con `mandatory` es browser-specific y el W3C CSSWG lo reconoce como ambiguo en su spec (issue #9187, abierto agosto 2023). Chrome y Firefox modernos implementan scroll chaining de forma consistente. iOS Safari puede diferir — DEFERRED por precedente Phase 1 Plan 07. [CITED: github.com/w3c/csswg-drafts/issues/9187]

**Fallback D3-12.alt (si scroll-chaining causa fricción):**
```css
/* En chapter-section con data-chapter="3" en mobile: */
@media (max-width: 599px) {
  [data-chapter="3"] .ch3-content {
    /* Fallback: line-clamp + botón "leer más" */
    overflow-y: hidden;
  }
  [data-chapter="3"] .ch3-bio {
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

### Pattern 5: ContactHUD (CON-03, D3-10)

**Qué hace:** HUD fijo bottom-right análogo arquitectural a LangToggle (invariante a chapter).

```vue
<!-- ContactHUD.vue — D3-10 verbatim -->
<script setup>
import { useI18n } from 'vue-i18n'
import { contact } from '@/data/contact'

const { t } = useI18n()
</script>

<template>
  <div class="contact-hud" :aria-label="t('contact.hudAria')">
    <a
      :href="`mailto:${contact.email}`"
      class="contact-icon"
      :aria-label="t('contact.emailAria')"
      :title="t('contact.emailTooltip')"
    >
      <!-- SVG email icon -->
    </a>
    <a
      :href="contact.linkedinUrl"
      class="contact-icon"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('contact.linkedinAria')"
    >
      <!-- SVG LinkedIn icon -->
    </a>
    <a
      :href="contact.githubUrl"
      class="contact-icon"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('contact.githubAria')"
    >
      <!-- SVG GitHub icon -->
    </a>
  </div>
</template>

<style scoped>
.contact-hud {
  position: fixed;
  bottom: env(safe-area-inset-bottom, 0);
  right: var(--sp-md);
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
}

.contact-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;   /* A11Y tap target mínimo */
  height: 44px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  color: var(--c-fg);
  text-decoration: none;
  transition: background 150ms ease;
}

.contact-icon:hover {
  background: var(--c-accent);
  color: var(--c-bg);
}
</style>
```

### Pattern 6: Skeumorphic Web 2.0 card (D3-11)

**Qué hace:** Estilo era-auténtico para project cards de ch3. Gradiente glossy + inner highlight + drop shadow + embossed text. [VERIFIED: dev.to/jonkantner Web 2.0 CSS guide]

```css
/* @layer components — ProjectCard ch3 era */
/* Source: D3-11 locked decision + CSS investigation */
.project-card {
  border-radius: 14px;
  padding: var(--sp-md);

  /* Gradiente glossy (light top → darker bottom) — Web 2.0 signature */
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.04) 40%,
    rgba(0, 0, 0, 0.06) 100%
  ), var(--c-surface);

  /* Drop shadow exterior + inset highlight top (embossed effect) */
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.18),        /* outer drop shadow */
    inset 0 1px 0 rgba(255, 255, 255, 0.5); /* top inner highlight — D3-11 verbatim */

  /* Border glossy */
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.project-card-title {
  font-family: 'Lobster', Georgia, serif; /* Lobster ya cargado Phase 2 */
  font-size: 1.2rem;
  color: var(--c-fg);
  /* Embossed text-shadow — D3-11 verbatim */
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
  margin-bottom: var(--sp-xs);
}

.project-card-link {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  background: linear-gradient(to bottom, var(--c-accent), color-mix(in srgb, var(--c-accent) 70%, #000));
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  color: #fff;
  text-decoration: none;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  transition: transform 80ms ease, box-shadow 80ms ease;
}

.project-card-link:active {
  transform: translateY(1px);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.25),
    inset 0 2px 3px rgba(0, 0, 0, 0.1); /* "press" depth effect */
}
```

### Anti-Patterns a Evitar

- **`forge_sprite` con `background: "black"` o `"white"`:** Gemini ignora el color y bg removal falla. Usar presets nombrados. [VERIFIED: CLAUDE.md §6.2 + skill crear-arte-pixelforge.md]
- **`forge_background` para busts:** Los busts necesitan bg removal; usar siempre `forge_sprite`. `forge_background` no aplica bg removal. [VERIFIED: CLAUDE.md §6.3]
- **`@unhead/vue@^2` o `^3` con Vite 5:** Incompatible. v3 requiere `vite >=6.4.2`. Usar `^1.11.20`. [VERIFIED: npm registry]
- **`height: 100dvh` en `[data-chapter="3"]` en mobile:** D3-12 lo abandona en mobile para permitir scroll interno. El shell conserva 100dvh para que el snap funcione en desktop.
- **`scroll-snap-type: y mandatory` en el ScrollShell y también en el chapter interno:** No añadir snap al child container — genera conflicto. El child tiene `overflow-y: auto` sin snap, el outer shell tiene `mandatory`.
- **Generar spritesheets animados con `forge_animation`:** Frames incoherentes entre sí. Para busts estáticos, solo `forge_sprite`. [VERIFIED: CLAUDE.md §6.4]
- **Poner la foto de Rafael en git:** La foto `public/assets/.refs/rafael-age30.jpg` DEBE estar en `.gitignore`. Solo los outputs `ch{N}-bust.png` se commitean. [VERIFIED: D3-08]

---

## No Hand-Roll

| Problema | No construir | Usar en cambio | Por qué |
|----------|-------------|----------------|---------|
| Head management reactivo (title, meta, JSON-LD) | Mutations manuales de `document.head.appendChild` | `@unhead/vue@^1.11.20` → `useHead()` | Maneja deduplicación, cleanup en unmount, reactivity con Vue; edge cases con SSR futuro |
| Background removal de busts | Custom image processing | `forge_sprite` con preset + `process_sprite` | El flujo pixelforge → Adobe MCP está documentado y verificado en Phase 1 |
| Post-proceso de busts (crop, resize, palette fix) | Scripts custom de canvas | Adobe MCP `image_crop_and_resize` + `image_adjust_hsl` | Disponible en este entorno; ya documentado en `.claude/skills/editar-arte-adobe.md` |
| JSON-LD schema validation | Custom validator | [Schema.org Person type](https://schema.org/Person) como referencia | El formato es estándar; construcción manual con el patrón documentado es correcto |

---

## Pitfalls Comunes

### Pitfall 1: `@unhead/vue` versión incorrecta — Vite 5 incompatibilidad

**Qué sale mal:** Instalar `@unhead/vue` sin fijar versión instala la `latest` (3.1.0), que tiene `peerDependencies: { vite: '>=6.4.2' }`. `npm install` falla o lanza warning bloqueante.

**Por qué ocurre:** El tag `latest` apunta a v3.1.0 desde 2026-04. El proyecto usa Vite 5.4.0.

**Cómo evitar:** Instalar explícitamente `npm install @unhead/vue@^1.11.20`. Verificar `npm view @unhead/vue@1.11.20 peerDependencies` antes de cualquier install.

**Señales de alerta:** Error de peer dependency warning en `npm install`, o `vite: ^5.x` en package.json con `@unhead/vue` sin version pinned.

[VERIFIED: npm registry]

### Pitfall 2: StickyTimeline vs avatar column en ch3 desktop

**Qué sale mal:** El StickyTimeline está en `position: fixed; left: var(--sp-md)` y ocupa ~120px de ancho (año + era). Si el contenido de ch3 también empieza en `left: 0` o con poco padding, el contenido queda debajo del panel.

**Por qué ocurre:** El StickyTimeline es `position: fixed`, no ocupa espacio en el layout flow de ch3.

**Cómo evitar:** D3-09 Opción A: `padding-left: 160px` en el ch3 layout desktop (después del timeline ~120px + margen). En mobile, el timeline se compacta a solo año (~44px), así que `padding-left: 60px`.

**Señales de alerta:** El texto bio o los project cards quedan "encimados" con el panel de navegación al inspeccionar en desktop.

[VERIFIED: StickyTimeline.vue source — `left: var(--sp-md)`, ancho del panel ~120px de contenido]

### Pitfall 3: OG meta tags invisibles para crawlers LinkedIn/Slack

**Qué sale mal:** El portafolio es una SPA; el `index.html` solo tiene `<title>` estático. LinkedIn y Slack no ejecutan JS, leen el HTML crudo de `dist/index.html`. La OG preview aparece vacía o con el title hardcoded en `index.html`.

**Por qué ocurre:** `useHead` inyecta meta tags via JS en el cliente — los bots sociales no esperan a que JS corra.

**Cómo evitar (solución pragmática para este scope):** Después de ejecutar `npm run build`, editar `dist/index.html` manualmente o con un script Node post-build para inyectar los OG meta tags estáticos (ES como idioma default). Alternativa más robusta: `vite-prerender-plugin` (v0.5.13) para prerender el `index.html` con head ya resuelto. En todo caso, el `og:image` debe ser una ruta absoluta con el dominio final de Rafael.

**Señales de alerta:** Compartir la URL en LinkedIn y obtener preview vacío o solo el hostname.

[VERIFIED: prerender.io blog + thomashunter.name posts]

### Pitfall 4: `palette:` field vacío en `chapters.js` bloquea generación de arte

**Qué sale mal:** D3-06 exige que cada call a `forge_sprite` pase `palette: chapter.palette` explícito. Si Rafael no llenó `CONTENT-CHECKLIST.md §5`, los arrays quedan vacíos y el batch de busts no puede ejecutarse correctamente.

**Por qué ocurre:** ART-06 — paleta governance: paleta documentada ANTES de generar.

**Cómo evitar:** El planner debe verificar `CONTENT-CHECKLIST.md §5.2` (paleta ch3) y `§5.6` (paleta avatar humana) antes de autorizar la wave de generación de arte. Checkpoint:human-input obligatorio si están vacíos.

**Señales de alerta:** Arrays `palette: []` en `chapters.js` al momento de ejecutar la wave de arte.

### Pitfall 5: `references:` en `forge_sprite` — foto privada expuesta

**Qué sale mal:** El path `public/assets/.refs/rafael-age30.jpg` está en `public/` — Vite lo sirve estáticamente y aparece en el build si no se gitignora.

**Por qué ocurre:** `public/` en Vite es copiado verbatim a `dist/`. Si el archivo existe y no está gitignored, se distribuye.

**Cómo evitar:** D3-08 establece que la foto DEBE estar en `.gitignore`. Verificar entry: `public/assets/.refs/` en `.gitignore`. Los outputs `ch{N}-bust.png` SÍ se commitean. La foto privada nunca.

**Señales de alerta:** `public/assets/.refs/rafael-age30.jpg` aparece en `git status` como untracked sin gitignore entry.

### Pitfall 6: Duplicación de arrays de chapters en 3 componentes

**Qué sale mal:** `ScrollShell.vue`, `StickyTimeline.vue`, y `StickyAvatar.vue` todos declaran el mismo `const chapters = [...]` hardcoded. Al agregar `src/data/chapters.js`, los 3 deben actualizarse; olvidar uno genera drift.

**Por qué ocurre:** Phase 1 los creó independientes. Phase 3 los consolida.

**Cómo evitar:** Como parte de la wave de data architecture, actualizar los 3 componentes en un solo commit para importar `chapters` desde `@/data/chapters`. Agregar un test arquitectural que verifique que ningún componente declara `const chapters = [` internamente.

**Señales de alerta:** `grep "const chapters = \[" src/components/` retorna resultados después de la wave de consolidación.

---

## Código de Referencia

### Setup SEO minimal con @unhead/vue v1

```javascript
// main.js — diff mínimo para Phase 3
import { createHead } from '@unhead/vue'  // v1.x API
// ...resto igual que Phase 2

const head = createHead()
app.use(i18n).use(head).mount('#app')
```

```javascript
// App.vue — useHead con reactivity a locale
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead({
  title: () => t('seo.title'),
  meta: [
    { name: 'description',       content: () => t('seo.description') },
    { property: 'og:title',      content: () => t('seo.title') },
    { property: 'og:description',content: () => t('seo.description') },
    { property: 'og:image',      content: 'https://SITE_URL/og-image.png' },
    { property: 'og:type',       content: 'website' },
  ],
  link: [
    { rel: 'alternate', hreflang: 'es',        href: 'https://SITE_URL' },
    { rel: 'alternate', hreflang: 'en',        href: 'https://SITE_URL?lang=en' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://SITE_URL' },
  ],
  script: [{
    type: 'application/ld+json',
    textContent: JSON.stringify({ /* Person schema */ }),
  }],
})
```

[VERIFIED: unhead.unjs.io/docs/head/api/composables/use-head]

### JSON-LD Person schema para portafolio latino bilingüe

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://SITE_URL",
  "name": "Rafael Matovelle",
  "jobTitle": "PENDING — CONTENT-CHECKLIST §4.3",
  "url": "https://SITE_URL",
  "image": "https://SITE_URL/og-image.png",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Quito",
    "addressCountry": "EC"
  },
  "worksFor": {
    "@type": "Organization",
    "name": "PENDING — CONTENT-CHECKLIST §4.3"
  },
  "sameAs": [
    "PENDING — LinkedIn URL",
    "PENDING — GitHub URL"
  ],
  "knowsLanguage": ["es", "en"]
}
```

[VERIFIED: schema.org/Person + jsonld.com/person]

### i18n keys nuevas en Phase 3 (paridad ES/EN obligatoria)

```json
// Estructura para es.json y en.json — nuevas keys Phase 3
{
  "seo": {
    "title": "PENDING — CONTENT-CHECKLIST §4.1 (≤60 chars)",
    "description": "PENDING — CONTENT-CHECKLIST §4.2 (≤155 chars)"
  },
  "bio": {
    "core": "PENDING — CONTENT-CHECKLIST §1"
  },
  "projects": {
    "pp1": {
      "title": "PENDING — CONTENT-CHECKLIST §2.2",
      "desc":  "PENDING"
    }
  },
  "contact": {
    "hudAria": "Contacto rápido",
    "emailAria": "Enviar email a Rafael",
    "emailTooltip": "Copiar email",
    "linkedinAria": "Perfil LinkedIn de Rafael",
    "githubAria": "GitHub de Rafael"
  },
  "avatar": {
    "busts": {
      "3": { "alt": "Rafael a los 26 años, era Web 2.0, 2013" }
    }
  }
}
```

---

## Estado del Arte

| Approach antiguo | Approach actual | Cuándo cambió | Impacto |
|-----------------|-----------------|---------------|---------|
| `vue-meta` para SEO en Vue 3 | `@unhead/vue` (maintained) | 2023-2024 | `vue-meta` en modo legado/sin actualizaciones; `@unhead/vue` es su sucesor |
| OG meta tags en index.html estático | Script tags inyectados via `useHead` en SPA | Siempre fue así | Para crawlers sociales, se necesita prerender o edición post-build |
| `forge_animation` para personaje | `forge_sprite` + frame idle only | Documentado en este proyecto | `forge_animation` produce frames incoherentes — constraint dura |
| Arrays hardcoded de chapters en cada componente | `src/data/chapters.js` como fuente única | Phase 3 | Desduplicación + scalability Phase 4/5 |

**Deprecated/obsoleto:**
- `@vueuse/head`: Sunset/redirected a `@unhead/vue`. No usar.
- `vue-meta@2`: No recibe actualizaciones. No usar en proyectos nuevos Vue 3.

---

## Log de Supuestos

| # | Claim | Sección | Riesgo si es incorrecto |
|---|-------|---------|------------------------|
| A1 | La URL final del portafolio de Rafael (usada en JSON-LD, hreflang, og:url) — placeholder `https://rafael.matovelle.dev` | SEO Pattern | SEO-01..04 apuntan a URL incorrecta; búsquedas de Google podrían indexar URL placeholders |
| A2 | El nombre público de Rafael es "Rafael Matovelle" sin segundo apellido en el contexto profesional | JSON-LD schema | Schema de Person con nombre incorrecto |
| A3 | El ancho del panel `StickyTimeline` en desktop es aproximadamente 120px — estimado desde el CSS (`font-size 12-13px` + padding `var(--sp-sm)` × 2 + texto año+era) | Layout ch3 | Si el panel es más ancho, el `padding-left: 160px` de ch3 puede ser insuficiente |
| A4 | El parámetro `references:` de `forge_sprite` acepta paths locales de imágenes como anchor visual | Pixel Art Pipeline | Si solo acepta URLs o sprites ya generados por pixelforge, la foto de Rafael no puede usarse directamente como referencia |
| A5 | `scroll-snap-stop: always` + `overflow-y: auto` en el child de ch3 mobile propaga correctamente al outer snap container en Chrome y Firefox modernos sin JS adicional | Nested scroll mobile | Si no propaga, el scroll queda atrapado dentro del contenido de ch3 y el user no puede avanzar al siguiente chapter |

---

## Preguntas Abiertas

1. **URL del portafolio de Rafael**
   - Qué sabemos: Rafael tiene cuenta de Firebase (Phase 6 scope). No se ha confirmado el dominio final.
   - Qué no está claro: ¿`rafael.matovelle.dev`, `matovelle.dev`, `rafael.dev`, otro?
   - Recomendación: El planner pone `https://SITE_URL` como placeholder en código; Rafael confirma en Phase 6 al configurar Firebase Hosting.

2. **`references:` en forge_sprite — compatibilidad con foto de Rafael**
   - Qué sabemos: El parámetro `references:` existe en `forge_sprite` API [VERIFIED: github.com/freema/pixelforge-mcp].
   - Qué no está claro: ¿Acepta paths a fotos JPG no-pixel-art como anchor estilístico? ¿O solo sprites ya generados?
   - Recomendación: El artist-creator agent lo prueba con ch3-bust primero (el anchor más cercano a la foto). Si la foto no funciona como `references:`, se usa como descripción verbal detallada ("based on a man in his early 30s, [features from photo]").

3. **Prerender para OG tags — ¿vale la complejidad?**
   - Qué sabemos: `vite-prerender-plugin@0.5.13` puede prerender el index.html con head resuelto. Los bots de LinkedIn/Slack no ejecutan JS.
   - Qué no está claro: ¿Rafael planea compartir la URL en LinkedIn activamente? ¿Vale el overhead de configurar prerender para v1?
   - Recomendación: Solución pragmática mínima para Phase 3 — script post-build Node.js que edita `dist/index.html` e inyecta OG tags estáticos (ES default). Si Rafael requiere multilocale OG, escalar a vite-prerender-plugin en Phase 6.

---

## Disponibilidad del Entorno

| Dependencia | Requerida por | Disponible | Versión | Fallback |
|-------------|--------------|-----------|---------|----------|
| Node.js | Build, tests, scripts post-build | ✓ | v24.14.1 | — |
| npm | Instalar @unhead/vue | ✓ | incluido | — |
| pixelforge-mcp | ART-01 (7 busts) | ⚠ Verificar con `/project:verificar-mcps` | nano-banana-2 | Si falla: GEMINI_API_KEY expirada → sección 4.2 de CLAUDE.md |
| Adobe MCP | Post-proceso de busts | ⚠ Verificar con `/project:verificar-mcps` | — | Sin fallback — bg removal manual si Adobe MCP no disponible |
| Foto de Rafael ~30 años | D3-08 anchor visual | ❌ Pendiente Rafael | — | Sin fallback — blocking input para wave de arte |
| CONTENT-CHECKLIST.md completado | Bio, proyectos, contacto, paletas | ❌ Pendiente Rafael | — | Blocking para execute (planner pausa con checkpoint:human-input) |

**Dependencias bloqueantes sin fallback:**
- Foto de Rafael en `public/assets/.refs/rafael-age30.{jpg,png}` — requerida antes de wave de generación de arte
- CONTENT-CHECKLIST.md §1 (bio), §2.2 (proyectos ch3), §3 (contacto), §4.1 (SEO titles), §5.2 (paleta ch3), §5.6 (paleta avatar) — requeridos antes de wave de contenido

[VERIFIED: CONTENT-CHECKLIST.md — todos los campos vacíos al 2026-05-13]

---

## Validation Architecture

### Test Framework

| Propiedad | Valor |
|-----------|-------|
| Framework | Vitest ^4.1.6 |
| Config | Inferido desde `vite.config.js` (sin vitest.config.js separado) |
| Setup global | `tests/setup.js` — mocks IO, ResizeObserver, matchMedia, scrollIntoView |
| Quick run | `npm run test:run -- tests/` |
| Full suite | `npm run test:run` |

### Mapa Requirements → Tests

| REQ-ID | Comportamiento | Tipo de test | Comando automatizable | Archivo existe |
|--------|---------------|-------------|----------------------|----------------|
| CON-05 | `src/data/chapters.js` exporta array de 7 chapters con shape correcto | unit/arch | `npm run test:run -- tests/data/chapters.test.js` | ❌ Wave 0 |
| CON-06 | `src/data/projects.js` exporta proyectos con shape rico (D3-03 fields) | unit/arch | `npm run test:run -- tests/data/projects.test.js` | ❌ Wave 0 |
| CON-03 | `ContactHUD.vue` renderiza 3 iconos con href correcto + `rel="noopener noreferrer"` | component | `npm run test:run -- tests/components/ContactHUD.test.js` | ❌ Wave 0 |
| SEO-01..04 | `useHead` invocado en App.vue con meta og:*, link hreflang, script JSON-LD | unit/arch | `npm run test:run -- tests/seo/head-tags.test.js` | ❌ Wave 0 |
| I18N-02 | Paridad de keys ES/EN (incluyendo nuevas keys `bio.*`, `projects.*`, `seo.*`, `contact.*`) | unit | `npm run test:run -- tests/i18n/parity.test.js` | ✅ (extensible) |
| ART-05 | Archivos `ch{N}-bust.png` existen en `public/assets/` con naming correcto | arch/smoke | `npm run test:run -- tests/assets/bust-naming.test.js` | ❌ Wave 0 |
| ART-06 | `chapters.js` field `palette` no vacío para cada chapter con bust | arch | incluido en `chapters.test.js` | ❌ Wave 0 |
| CON-01/02 | `Chapter3Content.vue` renderiza bio + cards cuando hay proyectos ch3 | component | `npm run test:run -- tests/components/Chapter3Content.test.js` | ❌ Wave 0 |

### Tasa de Muestreo

- **Por commit de task:** `npm run test:run -- tests/i18n/parity.test.js` (siempre — paridad i18n) + test file del componente tocado
- **Por wave merge:** `npm run test:run` (suite completa — 151 tests actuales + nuevos Phase 3)
- **Phase gate:** Suite completa verde antes de `/gsd-verify-work`

### Gaps Wave 0

- [ ] `tests/data/chapters.test.js` — verifica shape CON-05 + ART-06 palette field
- [ ] `tests/data/projects.test.js` — verifica shape CON-06 + chapterEra matching
- [ ] `tests/components/ContactHUD.test.js` — verifica CON-03: 3 links, rel, href
- [ ] `tests/components/Chapter3Content.test.js` — verifica CON-01/02: bio + cards visibles
- [ ] `tests/components/ProjectCard.test.js` — verifica render con shape mínimo de D3-03
- [ ] `tests/seo/head-tags.test.js` — verifica `@unhead/vue` wiring: useHead called, og meta present
- [ ] `tests/assets/bust-naming.test.js` — verifica existencia de `ch{N}-bust.png` en `public/assets/`
- [ ] `tests/data/contact.test.js` — verifica shape CON-03: email + linkedinUrl + githubUrl presentes

> **Nota:** Los tests de assets (`bust-naming`) se ejecutan DESPUÉS de la wave de generación de arte. Son tests de smoke post-generación, no tests que pasan en Wave 0.

---

## Dominio de Seguridad

> `security_enforcement` no está explícitamente en `config.json`. Se trata como enabled.

### Categorías ASVS Aplicables

| Categoría ASVS | Aplica | Control estándar |
|----------------|--------|-----------------|
| V2 Authentication | No | No hay login/auth en portafolio estático |
| V3 Session Management | No | No hay sesiones; localStorage solo para locale |
| V4 Access Control | No | Sitio público sin áreas protegidas |
| V5 Input Validation | Parcial | Links externos validados en `contact.js` (no user input en runtime) |
| V6 Cryptography | No | Sin secretos en cliente |

### Patrones de amenaza relevantes para este stack

| Patrón | STRIDE | Mitigación estándar |
|--------|--------|---------------------|
| Open redirect via `contact.js` URLs | Spoofing | Hardcode las URLs en `contact.js` (no user-input); `rel="noopener noreferrer"` en links externos |
| `mailto:` abuse / email harvesting | Información | El email visible es intencional (D3-10); no se puede evitar en un portafolio público. Rafael decide si usa una dirección dedicada |
| Foto privada de Rafael en el build | Disclosure | `.gitignore` entry para `public/assets/.refs/` — Pitfall 5 documentado |
| JSON-LD injection si schema se construye dinámicamente con user input | Tampering | El schema es estático (no user input); `JSON.stringify()` es suficiente |

---

## Fuentes

### Primarias (confianza HIGH)
- `@unhead/vue@1.11.20` — npm registry — versión, peerDependencies verificados
- `unhead.unjs.io/docs/head/api/composables/use-head` — API de useHead: JSON-LD injection, hreflang links
- `unhead.unjs.io/docs/vue/head/guides/get-started/installation` — setup mínimo con createHead
- `github.com/freema/pixelforge-mcp` README — `references:` parameter en forge_sprite
- `developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-stop` — comportamiento scroll-snap-stop:always
- `schema.org/Person` — campos requeridos/recomendados para JSON-LD Person schema
- `.claude/skills/crear-arte-pixelforge.md` — errores documentados de pixelforge (presets bg, forge_sprite vs forge_background)
- `CLAUDE.md §6.1..6.4` — errores críticos del proyecto documentados
- Archivos de código source Phase 1+2: `StickyAvatar.vue`, `StickyTimeline.vue`, `ScrollShell.vue`, `chapter-themes.css`, `i18n/index.js`

### Secundarias (confianza MEDIUM)
- `github.com/w3c/csswg-drafts/issues/9187` — nested scroll-snap behavior no estandarizado (abierto 2023)
- `jsonld.com/person/` — ejemplo de Person JSON-LD con sameAs, jobTitle, address
- `prerender.io` docs — bots sociales no ejecutan JS; OG tags invisibles en SPA puro
- `dev.to/jonkantner` — CSS skeumorphic buttons Web 2.0 (gradient + inset + text-shadow pattern)
- `thomashunter.name` — alternativas OG para SPA sin SSR

### Terciarias (confianza LOW — marcar para validación)
- WebSearch results sobre `scroll-snap-stop: always` cross-browser — "Chrome may not support scroll-snap-stop: always" (dato de 2023; Chrome moderno sí soporta per MDN) — validar en browser real

---

## Metadata

**Desglose de confianza:**
- Stack estándar: HIGH — npm registry verificado; compatibilidad Vite 5 + @unhead/vue 1.x confirmada
- Pixel art pipeline: HIGH — errores documentados en CLAUDE.md + skill file; API `references:` verificada en README
- Arquitectura datos: HIGH — locked decisions D3-01..D3-04 no requieren investigación adicional
- SEO / JSON-LD: HIGH — API verificada en unhead docs; schema.org Person verificado
- Nested scroll mobile (D3-12): MEDIUM — comportamiento base documentado en MDN; spec ambigüedad confirmada en CSSWG; validación real en browser es manual gate
- Skeumorphic CSS: MEDIUM — patrones verificados en CSS guide; valores exactos del gradiente dependen de paleta final que Rafael aporta

**Fecha de investigación:** 2026-05-13
**Válido hasta:** ~2026-06-13 (30 días — stack estable excepto pixelforge que depende de Gemini API activa)

---

*Phase: 03-chapter-3-end-to-end*
*Research date: 2026-05-13*
