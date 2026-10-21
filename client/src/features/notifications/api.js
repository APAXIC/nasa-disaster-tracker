import apiClient from '../../lib/apiClient.js';

export const fetchNotifications = async ({
  unreadOnly = false,
  watchZoneId,
  unassigned = false
} = {}) => {
  const params = {};

  if (unreadOnly) params.unreadOnly = true;
  if (watchZoneId != null) params.watchZoneId = watchZoneId;
  if (unassigned) params.unassigned = true;

  const response = await apiClient.get('/notifications', { params });
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await apiClient.patch(
    `/notifications/${notificationId}/read`
  );

  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.patch('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await apiClient.delete(`/notifications/${notificationId}`);
  return response.data;
};

export const deleteAllNotifications = async () => {
  const response = await apiClient.delete('/notifications');
  return response.data;
};
