import apiClient from './apiClient';

export const fetchWatchZones = async () => {
  const response = await apiClient.get('/watch-zones');
  return response.data;
};

export const createWatchZone = async (zoneData) => {
  const response = await apiClient.post('/watch-zones', zoneData);
  return response.data;
};

export const updateWatchZone = async (id, zoneData) => {
  const response = await apiClient.put(`/watch-zones/${id}`, zoneData);
  return response.data;
};

export const deleteWatchZone = async (id) => {
  const response = await apiClient.delete(`/watch-zones/${id}`);
  return response.data;
};

export const setWatchZoneNotifications = async (zoneId, isMuted) => {
  const response = await apiClient.patch(
    `/watch-zones/${zoneId}/notifications`,
    { isMuted }
  );

  return response.data;
};
