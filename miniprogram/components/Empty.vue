<template>
  <div class="empty-state">
    <span class="empty-state__icon">{{ icon }}</span>
    <span class="empty-state__text">{{ text }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  text?: string
  icon?: string
}>(), {
  icon: '📭',
  text: 'No data',
});
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #999;
}
.empty-state__icon { font-size: 48px; margin-bottom: 12px; }
.empty-state__text { font-size: 14px; }
</style>
