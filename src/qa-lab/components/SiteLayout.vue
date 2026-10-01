<script setup>
// Navbar + pagina actual + footer + ayuda. El sitio parece un sitio web corriente a proposito.
import { computed, nextTick, ref, watch } from 'vue'
import { useSite } from '../composables/useSite.js'
import { NAV_TYPES, PROTECTED, routePath } from '../generator/pages.js'
import Modal from '../ui/Modal.vue'
import HomePage from '../pages/HomePage.vue'
import ListPage from '../pages/ListPage.vue'
import DetailPage from '../pages/DetailPage.vue'
import CartPage from '../pages/CartPage.vue'
import CheckoutPage from '../pages/CheckoutPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import SignupPage from '../pages/SignupPage.vue'
import AccountPage from '../pages/AccountPage.vue'
import ContactPage from '../pages/ContactPage.vue'
import FaqPage from '../pages/FaqPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import BlogPage from '../pages/BlogPage.vue'
import WizardPage from '../pages/WizardPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'

const PAGES = {
  home: HomePage, list: ListPage, detail: DetailPage, cart: CartPage, checkout: CheckoutPage,
  login: LoginPage, signup: SignupPage, account: AccountPage, contact: ContactPage, faq: FaqPage,
  dashboard: DashboardPage, blog: BlogPage, wizard: WizardPage, notfound: NotFoundPage,
}

const { site, content, route, router, store, has, t, toast, locale } = useSite()
const helpOpen = ref(false)
const mainEl = ref(null)
// Skip-link: un handler que mueve el foco (NO un #ancla: chocaria con el router por hash).
const skipToContent = () => mainEl.value?.focus()
const menuOpen = ref(false)
const toggleEl = ref(null)
let helpFromMenu = false
// Ayuda abierta desde el menu mobile: el menu se cierra, asi que el foco vuelve al boton Menu (el de Ayuda queda oculto).
const helpReturn = () => (helpFromMenu ? toggleEl.value : null)
function openHelp() {
  helpFromMenu = menuOpen.value
  helpOpen.value = true
}

const navTypes = computed(() => NAV_TYPES.filter((p) => site.pages.includes(p)))
// El detalle cuelga del listado; el checkout, del carrito.
const activeOf = (type) => route.value.type === type || (type === 'list' && route.value.type === 'detail') || (type === 'cart' && route.value.type === 'checkout')
const user = computed(() => store.state.user)
const has_ = (p) => site.pages.includes(p)
const vars = computed(() => ({ '--hue': site.style.hue, '--radius': `${site.style.radius}px`, '--width': `${site.style.width}px` }))

// Al cambiar de ruta el foco va al <h1> de la pagina nueva y el titulo del documento la refleja (comportamiento correcto por defecto).
const pageName = computed(() => t(`pageName.${route.value.type}`))
watch([pageName, () => content.value.brand, locale], () => { document.title = `${pageName.value} · ${content.value.brand} · QA Lab` }, { immediate: true })
watch(() => route.value.path, async () => {
  await nextTick()
  mainEl.value?.querySelector('h1')?.focus()
})

function logout() {
  store.logout()
  if (PROTECTED.has(route.value.type)) router.replace('/')
  toast(t('site.loggedOut'))
}
</script>

<template>
  <div class="site" :class="[`hdr-${site.style.header}`, `font-${site.style.font}`, `den-${site.style.density}`, { lowc: has('low-contrast') }]" :style="vars" :data-page="route.type" :data-theme="site.themeId">
    <button type="button" class="skip-link" data-testid="skip-link" @click="skipToContent">{{ t('site.skip') }}</button>
    <header class="site-header">
      <a class="brand" :href="`#${routePath('home')}`">{{ content.brand }}</a>
      <span v-if="site.style.header === 'banner'" class="tagline">{{ content.tagline }}</span>
      <button ref="toggleEl" type="button" class="nav-toggle" :aria-expanded="menuOpen" aria-controls="qa-nav" data-testid="nav-toggle" @click="menuOpen = !menuOpen">{{ t('site.menu') }}</button>
      <nav id="qa-nav" class="site-nav" :class="{ open: menuOpen }" :aria-label="t('site.menu')" @click="menuOpen = false">
        <a v-for="p in navTypes" :key="p" :href="`#${routePath(p)}`" :class="{ active: activeOf(p) }" :aria-current="activeOf(p) ? 'page' : undefined" :data-nav="p">
          {{ content.nav[p] }}<span v-if="p === 'cart'" class="cart-count" data-testid="cart-count"> ({{ store.cartCount.value }})</span>
        </a>
        <span class="site-session">
          <template v-if="user">
            <a v-if="has_('account')" :href="`#${routePath('account')}`" :class="{ active: activeOf('account') }" data-nav="account" data-testid="session-user">{{ user.name || content.nav.account }}</a>
            <span v-else data-testid="session-user">{{ user.name }}</span>
            <button type="button" data-testid="nav-logout" @click="logout">{{ t('nav.logout') }}</button>
          </template>
          <template v-else>
            <a v-if="has_('account')" :href="`#${routePath('account')}`" :class="{ active: activeOf('account') }" data-nav="account" data-testid="account-link">{{ content.nav.account }}</a>
            <a v-if="has_('login')" :href="`#${routePath('login')}`" :class="{ active: activeOf('login') }" data-nav="login">{{ content.nav.login }}</a>
            <a v-if="has_('signup')" :href="`#${routePath('signup')}`" :class="{ active: activeOf('signup') }" data-nav="signup">{{ content.nav.signup }}</a>
          </template>
          <button type="button" class="site-help" @click="openHelp">{{ t('site.help') }}</button>
        </span>
      </nav>
    </header>
    <main ref="mainEl" class="site-main" tabindex="-1">
      <component :is="PAGES[route.type]" :key="route.path" />
    </main>
    <footer class="site-footer">{{ t('site.footer', { brand: content.brand }) }}</footer>
    <Modal :open="helpOpen" :return-to="helpReturn" :title="t('site.helpTitle')" @close="helpOpen = false">
      <p>{{ t('site.helpBody') }} <a href="#" @click.prevent="toast(t('site.aboutText', { brand: content.brand }))">{{ t('site.about') }}</a></p>
    </Modal>
  </div>
</template>
