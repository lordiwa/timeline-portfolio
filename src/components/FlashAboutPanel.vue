<!--
  FlashAboutPanel.vue — ABOUT panel for ch2 Y2K stage (Phase 04.1).
  Renders: ch2-bust framed with scanlines + bio paragraphs.
  Preserves .ch2-bio selector (legacy tests T3).
-->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { bio } from '@/data/bio'

const { t } = useI18n()
const chapter = chapters[2]
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))
// Dynamic binding (avoids vite-plugin-vue transformAssetUrls trying to resolve the
// /assets/ path at compile-time → it's a public/ runtime URL).
const bustSrc = '/assets/ch2-bust.png'
// Imagen épica "La gran guerra Flash vs Apple" — debajo del texto (Rafael 2026-05-28).
// Foreshadowing de ch3 (Flash caído): aquí Flash está sano y poderoso liderando la horda.
const warSrc = '/assets/ch2-flash-war.png'
</script>

<template>
  <div class="flash-panel flash-panel-about" data-panel="about">
    <div class="flash-about-grid">
      <figure class="flash-about-frame" aria-hidden="true">
        <img :src="bustSrc" alt="" class="flash-about-bust" />
        <figcaption class="flash-about-caption">ID:RM_2009</figcaption>
      </figure>
      <div class="ch2-bio flash-about-bio">
        <p v-for="(para, idx) in bioParagraphs" :key="idx">{{ para }}</p>
      </div>
    </div>

    <!-- La gran guerra: Flash vs Apple (debajo del texto) -->
    <figure class="flash-about-war">
      <img :src="warSrc" :alt="t('ui.flashWar')" class="flash-about-war-img" />
      <figcaption class="flash-about-war-cap">{{ t('ui.flashWar') }}</figcaption>
    </figure>
  </div>
</template>
