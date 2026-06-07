<template>
  <div class="chat-page">
    <!-- Header -->
    <header class="chat-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <div class="partner-avatar">
        <img :src="partner?.avatar || '/static/default-avatar.png'" alt="" />
      </div>
      <div class="partner-info">
        <span class="partner-name">{{ partner?.nickname || '' }}</span>
        <span class="partner-status">online</span>
      </div>
    </header>

    <!-- Messages -->
    <div class="msg-area" ref="msgArea">
      <div v-if="hasMore" class="load-earlier" @click="loadEarlier">
        <span>{{ $t('chat.loadingEarlier') }}</span>
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['msg-row', msg.senderId === userId ? 'msg-mine' : 'msg-other']"
      >
        <div
          :class="['msg-bubble', msg.senderId === userId ? 'bubble-mine' : 'bubble-other']"
        >
          <p class="msg-text">{{ msg.content }}</p>
          <button
            v-if="msg.senderId !== userId && !msg.contentTranslated"
            class="translate-trigger"
            :class="{ translating: translating === msg.id }"
            @click="translateMsg(msg)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 8h14M3 12h18M7 16h10"/>
            </svg>
            <span>{{ translating === msg.id ? '...' : $t('chat.translate') }}</span>
          </button>
          <p class="msg-translated" v-if="msg.contentTranslated">
            <span class="tr-icon">↳</span> {{ msg.contentTranslated }}
          </p>
          <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="input-bar">
      <div class="input-row">
        <input
          v-model="inputText"
          class="msg-input"
          :placeholder="$t('chat.typeMessage')"
          @keyup.enter="sendMessage"
        />
        <button class="send-btn" @click="sendMessage">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { chatApi, buddyApi } from '../../api';
import { useSocket } from '../../utils/socket';
import dayjs from 'dayjs';

const { t } = useI18n();
const userStore = useUserStore();
const { userId, user } = userStore;
const socket = useSocket();

const buddyshipId = ref('');
const partner = ref<any>(null);
const messages = ref<any[]>([]);
const inputText = ref('');
const hasMore = ref(true);
const loading = ref(false);
const translating = ref('');

onMounted(() => {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1];
  buddyshipId.value = (page as any).options?.id || '';

  loadBuddyDetail();
  loadMessages();
  setupSocket();
});

onUnmounted(() => {
  const s = socket.getSocket();
  if (s) s.emit('chat:leave', { buddyshipId: buddyshipId.value });
});

async function loadBuddyDetail() {
  try {
    const detail: any = await buddyApi.getDetail(buddyshipId.value);
    partner.value = detail.userAId === userId.value ? detail.userB : detail.userA;
  } catch { /* */ }
}

async function loadMessages(before?: string) {
  try {
    loading.value = true;
    const msgs: any = await chatApi.getMessages(buddyshipId.value, before);
    if (!msgs || msgs.length === 0) { hasMore.value = false; return; }
    if (before) { messages.value = [...(msgs || []), ...messages.value]; }
    else { messages.value = msgs || []; }
  } finally { loading.value = false; }
}

function loadEarlier() {
  if (!hasMore.value || loading.value) return;
  const earliest = messages.value[0];
  if (earliest) loadMessages(earliest.createdAt);
}

function setupSocket() {
  const s = socket.getSocket();
  if (!s) return;
  s.emit('chat:join', { buddyshipId: buddyshipId.value });
  s.on('chat:message', (msg: any) => {
    if (msg.buddyshipId === buddyshipId.value) { messages.value.push(msg); }
  });
}

function sendMessage() {
  const text = inputText.value.trim();
  if (!text) return;
  const s = socket.getSocket();
  if (s?.connected) {
    s.emit('chat:message', { buddyshipId: buddyshipId.value, type: 'TEXT', content: text });
  }
  inputText.value = '';
}

async function translateMsg(msg: any) {
  if (translating.value) return;
  translating.value = msg.id;
  try {
    const result: any = await chatApi.translate(buddyshipId.value, msg.id);
    msg.contentTranslated = result?.translated || result;
  } catch { /* */ }
  finally { translating.value = ''; }
}

function formatTime(dateStr: string) {
  const d = dayjs(dateStr);
  const today = dayjs().startOf('day');
  if (d.isAfter(today)) return d.format('HH:mm');
  return d.format('MM-DD HH:mm');
}

function goBack() { uni.navigateBack(); }

// Get current pages for uni-app polyfill
function getCurrentPages() {
  return [{ options: (window as any).__pageOptions || {} }];
}
</script>

<style lang="scss" scoped>
@import '../../styles/global.scss';

.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg;
  @include paper-texture;
}

/* ── Header ──────────────────────────── */
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: $ivory;
  border-bottom: 1px solid $border;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: $text-secondary;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover { background: rgba($clay, 0.1); color: $ink-deep; }
}

.partner-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  background: $dust;
  border: 2px solid $ivory;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.partner-info {
  display: flex;
  flex-direction: column;
}

.partner-name {
  font-family: 'Georgia', serif;
  font-size: 15px;
  font-weight: 600;
  color: $ink-deep;
}

.partner-status {
  font-size: 10px;
  color: $text-hint;
  font-style: italic;
}

/* ── Messages ────────────────────────── */
.msg-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-earlier {
  text-align: center;
  padding: 8px;
  font-size: 11px;
  color: $text-hint;
  cursor: pointer;
  font-style: italic;
}

.msg-row {
  display: flex;
  max-width: 80%;
}

.msg-mine {
  align-self: flex-end;
}

.msg-other {
  align-self: flex-start;
}

.msg-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
}

.bubble-mine {
  background: $ink-deep;
  color: $ivory;
  border-bottom-right-radius: 4px;
}

.bubble-other {
  background: $ivory;
  color: $text-primary;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba($clay, 0.15);
}

.msg-text {
  margin: 0;
  word-break: break-word;
}

.translate-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 2px 8px;
  background: rgba($gold-warm, 0.12);
  color: $gold-warm;
  border: none;
  border-radius: 6px;
  font-size: 10px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: rgba($gold-warm, 0.2); }
}

.msg-translated {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba($clay, 0.2);
  font-size: 13px;
  font-style: italic;
  opacity: 0.85;
  color: inherit;
}

.tr-icon {
  font-style: normal;
  opacity: 0.5;
}

.msg-time {
  display: block;
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.5;
  text-align: right;
}

/* ── Input ────────────────────────────── */
.input-bar {
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  background: $ivory;
  border-top: 1px solid $border;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.msg-input {
  flex: 1;
  height: 40px;
  padding: 0 16px;
  background: $bg;
  border: 1.5px solid $border;
  border-radius: 20px;
  font-size: 14px;
  color: $text-primary;
  outline: none;
  transition: border-color 0.2s;

  &:focus { border-color: $gold-warm; }
  &::placeholder { color: $text-hint; font-style: italic; }
}

.send-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $ink-deep;
  color: $gold-warm;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: lighten($ink-deep, 8%);
    transform: scale(1.05);
  }
}
</style>
