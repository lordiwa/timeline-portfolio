<script setup>
import { computed } from 'vue'
import { useLab } from '../composables/useLab.js'
import { useListing } from '../composables/useForm.js'
import PageShell from '../components/PageShell.vue'
import Pager from '../components/Pager.vue'
import Tabs from '../components/Tabs.vue'
import { ref } from 'vue'

const { page, has, t, tt } = useLab()
const c = page.content
const L = useListing(c.rows, { pageSize: c.pageSize, match: (r, q) => !q || r.person.toLowerCase().includes(q) }, has)
const view = ref('table')
const tabs = computed(() => [{ id: 'table', label: t('list.viewTable') }, { id: 'summary', label: t('list.viewSummary') }])
const unlabeled = computed(() => has('missing-label')) // BUG missing-label (buscador)

const rows = computed(() => L.pageRows())
// BUG total-wrong: el total de la pagina omite la ultima fila.
const pageTotal = computed(() => (has('total-wrong') ? rows.value.slice(0, -1) : rows.value).reduce((s, r) => s + r.price, 0))
const all = computed(() => c.rows)
const setSearch = (e) => { L.search.value = e.target.value; L.resetPage() }
const setCat = (e) => { L.cat.value = e.target.value; L.resetPage() }
</script>

<template>
  <PageShell tpl-id="dashboard">
    <div class="qa-kpis">
      <div class="qa-kpi">{{ t('list.kpiTotal') }}<b>{{ all.length }}</b></div>
      <div class="qa-kpi">{{ t('list.kpiAmount') }}<b>{{ all.reduce((s, r) => s + r.price, 0) }}</b></div>
      <div class="qa-kpi">{{ t('list.kpiOpen') }}<b>{{ all.filter((r) => r.cat === 1).length }}</b></div>
    </div>
    <Tabs v-model="view" :tabs="tabs">
      <template #default="{ active }">
        <template v-if="active === 'table'">
          <div class="qa-toolbar-row">
            <label v-if="!unlabeled" class="qa-label" for="qa-search">{{ t('fields.search') }}</label>
            <input id="qa-search" type="search" :value="L.search.value" :placeholder="unlabeled ? t('fields.search') : ''" @input="setSearch" />
            <select :value="L.cat.value" :aria-label="t('list.allStatus')" @change="setCat">
              <option value="">{{ t('list.allStatus') }}</option>
              <option v-for="i in 3" :key="i" :value="String(i - 1)">{{ t(`list.status_${i - 1}`) }}</option>
            </select>
            <button type="button" class="qa-btn secondary" @click="L.clear()">{{ t('list.clear') }}</button>
          </div>
          <table class="qa-table">
            <thead>
              <tr><th>{{ t('list.colId') }}</th><th>{{ t('list.colName') }}</th><th>{{ t('list.colItem') }}</th><th>{{ t('list.colStatus') }}</th><th class="num">{{ t('list.colAmount') }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id">
                <td>{{ r.id }}</td><td>{{ r.person }}</td><td>{{ tt(`item${r.itemIdx}`) }}</td>
                <td><span class="qa-badge">{{ t(`list.status_${r.cat}`) }}</span></td>
                <td class="num">{{ r.price }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr><td colspan="4">{{ t('list.total') }}</td><td class="num" data-testid="page-total">{{ pageTotal }}</td></tr>
            </tfoot>
          </table>
          <p v-if="!L.filtered().length" class="qa-hint">{{ t('list.empty') }}</p>
          <Pager v-model:page="L.page.value" :pages="L.pages()" :skip-at="c.skipAt" />
        </template>
        <ul v-else>
          <li v-for="i in 3" :key="i">{{ t(`list.status_${i - 1}`) }}: {{ all.filter((r) => r.cat === i - 1).length }}</li>
        </ul>
      </template>
    </Tabs>
  </PageShell>
</template>
