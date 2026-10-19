import React, { useState, useEffect } from 'react';
import Map from './components/map/Map.jsx';
import AuthModal from './components/AuthModal';
import AppShell from './components/layout/AppShell';
import EventsPanel from './components/panels/EventsPanel';
import WatchZonesPanel from './components/panels/WatchZonesPanel.jsx';
import NotificationsPanel from './components/panels/NotificationsPanel';
import SettingsPanel from './components/panels/SettingsPanel';
import StatisticsPanel from './components/panels/StatisticsPanel';
import {
  fetchAllEvents,
  fetchNearbyEvents,
  fetchCurrentUser,
  fetchWatchZones,
  logoutUser,
  createWatchZone,
  updateWatchZone,
  deleteWatchZone,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  setWatchZoneNotifications
} from './services/api';
import {
  ExclamationTriangleIcon,
  MapPinIcon,
  BellIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const MAP_SETTINGS_KEY = 'disaster-map-settings';

const DEFAULT_MAP_SETTINGS = {
  mapStyle: 'standard',
  theme: 'dark',
  showEvents: true,
  showWatchZones: true,
  showUserLocation: true,
  rememberMapView: true
};

const loadSavedMapSettings = () => {
  try {
    const saved = localStorage.getItem(MAP_SETTINGS_KEY);

    if (!saved) return DEFAULT_MAP_SETTINGS;

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_MAP_SETTINGS,
      ...parsed,
      mapStyle: ['standard', 'satellite', 'topographic'].includes(parsed.mapStyle)
        ? parsed.mapStyle
        : DEFAULT_MAP_SETTINGS.mapStyle,
      theme: ['light', 'dark'].includes(parsed.theme)
        ? parsed.theme
        : DEFAULT_MAP_SETTINGS.theme
    };
  } catch {
    return DEFAULT_MAP_SETTINGS;
  }
};

export default function App() {
  const [events, setEvents] = useState([]);
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
    setDisplayEvents(events);
  }, [events]);

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

      setNotifications(result.data || []);
      setUnreadNotificationsCount(Number(result.unreadCount) || 0);
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
        setUserLocation(null);

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
    try {
      const result = await fetchAllEvents();
      setEvents(result.data || []);
      setIsSearchingNearby(false);
      setUserLocation(null);
    } catch (err) {
      console.error('Failed to load global events:', err);
    }
  };

  const loadNearbyEvents = async (lat, lng, radius) => {
    try {
      const result = await fetchNearbyEvents(lat, lng, radius);
      setEvents(result.data || []);
    } catch (err) {
      console.error('Failed to fetch nearby events:', err);
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
        loadNearbyEvents(lat, lng, searchRadius);
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

  const panelConfig = {
    events: {
      title: 'Events',
      icon: ExclamationTriangleIcon,
      content: (
        <EventsPanel
          events={events}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
          onLocateUser={handleLocateUser}
          onResetSearch={loadGlobalEvents}
          isSearchingNearby={isSearchingNearby}
          searchRadius={searchRadius}
          setSearchRadius={setSearchRadius}
          userLocation={userLocation}
          onDisplayEventsChange={setDisplayEvents}
        />
      )
    },
    'watch-zones': {
      title: 'Watch Zones',
      icon: MapPinIcon,
      content: (
        <WatchZonesPanel
          user={user}
          watchZones={watchZones}
          onCreateWatchZone={handleCreateWatchZone}
          onUpdateWatchZone={handleUpdateWatchZone}
          onDeleteWatchZone={handleDeleteWatchZone}
          onToggleWatchZoneNotifications={handleToggleWatchZoneNotifications}
          pickedLocation={pickedWatchZoneLocation}
          isPickingLocation={isPickingWatchZoneLocation}
          onStartPickingLocation={handleStartPickingWatchZoneLocation}
          onCancelPickingLocation={handleCancelPickingWatchZoneLocation}
          onPreviewChange={setWatchZonePreview}
        />
      )
    },
    'notifications': {
      title: 'Notifications',
      icon: BellIcon,
      content: (
        <NotificationsPanel
          notifications={notifications}
          unreadCount={unreadNotificationsCount}
          isLoading={isNotificationsLoading}
          error={notificationsError}
          watchZones={watchZones}
          onRefresh={loadNotifications}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onDeleteNotification={handleDeleteNotification}
          onDeleteAllNotifications={handleDeleteAllNotifications}
          onViewEvent={handleViewNotificationEvent}
        />
      )
    },
    statistics: {
      title: 'Statistics & History',
      icon: ChartBarIcon,
      content: <StatisticsPanel userLocation={userLocation} />
    },
    settings: {
      title: 'Settings',
      icon: AdjustmentsHorizontalIcon,
      content: (
        <SettingsPanel
          settings={mapSettings}
          onChange={setMapSettings}
          onReset={handleResetMapSettings}
          isAuthenticated={Boolean(user)}
        />
      )
    }
  };

  const currentPanel = activePanel ? panelConfig[activePanel] : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      <AppShell
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        unreadNotificationsCount={unreadNotificationsCount}
        panelTitle={currentPanel?.title}
        panelIcon={currentPanel?.icon}
        panelContent={currentPanel?.content}
      >
        <Map
          events={displayEvents}
          userLocation={userLocation}
          watchZones={watchZones}
          searchRadius={searchRadius}
          selectedEvent={selectedEvent}
          isSearchingNearby={isSearchingNearby}
          onSelectEvent={setSelectedEvent}
          mapSettings={mapSettings}
          isPickingWatchZoneLocation={isPickingWatchZoneLocation}
          onWatchZoneLocationSelect={handleWatchZoneLocationSelect}
          watchZonePreview={watchZonePreview}
        />
      </AppShell>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}