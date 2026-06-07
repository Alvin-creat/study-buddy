import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { router } from './router';
import App from './App.vue';
import { uni } from './utils/uni-polyfill';
import { messages } from './i18n/locales';
import Empty from './components/Empty.vue';
import LanguageSwitcher from './components/LanguageSwitcher.vue';

(window as any).uni = uni;

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
});

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
app.use(router);
app.config.globalProperties.uni = uni;

app.component('Empty', Empty);
app.component('LanguageSwitcher', LanguageSwitcher);

// Use .then() instead of top-level await
router.isReady().then(() => {
  app.mount('#app');
  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.style.display = 'none';
}).catch((err: any) => {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.innerHTML = `<div style="padding:40px;color:red;">
      <h2>❌ Router Error</h2>
      <p>${err?.message || err}</p>
    </div>`;
  }
});
