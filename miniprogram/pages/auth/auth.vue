<template>
  <view class="page flex-col">
    <!-- Header -->
    <view class="auth-header safe-top">
      <text class="back-btn" @click="goBack">←</text>
      <LanguageSwitcher />
    </view>

    <!-- Content -->
    <view class="auth-content flex-1">
      <view class="auth-welcome">
        <text class="auth-icon">👋</text>
        <text class="auth-title">{{ $t('auth.welcome') }}</text>
        <text class="auth-subtitle">{{ $t('auth.subtitle') }}</text>
      </view>

      <!-- Tab: Login / Register -->
      <view class="auth-tabs">
        <view
          :class="['auth-tab', { active: activeTab === 'login' }]"
          @click="activeTab = 'login'"
        >
          {{ $t('auth.login') }}
        </view>
        <view
          :class="['auth-tab', { active: activeTab === 'register' }]"
          @click="activeTab = 'register'"
        >
          {{ $t('auth.register') }}
        </view>
      </view>

      <!-- Form -->
      <view class="auth-form">
        <!-- Type Toggle: Email / Phone -->
        <view class="type-toggle">
          <view
            :class="['type-btn', { active: loginType === 'email' }]"
            @click="loginType = 'email'"
          >Email</view>
          <view
            :class="['type-btn', { active: loginType === 'phone' }]"
            @click="loginType = 'phone'"
          >Phone</view>
        </view>

        <!-- Phone Code Picker -->
        <view class="phone-row" v-if="loginType === 'phone'">
          <picker
            :range="countryCodes"
            :value="phoneCodeIndex"
            @change="onPhoneCodeChange"
            class="phone-code-picker"
          >
            <text>{{ selectedPhoneCode }}</text>
            <text class="arrow">▾</text>
          </picker>
          <input
            v-model="phone"
            class="input flex-1"
            type="number"
            :placeholder="$t('auth.phonePlaceholder')"
          />
        </view>

        <!-- Email Input -->
        <input
          v-if="loginType === 'email'"
          v-model="email"
          class="input"
          type="email"
          :placeholder="$t('auth.emailPlaceholder')"
        />

        <!-- Nickname (register only) -->
        <input
          v-if="activeTab === 'register'"
          v-model="nickname"
          class="input mt-24"
          :placeholder="$t('auth.nicknamePlaceholder')"
        />

        <!-- Password -->
        <input
          v-model="password"
          class="input mt-24"
          type="password"
          :placeholder="$t('auth.passwordPlaceholder')"
        />

        <!-- Country (register only) -->
        <picker
          v-if="activeTab === 'register'"
          :range="countryNames"
          :value="countryIndex"
          @change="onCountryChange"
          class="country-picker mt-24"
        >
          <view class="input flex flex-between">
            <text :class="{ 'text-hint': !selectedCountry }">
              {{ selectedCountry || $t('auth.selectCountry') }}
            </text>
            <text class="text-hint">▾</text>
          </view>
        </picker>

        <!-- Error Message -->
        <view class="error-msg" v-if="error">
          <text class="text-sm text-danger">{{ error }}</text>
        </view>

        <!-- Submit -->
        <button
          class="btn btn-primary btn-block mt-48"
          :class="{ 'btn-disabled': loading }"
          :disabled="loading"
          @click="handleSubmit"
        >
          {{ loading ? '...' : activeTab === 'login' ? $t('auth.login') : $t('auth.register') }}
        </button>
      </view>
    </view>

    <!-- Footer -->
    <view class="auth-footer safe-bottom text-center text-sm text-secondary">
      {{ $t('auth.agreement') }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { commonApi } from '../../api';

const { t } = useI18n();
const userStore = useUserStore();

const activeTab = ref<'login' | 'register'>('login');
const loginType = ref<'email' | 'phone'>('email');
const email = ref('');
const phone = ref('');
const nickname = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const countries = ref<any[]>([]);
const countryCodes = ref<string[]>([]);
const countryNames = ref<string[]>([]);
const phoneCodeIndex = ref(0);
const countryIndex = ref(-1);
const selectedPhoneCode = ref('+86');
const selectedCountry = ref('');

onMounted(async () => {
  try {
    const data = await commonApi.getCountries();
    countries.value = data as any[];
    countryCodes.value = countries.value.map((c) => `${c.name} (${c.phoneCode})`);
    countryNames.value = countries.value.map((c) => c.name);
    // Default to China / +86
    const cnIdx = countries.value.findIndex((c: any) => c.code === 'CN');
    if (cnIdx >= 0) {
      phoneCodeIndex.value = cnIdx;
      selectedPhoneCode.value = countries.value[cnIdx].phoneCode;
    }
  } catch { /* use defaults */ }
});

function onPhoneCodeChange(e: any) {
  phoneCodeIndex.value = e.detail.value;
  selectedPhoneCode.value = countries.value[e.detail.value]?.phoneCode || '+86';
}

function onCountryChange(e: any) {
  countryIndex.value = e.detail.value;
  selectedCountry.value = countries.value[e.detail.value]?.name || '';
}

function goBack() {
  uni.navigateBack();
}

function validate(): boolean {
  error.value = '';
  if (loginType.value === 'email' && !email.value) {
    error.value = t('auth.emailRequired');
    return false;
  }
  if (loginType.value === 'phone' && !phone.value) {
    error.value = t('auth.phoneRequired');
    return false;
  }
  if (!password.value || password.value.length < 8) {
    error.value = t('auth.passwordTooShort');
    return false;
  }
  if (activeTab.value === 'register') {
    if (!nickname.value.trim()) {
      error.value = t('auth.nicknameRequired');
      return false;
    }
    if (!selectedCountry.value) {
      error.value = t('auth.countryRequired');
      return false;
    }
  }
  return true;
}

async function handleSubmit() {
  if (!validate()) return;
  loading.value = true;
  error.value = '';

  try {
    if (activeTab.value === 'register') {
      const payload: any = {
        type: loginType.value,
        password: password.value,
        nickname: nickname.value.trim(),
        country: selectedCountry.value,
      };
      if (loginType.value === 'email') payload.email = email.value.trim();
      else {
        payload.phone = phone.value.trim();
        payload.phoneCode = selectedPhoneCode.value;
      }
      await userStore.register(payload);
    } else {
      const payload: any = { type: loginType.value, password: password.value };
      if (loginType.value === 'email') payload.email = email.value.trim();
      else {
        payload.phone = phone.value.trim();
        payload.phoneCode = selectedPhoneCode.value;
      }
      await userStore.login(payload);
    }
    uni.showToast({ title: t('auth.success'), icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 500);
  } catch (err: any) {
    error.value = err.message || t('auth.error');
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #fff; }
.auth-header { display: flex; justify-content: space-between; padding: 24rpx 32rpx; }
.back-btn { font-size: 40rpx; color: #333; padding: 8rpx; }
.auth-content { padding: 0 48rpx; }
.auth-welcome { text-align: center; padding: 48rpx 0; }
.auth-icon { font-size: 80rpx; display: block; }
.auth-title { font-size: 44rpx; font-weight: 700; display: block; margin-top: 24rpx; }
.auth-subtitle { font-size: 28rpx; color: #999; display: block; margin-top: 12rpx; }
.auth-tabs { display: flex; gap: 32rpx; justify-content: center; margin-bottom: 48rpx; }
.auth-tab { font-size: 32rpx; color: #999; padding-bottom: 8rpx; }
.auth-tab.active { color: #4A90D9; font-weight: 600; border-bottom: 4rpx solid #4A90D9; }
.type-toggle { display: flex; background: #F5F5F5; border-radius: 12rpx; padding: 4rpx; margin-bottom: 24rpx; }
.type-btn {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: #999;
}
.type-btn.active { background: #fff; color: #333; font-weight: 500; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.phone-row { display: flex; gap: 12rpx; }
.phone-code-picker { display: flex; align-items: center; gap: 4rpx; padding: 0 16rpx; border: 2rpx solid #E8E8E8; border-radius: 12rpx; font-size: 26rpx; white-space: nowrap; }
.arrow { color: #999; }
.country-picker { width: 100%; }
.error-msg { margin-top: 16rpx; padding: 12rpx 16rpx; background: #FFF2F0; border-radius: 8rpx; }
.auth-footer { padding: 32rpx; }
</style>
