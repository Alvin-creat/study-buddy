<template>
  <div class="match-page">
    <!-- Header -->
    <header class="match-header">
      <div class="header-top">
        <div class="brand">
          <span class="brand-mark">SB</span>
          <h1 class="brand-name">StudyBuddy</h1>
        </div>
        <div class="header-meta">
          <button class="req-bell" @click="goRequests">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="pendingCount > 0" class="bell-badge">{{ pendingCount }}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      <!-- Search -->
      <div class="search-wrap">
        <div class="search-box">
          <svg class="search-lens" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="keyword"
            class="search-input"
            :placeholder="$t('home.searchPlaceholder')"
            @keyup.enter="onSearch"
          />
        </div>
      </div>
    </header>

    <!-- Exam Categories -->
    <div class="category-strip">
      <button
        v-for="tab in examTabs"
        :key="tab.value"
        :class="['cat-chip', { active: activeExamType === tab.value }]"
        @click="switchExamType(tab.value)"
      >
        <span class="cat-icon">{{ tab.icon }}</span>
        <span class="cat-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="filter-row">
      <select v-model="timezoneFilter" class="tz-select" @change="onFilterChange">
        <option value="">🌍 All Timezones</option>
        <option value="EST">EST (UTC-5)</option>
        <option value="CST">CST (UTC+8)</option>
        <option value="JST">JST (UTC+9)</option>
        <option value="GMT">GMT (UTC+0)</option>
        <option value="PST">PST (UTC-8)</option>
        <option value="IST">IST (UTC+5:30)</option>
      </select>
    </div>

    <!-- Card List -->
    <div class="card-feed" ref="feedRef" @scroll="onFeedScroll">
      <!-- Results count -->
      <div class="feed-status" v-if="users.length > 0">
        <span class="ornament">{{ users.length }} scholar{{ users.length > 1 ? 's' : '' }} nearby</span>
      </div>

      <div v-if="users.length > 0" class="card-stack">
        <article
          v-for="(user, i) in users"
          :key="user.id"
          class="scholar-card"
          :style="{ animationDelay: `${i * 40}ms` }"
        >
          <div class="card-main" @click="goDetail(user.id)">
            <!-- Avatar with decorative border -->
            <div class="card-avatar-wrap">
              <div class="card-avatar">
                <img :src="user.avatar || '/static/default-avatar.png'" alt="" />
              </div>
              <div class="avatar-ring"></div>
            </div>

            <!-- Info -->
            <div class="card-body">
              <div class="card-head">
                <h3 class="scholar-name">{{ user.nickname }}</h3>
                <span class="timezone-badge" v-if="user.timezone">{{ user.timezone }}</span>
              </div>
              <div class="card-details">
                <span class="detail-row" v-if="user.examName">
                  <span class="detail-dot exam"></span>
                  {{ user.examName }}
                </span>
                <span class="detail-row" v-if="user.targetSchool">
                  <span class="detail-dot school"></span>
                  {{ user.targetSchool }}
                </span>
                <span class="detail-row" v-if="user.studyTime">
                  <span class="detail-dot time"></span>
                  {{ formatStudyTime(user.studyTime) }}
                </span>
              </div>
              <!-- Languages -->
              <div class="lang-tags" v-if="user.languages && user.languages.length">
                <span v-for="l in user.languages.slice(0,3)" :key="l" class="lang-tag">{{ langLabel(l) }}</span>
              </div>
            </div>
          </div>

          <!-- Action -->
          <div class="card-action">
            <button
              v-if="greetedUsers.has(user.id)"
              class="connect-btn greeted"
              disabled
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <span>Greeted</span>
            </button>
            <button
              v-else
              class="connect-btn"
              :class="{ loading: greeting === user.id }"
              :disabled="greeting === user.id"
              @click.stop="onGreet(user)"
            >
              <svg v-if="greeting !== user.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span v-if="greeting === user.id">···</span>
              <span v-else>Connect</span>
            </button>
          </div>
        </article>
      </div>

      <!-- Empty states -->
      <div v-if="!loading && users.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c4a882" stroke-width="1">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <p class="empty-title">No scholars found</p>
        <p class="empty-desc">Try a different exam or broaden your search</p>
      </div>

      <div v-if="loadingMore" class="feed-loader">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
      </div>

      <div v-if="!hasMore && users.length > 4" class="ornament">✦ End of results ✦</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { matchApi } from '../../api';

const { t } = useI18n();
const userStore = useUserStore();
const { isLoggedIn } = userStore;

const keyword = ref('');
const activeExamType = ref('');
const timezoneFilter = ref('');
const users = ref<any[]>([]);
const page = ref(1);
const hasMore = ref(true);
const loading = ref(false);
const loadingMore = ref(false);
const greeting = ref('');
const greetedUsers = ref(new Set<string>());
const pendingCount = ref(0);

const examTabs = [
  { value: '', icon: '📚', label: t('common.all') || 'All' },
  { value: 'postgraduate', icon: '🎓', label: t('exam.postgraduate') },
  { value: 'certificate', icon: '📜', label: t('exam.certificate') },
  { value: 'language', icon: '🗣', label: t('exam.proficiency') },
  { value: 'other', icon: '📋', label: 'Other' },
];

onMounted(() => {
  fetchUsers();
  loadSentRequests();
});

async function fetchUsers(reset = false) {
  if (loading.value) return;
  if (reset) { page.value = 1; hasMore.value = true; }
  loading.value = true;

  try {
    const params: any = { page: reset ? 1 : page.value, limit: 20 };
    if (activeExamType.value) params.examType = activeExamType.value;
    if (keyword.value) params.keyword = keyword.value;
    if (timezoneFilter.value) params.timezone = timezoneFilter.value;

    const result: any = await matchApi.search(params);
    const data = result?.data || [];
    const pagination = result?.pagination;

    if (reset) { users.value = data; }
    else { users.value = [...users.value, ...data]; }

    if (pagination) { hasMore.value = pagination.page < pagination.totalPages; }
    else { hasMore.value = data.length >= 20; }
  } catch { /* silent */ }
  finally { loading.value = false; loadingMore.value = false; }
}

function switchExamType(type: string) { activeExamType.value = type; fetchUsers(true); }
function onSearch() { fetchUsers(true); }

// Infinite scroll
function onFeedScroll(e: any) {
  const { scrollTop, scrollHeight, clientHeight } = e.target;
  if (scrollHeight - scrollTop - clientHeight < 80 && hasMore.value && !loadingMore.value) {
    loadingMore.value = true;
    page.value++;
    fetchUsers(false);
  }
}

function formatStudyTime(t: string) {
  const map: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', flexible: 'Flexible' };
  return map[t] || t;
}

function langLabel(code: string) {
  const map: Record<string, string> = { 'zh-CN': '中文', 'en': 'EN', 'ja': '日本語', 'ko': '한국어', 'es': 'ES', 'fr': 'FR' };
  return map[code] || code;
}

async function onGreet(user: any) {
  if (greeting.value) return;
  if (!isLoggedIn.value) { uni.navigateTo({ url: '/pages/auth/auth' }); return; }

  uni.showModal({
    title: `Connect with ${user.nickname}?`,
    content: 'Send a greeting to start studying together.',
    success: async (res) => {
      if (!res.confirm) return;
      greeting.value = user.id;
      try {
        await matchApi.greet(user.id);
        uni.showToast({ title: t('match.requestSent'), icon: 'success' });
      } catch (err: any) {
        uni.showToast({ title: err.message || t('common.error'), icon: 'none' });
      } finally { greeting.value = ''; }
    },
  });
}

function onFilterChange() { fetchUsers(true); }

async function loadSentRequests() {
  try {
    const data: any = await matchApi.getRequests();
    const s = new Set<string>();
    (data?.sent || []).forEach((r: any) => s.add(r.targetId));
    greetedUsers.value = s;
    pendingCount.value = (data?.received || []).filter((r: any) => r.status === 'PENDING').length || 0;
  } catch { /* */ }
}

function goRequests() { uni.navigateTo({ url: '/pages/match/requests' }); }
function goDetail(id: string) { uni.navigateTo({ url: `/pages/match/detail?id=${id}` }); }
</script>

<style lang="scss" scoped>
@import '../../styles/global.scss';

.match-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg;
}

/* ── Header ──────────────────────────── */
.match-header {
  padding: 16px 20px 0;
  background: $ivory;
  border-bottom: 1px solid $border;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-mark {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $ink-deep;
  color: $gold-warm;
  font-family: 'Georgia', serif;
  font-weight: 700;
  font-size: 13px;
  border-radius: 8px;
  letter-spacing: -0.5px;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  color: $ink-deep;
  letter-spacing: -0.3px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.req-bell {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: none; background: none;
  color: $text-secondary; cursor: pointer; border-radius: 8px;
  transition: all 0.2s;

  &:hover { background: rgba($clay, 0.1); color: $ink-deep; }
}

.bell-badge {
  position: absolute; top: -2px; right: -4px;
  display: flex; align-items: center; justify-content: center;
  min-width: 16px; height: 16px;
  background: $ember; color: #fff;
  font-size: 9px; font-weight: 700;
  border-radius: 8px; padding: 0 4px;
  border: 2px solid $ivory;
}

/* ── Filter Row ──────────────────────── */
.filter-row {
  padding: 8px 20px;
  background: $ivory;
  border-bottom: 1px solid $border;
}

.tz-select {
  padding: 6px 12px;
  border: 1.5px solid $border;
  border-radius: 16px;
  font-size: 12px;
  color: $text-secondary;
  background: $bg-card;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238b7355' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;

  &:focus { border-color: $gold-warm; }
}

/* ── Search ──────────────────────────── */
.search-wrap {
  padding-bottom: 14px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: $bg;
  border: 1.5px solid $border;
  border-radius: $radius-lg;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: $gold-warm;
    box-shadow: 0 0 0 3px rgba($gold-warm, 0.08);
  }
}

.search-lens {
  color: $text-hint;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 14px;
  color: $text-primary;
  outline: none;

  &::placeholder { color: $text-hint; font-style: italic; }
}

/* ── Categories ──────────────────────── */
.category-strip {
  display: flex;
  gap: 6px;
  padding: 12px 20px;
  background: $ivory;
  overflow-x: auto;
  border-bottom: 1px solid $border;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { display: none; }
}

.cat-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 20px;
  border: 1.5px solid $border;
  background: $bg-card;
  font-size: 12px;
  color: $text-secondary;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover { border-color: $clay; }

  &.active {
    background: $ink-deep;
    border-color: $ink-deep;
    color: $ivory;

    .cat-icon { filter: none; opacity: 1; }
  }
}

.cat-icon { font-size: 13px; }
.cat-label { font-weight: 500; }

/* ── Card Feed ───────────────────────── */
.card-feed {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  -webkit-overflow-scrolling: touch;
}

.feed-status {
  margin-bottom: 16px;
  font-family: 'Georgia', serif;
  font-size: 13px;
  color: $text-hint;
  font-style: italic;
}

.ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 24px 0;
  color: $clay;
  font-size: 11px;
  font-style: italic;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, $clay, transparent);
  }
}

.card-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Scholar Card ────────────────────── */
.scholar-card {
  display: flex;
  align-items: stretch;
  background: $ivory;
  border-radius: $radius-lg;
  border: 1px solid rgba($clay, 0.15);
  box-shadow:
    0 1px 3px rgba($ink-deep, 0.04),
    0 4px 12px rgba($ink-deep, 0.04);
  overflow: hidden;
  animation: card-in 0.4s ease both;
  transition: box-shadow 0.25s, transform 0.2s;

  &:hover {
    box-shadow: 0 4px 20px rgba($ink-deep, 0.08);
  }

  &:active {
    transform: scale(0.995);
  }
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  cursor: pointer;
  min-width: 0;
}

/* Avatar */
.card-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  overflow: hidden;
  background: $dust;
  border: 2px solid $ivory;
  position: relative;
  z-index: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.avatar-ring {
  position: absolute;
  inset: -3px;
  border-radius: 17px;
  border: 1.5px solid rgba($gold-warm, 0.3);
  opacity: 0.6;
}

/* Body */
.card-body {
  flex: 1;
  min-width: 0;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.scholar-name {
  font-family: 'Georgia', serif;
  font-size: 16px;
  font-weight: 600;
  color: $ink-deep;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timezone-badge {
  font-size: 10px;
  font-weight: 500;
  color: $stone;
  background: rgba($clay, 0.2);
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.2px;
  flex-shrink: 0;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 6px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  &.exam { background: $gold-warm; }
  &.school { background: $ink-deep; }
  &.time { background: $clay; }
}

/* Language tags */
.lang-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.lang-tag {
  font-size: 10px;
  font-weight: 500;
  color: $slate;
  background: rgba($ink-deep, 0.05);
  padding: 1px 6px;
  border-radius: 3px;
  letter-spacing: 0.2px;
}

/* Action */
.card-action {
  display: flex;
  align-items: center;
  padding: 16px 16px 16px 0;
  flex-shrink: 0;
}

.connect-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  background: $ink-deep;
  color: $ivory;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  letter-spacing: 0.2px;
  transition: all 0.2s;

  &:hover {
    background: lighten($ink-deep, 10%);
    box-shadow: 0 4px 12px rgba($ink-deep, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  &.greeted {
    background: rgba($clay, 0.15);
    color: $stone;
    cursor: default;

    &:hover { background: rgba($clay, 0.15); box-shadow: none; }
  }
}

/* ── Empty State ──────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-title {
  font-family: 'Georgia', serif;
  font-size: 18px;
  font-weight: 600;
  color: $ink-deep;
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 13px;
  color: $text-hint;
  font-style: italic;
}

/* ── Loading ──────────────────────────── */
.feed-loader {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 20px;
}

.loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $clay;
  animation: dot-pulse 1.2s ease infinite;

  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes dot-pulse {
  0%, 60%, 100% { opacity: 0.2; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1); }
}
</style>
