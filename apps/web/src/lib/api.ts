import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends httpOnly cookies
  headers: { 'Content-Type': 'application/json', 'x-client-platform': 'web' },
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // A 401 from an auth endpoint (login/verify/refresh) is a genuine credential
    // failure, not an expired session — don't try to refresh-and-retry it.
    const isAuthEndpoint = typeof original?.url === 'string' && original.url.includes('/auth/');
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        return api(original);
      } catch {
        // Redirect to login — cookie expired
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error as unknown);
  }
);
