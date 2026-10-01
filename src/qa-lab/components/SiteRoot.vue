<script setup>
// Raiz del sitio generado: crea store + router + contenido, los provee a las paginas y monta el layout.
// Usar con :key="seed+level": un sitio nuevo es una instancia nueva (store y router incluidos).
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { provideSite } from '../composables/useSite.js'
import { createRouter, parseHash } from '../router/index.js'
import { matchPath } from '../generator/pages.js'
import { createStore } from '../state/store.js'
import { resolveContent } from '../content/index.js'
import { createEnv } from '../services/clock.js'
import { capFlags } from '../generator/capabilities.js'
import SiteLayout from './SiteLayout.vue'
import Toast from './Toast.vue'

const props = defineProps({
  site: { type: Object, required: true },
  storage: { type: Object, default: undefined }, // tests inyectan un storage; por defecto sessionStorage
  env: { type: Object, default: undefined }, // { clock, latency }; por defecto createEnv(site)
})
const { t } = useI18n()

// env: reloj, zona horaria simulada y latencia inyectables (los tests pasan su propio reloj por prop).
const env = props.env || createEnv({ seed: props.site.seed, tzOffsetMinutes: props.site.tzOffsetMinutes })
const store = createStore(props.site, props.storage)
const bugSet = new Set(props.site.bugs)
// BUG protected-deeplink: el guard no corre en la resolucion INICIAL (deep link pegado en una pestana nueva) si esa
// ruta es la pagina del bug; las navegaciones posteriores si pasan por el guard.
const initialType = matchPath(props.site, parseHash(window.location.hash).path).type
let booting = true
const skipGuard = bugSet.has('protected-deeplink') && props.site.bugPages['protected-deeplink'] === initialType
const router = createRouter(props.site, { isAuthed: () => !!store.state.user || (skipGuard && booting) })
const content = computed(() => resolveContent(props.site, t))

// Direccion de la ultima navegacion: 'back' si la ruta nueva es la anterior del historial recorrido (boton atras).
const nav = { last: 'push' }
const visited = [router.route.value.path]
watch(router.route, (r) => {
  if (r.path === visited.at(-1)) return
  if (r.path === visited.at(-2)) { visited.pop(); nav.last = 'back' } else { visited.push(r.path); nav.last = 'push' }
}, { flush: 'sync' })

const messages = ref([])
let nextId = 1
function toast(text) {
  const id = nextId++
  messages.value.push({ id, text })
  env.clock.setTimeout(() => { messages.value = messages.value.filter((m) => m.id !== id) }, 3500)
}

provideSite({ site: props.site, env, caps: capFlags(props.site), bugSet, route: router.route, router, store, content, toast, nav })
router.start()
booting = false
watch(() => !!store.state.user, () => router.refresh()) // la sesion cambio: re-evaluar el guard
onBeforeUnmount(() => router.stop())
</script>

<template>
  <SiteLayout />
  <Toast :messages="messages" />
</template>
