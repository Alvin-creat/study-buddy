<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from './i18n';
import { useUserStore } from './store/user';
import { toastState } from './utils/uni-polyfill';
import { uni } from './utils/uni-polyfill';

const router = useRouter();
const route = useRoute();
const { locale } = useI18n();
const userStore = useUserStore();

const tabs = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/match', label: 'Find', icon: '🔍' },
  { path: '/rooms', label: 'Chat', icon: '💬' },
  { path: '/profile', label: 'Me', icon: '👤' },
];

const showTabBar = computed(() => {
  const routesWithTab = ['/', '/match', '/rooms', '/profile'];
  return routesWithTab.includes(route.path);
});

const currentTab = computed(() => {
  const idx = tabs.findIndex(t => t.path === route.path);
  return idx >= 0 ? idx : 0;
});

function switchTab(path: string) {
  router.push(path);
}

// Detect system language on mount
const sysLang = navigator.language;
const langMap: Record<string, string> = {
  'zh-CN': 'zh-CN', 'zh': 'zh-CN',
  'ja': 'ja', 'ko': 'ko', 'es': 'es', 'fr': 'fr', 'ar': 'ar',
};
const detected = langMap[sysLang] || 'en';
locale.value = detected;
userStore.updateSettings({ language: detected });
</script>

<template>
  <div class="app-container">
    <div class="page-content" :class="{ 'has-tabbar': showTabBar }">
      <router-view />
    </div>

    <!-- Tab Bar -->
    <nav v-if="showTabBar" class="tab-bar">
      <div
        v-for="(tab, idx) in tabs"
        :key="tab.path"
        class="tab-item"
        :class="{ active: idx === currentTab }"
        @click="switchTab(tab.path)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </nav>

    <!-- Toast -->
    <Teleport to="body">
      <div v-if="toastState.toastVisible.value" class="global-toast">
        {{ toastState.toastMsg.value }}
      </div>
    </Teleport>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans SC', 'Noto Sans JP', 'Noto Sans KR', sans-serif;
  font-size: 14px;
  color: #1A1A1A;
  background: #F5F5F5;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.page-content.has-tabbar {
  padding-bottom: 60px;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  height: 60px;
  background: #fff;
  border-top: 1px solid #E8E8E8;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}
.tab-item.active { color: #4A90D9; }
.tab-icon { font-size: 22px; }
.tab-label { font-size: 10px; }

/* Global Toast */
.global-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 9999;
  pointer-events: none;
  animation: toast-in 0.2s ease;
}
@keyframes toast-in {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
</style>
