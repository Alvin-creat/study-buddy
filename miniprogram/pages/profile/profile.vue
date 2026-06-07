<template>
  <view class="page">
    <!-- Header Background -->
    <view class="profile-bg"></view>

    <!-- Profile Info -->
    <view class="profile-info safe-top">
      <view class="avatar avatar-xl" @click="changeAvatar">
        <image :src="user?.avatar || '/static/default-avatar.png'" mode="aspectFill" />
      </view>
      <text class="profile-name text-xl text-bold mt-16">{{ user?.nickname || '--' }}</text>
      <view class="flex gap-8 mt-8">
        <text class="text-secondary">{{ user?.country || '' }}</text>
        <text class="tag" :class="verifyClass">{{ verifyLabel }}</text>
      </view>
      <text class="text-sm text-secondary mt-8" v-if="user?.bio">{{ user.bio }}</text>
    </view>

    <!-- Stats Row -->
    <view class="stats-row card">
      <view class="stat-item" @click="goCheckin">
        <text class="stat-value text-lg text-bold">{{ streakDays }}</text>
        <text class="stat-label text-sm text-secondary">{{ $t('profile.streak') }}</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value text-lg text-bold">{{ user?.userExams?.length || 0 }}</text>
        <text class="stat-label text-sm text-secondary">{{ $t('profile.exams') }}</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item" @click="goReviews">
        <text class="stat-value text-lg text-bold">{{ avgRating }}</text>
        <text class="stat-label text-sm text-secondary">{{ $t('profile.rating') }}</text>
      </view>
    </view>

    <!-- My Exams -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">{{ $t('profile.myExams') }}</text>
        <text class="text-primary text-sm" @click="goAddExam">+ {{ $t('common.add') }}</text>
      </view>
      <view v-if="user?.userExams?.length > 0" class="exam-list">
        <view
          v-for="ue in user.userExams"
          :key="ue.id"
          class="exam-item card"
        >
          <view class="flex-between">
            <view>
              <text class="text-bold">{{ ue.exam?.name }}</text>
              <view class="flex gap-8 mt-8" v-if="ue.targetOrg || ue.major">
                <text class="tag" v-if="ue.targetOrg">{{ ue.targetOrg }}</text>
                <text class="tag" v-if="ue.major">{{ ue.major }}</text>
              </view>
            </view>
            <view class="text-right">
              <text class="text-sm text-hint" v-if="ue.targetScore">{{ $t('profile.targetScore') }}: {{ ue.targetScore }}</text>
              <text class="text-sm text-hint mt-4" v-if="ue.dailyHours">{{ ue.dailyHours }}h/{{ $t('common.day') }}</text>
            </view>
          </view>
        </view>
      </view>
      <Empty v-else :text="$t('profile.noExams')" />
    </view>

    <!-- Menu List -->
    <view class="menu-list card">
      <view class="menu-item" @click="goVerify">
        <text>{{ $t('verify.title') }}</text>
        <text class="text-hint">{{ verifyMenuLabel }} →</text>
      </view>
      <view class="divider"></view>
      <view class="menu-item" @click="goMyBuddies">
        <text>{{ $t('profile.myBuddies') }}</text>
        <text class="text-hint">→</text>
      </view>
      <view class="divider"></view>
      <view class="menu-item" @click="goRequests">
        <text>{{ $t('profile.requests') }}</text>
        <view class="flex gap-8">
          <text class="badge" v-if="pendingCount > 0">{{ pendingCount }}</text>
          <text class="text-hint">→</text>
        </view>
      </view>
      <view class="divider"></view>
      <view class="menu-item" @click="goSettings">
        <text>{{ $t('settings.title') }}</text>
        <text class="text-hint">→</text>
      </view>
    </view>

    <!-- Logout -->
    <view class="logout-section">
      <button class="btn btn-ghost btn-block" @click="handleLogout">
        {{ $t('auth.logout') }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { checkinApi, matchApi, reviewApi } from '../../api';

const { t } = useI18n();
const userStore = useUserStore();
const { user, isVerified } = userStore;

const streakDays = ref(0);
const avgRating = ref('--');
const pendingCount = ref(0);

const verifyClass = computed(() => {
  if (!user.value) return 'tag-danger';
  if (user.value.verifyStatus === 'VERIFIED') return 'tag-success';
  if (user.value.verifyStatus === 'PENDING') return 'tag-warning';
  return 'tag-danger';
});

const verifyLabel = computed(() => {
  if (!user.value) return '';
  if (user.value.verifyStatus === 'VERIFIED') return t('verify.verified');
  if (user.value.verifyStatus === 'PENDING') return t('verify.pending');
  return t('verify.unverified');
});

const verifyMenuLabel = computed(() => {
  if (user.value?.verifyStatus === 'VERIFIED') return t('verify.viewDetail');
  return t('verify.goVerify');
});

onMounted(async () => {
  try {
    const [streak, requests, reviews] = await Promise.all([
      checkinApi.getStreak(),
      matchApi.receivedRequests(),
      reviewApi.getUserReviews(userStore.userId!),
    ]);
    streakDays.value = (streak as any)?.streak || 0;

    const reqs = requests as any[];
    pendingCount.value = reqs?.filter((r: any) => r.status === 'PENDING').length || 0;

    const revs = reviews as any[];
    if (revs && revs.length > 0) {
      const avg = revs.reduce((s: number, r: any) => s + (r.attitude + r.attendance + r.commSkill) / 3, 0) / revs.length;
      avgRating.value = avg.toFixed(1);
    }
  } catch { /* ignore */ }
});

function changeAvatar() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      // Upload and update avatar
      uni.showToast({ title: 'TODO: upload', icon: 'none' });
    },
  });
}

function handleLogout() {
  uni.showModal({
    title: t('auth.logoutConfirm'),
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        uni.reLaunch({ url: '/pages/index/index' });
      }
    },
  });
}

function goVerify() { uni.navigateTo({ url: '/pages/verify/verify' }); }
function goAddExam() { uni.navigateTo({ url: '/pages/exam/exam' }); }
function goSettings() { uni.navigateTo({ url: '/pages/settings/settings' }); }
function goCheckin() { /* TODO */ }
function goReviews() { /* TODO */ }
function goMyBuddies() { /* TODO */ }
function goRequests() { /* TODO */ }
</script>

<style lang="scss" scoped>
.profile-bg {
  height: 280rpx;
  background: linear-gradient(135deg, #4A90D9, #357ABD);
}
.profile-info {
  text-align: center;
  margin-top: -80rpx;
  padding: 0 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.profile-name { color: #1A1A1A; }
.stats-row { display: flex; align-items: center; justify-content: space-around; padding: 32rpx; }
.stat-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
.stat-divider { width: 2rpx; height: 60rpx; background: #E8E8E8; }
.section { padding: 24rpx 32rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-title { font-size: 30rpx; font-weight: 600; }
.exam-item { margin: 0; margin-bottom: 12rpx; }
.menu-list { margin: 16rpx 32rpx; }
.menu-item { display: flex; justify-content: space-between; align-items: center; padding: 28rpx 0; font-size: 30rpx; }
.logout-section { padding: 48rpx 32rpx; }
</style>
