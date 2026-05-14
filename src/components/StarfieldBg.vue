<!--
  StarfieldBg.vue — Era-signature decorativo ch1 (HTML 90s / GeoCities).

  CSS-only starfield via radial-gradient repetido. Sin lógica JS.
  Posicionado absolute con inset:0 para vivir detrás del content del chapter.

  ART-07: cero pixel art.
  D4-10c: @keyframes starfield-twinkle → animation: none bajo PRM.
  aria-hidden="true" — decorativo, screen readers lo ignoran.
-->
<script setup>
// Sin lógica — componente 100% decorativo CSS-only
</script>

<template>
  <div class="starfield-bg" aria-hidden="true"></div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * StarfieldBg — CSS-only starfield via radial-gradient repeated.
 * Technique verified: tobiasahlin.com "Performant CSS animations" —
 * animar solo opacity (NO box-shadow) evita repaints GPU costosos.
 * ───────────────────────────────────────────────────────────────────────── */
.starfield-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;

  /* 6 radial-gradients distribuidos por el tile 200×200px */
  background-image:
    radial-gradient(2px 2px at 20% 30%, white 50%, transparent 100%),
    radial-gradient(1px 1px at 40% 70%, white 50%, transparent 100%),
    radial-gradient(1.5px 1.5px at 60% 20%, white 50%, transparent 100%),
    radial-gradient(1px 1px at 80% 50%, white 50%, transparent 100%),
    radial-gradient(2px 2px at 10% 80%, #ffffaa 50%, transparent 100%),
    radial-gradient(1px 1px at 50% 50%, white 50%, transparent 100%);
  background-size: 200px 200px;
  background-repeat: repeat;

  /* Twinkle: solo opacity (NO box-shadow — anti-pattern perf) */
  animation: starfield-twinkle 4s ease-in-out infinite alternate;
}

/* ─────────────────────────────────────────────────────────────────────────
 * @keyframes starfield-twinkle — solo opacity, no transform/box-shadow
 * ───────────────────────────────────────────────────────────────────────── */
@keyframes starfield-twinkle {
  from { opacity: 0.7; }
  to   { opacity: 1.0; }
}

/* ─────────────────────────────────────────────────────────────────────────
 * D4-10c PRM branch — starfield estático, sin twinkle
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .starfield-bg {
    animation: none;
    opacity: 1;
  }
}
</style>
