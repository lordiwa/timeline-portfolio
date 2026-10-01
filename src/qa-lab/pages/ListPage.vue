<script setup>
// Listado: busqueda + filtros combinados (categoria, precio maximo) + orden + paginacion.
// Los filtros viven en el store: al volver desde el detalle el listado queda como estaba.
import { computed } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useListing, PRICE_BANDS } from '../composables/useListing.js'
import { routePath } from '../generator/pages.js'
import PageShell from '../ui/PageShell.vue'
import Pager from '../ui/Pager.vue'
import Dropdown from '../components/Dropdown.vue'

const { site, content, has, t, store, toast, labelTarget } = useSite()
const c = computed(() => content.value)
const L = useListing(
  () => c.value.items,
  { pageSize: site.data.list.pageSize, match: (r, q) => !q || r.name.toLowerCase().includes(q) },
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

function add(item) {
  if (store.addToCart(item.id)) toast(t('cart.added', { name: item.name }))
}
</script>

<template>
  <PageShell type="list">
    <div class="qa-toolbar-row">
      <label v-if="!unlabeled" class="qa-label" for="qa-search">{{ t('fields.search') }}</label>
      <input id="qa-search" type="search" :value="L.state.search" :placeholder="unlabeled ? t('fields.search') : ''" :tabindex="searchTab" @input="L.set('search', $event.target.value)" />
      <select data-testid="filter-cat" :value="L.state.cat" :aria-label="t('list.allCats')" @change="L.set('cat', $event.target.value)">
        <option value="">{{ t('list.allCats') }}</option>
        <option v-for="(name, i) in c.categories" :key="i" :value="String(i)">{{ name }}</option>
      </select>
      <select data-testid="filter-price" :value="L.state.price" :aria-label="t('list.anyPrice')" @change="L.set('price', $event.target.value)">
        <option value="">{{ t('list.anyPrice') }}</option>
        <option v-for="p in PRICE_BANDS" :key="p" :value="String(p)">{{ t('list.upTo', { n: p }) }}</option>
      </select>
      <Dropdown :label="t('list.sortBy')" :items="sortItems" :active="L.state.sort" class="on-light" @select="(id) => L.set('sort', id)" />
      <button type="button" class="qa-btn secondary" @click="L.clear()">{{ t('list.clear') }}</button>
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
    <p v-if="!L.filtered().length" class="qa-hint">{{ t('list.empty') }}</p>
    <Pager :page="L.current()" :pages="L.pages()" :skip-at="site.data.list.skipAt" @update:page="(n) => (L.state.page = n)" />
  </PageShell>
</template>
