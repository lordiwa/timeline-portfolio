<script setup>
// Plantillas signup / contact / checkout (formulario lineal; checkout suma un carrito).
import { computed, reactive } from 'vue'
import { useLab } from '../composables/useLab.js'
import { useForm, useSubmissions } from '../composables/useForm.js'
import PageShell from '../components/PageShell.vue'
import FormField from '../components/FormField.vue'
import PrimaryButton from '../components/PrimaryButton.vue'

const props = defineProps({ tplId: { type: String, required: true } })
const { page, has, t, tt, toast } = useLab()

const fields = page.content.fields
const { values, errors, validateField, validate } = useForm(fields, has)
const { count, busy, record } = useSubmissions(has)
const HINTS = { password: 'fields.hintPassword', age: 'fields.hintAge', email: 'fields.hintEmail' }

const lines = reactive((page.content.lines || []).map((l) => ({ ...l })))
const fmt = (n) => n.toFixed(2)
// Cantidad valida: entero 1..99 (vacio/0/negativos no rompen el total). Solo con 'total-wrong' se usa el valor crudo.
const qtyOf = (l) => (has('total-wrong') ? l.qty : Math.min(99, Math.max(1, Math.floor(Number(l.qty)) || 1)))
const lineTotal = (l) => qtyOf(l) * l.price
const normalizeQty = (l) => { if (!has('total-wrong')) l.qty = qtyOf(l) }
const subtotal = computed(() =>
  lines.reduce((sum, l, i) => sum + (has('total-wrong') && i === 0 ? l.price : lineTotal(l)), 0), // BUG: ignora la cantidad de la 1a linea
)
const tax = computed(() => (subtotal.value * page.content.taxRate) / 100)

function submit() {
  if (!validate()) return
  if (record()) toast(t('site.sent'))
}
</script>

<template>
  <PageShell :tpl-id="tplId">
    <table v-if="lines.length" class="qa-cart">
      <thead>
        <tr><th>{{ t('cart.item') }}</th><th>{{ t('cart.qty') }}</th><th>{{ t('cart.unit') }}</th><th>{{ t('cart.line') }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="(l, i) in lines" :key="l.itemIdx">
          <td>{{ tt(`item${l.itemIdx}`) }}</td>
          <td><input v-model.number="l.qty" type="number" min="1" max="99" @change="normalizeQty(l)":aria-label="`${t('cart.qty')} ${i + 1}`" /></td>
          <td>{{ fmt(l.price) }}</td>
          <td data-testid="line-total">{{ fmt(lineTotal(l)) }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="lines.length" class="qa-totals">
      <div>{{ t('cart.tax', { rate: page.content.taxRate }) }}: {{ fmt(tax) }}</div>
      <div class="grand">{{ t('cart.total') }}: <span data-testid="grand-total">{{ fmt(subtotal + tax) }}</span></div>
    </div>

    <form class="qa-form" novalidate @submit.prevent="submit">
      <FormField
        v-for="f in fields"
        :key="f.key"
        v-model="values[f.key]"
        :field="f"
        :error="errors[f.key]"
        :hint="HINTS[f.key] ? t(HINTS[f.key]) : ''"
        @blur="validateField(f)"
      />
      <div class="qa-actions">
        <PrimaryButton type="submit" :disabled="busy">{{ tplId === 'checkout' ? tt('cta') : t('site.submit') }}</PrimaryButton>
      </div>
    </form>
    <p class="qa-counter" data-testid="submissions">{{ t('site.submissions', { n: count }) }}</p>
  </PageShell>
</template>
