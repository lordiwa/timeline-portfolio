import { h } from 'vue'
import FormTemplate from './FormTemplate.vue'
import WizardTemplate from './WizardTemplate.vue'
import ProductsTemplate from './ProductsTemplate.vue'
import ArticleTemplate from './ArticleTemplate.vue'
import FaqTemplate from './FaqTemplate.vue'
import DashboardTemplate from './DashboardTemplate.vue'

const form = (tplId) => ({ name: `Qa${tplId}`, render: () => h(FormTemplate, { tplId }) })

// id de plantilla (registry.js) -> componente Vue
export const TEMPLATE_COMPONENTS = {
  signup: form('signup'),
  checkout: form('checkout'),
  contact: form('contact'),
  wizard: WizardTemplate,
  products: ProductsTemplate,
  article: ArticleTemplate,
  faq: FaqTemplate,
  dashboard: DashboardTemplate,
}
