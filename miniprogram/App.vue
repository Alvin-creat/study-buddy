<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from './i18n';
import { useUserStore } from './store/user';

const router = useRouter();
const route = useRoute();
const { locale } = useI18n();
const userStore = useUserStore();

const tabs = [
  { path: '/', label: 'Home', icon: '📖' },
  { path: '/match', label: 'Find', icon: '🔍' },
  { path: '/rooms', label: 'Chat', icon: '✉️' },
  { path: '/profile', label: 'Me', icon: '⚜️' },
];

const showTabBar = computed(() => {
  return ['/', '/match', '/rooms', '/profile'].includes(route.path);
});

const currentTab = computed(() => {
  const idx = tabs.findIndex(t => t.path === route.path);
  return idx >= 0 ? idx : 0;
});

function switchTab(path: string) {
  router.push(path);
}

// Detect language
const langMap: Record<string, string> = {
  'zh-CN': 'zh-CN', 'zh': 'zh-CN',
  'ja': 'ja', 'ko': 'ko', 'es': 'es', 'fr': 'fr', 'ar': 'ar',
};
const detected = langMap[navigator.language] || 'en';
locale.value = detected;
userStore.updateSettings({ language: detected });
</script>

<template>
  <div class="app-shell">
    <main class="app-main" :class="{ 'has-tabs': showTabBar }">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

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
        <span v-if="idx === currentTab" class="tab-indicator"></span>
      </div>
    </nav>
  </div>
</template>

<style lang="scss">
@import './styles/global.scss';

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg;
  @include paper-texture;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  &.has-tabs {
    padding-bottom: 72px;
  }
}

/* Tab Bar */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  height: 64px;
  background: rgba($ivory, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid $border;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  position: relative;
  color: $text-hint;
  transition: color 0.3s;

  &.active {
    color: $ink-deep;
  }
}

.tab-icon {
  font-size: 20px;
  line-height: 1;
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.tab-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: $gold-warm;
  border-radius: 0 0 2px 2px;
}

/* Page Transitions */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: $clay; border-radius: 2px; }
</style>
