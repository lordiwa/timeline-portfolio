<script setup>
// App.vue — Layout root del walking skeleton (Plan 02) + PRM provider (Plan 03)
// + SkipLink/ResizeObserver/focus-ring universal (Plan 06).
//
// Composición:
// - <SkipLink /> primer hijo del template root (UI-SPEC §10 — tab order: skip
//   → main → ticks). A11Y-01.
// - <ScrollShell /> renderizado como el único hijo scrolleable de #app.
// - useScrollState(shellRef) instanciado en setup() — el composable usa
//   `watch(shellRef, ..., { immediate: true, flush: 'post' })` internamente
//   así que NO importa que shellRef.value sea null en este momento (PATTERN A).
// - provide('scrollState', ...) para que StickyAvatar/StickyTimeline puedan inject.
// - Plan 03 (W2): usePRM() instanciado y provisto como 'prm' — single source of
//   truth para prefers-reduced-motion. UI-SPEC §8.
// - Plan 06 (W5): useResizeObserver(document.documentElement, ...) cableado
//   como placeholder defensive — viewportWidth/viewportHeight refs NO se
//   consumen en Phase 1, pero satisfacen MOB-03 (ResizeObserver sobre
//   document.documentElement, no orientationchange). Phase 5 (Phaser) los
//   promoverá para Math.floor(vw/480), Math.floor(vh/270).
//
// El "function ref" pattern del template asigna `el.shellEl` (expuesto por
// ScrollShell vía defineExpose) al shellRef cuando ScrollShell monta.

import { ref, provide, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import BackgroundLayers from './components/BackgroundLayers.vue'
import SkipLink from './components/SkipLink.vue'
import ScrollShell from './components/ScrollShell.vue'
import StickyAvatar from './components/StickyAvatar.vue'
import StickyTimeline from './components/StickyTimeline.vue'
import LangToggle from './components/LangToggle.vue'
import ContactHUD from './components/ContactHUD.vue'
import GlobalMantra from './components/GlobalMantra.vue'
import SoundToggle from './components/SoundToggle.vue'
import BootScreen from './components/BootScreen.vue'
import DialUpScreen from './components/DialUpScreen.vue'
import EraTransition from './components/EraTransition.vue'
import { useScrollState } from './composables/useScrollState'
import { usePRM } from './composables/usePRM'
import { useBackgroundMorph } from './composables/useBackgroundMorph'
import { useAudio } from './composables/useAudio'
import { seoConfig, buildPersonSchema } from './config/seo'

const shellRef = ref(null)
// Function ref con identidad estable: arrow inline `el => { shellRef.value = ... }`
// se recrea en cada render, lo cual hace que Vue invoque setRef dos veces por patch
// (una con null para desbindear el viejo, otra con el nuevo). Ese churn dispara el
// watch de useScrollState (flush:'post') → IntersectionObserver re-init → re-render
// → loop "Maximum recursive updates exceeded". Una función con identidad estable
// evita el ciclo (Vue compara la referencia y no re-bindea).
function setShellRef(el) {
  shellRef.value = el?.shellEl ?? null
}
const scrollState = useScrollState(shellRef)
const prm = usePRM()

// ─── Motor de audio procedural ───────────────────────────────────────────────
// Instanciar ANTES de provide para que BootScreen y SoundToggle puedan inyectar.
// En entorno test, los imports de engine/sequencer/tracks son mocks o no-op —
// el BootScreen se auto-omite via IS_TEST_ENV guard.
const audio = useAudio()
audio.initAudioWatcher(scrollState.activeChapter)

provide('scrollState', scrollState)
provide('prm', prm)
// 'audio' provisto para BootScreen (unlock + playCurrentEra) y SoundToggle (muted, toggle)
provide('audio', audio)

// Plan 02-04 (W3): useBackgroundMorph — motor de crossfade 2 capas sincronizado
// con el avatar swap (200ms default, 150ms PRM). Provisto como 'bgMorph' para
// que BackgroundLayers.vue lo consuma via inject('bgMorph'). UI-SPEC §7 + D2-04/D2-05.
const bgMorph = useBackgroundMorph(scrollState.activeChapter, prm)
provide('bgMorph', bgMorph)

// I18N-04 + A11Y-07 — single source of truth para <html lang> mutation.
// { immediate: true } garantiza sincronización desde el primer render (RESEARCH Pattern 6).
// t añadido en Plan 03-04 para useHead reactive title/description (SEO-03).
const { locale, t } = useI18n()
watch(locale, (l) => {
  document.documentElement.lang = l
}, { immediate: true })

// Redesign 2026-07-09 — theming de HUDs fijos era-reactivo.
// Los HUDs (StickyTimeline/StickyAvatar/LangToggle/ContactHUD/GlobalMantra)
// viven FUERA de las <section data-chapter> — antes resolvían siempre los
// tokens neutros de :root y nunca se re-tematizaban. Estampar el chapter activo
// en <html> via data-ACTIVE-chapter (atributo DISTINTO a data-chapter, para no
// activar selectores de componentes como `[data-chapter="5"] .project-card`
// fuera de su section) hace cascada de los tokens del theme activo
// (:root[data-active-chapter="N"] en chapter-themes.css) hacia todo el árbol.
// Las sections y .bg-layer llevan su PROPIO data-chapter — scope intacto.
//
// Transiciones de era 2026-07-09 — velo de viaje temporal.
// Cuando cambia la era, un overlay fixed lanza un pulso radial MUY sutil
// (opacity 0 → 0.10 → 0, 420ms) en el accent de la era entrante.
// La clase .era-veil--active activa la animación; animationend la limpia.
// PRM: desactivado (oldN guard). No dispara en el render inicial (oldN === undefined).
const veilActive = ref(false)

watch(scrollState.activeChapter, (N, oldN) => {
  if (Number.isInteger(N)) document.documentElement.dataset.activeChapter = String(N)
  if (oldN !== undefined && N !== oldN && !prm.prefersReduced.value) {
    veilActive.value = false
    requestAnimationFrame(() => requestAnimationFrame(() => { veilActive.value = true }))
  }
}, { immediate: true })

// ─────────────────────────────────────────────────────────────────────────────
// ResizeObserver defensive — MOB-03 (UI-SPEC §9, RESEARCH §Área 7).
// Refs internos NO consumidos en Phase 1; Phase 5 (Phaser scene) los necesita
// para zoom recalculation. Mantenerlos cableados desde day 1 evita re-cableo
// en Phase 5 y satisface MOB-03 literalmente. vueuse maneja cleanup.
// ─────────────────────────────────────────────────────────────────────────────
const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)

useResizeObserver(document.documentElement, (entries) => {
  const entry = entries[0]
  if (!entry) return
  viewportWidth.value = entry.contentRect.width
  viewportHeight.value = entry.contentRect.height
})

// ─────────────────────────────────────────────────────────────────────────────
// SEO wiring (Plan 03-04) — SEO-01..04 reactive al locale via useI18n.
// RESEARCH Pattern 2 verbatim (@unhead/vue@^1.11.20 LOCKED, Vite 5 compat).
//
// title/description/og:title/og:description: () => t(key) — REACTIVE al locale.
//   Al toggle ES↔EN, unhead propaga el cambio al <title> + meta sin re-mount.
// og:image, og:type, og:url: string estático — no dependen del locale.
// hreflang: 3 links (es, en, x-default) — estáticos, apuntan a siteUrl placeholder.
// JSON-LD Person schema: ESTÁTICO (schema.org tolera name/jobTitle en un idioma).
//   Construido via buildPersonSchema() de src/config/seo.js — NO user input.
//   textContent (no innerHTML) — safe-by-default por T-SEO-INJ + T-XSS-HEAD.
// siteUrl PLACEHOLDER hasta Phase 6 (Firebase Hosting confirma dominio real).
// og-image.png: placeholder 1×1 hasta Rafael provea screenshot 1200×630 post-03-05.
// ─────────────────────────────────────────────────────────────────────────────
useHead({
  title: () => t('seo.title'),
  meta: [
    { name: 'description',        content: () => t('seo.description') },
    // OG meta (SEO-01)
    { property: 'og:title',       content: () => t('seo.title') },
    { property: 'og:description', content: () => t('seo.description') },
    { property: 'og:image',       content: `${seoConfig.siteUrl}/og-image.png` },
    { property: 'og:type',        content: 'website' },
    { property: 'og:url',         content: seoConfig.siteUrl },
  ],
  // hreflang (SEO-04)
  link: [
    { rel: 'alternate', hreflang: 'es',        href: seoConfig.siteUrl },
    { rel: 'alternate', hreflang: 'en',        href: `${seoConfig.siteUrl}?lang=en` },
    { rel: 'alternate', hreflang: 'x-default', href: seoConfig.siteUrl },
  ],
  // JSON-LD Person schema (SEO-02) — textContent NOT innerHTML (T-SEO-INJ mitigated)
  script: [
    {
      type: 'application/ld+json',
      textContent: JSON.stringify(buildPersonSchema()),
    },
  ],
})
</script>

<template>
  <!-- Orden DOM (UI-SPEC §6 + §7.3 + §10 post-W1-Phase3):
       BackgroundLayers → SkipLink → StickyAvatar → ScrollShell → StickyTimeline → LangToggle → ContactHUD
       Tab order derivado del orden DOM:
         1. .skip-link (primer focusable)
         2. #main-content (ScrollShell con tabindex="0")
         3. .tick-button[data-chapter="0"] ... [data-chapter="6"]
       El avatar es non-focusable (aside con span). Visualmente el z-index
       controla la pila: bg-layers -1 (fondo) | skip-link 50 (top) | avatar/timeline/HUDs 40 | chapters 0.
       BackgroundLayers: position:fixed, z-index:-1, pointer-events:none (no interfiere con tab/click).
       LangToggle: position:fixed top-right. ContactHUD: position:fixed bottom-right. Ambos z-index:40.
       ContactHUD es invariante a chapter (D3-10) — análogo a LangToggle (Phase 2 W1). -->
  <!-- BootScreen: overlay z-index máximo, primer hijo visible.
       Se auto-omite en entorno test (IS_TEST guard en onMounted).
       Llama engine.unlock() + audio.playCurrentEra() al elegir S/M. -->
  <BootScreen />
  <BackgroundLayers />
  <SkipLink />
  <StickyAvatar />
  <ScrollShell :ref="setShellRef" />
  <StickyTimeline />
  <LangToggle />
  <ContactHUD />
  <!-- SoundToggle: botón HUD bottom-left. z-index 40. -->
  <SoundToggle />
  <!-- DialUpScreen: overlay ch1 dial-up Win98 al entrar por primera vez en la sesión -->
  <DialUpScreen />
  <!-- GlobalMantra: signature cross-chapter (Rafael 2026-05-14 "en todas las fechas"). -->
  <GlobalMantra />
  <!-- Velo de viaje temporal: pulso radial en --c-accent de la era entrante.
       z-index 48: sobre HUDs (40) pero bajo .skip-link (50). pointer-events:none.
       aria-hidden: elemento decorativo puro. animationend limpia la clase. -->
  <div
    class="era-veil"
    :class="{ 'era-veil--active': veilActive }"
    aria-hidden="true"
    @animationend="veilActive = false"
  />
  <!-- Pixel dissolve wipe entre eras (Rafael 2026-07-10): la capa FUERTE de la
       transición — bloques del color de la era destino inundan y se disuelven.
       z-index 49 (cubre HUDs y velo, bajo skip-link). Se auto-gestiona vía
       inject scrollState/prm; salta el cruce 2→3 (signature drenado). -->
  <EraTransition />
</template>

<!--
  Global tokens (UI-SPEC §3 + §4). NO scoped — declaran CSS Custom Properties
  en :root para que cualquier componente descendiente las consuma. Phase 2 las
  sobreescribirá por [data-chapter="N"] selectors a nivel de tema.
-->
<style>
/* Tokens neutros en @layer reset (redesign 2026-07-09): antes este :root era
   un-layered y por cascade layering le GANABA a los tokens era-reactivos
   :root[data-active-chapter="N"] (@layer themes) de chapter-themes.css —
   los HUDs fijos nunca se re-tematizaban. reset < themes en el orden
   declarado (`@layer reset, themes, components, utilities`). */
@layer reset {
  :root {
    /* Spacing — UI-SPEC §3 */
    --sp-xs: 4px;
    --sp-sm: 8px;
    --sp-md: 16px;
    --sp-lg: 24px;
    --sp-xl: 32px;
    --sp-2xl: 48px;
    --sp-3xl: 64px;

    /* Color (paleta neutra Phase 1) — UI-SPEC §4 */
    --c-bg: #0b0b16;
    --c-fg: #e7e7f0;
    --c-surface: #1a1a2e;
    --c-border: #2e2e4a;
    --c-track: #2e2e4a;
    --c-track-active: #e7e7f0;
    --c-marker: #a0a0c0;
    --c-focus: #7dd3fc;
    --c-muted: #6b6b8a;
    --c-tick-hover: #c0c0d8;
    /* Accent neutro fallback (redesign 2026-07-09): los HUDs fijos derivan
       bordes/glows de --c-accent via color-mix; antes del primer stamp de
       html[data-active-chapter] (o si JS no corre) este valor evita
       declaraciones inválidas-at-computed-value. Familia del --c-focus cyan. */
    --c-accent: #7dd3fc;
  }
}

/* PRM defensive CSS-side — D-01 (UI-SPEC §8 + RESEARCH §Área 5).
   El composable usePRM de Plan 03 añadirá el branch JS para scrollTo({behavior}). */
.scroll-shell {
  scroll-behavior: smooth;
}
@media (prefers-reduced-motion: reduce) {
  .scroll-shell {
    scroll-behavior: auto;
  }
}

/* Focus ring universal — UI-SPEC §10 (Plan 06, A11Y-05 — interaction-derived
   por D-05, se mantiene bajo PRM). Aplica a CUALQUIER focusable: .skip-link,
   #main-content, .tick-button, y cualquier futuro elemento. Declarado en este
   <style> NO scoped para que aplique a los componentes hijos (un scoped no
   alcanzaría a SkipLink/ScrollShell/StickyTimeline). Phase 2 puede sobreescribir
   --c-focus por theme manteniendo grosor y offset. */
:focus-visible {
  outline: 3px solid var(--c-focus);
  outline-offset: 3px;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Velo de viaje temporal (transiciones de era 2026-07-09).
 * Overlay fixed full-viewport: pulso radial MUY sutil en --c-accent de la
 * era entrante. opacity 0 → 0.10 → 0 en 420ms.
 * Max opacity 0.10 = safe fotosensibilidad (WCAG 2.3.3 < 0.12 threshold).
 * ────────────────────────────────────────────────────────────────────────── */
.era-veil {
  position: fixed;
  inset: 0;
  z-index: 48;
  pointer-events: none;
  background: radial-gradient(
    ellipse 65% 65% at 50% 50%,
    var(--c-accent) 0%,
    transparent 70%
  );
  opacity: 0;
}

.era-veil--active {
  animation: era-veil-pulse 420ms ease-out forwards;
}

@keyframes era-veil-pulse {
  0%   { opacity: 0; }
  38%  { opacity: 0.10; }
  100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .era-veil--active {
    animation: none;
  }
}
</style>
