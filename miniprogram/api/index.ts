// ─── API Layer ────────────────────────────

import { request } from '../utils/request';

// ─── Auth ──────────────────────────────────

export const authApi = {
  register: (data: any) => request('/auth/register', { method: 'POST', data, skipAuth: true }),
  login: (data: any) => request('/auth/login', { method: 'POST', data, skipAuth: true }),
  refresh: (refreshToken: string) => request('/auth/refresh', { method: 'POST', data: { refreshToken }, skipAuth: true }),
  sendCode: (data: any) => request('/auth/send-code', { method: 'POST', data, skipAuth: true }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

// ─── Users ─────────────────────────────────

export const userApi = {
  getMe: () => request('/users/me'),
  updateProfile: (data: any) => request('/users/me', { method: 'PUT', data }),
  getMyExams: () => request('/users/me/exams'),
  addExam: (data: any) => request('/users/me/exams', { method: 'POST', data }),
  updateExam: (examId: string, data: any) => request(`/users/me/exams/${examId}`, { method: 'PUT', data }),
  removeExam: (examId: string) => request(`/users/me/exams/${examId}`, { method: 'DELETE' }),
  getUser: (id: string) => request(`/users/${id}`),
};

// ─── Verification ──────────────────────────

export const verifyApi = {
  uploadIdCard: (data: any) => request('/verify/id-card', { method: 'POST', data }),
  uploadFace: (data: any) => request('/verify/face', { method: 'POST', data }),
  getStatus: () => request('/verify/status'),
};

// ─── Exams ─────────────────────────────────

export const examApi = {
  getExams: (params?: any) => request('/exams', { method: 'GET', data: params } as any),
  getHotExams: () => request('/exams/hot'),
  searchExams: (q: string) => request(`/exams/search?q=${encodeURIComponent(q)}`),
};

// ─── Match ─────────────────────────────────

export const matchApi = {
  recommend: (examId: string, page = 1) => request(`/match/recommend?examId=${examId}&page=${page}`),
  search: (params: any) => request('/match/search', { method: 'GET', data: params } as any),
  sendRequest: (data: any) => request('/match/request', { method: 'POST', data }),
  receivedRequests: () => request('/match/requests/received'),
  sentRequests: () => request('/match/requests/sent'),
  acceptRequest: (id: string) => request(`/match/requests/${id}/accept`, { method: 'POST' }),
  rejectRequest: (id: string) => request(`/match/requests/${id}/reject`, { method: 'POST' }),
};

// ─── Buddies ───────────────────────────────

export const buddyApi = {
  getBuddies: () => request('/buddies'),
  getDetail: (id: string) => request(`/buddies/${id}`),
  endBuddyship: (id: string) => request(`/buddies/${id}/end`, { method: 'POST' }),
};

// ─── Chat ──────────────────────────────────

export const chatApi = {
  getRooms: () => request('/chat/rooms'),
  getMessages: (buddyshipId: string, before?: string) =>
    request(`/chat/rooms/${buddyshipId}/messages${before ? `?before=${before}` : ''}`),
};

// ─── Checkin ───────────────────────────────

export const checkinApi = {
  checkin: (data: any) => request('/checkin', { method: 'POST', data }),
  getMyCheckins: (params?: any) => request('/checkin', { method: 'GET', data: params } as any),
  getStreak: () => request('/checkin/streak'),
};

// ─── Reviews ───────────────────────────────

export const reviewApi = {
  create: (data: any) => request('/reviews', { method: 'POST', data }),
  getUserReviews: (userId: string) => request(`/reviews/user/${userId}`),
};

// ─── Common ────────────────────────────────

export const commonApi = {
  upload: (filePath: string) => {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: 'https://api.studybuddy.app/api/v1/common/upload',
        filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${uni.getStorageSync('accessToken')}`,
          'Accept-Language': uni.getStorageSync('locale') || 'en',
        },
        success: (res) => resolve(JSON.parse(res.data)),
        fail: reject,
      });
    });
  },
  translate: (data: any) => request('/common/translate', { method: 'POST', data }),
  getCountries: () => request('/common/countries'),
  getTimezones: () => request('/common/timezones'),
  report: (data: any) => request('/common/report', { method: 'POST', data }),
};
