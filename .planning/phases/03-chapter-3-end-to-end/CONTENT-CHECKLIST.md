# Phase 3 — Content Checklist (Rafael)

> Este documento es para que Rafael produzca el contenido necesario para Phase 3 **en paralelo** a la implementación de Phase 2. Cuando Phase 2 esté lista y este checklist completo, Phase 3 puede ejecutarse de corrido sin esperar inputs humanos.

**Fecha de inicio:** 2026-05-12
**Estado:** En producción (Rafael)
**Bloquea:** Phase 3 execution

---

## 1. Bio core — bilingüe

Una bio de 1–2 párrafos con el tono **cálido-juguetón** documentado en PROJECT.md ("And always show a smile"). La misma bio se renderizará en los 7 chapters con estilo era-auténtico, pero el texto base es uno.

### 1.1 Bio en español
- [ ] Versión ES, 1–2 párrafos
- [ ] Tono cálido-juguetón, humor sutil
- [ ] Menciona: convergencia dev + QA + líder + AI; 3 décadas de tecnología; Quito; bilingüe
- [ ] **NO mencionar edad explícita** (la timeline ya la comunica visualmente)
- [ ] Cierre con guiño a "siempre con una sonrisa" o equivalente narrativo

### 1.2 Bio en inglés
- [ ] Versión EN — pulida, **no auto-translate**
- [ ] Mismo tono y duración aproximada (recordar que ES es ~20-30% más largo)
- [ ] Idiomas/coloquialismos naturales para audiencia US/EU/Canadá

**Entrega:** texto plano (markdown si prefieres). Ubicación final: `src/data/bio.js` (Claude lo cablea).

---

## 2. Proyectos por chapter

Lista de proyectos destacados a mostrar **por chapter de carrera**. Cada uno: nombre, año(s), 1 línea de descripción ES, 1 línea EN, link si aplica (LinkedIn post / portfolio externo / GitHub / sitio público).

### 2.1 Chapter 2 (~2009 — Flash era)
**BlueLizard / Matte CG / Joju Games — Flash Gameplay Programmer**

- [ ] Proyecto destacado #1 (1–3 proyectos máximo por chapter)
  - Nombre: __________
  - Año: __________
  - Descripción ES: __________
  - Descripción EN: __________
  - Link: __________
- [ ] Proyecto #2 (opcional)
- [ ] Proyecto #3 (opcional)

### 2.2 Chapter 3 (~2013 — Web 2.0 + arte digital) ★ LANDING POR DEFECTO
**Pink Parrot — UX + Web Dev + Team Leader**

- [ ] Proyecto #1 (1–3 proyectos)
  - Nombre, año, descripción ES/EN, link
- [ ] Proyecto #2 (opcional)
- [ ] Proyecto #3 (opcional)

> ★ Este chapter recibe atención prioritaria — es el primer impacto que el recruiter ve.

### 2.3 Chapter 4 (~2015–2018 — AR/VR)
**Empresa propia AR/VR + Metrodigi**

- [ ] Proyecto #1 (1–3)
- [ ] Proyecto #2 (opcional)
- [ ] Proyecto #3 (opcional)

### 2.4 Chapter 5 (~2022–2023 — Modern animated)
**BairesDev + number8 + VivoEnVivo + RocketSnail + Remoose**

- [ ] Proyecto #1 (1–3)
- [ ] Proyecto #2 (opcional)
- [ ] Proyecto #3 (opcional)

### 2.5 Chapter 6 (2026 — convergencia)
**Software Mind QA + AI**

- [ ] Concepto del "proyecto actual" (puede ser este mismo portafolio + role actual)
- [ ] 2–3 áreas de impacto a destacar como "planetas" navegables en la escena Phaser

> Los proyectos de chapter 6 se renderizan como planetas-proyecto en la escena Phaser (Phase 5). Por ahora basta con el contenido textual; la disposición espacial se decide en Phase 5.

### 2.6 Chapters 0 y 1 — sin proyectos explícitos
Chapters 0 (niñez digital) y 1 (HTML 90s crudo) no requieren proyectos — son narrativos.

**Entrega:** un YAML o JSON. Ubicación final: `src/data/projects.js` (Claude lo cablea).

---

## 3. Contacto persistente

- [ ] **Email** (visible en todos los chapters): __________
- [ ] **LinkedIn URL**: __________
- [ ] **GitHub URL**: __________
- [ ] (opcional) **Otra red** (Twitter/X, Mastodon, Bluesky, sitio personal): __________

**Confirmar:** ¿Email se muestra como link `mailto:` o como string copiable? (Preferencia: ambas — `mailto:` con tooltip "click para copiar").

---

## 4. Metadatos SEO + Open Graph

### 4.1 Title + Description por idioma

- [ ] Title ES (≤60 chars): __________
- [ ] Title EN (≤60 chars): __________
- [ ] Description ES (≤155 chars): __________
- [ ] Description EN (≤155 chars): __________

### 4.2 Screenshot Open Graph

- [ ] Screenshot del chapter 3 polished (1200×630) — **Rafael decide cuándo:** puede ser una screenshot del chapter 3 una vez ejecutado Phase 3, o algo placeholder. Si tienes una imagen aspirational ahora, mejor.

### 4.3 JSON-LD Person schema

Datos confirmar:
- [ ] `name`: Rafael Matovelle (¿usas segundo apellido públicamente?)
- [ ] `jobTitle`: ¿"Full Stack Engineer & QA Specialist" o algo más específico?
- [ ] `sameAs`: URLs LinkedIn + GitHub (de §3)
- [ ] `worksFor`: ¿Software Mind North America? ¿algo más? (¿incluyes Remoose en paralelo?)
- [ ] `address.addressLocality`: Quito, Ecuador (confirmar)

---

## 5. Paletas pixel art por chapter

**★ CRÍTICO antes de generar cualquier asset (constraint ART-06).** Las paletas deben aprobarse para mantener consistencia visual entre chapters y coherencia era-auténtica.

Para cada chapter con pixel art (2, 3, 4, 5, 6), Rafael aprueba una paleta de ~5–8 colores. Sugerencia: usar [lospec.com/palette-list](https://lospec.com/palette-list) como referencia.

### 5.1 Chapter 2 — Flash era (2009)
**Vibe:** banners vector, gradientes vivos, retro UI
- [ ] 5–8 hex codes: __________
- [ ] Referencia visual / paleta de lospec: __________

### 5.2 Chapter 3 — Web 2.0 (2013) ★ LANDING
**Vibe:** rounded corners, glossy, primer chapter con arte digital
- [ ] 5–8 hex codes: __________
- [ ] Referencia: __________

### 5.3 Chapter 4 — AR/VR (2015–2018)
**Vibe:** immersive, paneles flotantes, profundidad
- [ ] 5–8 hex codes: __________
- [ ] Referencia: __________

### 5.4 Chapter 5 — Modern animated (2022–2023)
**Vibe:** scroll-driven, Lottie-style, micro-interacciones
- [ ] 5–8 hex codes: __________
- [ ] Referencia: __________

### 5.5 Chapter 6 — Phaser space (2026)
**Vibe:** espacio, naves, planetas-proyecto, parallax vertical descendente
- [ ] 5–8 hex codes: __________
- [ ] Referencia: __________

### 5.6 Avatar busts — paleta de skin/cabello/ropa
Los 7 busts del avatar comparten lectura coherente del personaje (es la misma persona envejeciendo). Definir paleta base humana:
- [ ] Skin tones (2–3 shades): __________
- [ ] Hair color base + variantes por edad (cabello más oscuro joven, posibles canas adulto): __________
- [ ] Ropa: ¿free per chapter o consistente?

---

## 6. Mantra y voz

- [ ] **"And always show a smile"** — ¿cómo aparece? ¿footer? ¿inscripción en chapter 6? ¿escondido en chapter 0?
- [ ] Cualquier otra frase signature que quieras presente

---

## ✓ Cuándo este checklist está "ready"

Marca este checklist como **complete** cuando:
1. Bio ES + EN escritas (§1)
2. Al menos 1 proyecto por chapter 2, 3, 4, 5 (§2)
3. Email + LinkedIn + GitHub confirmados (§3)
4. SEO titles + descriptions en ambos idiomas (§4)
5. Paletas aprobadas para chapter 3 + avatar (mínimo viable para Phase 3 ejecutable); resto puede ir en Phase 4

Cuando esto pase, avisa a Claude y Phase 3 puede arrancar `/gsd-discuss-phase 3` con todo el contenido a mano.

---

*Generado 2026-05-12 como parte del workflow paralelo Phase 2 impl + Phase 3 contenido. Ver [[portfolio-parallel-workflow]] en memoria.*
