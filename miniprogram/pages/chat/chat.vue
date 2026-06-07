<template>
  <view class="page">
    <!-- Header -->
    <view class="chat-header safe-top">
      <text class="back-btn" @click="goBack">←</text>
      <text class="chat-partner text-bold">{{ partner?.nickname || '' }}</text>
      <view class="avatar avatar-sm">
        <image :src="partner?.avatar || '/static/default-avatar.png'" mode="aspectFill" />
      </view>
    </view>

    <!-- Messages -->
    <scroll-view
      scroll-y
      class="messages"
      :scroll-with-animation="true"
      :scroll-top="scrollTop"
      @scrolltoupper="loadEarlier"
    >
      <view v-if="hasMore" class="text-center py-16">
        <text class="text-sm text-hint">{{ $t('chat.loadingEarlier') }}</text>
      </view>

      <view
        v-for="msg in messages"
        :key="msg.id"
        :class="['message-row', msg.senderId === userId ? 'message-mine' : 'message-other']"
      >
        <image
          v-if="msg.senderId !== userId"
          :src="msg.sender?.avatar || '/static/default-avatar.png'"
          class="avatar avatar-sm"
          mode="aspectFill"
        />
        <view :class="['message-bubble', msg.senderId === userId ? 'bubble-mine' : 'bubble-other']">
          <text class="message-text">{{ msg.content }}</text>
          <text class="message-translated" v-if="msg.contentTranslated">
            🌐 {{ msg.contentTranslated }}
          </text>
          <text class="message-time text-xs text-hint mt-4">{{ formatTime(msg.createdAt) }}</text>
        </view>
        <image
          v-if="msg.senderId === userId"
          :src="user?.avatar || '/static/default-avatar.png'"
          class="avatar avatar-sm"
          mode="aspectFill"
        />
      </view>
    </scroll-view>

    <!-- Input Bar -->
    <view class="input-bar safe-bottom">
      <view class="input-row">
        <button class="btn-icon" @click="showActions = !showActions">+</button>
        <input
          v-model="inputText"
          class="msg-input flex-1"
          :placeholder="$t('chat.typeMessage')"
          :confirm-type="'send'"
          @confirm="sendMessage"
        />
        <button class="btn-icon" @click="sendMessage">📤</button>
      </view>
    </view>
  </view>
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
const scrollTop = ref(0);
const hasMore = ref(true);
const showActions = ref(false);
const loading = ref(false);

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
    if (!msgs || msgs.length === 0) {
      hasMore.value = false;
      return;
    }
    if (before) {
      messages.value = [...(msgs || []), ...messages.value];
    } else {
      messages.value = msgs || [];
      scrollToBottom();
    }
  } finally {
    loading.value = false;
  }
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
    if (msg.buddyshipId === buddyshipId.value) {
      messages.value.push(msg);
      scrollToBottom();
    }
  });

  s.on('chat:read', (data: any) => {
    // Update read status
  });

  s.on('chat:typing', (data: any) => {
    // Show typing indicator
  });
}

function sendMessage() {
  const text = inputText.value.trim();
  if (!text) return;

  const s = socket.getSocket();
  if (s?.connected) {
    s.emit('chat:message', {
      buddyshipId: buddyshipId.value,
      type: 'TEXT',
      content: text,
    });
  }

  inputText.value = '';
  scrollToBottom();
}

function scrollToBottom() {
  nextTick(() => {
    scrollTop.value = 999999;
  });
}

function formatTime(dateStr: string) {
  const d = dayjs(dateStr);
  const today = dayjs().startOf('day');
  if (d.isAfter(today)) return d.format('HH:mm');
  return d.format('MM-DD HH:mm');
}

function goBack() { uni.navigateBack(); }
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; height: 100vh; background: #F0F0F0; }
.chat-header { display: flex; align-items: center; gap: 16rpx; padding: 16rpx 24rpx; background: #fff; border-bottom: 1rpx solid #E8E8E8; }
.chat-partner { flex: 1; text-align: center; font-size: 32rpx; }
.back-btn { font-size: 40rpx; color: #333; padding: 8rpx; }
.messages { flex: 1; padding: 16rpx 24rpx; }
.message-row { display: flex; gap: 12rpx; margin-bottom: 24rpx; align-items: flex-start; }
.message-mine { justify-content: flex-end; }
.message-other { justify-content: flex-start; }
.message-bubble { max-width: 70%; padding: 16rpx 24rpx; border-radius: 20rpx; }
.bubble-mine { background: #4A90D9; color: #fff; border-bottom-right-radius: 4rpx; }
.bubble-other { background: #fff; border-bottom-left-radius: 4rpx; }
.message-text { font-size: 28rpx; line-height: 1.5; word-break: break-word; }
.message-translated { font-size: 24rpx; opacity: 0.7; margin-top: 8rpx; display: block; font-style: italic; }
.message-time { margin-top: 4rpx; }
.input-bar { background: #fff; border-top: 1rpx solid #E8E8E8; }
.input-row { display: flex; align-items: center; gap: 12rpx; padding: 12rpx 16rpx; }
.btn-icon { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; font-size: 36rpx; color: #4A90D9; background: none; border: none; padding: 0; }
.msg-input { height: 68rpx; background: #F5F5F5; border-radius: 34rpx; padding: 0 24rpx; font-size: 28rpx; }
</style>
