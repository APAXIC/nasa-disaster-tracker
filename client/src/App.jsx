import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import NavigationOverlay from './components/NavigationOverlay';
import AuthModal from './components/AuthModal';
import {
  fetchAllEvents,
  fetchNearbyEvents,
  fetchCurrentUser,
  fetchWatchZones,
  logoutUser,
  createWatchZone,
  updateWatchZone,
  deleteWatchZone
} from './services/api';

export default function App() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(1500);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);

  const [user, setUser] = useState(null);
  const [watchZones, setWatchZones] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    loadGlobalEvents();
    checkAuthSession();
  }, []);

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

  const handleCreateWatchZone = async (zoneData) => {
    await createWatchZone(zoneData);
    await loadUserWatchZones();
  };

  const handleUpdateWatchZone = async (id, zoneData) => {
    await updateWatchZone(id, zoneData);
    await loadUserWatchZones();
  };

  const handleDeleteWatchZone = async (id) => {
    await deleteWatchZone(id);
    await loadUserWatchZones();
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      <Map
        events={events}
        userLocation={userLocation}
        watchZones={watchZones}
        searchRadius={searchRadius}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
      />

      <NavigationOverlay
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
        onLocateUser={handleLocateUser}
        onResetSearch={loadGlobalEvents}
        isSearchingNearby={isSearchingNearby}
        searchRadius={searchRadius}
        setSearchRadius={setSearchRadius}
        unreadNotificationsCount={unreadNotificationsCount}
        user={user}
        watchZones={watchZones}
        onLogout={handleLogout}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onCreateWatchZone={handleCreateWatchZone}
        onUpdateWatchZone={handleUpdateWatchZone}
        onDeleteWatchZone={handleDeleteWatchZone}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}