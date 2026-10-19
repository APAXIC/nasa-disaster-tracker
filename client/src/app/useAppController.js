import { useEffect, useRef, useState } from 'react';
import {
  fetchCurrentUser,
  logoutUser
} from '../services/authApi.js';
import {
  fetchAllEvents,
  fetchNearbyEvents
} from '../services/eventsApi.js';
import {
  fetchWatchZones,
  createWatchZone,
  updateWatchZone,
  deleteWatchZone,
  setWatchZoneNotifications
} from '../services/watchZonesApi.js';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications
} from '../services/notificationsApi.js';

import { DEFAULT_MAP_SETTINGS, MAP_SETTINGS_KEY, loadSavedMapSettings } from './mapSettings.js';


export default function useAppController() {
  const [events, setEvents] = useState([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const eventsRequestId = useRef(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(1500);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [activePanel, setActivePanel] = useState('events');
  const [mapSettings, setMapSettings] = useState(loadSavedMapSettings);
  const [user, setUser] = useState(null);
  const [watchZones, setWatchZones] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [displayEvents, setDisplayEvents] = useState([]);
  const [isPickingWatchZoneLocation, setIsPickingWatchZoneLocation] = useState(false);
  const [pickedWatchZoneLocation, setPickedWatchZoneLocation] = useState(null);
  const [watchZonePreview, setWatchZonePreview] = useState(null);

  useEffect(() => {
    loadGlobalEvents();
    checkAuthSession();
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      setNotificationsError('');
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(
        MAP_SETTINGS_KEY,
        JSON.stringify(mapSettings)
      );
    } catch (error) {
      console.error('[Map Settings Save Error]:', error);
    }
  }, [mapSettings]);

  useEffect(() => {
    document.documentElement.dataset.theme = mapSettings.theme;
  }, [mapSettings.theme]);

  useEffect(() => {
    if (!mapSettings.showUserLocation && !isSearchingNearby) {
      return;
    }

    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({
          lat: coords.latitude,
          lng: coords.longitude
        });
      },
      (error) => {
        console.error('Unable to retrieve user location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [mapSettings.showUserLocation, isSearchingNearby]);

  useEffect(() => {
    if (!isSearchingNearby || !userLocation) return undefined;

    const latitude = Number(userLocation.lat);
    const longitude = Number(userLocation.lng);
    const radius = Number(searchRadius);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radius) ||
      radius <= 0
    ) {
      return undefined;
    }

    const requestId = ++eventsRequestId.current;
    const timeoutId = setTimeout(async () => {
      try {
        const result = await fetchNearbyEvents(latitude, longitude, radius);

        if (requestId === eventsRequestId.current) {
          setEvents(result.data || []);
        }
      } catch (error) {
        if (requestId === eventsRequestId.current) {
          console.error('Failed to fetch nearby events:', error);
        }
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [isSearchingNearby, userLocation, searchRadius]);

  const checkAuthSession = async () => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      setUser(null);
      setWatchZones([]);
      return;
    }

    try {
      const data = await fetchCurrentUser();

      if (data?.user) {
        setUser(data.user);
        await loadUserWatchZones();
      } else {
        setUser(null);
        setWatchZones([]);
        localStorage.removeItem('accessToken');
      }
    } catch (err) {
      setUser(null);
      setWatchZones([]);
      localStorage.removeItem('accessToken');
    }
  };

  const loadUserWatchZones = async () => {
    try {
      const zones = await fetchWatchZones();
      setWatchZones(zones.data || zones || []);
    } catch (err) {
      console.error('Failed to load watch zones:', err);
    }
  };

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

  const handleToggleWatchZoneNotifications = async (zoneId, isMuted) => {
    try {
      await setWatchZoneNotifications(zoneId, isMuted);
      await loadUserWatchZones();
      await loadNotifications();
    } catch (error) {
      console.error('[Toggle Watch Zone Notifications Error]:', error);
      setNotificationsError('Failed to update watch zone notification settings.');
    }
  };

  const handleViewNotificationEvent = async (notification) => {
    const matchesNotification = (event) =>
      (notification.event_id != null &&
        String(event.id) === String(notification.event_id)) ||
      (notification.nasa_id != null &&
        String(event.nasa_id) === String(notification.nasa_id));

    try {
      let matchingEvent = events.find(matchesNotification);

      if (!matchingEvent) {
        const result = await fetchAllEvents();
        const allEvents = result.data || [];

        setEvents(allEvents);
        setIsSearchingNearby(false);

        matchingEvent = allEvents.find(matchesNotification);
      }

      if (!matchingEvent) {
        setNotificationsError('The event associated with this notification could not be found.');
        return;
      }

      setSelectedEvent(matchingEvent);
      setActivePanel('events');
      setNotificationsError('');
    } catch (error) {
      console.error('[Open Notification Event Error]:', error);
      setNotificationsError('Failed to open the event.');
    }
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    loadUserWatchZones();
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setWatchZones([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const loadGlobalEvents = async () => {
    const requestId = ++eventsRequestId.current;
    setIsSearchingNearby(false);
    setIsEventsLoading(true);

    try {
      const result = await fetchAllEvents();

      if (requestId === eventsRequestId.current) {
        setEvents(result.data || []);
      }
    } catch (err) {
      console.error('Failed to load global events:', err);
    } finally {
      if (requestId === eventsRequestId.current) {
        setIsEventsLoading(false);
      }
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setUserLocation({ lat, lng });
        setIsSearchingNearby(true);
      },
      () => alert('Unable to retrieve your location.')
    );
  };

  const handleStartPickingWatchZoneLocation = () => {
    setPickedWatchZoneLocation(null);
    setWatchZonePreview(null);
    setIsPickingWatchZoneLocation(true);
  };

  const handleWatchZoneLocationSelect = (location) => {
    setPickedWatchZoneLocation(location);
    setIsPickingWatchZoneLocation(false);
  };

  const handleCancelPickingWatchZoneLocation = () => {
    setIsPickingWatchZoneLocation(false);
    setPickedWatchZoneLocation(null);
  };

  const handleCreateWatchZone = async (zoneData) => {
    await createWatchZone(zoneData);
    await loadUserWatchZones();
    await loadNotifications();
  };

  const handleUpdateWatchZone = async (id, zoneData) => {
    await updateWatchZone(id, zoneData);
    await loadUserWatchZones();
    await loadNotifications();
  };

  const handleDeleteWatchZone = async (id) => {
    await deleteWatchZone(id);
    await loadUserWatchZones();
    await loadNotifications();
  };

  const handleResetMapSettings = () => {
    setMapSettings({ ...DEFAULT_MAP_SETTINGS });
  };


  return {
    events,
    isEventsLoading,
    selectedEvent,
    setSelectedEvent,
    userLocation,
    searchRadius,
    setSearchRadius,
    isSearchingNearby,
    activePanel,
    setActivePanel,
    mapSettings,
    setMapSettings,
    user,
    watchZones,
    unreadNotificationsCount,
    isAuthModalOpen,
    setIsAuthModalOpen,
    notifications,
    isNotificationsLoading,
    notificationsError,
    displayEvents,
    setDisplayEvents,
    isPickingWatchZoneLocation,
    pickedWatchZoneLocation,
    watchZonePreview,
    setWatchZonePreview,
    handleLocateUser,
    loadGlobalEvents,
    loadNotifications,
    handleMarkNotificationAsRead,
    handleMarkAllNotificationsAsRead,
    handleDeleteNotification,
    handleDeleteAllNotifications,
    handleViewNotificationEvent,
    handleAuthSuccess,
    handleLogout,
    handleToggleWatchZoneNotifications,
    handleStartPickingWatchZoneLocation,
    handleWatchZoneLocationSelect,
    handleCancelPickingWatchZoneLocation,
    handleCreateWatchZone,
    handleUpdateWatchZone,
    handleDeleteWatchZone,
    handleResetMapSettings
  };
}
