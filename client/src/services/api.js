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
