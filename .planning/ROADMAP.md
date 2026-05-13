# Roadmap: mato-new-portfolio

## Overview

Un portafolio horizontal de 7 chapters que transforma al visitante en viajero temporal (1995 → 2026). La entrega sigue el orden que dicta el riesgo: primero se valida la mecánica de scroll en hardware iOS real, luego se construye el motor visual y lingüístico, después se pule el landing por defecto (chapter 3), se completan los chapters restantes en paralelo, se añade la escena Phaser, y finalmente se despliega a Firebase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Scroll Shell + iOS Gate** - Infraestructura de scroll validada en hardware iOS real; sin este gate no se construye contenido
- [ ] **Phase 2: Theme System + i18n** - Motor visual (7 themes era-auténticos) y motor lingüístico (ES/EN toggle) listos antes de cualquier contenido real
- [ ] **Phase 3: Chapter 3 End-to-End** - Landing por defecto polished con avatar, bio, proyectos y contacto en ambos idiomas
- [ ] **Phase 4: Chapters 0-2 + 4-5** - Cinco chapters restantes completos con pixel art y contenido era-auténtico (paralelizable)
- [ ] **Phase 5: Phaser Chapter 6** - Escena espacial explorable en Phaser con parallax, naves y planetas-proyecto
- [ ] **Phase 6: Deploy + Polish** - Build de producción, Firebase Hosting configurado y cache headers correctos

## Phase Details

### Phase 1: Scroll Shell + iOS Gate
**Goal**: El visitante puede moverse entre los 7 chapters con scroll horizontal que hace snap suave; la orientación portrait está bloqueada; y el comportamiento en iOS real está validado como gate bloqueante.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CORE-09, MOB-01, MOB-02, MOB-03, MOB-04, iOS-01, iOS-02, A11Y-01, A11Y-02, A11Y-05
**Success Criteria** (what must be TRUE):
  1. Visitante abre el sitio en desktop y aterriza directamente en el chapter 3 placeholder; puede navegar con scroll horizontal, flechas de teclado y click en HUD dots; el scroll hace snap a cada uno de los 7 chapters sin saltar ni quedarse a medias.
  2. En hardware iOS real (iPhone/iPad), hacer swipe rápido horizontal NO salta al último chapter; el snap se detiene chapter a chapter (mitigation stack validado o fallback JS confirmado).
  3. En mobile landscape el touch swipe navega correctamente entre chapters con snap funcional.
  4. Rotar el dispositivo a portrait muestra el overlay "gira tu dispositivo" (en ES y EN); rotar de vuelta a landscape lo oculta sin recargar la página.
  5. Activar `prefers-reduced-motion` en el sistema operativo elimina todas las transiciones de snap animadas y el parallax; el scroll directo sigue funcionando.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Theme System + i18n
**Goal**: Los 7 chapters tienen identidades visuales era-auténticas que no se filtran entre sí durante el snap; el toggle ES/EN persiste, actualiza `<html lang>`, y toda la UI se puede leer en ambos idiomas sin layout roto.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: THM-01, THM-02, THM-03, THM-04, THM-05, I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, I18N-06, A11Y-03, A11Y-04, A11Y-07
**Success Criteria** (what must be TRUE):
  1. Navegar de chapter 0 (terminal verde sobre negro) a chapter 5 (modern animated) muestra un cambio visual completo en cada chapter; colores, tipografía y estética pertenecen inequívocamente a su era, y ningún estilo "se filtra" hacia chapters adyacentes visibles durante el snap.
  2. El toggle de idioma cambia toda la UI de ES a EN (y viceversa) en un solo click; el idioma persiste al recargar la página; el atributo `<html lang>` refleja el idioma activo.
  3. Con el texto en español (20-30% más largo), ningún layout se rompe ni se desborda; el texto sigue siendo legible y el capítulo sigue teniendo el estilo correcto.
  4. El contraste de color es 4.5:1 en todos los chapters (o el tradeoff está documentado explícitamente con justificación era-auténtica en el código).
  5. El HUD (dots + label + toggle de idioma) tiene `outline` de focus visible que varía por chapter sin perder contraste.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Chapter 3 End-to-End
**Goal**: El chapter 3 (Web 2.0 + arte digital) es el landing polished que un recruiter ve al abrir el sitio; tiene avatar, bio, proyectos de la era, contacto persistente, metadatos SEO y funciona impecablemente en ES y EN.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: CON-01, CON-02, CON-03, CON-04, CON-05, CON-06, ART-01, ART-05, ART-06, SEO-01, SEO-02, SEO-03, SEO-04
**Success Criteria** (what must be TRUE):
  1. Un visitante que no toca el scroll ve en chapter 3: el avatar bust pixel-art de Rafael a los ~26 años, 1-3 proyectos de la era Pink Parrot, y una bio de 1-2 párrafos con el tono cálido-juguetón; todo esto en el idioma que tenga activo (ES o EN).
  2. Desde chapter 3 (y desde cualquier chapter), el visitante puede encontrar el email, LinkedIn y GitHub de Rafael sin hacer scroll adicional ni abrir menús — contacto siempre visible.
  3. Compartir la URL en LinkedIn/Slack muestra una Open Graph preview con título, descripción e imagen relevantes (screenshot de chapter 3) en el idioma activo.
  4. Un scraper de SEO encuentra un JSON-LD Person schema en `<head>` con jobTitle, sameAs LinkedIn/GitHub, y el meta description correcto por idioma.
  5. Los archivos `src/data/chapters.js` y `src/data/projects.js` existen y son la fuente única de verdad que alimenta el capítulo 3; la paleta de pixel art del chapter 3 está documentada antes de generar cualquier asset.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Chapters 0-2 + 4-5
**Goal**: Los cinco chapters restantes están completos con contenido era-auténtico, pixel art generado y validado, y el avatar envejeciendo coherentemente del niño (~10 años) al adulto profesional (~36 años).
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: ART-02, ART-03, ART-04, ART-07, A11Y-06
**Success Criteria** (what must be TRUE):
  1. Hacer scroll desde chapter 0 hasta chapter 5 muestra una transformación visual inequívoca en cada salto: terminal (0) → HTML 90s crudo (1) → Flash vector (2) → [ya polished ch3] → AR/VR immersive (4) → modern animated (5); cada chapter tiene bio + proyectos era-apropiados.
  2. Los chapters 0 y 1 son 100% CSS puro (sin pixel art); los chapters 2, 4 y 5 tienen fondos full-frame pixel art con naming `ch{N}-{descriptor}.png`; ningún asset con nombre incorrecto llega a producción.
  3. El avatar en los 7 chapters muestra un envejecimiento reconocible: cara infantil en ch0, adolescente en ch1, veintitantos en ch2-3, treinta y tantos en ch4-5 (el ch6 es en Phase 5); el estilo pixel art es consistente entre todos los busts generados.
  4. Todos los alt texts de los avatar busts están escritos en ES y EN con descripción era-accurate ("Rafael a los 10 años frente a un monitor CRT", etc.) y son leíbles por lectores de pantalla.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Phaser Chapter 6
**Goal**: El chapter 6 carga una escena Phaser explorable con parallax espacial, naves cruzando y 3 planetas-proyecto clicables; el locale bridge funciona; la instancia de Phaser no produce memory leaks al navegar a otros chapters y volver.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: PHA-01, PHA-02, PHA-03, PHA-04, PHA-05, PHA-06, PHA-07, PHA-08, PHA-09
**Success Criteria** (what must be TRUE):
  1. Navegar al chapter 6 carga la escena Phaser con parallax multi-capa, naves cruzando en el fondo y al menos 3 planetas visibles; hacer click en un planeta abre un overlay Vue con el detalle del proyecto correspondiente.
  2. Cambiar el idioma con el toggle mientras se está en chapter 6 actualiza los labels visibles dentro de la escena Phaser (nombre de planetas, tooltips) sin recargar la página.
  3. Navegar a otro chapter y volver al chapter 6 recrea la escena limpiamente; navegar hacia afuera y volver dos veces no produce canvas duplicados ni errores de WebGL en la consola del navegador.
  4. En una pantalla HiDPI (Retina), los sprites pixel art en la escena Phaser se renderizan con bordes nítidos pixel-perfect (sin blur); el zoom es un entero calculado con `Math.floor`.
  5. Con `prefers-reduced-motion` activo, las naves y el parallax de la escena Phaser están estáticos o moviéndose a velocidad mínima; no hay animación automática agresiva.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Deploy + Polish
**Goal**: El sitio tiene un build de producción válido, está configurado para Firebase Hosting con cache headers correctos, y puede desplegarse con una sola instrucción cuando Rafael dé la orden.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04
**Success Criteria** (what must be TRUE):
  1. `npm run build` completa sin errores y `npm run preview` sirve el sitio completo localmente, incluyendo la escena Phaser y los assets pixel art, idéntico al entorno de desarrollo.
  2. `firebase.json` y `.firebaserc` están configurados con el project ID de Rafael, la SPA rewrite rule activa, y los cache headers correctos (assets con hash = cache-eternal, `index.html` = no-cache); ejecutar `firebase deploy` publica el sitio en Firebase Hosting.
**Plans**: TBD

## Progress

**Execution Order:** 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scroll Shell + iOS Gate | 0/TBD | Not started | - |
| 2. Theme System + i18n | 0/TBD | Not started | - |
| 3. Chapter 3 End-to-End | 0/TBD | Not started | - |
| 4. Chapters 0-2 + 4-5 | 0/TBD | Not started | - |
| 5. Phaser Chapter 6 | 0/TBD | Not started | - |
| 6. Deploy + Polish | 0/TBD | Not started | - |
