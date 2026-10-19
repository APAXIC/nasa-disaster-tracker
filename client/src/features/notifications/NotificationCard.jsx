import { memo } from 'react';

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

function NotificationCard({ notification, onViewEvent, onMarkAsRead, onDelete, deletingId }) {
  return (
          <article
            className={`rounded-xl border p-4 transition ${
              notification.is_read
                ? 'border-gray-800 bg-gray-900/40'
                : 'border-blue-900/70 bg-blue-950/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-label={
                  notification.is_read ? 'Read' : 'Unread'
                }
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  notification.is_read
                    ? 'bg-gray-600'
                    : 'bg-blue-400'
                }`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-100">
                    {notification.title}
                  </h3>

                  {!notification.is_read && (
                    <span className="rounded-full bg-blue-500/15 px-2 py-1 text-xs text-blue-300">
                      New
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-5 text-gray-300">
                  {notification.message}
                </p>

                {notification.watch_zone_name && (
                  <p className="mt-2 text-xs text-gray-400">
                    Watch zone: {notification.watch_zone_name}
                  </p>
                )}

                <p className="mt-2 text-xs text-gray-500">
                  {formatDate(notification.created_at)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {onViewEvent && (
                    <button
                      type="button"
                      onClick={() => onViewEvent(notification)}
                      className="text-xs text-blue-400 transition hover:text-blue-300"
                    >
                      View event
                    </button>
                  )}

                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={() => onMarkAsRead(notification.id)}
                      className="text-xs text-gray-300 hover:text-white"
                    >
                      Mark as read
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDelete(notification.id)}
                    disabled={
                      deletingId === notification.id ||
                      !onDelete
                    }
                    className="text-xs text-red-400 transition hover:text-red-300 disabled:opacity-50"
                  >
                    {deletingId === notification.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </article>
  );
}

export default memo(NotificationCard);
