import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL
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