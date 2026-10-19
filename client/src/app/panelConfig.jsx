import { lazy } from 'react';
import {
  AdjustmentsHorizontalIcon,
  BellIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const EventsPanel = lazy(() => import('../features/events/EventsPanel.jsx'));
const WatchZonesPanel = lazy(() => import('../features/watch-zones/WatchZonesPanel.jsx'));
const NotificationsPanel = lazy(() => import('../features/notifications/NotificationsPanel.jsx'));
const SettingsPanel = lazy(() => import('../features/settings/SettingsPanel.jsx'));
const StatisticsPanel = lazy(() => import('../features/statistics/StatisticsPanel.jsx'));

export function createPanelConfig(controller) {
  const {
    events,
    selectedEvent,
    setSelectedEvent,
    userLocation,
    searchRadius,
    setSearchRadius,
    isSearchingNearby,
    mapSettings,
    setMapSettings,
    user,
    watchZones,
    unreadNotificationsCount,
    notifications,
    isNotificationsLoading,
    notificationsError,
    setDisplayEvents,
    pickedWatchZoneLocation,
    isPickingWatchZoneLocation,
    setWatchZonePreview,
    handleLocateUser,
    loadGlobalEvents,
    loadNotifications,
    handleMarkNotificationAsRead,
    handleMarkAllNotificationsAsRead,
    handleDeleteNotification,
    handleDeleteAllNotifications,
    handleViewNotificationEvent,
    handleToggleWatchZoneNotifications,
    handleStartPickingWatchZoneLocation,
    handleWatchZoneLocationSelect,
    handleCancelPickingWatchZoneLocation,
    handleCreateWatchZone,
    handleUpdateWatchZone,
    handleDeleteWatchZone,
    handleResetMapSettings
  } = controller;

  return {
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
    notifications: {
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
}
