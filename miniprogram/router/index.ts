import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('../pages/index/index.vue'),
    meta: { tab: 0 },
  },
  {
    path: '/match',
    component: () => import('../pages/match/match.vue'),
    meta: { tab: 1 },
  },
  {
    path: '/rooms',
    component: () => import('../pages/chat/rooms.vue'),
    meta: { tab: 2 },
  },
  {
    path: '/profile',
    component: () => import('../pages/profile/profile.vue'),
    meta: { tab: 3 },
  },
  {
    path: '/auth',
    component: () => import('../pages/auth/auth.vue'),
  },
  {
    path: '/verify',
    component: () => import('../pages/verify/verify.vue'),
  },
  {
    path: '/exam',
    component: () => import('../pages/exam/exam.vue'),
  },
  {
    path: '/chat',
    component: () => import('../pages/chat/chat.vue'),
    props: (route: any) => ({ id: route.query.id }),
  },
  {
    path: '/match-detail',
    component: () => import('../pages/match/detail.vue'),
    props: (route: any) => ({ id: route.query.id }),
  },
  {
    path: '/settings',
    component: () => import('../pages/settings/settings.vue'),
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
