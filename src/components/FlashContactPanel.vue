<!--
  FlashContactPanel.vue — CONTACT panel for ch2 Y2K stage (Phase 04.1).
  Hardcoded contact data (Rafael 2026-05-17 — contact.js queda en placeholder global).
  CV buttons ES/EN both point to /Profile.pdf temp (Y2K-09 decision).
-->
<script setup>
const links = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/rafaelmatovelle/',
    tech: 'in://rafaelmatovelle',
  },
  {
    id: 'github',
    label: 'GitHub',
    href: 'https://github.com/lordiwa',
    tech: 'git://lordiwa',
  },
  {
    id: 'email',
    label: 'Email',
    href: 'mailto:srparca@gmail.com',
    tech: 'mailto://srparca',
  },
]
</script>

<template>
  <div class="flash-panel flash-panel-contact" data-panel="contact">
    <header class="flash-panel-head">
      <h3 class="flash-panel-title">CONNECT.SYS</h3>
      <span class="flash-panel-meta">3 channels online</span>
    </header>

    <ul class="flash-contact-list">
      <li v-for="link in links" :key="link.id" class="flash-contact-item">
        <a
          class="flash-contact-link"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="flash-contact-icon" aria-hidden="true">
            <svg v-if="link.id === 'linkedin'" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square">
              <rect x="3" y="3" width="18" height="18" />
              <line x1="7" y1="10" x2="7" y2="17" />
              <circle cx="7" cy="7" r="0.5" fill="currentColor" />
              <path d="M11 17 L11 10 M11 13 C11 11 13 10 15 10 C17 10 17 12 17 14 L17 17" />
            </svg>
            <svg v-else-if="link.id === 'github'" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 20 L9 17 C9 16 9 15 8 15 M9 17 C7 17 6 16 6 14 M15 20 L15 17 C15 16 15 15 16 15 M15 17 C17 17 18 16 18 14 M8 12 C8 9 10 8 12 8 C14 8 16 9 16 12" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter">
              <rect x="3" y="6" width="18" height="12" />
              <path d="M3 6 L12 14 L21 6" />
            </svg>
          </span>
          <span class="flash-contact-label">{{ link.label }}</span>
          <span class="flash-contact-tech">{{ link.tech }}</span>
          <span class="flash-contact-arrow" aria-hidden="true">▸</span>
        </a>
      </li>
    </ul>

    <div class="flash-contact-cv">
      <p class="flash-contact-cv-label">CV.DOWNLOAD</p>
      <div class="flash-contact-cv-buttons">
        <a
          class="flash-cv-btn"
          href="/Profile.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download
        >
          <span aria-hidden="true">⬇</span> CV · ES
        </a>
        <a
          class="flash-cv-btn"
          href="/Profile.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download
        >
          <span aria-hidden="true">⬇</span> CV · EN
        </a>
      </div>
    </div>
  </div>
</template>
