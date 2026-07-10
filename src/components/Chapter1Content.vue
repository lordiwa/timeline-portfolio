<!--
  Chapter1Content.vue — Layout era-auténtico ch1 (HTML 90s / GeoCities 2001).

  Decisiones de diseño heredadas de Chapter3Content.vue:
  - D3-09 Opción A LOCKED: layout 2-col desktop 200px aside + 1fr content.
    padding-left: 160px (StickyTimeline clearance). Mobile stacked.
  - D3-12 LOCKED: mobile abandona height: 100dvh strict + scroll interno.

  Era-signature:
  - <StarfieldBg /> posicionado absolute (z-index: -1) detrás de todo el content.
  - <MarqueeBanner /> encima del bio (banner GeoCities era-auténtico).
  - Tabla legacy <table border="1"> con caption "Mis cosas favoritas" (era-flavor).

  Sin proyectos: ch1 no tiene proyectos (CONTENT-CHECKLIST §2.6).
  ART-07: cero pixel art — ningún <img> o background-image referencia /assets/ch1-bg*.
  Los tokens CSS (navy, magenta, Comic Neue) vienen del cascade [data-chapter="1"].

  Imagen /assets/ch1-bust.png puede no existir hasta Plan de arte — alt text provee fallback.

  position: relative en .ch1-layout es CRÍTICO para contener StarfieldBg absolute.
-->
<script setup>
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { bio } from '@/data/bio'
import MarqueeBanner from './MarqueeBanner.vue'
import StarfieldBg from './StarfieldBg.vue'

const { t } = useI18n()

// chapters[1] — HTML 90s / GeoCities. Lookup directo por index (D3-04 locked).
const chapter = chapters[1]

// Bio era-specific: castigo/HTML + autodidacta + competitivo SC/WC + BLG QA (Rafael 2026-05-17).
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// PRM: GIFs animados son decoración era-90s. Bajo prefers-reduced-motion no se renderizan.
const { prefersReduced } = inject('prm')

// GIFs 90s: src dinámico via :src binding evita que el compiler SFC intente
// resolver el path absolute como import en tests (vitest tropezaba con file:///assets/...).
const oldGifs = [
  { key: 'skull', src: '/assets/oldGifs/skull.gif' },
  { key: 'goku', src: '/assets/oldGifs/goku.gif' },
  { key: 'milk', src: '/assets/oldGifs/milk.gif' },
  { key: 'cornholio', src: '/assets/oldGifs/cornholio.gif' },
]
</script>

<template>
  <div class="ch1-layout">
    <!-- StarfieldBg PRIMERO — su CSS scoped lo posiciona absolute detrás del content -->
    <StarfieldBg />

    <!-- GIFs 90s era-auténticos: floating chaos GeoCities style (Rafael 2026-05-17).
         aria-hidden + alt="" — decoración pura, sin valor informativo. Skip bajo PRM. -->
    <div v-if="!prefersReduced" class="ch1-gifs" aria-hidden="true">
      <img
        v-for="g in oldGifs"
        :key="g.key"
        :class="['ch1-gif', `ch1-gif--${g.key}`]"
        :src="g.src"
        alt=""
      />
    </div>

    <!-- Columna izquierda: meta (year + era). StickyAvatar top-left es único avatar visible
         (Rafael 2026-05-15: quitar imagen inline en todos los ch). -->
    <aside class="ch1-meta">
      <p class="ch1-year">{{ chapter.year }}</p>
      <p class="ch1-era">{{ t(chapter.eraKey) }}</p>
    </aside>

    <!-- Columna derecha: MarqueeBanner + bio + flavor + tabla legacy -->
    <div class="ch1-content">
      <!-- Era-signature: marquee banner GeoCities arriba del bio -->
      <MarqueeBanner />

      <div class="ch1-bio">
        <!-- bio era-specific: ch1 muestra 14 años + Perl/C++ + competitivo SC/WC + BLG QA. -->
        <p v-for="(para, idx) in bioParagraphs" :key="idx">{{ para }}</p>
      </div>

      <p class="ch1-flavor">{{ t('chapters.1.flavor') }}</p>

      <!-- Tabla legacy era-auténtica — GeoCities "mis cosas favoritas" (sin info crítica de Rafael) -->
      <table border="1" class="ch1-legacy-table">
        <caption>{{ t('chapters.1.tableLabel') }}</caption>
        <tbody>
          <tr>
            <td>💻 Programar</td>
            <td>🎮 Videojuegos</td>
          </tr>
          <tr>
            <td>🌐 Explorar Internet</td>
            <td>🛹 Skateboarding</td>
          </tr>
        </tbody>
      </table>

      <!-- ch1 no tiene proyectos (CONTENT-CHECKLIST §2.6) — NO renderea .ch1-projects -->
    </div>

    <!-- Retro widgets: hit counter + webring + badges 88×31 (zona inferior vacía).
         position: absolute dentro de .ch1-layout (position: relative).
         z-index: 2 → visibles encima de GIFs (z:0) sin tapar texto (z:1). -->
    <div class="ch1-retro-widgets">
      <!-- Fila 1: odómetro de visitas + webring -->
      <div class="ch1-widgets-row">
        <div class="ch1-hit-counter" aria-hidden="true">
          <span class="ch1-hc-label">Visitantes:</span>
          <span class="ch1-digit">0</span>
          <span class="ch1-digit">0</span>
          <span class="ch1-digit">4</span>
          <span class="ch1-digit">2</span>
          <span class="ch1-digit">0</span>
          <span class="ch1-digit">7</span>
        </div>
        <nav class="ch1-webring" :aria-label="t('chapters.1.webringAria')">
          <a href="#" class="ch1-webring-link" @click.prevent>&#171;&nbsp;Anterior</a>
          <span class="ch1-webring-title">RING DE WEBS ECUADOR</span>
          <a href="#" class="ch1-webring-link" @click.prevent>Siguiente&nbsp;&#187;</a>
        </nav>
      </div>
      <!-- Fila 2: tira de badges 88×31 -->
      <div class="ch1-badges" aria-hidden="true">
        <div class="ch1-badge ch1-badge--netscape">BEST VIEWED IN<br>NETSCAPE 4.0</div>
        <div class="ch1-badge ch1-badge--valid">HTML 4.0<br>VALID!</div>
        <div class="ch1-badge ch1-badge--res">800&times;600</div>
        <div class="ch1-badge ch1-badge--counter">FREE HIT<br>COUNTER</div>
        <div class="ch1-badge ch1-badge--midi">MIDI ON &#9834;</div>
      </div>
    </div>

    <!-- Barra en construcción — franja diagonal amarillo/negro, borde inferior del layout.
         PRM: animación desactivada vía @media prefers-reduced-motion (barra siempre visible). -->
    <div class="ch1-under-construction" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * .ch1-layout — 2-col desktop (D3-09 Opción A — idéntico a ch3)
 * position: relative CRÍTICO — contiene el StarfieldBg absolute dentro
 * ───────────────────────────────────────────────────────────────────────── */
.ch1-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--sp-lg);
  padding-left: 160px;
  padding-right: var(--sp-lg);
  padding-top: calc(80px + var(--sp-sm));
  padding-bottom: var(--sp-md);
  /* height + max-height:100dvh estricto — evita que el flex-center del
   * .chapter-section desplace el layout cuando contenido > viewport
   * (Rafael 2026-05-17: starfield/gifs bleed a ch0). */
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  box-sizing: border-box;
  position: relative; /* Contiene StarfieldBg absolute — CRÍTICO */
}

.ch1-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  align-items: flex-start;
  position: relative; /* z-index encima del starfield */
  z-index: 1;
}

.ch1-year {
  font-family: 'Comic Neue', 'Comic Sans MS', cursive;
  font-size: 2rem;
  margin: 0;
  color: var(--c-accent);
  font-weight: bold;
}

.ch1-era {
  font-family: 'Comic Neue', 'Comic Sans MS', cursive;
  font-size: 1.5rem;
  margin: 0;
  color: var(--c-fg);
  font-weight: bold;
}

.ch1-content {
  overflow-y: hidden;
  padding-right: var(--sp-md);
  padding-bottom: var(--sp-sm);
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  position: relative; /* z-index encima del starfield */
  z-index: 1;
}

/* Los items NO se encogen: si el flex los comprime, el marquee queda con su caja
   aplastada y el texto se corta (Rafael 2026-06-01). Con flex-shrink:0 cada bloque
   conserva su altura natural; el contenido cabe gracias a la bio ancha + compactada. */
.ch1-content > * {
  flex-shrink: 0;
}

/* Scrim de legibilidad — el starfield detrás es ruidoso; un panel sutil
   levanta el contraste del texto sin perder el vibe GeoCities (Rafael 2026-05-29). */
.ch1-bio {
  /* Ancha → menos líneas → menos alto (entra sin scroll en pantallas anchas/bajas). */
  max-width: 1000px;
  background: rgba(8, 10, 38, 0.55);
  border: 1px solid rgba(120, 160, 255, 0.32);
  border-radius: 6px;
  padding: var(--sp-sm) var(--sp-md);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.ch1-bio p {
  font-family: 'Comic Neue', 'Comic Sans MS', cursive;
  font-size: 1.02rem;
  line-height: 1.4;
  color: var(--c-fg);
  margin: 0 0 var(--sp-sm) 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}
.ch1-bio p:last-child { margin-bottom: 0; }

.ch1-flavor {
  font-family: 'Comic Neue', 'Comic Sans MS', cursive;
  font-size: 1rem;
  color: var(--c-fg);
  opacity: 0.85;
  margin: 0;
  font-style: italic;
}

/* ─────────────────────────────────────────────────────────────────────────
 * GIFs 90s — floating chaos GeoCities era. Posicionados absolute dentro de
 * .ch1-layout (que es position:relative). z-index 0 → encima del StarfieldBg
 * (z:-1) pero detrás del .ch1-meta/.ch1-content (z:1) — no estorban al texto.
 * image-rendering pixelated para preservar el grano original 90s.
 * ───────────────────────────────────────────────────────────────────────── */
.ch1-gifs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.ch1-gif {
  position: absolute;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.5));
}

.ch1-gif--skull {
  top: 42%;
  left: 12%;
  width: 96px;
  transform: rotate(-6deg);
}

.ch1-gif--goku {
  bottom: 18%;
  right: 6%;
  width: 128px;
  transform: rotate(-4deg);
}

.ch1-gif--milk {
  top: 52%;
  right: 48px;
  width: 72px;
  transform: rotate(6deg);
}

.ch1-gif--cornholio {
  bottom: 120px;
  left: 40px;
  width: 80px;
  transform: rotate(-3deg);
}

/* Tabla legacy era-auténtica — border era HTML 90s (magenta sobre navy) */
.ch1-legacy-table {
  font-family: 'Comic Neue', 'Comic Sans MS', cursive;
  font-size: 0.95rem;
  color: var(--c-fg);
  border-color: var(--c-fg);
  border-collapse: collapse;
  width: auto;
}

.ch1-legacy-table caption {
  font-weight: bold;
  color: var(--c-accent);
  margin-bottom: var(--sp-xs);
  text-align: left;
}

.ch1-legacy-table td {
  padding: var(--sp-xs) var(--sp-sm);
  border: 1px solid var(--c-fg);
  background: rgba(0, 0, 0, 0.3);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile <600px — D3-09 stacked + D3-12 scroll interno permitido
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch1-layout {
    grid-template-columns: 1fr;
    padding-left: 60px;
    padding-right: var(--sp-md);
    padding-top: calc(68px + var(--sp-sm));
    /* Mobile: mantener clip 100dvh (D3-12 sólo aplica a .ch1-content scroll
     * interno, NO al layout root — Rafael 2026-05-17 fix overlap bug). */
    height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
  }

  .ch1-meta {
    flex-direction: row;
    align-items: center;
    margin-bottom: var(--sp-md);
  }

  .ch1-year {
    font-size: 1.5rem;
  }

  .ch1-era {
    font-size: 1.2rem;
  }

  .ch1-content {
    overflow-y: auto;
    /* D3-12: scroll interno hasta agotar height → browser propaga al outer snap shell */
    max-height: calc(100dvh - 200px - env(safe-area-inset-bottom, 0px));
  }

  /* GIFs mobile: más pequeños y centrados verticalmente para no tapar bio */
  .ch1-gif--skull     { top: 42%;   left: 4%;   width: 56px; }
  .ch1-gif--goku      { bottom: 18%; right: 4%; width: 72px; }
  .ch1-gif--milk      { top: 56%;   right: 4px; width: 44px; }
  .ch1-gif--cornholio { bottom: 80px; left: 8px; width: 48px; }

  /* Retro widgets: ocultar en mobile — espacio insuficiente con content scroll */
  .ch1-retro-widgets { display: none; }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Retro widgets: hit counter + webring + badges 88×31
 * Todos position: absolute dentro de .ch1-layout (position: relative).
 * z-index: 2 — encima de GIFs (z:0) y debajo de nada (texto z:1 no solapa).
 * ───────────────────────────────────────────────────────────────────────── */
.ch1-retro-widgets {
  position: absolute;
  /* 56px: despeja la píldora GlobalMantra fija (bottom-center, ~40px de alto)
     que solapaba la fila de badges (visto en QA 2026-07-09b). */
  bottom: 56px;
  left: 170px;  /* clear del sticky timeline (~160px) */
  right: var(--sp-lg);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.ch1-widgets-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: nowrap;
}

/* Hit counter estilo odómetro */
.ch1-hit-counter {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #111;
  border: 2px outset #555;
  border-radius: 2px;
  padding: 2px 5px;
}

.ch1-hc-label {
  font-family: 'Courier New', Courier, monospace;
  font-size: 9px;
  color: #999;
  white-space: nowrap;
  margin-right: 3px;
}

.ch1-digit {
  display: inline-block;
  width: 12px;
  height: 18px;
  background: #000;
  border: 1px solid #333;
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
  line-height: 18px;
}

/* Webring box */
.ch1-webring {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.82);
  border: 1px solid #555;
  padding: 3px 8px;
  white-space: nowrap;
}

.ch1-webring-title {
  font-family: 'Courier New', Courier, monospace;
  font-size: 9px;
  color: #ffff00;
  font-weight: bold;
}

.ch1-webring-link {
  font-family: 'Courier New', Courier, monospace;
  font-size: 9px;
  color: #4488ff;
  text-decoration: underline;
  cursor: pointer;
}

.ch1-webring-link:visited {
  color: #aa66ff;
}

/* Badges 88×31 era GeoCities */
.ch1-badges {
  display: flex;
  gap: 3px;
  align-items: center;
  flex-wrap: nowrap;
}

.ch1-badge {
  width: 88px;
  height: 31px;
  border: 1px solid currentColor;
  font-family: 'Courier New', Courier, monospace;
  font-size: 7px;
  font-weight: bold;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
  padding: 1px;
  box-sizing: border-box;
}

.ch1-badge--netscape { background: #000080; color: #00ffff; }
.ch1-badge--valid    { background: #003300; color: #00ff00; }
.ch1-badge--res      { background: #4b0082; color: #ffff00; }
.ch1-badge--counter  { background: #800000; color: #ff8800; }
.ch1-badge--midi     { background: #001a33; color: #00ccff; }

/* ─────────────────────────────────────────────────────────────────────────
 * Barra "En construcción" — franja diagonal amarillo/negro
 * Borde inferior del layout, height 8px, animación lenta ~20s.
 * PRM: @media prefers-reduced-motion detiene la animación (barra sigue visible).
 * ───────────────────────────────────────────────────────────────────────── */
.ch1-under-construction {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: repeating-linear-gradient(
    45deg,
    #ffcc00 0,
    #ffcc00 8px,
    #111 8px,
    #111 16px
  );
  animation: ch1-construction-scroll 20s linear infinite;
  z-index: 3;
  pointer-events: none;
}

@keyframes ch1-construction-scroll {
  from { background-position: 0 0; }
  to   { background-position: 64px 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ch1-under-construction {
    animation: none;
  }
}
</style>
