<template>
  <view class="page p-32">
    <text class="text-xl text-bold">{{ $t('settings.title') }}</text>

    <!-- Language -->
    <view class="settings-group mt-32">
      <text class="text-sm text-hint mb-16">{{ $t('settings.language') }}</text>
      <view class="card" style="margin: 0;">
        <picker :range="languageLabels" :value="langIndex" @change="onLangChange">
          <view class="flex-between py-8">
            <text>{{ currentLangLabel }}</text>
            <text class="text-hint">▾</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- Notifications -->
    <view class="settings-group mt-32">
      <text class="text-sm text-hint mb-16">{{ $t('settings.notifications') }}</text>
      <view class="card" style="margin: 0;">
        <view class="flex-between py-8">
          <text>{{ $t('settings.pushNotifications') }}</text>
          <switch :checked="settings.notifications" @change="onToggle('notifications', $event)" color="#4A90D9" />
        </view>
        <view class="divider"></view>
        <view class="flex-between py-8">
          <text>{{ $t('settings.sound') }}</text>
          <switch :checked="settings.soundEnabled" @change="onToggle('soundEnabled', $event)" color="#4A90D9" />
        </view>
      </view>
    </view>

    <!-- Privacy -->
    <view class="settings-group mt-32">
      <text class="text-sm text-hint mb-16">{{ $t('settings.privacy') }}</text>
      <view class="card" style="margin: 0;">
        <view class="flex-between py-8">
          <text>{{ $t('settings.showExam') }}</text>
          <switch :checked="privacy.showExam" @change="onPrivacyToggle('showExam', $event)" color="#4A90D9" />
        </view>
        <view class="divider"></view>
        <view class="flex-between py-8">
          <text>{{ $t('settings.showCheckin') }}</text>
          <switch :checked="privacy.showCheckin" @change="onPrivacyToggle('showCheckin', $event)" color="#4A90D9" />
        </view>
        <view class="divider"></view>
        <view class="flex-between py-8">
          <text>{{ $t('settings.showReviews') }}</text>
          <switch :checked="privacy.showReviews" @change="onPrivacyToggle('showReviews', $event)" color="#4A90D9" />
        </view>
      </view>
    </view>

    <!-- About -->
    <view class="settings-group mt-32">
      <text class="text-sm text-hint mb-16">{{ $t('settings.about') }}</text>
      <view class="card" style="margin: 0;">
        <view class="py-8 flex-between">
          <text>{{ $t('settings.version') }}</text>
          <text class="text-hint">1.0.0</text>
        </view>
        <view class="divider"></view>
        <view class="py-8">
          <text @click="openTerms">{{ $t('settings.terms') }}</text>
        </view>
        <view class="divider"></view>
        <view class="py-8">
          <text @click="openPrivacy">{{ $t('settings.privacyPolicy') }}</text>
        </view>
      </view>
    </view>

    <!-- Delete Account -->
    <view class="mt-48 text-center">
      <text class="text-hint text-sm" @click="deleteAccount">
        {{ $t('settings.deleteAccount') }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { userApi } from '../../api';

const { t, locale } = useI18n();
const userStore = useUserStore();

const settings = userStore.settings;

const languages = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
];

const languageLabels = languages.map((l) => l.label);
const langIndex = ref(languages.findIndex((l) => l.value === locale.value) || 0);
const currentLangLabel = computed(() => languages[langIndex.value]?.label || 'English');

const privacy = ref({
  showExam: true,
  showCheckin: true,
  showReviews: true,
});

function onLangChange(e: any) {
  langIndex.value = e.detail.value;
  const lang = languages[langIndex.value].value;
  locale.value = lang;
  uni.setStorageSync('locale', lang);
  userStore.updateSettings({ language: lang });
  uni.showToast({ title: 'Language changed', icon: 'none' });
}

function onToggle(key: string, e: any) {
  userStore.updateSettings({ [key]: e.detail.value });
}

async function onPrivacyToggle(key: string, e: any) {
  privacy.value = { ...privacy.value, [key]: e.detail.value };
  try {
    await userApi.updateProfile({ privacySettings: privacy.value });
  } catch { /* */ }
}

function openTerms() { uni.showToast({ title: 'TODO: Open terms URL', icon: 'none' }); }
function openPrivacy() { uni.showToast({ title: 'TODO: Open privacy URL', icon: 'none' }); }

function deleteAccount() {
  uni.showModal({
    title: t('settings.deleteConfirm'),
    success: () => {
      uni.showToast({ title: 'TODO: Account deletion flow', icon: 'none' });
    },
  });
}
</script>

<style lang="scss" scoped>
.settings-group { }
</style>
