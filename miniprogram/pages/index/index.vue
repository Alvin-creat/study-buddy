<template>
  <view class="page">
    <!-- Header -->
    <view class="header safe-top">
      <view class="logo">
        <text class="logo-icon">📚</text>
        <text class="logo-text">StudyBuddy</text>
      </view>
      <view class="header-actions">
        <LanguageSwitcher />
        <view class="avatar-sm" @click="goProfile">
          <image :src="user?.avatar || '/static/default-avatar.png'" mode="aspectFill" />
        </view>
      </view>
    </view>

    <!-- Search Bar -->
    <view class="search-bar card" @click="goSearch">
      <text class="search-icon">🔍</text>
      <text class="search-placeholder">{{ $t('home.searchPlaceholder') }}</text>
    </view>

    <!-- Quick Exam Categories -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">{{ $t('home.quickStart') }}</text>
      </view>
      <view class="category-grid">
        <view
          v-for="cat in categories"
          :key="cat.value"
          class="category-card"
          @click="goExamList(cat.value)"
        >
          <text class="category-icon">{{ cat.icon }}</text>
          <text class="category-name">{{ cat.label }}</text>
          <text class="category-desc">{{ cat.desc }}</text>
        </view>
      </view>
    </view>

    <!-- Recommended Buddies -->
    <view class="section" v-if="isVerified && primaryExams.length > 0">
      <view class="section-header">
        <text class="section-title">{{ $t('home.recommendedBuddies') }}</text>
        <text class="section-more" @click="goMatch">{{ $t('common.seeAll') }} →</text>
      </view>
      <scroll-view scroll-x class="buddy-scroll">
        <view
          v-for="buddy in recommendations"
          :key="buddy.userId"
          class="buddy-card card"
          @click="goBuddyDetail(buddy.userId)"
        >
          <image :src="buddy.avatar || '/static/default-avatar.png'" class="avatar avatar-lg" mode="aspectFill" />
          <text class="buddy-name text-bold mt-16">{{ buddy.nickname }}</text>
          <view class="flex gap-8 mt-8">
            <text class="tag">{{ buddy.exam?.name }}</text>
          </view>
          <text class="text-sm text-secondary mt-8">{{ buddy.country || '' }}</text>
          <view class="match-score mt-8">
            <text class="text-primary text-bold text-lg">{{ Math.round(buddy.matchScore * 100) }}%</text>
            <text class="text-hint text-sm">{{ $t('match.matchScore') }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Not Verified Banner -->
    <view class="verify-banner card" v-if="!isVerified && isLoggedIn" @click="goVerify">
      <text class="verify-banner-icon">🛡️</text>
      <view class="flex-1">
        <text class="text-bold">{{ $t('verify.bannerTitle') }}</text>
        <text class="text-secondary text-sm mt-8">{{ $t('verify.bannerDesc') }}</text>
      </view>
      <text class="text-primary">→</text>
    </view>

    <!-- Login Prompt -->
    <view class="login-prompt" v-if="!isLoggedIn">
      <view class="card text-center">
        <text class="prompt-icon">👋</text>
        <text class="text-lg text-bold mt-24">{{ $t('home.welcomeTitle') }}</text>
        <text class="text-secondary mt-16">{{ $t('home.welcomeDesc') }}</text>
        <button class="btn btn-primary btn-block mt-32" @click="goLogin">
          {{ $t('auth.getStarted') }}
        </button>
      </view>
    </view>

    <!-- Hot Exams -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">{{ $t('home.hotExams') }}</text>
      </view>
      <view class="hot-exams">
        <view
          v-for="exam in hotExams"
          :key="exam.id"
          class="exam-chip"
          @click="goExamMatch(exam.id)"
        >
          <text>{{ exam.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { examApi, matchApi } from '../../api';

const { t } = useI18n();
const userStore = useUserStore();

const { isLoggedIn, isVerified, user } = userStore;

const hotExams = ref<any[]>([]);
const recommendations = ref<any[]>([]);
const primaryExams = computed(() => user.value?.userExams?.filter((e: any) => e.isPrimary) || []);

const categories = computed(() => [
  { value: 'POSTGRADUATE', icon: '🎓', label: t('exam.postgraduate'), desc: t('exam.postgraduateDesc') },
  { value: 'CERTIFICATE', icon: '📜', label: t('exam.certificate'), desc: t('exam.certificateDesc') },
  { value: 'PROFICIENCY', icon: '🏆', label: t('exam.proficiency'), desc: t('exam.proficiencyDesc') },
]);

onMounted(async () => {
  // Redirect to match tab for MVP
  uni.switchTab({ url: '/pages/match/match' });
  return;
  try {
    const [hExams] = await Promise.all([
      examApi.getHotExams(),
    ]);
    hotExams.value = hExams as any[];

    // Load recommendations if verified
    if (isVerified.value && primaryExams.value.length > 0) {
      const rec = await matchApi.recommend(primaryExams.value[0].examId, 1);
      recommendations.value = (rec as any)?.data || [];
    }
  } catch { /* ignore */ }
});

function goLogin() { uni.navigateTo({ url: '/pages/auth/auth' }); }
function goProfile() { uni.switchTab({ url: '/pages/profile/profile' }); }
function goVerify() { uni.navigateTo({ url: '/pages/verify/verify' }); }
function goSearch() { uni.switchTab({ url: '/pages/match/match' }); }
function goMatch() { uni.switchTab({ url: '/pages/match/match' }); }
function goBuddyDetail(id: string) { uni.navigateTo({ url: `/pages/match/detail?id=${id}` }); }
function goExamList(cat: string) { uni.navigateTo({ url: `/pages/exam/exam?category=${cat}` }); }
function goExamMatch(examId: string) { uni.navigateTo({ url: `/pages/match/match?examId=${examId}` }); }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #fff;
}
.logo { display: flex; align-items: center; gap: 12rpx; }
.logo-icon { font-size: 40rpx; }
.logo-text { font-size: 36rpx; font-weight: 700; color: #1A1A1A; }
.header-actions { display: flex; align-items: center; gap: 16rpx; }
.search-bar { display: flex; align-items: center; gap: 12rpx; padding: 20rpx 24rpx; }
.search-icon { font-size: 32rpx; }
.search-placeholder { color: #999; }
.section { padding: 24rpx 0; }
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 0 32rpx; margin-bottom: 16rpx; }
.section-title { font-size: 32rpx; font-weight: 600; }
.section-more { font-size: 26rpx; color: #4A90D9; }
.category-grid { display: flex; gap: 16rpx; padding: 0 32rpx; }
.category-card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx 20rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.category-icon { font-size: 48rpx; display: block; }
.category-name { font-size: 26rpx; font-weight: 600; margin-top: 12rpx; display: block; }
.category-desc { font-size: 20rpx; color: #999; margin-top: 4rpx; display: block; }
.buddy-scroll { white-space: nowrap; padding: 0 32rpx; }
.buddy-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 200rpx;
  margin-right: 16rpx;
  text-align: center;
}
.buddy-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.match-score { display: flex; flex-direction: column; align-items: center; }
.verify-banner {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: linear-gradient(135deg, #E8F4FD, #F0F7FF);
  border: 2rpx solid rgba(74,144,217,0.2);
}
.verify-banner-icon { font-size: 48rpx; }
.login-prompt { padding: 64rpx 32rpx; }
.prompt-icon { font-size: 96rpx; display: block; }
.hot-exams { display: flex; flex-wrap: wrap; gap: 16rpx; padding: 0 32rpx; }
.exam-chip {
  padding: 12rpx 24rpx;
  background: #fff;
  border-radius: 40rpx;
  font-size: 26rpx;
  border: 2rpx solid #E8E8E8;
}
</style>
