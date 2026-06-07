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

      <!-- Form -->
      <view class="auth-form">
        <!-- Country Code + Phone -->
        <view class="phone-row">
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

        <!-- Verification Code -->
        <view class="code-row mt-24">
          <input
            v-model="code"
            class="input flex-1"
            type="number"
            maxlength="6"
            :placeholder="$t('auth.codePlaceholder')"
          />
          <button
            class="code-btn"
            :class="{ 'code-btn-disabled': countdown > 0 }"
            :disabled="countdown > 0 || sending"
            @click="handleSendCode"
          >
            <text v-if="countdown > 0">{{ countdown }}s</text>
            <text v-else>{{ sending ? '...' : $t('auth.getCode') }}</text>
          </button>
        </view>

        <!-- Error Message -->
        <view class="error-msg" v-if="error">
          <text class="text-sm text-danger">{{ error }}</text>
        </view>

        <!-- Submit -->
        <button
          class="btn btn-primary btn-block mt-48"
          :class="{ 'btn-disabled': loading }"
          :disabled="loading"
          @click="handleLogin"
        >
          {{ loading ? '...' : $t('auth.loginOrRegister') }}
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
import { commonApi, authApi } from '../../api';

const { t } = useI18n();
const userStore = useUserStore();

const phone = ref('');
const code = ref('');
const loading = ref(false);
const sending = ref(false);
const countdown = ref(0);
const error = ref('');
let countdownTimer: any = null;

const countries = ref<any[]>([]);
const countryCodes = ref<string[]>([]);
const phoneCodeIndex = ref(0);
const selectedPhoneCode = ref('+86');

onMounted(async () => {
  try {
    const data = await commonApi.getCountries();
    countries.value = data as any[];
    countryCodes.value = countries.value.map((c: any) => `${c.name} (${c.phoneCode})`);
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

function goBack() {
  uni.navigateBack();
}

function startCountdown() {
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer);
    }
  }, 1000);
}

async function handleSendCode() {
  if (!phone.value || phone.value.length < 6) {
    error.value = t('auth.phoneRequired');
    return;
  }
  error.value = '';
  sending.value = true;

  try {
    const fullPhone = selectedPhoneCode.value + phone.value;
    await authApi.sendCode({ phone: fullPhone });
    startCountdown();
    uni.showToast({ title: t('auth.codeSent'), icon: 'success' });
  } catch (err: any) {
    error.value = err.message || t('common.error');
  } finally {
    sending.value = false;
  }
}

function validate(): boolean {
  error.value = '';
  if (!phone.value || phone.value.length < 6) {
    error.value = t('auth.phoneRequired');
    return false;
  }
  if (!code.value || code.value.length !== 6) {
    error.value = t('auth.codeRequired');
    return false;
  }
  return true;
}

async function handleLogin() {
  if (!validate()) return;
  loading.value = true;
  error.value = '';

  try {
    const fullPhone = selectedPhoneCode.value + phone.value;
    await userStore.login({ phone: fullPhone, code: code.value });
    uni.showToast({ title: t('auth.success'), icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/match/match' }), 500);
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
.auth-form { margin-top: 32rpx; }
.phone-row { display: flex; gap: 12rpx; }
.phone-code-picker { display: flex; align-items: center; gap: 4rpx; padding: 0 16rpx; border: 2rpx solid #E8E8E8; border-radius: 12rpx; font-size: 26rpx; white-space: nowrap; }
.arrow { color: #999; }
.code-row { display: flex; gap: 16rpx; }
.code-btn {
  width: 200rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: #4A90D9;
  color: #fff;
  border-radius: 12rpx;
  font-size: 26rpx;
  text-align: center;
  border: none;
  padding: 0;
}
.code-btn::after { border: none; }
.code-btn-disabled { background: #B0C4DE; }
.error-msg { margin-top: 16rpx; padding: 12rpx 16rpx; background: #FFF2F0; border-radius: 8rpx; }
.auth-footer { padding: 32rpx; }
</style>
