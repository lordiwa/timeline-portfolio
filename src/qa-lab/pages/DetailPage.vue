<script setup>
import { computed, onMounted, ref } from 'vue'
import { useSite } from '../composables/useSite.js'
import { clampQty } from '../state/store.js'
import { routePath } from '../generator/pages.js'
import PageShell from '../ui/PageShell.vue'

const { site, content, route, t, store, toast, has, nthHit, nav } = useSite()
// BUG stale-detail-on-param-change: el id se lee UNA vez al montar (el layout reutiliza el componente al cambiar solo
// el parametro de la ruta, asi que nunca se recarga). Sin el flag el componente se remonta con cada ruta.
const frozenId = has('stale-detail-on-param-change') ? route.value.params.id : null
const itemId = computed(() => frozenId ?? route.value.params.id)
const item = computed(() => content.value.items.find((i) => i.id === itemId.value))
// Productos relacionados: los dos siguientes del catalogo (circular), con enlace a su detalle.
const related = computed(() => {
  const items = content.value.items
  const i = items.findIndex((x) => x.id === itemId.value)
  return [1, 2].map((k) => items[(i + k) % items.length]).filter((x) => x && x.id !== itemId.value)
})
const qty = ref(1)
const hasCart = site.pages.includes('cart')

// BUG cart-loses-item-on-back: al volver ATRAS a este detalle se restaura el carrito previo a la ultima alta,
// asi que el primer item agregado se pierde cuando despues se agrega otro.
onMounted(() => {
  if (has('cart-loses-item-on-back') && nav.last === 'back') store.undoLastAdd()
})

function add() {
  qty.value = clampQty(qty.value) // cantidad siempre 1..99
  // BUG nth-add-to-cart-fails: la N-esima alta muestra el aviso de exito pero no agrega el producto.
  if (nthHit('nth-add-to-cart-fails')) { toast(t('cart.added', { name: item.value.name })); return }
  if (store.addToCart(item.value.id, qty.value)) toast(t('cart.added', { name: item.value.name }))
}
</script>

<template>
  <PageShell v-if="item" type="detail" :title="item.name">
    <p>{{ item.desc }}</p>
    <p>
      <span class="qa-badge">{{ content.categories[item.category] }}</span>
      <span class="qa-price" data-testid="detail-price"> {{ content.money(item.price) }}</span>
    </p>
    <div v-if="hasCart" class="qa-actions">
      <label class="qa-label" for="qa-detail-qty">{{ t('cart.qty') }}</label>
      <input id="qa-detail-qty" v-model.number="qty" type="number" min="1" max="99" class="qa-qty" />
      <button type="button" class="qa-btn" data-testid="add-to-cart" @click="add">{{ t('cart.add') }}</button>
    </div>
    <section v-if="related.length" class="qa-related" data-testid="related">
      <h2>{{ t('detail.related') }}</h2>
      <ul>
        <li v-for="r in related" :key="r.id"><a :href="`#${routePath('detail', r.id)}`" data-testid="related-link">{{ r.name }}</a></li>
      </ul>
    </section>
    <p><a :href="`#${routePath('list')}`">{{ t('detail.back') }}</a></p>
  </PageShell>
</template>
