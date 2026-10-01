<script setup>
import { useSite } from '../composables/useSite.js'
import PageShell from '../ui/PageShell.vue'

const { t } = useSite()
</script>

<template>
  <PageShell type="notfound">
    <p><a href="#/">{{ t('notfound.home') }}</a></p>
  </PageShell>
</template>
