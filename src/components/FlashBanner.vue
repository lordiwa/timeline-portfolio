<!--
  FlashBanner.vue — Header skeumorphic Flash era 2009 para ch2.

  Decisiones de diseño:
  - Plan 04-03 §3.1 verbatim: solo template + script. CSS vive en chapter-themes.css
    @layer components bajo [data-chapter="2"] .flash-banner — convención Phase 3
    ProjectCard idem (era-specific styling externalizado, scoped reservado para
    layout SFC-local).
  - Chrome dots simulando window controls (mac-style red/yellow/green) en
    aria-hidden=true porque son decoración pura, NO controles.
  - i18n keys (UI-SPEC §11.6): chapters.2.bannerTitle + chapters.2.bannerSubtitle.
    Subtitle ES/EN idénticos (BlueLizard / Matte CG / Joju Games son nombres propios).
  - h2 (no h1): el aria-label de la chapter-section ya provee landmark; banner
    es header dentro del chapter, no del documento.
-->
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <header class="flash-banner">
    <div class="flash-banner-chrome" aria-hidden="true"></div>
    <h2 class="flash-banner-title">{{ t('chapters.2.bannerTitle') }}</h2>
    <p class="flash-banner-subtitle">{{ t('chapters.2.bannerSubtitle') }}</p>
  </header>
</template>
