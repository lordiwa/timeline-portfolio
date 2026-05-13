# Requirements: mato-new-portfolio

**Defined:** 2026-05-12
**Core Value:** Que un visitante mueva el scroll, vea el sitio transformarse, y entienda en 30 segundos sin leer una sola viñeta de CV que está mirando a alguien que vivió tres décadas de tecnología y cuyas habilidades convergen en algo único.

---

## v1 Requirements

### CORE — Mecánica de scroll

- [ ] **CORE-01**: ScrollShell vertical con `scroll-snap-type: y mandatory` sobre los 7 chapters
- [ ] **CORE-02**: 7 chapter sections coexisten en el DOM (sin Vue Router; sin v-if entre ellos)
- [ ] **CORE-03**: Composable `useScrollState` con `activeChapter` ref + IntersectionObserver para tracking reactivo
- [ ] **CORE-04**: `scroll-snap-stop: always` en cada section (snap discreto chapter-a-chapter, sin skipping en swipes rápidos)
- [ ] **CORE-05**: Default landing en chapter 3 al cargar; query string `?ch=N` override permitido
- [ ] **CORE-06**: Navegación con flechas (↑/↓; Page Up/Down opcional; Home/End opcional) sobre el ScrollShell focus
- [ ] **CORE-07**: **Timeline sticky bottom** con marker móvil + año/era + 7 ticks click-to-navigate (reemplaza HUD dots clásicos)
- [ ] **CORE-08**: `height: 100dvh` en chapters para evitar address-bar drift en mobile
- [ ] **CORE-09**: `prefers-reduced-motion` respetado global (sin parallax, transiciones instantáneas)
- [ ] **CORE-10**: **Sticky avatar slot top-left** — un solo container fijo (position: sticky/fixed con z-index sobre contenido) que rendera el bust pixel-art del `activeChapter`; transición suave (crossfade) al cambiar de chapter; no re-mount del elemento (un img/canvas único cuya src/state cambia)
- [ ] **CORE-11**: **Timeline sticky bottom** detalle de comportamiento — marker móvil se posiciona según `scrollProgress` (0..1) sobre el rango visual de la timeline; tick activo se resalta; muestra año (1995–2026) + label del chapter activo en el idioma actual; click en cualquier tick navega con `scrollTo({ behavior: 'smooth' })` (o instantáneo si `prefers-reduced-motion`)

### THEME — Estilos por chapter

- [ ] **THM-01**: `src/styles/chapter-themes.css` con 7 bloques `[data-chapter="N"]` (N=0..6) usando CSS Custom Properties
- [ ] **THM-02**: `@layer` cascade order: reset / themes / components / utilities
- [ ] **THM-03**: 7 era-authentic themes implementados (ver Context > Mapeo de chapters en PROJECT.md): terminal (0), 90s HTML crudo (1), Flash vector (2), Web 2.0 (3), AR/VR immersive (4), modern animated (5), Phaser scene (6)
- [ ] **THM-04**: Validación de "no theme bleed" — fonts/colors no se filtran durante snap transitions (test gate manual + visual diff entre chapters)
- [ ] **THM-05**: Color contrast 4.5:1 cumplido por chapter; era-authenticity tradeoffs documentados explícitamente cuando se rompe (p.ej. terminal verde sobre negro)

### CONTENT — Contenido y datos

- [ ] **CON-01**: Bio core (~1-2 párrafos) renderizada en cada chapter con el estilo de su era
- [ ] **CON-02**: 1-3 proyectos destacados por chapter, mapeados al chapter de carrera correspondiente
- [ ] **CON-03**: Contact info persistente y accesible desde cualquier chapter (overlay fijo o HUD footer): email, LinkedIn, GitHub
- [ ] **CON-04**: Mantra "And always show a smile" aparece como **easter egg al llegar al chapter 6** (final del viaje), no antes
- [ ] **CON-05**: `src/data/chapters.js` define array de chapter configs (id, era, year, avatar src, project ids, locale keys)
- [ ] **CON-06**: `src/data/projects.js` define array de proyectos con id, era, locale-aware copy, asset refs

### I18N — Internacionalización

- [ ] **I18N-01**: vue-i18n v11 instalado con `legacy: false` (mandatory)
- [ ] **I18N-02**: Locale files `src/i18n/es.json` y `src/i18n/en.json` con paridad de keys
- [ ] **I18N-03**: Componente `LangToggle.vue` con persist en localStorage (`portfolio.locale`)
- [ ] **I18N-04**: `<html lang>` attribute actualiza al cambiar locale (WCAG 3.1.1)
- [ ] **I18N-05**: Todo layout testeado con ambos idiomas cargados (ES corre ~20-30% más largo que EN)
- [ ] **I18N-06**: `fallbackLocale: 'en'` configurado para tolerar gaps durante content authoring

### ART — Pixel art generado (vía pixelforge MCP)

- [ ] **ART-01**: 7 retratos bust del avatar (uno por chapter), **estilo pixel art consistente; solo la edad cambia** entre ~10 (ch0) y 40 con pocas canas (ch6); el display container es único (CORE-10) — un solo slot sticky top-left que swappea entre los 7 assets según `activeChapter`
- [ ] **ART-02**: 5 fondos full-frame (chapters 2-6) generados con `forge_background` (sin bg removal)
- [ ] **ART-03**: Elementos ambientales chapter 4 (AR/VR era): paneles flotantes, parallax layers de profundidad
- [ ] **ART-04**: Elementos ambientales chapter 6 (Phaser): ships, planetas, partículas — sin character animation
- [ ] **ART-05**: Naming convention: `ch{N}-{descriptor}[-{variant}].png` en `public/assets/`
- [ ] **ART-06**: Palette governance — paleta fija por chapter documentada antes de generar; cada llamada a pixelforge incluye paleta de referencia explícita
- [ ] **ART-07**: Chapters 0-1 cero pixel art (HTML/CSS puro): nivel 0 = terminal output, nivel 1 = HTML 90s crudo

### PHASER — Chapter 6 (escena explorable)

- [ ] **PHA-01**: `PhaserChapter.vue` mantiene la instancia `Phaser.Game` en `shallowRef` (NO `ref`/`reactive` — rompe el game loop)
- [ ] **PHA-02**: `game.destroy(true, false)` en `onBeforeUnmount`; `import.meta.hot.dispose()` guard para HMR en dev
- [ ] **PHA-03**: `Phaser.Scale.NONE` con `zoom = Math.min(Math.floor(vw/480), Math.floor(vh/270))` (integer scale obligatorio)
- [ ] **PHA-04**: Phaser se importa con `import()` dinámico y se monta solo cuando `activeChapter === 6` (lazy bundle)
- [ ] **PHA-05**: `SpaceScene` con **parallax vertical descendente** multi-capa, naves cruzando, **3 planetas-proyecto** distribuidos verticalmente (selección top-of-career de Rafael)
- [ ] **PHA-06**: Locale bridge: `game.events.emit("locale-changed", locale)` cuando el toggle cambia; scene escucha y re-renderiza labels
- [ ] **PHA-07**: Project click bridge: planet click → `game.events.emit("vue:show-project", id)` → Vue overlay muestra detalle del proyecto
- [ ] **PHA-08**: Cero character animation (constraint cerrado por limitación pixelforge)
- [ ] **PHA-09**: `ResizeObserver` + `ScrollTrigger.refresh()` para recalcular escena en window resize

### MOBILE — Compatibilidad móvil

- [ ] **MOB-01**: Mobile portrait y landscape ambos funcionales (touch swipe vertical natural; snap responde en ambas orientaciones)
- [ ] **MOB-03**: `ResizeObserver` sobre `document.documentElement` para responsive layout del avatar sticky y la timeline sticky (NO `orientationchange`); el layout se adapta a portrait/landscape sin bloquear ninguna

### A11Y — Accesibilidad mínima

- [ ] **A11Y-01**: Skip-to-content link al inicio del DOM (WCAG 2.4.1)
- [ ] **A11Y-02**: ScrollShell con `tabindex="0"` y keyboard navigation (←/→ ya en CORE-06; también Home/End opcional)
- [ ] **A11Y-03**: Focus visible en HUD controls — no remover `outline`, customizarlo per-theme respetando contraste
- [ ] **A11Y-04**: Color contrast 4.5:1 verificado por chapter; era-authenticity tradeoffs documentados (ver THM-05)
- [ ] **A11Y-05**: `prefers-reduced-motion` respetado en todas las transiciones (CORE-09)
- [ ] **A11Y-06**: Alt text en avatar busts con descripción era-accurate ("Rafael at 10 in front of a CRT monitor", etc.) en ambos idiomas
- [ ] **A11Y-07**: `<html lang>` actualiza en locale toggle (I18N-04)

### SEO — Findability y sharing

- [ ] **SEO-01**: OG meta tags (`og:title`, `og:description`, `og:image`, `og:type`) — image puede ser un screenshot de chapter 3 default landing
- [ ] **SEO-02**: JSON-LD Person schema en `<head>` con `jobTitle`, `worksFor`, `alumniOf`, `sameAs` (LinkedIn, GitHub)
- [ ] **SEO-03**: `<title>` y meta description por locale (cambian al toggle de idioma)
- [ ] **SEO-04**: `<link rel="alternate" hreflang>` para ES y EN

### DEPLOY — Build y hosting

- [ ] **DEPLOY-01**: `npm run build` produce bundle válido localmente; preview funciona con `npm run preview`
- [ ] **DEPLOY-02**: `firebase.json` y `.firebaserc` configurados; project ID confirmado con Rafael antes de deploy
- [ ] **DEPLOY-03**: SPA rewrite rule en `firebase.json` (`"source": "**", "destination": "/index.html"`)
- [ ] **DEPLOY-04**: Cache headers configurados: hashed Vite assets cache-eternal; index.html no-cache

### iOS — Compat smoke test

> El WebKit bug #243582 era específico de **momentum horizontal**. Con el pivote a scroll vertical, el snap está bien soportado en iOS. El gate bloqueante original se disuelve y queda como smoke test confirmatorio.

- [ ] **iOS-01**: Stack base iOS: `scroll-snap-stop: always` + `-webkit-overflow-scrolling: touch` para inercia nativa; verificar que el avatar sticky y la timeline sticky no entran en conflicto con Safari's bottom toolbar dynamic
- [ ] **iOS-02**: **Smoke test en hardware iOS real al inicio de Phase 1** (no gate bloqueante): vertical snap responde chapter-a-chapter; sticky elements se mantienen visibles durante el scroll; ambas orientaciones funcionan. Si surge algún issue específico de iOS, documentar y mitigar dentro de la fase, no abortarla.

---

## v2 Requirements

Diferido a versión posterior. Tracked pero no en el roadmap actual.

### Deep Linking

- **DLINK-01**: URL hash `#ch-N` actualiza al scrollear y permite enlaces directos a un chapter
- **DLINK-02**: Browser back/forward navega entre chapters visitados

### Polish Avanzado

- **POL-01**: GSAP ScrollTrigger reveal animations por chapter (entradas/salidas con parallax interno)
- **POL-02**: Sound design opcional (audio mute/unmute toggle, sonido por chapter)
- **POL-03**: Custom 404 page con estilo de algún chapter (ch1 GeoCities-style)
- **POL-04**: Easter eggs adicionales (Konami code, etc.)

### Analytics

- **ANL-01**: Firebase Analytics para tracking de chapters más visitados, idioma preferido, etc.
- **ANL-02**: Heatmap de interacción con HUD y planets

### Era-Authentic Proyectos

- **EAP-01**: Cards de proyectos completamente era-auténticas (ch2 = Flash portal site, ch5 = modern dashboard) en lugar de cards simplificados era-appropriate

### Tercer Idioma

- **I18N3-01**: Soporte para portugués (BR) o francés según demanda

---

## Out of Scope

Explícitamente excluido para v1. Documentado para prevenir scope creep.

| Feature | Razón |
|---------|-------|
| Character animation pixel art | Limitación documentada de pixelforge: frames incoherentes entre generaciones. Constraint dura. |
| Gameplay con objetivos/score en chapter 6 | Sin NPCs animados, forzar gameplay sería artificial. La escena es exploración ambiente. |
| CMS / backend dinámico | El contenido es estático en v1. No hay panel de admin, no edición runtime. |
| Blog / artículos largos | El formato del sitio no calza con lectura larga. Otra plataforma si Rafael publica. |
| Modo accesibilidad "linealizado" | Debilitaría el concepto experiencial. Re-evaluar si surge presión real por screen readers en producción. |
| Bento grids | CreativeBoom 2026 los marca como exhausted; rompe la identidad por-era. |
| Glassmorphism | Idem bento — exhausted en 2026, no encaja con ninguna era del timeline. |
| Custom cursors | Anti-feature en 2026 según research; añade fricción sin aportar al concepto. |
| Loading screen elaborado | Otra anti-feature; el sitio debe entrar rápido al chapter 3 default. |
| Múltiples "hire me" CTAs | Antiautenticidad. Contact info persistente es suficiente. |
| Dark/light mode toggle | El theme cambia por chapter — añadir otro eje de variación dobla la combinatoria de testing por nada. |
| Vue Router | Conflicta con scroll-snap; activeChapter via composable es suficiente. |
| Pinia | Overkill para un único integer ref. |
| Lenis (momentum scroll lib) | Empezar sin él; añadir solo si el feel mecánico justifica el riesgo. |
| Locomotive Scroll | Intercepta pointer events globalmente y rompe Phaser input en ch6. |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 1 | Pending |
| CORE-04 | Phase 1 | Pending |
| CORE-05 | Phase 1 | Pending |
| CORE-06 | Phase 1 | Pending |
| CORE-07 | Phase 1 | Pending |
| CORE-08 | Phase 1 | Pending |
| CORE-09 | Phase 1 | Pending |
| CORE-10 | Phase 1 | Pending |
| CORE-11 | Phase 1 | Pending |
| MOB-01 | Phase 1 | Pending |
| MOB-03 | Phase 1 | Pending |
| iOS-01 | Phase 1 | Pending |
| iOS-02 | Phase 1 | Pending |
| A11Y-01 | Phase 1 | Pending |
| A11Y-02 | Phase 1 | Pending |
| A11Y-05 | Phase 1 | Pending |
| THM-01 | Phase 2 | Pending |
| THM-02 | Phase 2 | Pending |
| THM-03 | Phase 2 | Pending |
| THM-04 | Phase 2 | Pending |
| THM-05 | Phase 2 | Pending |
| I18N-01 | Phase 2 | Pending |
| I18N-02 | Phase 2 | Pending |
| I18N-03 | Phase 2 | Pending |
| I18N-04 | Phase 2 | Pending |
| I18N-05 | Phase 2 | Pending |
| I18N-06 | Phase 2 | Pending |
| A11Y-03 | Phase 2 | Pending |
| A11Y-04 | Phase 2 | Pending |
| A11Y-07 | Phase 2 | Pending |
| CON-01 | Phase 3 | Pending |
| CON-02 | Phase 3 | Pending |
| CON-03 | Phase 3 | Pending |
| CON-04 | Phase 3 | Pending |
| CON-05 | Phase 3 | Pending |
| CON-06 | Phase 3 | Pending |
| ART-01 | Phase 3 | Pending |
| ART-05 | Phase 3 | Pending |
| ART-06 | Phase 3 | Pending |
| SEO-01 | Phase 3 | Pending |
| SEO-02 | Phase 3 | Pending |
| SEO-03 | Phase 3 | Pending |
| SEO-04 | Phase 3 | Pending |
| ART-02 | Phase 4 | Pending |
| ART-03 | Phase 4 | Pending |
| ART-04 | Phase 4 | Pending |
| ART-07 | Phase 4 | Pending |
| A11Y-06 | Phase 4 | Pending |
| PHA-01 | Phase 5 | Pending |
| PHA-02 | Phase 5 | Pending |
| PHA-03 | Phase 5 | Pending |
| PHA-04 | Phase 5 | Pending |
| PHA-05 | Phase 5 | Pending |
| PHA-06 | Phase 5 | Pending |
| PHA-07 | Phase 5 | Pending |
| PHA-08 | Phase 5 | Pending |
| PHA-09 | Phase 5 | Pending |
| DEPLOY-01 | Phase 6 | Pending |
| DEPLOY-02 | Phase 6 | Pending |
| DEPLOY-03 | Phase 6 | Pending |
| DEPLOY-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements identified: 63 unique IDs (post-pivote 2026-05-12: −MOB-02, −MOB-04, +CORE-10, +CORE-11; net unchanged)
- Mapped to phases: 63
- Unmapped: 0

**Coverage notes:**
- Pivote 2026-05-12 (horizontal → vertical con sticky avatar + sticky timeline): eliminados MOB-02 y MOB-04 (overlay "gira tu dispositivo"); añadidos CORE-10 (sticky avatar slot) y CORE-11 (timeline marker behavior). iOS-02 reframe de gate bloqueante a smoke test confirmatorio. Net count preserved.

---
*Requirements defined: 2026-05-12*
*Last updated: 2026-05-12 — pivote a vertical: CORE-01/06/07 reframed; +CORE-10/11; −MOB-02/04; iOS-02 reframed; PHA-05/ART-01 ajustados*
