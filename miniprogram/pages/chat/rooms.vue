<template>
  <view class="page">
    <view class="page-title safe-top p-32">
      <text class="text-xl text-bold">{{ $t('chat.messages') }}</text>
    </view>

    <view v-if="rooms.length > 0">
      <view
        v-for="room in rooms"
        :key="room.id"
        class="room-item"
        @click="goChat(room.id)"
      >
        <view class="flex gap-16 p-24">
          <view class="avatar">
            <image :src="room.partner?.avatar || '/static/default-avatar.png'" mode="aspectFill" />
          </view>
          <view class="flex-1" style="overflow: hidden;">
            <view class="flex-between">
              <text class="text-bold">{{ room.partner?.nickname }}</text>
              <text class="text-xs text-hint">{{ formatTime(room.lastMessage?.createdAt) }}</text>
            </view>
            <view class="flex-between mt-8">
              <text class="text-sm text-secondary room-last-msg">{{ room.lastMessage?.content || '' }}</text>
              <text class="badge" v-if="room.unreadCount > 0">{{ room.unreadCount }}</text>
            </view>
          </view>
        </view>
        <view class="divider" style="margin: 0 0 0 96rpx;"></view>
      </view>
    </view>

    <Empty v-else :text="$t('chat.noMessages')" />
  </view>
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
.page { min-height: 100vh; background: #fff; }
.page-title { background: #fff; }
.room-item { cursor: pointer; }
.room-last-msg {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400rpx;
}
</style>
