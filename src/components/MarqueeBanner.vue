<!--
  MarqueeBanner.vue — Era-signature component ch1 (HTML 90s / GeoCities).

  <marquee> deprecated REAL (D4-05 era-authenticity intentional).
  Swap a <span class="marquee-banner__static"> bajo PRM vía v-if (NO v-show).

  Por qué v-if y no CSS:
  - <marquee> scrolling es behavior nativo del browser, NO CSS animation.
  - animation-play-state: paused NO afecta a <marquee>.
  - v-if elimina el <marquee> del DOM → browser para de scrollearlo.
  (RESEARCH Pattern 3, D4-05, D4-10b)

  Consume inject('prm') para el branch JS.
  ART-07: cero pixel art — 100% CSS.
-->
<script setup>
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { prefersReduced } = inject('prm')
</script>

<template>
  <div class="marquee-banner" :data-prm="prefersReduced ? 'reduce' : 'normal'">
    <!-- D4-10b PRM branch via v-if — <marquee> sale del DOM bajo PRM.
         D4-05 era-authenticity: tag deprecated REAL intencional.
         eslint-disable para suprimir aviso del linter sobre tag deprecated. -->
    <!-- eslint-disable-next-line vue/no-deprecated-html-element-is -->
    <marquee
      v-if="!prefersReduced"
      behavior="scroll"
      direction="left"
      scrollamount="6"
      class="marquee-banner__scroll"
      :aria-label="t('chapters.1.marqueeAria')"
    >
      {{ t('chapters.1.marqueeText') }}
    </marquee>
    <span v-else class="marquee-banner__static">
      {{ t('chapters.1.marqueeText') }}
    </span>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * MarqueeBanner — HTML 90s era banner, ch1.
 * Tokens via cascade [data-chapter="1"]:
 *   --c-bg: #000080 (navy), --c-fg: #ff00ff (magenta), --c-accent: #ffff00 (yellow)
 *   --font-body: 'Comic Neue' (self-hosted Phase 2 W4)
 * ───────────────────────────────────────────────────────────────────────── */
.marquee-banner {
  font-family: 'Comic Neue', 'Comic Sans MS', cursive;
  background: var(--c-bg);
  color: var(--c-accent);
  padding: var(--sp-md);
  border: 2px solid var(--c-border);
  position: relative;
  overflow: hidden;
}

.marquee-banner__scroll {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--c-fg);
}

.marquee-banner__static {
  display: block;
  font-size: 1.2rem;
  text-align: center;
  font-weight: bold;
  color: var(--c-fg);
  padding: var(--sp-xs) 0;
}
</style>
