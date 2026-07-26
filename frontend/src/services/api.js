import axios from 'axios';
import { store } from '../store';
import { logout, refreshTokenSuccess } from '../store/authSlice';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: add JWT access token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: simple single-retry for token refresh on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and we haven't retried this request yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Do not try to refresh if request is already to login, register, logout, google, or refresh endpoints
      const url = originalRequest.url || '';
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/logout') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/google');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      try {
        // Attempt to get a new access token using the HTTP-only refresh token cookie
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { token, user } = res.data;

        // Save new token to state and localStorage
        store.dispatch(refreshTokenSuccess({ token, user }));

        // Retry original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed: session expired, log out the user
        store.dispatch(logout());

        // Check if the current page is a public page (where guests are allowed)
        const publicPaths = ['/login', '/register', '/forgot-password', '/verify', '/questions', '/users', '/tags', '/profile'];
        const isPublicPath = window.location.pathname === '/' || publicPaths.some(path => window.location.pathname.startsWith(path));

        if (!isPublicPath) {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(error); // Reject with original request error instead of refresh error
      }
    }

    return Promise.reject(error);
  }
);

export default API;
