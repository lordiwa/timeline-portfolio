<script setup>
// Pagina protegida: el guard del router manda al login si no hay sesion.
import { computed } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useForm } from '../composables/useForm.js'
import { fromMinor } from '../state/pricing.js'
import PageShell from '../ui/PageShell.vue'
import FormField from '../ui/FormField.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'

const { content, router, has, t, store, toast, env } = useSite()
const user = computed(() => store.state.user)
const fieldsOf = () => [content.value.field('name'), { ...content.value.field('newsletter'), required: false }]
const fields = computed(fieldsOf)
const { values, errors, validateField, validate } = useForm(fieldsOf(), has, env.clock)
values.name = store.state.user?.name ?? ''
values.newsletter = store.state.prefs.newsletter
const orders = computed(() => store.state.orders.filter((o) => o.customer.email === user.value?.email))

function save() {
  if (!validate(fields.value)) return
  store.updateProfile({ name: values.name, newsletter: values.newsletter })
  toast(t('account.saved'))
}
function logout() {
  store.logout()
  router.replace('/')
}
const money = (o) => content.value.money(fromMinor(o.totals.total, o.totals.decimals))
</script>

<template>
  <PageShell type="account">
    <template v-if="user">
      <p data-testid="account-user">{{ t('account.signedAs', { name: user.name, email: user.email }) }}</p>
      <form class="qa-form" novalidate @submit.prevent="save">
        <FormField v-for="f in fields" :key="f.key" v-model="values[f.key]" :field="f" :error="errors[f.key]" @blur="validateField(f)" />
        <div class="qa-actions">
          <PrimaryButton type="submit">{{ t('account.save') }}</PrimaryButton>
          <button type="button" class="qa-btn secondary" data-testid="logout" @click="logout">{{ t('nav.logout') }}</button>
        </div>
      </form>
      <h2>{{ t('account.orders') }}</h2>
      <ul v-if="orders.length" data-testid="orders">
        <li v-for="o in orders" :key="o.id">{{ o.id }} — {{ t('account.items', { n: o.lines.reduce((s, l) => s + l.qty, 0) }) }} — {{ money(o) }}</li>
      </ul>
      <p v-else class="qa-hint">{{ t('account.noOrders') }}</p>
    </template>
  </PageShell>
</template>
