import { useEffect, useState } from 'react';
import {
  fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead,
  deleteNotification, deleteAllNotifications
} from './api.js';

export default function useNotifications(user) {
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');

  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      setNotificationsError('');
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      setNotificationsError('');
      return;
    }

    setIsNotificationsLoading(true);
    setNotificationsError('');

    try {
      const result = await fetchNotifications();

      const notificationItems = Array.isArray(result.data)
        ? result.data
        : [];

      setNotifications(notificationItems);
      setUnreadNotificationsCount(
        notificationItems.filter(
          (notification) =>
            notification.is_read === false ||
            notification.is_read === 0 ||
            notification.is_read === '0' ||
            notification.is_read === null
        ).length
      );
    } catch (error) {
      console.error('[Notifications Error]:', error);
      setNotificationsError('Failed to load notifications.');
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('[Mark Notification Read Error]:', error);
      setNotificationsError('Failed to mark notification as read.');
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('[Mark All Notifications Read Error]:', error);
      setNotificationsError('Failed to mark notifications as read.');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('[Delete Notification Error]:', error);
      setNotificationsError('Failed to delete notification.');
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await deleteAllNotifications();
      await loadNotifications();
    } catch (error) {
      console.error('[Delete All Notifications Error]:', error);
      setNotificationsError('Failed to delete notifications.');
    }
  };

  return {
    unreadNotificationsCount, notifications, isNotificationsLoading,
    notificationsError, setNotificationsError, loadNotifications,
    handleMarkNotificationAsRead, handleMarkAllNotificationsAsRead,
    handleDeleteNotification, handleDeleteAllNotifications
  };
}
