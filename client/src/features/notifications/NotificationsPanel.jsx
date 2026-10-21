import { useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
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

  const filteredNotifications = useMemo(() => notifications.filter((notification) => {
    const matchesReadFilter = filter === 'all' || !notification.is_read;
    const matchesZoneFilter = selectedZoneId === 'all'
      || (selectedZoneId === 'unassigned'
        ? notification.watch_zone_id == null
        : String(notification.watch_zone_id) === selectedZoneId);

    return matchesReadFilter && matchesZoneFilter;
  }), [notifications, filter, selectedZoneId]);

  const filteredUnreadCount = filteredNotifications.filter((notification) => !notification.is_read).length;

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
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    setIsDeletingAll(true);
    try {
      await onDeleteAllNotifications();
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <section className="notifications-panel">
      <div className="notifications-overview">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200">Your saved disaster alerts</p>
          <p className="mt-1 text-xs text-slate-400">{unreadCount} unread</p>
        </div>
        <button
          type="button"
          className="notification-action notification-refresh"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <ArrowPathIcon className={`h-4 w-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="notification-filter-block">
        <label htmlFor="notification-zone-filter" className="notification-label">
          Filter by watch zone
        </label>
        <div className="notification-select-wrap">
          <select
            id="notification-zone-filter"
            value={selectedZoneId}
            onChange={(event) => setSelectedZoneId(event.target.value)}
            className="notification-zone-select"
          >
            <option value="all">All zones</option>
            <option value="unassigned">No watch zone</option>
            {watchZones.map((zone) => (
              <option key={zone.id} value={String(zone.id)}>{zone.name}</option>
            ))}
          </select>
          <ChevronDownIcon aria-hidden="true" className="notification-select-chevron" />
        </div>
        <p className="notification-summary">
          {filteredNotifications.length} notifications · {filteredUnreadCount} unread
        </p>
      </div>

      <div className="notification-toolbar">
        <div className="notification-tabs" role="group" aria-label="Notification status">
          <button type="button" className={filter === 'all' ? 'is-active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
          <button type="button" className={filter === 'unread' ? 'is-active' : ''} aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Unread</button>
        </div>
        <div className="notification-bulk-actions">
          <button type="button" className="notification-action notification-mark-all" onClick={onMarkAllAsRead} disabled={isLoading || unreadCount === 0 || !onMarkAllAsRead}>
            <CheckCircleIcon className="h-4 w-4 shrink-0" />
            Mark all as read
          </button>
          <button type="button" className="notification-action notification-danger" onClick={handleDeleteAll} disabled={isLoading || isDeletingAll || notifications.length === 0 || !onDeleteAllNotifications}>
            <TrashIcon className="h-4 w-4 shrink-0" />
            {isDeletingAll ? 'Deleting...' : 'Delete all'}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="notification-error">{error}</div>}
      {isLoading && notifications.length === 0 && <p className="notification-empty">Loading notifications...</p>}
      {!isLoading && filteredNotifications.length === 0 && (
        <div className="notification-empty">
          <p className="font-semibold">{filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}</p>
          <p className="mt-2 text-xs text-slate-400">New alerts for your watch zones will appear here.</p>
        </div>
      )}

      <div className="notification-list">
        {filteredNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onViewEvent={onViewEvent}
            onMarkAsRead={onMarkAsRead}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        ))}
      </div>
    </section>
  );
}
