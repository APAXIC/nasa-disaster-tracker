import React, { useState, useEffect } from 'react';
import Map from './components/map/Map.jsx';
import AuthModal from './components/AuthModal';
import AppShell from './components/layout/AppShell';
import EventsPanel from './components/panels/EventsPanel';
import WatchZonesPanel from './components/panels/WatchZonesPanel.jsx';
import NotificationsPanel from './components/panels/NotificationsPanel';
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
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

export default function App() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(1500);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [activePanel, setActivePanel] = useState('events');

  const [user, setUser] = useState(null);
  const [watchZones, setWatchZones] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');

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
      console.log('[Watch Zones Loaded]:', zones);
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
    settings: {
      title: 'Settings',
      icon: AdjustmentsHorizontalIcon,
      content: (
        <p className="text-sm text-gray-400">
          Map settings will be implemented here.
        </p>
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
          events={events}
          userLocation={userLocation}
          watchZones={watchZones}
          searchRadius={searchRadius}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
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