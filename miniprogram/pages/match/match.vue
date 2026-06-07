<template>
  <view class="page">
    <!-- Search Bar -->
    <view class="search-bar safe-top">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-field"
          :placeholder="$t('home.searchPlaceholder')"
          @confirm="onSearch"
        />
      </view>
    </view>

    <!-- Exam Type Tabs -->
    <scroll-view scroll-x class="exam-tabs">
      <view
        v-for="tab in examTabs"
        :key="tab.value"
        :class="['exam-tab', { active: activeExamType === tab.value }]"
        @click="switchExamType(tab.value)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </scroll-view>

    <!-- Card Waterfall -->
    <scroll-view
      scroll-y
      class="card-list"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="users.length > 0" class="card-grid">
        <view
          v-for="user in users"
          :key="user.id"
          class="match-card"
        >
          <view class="card-avatar" @click="goDetail(user.id)">
            <image :src="user.avatar || '/static/default-avatar.png'" mode="aspectFill" />
          </view>
          <view class="card-info" @click="goDetail(user.id)">
            <text class="card-name">{{ user.nickname }}</text>
            <text class="card-exam" v-if="user.examName">📚 {{ user.examName }}</text>
            <text class="card-school" v-if="user.targetSchool">🏫 {{ user.targetSchool }}</text>
            <text class="card-tz" v-if="user.timezone">🌍 {{ user.timezone }}</text>
          </view>
          <view class="card-action">
            <button class="greet-btn" :disabled="greeting === user.id" @click="onGreet(user)">
              {{ greeting === user.id ? '...' : $t('match.greet') }}
            </button>
          </view>
        </view>
      </view>

      <Empty v-if="!loading && users.length === 0 && !isLoggedIn" :text="$t('home.welcomeTitle')" />

      <view v-if="loadingMore" class="loading-more">
        <text class="text-hint text-sm">{{ $t('common.loading') }}...</text>
      </view>

      <view v-if="!hasMore && users.length > 0" class="no-more">
        <text class="text-hint text-sm">— {{ $t('common.noData') }} —</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { matchApi } from '../../api';

const { t } = useI18n();
const userStore = useUserStore();
const { isLoggedIn } = userStore;

const keyword = ref('');
const activeExamType = ref('');
const users = ref<any[]>([]);
const page = ref(1);
const hasMore = ref(true);
const loading = ref(false);
const loadingMore = ref(false);
const refreshing = ref(false);
const greeting = ref('');

const examTabs = [
  { value: '', label: t('common.all') || 'All' },
  { value: 'postgraduate', label: '🎓 ' + t('exam.postgraduate') },
  { value: 'certificate', label: '📜 ' + t('exam.certificate') },
  { value: 'language', label: '🏆 ' + t('exam.proficiency') },
  { value: 'other', label: 'Other' },
];

onMounted(() => {
  fetchUsers();
});

async function fetchUsers(reset = false) {
  if (loading.value) return;
  if (reset) {
    page.value = 1;
    hasMore.value = true;
    refreshing.value = true;
  }
  loading.value = true;

  try {
    const params: any = { page: reset ? 1 : page.value, limit: 20 };
    if (activeExamType.value) params.examType = activeExamType.value;
    if (keyword.value) params.keyword = keyword.value;

    const result: any = await matchApi.search(params);
    const data = result?.data || [];
    const pagination = result?.pagination;

    if (reset) {
      users.value = data;
    } else {
      users.value = [...users.value, ...data];
    }

    if (pagination) {
      hasMore.value = pagination.page < pagination.totalPages;
    }
  } catch {
    // silent
  } finally {
    loading.value = false;
    loadingMore.value = false;
    refreshing.value = false;
  }
}

function switchExamType(type: string) {
  activeExamType.value = type;
  fetchUsers(true);
}

function onSearch() {
  fetchUsers(true);
}

function onRefresh() {
  fetchUsers(true);
}

function loadMore() {
  if (!hasMore.value || loadingMore.value) return;
  loadingMore.value = true;
  page.value++;
  fetchUsers(false);
}

async function onGreet(user: any) {
  if (greeting.value) return;
  if (!isLoggedIn.value) {
    uni.navigateTo({ url: '/pages/auth/auth' });
    return;
  }

  uni.showModal({
    title: `${t('match.sendRequest')}?`,
    content: `Send a greeting to ${user.nickname}?`,
    success: async (res) => {
      if (!res.confirm) return;
      greeting.value = user.id;
      try {
        await matchApi.greet(user.id);
        uni.showToast({ title: t('match.requestSent'), icon: 'success' });
      } catch (err: any) {
        uni.showToast({ title: err.message || t('common.error'), icon: 'none' });
      } finally {
        greeting.value = '';
      }
    },
  });
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/match/detail?id=${id}` });
}
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; height: 100vh; background: #F5F5F5; }
.search-bar { padding: 16rpx 24rpx; background: #fff; }
.search-input {
  display: flex; align-items: center;
  background: #F5F5F5; border-radius: 40rpx; padding: 16rpx 24rpx;
}
.search-icon { font-size: 28rpx; margin-right: 8rpx; }
.search-field { flex: 1; font-size: 28rpx; }
.exam-tabs {
  white-space: nowrap; padding: 16rpx 24rpx; background: #fff;
  border-bottom: 1rpx solid #F0F0F0;
}
.exam-tab {
  display: inline-block; padding: 12rpx 20rpx; margin-right: 12rpx;
  border-radius: 40rpx; font-size: 26rpx; color: #666; background: #F5F5F5;
}
.exam-tab.active { color: #fff; background: #4A90D9; }
.card-list { flex: 1; padding: 16rpx 24rpx; }
.card-grid { display: flex; flex-direction: column; gap: 16rpx; }
.match-card {
  display: flex; align-items: center; gap: 16rpx;
  background: #fff; border-radius: 16rpx; padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.card-avatar {
  width: 80rpx; height: 80rpx; border-radius: 50%; overflow: hidden; flex-shrink: 0;
}
.card-avatar image { width: 100%; height: 100%; }
.card-info { flex: 1; min-width: 0; }
.card-name { font-size: 30rpx; font-weight: 600; display: block; }
.card-exam, .card-school, .card-tz { font-size: 24rpx; color: #888; display: block; margin-top: 4rpx; }
.card-action { flex-shrink: 0; }
.greet-btn {
  padding: 12rpx 24rpx; background: #4A90D9; color: #fff;
  border-radius: 40rpx; font-size: 24rpx; border: none;
}
.greet-btn::after { border: none; }
.greet-btn[disabled] { background: #B0C4DE; }
.loading-more, .no-more { padding: 24rpx; text-align: center; }
</style>
