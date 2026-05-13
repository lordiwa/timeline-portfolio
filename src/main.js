import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'

// Fonts self-hosted (W4) — @fontsource packages auto-wire @font-face declarations
// + bundle woff2 assets via Vite. ch2 (Verdana/Trebuchet MS) usa system-safe
// stack — NO requiere import. D2-07 + D2-08 + RESEARCH §R4.
// Subsets: latin + latin-ext — cubre ES/EN (ñ, á, é, í, ó, ú, ü, ¿, ¡; Open-Q2-E).
// Bundle target: 150-350 KB (D2-08). No se incluyen cyrillic/greek (fuera de scope).
import '@fontsource/vt323/latin.css'              // ch0 — CRT terminal (latin)
import '@fontsource/vt323/latin-ext.css'          // ch0 — latin-ext (ñ, á, etc.)
import '@fontsource/comic-neue'                   // ch1 — Comic Sans equivalent (solo latin disponible)
import '@fontsource/lobster/latin.css'            // ch3 — Web 2.0 cursive (latin)
import '@fontsource/lobster/latin-ext.css'        // ch3 — latin-ext (ñ, á, etc.)
import '@fontsource/audiowide/latin.css'          // ch4 — AR/VR futuristic (latin)
import '@fontsource/audiowide/latin-ext.css'      // ch4 — latin-ext (ñ, á, etc.)
import './styles/inter-variable-latin.css'        // ch5 — Inter Variable latin+latin-ext (wght 100-900)
import '@fontsource/press-start-2p/latin.css'     // ch6 — Phaser pixel UI (latin)
import '@fontsource/press-start-2p/latin-ext.css' // ch6 — latin-ext (ñ, á, etc.)

import './styles/chapter-themes.css'   // W2: @layer cascade + 7 themes era-auténticos

createApp(App).use(i18n).mount('#app')
