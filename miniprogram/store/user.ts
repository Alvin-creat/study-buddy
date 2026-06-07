import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userApi, authApi } from '../api';
import { useSocket } from '../utils/socket';

export const useUserStore = defineStore('user', () => {
  // ─── State ─────────────────────────────

  const user = ref<any>(null);
  const isLoggedIn = ref(false);
  const token = ref<string | null>(null);
  const settings = ref({
    language: 'en',
    notifications: true,
    soundEnabled: true,
  });

  const socket = useSocket();

  // ─── Getters ───────────────────────────

  const isVerified = computed(() => user.value?.verifyStatus === 'VERIFIED');
  const userId = computed(() => user.value?.id || null);

  // ─── Actions ───────────────────────────

  function setAuth(data: { user: any; accessToken: string; refreshToken: string }) {
    user.value = data.user;
    token.value = data.accessToken;
    isLoggedIn.value = true;
    uni.setStorageSync('accessToken', data.accessToken);
    uni.setStorageSync('refreshToken', data.refreshToken);
    connectSocket();
  }

  function clearAuth() {
    user.value = null;
    token.value = null;
    isLoggedIn.value = false;
    uni.removeStorageSync('accessToken');
    uni.removeStorageSync('refreshToken');
    disconnectSocket();
  }

  async function restoreSession() {
    const stored = uni.getStorageSync('accessToken');
    if (!stored) return;

    try {
      const me = await userApi.getMe();
      user.value = me;
      token.value = stored;
      isLoggedIn.value = true;
      connectSocket();
    } catch {
      clearAuth();
    }
  }

  async function login(credentials: { type: string; email?: string; phone?: string; password: string }) {
    const result: any = await authApi.login(credentials);
    setAuth(result);
    return result;
  }

  async function register(data: any) {
    const result: any = await authApi.register(data);
    setAuth(result);
    return result;
  }

  function logout() {
    authApi.logout().catch(() => {});
    clearAuth();
  }

  function updateSettings(s: Partial<typeof settings.value>) {
    settings.value = { ...settings.value, ...s };
    uni.setStorageSync('settings', settings.value);
  }

  function connectSocket() {
    if (token.value) {
      socket.connect(token.value);
    }
  }

  function disconnectSocket() {
    socket.disconnect();
  }

  return {
    user, isLoggedIn, token, settings,
    isVerified, userId,
    login, register, logout, setAuth, clearAuth,
    restoreSession, updateSettings,
    connectSocket, disconnectSocket,
  };
});
