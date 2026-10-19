import { memo } from 'react';
import { MapPinIcon, PencilSquareIcon, TrashIcon, BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';

function WatchZoneCard({ zone, onEdit, onDelete, onToggleNotifications, isSubmitting, deletingZoneId, togglingZoneId }) {
  return (
    <article
              key={zone.id}
              className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 transition hover:border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <MapPinIcon className="h-5 w-5 text-orange-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="break-words text-sm font-semibold text-gray-100">
                    {zone.name}
                  </h4>
                  <p className="mt-1 text-xs text-gray-400">
                    {zone.radius_km} km radius
                  </p>
                  <p className="mt-1 break-words text-xs text-gray-500">
                    {Number(zone.latitude).toFixed(4)},{' '}
                    {Number(zone.longitude).toFixed(4)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(zone)}
                    disabled={isSubmitting || deletingZoneId === zone.id}
                    title="Edit watch zone"
                    aria-label={`Edit ${zone.name}`}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-blue-400 disabled:opacity-50"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(zone)}
                    disabled={deletingZoneId === zone.id || isSubmitting}
                    title="Delete watch zone"
                    aria-label={`Delete ${zone.name}`}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-red-400 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-800 pt-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-200">
                      Zone notifications
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {zone.is_muted
                        ? 'Notifications are muted'
                        : 'Notifications are enabled'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleNotifications(zone)}
                    disabled={
                      togglingZoneId !== null ||
                      isSubmitting ||
                      deletingZoneId === zone.id
                    }
                    aria-pressed={!zone.is_muted}
                    aria-label={
                      zone.is_muted
                        ? `Enable notifications for ${zone.name}`
                        : `Mute notifications for ${zone.name}`
                    }
                    className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      zone.is_muted
                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                        : 'border-green-800 bg-green-950/30 text-green-300 hover:bg-green-950/60'
                    }`}
                  >
                    {zone.is_muted ? (
                      <BellSlashIcon className="h-4 w-4" />
                    ) : (
                      <BellIcon className="h-4 w-4" />
                    )}

                    {togglingZoneId === zone.id
                      ? 'Saving...'
                      : zone.is_muted
                        ? 'Enable'
                        : 'Mute'}
                  </button>
                </div>
              </div>

              {deletingZoneId === zone.id && (
                <p className="mt-2 text-xs text-gray-500">Deleting...</p>
              )}
    </article>
  );
}

export default memo(WatchZoneCard);
