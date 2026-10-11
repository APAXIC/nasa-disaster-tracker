import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import { fetchAllEvents, fetchNearbyEvents } from './services/api';

export default function App() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(1500);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);

  useEffect(() => {
    loadGlobalEvents();
  }, []);

  const loadGlobalEvents = async () => {
    try {
      const result = await fetchAllEvents();
      setEvents(result.data || []);
      setIsSearchingNearby(false);
      setUserLocation(null);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setUserLocation({ lat, lng });
        setIsSearchingNearby(true);

        try {
          const result = await fetchNearbyEvents(lat, lng, searchRadius);
          setEvents(result.data || []);
        } catch (err) {
          console.error('Failed to fetch nearby events:', err);
        }
      },
      () => alert('Unable to retrieve your location.')
    );
  };

  return (
    <div className="app-container">
      <Sidebar
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
        onLocateUser={handleLocateUser}
        onResetSearch={loadGlobalEvents}
        isSearchingNearby={isSearchingNearby}
        searchRadius={searchRadius}
        setSearchRadius={setSearchRadius}
      />
      <div className="map-container">
        <Map
          events={events}
          userLocation={userLocation}
          searchRadius={searchRadius}
          onSelectEvent={setSelectedEvent}
        />
      </div>
    </div>
  );
}