<template>
  <div class="rooms-page">
    <header class="rooms-header">
      <h1 class="rooms-title">{{ $t('chat.messages') }}</h1>
    </header>

    <div v-if="rooms.length > 0" class="rooms-list">
      <div
        v-for="room in rooms"
        :key="room.id"
        class="room-card"
        @click="goChat(room.id)"
      >
        <div class="room-avatar">
          <img :src="room.partner?.avatar || '/static/default-avatar.png'" alt="" />
        </div>
        <div class="room-body">
          <div class="room-top">
            <span class="room-name">{{ room.partner?.nickname }}</span>
            <span class="room-time">{{ formatTime(room.lastMessage?.createdAt) }}</span>
          </div>
          <div class="room-bottom">
            <span class="room-preview">{{ room.lastMessage?.content || '' }}</span>
            <span class="room-badge" v-if="room.unreadCount > 0">{{ room.unreadCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4a882" stroke-width="1">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <p class="empty-text">{{ $t('chat.noMessages') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { chatApi } from '../../api';
import dayjs from 'dayjs';

const { t } = useI18n();
const rooms = ref<any[]>([]);

onMounted(async () => {
  try {
    const data = await chatApi.getRooms();
    rooms.value = (data as any[]) || [];
  } catch { /* */ }
});

function goChat(id: string) {
  uni.navigateTo({ url: `/pages/chat/chat?id=${id}` });
}

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  const d = dayjs(dateStr);
  const today = dayjs().startOf('day');
  if (d.isAfter(today)) return d.format('HH:mm');
  if (d.isAfter(today.subtract(7, 'day'))) return d.format('ddd');
  return d.format('MM/DD');
}
</script>

<style lang="scss" scoped>
@import '../../styles/global.scss';

.rooms-page {
  min-height: 100vh;
  background: $bg;
  @include paper-texture;
}

.rooms-header {
  padding: 24px 20px 16px;
  background: $ivory;
  border-bottom: 1px solid $border;
}

.rooms-title {
  font-family: 'Georgia', serif;
  font-size: 22px;
  font-weight: 700;
  color: $ink-deep;
  letter-spacing: -0.3px;
}

/* ── Room List ───────────────────────── */
.rooms-list {
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.room-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: $ivory;
  border-radius: $radius-lg;
  cursor: pointer;
  border: 1px solid rgba($clay, 0.12);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba($ink-deep, 0.06);
  }

  &:active { transform: scale(0.995); }
}

.room-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  overflow: hidden;
  background: $dust;
  flex-shrink: 0;
  border: 2px solid $ivory;
  box-shadow: 0 2px 8px rgba($ink-deep, 0.06);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.room-body {
  flex: 1;
  min-width: 0;
}

.room-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.room-name {
  font-family: 'Georgia', serif;
  font-size: 15px;
  font-weight: 600;
  color: $ink-deep;
}

.room-time {
  font-size: 11px;
  color: $text-hint;
  flex-shrink: 0;
}

.room-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-preview {
  font-size: 13px;
  color: $text-hint;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
  font-style: italic;
}

.room-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  background: $ember;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 10px;
  padding: 0 6px;
  flex-shrink: 0;
}

/* ── Empty ────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 40px;
}

.empty-text {
  font-family: 'Georgia', serif;
  font-size: 15px;
  color: $text-hint;
  margin-top: 16px;
  font-style: italic;
}
</style>
