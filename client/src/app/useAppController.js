import { useEffect, useState } from 'react';
import { fetchAllEvents } from '../features/events/api.js';
import useEvents from '../features/events/useEvents.js';
import useGeolocation from '../features/map/useGeolocation.js';
import useAuth from '../features/auth/useAuth.js';
import useWatchZones from '../features/watch-zones/useWatchZones.js';
import useNotifications from '../features/notifications/useNotifications.js';
import useMapSettings from '../features/settings/useMapSettings.js';

export default function useAppController() {
  const [activePanel, setActivePanel] = useState('events');
  const { mapSettings, setMapSettings, handleResetMapSettings } = useMapSettings();
  const [nearbyEnabled, setNearbyEnabled] = useState(false);
  const { userLocation, handleLocateUser: locateUser } = useGeolocation(
    mapSettings.showUserLocation, nearbyEnabled
  );
  const eventState = useEvents(userLocation);
  const authState = useAuth();
  const notifications = useNotifications(authState.user);
  const watchZones = useWatchZones(
    notifications.loadNotifications,
    notifications.setNotificationsError
  );

  useEffect(() => {
    if (authState.user) {
      watchZones.loadUserWatchZones();
    } else {
      watchZones.setWatchZones([]);
    }
  }, [authState.user]);

  const handleLocateUser = () => locateUser(() => {
    eventState.setIsSearchingNearby(true);
    setNearbyEnabled(true);
  });

  const loadGlobalEvents = async () => {
    setNearbyEnabled(false);
    await eventState.loadGlobalEvents();
  };

  const handleViewNotificationEvent = async (notification) => {
    const matchesNotification = (event) =>
      (notification.event_id != null &&
        String(event.id) === String(notification.event_id)) ||
      (notification.nasa_id != null &&
        String(event.nasa_id) === String(notification.nasa_id));

    try {
      let matchingEvent = eventState.events.find(matchesNotification);
      if (!matchingEvent) {
        const result = await fetchAllEvents();
        const allEvents = result.data || [];
        eventState.setEvents(allEvents);
        eventState.setIsSearchingNearby(false);
        setNearbyEnabled(false);
        matchingEvent = allEvents.find(matchesNotification);
      }
      if (!matchingEvent) {
        notifications.setNotificationsError(
          'The event associated with this notification could not be found.'
        );
        return;
      }
      eventState.setSelectedEvent(matchingEvent);
      setActivePanel('events');
      notifications.setNotificationsError('');
    } catch (error) {
      console.error('[Open Notification Event Error]:', error);
      notifications.setNotificationsError('Failed to open the event.');
    }
  };

  return {
    ...eventState,
    ...notifications,
    ...watchZones,
    ...authState,
    mapSettings, setMapSettings, handleResetMapSettings,
    userLocation, activePanel, setActivePanel,
    handleLocateUser, loadGlobalEvents, handleViewNotificationEvent
  };
}
