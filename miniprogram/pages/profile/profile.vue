<template>
  <div class="profile-page">
    <!-- Hero -->
    <div class="profile-hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="profile-avatar-wrap" @click="changeAvatar">
          <div class="profile-avatar">
            <img :src="user?.avatar || '/static/default-avatar.png'" alt="" />
          </div>
          <div class="avatar-frame"></div>
        </div>
        <h2 class="profile-name">{{ user?.nickname || 'Scholar' }}</h2>
        <p class="profile-bio" v-if="user?.examName && !editing">
          {{ user.examName }}<span v-if="user?.targetSchool"> · {{ user.targetSchool }}</span>
        </p>
        <div class="hero-meta" v-if="!editing">
          <span class="meta-badge" v-if="user?.timezone">{{ user.timezone }}</span>
          <span class="meta-badge" v-if="user?.studyTime">{{ user.studyTime }}</span>
        </div>
        <button class="edit-toggle" @click="toggleEdit">
          {{ editing ? 'Cancel' : 'Edit Profile' }}
        </button>
      </div>
    </div>

    <!-- Edit Form -->
    <div class="edit-form" v-if="editing">
      <div class="form-card">
        <div class="field">
          <label class="field-label">Nickname</label>
          <input v-model="form.nickname" class="field-input" placeholder="Your name" />
        </div>
        <div class="field">
          <label class="field-label">Exam Type</label>
          <div class="select-wrap">
            <select v-model="form.examType" class="field-input">
              <option value="">Select...</option>
              <option value="postgraduate">🎓 Postgraduate</option>
              <option value="certificate">📜 Certificate</option>
              <option value="language">🗣 Language</option>
              <option value="other">📋 Other</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Exam Name</label>
          <input v-model="form.examName" class="field-input" placeholder="e.g. CFA Level II" />
        </div>
        <div class="field">
          <label class="field-label">Target School</label>
          <input v-model="form.targetSchool" class="field-input" placeholder="e.g. NYU" />
        </div>
        <div class="field-row">
          <div class="field half">
            <label class="field-label">Timezone</label>
            <input v-model="form.timezone" class="field-input" placeholder="e.g. EST" />
          </div>
          <div class="field half">
            <label class="field-label">Study Time</label>
            <div class="select-wrap">
              <select v-model="form.studyTime" class="field-input">
                <option value="">Select...</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Bio</label>
          <textarea v-model="form.bio" class="field-input bio-input" placeholder="A short intro..." rows="2"></textarea>
        </div>
        <button class="save-btn" :disabled="saving" @click="saveProfile">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Menu -->
    <div class="menu-section">
      <button class="menu-item" @click="goRequests">
        <span class="menu-icon">📬</span>
        <span class="menu-label">{{ $t('profile.requests') }}</span>
        <span class="badge-count" v-if="pendingCount > 0">{{ pendingCount }}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
      </button>
      <button class="menu-item" @click="goSettings">
        <span class="menu-icon">⚙️</span>
        <span class="menu-label">{{ $t('settings.title') }}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>

    <!-- Logout -->
    <div class="logout-section">
      <button class="logout-btn" @click="handleLogout">
        <span>{{ $t('auth.logout') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '../../store/user';
import { userApi, matchApi } from '../../api';

const { t } = useI18n();
const userStore = useUserStore();
const { user } = userStore;

const pendingCount = ref(0);
const editing = ref(false);
const saving = ref(false);

const form = reactive({
  nickname: '',
  examType: '',
  examName: '',
  targetSchool: '',
  timezone: '',
  studyTime: '',
  bio: '',
});

const verifyLabel = computed(() => {
  if (!user.value) return '';
  if (user.value.verifyStatus === 'VERIFIED') return t('verify.verified');
  if (user.value.verifyStatus === 'PENDING') return t('verify.pending');
  return t('verify.unverified');
});

onMounted(async () => {
  try {
    const reqs: any = await matchApi.getRequests();
    pendingCount.value = reqs?.received?.filter((r: any) => r.status === 'PENDING').length || 0;
  } catch { /* */ }
});

function toggleEdit() {
  if (!editing.value) {
    // Populate form from user data
    form.nickname = user.value?.nickname || '';
    form.examType = user.value?.examType || '';
    form.examName = user.value?.examName || '';
    form.targetSchool = user.value?.targetSchool || '';
    form.timezone = user.value?.timezone || '';
    form.studyTime = user.value?.studyTime || '';
    form.bio = user.value?.bio || '';
  }
  editing.value = !editing.value;
}

async function saveProfile() {
  saving.value = true;
  try {
    const updated: any = await userApi.updateProfile({ ...form });
    userStore.user = { ...user.value, ...updated };
    editing.value = false;
    uni.showToast({ title: 'Profile updated', icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: err.message || 'Error', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

function changeAvatar() {
  uni.chooseImage({
    count: 1,
    success: () => { uni.showToast({ title: 'Upload coming soon', icon: 'none' }); },
  });
}

function handleLogout() {
  uni.showModal({
    title: t('auth.logoutConfirm'),
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        uni.reLaunch({ url: '/pages/match/match' });
      }
    },
  });
}

function goRequests() { uni.navigateTo({ url: '/pages/match/requests' }); }
function goSettings() { uni.navigateTo({ url: '/pages/settings/settings' }); }
</script>

<style lang="scss" scoped>
@import '../../styles/global.scss';

.profile-page {
  min-height: 100vh;
  background: $bg;
  @include paper-texture;
}

/* Hero */
.profile-hero {
  position: relative;
  padding-bottom: 24px;
}

.hero-bg {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 180px;
  background: linear-gradient(170deg, $ink-deep 0%, lighten($ink-deep, 10%) 100%);
  border-radius: 0 0 40px 40px;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(circle at 30% 70%, rgba($gold-warm, 0.08) 0%, transparent 60%),
      radial-gradient(circle at 80% 20%, rgba($gold-light, 0.05) 0%, transparent 50%);
  }
}

.hero-content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 24px 0; text-align: center;
}

.profile-avatar-wrap {
  position: relative; margin-bottom: 12px; cursor: pointer;
}

.profile-avatar {
  width: 64px; height: 64px; border-radius: 50%;
  overflow: hidden; background: $dust; position: relative; z-index: 1;
  border: 3px solid rgba($ivory, 0.9);
  img { width: 100%; height: 100%; object-fit: cover; }
}

.avatar-frame {
  position: absolute; inset: -4px; border-radius: 50%;
  border: 1.5px solid rgba($gold-warm, 0.4);
}

.profile-name {
  font-family: 'Georgia', serif;
  font-size: 20px; font-weight: 700; color: $ivory;
  letter-spacing: -0.3px; margin-bottom: 2px;
}

.profile-bio {
  font-size: 12px; color: rgba($ivory, 0.7);
  font-style: italic; margin-bottom: 10px;
}

.hero-meta {
  display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
}

.meta-badge {
  font-size: 10px; font-weight: 500;
  color: rgba($ivory, 0.8);
  background: rgba($ivory, 0.1);
  padding: 3px 10px; border-radius: 10px;
  border: 1px solid rgba($ivory, 0.12);
  text-transform: capitalize;
}

.edit-toggle {
  margin-top: 14px;
  padding: 6px 18px;
  background: rgba($ivory, 0.12);
  color: rgba($ivory, 0.8);
  border: 1px solid rgba($ivory, 0.15);
  border-radius: 16px;
  font-size: 11px; font-weight: 500;
  cursor: pointer; letter-spacing: 0.3px;
  transition: all 0.2s;

  &:hover { background: rgba($ivory, 0.2); color: $ivory; }
}

/* Edit Form */
.edit-form {
  padding: 16px 20px;
}

.form-card {
  background: $ivory;
  border-radius: $radius-lg;
  padding: 24px;
  border: 1px solid rgba($clay, 0.15);
  @include ink-bleed;
}

.field {
  margin-bottom: 16px;
}

.field-row {
  display: flex; gap: 12px;
}

.field.half { flex: 1; }

.field-label {
  display: block;
  font-size: 11px; font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  border: 1.5px solid $border;
  border-radius: $radius;
  font-size: 14px;
  color: $text-primary;
  background: $bg-card;
  transition: border-color 0.2s;

  &:focus { outline: none; border-color: $gold-warm; }
  &::placeholder { color: $text-hint; font-style: italic; }
}

select.field-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b7355' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}

.bio-input {
  height: auto; padding: 10px 14px; resize: vertical;
}

.save-btn {
  width: 100%; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: $ink-deep; color: $ivory;
  border: none; border-radius: $radius;
  font-size: 14px; font-weight: 600;
  cursor: pointer; letter-spacing: 0.3px;
  margin-top: 4px; transition: all 0.2s;

  &:hover { background: lighten($ink-deep, 8%); }
  &:disabled { opacity: 0.6; cursor: default; }
}

/* Menu */
.menu-section {
  margin: 8px 20px 0;
  background: $ivory; border-radius: $radius-lg;
  border: 1px solid rgba($clay, 0.15); overflow: hidden;
  @include ink-bleed;
}

.menu-item {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 16px 20px;
  border: none; background: transparent;
  font-size: 14px; color: $text-primary; cursor: pointer;
  text-align: left; transition: background 0.15s;

  &:not(:last-child) { border-bottom: 1px solid rgba($clay, 0.1); }
  &:hover { background: rgba($clay, 0.06); }
}

.menu-icon { font-size: 18px; width: 24px; text-align: center; }
.menu-label { flex: 1; font-weight: 500; }

.badge-count {
  display: flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px;
  background: $ember; color: #fff;
  font-size: 10px; font-weight: 600;
  border-radius: 10px; padding: 0 6px;
}

.menu-item svg { color: $text-hint; flex-shrink: 0; }

/* Logout */
.logout-section { padding: 20px 20px 40px; }

.logout-btn {
  width: 100%; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; color: $text-secondary;
  border: 1px solid $border; border-radius: $radius;
  font-size: 14px; cursor: pointer; transition: all 0.2s;

  &:hover { border-color: rgba($ember, 0.3); color: $ember; }
}
</style>
