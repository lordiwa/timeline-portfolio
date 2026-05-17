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
            <td>📺 Anime</td>
          </tr>
        </tbody>
      </table>

      <!-- ch1 no tiene proyectos (CONTENT-CHECKLIST §2.6) — NO renderea .ch1-projects -->
    </div>
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
  padding-top: calc(96px + var(--sp-lg));
  padding-bottom: var(--sp-lg);
  height: 100%;
  overflow-y: hidden;
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
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  position: relative; /* z-index encima del starfield */
  z-index: 1;
}

.ch1-bio p {
  font-family: 'Comic Neue', 'Comic Sans MS', cursive;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--c-fg);
  margin: 0 0 var(--sp-md) 0;
}

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
  top: 30%;
  right: 12%;
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
    height: auto;
    overflow-y: visible;
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
  .ch1-gif--goku      { top: 28%;   right: 4%;  width: 72px; }
  .ch1-gif--milk      { top: 56%;   right: 4px; width: 44px; }
  .ch1-gif--cornholio { bottom: 80px; left: 8px; width: 48px; }
}
</style>
