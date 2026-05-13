import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import './styles/chapter-themes.css'   // W2: @layer cascade + 7 themes era-auténticos

createApp(App).use(i18n).mount('#app')
