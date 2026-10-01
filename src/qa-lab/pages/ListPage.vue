<script setup>
// Listado: busqueda + filtros combinados (categoria, precio maximo) + orden + paginacion.
// Los filtros viven en el store: al volver desde el detalle el listado queda como estaba.
import { computed, ref } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useListing } from '../composables/useListing.js'
import { routePath } from '../generator/pages.js'
import PageShell from '../ui/PageShell.vue'
import Pager from '../ui/Pager.vue'
import Dropdown from '../components/Dropdown.vue'

const { site, content, has, nthHit, t, store, toast, env, labelTarget } = useSite()
const c = computed(() => content.value)
// BUG stale-response-overwrites: con el flag la busqueda es una "request" con latencia y la ULTIMA en llegar gana
// (no se descartan las respuestas viejas); `shown` es el texto de la ultima respuesta, que puede no ser el del input.
// Sin el flag se filtra directo por el texto del input (siempre la ultima consulta).
const shown = ref(store.ui.list.search)
const L = useListing(
  () => c.value.items,
  {
    pageSize: site.data.list.pageSize,
    match: (r, q) => !q || r.name.toLowerCase().includes(q),
    searchOf: () => (has('stale-response-overwrites') ? shown.value : store.ui.list.search),
  },
  has,
  store.ui.list,
)
const rows = computed(() => L.pageRows())
const sortItems = computed(() => [
  { id: 'default', label: t('list.sortDefault') },
  { id: 'priceAsc', label: t('list.sortPriceAsc') },
  { id: 'priceDesc', label: t('list.sortPriceDesc') },
])
const hasDetail = site.pages.includes('detail')
const hasCart = site.pages.includes('cart')
const unlabeled = computed(() => has('missing-label') && labelTarget() === 'search') // BUG missing-label
const searchTab = computed(() => (has('tab-order') ? 3 : undefined)) // BUG tab-order

function onSearch(v) {
  L.set('search', v)
  if (has('stale-response-overwrites')) env.latency.request('search', () => v).then((q) => { shown.value = q })
  else shown.value = v
}
function clear() {
  L.clear()
  shown.value = L.state.search
}
function goPage(n) {
  // BUG filter-lost-on-paginate: al paginar se pierden la busqueda y los filtros (la pagina sigue en n).
  if (has('filter-lost-on-paginate')) {
    Object.assign(L.state, { search: '', cat: '', price: '', sort: 'default' })
    shown.value = ''
  }
  L.state.page = n
}
function add(item) {
  // BUG nth-add-to-cart-fails: la N-esima alta muestra el aviso de exito pero no agrega el producto.
  if (nthHit('nth-add-to-cart-fails')) { toast(t('cart.added', { name: item.name })); return }
  if (store.addToCart(item.id)) toast(t('cart.added', { name: item.name }))
}
</script>

<template>
  <PageShell type="list">
    <div class="qa-toolbar-row">
      <label v-if="!unlabeled" class="qa-label" for="qa-search">{{ t('fields.search') }}</label>
      <input id="qa-search" type="search" :value="L.state.search" :placeholder="unlabeled ? t('fields.search') : ''" :tabindex="searchTab" @input="onSearch($event.target.value)" />
      <select data-testid="filter-cat" :value="L.state.cat" :aria-label="t('list.allCats')" @change="L.set('cat', $event.target.value)">
        <option value="">{{ t('list.allCats') }}</option>
        <option v-for="(name, i) in c.categories" :key="i" :value="String(i)">{{ name }}</option>
      </select>
      <select data-testid="filter-price" :value="L.state.price" :aria-label="t('list.anyPrice')" @change="L.set('price', $event.target.value)">
        <option value="">{{ t('list.anyPrice') }}</option>
        <option v-for="p in c.priceBands" :key="p" :value="String(p)">{{ t('list.upTo', { n: c.money(p) }) }}</option>
      </select>
      <Dropdown :label="t('list.sortBy')" :items="sortItems" :active="L.state.sort" class="on-light" @select="(id) => L.set('sort', id)" />
      <button type="button" class="qa-btn secondary" @click="clear">{{ t('list.clear') }}</button>
    </div>
    <p class="qa-hint" data-testid="result-count">{{ t('list.results', { n: L.filtered().length }) }}</p>
    <div class="qa-grid" :style="{ '--cols': site.data.list.cols }">
      <article v-for="r in rows" :key="r.id" class="qa-card" data-testid="item-card">
        <h3>
          <a v-if="hasDetail" :href="`#${routePath('detail', r.id)}`">{{ r.name }}</a>
          <template v-else>{{ r.name }}</template>
        </h3>
        <span class="qa-badge">{{ c.categories[r.category] }}</span>
        <span class="qa-price">{{ c.money(r.price) }}</span>
        <button v-if="hasCart" type="button" class="qa-btn secondary" data-testid="add-to-cart" @click="add(r)">{{ t('cart.add') }}</button>
      </article>
    </div>
    <template v-if="!L.filtered().length">
      <!-- BUG spinner-on-empty-results: sin resultados el spinner de carga nunca termina y falta el mensaje vacio. -->
      <p v-if="has('spinner-on-empty-results')" class="qa-hint qa-spinner" role="progressbar" aria-busy="true">{{ t('site.loading') }}</p>
      <p v-else class="qa-hint qa-empty" role="status">{{ t('list.empty') }}</p>
    </template>
    <Pager :page="L.current()" :pages="L.pages()" :skip-at="site.data.list.skipAt" @update:page="goPage" />
  </PageShell>
</template>
