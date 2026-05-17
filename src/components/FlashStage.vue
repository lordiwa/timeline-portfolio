<!--
  FlashStage.vue — Y2K cyber stage container (Phase 04.1).
  Mounts the active panel inside a <Transition> with fade-slide.
  panel: 'home' | 'about' | 'work' | 'contact'.
  Preserves .ch2-content (legacy test T1).
-->
<script setup>
import FlashHomePanel from './FlashHomePanel.vue'
import FlashAboutPanel from './FlashAboutPanel.vue'
import FlashWorkPanel from './FlashWorkPanel.vue'
import FlashContactPanel from './FlashContactPanel.vue'

const props = defineProps({
  panel: { type: String, default: 'home' },
})

const panels = {
  home: FlashHomePanel,
  about: FlashAboutPanel,
  work: FlashWorkPanel,
  contact: FlashContactPanel,
}
</script>

<template>
  <div class="ch2-content flash-stage" :data-active="panel">
    <Transition name="flash-panel" mode="out-in">
      <component :is="panels[panel] || panels.home" :key="panel" />
    </Transition>
  </div>
</template>
