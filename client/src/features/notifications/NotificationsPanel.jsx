import { useMemo, useState } from 'react';
import NotificationCard from './NotificationCard.jsx';



export default function NotificationsPanel({
                                             notifications = [],
                                             unreadCount = 0,
                                             watchZones = [],
                                             isLoading = false,
                                             error = '',
                                             onRefresh,
                                             onMarkAsRead,
                                             onMarkAllAsRead,
                                             onDeleteNotification,
                                             onDeleteAllNotifications,
                                             onViewEvent
                                           }) {
  const [filter, setFilter] = useState('all');
  const [selectedZoneId, setSelectedZoneId] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesReadFilter =
        filter === 'all' || !notification.is_read;

      const matchesZoneFilter =
        selectedZoneId === 'all'
          ? true
          : selectedZoneId === 'unassigned'
            ? notification.watch_zone_id == null
            : String(notification.watch_zone_id) === selectedZoneId;

      return matchesReadFilter && matchesZoneFilter;
    });
  }, [notifications, filter, selectedZoneId]);

  const filteredUnreadCount = useMemo(
    () => filteredNotifications.reduce(
      (count, notification) => count + (notification.is_read ? 0 : 1),
      0
    ),
    [filteredNotifications]
  );

  const handleMarkAsRead = async (notificationId) => {
    if (onMarkAsRead) {
      await onMarkAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (onMarkAllAsRead) {
      await onMarkAllAsRead();
    }
  };

  const handleDelete = async (notificationId) => {
    if (!onDeleteNotification) return;

    setDeletingId(notificationId);

    try {
      await onDeleteNotification(notificationId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!onDeleteAllNotifications || isDeletingAll) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete all notifications?'
    );

    if (!confirmed) return;

    setIsDeletingAll(true);

    try {
      await onDeleteAllNotifications();
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">
            Your saved disaster alerts
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {unreadCount} unread
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="notification-zone-filter"
          className="block text-xs font-medium text-gray-400"
        >
          Filter by watch zone
        </label>

        <select
          id="notification-zone-filter"
          value={selectedZoneId}
          onChange={(event) => setSelectedZoneId(event.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="all">All zones</option>
          <option value="unassigned">No watch zone</option>

          {watchZones.map((zone) => (
            <option key={zone.id} value={String(zone.id)}>
              {zone.name}
            </option>
          ))}
        </select>

        <p className="text-xs text-gray-500">
          {filteredNotifications.length} notifications · {filteredUnreadCount} unread
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={`rounded-lg px-3 py-2 text-sm ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setFilter('unread')}
            aria-pressed={filter === 'unread'}
            className={`rounded-lg px-3 py-2 text-sm ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Unread
          </button>
        </div>

        <button
          type="button"
          onClick={handleMarkAllAsRead}
          disabled={isLoading || unreadCount === 0}
          className="text-right text-xs text-blue-400 transition hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mark all as read
        </button>

        <button
          type="button"
          onClick={handleDeleteAll}
          disabled={
            isLoading ||
            isDeletingAll ||
            notifications.length === 0 ||
            !onDeleteAllNotifications
          }
          className="text-xs text-red-400 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isDeletingAll ? 'Deleting...' : 'Delete all'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {isLoading && notifications.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">
          Loading notifications...
        </p>
      )}

      {!isLoading && filteredNotifications.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-10 text-center">
          <p className="text-sm font-medium text-gray-200">
            {filter === 'unread'
              ? 'You are all caught up'
              : 'No notifications yet'}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            New alerts for your watch zones will appear here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onViewEvent={onViewEvent}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        ))}
      </div>
    </section>
  );
}