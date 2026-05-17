<!--
  FlashMobileNotice.vue — Dismissible mobile easter-egg modal for ch2 (Phase 04.1).
  Shows once per session (sessionStorage flag). Visible only <600px (CSS-gated).
-->
<script setup>
import { ref } from 'vue'

const STORAGE_KEY = 'ch2-mobile-notice-dismissed'

function shouldShow() {
  if (typeof sessionStorage === 'undefined') return true
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== '1'
  } catch {
    return true
  }
}

const visible = ref(shouldShow())

function dismiss() {
  visible.value = false
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // SSR / private mode — no persist, user reseats it next mount
  }
}
</script>

<template>
  <div v-if="visible" class="flash-mobile-notice" role="alertdialog" aria-labelledby="flash-mobile-notice-title">
    <div class="flash-mobile-notice-window">
      <div class="flash-mobile-notice-titlebar">
        <span class="flash-mobile-notice-dot"></span>
        <span class="flash-mobile-notice-titletext">SYSTEM.NOTICE</span>
        <button
          type="button"
          class="flash-mobile-notice-close"
          aria-label="Dismiss"
          @click="dismiss"
        >×</button>
      </div>
      <div class="flash-mobile-notice-body">
        <h4 id="flash-mobile-notice-title" class="flash-mobile-notice-title">MOBILE DETECTED</h4>
        <p>
          Sadly, that's exactly why Flash died. You get to see this.
        </p>
        <p class="flash-mobile-notice-sub">
          (Would look way nicer on a desktop browser.)
        </p>
        <button
          type="button"
          class="flash-mobile-notice-btn"
          @click="dismiss"
        >CONTINUE ANYWAY ▸</button>
      </div>
    </div>
  </div>
</template>
