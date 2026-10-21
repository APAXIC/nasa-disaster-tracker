import { useEffect, useRef, useState } from 'react';
import { fetchAllEvents, fetchNearbyEvents } from './api.js';

export default function useEvents(userLocation) {
  const [events, setEvents] = useState([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const eventsRequestId = useRef(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchRadius, setSearchRadius] = useState(1500);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [displayEvents, setDisplayEvents] = useState([]);

  useEffect(() => {
    loadGlobalEvents();
  }, []);

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

  return {
    events, setEvents, isEventsLoading, selectedEvent, setSelectedEvent,
    searchRadius, setSearchRadius, isSearchingNearby, setIsSearchingNearby,
    displayEvents, setDisplayEvents, loadGlobalEvents
  };
}
