<!--
  Chapter4Content.vue — ch4 AR/VR: parallax "flotando en el vacío" (iter3, Rafael 2026-06-01).

  Concepto: alguien flotando en el espacio vacío. Personaje a la mitad-derecha, de espaldas,
  con gafas VR, mirando hacia abajo-derecha a un portal/agujero negro donde se ve tenue un
  mundo 3D. Parallax de 4 capas (frente → fondo):
    c0 near      — elementos próximos para profundidad           (factor puntero mayor)
    c1 character — chico flotando de espaldas + bob autónomo      (factor medio + float)
    c3 matrix    — símbolos matrix neón (híbrido: PNG tenue + glifos CSS vivos)
    c4 portal    — espacio profundo + portal con mundo 3D tenue   (factor mínimo + glow pulse)

  Movimiento: puntero + drift automático (sine en RAF), NO acoplado a scroll. PRM lo congela.
  Patrón reutilizado del parallax de ch3 (Chapter3Content.vue): vars CSS --mx/--my (+ --dx/--dy
  drift) escritas por un loop requestAnimationFrame; cada capa con su factor de profundidad.

  FASE A (actual): motor + placeholders CSS (sin assets pixelforge todavía). Los background-image
  de las capas se cablearán en Fase B con el arte final (ch4-portal/character/matrix/near).

  Decisiones vigentes:
  - D4-04 + UI-SPEC §6.8: ch4 usa <FloatingPanel> glass holographic (NO ProjectCard skeumorphic).
  - El contenido real lo define Rafael (CONTENT-CHECKLIST). Reubicar el contenido sobre el
    espacio libre es un follow-up; aquí los paneles quedan como están.
-->
<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import FloatingPanel from './FloatingPanel.vue'

const { t } = useI18n()

const chapter = chapters[4]
const ch4Projects = computed(() => projects.filter((p) => p.chapterEra === 4))

// Bio era-specific: AR/VR independiente Ecuador + Metrodigi líder (Rafael 2026-05-14).
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// ── Glifos matrix (capa híbrida c3) — sub-capa CSS viva sobre el PNG tenue ──────
// Posiciones/timings hardcoded (sin Math.random runtime). Caracteres katakana + 0/1.
const glyphs = [
  { ch: 'ｱ', left: '10%', top: '22%', delay: '0s',   dur: '7s',  size: '20px' },
  { ch: '1', left: '18%', top: '64%', delay: '1.8s', dur: '9s',  size: '16px' },
  { ch: 'ﾂ', left: '27%', top: '38%', delay: '3.2s', dur: '8s',  size: '24px' },
  { ch: '0', left: '34%', top: '78%', delay: '0.6s', dur: '10s', size: '14px' },
  { ch: 'ﾈ', left: '44%', top: '18%', delay: '2.4s', dur: '8.5s',size: '22px' },
  { ch: '1', left: '52%', top: '52%', delay: '4.1s', dur: '7.5s',size: '18px' },
  { ch: 'ﾚ', left: '61%', top: '30%', delay: '1.2s', dur: '9.5s',size: '20px' },
  { ch: '0', left: '14%', top: '46%', delay: '5.0s', dur: '8s',  size: '15px' },
  { ch: 'ﾜ', left: '38%', top: '58%', delay: '2.9s', dur: '10.5s',size: '26px' },
  { ch: '1', left: '48%', top: '72%', delay: '0.3s', dur: '7s',  size: '16px' },
  { ch: 'ｷ', left: '23%', top: '12%', delay: '3.7s', dur: '9s',  size: '21px' },
  { ch: '0', left: '57%', top: '14%', delay: '1.5s', dur: '8.5s',size: '14px' },
]

// ── Parallax: puntero + drift automático (sine), PRM-aware ──────────────────────
const prm = inject('prm', null)
const reduced = () => prm?.prefersReduced?.value ?? false

const parallaxRef = ref(null)
let rafLoop = 0
let startT = 0
let mx = 0
let my = 0

function frame(t) {
  const el = parallaxRef.value
  if (el) {
    if (!startT) startT = t
    const e = (t - startT) / 1000
    el.style.setProperty('--mx', mx.toFixed(4))
    el.style.setProperty('--my', my.toFixed(4))
    // Drift autónomo lento — sensación de flotar sin tocar el mouse.
    el.style.setProperty('--dx', (Math.sin(e * 0.25) * 0.18).toFixed(4))
    el.style.setProperty('--dy', (Math.cos(e * 0.19) * 0.14).toFixed(4))
  }
  rafLoop = requestAnimationFrame(frame)
}

function onPointer(ev) {
  if (reduced()) return
  mx = ev.clientX / window.innerWidth - 0.5
  my = ev.clientY / window.innerHeight - 0.5
}

onMounted(() => {
  if (reduced()) return // PRM: sin loop, sin listener — vars quedan en su default (0)
  window.addEventListener('pointermove', onPointer, { passive: true })
  rafLoop = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointer)
  if (rafLoop) cancelAnimationFrame(rafLoop)
})
</script>

<template>
  <div class="ch4-layout">
    <!-- ── Parallax stack (decorativo, detrás del contenido) ─────────────────── -->
    <div ref="parallaxRef" class="ch4-parallax" aria-hidden="true">
      <div class="ch4-layer ch4-layer--portal"></div>
      <div class="ch4-layer ch4-layer--matrix"></div>
      <div class="ch4-layer ch4-layer--glyphs">
        <span
          v-for="(g, i) in glyphs"
          :key="i"
          class="ch4-glyph"
          :style="{ left: g.left, top: g.top, '--g-delay': g.delay, '--g-dur': g.dur, '--g-size': g.size }"
        >{{ g.ch }}</span>
      </div>
      <div class="ch4-layer ch4-layer--character">
        <div class="ch4-character-art"></div>
      </div>
      <div class="ch4-layer ch4-layer--near"></div>
    </div>

    <!-- Contenido flotando a la izquierda, sobre el espacio vacío. -->
    <div class="ch4-panel-column">
      <!-- Meta sin imagen inline — StickyAvatar top-left es único avatar visible. -->
      <aside class="ch4-meta">
        <p class="ch4-year">{{ chapter.year }}</p>
        <p class="ch4-era">{{ t(chapter.eraKey) }}</p>
      </aside>

      <div class="ch4-content">
        <FloatingPanel :title="t(chapter.titleKey)">
          <p class="ch4-flavor">{{ t('chapters.4.flavor') }}</p>
          <p v-for="(para, idx) in bioParagraphs" :key="idx" class="ch4-bio">{{ para }}</p>
        </FloatingPanel>

        <!-- Proyectos lado a lado (grid) → bloque más ancho y menos alto. -->
        <div class="ch4-projects">
          <FloatingPanel
            v-for="project in ch4Projects"
            :key="project.id"
            :title="t(project.titleKey)"
          >
            <p class="ch4-project-desc">{{ t(project.descKey) }}</p>
            <p v-if="project.role" class="ch4-project-role">{{ project.role }}</p>
            <ul v-if="project.techStack" class="ch4-project-tech">
              <li v-for="tech in project.techStack" :key="tech">{{ tech }}</li>
            </ul>
            <a
              v-if="project.link"
              :href="project.link"
              target="_blank"
              rel="noopener noreferrer"
              class="ch4-project-link"
            >{{ t('ui.openProject') }}</a>
          </FloatingPanel>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────
 * .ch4-layout — grid 2-col (200px aside + 1fr content) heredado D3-09.
 * El bg ya NO es una imagen fija: lo pintan las capas del parallax.
 * ───────────────────────────────────────────────────────────── */
.ch4-layout {
  position: relative;
  display: flex;
  align-items: center;          /* centra verticalmente la columna de contenido */
  justify-content: flex-start;  /* contenido a la izquierda */
  padding-left: 160px;
  padding-right: var(--sp-lg);
  padding-top: calc(96px + var(--sp-lg));
  padding-bottom: var(--sp-lg);
  height: 100%;
  /* .chapter-section es flex-centrado → reclamar el ancho completo del viewport,
     si no el parallax queda angosto y el portal (esquina derecha) cae fuera.
     Mismo fix que ch2 (.flash-y2k-root). */
  width: 100%;
  flex: 1 1 100%;
  align-self: stretch;
  min-width: 0;
  overflow: hidden;
  background-color: var(--c-bg);
  image-rendering: pixelated;
}

/* Columna de contenido — flota a la izquierda sobre el espacio vacío.
   Ancha y baja: proyectos en grid 2-col para reducir altura y no cortarse abajo. */
.ch4-panel-column {
  position: relative;
  z-index: 5;
  width: 100%;
  max-width: 640px;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  padding-right: var(--sp-xs);
  animation: ch4-col-float 7s ease-in-out infinite;
}

/* Proyectos lado a lado — más ancho, menos alto. */
.ch4-projects {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-sm);
}
@keyframes ch4-col-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

/* ── Parallax stack — cubre todo el chapter, detrás del contenido ──────────── */
.ch4-parallax {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.ch4-layer {
  position: absolute;
  inset: -8%;
  width: 116%;
  height: 116%;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  image-rendering: pixelated;
  will-change: transform;
}

/* Profundidad: factor puntero+drift creciente del fondo (portal) al frente (near).
   FASE A — placeholders CSS; los background-image reales llegan en Fase B. */

/* c4 portal — fondo opaco: espacio profundo + portal con mundo 3D tenue abajo-derecha.
   Sin overscan (el portal está en la esquina; el -8%/116% lo recortaba). Se mueve solo
   5px y el bg es navy → no revela bordes. */
.ch4-layer--portal {
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  background-color: var(--c-bg);
  background-image: url('/assets/ch4-portal.png');
  transform: translate3d(
    calc((var(--mx, 0) + var(--dx, 0)) * 5px),
    calc((var(--my, 0) + var(--dy, 0)) * 4px),
    0
  );
}

/* c3 matrix base — PNG tenue (Fase B). Por ahora transparente, sin artefacto. */
.ch4-layer--matrix {
  z-index: 1;
  background-image: none;
  transform: translate3d(
    calc((var(--mx, 0) + var(--dx, 0)) * 11px),
    calc((var(--my, 0) + var(--dy, 0)) * 9px),
    0
  );
}

/* c3 glifos — sub-capa viva (híbrido). Profundidad entre matrix y personaje. */
.ch4-layer--glyphs {
  z-index: 2;
  transform: translate3d(
    calc((var(--mx, 0) + var(--dx, 0)) * 15px),
    calc((var(--my, 0) + var(--dy, 0)) * 12px),
    0
  );
}
.ch4-glyph {
  position: absolute;
  font-family: 'VT323', monospace;
  font-size: var(--g-size, 20px);
  line-height: 1;
  color: var(--c-accent);
  text-shadow: 0 0 6px rgba(0, 255, 255, 0.9), 0 0 14px rgba(0, 255, 255, 0.5);
  opacity: 0.18;
  animation: ch4-glyph-drift var(--g-dur, 8s) ease-in-out var(--g-delay, 0s) infinite;
}
@keyframes ch4-glyph-drift {
  0%, 100% { opacity: 0.12; transform: translateY(0) scale(0.95); }
  50% { opacity: 0.55; transform: translateY(-18px) scale(1.05); }
}

/* c1 personaje — sprite ch4-character.png (de espaldas, gafas VR) a la derecha. Bob autónomo. */
.ch4-layer--character {
  z-index: 3;
  transform: translate3d(
    calc((var(--mx, 0) + var(--dx, 0)) * 20px),
    calc((var(--my, 0) + var(--dy, 0)) * 14px),
    0
  );
}
.ch4-character-art {
  position: absolute;
  inset: 0;
  background-image: url('/assets/ch4-character.png');
  background-repeat: no-repeat;
  background-size: auto 50%;
  background-position: 73% 32%;
  image-rendering: pixelated;
  animation: ch4-char-bob 6.5s ease-in-out infinite;
}
@keyframes ch4-char-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* c0 near — elementos próximos. Placeholder: un par de partículas neón cercanas. */
.ch4-layer--near {
  z-index: 4;
  background-image:
    radial-gradient(3px 3px at 16% 30%, rgba(0, 255, 255, 0.9) 0%, transparent 60%),
    radial-gradient(2px 2px at 40% 80%, rgba(176, 208, 255, 0.9) 0%, transparent 60%),
    radial-gradient(4px 4px at 8% 66%, rgba(0, 255, 255, 0.7) 0%, transparent 55%);
  transform: translate3d(
    calc((var(--mx, 0) + var(--dx, 0)) * 32px),
    calc((var(--my, 0) + var(--dy, 0)) * 22px),
    0
  );
}

/* ── Meta + contenido — dentro de la columna flotante ──────────────────────── */
.ch4-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-xs);
  align-items: flex-start;
}

.ch4-year {
  font-family: 'Audiowide', 'Eurostile', sans-serif;
  font-size: 1.6rem;
  margin: 0;
  color: var(--c-accent);
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
}

.ch4-era {
  font-family: 'Audiowide', 'Eurostile', sans-serif;
  font-size: 1.15rem;
  margin: 0;
  color: var(--c-fg);
}

.ch4-content {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  margin-top: var(--sp-sm);
}

.ch4-flavor {
  font-family: 'Audiowide', 'Eurostile', sans-serif;
  font-size: 0.95rem;
  font-style: italic;
  color: var(--c-fg);
  opacity: 0.85;
  margin: 0 0 var(--sp-sm) 0;
}

.ch4-bio {
  font-family: Georgia, serif;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--c-fg);
  margin: 0;
}

.ch4-project-desc {
  font-family: Georgia, serif;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--c-fg);
  margin: 0 0 var(--sp-sm) 0;
}

.ch4-project-role {
  font-size: 0.85rem;
  color: var(--c-fg);
  opacity: 0.7;
  font-style: italic;
  margin: 0 0 var(--sp-xs) 0;
}

.ch4-project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-xs);
  list-style: none;
  padding: 0;
  margin: 0 0 var(--sp-md) 0;
}

.ch4-project-tech li {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  color: var(--c-fg);
}

.ch4-project-link {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 0.9rem;
  background: linear-gradient(
    to bottom,
    var(--c-accent),
    color-mix(in srgb, var(--c-accent) 60%, #000)
  );
  color: #000;
  text-decoration: none;
  text-shadow: none;
  font-weight: 700;
}

/* ─────────────────────────────────────────────────────────────
 * PRM — congela todo el movimiento del parallax.
 * ───────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .ch4-layer,
  .ch4-character-art,
  .ch4-glyph,
  .ch4-panel-column { animation: none !important; transition: none !important; }
  .ch4-layer { transform: none !important; }
  .ch4-character-art { transform: none !important; }
  .ch4-panel-column { transform: none !important; }
  .ch4-glyph { opacity: 0.3 !important; }
}

/* ─────────────────────────────────────────────────────────────
 * Mobile <600px stacked (D3-09 heredado) — sin parallax de puntero.
 * ───────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch4-layout {
    padding-left: var(--sp-md);
    padding-right: var(--sp-md);
    padding-top: calc(68px + var(--sp-sm));
    align-items: stretch;
  }

  /* Sin puntero táctil: capas estáticas. NUNCA position:fixed — se anclaría al
     viewport y haría bleed a otros chapters (bug chapter-overlap + iOS fixed buggy).
     Se mantiene absolute, contenido dentro de .ch4-layout. */
  .ch4-parallax { position: absolute; }
  .ch4-layer { transform: none; }

  /* Columna a ancho completo, sin float (evita reflow táctil incómodo). */
  .ch4-panel-column {
    max-width: none;
    max-height: calc(100dvh - 160px - env(safe-area-inset-bottom, 0px));
    animation: none;
  }

  .ch4-year { font-size: 1.5rem; }
  .ch4-era { font-size: 1.2rem; }
}
</style>
