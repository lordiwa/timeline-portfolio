<script setup>
import { computed, reactive, ref } from 'vue'
import { useLab } from '../composables/useLab.js'
import PageShell from '../components/PageShell.vue'
import Tabs from '../components/Tabs.vue'
import PrimaryButton from '../components/PrimaryButton.vue'

const { page, has, t, tt, toast } = useLab()
const c = page.content
const tab = ref('article')
const comments = reactive(c.comments.map((x) => ({ ...x })))
const draft = ref('')
const unlabeled = computed(() => has('missing-label')) // BUG missing-label (caja de comentario)
const tabs = computed(() => [
  { id: 'article', label: t('article.tabArticle') },
  { id: 'comments', label: t('article.tabComments', { n: comments.length }) },
])

function publish() {
  if (!draft.value.trim()) return
  comments.unshift({ author: '·', text: draft.value.trim(), minutes: 0 })
  draft.value = ''
  toast(t('article.commentPosted'))
}
</script>

<template>
  <PageShell tpl-id="article">
    <Tabs v-model="tab" :tabs="tabs">
      <template #default="{ active }">
        <article v-if="active === 'article'" class="qa-article">
          <h2>{{ tt('article') }}</h2>
          <p class="qa-hint">{{ t('article.by') }}</p>
          <p v-for="i in c.paragraphs" :key="i">{{ t(`text.p${i}`) }}</p>
        </article>
        <section v-else>
          <div v-for="(m, i) in comments" :key="i" class="qa-comment">
            <strong>{{ m.author }}</strong> <small>{{ t('article.minutesAgo', { n: m.minutes }) }}</small>
            <p>{{ m.text || t(`comment.c${m.textIdx}`) }}</p>
          </div>
          <form class="qa-form" @submit.prevent="publish">
            <div class="qa-field">
              <label v-if="!unlabeled" class="qa-label" for="qa-comment">{{ t('fields.comment') }}</label>
              <textarea id="qa-comment" v-model="draft" rows="3" :placeholder="unlabeled ? t('fields.comment') : ''" />
            </div>
            <div class="qa-actions"><PrimaryButton type="submit">{{ t('article.publish') }}</PrimaryButton></div>
          </form>
        </section>
      </template>
    </Tabs>
  </PageShell>
</template>
