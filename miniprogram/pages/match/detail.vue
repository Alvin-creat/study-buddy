<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { userApi, matchApi } from '../../api';

const { t } = useI18n();
const targetUser = ref<any>(null);
const loading = ref(true);

const props = defineProps<{ id?: string }>();

onMounted(async () => {
  if (props.id) {
    try {
      targetUser.value = await userApi.getUser(props.id);
    } catch { /* */ }
  }
  loading.value = false;
});

async function sendRequest() {
  if (!props.id) return;
  try {
    await matchApi.sendRequest({ targetId: props.id, examId: '', message: '' });
    (window as any).uni?.showToast({ title: t('match.requestSent'), icon: 'success' });
  } catch (err: any) {
    (window as any).uni?.showToast({ title: err.message, icon: 'none' });
  }
}
</script>

<template>
  <div class="page">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="targetUser" class="detail-card">
      <div class="avatar-xl">
        <img :src="targetUser.avatar || '/static/default-avatar.png'" alt="avatar" />
      </div>
      <h2>{{ targetUser.nickname }}</h2>
      <p class="text-secondary">{{ targetUser.country }} · {{ targetUser.bio || '' }}</p>
      <div class="tags">
        <span class="tag" v-for="l in targetUser.languages || []" :key="l">{{ l }}</span>
      </div>
      <div v-if="targetUser.userExams?.length" class="exams">
        <h3>Study Goals</h3>
        <div v-for="e in targetUser.userExams" :key="e.id" class="exam-tag">
          {{ e.exam?.name }}
          <span v-if="e.targetOrg"> → {{ e.targetOrg }}</span>
        </div>
      </div>
      <button class="btn-primary" @click="sendRequest">Send Buddy Request</button>
    </div>
    <div v-else class="empty">User not found</div>
  </div>
</template>

<style scoped>
.page { padding: 24px; }
.loading, .empty { text-align: center; padding: 80px 0; color: #999; }
.detail-card { text-align: center; }
.avatar-xl { width: 120px; height: 120px; border-radius: 50%; overflow: hidden; margin: 0 auto 16px; background: #eee; }
.avatar-xl img { width: 100%; height: 100%; object-fit: cover; }
h2 { font-size: 22px; margin-bottom: 8px; }
.tags { display: flex; gap: 8px; justify-content: center; margin: 12px 0; flex-wrap: wrap; }
.tag { padding: 4px 12px; background: rgba(74,144,217,0.1); color: #4A90D9; border-radius: 4px; font-size: 13px; }
.exams { text-align: left; margin: 24px 0; }
.exams h3 { font-size: 16px; margin-bottom: 8px; }
.exam-tag { padding: 8px 12px; background: #f5f5f5; border-radius: 8px; margin-bottom: 8px; font-size: 14px; }
.btn-primary {
  margin-top: 24px; width: 100%; padding: 14px; background: #4A90D9; color: #fff;
  border: none; border-radius: 12px; font-size: 16px; cursor: pointer;
}
.text-secondary { color: #666; font-size: 14px; }
</style>
