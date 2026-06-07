<template>
  <view class="page p-32">
    <!-- Status Display -->
    <view class="status-card card text-center" v-if="verifyStatus !== 'UNVERIFIED'">
      <text class="status-icon">{{ statusIcon }}</text>
      <text class="text-lg text-bold mt-16">{{ statusTitle }}</text>
      <text class="text-sm text-secondary mt-8">{{ statusDesc }}</text>
      <text class="text-sm text-hint mt-8" v-if="verifyStatus === 'REJECTED'">
        {{ verification?.rejectReason }}
      </text>
    </view>

    <!-- Verification Form -->
    <view v-if="showForm">
      <view class="text-lg text-bold mb-24">{{ $t('verify.title') }}</view>
      <text class="text-sm text-secondary">{{ $t('verify.desc') }}</text>

      <!-- ID Type -->
      <view class="mt-32">
        <text class="text-bold">{{ $t('verify.idType') }}</text>
        <view class="id-type-grid mt-16">
          <view
            v-for="t in idTypes"
            :key="t.value"
            :class="['id-type-card', { active: form.idType === t.value }]"
            @click="form.idType = t.value"
          >
            <text class="id-type-icon">{{ t.icon }}</text>
            <text class="text-sm">{{ t.label }}</text>
          </view>
        </view>
      </view>

      <!-- Full Name -->
      <view class="mt-32">
        <text class="text-bold">{{ $t('verify.fullName') }}</text>
        <input
          v-model="form.name"
          class="input mt-12"
          :placeholder="$t('verify.namePlaceholder')"
        />
      </view>

      <!-- ID Number -->
      <view class="mt-24">
        <text class="text-bold">{{ $t('verify.idNumber') }}</text>
        <input
          v-model="form.idNumber"
          class="input mt-12"
          :placeholder="$t('verify.idNumberPlaceholder')"
        />
      </view>

      <!-- ID Card Front -->
      <view class="mt-24">
        <text class="text-bold">{{ $t('verify.idCardFront') }}</text>
        <view class="upload-box mt-12" @click="uploadImage('front')">
          <image v-if="frontImage" :src="frontImage" class="upload-preview" mode="aspectFit" />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">📷</text>
            <text class="text-sm text-hint mt-8">{{ $t('verify.uploadFront') }}</text>
          </view>
        </view>
      </view>

      <!-- Selfie -->
      <view class="mt-24">
        <text class="text-bold">{{ $t('verify.selfie') }}</text>
        <view class="upload-box mt-12" @click="uploadImage('selfie')">
          <image v-if="selfieImage" :src="selfieImage" class="upload-preview" mode="aspectFit" />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">🤳</text>
            <text class="text-sm text-hint mt-8">{{ $t('verify.uploadSelfie') }}</text>
          </view>
        </view>
      </view>

      <!-- Submit -->
      <button
        class="btn btn-primary btn-block mt-48"
        :class="{ 'btn-disabled': submitting || !canSubmit }"
        :disabled="submitting || !canSubmit"
        @click="handleSubmit"
      >
        {{ submitting ? $t('verify.submitting') : $t('verify.submit') }}
      </button>
    </view>

    <!-- Re-verify Button (if rejected) -->
    <button
      v-if="verifyStatus === 'REJECTED'"
      class="btn btn-primary btn-block mt-32"
      @click="resetForm"
    >
      {{ $t('verify.retry') }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { verifyApi, commonApi } from '../../api';

const { t } = useI18n();
const userStore = useUserStore();

const verifyStatus = ref('UNVERIFIED');
const verification = ref<any>(null);
const submitting = ref(false);
const frontImage = ref('');
const selfieImage = ref('');
const form = ref({
  idType: 'id_card',
  name: '',
  idNumber: '',
});

const idTypes = [
  { value: 'id_card', icon: '🪪', label: t('verify.idCard') },
  { value: 'passport', icon: '📕', label: t('verify.passport') },
  { value: 'drivers_license', icon: '🚗', label: t('verify.driversLicense') },
];

const showForm = computed(() => verifyStatus.value === 'UNVERIFIED' || verifyStatus.value === 'REJECTED');
const canSubmit = computed(() => form.value.name && form.value.idNumber && frontImage.value && selfieImage.value);

const statusIcon = computed(() => {
  if (verifyStatus.value === 'VERIFIED') return '✅';
  if (verifyStatus.value === 'PENDING') return '⏳';
  return '❌';
});

const statusTitle = computed(() => {
  if (verifyStatus.value === 'VERIFIED') return t('verify.verified');
  if (verifyStatus.value === 'PENDING') return t('verify.underReview');
  return t('verify.rejected');
});

const statusDesc = computed(() => {
  if (verifyStatus.value === 'VERIFIED') return t('verify.verifiedDesc');
  if (verifyStatus.value === 'PENDING') return t('verify.pendingDesc');
  return '';
});

onMounted(async () => {
  try {
    const status = await verifyApi.getStatus();
    const s = status as any;
    verifyStatus.value = s?.verifyStatus || 'UNVERIFIED';
    verification.value = s?.verification || null;
  } catch { /* ignore */ }
});

function uploadImage(type: 'front' | 'selfie') {
  uni.chooseImage({
    count: 1,
    sourceType: type === 'selfie' ? ['camera'] : ['album', 'camera'],
    success: async (res) => {
      try {
        const uploaded = await commonApi.upload(res.tempFilePaths[0]);
        const url = (uploaded as any)?.url || res.tempFilePaths[0];
        if (type === 'front') frontImage.value = url;
        else selfieImage.value = url;
      } catch {
        // Fallback to local path
        if (type === 'front') frontImage.value = res.tempFilePaths[0];
        else selfieImage.value = res.tempFilePaths[0];
      }
    },
  });
}

async function handleSubmit() {
  if (!canSubmit.value) return;
  submitting.value = true;

  try {
    // Step 1: Upload ID card info
    await verifyApi.uploadIdCard({
      idType: form.value.idType,
      idCardFront: frontImage.value,
      name: form.value.name,
      idNumber: form.value.idNumber,
    });

    // Step 2: Upload selfie for face matching
    await verifyApi.uploadFace({
      selfieImage: selfieImage.value,
    });

    // Refresh status
    const status = await verifyApi.getStatus();
    const s = status as any;
    verifyStatus.value = s?.verifyStatus || 'PENDING';
    verification.value = s?.verification || null;

    // Update user store
    await userStore.restoreSession();

    uni.showToast({ title: t('verify.submitted'), icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: err.message || t('common.error'), icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  form.value = { idType: 'id_card', name: '', idNumber: '' };
  frontImage.value = '';
  selfieImage.value = '';
  verifyStatus.value = 'UNVERIFIED';
}
</script>

<style lang="scss" scoped>
.status-card { padding: 48rpx 32rpx; }
.status-icon { font-size: 64rpx; }
.id-type-grid { display: flex; gap: 16rpx; }
.id-type-card {
  flex: 1;
  text-align: center;
  padding: 24rpx 12rpx;
  border: 3rpx solid #E8E8E8;
  border-radius: 16rpx;
}
.id-type-card.active { border-color: #4A90D9; background: rgba(74,144,217,0.05); }
.id-type-icon { font-size: 40rpx; display: block; margin-bottom: 8rpx; }
.upload-box {
  width: 100%;
  height: 320rpx;
  border: 3rpx dashed #D9D9D9;
  border-radius: 16rpx;
  overflow: hidden;
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.upload-icon { font-size: 56rpx; }
.upload-preview { width: 100%; height: 100%; }
</style>
