<!--
  FlashHomePanel.vue — HOME panel for ch2 Y2K stage (Phase 04.1).
  Renders: FlashBanner + .ch2-flavor (legacy selector preserved for tests).
-->
<script setup>
import { useI18n } from 'vue-i18n'
import FlashBanner from './FlashBanner.vue'

const { t } = useI18n()
</script>

<template>
  <div class="flash-panel flash-panel-home" data-panel="home">
    <FlashBanner />
    <p class="ch2-flavor flash-panel-flavor">{{ t('chapters.2.flavor') }}</p>
    <div class="flash-panel-hint" aria-hidden="true">▸ select a section from the menu</div>
  </div>
</template>
