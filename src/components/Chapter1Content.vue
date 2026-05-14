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
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { bio } from '@/data/bio'
import MarqueeBanner from './MarqueeBanner.vue'
import StarfieldBg from './StarfieldBg.vue'

const { t } = useI18n()

// chapters[1] — HTML 90s / GeoCities. Lookup directo por index (D3-04 locked).
const chapter = chapters[1]
</script>

<template>
  <div class="ch1-layout">
    <!-- StarfieldBg PRIMERO — su CSS scoped lo posiciona absolute detrás del content -->
    <StarfieldBg />

    <!-- Columna izquierda: avatar bust grande + meta (year + era localizada) -->
    <aside class="ch1-meta">
      <img
        class="ch1-avatar"
        :src="chapter.avatarSrc"
        :alt="t('avatar.busts.1.alt')"
        width="160"
        height="192"
        loading="lazy"
      />
      <p class="ch1-year">{{ chapter.year }}</p>
      <p class="ch1-era">{{ t(chapter.eraKey) }}</p>
    </aside>

    <!-- Columna derecha: MarqueeBanner + bio + flavor + tabla legacy -->
    <div class="ch1-content">
      <!-- Era-signature: marquee banner GeoCities arriba del bio -->
      <MarqueeBanner />

      <div class="ch1-bio">
        <!-- t(bio.coreKey) renderiza placeholder "PENDING..." hasta que Rafael llene i18n -->
        <p>{{ t(bio.coreKey) }}</p>
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

.ch1-avatar {
  width: 160px;
  height: 192px;
  image-rendering: pixelated;
  background: var(--c-surface, var(--c-bg, #000080));
  border: 2px solid var(--c-border);
  border-radius: 4px;
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

  .ch1-avatar {
    width: 96px;
    height: 116px;
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
}
</style>
