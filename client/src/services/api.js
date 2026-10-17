import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchAllEvents = async () => {
  const response = await api.get('/events');
  return response.data;
};

export const fetchNearbyEvents = async (lat, lng, radiusKm = 1000) => {
  const response = await api.get('/events/nearby', {
    params: { lat, lng, radius: radiusKm }
  });
  return response.data;
};

export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  if (response.data.accessToken) {
    localStorage.setItem('accessToken', response.data.accessToken);
  }
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.accessToken) {
    localStorage.setItem('accessToken', response.data.accessToken);
  }
  return response.data;
};

export const logoutUser = async () => {
  await api.post('/auth/logout');
  localStorage.removeItem('accessToken');
};

export const fetchCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const fetchWatchZones = async () => {
  const response = await api.get('/watch-zones');
  return response.data;
};


export const createWatchZone = async (zoneData) => {
  const response = await api.post('/watch-zones', zoneData);
  return response.data;
};

export const updateWatchZone = async (id, zoneData) => {
  const response = await api.put(`/watch-zones/${id}`, zoneData);
  return response.data;
};

export const deleteWatchZone = async (id) => {
  const response = await api.delete(`/watch-zones/${id}`);
  return response.data;
};

export const fetchNotifications = async ({
                                           unreadOnly = false,
                                           watchZoneId,
                                           unassigned = false
                                         } = {}) => {
  const params = {};

  if (unreadOnly) params.unreadOnly = true;
  if (watchZoneId != null) params.watchZoneId = watchZoneId;
  if (unassigned) params.unassigned = true;

  const response = await api.get('/notifications', { params });
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notifications/read-all');

  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

export const deleteAllNotifications = async () => {
  const response = await api.delete('/notifications');
  return response.data;
};

export const setWatchZoneNotifications = async (zoneId, isMuted) => {
  const response = await api.patch(
    `/watch-zones/${zoneId}/notifications`,
    { isMuted }
  );

  return response.data;
};

export const fetchHistoricalEvents = async ({
                                              start,
                                              end,
                                              category,
                                              status = 'all',
                                              limit = 10000
                                            }) => {
  const params = {
    start,
    end,
    status,
    limit
  };

  if (category) {
    params.category = category;
  }

  const response = await api.get('/events/historical', { params });
  return response.data;
};

export const fetchHistoricalCategories = async () => {
  const response = await api.get('/events/historical/categories');
  return response.data;
};