import apiClient from '../../lib/apiClient.js';

export const fetchAllEvents = async () => {
  const response = await apiClient.get('/events');
  return response.data;
};

export const fetchNearbyEvents = async (lat, lng, radiusKm = 1000) => {
  const response = await apiClient.get('/events/nearby', {
    params: { lat, lng, radius: radiusKm }
  });

  return response.data;
};

export const fetchHistoricalEvents = async ({
  start,
  end,
  category,
  status = 'all',
  limit = 10000
}) => {
  const params = { start, end, status, limit };

  if (category) {
    params.category = category;
  }

  const response = await apiClient.get('/events/historical', { params });
  return response.data;
};

export const fetchHistoricalCategories = async () => {
  const response = await apiClient.get('/events/historical/categories');
  return response.data;
};
