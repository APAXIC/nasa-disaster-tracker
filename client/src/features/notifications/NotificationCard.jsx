import { memo } from 'react';
import {
  CheckIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

function NotificationCard({ notification, onViewEvent, onMarkAsRead, onDelete, deletingId }) {
  const isRead = Boolean(notification.is_read);

  return (
    <article className={`notification-card ${isRead ? 'is-read' : 'is-unread'}`}>
      <span className={`notification-status-dot ${isRead ? 'is-read' : ''}`} aria-label={isRead ? 'Read' : 'Unread'} />
      <div className="notification-card-body">
        <div className="notification-card-heading">
          <h3 className="notification-card-title">{notification.title}</h3>
          {!isRead && <span className="notification-new-badge">New</span>}
        </div>
        <p className="notification-card-message">{notification.message}</p>
        {notification.watch_zone_name && (
          <p className="notification-card-zone">Watch zone: {notification.watch_zone_name}</p>
        )}
        <p className="notification-card-date">{formatDate(notification.created_at)}</p>
        <div className="notification-card-actions">
          {onViewEvent && (
            <button type="button" className="notification-card-button is-primary" onClick={() => onViewEvent(notification)}>
              <EyeIcon className="h-4 w-4 shrink-0" /> View event
            </button>
          )}
          {!isRead && onMarkAsRead && (
            <button type="button" className="notification-card-button" onClick={() => onMarkAsRead(notification.id)}>
              <CheckIcon className="h-4 w-4 shrink-0" /> Mark as read
            </button>
          )}
          <button type="button" className="notification-card-button is-danger" onClick={() => onDelete(notification.id)} disabled={deletingId === notification.id || !onDelete}>
            <TrashIcon className="h-4 w-4 shrink-0" /> {deletingId === notification.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default memo(NotificationCard);
