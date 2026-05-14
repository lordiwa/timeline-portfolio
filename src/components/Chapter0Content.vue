<!--
  Chapter0Content.vue — Layout era-auténtico ch0 (Terminal 1995).

  Decisiones de diseño heredadas de Chapter3Content.vue:
  - D3-09 Opción A LOCKED: layout 2-col desktop 200px aside + 1fr content.
    padding-left: 160px (StickyTimeline clearance). Mobile stacked.
  - D3-12 LOCKED: mobile abandona height: 100dvh strict + scroll interno.

  Era-signature: <TerminalScroll /> al inicio del content (CRT cursor parpadeante).
  Sin proyectos: ch0 no tiene proyectos (CONTENT-CHECKLIST §2.6).
  ART-07: cero pixel art — ningún <img> o background-image referencia /assets/ch0-bg*.
  Los tokens CSS (--c-fg verde, --c-bg negro, VT323 font) vienen del cascade
  [data-chapter="0"] de chapter-themes.css.

  Imagen /assets/ch0-bust.png puede no existir hasta Plan de arte — alt text provee fallback.
  Bio text usa t(bio.coreKey) — renderiza placeholder hasta que Rafael llene i18n.
-->
<script setup>
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { bio } from '@/data/bio'
import TerminalScroll from './TerminalScroll.vue'

const { t } = useI18n()

// chapters[0] — Terminal 1995. Lookup directo por index (D3-04 locked).
const chapter = chapters[0]
</script>

<template>
  <div class="ch0-layout">
    <!-- Columna izquierda: avatar bust grande + meta (year + era localizada) -->
    <aside class="ch0-meta">
      <img
        class="ch0-avatar"
        :src="chapter.avatarSrc"
        :alt="t('avatar.busts.0.alt')"
        width="160"
        height="192"
        loading="lazy"
      />
      <p class="ch0-year">{{ chapter.year }}</p>
      <p class="ch0-era">{{ t(chapter.eraKey) }}</p>
    </aside>

    <!-- Columna derecha: TerminalScroll hero + bio + flavor era -->
    <div class="ch0-content">
      <!-- Era-signature: terminal CRT arriba del bio para máximo impacto visual -->
      <TerminalScroll />

      <div class="ch0-bio">
        <!-- t(bio.coreKey) renderiza placeholder "PENDING..." hasta que Rafael llene i18n -->
        <p>{{ t(bio.coreKey) }}</p>
      </div>

      <p class="ch0-flavor">{{ t('chapters.0.flavor') }}</p>

      <!-- ch0 no tiene proyectos (CONTENT-CHECKLIST §2.6) — NO renderea .ch0-projects -->
    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * .ch0-layout — 2-col desktop (D3-09 Opción A — idéntico a ch3)
 * grid-template-columns: 200px (aside meta) + 1fr (content)
 * padding-left: 160px → espacio para StickyTimeline ~120px + margen
 * padding-top: espacio para StickyAvatar 80×96 + margen
 * ───────────────────────────────────────────────────────────────────────── */
.ch0-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--sp-lg);
  padding-left: 160px;
  padding-right: var(--sp-lg);
  padding-top: calc(96px + var(--sp-lg));
  padding-bottom: var(--sp-lg);
  height: 100%;
  overflow-y: hidden;
}

.ch0-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  align-items: flex-start;
}

.ch0-avatar {
  width: 160px;
  height: 192px;
  image-rendering: pixelated;
  background: var(--c-surface, var(--c-bg, #000000));
  border: 1px solid var(--c-border);
  border-radius: 4px;
}

.ch0-year {
  font-family: 'VT323', ui-monospace, monospace;
  font-size: 2rem;
  margin: 0;
  color: var(--c-accent);
}

.ch0-era {
  font-family: 'VT323', ui-monospace, monospace;
  font-size: 1.5rem;
  margin: 0;
  color: var(--c-fg);
}

.ch0-content {
  overflow-y: hidden;
  padding-right: var(--sp-md);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

.ch0-bio p {
  font-family: 'VT323', ui-monospace, monospace;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--c-fg);
  margin: 0 0 var(--sp-md) 0;
}

.ch0-flavor {
  font-family: 'VT323', ui-monospace, monospace;
  font-size: 1rem;
  color: var(--c-fg);
  opacity: 0.75;
  margin: 0;
  font-style: italic;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile <600px — D3-09 stacked + D3-12 scroll interno permitido
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch0-layout {
    grid-template-columns: 1fr;
    padding-left: 60px;
    padding-right: var(--sp-md);
    padding-top: calc(68px + var(--sp-sm));
    height: auto;
    overflow-y: visible;
  }

  .ch0-meta {
    flex-direction: row;
    align-items: center;
    margin-bottom: var(--sp-md);
  }

  .ch0-avatar {
    width: 96px;
    height: 116px;
  }

  .ch0-year {
    font-size: 1.5rem;
  }

  .ch0-era {
    font-size: 1.2rem;
  }

  .ch0-content {
    overflow-y: auto;
    /* D3-12: scroll interno hasta agotar height → browser propaga al outer snap shell */
    max-height: calc(100dvh - 200px - env(safe-area-inset-bottom, 0px));
  }
}
</style>
