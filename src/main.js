import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'

// Fonts self-hosted (W4) — @fontsource packages auto-wire @font-face declarations
// + bundle woff2 assets via Vite. ch2 (Verdana/Trebuchet MS) usa system-safe
// stack — NO requiere import. D2-07 + D2-08 + RESEARCH §R4.
import '@fontsource/vt323'                  // ch0 — CRT terminal
import '@fontsource/comic-neue'             // ch1 — Comic Sans equivalent
import '@fontsource/lobster'                // ch3 — Web 2.0 cursive (default landing)
import '@fontsource/audiowide'              // ch4 — AR/VR futuristic geometric
import '@fontsource-variable/inter'         // ch5 — Modern Variable weights 100-900
import '@fontsource/press-start-2p'         // ch6 — Phaser pixel UI

import './styles/chapter-themes.css'   // W2: @layer cascade + 7 themes era-auténticos

createApp(App).use(i18n).mount('#app')
