<template>
  <view class="lang-switcher" @click="cycleLang">
    <text class="lang-text">{{ currentFlag }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../store/user';

const { locale } = useI18n();
const userStore = useUserStore();

const flags: Record<string, { flag: string; next: string }> = {
  'zh-CN': { flag: '中', next: 'en' },
  'en': { flag: 'EN', next: 'ja' },
  'ja': { flag: '日', next: 'ko' },
  'ko': { flag: '한', next: 'es' },
  'es': { flag: 'ES', next: 'fr' },
  'fr': { flag: 'FR', next: 'ar' },
  'ar': { flag: 'عر', next: 'zh-CN' },
};

const currentFlag = computed(() => flags[locale.value]?.flag || 'EN');

function cycleLang() {
  const next = flags[locale.value]?.next || 'en';
  locale.value = next;
  uni.setStorageSync('locale', next);
  userStore.updateSettings({ language: next });
}
</script>

<style lang="scss" scoped>
.lang-switcher {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lang-text { font-size: 22rpx; font-weight: 600; color: #666; }
</style>
