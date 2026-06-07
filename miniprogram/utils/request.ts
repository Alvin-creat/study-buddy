// ─── HTTP Request Wrapper ─────────────────

// Use relative path so Vite proxy forwards to backend
const BASE_URL = '/api/v1';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, any>;
  header?: Record<string, string>;
  skipAuth?: boolean;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

function getToken(): string | null {
  return uni.getStorageSync('accessToken') || null;
}

function getLocale(): string {
  return uni.getStorageSync('locale') || 'en';
}

async function refreshToken(): Promise<boolean> {
  const refreshToken = uni.getStorageSync('refreshToken');
  if (!refreshToken) return false;

  try {
    const res = await uni.request({
      url: `${BASE_URL}/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
    });
    const body = res.data as ApiResponse;
    if (body.code === 0 && body.data) {
      const d = body.data as any;
      uni.setStorageSync('accessToken', d.accessToken);
      uni.setStorageSync('refreshToken', d.refreshToken);
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, skipAuth = false } = options;

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': getLocale(),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) header['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      timeout: 15000,
    });

    const body = res.data as ApiResponse;

    // Token expired — try to refresh
    if (body.code === 10002) {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry with new token
        header['Authorization'] = `Bearer ${getToken()}`;
        const retry = await uni.request({
          url: `${BASE_URL}${url}`,
          method,
          data,
          header,
        });
        const retryBody = retry.data as ApiResponse;
        if (retryBody.code !== 0) {
          throw new Error(retryBody.message || 'Request failed');
        }
        return retryBody.data as T;
      }
      // Refresh failed — redirect to login
      uni.reLaunch({ url: '/pages/auth/auth' });
      throw new Error('Session expired');
    }

    if (body.code !== 0) {
      throw new Error(body.message || 'Request failed');
    }

    return body.data as T;
  } catch (err: any) {
    if (err.errMsg?.includes('timeout')) {
      uni.showToast({ title: 'Network timeout', icon: 'none' });
    }
    throw err;
  }
}
