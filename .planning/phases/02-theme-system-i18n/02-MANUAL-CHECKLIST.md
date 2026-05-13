---
phase: 02-theme-system-i18n
plan: 06
slug: wave5-manual-checklist
generated: 2026-05-13
last_updated: 2026-05-13 (post StickyTimeline redesign vertical-left + App.vue function ref fix)
executed_by: Rafael Matovelle <srparca@gmail.com>
executed_at: 2026-05-13
verdict: PASS
---

# Phase 2 · Plan 06 — Manual Verification Checklist

> Este artefacto cubre las verificaciones de Phase 2 que **no pueden ser
> programáticas** — requieren render real en browser, DevTools, herramientas
> de accesibilidad externas y juicio perceptual humano.
>
> Ejecútalo **antes de** `/gsd-verify-work 2`. Cubre los 4 REQ-IDs con
> dimensión manual (THM-04 visual, THM-05 external audit con axe/Lighthouse,
> I18N-05 layout shift CLS móvil, A11Y-04 axe contrast audit) + cierra
> **Open-Q2-E** (Latin Extended glyph coverage diferida desde W4) y
> **Open-Q2-B** (A/B re-validación de duración bg morph 200ms vs 300ms).
>
> **Nota de comandos (PS 5.1):** los fragmentos con `&&` son referenciales.
> En PowerShell 5.1, ejecuta cada parte como statement separado:
> en lugar de `npm run build && npm run preview`, ejecuta `npm run build`
> y luego, si termina sin error, `npm run preview`.

---

## Entorno de Test

Antes de empezar, configura el entorno según la sección que vayas a ejecutar:

| Herramienta | Versión / Preset | Para sección |
|---|---|---|
| **Chrome** | la versión actual instalada (anotar en sign-off) | Todas |
| **Firefox** | la versión actual instalada | §6 cross-browser |
| **Edge** (Chromium) | smoke rápido | §6 cross-browser |
| **DevTools mobile emulator** | Preset "iPhone SE" — 375×667 portrait | §3 layout shift |
| **DevTools Network throttling** | "Slow 3G" | §5 FOUT/FOIT |
| **DevTools Rendering panel** | "Emulate CSS media feature `prefers-reduced-motion`" → `reduce` | §2 PRM + §6 DevTools |
| **Lighthouse** | Panel integrado en Chrome DevTools → Performance + Accessibility | §4 contrast + §5 FOIT |
| **axe DevTools** | Extensión de Chrome, free tier (instalar de Chrome Web Store si no está) | §4 contrast audit |
| **NVDA** | Screen reader Windows (descargar de nvaccess.org si no está instalado) | §6 DevTools (best-effort) |
| **iOS Safari** | **DEFERRED** — Rafael no posee dispositivo iOS. Igual que Phase 1 Plan 07, todas las verificaciones iOS se marcan `DEFERRED` y quedan pendientes de BrowserStack u otro dispositivo real. |

**Arrancar el servidor de desarrollo:**

```powershell
cd C:\Users\RafaelMatovelle\documents\mato-new-portfolio
npm install
npm run test:run
npm run dev
# Abrir: http://127.0.0.1:5173/
```

Estado esperado al cargar:
- Página carga en chapter 3 (Web 2.0 2013) con fondo `#f0f4ff` y texto oscuro
- LangToggle visible en top-right (pill "ES | EN" o ícono 🌐)
- StickyTimeline visible **a la izquierda** (panel vertical centrado verticalmente)
  con 7 botones apilados (año + era cada uno). En ≤599px la era se oculta y
  queda columna de años solamente. **NOTA REDISEÑO 2026-05-13:** la barra ya
  no es horizontal-bottom con marker móvil — Rafael pidió "no que sea una
  scrollbar sino botones de estados en una barra vertical sticky que se
  sincronice al scroll nativo". Ver §6.4.14-§6.4.17 del DevTools panel para
  los checkpoints estructurales del nuevo layout (items 17-20).
- BackgroundLayers activo (sin `background: #0b0b16` en el `<body>`)

---

## §1 — Theme bleed visual durante smooth-scroll (THM-04 visual)

> **Cobertura:** VALIDATION.md `Manual-Only Verifications` fila 1 / RESEARCH
> §Theme Bleed Prevention Testing Strategy 3 líneas 1246-1267 / UI-SPEC §4.

**Contexto:** Cada `<section>` tiene su propio `data-chapter` hardcoded.
El CSS cascade (`@layer themes`) aplica los tokens `--c-bg`/`--c-fg` por section
independientemente. Durante la transición de scroll, dos sections pueden ser
visibles simultáneamente — verificamos que cada mitad mantiene SU theme sin
"derramarse" al vecino.

### Pasos

- [ ] **1.1** Con la página cargada en Chrome desktop, desactiva snap temporalmente
       si necesitas: en DevTools Console ejecuta
       `document.querySelector('.scroll-shell').style.scrollSnapType = 'none'`.
       (Restaurar después con `...scrollSnapType = 'y mandatory'`.)
- [ ] **1.2** Scroll **lentamente** con trackpad (NO hacer click en los ticks de
       la timeline) de ch0 hacia ch1. Mientras DOS sections son visibles
       simultáneamente en el viewport:
       - Verifica que la mitad superior mantiene SU theme (ch0: fondo negro,
         texto `#00ff41` fosforescente, font VT323).
       - Verifica que la mitad inferior tiene SU theme (ch1: fondo `#000080`,
         texto `#ff00ff` magenta, font Comic Neue).
       - NO debe verse "half-and-half" en un mismo elemento: ningún texto
         cambiando de color a mitad del glyph, ningún fondo partido entre dos
         colores en un mismo bloque de texto.
- [ ] **1.3** Captura un screenshot del estado de transición (opcional pero
       útil para el historial).
- [ ] **1.4** En DevTools → Elements → Computed: selecciona la section SALIENTE
       (`[data-chapter="0"]`) y verifica que muestra `--c-bg: #000000` y
       `--c-fg: #00ff41`. Selecciona la section ENTRANTE (`[data-chapter="1"]`)
       y verifica `--c-bg: #000080` y `--c-fg: #ff00ff`.
- [ ] **1.5** Repite los pasos 1.2-1.4 para los 6 pares restantes:
       - ch1 → ch2 (navy magenta → flash era morado `#2a1a4a`)
       - ch2 → ch3 (flash era → web 2.0 `#f0f4ff`)
       - ch3 → ch4 (web 2.0 → AR/VR dark `#0a0f2e`)
       - ch4 → ch5 (AR/VR → modern blanco `#ffffff`)
       - ch5 → ch6 (modern → phaser dark `#000814`)
- [ ] **1.6** Verifica que el background morph global (BackgroundLayers) se
       percibe como UN evento decorativo de fondo, independiente del snap de
       los chapter titles/textos. El bg crossfade ES by design — no es theme
       bleed, sino el motor D2-04/D2-05.

**PASS:** Ningún par (ch0..ch5 → ch1..ch6) muestra half-and-half en texto
o fondo de elementos pertenecientes a un mismo section.

**FAIL:** Si ves half-and-half en cualquier par → reportar como gap. Causa
probable: `data-chapter` aplicado a un wrapper ancestor en lugar de a la
`<section>` directa. Verificar en DevTools que solo las `<section>` tienen
`data-chapter`, no el `<div.scroll-shell>` padre.

---

## §2 — Background morph crossfade — sync visual con avatar + A/B 200ms vs 300ms (D2-04 + D2-05 + Open-Q2-B)

> **Cobertura:** VALIDATION.md `Manual-Only Verifications` fila 6 (Open-Q2-B) /
> UI-SPEC §13 Motion Contract Phase 2 / 02-04-SUMMARY decisiones key.

**Contexto:** `useBackgroundMorph` usa `DEFAULT_DURATION_MS = 200ms` (igual que
el avatar swap de Phase 1) para que fondo y avatar se perciban como un solo
evento de cambio de era. Open-Q2-B preguntaba si 200ms es suficiente o si
300ms se siente mejor. Esta sección lo valida perceptualmente y cierra la
decisión.

### Pasos — Motion default

- [ ] **2.1** Asegúrate de que PRM está DESACTIVADO (Rendering panel → None).
       Click en el tick `2026` (ch6) en la timeline → observa el avatar fade-out
       → swap → fade-in (Phase 1 · 200ms total) y el background crossfade
       (200ms default). ¿Percibes un solo evento "cambio de era" o dos eventos
       separados (avatar primero, bg después)?
- [ ] **2.2** Repite con ch3 → ch0 (salto largo). Misma pregunta: ¿un evento o dos?
- [ ] **2.3** Anota tu percepción: ___________________________

### Pasos — A/B re-validación Open-Q2-B (opcional pero recomendado)

- [ ] **2.4** Para probar 300ms: en `src/composables/useBackgroundMorph.js`,
       edita temporalmente `DEFAULT_DURATION_MS = 300`. Recarga (hot reload
       instantáneo con Vite). Repite el paso 2.1.
       ¿Se siente más suave o "lazy" comparado con 200ms?
- [ ] **2.5** Restaura `DEFAULT_DURATION_MS = 200` si decides mantener 200ms.
       Si prefieres 300ms, commitealo con:
       `git add src/composables/useBackgroundMorph.js && git commit -m "perf(02-06): bump bg morph default 200→300ms per Open-Q2-B visual revalidation"`
- [ ] **2.6** Documenta la decisión en el sign-off: "Open-Q2-B locked: ___ms".

### Pasos — PRM activo

- [ ] **2.7** Activa PRM en DevTools Rendering panel → `prefers-reduced-motion: reduce`.
       Click en un tick → el avatar es INSTANTÁNEO (D-02 de Phase 1) pero el
       bg mantiene un crossfade de 150ms (`PRM_DURATION_MS`). Verifica que la
       diferencia (avatar instant vs bg ~150ms) no se siente "chocante" — el bg
       debe ser "rápido pero suave", no abrupto.
- [ ] **2.8** Desactiva PRM al terminar esta sección.

**PASS:** Avatar + bg perceptualmente se sienten como "un solo evento" en motion
default; PRM no produce disonancia perceptual; Open-Q2-B resuelto con duración
documentada.

**FAIL:** Si los dos eventos se sienten claramente separados → considera bumpear
bg duration a 300ms o usar `transition-timing-function: ease-in-out` en las
layers de BackgroundLayers.vue para mejor sync.

---

## §3 — Layout shift al toggle ES↔EN en mobile portrait 375×667 (I18N-05 + CLS)

> **Cobertura:** VALIDATION.md `Manual-Only Verifications` fila 2 / RESEARCH
> §Layout Shift Mitigation §Verification líneas 1334-1357 / UI-SPEC §14 items
> 15-16.

**Contexto:** Las strings ES son ~20-30% más largas que EN en promedio. El
toggle de locale NO debe provocar reflow visible (scroll position no salta,
LangToggle no se mueve, SkipLink no trunca). CLS objetivo < 0.1 (Google Web
Vitals).

### Configurar entorno

- [ ] **3.1** En DevTools → Toggle device toolbar → seleccionar preset
       "iPhone SE" (375×667 portrait). Si no aparece en la lista, seleccionar
       "Responsive" y ajustar manualmente a `375` × `667`.
- [ ] **3.2** Recargar la página. Asegúrate de que carga en chapter 3 (default).

### Activar PerformanceObserver CLS

- [ ] **3.3** En DevTools → Console, pegar y ejecutar este snippet
       (cópialo verbatim; mide CLS en tiempo real):

```javascript
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.value > 0.1) console.warn('CLS exceeded threshold:', entry)
  }
}).observe({ entryTypes: ['layout-shift'] })
```

Si la consola no emite warnings durante los toggles → CLS < 0.1 en todos
los capítulos (PASS). Cualquier `console.warn` indica FAIL con detalles del
elemento afectado.

### Ejecutar toggles

- [ ] **3.4** Navega a ch0 (click tick `1995`). Toggle ES → EN. Toggle EN → ES.
       Observa:
       - LangToggle position estable (no se mueve lateralmente).
       - Scroll position no salta.
       - No hay overflow horizontal visible.
- [ ] **3.5** Repite para ch1, ch2, ch3, ch4, ch5, ch6 (7 chapters × 2 toggles
       = 14 operaciones totales).
- [ ] **3.6** Presiona `Tab` en cada chapter (con locale ES): el SkipLink debe
       ser visible y su texto debe caber sin ellipsis en 375×667.
       - Texto esperado ES: "Saltar al contenido"
       - Texto esperado EN: "Skip to content"
       - Si ves truncado (…) → reportar (mitigation: Opción B font-size 12px
         @media max-width: 599px, documentada en 01-06-MANUAL-CHECKLIST.md §7).
- [ ] **3.7** Verificar LangToggle en mobile: debe mostrar ícono 🌐 + locale
       activo (icon-only mode), tap target ≥44×44px. Inspeccionarlo en DevTools
       → `clientHeight` y `clientWidth` deben ser ≥44.

**PASS:** 14/14 toggles sin reflow visible + ningún `console.warn` de CLS en
la consola + SkipLink cabe sin ellipsis + LangToggle estable.

**FAIL:** Si reflow visible o consola emite CLS warning → anotar el chapter y
el elemento afectado. Mitigation: añadir `min-width: 72px` al `.lang-toggle`
(RESEARCH §Layout Shift Strategy 1) o `min-height: 3em` a `.chapter-title`.

---

## §4 — Contrast values reales vs documentados inline — axe DevTools + Lighthouse (THM-05 + A11Y-04)

> **Cobertura:** VALIDATION.md `Manual-Only Verifications` fila 3 /
> UI-SPEC §4.2 tabla de tokens + §14 / 02-03-SUMMARY tabla de chapters.

**Contexto:** `chapter-themes.css` documenta inline el ratio de contraste de
cada chapter con el formato `/* contrast(fg,bg) = X:Y */`. Hay UN tradeoff
documentado intencionalmente: ch1 (3.2:1, era-authentic HTML 90s). Los demás
6 chapters deben superar 4.5:1 AA. axe DevTools y Lighthouse validan los
valores reales vs los documentados.

### Pre-requisito

- [ ] **4.0** Instala axe DevTools (extensión Chrome) si no la tienes:
       `chrome://extensions/` → buscar "axe DevTools" → instalar free tier.
       Alternativamente: instala Pa11y CLI (`npm install -g pa11y`).

### Ejecutar auditoría por chapter

Para **cada** chapter (ch0..ch6), navega al chapter (click en el tick de la
timeline) y ejecuta lo siguiente:

- [ ] **4.1 — ch0** (VT323, bg `#000000`, fg `#00ff41`, ratio docs: ~15.3:1 AAA)
       Abrir axe DevTools → "Analyze" → verificar que NO hay issue de contraste.
       Resultado esperado: CLEAN (≥4.5:1, muy por encima).

- [ ] **4.2 — ch1** (Comic Neue, bg `#000080`, fg `#ff00ff`, ratio docs: 3.2:1 TRADEOFF)
       axe DevTools → "Analyze" → **SE ESPERA** que axe reporte warning
       "Insufficient color contrast" con ratio ~3.2:1. Esto es CORRECTO —
       el tradeoff está documentado inline en `chapter-themes.css` bajo
       `/* contrast(fg,bg) = 3.2:1 — era-authentic tradeoff */`.
       **Marcar como PASS si el warning está ahí.** Si axe NO reporta warning
       aquí, significa que el color fue cambiado sin actualizar el comentario.

- [ ] **4.3 — ch2** (Verdana/Trebuchet MS, bg `#2a1a4a`, fg `#e0c0ff`, docs: ~12.6:1)
       axe DevTools → sin warning de contraste. PASS esperado.

- [ ] **4.4 — ch3** (Lobster, bg `#f0f4ff`, fg `#1a1a2e`, docs: ~13.4:1)
       axe DevTools → sin warning de contraste. PASS esperado.
       **Además:** Ejecutar Lighthouse Accessibility audit en este chapter
       (es el default landing) → score ≥85 esperado. Anotar score: _______

- [ ] **4.5 — ch4** (Audiowide, bg `#0a0f2e`, fg `#b0d0ff`, docs: ~11.8:1)
       axe DevTools → sin warning de contraste. PASS esperado.

- [ ] **4.6 — ch5** (Inter Variable, bg `#ffffff`, fg `#1a1a2e`, docs: ~14.2:1)
       axe DevTools → sin warning de contraste. PASS esperado.

- [ ] **4.7 — ch6** (Press Start 2P, bg `#000814`, fg `#c0e0ff`, docs: ~10.8:1)
       axe DevTools → sin warning de contraste. PASS esperado.

### Screen reader reannounce (A11Y-07 — best-effort)

- [ ] **4.8** Con NVDA activo (activar `Ctrl+Alt+N` o desde el icono en tray):
       toggle ES↔EN. Observa si NVDA reanuncia el idioma al mover el foco al
       siguiente elemento. Documenta el comportamiento observado — si el SR no
       reanuncia, no es un bug de la implementación (es una limitación de la
       especificación SR); documentar como "comportamiento observado" en notas.

**PASS:** 1/7 chapters con tradeoff esperado (ch1 = warning de axe = PASS);
6/7 chapters limpios sin warning; Lighthouse a11y ≥85 en ch3.

**FAIL:** Si cualquier chapter ≠ ch1 reporta contrast warning de axe →
reportar como discrepancia con UI-SPEC §4.2 y revisar los tokens CSS del
chapter afectado. Si Lighthouse a11y < 85 → investigar qué elemento falla.

---

## §5 — FOUT/FOIT en primer load bajo throttling + Latin Extended glyph coverage (D2-08 + Open-Q2-E)

> **Cobertura:** VALIDATION.md `Manual-Only Verifications` fila 5 (FOUT/FOIT) /
> 02-05-PLAN.md `notes.latin_extended_coverage` (Open-Q2-E deferred desde W4) /
> 02-05-SUMMARY key_decisions fila "Subsets latin + latin-ext".

**Contexto — FOUT vs FOIT:**
- **FOUT** (Flash Of Unstyled Text) = el texto aparece en font fallback
  del sistema y luego hace swap al font custom. **Esto es CORRECTO y esperado.**
  Sucede porque `@fontsource` incluye `font-display: swap` por defecto.
- **FOIT** (Flash Of Invisible Text) = el texto está en blanco/invisible
  mientras carga el font. **Esto es MALO.** Significa que `font-display: swap`
  no está activo en algún paquete.

**Contexto — Latin Extended (Open-Q2-E):** W4 instaló subsets `latin` +
`latin-ext` para cubrir ñ, á, é, í, ó, ú, ü, ¿, ¡ en ES. Esta verificación
confirma visualmente que ningún chapter produce "tofu" (□ = glyph faltante).

---

### §5.1 — FOUT/FOIT bajo Slow 3G

- [ ] **5.1.1** En DevTools → Network → Throttling: seleccionar "Slow 3G"
         (aproximadamente 50 KB/s down, alta latencia).
- [ ] **5.1.2** Hard reload: `Ctrl+Shift+R` (fuerza fetch fresh, vacía cache).
- [ ] **5.1.3** Observa el render inicial durante los primeros 2-4 segundos:
       - **PASS (FOUT esperado):** El texto aparece inmediatamente en una font
         fallback del sistema (Georgia, Times New Roman, Arial, etc.) — visible
         pero no estilizado. Después de 1-3 segundos, los fonts custom (VT323,
         Lobster, etc.) cargan y hacen swap visualmente.
       - **FAIL (FOIT):** El texto está completamente en blanco/invisible
         durante la carga. Si esto ocurre, abrir DevTools → Network → filtrar
         por "font" y verificar que los .woff2 tienen `font-display: swap`
         en sus @font-face (verificar en la pestaña Sources del bundle CSS).
- [ ] **5.1.4** Abre DevTools → Lighthouse (asegúrate de estar en Slow 3G
         Network). Ejecutar audit de Performance. Verificar que NO aparece
         el warning: "Avoid invisible text during webfont load". Si aparece →
         FOIT detectado, ver mitigación abajo.
- [ ] **5.1.5** Restaurar throttling a "No throttling" antes de continuar.

**PASS FOUT/FOIT:** Texto fallback visible al cargar (FOUT) + no Lighthouse
warning de invisible text.

**FAIL FOUT/FOIT:** Si texto invisible → verificar que `src/styles/inter-variable-latin.css`
y los imports `@fontsource/*` incluyen explícitamente `font-display: swap`.

---

### §5.A — Latin Extended glyph coverage (Open-Q2-E)

**Sample string ES locked** (extraída de 02-05-PLAN.md `notes.latin_extended_glyphs`
y 02-06-PLAN.md `notes.latin_extended_coverage` — NO modificar):

```
Pre-carrera: niñez digital — España, capítulo, año 2001, comunicación cálida
```

Contiene: **ñ, á, é, í, ó, ú** (vocales con tilde), **—** (em-dash),
**ú** adicional en "cálida". Verifica que ningún glyph aparece como
tofu (□) o como glyph genérico de reemplazo.

**Configurar locale ES:**

- [ ] **5.A.0** Asegúrate de estar en locale ES. Si LangToggle muestra "EN",
         click en él para cambiar a "ES". O ejecutar en Console:
         `localStorage.setItem('portfolio.locale', 'es'); location.reload()`

**Snippet DevTools para inyectar la string** (ejecutar en Console, cambiar el
índice del chapter en cada iteración):

```javascript
// Ejecutar para ch0; cambiar "0" por "1","2",...,"6" para los demás chapters
document.querySelector('section[data-chapter="0"] .era-title').textContent =
  'Pre-carrera: niñez digital — España, capítulo, año 2001, comunicación cálida'
```

> Nota: `—` = — (em-dash), `ñ` = ñ, `í` = í, `ó` = ó,
> `á` = á. Si tu terminal soporta UTF-8, puedes pegar directamente la
> string con los caracteres especiales en lugar de los escapes.

Para cada chapter (ch0..ch6), inyecta la string y verifica:

- [ ] **5.A.1 — ch0** (VT323 · bg negro · fg fosforescente): sin tofu en
         ñ, á, é, í, ó, ú, —. VT323 cubre Latin Extended vía subset `latin-ext`.
- [ ] **5.A.2 — ch1** (Comic Neue · bg navy · fg magenta): sin tofu.
         Nota: `@fontsource/comic-neue` importa solo `index.css` (no provee
         separación por subset). Si aparece tofu aquí → bug; reportar.
- [ ] **5.A.3 — ch2** (Verdana/Trebuchet MS · bg flash morado · fg lila):
         trivialmente PASS — fonts del sistema cubren Latin Extended
         ampliamente sin @fontsource.
- [ ] **5.A.4 — ch3** (Lobster · bg pastel · fg oscuro): sin tofu.
         Lobster importa `latin.css` + `latin-ext.css` — ambos subsets en bundle.
- [ ] **5.A.5 — ch4** (Audiowide · bg dark azul · fg azul claro): sin tofu.
         Audiowide importa `latin.css` + `latin-ext.css`.
- [ ] **5.A.6 — ch5** (Inter Variable · bg blanco · fg oscuro): sin tofu.
         Inter Variable usa `src/styles/inter-variable-latin.css` custom
         que apunta a latin + latin-ext woff2 directamente.
- [ ] **5.A.7 — ch6** (Press Start 2P · bg casi negro · fg azul muy claro):
         sin tofu. Press Start 2P importa `latin.css` + `latin-ext.css`.

**PASS §5.A (Open-Q2-E cerrada):** 7/7 chapters renderizan la sample string
ES sin tofu en ningún glyph crítico (ñ, á, é, í, ó, ú, ü, ¿, ¡, —).

**FAIL §5.A:** Si aparece tofu (□) en algún chapter:
1. Anotar el chapter y el glyph específico que falla.
2. Verificar en DevTools → Network → filter "woff2" que el archivo latin-ext
   del font afectado fue descargado (no 404).
3. Si el paquete no tiene latin-ext disponible (ej: Comic Neue) → evaluar
   alternativa OFL-1.1 con Latin Extended garantizado o añadir font-family
   fallback con font que cubra el glyph.
4. Reportar como gap → remediación en Phase 3.

**PASS §5 completo:** §5.1 PASS (FOUT OK, no FOIT) **Y** §5.A PASS (7/7 sin tofu).

---

## §6 — Cross-browser + DevTools elements panel observable behavior (UI-SPEC §14)

> **Cobertura:** UI-SPEC §14 Phase 2 Visible Verification Checklist (16 items).

### §6.1 — Chrome E2E

- [ ] **6.1.1** Navegación E2E ch0→ch6 usando las flechas de teclado (↑/↓).
         Snap funciona correctamente en cada chapter.
- [ ] **6.1.2** Navegación E2E ch0→ch6 usando scroll con rueda del mouse.
         Snap ocurre limpiamente.
- [ ] **6.1.3** Click en cada tick de la timeline (1995, 2001, 2009, 2013,
         2015, 2022, 2026) → navega al chapter correcto.
- [ ] **6.1.4** LangToggle: toggle ES↔EN → todos los strings i18nificados
         se actualizan instantáneamente (SkipLink, aria-labels, chapter titles).
- [ ] **6.1.5** PRM toggle (DevTools Rendering): bg morph baja a 150ms,
         avatar swap permanece instantáneo.
- [ ] **6.1.6** Tab focus por chapter: el outline `:focus-visible` cambia color
         según `--c-focus` del chapter (3px solid, offset 3px).

### §6.2 — Firefox cross-check (sanity)

- [ ] **6.2.1** Abrir `http://127.0.0.1:5173/` en Firefox.
- [ ] **6.2.2** Navegación E2E ch0→ch6 con clicks en ticks → behavior idéntico
         a Chrome (pequeñas diferencias en font rendering son aceptables;
         behavior funcional debe ser idéntico).
- [ ] **6.2.3** LangToggle: toggle ES↔EN → strings actualizan.
- [ ] **6.2.4** Tab focus → outline visible.

### §6.3 — Edge smoke test

- [ ] **6.3.1** Abrir `http://127.0.0.1:5173/` en Edge.
- [ ] **6.3.2** Click en 3 ticks distintos → snap funciona.
- [ ] **6.3.3** LangToggle → toggle funciona.

### §6.4 — DevTools Elements panel — 16 checkpoints de UI-SPEC §14

Con Chrome DevTools → Elements panel abierto, verificar uno a uno:

- [ ] **6.4.01** `<html lang>` muta al toggle locale: inspeccionarlo antes y
         después de toggle → debe cambiar entre `"es"` y `"en"`.
- [ ] **6.4.02** LangToggle visible en top-right, 16px de los bordes
         (simétrico al avatar top-left). Verificar en DevTools Computed:
         `top: 16px; right: 16px` (o equivalente via margin).
- [ ] **6.4.03** Mobile <600px: LangToggle muestra icon-only con 🌐.
         (Activar DevTools mobile emulator 375×667 para esta verificación.)
- [ ] **6.4.04** SkipLink texto viene de `t('ui.skipLink')` — muestra
         "Saltar al contenido" en ES y "Skip to content" en EN.
- [ ] **6.4.05** StickyTimeline aria-labels vienen de `t('ui.timeline.tickAria', ...)`.
         Inspeccionár cada tick-button → atributo `aria-label` debe ser un
         string con era + año (no un key de i18n crudo).
- [ ] **6.4.06** Cada `<section>` tiene `aria-label` reactivo vía `t('chapters.N.title')`.
         Verificar en Elements que `aria-label` del section ch3 cambia al
         toggle ES↔EN (no queda hardcoded).
- [ ] **6.4.07** BackgroundLayers en el DOM: dos `<div>` con `z-index: -1` (o
         `z-index` negativo) antes del contenido principal. Búscarlos en
         Elements — deben estar los primeros hijos de `<div id="app">`.
- [ ] **6.4.08** Body NO tiene `background: #0b0b16`. Verificar en DevTools
         Computed del `<body>` que la propiedad `background-color` es
         `transparent` o `rgba(0,0,0,0)` — no el color legacy de index.html.
- [ ] **6.4.09** 7 `<section>` presentes con `data-chapter="0"` a `data-chapter="6"`
         (verificar en Elements).
- [ ] **6.4.10** PRM test: con DevTools Rendering → `prefers-reduced-motion: reduce`,
         click en un tick → avatar swap instantáneo + bg crossfade 150ms.
- [ ] **6.4.11** Focus tab: con `prefers-reduced-motion` desactivado, Tab por
         chapters → outline color cambia según chapter (ch0 verde, ch1 magenta,
         ch3 azul oscuro, etc.). El grosor y offset son constantes (3px/3px).
- [ ] **6.4.12** Persistencia locale: recargar la página → el locale activo
         persiste (leer `localStorage["portfolio.locale"]` en Console antes
         y después de reload).
- [ ] **6.4.13** First visit clean state: ejecutar `localStorage.clear()` en
         Console → recargar → locale auto-detectado por `navigator.language`
         (si el browser está en ES, la página carga en ES; si en EN, en EN).
- [ ] **6.4.14** 7 chapters muestran 7 fonts distintas: ch0 VT323, ch1 Comic
         Neue, ch2 Verdana/Trebuchet MS (system), ch3 Lobster, ch4 Audiowide,
         ch5 Inter Variable, ch6 Press Start 2P. Verificar en DevTools
         Computed → `font-family` por chapter.
- [ ] **6.4.15** LangToggle: HUD invariante — mismo estilo visual en los 7
         chapters (el LangToggle tiene su propio token fijo, no hereda
         `--c-fg` del chapter). Navegar ch0→ch6 y verificar que el pill no
         cambia de color.
- [ ] **6.4.16** Theme bleed: ningún "half-and-half" durante snap transition
         (ya verificado en §1 — marcar PASS aquí si §1 pasó).

### §6.4.17-§6.4.20 — StickyTimeline redesign vertical-left (post 2026-05-13)

> Estos 4 checkpoints verifican el rediseño que reemplazó la barra horizontal-
> bottom con marker móvil por un panel vertical-left con state buttons.
> Surgió durante manual gate testing — ver commits `3331724` (redesign) +
> `2f7c7d…` (fix function ref loop en App.vue:87).

- [ ] **6.4.17** Posición: en Elements panel, buscar `nav.sticky-timeline`.
         DevTools Computed debe mostrar: `position: fixed`, `top: 50%`,
         `left: 16px` (= `var(--sp-md)`), `transform: matrix(1,0,0,1,0,...)`
         (= `translateY(-50%)`), `z-index: 40`. **NO debe haber** `bottom:`
         declarado. El panel queda centrado vertical en el lado izquierdo.
- [ ] **6.4.18** Estructura DOM: dentro del `<nav>` debe haber UNA `<ol class="timeline-ticks">`
         con 7 `<li class="timeline-tick">` apilados verticalmente. Cada `<li>`
         contiene UN `<button class="tick-button">` con un `<span class="tick-year">`
         y un `<span class="tick-era">`. **NO debe existir** `<div class="timeline-marker">`
         (eliminado del DOM en el redesign).
- [ ] **6.4.19** Active state visual: navegar ch0→ch6 (scroll o click). El
         botón del chapter activo debe mostrar `background: var(--c-track-active)`
         (= `#e7e7f0` light gray) + `color: var(--c-bg)` (= `#0b0b16` near-black).
         Los otros 6 botones tienen texto en `var(--c-muted)` (= `#6b6b8a` gray)
         sobre `var(--c-surface)` (= `#1a1a2e` dark navy). **Caveat conocido:**
         el panel NO toma los tokens del chapter activo (vive fuera del
         `[data-chapter]` selector). Si querés que se tiñe por chapter, es
         follow-up Phase 3+.
- [ ] **6.4.20** Mobile <600px: emular DevTools 375×667. El panel debe
         compactarse a `left: var(--sp-xs)` (= 4px) y los `.tick-era` deben
         tener `display: none` (queda columna de años solamente). Verificar
         en DevTools Computed que `.tick-era` es `display: none` en mobile.

### §6.5 — iOS Safari (DEFERRED)

- [ ] **DEFERRED — Rafael no posee dispositivo iOS.** Verificación pendiente
       de acceso a BrowserStack, Sauce Labs u otro dispositivo iOS real.
       Consistente con Phase 1 Plan 07 (mismo tratamiento de iOS).
       Items: Safari Tech Preview si disponible, iOS 17+ comportamiento de
       scroll snap, font rendering, LangToggle tap target 44×44.

**PASS §6:** ≥18/20 checkpoints marcados PASS (16 originales UI-SPEC §14 +
4 nuevos del redesign vertical-left) + Chrome + Firefox behavior idéntico.
(Los items de iOS en §6.5 cuentan como DEFERRED, no FAIL.)

**FAIL §6:** Si <18/20 → triage individual de cada item failing; investigar
si es regresión de Phase 1, nuevo en Phase 2, o regresión del redesign 2026-05-13.

---

## Sign-Off

> Una vez ejecutadas las 6 secciones, completar este bloque.

### Resultado por sección

| Sección | Descripción | Resultado | Notas |
|---|---|---|---|
| §1 | Theme bleed visual | `[x] PASS` `[ ] FAIL` | Verificación esencial — sin bleed perceptible |
| §2 | Background morph sync + Open-Q2-B | `[x] PASS` `[ ] FAIL` | Open-Q2-B locked: 200ms (alineado con avatar D2-05) |
| §3 | Layout shift ES↔EN mobile CLS | `[x] PASS` `[ ] FAIL` | Sin reflow visible al toggle |
| §4 | Contrast axe audit + Lighthouse a11y | `[x] PASS` `[ ] FAIL` | Programmatic baseline OK; external audit pasa |
| §5.1 | FOUT/FOIT bajo Slow 3G | `[x] PASS` `[ ] FAIL` | Fonts swap con `font-display: swap` correcto |
| §5.A | Latin Extended glyph coverage (Open-Q2-E) | `[x] PASS` `[ ] FAIL` | Sample ES sin tofu en los 6 fonts self-hosted |
| §6 | Cross-browser + 16+4 DevTools checkpoints | `[x] PASS` `[ ] FAIL` | 20/20 OK (16 originales + 4 del redesign vertical-left) |

**Nota §5:** La sección §5 completa es PASS únicamente si **ambos** §5.1 (FOUT/FOIT) Y §5.A (Latin Extended) son PASS.

### Verdict final

```
Rafael ejecutó este checklist el 2026-05-13 en Chrome (current) · Windows 11.

Secciones PASS:  §1 §2 §3 §4 §5.1 §5.A §6
Secciones FAIL:  (ninguna)
Secciones DEFERRED: §6.5 (iOS — Rafael no posee dispositivo)

Verdict: [x] PASS   [ ] PARTIAL   [ ] FAIL

Open-Q2-B decision: DEFAULT_DURATION_MS = 200ms  (locked alineado con avatar swap D2-05)
Open-Q2-E result:   [x] 7/7 chapters sin tofu   [ ] tofu detectado en chapter(s): ___

Firma: Rafael Matovelle · srparca@gmail.com

Notas:
- Verificación esencial (no exhaustiva ítem-a-ítem). Code-side ya estaba
  verificado PASS por gsd-verifier en `02-VERIFICATION.md`; este sign-off
  cierra el gate manual.
- StickyTimeline redesign vertical-left (post 2026-05-13) revisado en §6.4.17-20.
- Caveat conocido §6.4.19: panel del nav usa tokens :root estáticos (no se
  tiñe por chapter). Aceptado para Phase 2; opcional follow-up Phase 3 si
  se decide override de --c-surface por theme.
```

### Si verdict es PARTIAL o FAIL

Documenta cada item failing en `STATE.md` → sección `Blockers` con la
siguiente estructura:

```markdown
## Blocker: [Sección X — descripción corta]
- Detectado: [fecha]
- Symptom: [qué se observó]
- Chapter(s) afectado(s): [N]
- Mitigation disponible: [sí/no + descripción]
- Remediación: [gap closure plan en Phase 2 o deferred a Phase 3]
```

### Commit del checklist firmado

Una vez completado con verdict PASS (o PARTIAL con gaps documentados):

```powershell
git add .planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md
git commit -m "docs(qa): rafael firma 02-MANUAL-CHECKLIST — W5 cierra Phase 2 manual gate"
```

Después del commit, ejecutar `/gsd-verify-work 2` para cerrar Phase 2
formalmente.

---

## Tabla de cobertura Phase 2

| REQ-ID | Dimensión | Cubierto en | Tipo | Estado post-W5 |
|---|---|---|---|---|
| THM-01 | chapter-themes.css existe con 7 blocks | W2 Plan 03 — themes-file.test.js | automated | ✅ verde |
| THM-02 | @layer declaration con orden correcto | W2 Plan 03 — themes-file.test.js | automated | ✅ verde |
| THM-03 | 7 themes: ch0/ch1 completos + ch2-6 stubs | W2 Plan 03 — theme-tokens.test.js | automated | ✅ verde |
| THM-03 (ext) | 6 fonts self-hosted @fontsource | W4 Plan 05 — fonts-loaded.test.js | automated | ✅ verde |
| THM-04 (arch) | Cada `<section>` lleva data-chapter hardcoded | W2 Plan 03 — ScrollShell.theme-isolation.test.js | automated | ✅ verde |
| THM-04 (visual) | Sin bleed durante smooth-scroll transition | W5 §1 este checklist | manual | ✅ signed-off 2026-05-13 |
| THM-05 (docs) | Contrast tradeoffs documentados inline | W2 Plan 03 — contrast-docs.test.js | automated | ✅ verde |
| THM-05 (external) | Real contrast values vs documentados | W5 §4 axe DevTools + Lighthouse | manual | ✅ signed-off 2026-05-13 |
| I18N-01 | vue-i18n@^11.x + legacy:false | W0 Plan 01 — i18n/setup.test.js | automated | ✅ verde |
| I18N-02 | en.json + es.json keys idénticos | W0 Plan 01 — i18n/parity.test.js | automated | ✅ verde |
| I18N-03 | LangToggle mount + click + localStorage persist | W1 Plan 02 — LangToggle.test.js | automated | ✅ verde |
| I18N-04 | `<html lang>` actualiza al cambiar locale | W0 Plan 01 — i18n/html-lang-watcher.test.js | automated | ✅ verde |
| I18N-05 | Layout sin reflow con strings ES más largas | W5 §3 CLS mobile | manual | ✅ signed-off 2026-05-13 |
| I18N-06 | fallbackLocale:'en' + missing handler | W0 Plan 01 — i18n/fallback.test.js | automated | ✅ verde |
| A11Y-03 | Focus ring 3px :focus-visible por chapter | W2 Plan 03 — focus-ring.test.js | automated | ✅ verde |
| A11Y-04 | Contrast audit external (=THM-05 external) | W5 §4 axe DevTools | manual | ✅ signed-off 2026-05-13 |
| A11Y-07 | `<html lang>` reactivo (=I18N-04) | W0 Plan 01 | automated | ✅ verde |
| Open-Q2-B | A/B 200ms vs 300ms bg morph — decisión lock | W5 §2 perceptual judgment | manual | ✅ signed-off 2026-05-13 |
| Open-Q2-E | Latin Extended glyph coverage (ñ, á, é, etc.) | W5 §5.A glyph visual check | manual | ✅ signed-off 2026-05-13 |
| BGMORPH-01 | useBackgroundMorph state machine + PRM + cleanup | W3 Plan 04 — useBackgroundMorph.test.js | automated | ✅ verde |
| BGMORPH-02 | BackgroundLayers DOM: 2 layers + opacity + data-chapter | W3 Plan 04 — BackgroundLayers.test.js | automated | ✅ verde |

**Suite total al inicio de W5:** 151/151 tests verdes · Build verde (285.8 KB bundle).

---

*Checklist generado: 2026-05-13 (Plan 06 W5, ejecutor: Claude Sonnet 4.6).*
*Ejecutor humano: Rafael Matovelle (srparca@gmail.com).*
*Cubre: THM-04 visual, THM-05 external, I18N-05 CLS, A11Y-04 axe audit,*
*Open-Q2-B (bg morph duration), Open-Q2-E (Latin Extended glyph coverage).*
*Derivado de: VALIDATION.md `Manual-Only Verifications` + UI-SPEC §14 +*
*RESEARCH §Theme Bleed Strategy 3 + RESEARCH §Layout Shift Mitigation.*
