<template>
  <div style="padding:40px;text-align:center;">
    <h1>📚 StudyBuddy</h1>
    <p style="margin-top:20px;">MVP is working!</p>
    <div style="margin-top:30px;">
      <a href="#/match" style="color:#4A90D9;font-size:18px;">👉 Go to Match</a>
    </div>
  </div>
</template>

<script setup lang="ts">
// Redirect to match page after a short delay
import { onMounted } from 'vue';

onMounted(() => {
  // For MVP, redirect to match page
  setTimeout(() => {
    window.location.hash = '#/match';
  }, 500);
});
</script>
