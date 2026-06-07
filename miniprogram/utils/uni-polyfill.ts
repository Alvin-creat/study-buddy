// ─── uni-app API Polyfill for Browser ────
// Maps uni.* APIs to browser equivalents so pages work in both environments

import { ref } from 'vue';

let toastTimer: ReturnType<typeof setTimeout> | null = null;
const toastMsg = ref('');
const toastVisible = ref(false);

function showToast(opts: { title: string; icon?: string; duration?: number }) {
  toastMsg.value = opts.title;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastVisible.value = false; }, opts.duration || 2000);
}

export const toastState = { toastMsg, toastVisible };

export const uni = {
  // ─── Storage ──────────────────────────
  getStorageSync(key: string): any {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  setStorageSync(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
  },
  removeStorageSync(key: string): void {
    localStorage.removeItem(key);
  },

  // ─── HTTP ─────────────────────────────
  request(opts: {
    url: string;
    method?: string;
    data?: any;
    header?: Record<string, string>;
    timeout?: number;
    success?: (res: any) => void;
    fail?: (err: any) => void;
  }) {
    const { url, method = 'GET', data, header, timeout = 15000, success, fail } = opts;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const fetchOpts: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', ...header },
      signal: controller.signal,
    };
    if (method !== 'GET' && data) {
      fetchOpts.body = JSON.stringify(data);
    }

    const finalUrl = method === 'GET' && data
      ? `${url}?${new URLSearchParams(data).toString()}`
      : url;

    fetch(finalUrl, fetchOpts)
      .then(async (res) => {
        clearTimeout(timer);
        const json = await res.json();
        success?.({ data: json, statusCode: res.status });
      })
      .catch((err) => {
        clearTimeout(timer);
        fail?.({ errMsg: err.message });
      });
  },

  uploadFile(opts: { url: string; filePath: string; name: string; header?: Record<string,string>; success?: (res: any) => void; fail?: (err: any) => void }) {
    const formData = new FormData();
    fetch(opts.filePath)
      .then(r => r.blob())
      .then(blob => {
        formData.append(opts.name, blob);
        return fetch(opts.url, { method: 'POST', headers: opts.header, body: formData });
      })
      .then(r => r.json())
      .then(data => opts.success?.({ data }))
      .catch(err => opts.fail?.({ errMsg: err.message }));
  },

  // ─── UI ───────────────────────────────
  showToast(opts: { title: string; icon?: string; duration?: number } | string) {
    const o = typeof opts === 'string' ? { title: opts } : opts;
    showToast(o);
  },
  showModal(opts: { title?: string; content?: string; success?: (res: { confirm: boolean }) => void }) {
    const confirmed = window.confirm(opts.content || opts.title || '');
    opts.success?.({ confirm: confirmed });
  },

  // ─── Navigation ────────────────────────
  navigateTo(opts: { url: string }) {
    const path = opts.url.replace(/^\//, '');
    const routeMap: Record<string, string> = {
      'pages/auth/auth': '/auth',
      'pages/verify/verify': '/verify',
      'pages/exam/exam': '/exam',
      'pages/settings/settings': '/settings',
      'pages/chat/chat': '/chat',
      'pages/chat/rooms': '/rooms',
      'pages/match/detail': '/match-detail',
      'pages/match/match': '/match',
    };
    const r = routeMap[path] || `/${path}`;
    const [base, query] = r.split('?');
    window.location.hash = '#' + base + (query ? `?${query}` : '');
  },
  switchTab(opts: { url: string }) {
    const tabMap: Record<string, string> = {
      'pages/index/index': '/',
      'pages/match/match': '/match',
      'pages/chat/rooms': '/rooms',
      'pages/profile/profile': '/profile',
    };
    window.location.hash = '#' + (tabMap[opts.url] || '/');
  },
  reLaunch(opts: { url: string }) {
    this.switchTab(opts);
  },
  navigateBack() {
    window.history.back();
  },

  // ─── Media ────────────────────────────
  chooseImage(opts: { count?: number; sourceType?: string[]; success?: (res: { tempFilePaths: string[] }) => void }) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const files = input.files;
      if (files) {
        const paths = Array.from(files).map(f => URL.createObjectURL(f));
        opts.success?.({ tempFilePaths: paths });
      }
    };
    input.click();
  },
  getSystemInfoSync() {
    return {
      language: navigator.language,
      platform: 'web',
    };
  },
};

(globalThis as any).uni = uni;
