<!--
  Chapter3Content.vue — TASK-009: rediseño total de ch3 "La muerte de Flash" (2013).

  Fuente de verdad: .planning/design/03-ch3-muerte-de-flash.md (complementa,
  sin reemplazar, .planning/design/00-sistema-visual-global.md). Reemplaza
  COMPLETO el concepto "Kingdom New Lands" (iter11, pixel art medieval) — Rafael
  autorizó cambio total de estilo: "no temas cambiar el estilo, eso solo es una
  maqueta de lo que visualizo ahi".

  Guion visual en dos actos (spec §3):
  - Acto 1 (`.ch3-act1-*`), pinned sobre ~220vh: un navegador de 2013 con el
    stage de Flash de 550x400 muriendo en pantalla al scrollear (degradado que
    se drena, capas que se despegan, vector que colapsa a flat) + un teléfono
    mostrando el puzzle de plugin faltante (Flash nunca existió en mobile).
    Escenografía 100% procedural (CSS + SVG inline) — CERO imágenes nuevas.
  - Acto 2 (`.ch3-hero` + `.ch3-beats` + `.ch3-close`), flujo normal: el
    renacimiento flat de 2013 (Flat UI Colors, Open Sans, ghost buttons, iconos
    long-shadow). 5 beats en zig-zag (Ch3StoryBeat.vue) — uno por párrafo de
    bio.eras.3 — muestran SIEMPRE el numeral+kicker+lead sin click (defecto 4
    de TASK-007: 270 palabras ya no quedan detrás de un click); un expansor
    "Seguir leyendo" profundiza I-IV, el beat V (el remate) va completo.

  Motion (spec §7): el scrub del Acto 1 y el parallax del hero se escriben
  directo al DOM vía requestAnimationFrame (mismo patrón --sx/--mx que ya usan
  Chapter3/Chapter4 — evita reactividad Vue en cada frame de scroll). Detrás de
  `@supports (animation-timeline: scroll())` hay una capa de mejora progresiva
  con scroll-driven animations nativas que, donde el navegador la soporta,
  reemplaza el valor JS por compositor puro (más fluido); el rAF es el camino
  garantizado y es el que se verificó en esta sesión (sin tooling de navegador
  disponible para confirmar visualmente la capa nativa — ver hand-off).
  PRM: el Acto 1 queda en un cuadro estático (botón ya sin brillo, plugin
  bloqueado, teléfono con el puzzle) y el pin baja a 100vh exacto; el Acto 2
  se renderiza completo sin reveals.

  CSS: TODO el CSS de ch3 vive AQUÍ (retirado de chapter-components.css por
  este mismo ticket, ver comentario de migración en ese archivo). El bloque de
  `<style>` es DELIBERADAMENTE sin `scoped` (mismo patrón que el segundo
  `<style>` de ScrollShell.vue: "sin scoped para que los selectores traversen
  el shadow de componentes hijos") — Ch3StoryBeat.vue es un componente hijo y
  sus elementos internos (numeral, kicker, lead, expansor) no son su nodo raíz,
  así que un `<style scoped>` de este archivo no los alcanzaría. Todos los
  selectores usan el prefijo `ch3-`, consistente con el resto del proyecto.
-->
<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'
import Ch3StoryBeat from './Ch3StoryBeat.vue'

const { t } = useI18n()

const chapter = chapters[3]
const ch3Projects = computed(() => projects.filter((p) => p.chapterEra === 3))

// bio.eras.3.text trae 5 párrafos separados por \n\n — uno por beat (spec §8).
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// ── PRM ──────────────────────────────────────────────────────────────────────
const prm = inject('prm', null)
const reduced = () => prm?.prefersReduced?.value ?? false

// ── Destape de la narrativa (spec §8, defecto 4 de TASK-007) ─────────────────
// Lead visible sin click = las primeras N oraciones del párrafo, partidas por
// el token literal ". " — NO regex (spec: "no parsear con regex el texto
// i18n"). La prosa real de bio.eras.3 tiene la MISMA cantidad de oraciones por
// párrafo en ES y EN (4/3/3/3/2), verificado a mano sobre ambos locales; por
// eso un único array de conteos sirve para los dos idiomas. El beat V (índice
// 4, el remate del capítulo) siempre va completo — spec §3 acto 2 punto 2.
const LEAD_SENTENCE_COUNT = [2, 2, 2, 2]

function splitLead(text, leadCount) {
  const sentences = text.split('. ')
  if (sentences.length <= leadCount) return { lead: text, rest: '' }
  const leadSentences = sentences.slice(0, leadCount)
  const last = leadSentences[leadSentences.length - 1]
  const lead = leadSentences.join('. ') + (last.endsWith('.') ? '' : '.')
  const rest = sentences.slice(leadCount).join('. ')
  return { lead, rest }
}

function lastSentence(text) {
  const sentences = text.split('. ')
  const last = sentences[sentences.length - 1] || text
  return last.endsWith('.') ? last : `${last}.`
}

// Metadatos por beat — icono (Ch3StoryBeat), tono de acento (spec §4: rojo
// residual SOLO beat I, HTML5 naranja SOLO beat V, el resto usa el acento
// estándar de la era --c-accent).
const BEAT_META = [
  { key: 'flash', icon: 'flash', tone: 'residual' },
  { key: 'rebuild', icon: 'code', tone: 'accent' },
  { key: 'method', icon: 'sprint', tone: 'accent' },
  { key: 'edge', icon: 'megaphone', tone: 'accent' },
  { key: 'leap', icon: 'shield', tone: 'html5' },
]

const beats = computed(() =>
  BEAT_META.map((meta, i) => {
    const paragraph = bioParagraphs.value[i] || ''
    const full = i === BEAT_META.length - 1
    const { lead, rest } = full ? { lead: paragraph, rest: '' } : splitLead(paragraph, LEAD_SENTENCE_COUNT[i])
    return {
      ...meta,
      numeral: String(i + 1).padStart(2, '0'),
      kicker: t(`ch3.beats.${i}.kicker`),
      lead,
      rest,
      expandable: !full && rest.length > 0,
      full,
      reverse: i % 2 === 1,
    }
  })
)

const closingLine = computed(() => lastSentence(bioParagraphs.value[4] || ''))

// ── Acto 1 — scrub del pin (0..1) + parallax del hero, escritos directo al DOM ──
// (mismo patrón --sx/--mx ya usado en el resto del sitio — evita reactividad
// Vue en cada frame de scroll). Bajo PRM el valor queda congelado (ver
// onMounted): el Acto 1 se muestra en su cuadro "botón ya sin brillo, plugin
// bloqueado" (~p=0.4, el final de la tramo de desaturación) en vez del p=0.15
// literal de la spec — a esa altura el botón TODAVÍA brilla según los propios
// tramos de la spec §3, así que se priorizó la descripción textual del estado
// congelado ("botón ya sin brillo") sobre el número exacto (conflicto interno
// de la spec, documentado en el hand-off).
const pinRef = ref(null)
const sceneRef = ref(null)
const heroRef = ref(null)
const beatsRef = ref(null)

let raf = 0
let pendingScrollTop = 0
let pendingViewportH = 0

function flushMotion() {
  raf = 0
  const pinEl = pinRef.value
  const sceneEl = sceneRef.value
  if (pinEl && sceneEl) {
    const pinDistance = Math.max(pinEl.offsetHeight - pendingViewportH, 1)
    const p = Math.min(Math.max(pendingScrollTop / pinDistance, 0), 1)
    sceneEl.style.setProperty('--ch3-p', p.toFixed(4))
  }
  const heroEl = heroRef.value
  if (heroEl) {
    const hy = pendingScrollTop - heroEl.offsetTop
    heroEl.style.setProperty('--ch3-hy', hy.toFixed(1))
  }
}

function onStageScroll(e) {
  if (reduced()) return
  pendingScrollTop = e.target.scrollTop
  pendingViewportH = e.target.clientHeight
  if (!raf) raf = requestAnimationFrame(flushMotion)
}

function scrollToBeats() {
  beatsRef.value?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' })
}

onMounted(() => {
  // Estado inicial: 0 en movimiento normal; congelado en 0.4 bajo PRM (ver
  // comentario arriba). No se usa un binding :style reactivo para --ch3-p /
  // --ch3-hy a propósito — Vue re-parchearía el estilo en cada re-render
  // (p.ej. al togglear locale) y pisaría el valor que escribe el scroll.
  sceneRef.value?.style.setProperty('--ch3-p', reduced() ? '0.4' : '0')
  heroRef.value?.style.setProperty('--ch3-hy', '0')
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div class="ch3-stage" @scroll="onStageScroll">
    <!-- ══════════════════════════════════════════════════════════════════
         ACTO 1 — el plugin muere (pinned, scrubbed por scroll)
         ══════════════════════════════════════════════════════════════════ -->
    <div ref="pinRef" class="ch3-act1-pin" :class="{ 'is-reduced': reduced() }">
      <div ref="sceneRef" class="ch3-act1-scene">
        <h1 class="ch3-act1-title">{{ t('ui.deathOfFlash') }}</h1>

        <div class="ch3-act1-decor" aria-hidden="true">
          <div class="ch3-desktop"></div>

          <div class="ch3-browser">
            <div class="ch3-browser-tabs"><span class="ch3-browser-tab"></span></div>
            <div class="ch3-browser-omnibox"></div>
            <div class="ch3-browser-infobar">
              <span>{{ t('ch3.ui.infobar') }}</span>
              <span class="ch3-ghost-btn ch3-ghost-btn--tiny">{{ t('ch3.ui.runOnce') }}</span>
            </div>

            <div class="ch3-flash-stage">
              <div class="ch3-flash-btn">
                <span class="ch3-flash-shadow"></span>
                <span class="ch3-flash-bevel"></span>
                <span class="ch3-flash-fill"></span>
                <span class="ch3-flash-desat"></span>
                <span class="ch3-flash-specular"></span>
                <span class="ch3-flash-play">&#9654;</span>
              </div>
              <svg class="ch3-wireframe" viewBox="0 0 100 72">
                <rect x="4" y="4" width="92" height="64" rx="2" />
                <circle cx="4" cy="4" r="2" /><circle cx="96" cy="4" r="2" />
                <circle cx="96" cy="68" r="2" /><circle cx="4" cy="68" r="2" />
                <circle cx="50" cy="36" r="2" />
              </svg>
              <div class="ch3-flat-block"></div>
            </div>
          </div>

          <div class="ch3-phone">
            <div class="ch3-phone-screen">
              <svg class="ch3-puzzle" viewBox="0 0 40 40">
                <path d="M4 10h6a3 3 0 1 1 0 6H4v6h6a3 3 0 1 1 0 6H4a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z" />
              </svg>
              <p class="ch3-phone-note">{{ t('ch3.ui.phoneNote') }}</p>
            </div>
          </div>

          <div class="ch3-act1-cue"><span class="ch3-act1-cue-arrow">&#8964;</span></div>
        </div>

        <div class="ch3-act1-white" aria-hidden="true"></div>
        <div class="ch3-act1-accent" aria-hidden="true"></div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════
         ACTO 2 — el renacimiento flat (flujo normal)
         ══════════════════════════════════════════════════════════════════ -->
    <div class="ch3-act2">
      <div ref="heroRef" class="ch3-hero">
        <div class="ch3-hero-parallax" aria-hidden="true">
          <div class="ch3-hero-sky"></div>
          <div class="ch3-hero-hill ch3-hero-hill--back"></div>
          <div class="ch3-hero-hill ch3-hero-hill--front"></div>
          <span class="ch3-hero-cloud ch3-hero-cloud--a"></span>
          <span class="ch3-hero-cloud ch3-hero-cloud--b"></span>
        </div>
        <div class="ch3-hero-copy">
          <h2 class="ch3-hero-title">{{ t('ch3.hero.title') }}</h2>
          <p class="ch3-hero-sub">{{ t('ch3.hero.sub') }}</p>
          <button type="button" class="ch3-ghost-btn" @click="scrollToBeats">{{ t('ch3.hero.cta') }}</button>
        </div>
      </div>

      <div ref="beatsRef" class="ch3-beats">
        <Ch3StoryBeat
          v-for="beat in beats"
          :key="beat.key"
          :numeral="beat.numeral"
          :kicker="beat.kicker"
          :icon="beat.icon"
          :tone="beat.tone"
          :lead="beat.lead"
          :rest="beat.rest"
          :expandable="beat.expandable"
          :full="beat.full"
          :reverse="beat.reverse"
        />
      </div>

      <footer class="ch3-close">
        <svg class="ch3-close-badge" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M24 8l14 5-2 15q0 8-12 12Q12 36 12 28L10 13z" />
          <path d="M18 23l6 6 8-10" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <p class="ch3-close-line">{{ closingLine }}</p>
      </footer>

      <div v-if="ch3Projects.length > 0" class="ch3-projects">
        <ProjectCard v-for="project in ch3Projects" :key="project.id" :project="project" />
      </div>
    </div>
  </div>
</template>

<style>
/* ─────────────────────────────────────────────────────────────────────────
 * @property — --ch3-p (progreso 0..1 del scrub del Acto 1) registrada como
 * <number> para que la capa de mejora progresiva (scroll-driven nativo, más
 * abajo) pueda ANIMARLA con @keyframes (spec §7 + tokens.css §4.5, mismo
 * patrón que --era-progress).
 * ───────────────────────────────────────────────────────────────────────── */
@property --ch3-p {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

@layer components {
  /* ───────────────────────────────────────────────────────────────────────
   * Tokens locales de ch3 — Flat UI Colors (Designmodo, 2013), spec §4.
   * eras.css ya define los 6 semánticos (--c-bg/fg/accent/border/focus/
   * surface) + --font-body para [data-chapter="3"]; estos son los matices
   * EXTRA que la paleta de 2013 necesita y que ese contrato de 6 tokens no
   * cubre (residuo Flash, HTML5, texto secundario, long-shadow).
   * ─────────────────────────────────────────────────────────────────────── */
  .ch3-stage {
    --ch3-text-2: #34495e; /* Wet Asphalt — subtítulo hero, texto secundario */
    --ch3-residual: #e74c3c; /* Alizarin — acento residual de Flash, solo beat I */
    --ch3-html5: #e34f26; /* color oficial HTML5 — solo beat V y cierre */
    --ch3-long-shadow: rgba(44, 62, 80, 0.15);
    --ch3-close-bg: #2c3e50; /* Midnight Blue — franja de cierre, puente a ch4 */
    --ch3-white: #ecf0f1; /* Clouds — mismo tono que --c-bg de la era */

    position: relative;
    height: 100vh;
    height: 100dvh;
    max-height: 100dvh;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
    background: var(--c-bg);
    color: var(--c-fg);
    font-family: var(--font-body);
  }

  /* ═══════════════════════════════════════════════════════════════════════
   * ACTO 1 — escenografía procedural del plugin muerto. Tokens locales:
   * "asset-scene" documentado (spec sistema visual §3 — excepción de hex
   * literales para escenas de arte concretas; los Flat UI Colors del Acto 2
   * viven arriba como tokens semánticos del componente).
   * ═══════════════════════════════════════════════════════════════════════ */
  .ch3-act1-pin {
    --ch3-desk: #2b2d31;
    --ch3-chrome: #3a3d42;
    --ch3-chrome-border: #4a4d52;
    --ch3-infobar-bg: #fdf3d0;
    --ch3-infobar-fg: #6b5d1f;
    --ch3-flash-a: #b3151d;
    --ch3-flash-b: #7a0c12;
    --ch3-flash-specular-c: rgba(255, 255, 255, 0.35);
    --ch3-dead-gray: #7f8c8d;
    --ch3-puzzle-gray: #8e8e93;
    --ch3-wire: #3498db;
    --ch3-flat-red: #e74c3c;

    position: relative;
    height: 220vh;
    height: 220dvh;
  }

  .ch3-act1-scene {
    position: sticky;
    top: 0;
    height: 100vh;
    height: 100dvh;
    width: 100%;
    overflow: hidden;
    background: var(--ch3-desk);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ch3-act1-title {
    position: relative;
    z-index: 3;
    margin: 0 0 clamp(220px, 30vh, 320px);
    font-family: var(--font-body);
    font-weight: 300;
    font-size: var(--fs-700);
    color: #f3f4f6;
    text-align: center;
    letter-spacing: -0.01em;
  }

  .ch3-act1-decor {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2xl);
    padding-top: 8vh;
    /* Fade de todo el chrome (navegador + teléfono) hacia el final del scrub —
       spec §3 tramo p 0.70-0.85. */
    opacity: calc(1 - max(0, (var(--ch3-p) - 0.7) * 6.5));
  }

  /* ── Navegador 2013 (CSS puro) ────────────────────────────────────────── */
  .ch3-browser {
    position: relative;
    width: min(620px, 62vw);
    border: 1px solid var(--ch3-chrome-border);
    background: var(--ch3-chrome);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  }
  .ch3-browser-tabs {
    display: flex;
    gap: 6px;
    padding: 8px 10px 0;
  }
  .ch3-browser-tab {
    width: 96px;
    height: 22px;
    background: #4a4d52;
    border-radius: 4px 4px 0 0;
  }
  .ch3-browser-omnibox {
    height: 26px;
    margin: 0 8px 8px;
    background: #24262a;
    border: 1px solid var(--ch3-chrome-border);
    border-radius: 3px;
  }
  .ch3-browser-infobar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-sm);
    padding: 8px 12px;
    background: var(--ch3-infobar-bg);
    color: var(--ch3-infobar-fg);
    font-family: var(--font-body);
    font-size: var(--fs-200);
  }

  /* ── Stage de Flash 550x400 + botón glossy de 4 capas (spec §3.3) ──────── */
  .ch3-flash-stage {
    position: relative;
    width: min(550px, 56vw);
    aspect-ratio: 550 / 400;
    margin: var(--sp-lg) auto;
    background: #1c1e21;
    border: 1px solid var(--ch3-chrome-border);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ch3-flash-btn {
    position: relative;
    width: 46%;
    aspect-ratio: 1;
    border-radius: 50%;
  }
  .ch3-flash-shadow,
  .ch3-flash-bevel,
  .ch3-flash-fill,
  .ch3-flash-desat,
  .ch3-flash-specular {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    will-change: transform, opacity;
  }
  .ch3-flash-shadow {
    box-shadow: 0 18px 34px rgba(0, 0, 0, 0.55);
    opacity: calc(1 - var(--ch3-p) * 2.5);
  }
  .ch3-flash-bevel {
    box-shadow:
      inset 0 2px 0 rgba(255, 255, 255, 0.25),
      inset 0 -3px 6px rgba(0, 0, 0, 0.4),
      0 0 0 2px var(--ch3-chrome-border);
    opacity: calc(1 - (var(--ch3-p) - 0.1) * 2.5);
  }
  .ch3-flash-fill {
    background: radial-gradient(circle at 38% 32%, var(--ch3-flash-a), var(--ch3-flash-b));
  }
  .ch3-flash-desat {
    background: var(--ch3-dead-gray);
    opacity: calc((var(--ch3-p) - 0.15) * 4);
  }
  .ch3-flash-specular {
    background: radial-gradient(circle at 34% 26%, var(--ch3-flash-specular-c), transparent 55%);
    opacity: calc(1 - (var(--ch3-p) - 0.3) * 3);
    transform:
      translateY(calc(max(0px, (var(--ch3-p) - 0.3) * 60vh)))
      rotate(calc(min(0deg, (var(--ch3-p) - 0.3) * -13deg)));
  }
  .ch3-flash-play {
    position: relative;
    z-index: 1;
    color: #fdece9;
    font-size: clamp(1.6rem, 5vw, 2.4rem);
    opacity: calc(1 - var(--ch3-p) * 2);
  }

  .ch3-wireframe {
    position: absolute;
    inset: 14%;
    fill: none;
    stroke: var(--ch3-wire);
    stroke-width: 1;
    stroke-dasharray: 3 2;
    opacity: min((var(--ch3-p) - 0.4) * 10, (0.7 - var(--ch3-p)) * 10);
  }
  .ch3-wireframe circle {
    stroke-dasharray: none;
    fill: var(--ch3-wire);
  }

  .ch3-flat-block {
    position: absolute;
    inset: 30%;
    background: var(--ch3-flat-red);
    opacity: min(max(0, (var(--ch3-p) - 0.4) * 5), 1);
  }

  /* ── Teléfono 2013: el plugin nunca llegó aquí (siempre visible, estático) ── */
  .ch3-phone {
    flex-shrink: 0;
    width: min(120px, 14vw);
    aspect-ratio: 9 / 18;
    padding: 8px 6px;
    border-radius: 16px;
    background: #0b0b0d;
    border: 1px solid #2a2c30;
  }
  .ch3-phone-screen {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #1c1e21;
    border-radius: 4px;
    padding: var(--sp-xs);
    text-align: center;
  }
  .ch3-puzzle {
    width: 34%;
    fill: var(--ch3-puzzle-gray);
  }
  .ch3-phone-note {
    margin: 0;
    color: #cfd2d6;
    font-family: var(--font-body);
    font-size: 0.6rem;
    line-height: 1.3;
  }

  /* ── Cue de scroll (se apaga apenas el usuario empieza a scrollear) ─────── */
  .ch3-act1-cue {
    position: absolute;
    bottom: 6vh;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    opacity: calc(1 - var(--ch3-p) * 8);
  }
  .ch3-act1-cue-arrow {
    display: inline-block;
    color: var(--ch3-dead-gray);
    font-size: 1.6rem;
    animation: ch3-cue-pulse 2.5s ease-in-out infinite;
  }
  @keyframes ch3-cue-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  /* ── Renacimiento: blanqueo + acento HTML5 (spec §3 tramo p 0.85-1.00) ──── */
  .ch3-act1-white,
  .ch3-act1-accent {
    position: absolute;
    z-index: 4;
  }
  .ch3-act1-white {
    inset: 0;
    background: var(--ch3-white);
    opacity: calc((var(--ch3-p) - 0.85) * 6.5);
  }
  .ch3-act1-accent {
    inset: 30%;
    background: var(--ch3-html5);
    opacity: calc((var(--ch3-p) - 0.9) * 10);
  }

  /* ═══════════════════════════════════════════════════════════════════════
   * ACTO 2 — el renacimiento flat
   * ═══════════════════════════════════════════════════════════════════════ */
  .ch3-act2 {
    position: relative;
    z-index: 1;
    background: var(--c-bg);
  }

  /* Ghost button — compartido por hero CTA + beat "Seguir leyendo" (spec §6) */
  .ch3-ghost-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.7em 1.4em;
    border: 2px solid var(--c-accent);
    border-radius: 3px;
    background: transparent;
    color: var(--c-accent);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: background var(--dur-theme) ease, color var(--dur-theme) ease, transform var(--dur-tap) ease;
  }
  .ch3-ghost-btn:hover,
  .ch3-ghost-btn:focus-visible {
    background: var(--c-accent);
    color: #ffffff;
  }
  .ch3-ghost-btn:active { transform: translateY(1px); }
  .ch3-ghost-btn--tiny {
    padding: 0.3em 0.8em;
    font-size: 0.6rem;
    cursor: default;
    pointer-events: none;
  }

  /* ── Hero (spec §3 acto 2.1) ─────────────────────────────────────────────── */
  .ch3-hero {
    position: relative;
    min-height: 78vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: var(--inset-chapter-top) var(--sp-lg) var(--sp-2xl);
    box-sizing: border-box;
  }
  .ch3-hero-parallax { position: absolute; inset: 0; pointer-events: none; }
  .ch3-hero-sky { position: absolute; inset: 0; background: #d6eaf8; }
  .ch3-hero-hill {
    position: absolute;
    left: -5%;
    width: 110%;
    height: 45%;
    will-change: transform;
  }
  .ch3-hero-hill--back {
    bottom: 8%;
    background: #a9cce3;
    clip-path: polygon(0% 60%, 20% 30%, 45% 55%, 68% 20%, 100% 50%, 100% 100%, 0% 100%);
    transform: translateY(calc(var(--ch3-hy, 0) * -0.14px));
  }
  .ch3-hero-hill--front {
    bottom: 0%;
    height: 32%;
    background: #7fb3d5;
    clip-path: polygon(0% 70%, 22% 35%, 50% 65%, 74% 25%, 100% 55%, 100% 100%, 0% 100%);
    transform: translateY(calc(var(--ch3-hy, 0) * -0.26px));
  }
  .ch3-hero-sky { transform: translateY(calc(var(--ch3-hy, 0) * -0.06px)); will-change: transform; }
  .ch3-hero-cloud {
    position: absolute;
    top: 18%;
    width: 64px;
    height: 22px;
    background: #ffffff;
    border-radius: 999px;
    box-shadow: 10px 8px 0 var(--ch3-long-shadow);
    animation: ch3-cloud-drift linear infinite;
  }
  .ch3-hero-cloud--a { left: -10%; animation-duration: 90s; }
  .ch3-hero-cloud--b { top: 32%; left: -20%; width: 44px; height: 16px; animation-duration: 120s; animation-delay: -40s; }
  @keyframes ch3-cloud-drift {
    from { transform: translateX(-10vw); }
    to { transform: translateX(120vw); }
  }
  .ch3-hero-copy {
    position: relative;
    z-index: 1;
    max-width: 44rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-md);
  }
  .ch3-hero-title {
    margin: 0;
    font-family: var(--font-body);
    font-weight: 300;
    font-size: clamp(2.6rem, 6vw, 4.4rem);
    line-height: 1.12;
    letter-spacing: -0.01em;
    color: var(--c-fg);
    text-wrap: balance;
  }
  .ch3-hero-sub {
    margin: 0;
    font-family: var(--font-body);
    font-weight: 400;
    font-size: clamp(1.15rem, 2.4vw, 1.5rem);
    color: var(--ch3-text-2);
    text-wrap: pretty;
  }

  /* ── Beats — grid de la fila zig-zag (Ch3StoryBeat.vue, alcanza su nodo raíz
       + descendientes porque este <style> NO es scoped, ver header) ────────── */
  .ch3-beats {
    display: flex;
    flex-direction: column;
    max-width: var(--content-max);
    margin: 0 auto;
  }
  .ch3-beat {
    display: flex;
    align-items: center;
    gap: var(--sp-2xl);
    padding: var(--sp-2xl) var(--sp-lg);
    background: var(--c-bg);
    opacity: 0;
    transform: translateY(24px);
    transition: opacity var(--dur-enter) var(--ease-standard), transform var(--dur-enter) var(--ease-standard);
  }
  .ch3-beat:nth-child(odd) { background: var(--c-surface); }
  .ch3-beat--alt { flex-direction: row-reverse; }
  .ch3-beat.is-revealed { opacity: 1; transform: none; }

  .ch3-beat-icon { position: relative; flex-shrink: 0; width: 88px; height: 88px; }
  .ch3-beat-icon-shadow {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    clip-path: polygon(50% 50%, 100% 0%, 135% 35%, 35% 135%, 0% 100%);
    background: var(--ch3-long-shadow);
    transform: translate(7px, 7px);
  }
  .ch3-beat-icon-svg {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    padding: 20%;
    box-sizing: border-box;
    color: var(--c-accent);
  }
  .ch3-beat--residual .ch3-beat-icon-svg { color: var(--ch3-residual); }
  .ch3-beat--html5 .ch3-beat-icon-svg { color: var(--ch3-html5); }
  .ch3-beat-icon-tone2 { opacity: 0.6; }

  .ch3-beat-copy { flex: 1; min-width: 0; max-width: var(--measure); }
  .ch3-beat-numeral {
    margin: 0;
    font-family: var(--font-body);
    font-weight: 300;
    font-size: clamp(3rem, 7vw, 5rem);
    line-height: 1;
    color: var(--c-border);
  }
  .ch3-beat-kicker {
    margin: 0 0 var(--sp-xs);
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--c-accent);
  }
  .ch3-beat--residual .ch3-beat-kicker { color: var(--ch3-residual); }
  .ch3-beat--html5 .ch3-beat-kicker { color: var(--ch3-html5); }
  .ch3-beat-lead {
    margin: 0;
    font-family: var(--font-body);
    font-weight: 400;
    font-size: 1.0625rem;
    line-height: 1.7;
    color: var(--c-fg);
    text-wrap: pretty;
  }
  .ch3-beat-more { margin-top: var(--sp-sm); }
  .ch3-beat-rest {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ch3-beat-rest.is-open { grid-template-rows: 1fr; }
  .ch3-beat-rest > p {
    overflow: hidden;
    margin: var(--sp-sm) 0 0;
    font-family: var(--font-body);
    font-size: 1.0625rem;
    line-height: 1.7;
    color: var(--c-fg);
  }

  /* ── Cierre del capítulo — puente cromático hacia ch4 (spec §3 acto 2.3) ── */
  .ch3-close {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-md);
    padding: var(--sp-2xl) var(--sp-lg) calc(var(--sp-2xl) + var(--inset-chapter-bottom));
    background: var(--ch3-close-bg);
    text-align: center;
  }
  .ch3-close-badge { width: 40px; height: 40px; color: var(--ch3-html5); }
  .ch3-close-line {
    margin: 0;
    max-width: var(--measure);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: var(--fs-500);
    line-height: 1.4;
    color: #ffffff;
    text-wrap: balance;
  }

  .ch3-projects {
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
    max-width: var(--content-max);
    margin: 0 auto;
    padding: var(--sp-xl) var(--sp-lg);
  }
  .ch3-projects .project-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--r-card); padding: var(--sp-md); }
  .ch3-projects .project-card-title { font-family: var(--font-body); font-weight: 600; color: var(--c-fg); border-bottom: 2px solid var(--c-accent); padding-bottom: var(--sp-xs); display: inline-block; }
  .ch3-projects .project-card-desc,
  .ch3-projects .project-card-role { font-family: var(--font-body); color: var(--c-fg); }
  .ch3-projects .project-card-link { color: var(--c-accent); background: none; box-shadow: none; text-decoration: none; }
  .ch3-projects .project-card-link:hover { text-decoration: underline; }

  /* ─────────────────────────────────────────────────────────────────────────
   * Mejora progresiva — scroll-driven animations nativas (spec §7 + sistema
   * visual §3). Donde el navegador soporta animation-timeline, el compositor
   * corre el scrub del Acto 1 y el reveal de los beats SIN JS; donde no,
   * gobierna el valor escrito por rAF/IntersectionObserver de arriba (los
   * navegadores aplican el valor animado por encima de cualquier otro origen
   * mientras la animación corre, así que ambos caminos conviven sin pelear).
   * No verificado visualmente en esta sesión (sin navegador disponible).
   * ───────────────────────────────────────────────────────────────────────── */
  @supports (animation-timeline: scroll()) {
    .ch3-act1-pin:not(.is-reduced) { view-timeline: --ch3-pin-timeline block; }
    .ch3-act1-pin:not(.is-reduced) .ch3-act1-scene {
      animation: ch3-scrub-p linear both;
      animation-timeline: --ch3-pin-timeline;
      animation-range: cover 0% cover 100%;
    }
    .ch3-beat {
      animation: ch3-beat-reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 40%;
    }
  }
  @keyframes ch3-scrub-p { from { --ch3-p: 0; } to { --ch3-p: 1; } }
  @keyframes ch3-beat-reveal {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * PRM — el Acto 1 congela en su cuadro estático y el pin baja a 100vh; el
   * Acto 2 se renderiza completo sin reveals (spec §7).
   * ───────────────────────────────────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .ch3-act1-pin { height: 100vh; height: 100dvh; }
    .ch3-act1-cue,
    .ch3-act1-cue-arrow,
    .ch3-hero-cloud,
    .ch3-beat,
    .ch3-beat-rest {
      animation: none !important;
      transition: none !important;
    }
    .ch3-beat { opacity: 1 !important; transform: none !important; }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * Responsive (spec §6) — mobile <768px apila a 1 columna; landscape mobile
   * (alto<500px) reduce el stage del Acto 1 y oculta el teléfono.
   * ───────────────────────────────────────────────────────────────────────── */
  @media (max-width: 767px) {
    .ch3-act1-decor { flex-direction: column; gap: var(--sp-lg); }
    .ch3-browser,
    .ch3-flash-stage { width: min(420px, 82vw); }
    .ch3-beat,
    .ch3-beat--alt { flex-direction: column; text-align: center; gap: var(--sp-md); }
    .ch3-beat-icon { margin: 0 auto; }
  }
  @media (max-height: 499px) and (orientation: landscape) {
    .ch3-act1-pin { height: 160vh; height: 160dvh; }
    .ch3-phone { display: none; }
    .ch3-flash-stage { width: min(550px, 78vw); }
    .ch3-act1-decor { gap: var(--sp-md); }
  }
}
</style>
