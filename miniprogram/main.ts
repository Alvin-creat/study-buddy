import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { router } from './router';
import App from './App.vue';
import { uni } from './utils/uni-polyfill';
import { messages } from './i18n/locales';

// Make uni globally available (pages reference it without import)
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

app.mount('#app');
