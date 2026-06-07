<template>
  <div class="requests-page">
    <header class="req-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <h1 class="req-title">Requests</h1>
    </header>

    <!-- Tabs -->
    <div class="req-tabs">
      <button :class="['tab', { active: activeTab === 'received' }]" @click="activeTab = 'received'">
        Received <span v-if="received.length" class="tab-count">{{ received.length }}</span>
      </button>
      <button :class="['tab', { active: activeTab === 'sent' }]" @click="activeTab = 'sent'">
        Sent <span v-if="sent.length" class="tab-count dim">{{ sent.length }}</span>
      </button>
    </div>

    <!-- Received -->
    <div class="req-list" v-if="activeTab === 'received'">
      <div v-if="received.length > 0">
        <div v-for="req in received" :key="req.id" class="req-card">
          <div class="req-avatar">
            <img :src="req.requester?.avatar || '/static/default-avatar.png'" alt="" />
          </div>
          <div class="req-body">
            <span class="req-name">{{ req.requester?.nickname }}</span>
            <span class="req-timezone" v-if="req.requester?.timezone">{{ req.requester.timezone }}</span>
            <p class="req-message" v-if="req.message">{{ req.message }}</p>
            <p class="req-date">{{ formatDate(req.createdAt) }}</p>
          </div>
          <div class="req-actions">
            <button class="accept-btn" :disabled="acting === req.id" @click="handleAccept(req.id)">
              <span v-if="acting === req.id">...</span>
              <span v-else>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
            </button>
            <button class="reject-btn" :disabled="acting === req.id" @click="handleReject(req.id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p class="empty-text">No pending requests</p>
      </div>
    </div>

    <!-- Sent -->
    <div class="req-list" v-if="activeTab === 'sent'">
      <div v-if="sent.length > 0">
        <div v-for="req in sent" :key="req.id" class="req-card">
          <div class="req-avatar">
            <img :src="req.target?.avatar || '/static/default-avatar.png'" alt="" />
          </div>
          <div class="req-body">
            <span class="req-name">{{ req.target?.nickname }}</span>
            <span class="req-timezone" v-if="req.target?.timezone">{{ req.target.timezone }}</span>
            <p class="req-message" v-if="req.message">{{ req.message }}</p>
            <span class="status-badge" :class="req.status">{{ req.status }}</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p class="empty-text">No sent requests</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { matchApi } from '../../api';

const activeTab = ref<'received' | 'sent'>('received');
const received = ref<any[]>([]);
const sent = ref<any[]>([]);
const acting = ref('');

onMounted(loadRequests);

async function loadRequests() {
  try {
    const data: any = await matchApi.getRequests();
    received.value = data?.received || [];
    sent.value = data?.sent || [];
  } catch { /* */ }
}

async function handleAccept(id: string) {
  acting.value = id;
  try {
    await matchApi.respondRequest(id, 'accepted');
    received.value = received.value.filter(r => r.id !== id);
    uni.showToast({ title: 'Accepted! Start chatting.', icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: err.message || 'Error', icon: 'none' });
  } finally { acting.value = ''; }
}

async function handleReject(id: string) {
  acting.value = id;
  try {
    await matchApi.respondRequest(id, 'rejected');
    received.value = received.value.filter(r => r.id !== id);
    uni.showToast({ title: 'Rejected', icon: 'none' });
  } catch (err: any) {
    uni.showToast({ title: err.message || 'Error', icon: 'none' });
  } finally { acting.value = ''; }
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function goBack() { uni.navigateBack(); }
</script>

<style lang="scss" scoped>
@import '../../styles/global.scss';

.requests-page {
  min-height: 100vh;
  background: $bg;
  @include paper-texture;
}

.req-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: $ivory;
  border-bottom: 1px solid $border;
}

.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border: none; background: none;
  color: $text-secondary; cursor: pointer; border-radius: 50%;
}

.req-title {
  font-family: 'Georgia', serif;
  font-size: 20px; font-weight: 700; color: $ink-deep;
}

/* Tabs */
.req-tabs {
  display: flex;
  background: $ivory;
  border-bottom: 1px solid $border;
}

.tab {
  flex: 1;
  padding: 14px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: $text-hint;
  cursor: pointer;
  position: relative;
  letter-spacing: 0.3px;

  &.active {
    color: $ink-deep;
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 30%; right: 30%;
      height: 2px;
      background: $gold-warm;
      border-radius: 1px;
    }
  }
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px; height: 18px;
  background: $ember; color: #fff;
  font-size: 10px; font-weight: 600;
  border-radius: 9px;
  margin-left: 6px;
  padding: 0 5px;

  &.dim { background: rgba($clay, 0.3); color: $text-hint; }
}

/* Cards */
.req-list {
  padding: 12px 20px;
}

.req-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: $ivory;
  border-radius: $radius-lg;
  margin-bottom: 10px;
  border: 1px solid rgba($clay, 0.12);
}

.req-avatar {
  width: 44px; height: 44px;
  border-radius: 12px; overflow: hidden;
  background: $dust; flex-shrink: 0;
  img { width: 100%; height: 100%; object-fit: cover; }
}

.req-body { flex: 1; min-width: 0; }

.req-name {
  font-family: 'Georgia', serif;
  font-size: 15px; font-weight: 600; color: $ink-deep;
}

.req-timezone {
  font-size: 11px; color: $text-hint; margin-left: 8px;
}

.req-message {
  font-size: 13px; color: $text-secondary;
  margin-top: 4px; font-style: italic;
}

.req-date {
  font-size: 11px; color: $text-hint; margin-top: 4px;
}

.req-actions {
  display: flex; gap: 8px; flex-shrink: 0; align-items: center;
}

.accept-btn, .reject-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; border: none; cursor: pointer;
  transition: all 0.2s;
}

.accept-btn {
  background: $ink-deep; color: $gold-warm;
  &:hover { background: lighten($ink-deep, 10%); }
}

.reject-btn {
  background: transparent; color: $text-hint;
  border: 1px solid $border;
  &:hover { border-color: $ember; color: $ember; }
}

.status-badge {
  display: inline-block;
  font-size: 10px; font-weight: 600;
  padding: 2px 8px; border-radius: 4px;
  letter-spacing: 0.3px;
  margin-top: 6px;
  text-transform: uppercase;

  &.PENDING { background: rgba($gold-warm, 0.15); color: darken($gold-warm, 10%); }
  &.ACCEPTED { background: rgba(#52C41A, 0.12); color: #389e0d; }
  &.REJECTED { background: rgba($ember, 0.08); color: $ember; }
}

.empty-state {
  display: flex; align-items: center; justify-content: center;
  padding: 60px 20px;
}

.empty-text {
  font-family: 'Georgia', serif;
  font-size: 14px; color: $text-hint; font-style: italic;
}
</style>
