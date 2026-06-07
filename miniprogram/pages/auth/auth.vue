<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Decorative top -->
      <div class="auth-header">
        <div class="auth-brand">
          <span class="brand-crest">SB</span>
        </div>
        <h1 class="auth-welcome">{{ $t('auth.welcome') }}</h1>
        <p class="auth-subtitle">{{ $t('auth.subtitle') }}</p>
      </div>

      <!-- Form Card -->
      <div class="auth-card">
        <!-- Phone Input -->
        <div class="field-group">
          <label class="field-label">Phone Number</label>
          <div class="phone-field">
            <div class="country-code">
              <span>{{ selectedPhoneCode }}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
            <div class="country-picker-overlay" @click="showCountryPicker">
              <picker
                :range="countryCodes"
                :value="phoneCodeIndex"
                @change="onPhoneCodeChange"
              >
              </picker>
            </div>
            <input
              v-model="phone"
              class="phone-input"
              type="tel"
              :placeholder="$t('auth.phonePlaceholder')"
            />
          </div>
        </div>

        <!-- Code Input -->
        <div class="field-group">
          <label class="field-label">Verification Code</label>
          <div class="code-field">
            <input
              v-model="code"
              class="code-input"
              type="text"
              inputmode="numeric"
              maxlength="6"
              :placeholder="$t('auth.codePlaceholder')"
            />
            <button
              class="send-btn"
              :class="{ counting: countdown > 0 }"
              :disabled="countdown > 0 || sending"
              @click="handleSendCode"
            >
              <span v-if="sending" class="btn-spinner"></span>
              <span v-else-if="countdown > 0">{{ countdown }}s</span>
              <span v-else>{{ $t('auth.getCode') }}</span>
            </button>
          </div>
          <p class="field-hint" v-if="codeSent">Code sent! Check the server console for dev code.</p>
        </div>

        <!-- Error -->
        <div class="error-banner" v-if="error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Submit -->
        <button
          class="login-btn"
          :class="{ loading: loading }"
          :disabled="loading"
          @click="handleLogin"
        >
          <span v-if="loading" class="btn-spinner"></span>
          <span v-else>{{ $t('auth.loginOrRegister') }}</span>
        </button>

        <div class="auth-divider">
          <span>Secure login via SMS</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { authApi, commonApi } from '../../api';

const { t } = useI18n();
const userStore = useUserStore();

const phone = ref('');
const code = ref('');
const loading = ref(false);
const sending = ref(false);
const countdown = ref(0);
const error = ref('');
const codeSent = ref(false);

const countries = ref<any[]>([]);
const countryCodes = ref<string[]>([]);
const phoneCodeIndex = ref(0);
const selectedPhoneCode = ref('+86');
let countdownTimer: any = null;

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
  } catch { /* ignore */ }
});

function onPhoneCodeChange(e: any) {
  phoneCodeIndex.value = e.detail.value;
  selectedPhoneCode.value = countries.value[e.detail.value]?.phoneCode || '+86';
}

function showCountryPicker() {
  // picker is triggered by the overlay click
}

function startCountdown() {
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) clearInterval(countdownTimer);
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
    await authApi.sendCode({ phone: selectedPhoneCode.value + phone.value });
    startCountdown();
    codeSent.value = true;
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
    await userStore.login({ phone: selectedPhoneCode.value + phone.value, code: code.value });
    uni.showToast({ title: t('auth.success'), icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/match/match' }), 400);
  } catch (err: any) {
    error.value = err.message || t('auth.error');
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/global.scss';

.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg;
  @include paper-texture;
  padding: 40px 24px;
}

.auth-container {
  width: 100%;
  max-width: 380px;
}

/* ── Header ──────────────────────────── */
.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-brand {
  margin-bottom: 24px;
}

.brand-crest {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: $ink-deep;
  color: $gold-warm;
  font-family: 'Georgia', serif;
  font-weight: 700;
  font-size: 20px;
  border-radius: 16px;
  letter-spacing: -1px;
  box-shadow: 0 4px 20px rgba($ink-deep, 0.15);
}

.auth-welcome {
  font-family: 'Georgia', serif;
  font-size: 26px;
  font-weight: 700;
  color: $ink-deep;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: $text-secondary;
  font-style: italic;
}

/* ── Card ───────────────────────────── */
.auth-card {
  background: $ivory;
  border-radius: $radius-xl;
  padding: 32px 28px;
  border: 1px solid rgba($clay, 0.2);
  box-shadow:
    0 1px 3px rgba($ink-deep, 0.04),
    0 8px 32px rgba($ink-deep, 0.06);
}

/* ── Fields ──────────────────────────── */
.field-group {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
}

.field-hint {
  font-size: 11px;
  color: $text-hint;
  margin-top: 6px;
  font-style: italic;
}

.phone-field {
  display: flex;
  gap: 0;
  border: 1.5px solid $border;
  border-radius: $radius;
  overflow: hidden;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: $gold-warm;
    box-shadow: 0 0 0 3px rgba($gold-warm, 0.08);
  }
}

.country-code {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  color: $ink-deep;
  background: rgba($clay, 0.08);
  border-right: 1.5px solid $border;
  cursor: pointer;
  position: relative;
  z-index: 0;
}

.country-picker-overlay {
  position: absolute;
  inset: 0;
  picker {
    width: 100%;
    height: 100%;
    opacity: 0;
  }
}

.phone-input {
  flex: 1;
  border: none;
  padding: 0 14px;
  font-size: 15px;
  color: $text-primary;
  background: transparent;
  outline: none;
  height: 46px;

  &::placeholder { color: $text-hint; }
}

/* Code */
.code-field {
  display: flex;
  gap: 10px;
}

.code-input {
  flex: 1;
  height: 46px;
  padding: 0 14px;
  border: 1.5px solid $border;
  border-radius: $radius;
  font-size: 20px;
  letter-spacing: 8px;
  text-align: center;
  font-family: 'SF Mono', 'Courier New', monospace;
  color: $ink-deep;
  transition: border-color 0.2s;
  background: $ivory;

  &:focus {
    outline: none;
    border-color: $gold-warm;
    box-shadow: 0 0 0 3px rgba($gold-warm, 0.08);
  }

  &::placeholder {
    letter-spacing: 0;
    font-size: 13px;
    color: $text-hint;
  }
}

.send-btn {
  width: 110px;
  height: 46px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: $ink-deep;
  border: 1.5px solid $clay;
  border-radius: $radius;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: all 0.2s;

  &:hover {
    border-color: $gold-warm;
    color: $gold-warm;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
}

/* ── Error ───────────────────────────── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba($ember, 0.06);
  border: 1px solid rgba($ember, 0.15);
  border-radius: $radius;
  color: $ember;
  font-size: 12px;
  margin-bottom: 20px;
}

/* ── Login Button ────────────────────── */
.login-btn {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $ink-deep;
  color: $ivory;
  border: none;
  border-radius: $radius;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: all 0.25s;
  margin-top: 8px;

  &:hover {
    background: lighten($ink-deep, 8%);
    box-shadow: 0 4px 16px rgba($ink-deep, 0.2);
    transform: translateY(-1px);
  }

  &:active { transform: translateY(0); }
  &:disabled { opacity: 0.6; cursor: default; transform: none; }
}

/* ── Divider ──────────────────────────── */
.auth-divider {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid $border;

  span {
    font-size: 11px;
    color: $text-hint;
    font-style: italic;
  }
}

/* ── Spinner ──────────────────────────── */
.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba($ivory, 0.3);
  border-top-color: $ivory;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
