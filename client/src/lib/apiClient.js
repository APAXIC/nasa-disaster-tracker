import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

let refreshPromise = null;

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient.post('/auth/refresh')
      .then(({ data }) => {
        if (!data?.accessToken) {
          throw new Error('Refresh response is missing an access token');
        }
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
      })
      .catch((error) => {
        localStorage.removeItem('accessToken');
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const path = original?.url || '';

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      /^\/auth\/(login|register|refresh|logout)(?:\?|$)/.test(path)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const failedToken = original.headers?.Authorization?.replace(/^Bearer\s+/i, '');
      const currentToken = localStorage.getItem('accessToken');
      const newToken = currentToken && failedToken && currentToken !== failedToken
        ? currentToken
        : await refreshAccessToken();

      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
