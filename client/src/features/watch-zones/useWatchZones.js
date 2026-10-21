import { useState } from 'react';
import {
  fetchWatchZones, createWatchZone, updateWatchZone,
  deleteWatchZone, setWatchZoneNotifications
} from './api.js';

export default function useWatchZones(onNotificationsChanged, onError) {
  const [watchZones, setWatchZones] = useState([]);
  const [isPickingWatchZoneLocation, setIsPickingWatchZoneLocation] = useState(false);
  const [pickedWatchZoneLocation, setPickedWatchZoneLocation] = useState(null);
  const [watchZonePreview, setWatchZonePreview] = useState(null);

  const loadUserWatchZones = async () => {
    try {
      const zones = await fetchWatchZones();
      setWatchZones(zones.data || zones || []);
    } catch (err) {
      console.error('Failed to load watch zones:', err);
    }
  };

  const handleToggleWatchZoneNotifications = async (zoneId, isMuted) => {
    try {
      await setWatchZoneNotifications(zoneId, isMuted);
      await loadUserWatchZones();
      await onNotificationsChanged?.();
    } catch (error) {
      console.error('[Toggle Watch Zone Notifications Error]:', error);
      onError?.('Failed to update watch zone notification settings.');
    }
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
    await onNotificationsChanged?.();
  };

  const handleUpdateWatchZone = async (id, zoneData) => {
    await updateWatchZone(id, zoneData);
    await loadUserWatchZones();
    await onNotificationsChanged?.();
  };

  const handleDeleteWatchZone = async (id) => {
    await deleteWatchZone(id);
    await loadUserWatchZones();
    await onNotificationsChanged?.();
  };

  return {
    watchZones, setWatchZones, loadUserWatchZones,
    isPickingWatchZoneLocation, pickedWatchZoneLocation,
    watchZonePreview, setWatchZonePreview,
    handleToggleWatchZoneNotifications, handleStartPickingWatchZoneLocation,
    handleWatchZoneLocationSelect, handleCancelPickingWatchZoneLocation,
    handleCreateWatchZone, handleUpdateWatchZone, handleDeleteWatchZone
  };
}
