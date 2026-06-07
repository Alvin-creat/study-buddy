<template>
  <view class="page">
    <!-- Filter Bar -->
    <view class="filter-bar">
      <picker :range="myExamLabels" :value="selectedExamIndex" @change="onExamChange">
        <view class="filter-chip">
          <text>{{ selectedExamLabel || $t('match.selectExam') }}</text>
          <text class="text-hint">▾</text>
        </view>
      </picker>
      <picker :range="countryOptions" :value="countryIndex" @change="onCountryChange">
        <view class="filter-chip">
          <text>{{ countryOptions[countryIndex] || $t('match.country') }}</text>
          <text class="text-hint">▾</text>
        </view>
      </picker>
      <picker :range="timeOptions" :value="timeIndex" @change="onTimeChange">
        <view class="filter-chip">
          <text>{{ timeOptions[timeIndex] || $t('match.time') }}</text>
          <text class="text-hint">▾</text>
        </view>
      </picker>
    </view>

    <!-- Tab: Recommend / Search -->
    <view class="mode-tabs">
      <view :class="['mode-tab', { active: mode === 'recommend' }]" @click="mode = 'recommend'">
        {{ $t('match.recommend') }}
      </view>
      <view :class="['mode-tab', { active: mode === 'search' }]" @click="mode = 'search'">
        {{ $t('match.search') }}
      </view>
    </view>

    <!-- Not Verified -->
    <view class="verify-required" v-if="!isVerified">
      <Empty :text="$t('match.verifyRequired')" />
      <button class="btn btn-primary mt-24" @click="goVerify">{{ $t('verify.goVerify') }}</button>
    </view>

    <!-- Results -->
    <scroll-view v-else scroll-y class="results" @scrolltolower="loadMore">
      <view v-for="item in results" :key="item.userId" class="match-card card" @click="goDetail(item.userId)">
        <view class="flex-between">
          <view class="flex gap-16">
            <image :src="item.avatar || '/static/default-avatar.png'" class="avatar" mode="aspectFill" />
            <view>
              <text class="text-bold">{{ item.nickname }}</text>
              <text class="text-sm text-secondary mt-4">{{ item.country || '' }} · {{ item.timezone || '' }}</text>
              <view class="flex gap-8 mt-8">
                <text class="tag" v-if="item.exam">{{ item.exam.name }}</text>
                <text class="tag tag-success" v-if="item.userExam?.targetOrg">{{ item.userExam.targetOrg }}</text>
                <text class="tag tag-warning" v-if="item.userExam?.dailyHours">{{ item.userExam.dailyHours }}h/d</text>
              </view>
              <view class="flex gap-8 mt-4" v-if="item.languages">
                <text class="text-xs text-hint" v-for="l in item.languages.slice(0,3)" :key="l">{{ l }}</text>
              </view>
            </view>
          </view>
          <view class="text-right" v-if="item.matchScore">
            <text class="text-primary text-xl text-bold">{{ Math.round(item.matchScore * 100) }}%</text>
            <text class="text-hint text-sm">{{ $t('match.matchScore') }}</text>
          </view>
        </view>
        <view class="flex mt-16 gap-8" v-if="!item.matchScore">
          <button class="btn btn-primary btn-sm flex-1" @click.stop="sendRequest(item.userId, item.exam?.id)">
            {{ $t('match.sendRequest') }}
          </button>
        </view>
      </view>


      <view class="text-center py-16 text-hint" v-if="loading && results.length > 0">
        {{ $t('common.loading') }}...
      </view>
      <Empty v-if="!loading && results.length === 0 && isVerified" :text="$t('match.noResults')" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { userApi, matchApi } from '../../api';

const { t } = useI18n();
const userStore = useUserStore();
const { isVerified } = userStore;

const mode = ref<'recommend' | 'search'>('recommend');
const results = ref<any[]>([]);
const loading = ref(false);
const myExams = ref<any[]>([]);
const selectedExamIndex = ref(-1);

const countryOptions = ['All', 'China', 'Japan', 'South Korea', 'United States', 'United Kingdom', 'India', 'Singapore'];
const countryIndex = ref(0);
const timeOptions = ['All', 'Morning', 'Afternoon', 'Evening', 'Night'];
const timeIndex = ref(0);

const myExamLabels = computed(() => myExams.value.map((e: any) => e.exam?.name || ''));
const selectedExamLabel = computed(() => myExamLabels.value[selectedExamIndex.value] || '');

onMounted(async () => {
  try {
    const exams = await userApi.getMyExams();
    myExams.value = exams as any[];
    if (myExams.value.length > 0) {
      selectedExamIndex.value = 0;
      loadResults();
    }
  } catch { /* */ }
});

function loadResults() {
  if (selectedExamIndex.value < 0) return;
  loading.value = true;
  const examId = myExams.value[selectedExamIndex.value]?.examId;

  const fetcher = mode.value === 'recommend'
    ? matchApi.recommend(examId)
    : matchApi.search({ examId });

  fetcher.then((data: any) => {
    results.value = data?.data || [];
  }).finally(() => { loading.value = false; });
}

function loadMore() { /* Pagination TODO */ }

function onExamChange(e: any) {
  selectedExamIndex.value = e.detail.value;
  loadResults();
}
function onCountryChange(e: any) { countryIndex.value = e.detail.value; loadResults(); }
function onTimeChange(e: any) { timeIndex.value = e.detail.value; loadResults(); }

async function sendRequest(targetId: string, examId: string) {
  try {
    await matchApi.sendRequest({
      targetId,
      examId,
      message: '',
    });
    uni.showToast({ title: t('match.requestSent'), icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: err.message, icon: 'none' });
  }
}

function goDetail(id: string) { uni.navigateTo({ url: `/pages/match/detail?id=${id}` }); }
function goVerify() { uni.navigateTo({ url: '/pages/verify/verify' }); }
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; height: 100vh; }
.filter-bar { display: flex; gap: 12rpx; padding: 16rpx 24rpx; background: #fff; }
.filter-chip { display: flex; align-items: center; gap: 6rpx; padding: 10rpx 20rpx; background: #F5F5F5; border-radius: 20rpx; font-size: 24rpx; color: #666; }
.mode-tabs { display: flex; padding: 16rpx 32rpx; background: #fff; }
.mode-tab { padding: 12rpx 24rpx; font-size: 28rpx; color: #999; border-radius: 20rpx; }
.mode-tab.active { background: #4A90D9; color: #fff; }
.results { flex: 1; padding: 16rpx 32rpx; }
.match-card { margin: 0 0 16rpx 0; }
.verify-required { display: flex; flex-direction: column; align-items: center; padding: 80rpx 64rpx; }
.text-xs { font-size: 20rpx; }
</style>
