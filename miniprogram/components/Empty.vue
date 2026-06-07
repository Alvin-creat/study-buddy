<template>
  <view class="empty-state">
    <text class="empty-state__icon">{{ icon }}</text>
    <text class="empty-state__text">{{ text }}</text>
    <slot />
  </view>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
  icon?: string
}>();
const props = withDefaults(defineProps<{
  text?: string
  icon?: string
}>(), {
  icon: '📭',
  text: 'No data',
});
</script>
